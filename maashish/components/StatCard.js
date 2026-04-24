// components/StatCard.js
export default function StatCard({ label, value, sub, icon: Icon, accent, trend }) {
  return (
    <div className="stat-card flex flex-col gap-3 animate-slide-up">
      <div className="flex items-start justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-[#5a5a5a]">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center">
            <Icon size={15} className="text-[#c9a84c]" />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className={`font-display text-5xl leading-none ${accent ? 'text-[#c9a84c]' : 'text-[#f0ede8]'}`}>
          {value}
        </span>
        {trend !== undefined && (
          <span className={`text-xs font-mono mb-1 ${trend >= 0 ? 'text-[#3ecf6e]' : 'text-[#ef4444]'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-[#5a5a5a] font-body">{sub}</p>}
    </div>
  );
}
