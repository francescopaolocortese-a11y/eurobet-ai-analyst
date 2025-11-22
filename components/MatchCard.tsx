import React from 'react';
import { Match } from '../types';
import { Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onClick: (match: Match) => void;
  selected: boolean;
}

const SoccerBall: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 17l-5-3 1-6 8 0 1 6z" />
    <path d="M12 17v5" />
    <path d="M7 14l-4 2" />
    <path d="M8 8L4 5" />
    <path d="M16 8l4-3" />
    <path d="M17 14l4 2" />
  </svg>
);

export const MatchCard: React.FC<MatchCardProps> = ({ match, onClick, selected }) => {
  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-950/40 px-2 py-1 rounded-full border border-red-900/50 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.2)]">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            LIVE
          </div>
        );
      case 'finished':
        return (
          <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-900 px-2 py-1 rounded-full border border-zinc-800">
            <CheckCircle2 size={10} />
            FT
          </div>
        );
      case 'scheduled':
      default:
        return (
          <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-950/50 px-2 py-1 rounded-full border border-zinc-800">
            <Clock size={10} />
            {match.time}
          </div>
        );
    }
  };

  // Calculate xG bar widths (normalized roughly to 3.5 max for visualization)
  const maxXg = 3.5;
  const homeXgVal = match.homeXg || 0;
  const awayXgVal = match.awayXg || 0;
  
  const homeXgWidth = Math.min((homeXgVal / maxXg) * 100, 100);
  const awayXgWidth = Math.min((awayXgVal / maxXg) * 100, 100);

  // Dynamic color helper based on xG intensity
  const getXgStyle = (val: number, isHome: boolean) => {
      const baseClass = "h-full transition-all duration-700 ease-out";
      
      if (val >= 2.0) {
          // High xG = Bright Color + Glow
          return `${baseClass} ${isHome ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.6)]'}`;
      } else if (val >= 1.0) {
          // Medium xG = Standard Color
          return `${baseClass} ${isHome ? 'bg-emerald-600' : 'bg-orange-600'}`;
      } else {
          // Low xG = Muted Color
          return `${baseClass} bg-zinc-700`;
      }
  };

  return (
    <div 
      onClick={() => onClick(match)}
      className={`
        group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 cursor-pointer
        hover:scale-[1.02] hover:shadow-xl hover:shadow-zinc-900/50
        ${selected 
          ? 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50'
        }
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
          <SoccerBall size={12} className="text-emerald-500" />
          {match.league}
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex justify-between items-center gap-2 relative z-10">
        {/* Home Team */}
        <div className="flex-1 flex items-center justify-end gap-3 text-right">
          <h3 className="font-bold text-zinc-100 truncate">{match.homeTeam}</h3>
          {match.homeTeamLogo && (
            <div className="w-8 h-8 md:w-10 md:h-10 p-1 bg-white/5 rounded-full flex items-center justify-center shrink-0">
               <img 
                 src={match.homeTeamLogo} 
                 alt={match.homeTeam} 
                 className="w-full h-full object-contain" 
                 onError={(e) => e.currentTarget.style.display = 'none'}
               />
            </div>
          )}
        </div>
        
        {/* Score / VS */}
        <div className="flex flex-col items-center justify-center px-2 min-w-[70px]">
          {match.status !== 'scheduled' && match.homeScore !== undefined && match.awayScore !== undefined ? (
             <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 bg-zinc-950/50 px-3 py-1 rounded-lg border border-zinc-800/50 shadow-inner">
                   <span className={`text-xl font-black tracking-tight ${match.homeScore > match.awayScore ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-white'}`}>
                     {match.homeScore}
                   </span>
                   <SoccerBall size={10} className="text-zinc-600 opacity-60" />
                   <span className={`text-xl font-black tracking-tight ${match.awayScore > match.homeScore ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-white'}`}>
                     {match.awayScore}
                   </span>
                </div>
                {match.status === 'live' && match.minute && (
                    <span className="text-[10px] text-emerald-500 font-bold animate-pulse mt-1">{match.minute}'</span>
                )}
             </div>
          ) : (
             <span className="text-xs font-bold text-zinc-500 bg-zinc-950/30 px-2 py-1 rounded border border-zinc-800/30">VS</span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center justify-start gap-3 text-left">
          {match.awayTeamLogo && (
             <div className="w-8 h-8 md:w-10 md:h-10 p-1 bg-white/5 rounded-full flex items-center justify-center shrink-0">
               <img 
                 src={match.awayTeamLogo} 
                 alt={match.awayTeam} 
                 className="w-full h-full object-contain" 
                 onError={(e) => e.currentTarget.style.display = 'none'}
               />
             </div>
          )}
          <h3 className="font-bold text-zinc-100 truncate">{match.awayTeam}</h3>
        </div>
      </div>

      {/* xG Inline Dynamic Charts */}
      {(match.homeXg !== undefined || match.awayXg !== undefined) && (
         <div className="mt-4 flex flex-col items-center relative z-10">
             <div className="w-full max-w-[220px] flex items-end justify-between text-[10px] font-bold text-zinc-500 mb-1.5 px-1">
                 <span className={`transition-colors ${homeXgVal > awayXgVal ? "text-emerald-400" : "text-zinc-400"}`}>
                    {homeXgVal.toFixed(2)}
                 </span>
                 <span className="text-[9px] uppercase tracking-widest opacity-40 font-semibold">xG (Gol Attesi)</span>
                 <span className={`transition-colors ${awayXgVal > homeXgVal ? "text-orange-400" : "text-zinc-400"}`}>
                    {awayXgVal.toFixed(2)}
                 </span>
             </div>
             
             <div className="w-full max-w-[220px] flex items-center gap-1 h-2 relative">
                {/* Home Bar (Grows Right-to-Left) */}
                <div className="flex-1 flex justify-end bg-zinc-900/50 rounded-l-sm overflow-hidden h-full">
                   <div 
                     className={`${getXgStyle(homeXgVal, true)} rounded-l-sm`} 
                     style={{ width: `${homeXgWidth}%` }}
                   ></div>
                </div>
                
                {/* Center Divider */}
                <div className="w-0.5 h-3 bg-zinc-800 rounded-full shrink-0"></div>
                
                {/* Away Bar (Grows Left-to-Right) */}
                <div className="flex-1 flex justify-start bg-zinc-900/50 rounded-r-sm overflow-hidden h-full">
                   <div 
                     className={`${getXgStyle(awayXgVal, false)} rounded-r-sm`} 
                     style={{ width: `${awayXgWidth}%` }}
                   ></div>
                </div>
             </div>
         </div>
      )}

      <div className={`
        absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent transform origin-left transition-transform duration-300
        ${selected ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}
      `} />
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">
        <ChevronRight size={20} />
      </div>
    </div>
  );
};