// components/LastUpdated.js
import { RefreshCw } from 'lucide-react';

export default function LastUpdated({ onRefresh, isLoading }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center gap-3 text-xs text-[#5a5a5a] font-mono">
      <span>Updated {timeStr}</span>
      <span className="text-[#2a2a2a]">·</span>
      <span>Auto-refresh every 5 min</span>
      <button
        onClick={onRefresh}
        className="text-[#888888] hover:text-[#c9a84c] transition-colors"
        disabled={isLoading}
      >
        <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
