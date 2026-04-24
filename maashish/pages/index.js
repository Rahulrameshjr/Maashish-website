// pages/index.js
import Head from 'next/head';
import Link from 'next/link';
import { useSheetData, getMostRecentDate } from '../hooks/useSheetData';
import { filterByDate, getDailyStats, getTodayStr, groupByOperator } from '../lib/sheets';
import StatCard from '../components/StatCard';
import LastUpdated from '../components/LastUpdated';
import StatusBadge from '../components/StatusBadge';
import { LoadingSpinner, ErrorState, StatCardSkeleton } from '../components/Loading';
import { Activity, Layers, Users, AlertCircle, ArrowRight, Cpu } from 'lucide-react';

export default function Home() {
  const { data, error, isLoading, refresh, mostRecentDate } = useSheetData();

  // Use most recent date with data — not "today" which may have no entries yet
  const displayDate = mostRecentDate || getTodayStr();
  const todayData = filterByDate(data, displayDate);
  const stats = getDailyStats(todayData);

  // Operator leaderboard
  const opData = groupByOperator(todayData);
  const opLeaderboard = Object.entries(opData)
    .map(([name, rows]) => ({
      name,
      rolls: rows.reduce((s, r) => s + r.rolls, 0),
      machines: [...new Set(rows.map(r => r.machineNumber))].length,
    }))
    .sort((a, b) => b.rolls - a.rolls)
    .slice(0, 5);

  const totalMachines = todayData.length || 0;
  const idleRate = totalMachines ? Math.round((stats.idle / totalMachines) * 100) : 0;
  const utilizationRate = totalMachines ? Math.round((stats.active / totalMachines) * 100) : 0;

  // Format display date nicely
  const formattedDate = displayDate
    ? (() => {
        const [d, m, y] = displayDate.split('/');
        return new Date(`${y}-${m}-${d}`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      })()
    : '';

  const isLiveToday = displayDate === getTodayStr();

  return (
    <>
      <Head><title>MA Aashish — Operations</title></Head>

      <main className="min-h-screen">
        {/* Hero */}
        <div className="relative border-b border-[#141414] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#c9a84c08,_transparent_60%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-[#c9a84c] mb-3">Knitting Operations Center</p>
                <h1 className="font-display text-6xl md:text-8xl text-[#f0ede8] leading-none tracking-wide">
                  MA <span className="text-[#c9a84c]">AASHISH</span>
                </h1>
                <div className="flex items-center gap-2 mt-3">
                  <p className="text-[#5a5a5a] font-body text-sm">Textile Knitting Production</p>
                  {formattedDate && (
                    <>
                      <span className="text-[#2a2a2a]">·</span>
                      <p className="text-[#888888] font-mono text-xs">{formattedDate}</p>
                      {!isLiveToday && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3a2a00] text-[#f59e0b] border border-[#5a4010]">
                          Latest available data
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <LastUpdated onRefresh={refresh} isLoading={isLoading} />
            </div>
          </div>
        </div>

        {/* Alert banner */}
        {!isLoading && !error && idleRate > 30 && totalMachines > 0 && (
          <div className="border-b border-[#3a2a00] bg-[#1e1500]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2.5">
              <AlertCircle size={14} className="text-[#f59e0b] shrink-0" />
              <p className="text-xs text-[#f59e0b] font-mono">
                High idle rate — {stats.idle} machines offline ({idleRate}% of floor) on {displayDate}
              </p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* KPI Cards */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <ErrorState message={error.message} onRetry={refresh} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Active Machines"
                value={stats.active}
                sub={`of ${stats.total} total on floor`}
                icon={Cpu}
                accent
              />
              <StatCard
                label="Total Rolls"
                value={stats.totalRolls}
                sub={`rolls on ${displayDate}`}
                icon={Layers}
              />
              <StatCard
                label="Operators on Floor"
                value={stats.operators.length}
                sub="active operators"
                icon={Users}
              />
              <StatCard
                label="Idle Machines"
                value={stats.idle}
                sub={`${idleRate}% idle rate`}
                icon={AlertCircle}
              />
            </div>
          )}

          {!isLoading && !error && totalMachines > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Utilisation bar */}
              <div className="stat-card space-y-4">
                <p className="text-xs font-mono uppercase tracking-widest text-[#5a5a5a]">Machine Status — {displayDate}</p>
                <div className="space-y-3">
                  <div className="h-3 rounded-full bg-[#1e1e1e] overflow-hidden flex">
                    {stats.total > 0 && (
                      <>
                        <div className="h-full bg-[#3ecf6e] transition-all" style={{ width: `${(stats.active / stats.total) * 100}%` }} />
                        <div className="h-full bg-[#f59e0b]" style={{ width: `${(stats.sampling / stats.total) * 100}%` }} />
                        <div className="h-full bg-[#2a2a2a]" style={{ width: `${(stats.idle / stats.total) * 100}%` }} />
                      </>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-[#3ecf6e]"><span className="w-2 h-2 rounded-sm bg-[#3ecf6e]" />{stats.active} Active</span>
                    <span className="flex items-center gap-1.5 text-[#f59e0b]"><span className="w-2 h-2 rounded-sm bg-[#f59e0b]" />{stats.sampling} Sampling</span>
                    <span className="flex items-center gap-1.5 text-[#5a5a5a]"><span className="w-2 h-2 rounded-sm bg-[#2a2a2a]" />{stats.idle} Idle</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#1e1e1e]">
                  <p className="text-xs text-[#5a5a5a]">Floor utilisation</p>
                  <p className="font-display text-4xl text-[#c9a84c] mt-1">{utilizationRate}<span className="text-lg text-[#5a5a5a]">%</span></p>
                </div>
              </div>

              {/* Operator leaderboard */}
              <div className="stat-card space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono uppercase tracking-widest text-[#5a5a5a]">Top Operators — {displayDate}</p>
                  <Link href="/machines" className="text-xs text-[#c9a84c] hover:text-[#e8c97e] flex items-center gap-1">
                    View all <ArrowRight size={10} />
                  </Link>
                </div>
                {opLeaderboard.length === 0 ? (
                  <p className="text-sm text-[#5a5a5a]">No operator data available</p>
                ) : (
                  <div className="space-y-1">
                    {opLeaderboard.map((op, i) => (
                      <div key={op.name} className="flex items-center gap-3 py-2 border-b border-[#141414] last:border-0">
                        <span className="font-mono text-xs text-[#3a3a3a] w-4">0{i + 1}</span>
                        <span className="flex-1 text-sm font-body capitalize text-[#f0ede8]">{op.name}</span>
                        <span className="text-xs text-[#5a5a5a] font-mono">{op.machines}m</span>
                        <span className="font-mono text-sm text-[#c9a84c] font-medium">{op.rolls} rolls</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No data state */}
          {!isLoading && !error && totalMachines === 0 && data.length > 0 && (
            <div className="stat-card text-center py-8">
              <p className="text-[#5a5a5a] text-sm font-mono">No data for {displayDate}. Showing most recent available date.</p>
            </div>
          )}

          {/* Quick nav */}
          {!isLoading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Machine Info', sub: 'All machine statuses & operators', href: '/machines', icon: Cpu },
                { label: 'Production Dashboard', sub: 'Full analytics & trends', href: '/dashboard', icon: Activity },
                { label: 'Tools', sub: 'Reports & operator summary', href: '/tools', icon: Layers },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="stat-card group hover:border-[#c9a84c]/20 transition-all flex flex-col gap-2"
                >
                  <item.icon size={16} className="text-[#c9a84c]" />
                  <p className="text-sm font-body font-medium text-[#f0ede8] group-hover:text-[#c9a84c] transition-colors">{item.label}</p>
                  <p className="text-xs text-[#5a5a5a]">{item.sub}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
