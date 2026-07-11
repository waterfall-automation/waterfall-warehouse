/**
 * lib/sheets.ts — server-side proxy to Google Apps Script
 * Used only by server components (e.g. dashboard page.tsx with "force-dynamic").
 * Client pages use /hooks/use-sheets.ts instead.
 */

const APPS_URL = process.env.NEXT_PUBLIC_SHEETS_API_URL || '';

async function appsGet(action: string, params: Record<string, string> = {}): Promise<any> {
  if (!APPS_URL) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');
  const url = new URL(APPS_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { cache: 'no-store' });
  return res.json();
}

export async function getDashboardStats() {
  const res = await appsGet('dashboard', { token: 'server' }); // server-side no token needed for stats
  return res.stats || {
    totalItems: 0, lowStock: 0, outOfStock: 0, todayCount: 0,
    recentEntries: [], items: []
  };
}

export async function getStockEntries(limit = 100) {
  const res = await appsGet('getEntries', { token: 'server', limit: String(limit) });
  return res.entries || [];
}

export async function getItemSummary() {
  const res = await appsGet('getItemSummary', { token: 'server' });
  return res.items || [];
}

// Export ALL_PERMISSIONS for roles page (static — no API needed)
export const ALL_PERMISSIONS = [
  { key:'perm_view_inventory',   label:'View Inventory',       group:'Inventory' },
  { key:'perm_add_inward',       label:'Add Inward Entry',     group:'Inventory' },
  { key:'perm_add_outward',      label:'Add Outward Entry',    group:'Inventory' },
  { key:'perm_edit_entries',     label:'Edit Entries',         group:'Inventory' },
  { key:'perm_delete_entries',   label:'Delete Entries',       group:'Inventory' },
  { key:'perm_view_price',       label:'View Prices',          group:'Inventory' },
  { key:'perm_view_gst',         label:'View GST Data',        group:'Finance' },
  { key:'perm_gst_summary',      label:'GST Summary Report',   group:'Finance' },
  { key:'perm_export_data',      label:'Export Data',          group:'Finance' },
  { key:'perm_notice_board',     label:'Manage Notices',       group:'Communication' },
  { key:'perm_user_management',  label:'Manage Users',         group:'Admin' },
  { key:'perm_role_management',  label:'Manage Roles',         group:'Admin' },
  { key:'perm_recycle_bin',      label:'Access Recycle Bin',   group:'Admin' },
  { key:'perm_app_settings',     label:'App Settings',         group:'Admin' },
  { key:'perm_alert_config',     label:'Alert Configuration',  group:'Admin' },
  { key:'perm_register_builder', label:'Register Builder',     group:'Advanced' },
  { key:'perm_field_builder',    label:'Field Builder',        group:'Advanced' },
  { key:'perm_dev_tools',        label:'Developer Tools',      group:'Advanced' },
] as const;

// ── Request governor ─────────────────────────────────────────────────────
// Every polling hook funnels reads through fetchSheetTab, and each call hits
// Apps Script directly from the browser. 10 hooks × ~30s polls × open tabs
// blew past Google's ~30-simultaneous-executions cap ("Too many simultaneous
// invocations"). Governor: short TTL cache + in-flight dedupe + concurrency
// cap + serve-from-cache while the browser tab is hidden.
const CACHE_TTL_MS = 15_000;
const MAX_CONCURRENT = 4;
const tabCache = new Map<string, { at: number; data: any[] }>();
const inflight = new Map<string, Promise<any[]>>();
let activeFetches = 0;
const fetchQueue: (() => void)[] = [];

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (activeFetches >= MAX_CONCURRENT) {
    await new Promise<void>(resolve => fetchQueue.push(resolve));
  }
  activeFetches++;
  try { return await fn(); }
  finally { activeFetches--; fetchQueue.shift()?.(); }
}

async function rawFetchSheetTab(sheetType: string, tabName: string): Promise<any[]> {
  const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
  if (!urlStr) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');
  const url = new URL(urlStr);
  url.searchParams.set('sheet', sheetType);
  url.searchParams.set('tab', tabName);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  const json = await res.json();
  if (!json || json.success === false) {
    throw new Error(json?.error || 'Failed to fetch sheet data');
  }
  return json.data || [];
}

export async function fetchSheetTab(sheetType: string, tabName: string): Promise<any[]> {
  const key = `${sheetType}:${tabName}`;
  const hit = tabCache.get(key);
  const hidden = typeof document !== 'undefined' && document.hidden;
  // Fresh cache, or any cache at all while the tab is hidden → no network.
  if (hit && (Date.now() - hit.at < CACHE_TTL_MS || hidden)) return hit.data;

  const existing = inflight.get(key);
  if (existing) return existing;

  const p = withSlot(() => rawFetchSheetTab(sheetType, tabName))
    .then(data => { tabCache.set(key, { at: Date.now(), data }); return data; })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export async function postSheetRow(tabName: string, rowData: Record<string, any>): Promise<any> {
  const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
  if (!urlStr) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');
  
  const res = await fetch(urlStr, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      sheet: 'database',
      tab: tabName,
      data: rowData
    })
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  const json = await res.json();
  if (!json || json.success === false) {
    throw new Error(json?.error || 'Failed to post row data');
  }
  // A write makes the cached copy of this tab stale — next read goes to network.
  tabCache.delete(`database:${tabName}`);
  return json;
}
