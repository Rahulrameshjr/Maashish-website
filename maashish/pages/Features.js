// pages/Features.js
import { useState, useMemo } from 'react';
import Head from 'next/head';
import { useSheetData } from '../hooks/useSheetData';
import { groupByDate, getDailyStats, getShiftStats, getTodayStr } from '../lib/sheets';
import LastUpdated from '../components/LastUpdated';
import { LoadingSpinner, ErrorState } from '../components/Loading';
import { Sun, Moon, BarChart2, Calendar } from 'lucide-react';

function ShiftCard({ icon: Icon, label, data, color }) {
  if (!data) return (
    <div className="stat-card flex flex-col gap-3 opacity-40">
      <div className="flex items-center gap-2">
        <Icon size={14} className={color} />
        <p className="text-xs font-mono uppercase tracking-widest text-[#5a5a5a]">{label} Shift</p>
      </div>
      <p className="text-sm text-[#3a3a3a] font-mono">No data</p>
    </div>
  );

  const effColor = data.efficiency >= 85 ? '#3ecf6e' : data.efficiency >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <div className="stat-card flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon size={14} className={color} />
        <p className="text-xs font-mono uppercase tracking-widest text-[#5a5a5a]">{label} Shift</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[#5a5a5a] font-mono">Total Rolls</p>
          <p className="font-display text-3xl text-[#f0ede8] mt-0.5">{data.totalRolls}</p>
        </div>
        <div>
          <p className="text-xs text-[#5a5a5a] font-mono">Efficiency</p>
          <p className="font-display text-3xl mt-0.5" style={{ color: effColor }}>
            {data.efficiency != null ? `${data.efficiency}%` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#5a5a5a] font-mono">Active Machines</p>
          <p className="font-display text-2xl text-[#c9a84c] mt-0.5">{data.activeMachines}</p>
        </div>
        <div>
          <p className="text-xs text-[#5a5a5a] font-mono">Total Machines</p>
          <p className="font-display text-2xl text-[#f0ede8] mt-0.5">{data.totalMachines}</p>
        </div>
      </div>
      {data.efficiency != null && (
        <div>
          <div className="h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, data.efficiency)}%`, backgroundColor: effColor }}
            />
          </div>
          <p className="text-[10px] font-mono text-[#3a3a3a] mt-1">act. counter ÷ (RPM × 43200)</p>
        </div>
      )}
    </div>
  );
}

export default function Features() {
  const { data, error, isLoading, refresh, mostRecentDate } = useSheetData();
  const [selectedDate, setSelectedDate] = useState(null);

  const availableDates = useMemo(() => {
    const dates = [...new Set(data.map(r => r.date).filter(Boolean))];
    return dates.sort((a, b) => {
      const [ad, am, ay] = a.split('/');
      const [bd, bm, by] = b.split('/');
      return new Date(`${by}-${bm}-${bd}`) - new Date(`${ay}-${am}-${ad}`);
    });
  }, [data]);

  const activeDate = selectedDate || mostRecentDate || getTodayStr();
  const dayData = data.filter(r => r.date === activeDate);
  const shiftStats = useMemo(() => getShiftStats(dayData), [dayData]);
  const dailyStats = useMemo(() => getDailyStats(dayData), [dayData]);

  // Weekly shift comparison
  const byDate = useMemo(() => groupByDate(data), [data]);
  const weeklyData = useMemo(() => {
    return availableDates.slice(0, 7).reverse().map(date => {
      const rows = byDate[date] || [];
      const s = getShiftStats(rows);
      const [d, m] = date.split('/');
      return {
        date: `${d}/${m}`,
        dayRolls: s.day?.totalRolls || 0,
        nightRolls: s.night?.totalRolls || 0,
        dayEff: s.day?.efficiency || 0,
        nightEff: s.night?.efficiency || 0,
      };
    });
  }, [availableDates, byDate]);

  function toInputVal(sheetDate) {
    if (!sheetDate) return '';
    const [d, m, y] = sheetDate.split('/');
    return `${y}-${m}-${d}`;
  }

  return (
    <>
      <Head><title>Features — MAA Ashish</title></Head>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#c9a84c] mb-1">Shift Analysis</p>
            <h1 className="font-display text-4xl text-[#f0ede8]">Features</h1>
          </div>
          <LastUpdated onRefresh={refresh} isLoading={isLoading} />
        </div>

        {isLoading && <LoadingSpinner />}
        {error && <ErrorState message={error.message} onRetry={refresh} />}

        {!isLoading && !error && (
          <>
            {/* Section 1 — Day vs Night Shift */}
            <div className="stat-card space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <BarChart2 size={14} className="text-[#c9a84c]" />
                  <p className="text-xs font-mono uppercase tracking-widest text-[#5a5a5a]">Day vs Night Shift</p>
                </div>
                <select
                  value={toInputVal(activeDate)}
                  onChange={e => {
                    const [y, m, d] = e.target.value.split('-');
                    setSelectedDate(`${d}/${m}/${y}`);
                  }}
                  className="px-3 py-1.5 bg-[#111] border border-[#222] rounded text-xs text-[#f0ede8] font-mono focus:outline-none focus:border-[#c9a84c]/50"
                >
                  {availableDates.map(d => (
                    <option key={d} value={toInputVal(d)}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <ShiftCard icon={Sun} label="Day" data={shiftStats.day} color="text-[#f59e0b]" />
                <ShiftCard icon={Moon} label="Night" data={shiftStats.night} color="text-[#60a5fa]" />
              </div>

              {/* Combined summary */}
              {(shiftStats.day || shiftStats.night) && (
                <div className="border-t border-[#1e1e1e] pt-4 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-[#5a5a5a] font-mono">Total Rolls</p>
                    <p className="font-display text-3xl text-[#c9a84c] mt-0.5">{dailyStats.totalRolls}</p>
                    <p className="text-[10px] text-[#3a3a3a] font-mono">day + night</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#5a5a5a] font-mono">Overall Efficiency</p>
                    <p className="font-display text-3xl mt-0.5"
                      style={{ color: dailyStats.avgEfficiency >= 85 ? '#3ecf6e' : dailyStats.avgEfficiency >= 65 ? '#f59e0b' : '#ef4444' }}>
                      {dailyStats.avgEfficiency != null ? `${dailyStats.avgEfficiency}%` : 'N/A'}
                    </p>
                    <p className="text-[10px] text-[#3a3a3a] font-mono">both shifts combined</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#5a5a5a] font-mono">Active Machines</p>
                    <p className="font-display text-3xl text-[#f0ede8] mt-0.5">{dailyStats.active}</p>
                    <p className="text-[10px] text-[#3a3a3a] font-mono">of {dailyStats.total} total</p>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2 — Weekly shift comparison table */}
            <div className="stat-card space-y-4">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#c9a84c]" />
                <p className="text-xs font-mono uppercase tracking-widest text-[#5a5a5a]">Weekly Shift Comparison</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1e1e1e]">
                      <th className="text-left py-2 text-[#5a5a5a]">Date</th>
                      <th className="text-right py-2 text-[#f59e0b]">Day Rolls</th>
                      <th className="text-right py-2 text-[#f59e0b]">Day Eff.</th>
                      <th className="text-right py-2 text-[#60a5fa]">Night Rolls</th>
                      <th className="text-right py-2 text-[#60a5fa]">Night Eff.</th>
                      <th className="text-right py-2 text-[#c9a84c]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.map(row => (
                      <tr key={row.date} className="border-b border-[#141414] hover:bg-[#1a1a1a] transition-colors">
                        <td className="py-2.5 text-[#888888]">{row.date}</td>
                        <td className="py-2.5 text-right text-[#f0ede8]">{row.dayRolls}</td>
                        <td className="py-2.5 text-right">
                          <span style={{ color: row.dayEff >= 85 ? '#3ecf6e' : row.dayEff >= 65 ? '#f59e0b' : row.dayEff > 0 ? '#ef4444' : '#3a3a3a' }}>
                            {row.dayEff > 0 ? `${row.dayEff}%` : '—'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-[#f0ede8]">{row.nightRolls}</td>
                        <td className="py-2.5 text-right">
                          <span style={{ color: row.nightEff >= 85 ? '#3ecf6e' : row.nightEff >= 65 ? '#f59e0b' : row.nightEff > 0 ? '#ef4444' : '#3a3a3a' }}>
                            {row.nightEff > 0 ? `${row.nightEff}%` : '—'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-[#c9a84c] font-medium">{row.dayRolls + row.nightRolls}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}