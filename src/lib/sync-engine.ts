import { fetchSheetTab, postSheetRow } from "./sheets";

// ── TYPES ─────────────────────────────────────────────────────────────────
export type SyncStatus = "idle" | "syncing" | "error";

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
}

export type SyncListener = (tab?: string, data?: any[]) => void;

export interface WriteAction {
  type: "postRow";
  tabName: string;
  rowData: Record<string, any>;
}

export interface QueueItem {
  id: string;
  description: string;
  fn: () => Promise<any>;
  action?: WriteAction;
  retries: number;
  addedAt: number;
}

// ── INDEXEDDB WRAPPER (SSR SAFE) ──────────────────────────────────────────
const DB_NAME = "siccasync";
const DB_VERSION = 1;
const STORE_NAME = "tabs";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = null; reject(request.error); };
  });
  return dbPromise;
}

export async function idbGet<T = any>(key: string): Promise<T | null> {
  const db = await getDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSet<T = any>(key: string, value: T): Promise<void> {
  const db = await getDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ── SYNC ENGINE STATE ─────────────────────────────────────────────────────
export const SYNC_TABS = [
  "Stock_Register",
  "Item_Master",
  "Vendors",
  "Cupboards",
  "Cupboard_Items",
  "Boxes",
  "Placements",
  "Invoices",
  "Users",
  "Roles",
  "Tasks",
  "Notice_Board",
  "Activity_Log",
  "Recycle_Bin",
  "Settings"
] as const;

let syncStatus: SyncStatus = "idle";
let lastSyncedAt: number | null = null;
let timerId: any = null;
const listeners = new Set<SyncListener>();

export function getSyncStatus(): SyncState {
  return { status: syncStatus, lastSyncedAt };
}

export function subscribe(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyStatus() {
  listeners.forEach(l => l());
}

function notifyTab(tab: string, data: any[]) {
  listeners.forEach(l => l(tab, data));
}

// ── WRITE TO TAB WITH CHANGE COMPARISON ───────────────────────────────────
async function updateTab(tab: string, data: any[]) {
  const oldEntry = await idbGet<{ data: any[]; syncedAt: number }>(tab);
  const oldJson = oldEntry ? JSON.stringify(oldEntry.data) : "";
  const newJson = JSON.stringify(data);
  
  await idbSet(tab, { data, syncedAt: Date.now() });
  
  if (oldJson !== newJson) {
    notifyTab(tab, data);
  }
}

// ── FULL SYNC FUNCTION ────────────────────────────────────────────────────
async function performFullSyncInternal(onProgress?: (done: number, total: number) => void): Promise<void> {
  let doneCount = 0;
  const totalCount = SYNC_TABS.length;

  // fetchSheetTab has a 4-way concurrency governor, so we fire all fetches
  // concurrently and let the sheets.ts governor queue/throttle them.
  const promises = SYNC_TABS.map(async (tab) => {
    const data = await fetchSheetTab("database", tab);
    await updateTab(tab, data);
    doneCount++;
    onProgress?.(doneCount, totalCount);
  });

  await Promise.all(promises);
}

export async function fullSync(onProgress?: (done: number, total: number) => void): Promise<void> {
  syncStatus = "syncing";
  notifyStatus();
  
  try {
    await performFullSyncInternal(onProgress);
    syncStatus = "idle";
    lastSyncedAt = Date.now();
    await idbSet("__last_full_sync__", lastSyncedAt);
    notifyStatus();
  } catch (err) {
    syncStatus = "error";
    notifyStatus();
    throw err;
  }
}

// ── GET CACHED TAB ────────────────────────────────────────────────────────
export async function getCached(tab: string): Promise<{ data: any[]; syncedAt: number } | null> {
  return idbGet<{ data: any[]; syncedAt: number }>(tab);
}

// ── PERIODIC BACKGROUND SYNC LOOP ──────────────────────────────────────────
export function start(intervalMs = 60000) {
  if (typeof window === "undefined") return;
  
  if (timerId) {
    clearInterval(timerId);
  }

  // Load lastSyncedAt from IndexedDB if not set
  idbGet<number>("__last_full_sync__").then(ts => {
    if (ts && lastSyncedAt === null) {
      lastSyncedAt = ts;
      notifyStatus();
    }
  });

  // Initialize write queue
  initWriteQueue();

  const tick = async () => {
    if (document.hidden) return;
    if (syncStatus === "syncing") return;

    syncStatus = "syncing";
    notifyStatus();

    try {
      await performFullSyncInternal();
      syncStatus = "idle";
      lastSyncedAt = Date.now();
      await idbSet("__last_full_sync__", lastSyncedAt);
      notifyStatus();
    } catch (err) {
      console.error("Background sync loop error:", err);
      syncStatus = "error";
      notifyStatus();
    }
  };

  // Run immediately on boot
  tick();

  timerId = setInterval(tick, intervalMs);
}

// ── OPTIMISTIC WRITE QUEUE ───────────────────────────────────────────────
let writeQueue: QueueItem[] = [];
let processingQueue = false;
let onFailureCallback: ((error: Error, description: string, item: QueueItem) => void) | null = null;

export function registerOnFailure(callback: (error: Error, description: string, item: QueueItem) => void) {
  onFailureCallback = callback;
}

async function persistWriteQueue() {
  const serializable = writeQueue.map(item => ({
    id: item.id,
    description: item.description,
    action: item.action,
    retries: item.retries,
    addedAt: item.addedAt
  }));
  await idbSet("__write_queue__", serializable);
}

async function processQueue() {
  if (processingQueue) return;
  processingQueue = true;

  while (writeQueue.length > 0) {
    const item = writeQueue[0];
    let success = false;
    let attempt = 0;
    const delays = [2000, 8000, 30000]; // 2s, 8s, 30s

    while (attempt <= 3) {
      try {
        await item.fn();
        success = true;
        break;
      } catch (err: any) {
        attempt++;
        if (attempt <= 3) {
          const delay = delays[attempt - 1] || 30000;
          console.warn(`Write failed (attempt ${attempt}/4): ${item.description}. Retrying in ${delay}ms...`, err);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Final failure after 3 retries
          console.error(`Write failed permanently: ${item.description}`, err);
          onFailureCallback?.(
            err instanceof Error ? err : new Error(String(err)),
            item.description,
            item
          );
        }
      }
    }

    // Always remove from queue once processed (either success or permanent failure)
    writeQueue.shift();
    await persistWriteQueue();
  }

  processingQueue = false;
}

export async function queueWrite(
  fn: () => Promise<any>,
  description: string,
  action?: WriteAction
): Promise<string> {
  const id = Math.random().toString(36).substring(2, 11);
  const item: QueueItem = {
    id,
    description,
    fn,
    action,
    retries: 0,
    addedAt: Date.now()
  };

  writeQueue.push(item);
  await persistWriteQueue();

  // Run execution loop asynchronously
  processQueue();
  
  return id;
}

export async function initWriteQueue() {
  if (typeof window === "undefined") return;
  
  try {
    const stored = await idbGet<any[]>("__write_queue__") || [];
    writeQueue = stored.map(entry => {
      let fn = () => Promise.resolve();
      if (entry.action && entry.action.type === "postRow") {
        const { tabName, rowData } = entry.action;
        fn = () => postSheetRow(tabName, rowData);
      }
      return {
        ...entry,
        fn
      };
    });
    
    if (writeQueue.length > 0) {
      processQueue();
    }
  } catch (err) {
    console.error("Failed to initialize write queue from IDB:", err);
  }
}
