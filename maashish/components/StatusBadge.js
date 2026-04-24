// components/StatusBadge.js
export default function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', cls: 'badge-active' },
    idle: { label: 'Idle', cls: 'badge-idle' },
    sampling: { label: 'Sampling', cls: 'badge-sampling' },
  };
  const { label, cls } = map[status] || map.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
