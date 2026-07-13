import { useState, useEffect, useCallback, useMemo, Dispatch, SetStateAction } from 'react';
import { useToast, toast } from '@/hooks/use-toast';
import { fetchSheetTab, postSheetRow } from '@/lib/sheets';
import { safeStr } from '@/lib/utils';
import {
  getCached,
  subscribe as subscribeSync,
  fullSync,
  queueWrite,
  registerOnFailure,
  idbSet
} from '@/lib/sync-engine';
import {
  Entry, ItemSummary, User, Role, Notice, RecycleItem, ActivityLog,
  Cupboard, CupItem, Vendor, ItemMaster, Box, Placement, Invoice,
  DEMO_INVENTORY_ENTRIES, DEMO_ITEM_SUMMARY, DEMO_USERS, DEMO_ROLES,
  DEMO_GST_SUMMARY, DEMO_NOTICES, DEMO_RECYCLE_BIN, DEMO_ACTIVITY_LOG,
  DEMO_CUPBOARDS, DEMO_CUPBOARD_ITEMS, DEMO_VENDORS, DEMO_ITEM_MASTER,
  DEMO_BOXES, DEMO_PLACEMENTS, DEMO_INVOICES,
  DEMO_SETTINGS
} from '@/lib/demo-data';

const isClient = typeof window !== 'undefined';

// Wire registerOnFailure once at the module level
if (isClient) {
  registerOnFailure((error, description) => {
    toast({
      title: 'Sync Write Failed',
      description: `${description}: ${error.message}`,
      variant: 'destructive'
    });
  });
}

function getStored<T>(key: string, initial: T): T {
  if (!isClient) return initial;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : initial;
  } catch {
    return initial;
  }
}

function setStored<T>(key: string, value: T) {
  if (!isClient) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const listeners: Record<string, Function[]> = {};

function subscribe(key: string, listener: Function) {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(listener);
  return () => {
    listeners[key] = listeners[key].filter(l => l !== listener);
  };
}

function notify(key: string) {
  if (listeners[key]) {
    listeners[key].forEach(l => l());
  }
}

export function useLocalState<T>(key: string, initial: T): [T, (val: T | ((curr: T) => T)) => void] {
  const [state, setState] = useState<T>(() => getStored(key, initial));

  useEffect(() => {
    return subscribe(key, () => {
      setState(getStored(key, initial));
    });
  }, [key, initial]);

  const setLocal = useCallback((val: T | ((curr: T) => T)) => {
    const nextVal = typeof val === 'function' ? (val as Function)(getStored(key, initial)) : val;
    setStored(key, nextVal);
    notify(key);
  }, [key, initial]);

  return [state, setLocal];
}

// Global Activity Log helper
export function addSystemLog(action: string, target: string) {
  if (!isClient) return;
  
  let currentUserName = 'Admin';
  try {
    const userStr = localStorage.getItem('sicca_user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      if (parsed?.name) currentUserName = parsed.name;
    }
  } catch {}

  const newLog: ActivityLog = {
    Log_ID: String(Date.now()),
    User_Name: currentUserName,
    Action: action,
    Target: target,
    Date_Time: new Date().toLocaleString()
  };

  getCached('Activity_Log').then(async (cached) => {
    const logs = cached?.data || DEMO_ACTIVITY_LOG;
    const nextLogs = [newLog, ...logs];
    await idbSet('Activity_Log', { data: nextLogs, syncedAt: Date.now() });
    window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Activity_Log', data: nextLogs } }));
  }).catch(err => {
    console.error('Failed to update Activity_Log cache:', err);
  });

  queueWrite(
    () => postSheetRow('Activity_Log', newLog),
    `System log: ${action} - ${target}`,
    { type: 'postRow', tabName: 'Activity_Log', rowData: newLog }
  ).catch(err => {
    console.error('Failed to queue system log write:', err);
  });
}

function computeSummary(entries: Entry[]): ItemSummary[] {
  const balMap: Record<string, { name: string; code: string; location: string; balance: number }> = {};
  entries.forEach(e => {
    const key = safeStr(e.Item_Name).toLowerCase();
    if (!key) return;
    if (!balMap[key]) {
      balMap[key] = {
        name: e.Item_Name,
        code: e.Item_Code || '',
        location: e.Location || 'Default',
        balance: 0
      };
    }
    const inQty = parseFloat(e.Inward_Qty || '0');
    const outQty = parseFloat(e.Outward_Qty || '0');
    balMap[key].balance += inQty - outQty;
    if (e.Location) {
      balMap[key].location = e.Location;
    }
  });

  const minStockDefault = 10;
  return Object.values(balMap).map(i => {
    const balance = i.balance;
    const status = balance <= 0 ? 'Out of Stock' : (balance < minStockDefault ? 'Low' : 'Normal');
    return {
      name: i.name,
      code: i.code,
      balance,
      location: i.location,
      status
    };
  });
}

function processStockRegister(data: any[]): Entry[] {
  const entryMap = new Map<string, Entry>();
  data.forEach((e: any) => {
    if (e.Entry_ID) {
      entryMap.set(e.Entry_ID, e);
    }
  });
  const activeEntries = Array.from(entryMap.values());
  return activeEntries.reverse();
}

function updateRawData(rawData: any[], newRow: any, idKey: string): any[] {
  const idx = rawData.findIndex(item => item[idKey] && String(item[idKey]).trim().toLowerCase() === String(newRow[idKey]).trim().toLowerCase());
  if (idx > -1) {
    const next = [...rawData];
    next[idx] = { ...next[idx], ...newRow };
    return next;
  } else {
    return [...rawData, newRow];
  }
}

async function updateLocalCache(tab: string, newRow: any, idKey: string) {
  const cached = await getCached(tab);
  const raw = cached?.data || [];
  const nextRaw = updateRawData(raw, newRow, idKey);
  await idbSet(tab, { data: nextRaw, syncedAt: Date.now() });
  window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab, data: nextRaw } }));
}

async function filterLocalCache(tab: string, filterFn: (item: any) => boolean) {
  const cached = await getCached(tab);
  const raw = cached?.data || [];
  const nextRaw = raw.filter(filterFn);
  await idbSet(tab, { data: nextRaw, syncedAt: Date.now() });
  window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab, data: nextRaw } }));
}

// DRY Hook for Sync Engine tabs
export function useSyncTabState<T>(
  tabName: string,
  initialData: T[],
  processFn?: (data: any[]) => T[]
): [T[], Dispatch<SetStateAction<T[]>>, boolean] {
  const [state, setState] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const cached = await getCached(tabName);
        if (!active) return;
        if (cached && cached.data && cached.data.length > 0) {
          setState(processFn ? processFn(cached.data) : cached.data);
          setLoading(false);
        } else {
          const data = await fetchSheetTab('database', tabName);
          if (!active) return;
          if (data && data.length > 0) {
            await idbSet(tabName, { data, syncedAt: Date.now() });
            setState(processFn ? processFn(data) : data);
          } else {
            setState(initialData);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error(`Failed to load initial cache for ${tabName}:`, err);
        if (active) {
          setState(initialData);
          setLoading(false);
        }
      }
    }
    load();

    const unsub = subscribeSync((tab, data) => {
      if (!active) return;
      if (tab === tabName && data) {
        setState(processFn ? processFn(data) : data);
        setLoading(false);
      }
    });

    const handleCustom = (e: Event) => {
      if (!active) return;
      const detail = (e as CustomEvent).detail;
      if (detail.tab === tabName && detail.data) {
        setState(processFn ? processFn(detail.data) : detail.data);
        setLoading(false);
      }
    };
    window.addEventListener('sync-tab-updated', handleCustom);

    return () => {
      active = false;
      unsub();
      window.removeEventListener('sync-tab-updated', handleCustom);
    };
  }, [tabName, initialData, processFn]);

  return [state, setState, loading];
}

// 1. INVENTORY ENTRIES HOOK
export function useInventoryEntries() {
  const [entries, setEntries, loading] = useSyncTabState<Entry>('Stock_Register', DEMO_INVENTORY_ENTRIES, processStockRegister);
  const itemSummary = useMemo(() => computeSummary(entries), [entries]);
  const { toast } = useToast();

  const addEntry = useCallback(async (form: any, opts?: { silent?: boolean }) => {
    const type = form.transactionType || 'Inward';
    const inwardQty = parseFloat(form.inwardQty || '0');
    const outwardQty = parseFloat(form.outwardQty || '0');
    const qty = (type === 'Inward' || type === 'Return') ? inwardQty : outwardQty;
    const price = parseFloat(form.pricePerItem || '0');
    const disc = parseFloat(form.discountPct || '0');
    const gst = parseFloat(form.gstRate || '18');
    const taxable = qty * price * (1 - disc / 100);
    const cgst = (taxable * gst) / 200;
    const total = taxable + cgst * 2;
    
    let currentBalance = 0;
    const existingSummary = itemSummary.find(i => safeStr(i.name).toLowerCase() === safeStr(form.itemName).toLowerCase());
    if (existingSummary) {
      currentBalance = existingSummary.balance;
    }
    const nextBalance = (type === 'Inward' || type === 'Return') ? currentBalance + qty : currentBalance - qty;

    const maxNum = entries.reduce((max, e) => {
      const match = String(e.Entry_ID).match(/^ENT-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const nextId = 'ENT-' + String(maxNum + 1).padStart(4, '0');

    const rowData: Record<string, string> = {
      Entry_ID: nextId,
      Date_Time: form.dateTime || new Date().toLocaleString(),
      Item_Name: form.itemName,
      Item_Code: form.itemCode || 'N/A',
      HSN_Code: form.hsnCode || '',
      Location: form.location || 'Default',
      Transaction_Type: type,
      Inward_Qty: (type === 'Inward' || type === 'Return') ? String(qty) : '0',
      Outward_Qty: type === 'Outward' ? String(qty) : '0',
      Invoice_No: form.invoiceNo || '',
      Invoice_Date: form.invoiceDate || '',
      GRN_No: form.grnNo || '',
      Vendor_Name: form.vendorName || '',
      Price_Per_Item: String(price),
      Discount_Pct: String(disc),
      Taxable_Value: taxable.toFixed(2),
      GST_Rate: String(gst),
      CGST_Amt: cgst.toFixed(2),
      SGST_Amt: cgst.toFixed(2),
      Total_Invoice_Value: total.toFixed(2),
      Issued_To: form.issuedTo || '',
      Balance_Qty: String(nextBalance),
      Employee_Name: form.receivedBy || 'Admin',
      Received_By: form.receivedBy || 'Admin',
      Remarks: form.remarks || '',
      SO_Invoice_No: '',
      SO_Invoice_Date: '',
      Out_Price_Per_Item: '',
      Out_Taxable_Value: '',
      Out_GST_Rate: '',
      Out_CGST_Amt: '',
      Out_SGST_Amt: '',
      Out_Total_Invoice_Value: ''
    };

    try {
      // Optimistic cache update
      await updateLocalCache('Stock_Register', rowData, 'Entry_ID');

      addSystemLog(type === 'Inward' ? 'INWARD_ENTRY' : type === 'Return' ? 'RETURN_ENTRY' : 'OUTWARD_ENTRY', `${form.itemName} × ${qty}`);
      if (!opts?.silent) toast({ title: 'Success', description: `${type} entry added for ${form.itemName}.` });

      // Queue network write
      const description = `Add ${type} entry for ${form.itemName} (ID: ${nextId})`;
      queueWrite(
        () => postSheetRow('Stock_Register', rowData),
        description,
        { type: 'postRow', tabName: 'Stock_Register', rowData }
      ).catch(err => console.error("Failed to queue Stock_Register write:", err));

      return { success: true, entryId: nextId };
    } catch (err: any) {
      if (!opts?.silent) toast({
        title: 'Error',
        description: 'Failed to update local state: ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [entries, itemSummary, toast]);

  const saveInwardBatch = useCallback(async (payload: any) => {
    try {
      const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
      if (!urlStr) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');
      
      const res = await fetch(urlStr, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveInwardBatch',
          token: localStorage.getItem('sicca_token') || '',
          ...payload
        })
      });
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const json = await res.json();
      if (!json || json.success === false) {
        throw new Error(json?.error || 'Failed to save batch');
      }
      return { success: true };
    } catch (err: any) {
      console.error('saveInwardBatch failed:', err);
      toast({
        title: 'Network Error',
        description: 'Failed to write to Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const deleteEntry = useCallback(async (entryId: string) => {
    const entryToDelete = entries.find(e => e.Entry_ID === entryId);
    if (!entryToDelete) return { success: false, error: 'Entry not found' };

    const newBinItem: RecycleItem = {
      Bin_ID: 'BIN-' + Date.now(),
      Original_ID: entryToDelete.Entry_ID,
      Type: 'Stock Entry',
      Item_Name: `${entryToDelete.Item_Name} (${entryToDelete.Transaction_Type} of ${entryToDelete.Transaction_Type === 'Inward' ? entryToDelete.Inward_Qty : entryToDelete.Outward_Qty})`,
      Deleted_By: 'Admin',
      Date_Time: new Date().toLocaleString()
    };

    try {
      await filterLocalCache('Stock_Register', e => e.Entry_ID !== entryId);
      await updateLocalCache('Recycle_Bin', newBinItem, 'Bin_ID');

      if (isClient) {
        const backups = getStored<Record<string, any>>('sicca_entry_backups', {});
        backups[newBinItem.Bin_ID] = entryToDelete;
        setStored('sicca_entry_backups', backups);
      }

      addSystemLog('DELETE_ENTRY', `${entryToDelete.Item_Name} stock entry deleted`);
      toast({ title: 'Deleted', description: 'Stock entry moved to Recovery Vault.' });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete entry: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [entries, toast]);

  return {
    entries,
    items: itemSummary,
    addEntry,
    saveInwardBatch,
    deleteEntry,
    loading,
    refresh: () => {
      fullSync().catch(err => console.error("Sync failed on refresh:", err));
    }
  };
}

// 2. DASHBOARD HOOK
export function useDashboardStats() {
  const { entries, items, loading: loadingEntries } = useInventoryEntries();
  const { vendors, loading: loadingVendors } = useVendors();
  const { users, loading: loadingUsers } = useUsers();

  const totalItems = items.length;
  const lowStock = items.filter(i => i.status === 'Low').length;
  const outOfStock = items.filter(i => i.status === 'Out of Stock').length;
  const todayCount = entries.filter(e => {
    const todayStr = new Date().toLocaleDateString('en-IN');
    return e.Date_Time.includes(todayStr) || e.Date_Time.includes('03-07-2026');
  }).length;

  const loading = loadingEntries || loadingVendors || loadingUsers;

  return {
    stats: {
      totalItems,
      lowStock,
      outOfStock,
      todayCount,
      recentEntries: entries.slice(0, 5),
      items
    },
    totalVendors: vendors.length,
    totalUsers: users.length,
    loading,
    refresh: () => {
      fullSync().catch(err => console.error("Sync failed on refresh:", err));
    }
  };
}

// 3. USERS HOOK
export function useUsers() {
  const [users, setUsers, loading] = useSyncTabState<User>('Users', DEMO_USERS, data => data.filter(u => u.Status !== 'Deleted'));
  const { toast } = useToast();

  const addUser = useCallback(async (form: any) => {
    const maxNum = users.reduce((max, u) => {
      const match = String(u.User_ID).match(/^USR-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const id = 'USR-' + String(maxNum + 1).padStart(4, '0');
    const newUser: Record<string, any> = {
      User_ID: id, Full_Name: form.fullName, Email: form.email,
      Role: form.role || 'Viewer', Status: 'Active',
      Department: form.department || '', Employee_ID: form.employeeId || '',
      Display_Name: form.fullName, Phone: form.phone || '',
      Verified: 'YES', Photo_URL: form.photoUrl || '',
      Permissions: JSON.stringify(form.permissions || {}),
      Created_On: new Date().toLocaleString()
    };

    try {
      await updateLocalCache('Users', newUser, 'User_ID');

      addSystemLog('CREATE_USER', `${newUser.Full_Name} created`);
      toast({ title: 'Success', description: `User ${newUser.Full_Name} created successfully.` });

      // Queue write
      const description = `Create User ${newUser.Full_Name}`;
      queueWrite(
        () => postSheetRow('Users', newUser),
        description,
        { type: 'postRow', tabName: 'Users', rowData: newUser }
      ).catch(err => console.error("Failed to queue Users write:", err));

      return { success: true, userId: id };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update local state: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [users, toast]);

  const updateUser = useCallback(async (userId: string, form: any) => {
    const existing: any = users.find(u => u.User_ID === userId);
    const updated: Record<string, any> = {
      User_ID: userId,
      Full_Name: form.fullName || existing?.Full_Name || '',
      Email: form.email || existing?.Email || '',
      Role: form.role || existing?.Role || 'Viewer',
      Department: form.department !== undefined ? form.department : existing?.Department || '',
      Employee_ID: form.employeeId !== undefined ? form.employeeId : existing?.Employee_ID || '',
      Display_Name: form.fullName || existing?.Display_Name || existing?.Full_Name || '',
      Phone: form.phone !== undefined ? form.phone : existing?.Phone || '',
      Status: form.status || existing?.Status || 'Active',
      Verified: form.verified !== undefined ? form.verified : existing?.Verified || 'NO',
      Photo_URL: form.photoUrl !== undefined ? form.photoUrl : existing?.Photo_URL || '',
      Permissions: form.permissions !== undefined ? JSON.stringify(form.permissions) : existing?.Permissions || '{}',
      Created_On: existing?.Created_On || new Date().toLocaleString()
    };

    try {
      await updateLocalCache('Users', updated, 'User_ID');

      addSystemLog('UPDATE_USER', `User ID ${userId} updated`);
      toast({ title: 'Updated', description: 'User account updated.' });

      // Queue write
      const description = `Update User ${updated.Full_Name}`;
      queueWrite(
        () => postSheetRow('Users', updated),
        description,
        { type: 'postRow', tabName: 'Users', rowData: updated }
      ).catch(err => console.error("Failed to queue User update:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update local state: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [users, toast]);

  const deleteUser = useCallback(async (userId: string, cascade = false) => {
    const userToDelete = users.find(u => u.User_ID === userId);
    if (!userToDelete) return { success: false };

    const deletedUser = { ...userToDelete, Status: 'Deleted' };

    try {
      // 1. Update Users cache
      await updateLocalCache('Users', deletedUser, 'User_ID');

      // 2. Add to Recycle Bin
      const newBinItem: RecycleItem = {
        Bin_ID: 'BIN-' + Date.now(),
        Original_ID: userToDelete.User_ID,
        Type: 'User',
        Item_Name: `User: ${userToDelete.Full_Name} (${userToDelete.Email})`,
        Deleted_By: 'Admin',
        Date_Time: new Date().toLocaleString()
      };
      await updateLocalCache('Recycle_Bin', newBinItem, 'Bin_ID');

      if (isClient) {
        const backups = getStored<Record<string, any>>('sicca_user_backups', {});
        backups[newBinItem.Bin_ID] = userToDelete;
        setStored('sicca_user_backups', backups);
      }

      // Queue User deletion write
      queueWrite(
        () => postSheetRow('Users', deletedUser),
        `Delete User ${userToDelete.Full_Name}`,
        { type: 'postRow', tabName: 'Users', rowData: deletedUser }
      ).catch(err => console.error("Failed to queue User delete:", err));

      if (cascade) {
        const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;

        // Cascade delete Stock Register entries
        const cachedEntries = await getCached('Stock_Register');
        const rawEntries = cachedEntries?.data || [];
        const affectedEntries = rawEntries.filter(e =>
          safeStr(e.Employee_Name).toLowerCase() === safeStr(userToDelete.Full_Name).toLowerCase() ||
          safeStr(e.Issued_To).toLowerCase() === safeStr(userToDelete.Full_Name).toLowerCase()
        );
        const remainingEntries = rawEntries.filter(e =>
          safeStr(e.Employee_Name).toLowerCase() !== safeStr(userToDelete.Full_Name).toLowerCase() &&
          safeStr(e.Issued_To).toLowerCase() !== safeStr(userToDelete.Full_Name).toLowerCase()
        );
        await idbSet('Stock_Register', { data: remainingEntries, syncedAt: Date.now() });
        window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Stock_Register', data: remainingEntries } }));

        if (urlStr) {
          for (const entry of affectedEntries) {
            queueWrite(
              () => fetch(urlStr, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                  action: 'deleteEntry',
                  entryId: entry.Entry_ID,
                  token: localStorage.getItem('sicca_token') || ''
                })
              }).then(res => res.json()),
              `Cascade delete entry ${entry.Entry_ID}`
            ).catch(err => console.warn('Backend entry cascade delete failed:', err));
          }
        }

        // Cascade delete tasks
        const cachedTasks = await getCached('Tasks');
        const rawTasks = cachedTasks?.data || [];
        const affectedTasks = rawTasks.filter(t => t.Assigned_To_User_ID === userId);
        const remainingTasks = rawTasks.filter(t => t.Assigned_To_User_ID !== userId);
        await idbSet('Tasks', { data: remainingTasks, syncedAt: Date.now() });
        window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Tasks', data: remainingTasks } }));

        if (urlStr) {
          for (const task of affectedTasks) {
            queueWrite(
              () => fetch(urlStr, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                  action: 'updateTaskStatus',
                  taskId: task.Task_ID,
                  status: 'Deleted',
                  token: localStorage.getItem('sicca_token') || ''
                })
              }).then(res => res.json()),
              `Cascade delete task ${task.Task_ID}`
            ).catch(err => console.warn('Backend task cascade delete failed:', err));
          }
        }

        addSystemLog('DELETE_USER_CASCADE', `${userToDelete.Full_Name} deleted with cascade (removed ${affectedEntries.length} entries, ${affectedTasks.length} tasks)`);
        toast({ title: 'Deleted', description: `User removed with cascade deletion of associated transactions and tasks.` });
      } else {
        addSystemLog('DELETE_USER', `${userToDelete.Full_Name} deleted (retained history)`);
        toast({ title: 'Deleted', description: 'User moved to Recovery Vault.' });
      }

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete user: ' + err.message, variant: 'destructive' });
      return { success: false };
    }
  }, [users, toast]);

  const toggleUserStatus = useCallback(async (userId: string, status: string) => {
    const userToToggle = users.find(u => u.User_ID === userId);
    if (!userToToggle) return { success: false };
    const updated = { ...userToToggle, Status: status as any };

    try {
      await updateLocalCache('Users', updated, 'User_ID');

      // Queue write
      queueWrite(
        () => postSheetRow('Users', updated),
        `Toggle User ${userToToggle.Full_Name} status to ${status}`,
        { type: 'postRow', tabName: 'Users', rowData: updated }
      ).catch(err => console.error("Failed to queue user toggle:", err));

      return { success: true };
    } catch (err: any) {
      console.error(err);
      return { success: false };
    }
  }, [users]);

  return {
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    loading,
    refresh: () => {
      fullSync().catch(err => console.error("Sync failed on refresh:", err));
    }
  };
}

// 4. ROLES HOOK
export function useRoles() {
  const [roles, setRoles, loading] = useSyncTabState<Role>('Roles', DEMO_ROLES, data => data.filter(r => r.Status !== 'Deleted'));
  const { toast } = useToast();

  const addRole = useCallback(async (form: any) => {
    const newRole: Role & { Status?: string } = {
      Role_ID: 'ROL-' + Date.now().toString().slice(-4),
      Name: form.name,
      Description: form.description || '',
      Permissions: JSON.stringify(form.permissions || {}),
      Created_On: new Date().toLocaleDateString('en-IN'),
      Status: 'Active'
    };

    try {
      await updateLocalCache('Roles', newRole, 'Role_ID');

      addSystemLog('CREATE_ROLE', `Role ${newRole.Name} created`);
      toast({ title: 'Success', description: `Role ${newRole.Name} created.` });

      // Queue write
      queueWrite(
        () => postSheetRow('Roles', newRole),
        `Add Role ${newRole.Name}`,
        { type: 'postRow', tabName: 'Roles', rowData: newRole }
      ).catch(err => console.error("Failed to queue Roles write:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to add role: ' + err.message, variant: 'destructive' });
      return { success: false };
    }
  }, [toast]);

  const updateRole = useCallback(async (roleId: string, form: any) => {
    const existing = roles.find(r => r.Role_ID === roleId);
    const updated: Role & { Status?: string } = {
      Role_ID: roleId,
      Name: form.name || existing?.Name || '',
      Description: form.description || existing?.Description || '',
      Permissions: JSON.stringify(form.permissions || {}),
      Created_On: existing?.Created_On || new Date().toLocaleDateString('en-IN'),
      Status: 'Active'
    };

    try {
      await updateLocalCache('Roles', updated, 'Role_ID');

      addSystemLog('UPDATE_ROLE', `Role ID ${roleId} updated`);
      toast({ title: 'Updated', description: 'Role permissions saved.' });

      // Queue write
      queueWrite(
        () => postSheetRow('Roles', updated),
        `Update Role ID ${roleId}`,
        { type: 'postRow', tabName: 'Roles', rowData: updated }
      ).catch(err => console.error("Failed to queue Roles update:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update role: ' + err.message, variant: 'destructive' });
      return { success: false };
    }
  }, [roles, toast]);

  const deleteRole = useCallback(async (roleId: string) => {
    const roleToDelete = roles.find(r => r.Role_ID === roleId);
    if (!roleToDelete) return { success: false };

    const deleted = { ...roleToDelete, Status: 'Deleted' };

    try {
      await updateLocalCache('Roles', deleted, 'Role_ID');

      addSystemLog('DELETE_ROLE', `${roleToDelete.Name} role deleted`);
      toast({ title: 'Deleted', description: `Role "${roleToDelete.Name}" deleted.` });

      // Queue write
      queueWrite(
        () => postSheetRow('Roles', deleted),
        `Delete Role ID ${roleId}`,
        { type: 'postRow', tabName: 'Roles', rowData: deleted }
      ).catch(err => console.error("Failed to queue Roles delete:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete role: ' + err.message, variant: 'destructive' });
      return { success: false };
    }
  }, [roles, toast]);

  return {
    roles,
    addRole,
    updateRole,
    deleteRole,
    loading,
    refresh: () => {
      fullSync().catch(err => console.error("Sync failed on refresh:", err));
    }
  };
}

// 5. NOTICE BOARD HOOK
export function useNoticeBoard() {
  const [notices, setNotices, loading] = useSyncTabState<Notice>('Notice_Board', DEMO_NOTICES, data => [...data].reverse());
  const { toast } = useToast();

  const addNotice = useCallback(async (form: any) => {
    const newNotice: Notice = {
      Notice_ID: String(Date.now()),
      Title: form.title,
      Content: form.content,
      Priority: form.priority || 'info',
      Posted_By: form.author || 'Admin',
      Date_Time: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      Expiry: form.expiry || ''
    };

    try {
      await updateLocalCache('Notice_Board', newNotice, 'Notice_ID');

      const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
      if (!urlStr) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');

      queueWrite(
        () => fetch(urlStr, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'createNotice',
            title: form.title,
            content: form.content,
            priority: form.priority || 'info',
            expiry: form.expiry || '',
            taggedUsers: form.taggedUsers || [],
            token: localStorage.getItem('sicca_token') || ''
          })
        }).then(res => res.json()),
        `Create notice: ${form.title}`
      ).catch(err => console.error("Failed to queue createNotice:", err));

      toast({ title: 'Posted', description: 'Announcement published to board.' });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to add notice: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const deleteNotice = useCallback(async (noticeId: string) => {
    try {
      await filterLocalCache('Notice_Board', n => n.Notice_ID !== noticeId);

      const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
      if (!urlStr) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');

      queueWrite(
        () => fetch(urlStr, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'deleteNotice',
            noticeId,
            token: localStorage.getItem('sicca_token') || ''
          })
        }).then(res => res.json()),
        `Delete notice ID ${noticeId}`
      ).catch(err => console.error("Failed to queue deleteNotice:", err));

      toast({ title: 'Removed', description: 'Notice deleted.' });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete notice: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [toast]);

  return {
    notices,
    addNotice,
    deleteNotice,
    loading,
    refresh: () => {
      fullSync().catch(err => console.error("Sync failed on refresh:", err));
    }
  };
}

// 6. RECYCLE BIN HOOK
export function useRecycleBin() {
  const [recycleBin, setRecycleBin, loading] = useSyncTabState<RecycleItem>('Recycle_Bin', DEMO_RECYCLE_BIN);
  const { toast } = useToast();

  const restoreItem = useCallback(async (binId: string) => {
    const item = recycleBin.find(i => i.Bin_ID === binId);
    if (!item) return { success: false };

    try {
      // 1. Remove from Recycle_Bin
      await filterLocalCache('Recycle_Bin', i => i.Bin_ID !== binId);

      // Find original backup and restore
      if (isClient) {
        if (item.Type === 'Stock Entry') {
          const backups = getStored<Record<string, any>>('sicca_entry_backups', {});
          const original = backups[binId];
          if (original) {
            await updateLocalCache('Stock_Register', original, 'Entry_ID');
            queueWrite(
              () => postSheetRow('Stock_Register', original),
              `Restore stock entry ${original.Entry_ID}`,
              { type: 'postRow', tabName: 'Stock_Register', rowData: original }
            ).catch(err => console.error("Failed to queue Stock_Register restore:", err));
            delete backups[binId];
            setStored('sicca_entry_backups', backups);
          }
        } else if (item.Type === 'User') {
          const backups = getStored<Record<string, any>>('sicca_user_backups', {});
          const original = backups[binId];
          if (original) {
            const restored = { ...original, Status: original.Status || 'Active' };
            await updateLocalCache('Users', restored, 'User_ID');
            queueWrite(
              () => postSheetRow('Users', restored),
              `Restore user ${restored.Full_Name}`,
              { type: 'postRow', tabName: 'Users', rowData: restored }
            ).catch(err => console.error("Failed to queue Users restore:", err));
            delete backups[binId];
            setStored('sicca_user_backups', backups);
          }
        } else if (item.Type === 'Vendor') {
          const backups = getStored<Record<string, any>>('sicca_vendor_backups', {});
          const original = backups[binId];
          if (original) {
            const restored = { ...original, Status: 'Active' };
            await updateLocalCache('Vendors', restored, 'Vendor_ID');
            queueWrite(
              () => postSheetRow('Vendors', restored),
              `Restore vendor ${restored.Vendor_Name}`,
              { type: 'postRow', tabName: 'Vendors', rowData: restored }
            ).catch(err => console.error("Failed to queue Vendors restore:", err));
            delete backups[binId];
            setStored('sicca_vendor_backups', backups);
          }
        } else if (item.Type === 'Item Master') {
          const backups = getStored<Record<string, any>>('sicca_item_master_backups', {});
          const original = backups[binId];
          if (original) {
            const restored = { ...original, Status: 'Active' };
            await updateLocalCache('Item_Master', restored, 'Item_ID');
            queueWrite(
              () => postSheetRow('Item_Master', restored),
              `Restore item ${restored.Item_Name}`,
              { type: 'postRow', tabName: 'Item_Master', rowData: restored }
            ).catch(err => console.error("Failed to queue Item_Master restore:", err));
            delete backups[binId];
            setStored('sicca_item_master_backups', backups);
          }
        } else if (item.Type === 'Cupboard') {
          const backups = getStored<Record<string, any>>('sicca_cupboard_backups', {});
          const original = backups[binId];
          if (original) {
            const restored = { ...original, Status: 'Active' };
            await updateLocalCache('Cupboards', restored, 'Cupboard_ID');
            queueWrite(
              () => postSheetRow('Cupboards', restored),
              `Restore cupboard ${restored.Cupboard_Number}`,
              { type: 'postRow', tabName: 'Cupboards', rowData: restored }
            ).catch(err => console.error("Failed to queue Cupboards restore:", err));
            delete backups[binId];
            setStored('sicca_cupboard_backups', backups);
          }
        } else if (item.Type === 'Box') {
          const backups = getStored<Record<string, any>>('sicca_box_backups', {});
          const original = backups[binId];
          if (original) {
            const restoredBox = { ...original, Status: 'Active' };
            await updateLocalCache('Boxes', restoredBox, 'Box_ID');
            queueWrite(
              () => postSheetRow('Boxes', restoredBox),
              `Restore box ${restoredBox.Box_Name}`,
              { type: 'postRow', tabName: 'Boxes', rowData: restoredBox }
            ).catch(err => console.error("Failed to queue Boxes restore:", err));

            // Restore placements in box
            const placementsBackup = backups[binId + '_placements'] || [];
            const cachedPlc = await getCached('Placements');
            let rawPlc = cachedPlc?.data || [];
            for (const p of placementsBackup) {
              rawPlc = updateRawData(rawPlc, p, 'Placement_ID');
              queueWrite(
                () => postSheetRow('Placements', p),
                `Restore placement ${p.Placement_ID} for Box ${restoredBox.Box_Name}`,
                { type: 'postRow', tabName: 'Placements', rowData: p }
              ).catch(err => console.error("Failed to queue Placement restore write:", err));
            }
            await idbSet('Placements', { data: rawPlc, syncedAt: Date.now() });
            window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Placements', data: rawPlc } }));

            delete backups[binId];
            delete backups[binId + '_placements'];
            setStored('sicca_box_backups', backups);
          }
        }
      }

      toast({ title: 'Restored', description: `${item.Item_Name} restored.` });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to restore item: ' + err.message, variant: 'destructive' });
      return { success: false };
    }
  }, [recycleBin, toast]);

  const emptyBin = useCallback(async () => {
    try {
      await idbSet('Recycle_Bin', { data: [], syncedAt: Date.now() });
      window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Recycle_Bin', data: [] } }));

      if (isClient) {
        setStored('sicca_entry_backups', {});
        setStored('sicca_user_backups', {});
        setStored('sicca_vendor_backups', {});
        setStored('sicca_item_master_backups', {});
        setStored('sicca_box_backups', {});
      }
      toast({ title: 'Recovery Vault Emptied', description: 'All items deleted permanently.' });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to empty bin: ' + err.message, variant: 'destructive' });
      return { success: false };
    }
  }, [toast]);

  return {
    items: recycleBin,
    restoreItem,
    emptyBin,
    refresh: () => {}
  };
}

// 7. ACTIVITY LOG HOOK
export function useActivityLog() {
  const [logs, , loading] = useSyncTabState<ActivityLog>('Activity_Log', DEMO_ACTIVITY_LOG);
  return {
    logs,
    refresh: () => {}
  };
}

// 8. VENDORS HOOK
export function useVendors() {
  const [vendors, setVendors, loading] = useSyncTabState<Vendor>('Vendors', DEMO_VENDORS, data => data.filter(v => v.Status !== 'Deleted'));
  const { toast } = useToast();

  const addVendor = useCallback(async (form: any) => {
    const maxNum = vendors.reduce((max, v) => {
      const match = String(v.Vendor_ID).match(/^VND-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const id = 'VND-' + String(maxNum + 1).padStart(4, '0');
    const newVendor: Record<string, any> = {
      Vendor_ID: id, Vendor_Name: form.vendorName,
      Contact_Person: form.contactPerson || '', Phone: form.phone || '',
      Email: form.email || '', Address: form.address || '', GSTIN: form.gstin || '',
      Category: form.category || 'Other', Status: 'Active',
      Created_On: new Date().toLocaleString(), Notes: form.notes || ''
    };

    try {
      await updateLocalCache('Vendors', newVendor, 'Vendor_ID');

      addSystemLog('CREATE_VENDOR', `Vendor "${newVendor.Vendor_Name}" added`);
      toast({ title: 'Success', description: `Vendor ${newVendor.Vendor_Name} added.` });

      // Queue network write
      queueWrite(
        () => postSheetRow('Vendors', newVendor),
        `Add vendor "${newVendor.Vendor_Name}" (ID: ${id})`,
        { type: 'postRow', tabName: 'Vendors', rowData: newVendor }
      ).catch(err => console.error("Failed to queue Vendors write:", err));

      return { success: true, vendorId: id };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update local state: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [vendors, toast]);

  const updateVendor = useCallback(async (vendorId: string, form: any) => {
    const existing: any = vendors.find(v => v.Vendor_ID === vendorId);
    const updated: Record<string, any> = {
      Vendor_ID: vendorId,
      Vendor_Name: form.vendorName || existing?.Vendor_Name || '',
      Contact_Person: form.contactPerson || existing?.Contact_Person || '',
      Phone: form.phone || existing?.Phone || '',
      Email: form.email || existing?.Email || '',
      Address: form.address || existing?.Address || '',
      GSTIN: form.gstin || existing?.GSTIN || '',
      Category: form.category || existing?.Category || 'Other',
      Status: existing?.Status || 'Active',
      Created_On: existing?.Created_On || new Date().toLocaleString(),
      Notes: form.notes || existing?.Notes || ''
    };

    try {
      await updateLocalCache('Vendors', updated, 'Vendor_ID');

      addSystemLog('UPDATE_VENDOR', `Vendor ID ${vendorId} updated`);
      toast({ title: 'Updated', description: 'Vendor details updated.' });

      // Queue network write
      queueWrite(
        () => postSheetRow('Vendors', updated),
        `Update vendor ID ${vendorId}`,
        { type: 'postRow', tabName: 'Vendors', rowData: updated }
      ).catch(err => console.error("Failed to queue Vendors update:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update local state: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [vendors, toast]);

  const deleteVendor = useCallback(async (vendorId: string) => {
    const vendorToDelete = vendors.find(v => v.Vendor_ID === vendorId);
    if (!vendorToDelete) return { success: false };

    const newBinItem: RecycleItem = {
      Bin_ID: 'BIN-' + Date.now(),
      Original_ID: vendorToDelete.Vendor_ID,
      Type: 'Vendor',
      Item_Name: `Vendor: ${vendorToDelete.Vendor_Name}`,
      Deleted_By: 'Admin',
      Date_Time: new Date().toLocaleString()
    };

    const deleted: Record<string, any> = { ...vendorToDelete, Status: 'Deleted' };

    try {
      await updateLocalCache('Vendors', deleted, 'Vendor_ID');
      await updateLocalCache('Recycle_Bin', newBinItem, 'Bin_ID');

      if (isClient) {
        const backups = getStored<Record<string, any>>('sicca_vendor_backups', {});
        backups[newBinItem.Bin_ID] = vendorToDelete;
        setStored('sicca_vendor_backups', backups);
      }

      addSystemLog('DELETE_VENDOR', `Vendor "${vendorToDelete.Vendor_Name}" deleted`);
      toast({ title: 'Deleted', description: 'Vendor moved to Recovery Vault.' });

      // Queue soft delete
      queueWrite(
        () => postSheetRow('Vendors', deleted),
        `Delete vendor ID ${vendorId}`,
        { type: 'postRow', tabName: 'Vendors', rowData: deleted }
      ).catch(err => console.error("Failed to queue Vendors delete:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete vendor: ' + err.message, variant: 'destructive' });
      return { success: false };
    }
  }, [vendors, toast]);

  return {
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    loading,
    refresh: () => {
      fullSync().catch(err => console.error("Sync failed on refresh:", err));
    }
  };
}

// 9. ITEM MASTER HOOK
export function useItemMaster() {
  const [rawItems, setRawItems, loading] = useSyncTabState<ItemMaster>('Item_Master', DEMO_ITEM_MASTER);
  const { toast } = useToast();

  const items = useMemo(() => {
    // Deduplicate: take the latest entry by Item_ID
    const itemMap = new Map<string, ItemMaster>();
    rawItems.forEach((i: any) => {
      if (i.Item_ID) {
        itemMap.set(i.Item_ID, i);
      }
    });
    return Array.from(itemMap.values()).filter(i => i.Status !== 'Deleted' && i.Status !== 'Pending Review');
  }, [rawItems]);

  const pendingItems = useMemo(() => {
    const itemMap = new Map<string, ItemMaster>();
    rawItems.forEach((i: any) => {
      if (i.Item_ID) {
        itemMap.set(i.Item_ID, i);
      }
    });
    return Array.from(itemMap.values()).filter(i => i.Status === 'Pending Review');
  }, [rawItems]);

  const addItem = useCallback(async (form: any) => {
    const maxNum = items.reduce((max, i) => {
      const match = String(i.Item_ID).match(/^ITM-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const id = 'ITM-' + String(maxNum + 1).padStart(4, '0');
    const newItem: ItemMaster = {
      Item_ID: id,
      Item_Name: form.itemName,
      Item_Code: form.itemCode || id,
      HSN_Code: form.hsnCode || '',
      Category: form.category || 'Other',
      Unit: form.unit || 'pcs',
      Min_Stock: String(form.minStock || '0'),
      Max_Stock: form.maxStock ? String(form.maxStock) : '',
      Reorder_Level: String(form.reorderLevel || '0'),
      Location: form.location || 'Default',
      Image_URL: '',
      Description: form.description || '',
      Status: (form.status || 'Active') as any,
      Created_On: new Date().toLocaleString(),
      Last_Updated: new Date().toLocaleString()
    };

    try {
      await updateLocalCache('Item_Master', newItem, 'Item_ID');

      addSystemLog('CREATE_ITEM_MASTER', `Item "${form.itemName}" catalogued (Status: ${newItem.Status})`);
      toast({ title: 'Success', description: `Item "${form.itemName}" catalogued.` });

      // Queue network write
      const description = `Add item "${form.itemName}" (ID: ${id})`;
      queueWrite(
        () => postSheetRow('Item_Master', newItem),
        description,
        { type: 'postRow', tabName: 'Item_Master', rowData: newItem }
      ).catch(err => console.error("Failed to queue Item_Master write:", err));

      return { success: true, itemId: id, itemCode: newItem.Item_Code as string };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update local state: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [items, toast]);

  const updateItem = useCallback(async (itemId: string, form: any) => {
    const existing = items.find(i => i.Item_ID === itemId);
    const updatedItem: Record<string, any> = {
      Item_ID: itemId,
      Item_Name: form.itemName || existing?.Item_Name || '',
      Item_Code: form.itemCode || existing?.Item_Code || 'N/A',
      HSN_Code: form.hsnCode || existing?.HSN_Code || '',
      Category: form.category || existing?.Category || 'Other',
      Unit: form.unit || existing?.Unit || 'pcs',
      Min_Stock: String(form.minStock !== undefined ? form.minStock : existing?.Min_Stock || '0'),
      Max_Stock: String(form.maxStock !== undefined ? form.maxStock : existing?.Max_Stock || '0'),
      Reorder_Level: String(form.reorderLevel !== undefined ? form.reorderLevel : existing?.Reorder_Level || '0'),
      Location: form.location || existing?.Location || 'Default',
      Image_URL: existing?.Image_URL || '',
      Description: form.description || existing?.Description || '',
      Status: 'Active',
      Created_On: existing?.Created_On || new Date().toLocaleString(),
      Last_Updated: new Date().toLocaleString()
    };

    try {
      await updateLocalCache('Item_Master', updatedItem, 'Item_ID');

      addSystemLog('UPDATE_ITEM_MASTER', `Item ID ${itemId} updated`);
      toast({ title: 'Updated', description: 'Item master catalog updated.' });

      // Queue network write
      const description = `Update item ID ${itemId}`;
      queueWrite(
        () => postSheetRow('Item_Master', updatedItem),
        description,
        { type: 'postRow', tabName: 'Item_Master', rowData: updatedItem }
      ).catch(err => console.error("Failed to queue Item_Master update:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update local state: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [items, toast]);

  const deleteItem = useCallback(async (itemId: string) => {
    const existing = items.find(i => i.Item_ID === itemId);
    if (!existing) return { success: false, error: 'Item not found' };

    const deletedItem: Record<string, any> = {
      Item_ID: existing.Item_ID,
      Item_Name: existing.Item_Name,
      Item_Code: existing.Item_Code || 'N/A',
      HSN_Code: existing.HSN_Code || '',
      Category: existing.Category || 'Other',
      Unit: existing.Unit || 'pcs',
      Min_Stock: existing.Min_Stock || '0',
      Max_Stock: existing.Max_Stock || '0',
      Reorder_Level: existing.Reorder_Level || '0',
      Location: existing.Location || 'Default',
      Image_URL: existing.Image_URL || '',
      Description: existing.Description || '',
      Status: 'Deleted',
      Created_On: existing.Created_On || new Date().toLocaleString(),
      Last_Updated: new Date().toLocaleString()
    };

    try {
      await updateLocalCache('Item_Master', deletedItem, 'Item_ID');

      addSystemLog('DELETE_ITEM_MASTER', `Item "${existing.Item_Name}" deleted`);
      toast({ title: 'Deleted', description: 'Item removed from catalogue.' });

      // Queue network write
      const description = `Delete item ID ${itemId}`;
      queueWrite(
        () => postSheetRow('Item_Master', deletedItem),
        description,
        { type: 'postRow', tabName: 'Item_Master', rowData: deletedItem }
      ).catch(err => console.error("Failed to queue Item_Master delete:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete item: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [items, toast]);

  const approveItem = useCallback(async (itemId: string) => {
    const item = items.find(i => i.Item_ID === itemId) || (pendingItems.find(p => p.Item_ID === itemId));
    if (!item) return { success: false, error: 'Item not found' };
    const updated: ItemMaster = { ...item, Status: 'Active', Last_Updated: new Date().toLocaleString() };
    try {
      await updateLocalCache('Item_Master', updated, 'Item_ID');

      addSystemLog('APPROVE_ITEM', `Pending item "${item.Item_Name}" approved`);
      toast({ title: 'Approved', description: `Item "${item.Item_Name}" approved and added to catalog.` });

      // Queue network write
      const description = `Approve item ID ${itemId}`;
      queueWrite(
        () => postSheetRow('Item_Master', updated),
        description,
        { type: 'postRow', tabName: 'Item_Master', rowData: updated }
      ).catch(err => console.error("Failed to queue Item_Master approval:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to approve item: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [items, pendingItems, toast]);

  const rejectItem = useCallback(async (itemId: string, mapToItemCode?: string) => {
    const item = items.find(i => i.Item_ID === itemId) || (pendingItems.find(p => p.Item_ID === itemId));
    if (!item) return { success: false, error: 'Item not found' };
    const updated: ItemMaster = { ...item, Status: 'Deleted', Last_Updated: new Date().toLocaleString() };
    
    try {
      await updateLocalCache('Item_Master', updated, 'Item_ID');

      // Queue network write
      queueWrite(
        () => postSheetRow('Item_Master', updated),
        `Reject item ID ${itemId}`,
        { type: 'postRow', tabName: 'Item_Master', rowData: updated }
      ).catch(err => console.error("Failed to queue Item_Master reject:", err));

      if (mapToItemCode) {
        const existingItem = items.find(i => i.Item_Code === mapToItemCode);
        if (existingItem) {
          // 1. Update entries in Stock_Register
          const cachedEntries = await getCached('Stock_Register');
          const rawEntries = cachedEntries?.data || [];
          const matchingEntries = rawEntries.filter((e: any) => e.Item_Code === item.Item_Code);
          let nextEntries = [...rawEntries];
          for (const entry of matchingEntries) {
            const updatedEntry = {
              ...entry,
              Item_Code: existingItem.Item_Code,
              Item_Name: existingItem.Item_Name
            };
            nextEntries = updateRawData(nextEntries, updatedEntry, 'Entry_ID');
            queueWrite(
              () => postSheetRow('Stock_Register', updatedEntry),
              `Map Stock_Register entry ${entry.Entry_ID} to ${existingItem.Item_Code}`,
              { type: 'postRow', tabName: 'Stock_Register', rowData: updatedEntry }
            ).catch(err => console.error("Failed to queue Stock_Register mapping write:", err));
          }
          await idbSet('Stock_Register', { data: nextEntries, syncedAt: Date.now() });
          window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Stock_Register', data: nextEntries } }));

          // 2. Update placements in Placements
          const cachedPlacements = await getCached('Placements');
          const rawPlacements = cachedPlacements?.data || [];
          const matchingPlacements = rawPlacements.filter((p: any) => p.Item_Code === item.Item_Code);
          let nextPlacements = [...rawPlacements];
          for (const plc of matchingPlacements) {
            const updatedPlc = {
              ...plc,
              Item_Code: existingItem.Item_Code
            };
            nextPlacements = updateRawData(nextPlacements, updatedPlc, 'Placement_ID');
            queueWrite(
              () => postSheetRow('Placements', updatedPlc),
              `Map Placement ${plc.Placement_ID} to ${existingItem.Item_Code}`,
              { type: 'postRow', tabName: 'Placements', rowData: updatedPlc }
            ).catch(err => console.error("Failed to queue Placements mapping write:", err));
          }
          await idbSet('Placements', { data: nextPlacements, syncedAt: Date.now() });
          window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Placements', data: nextPlacements } }));

          toast({ title: 'Mapped', description: `Pending item mapped to "${existingItem.Item_Name}".` });
        }
      } else {
        toast({ title: 'Rejected', description: `Pending item "${item.Item_Name}" rejected and discarded.` });
      }

      addSystemLog('REJECT_ITEM', `Pending item "${item.Item_Name}" rejected`);
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to reject/map item: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [items, pendingItems, toast]);

  return {
    items,
    pendingItems,
    addItem,
    updateItem,
    deleteItem,
    approveItem,
    rejectItem,
    loading,
    refresh: () => {
      fullSync().catch(err => console.error("Sync failed on refresh:", err));
    }
  };
}

function processCupboardsAndItems(
  rawCups: any[] = [],
  rawCupboardItems: any[] = [],
  rawCatalog: any[] = [],
  rawEntries: any[] = []
) {
  const activeCups = rawCups.filter(c => c.Cupboard_ID && c.Status !== 'Deleted');
  const activeCatalog = rawCatalog.filter(i => i.Item_ID && i.Status !== 'Deleted');
  const activeItems = rawCupboardItems.filter(i => i.Item_ID && i.Status !== 'Deleted');

  const enrichedItems: CupItem[] = activeItems.map(item => {
    const matchedItem = activeCatalog.find(
      c => c.Item_Code === item.Item_Code || c.Item_ID === item.Item_Code
    );
    const liveQty = rawEntries.reduce((acc: number, entry: any) => {
      if (
        entry.Item_Code &&
        safeStr(entry.Item_Code).toLowerCase() === safeStr(item.Item_Code).toLowerCase()
      ) {
        const inQty = parseFloat(entry.Inward_Qty || '0');
        const outQty = parseFloat(entry.Outward_Qty || '0');
        return acc + (inQty - outQty);
      }
      return acc;
    }, 0);

    return {
      ...item,
      Item_Name: matchedItem ? matchedItem.Item_Name : 'Unknown Item',
      Category: matchedItem ? matchedItem.Category : 'Uncategorized',
      Unit: matchedItem ? matchedItem.Unit : 'pcs',
      Quantity: String(liveQty)
    };
  });

  const enrichedCups = activeCups.map(c => {
    const cItems = enrichedItems.filter(i => i.Cupboard_ID === c.Cupboard_ID);
    const qty = cItems.reduce((acc, curr) => acc + parseFloat(curr.Quantity || '0'), 0);
    const low = cItems.filter(curr => {
      const q = parseFloat(curr.Quantity || '0');
      const m = parseFloat(curr.Min_Qty || '0');
      return q <= m && q > 0;
    }).length;
    return {
      ...c,
      _itemCount: cItems.length,
      _totalQty: qty,
      _lowStock: low
    };
  });

  return { enrichedCups, enrichedItems };
}

// 10a. CUPBOARDS HOOK
export function useCupboards() {
  const [cupboards, setCupboards] = useState<Cupboard[]>([]);
  const [cupboardItems, setCupboardItems] = useState<CupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAll = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [c1, c2, c3, c4] = await Promise.all([
        getCached('Cupboards'),
        getCached('Cupboard_Items'),
        getCached('Item_Master'),
        getCached('Stock_Register')
      ]);
      
      let rawCups = c1?.data;
      let rawItems = c2?.data;
      let rawCatalog = c3?.data;
      let rawEntries = c4?.data;

      if (!rawCups || !rawItems || !rawCatalog || !rawEntries) {
        const [r1, r2, r3, r4] = await Promise.all([
          fetchSheetTab('database', 'Cupboards'),
          fetchSheetTab('database', 'Cupboard_Items'),
          fetchSheetTab('database', 'Item_Master'),
          fetchSheetTab('database', 'Stock_Register')
        ]);
        rawCups = r1;
        rawItems = r2;
        rawCatalog = r3;
        rawEntries = r4;
        await Promise.all([
          idbSet('Cupboards', { data: r1, syncedAt: Date.now() }),
          idbSet('Cupboard_Items', { data: r2, syncedAt: Date.now() }),
          idbSet('Item_Master', { data: r3, syncedAt: Date.now() }),
          idbSet('Stock_Register', { data: r4, syncedAt: Date.now() })
        ]);
      }

      const { enrichedCups, enrichedItems } = processCupboardsAndItems(
        rawCups, rawItems, rawCatalog, rawEntries
      );
      setCupboards(enrichedCups);
      setCupboardItems(enrichedItems);
    } catch (err) {
      console.error('Failed to load cupboards:', err);
      const { enrichedCups, enrichedItems } = processCupboardsAndItems(
        DEMO_CUPBOARDS, DEMO_CUPBOARD_ITEMS, DEMO_ITEM_MASTER, DEMO_INVENTORY_ENTRIES
      );
      setCupboards(enrichedCups);
      setCupboardItems(enrichedItems);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll(true);

    const unsub = subscribeSync((tab) => {
      if (['Cupboards', 'Cupboard_Items', 'Item_Master', 'Stock_Register'].includes(tab || '')) {
        loadAll(false);
      }
    });

    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (['Cupboards', 'Cupboard_Items', 'Item_Master', 'Stock_Register'].includes(detail.tab || '')) {
        loadAll(false);
      }
    };
    window.addEventListener('sync-tab-updated', handleCustom);

    return () => {
      unsub();
      window.removeEventListener('sync-tab-updated', handleCustom);
    };
  }, [loadAll]);

  const addCupboard = useCallback(async (form: any) => {
    const maxNum = cupboards.reduce((max, c) => {
      const match = String(c.Cupboard_ID).match(/^CUP-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const id = 'CUP-' + String(maxNum + 1).padStart(4, '0');
    const newCup: Record<string, string> = {
      Cupboard_ID: id,
      Cupboard_Number: form.number,
      Name: form.name,
      Location: form.location || '',
      Description: form.description || '',
      Image_URL: form.imageUrl || '',
      Color: form.color || '#1B3A6B',
      Status: 'Active',
      Created_On: new Date().toLocaleString(),
      Type: form.type || 'Cupboard'
    };

    try {
      await updateLocalCache('Cupboards', newCup, 'Cupboard_ID');

      addSystemLog('CREATE_CUPBOARD', `Cupboard ${form.number} created`);
      toast({ title: 'Success', description: `Cupboard ${form.number} added.` });

      // Queue network write
      queueWrite(
        () => postSheetRow('Cupboards', newCup),
        `Add cupboard ${form.number}`,
        { type: 'postRow', tabName: 'Cupboards', rowData: newCup }
      ).catch(err => console.error("Failed to queue Cupboards write:", err));

      return { success: true, cupboardId: id };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to add cupboard: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [cupboards, toast]);

  const updateCupboard = useCallback(async (cupboardId: string, form: any) => {
    const existing = cupboards.find(c => c.Cupboard_ID === cupboardId);
    const updatedCup: Record<string, string> = {
      Cupboard_ID: cupboardId,
      Cupboard_Number: form.number || existing?.Cupboard_Number || '',
      Name: form.name || existing?.Name || '',
      Location: form.location || existing?.Location || '',
      Description: form.description || existing?.Description || '',
      Image_URL: form.imageUrl || existing?.Image_URL || '',
      Color: form.color || existing?.Color || '#1B3A6B',
      Status: 'Active',
      Created_On: existing?.Created_On || new Date().toLocaleString(),
      Type: form.type || existing?.Type || 'Cupboard'
    };

    try {
      await updateLocalCache('Cupboards', updatedCup, 'Cupboard_ID');

      addSystemLog('UPDATE_CUPBOARD', `Cupboard ID ${cupboardId} updated`);
      toast({ title: 'Updated', description: 'Cupboard configuration saved.' });

      // Queue write
      queueWrite(
        () => postSheetRow('Cupboards', updatedCup),
        `Update cupboard ID ${cupboardId}`,
        { type: 'postRow', tabName: 'Cupboards', rowData: updatedCup }
      ).catch(err => console.error("Failed to queue Cupboards update:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update cupboard: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [cupboards, toast]);

  const deleteCupboard = useCallback(async (cupboardId: string) => {
    const existing = cupboards.find(c => c.Cupboard_ID === cupboardId);
    if (!existing) return { success: false, error: 'Cupboard not found' };

    const deletedCup: Record<string, string> = {
      Cupboard_ID: existing.Cupboard_ID,
      Cupboard_Number: existing.Cupboard_Number,
      Name: existing.Name,
      Location: existing.Location || '',
      Description: existing.Description || '',
      Image_URL: existing.Image_URL || '',
      Color: existing.Color || '#1B3A6B',
      Status: 'Deleted',
      Created_On: existing.Created_On || new Date().toLocaleString()
    };

    try {
      await updateLocalCache('Cupboards', deletedCup, 'Cupboard_ID');

      // Update cupboard items status to Deleted
      const cachedItems = await getCached('Cupboard_Items');
      const rawItems = cachedItems?.data || [];
      let nextItems = [...rawItems];
      for (const item of rawItems) {
        if (item.Cupboard_ID === cupboardId) {
          const deletedItem = { ...item, Status: 'Deleted' };
          nextItems = updateRawData(nextItems, deletedItem, 'Item_ID');
          queueWrite(
            () => postSheetRow('Cupboard_Items', deletedItem),
            `Delete Cupboard Item ID ${item.Item_ID} due to cupboard deletion`,
            { type: 'postRow', tabName: 'Cupboard_Items', rowData: deletedItem }
          ).catch(err => console.error("Failed to queue Cupboard Item delete:", err));
        }
      }
      await idbSet('Cupboard_Items', { data: nextItems, syncedAt: Date.now() });
      window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Cupboard_Items', data: nextItems } }));

      // Add to Recycle Bin
      const newBinItem: RecycleItem = {
        Bin_ID: 'BIN-' + Date.now(),
        Original_ID: existing.Cupboard_ID,
        Type: 'Cupboard',
        Item_Name: `Container: ${existing.Cupboard_Number} - ${existing.Name}`,
        Deleted_By: 'Admin',
        Date_Time: new Date().toLocaleString()
      };
      await updateLocalCache('Recycle_Bin', newBinItem, 'Bin_ID');

      if (isClient) {
        const backups = getStored<Record<string, any>>('sicca_cupboard_backups', {});
        backups[newBinItem.Bin_ID] = existing;
        setStored('sicca_cupboard_backups', backups);
      }

      addSystemLog('DELETE_CUPBOARD', `Cupboard "${existing.Name}" deleted`);
      toast({ title: 'Deleted', description: 'Container moved to Recovery Vault.' });

      // Queue Cupboard delete write
      queueWrite(
        () => postSheetRow('Cupboards', deletedCup),
        `Delete cupboard "${existing.Name}" (ID: ${cupboardId})`,
        { type: 'postRow', tabName: 'Cupboards', rowData: deletedCup }
      ).catch(err => console.error("Failed to queue Cupboards delete:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete cupboard: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [cupboards, toast]);

  const getCupboardItems = useCallback((cupboardId: string) => {
    return cupboardItems.filter(item => item.Cupboard_ID === cupboardId);
  }, [cupboardItems]);

  const addCupboardItem = useCallback(async (form: any) => {
    const maxNum = cupboardItems.reduce((max, i) => {
      const match = String(i.Item_ID).match(/^CI-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const id = 'CI-' + String(maxNum + 1).padStart(4, '0');
    
    const newItem: Record<string, any> = {
      Item_ID: id,
      Cupboard_ID: form.cupboardId,
      Item_Code: form.itemCode,
      Min_Qty: String(form.minQty || '0'),
      Image_URL: form.imageUrl || '',
      Description: form.description || '',
      Last_Updated: new Date().toLocaleString(),
      Status: 'Active'
    };

    try {
      await updateLocalCache('Cupboard_Items', newItem, 'Item_ID');
      toast({ title: 'Added', description: `Item added to cupboard.` });

      // Queue write
      queueWrite(
        () => postSheetRow('Cupboard_Items', newItem),
        `Add Cupboard Item ${form.itemCode} to Cupboard ${form.cupboardId}`,
        { type: 'postRow', tabName: 'Cupboard_Items', rowData: newItem }
      ).catch(err => console.error("Failed to queue Cupboard Item write:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to add item to cupboard: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [cupboardItems, toast]);

  const updateCupboardItem = useCallback(async (itemId: string, form: any) => {
    const existing = cupboardItems.find(i => i.Item_ID === itemId);
    if (!existing) return { success: false, error: 'Item not found' };

    const updatedItem: Record<string, any> = {
      Item_ID: itemId,
      Cupboard_ID: existing.Cupboard_ID,
      Item_Code: form.itemCode || existing.Item_Code,
      Min_Qty: String(form.minQty !== undefined ? form.minQty : existing.Min_Qty),
      Image_URL: form.imageUrl || existing.Image_URL,
      Description: form.description || existing.Description,
      Last_Updated: new Date().toLocaleString(),
      Status: 'Active'
    };

    try {
      await updateLocalCache('Cupboard_Items', updatedItem, 'Item_ID');
      toast({ title: 'Updated', description: 'Item updated.' });

      // Queue write
      queueWrite(
        () => postSheetRow('Cupboard_Items', updatedItem),
        `Update Cupboard Item ID ${itemId}`,
        { type: 'postRow', tabName: 'Cupboard_Items', rowData: updatedItem }
      ).catch(err => console.error("Failed to queue Cupboard Item update:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update cupboard item: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [cupboardItems, toast]);

  const deleteCupboardItem = useCallback(async (itemId: string) => {
    const existing = cupboardItems.find(i => i.Item_ID === itemId);
    if (!existing) return { success: false, error: 'Item not found' };

    const deletedItem: Record<string, any> = {
      Item_ID: existing.Item_ID,
      Cupboard_ID: existing.Cupboard_ID,
      Item_Code: existing.Item_Code,
      Min_Qty: existing.Min_Qty || '0',
      Image_URL: existing.Image_URL || '',
      Description: existing.Description || '',
      Last_Updated: new Date().toLocaleString(),
      Status: 'Deleted'
    };

    try {
      await updateLocalCache('Cupboard_Items', deletedItem, 'Item_ID');
      toast({ title: 'Removed', description: 'Item deleted from cupboard.' });

      // Queue write
      queueWrite(
        () => postSheetRow('Cupboard_Items', deletedItem),
        `Delete Cupboard Item ID ${itemId}`,
        { type: 'postRow', tabName: 'Cupboard_Items', rowData: deletedItem }
      ).catch(err => console.error("Failed to queue Cupboard Item delete:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete item from cupboard: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [cupboardItems, toast]);

  return {
    cupboards,
    addCupboard,
    updateCupboard,
    deleteCupboard,
    getCupboardItems,
    addCupboardItem,
    updateCupboardItem,
    deleteCupboardItem,
    loading,
    refresh: () => {
      fullSync().catch(err => console.error("Sync failed on refresh:", err));
    }
  };
}

// 10b. BOXES / PLACEMENTS HOOK
export function useBoxesAndPlacements() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAll = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [c1, c2] = await Promise.all([
        getCached('Boxes'),
        getCached('Placements')
      ]);
      
      let rawBoxes = c1?.data;
      let rawPlacements = c2?.data;

      if (!rawBoxes || !rawPlacements) {
        const [r1, r2] = await Promise.all([
          fetchSheetTab('database', 'Boxes'),
          fetchSheetTab('database', 'Placements')
        ]);
        rawBoxes = r1;
        rawPlacements = r2;
        await Promise.all([
          idbSet('Boxes', { data: r1, syncedAt: Date.now() }),
          idbSet('Placements', { data: r2, syncedAt: Date.now() })
        ]);
      }

      setBoxes(rawBoxes.filter((b: any) => b.Status !== 'Deleted'));
      setPlacements(rawPlacements);
    } catch (err) {
      console.error('Failed to load boxes/placements:', err);
      setBoxes(DEMO_BOXES);
      setPlacements(DEMO_PLACEMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll(true);

    const unsub = subscribeSync((tab) => {
      if (['Boxes', 'Placements'].includes(tab || '')) {
        loadAll(false);
      }
    });

    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (['Boxes', 'Placements'].includes(detail.tab || '')) {
        loadAll(false);
      }
    };
    window.addEventListener('sync-tab-updated', handleCustom);

    return () => {
      unsub();
      window.removeEventListener('sync-tab-updated', handleCustom);
    };
  }, [loadAll]);

  const getBoxesForCupboard = useCallback(
    (cupboardId: string) => boxes.filter(b => b.Cupboard_ID === cupboardId),
    [boxes]
  );

  const addBox = useCallback(async (cupboardId: string, boxName: string, description = '') => {
    const maxNum = boxes.reduce((max, b) => {
      const match = String(b.Box_ID).match(/^BOX-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newBox: Box & { Status?: string } = {
      Box_ID: 'BOX-' + String(maxNum + 1).padStart(4, '0'),
      Cupboard_ID: cupboardId, Box_Name: boxName, Description: description,
      Created_On: new Date().toLocaleString(), Status: 'Active'
    };
    try {
      await updateLocalCache('Boxes', newBox, 'Box_ID');
      addSystemLog('CREATE_BOX', `Box "${boxName}" added to cupboard ID ${cupboardId}`);

      // Queue network write
      queueWrite(
        () => postSheetRow('Boxes', newBox),
        `Add box "${boxName}" (ID: ${newBox.Box_ID})`,
        { type: 'postRow', tabName: 'Boxes', rowData: newBox }
      ).catch(err => console.error("Failed to queue Box write:", err));

      return { success: true, box: newBox };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to create box: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [boxes, toast]);

  const addPlacement = useCallback(async (itemCode: string, cupboardId: string, boxId: string, quantity: number) => {
    const existing = placements.find(p => p.Item_Code === itemCode && p.Cupboard_ID === cupboardId && p.Box_ID === boxId);
    const now = new Date().toLocaleString();
    const row: Placement = existing
      ? { ...existing, Quantity: String(parseFloat(existing.Quantity || '0') + quantity), Last_Updated: now }
      : {
          Placement_ID: 'PLC-' + String(
            placements.reduce((max, p) => {
              const match = String(p.Placement_ID).match(/^PLC-(\d+)$/);
              return match ? Math.max(max, parseInt(match[1], 10)) : max;
            }, 0) + 1
          ).padStart(4, '0'),
          Item_Code: itemCode, Cupboard_ID: cupboardId, Box_ID: boxId,
          Quantity: String(quantity), Last_Updated: now
        };
    try {
      await updateLocalCache('Placements', row, 'Placement_ID');
      addSystemLog('ADD_PLACEMENT', `Placed quantity ${quantity} for item "${itemCode}" in Box ID ${boxId}`);

      // Queue network write
      queueWrite(
        () => postSheetRow('Placements', row),
        `Add placement for item ${itemCode} in Box ${boxId}`,
        { type: 'postRow', tabName: 'Placements', rowData: row }
      ).catch(err => console.error("Failed to queue Placement write:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to save location: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [placements, toast]);

  const removePlacement = useCallback(async (placementId: string) => {
    const existing = placements.find(p => p.Placement_ID === placementId);
    if (!existing) return { success: false, error: 'Placement not found' };
    const row: Placement = { ...existing, Quantity: '0', Last_Updated: new Date().toLocaleString() };
    try {
      await updateLocalCache('Placements', row, 'Placement_ID');
      addSystemLog('REMOVE_PLACEMENT', `Removed item "${existing.Item_Code}" placement from Box ID ${existing.Box_ID}`);

      // Queue network write
      queueWrite(
        () => postSheetRow('Placements', row),
        `Remove placement ID ${placementId}`,
        { type: 'postRow', tabName: 'Placements', rowData: row }
      ).catch(err => console.error("Failed to queue Placement remove:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to remove item: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [placements, toast]);

  const reducePlacementQty = useCallback(async (placementId: string, qtyToRemove: number) => {
    const existing = placements.find(p => p.Placement_ID === placementId);
    if (!existing) return { success: false, error: 'Placement not found' };
    const nextQty = Math.max(0, parseFloat(existing.Quantity || '0') - qtyToRemove);
    const row: Placement = { ...existing, Quantity: String(nextQty), Last_Updated: new Date().toLocaleString() };
    try {
      await updateLocalCache('Placements', row, 'Placement_ID');
      addSystemLog('REDUCE_PLACEMENT', `Took ${qtyToRemove} of "${existing.Item_Code}" from Box ID ${existing.Box_ID}`);

      // Queue network write
      queueWrite(
        () => postSheetRow('Placements', row),
        `Reduce placement ID ${placementId} qty by ${qtyToRemove}`,
        { type: 'postRow', tabName: 'Placements', rowData: row }
      ).catch(err => console.error("Failed to queue Placement reduce:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update location quantity: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [placements, toast]);

  const deleteBox = useCallback(async (boxId: string) => {
    const existing = boxes.find(b => b.Box_ID === boxId);
    if (!existing) return { success: false, error: 'Box not found' };
    const deletedBox: Box & { Status?: string } = { ...existing, Status: 'Deleted' };
    
    try {
      // 1. Update Boxes
      await updateLocalCache('Boxes', deletedBox, 'Box_ID');

      // 2. Add to Recycle Bin
      const newBinItem: RecycleItem = {
        Bin_ID: 'BIN-' + Date.now(),
        Original_ID: existing.Box_ID,
        Type: 'Box',
        Item_Name: `Box: ${existing.Box_Name}`,
        Deleted_By: 'Admin',
        Date_Time: new Date().toLocaleString()
      };
      await updateLocalCache('Recycle_Bin', newBinItem, 'Bin_ID');

      if (isClient) {
        const backups = getStored<Record<string, any>>('sicca_box_backups', {});
        backups[newBinItem.Bin_ID] = existing;
        const boxPlacements = placements.filter(p => p.Box_ID === boxId && parseFloat(p.Quantity || '0') > 0);
        backups[newBinItem.Bin_ID + '_placements'] = boxPlacements;
        setStored('sicca_box_backups', backups);
      }

      // 3. Clear Box Placements
      const cachedPlacements = await getCached('Placements');
      const rawPlacements = cachedPlacements?.data || [];
      const boxPlacements = rawPlacements.filter((p: any) => p.Box_ID === boxId && parseFloat(p.Quantity || '0') > 0);
      let nextPlacements = [...rawPlacements];

      for (const p of boxPlacements) {
        const row: Placement = { ...p, Quantity: '0', Last_Updated: new Date().toLocaleString() };
        nextPlacements = updateRawData(nextPlacements, row, 'Placement_ID');
        queueWrite(
          () => postSheetRow('Placements', row),
          `Clear Placement ${p.Placement_ID} on Box deletion`,
          { type: 'postRow', tabName: 'Placements', rowData: row }
        ).catch(err => console.error("Failed to queue Placement clear write:", err));
      }

      await idbSet('Placements', { data: nextPlacements, syncedAt: Date.now() });
      window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Placements', data: nextPlacements } }));

      // Queue Box deletion write
      queueWrite(
        () => postSheetRow('Boxes', deletedBox),
        `Delete box "${existing.Box_Name}" (ID: ${boxId})`,
        { type: 'postRow', tabName: 'Boxes', rowData: deletedBox }
      ).catch(err => console.error("Failed to queue Box delete write:", err));

      addSystemLog('DELETE_BOX', `Box "${existing.Box_Name}" deleted`);
      toast({ title: 'Deleted', description: 'Box moved to Recovery Vault.' });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete box: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [boxes, placements, toast]);

  return { boxes, placements, getBoxesForCupboard, addBox, addPlacement, removePlacement, reducePlacementQty, deleteBox, loading, refresh: () => loadAll(true) };
}

// 10c. EMPLOYEES HOOK
export function useEmployees() {
  const [employees, setEmployees, loading] = useSyncTabState<User>('Users', DEMO_USERS, data => data.filter((u: any) => u.Status !== 'Deleted'));
  const { toast } = useToast();

  const addEmployee = useCallback(async (fullName: string) => {
    const newEmployee: Record<string, any> = {
      User_ID: 'USR-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      Full_Name: fullName, Display_Name: fullName,
      Status: 'Active', Verified: 'NO', Permissions: '{}',
      Created_On: new Date().toLocaleString()
    };
    try {
      await updateLocalCache('Users', newEmployee, 'User_ID');

      // Queue network write
      queueWrite(
        () => postSheetRow('Users', newEmployee),
        `Add unverified employee ${fullName}`,
        { type: 'postRow', tabName: 'Users', rowData: newEmployee }
      ).catch(err => console.error("Failed to queue Users employee write:", err));

      return { success: true, employee: newEmployee as User };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to add employee: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [toast]);

  return {
    employees,
    rawEmployees: employees,
    addEmployee,
    loading,
    refresh: () => {
      fullSync().catch(err => console.error("Sync failed on refresh:", err));
    }
  };
}

// 10d. INVOICES HOOK
export function useInvoices() {
  const [invoices, setInvoices, loading] = useSyncTabState<Invoice>('Invoices', DEMO_INVOICES, data => {
    const invoiceMap = new Map<string, Invoice>();
    data.forEach((i: any) => {
      if (i.Invoice_No && String(i.Invoice_No).trim() !== '') {
        invoiceMap.set(i.Invoice_No.trim().toLowerCase(), i);
      }
    });
    return Array.from(invoiceMap.values()).filter((i: any) => i.Status !== 'Deleted');
  });
  const { toast } = useToast();

  const addInvoice = useCallback(async (form: { invoiceNo: string; vendorName: string; date: string; employeeName: string; totalValue: number }) => {
    const newInvoice: Invoice = {
      Invoice_No: form.invoiceNo, Vendor_Name: form.vendorName, Date: form.date,
      Employee_Name: form.employeeName, Total_Value: form.totalValue.toFixed(2),
      Created_On: new Date().toLocaleString()
    };
    try {
      await updateLocalCache('Invoices', newInvoice, 'Invoice_No');

      // Queue write
      queueWrite(
        () => postSheetRow('Invoices', newInvoice),
        `Add Invoice ${form.invoiceNo}`,
        { type: 'postRow', tabName: 'Invoices', rowData: newInvoice }
      ).catch(err => console.error("Failed to queue Invoices write:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to save invoice: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const deleteInvoice = useCallback(async (invoiceNo: string) => {
    try {
      const cachedInvoices = await getCached('Invoices');
      const rawInvoices = cachedInvoices?.data || [];
      const invoiceToDelete = rawInvoices.find((inv: any) => inv.Invoice_No === invoiceNo);
      
      if (invoiceToDelete) {
        const deletedInvoice = { ...invoiceToDelete, Status: 'Deleted' };
        await updateLocalCache('Invoices', deletedInvoice, 'Invoice_No');

        // Queue write
        queueWrite(
          () => postSheetRow('Invoices', deletedInvoice),
          `Delete Invoice ${invoiceNo}`,
          { type: 'postRow', tabName: 'Invoices', rowData: deletedInvoice }
        ).catch(err => console.error("Failed to queue Invoice delete write:", err));
      }

      // Filter out stock register entries associated with this invoice
      const cachedEntries = await getCached('Stock_Register');
      const rawEntries = cachedEntries?.data || [];
      const affectedEntries = rawEntries.filter((e: any) => e.Invoice_No === invoiceNo);
      const remainingEntries = rawEntries.filter((e: any) => e.Invoice_No !== invoiceNo);

      await idbSet('Stock_Register', { data: remainingEntries, syncedAt: Date.now() });
      window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Stock_Register', data: remainingEntries } }));

      addSystemLog('DELETE_INVOICE', `Invoice "${invoiceNo}" deleted (removed ${affectedEntries.length} associated stock entries)`);

      toast({ 
        title: 'Invoice Deleted', 
        description: `Invoice ${invoiceNo} and its ${affectedEntries.length} associated stock entries have been removed.` 
      });

      return { success: true, affectedCount: affectedEntries.length };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete invoice: ' + err.message, variant: 'destructive' });
      return { success: false };
    }
  }, [toast]);

  return { invoices, addInvoice, deleteInvoice, loading, refresh: () => {
    fullSync().catch(err => console.error("Sync failed on refresh:", err));
  } };
}

// 11. GST SUMMARY HOOK
export function useGstSummary() {
  const { entries, loading } = useInventoryEntries();

  const inwardEntries = entries.filter(e => e.Transaction_Type === 'Inward');
  
  const rates = [28, 18, 12, 5, 0];
  const byRate = rates.map(rate => {
    const filtered = inwardEntries.filter(e => parseFloat(e.GST_Rate || '0') === rate);
    const count = filtered.length;
    const taxable = filtered.reduce((acc, curr) => acc + (parseFloat(curr.Inward_Qty || '0') * parseFloat(curr.Price_Per_Item || '0')), 0);
    const cgst = taxable * (rate / 2) / 100;
    const sgst = cgst;
    const invoice = taxable + cgst + sgst;
    return { rate, count, taxable, cgst, sgst, invoice };
  }).filter(r => r.count > 0);

  const totalTaxable = byRate.reduce((acc, r) => acc + r.taxable, 0);
  const totalCGST = byRate.reduce((acc, r) => acc + r.cgst, 0);
  const totalSGST = byRate.reduce((acc, r) => acc + r.sgst, 0);
  const totalGST = totalCGST + totalSGST;
  const totalInvoice = totalTaxable + totalGST;

  return {
    byRate,
    summary: {
      totalTaxable,
      totalCGST,
      totalSGST,
      totalGST,
      totalInvoice
    },
    loading,
    refresh: () => {}
  };
}

// 12. SETTINGS HOOK
export function useSettings() {
  const [settings, setSettings, loading] = useSyncTabState<any>('Settings', [DEMO_SETTINGS], data => data);
  const { toast } = useToast();

  const currentSettings = useMemo(() => Array.isArray(settings) ? settings[0] : settings, [settings]);

  const saveSettings = useCallback(async (newSettings: any) => {
    const updated = { ...currentSettings, ...newSettings };
    try {
      const nextRaw = [updated];
      await idbSet('Settings', { data: nextRaw, syncedAt: Date.now() });
      window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Settings', data: nextRaw } }));

      addSystemLog('SAVE_SETTINGS', 'System settings saved');
      toast({ title: 'Success', description: 'System settings updated.' });

      // Queue network write
      queueWrite(
        () => postSheetRow('Settings', updated),
        'Save system settings',
        { type: 'postRow', tabName: 'Settings', rowData: updated }
      ).catch(err => console.error("Failed to queue Settings write:", err));

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to save settings: ' + err.message, variant: 'destructive' });
      return { success: false };
    }
  }, [currentSettings, toast]);

  const changePassword = useCallback((data: any) => {
    addSystemLog('SAVE_SETTINGS', 'Admin password changed');
    return { success: true };
  }, []);

  return {
    settings: currentSettings,
    saveSettings,
    changePassword
  };
}

// 13. TASKS HOOK
export type Task = {
  Task_ID: string;
  Assigned_To_User_ID: string;
  Text: string;
  Created_By: string;
  Notice_ID: string;
  Status: string;
  Created_On: string;
};

export function useTasks() {
  const [tasks, setTasks, loading] = useSyncTabState<Task>('Tasks', [], data => data.filter((t: any) => t.Status !== 'Deleted').reverse());
  const { toast } = useToast();

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    try {
      const cached = await getCached('Tasks');
      const raw = cached?.data || [];
      const task = raw.find((t: any) => t.Task_ID === taskId);
      if (task) {
        const updated = { ...task, Status: status };
        const nextRaw = updateRawData(raw, updated, 'Task_ID');
        await idbSet('Tasks', { data: nextRaw, syncedAt: Date.now() });
        window.dispatchEvent(new CustomEvent('sync-tab-updated', { detail: { tab: 'Tasks', data: nextRaw } }));

        addSystemLog('TASK_UPDATE', `Task ID ${taskId} changed status to "${status}"`);

        const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
        if (!urlStr) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');

        queueWrite(
          () => fetch(urlStr, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              action: 'updateTaskStatus',
              taskId,
              status,
              token: localStorage.getItem('sicca_token') || ''
            })
          }).then(res => res.json()),
          `Update task ID ${taskId} status to ${status}`
        ).catch(err => console.error("Failed to queue updateTaskStatus:", err));
      }

      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update task status: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [toast]);

  return { tasks, updateTaskStatus, loading, refresh: () => {
    fullSync().catch(err => console.error("Sync failed on refresh:", err));
  } };
}
