import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchSheetTab, postSheetRow } from '@/lib/sheets';
import { safeStr } from '@/lib/utils';
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

// Helpers to update local storage and notify listeners
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
  const logs = getStored<ActivityLog[]>('sicca_activity_log', DEMO_ACTIVITY_LOG);
  const now = new Date();
  const formatTime = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}-${p(d.getMonth()+1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  let currentUserName = 'Admin';
  try {
    const userStr = localStorage.getItem('sicca_current_user');
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
    Date_Time: formatTime(now)
  };
  setStored('sicca_activity_log', [newLog, ...logs]);
  notify('sicca_activity_log');
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

// 1. INVENTORY ENTRIES HOOK
export function useInventoryEntries() {
  const [entries, setEntries] = useLocalState<Entry[]>('sicca_inventory_entries', DEMO_INVENTORY_ENTRIES);
  const [itemSummary, setItemSummary] = useLocalState<ItemSummary[]>('sicca_item_summary', DEMO_ITEM_SUMMARY);
  const [recycleBin, setRecycleBin] = useLocalState<RecycleItem[]>('sicca_recycle_bin', DEMO_RECYCLE_BIN);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const loadFromBackend = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await fetchSheetTab('database', 'Stock_Register');
      if (data && data.length > 0) {
        // Deduplicate: take the latest entry by Entry_ID
        const entryMap = new Map<string, Entry>();
        data.forEach((e: any) => {
          if (e.Entry_ID) {
            entryMap.set(e.Entry_ID, e);
          }
        });
        const activeEntries = Array.from(entryMap.values());
        const reversed = activeEntries.reverse();
        setEntries(reversed);
        setItemSummary(computeSummary(reversed));
      }
    } catch (err: any) {
      console.error('fetchSheetTab failed:', err);
      // Fallback: show toast only on initial mount to avoid polling spam
      if (isInitial) {
        toast({
          title: 'Showing demo data',
          description: 'Backend unreachable. Using local fallback.',
          variant: 'destructive'
        });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [setEntries, setItemSummary, toast]);

  useEffect(() => {
    loadFromBackend(true);
    const delay = 30000 + Math.floor(Math.random() * 8000);
    const interval = setInterval(() => {
      loadFromBackend(false);
    }, delay);
    return () => clearInterval(interval);
  }, [loadFromBackend]);

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
    
    // Find current balance for the item
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
      await postSheetRow('Stock_Register', rowData);
      
      // Optimistic update
      setEntries(prev => [rowData as any, ...prev]);
      setItemSummary(prev => {
        const existingIdx = prev.findIndex(i => safeStr(i.name).toLowerCase() === safeStr(form.itemName).toLowerCase());
        const minStock = 10;
        const status = nextBalance <= 0 ? 'Out of Stock' : (nextBalance < minStock ? 'Low' : 'Normal');

        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            balance: nextBalance,
            status,
            location: form.location || updated[existingIdx].location
          };
          return updated;
        } else {
          return [...prev, {
            name: form.itemName,
            code: form.itemCode || 'N/A',
            balance: nextBalance,
            location: form.location || 'Default',
            status
          }];
        }
      });

      addSystemLog(type === 'Inward' ? 'INWARD_ENTRY' : type === 'Return' ? 'RETURN_ENTRY' : 'OUTWARD_ENTRY', `${form.itemName} × ${qty}`);
      if (!opts?.silent) toast({ title: 'Success', description: `${type} entry added for ${form.itemName}.` });
      return { success: true, entryId: nextId };
    } catch (err: any) {
      if (!opts?.silent) toast({
        title: 'Network Error',
        description: 'Failed to write to Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [itemSummary, setEntries, setItemSummary, toast]);

  const saveInwardBatch = useCallback(async (payload: any) => {
    try {
      const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
      if (!urlStr) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');
      
      const res = await fetch(urlStr, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveInwardBatch',
          token: localStorage.getItem('sicca_session_token') || 'demo-admin-token',
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

  const deleteEntry = useCallback((entryId: string) => {
    const entryToDelete = entries.find(e => e.Entry_ID === entryId);
    if (!entryToDelete) return { success: false, error: 'Entry not found' };

    // Move to recycle bin
    const newBinItem: RecycleItem = {
      Bin_ID: 'BIN-' + Date.now(),
      Original_ID: entryToDelete.Entry_ID,
      Type: 'Stock Entry',
      Item_Name: `${entryToDelete.Item_Name} (${entryToDelete.Transaction_Type} of ${entryToDelete.Transaction_Type === 'Inward' ? entryToDelete.Inward_Qty : entryToDelete.Outward_Qty})`,
      Deleted_By: 'Admin',
      Date_Time: new Date().toLocaleString()
    };
    setRecycleBin(prev => [newBinItem, ...prev]);
    setEntries(prev => prev.filter(e => e.Entry_ID !== entryId));

    // Also backup the deleted entry object for restoration
    if (isClient) {
      const backups = getStored<Record<string, any>>('sicca_entry_backups', {});
      backups[newBinItem.Bin_ID] = entryToDelete;
      setStored('sicca_entry_backups', backups);
    }

    addSystemLog('DELETE_ENTRY', `${entryToDelete.Item_Name} stock entry deleted`);
    toast({ title: 'Deleted', description: 'Stock entry moved to Recovery Vault.' });
    return { success: true };
  }, [entries, setEntries, setRecycleBin, toast]);

  return {
    entries,
    items: itemSummary,
    addEntry,
    saveInwardBatch,
    deleteEntry,
    loading,
    refresh: () => loadFromBackend(true)
  };
}

// 2. DASHBOARD HOOK
export function useDashboardStats() {
  const { entries, items, loading } = useInventoryEntries();
  const [vendors] = useLocalState<Vendor[]>('sicca_vendors', DEMO_VENDORS);
  const [users] = useLocalState<User[]>('sicca_users', DEMO_USERS);

  const totalItems = items.length;
  const lowStock = items.filter(i => i.status === 'Low').length;
  const outOfStock = items.filter(i => i.status === 'Out of Stock').length;
  const todayCount = entries.filter(e => {
    const todayStr = new Date().toLocaleDateString('en-IN');
    // entries have Date_Time like "03-07-2026 14:30" or LocaleString
    return e.Date_Time.includes(todayStr) || e.Date_Time.includes('03-07-2026');
  }).length;

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
    refresh: () => {}
  };
}

// 3. USERS HOOK
export function useUsers() {
  const [users, setUsers] = useLocalState<User[]>('sicca_users', DEMO_USERS);
  const [recycleBin, setRecycleBin] = useLocalState<RecycleItem[]>('sicca_recycle_bin', DEMO_RECYCLE_BIN);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const loadFromBackend = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const raw = await fetchSheetTab('database', 'Users');
      const userMap = new Map<string, User>();
      raw.forEach((u: any) => { if (u.User_ID) userMap.set(u.User_ID, u); });
      setUsers(Array.from(userMap.values()).filter((u: any) => u.Status !== 'Deleted'));
    } catch (err: any) {
      console.error('Failed to load users:', err);
      if (isInitial) {
        toast({ title: 'Showing demo data — backend unreachable', description: 'Using local fallback data.', variant: 'destructive' });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [setUsers, toast]);

  useEffect(() => {
    loadFromBackend(true);
    const delay = 30000 + Math.floor(Math.random() * 8000);
    const interval = setInterval(() => loadFromBackend(false), delay);
    return () => clearInterval(interval);
  }, [loadFromBackend]);

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
      await postSheetRow('Users', newUser);
      setUsers(prev => [...prev, newUser as any]);
      addSystemLog('CREATE_USER', `${newUser.Full_Name} created`);
      toast({ title: 'Success', description: `User ${newUser.Full_Name} created successfully.` });
      return { success: true, userId: id };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to write to Google Sheets. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [users, setUsers, toast]);

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
      await postSheetRow('Users', updated);
      setUsers(prev => prev.map(u => u.User_ID === userId ? { ...u, ...updated } as any : u));
      addSystemLog('UPDATE_USER', `User ID ${userId} updated`);
      toast({ title: 'Updated', description: 'User account updated.' });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to update Google Sheets. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [users, setUsers, toast]);

  const deleteUser = useCallback(async (userId: string) => {
    const userToDelete = users.find(u => u.User_ID === userId);
    if (!userToDelete) return { success: false };

    const deletedUser = { ...userToDelete, Status: 'Deleted' };
    try {
      await postSheetRow('Users', deletedUser);
      
      const newBinItem: RecycleItem = {
        Bin_ID: 'BIN-' + Date.now(),
        Original_ID: userToDelete.User_ID,
        Type: 'User',
        Item_Name: `User: ${userToDelete.Full_Name} (${userToDelete.Email})`,
        Deleted_By: 'Admin',
        Date_Time: new Date().toLocaleString()
      };
      setRecycleBin(prev => [newBinItem, ...prev]);
      setUsers(prev => prev.filter(u => u.User_ID !== userId));

      if (isClient) {
        const backups = getStored<Record<string, any>>('sicca_user_backups', {});
        backups[newBinItem.Bin_ID] = userToDelete;
        setStored('sicca_user_backups', backups);
      }

      addSystemLog('DELETE_USER', `${userToDelete.Full_Name} deleted`);
      toast({ title: 'Deleted', description: 'User moved to Recovery Vault.' });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to delete user. ' + err.message, variant: 'destructive' });
      return { success: false };
    }
  }, [users, setUsers, setRecycleBin, toast]);

  const toggleUserStatus = useCallback((userId: string, status: string) => {
    setUsers(prev => prev.map(u => u.User_ID === userId ? { ...u, Status: status as any } : u));
    return { success: true };
  }, [setUsers]);

  return {
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    loading,
    refresh: () => loadFromBackend(true)
  };
}

// 4. ROLES HOOK
export function useRoles() {
  const [roles, setRoles] = useLocalState<Role[]>('sicca_roles', DEMO_ROLES);
  const { toast } = useToast();

  const addRole = useCallback((form: any) => {
    const newRole: Role = {
      Role_ID: 'ROL-' + Date.now().toString().slice(-4),
      Name: form.name,
      Description: form.description || '',
      Permissions: JSON.stringify(form.permissions || {}),
      Created_On: new Date().toLocaleDateString('en-IN')
    };

    setRoles(prev => [...prev, newRole]);
    addSystemLog('CREATE_ROLE', `Role ${newRole.Name} created`);
    toast({ title: 'Success', description: `Role ${newRole.Name} created.` });
    return { success: true };
  }, [setRoles, toast]);

  const updateRole = useCallback((roleId: string, form: any) => {
    setRoles(prev => prev.map(r => r.Role_ID === roleId ? {
      ...r,
      Name: form.name || r.Name,
      Description: form.description || r.Description,
      Permissions: JSON.stringify(form.permissions || {})
    } : r));
    addSystemLog('UPDATE_ROLE', `Role ID ${roleId} updated`);
    toast({ title: 'Updated', description: 'Role permissions saved.' });
    return { success: true };
  }, [setRoles, toast]);

  const deleteRole = useCallback((roleId: string) => {
    const roleToDelete = roles.find(r => r.Role_ID === roleId);
    if (!roleToDelete) return { success: false };

    setRoles(prev => prev.filter(r => r.Role_ID !== roleId));
    addSystemLog('DELETE_ROLE', `${roleToDelete.Name} role deleted`);
    toast({ title: 'Deleted', description: `Role "${roleToDelete.Name}" deleted.` });
    return { success: true };
  }, [roles, setRoles, toast]);

  return {
    roles,
    addRole,
    updateRole,
    deleteRole,
    refresh: () => {}
  };
}

// 5. NOTICE BOARD HOOK
export function useNoticeBoard() {
  const [notices, setNotices] = useLocalState<Notice[]>('sicca_notices', DEMO_NOTICES);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const loadFromBackend = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await fetchSheetTab('database', 'Notice_Board');
      if (data) {
        setNotices([...data].reverse() as Notice[]);
      }
    } catch (err: any) {
      console.error('Failed to load notices:', err);
      if (isInitial) {
        toast({ title: 'Showing demo data — backend unreachable', description: 'Using local fallback data.', variant: 'destructive' });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [setNotices, toast]);

  useEffect(() => {
    loadFromBackend(true);
    const delay = 30000 + Math.floor(Math.random() * 8000);
    const interval = setInterval(() => loadFromBackend(false), delay);
    return () => clearInterval(interval);
  }, [loadFromBackend]);

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

    setNotices(prev => [newNotice, ...prev]);

    try {
      const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
      if (!urlStr) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');
      const res = await fetch(urlStr, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'createNotice',
          title: form.title,
          content: form.content,
          priority: form.priority || 'info',
          expiry: form.expiry || '',
          taggedUsers: form.taggedUsers || [],
          token: localStorage.getItem('sicca_session_token') || 'demo-admin-token'
        })
      });
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const json = await res.json();
      if (!json || json.success === false) {
        throw new Error(json?.error || 'Failed to post notice');
      }
      toast({ title: 'Posted', description: 'Announcement published to board.' });
      loadFromBackend(false);
      return { success: true };
    } catch (err: any) {
      console.error('Failed to post notice to backend:', err);
      toast({ title: 'Notice Posted (Local Only)', description: 'Saved locally, but backend update failed: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [setNotices, loadFromBackend, toast]);

  const deleteNotice = useCallback(async (noticeId: string) => {
    setNotices(prev => prev.filter(n => n.Notice_ID !== noticeId));
    try {
      const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
      if (!urlStr) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');
      const res = await fetch(urlStr, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteNotice',
          noticeId,
          token: localStorage.getItem('sicca_session_token') || 'demo-admin-token'
        })
      });
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      toast({ title: 'Removed', description: 'Notice deleted.' });
      loadFromBackend(false);
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete notice from backend: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [setNotices, loadFromBackend, toast]);

  return {
    notices,
    addNotice,
    deleteNotice,
    loading,
    refresh: () => loadFromBackend(true)
  };
}

// 6. RECYCLE BIN HOOK
export function useRecycleBin() {
  const [recycleBin, setRecycleBin] = useLocalState<RecycleItem[]>('sicca_recycle_bin', DEMO_RECYCLE_BIN);
  const [entries, setEntries] = useLocalState<Entry[]>('sicca_inventory_entries', DEMO_INVENTORY_ENTRIES);
  const [users, setUsers] = useLocalState<User[]>('sicca_users', DEMO_USERS);
  const [vendors, setVendors] = useLocalState<Vendor[]>('sicca_vendors', DEMO_VENDORS);
  const [itemMaster, setItemMaster] = useLocalState<ItemMaster[]>('sicca_item_master', DEMO_ITEM_MASTER);
  const [cupboards, setCupboards] = useLocalState<Cupboard[]>('sicca_cupboards', DEMO_CUPBOARDS);
  const [boxes, setBoxes] = useLocalState<Box[]>('sicca_boxes', DEMO_BOXES);
  const [placements, setPlacements] = useLocalState<Placement[]>('sicca_placements', DEMO_PLACEMENTS);
  const { toast } = useToast();

  const restoreItem = useCallback((binId: string) => {
    const item = recycleBin.find(i => i.Bin_ID === binId);
    if (!item) return { success: false };

    // Find the original item backup
    if (isClient) {
      if (item.Type === 'Stock Entry') {
        const backups = getStored<Record<string, any>>('sicca_entry_backups', {});
        const original = backups[binId];
        if (original) {
          setEntries(prev => [original, ...prev]);
          delete backups[binId];
          setStored('sicca_entry_backups', backups);
        }
      } else if (item.Type === 'User') {
        const backups = getStored<Record<string, any>>('sicca_user_backups', {});
        const original = backups[binId];
        if (original) {
          const restored = { ...original, Status: original.Status || 'Active' };
          setUsers(prev => [...prev, restored]);
          postSheetRow('Users', restored);
          delete backups[binId];
          setStored('sicca_user_backups', backups);
        }
      } else if (item.Type === 'Vendor') {
        const backups = getStored<Record<string, any>>('sicca_vendor_backups', {});
        const original = backups[binId];
        if (original) {
          const restored = { ...original, Status: 'Active' };
          setVendors(prev => [...prev, restored]);
          postSheetRow('Vendors', restored);
          delete backups[binId];
          setStored('sicca_vendor_backups', backups);
        }
      } else if (item.Type === 'Item Master') {
        const backups = getStored<Record<string, any>>('sicca_item_master_backups', {});
        const original = backups[binId];
        if (original) {
          const restored = { ...original, Status: 'Active' };
          setItemMaster(prev => [...prev, restored]);
          postSheetRow('Item_Master', restored);
          delete backups[binId];
          setStored('sicca_item_master_backups', backups);
        }
      } else if (item.Type === 'Cupboard') {
        const backups = getStored<Record<string, any>>('sicca_cupboard_backups', {});
        const original = backups[binId];
        if (original) {
          setCupboards(prev => [...prev, original]);
          postSheetRow('Cupboards', { ...original, Status: 'Active' });
          delete backups[binId];
          setStored('sicca_cupboard_backups', backups);
        }
      } else if (item.Type === 'Box') {
        const backups = getStored<Record<string, any>>('sicca_box_backups', {});
        const original = backups[binId];
        if (original) {
          setBoxes(prev => [...prev, original]);
          postSheetRow('Boxes', { ...original, Status: 'Active' });
          const placementsBackup = backups[binId + '_placements'] || [];
          for (const p of placementsBackup) {
            postSheetRow('Placements', p);
            setPlacements(prev => [...prev.filter(old => old.Placement_ID !== p.Placement_ID), p]);
          }
          delete backups[binId];
          delete backups[binId + '_placements'];
          setStored('sicca_box_backups', backups);
        }
      }
    }

    setRecycleBin(prev => prev.filter(i => i.Bin_ID !== binId));
    toast({ title: 'Restored', description: `${item.Item_Name} restored.` });
    return { success: true };
  }, [recycleBin, setRecycleBin, setEntries, setUsers, setVendors, setItemMaster, setCupboards, setBoxes, setPlacements, toast]);

  const emptyBin = useCallback(() => {
    setRecycleBin([]);
    if (isClient) {
      setStored('sicca_entry_backups', {});
      setStored('sicca_user_backups', {});
      setStored('sicca_vendor_backups', {});
      setStored('sicca_item_master_backups', {});
    }
    toast({ title: 'Recovery Vault Emptied', description: 'All items deleted permanently.' });
    return { success: true };
  }, [setRecycleBin, toast]);

  return {
    items: recycleBin,
    restoreItem,
    emptyBin,
    refresh: () => {}
  };
}

// 7. ACTIVITY LOG HOOK
export function useActivityLog() {
  const [logs] = useLocalState<ActivityLog[]>('sicca_activity_log', DEMO_ACTIVITY_LOG);
  return {
    logs,
    refresh: () => {}
  };
}

// 8. VENDORS HOOK
export function useVendors() {
  const [vendors, setVendors] = useLocalState<Vendor[]>('sicca_vendors', DEMO_VENDORS);
  const [recycleBin, setRecycleBin] = useLocalState<RecycleItem[]>('sicca_recycle_bin', DEMO_RECYCLE_BIN);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const loadFromBackend = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const raw = await fetchSheetTab('database', 'Vendors');
      const vendorMap = new Map<string, Vendor>();
      raw.forEach((v: any) => { if (v.Vendor_ID) vendorMap.set(v.Vendor_ID, v); });
      setVendors(Array.from(vendorMap.values()).filter((v: any) => v.Status !== 'Deleted'));
    } catch (err: any) {
      console.error('Failed to load vendors:', err);
      if (isInitial) {
        toast({ title: 'Showing demo data — backend unreachable', description: 'Using local fallback data.', variant: 'destructive' });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [setVendors, toast]);

  useEffect(() => {
    loadFromBackend(true);
    const delay = 30000 + Math.floor(Math.random() * 8000);
    const interval = setInterval(() => loadFromBackend(false), delay);
    return () => clearInterval(interval);
  }, [loadFromBackend]);

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
      await postSheetRow('Vendors', newVendor);
      setVendors(prev => [...prev, newVendor as any]);
      addSystemLog('CREATE_VENDOR', `Vendor "${newVendor.Vendor_Name}" added`);
      toast({ title: 'Success', description: `Vendor ${newVendor.Vendor_Name} added.` });
      return { success: true, vendorId: id };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to write to Google Sheets. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [vendors, setVendors, toast]);

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
      await postSheetRow('Vendors', updated);
      setVendors(prev => prev.map(v => v.Vendor_ID === vendorId ? { ...v, ...updated } as any : v));
      addSystemLog('UPDATE_VENDOR', `Vendor ID ${vendorId} updated`);
      toast({ title: 'Updated', description: 'Vendor details updated.' });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to update Google Sheets. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [vendors, setVendors, toast]);

  const deleteVendor = useCallback((vendorId: string) => {
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
    setRecycleBin(prev => [newBinItem, ...prev]);
    setVendors(prev => prev.filter(v => v.Vendor_ID !== vendorId));

    if (isClient) {
      const backups = getStored<Record<string, any>>('sicca_vendor_backups', {});
      backups[newBinItem.Bin_ID] = vendorToDelete;
      setStored('sicca_vendor_backups', backups);
    }

    addSystemLog('DELETE_VENDOR', `Vendor "${vendorToDelete.Vendor_Name}" deleted`);
    toast({ title: 'Deleted', description: 'Vendor moved to Recovery Vault.' });
    return { success: true };
  }, [vendors, setVendors, setRecycleBin, toast]);

  return {
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    loading,
    refresh: () => loadFromBackend(true)
  };
}

// 9. ITEM MASTER HOOK
export function useItemMaster() {
  const [items, setItems] = useLocalState<ItemMaster[]>('sicca_item_master', DEMO_ITEM_MASTER);
  const [pendingItems, setPendingItems] = useLocalState<ItemMaster[]>('sicca_pending_items', []);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const loadFromBackend = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await fetchSheetTab('database', 'Item_Master');
      
      // Deduplicate: take the latest entry by Item_ID
      const itemMap = new Map<string, ItemMaster>();
      data.forEach((i: any) => {
        if (i.Item_ID) {
          itemMap.set(i.Item_ID, i);
        }
      });
      const activeItems = Array.from(itemMap.values()).filter(i => i.Status !== 'Deleted' && i.Status !== 'Pending Review');
      const pItems = Array.from(itemMap.values()).filter(i => i.Status === 'Pending Review');
      setItems(activeItems);
      setPendingItems(pItems);
    } catch (err: any) {
      console.error('Failed to fetch Item_Master from backend:', err);
      if (isInitial) {
        toast({
          title: 'Showing demo data — backend unreachable',
          description: 'Using local fallback data.',
          variant: 'destructive'
        });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [setItems, setPendingItems, toast]);

  useEffect(() => {
    loadFromBackend(true);
    const delay = 30000 + Math.floor(Math.random() * 8000);
    const interval = setInterval(() => {
      loadFromBackend(false);
    }, delay);
    return () => clearInterval(interval);
  }, [loadFromBackend]);

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
      await postSheetRow('Item_Master', newItem);
      
      // Optimistic update
      if (newItem.Status === 'Pending Review') {
        setPendingItems(prev => [...prev, newItem as any]);
      } else {
        setItems(prev => [...prev, newItem as any]);
      }
      addSystemLog('CREATE_ITEM_MASTER', `Item "${form.itemName}" catalogued (Status: ${newItem.Status})`);
      toast({ title: 'Success', description: `Item "${form.itemName}" catalogued.` });
      return { success: true, itemId: id, itemCode: newItem.Item_Code as string };
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: 'Failed to write to Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [setItems, setPendingItems, toast]);

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
      await postSheetRow('Item_Master', updatedItem);
      
      // Optimistic update
      setItems(prev => prev.map(i => i.Item_ID === itemId ? updatedItem as any : i));
      addSystemLog('UPDATE_ITEM_MASTER', `Item ID ${itemId} updated`);
      toast({ title: 'Updated', description: 'Item master catalog updated.' });
      return { success: true };
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: 'Failed to update Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [items, setItems, toast]);

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
      await postSheetRow('Item_Master', deletedItem);
      
      // Optimistic update
      setItems(prev => prev.filter(i => i.Item_ID !== itemId));
      setPendingItems(prev => prev.filter(i => i.Item_ID !== itemId));
      addSystemLog('DELETE_ITEM_MASTER', `Item "${existing.Item_Name}" deleted`);
      toast({ title: 'Deleted', description: 'Item removed from catalogue.' });
      return { success: true };
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: 'Failed to delete item from Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [items, setItems, setPendingItems, toast]);

  const approveItem = useCallback(async (itemId: string) => {
    const item = items.find(i => i.Item_ID === itemId) || (pendingItems.find(p => p.Item_ID === itemId));
    if (!item) return { success: false, error: 'Item not found' };
    const updated: ItemMaster = { ...item, Status: 'Active', Last_Updated: new Date().toLocaleString() };
    try {
      await postSheetRow('Item_Master', updated);
      setItems(prev => [...prev.filter(i => i.Item_ID !== itemId), updated]);
      setPendingItems(prev => prev.filter(p => p.Item_ID !== itemId));
      addSystemLog('APPROVE_ITEM', `Pending item "${item.Item_Name}" approved`);
      toast({ title: 'Approved', description: `Item "${item.Item_Name}" approved and added to catalog.` });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to approve item: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [items, pendingItems, setItems, setPendingItems, toast]);

  const rejectItem = useCallback(async (itemId: string, mapToItemCode?: string) => {
    const item = items.find(i => i.Item_ID === itemId) || (pendingItems.find(p => p.Item_ID === itemId));
    if (!item) return { success: false, error: 'Item not found' };
    const updated: ItemMaster = { ...item, Status: 'Deleted', Last_Updated: new Date().toLocaleString() };
    try {
      await postSheetRow('Item_Master', updated);
      setPendingItems(prev => prev.filter(p => p.Item_ID !== itemId));
      setItems(prev => prev.filter(i => i.Item_ID !== itemId));

      if (mapToItemCode) {
        // Fetch fresh entries and placements directly from database
        const rawEntries = await fetchSheetTab('database', 'Stock_Register');
        const rawPlacements = await fetchSheetTab('database', 'Placements');
        
        // Find existing item details
        const existingItem = items.find(i => i.Item_Code === mapToItemCode);
        if (existingItem) {
          // 1. Update entries in Stock_Register
          const matchingEntries = rawEntries.filter((e: any) => e.Item_Code === item.Item_Code);
          for (const entry of matchingEntries) {
            const updatedEntry = {
              ...entry,
              Item_Code: existingItem.Item_Code,
              Item_Name: existingItem.Item_Name
            };
            await postSheetRow('Stock_Register', updatedEntry);
          }
          // 2. Update placements in Placements
          const matchingPlacements = rawPlacements.filter((p: any) => p.Item_Code === item.Item_Code);
          for (const plc of matchingPlacements) {
            const updatedPlc = {
              ...plc,
              Item_Code: existingItem.Item_Code
            };
            await postSheetRow('Placements', updatedPlc);
          }
          
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
  }, [items, pendingItems, setItems, setPendingItems, toast]);

  return {
    items,
    pendingItems,
    addItem,
    updateItem,
    deleteItem,
    approveItem,
    rejectItem,
    loading,
    refresh: () => loadFromBackend(true)
  };
}

export function useCupboards() {
  const [cupboards, setCupboards] = useLocalState<Cupboard[]>('sicca_cupboards', DEMO_CUPBOARDS);
  const [cupboardItems, setCupboardItems] = useLocalState<CupItem[]>('sicca_cupboard_items', DEMO_CUPBOARD_ITEMS);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recycleBin, setRecycleBin] = useLocalState<RecycleItem[]>('sicca_recycle_bin', DEMO_RECYCLE_BIN);

  const loadFromBackend = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const rawCups = await fetchSheetTab('database', 'Cupboards');
      const rawItems = await fetchSheetTab('database', 'Cupboard_Items');
      const rawCatalog = await fetchSheetTab('database', 'Item_Master');
      const rawEntries = await fetchSheetTab('database', 'Stock_Register');

      // 1. Deduplicate cupboards: take the latest entry by Cupboard_ID
      const cupMap = new Map<string, Cupboard>();
      rawCups.forEach((c: any) => {
        if (c.Cupboard_ID) {
          cupMap.set(c.Cupboard_ID, c);
        }
      });
      const activeCups = Array.from(cupMap.values()).filter(c => c.Status !== 'Deleted');

      // 2. Deduplicate catalog items: take the latest entry by Item_ID / Item_Code
      const catalogMap = new Map<string, ItemMaster>();
      rawCatalog.forEach((i: any) => {
        if (i.Item_ID) {
          catalogMap.set(i.Item_ID, i);
        }
      });
      const activeCatalog = Array.from(catalogMap.values()).filter(i => i.Status !== 'Deleted');

      // 3. Deduplicate cupboard items: take the latest entry by Item_ID
      const itemMap = new Map<string, CupItem>();
      rawItems.forEach((i: any) => {
        if (i.Item_ID) {
          itemMap.set(i.Item_ID, i);
        }
      });
      const activeItems = Array.from(itemMap.values()).filter(i => (i as any).Status !== 'Deleted');

      // 4. Enrich Cupboard_Items with Item_Master information and Stock_Register live quantities
      const enrichedItems: CupItem[] = activeItems.map(item => {
        // Find by Item_Code or Item_ID
        const matchedItem = activeCatalog.find(
          c => c.Item_Code === item.Item_Code || c.Item_ID === item.Item_Code
        );

        // Sum live quantity (Inward_Qty - Outward_Qty) for this Item_Code in Stock_Register
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

      // 5. Dynamically calculate cupboards aggregates
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

      setCupboards(enrichedCups);
      setCupboardItems(enrichedItems);
    } catch (err: any) {
      console.error('Failed to load cupboards/items from backend:', err);
      if (isInitial) {
        toast({
          title: 'Showing demo data — backend unreachable',
          description: 'Using local fallback data.',
          variant: 'destructive'
        });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [setCupboards, setCupboardItems, toast]);

  useEffect(() => {
    loadFromBackend(true);
    const delay = 30000 + Math.floor(Math.random() * 8000);
    const interval = setInterval(() => {
      loadFromBackend(false);
    }, delay);
    return () => clearInterval(interval);
  }, [loadFromBackend]);

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
      await postSheetRow('Cupboards', newCup);
      
      // Optimistic update
      setCupboards(prev => {
        const nextCup = {
          ...newCup,
          _itemCount: 0,
          _totalQty: 0,
          _lowStock: 0
        } as any;
        return [...prev, nextCup];
      });
      addSystemLog('CREATE_CUPBOARD', `Cupboard ${form.number} created`);
      toast({ title: 'Success', description: `Cupboard ${form.number} added.` });
      return { success: true, cupboardId: id };
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: 'Failed to write to Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [cupboards, setCupboards, toast]);

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
      await postSheetRow('Cupboards', updatedCup);

      // Optimistic update
      setCupboards(prev => prev.map(c => c.Cupboard_ID === cupboardId ? { ...c, ...updatedCup } as any : c));
      addSystemLog('UPDATE_CUPBOARD', `Cupboard ID ${cupboardId} updated`);
      toast({ title: 'Updated', description: 'Cupboard configuration saved.' });
      return { success: true };
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: 'Failed to update Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [cupboards, setCupboards, toast]);

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
      await postSheetRow('Cupboards', deletedCup);

      const newBinItem: RecycleItem = {
        Bin_ID: 'BIN-' + Date.now(),
        Original_ID: existing.Cupboard_ID,
        Type: 'Cupboard',
        Item_Name: `Container: ${existing.Cupboard_Number} - ${existing.Name}`,
        Deleted_By: 'Admin',
        Date_Time: new Date().toLocaleString()
      };
      setRecycleBin(prev => [newBinItem, ...prev]);

      if (isClient) {
        const backups = getStored<Record<string, any>>('sicca_cupboard_backups', {});
        backups[newBinItem.Bin_ID] = existing;
        setStored('sicca_cupboard_backups', backups);
      }

      // Optimistic update: filter out the deleted cupboard and its items
      setCupboards(prev => prev.filter(c => c.Cupboard_ID !== cupboardId));
      setCupboardItems(prev => prev.filter(i => i.Cupboard_ID !== cupboardId));
      addSystemLog('DELETE_CUPBOARD', `Cupboard "${existing.Name}" deleted`);
      toast({ title: 'Deleted', description: 'Container moved to Recovery Vault.' });
      return { success: true };
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: 'Failed to delete cupboard on Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [cupboards, setCupboards, setCupboardItems, setRecycleBin, toast]);

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
      await postSheetRow('Cupboard_Items', newItem);
      
      await loadFromBackend(false);
      
      toast({ title: 'Added', description: `Item added to cupboard.` });
      return { success: true };
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: 'Failed to add item to Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [cupboardItems, loadFromBackend, toast]);

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
      await postSheetRow('Cupboard_Items', updatedItem);

      await loadFromBackend(false);

      toast({ title: 'Updated', description: 'Item updated.' });
      return { success: true };
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: 'Failed to update item on Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [cupboardItems, loadFromBackend, toast]);

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
      await postSheetRow('Cupboard_Items', deletedItem);

      await loadFromBackend(false);

      toast({ title: 'Removed', description: 'Item deleted from cupboard.' });
      return { success: true };
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: 'Failed to delete item from Google Sheets. ' + err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    }
  }, [cupboardItems, loadFromBackend, toast]);

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
    refresh: () => loadFromBackend(true)
  };
}

// 10b. BOXES / PLACEMENTS HOOK (per-item storage location inside a cupboard)
export function useBoxesAndPlacements() {
  const [boxes, setBoxes] = useLocalState<Box[]>('sicca_boxes', DEMO_BOXES);
  const [placements, setPlacements] = useLocalState<Placement[]>('sicca_placements', DEMO_PLACEMENTS);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recycleBin, setRecycleBin] = useLocalState<RecycleItem[]>('sicca_recycle_bin', DEMO_RECYCLE_BIN);

  const loadFromBackend = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [rawBoxes, rawPlacements] = await Promise.all([
        fetchSheetTab('database', 'Boxes'),
        fetchSheetTab('database', 'Placements'),
      ]);
      const boxMap = new Map<string, Box>();
      rawBoxes.forEach((b: any) => { if (b.Box_ID && b.Status !== 'Deleted') boxMap.set(b.Box_ID, b); });
      const placementMap = new Map<string, Placement>();
      rawPlacements.forEach((p: any) => { if (p.Placement_ID) placementMap.set(p.Placement_ID, p); });
      setBoxes(Array.from(boxMap.values()));
      setPlacements(Array.from(placementMap.values()));
    } catch (err: any) {
      console.error('Failed to load boxes/placements:', err);
      if (isInitial) {
        toast({ title: 'Showing demo data — backend unreachable', description: 'Using local fallback data.', variant: 'destructive' });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [setBoxes, setPlacements, toast]);

  useEffect(() => {
    loadFromBackend(true);
    const delay = 30000 + Math.floor(Math.random() * 8000);
    const interval = setInterval(() => loadFromBackend(false), delay);
    return () => clearInterval(interval);
  }, [loadFromBackend]);

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
      await postSheetRow('Boxes', newBox);
      setBoxes(prev => [...prev, newBox]);
      addSystemLog('CREATE_BOX', `Box "${boxName}" added to cupboard ID ${cupboardId}`);
      return { success: true, box: newBox };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to create box. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [boxes, setBoxes, toast]);

  // Creates a new placement row, or bumps quantity on an existing (item, cupboard, box) match.
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
      await postSheetRow('Placements', row);
      setPlacements(prev => existing ? prev.map(p => p.Placement_ID === row.Placement_ID ? row : p) : [...prev, row]);
      addSystemLog('ADD_PLACEMENT', `Placed quantity ${quantity} for item "${itemCode}" in Box ID ${boxId}`);
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to save location. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [placements, setPlacements, toast]);

  // Zeroes out a placement's quantity (frees it back to "unassigned") — the generic sheet
  // writer is append-only, so "remove" is an update-by-same-ID to Quantity: 0, same idiom
  // as updateItem/updateCupboard. Callers should filter qty <= 0 out of box item lists.
  const removePlacement = useCallback(async (placementId: string) => {
    const existing = placements.find(p => p.Placement_ID === placementId);
    if (!existing) return { success: false, error: 'Placement not found' };
    const row: Placement = { ...existing, Quantity: '0', Last_Updated: new Date().toLocaleString() };
    try {
      await postSheetRow('Placements', row);
      setPlacements(prev => prev.map(p => p.Placement_ID === placementId ? row : p));
      addSystemLog('REMOVE_PLACEMENT', `Removed item "${existing.Item_Code}" placement from Box ID ${existing.Box_ID}`);
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to remove item. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [placements, setPlacements, toast]);

  // Reduces a placement's quantity by a partial amount (e.g. an Outward pick from that
  // location) — same update-by-same-ID idiom as removePlacement, but subtracts rather
  // than zeroing. Never goes below 0.
  const reducePlacementQty = useCallback(async (placementId: string, qtyToRemove: number) => {
    const existing = placements.find(p => p.Placement_ID === placementId);
    if (!existing) return { success: false, error: 'Placement not found' };
    const nextQty = Math.max(0, parseFloat(existing.Quantity || '0') - qtyToRemove);
    const row: Placement = { ...existing, Quantity: String(nextQty), Last_Updated: new Date().toLocaleString() };
    try {
      await postSheetRow('Placements', row);
      setPlacements(prev => prev.map(p => p.Placement_ID === placementId ? row : p));
      addSystemLog('REDUCE_PLACEMENT', `Took ${qtyToRemove} of "${existing.Item_Code}" from Box ID ${existing.Box_ID}`);
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to update location quantity. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [placements, setPlacements, toast]);

  const deleteBox = useCallback(async (boxId: string) => {
    const existing = boxes.find(b => b.Box_ID === boxId);
    if (!existing) return { success: false, error: 'Box not found' };
    const deletedBox: Box & { Status?: string } = { ...existing, Status: 'Deleted' };
    try {
      await postSheetRow('Boxes', deletedBox);

      const newBinItem: RecycleItem = {
        Bin_ID: 'BIN-' + Date.now(),
        Original_ID: existing.Box_ID,
        Type: 'Box',
        Item_Name: `Box: ${existing.Box_Name}`,
        Deleted_By: 'Admin',
        Date_Time: new Date().toLocaleString()
      };
      setRecycleBin(prev => [newBinItem, ...prev]);

      if (isClient) {
        const backups = getStored<Record<string, any>>('sicca_box_backups', {});
        backups[newBinItem.Bin_ID] = existing;
        const boxPlacements = placements.filter(p => p.Box_ID === boxId && parseFloat(p.Quantity || '0') > 0);
        backups[newBinItem.Bin_ID + '_placements'] = boxPlacements;
        setStored('sicca_box_backups', backups);
      }

      setBoxes(prev => prev.filter(b => b.Box_ID !== boxId));
      // Also set placements in this box to Quantity: 0
      const boxPlacements = placements.filter(p => p.Box_ID === boxId && parseFloat(p.Quantity || '0') > 0);
      for (const p of boxPlacements) {
        const row: Placement = { ...p, Quantity: '0', Last_Updated: new Date().toLocaleString() };
        await postSheetRow('Placements', row);
        setPlacements(prev => prev.map(old => old.Placement_ID === p.Placement_ID ? row : old));
      }
      addSystemLog('DELETE_BOX', `Box "${existing.Box_Name}" deleted`);
      toast({ title: 'Deleted', description: 'Box moved to Recovery Vault.' });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to delete box. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [boxes, setBoxes, placements, setPlacements, setRecycleBin, toast]);

  return { boxes, placements, getBoxesForCupboard, addBox, addPlacement, removePlacement, reducePlacementQty, deleteBox, loading, refresh: () => loadFromBackend(true) };
}

// 10c. EMPLOYEES (sourced from Users tab — autocomplete + unverified "+ New" for Inward form)
export function useEmployees() {
  const [employees, setEmployees] = useLocalState<User[]>('sicca_employees', DEMO_USERS);
  const [hiddenEmployees, setHiddenEmployees] = useLocalState<string[]>('sicca_hidden_employees', []);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const loadFromBackend = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const raw = await fetchSheetTab('database', 'Users');
      const userMap = new Map<string, User>();
      raw.forEach((u: any) => { if (u.User_ID) userMap.set(u.User_ID, u); });
      setEmployees(Array.from(userMap.values()).filter((u: any) => u.Status !== 'Deleted'));
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      if (isInitial) {
        toast({ title: 'Showing demo data — backend unreachable', description: 'Using local fallback data.', variant: 'destructive' });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [setEmployees, toast]);

  useEffect(() => {
    loadFromBackend(true);
    const delay = 30000 + Math.floor(Math.random() * 8000);
    const interval = setInterval(() => loadFromBackend(false), delay);
    return () => clearInterval(interval);
  }, [loadFromBackend]);

  const hideEmployee = useCallback((name: string) => {
    setHiddenEmployees(prev => {
      if (prev.includes(name)) return prev;
      return [...prev, name];
    });
  }, [setHiddenEmployees]);

  const unhideEmployee = useCallback((name: string) => {
    setHiddenEmployees(prev => prev.filter(n => n !== name));
  }, [setHiddenEmployees]);

  // Creates a lightweight, unverified employee record — not a login account (no password set).
  const addEmployee = useCallback(async (fullName: string) => {
    const newEmployee: Record<string, any> = {
      User_ID: 'USR-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      Full_Name: fullName, Display_Name: fullName,
      Status: 'Active', Verified: 'NO', Permissions: '{}',
      Created_On: new Date().toLocaleString()
    };
    try {
      await postSheetRow('Users', newEmployee);
      setEmployees(prev => [...prev, newEmployee as User]);
      return { success: true, employee: newEmployee as User };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to add employee. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [setEmployees, toast]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => !hiddenEmployees.includes(emp.Full_Name));
  }, [employees, hiddenEmployees]);

  return {
    employees: filteredEmployees,
    rawEmployees: employees,
    hiddenEmployees,
    hideEmployee,
    unhideEmployee,
    addEmployee,
    loading,
    refresh: () => loadFromBackend(true)
  };
}

// 10d. INVOICES HOOK
export function useInvoices() {
  const [invoices, setInvoices] = useLocalState<Invoice[]>('sicca_invoices', DEMO_INVOICES);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const loadFromBackend = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const raw = await fetchSheetTab('database', 'Invoices');
      const list = raw.filter((i: any) => i.Invoice_No && String(i.Invoice_No).trim() !== '');
      setInvoices(list);
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
      if (isInitial) {
        toast({ title: 'Showing demo data — backend unreachable', description: 'Using local fallback data.', variant: 'destructive' });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [setInvoices, toast]);

  useEffect(() => {
    loadFromBackend(true);
    const delay = 30000 + Math.floor(Math.random() * 8000);
    const interval = setInterval(() => loadFromBackend(false), delay);
    return () => clearInterval(interval);
  }, [loadFromBackend]);

  const addInvoice = useCallback(async (form: { invoiceNo: string; vendorName: string; date: string; employeeName: string; totalValue: number }) => {
    const newInvoice: Invoice = {
      Invoice_No: form.invoiceNo, Vendor_Name: form.vendorName, Date: form.date,
      Employee_Name: form.employeeName, Total_Value: form.totalValue.toFixed(2),
      Created_On: new Date().toLocaleString()
    };
    try {
      await postSheetRow('Invoices', newInvoice);
      setInvoices(prev => [...prev, newInvoice]);
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Network Error', description: 'Failed to save invoice. ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [setInvoices, toast]);

  return { invoices, addInvoice, loading, refresh: () => loadFromBackend(true) };
}

// 11. GST SUMMARY HOOK
export function useGstSummary() {
  const { entries, loading } = useInventoryEntries();

  const inwardEntries = entries.filter(e => e.Transaction_Type === 'Inward');
  
  // Dynamically group by rate
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
  const [settings, setSettings] = useLocalState<any>('sicca_settings', DEMO_SETTINGS);
  const { toast } = useToast();

  const saveSettings = useCallback((newSettings: any) => {
    setSettings((prev: any) => ({ ...prev, ...newSettings }));
    addSystemLog('SAVE_SETTINGS', 'System settings saved');
    toast({ title: 'Success', description: 'System settings updated.' });
    return { success: true };
  }, [setSettings, toast]);

  const changePassword = useCallback((data: any) => {
    addSystemLog('SAVE_SETTINGS', 'Admin password changed');
    return { success: true };
  }, []);

  return {
    settings,
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
  const [tasks, setTasks] = useLocalState<Task[]>('sicca_tasks', []);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const loadFromBackend = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await fetchSheetTab('database', 'Tasks');
      if (data) {
        setTasks([...data].reverse() as Task[]);
      }
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      if (isInitial) {
        toast({ title: 'Showing demo data — backend unreachable', description: 'Using local fallback data.', variant: 'destructive' });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [setTasks, toast]);

  useEffect(() => {
    loadFromBackend(true);
    const delay = 30000 + Math.floor(Math.random() * 8000);
    const interval = setInterval(() => loadFromBackend(false), delay);
    return () => clearInterval(interval);
  }, [loadFromBackend]);

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    setTasks(prev => prev.map(t => t.Task_ID === taskId ? { ...t, Status: status } : t));
    addSystemLog('TASK_UPDATE', `Task ID ${taskId} changed status to "${status}"`);
    try {
      const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
      if (!urlStr) throw new Error('NEXT_PUBLIC_SHEETS_API_URL not configured');
      
      const res = await fetch(urlStr, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'updateTaskStatus',
          taskId,
          status,
          token: localStorage.getItem('sicca_session_token') || 'demo-admin-token'
        })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (!json || json.success === false) {
        throw new Error(json?.error || 'Failed to update task status');
      }
      return { success: true };
    } catch (err: any) {
      loadFromBackend(false);
      toast({ title: 'Error', description: 'Failed to update task status: ' + err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    }
  }, [setTasks, loadFromBackend, toast]);

  return { tasks, updateTaskStatus, loading, refresh: () => loadFromBackend(true) };
}
