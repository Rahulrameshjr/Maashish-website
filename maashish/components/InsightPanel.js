// components/InsightPanel.js
import { Lightbulb, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

function InsightItem({ text, type = 'info' }) {
  const icons = {
    info: <Lightbulb size={13} className="text-[#c9a84c] mt-0.5 shrink-0" />,
    warn: <AlertTriangle size={13} className="text-[#f59e0b] mt-0.5 shrink-0" />,
    good: <TrendingUp size={13} className="text-[#3ecf6e] mt-0.5 shrink-0" />,
    bad: <TrendingDown size={13} className="text-[#ef4444] mt-0.5 shrink-0" />,
  };
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-[#1a1a1a] last:border-0">
      {icons[type]}
      <p className="text-sm text-[#888888] leading-snug font-body">{text}</p>
    </div>
  );
}

export default function InsightPanel({ insights }) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="stat-card">
      <p className="text-xs font-mono uppercase tracking-widest text-[#5a5a5a] mb-3">Insights</p>
      <div>
        {insights.map((ins, i) => (
          <InsightItem key={i} text={ins.text} type={ins.type} />
        ))}
      </div>
    </div>
  );
}
