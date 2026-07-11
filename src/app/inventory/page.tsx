"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { UnderDevelopment } from '@/components/under-development';
import { PAGE_CONFIG } from '@/config/pages';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownToLine, ArrowUpFromLine, Package, RefreshCw, AlertTriangle, TrendingDown, CheckCircle, Search, X } from 'lucide-react';
import { useInventoryEntries, useCupboards, useBoxesAndPlacements } from '@/hooks/use-inventory-data';
import { useToast } from '@/hooks/use-toast';
import { cn, safeStr } from '@/lib/utils';
import { InwardModal } from '@/components/inventory/inward-modal';
import { OutwardPicker } from '@/components/inventory/outward-picker';
import { InfoPopup } from '@/components/shared/info-popup';
import { flashClick } from '@/lib/click-flash';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { LocationPicker } from '@/components/shared/location-picker';

type Entry = {
  Entry_ID:string; Date_Time:string; Item_Name:string; Item_Code:string;
  Transaction_Type:string; Inward_Qty:string; Outward_Qty:string;
  Balance_Qty:string; Vendor_Name:string; Issued_To:string;
  Invoice_No:string; Employee_Name:string; Location:string;
  Price_Per_Item:string; GST_Rate:string; Total_Invoice_Value:string; Remarks:string; Discount_Pct?: string;
  GRN_No?: string;
};
type ItemSummary = { name:string; code:string; balance:number; location:string; status:string };

export default function InventoryPage() {
  if (!PAGE_CONFIG.inventory) return <UnderDevelopment pageName="Stock Register" />;

  const [tab, setTab] = useState('ledger');
  const { entries, items, addEntry, loading: loadingEntries } = useInventoryEntries();
  const { cupboards } = useCupboards();
  const { boxes, addPlacement } = useBoxesAndPlacements();
  const [mounted, setMounted] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ name: string; code: string } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const handleItemClick = (name: string, code: string) => {
    setSelectedItem({ name, code });
  };

  const handleEmployeeClick = (name: string) => {
    setSelectedEmployee(name);
  };

  const handleVendorClick = (name: string) => {
    setSelectedVendor(name);
  };

  const handleInvoiceClick = (invoiceNo: string) => {
    setSelectedInvoice(invoiceNo);
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  useEffect(() => {
    setMounted(true);
  }, []);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isPageLoading = loading || (loadingEntries && entries.length === 0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showOutwardPicker, setShowOutwardPicker] = useState(false);
  const [summaryFilter, setSummaryFilter] = useState<'Low' | 'Out of Stock' | 'Normal' | null>(null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnEntry, setReturnEntry] = useState<Entry | null>(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnCupboardId, setReturnCupboardId] = useState('');
  const [returnBoxId, setReturnBoxId] = useState('');

  // Cumulative returns against one original Outward entry are tracked via GRN_No,
  // which addEntry passes through untouched and isn't shown anywhere in the UI —
  // ponytail: repurposed rather than adding a new Stock_Register column.
  const getAlreadyReturned = useCallback((originalEntryId: string) => {
    return entries
      .filter(e => e.Transaction_Type === 'Return' && (e as any).GRN_No === originalEntryId)
      .reduce((sum, e) => sum + parseFloat(e.Inward_Qty || '0'), 0);
  }, [entries]);

  const alreadyReturnedForCurrent = returnEntry ? getAlreadyReturned(returnEntry.Entry_ID) : 0;
  const remainingReturnable = returnEntry
    ? Math.max(0, parseFloat(returnEntry.Outward_Qty || '0') - alreadyReturnedForCurrent)
    : 0;

  const handleReturnClick = (entry: Entry) => {
    setReturnEntry(entry);
    const remaining = Math.max(0, parseFloat(entry.Outward_Qty || '0') - getAlreadyReturned(entry.Entry_ID));
    setReturnQty(String(remaining));
    setReturnRemarks(`Returned to stock (Ref: ${entry.Entry_ID})`);
    setReturnCupboardId('');
    setReturnBoxId('');
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async () => {
    if (!returnEntry) return;
    const qty = parseFloat(returnQty);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: 'Validation Error', description: 'Please enter a valid quantity.', variant: 'destructive' });
      return;
    }
    const remaining = Math.max(0, parseFloat(returnEntry.Outward_Qty || '0') - getAlreadyReturned(returnEntry.Entry_ID));
    if (qty > remaining) {
      toast({ title: 'Validation Error', description: `Cannot return more than the remaining un-returned quantity (${remaining}).`, variant: 'destructive' });
      return;
    }
    if (!returnCupboardId) {
      toast({ title: 'Validation Error', description: 'Select which location the stock is going back to.', variant: 'destructive' });
      return;
    }

    setReturnLoading(true);
    try {
      const cup = cupboards.find(c => c.Cupboard_ID === returnCupboardId);
      const box = boxes.find(b => b.Box_ID === returnBoxId);
      const returnLocationLabel = cup ? (box ? `${cup.Cupboard_Number}/${box.Box_Name}` : cup.Cupboard_Number) : (returnEntry.Location || 'Default');

      const res = await addEntry({
        transactionType: 'Return',
        itemName: returnEntry.Item_Name,
        itemCode: returnEntry.Item_Code,
        hsnCode: '',
        location: returnLocationLabel,
        inwardQty: String(qty),
        pricePerItem: returnEntry.Price_Per_Item || '0',
        discountPct: returnEntry.Discount_Pct || '0',
        gstRate: returnEntry.GST_Rate || '18',
        issuedTo: returnEntry.Issued_To || '',
        receivedBy: 'Admin',
        remarks: returnRemarks,
        invoiceNo: returnEntry.Invoice_No || '',
        grnNo: returnEntry.Entry_ID,
      });

      if (res.success) {
        await addPlacement(returnEntry.Item_Code, returnCupboardId, returnBoxId, qty);
        toast({ title: 'Success', description: `Returned ${qty} units of ${returnEntry.Item_Name} to ${returnLocationLabel}.` });
        setShowReturnModal(false);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to process return: ' + err.message, variant: 'destructive' });
    } finally {
      setReturnLoading(false);
    }
  };

  const load = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 200);
  };

  const filtered = entries.filter(e => {
    const matchType = typeFilter === 'all' || e.Transaction_Type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || safeStr(e.Item_Name).toLowerCase().includes(q) ||
      safeStr(e.Item_Code).toLowerCase().includes(q) || safeStr(e.Vendor_Name).toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const stats = [
    { label:'Total Items',  value:items.length, icon:Package, color:'text-blue-600', bg:'bg-blue-50', key: null },
    { label:'Low Stock',    value:items.filter(i=>i.status==='Low').length, icon:AlertTriangle, color:'text-amber-600', bg:'bg-amber-50', key: 'Low' as const },
    { label:'Out of Stock', value:items.filter(i=>i.status==='Out of Stock').length, icon:TrendingDown, color:'text-red-600', bg:'bg-red-50', key: 'Out of Stock' as const },
    { label:'Normal',       value:items.filter(i=>i.status==='Normal').length, icon:CheckCircle, color:'text-green-600', bg:'bg-green-50', key: 'Normal' as const },
  ];

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Stock Register</h1>
              <p className="text-muted-foreground mt-1">Live inventory ledger • 30-column GST-grade register</p>
            </div>
          </div>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading ledger...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Stock Register</h1>
            <p className="text-muted-foreground mt-1">Live inventory ledger • 30-column GST-grade register</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowInwardModal(true)} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <ArrowDownToLine className="h-4 w-4" /> Inward Entry
            </Button>
            <Button onClick={() => setShowOutwardPicker(true)} variant="outline" className="gap-2 text-amber-700 border-amber-400 hover:bg-amber-50">
              <ArrowUpFromLine className="h-4 w-4" /> Outward Entry
            </Button>
            <Button onClick={load} variant="ghost" size="icon" className={loading?'animate-spin':''}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const isFilterActive = summaryFilter === s.key;
            return (
              <Card 
                key={i} 
                className={cn(
                  "border-none shadow-sm cursor-pointer transition-all hover:shadow-md select-none",
                  isFilterActive ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                )}
                onClick={(e) => {
                  flashClick(e);
                  setSummaryFilter(isFilterActive ? null : s.key);
                  setTab('summary');
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('h-5 w-5', s.color)} /></div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-card border">
            <TabsTrigger value="ledger">📋 Stock Ledger</TabsTrigger>
            <TabsTrigger value="summary">📦 Item Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger">
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search item, code, vendor…" className="pl-9" />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Inward">Inward</SelectItem>
                      <SelectItem value="Outward">Outward</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isPageLoading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />Loading…
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                      <thead>
                        <tr className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                          {['Date & Time','Item Name','Code','Type','Qty','Balance','Vendor / Issued To','Employee','Invoice','Amount ₹','Actions'].map((h,i) => {
                            const isRight = ['Qty', 'Balance', 'Amount ₹'].includes(h) || h === 'Actions';
                            const isCenter = h === 'Type';
                            return (
                              <th key={i} className={cn('px-4 py-3', isRight ? 'text-right' : (isCenter ? 'text-center' : 'text-left'))}>
                                {h}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filtered.length===0 ? (
                          <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">
                            No entries yet. Click <strong>Inward Entry</strong> to add your first record.
                          </td></tr>
                        ) : (() => {
                          // Group consecutive rows sharing same Invoice_No and Employee_Name
                          const groups: {
                            id: string;
                            invoiceNo: string;
                            employeeName: string;
                            entries: { entry: Entry; originalIndex: number }[];
                          }[] = [];

                          let currentGroup: typeof groups[0] | null = null;

                          filtered.forEach((e, idx) => {
                            const canGroup = e.Invoice_No && currentGroup && e.Invoice_No === currentGroup.invoiceNo && e.Employee_Name === currentGroup.employeeName;
                            if (canGroup && currentGroup) {
                              currentGroup.entries.push({ entry: e, originalIndex: idx });
                            } else {
                              currentGroup = {
                                id: `${e.Invoice_No || 'no-inv'}-${e.Employee_Name || 'no-emp'}-${idx}`,
                                invoiceNo: e.Invoice_No,
                                employeeName: e.Employee_Name,
                                entries: [{ entry: e, originalIndex: idx }]
                              };
                              groups.push(currentGroup);
                            }
                          });

                          return groups.map((group) => {
                            const isCollapsed = collapsedGroups[group.id];
                            const isMergedGroup = group.entries.length > 1;

                            if (isCollapsed && isMergedGroup) {
                              return (
                                <tr 
                                  key={group.id} 
                                  onClick={() => toggleGroup(group.id)} 
                                  className="bg-amber-50/20 hover:bg-amber-50/40 cursor-pointer transition-colors border-y border-amber-100 select-none"
                                  title="Click to expand group"
                                >
                                  <td colSpan={11} className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Grouped</span>
                                      <span>Invoice: <strong className="text-foreground">{group.invoiceNo || 'N/A'}</strong></span>
                                      <span>—</span>
                                      <span>Employee: <strong className="text-foreground">{group.employeeName || 'N/A'}</strong></span>
                                      <span>—</span>
                                      <span>{group.entries.length} items</span>
                                      <span className="text-[10px] text-muted-foreground ml-2 font-normal">(Click to expand)</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return group.entries.map(({ entry: e, originalIndex }, idx) => {
                              return (
                                <tr 
                                  key={`${e.Entry_ID}-${originalIndex}`} 
                                  onClick={isMergedGroup ? () => toggleGroup(group.id) : undefined}
                                  className={cn(
                                    "hover:bg-muted/5 transition-colors border-b",
                                    isMergedGroup && "cursor-pointer"
                                  )}
                                  title={isMergedGroup ? "Click row whitespace to collapse this group" : undefined}
                                >
                                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{e.Date_Time}</td>
                                  <td className="px-4 py-3 font-medium">
                                    <button
                                      onClick={(evt) => {
                                        evt.stopPropagation();
                                        flashClick(evt);
                                        handleItemClick(e.Item_Name, e.Item_Code);
                                      }}
                                      className="text-left font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                                    >
                                      {e.Item_Name}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.Item_Code}</td>
                                  <td className="px-4 py-3 text-center">
                                    <Badge className={cn('text-[10px] font-bold',
                                      e.Transaction_Type==='Inward' ? 'bg-green-100 text-green-700 border-green-200' :
                                      e.Transaction_Type==='Return' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                      'bg-amber-100 text-amber-700 border-amber-200'
                                    )} variant="outline">
                                      {e.Transaction_Type==='Inward' ? '↓ IN' : e.Transaction_Type==='Return' ? '↺ RET' : '↑ OUT'}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold">{e.Transaction_Type==='Inward' || e.Transaction_Type==='Return' ? e.Inward_Qty : e.Outward_Qty}</td>
                                  <td className="px-4 py-3 text-right font-bold text-primary">{e.Balance_Qty}</td>
                                  <td className="px-4 py-3 text-xs">
                                    {e.Transaction_Type==='Inward' && e.Vendor_Name ? (
                                      <button
                                        onClick={(evt) => { evt.stopPropagation(); flashClick(evt); handleVendorClick(e.Vendor_Name); }}
                                        className="text-left text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                                      >
                                        {e.Vendor_Name}
                                      </button>
                                    ) : e.Transaction_Type==='Return' ? `Returned from ${e.Issued_To || 'Staff'}` : e.Issued_To}
                                  </td>

                                  {idx === 0 ? (
                                    <td
                                      rowSpan={isMergedGroup ? group.entries.length : undefined}
                                      className={cn(
                                        "px-4 py-3 text-xs font-medium text-left align-middle",
                                        isMergedGroup && "bg-muted/10 border-l border-r border-muted-foreground/10"
                                      )}
                                    >
                                      <button
                                        onClick={(evt) => {
                                          evt.stopPropagation();
                                          flashClick(evt);
                                          handleEmployeeClick(e.Employee_Name);
                                        }}
                                        className="text-left font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                                      >
                                        {e.Employee_Name || 'N/A'}
                                      </button>
                                    </td>
                                  ) : null}

                                  {idx === 0 ? (
                                    <td
                                      rowSpan={isMergedGroup ? group.entries.length : undefined}
                                      className={cn(
                                        "px-4 py-3 text-xs text-muted-foreground text-left align-middle",
                                        isMergedGroup && "bg-muted/10 border-r border-muted-foreground/10"
                                      )}
                                    >
                                      {e.Invoice_No ? (
                                        <button
                                          onClick={(evt) => { evt.stopPropagation(); flashClick(evt); handleInvoiceClick(e.Invoice_No); }}
                                          className="text-left text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                                        >
                                          {e.Invoice_No}
                                        </button>
                                      ) : (e.Remarks || '—')}
                                    </td>
                                  ) : null}

                                  <td className="px-4 py-3 text-right text-xs font-medium">
                                    {e.Total_Invoice_Value ? `₹${parseFloat(e.Total_Invoice_Value).toLocaleString('en-IN')}` : '—'}
                                  </td>

                                  <td className="px-4 py-3 text-right text-xs font-medium">
                                    {e.Transaction_Type === 'Outward' ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-bold h-7 px-2"
                                        onClick={(evt) => {
                                          evt.stopPropagation();
                                          handleReturnClick(e);
                                        }}
                                      >
                                        Return
                                      </Button>
                                    ) : e.Transaction_Type === 'Return' ? (
                                      <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">Returned</Badge>
                                    ) : (
                                      <span className="text-muted-foreground/30">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">
                    {items.filter(item => !summaryFilter || item.status === summaryFilter).length} items shown
                  </span>
                  {summaryFilter && (
                    <Badge variant="outline" className="gap-1.5 cursor-pointer" onClick={() => setSummaryFilter(null)}>
                      Filtered: {summaryFilter} ✕
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Item Name</th>
                        <th className="px-4 py-3 text-left">Code</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-right">Balance Qty</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.filter(item => !summaryFilter || item.status === summaryFilter).length===0 ? (
                        <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No items found.</td></tr>
                      ) : items.filter(item => !summaryFilter || item.status === summaryFilter).map((item, i) => (
                        <tr key={i} className="hover:bg-muted/5 transition-colors">
                          <td className="px-4 py-3 font-medium">{item.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.code}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{item.location}</td>
                          <td className="px-4 py-3 text-right font-bold text-primary">{item.balance}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className={cn('text-[10px] font-bold',
                              item.status==='Normal'        ? 'bg-green-50 text-green-700 border-green-200' :
                              item.status==='Low'           ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-700 border-red-200')}>
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showInwardModal && <InwardModal onClose={() => setShowInwardModal(false)} />}
      {showOutwardPicker && <OutwardPicker onClose={() => setShowOutwardPicker(false)} />}

      {selectedItem && (
        <InfoPopup 
          type="item" 
          id={selectedItem.code || selectedItem.name} 
          onClose={() => setSelectedItem(null)} 
        />
      )}

      {selectedEmployee && (
        <InfoPopup
          type="employee"
          id={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {selectedVendor && (
        <InfoPopup
          type="vendor"
          id={selectedVendor}
          onClose={() => setSelectedVendor(null)}
        />
      )}

      {selectedInvoice && (
        <InfoPopup
          type="invoice"
          id={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Stock Return</DialogTitle>
          </DialogHeader>
          {returnEntry && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1.5">
                <p><strong>Item:</strong> {returnEntry.Item_Name} ({returnEntry.Item_Code})</p>
                <p><strong>Issued To:</strong> {returnEntry.Issued_To || 'Staff'}</p>
                <p><strong>Original Issue Qty:</strong> {returnEntry.Outward_Qty}</p>
                {alreadyReturnedForCurrent > 0 && (
                  <p><strong>Already Returned:</strong> {alreadyReturnedForCurrent} (remaining: {remainingReturnable})</p>
                )}
                <p><strong>Original Ref:</strong> {returnEntry.Entry_ID} ({returnEntry.Date_Time})</p>
              </div>

              <div className="space-y-2">
                <Label>Return To Location <span className="text-red-500">*</span></Label>
                <LocationPicker
                  cupboards={cupboards}
                  boxes={boxes}
                  selectedCupboardId={returnCupboardId}
                  selectedBoxId={returnBoxId}
                  onChange={(cupboardId, boxId) => { setReturnCupboardId(cupboardId); setReturnBoxId(boxId); }}
                />
                <p className="text-[10px] text-muted-foreground">
                  Each return credits ONE location. If the original outward pulled from multiple locations,
                  submit a separate return for each one.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="return-qty">Quantity to Return</Label>
                <Input
                  id="return-qty"
                  type="number"
                  value={returnQty}
                  onChange={e => setReturnQty(e.target.value)}
                  placeholder="e.g. 5"
                />
                <p className="text-[10px] text-muted-foreground">Cannot exceed the remaining un-returned quantity ({remainingReturnable}).</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="return-remarks">Remarks / Reason</Label>
                <Input
                  id="return-remarks"
                  value={returnRemarks}
                  onChange={e => setReturnRemarks(e.target.value)}
                  placeholder="e.g. Unused, project cancelled"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReturnModal(false)}>Cancel</Button>
            <Button onClick={handleReturnSubmit} disabled={returnLoading}>
              {returnLoading ? 'Processing…' : 'Process Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
