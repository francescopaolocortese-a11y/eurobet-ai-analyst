import { Match, MatchStats, NativePrediction, NativeOdds } from '../types';

// Use serverless function to bypass CORS
const API_BASE = '/api/sportmonks';

export const isApiConfigured = () => true; // Always true since serverless function handles the API token

// Helper to format date YYYY-MM-DD
const getFormattedDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

export const getFixtures = async (live: boolean = false): Promise<Match[]> => {
  if (!isApiConfigured()) return [];

  try {
    // DEBUG: First, discover all available leagues with their IDs
    console.log('🔍 Fetching all available leagues...');

    try {
      const leaguesResponse = await fetch(`${API_BASE}?endpoint=leagues&includes=country`);
      console.log('Leagues response status:', leaguesResponse.status);

      if (!leaguesResponse.ok) {
        const errorText = await leaguesResponse.text();
        console.error('❌ Leagues API error:', errorText);
      } else {
        const leaguesData = await leaguesResponse.json();

        if (leaguesData.data && Array.isArray(leaguesData.data)) {
          // Filter for important European leagues
          const importantLeagues = leaguesData.data.filter((league: any) => {
            const name = league.name || '';
            return ['Serie A', 'Premier League', 'La Liga', 'Bundesliga', 'Ligue 1', 'Champions League', 'Europa League', 'Conference League', 'Eredivisie', 'Liga Portugal', 'Championship']
              .some(keyword => name.includes(keyword));
          });

          console.log('🏆 IMPORTANT LEAGUES WITH IDS:');
          importantLeagues.forEach((l: any) => {
            console.log(`   - ID: ${l.id} | ${l.name} (${l.country?.name || 'N/A'})`);
          });
          console.log(`📊 Total leagues available: ${leaguesData.data.length}`);
        }
      }
    } catch (leagueError) {
      console.error('⚠️ Failed to fetch leagues (continuing anyway):', leagueError);
    }

    // Now fetch fixtures
    let endpoint;
    if (live) {
      endpoint = 'livescores';
    } else {
      const today = getFormattedDate(new Date());
      endpoint = `fixtures/date/${today}`;
    }

    // Include participants (teams), league+country, scores, state (status), and STATISTICS (for xG)
    const includes = 'participants;league.country;scores;state;statistics';

    console.log(`📡 Fetching fixtures from: ${endpoint}`);
    const response = await fetch(`${API_BASE}?endpoint=${endpoint}&includes=${includes}`);
    console.log('Fixtures response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Fixtures API error:', errorText);
      return [];
    }

    const data = await response.json();

    if (!data.data) {
      console.log('❌ No fixture data received from API');
      return [];
    }

    console.log(`📅 Total fixtures received: ${data.data.length}`);

    // DEBUG: Log all unique leagues and countries in the fixtures
    const uniqueLeagues = new Map<string, { count: number; country: string; id?: number }>();
    data.data.forEach((item: any) => {
      const leagueName = item.league?.name || 'Unknown';
      const country = item.league?.country?.name || 'N/A';
      const leagueId = item.league_id;

      if (uniqueLeagues.has(leagueName)) {
        uniqueLeagues.get(leagueName)!.count++;
      } else {
        uniqueLeagues.set(leagueName, { count: 1, country, id: leagueId });
      }
    });

    console.log('📋 LEAGUES IN TODAY\'S FIXTURES:');
    Array.from(uniqueLeagues.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([name, info]) => {
        console.log(`   - ${name} (${info.country}): ${info.count} matches [ID: ${info.id}]`);
      });

    // TEMPORARILY: Show all matches to debug
    const filtered = data.data;

    return filtered
      .map((item: any) => {
        // Find home and away teams from participants array
        const homeParticipant = item.participants.find((p: any) => p.meta.location === 'home');
        const awayParticipant = item.participants.find((p: any) => p.meta.location === 'away');

        // Find current score
        const homeScoreObj = item.scores?.find((s: any) => s.score?.participant === 'home' && s.description === 'CURRENT')
                          || item.scores?.find((s: any) => s.participant_id === homeParticipant?.id && (s.description === 'CURRENT' || s.description === '2ND_HALF' || s.description === '1ST_HALF'));

        const awayScoreObj = item.scores?.find((s: any) => s.score?.participant === 'away' && s.description === 'CURRENT')
                          || item.scores?.find((s: any) => s.participant_id === awayParticipant?.id && (s.description === 'CURRENT' || s.description === '2ND_HALF' || s.description === '1ST_HALF'));

        const homeScore = homeScoreObj ? homeScoreObj.score.goals : (item.scores?.length > 0 ? item.scores[0].score.goals : 0);
        const awayScore = awayScoreObj ? awayScoreObj.score.goals : (item.scores?.length > 0 ? item.scores[1]?.score.goals : 0);

        let status: 'scheduled' | 'live' | 'finished' = 'scheduled';
        const stateName = item.state?.state;
        if (stateName === 'FT' || stateName === 'AET' || stateName === 'FT_PEN') status = 'finished';
        else if (['LIVE', 'HT', 'ET', 'PEN_LIVE', 'BREAK'].includes(item.state?.short_name) || stateName === 'INPLAY_1ST_HALF' || stateName === 'INPLAY_2ND_HALF') status = 'live';

        // Parse xG if available
        let homeXg = undefined;
        let awayXg = undefined;

        if (item.statistics && item.statistics.length > 0 && homeParticipant && awayParticipant) {
            const findXg = (teamId: number) => {
                const stat = item.statistics.find((s: any) =>
                   s.participant_id === teamId &&
                   (s.type?.name === 'Expected Goals' || s.type?.name === 'xG' || s.type === 'Expected Goals')
                );
                const val = stat?.data?.value ?? stat?.value;
                return val !== undefined ? parseFloat(val) : undefined;
            }
            homeXg = findXg(homeParticipant.id);
            awayXg = findXg(awayParticipant.id);
        }

        const matchTime = new Date(item.starting_at).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Rome'
        });

        return {
            id: String(item.id),
            league: item.league?.name || 'Unknown',
            homeTeam: homeParticipant?.name || 'Home Team',
            awayTeam: awayParticipant?.name || 'Away Team',
            homeTeamLogo: homeParticipant?.image_path,
            awayTeamLogo: awayParticipant?.image_path,
            time: matchTime,
            status: status,
            homeScore: status !== 'scheduled' ? homeScore : undefined,
            awayScore: status !== 'scheduled' ? awayScore : undefined,
            minute: status === 'live' ? 'Live' : undefined,
            homeXg,
            awayXg
        };
      })
      .sort((a: Match, b: Match) => a.time.localeCompare(b.time));
  } catch (error) {
    console.error("Sportmonks API Error:", error);
    return [];
  }
};

export const getMatchStatistics = async (fixtureId: string): Promise<MatchStats | undefined> => {
  if (!isApiConfigured()) return undefined;

  try {
    // UPDATED: Include predictions and odds for the native components
    const response = await fetch(`${API_BASE}?endpoint=fixtures/${fixtureId}&includes=statistics;participants;predictions;odds`);
    const data = await response.json();

    if (!data.data) return undefined;

    const participants = data.data.participants || [];
    const homeId = participants.find((p: any) => p.meta.location === 'home')?.id;
    const awayId = participants.find((p: any) => p.meta.location === 'away')?.id;

    const getStat = (teamId: number, typeName: string) => {
        if (!data.data.statistics) return 0;
        const statObj = data.data.statistics.find((s: any) =>
            s.participant_id === teamId &&
            s.type?.name?.toLowerCase() === typeName.toLowerCase()
        );
        if (!statObj) {
             const fallback = data.data.statistics.find((s: any) =>
                s.participant_id === teamId &&
                s.type === typeName
             );
             return fallback ? (fallback.data?.value || fallback.value || 0) : 0;
        }
        return statObj.data?.value || statObj.value || 0;
    };

    const getXG = (teamId: number) => {
         const val = getStat(teamId, "Expected Goals");
         return typeof val === 'number' ? val : parseFloat(val);
    };

    // PARSE PREDICTIONS (NATIVE COMPONENT)
    const predictions: NativePrediction[] = [];
    if (data.data.predictions && Array.isArray(data.data.predictions)) {
        data.data.predictions.forEach((p: any) => {
             // Map standard 1X2 or BTTS predictions
             // Structure varies, simplifying mapping
             if (p.predictions) {
                 // Try to map predictions object
                 if (p.predictions.true) predictions.push({ market: p.type?.name || 'General', selection: 'Yes', probability: parseFloat(p.predictions.true) });
                 if (p.predictions.false) predictions.push({ market: p.type?.name || 'General', selection: 'No', probability: parseFloat(p.predictions.false) });

                 // If simple probability model
                 if (p.probability) predictions.push({ market: p.type?.name || 'Prediction', selection: p.selection || 'Outcome', probability: parseFloat(p.probability) });
             }
        });

        // If predictions are flattened
        if (predictions.length === 0) {
             data.data.predictions.forEach((p: any) => {
                 if (p.probability) {
                      predictions.push({
                          market: p.type?.name || 'Bet',
                          selection: p.prediction || 'Outcome',
                          probability: parseFloat(p.probability)
                      });
                 }
             });
        }
    }

    // PARSE ODDS (NATIVE COMPONENT)
    const odds: NativeOdds[] = [];
    if (data.data.odds && Array.isArray(data.data.odds)) {
        // Find 1X2 Market (usually id 1)
        const matchWinner = data.data.odds.find((o: any) => o.market_id === 1 || o.name === '3Way Result');
        if (matchWinner && matchWinner.bookmakers && matchWinner.bookmakers.length > 0) {
            // Take average from first available bookie for simplicity
             const bookie = matchWinner.bookmakers[0];
             if (bookie.odds) {
                 bookie.odds.forEach((o: any) => {
                     odds.push({ market: '1X2', label: o.label, value: parseFloat(o.value) });
                 });
             }
        }
    }

    return {
      home: {
        possession: getStat(homeId, "Ball Possession") || 50,
        shotsOnTarget: getStat(homeId, "Shots on Target"),
        shotsOffTarget: getStat(homeId, "Shots off Target"),
        corners: getStat(homeId, "Corners"),
        fouls: getStat(homeId, "Fouls"),
        yellowCards: getStat(homeId, "Yellow Cards"),
        redCards: getStat(homeId, "Red Cards"),
        expectedGoals: getXG(homeId)
      },
      away: {
        possession: getStat(awayId, "Ball Possession") || 50,
        shotsOnTarget: getStat(awayId, "Shots on Target"),
        shotsOffTarget: getStat(awayId, "Shots off Target"),
        corners: getStat(awayId, "Corners"),
        fouls: getStat(awayId, "Fouls"),
        yellowCards: getStat(awayId, "Yellow Cards"),
        redCards: getStat(awayId, "Red Cards"),
        expectedGoals: getXG(awayId)
      },
      predictions,
      odds
    };
  } catch (error) {
    console.error("Sportmonks Stats API Error:", error);
    return undefined;
  }
};
