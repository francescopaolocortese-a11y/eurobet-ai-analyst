export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  league: string;
  time: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  minute?: string;
  homeXg?: number;
  awayXg?: number;
}

export interface TeamStats {
  possession: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  expectedGoals?: number;
}

export interface MatchStats {
  home: TeamStats;
  away: TeamStats;
}

export interface AnalysisData {
  matchId: string;
  summary: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  prediction: string;
  bestBet: string;
  confidence: number;
  currentScore: string;
  groundingUrls: Array<{
    title: string;
    uri: string;
  }>;
  isLive: boolean;
  stats?: MatchStats;
}

export interface BetSession {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  selection: string;
  stake: string;
  odds: string;
  outcome: 'pending' | 'won' | 'lost' | 'void';
}

export enum Tab {
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  ANALYSIS = 'ANALYSIS'
}