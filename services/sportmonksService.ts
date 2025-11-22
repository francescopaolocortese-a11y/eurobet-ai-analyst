import { Match, MatchStats } from '../types';

export const API_TOKEN = import.meta.env.VITE_SPORTMONKS_API_TOKEN || process.env.SPORTMONKS_API_TOKEN || ''; 
const BASE_URL = 'https://api.sportmonks.com/v3/football';

export const isApiConfigured = () => API_TOKEN.length > 0;

// Helper to format date YYYY-MM-DD
const getFormattedDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

export const getFixtures = async (live: boolean = false): Promise<Match[]> => {
  if (!isApiConfigured()) return [];

  try {
    const endpoint = live ? 'livescores' : `fixtures/date/${getFormattedDate(new Date())}`;
    
    // Include participants (teams), league+country, scores, state (status), and STATISTICS (for xG)
    // IMPORTANT: 'league.country' is needed to filter by region
    const includes = 'participants;league.country;scores;state;statistics';
    
    const response = await fetch(`${BASE_URL}/${endpoint}?api_token=${API_TOKEN}&include=${includes}`);
    const data = await response.json();

    if (!data.data) return [];

    // Comprehensive list of European countries to filter by
    const europeanCountries = [
        "Italy", "England", "Spain", "Germany", "France", "Netherlands", "Portugal",
        "Belgium", "Scotland", "Turkey", "Austria", "Switzerland", "Greece",
        "Denmark", "Sweden", "Norway", "Poland", "Czech Republic", "Croatia",
        "Romania", "Serbia", "Ukraine", "Hungary", "Finland", "Ireland", "Slovakia",
        "Bulgaria", "Slovenia", "Iceland", "Wales", "Northern Ireland", "Cyprus"
    ];

    // Priority Competitions (International) to always include
    const internationalCompetitions = [
        "UEFA Champions League", "UEFA Europa League", "UEFA Conference League", 
        "UEFA Super Cup", "Euro Championship", "World Cup", "UEFA Nations League"
    ];

    return data.data
      .filter((item: any) => {
          if (live) return true; // Show all live matches regardless of league

          const countryName = item.league?.country?.name;
          const leagueName = item.league?.name;

          // Include if it's a European country OR an international/European competition
          const isEuropean = countryName && europeanCountries.includes(countryName);
          const isInternational = leagueName && internationalCompetitions.some(c => leagueName.includes(c));

          return isEuropean || isInternational;
      })
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
    const response = await fetch(`${BASE_URL}/fixtures/${fixtureId}?api_token=${API_TOKEN}&include=statistics;participants`);
    const data = await response.json();

    if (!data.data || !data.data.statistics || data.data.statistics.length === 0) return undefined;

    const participants = data.data.participants;
    const homeId = participants.find((p: any) => p.meta.location === 'home')?.id;
    const awayId = participants.find((p: any) => p.meta.location === 'away')?.id;

    const getStat = (teamId: number, typeName: string) => {
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
      }
    };
  } catch (error) {
    console.error("Sportmonks Stats API Error:", error);
    return undefined;
  }
};