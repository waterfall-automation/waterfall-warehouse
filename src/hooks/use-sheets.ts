/**
 * SheetsAPI — all calls go through /api/sheets which proxies to Apps Script
 * Token is read from localStorage and injected automatically.
 */

const BASE = '/api/sheets';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const s = localStorage.getItem('sicca_session');
    return s ? JSON.parse(s).token || '' : '';
  } catch { return ''; }
}

async function apGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(BASE, window.location.origin);
  url.searchParams.set('action', action);
  url.searchParams.set('token', getToken());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { cache: 'no-store' });
  return res.json();
}

async function apPost<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const url = new URL(BASE, window.location.origin);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, action, token: getToken() }),
  });
  return res.json();
}

export const SheetsAPI = {
  // Dashboard
  getDashboard: () => apGet<any>('dashboard'),

  // Stock Register
  getEntries: (p?: { limit?: number; type?: string; search?: string }) =>
    apGet<any>('getEntries', Object.fromEntries(Object.entries(p || {}).map(([k,v])=>[k,String(v)]))),
  getItemSummary: () => apGet<any>('getItemSummary'),
  saveEntry: (data: Record<string, unknown>) => apPost<any>('saveEntry', data),
  deleteEntry: (entryId: string) => apPost<any>('deleteEntry', { entryId }),

  // Item Master
  getItemMaster: () => apGet<any>('getItemMaster'),
  createItem: (data: Record<string, unknown>) => apPost<any>('createItem', data),
  updateItem: (itemId: string, data: Record<string, unknown>) => apPost<any>('updateItem', { itemId, ...data }),

  // Vendors
  getVendors: () => apGet<any>('getVendors'),
  createVendor: (data: Record<string, unknown>) => apPost<any>('createVendor', data),
  updateVendor: (vendorId: string, data: Record<string, unknown>) => apPost<any>('updateVendor', { vendorId, ...data }),

  // Cupboards
  getCupboards: () => apGet<any>('getCupboards'),
  getCupboardItems: (cupboardId: string) => apGet<any>('getCupboardItems', { cupboardId }),
  createCupboard: (data: Record<string, unknown>) => apPost<any>('createCupboard', data),
  updateCupboard: (cupboardId: string, data: Record<string, unknown>) => apPost<any>('updateCupboard', { cupboardId, ...data }),
  deleteCupboard: (cupboardId: string) => apPost<any>('deleteCupboard', { cupboardId }),
  addCupboardItem: (data: Record<string, unknown>) => apPost<any>('addCupboardItem', data),
  updateCupboardItem: (itemId: string, data: Record<string, unknown>) => apPost<any>('updateCupboardItem', { itemId, ...data }),
  deleteCupboardItem: (itemId: string) => apPost<any>('deleteCupboardItem', { itemId }),

  // Roles
  getRoles: () => apGet<any>('getRoles'),
  createRole: (data: Record<string, unknown>) => apPost<any>('createRole', data),
  updateRole: (roleId: string, data: Record<string, unknown>) => apPost<any>('updateRole', { roleId, ...data }),
  deleteRole: (roleId: string) => apPost<any>('deleteRole', { roleId }),

  // Users
  getUsers: () => apGet<any>('getUsers'),
  createUser: (data: Record<string, unknown>) => apPost<any>('createUser', data),
  updateUser: (userId: string, data: Record<string, unknown>) => apPost<any>('updateUser', { userId, ...data }),
  toggleUserStatus: (userId: string, status: string) => apPost<any>('toggleUserStatus', { userId, status }),

  // GST
  getGSTSummary: () => apGet<any>('getGSTSummary'),

  // Notices
  getNotices: () => apGet<any>('getNotices'),
  createNotice: (data: Record<string, unknown>) => apPost<any>('createNotice', data),
  deleteNotice: (noticeId: string) => apPost<any>('deleteNotice', { noticeId }),

  // Tasks
  getTasks: () => apGet<any>('getTasks'),
  updateTaskStatus: (taskId: string, status: string) => apPost<any>('updateTaskStatus', { taskId, status }),

  // Activity Log
  getActivityLog: () => apGet<any>('getActivityLog'),

  // Recycle Bin
  getRecycleBin: () => apGet<any>('getRecycleBin'),
  restoreItem: (binId: string) => apPost<any>('restoreItem', { binId }),
  emptyBin: () => apPost<any>('emptyBin', {}),

  // Settings
  getSettings: () => apGet<any>('getSettings'),
  saveSettings: (settings: Record<string, string>) => apPost<any>('saveSettings', { settings }),

  // Password
  changePassword: (data: Record<string, unknown>) => apPost<any>('changePassword', data),
};
