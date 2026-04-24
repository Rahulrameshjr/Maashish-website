// pages/machines.js
import { useState, useMemo } from 'react';
import Head from 'next/head';
import { useSheetData } from '../hooks/useSheetData';
import { filterByDate, getTodayStr, getOperatorStats } from '../lib/sheets';
import StatusBadge from '../components/StatusBadge';
import LastUpdated from '../components/LastUpdated';
import InsightPanel from '../components/InsightPanel';
import { LoadingSpinner, ErrorState } from '../components/Loading';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const PAGE_SIZE = 30;

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown size={12} className="text-[#3a3a3a]" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-[#c9a84c]" />
    : <ChevronDown size={12} className="text-[#c9a84c]" />;
}

// Convert DD/MM/YYYY to YYYY-MM-DD for <input type="date">
function sheetDateToInput(sheetDate) {
  if (!sheetDate) return '';
  const [d, m, y] = sheetDate.split('/');
  return `${y}-${m}-${d}`;
}
// Convert YYYY-MM-DD back to DD/MM/YYYY for filtering
function inputDateToSheet(inputDate) {
  if (!inputDate) return '';
  const [y, m, d] = inputDate.split('-');
  return `${d}/${m}/${y}`;
}

export default function Machines() {
  const { data, error, isLoading, refresh, mostRecentDate } = useSheetData();

  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOp, setFilterOp] = useState('all');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('machineNumber');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  // Use selected date or fall back to most recent date with data
  const activeSheetDate = filterDate ? inputDateToSheet(filterDate) : (mostRecentDate || getTodayStr());

  const dateFiltered = useMemo(() => {
    if (!activeSheetDate || !data.length) return [];
    const dayRows = data.filter(r => r.date === activeSheetDate);
    
    // Deduplicate by machine number — keep the highest-rolls row per machine
    // This ensures each machine is counted once regardless of shift entries
    const machineMap = new Map();
    dayRows.forEach(r => {
      const existing = machineMap.get(r.machineNumber);
      if (!existing || r.rolls > existing.rolls) {
        machineMap.set(r.machineNumber, r);
      }
    });
    return Array.from(machineMap.values()).sort((a, b) => a.machineNumber - b.machineNumber);
  }, [data, activeSheetDate]);

  const operators = useMemo(() => {
    return [...new Set(data.map(r => r.operatorName).filter(Boolean))].sort();
  }, [data]);

  // All unique dates for dropdown
  const availableDates = useMemo(() => {
    const dates = [...new Set(data.map(r => r.date).filter(Boolean))];
    return dates.sort((a, b) => {
      const [ad, am, ay] = a.split('/');
      const [bd, bm, by] = b.split('/');
      return new Date(`${by}-${bm}-${bd}`) - new Date(`${ay}-${am}-${ad}`);
    });
  }, [data]);

  const filtered = useMemo(() => {
    let rows = dateFiltered;
    if (filterStatus !== 'all') rows = rows.filter(r => r.status === filterStatus);
    if (filterOp !== 'all') rows = rows.filter(r => r.operatorName === filterOp);
    if (search) rows = rows.filter(r => String(r.machineNumber).includes(search));

    return [...rows].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (av === null || av === undefined) av = -1;
      if (bv === null || bv === undefined) bv = -1;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [dateFiltered, filterStatus, filterOp, search, sortCol, sortDir]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const activeCnt = dateFiltered.filter(r => r.status === 'active').length;
  const idleCnt = dateFiltered.filter(r => r.status === 'idle').length;

  const opStats = useMemo(() => getOperatorStats(dateFiltered), [dateFiltered]);

  const insights = useMemo(() => {
    if (!dateFiltered.length) return [];
    const ins = [];
    const topOp = opStats[0];
    if (topOp) ins.push({ text: `${topOp.name} leads on ${activeSheetDate} with ${topOp.rolls} rolls across ${topOp.machines} machine(s).`, type: 'good' });
    const highRpm = [...dateFiltered].filter(r => r.rpm).sort((a, b) => b.rpm - a.rpm)[0];
    if (highRpm) ins.push({ text: `Highest RPM: Machine #${highRpm.machineNumber} at ${highRpm.rpm} RPM (operator: ${highRpm.operatorName || 'N/A'}).`, type: 'info' });
    const idleRate = Math.round((idleCnt / dateFiltered.length) * 100);
    if (idleRate > 40) ins.push({ text: `${idleRate}% of machines are idle — consider checking maintenance logs or reassigning operators.`, type: 'warn' });
    const lowProd = dateFiltered.filter(r => r.status === 'active' && r.rolls <= 1).sort((a, b) => a.rolls - b.rolls)[0];
    if (lowProd) ins.push({ text: `Machine #${lowProd.machineNumber} (${lowProd.operatorName || 'unassigned'}) is active but produced only ${lowProd.rolls} roll — worth checking.`, type: 'warn' });
    return ins;
  }, [dateFiltered, opStats, idleCnt, activeSheetDate]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  };

  return (
    <>
      <Head><title>Machines — MA Aashish</title></Head>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#c9a84c] mb-1">Floor Status</p>
            <h1 className="font-display text-4xl text-[#f0ede8]">Machine Info</h1>
            {mostRecentDate && !filterDate && (
              <p className="text-xs text-[#5a5a5a] font-mono mt-1">Showing latest: {mostRecentDate}</p>
            )}
          </div>
          <LastUpdated onRefresh={refresh} isLoading={isLoading} />
        </div>

        {isLoading && <LoadingSpinner />}
        {error && <ErrorState message={error.message} onRetry={refresh} />}

        {!isLoading && !error && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', val: dateFiltered.length, color: 'text-[#f0ede8]' },
                { label: 'Active', val: activeCnt, color: 'text-[#3ecf6e]' },
                { label: 'Idle', val: idleCnt, color: 'text-[#ef4444]' },
              ].map(s => (
                <div key={s.label} className="stat-card text-center py-4">
                  <p className={`font-display text-4xl ${s.color}`}>{s.val}</p>
                  <p className="text-xs font-mono text-[#5a5a5a] uppercase mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a5a]" />
                <input
                  type="text"
                  placeholder="Machine #"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-8 pr-3 py-1.5 bg-[#161616] border border-[#222] rounded text-sm text-[#f0ede8] font-mono w-28 focus:outline-none focus:border-[#c9a84c]/50 placeholder:text-[#3a3a3a]"
                />
              </div>

              {/* Date selector — shows available dates from the sheet */}
              <select
                value={filterDate || sheetDateToInput(mostRecentDate || '')}
                onChange={e => { setFilterDate(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-[#161616] border border-[#222] rounded text-sm text-[#f0ede8] font-mono focus:outline-none focus:border-[#c9a84c]/50"
              >
                {availableDates.map(d => (
                  <option key={d} value={sheetDateToInput(d)}>{d}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-[#161616] border border-[#222] rounded text-sm text-[#f0ede8] font-mono focus:outline-none focus:border-[#c9a84c]/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="sampling">Sampling</option>
              </select>

              <select
                value={filterOp}
                onChange={e => { setFilterOp(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-[#161616] border border-[#222] rounded text-sm text-[#f0ede8] font-mono focus:outline-none focus:border-[#c9a84c]/50 capitalize"
              >
                <option value="all">All Operators</option>
                {operators.map(op => <option key={op} value={op} className="capitalize">{op}</option>)}
              </select>

              <span className="text-xs text-[#5a5a5a] font-mono ml-auto">{filtered.length} machines</span>
            </div>

            {/* Table */}
            <div className="stat-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e1e1e]">
                      {[
                        { col: 'machineNumber', label: 'Machine' },
                        { col: 'operatorName', label: 'Operator' },
                        { col: 'shift', label: 'Shift' },
                        { col: 'status', label: 'Status' },
                        { col: 'rolls', label: 'Rolls' },
                        { col: 'rpm', label: 'RPM' },
                        { col: 'actCounter', label: 'Act. Counter' },
                        { col: 'efficiency', label: 'Efficiency' },
                      ].map(({ col, label }) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-[#5a5a5a] cursor-pointer hover:text-[#c9a84c] transition-colors select-none whitespace-nowrap"
                          onClick={() => handleSort(col)}
                        >
                          <div className="flex items-center gap-1.5">
                            {label}
                            <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((row, i) => (
                      <tr key={`${row.machineNumber}-${i}`} className="table-row border-b border-[#141414] last:border-0">
                        <td className="px-4 py-3 font-mono font-medium text-[#c9a84c]">#{row.machineNumber}</td>
                        <td className="px-4 py-3 capitalize text-[#f0ede8]">{row.operatorName || <span className="text-[#3a3a3a]">—</span>}</td>
                        <td className="px-4 py-3 text-[#888888] font-mono text-xs">{row.shift}</td>
                        <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                        <td className="px-4 py-3 font-mono text-[#f0ede8]">{row.rolls || <span className="text-[#3a3a3a]">—</span>}</td>
                        <td className="px-4 py-3 font-mono text-[#f0ede8]">{row.rpm ?? <span className="text-[#3a3a3a]">—</span>}</td>
                        <td className="px-4 py-3 font-mono text-[#888888] text-xs">{row.actCounter?.toLocaleString() || <span className="text-[#3a3a3a]">—</span>}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {row.efficiency != null ? (
                            <span className={row.efficiency >= 90 ? 'text-[#3ecf6e]' : row.efficiency >= 70 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}>
                              {row.efficiency}%
                            </span>
                          ) : <span className="text-[#3a3a3a]">—</span>}
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-[#5a5a5a] text-sm font-mono">
                          No machines found for {activeSheetDate}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e1e1e]">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs font-mono text-[#888888] hover:text-[#f0ede8] disabled:opacity-30">← Prev</button>
                  <span className="text-xs font-mono text-[#5a5a5a]">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs font-mono text-[#888888] hover:text-[#f0ede8] disabled:opacity-30">Next →</button>
                </div>
              )}
            </div>

            {/* Operator cards */}
            {opStats.length > 0 && (
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-[#5a5a5a] mb-3">Operator Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {opStats.map(op => (
                  <div key={op.name} className="stat-card space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="font-body font-medium text-[#f0ede8] capitalize text-sm">{op.name}</p>
                      {op.avgEfficiency != null && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                          op.avgEfficiency >= 90 ? 'bg-[#1a4a2e] text-[#3ecf6e]' :
                          op.avgEfficiency >= 70 ? 'bg-[#3a2a00] text-[#f59e0b]' :
                          'bg-[#3a1010] text-[#ef4444]'
                        }`}>{op.avgEfficiency}% eff</span>
                      )}
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#5a5a5a]">Machines</span>
                      <span className="text-[#c9a84c]">{op.machines}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#5a5a5a]">Total Rolls</span>
                      <span className="text-[#f0ede8]">{op.rolls}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#5a5a5a]">Rolls/Machine</span>
                      <span className={op.avgRollsPerMachine >= 2 ? 'text-[#3ecf6e]' : 'text-[#f59e0b]'}>
                        {op.avgRollsPerMachine}
                      </span>
                    </div>
                    {/* Mini performance bar */}
                    <div className="pt-1">
                      <div className="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#c9a84c] rounded-full"
                          style={{ width: `${Math.min(100, (op.rolls / (opStats[0]?.rolls || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}

            <InsightPanel insights={insights} />
          </>
        )}
      </main>
    </>
  );
}
