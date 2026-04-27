// lib/sheets.js
// Google Sheets data fetcher and parser

export async function fetchSheetData(range) {
  const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || '1UY64sPLk87KFIL_vXzD-lZJYwwV4lazBXhXvL4KVbFY';
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

  if (!API_KEY || API_KEY === 'your_google_api_key_here') {
    console.warn('Google API key not set. Add NEXT_PUBLIC_GOOGLE_API_KEY to .env.local');
    return [];
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 403) throw new Error('Access denied (403). Make sure the sheet is shared as "Anyone with the link → Viewer".');
    throw new Error(`Sheet fetch failed (${res.status}): ${errText}`);
  }
  const json = await res.json();
  return json.values || [];
}

// ─── Efficiency helpers ────────────────────────────────────────────────────────

// Efficiency per row = (actCounter / exCounter) × 100
// Column G = exCounter (expected counter — already in sheet)
// Column H = actCounter (actual counter — from machine)
export function calcEfficiency(actCounter, exCounter) {
  if (!actCounter || !exCounter || exCounter <= 0 || actCounter <= 0) return null;
  return Math.round((actCounter / exCounter) * 100 * 10) / 10;
}

// Overall efficiency for a set of rows = average of per-row efficiencies
export function calcOverallEfficiency(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const valid = rows.filter(r => r.actCounter > 0 && r.exCounter > 0);
  if (!valid.length) return null;
  const effValues = valid
    .map(r => calcEfficiency(r.actCounter, r.exCounter))
    .filter(e => e !== null);
  if (!effValues.length) return null;
  return Math.round((effValues.reduce((s, e) => s + e, 0) / effValues.length) * 10) / 10;
}

// ─── Sheet parsing ─────────────────────────────────────────────────────────────

export function parseMainSheet(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  return rows.slice(1).map((row) => {
    const date = row[0] || '';
    const machineNumber = parseInt(row[1]) || 0;
    const operatorName = (row[2] || '').trim();
    const shift = (row[3] || 'Day').trim();
    const rolls = parseFloat(row[4]) || 0;
    const rpmRaw = (row[5] || '').toString().trim().toLowerCase();
    const exCounter = row[6] ? parseFloat(row[6]) : null;
    const actCounter = row[7] ? parseFloat(row[7]) : null;

    let status = 'idle';
    let rpm = null;

    if (rpmRaw === 'na' || rpmRaw === '') {
      status = 'idle';
    } else if (rpmRaw === 'sampling') {
      status = 'sampling';
    } else {
      const parsed = parseFloat(rpmRaw);
      if (!isNaN(parsed)) {
        rpm = parsed;
        status = operatorName ? 'active' : 'idle';
      }
    }

    const efficiency = calcEfficiency(actCounter, exCounter);

    return {
      date, machineNumber, operatorName, shift, rolls,
      rpm, exCounter, actCounter, efficiency, status,
    };
  }).filter(r => r.machineNumber > 0);
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

export function getTodayStr() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

export function filterByDate(data, dateStr) {
  if (!Array.isArray(data)) return [];
  return data.filter(r => r.date === dateStr);
}

// ─── Grouping helpers ──────────────────────────────────────────────────────────

export function groupByDate(data) {
  if (!Array.isArray(data)) return {};
  const map = {};
  data.forEach(r => {
    if (!map[r.date]) map[r.date] = [];
    map[r.date].push(r);
  });
  return map;
}

export function groupByMachine(data) {
  if (!Array.isArray(data)) return {};
  const map = {};
  data.forEach(r => {
    if (!map[r.machineNumber]) map[r.machineNumber] = [];
    map[r.machineNumber].push(r);
  });
  return map;
}

export function groupByOperator(data) {
  if (!Array.isArray(data)) return {};
  const map = {};
  data.forEach(r => {
    if (!r.operatorName) return;
    if (!map[r.operatorName]) map[r.operatorName] = [];
    map[r.operatorName].push(r);
  });
  return map;
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export function getDailyStats(dayData) {
  if (!Array.isArray(dayData) || dayData.length === 0) {
    return { active: 0, idle: 0, sampling: 0, total: 0, totalRolls: 0, operators: [], avgEfficiency: null };
  }

  // Deduplicate by machine number — same machine appears in Day + Night shift rows
  const machineMap = new Map();
  dayData.forEach(r => {
    const existing = machineMap.get(r.machineNumber);
    if (!existing) {
      machineMap.set(r.machineNumber, { ...r });
    } else {
      machineMap.set(r.machineNumber, {
        ...existing,
        rolls: existing.rolls + r.rolls,
        status: r.status === 'active' ? 'active' : existing.status,
        rpm: Math.max(existing.rpm || 0, r.rpm || 0) || null,
        actCounter: (existing.actCounter || 0) + (r.actCounter || 0),
        exCounter: (existing.exCounter || 0) + (r.exCounter || 0),
      });
    }
  });

  const deduped = Array.from(machineMap.values());
  const active = deduped.filter(r => r.status === 'active');
  const idle = deduped.filter(r => r.status === 'idle');
  const sampling = deduped.filter(r => r.status === 'sampling');
  const totalRolls = deduped.reduce((s, r) => s + r.rolls, 0);
  const operators = [...new Set(active.map(r => r.operatorName).filter(Boolean))];

  // Use raw (pre-dedup) rows for efficiency — each shift row has its own counters
  const avgEfficiency = calcOverallEfficiency(dayData);

  return {
    active: active.length,
    idle: idle.length,
    sampling: sampling.length,
    total: deduped.length,
    totalRolls,
    operators,
    avgEfficiency,
  };
}

export function getOperatorStats(data) {
  if (!Array.isArray(data)) return [];
  const grouped = groupByOperator(data);
  return Object.entries(grouped).map(([name, rows]) => {
    const rolls = rows.reduce((s, r) => s + r.rolls, 0);
    const machines = [...new Set(rows.map(r => r.machineNumber))];
    const avgEfficiency = calcOverallEfficiency(rows);
    const avgRollsPerMachine = machines.length
      ? Math.round((rolls / machines.length) * 10) / 10
      : 0;
    return {
      name,
      rolls,
      machines: machines.length,
      machineList: machines,
      avgEfficiency,
      avgRollsPerMachine,
      days: [...new Set(rows.map(r => r.date))].length,
    };
  }).sort((a, b) => b.rolls - a.rolls);
}

// Day vs Night shift breakdown — used in Features page
export function getShiftStats(data) {
  if (!Array.isArray(data)) return { day: null, night: null };

  const dayRows = data.filter(r => r.shift && r.shift.toLowerCase().includes('day'));
  const nightRows = data.filter(r => r.shift && r.shift.toLowerCase().includes('night'));

  function shiftSummary(rows) {
    if (!rows.length) return null;
    const active = rows.filter(r => r.status === 'active');
    const totalRolls = rows.reduce((s, r) => s + r.rolls, 0);
    const uniqueMachines = [...new Set(rows.map(r => r.machineNumber))].length;
    const efficiency = calcOverallEfficiency(rows); // actCounter / exCounter × 100
    return {
      totalRolls,
      activeMachines: [...new Set(active.map(r => r.machineNumber))].length,
      totalMachines: uniqueMachines,
      efficiency,
    };
  }

  return {
    day: shiftSummary(dayRows),
    night: shiftSummary(nightRows),
  };
}

export function getIdleStreaks(data) {
  if (!Array.isArray(data)) return [];
  const byMachine = groupByMachine(data);
  const streaks = [];

  Object.entries(byMachine).forEach(([machineNum, rows]) => {
    const sorted = [...rows].sort((a, b) => {
      const [ad, am, ay] = a.date.split('/');
      const [bd, bm, by] = b.date.split('/');
      return new Date(`${ay}-${am}-${ad}`) - new Date(`${by}-${bm}-${bd}`);
    });
    let streak = 0;
    let lastActive = null;
    let lastOp = '';
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].status === 'idle' || sorted[i].status === 'sampling') {
        streak++;
      } else {
        lastActive = sorted[i].date;
        lastOp = sorted[i].operatorName;
        break;
      }
    }
    if (streak >= 2) {
      streaks.push({ machine: parseInt(machineNum), streak, lastActive, lastOp });
    }
  });

  return streaks.sort((a, b) => b.streak - a.streak);
}