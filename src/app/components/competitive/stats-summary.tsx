import { getStreakCopy, getWinRate } from '@/lib/competitive-utils';

interface StatsSummaryProps {
  wins: number;
  losses: number;
  totalMatches: number;
  className?: string;
}

export function StatsSummary({ 
  wins, 
  losses, 
  totalMatches, 
  className 
}: StatsSummaryProps) {
  const streak = getStreakCopy(wins, losses);
  const winRate = getWinRate(wins, losses);

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{totalMatches}</div>
          <div className="text-sm text-slate-600">Partidos</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{winRate}%</div>
          <div className="text-sm text-slate-600">Efectividad</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">
            {streak.emoji} {wins}
          </div>
          <div className="text-sm text-slate-600">Victorias</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-600">
        <span>✅ {wins} ganados</span>
        <span>•</span>
        <span>❌ {losses} perdidos</span>
      </div>
    </div>
  );
}