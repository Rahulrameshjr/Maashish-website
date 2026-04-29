// pages/dashboard.js
import { useState, useMemo } from 'react';
import Head from 'next/head';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
CartesianGrid, Legend, Cell, ReferenceLine
} from 'recharts';
import { useSheetData } from '../hooks/useSheetData';
import { groupByDate, getDailyStats, getOperatorStats, getTodayStr } from '../lib/sheets';
import StatCard from '../components/StatCard';
import InsightPanel from '../components/InsightPanel';
import LastUpdated from '../components/LastUpdated';
import { LoadingSpinner, ErrorState } from '../components/Loading';
import { Activity, Layers, Cpu, User,  AlertCircle } from 'lucide-react';

const CHART_COLORS = ['#c9a84c', '#3ecf6e', '#60a5fa', '#f59e0b', '#a78bfa', '#fb7185', '#34d399', '#f97316'];

const tooltipStyle = {
  backgroundColor: '#161616',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  color: '#f0ede8',
  fontSize: '12px',
  fontFamily: 'DM Mono, monospace',
};

function SectionHeader({ label }) {
  return <p className="text-xs font-mono uppercase tracking-widest text-[#5a5a5a] mb-4">{label}</p>;
}

export default function Dashboard() {
  const { data, pw, error, isLoading, refresh } = useSheetData();
  const [days, setDays] = useState(7);

  const today = getTodayStr();

  // Get all unique dates sorted descending
  const allDates = useMemo(() => {
    const dates = [...new Set(data.map(r => r.date))].filter(Boolean);
    return dates.sort((a, b) => {
      const [ad, am, ay] = a.split('/');
      const [bd, bm, by] = b.split('/');
      return new Date(`${by}-${bm}-${bd}`) - new Date(`${ay}-${am}-${ad}`);
    });
  }, [data]);

  const recentDates = allDates.slice(0, days);
  const rangeData = data.filter(r => recentDates.includes(r.date));

  const byDate = useMemo(() => groupByDate(rangeData), [rangeData]);

  // Daily chart data (sorted ascending for chart)
  const dailyChartData = useMemo(() => {
    return [...recentDates].reverse().map(date => {
      const rows = byDate[date] || [];
      const s = getDailyStats(rows);
      const [d, m] = date.split('/');
      return { date: `${d}/${m}`, rolls: s.totalRolls, active: s.active, idle: s.idle, sampling: s.sampling, efficiency: s.avgEfficiency ?? 0 };
    });
  }, [recentDates, byDate]);

  // Operator stats
  const opStats = useMemo(() => getOperatorStats(rangeData), [rangeData]);

  // KPIs
  const totalRolls = rangeData.reduce((s, r) => s + r.rolls, 0);
  // Total rejected rolls from P&W sheet
  const totalRejected = pw.reduce((s, r) => {
    if (!r.rejectedRaw) return s;
    const match = r.rejectedRaw.match(/^(\d+)/);
    return s + (match ? parseInt(match[1]) : 0);
  }, 0);

  const rejectedThisPeriod = pw
    .filter(r => recentDates.includes(r.date))
    .reduce((s, r) => {
      if (!r.rejectedRaw) return s;
      const match = r.rejectedRaw.match(/^(\d+)/);
      return s + (match ? parseInt(match[1]) : 0);
    }, 0);
  const totalMachines = [...new Set(data.map(r => r.machineNumber))].length;
  const avgUtilisation = recentDates.length
    ? Math.round(recentDates.reduce((s, d) => {
        const st = getDailyStats(byDate[d] || []);
        return s + (st.active / (st.total || 1)) * 100;
      }, 0) / recentDates.length)
    : 0;
  const topOp = opStats[0];

  // Today's stats for today's data
  const todayData = data.filter(r => r.date === today);
  const todayStats = getDailyStats(todayData);

  // RPM distribution
  const rpmData = useMemo(() => {
    const active = rangeData.filter(r => r.rpm && r.rpm > 0);
    const buckets = {};
    active.forEach(r => {
      const b = Math.floor(r.rpm / 2) * 2;
      const key = `${b}–${b + 2}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count })).sort((a, b) => parseInt(a.range) - parseInt(b.range));
  }, [rangeData]);

  const avgRpm = useMemo(() => {
    const active = rangeData.filter(r => r.rpm && r.rpm > 0);
    return active.length ? (active.reduce((s, r) => s + r.rpm, 0) / active.length).toFixed(1) : 0;
  }, [rangeData]);

  // Heatmap data
  const machineNumbers = useMemo(() => [...new Set(data.map(r => r.machineNumber))].sort((a, b) => a - b), [data]);
  const todayByMachine = useMemo(() => {
    const m = {};
    todayData.forEach(r => { m[r.machineNumber] = r; });
    return m;
  }, [todayData]);

  // Insights
  const insights = useMemo(() => {
    const ins = [];
    if (topOp) ins.push({ text: `${topOp.name} is the top operator this period with ${topOp.rolls} rolls across ${topOp.machines} machines.`, type: 'good' });
    if (avgUtilisation < 50) ins.push({ text: `Floor utilisation is only ${avgUtilisation}% — over half the machines are idle on average. Consider checking machine maintenance or scheduling.`, type: 'warn' });
    else if (avgUtilisation >= 75) ins.push({ text: `Floor utilisation is strong at ${avgUtilisation}%. Keep this up!`, type: 'good' });
    const belowAvg = rangeData.filter(r => r.rpm && r.rpm < parseFloat(avgRpm)).length;
    const totalActive = rangeData.filter(r => r.rpm && r.rpm > 0).length;
    if (totalActive > 0) ins.push({ text: `${Math.round((belowAvg / totalActive) * 100)}% of active machines ran below average RPM (${avgRpm}). Machines running slower than average reduce overall output.`, type: 'info' });
    const idleCountToday = todayStats.idle;
    if (idleCountToday > 15) ins.push({ text: `${idleCountToday} machines are idle today. Even bringing 5 more machines online could significantly increase roll output.`, type: 'warn' });
    return ins;
  }, [topOp, avgUtilisation, avgRpm, rangeData, todayStats]);

  return (
    <>
      <Head><title>Dashboard — MAA Ashish</title></Head>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#c9a84c] mb-1">Analytics</p>
            <h1 className="font-display text-4xl text-[#f0ede8]">Production Dashboard</h1>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Range selector */}
            <div className="flex gap-1 bg-[#111] border border-[#1e1e1e] rounded p-0.5">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 text-xs font-mono rounded transition-all ${days === d ? 'bg-[#c9a84c] text-[#0a0a0a] font-bold' : 'text-[#5a5a5a] hover:text-[#f0ede8]'}`}
                >
                  {d}D
                </button>
              ))}
            </div>
            <LastUpdated onRefresh={refresh} isLoading={isLoading} />
          </div>
        </div>

        {isLoading && <LoadingSpinner />}
        {error && <ErrorState message={error.message} onRetry={refresh} />}

        {!isLoading && !error && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Rolls" value={totalRolls} sub={`Last ${days} days`} icon={Layers} accent />
              <StatCard
                label="Rolls Rejected"
                value={rejectedThisPeriod}
                sub={`last ${days} days · ${totalRejected} total overall`}
                icon={AlertCircle}
              />
              <StatCard label="Floor Utilisation" value={`${avgUtilisation}%`} sub="active machine rate" icon={Activity} />
              <StatCard label="Top Operator" value={topOp?.name?.split(' ')[0] || '—'} sub={topOp ? `${topOp.rolls} rolls this period` : 'No data'} icon={User} />
            </div>

            {/* Rolls per Machine chart */}
            <div className="stat-card space-y-4">
              <SectionHeader label="Rolls Produced per Machine" />
              {(() => {
                // Aggregate total rolls per machine across selected date range
                const machineRolls = {};
                rangeData.forEach(r => {
                  if (!machineRolls[r.machineNumber]) machineRolls[r.machineNumber] = 0;
                  machineRolls[r.machineNumber] += r.rolls;
                });
                const chartData = Object.entries(machineRolls)
                  .map(([machine, rolls]) => ({ machine: `#${machine}`, machineNum: parseInt(machine), rolls }))
                  .sort((a, b) => a.machineNum - b.machineNum);
                const avgRolls = chartData.length ? Math.round(chartData.reduce((s, r) => s + r.rolls, 0) / chartData.length) : 0;
                return (
                  <>
                    <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                        <XAxis
                          dataKey="machine"
                          tick={{ fill: '#3a3a3a', fontSize: 9, fontFamily: 'DM Mono' }}
                          axisLine={false} tickLine={false}
                          interval={9}
                        />
                        <YAxis tick={{ fill: '#5a5a5a', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(val) => [`${val} rolls`, 'Rolls']}
                        />
                        <ReferenceLine y={avgRolls} stroke="#c9a84c" strokeDasharray="4 2" strokeWidth={1} />
                        <Line
                          type="monotone"
                          dataKey="rolls"
                          stroke="#3ecf6e"
                          strokeWidth={1.5}
                          dot={{ fill: '#3ecf6e', r: 2, strokeWidth: 0 }}
                          activeDot={{ r: 4, fill: '#c9a84c' }}
                          name="Rolls"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 text-xs font-mono text-[#5a5a5a]">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-[#c9a84c] opacity-60" />Avg: {avgRolls} rolls</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#3ecf6e]" />Above avg</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2a4a35]" />Below avg</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Machine status by day */}
            <div className="stat-card space-y-4">
              <SectionHeader label="Machine Status by Day" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#5a5a5a', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5a5a5a', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'DM Mono', color: '#5a5a5a' }} />
                  <Bar dataKey="active" stackId="a" fill="#3ecf6e" name="Active" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="sampling" stackId="a" fill="#f59e0b" name="Sampling" />
                  <Bar dataKey="idle" stackId="a" fill="#2a2a2a" name="Idle" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Operator output */}
            <div className="stat-card space-y-4">
              <SectionHeader label="Operator Output Comparison" />
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {opStats.slice(0, 20).map((op, i) => {
                  const pct = Math.round((op.rolls / (opStats[0]?.rolls || 1)) * 100);
                  return (
                    <div key={op.name} className="flex items-center gap-3 group">
                      <span className="text-[10px] font-mono text-[#3a3a3a] w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span className="capitalize text-xs font-body text-[#888888] w-24 shrink-0 truncate group-hover:text-[#f0ede8] transition-colors">{op.name}</span>
                      <div className="flex-1 h-5 bg-[#1a1a1a] rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm transition-all duration-500 flex items-center px-2"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: i === 0 ? '#c9a84c' : i === 1 ? '#8a7030' : '#3a3a3a'
                          }}
                        >
                          {pct > 20 && (
                            <span className="text-[9px] font-mono text-white/60">{op.rolls}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[#c9a84c] w-16 text-right shrink-0">{op.rolls} rolls</span>
                      <span className="text-[10px] font-mono text-[#5a5a5a] w-10 text-right shrink-0">{op.machines}m</span>
                    </div>
                  );
                })}
              </div>
              {opStats.length > 20 && (
                <p className="text-xs text-[#5a5a5a] font-mono text-center">+ {opStats.length - 20} more operators</p>
              )}
            </div>

            {/* RPM Distribution */}
            <div className="stat-card space-y-4">
              <SectionHeader label="Machine Speed Distribution (RPM)" />
              <div className="grid md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={rpmData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                      <XAxis dataKey="range" tick={{ fill: '#5a5a5a', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#5a5a5a', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#c9a84c" name="Machines" radius={[3, 3, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Average RPM', val: avgRpm },
                    { label: 'Above Avg', val: rangeData.filter(r => r.rpm && r.rpm > parseFloat(avgRpm)).length },
                    { label: 'Below Avg', val: rangeData.filter(r => r.rpm && r.rpm > 0 && r.rpm < parseFloat(avgRpm)).length },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                      <span className="text-xs text-[#5a5a5a] font-mono">{s.label}</span>
                      <span className="font-mono text-[#c9a84c] font-medium">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Insights */}
            <InsightPanel insights={insights} />
          </>
        )}
      </main>
    </>
  );
}
