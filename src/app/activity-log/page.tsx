"use client";
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Search, RefreshCw, Download } from 'lucide-react';
import { useActivityLog } from '@/hooks/use-inventory-data';
import { cn } from '@/lib/utils';
import { flashClick } from '@/lib/click-flash';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  INWARD_ENTRY: 'bg-blue-100 text-blue-700',
  OUTWARD_ENTRY: 'bg-amber-100 text-amber-700',
  RETURN_ENTRY: 'bg-teal-100 text-teal-800',
  DELETE_ENTRY: 'bg-red-100 text-red-700',
  
  CREATE_USER: 'bg-purple-100 text-purple-700',
  UPDATE_USER: 'bg-purple-50 text-purple-600',
  DELETE_USER: 'bg-purple-200 text-purple-800',
  
  CREATE_ROLE: 'bg-indigo-100 text-indigo-700',
  UPDATE_ROLE: 'bg-indigo-50 text-indigo-600',
  DELETE_ROLE: 'bg-indigo-200 text-indigo-800',
  
  CREATE_VENDOR: 'bg-cyan-100 text-cyan-700',
  UPDATE_VENDOR: 'bg-cyan-50 text-cyan-600',
  DELETE_VENDOR: 'bg-cyan-200 text-cyan-800',
  
  CREATE_ITEM_MASTER: 'bg-emerald-100 text-emerald-700',
  UPDATE_ITEM_MASTER: 'bg-emerald-50 text-emerald-600',
  DELETE_ITEM_MASTER: 'bg-emerald-200 text-emerald-800',
  APPROVE_ITEM: 'bg-green-100 text-green-700',
  REJECT_ITEM: 'bg-rose-100 text-rose-700',
  
  CREATE_CUPBOARD: 'bg-orange-100 text-orange-700',
  UPDATE_CUPBOARD: 'bg-orange-50 text-orange-600',
  DELETE_CUPBOARD: 'bg-orange-200 text-orange-800',
  
  CREATE_BOX: 'bg-pink-100 text-pink-700',
  DELETE_BOX: 'bg-pink-200 text-pink-800',
  
  ADD_PLACEMENT: 'bg-sky-100 text-sky-700',
  REMOVE_PLACEMENT: 'bg-rose-100 text-rose-700',
  
  SAVE_SETTINGS: 'bg-teal-100 text-teal-700',
  TASK_UPDATE: 'bg-sky-100 text-sky-800',
};

export default function ActivityLogPage() {
  const { logs } = useActivityLog();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [isDemo] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 200);
  };

  const actionTypes = ['all', ...Array.from(new Set(logs.map(l => String(l.Action || '')).filter(Boolean)))];

  const filtered = logs.filter(l => {
    const matchAction = actionFilter === 'all' || l.Action === actionFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || String(l.User_Name || '').toLowerCase().includes(q) ||
      String(l.Action || '').toLowerCase().includes(q) || String(l.Target || '').toLowerCase().includes(q);
    return matchAction && matchSearch;
  });

  const exportCSV = () => {
    const headers = ['Date & Time', 'User', 'Action', 'Target'];
    const rows = filtered.map(l => [l.Date_Time, l.User_Name, l.Action, l.Target].map(v => `"${v || ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `activity-log-${Date.now()}.csv`; a.click();
  };

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Activity Log</h1>
                <p className="text-muted-foreground mt-1">Audit trail of all administrative actions.</p>
              </div>
            </div>
          </div>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading audit logs...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border">
              <History className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">System Audit Trail</h1>
              <p className="text-muted-foreground mt-1">
                {filtered.length} of {logs.length} records.
                {isDemo && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Demo</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={(e) => { flashClick(e); load(); }} className={loading ? 'animate-spin' : ''}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" className="gap-2" onClick={(e) => { flashClick(e); exportCSV(); }}><Download className="h-4 w-4"/>Export CSV</Button>
          </div>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, action, target…" className="pl-9" />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {actionTypes.map(a => <SelectItem key={a} value={a}>{a === 'all' ? 'All Actions' : a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 text-left">Date & Time</th>
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Action</th>
                    <th className="px-5 py-3 text-left">Target / Detail</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={4} className="py-12 text-center text-muted-foreground">No logs match your filters</td></tr>
                    ) : filtered.map((log, i) => (
                      <tr key={i} className="hover:bg-muted/5 transition-colors">
                        <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">{log.Date_Time}</td>
                        <td className="px-5 py-3 font-semibold text-primary text-sm">{log.User_Name}</td>
                        <td className="px-5 py-3">
                          <Badge className={cn('text-[10px] font-bold border-none', ACTION_COLORS[log.Action] || 'bg-muted text-muted-foreground')}>
                            {log.Action}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground max-w-xs truncate">{log.Target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
