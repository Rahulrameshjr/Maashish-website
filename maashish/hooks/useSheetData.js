// hooks/useSheetData.js
import useSWR from 'swr';
import { parseMainSheet, parseIdleReasons, parsePW } from '../lib/sheets';

const REFRESH_INTERVAL = 5 * 60 * 1000;
const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || '1UY64sPLk87KFIL_vXzD-lZJYwwV4lazBXhXvL4KVbFY';

// Exact tab names from the Google Sheet
const MAIN_TAB = 'Machine and Operator details';

async function fetchTab(apiKey, tab, range) {
  const fullRange = `${tab}!${range}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(fullRange)}?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[sheets] Failed to fetch tab "${tab}":`, res.status, errText);
    return [];
  }
  const json = await res.json();
  return json.values || [];
}

async function fetcher() {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
  if (!API_KEY || API_KEY.trim() === '' || API_KEY === 'your_google_api_key_here') {
    console.warn('[sheets] No API key set in .env.local');
    return { main: [], idleReasons: [], pw: [] };
  }
  try {
    const [mainRows, idleRows, pwRows] = await Promise.all([
      fetchTab(API_KEY, 'Machine and Operator details', 'A:H'),
      fetchTab(API_KEY, 'Machine Idle reason', 'A:C'),
      fetchTab(API_KEY, 'P and W', 'A:F'),
    ]);
    const parsed = parseMainSheet(mainRows);
    const idleReasons = parseIdleReasons(idleRows);
    const pw = parsePW(pwRows);
    return { main: Array.isArray(parsed) ? parsed : [], idleReasons, pw };
  } catch (err) {
    console.error('[sheets] Fetch error:', err.message);
    throw err;
  }
}

// Get the most recent date that has data in the dataset
export function getMostRecentDate(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const dates = [...new Set(data.map(r => r.date).filter(Boolean))];
  return dates.sort((a, b) => {
    const [ad, am, ay] = a.split('/');
    const [bd, bm, by] = b.split('/');
    return new Date(`${by}-${bm}-${bd}`) - new Date(`${ay}-${am}-${ad}`);
  })[0]; // first = most recent
}

export function useSheetData() {
  const { data, error, isLoading, mutate } = useSWR('sheet-main', fetcher, {
    refreshInterval: REFRESH_INTERVAL,
    revalidateOnFocus: true,
    dedupingInterval: 60000,
    keepPreviousData: true,
    fallbackData: { main: [], idleReasons: [], pw: [] },
  });

  const safeMain = Array.isArray(data?.main) ? data.main : [];
  const safeIdle = Array.isArray(data?.idleReasons) ? data.idleReasons : [];
  const safePW = Array.isArray(data?.pw) ? data.pw : [];
  const mostRecentDate = getMostRecentDate(safeMain);

  return {
    data: safeMain,
    idleReasons: safeIdle,
    pw: safePW,
    error, isLoading,
    refresh: mutate,
    lastUpdated: safeMain.length > 0 ? new Date() : null,
    mostRecentDate,
  };
}
