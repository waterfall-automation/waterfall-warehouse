"use client";
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ShieldCheck, Plus, Edit, RefreshCw, Lock, Users } from 'lucide-react';
import { useRoles } from '@/hooks/use-inventory-data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { isAdminManagerRole } from '@/lib/permissions';

const ALL_PERMISSIONS = [
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
];

const GROUPS = ['Inventory','Finance','Communication','Admin','Advanced'];

type Role = {
  Role_ID: string; Name: string; Description: string;
  Permissions: string; Created_On: string;
};
type PermMap = Record<string, boolean>;

function parsePerms(json: string): PermMap {
  try { return JSON.parse(json || '{}'); } catch { return {}; }
}

export default function RolesPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { roles, addRole, updateRole } = useRoles();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isDemo] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [perms, setPerms] = useState<PermMap>({});
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFormDirty = () => {
    if (editRole) {
      return name !== editRole.Name ||
        desc !== editRole.Description ||
        JSON.stringify(perms) !== JSON.stringify(parsePerms(editRole.Permissions));
    }
    return name !== '' || desc !== '' || Object.values(perms).some(Boolean);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Manages Role.Permissions data — Admin-only, same as the per-user editor.
  // A future Developer role gets broad page access elsewhere but not this.
  useEffect(() => {
    if (currentUser && !isAdminManagerRole(currentUser.role)) {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  const load = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 200);
  };

  const openCreate = () => {
    setEditRole(null); setName(''); setDesc(''); setPerms({});
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setEditRole(role); setName(role.Name); setDesc(role.Description);
    setPerms(parsePerms(role.Permissions));
    setErrors({});
    setShowModal(true);
  };

  const togglePerm = (key: string) => setPerms(p => ({ ...p, [key]: !p[key] }));

  const selectGroup = (group: string, val: boolean) => {
    const groupKeys = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.key);
    setPerms(p => {
      const next = { ...p };
      groupKeys.forEach(k => { next[k] = val; });
      return next;
    });
  };

  const selectAll = (val: boolean) => {
    setPerms(Object.fromEntries(ALL_PERMISSIONS.map(p => [p.key, val])));
  };

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Role name is required.';
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const payload = { name, description: desc, permissions: perms };
      if (editRole) {
        await updateRole(editRole.Role_ID, payload);
      } else {
        await addRole(payload);
      }
      setShowModal(false);
      setErrors({});
    } catch {
      toast({ title: 'Error', description: 'Failed to save role.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = (permJson: string) => {
    const p = parsePerms(permJson);
    return ALL_PERMISSIONS.filter(x => p[x.key]).length;
  };

  if (currentUser && !isAdminManagerRole(currentUser.role)) {
    return null;
  }

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Permission Matrix</h1>
              <p className="text-muted-foreground mt-1">Define roles and their exact access levels.</p>
            </div>
          </div>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading roles...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Permission Matrix</h1>
            <p className="text-muted-foreground mt-1">
              Define roles and their exact access levels.
              {isDemo && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Demo data</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={load} variant="ghost" size="icon" className={loading ? 'animate-spin' : ''}><RefreshCw className="h-4 w-4" /></Button>
            <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Create Role</Button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground"><RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 opacity-30" />Loading roles…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => {
              const p = parsePerms(role.Permissions);
              const count = enabledCount(role.Permissions);
              const isAdmin = String(role.Name || '').toLowerCase().includes('admin');
              return (
                <Card key={role.Role_ID} className="border-none shadow-md hover:shadow-lg transition-all flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', isAdmin ? 'bg-primary/10' : 'bg-secondary/10')}>
                        <ShieldCheck className={cn('h-5 w-5', isAdmin ? 'text-primary' : 'text-secondary')} />
                      </div>
                      <Badge variant="outline" className="text-[10px]">{count}/{ALL_PERMISSIONS.length} perms</Badge>
                    </div>
                    <CardTitle className="text-lg mt-3">{role.Name}</CardTitle>
                    <CardDescription className="text-xs">{role.Description || 'No description'}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Active Permissions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_PERMISSIONS.filter(x => p[x.key]).slice(0, 6).map(x => (
                        <Badge key={x.key} variant="secondary" className="text-[9px] bg-primary/5 text-primary border-none">{x.label}</Badge>
                      ))}
                      {count > 6 && <Badge variant="secondary" className="text-[9px] bg-muted">+{count - 6} more</Badge>}
                      {count === 0 && <span className="text-xs text-muted-foreground italic">No permissions assigned</span>}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 border-t bg-muted/5 rounded-b-lg">
                    <Button variant="ghost" size="sm" className="w-full text-xs gap-2 mt-3"
                      onClick={() => openEdit(role)}>
                      <Lock className="h-3 w-3" /> Edit Permissions
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Role Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" preventClose={isFormDirty()}>
          <DialogHeader>
            <DialogTitle>{editRole ? `Edit Role: ${editRole.Name}` : 'Create New Role'}</DialogTitle>
            <DialogDescription>Name the role, add a description, then check the permissions it should have.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role Name *</Label>
                <Input 
                  value={name} 
                  onChange={e => {
                    setName(e.target.value);
                    if (errors.name) setErrors(err => ({ ...err, name: '' }));
                  }} 
                  placeholder="e.g. Inventory Lead" 
                  className={cn("mt-1", errors.name && "border-red-500 text-red-600 focus-visible:ring-red-500")} 
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.name}</p>}
              </div>
              <div>
                <Label>Description</Label>
                <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description of this role" className="mt-1" />
              </div>
            </div>

            {/* Permission Controls */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Permissions</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => selectAll(true)}>Select All</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => selectAll(false)}>Clear All</Button>
                </div>
              </div>

              <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
                {GROUPS.map(group => {
                  const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
                  const allChecked = groupPerms.every(p => perms[p.key]);
                  const someChecked = groupPerms.some(p => perms[p.key]);

                  return (
                    <div key={group}>
                      {/* Group header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`group-${group}`}
                            checked={allChecked}
                            onCheckedChange={val => selectGroup(group, !!val)}
                            className={someChecked && !allChecked ? 'opacity-60' : ''}
                          />
                          <label htmlFor={`group-${group}`} className="text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">
                            {group}
                          </label>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{groupPerms.filter(p => perms[p.key]).length}/{groupPerms.length}</span>
                      </div>

                      {/* Individual permissions */}
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        {groupPerms.map(perm => (
                          <div key={perm.key} className="flex items-center gap-2">
                            <Checkbox
                              id={perm.key}
                              checked={!!perms[perm.key]}
                              onCheckedChange={() => togglePerm(perm.key)}
                            />
                            <label htmlFor={perm.key} className="text-xs cursor-pointer select-none">
                              {perm.label}
                            </label>
                          </div>
                        ))}
                      </div>

                      {group !== GROUPS[GROUPS.length - 1] && <hr className="mt-3 border-border/40" />}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                {Object.values(perms).filter(Boolean).length} of {ALL_PERMISSIONS.length} permissions enabled
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
