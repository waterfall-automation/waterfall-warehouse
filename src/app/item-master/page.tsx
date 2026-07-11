"use client";
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Box, Plus, Search, RefreshCw, Edit, Layers, MapPin, AlertCircle, FileWarning } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useItemMaster, useBoxesAndPlacements, useInventoryEntries } from '@/hooks/use-inventory-data';
import { useToast } from '@/hooks/use-toast';
import { cn, getSimilarity, safeStr } from '@/lib/utils';
import { InfoPopup } from '@/components/shared/info-popup';
import { ItemTooltip } from '@/components/shared/item-tooltip';
import { flashClick } from '@/lib/click-flash';

const UNITS = ['pcs','pairs','boxes','sets','kg','litres','rolls','nos','reams','metres'];
const CATEGORIES = ['Testing Equipment','PPE','Tools','Electronics','Stationery','Spare Parts','Consumables','Other'];

export default function ItemMasterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, pendingItems = [], addItem, updateItem, approveItem, rejectItem, loading: loadingItems } = useItemMaster();
  const { placements } = useBoxesAndPlacements();
  const { entries, items: itemSummaries } = useInventoryEntries();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const isPageLoading = loading || (loadingItems && items.length === 0);
  const [search, setSearch] = useState('');
  const [isDemo] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ itemName:'', itemCode:'', hsnCode:'', category:'', unit:'pcs', minStock:'', maxStock:'', reorderLevel:'', location:'', description:'' });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [calloutFilter, setCalloutFilter] = useState<'location' | 'incomplete' | 'invoice' | 'low-stock' | 'out-of-stock' | 'low-reorder' | 'active' | 'categories' | 'total-items' | null>(null);

  const filterParam = searchParams.get('filter');

  useEffect(() => {
    if (filterParam) {
      setCalloutFilter(filterParam as any);
    } else {
      setCalloutFilter(null);
    }
  }, [filterParam]);

  const setFilter = useCallback((newFilter: typeof calloutFilter) => {
    const params = new URLSearchParams(window.location.search);
    if (newFilter) {
      params.set('filter', newFilter);
    } else {
      params.delete('filter');
    }
    router.replace(`/item-master?${params.toString()}`);
  }, [router]);

  const balanceMap = useMemo(() => {
    const codeMap = new Map<string, number>();
    const nameMap = new Map<string, number>();
    itemSummaries.forEach(s => {
      if (s.code) codeMap.set(String(s.code).toLowerCase(), s.balance);
      if (s.name) nameMap.set(String(s.name).toLowerCase(), s.balance);
    });
    return { codeMap, nameMap };
  }, [itemSummaries]);

  const getBalance = useCallback((itemCode: string, itemName: string) => {
    const codeKey = String(itemCode || '').toLowerCase();
    if (codeKey && balanceMap.codeMap.has(codeKey)) {
      return balanceMap.codeMap.get(codeKey) ?? 0;
    }
    const nameKey = String(itemName || '').toLowerCase();
    if (nameKey && balanceMap.nameMap.has(nameKey)) {
      return balanceMap.nameMap.get(nameKey) ?? 0;
    }
    return 0;
  }, [balanceMap]);

  const [showPendingQueue, setShowPendingQueue] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [selectedMatchCode, setSelectedMatchCode] = useState<string | null>(null);

  const activePendingItem = pendingItems[queueIndex] || null;

  const fuzzyMatches = useMemo(() => {
    if (!activePendingItem) return [];

    return items
      .map(i => ({ item: i, score: getSimilarity(activePendingItem.Item_Name, i.Item_Name) }))
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(m => m.item);
  }, [activePendingItem, items]);

  useEffect(() => {
    setSelectedMatchCode(null);
  }, [queueIndex]);

  const activeItems = items.filter(i => i.Status !== 'Deleted');

  const placedCodes = useMemo(
    () => new Set(placements.filter(p => parseFloat(p.Quantity || '0') > 0).map(p => String(p.Item_Code || ''))),
    [placements]
  );
  const noLocationItems = useMemo(
    () => activeItems.filter(i => !placedCodes.has(String(i.Item_Code || ''))),
    [activeItems, placedCodes]
  );
  const incompleteItems = useMemo(
    () => activeItems.filter(i => !String(i.Category || '').trim() || !String(i.Unit || '').trim() || !String(i.Description || '').trim()),
    [activeItems]
  );
  const noInvoiceEntries = useMemo(
    () => entries.filter(e => e.Transaction_Type === 'Inward' && !String(e.Invoice_No || '').trim()),
    [entries]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 200);
  };

  const openAdd = () => { setEditItem(null); setSuggestions([]); setForm({ itemName:'',itemCode:'',hsnCode:'',category:'',unit:'pcs',minStock:'',maxStock:'',reorderLevel:'',location:'',description:'' }); setShowModal(true); };
  const openEdit = (item: any) => { setEditItem(item); setSuggestions([]); setForm({ itemName:item.Item_Name,itemCode:item.Item_Code,hsnCode:item.HSN_Code,category:item.Category,unit:item.Unit||'pcs',minStock:item.Min_Stock,maxStock:item.Max_Stock,reorderLevel:item.Reorder_Level,location:item.Location,description:item.Description||'' }); setShowModal(true); };

  const save = async () => {
    if (!form.itemName) {
      toast({ title: 'Validation Error', description: 'Item name is required.', variant: 'destructive' });
      return;
    }

    if (!editItem) {
      const matched = items.find(i => safeStr(i.Item_Name).toLowerCase() === safeStr(form.itemName).toLowerCase());
      if (matched) {
        toast({
          title: 'Item Already Exists',
          description: 'This item already exists — pick it from Inventory to add stock instead',
          variant: 'destructive'
        });
        return;
      }
    }

    setSaving(true);
    try {
      if (editItem) {
        updateItem(editItem.Item_ID, form);
      } else {
        addItem(form);
      }
      setShowModal(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save item.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const calloutBase = useMemo(() => {
    if (!calloutFilter) return activeItems;
    switch (calloutFilter) {
      case 'location':
        return noLocationItems;
      case 'incomplete':
        return incompleteItems;
      case 'invoice':
        return activeItems;
      case 'low-stock':
        return activeItems.filter(i => {
          const bal = getBalance(i.Item_Code, i.Item_Name);
          return bal > 0 && bal < 10;
        });
      case 'out-of-stock':
        return activeItems.filter(i => {
          const bal = getBalance(i.Item_Code, i.Item_Name);
          return bal <= 0;
        });
      case 'low-reorder':
        return activeItems.filter(i => {
          const bal = getBalance(i.Item_Code, i.Item_Name);
          return bal <= parseInt(i.Reorder_Level || '0');
        });
      case 'active':
        return activeItems.filter(i => i.Status === 'Active');
      case 'categories':
        return activeItems;
      case 'total-items':
      default:
        return activeItems;
    }
  }, [calloutFilter, noLocationItems, incompleteItems, activeItems, getBalance]);

  const filtered = calloutBase.filter(i => !search || safeStr(i.Item_Name).toLowerCase().includes(safeStr(search).toLowerCase()) || safeStr(i.Item_Code).toLowerCase().includes(safeStr(search).toLowerCase()) || safeStr(i.Category).toLowerCase().includes(safeStr(search).toLowerCase()));

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Item Master</h1>
              <p className="text-muted-foreground mt-1">Master catalogue of all inventory items with reorder levels.</p>
            </div>
          </div>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading catalogue...
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
            <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Item Master</h1>
            <p className="text-muted-foreground mt-1">Master catalogue of all inventory items with reorder levels.{isDemo && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Demo</span>}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={load} className={loading?'animate-spin':''}><RefreshCw className="h-4 w-4" /></Button>
            {pendingItems.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => { setQueueIndex(0); setShowPendingQueue(true); }} 
                className="gap-2 border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 font-semibold"
              >
                <FileWarning className="h-4 w-4 text-amber-600 animate-pulse" />
                Pending Review ({pendingItems.length})
              </Button>
            )}
            <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" />Add to Catalog</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Total Items', value: items.length, icon: Box, key: 'total-items' as const },
            { label:'Categories', value: [...new Set(items.map(i=>i.Category).filter(Boolean))].length, icon: Layers, key: 'categories' as const },
            { label:'Active', value: items.filter(i=>i.Status==='Active').length, icon: Box, key: 'active' as const },
            { label:'Low Reorder', value: activeItems.filter(i => {
                const bal = getBalance(i.Item_Code, i.Item_Name);
                return bal <= parseInt(i.Reorder_Level || '0');
              }).length, icon: Box, key: 'low-reorder' as const },
          ].map((s,i)=>{
            const isFilterActive = calloutFilter === s.key;
            return (
              <Card 
                key={i} 
                className={cn(
                  "border-none shadow-sm cursor-pointer transition-all hover:shadow-md select-none",
                  isFilterActive ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                )}
                onClick={(e) => { flashClick(e); setFilter(isFilterActive ? null : s.key); }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className="h-5 w-5 text-primary opacity-60" />
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call-outs — click to filter the table below to just those items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { key: 'location' as const, label: 'No Location', count: noLocationItems.length, icon: MapPin, color: 'amber' },
            { key: 'incomplete' as const, label: 'Incomplete Info', count: incompleteItems.length, icon: AlertCircle, color: 'red' },
            { key: 'invoice' as const, label: 'No Invoice Attached', count: noInvoiceEntries.length, icon: FileWarning, color: 'blue' },
          ].map(c => (
            <button key={c.key} onClick={() => setFilter(calloutFilter === c.key ? null : c.key)}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors w-full',
                c.count === 0 ? 'border-dashed border-muted-foreground/15 opacity-60' :
                calloutFilter === c.key
                  ? c.color === 'amber' ? 'border-amber-400 bg-amber-50' : c.color === 'red' ? 'border-red-400 bg-red-50' : 'border-blue-400 bg-blue-50'
                  : c.color === 'amber' ? 'border-amber-200 hover:bg-amber-50/50' : c.color === 'red' ? 'border-red-200 hover:bg-red-50/50' : 'border-blue-200 hover:bg-blue-50/50'
              )}>
              <c.icon className={cn('h-5 w-5 shrink-0', c.color === 'amber' ? 'text-amber-600' : c.color === 'red' ? 'text-red-600' : 'text-blue-600')} />
              <div><p className="text-xl font-bold leading-none">{c.count}</p><p className="text-xs text-muted-foreground mt-0.5">{c.label}</p></div>
            </button>
          ))}
        </div>

        {calloutFilter === 'invoice' && (
          <Card className="border-none shadow-md">
            <CardHeader className="border-b pb-3"><p className="text-sm font-semibold">Inward entries with no Invoice No ({noInvoiceEntries.length})</p></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-72 overflow-y-auto">
                {noInvoiceEntries.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Every inward entry has an invoice attached. 🎉</p>
                ) : noInvoiceEntries.map((e, i) => (
                  <div key={`${e.Entry_ID}-${i}`} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <div><span className="font-medium">{e.Item_Name}</span> <span className="text-xs text-muted-foreground font-mono ml-1">{e.Item_Code}</span></div>
                    <div className="text-xs text-muted-foreground">{e.Date_Time} · Qty {e.Inward_Qty}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-md">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative max-w-sm flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items…" className="pl-9" />
              </div>
              {calloutFilter && calloutFilter !== 'invoice' && (
                <Badge variant="outline" className="gap-1.5 cursor-pointer" onClick={() => setFilter(null)}>
                  Filtered: {
                    calloutFilter === 'location' ? 'No Location' :
                    calloutFilter === 'incomplete' ? 'Incomplete Info' :
                    calloutFilter === 'low-stock' ? 'Low Stock' :
                    calloutFilter === 'out-of-stock' ? 'Out of Stock' :
                    calloutFilter === 'low-reorder' ? 'Low Reorder' :
                    calloutFilter === 'active' ? 'Active Items' :
                    calloutFilter === 'categories' ? 'Categories' :
                    calloutFilter === 'total-items' ? 'Total Items' : calloutFilter
                  } ✕
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Item Name</th>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">HSN</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-right">Min</th>
                  <th className="px-4 py-3 text-right">Max</th>
                  <th className="px-4 py-3 text-right">Reorder</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-right">Edit</th>
                </tr></thead>
                <tbody className="divide-y">
                  {isPageLoading ? <tr><td colSpan={10} className="py-12 text-center text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />Loading…</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">No items found</td></tr>
                  : filtered.map((item,i) => (
                    <tr key={i} className="hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <ItemTooltip itemCode={item.Item_Code}>
                          <button
                            onClick={(e) => { flashClick(e); router.push(`/item-master/${item.Item_ID}`); }}
                            className="text-left font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                          >
                            {item.Item_Name}
                          </button>
                        </ItemTooltip>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.Item_Code}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.HSN_Code}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{item.Category}</Badge></td>
                      <td className="px-4 py-3 text-xs">{item.Unit}</td>
                      <td className="px-4 py-3 text-right text-xs">{item.Min_Stock}</td>
                      <td className="px-4 py-3 text-right text-xs">{String(item.Max_Stock || '').trim() ? item.Max_Stock : '∞'}</td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-amber-600">{item.Reorder_Level}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.Location}</td>
                      <td className="px-4 py-3 text-right"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>openEdit(item)}><Edit className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Catalog Details' : 'Add Item to Catalog'}</DialogTitle>
            <DialogDescription>
              {editItem ? 'Modify the details of this catalog item.' : 'Enter details to catalog a new item and set stock limits. To add physical stock, use Inward Entry in the Stock Register.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Label>Item Name *</Label>
                <Input 
                  value={form.itemName} 
                  onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({ ...f, itemName: val }));
                    
                    if (editItem && val !== editItem.Item_Name) {
                      setEditItem(null);
                    }

                    if (val.trim()) {
                      const matches = items.filter(item => 
                        safeStr(item.Item_Name).toLowerCase().includes(safeStr(val).toLowerCase())
                      ).slice(0, 5);
                      setSuggestions(matches);
                    } else {
                      setSuggestions([]);
                    }
                  }} 
                  className="mt-1"
                  autoComplete="off"
                />
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden divide-y divide-gray-100 text-sm">
                    {suggestions.map(item => (
                      <button
                        key={item.Item_ID}
                        type="button"
                        onClick={() => {
                          toast({
                            title: 'Item Already Exists',
                            description: 'This item already exists — pick it from Inventory to add stock instead',
                            variant: 'destructive'
                          });
                          setForm(f => ({ ...f, itemName: '' }));
                          setSuggestions([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex flex-col"
                      >
                        <span className="font-medium text-gray-900">{item.Item_Name}</span>
                        <span className="text-[10px] text-gray-500">Code: {item.Item_Code} | Category: {item.Category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Item Code</Label>
                <Input 
                  value={form.itemCode} 
                  onChange={e=>setForm(f=>({...f,itemCode:e.target.value}))} 
                  placeholder="MM-102" 
                  className="mt-1" 
                  disabled={!!editItem}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>HSN Code</Label><Input value={form.hsnCode} onChange={e=>setForm(f=>({...f,hsnCode:e.target.value}))} className="mt-1" /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v=>setForm(f=>({...f,category:v}))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Unit</Label>
                <Select value={form.unit} onValueChange={v=>setForm(f=>({...f,unit:v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u=><SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Location</Label><Input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Cupboard A" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Min Stock</Label><Input type="number" value={form.minStock} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))} className="mt-1" /></div>
              <div><Label>Max Stock <span className="text-muted-foreground font-normal">(blank = ∞)</span></Label><Input type="number" value={form.maxStock} onChange={e=>setForm(f=>({...f,maxStock:e.target.value}))} placeholder="No limit" className="mt-1" /></div>
              <div><Label>Reorder Level</Label><Input type="number" value={form.reorderLevel} onChange={e=>setForm(f=>({...f,reorderLevel:e.target.value}))} className="mt-1" /></div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving?'Saving…':editItem?'Update Catalog':'Add to Catalog'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedItemId && (
        <InfoPopup 
          type="item" 
          id={selectedItemId} 
          onClose={() => setSelectedItemId(null)} 
        />
      )}

      {showPendingQueue && activePendingItem && (
        <Dialog open={showPendingQueue} onOpenChange={setShowPendingQueue}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-amber-800">
                <FileWarning className="h-5 w-5 text-amber-600 animate-bounce" />
                Deduplication & Pending Item Review Queue
              </DialogTitle>
              <DialogDescription>
                Review newly entered items from Inward Entry. You can approve them as new Item Master listings or map them to similar existing catalogue items.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Left Column: Pending Item Card */}
              <div className="border border-amber-200 bg-amber-50/30 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending Review</Badge>
                  <span className="text-xs text-muted-foreground font-mono">ID: {activePendingItem.Item_ID}</span>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Item Name</label>
                  <p className="text-lg font-bold text-gray-900 leading-tight mt-0.5">{activePendingItem.Item_Name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block">Category</label>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{activePendingItem.Category || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block">Unit</label>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{activePendingItem.Unit || 'pcs'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block">HSN Code</label>
                    <p className="text-sm font-mono font-semibold text-gray-800 mt-0.5">{activePendingItem.HSN_Code || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block">Min Stock</label>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{activePendingItem.Min_Stock || '0'}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Similar Existing Items */}
              <div className="border rounded-xl p-4 flex flex-col space-y-3 bg-gray-50/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 uppercase">Closest Match Suggestions</span>
                  <span className="text-xs text-muted-foreground font-medium">{fuzzyMatches.length} match(es) found</span>
                </div>
                
                {fuzzyMatches.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 opacity-20 mb-2" />
                    <p className="text-sm font-semibold">No close matches found</p>
                    <p className="text-xs max-w-xs mt-1 text-muted-foreground">This item appears completely unique in your existing catalogue.</p>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] pr-1">
                    {fuzzyMatches.map(item => {
                      const isSelected = selectedMatchCode === item.Item_Code;
                      return (
                        <div key={item.Item_ID} onClick={() => setSelectedMatchCode(item.Item_Code)}
                          className={cn(
                            "cursor-pointer p-3 border rounded-xl transition-all relative text-left",
                            isSelected 
                              ? "border-teal-500 bg-teal-50/40 ring-1 ring-teal-500" 
                              : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-muted-foreground">{item.Item_Code}</span>
                            {isSelected && <Badge className="bg-teal-600 text-white border-none text-[9px] h-5">Selected Target</Badge>}
                          </div>
                          <p className="font-bold text-sm text-gray-900 leading-snug mt-1">{item.Item_Name}</p>
                          
                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t text-[11px] text-gray-600">
                            <div>
                              <span className="text-gray-400 block font-medium">Category:</span>
                              <span className={cn(
                                "font-semibold", 
                                item.Category !== activePendingItem.Category ? "text-amber-600" : "text-gray-700"
                              )}>{item.Category || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block font-medium">Unit:</span>
                              <span className={cn(
                                "font-semibold", 
                                item.Unit !== activePendingItem.Unit ? "text-amber-600" : "text-gray-700"
                              )}>{item.Unit || 'pcs'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block font-medium">HSN:</span>
                              <span className={cn(
                                "font-semibold", 
                                item.HSN_Code !== activePendingItem.HSN_Code ? "text-amber-600" : "text-gray-700"
                              )}>{item.HSN_Code || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between border-t pt-4 mt-2">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={queueIndex === 0} 
                  onClick={() => setQueueIndex(prev => prev - 1)}
                >
                  Previous
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={queueIndex >= pendingItems.length - 1} 
                  onClick={() => setQueueIndex(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
              <span className="text-xs font-semibold text-gray-600">
                Item {queueIndex + 1} of {pendingItems.length} in queue
              </span>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4">
              <div className="flex flex-wrap gap-2 w-full justify-between items-center">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs h-9"
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to reject and discard "${activePendingItem.Item_Name}"? Any inward stock entries created with this temporary item will be left as uncatalogued.`)) {
                        await rejectItem(activePendingItem.Item_ID);
                        if (queueIndex >= pendingItems.length - 1 && queueIndex > 0) {
                          setQueueIndex(prev => prev - 1);
                        }
                      }
                    }}
                  >
                    Discard & Reject
                  </Button>
                  
                  {selectedMatchCode && (
                    <Button 
                      variant="outline"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 text-xs h-9"
                      onClick={async () => {
                        const targetItemName = items.find(i => i.Item_Code === selectedMatchCode)?.Item_Name || selectedMatchCode;
                        if (window.confirm(`This will discard "${activePendingItem.Item_Name}" and automatically map all its inward transactions and placements to "${targetItemName}". Continue?`)) {
                          await rejectItem(activePendingItem.Item_ID, selectedMatchCode);
                          if (queueIndex >= pendingItems.length - 1 && queueIndex > 0) {
                            setQueueIndex(prev => prev - 1);
                          }
                        }
                      }}
                    >
                      Map to Selected Match
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" className="text-xs h-9" onClick={() => setShowPendingQueue(false)}>Close Queue</Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-9"
                    onClick={async () => {
                      await approveItem(activePendingItem.Item_ID);
                      if (queueIndex >= pendingItems.length - 1 && queueIndex > 0) {
                        setQueueIndex(prev => prev - 1);
                      }
                    }}
                  >
                    Approve as New Item
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}
