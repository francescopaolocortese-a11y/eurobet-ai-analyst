import React, { useState, useEffect, useMemo } from 'react';
import { Match, AnalysisData, BetSession } from './types';
import { analyzeMatch } from './services/geminiService';
import { getFixtures, isApiConfigured, getMatchStatistics } from './services/sportmonksService';
import { MatchCard } from './components/MatchCard';
import { AnalysisView } from './components/AnalysisView';
import { BetHistoryView } from './components/BetHistoryView';
import { 
  LayoutDashboard, 
  Radio, 
  Search, 
  Menu, 
  X, 
  Github,
  Zap,
  History,
  Filter,
  Flame,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<'UPCOMING' | 'LIVE'>('UPCOMING');
  const [currentView, setCurrentView] = useState<'MATCH' | 'HISTORY'>('MATCH');
  const [selectedLeague, setSelectedLeague] = useState<string>('TOP_OVER_15');
  const [connectionStatus, setConnectionStatus] = useState<'API' | 'DEMO'>('DEMO');
  
  const [bets, setBets] = useState<Record<string, BetSession>>({});

  useEffect(() => {
    loadMatches();
    if (mode === 'UPCOMING') setSelectedLeague('TOP_OVER_15');
    else setSelectedLeague('ALL');
  }, [mode]);

  const loadMatches = async () => {
    setMatchesLoading(true);
    setMatches([]);

    let data: Match[] = [];

    // Use ONLY Sportmonks API
    try {
        data = await getFixtures(mode === 'LIVE');
        if (data.length > 0) {
          setConnectionStatus('API');
          console.log(`Loaded ${data.length} matches from Sportmonks API`);
        } else {
          setConnectionStatus('API');
          console.log("API returned 0 matches for this filter.");
        }
    } catch (e) {
        console.error("Sportmonks API Error:", e);
        setConnectionStatus('DEMO');
    }

    setMatches(data);
    setMatchesLoading(false);
  };

  const handleMatchSelect = async (match: Match) => {
    setCurrentView('MATCH');
    setSelectedMatch(match);
    setSidebarOpen(false); 
    setAnalysis(null);
    setAnalysisLoading(true);
    
    try {
      // If we have a real ID (numeric from API), try to get stats
      const isRealApiId = !match.id.startsWith('match-');
      let stats = undefined;

      if (isRealApiId && isApiConfigured()) {
          stats = await getMatchStatistics(match.id);
      }

      const result = await analyzeMatch(match, mode === 'LIVE', stats);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSaveBet = (bet: BetSession) => {
    setBets(prev => ({
        ...prev,
        [bet.matchId]: bet
    }));
  };

  // Derived state for filtering
  const uniqueLeagues = useMemo(() => {
    const leagues = new Set(matches.map(m => m.league));
    return Array.from(leagues).sort();
  }, [matches]);

  // Logic to calculate potential for Over 1.5 Goals
  const calculateOverPotential = (match: Match): number => {
      let score = 0;
      const league = match.league.toLowerCase();
      const home = match.homeTeam.toLowerCase();
      const away = match.awayTeam.toLowerCase();

      // 1. League Weights
      if (league.includes('bundesliga')) score += 25;
      if (league.includes('eredivisie')) score += 25;
      if (league.includes('serie a')) score += 20;
      if (league.includes('premier league')) score += 20;
      if (league.includes('champions league')) score += 22;
      if (league.includes('swiss')) score += 20;
      if (league.includes('belgium')) score += 18;

      // 2. Team Weights
      const offensiveTeams = [
          'bayern', 'leverkusen', 'dortmund', 'leipzig',
          'psv', 'feyenoord', 'ajax',
          'man city', 'liverpool', 'arsenal', 'tottenham',
          'real madrid', 'barcelona', 'girona',
          'inter', 'atalanta', 'napoli', 'milan',
          'psg', 'monaco'
      ];

      if (offensiveTeams.some(t => home.includes(t))) score += 15;
      if (offensiveTeams.some(t => away.includes(t))) score += 15;

      // 3. Live Stats
      if (match.status === 'live') {
          if ((match.homeXg || 0) + (match.awayXg || 0) > 1.5) score += 30;
          const totalGoals = (match.homeScore || 0) + (match.awayScore || 0);
          if (totalGoals >= 1) score += 10;
      }

      return score;
  };

  const filteredMatches = useMemo(() => {
    if (selectedLeague === 'ALL') return matches;
    
    if (selectedLeague === 'TOP_OVER_15') {
        // Sort by Over Potential and take top 15
        return [...matches]
            .map(m => ({ ...m, _score: calculateOverPotential(m) }))
            .sort((a, b) => b._score - a._score)
            .slice(0, 15);
    }

    return matches.filter(m => m.league === selectedLeague);
  }, [matches, selectedLeague]);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden selection:bg-emerald-500/30">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-white" fill="currentColor" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">EuroBet AI</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-zinc-400">
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 w-full sm:w-80 bg-zinc-950 border-r border-zinc-800 transform transition-transform duration-300 z-40 lg:relative lg:transform-none flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        pt-16 lg:pt-0
      `}>
        <div className="p-4 hidden lg:flex items-center gap-2 font-bold text-xl tracking-tighter mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-white" fill="currentColor" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">EuroBet AI</span>
        </div>

        <div className="px-4 pb-4 space-y-3">
            {/* Status Indicator */}
            <div className={`flex items-center gap-2 text-[10px] font-medium px-3 py-2 rounded-lg border ${connectionStatus === 'API' ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-500' : 'bg-orange-950/30 border-orange-900/50 text-orange-500'}`}>
                {connectionStatus === 'API' ? <Wifi size={12} /> : <WifiOff size={12} />}
                {connectionStatus === 'API' ? 'Dati Sportmonks Attivi' : 'Modalità Demo (API Error)'}
            </div>

            {/* Mode Toggle */}
            <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800">
                <button 
                    onClick={() => setMode('UPCOMING')}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'UPCOMING' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <LayoutDashboard size={14} /> Pre-Match
                </button>
                <button 
                    onClick={() => setMode('LIVE')}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'LIVE' ? 'bg-zinc-800 text-red-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Radio size={14} className={mode === 'LIVE' ? "animate-pulse" : ""} /> Live
                </button>
            </div>
            
            {/* League Filter */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <Filter size={14} />
                </div>
                <select 
                    value={selectedLeague}
                    onChange={(e) => setSelectedLeague(e.target.value)}
                    className="w-full appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg py-2.5 pl-9 pr-3 focus:border-emerald-500 focus:outline-none transition-colors cursor-pointer"
                    disabled={matchesLoading || matches.length === 0}
                >
                    <option value="TOP_OVER_15">🔥 Top Probabilità Over 1.5</option>
                    <option value="ALL">Tutti i Campionati</option>
                    {uniqueLeagues.map(league => (
                        <option key={league} value={league}>{league}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
            </div>

            {/* History Button */}
            <button 
                onClick={() => { setCurrentView('HISTORY'); setSidebarOpen(false); }}
                className={`w-full py-2 px-3 text-xs font-medium rounded-lg border transition-all flex items-center gap-2 ${currentView === 'HISTORY' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
            >
                <History size={14} /> Storico Giocate ({Object.keys(bets).length})
            </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar pb-20 lg:pb-4">
          {matchesLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-zinc-900/50 animate-pulse border border-zinc-800" />
            ))
          ) : (
            filteredMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                selected={currentView === 'MATCH' && selectedMatch?.id === match.id} 
                onClick={handleMatchSelect} 
              />
            ))
          )}
          
          {!matchesLoading && filteredMatches.length === 0 && (
             <div className="text-center py-8 text-zinc-500 text-xs bg-zinc-900/20 rounded-lg border border-zinc-800/50 border-dashed">
                 {matches.length === 0 ? "Nessuna partita trovata." : "Nessuna partita per questo filtro."}
             </div>
          )}
        </div>
        
        <div className="p-4 border-t border-zinc-800 text-xs text-zinc-600 flex justify-between items-center bg-zinc-950">
           <span>Powered by Gemini 2.5 & Sportmonks</span>
           <Github size={14} />
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative pt-16 lg:pt-0">
        
        {currentView === 'HISTORY' ? (
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                <BetHistoryView bets={bets} />
             </div>
        ) : selectedMatch ? (
             <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 max-w-5xl mx-auto w-full">
                <div className="mb-6 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium uppercase tracking-widest">
                        {mode === 'LIVE' && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                        Analisi AI
                    </div>
                    <div className="flex items-center gap-4">
                         {selectedMatch.homeTeamLogo && <img src={selectedMatch.homeTeamLogo} alt={selectedMatch.homeTeam} onError={(e) => e.currentTarget.style.display = 'none'} className="w-10 h-10 lg:w-16 lg:h-16 object-contain" />}
                         <h1 className="text-3xl lg:text-5xl font-bold text-white tracking-tighter">
                            {selectedMatch.homeScore !== undefined ? (
                                <span>{selectedMatch.homeScore}-{selectedMatch.awayScore}</span>
                            ) : (
                                <span>VS</span>
                            )}
                         </h1>
                         {selectedMatch.awayTeamLogo && <img src={selectedMatch.awayTeamLogo} alt={selectedMatch.awayTeam} onError={(e) => e.currentTarget.style.display = 'none'} className="w-10 h-10 lg:w-16 lg:h-16 object-contain" />}
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-zinc-300">
                         <span>{selectedMatch.homeTeam}</span>
                         <span className="text-zinc-600 font-light">-</span>
                         <span>{selectedMatch.awayTeam}</span>
                    </div>
                    
                    <p className="text-zinc-400 text-sm flex items-center gap-2 mt-2">
                        <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300">{selectedMatch.league}</span>
                        <span>•</span>
                        {selectedMatch.time}
                    </p>
                </div>
                
                <AnalysisView 
                    key={selectedMatch.id}
                    match={selectedMatch} 
                    data={analysis} 
                    loading={analysisLoading}
                    savedBet={bets[selectedMatch.id]}
                    onSaveBet={handleSaveBet}
                />
             </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-8 text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950">
                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
                    <Flame size={40} className="text-orange-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-300 mb-2">Benvenuto su EuroBet AI</h2>
                <p className="max-w-md mx-auto text-sm text-zinc-400">
                    Scegli <strong>"🔥 Top Probabilità Over 1.5"</strong> dal menu per visualizzare le migliori partite selezionate algoritmicamente per i gol, oppure esplora i campionati.
                </p>
            </div>
        )}
      </div>

    </div>
  );
}