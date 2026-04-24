// components/Loading.js
export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="w-10 h-10 border-2 border-[#222] border-t-[#c9a84c] rounded-full animate-spin" />
      <p className="text-xs font-mono text-[#5a5a5a] tracking-widest uppercase">Fetching data...</p>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-[#1a1a1a] rounded animate-pulse ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card flex flex-col gap-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-[#3a1010] border border-[#5a2020] flex items-center justify-center">
        <span className="text-[#ef4444] text-lg">!</span>
      </div>
      <div>
        <p className="text-[#f0ede8] font-body font-medium">Unable to fetch data</p>
        <p className="text-xs text-[#5a5a5a] mt-1">{message || 'Check your connection or API key'}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-mono text-[#c9a84c] border border-[#c9a84c]/30 rounded hover:bg-[#c9a84c]/10 transition-all"
        >
          Retry
        </button>
      )}
    </div>
  );
}
