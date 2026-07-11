"use client";
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Search, RefreshCw, EyeOff, Eye } from 'lucide-react';
import { useUsers, useRoles, useEmployees, useInventoryEntries } from '@/hooks/use-inventory-data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { flashClick } from '@/lib/click-flash';

type User = {
  User_ID:string; Full_Name:string; Email:string; Role:string; Status:string;
  Department:string; Employee_ID:string; Verified?: string; Photo_URL?: string;
};

function isVerified(u: User) {
  return String(u.Verified || '').trim().toUpperCase() === 'YES';
}

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser, loading: loadingUsers } = useUsers();
  const { roles: roleObjects } = useRoles();
  const { hiddenEmployees, hideEmployee, unhideEmployee } = useEmployees();
  const { entries } = useInventoryEntries();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isDemo] = useState(true);
  const [roles, setRoles] = useState<string[]>(['Super Admin','Inventory Lead','Viewer']);

  const allHistoricalEmployees = useMemo(() => {
    return Array.from(new Set(entries.map(e => e.Employee_Name).filter(Boolean)));
  }, [entries]);

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User|null>(null);
  const [form, setForm] = useState({ fullName:'', email:'', password:'', role:'Viewer', department:'', employeeId:'' });
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (roleObjects?.length) {
      setRoles(roleObjects.map(r => r.Name));
    }
  }, [roleObjects]);

  const load = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 200);
  };

  const openAdd = () => {
    setEditUser(null);
    setForm({ fullName:'', email:'', password:'', role:'Viewer', department:'', employeeId:'' });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.fullName || !form.email) {
      toast({ title: 'Validation Error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    if (!editUser && !form.password) {
      toast({ title: 'Validation Error', description: 'Password required for new users.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editUser) {
        updateUser(editUser.User_ID, form);
      } else {
        addUser(form);
      }
      setShowModal(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' });
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const filtered = users
    .filter(u =>
      !search || String(u.Full_Name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(u.Email || '').toLowerCase().includes(search.toLowerCase()) ||
      String(u.Role || '').toLowerCase().includes(search.toLowerCase())
    )
    // Unverified users first, so they're the first thing an admin sees.
    .slice()
    .sort((a, b) => Number(isVerified(a)) - Number(isVerified(b)));

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Identity Access</h1>
              <p className="text-muted-foreground mt-1">Manage personnel access and system credentials.</p>
            </div>
          </div>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading users...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Identity Access</h1>
            <p className="text-muted-foreground mt-1">
              Manage personnel access and system credentials.
              {isDemo && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Demo data</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={load} className={loading ? 'animate-spin' : ''}><RefreshCw className="h-4 w-4" /></Button>
            <Button onClick={openAdd} className="gap-2"><UserPlus className="h-4 w-4" /> Add User</Button>
          </div>
        </div>

        {/* Unverified Users Approval Banner */}
        {users.filter(u => !isVerified(u)).length > 0 && (
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/70 p-5 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-amber-900 text-sm">Pending Verification ({users.filter(u => !isVerified(u)).length})</h3>
                <p className="text-xs text-amber-800/80 mt-0.5">These staff profiles were created but have not yet been approved for system access.</p>
              </div>
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px]">Needs Attention</Badge>
            </div>

            <div className="divide-y divide-amber-200/50">
              {users.filter(u => !isVerified(u)).map(user => {
                const initials = String(user.Full_Name || '?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                return (
                  <div key={user.User_ID} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        {user.Photo_URL && <AvatarImage src={user.Photo_URL} alt={user.Full_Name} />}
                        <AvatarFallback className="bg-amber-200 text-amber-800 text-xs font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-xs text-amber-955">{user.Full_Name}</p>
                        <p className="text-[10px] text-amber-800/70">{user.Email} · {user.Role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateUser(user.User_ID, { verified: 'YES' });
                          toast({ title: 'Approved', description: `${user.Full_Name} has been verified.` });
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-7 px-3 text-xs"
                        onClick={async (e) => {
                          e.stopPropagation();
                          deleteUser(user.User_ID);
                          toast({ title: 'Deleted', description: `${user.Full_Name} removed.` });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Card className="border-none shadow-md">
          <CardHeader className="border-b pb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {(loading || (loadingUsers && users.length === 0)) ? (
              <div className="py-12 text-center text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No users found.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(user => {
                  const verified = isVerified(user);
                  const initials = String(user.Full_Name || '?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                  return (
                    <button
                      key={user.User_ID}
                      onClick={() => router.push(`/users/${user.User_ID}`)}
                      className={cn(
                        'flex flex-col items-center text-center rounded-2xl border-2 p-4 bg-white shadow-sm hover:shadow-md transition-all',
                        verified ? 'border-border hover:border-primary/40' : 'border-amber-300 hover:border-amber-400'
                      )}>
                      {!verified && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mb-2">* Unverified</span>
                      )}
                      <Avatar className="h-16 w-16 mb-2">
                        {user.Photo_URL && <AvatarImage src={user.Photo_URL} alt={user.Full_Name} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-sm leading-tight">{user.Full_Name}{!verified && <span className="text-red-500">*</span>}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-full">{user.Email}</p>
                      <Badge variant="outline" className="text-[10px] font-semibold mt-2">{user.Role}</Badge>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={cn('h-1.5 w-1.5 rounded-full', user.Status === 'Active' ? 'bg-green-500' : 'bg-muted-foreground')} />
                        <span className="text-[11px] text-muted-foreground">{user.Department || 'No department'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b pb-4">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-muted-foreground" />
              Employee Autocomplete Visibility
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control which employee names appear in transaction autocomplete suggestions.
              Hiding a name does not modify any historical transaction records.
            </p>
          </CardHeader>
          <CardContent className="p-4">
            {allHistoricalEmployees.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No employee records found in history.</p>
            ) : (
              <div className="divide-y max-h-80 overflow-y-auto pr-1">
                {allHistoricalEmployees.map((name) => {
                  const isHidden = hiddenEmployees.includes(name);
                  return (
                    <div key={name} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          isHidden ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"
                        )}>
                          {name}
                        </span>
                        {isHidden && (
                          <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200 font-semibold">
                            Hidden from suggestions
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant={isHidden ? "outline" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-8 text-xs font-semibold gap-1.5",
                          isHidden ? "border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800" : "text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                        )}
                        onClick={(e) => {
                          flashClick(e);
                          if (isHidden) {
                            unhideEmployee(name);
                          } else {
                            hideEmployee(name);
                          }
                        }}
                      >
                        {isHidden ? (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Show Suggestions
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Hide Suggestions
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editUser ? 'Edit User' : 'Add New User'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Name *</Label><Input value={form.fullName} onChange={e=>setForm(f=>({...f,fullName:e.target.value}))} className="mt-1" /></div>
              <div><Label>Employee ID</Label><Input value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))} placeholder="EMP001" className="mt-1" /></div>
            </div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="mt-1" /></div>
            {!editUser && <div><Label>Password *</Label><Input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Min 8 characters" className="mt-1" /></div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v=>setForm(f=>({...f,role:v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{roles.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Department</Label><Input value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} placeholder="Warehouse, Admin…" className="mt-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : editUser ? 'Update User' : 'Add User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
