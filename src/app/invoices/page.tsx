"use client";

import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Search, X, Package, RefreshCw, ArrowDownToLine, ArrowUpFromLine, ExternalLink, Trash2 } from 'lucide-react';
import { useInvoices, useInventoryEntries, useItemMaster } from '@/hooks/use-inventory-data';
import { Button } from '@/components/ui/button';
import { InfoPopup } from '@/components/shared/info-popup';
import { flashClick } from '@/lib/click-flash';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

// Entries store Date_Time as "DD-MM-YYYY HH:mm" — parse that for chronological sort,
// falling back to a direct Date parse for any other format already in the sheet.
function parseDT(s: string): number {
  const m = /^(\d{2})-(\d{2})-(\d{4})[ T]?(\d{2}:\d{2})?/.exec(s || '');
  if (m) {
    const [, d, mo, y, hm] = m;
    return new Date(`${y}-${mo}-${d}T${hm || '00:00'}`).getTime();
  }
  const t = new Date(s).getTime();
  return isNaN(t) ? 0 : t;
}

export default function InvoicesPage() {
  if (!PAGE_CONFIG.invoices) return <UnderDevelopment pageName="Invoices" />;

  const { user } = useAuth();
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Inventory Lead';

  const router = useRouter();
  const searchParams = useSearchParams();
  const { invoices, deleteInvoice, loading: loadingInvoices } = useInvoices();
  const { entries } = useInventoryEntries();
  const { items: catalogItems } = useItemMaster();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [search, setSearch] = useState('');
  const [activeInvoiceNo, setActiveInvoiceNo] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [itemPopupCode, setItemPopupCode] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Deep-link support: /invoices?invoice=INV-123 auto-opens that invoice's detail panel
  // (used by Vendor Master's "Items Purchased" click-through).
  const deepLinkInvoice = searchParams.get('invoice');
  useEffect(() => {
    if (deepLinkInvoice) setActiveInvoiceNo(deepLinkInvoice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkInvoice]);
  
  const isImageFile = (url: string) => {
    const cleanUrl = url.toLowerCase().split('?')[0];
    return cleanUrl.endsWith('.png') || 
           cleanUrl.endsWith('.jpg') || 
           cleanUrl.endsWith('.jpeg') || 
           cleanUrl.endsWith('.webp') || 
           cleanUrl.endsWith('.svg') ||
           url.startsWith('data:image/');
  };

  const handleViewInvoice = (url: string) => {
    if (isImageFile(url)) {
      setPreviewImageUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const rowCountByInvoice = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => { if (e.Invoice_No) map[e.Invoice_No] = (map[e.Invoice_No] || 0) + 1; });
    return map;
  }, [entries]);

  const invoiceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    invoices.forEach(i => {
      if (i.Invoice_No) {
        counts[i.Invoice_No] = (counts[i.Invoice_No] || 0) + 1;
      }
    });
    return counts;
  }, [invoices]);

  const filtered = invoices
    .filter(inv =>
      !search ||
      String(inv.Invoice_No || '').toLowerCase().includes(search.toLowerCase()) ||
      String(inv.Vendor_Name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(inv.Employee_Name || '').toLowerCase().includes(search.toLowerCase())
    )
    .slice()
    .sort((a, b) => parseDT(b.Created_On || b.Date) - parseDT(a.Created_On || a.Date));

  const activeInvoice = invoices.find(i => i.Invoice_No === activeInvoiceNo) || null;
  const activeRows = activeInvoiceNo ? entries.filter(e => e.Invoice_No === activeInvoiceNo) : [];

  const popupItem = itemPopupCode ? catalogItems.find(i => i.Item_Code === itemPopupCode) : null;
  const popupLogs = itemPopupCode
    ? entries.filter(e => e.Item_Code === itemPopupCode).slice().sort((a, b) => parseDT(b.Date_Time) - parseDT(a.Date_Time))
    : [];

  if (!mounted || (loadingInvoices && invoices.length === 0)) {
    return (
      <AppShell>
        <div className="space-y-5">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Invoices</h1>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading invoices...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Invoices</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Every inward delivery recorded with an invoice number.</p>
          </div>
          <div className="flex items-center border rounded-lg px-3 bg-white h-9">
            <Search className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice no, vendor, employee…" className="border-none outline-none text-sm w-56 bg-transparent" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No invoices yet</p>
            <p className="text-sm mt-1">Invoices are created from the "With Invoice" Inward Entry flow.</p>
          </div>
        ) : (
          <Card className="border-none shadow-md">
            <CardContent className="p-0">
              {/* Mobile View */}
              <div className="divide-y sm:hidden">
                {filtered.map((inv, idx) => {
                  const isDup = (invoiceCounts[inv.Invoice_No] || 0) > 1;
                  return (
                    <div
                      key={`${inv.Invoice_No}-${idx}-mobile`}
                      onClick={(e) => { flashClick(e); setActiveInvoiceNo(inv.Invoice_No); }}
                      className="p-4 hover:bg-muted/5 cursor-pointer transition-colors space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-mono font-semibold text-primary flex items-center gap-1.5 flex-wrap">
                          <span>{inv.Invoice_No}</span>
                          {isDup && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 text-[10px] py-0 px-1.5 font-sans font-normal gap-1 shrink-0">
                              ⚠️ Duplicate
                            </Badge>
                          )}
                        </div>
                        <span className="font-semibold text-sm">
                          {inv.Total_Value ? `₹${parseFloat(inv.Total_Value).toLocaleString('en-IN')}` : '—'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          Vendor:{' '}
                          <button
                            onClick={(e) => { e.stopPropagation(); flashClick(e); setSelectedVendor(inv.Vendor_Name); }}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none font-medium text-left"
                          >
                            {inv.Vendor_Name}
                          </button>
                        </span>
                        <span className="text-muted-foreground shrink-0">{inv.Date}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          By:{' '}
                          <button
                            onClick={(e) => { e.stopPropagation(); flashClick(e); setSelectedEmployee(inv.Employee_Name); }}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none font-medium text-left"
                          >
                            {inv.Employee_Name}
                          </button>
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          Items: <Badge variant="outline" className="text-[10px] py-0 px-1">{rowCountByInvoice[inv.Invoice_No] || 0}</Badge>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Invoice No</th>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Received By</th>
                      <th className="px-4 py-3 text-center">Items</th>
                      <th className="px-4 py-3 text-right">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((inv, idx) => {
                      const isDup = (invoiceCounts[inv.Invoice_No] || 0) > 1;
                      return (
                        <tr key={`${inv.Invoice_No}-${idx}`} onClick={(e) => { flashClick(e); setActiveInvoiceNo(inv.Invoice_No); }}
                          className="hover:bg-muted/10 cursor-pointer transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-primary">
                            <div className="flex items-center gap-2">
                              <span>{inv.Invoice_No}</span>
                              {isDup && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 text-[10px] py-0 px-1.5 font-sans font-normal gap-1 shrink-0">
                                  ⚠️ Duplicate
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); flashClick(e); setSelectedVendor(inv.Vendor_Name); }}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                            >
                              {inv.Vendor_Name}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{inv.Date}</td>
                          <td className="px-4 py-3 text-xs">
                            <button
                              onClick={(e) => { e.stopPropagation(); flashClick(e); setSelectedEmployee(inv.Employee_Name); }}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                            >
                              {inv.Employee_Name}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="text-[10px]">{rowCountByInvoice[inv.Invoice_No] || 0}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {inv.Total_Value ? `₹${parseFloat(inv.Total_Value).toLocaleString('en-IN')}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Invoice detail panel — every Stock_Register row under this Invoice_No ── */}
      <Sheet open={!!activeInvoiceNo} onOpenChange={o => !o && setActiveInvoiceNo(null)}>
        <SheetContent side="right" className="w-full max-w-[520px] p-0 flex flex-col">
          {activeInvoice && (
            <>
              <div className="p-5 border-b bg-primary text-primary-foreground flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold opacity-70 uppercase tracking-widest">Invoice</div>
                    <div className="text-lg font-bold font-mono">{activeInvoice.Invoice_No}</div>
                    <div className="text-sm opacity-80 mt-0.5">
                      <button
                        onClick={(e) => { flashClick(e); setSelectedVendor(activeInvoice.Vendor_Name); }}
                        className="underline decoration-white/40 hover:decoration-white transition-colors focus:outline-none"
                      >
                        {activeInvoice.Vendor_Name}
                      </button> · {activeInvoice.Date}
                    </div>
                  </div>
                  <button className="opacity-70 hover:opacity-100" onClick={() => setActiveInvoiceNo(null)}><X className="h-5 w-5" /></button>
                </div>
                <div className="flex flex-col gap-3 mt-3">
                  <div className="flex gap-4 text-xs">
                    <span>Received by{' '}
                      <button
                        onClick={(e) => { flashClick(e); setSelectedEmployee(activeInvoice.Employee_Name); }}
                        className="font-bold underline decoration-white/40 hover:decoration-white transition-colors focus:outline-none"
                      >
                        {activeInvoice.Employee_Name}
                      </button>
                    </span>
                    <span>Total <strong>₹{parseFloat(activeInvoice.Total_Value || '0').toLocaleString('en-IN')}</strong></span>
                  </div>
                  {activeInvoice.Invoice_File_URL && (
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewInvoice(activeInvoice.Invoice_File_URL!)}
                      className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold h-8 rounded-lg flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <FileText className="h-3.5 w-3.5" /> View Invoice File
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activeRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No stock rows found for this invoice.</p>
                ) : activeRows.map((row, i) => (
                  <button key={`${row.Entry_ID}-${i}`} onClick={(e) => { flashClick(e); setItemPopupCode(row.Item_Code || null); }}
                    className="w-full text-left rounded-xl border p-3 flex items-center justify-between gap-2 bg-white hover:border-primary/40 transition-colors">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{row.Item_Name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{row.Item_Code}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        {row.Transaction_Type === 'Inward'
                          ? <ArrowDownToLine className="h-3 w-3 text-green-600" />
                          : <ArrowUpFromLine className="h-3 w-3 text-amber-600" />}
                        <span className="font-bold text-sm">{row.Transaction_Type === 'Inward' ? row.Inward_Qty : row.Outward_Qty}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">₹{parseFloat(row.Price_Per_Item || '0').toLocaleString('en-IN')}/unit</div>
                    </div>
                  </button>
                ))}
              </div>
              {isAdmin && (
                <div className="p-4 border-t bg-gray-50 flex justify-end flex-shrink-0">
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5 h-9 text-xs font-semibold rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Invoice & Associated Entries
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Item info popup — image, brief info, transaction logs ── */}
      <Dialog open={!!itemPopupCode} onOpenChange={o => !o && setItemPopupCode(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader className="flex-row items-center justify-between gap-2 pr-8">
            <DialogTitle>{popupItem?.Item_Name || itemPopupCode}</DialogTitle>
            {popupItem && (
              <button
                onClick={(e) => { flashClick(e); setItemPopupCode(null); router.push(`/item-master/${popupItem.Item_ID || popupItem.Item_Code}`); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-100/60 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
              >
                View Full Page <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className={cn(
                "w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden border flex items-center justify-center",
                popupItem?.Image_URL ? "" : "bg-muted"
              )}>
                {popupItem?.Image_URL ? (
                  <img src={popupItem.Image_URL} alt={popupItem.Item_Name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="text-sm space-y-1 min-w-0">
                <p><span className="text-muted-foreground">Code:</span> <span className="font-mono">{popupItem?.Item_Code || itemPopupCode}</span></p>
                <p><span className="text-muted-foreground">Category:</span> {popupItem?.Category || 'Uncategorized'}</p>
                <p><span className="text-muted-foreground">HSN:</span> {popupItem?.HSN_Code || '—'}</p>
              </div>
            </div>

            <div className="bg-muted/40 border border-dashed rounded-lg p-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Brief Info</p>
              <p>{popupItem?.Description || 'No description yet — AI-generated summaries are planned but skippable for now.'}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Transaction Logs ({popupLogs.length})</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {popupLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No transactions recorded for this item.</p>
                ) : popupLogs.map((log, i) => (
                  <div key={`${log.Entry_ID}-${i}`} className="flex items-center justify-between text-xs border-b pb-1.5 last:border-0">
                    <div className="flex items-center gap-1.5">
                      {log.Transaction_Type === 'Inward'
                        ? <ArrowDownToLine className="h-3 w-3 text-green-600" />
                        : <ArrowUpFromLine className="h-3 w-3 text-amber-600" />}
                      <span className="text-muted-foreground">{log.Date_Time}</span>
                    </div>
                    <span className="font-semibold">
                      {log.Transaction_Type === 'Inward' ? `+${log.Inward_Qty}` : `-${log.Outward_Qty}`}
                    </span>
                    <span className="text-muted-foreground truncate max-w-[140px]">
                      {log.Invoice_No || log.Issued_To || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {selectedVendor && <InfoPopup type="vendor" id={selectedVendor} onClose={() => setSelectedVendor(null)} />}
      {selectedEmployee && <InfoPopup type="employee" id={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
      
      {previewImageUrl && (
        <Dialog open={!!previewImageUrl} onOpenChange={o => !o && setPreviewImageUrl(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-none flex items-center justify-center">
            <div className="relative w-full max-h-[85vh] p-4 flex flex-col items-center justify-center">
              <button 
                onClick={() => setPreviewImageUrl(null)}
                className="absolute top-4 right-4 text-white bg-black/60 hover:bg-black/80 p-1.5 rounded-full z-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <img src={previewImageUrl} alt="Invoice Preview" className="max-h-[80vh] max-w-full object-contain rounded" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showDeleteConfirm && activeInvoice && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" /> Delete Invoice?
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-sm text-muted-foreground space-y-3">
              <p>
                Are you sure you want to delete invoice <strong className="font-mono text-foreground">{activeInvoice.Invoice_No}</strong> from <strong className="text-foreground">{activeInvoice.Vendor_Name}</strong>?
              </p>
              {activeRows.length > 0 ? (
                <div className="bg-red-50 text-red-800 p-3.5 rounded-xl border border-red-100 text-xs">
                  <p className="font-bold flex items-center gap-1">⚠️ Warning: Affected Stock Entries</p>
                  <p className="mt-1 leading-relaxed">
                    This invoice has <strong>{activeRows.length}</strong> associated entry rows in the Stock Register. These will be <strong>permanently deleted</strong> along with the invoice to prevent orphaned records and keep inventory balances accurate.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 text-gray-700 p-3.5 rounded-xl border border-gray-100 text-xs">
                  <p className="font-semibold">No stock register rows are associated with this invoice.</p>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4 gap-2 flex flex-col sm:flex-row">
              <Button 
                variant="ghost" 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  const res = await deleteInvoice(activeInvoice.Invoice_No);
                  if (res.success) {
                    setActiveInvoiceNo(null);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}
