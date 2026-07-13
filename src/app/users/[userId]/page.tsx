"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ChevronDown, ShieldCheck, History, Activity, FileText, CheckSquare, Trash2 } from 'lucide-react';
import { useUsers, useInventoryEntries, useTasks, useLocalState } from '@/hooks/use-inventory-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn, safeStr } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { parsePermissions, isAdminManagerRole, PermData } from '@/lib/permissions';

// Top-level = page visibility; nested = that page's granular actions.
// Keys mirror PAGE_CONFIG / the sidebar nav so this stays meaningful as pages are added.
const PAGE_PERMISSIONS: { key: string; label: string; perms: { key: string; label: string }[] }[] = [
  { key: 'dashboard', label: 'Dashboard', perms: [] },
  { key: 'inventory', label: 'Stock Register', perms: [
    { key: 'add_inward', label: 'Add Inward Entry' },
    { key: 'add_outward', label: 'Add Outward Entry' },
    { key: 'edit_entries', label: 'Edit Entries' },
    { key: 'delete_entries', label: 'Delete Entries' },
    { key: 'view_price', label: 'View Prices' },
  ] },
  { key: 'invoices', label: 'Invoices', perms: [] },
  { key: 'inventoryMap', label: 'Storage Map', perms: [
    { key: 'add_container', label: 'Add Container / Box' },
    { key: 'place_items', label: 'Place Items' },
  ] },
  { key: 'itemMaster', label: 'Item Master', perms: [
    { key: 'add_edit_items', label: 'Add / Edit Items' },
  ] },
  { key: 'vendors', label: 'Vendors', perms: [
    { key: 'manage_vendors', label: 'Add / Edit Vendors' },
  ] },
  { key: 'gstSummary', label: 'GST Summary', perms: [
    { key: 'export_data', label: 'Export Data' },
  ] },
  { key: 'noticeBoard', label: 'Notice Board', perms: [
    { key: 'post_notice', label: 'Post Notices' },
  ] },
  { key: 'tasks', label: 'Tasks', perms: [] },
  { key: 'users', label: 'Users', perms: [
    { key: 'manage_users', label: 'Create / Edit Users' },
    { key: 'edit_permissions', label: 'Edit Permissions' },
  ] },
  { key: 'roles', label: 'Roles', perms: [
    { key: 'manage_roles', label: 'Manage Roles' },
  ] },
  { key: 'activityLog', label: 'Activity Log', perms: [] },
  { key: 'recycleBin', label: 'Recycle Bin', perms: [
    { key: 'restore_items', label: 'Restore Items' },
    { key: 'empty_bin', label: 'Empty Bin Permanently' },
  ] },
  { key: 'settings', label: 'Settings', perms: [
    { key: 'modify_settings', label: 'Modify App Settings' },
  ] },
];

// Check if a string signifies verified status
function isVerified(verified?: string) {
  return String(verified || '').trim().toUpperCase() === 'YES';
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = String(params.userId);
  const { user: currentUser } = useAuth();
  const { users, updateUser, deleteUser, loading } = useUsers();
  const user = users.find(u => u.User_ID === userId) as any;

  const { entries } = useInventoryEntries();
  const { tasks } = useTasks();
  const [activityLogs] = useLocalState<any[]>('sicca_activity_log', []);

  const [perms, setPerms] = useState<PermData>({ pages: {}, granular: {}, notifications: {} });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // This editor manages access itself — Admin-only, regardless of whether the
  // viewer otherwise has generic "users" page access (e.g. to see the list).
  // A future Developer role gets broad page access elsewhere but not this.
  useEffect(() => {
    if (currentUser && !isAdminManagerRole(currentUser.role)) {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  // Seed local editable state from the user's stored Permissions once they've loaded.
  useEffect(() => {
    if (user && !loaded) {
      setPerms(parsePermissions(user.Permissions));
      setLoaded(true);
    }
  }, [user, loaded]);

  if (currentUser && !isAdminManagerRole(currentUser.role)) {
    return null;
  }

  if (!user) {
    if (loading) {
      return (
        <AppShell>
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full border-2 border-indigo-600/20 border-t-indigo-600 animate-spin" />
              <div className="w-6 h-6 rounded-full bg-indigo-600/10 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-widest mt-2 animate-pulse">
              Loading Profile...
            </span>
          </div>
        </AppShell>
      );
    }
    return (
      <AppShell>
        <div className="py-20 text-center text-muted-foreground">
          <p>User not found.</p>
          <Button variant="ghost" className="mt-3 gap-1.5" onClick={() => router.push('/users')}>
            <ArrowLeft className="h-4 w-4" /> Back to Users
          </Button>
        </div>
      </AppShell>
    );
  }

  const togglePage = (key: string) => setPerms(p => ({ ...p, pages: { ...p.pages, [key]: !p.pages[key] } }));
  const toggleGranular = (pageKey: string, permKey: string) => setPerms(p => ({
    ...p,
    granular: {
      ...p.granular,
      [pageKey]: { ...(p.granular[pageKey] || {}), [permKey]: !p.granular[pageKey]?.[permKey] }
    }
  }));

  const savePermissions = async () => {
    setSaving(true);
    await updateUser(user.User_ID, { permissions: perms });
    setSaving(false);
  };

  const verified = isVerified(user.Verified);
  const initials = String(user.Full_Name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  // Filter logs, ledger entries, and tasks for this user
  const userLogs = activityLogs.filter(log =>
    safeStr(log.User_Name).toLowerCase() === safeStr(user.Full_Name).toLowerCase() ||
    safeStr(log.Target).toLowerCase().includes(safeStr(user.User_ID).toLowerCase()) ||
    safeStr(log.Target).toLowerCase().includes(safeStr(user.Full_Name).toLowerCase())
  );

  const userEntries = entries.filter(e =>
    safeStr(e.Employee_Name).toLowerCase() === safeStr(user.Full_Name).toLowerCase() ||
    safeStr(e.Issued_To).toLowerCase() === safeStr(user.Full_Name).toLowerCase()
  );

  const userTasks = tasks.filter(t =>
    t.Assigned_To_User_ID === user.User_ID
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl animate-in fade-in duration-500">
        <button onClick={() => router.push('/users')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </button>

        {/* Personal details */}
        <Card className="border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Avatar className="h-16 w-16 shrink-0">
                {user.Photo_URL && <AvatarImage src={user.Photo_URL} alt={user.Full_Name} />}
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{user.Full_Name}{!verified && <span className="text-red-500">*</span>}</h1>
                  {!verified && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Unverified</span>}
                </div>
                <p className="text-sm text-muted-foreground">{user.Role} · {user.Department || 'No department set'}</p>
              </div>
            </div>
            <div className="shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardContent className="p-6 grid grid-cols-2 gap-4 text-sm">
            <div><Label className="text-xs text-muted-foreground">Email</Label><p className="mt-0.5">{user.Email || '—'}</p></div>
            <div><Label className="text-xs text-muted-foreground">Phone</Label><p className="mt-0.5">{user.Phone || '—'}</p></div>
            <div><Label className="text-xs text-muted-foreground">Department</Label><p className="mt-0.5">{user.Department || '—'}</p></div>
            <div><Label className="text-xs text-muted-foreground">Employee ID</Label><p className="mt-0.5">{user.Employee_ID || '—'}</p></div>
          </CardContent>
        </Card>

        {/* Progressive permissions: page toggle first, click to reveal granular actions */}
        <Card className="border-none shadow-md">
          <CardContent className="p-0">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Page Access &amp; Permissions</p>
              </div>
              <Button size="sm" onClick={savePermissions} disabled={saving}>{saving ? 'Saving…' : 'Save Permissions'}</Button>
            </div>
            <div className="divide-y">
              {PAGE_PERMISSIONS.map(page => {
                const canView = !!perms.pages[page.key];
                const isOpen = expanded === page.key;
                const hasGranular = page.perms.length > 0;
                return (
                  <div key={page.key}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <button
                        onClick={() => hasGranular && setExpanded(isOpen ? null : page.key)}
                        className={cn('flex items-center gap-2 text-sm font-medium flex-1 text-left', hasGranular && 'hover:text-primary')}
                      >
                        {hasGranular && <ChevronDown className={cn('h-3.5 w-3.5 transition-transform shrink-0', isOpen && 'rotate-180')} />}
                        {page.label}
                      </button>
                      <Switch checked={canView} onCheckedChange={() => togglePage(page.key)} />
                    </div>
                    {isOpen && hasGranular && (
                      <div className="px-4 pb-3 pl-9 space-y-2 bg-muted/20">
                        {!canView && <p className="text-[11px] text-muted-foreground italic">Enable page access above to grant these.</p>}
                        {page.perms.map(p => (
                          <label key={p.key} className={cn('flex items-center gap-2 text-xs', !canView && 'opacity-50')}>
                            <Checkbox
                              checked={!!perms.granular[page.key]?.[p.key]}
                              onCheckedChange={() => toggleGranular(page.key, p.key)}
                              disabled={!canView}
                            />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Receive Low-Stock Alerts</p>
                <p className="text-[11px] text-muted-foreground">Notification preference — not a page permission.</p>
              </div>
              <Switch
                checked={!!perms.notifications?.lowStockAlerts}
                onCheckedChange={() => setPerms(p => ({
                  ...p,
                  notifications: { ...p.notifications, lowStockAlerts: !p.notifications?.lowStockAlerts }
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Activity & History Section */}
        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-primary">Activity &amp; History Log</h2>
            </div>

            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4 bg-muted/40 p-1 rounded-xl">
                <TabsTrigger value="activity" className="gap-2 rounded-lg py-2">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Actions ({userLogs.length})</span>
                </TabsTrigger>
                <TabsTrigger value="transactions" className="gap-2 rounded-lg py-2">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Ledger ({userEntries.length})</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-2 rounded-lg py-2">
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Tasks ({userTasks.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-3">
                {userLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No system activity logged for this user.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {userLogs.map((log: any, i: number) => (
                      <div key={i} className="flex justify-between items-start gap-4 p-3 rounded-lg bg-muted/30 border border-muted/20 text-xs">
                        <div>
                          <p className="font-semibold text-primary">{log.Action}</p>
                          <p className="text-muted-foreground mt-0.5">{log.Target}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">{log.Date_Time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transactions" className="space-y-3">
                {userEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No inward or outward stock transactions recorded.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {userEntries.map((e: any, i: number) => (
                      <div key={i} className="flex justify-between items-start gap-4 p-3 rounded-lg bg-muted/30 border border-muted/20 text-xs">
                        <div>
                          <p className="font-semibold text-primary">
                            {e.Transaction_Type} of {e.Transaction_Type === 'Inward' ? e.Inward_Qty : e.Outward_Qty} {e.Unit || 'pcs'}
                          </p>
                          <p className="text-muted-foreground mt-0.5">{e.Item_Name} ({e.Item_Code})</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Location: {e.Location || 'Default'} | Ref: {e.Invoice_No || 'N/A'}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">{e.Date_Time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tasks" className="space-y-3">
                {userTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No tasks assigned to this user.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {userTasks.map((t: any, i: number) => (
                      <div key={i} className="flex justify-between items-center gap-4 p-3 rounded-lg bg-muted/30 border border-muted/20 text-xs">
                        <div>
                          <p className="font-semibold text-primary">{t.Text}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Created: {t.Created_On}</p>
                        </div>
                        <Badge variant={t.Status === 'Completed' ? 'default' : t.Status === 'In Progress' ? 'secondary' : 'outline'} className="text-[10px] uppercase font-bold shrink-0">
                          {t.Status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {showDeleteConfirm && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" /> Delete User Profile?
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm text-muted-foreground">
              <p>
                Are you sure you want to delete user <strong className="text-foreground">{user.Full_Name}</strong> ({user.Email})?
              </p>

              <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Choose Deletion Option:</p>
                
                {/* Option A */}
                <div className="space-y-1">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left border-border text-foreground hover:bg-accent font-semibold h-auto py-2.5 px-3 flex flex-col items-start gap-1"
                    onClick={async () => {
                      setIsDeleting(true);
                      await deleteUser(user.User_ID, false);
                      setIsDeleting(false);
                      setShowDeleteConfirm(false);
                      router.push('/users');
                    }}
                    disabled={isDeleting}
                  >
                    <span className="text-xs text-primary font-bold">Option A: Delete User Only</span>
                    <span className="text-[11px] font-normal text-muted-foreground leading-normal">
                      Removes user login/profile. Keep their name as plain text on existing transactions ({userEntries.length}) and tasks ({userTasks.length}). Restorable via Recycle Bin.
                    </span>
                  </Button>
                </div>

                {/* Option B */}
                <div className="space-y-1">
                  <Button
                    variant="destructive"
                    className="w-full justify-start text-left font-semibold h-auto py-2.5 px-3 flex flex-col items-start gap-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={async () => {
                      setIsDeleting(true);
                      await deleteUser(user.User_ID, true);
                      setIsDeleting(false);
                      setShowDeleteConfirm(false);
                      router.push('/users');
                    }}
                    disabled={isDeleting}
                  >
                    <span className="text-xs text-white font-bold">Option B: Delete User + Cascade History</span>
                    <span className="text-[11px] font-normal text-red-100 leading-normal">
                      Removes user login/profile AND deletes/cascades all {userEntries.length} associated Stock Register entries and {userTasks.length} assigned tasks.
                    </span>
                  </Button>
                  <p className="text-[10px] text-amber-600 font-medium px-1 mt-1">
                    * Warning: Option B's cascade deletion of transactions/tasks is permanent and NOT recoverable via the Recycle Bin.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 flex flex-col sm:flex-row border-t pt-4">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}
