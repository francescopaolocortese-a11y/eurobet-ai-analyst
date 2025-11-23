import React, { useState, useEffect } from 'react';
import { AnalysisData, Match, BetSession } from '../types';
import { ExternalLink, AlertCircle, Sparkles, Target, Trophy, Activity, Bell, BellRing, Wallet, CheckCircle2, XCircle, Clock, TrendingUp, BarChart3, BrainCircuit, Banknote } from 'lucide-react';

interface AnalysisViewProps {
  match: Match;
  data: AnalysisData | null;
  loading: boolean;
  savedBet: BetSession | undefined;
  onSaveBet: (bet: BetSession) => void;
}

const StatBar: React.FC<{ label: string; homeValue: number; awayValue: number; homeColor?: string; awayColor?: string; unit?: string; max?: number }> = ({
    label, homeValue, awayValue, homeColor = "bg-emerald-500", awayColor = "bg-red-500", unit = "", max
}) => {
    const total = max ? max : (homeValue + awayValue || 1);
    const homePercent = max ? (homeValue / max) * 100 : (homeValue / total) * 100;

    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs font-bold text-zinc-400 mb-1">
                <span className="text-zinc-200">{typeof homeValue === 'number' && homeValue % 1 !== 0 ? homeValue.toFixed(2) : homeValue}{unit}</span>
                <span>{label}</span>
                <span className="text-zinc-200">{typeof awayValue === 'number' && awayValue % 1 !== 0 ? awayValue.toFixed(2) : awayValue}{unit}</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800">
                <div style={{ width: `${homePercent}%` }} className={`h-full ${homeColor} transition-all duration-1000`}></div>
                <div className="flex-1 h-full bg-zinc-700"></div>
                <div style={{ width: `${100 - homePercent}%` }} className={`h-full ${awayColor} transition-all duration-1000`}></div>
            </div>
        </div>
    );
};

export const AnalysisView: React.FC<AnalysisViewProps> = ({ match, data, loading, savedBet, onSaveBet }) => {
  const [notificationSet, setNotificationSet] = useState(false);

  const [stake, setStake] = useState(savedBet?.stake || '');
  const [odds, setOdds] = useState(savedBet?.odds || '');
  const [selection, setSelection] = useState(savedBet?.selection || '');
  const [outcome, setOutcome] = useState<BetSession['outcome']>(savedBet?.outcome || 'pending');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (data && !selection && !savedBet) {
      setSelection(data.bestBet);
    }
  }, [data]);

  useEffect(() => {
    const hasContent = stake.trim() !== '' || odds.trim() !== '' || (selection.trim() !== '' && selection !== data?.bestBet);
    const hasChanges = savedBet?.stake !== stake || savedBet?.odds !== odds || savedBet?.selection !== selection || savedBet?.outcome !== outcome;

    if ((!savedBet && !hasContent) || !hasChanges) return;

    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      onSaveBet({
        matchId: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
        selection: selection || (data?.bestBet || ''),
        stake,
        odds,
        outcome
      });
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 1000);
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [stake, odds, selection, outcome, match, data, savedBet, onSaveBet]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-zinc-500 animate-pulse">
        <Sparkles className="w-12 h-12 mb-4 text-emerald-500 animate-bounce" />
        <h3 className="text-xl font-medium text-zinc-300">L'IA sta analizzando i dati...</h3>
        <p className="text-sm mt-2">Integrazione modelli predittivi Sportmonks in corso.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-zinc-500">
        <AlertCircle className="w-12 h-12 mb-4 text-zinc-700" />
        <p>Seleziona una partita per avviare l'analisi AI.</p>
      </div>
    );
  }

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**')) return <h4 key={i} className="mt-6 mb-3 font-bold text-lg text-emerald-400 border-l-4 border-emerald-500 pl-3">{line.replace(/\*\*/g, '')}</h4>;
      if (line.startsWith('#')) return <h3 key={i} className="mt-8 mb-4 font-bold text-xl text-white">{line.replace(/#/g, '')}</h3>;
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="mb-2 text-zinc-300 leading-relaxed text-sm lg:text-base">{line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').split(/<strong.*?>(.*?)<\/strong>/).map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="text-white font-semibold">{part}</strong> : part)}</p>;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* Header Stats Card */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="text-center md:text-left">
             <div className="flex items-center gap-2 mb-1 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                {data.isLive ? <Activity size={14} className="text-red-500 animate-pulse" /> : <Trophy size={14} />}
                {data.isLive ? "Risultato Live" : "Previsione Risultato"}
             </div>
             <div className="text-4xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-3">
                {data.currentScore}
             </div>
             <div className="text-xs text-zinc-500 mt-1">
                {data.isLive ? "Aggiornato in tempo reale" : `Previsto: ${data.prediction}`}
             </div>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-700/50 rounded-xl p-4 min-w-[280px] backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase">
                    <Target size={16} />
                    Bet Consigliata
                </div>
                <div className="flex items-center gap-1">
                   <span className="text-xs text-zinc-500 font-medium">Confidenza</span>
                   <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${data.confidence >= 8 ? 'bg-emerald-500 text-zinc-950' : data.confidence >= 6 ? 'bg-yellow-500 text-zinc-950' : 'bg-zinc-700 text-white'}`}>
                     {data.confidence}/10
                   </div>
                </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">
                {data.bestBet}
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${data.confidence >= 8 ? 'bg-emerald-500' : data.confidence >= 6 ? 'bg-yellow-500' : 'bg-zinc-500'}`}
                    style={{ width: `${data.confidence * 10}%` }}
                />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
                onClick={() => setNotificationSet(!notificationSet)}
                className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 text-sm font-medium ${notificationSet ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
            >
                {notificationSet ? <BellRing size={18} /> : <Bell size={18} />}
                {notificationSet ? 'Alert Attivo' : 'Notificami'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-1 flex flex-col gap-6">

            {/* Live Stats & Native Components */}
            {data.stats && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-emerald-500" /> Sportmonks Stats
                    </h3>

                    {data.stats.home.expectedGoals !== undefined && data.stats.away.expectedGoals !== undefined && (
                        <div className="mb-6 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                             <StatBar
                                label="Gol Attesi (xG)"
                                homeValue={data.stats.home.expectedGoals}
                                awayValue={data.stats.away.expectedGoals}
                                homeColor="bg-blue-500"
                                awayColor="bg-orange-500"
                             />
                             <div className="text-[10px] text-zinc-500 text-center mt-1">
                                Indice di qualità delle occasioni create
                             </div>
                        </div>
                    )}

                    <StatBar label="Possesso Palla" homeValue={data.stats.home.possession} awayValue={data.stats.away.possession} unit="%" />
                    <StatBar label="Tiri in Porta" homeValue={data.stats.home.shotsOnTarget} awayValue={data.stats.away.shotsOnTarget} />
                    <StatBar label="Angoli" homeValue={data.stats.home.corners} awayValue={data.stats.away.corners} />
                </div>
            )}

            {/* SPORTMONKS PREDICTION MODEL (Native Component) */}
            {data.stats?.predictions && data.stats.predictions.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BrainCircuit size={16} className="text-purple-500" /> Sportmonks Intelligence
                    </h3>
                    <div className="space-y-3">
                        {data.stats.predictions.slice(0, 3).map((pred, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-500 uppercase">{pred.market}</span>
                                    <span className="text-sm font-bold text-white">{pred.selection}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div style={{width: `${pred.probability}%`}} className="h-full bg-purple-500"></div>
                                     </div>
                                     <span className="text-xs font-bold text-purple-400">{pred.probability.toFixed(0)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ODDS (Native Component) */}
            {data.stats?.odds && data.stats.odds.length > 0 && (
                 <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Banknote size={16} className="text-green-500" /> Quote Mercato
                    </h3>
                    <div className="flex justify-between gap-2">
                        {data.stats.odds.slice(0, 3).map((odd, idx) => (
                            <div key={idx} className="flex-1 p-2 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                                <div className="text-xs text-zinc-500 mb-1">{odd.label}</div>
                                <div className="text-lg font-bold text-white">{odd.value.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Wallet size={16} className="text-emerald-500" /> Scheda Giocata
                    </h3>
                    {lastSaved && (
                        <span className={`text-[10px] font-medium transition-colors flex items-center gap-1 ${isSaving ? 'text-emerald-400' : 'text-zinc-600'}`}>
                           {isSaving ? <Activity size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                           {isSaving ? 'Salvataggio...' : 'Salvato'}
                        </span>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-zinc-500 font-medium mb-1 block">Selezione</label>
                        <input
                            type="text"
                            value={selection}
                            onChange={(e) => setSelection(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                            placeholder="Es. Over 2.5"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-zinc-500 font-medium mb-1 block">Quota (@)</label>
                            <input
                                type="number"
                                value={odds}
                                onChange={(e) => setOdds(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                placeholder="1.85"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 font-medium mb-1 block">Stake (€)</label>
                            <input
                                type="number"
                                value={stake}
                                onChange={(e) => setStake(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                placeholder="10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-zinc-500 font-medium mb-1 block">Esito</label>
                        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-700">
                            <button
                                onClick={() => setOutcome('pending')}
                                className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all ${outcome === 'pending' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <Clock size={12} /> In corso
                            </button>
                            <button
                                onClick={() => setOutcome('won')}
                                className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all ${outcome === 'won' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <CheckCircle2 size={12} /> Vinta
                            </button>
                            <button
                                onClick={() => setOutcome('lost')}
                                className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all ${outcome === 'lost' ? 'bg-red-900/50 text-red-400 border border-red-500/30 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <XCircle size={12} /> Persa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-500" /> Analisi Dettagliata
                </h3>
                <div className="prose prose-invert prose-sm max-w-none">
                    {renderContent(data.summary)}
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Fonti Google Search</h3>
                <div className="flex flex-wrap gap-2">
                    {data.groundingUrls.length > 0 ? (
                        data.groundingUrls.map((url, idx) => (
                            <a
                                key={idx}
                                href={url.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors text-xs text-zinc-400"
                            >
                                <span className="max-w-[150px] truncate">{url.title}</span>
                                <ExternalLink size={10} />
                            </a>
                        ))
                    ) : (
                        <p className="text-xs text-zinc-500 italic">Analisi basata su conoscenze generali e contesto storico.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
