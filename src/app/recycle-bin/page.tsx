"use client";
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, RotateCcw, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useRecycleBin } from '@/hooks/use-inventory-data';
import { useToast } from '@/hooks/use-toast';
import { flashClick } from '@/lib/click-flash';

export default function RecycleBinPage() {
  const { items, restoreItem, emptyBin: emptyBinHook } = useRecycleBin();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isDemo] = useState(true);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const { toast } = useToast();
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

  const restore = async (binId: string) => {
    setActionLoading(binId);
    try {
      restoreItem(binId);
    } catch {
      toast({ title: 'Error', description: 'Could not restore.', variant: 'destructive' });
    } finally {
      setActionLoading('');
    }
  };

  const emptyBin = async () => {
    setConfirmEmpty(false);
    try {
      emptyBinHook();
    } catch {
      toast({ title: 'Error', description: 'Could not empty bin.', variant: 'destructive' });
    }
  };

  const filtered = items.filter(i =>
    !search || String(i.Item_Name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(i.Deleted_By || '').toLowerCase().includes(search.toLowerCase()) ||
    String(i.Type || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Recycle Bin</h1>
              <p className="text-muted-foreground mt-1">Review and restore recently deleted items.</p>
            </div>
          </div>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading deleted items...
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
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Recovery Vault</h1>
              <p className="text-muted-foreground mt-1">
                {items.length} deleted item{items.length !== 1 ? 's' : ''} — restore or permanently delete.
                {isDemo && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Demo</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={(e) => { flashClick(e); load(); }} className={loading ? 'animate-spin' : ''}><RefreshCw className="h-4 w-4" /></Button>
            {items.length > 0 && (
              <Button variant="destructive" className="gap-2" onClick={(e) => { flashClick(e); setConfirmEmpty(true); }}>
                <Trash2 className="h-4 w-4" /> Empty Bin
              </Button>
            )}
          </div>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b pb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deleted items…" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Item</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Deleted By</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={5} className="py-12 text-center text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />Loading…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} className="py-16 text-center">
                      <Trash2 className="h-10 w-10 mx-auto mb-3 opacity-15" />
                      <p className="text-muted-foreground text-sm">Recycle bin is empty</p>
                    </td></tr>
                  ) : filtered.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/5 transition-colors">
                      <td className="px-5 py-4 font-medium">{item.Item_Name}</td>
                      <td className="px-5 py-4"><Badge variant="outline" className="text-[10px]">{item.Type}</Badge></td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{item.Deleted_By}</td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">{item.Date_Time}</td>
                      <td className="px-5 py-4 text-right">
                        <Button variant="ghost" size="sm"
                          className="gap-1.5 text-xs h-7 text-green-700 hover:text-green-800 hover:bg-green-50"
                          disabled={actionLoading === item.Bin_ID}
                          onClick={(e) => { flashClick(e); restore(item.Bin_ID); }}>
                          <RotateCcw className={`h-3 w-3 ${actionLoading === item.Bin_ID ? 'animate-spin' : ''}`} /> Restore
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Empty Dialog */}
      <Dialog open={confirmEmpty} onOpenChange={setConfirmEmpty}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5"/>Permanently Delete All?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete all {items.length} items from the recycle bin. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmEmpty(false)}>Cancel</Button>
            <Button variant="destructive" onClick={emptyBin}>Yes, Empty Bin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
