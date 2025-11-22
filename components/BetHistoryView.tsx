import React, { useState, useMemo } from 'react';
import { BetSession } from '../types';
import { Wallet, CheckCircle2, XCircle, Clock, Search, TrendingUp, TrendingDown, Filter, ChevronDown, ChevronUp, Percent, DollarSign } from 'lucide-react';

interface BetHistoryViewProps {
  bets: Record<string, BetSession>;
}

export const BetHistoryView: React.FC<BetHistoryViewProps> = ({ bets }) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'WON' | 'LOST' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const betList = useMemo(() => Object.values(bets), [bets]);

  const filteredBets = useMemo(() => {
    return betList.filter(bet => {
      const matchesStatus = filterStatus === 'ALL' || bet.outcome.toUpperCase() === filterStatus;
      const matchesSearch = 
        bet.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.selection.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    }).reverse(); // Most recent first
  }, [betList, filterStatus, searchTerm]);

  // Calculate Stats
  const stats = useMemo(() => {
    let totalStaked = 0;
    let totalReturned = 0;
    let wins = 0;
    let losses = 0;
    let pending = 0;

    betList.forEach(bet => {
      const stake = parseFloat(bet.stake) || 0;
      const odds = parseFloat(bet.odds) || 0;

      if (bet.outcome === 'won') {
        totalStaked += stake;
        totalReturned += stake * odds;
        wins++;
      } else if (bet.outcome === 'lost') {
        totalStaked += stake;
        losses++;
      } else if (bet.outcome === 'pending') {
        pending++;
      }
    });

    const netProfit = totalReturned - totalStaked;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;

    return { totalStaked, totalReturned, netProfit, roi, wins, losses, pending, totalBets: betList.length };
  }, [betList]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wallet className="text-emerald-500" /> Storico Giocate
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Analisi delle tue performance e registro scommesse.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 font-medium uppercase mb-1">Profitto Netto</div>
          <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toFixed(2)}€
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 font-medium uppercase mb-1">ROI</div>
          <div className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-2`}>
            {stats.roi.toFixed(1)}%
            {stats.roi >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 font-medium uppercase mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-white">
            {stats.wins + stats.losses > 0 ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) : 0}%
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 font-medium uppercase mb-1">Giocate</div>
          <div className="flex items-baseline gap-2">
             <span className="text-2xl font-bold text-white">{stats.totalBets}</span>
             <span className="text-xs text-zinc-500">({stats.pending} in corso)</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
                type="text" 
                placeholder="Cerca squadra o selezione..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 overflow-x-auto">
            {(['ALL', 'WON', 'LOST', 'PENDING'] as const).map(status => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${filterStatus === status ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    {status === 'ALL' && 'Tutte'}
                    {status === 'WON' && 'Vinte'}
                    {status === 'LOST' && 'Perse'}
                    {status === 'PENDING' && 'In Corso'}
                </button>
            ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredBets.length > 0 ? (
            filteredBets.map((bet) => {
                const stake = parseFloat(bet.stake) || 0;
                const odds = parseFloat(bet.odds) || 0;
                const potentialReturn = stake * odds;
                const isExpanded = expandedId === bet.matchId;
                
                // Calculate P&L for this specific bet
                let pnl = 0;
                let roi = 0;
                
                if (bet.outcome === 'won') {
                    pnl = potentialReturn - stake;
                    roi = (pnl / stake) * 100;
                } else if (bet.outcome === 'lost') {
                    pnl = -stake;
                    roi = -100;
                }

                return (
                    <div key={bet.matchId} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                        <div 
                            onClick={() => toggleExpand(bet.matchId)}
                            className="p-4 cursor-pointer flex flex-col md:flex-row justify-between gap-4"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    {bet.homeTeamLogo && <img src={bet.homeTeamLogo} alt="" className="w-6 h-6 object-contain" />}
                                    <h3 className="font-bold text-white text-lg">
                                        {bet.homeTeam} <span className="text-zinc-600 text-sm font-light">vs</span> {bet.awayTeam}
                                    </h3>
                                    {bet.awayTeamLogo && <img src={bet.awayTeamLogo} alt="" className="w-6 h-6 object-contain" />}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">{bet.selection}</span>
                                    <span className="text-zinc-500">Quota: <span className="text-zinc-300 font-bold">{bet.odds}</span></span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
                                <div className="text-right">
                                    <div className="text-xs text-zinc-500 mb-0.5">Stake</div>
                                    <div className="font-bold text-zinc-300">{stake.toFixed(2)}€</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-zinc-500 mb-0.5">Ritorno</div>
                                    <div className={`font-bold ${bet.outcome === 'won' ? 'text-emerald-400' : bet.outcome === 'lost' ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                                        {potentialReturn.toFixed(2)}€
                                    </div>
                                </div>
                                <div className="pl-2 flex items-center gap-3">
                                    {bet.outcome === 'won' && <CheckCircle2 className="text-emerald-500" size={24} />}
                                    {bet.outcome === 'lost' && <XCircle className="text-red-500" size={24} />}
                                    {bet.outcome === 'pending' && <Clock className="text-yellow-500" size={24} />}
                                    {bet.outcome === 'void' && <Filter className="text-zinc-500" size={24} />}
                                    
                                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={16} className="text-zinc-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details Section */}
                        {isExpanded && (
                            <div className="bg-zinc-950/50 border-t border-zinc-800/50 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                                        <DollarSign size={10} /> Profitto/Perdita
                                    </span>
                                    <span className={`text-lg font-bold ${pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                        {bet.outcome === 'pending' ? 'In corso' : `${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}€`}
                                    </span>
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                                        <Percent size={10} /> ROI
                                    </span>
                                    <span className={`text-lg font-bold ${roi > 0 ? 'text-emerald-400' : roi < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                         {bet.outcome === 'pending' ? '-' : `${roi.toFixed(1)}%`}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Stake Totale</span>
                                    <span className="text-zinc-300 font-medium">{stake.toFixed(2)}€</span>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Quota Finale</span>
                                    <span className="text-zinc-300 font-medium">@{odds}</span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })
        ) : (
            <div className="text-center py-12 text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800/50 border-dashed">
                <Wallet size={32} className="mx-auto mb-3 opacity-50" />
                <p>Nessuna scommessa trovata con i filtri correnti.</p>
            </div>
        )}
      </div>
    </div>
  );
};