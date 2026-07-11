import { PAGE_CONFIG, PageKey } from '@/config/pages';

// Per-user permission blob stored as JSON in Users.Permissions. `notifications`
// is a separate top-level key (not a page) — e.g. low-stock alert opt-in —
// kept alongside pages/granular in the same column rather than a new sheet
// column, since it's just app-level user preference data, not access control.
export type PermData = {
  pages: Record<string, boolean>;
  granular: Record<string, Record<string, boolean>>;
  notifications: Record<string, boolean>;
};

export function parsePermissions(raw?: string): PermData {
  try {
    const j = JSON.parse(raw || '{}');
    return { pages: j.pages || {}, granular: j.granular || {}, notifications: j.notifications || {} };
  } catch {
    return { pages: {}, granular: {}, notifications: {} };
  }
}

export function allPagesGranted(): Record<string, boolean> {
  return Object.fromEntries(Object.keys(PAGE_CONFIG).map(k => [k, true]));
}

// Broad-access roles bypass per-page checks entirely. Only "Super Admin" exists
// in the current Roles data — there is no "Developer" role yet. Matching by
// substring (rather than an exact "Super Admin" literal) means a future
// Developer role created later via the Roles page picks this up automatically,
// with no code change here.
export function isBroadAccessRole(role?: string): boolean {
  return /admin|developer|dev/i.test(role || '');
}

// Stricter than isBroadAccessRole: only Admin-named roles may manage user/role
// permissions. A future Developer role would get broad page access via
// isBroadAccessRole, but never this — permission-editing stays Admin-only.
export function isAdminManagerRole(role?: string): boolean {
  return /admin/i.test(role || '');
}

export function canAccessPage(role: string | undefined, permissions: PermData, pageKey: string): boolean {
  if (pageKey === 'dashboard') return true; // always-safe landing/redirect target
  if (isBroadAccessRole(role)) return true;
  return !!permissions.pages[pageKey];
}

// Maps a pathname to the PAGE_CONFIG key that governs it, using longest-prefix
// match so nested routes (e.g. /item-master/EL-102, /users/USR001) resolve to
// their parent page. Returns null for un-gated routes (/login, /).
const PATH_TO_PAGE_KEY: [string, PageKey][] = [
  ['/dashboard', 'dashboard'],
  ['/inventory-map', 'inventoryMap'],
  ['/inventory', 'inventory'],
  ['/invoices', 'invoices'],
  ['/item-master', 'itemMaster'],
  ['/vendors', 'vendors'],
  ['/gst-summary', 'gstSummary'],
  ['/notice-board', 'noticeBoard'],
  ['/tasks', 'tasks'],
  ['/users', 'users'],
  ['/roles', 'roles'],
  ['/registers', 'registers'],
  ['/activity-log', 'activityLog'],
  ['/recycle-bin', 'recycleBin'],
  ['/settings', 'settings'],
];

export function pathToPageKey(pathname: string): PageKey | null {
  let best: PageKey | null = null;
  let bestLen = 0;
  for (const [prefix, key] of PATH_TO_PAGE_KEY) {
    if ((pathname === prefix || pathname.startsWith(prefix + '/')) && prefix.length > bestLen) {
      best = key;
      bestLen = prefix.length;
    }
  }
  return best;
}
