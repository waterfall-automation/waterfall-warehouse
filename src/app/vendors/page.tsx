"use client";
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';
import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building2, Plus, Search, RefreshCw, Edit, Phone, Mail, MapPin, ChevronDown, PackageSearch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVendors, useInventoryEntries } from '@/hooks/use-inventory-data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { InfoPopup } from '@/components/shared/info-popup';
import { flashClick } from '@/lib/click-flash';

export default function VendorsPage() {
  const router = useRouter();
  const { vendors, addVendor, updateVendor, loading: loadingVendors } = useVendors();
  const { entries } = useInventoryEntries();
  const { toast } = useToast();
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isDemo] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editVendor, setEditVendor] = useState<any>(null);
  const [form, setForm] = useState({ vendorName:'',contactPerson:'',phone:'',email:'',address:'',gstin:'',category:'',notes:'' });
  const [mounted, setMounted] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFormDirty = () => {
    if (editVendor) {
      return form.vendorName !== editVendor.Vendor_Name ||
        form.contactPerson !== editVendor.Contact_Person ||
        form.phone !== editVendor.Phone ||
        form.email !== editVendor.Email ||
        form.address !== editVendor.Address ||
        form.gstin !== editVendor.GSTIN ||
        form.category !== editVendor.Category ||
        form.notes !== (editVendor.Notes || '');
    }
    return form.vendorName !== '' ||
      form.contactPerson !== '' ||
      form.phone !== '' ||
      form.email !== '' ||
      form.address !== '' ||
      form.gstin !== '' ||
      form.category !== '' ||
      form.notes !== '';
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 200);
  };

  const openAdd = () => { setEditVendor(null); setForm({vendorName:'',contactPerson:'',phone:'',email:'',address:'',gstin:'',category:'',notes:''}); setErrors({}); setShowModal(true); };
  const openEdit = (v: any) => { setEditVendor(v); setForm({vendorName:v.Vendor_Name,contactPerson:v.Contact_Person,phone:v.Phone,email:v.Email,address:v.Address,gstin:v.GSTIN,category:v.Category,notes:v.Notes||''}); setErrors({}); setShowModal(true); };

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!form.vendorName.trim()) errs.vendorName = 'Vendor name is required.';
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      if (editVendor) {
        updateVendor(editVendor.Vendor_ID, form);
      } else {
        addVendor(form);
      }
      setShowModal(false);
      setErrors({});
    } catch {
      toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = vendors.filter(v => !search || String(v.Vendor_Name || '').toLowerCase().includes(search.toLowerCase()) || String(v.GSTIN || '').toLowerCase().includes(search.toLowerCase()) || String(v.Category || '').toLowerCase().includes(search.toLowerCase()));

  // Entries store Date_Time as "DD-MM-YYYY HH:mm" — parse that for chronological sort,
  // falling back to a direct Date parse for any other format already in the sheet.
  const parseDT = (s: string) => {
    const m = /^(\d{2})-(\d{2})-(\d{4})[ T]?(\d{2}:\d{2})?/.exec(s || '');
    if (m) { const [, d, mo, y, hm] = m; return new Date(`${y}-${mo}-${d}T${hm || '00:00'}`).getTime(); }
    const t = new Date(s).getTime();
    return isNaN(t) ? 0 : t;
  };

  const getVendorPurchases = (vendorName: string) =>
    entries
      .filter(e => e.Transaction_Type === 'Inward' && String(e.Vendor_Name || '').toLowerCase() === String(vendorName || '').toLowerCase())
      .slice()
      .sort((a, b) => parseDT(b.Date_Time) - parseDT(a.Date_Time));

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Vendor Master</h1>
              <p className="text-muted-foreground mt-1">Approved supplier directory with GSTIN records.</p>
            </div>
          </div>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading vendors...
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
            <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Vendor Master</h1>
            <p className="text-muted-foreground mt-1">Approved supplier directory with GSTIN records.{isDemo && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Demo</span>}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={load} className={loading?'animate-spin':''}><RefreshCw className="h-4 w-4" /></Button>
            <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" />Add Vendor</Button>
          </div>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b pb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendors…" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(loading || (loadingVendors && vendors.length === 0)) ? <div className="py-12 text-center text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Loading…</div>
            : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                {filtered.map((v,i)=>{
                  const isOpen = expandedVendor === v.Vendor_ID;
                  const purchases = isOpen ? getVendorPurchases(v.Vendor_Name) : [];
                  return (
                  <div key={i} className="border rounded-xl p-4 bg-card hover:shadow-md transition-all space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <button
                          onClick={(e) => { flashClick(e); setSelectedVendorId(v.Vendor_ID); }}
                          className="font-bold text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left focus:outline-none block"
                        >
                          {v.Vendor_Name}
                        </button>
                        <p className="text-xs text-muted-foreground mt-0.5">{v.Contact_Person}</p>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <Badge variant="outline" className="text-[9px]">{v.Category}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>openEdit(v)}><Edit className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {v.Phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{v.Phone}</p>}
                      {v.Email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{v.Email}</p>}
                      {v.Address && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{v.Address}</p>}
                    </div>
                    {v.GSTIN && <div className="bg-muted/40 rounded-lg px-3 py-2 font-mono text-xs text-center tracking-wider">{v.GSTIN}</div>}

                    {/* Purchase history — read-only, expandable */}
                    <div className="border-t pt-2.5">
                      <button
                        onClick={() => setExpandedVendor(isOpen ? null : v.Vendor_ID)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="flex items-center gap-1.5"><PackageSearch className="h-3.5 w-3.5" /> Items Purchased</span>
                        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      {isOpen && (
                        purchases.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic mt-2 py-2 text-center">No items recorded yet.</p>
                        ) : (
                          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border divide-y">
                            {purchases.map((p, pi) => {
                              const hasInvoice = !!p.Invoice_No;
                              const Row = hasInvoice ? 'button' : 'div';
                              return (
                                <Row
                                  key={`${p.Entry_ID}-${pi}`}
                                  {...(hasInvoice ? {
                                    onClick: (e: React.MouseEvent<HTMLElement>) => {
                                      flashClick(e);
                                      router.push(`/invoices?invoice=${encodeURIComponent(p.Invoice_No)}`);
                                    }
                                  } : {})}
                                  className={cn(
                                    'w-full px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs text-left',
                                    hasInvoice && 'hover:bg-muted/40 transition-colors cursor-pointer'
                                  )}
                                >
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{p.Item_Name}</p>
                                    <p className="text-[10px] text-muted-foreground">{p.Date_Time}{p.Invoice_No ? ` · Inv ${p.Invoice_No}` : ''}</p>
                                  </div>
                                  <span className="font-bold text-green-700 shrink-0">+{p.Inward_Qty}</span>
                                </Row>
                              );
                            })}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  );
                })}
                {filtered.length === 0 && <div className="col-span-3 py-12 text-center text-muted-foreground">No vendors found</div>}
              </div>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg" preventClose={isFormDirty()}>
          <DialogHeader><DialogTitle>{editVendor?'Edit Vendor':'Add New Vendor'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vendor Name *</Label>
                <Input 
                  value={form.vendorName} 
                  onChange={e => {
                    setForm(f => ({ ...f, vendorName: e.target.value }));
                    if (errors.vendorName) setErrors(err => ({ ...err, vendorName: '' }));
                  }} 
                  className={cn("mt-1", errors.vendorName && "border-red-500 text-red-600 focus-visible:ring-red-500")} 
                />
                {errors.vendorName && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.vendorName}</p>}
              </div>
              <div><Label>Contact Person</Label><Input value={form.contactPerson} onChange={e=>setForm(f=>({...f,contactPerson:e.target.value}))} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="mt-1" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="mt-1" /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>GSTIN</Label><Input value={form.gstin} onChange={e=>setForm(f=>({...f,gstin:e.target.value}))} placeholder="27AAACS1234A1Z5" className="mt-1 font-mono" /></div>
              <div><Label>Category</Label><Input value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="Electronics, PPE…" className="mt-1" /></div>
            </div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving?'Saving…':editVendor?'Update':'Add Vendor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedVendorId && (
        <InfoPopup 
          type="vendor" 
          id={selectedVendorId} 
          onClose={() => setSelectedVendorId(null)} 
        />
      )}
    </AppShell>
  );
}
