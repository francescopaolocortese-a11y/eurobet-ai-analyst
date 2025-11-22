import { Match, MatchStats } from '../types';

// API Key from environment variables
export const API_KEY = process.env.FOOTBALL_API_KEY || ''; 

const BASE_URL = 'https://v3.football.api-sports.io';

const HEADERS = {
  'x-rapidapi-host': 'v3.football.api-sports.io',
  'x-rapidapi-key': API_KEY
};

export const isApiConfigured = () => API_KEY.length > 0;

export const getFixtures = async (live: boolean = false): Promise<Match[]> => {
  if (!isApiConfigured()) return [];

  try {
    const endpoint = live ? '/fixtures?live=all' : `/fixtures?date=${new Date().toISOString().split('T')[0]}`;
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers: HEADERS });
    const data = await response.json();

    if (!data.response) return [];

    // Filter mainly for major European leagues to avoid clutter (optional, remove filter for all)
    const priorityLeagues = [
        "Serie A", "Premier League", "La Liga", "Bundesliga", "Ligue 1", 
        "UEFA Champions League", "UEFA Europa League", "Coppa Italia", "Super Cup", "Serie B"
    ];

    return data.response
      .filter((item: any) => {
          if (live) return true; // Show all live matches
          const leagueName = item.league.name;
          // Check priority leagues
          return priorityLeagues.includes(leagueName) || item.league.id === 135 || item.league.id === 136; 
      })
      .map((item: any) => ({
        id: String(item.fixture.id),
        league: item.league.name,
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        // Force Rome timezone as requested
        time: new Date(item.fixture.date).toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit', 
            timeZone: 'Europe/Rome' 
        }),
        status: item.fixture.status.short === 'FT' ? 'finished' : (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(item.fixture.status.short) ? 'live' : 'scheduled'),
        homeScore: item.goals.home,
        awayScore: item.goals.away,
        minute: String(item.fixture.status.elapsed)
      }))
      .sort((a: Match, b: Match) => a.time.localeCompare(b.time));
  } catch (error) {
    console.error("Football API Error:", error);
    return [];
  }
};

export const getMatchStatistics = async (fixtureId: string): Promise<MatchStats | undefined> => {
  if (!isApiConfigured()) return undefined;

  try {
    const response = await fetch(`${BASE_URL}/fixtures/statistics?fixture=${fixtureId}`, { headers: HEADERS });
    const data = await response.json();

    if (!data.response || data.response.length < 2) return undefined;

    const mapStats = (statsArr: any[]) => {
      const getVal = (type: string) => {
        const item = statsArr.find(s => s.type === type);
        // Handle cases where value might be null or string or percentage
        if (!item || item.value === null) return 0;
        
        let val = item.value;
        if (typeof val === 'string') {
             // Handle "50%" strings
             if (val.includes('%')) {
                 val = val.replace('%', '');
             }
             return parseInt(val);
        }
        return val;
      };

      return {
        possession: getVal('Ball Possession'),
        shotsOnTarget: getVal('Shots on Goal'),
        shotsOffTarget: getVal('Shots off Goal'),
        corners: getVal('Corner Kicks'),
        fouls: getVal('Fouls'),
        yellowCards: getVal('Yellow Cards'),
        redCards: getVal('Red Cards')
      };
    };

    return {
      home: mapStats(data.response[0].statistics),
      away: mapStats(data.response[1].statistics)
    };
  } catch (error) {
    console.error("Stats API Error:", error);
    return undefined;
  }
};