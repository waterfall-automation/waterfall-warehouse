"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { MapPin, Plus, Trash2, X, FileText, FileX, Camera, RefreshCw } from 'lucide-react';
import {
  useItemMaster, useEmployees, useCupboards, useBoxesAndPlacements,
  useInventoryEntries, useInvoices
} from '@/hooks/use-inventory-data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Invoice } from '@/lib/demo-data';
import { useAuth } from '@/context/auth-context';

type LocationAllocation = {
  key: string;
  cupboardId: string; cupboardName: string;
  boxId: string; boxName: string;
  qty: string;
};

type Row = {
  key: string;
  itemName: string; itemCode: string; hsnCode: string; category: string; unit: string;
  isNewItem: boolean;
  qty: string; price: string; gstRate: string; discountPct: string;
  locations: LocationAllocation[];
  remarks: string;
};

function blankRow(): Row {
  return {
    key: Math.random().toString(36).slice(2),
    itemName: '', itemCode: '', hsnCode: '', category: '', unit: '',
    isNewItem: false,
    qty: '', price: '', gstRate: '18', discountPct: '0',
    locations: [],
    remarks: '',
  };
}

function lineTotal(r: Row) {
  const qty = parseFloat(r.qty || '0');
  const price = parseFloat(r.price || '0');
  const disc = parseFloat(r.discountPct || '0');
  const gst = parseFloat(r.gstRate || '0');
  const taxable = qty * price * (1 - disc / 100);
  return taxable + (taxable * gst) / 100;
}

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Converts a native <input type="date"> value (YYYY-MM-DD) to this app's DD-MM-YYYY HH:mm convention.
function toDisplayDateTime(isoDate: string) {
  if (!isoDate) return new Date().toLocaleString();
  const [y, m, d] = isoDate.split('-');
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d}-${m}-${y} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

import { ItemTooltip } from '@/components/shared/item-tooltip';
import { safeStr } from '@/lib/utils';

// ── Generic "existing + create new" autocomplete — reused for Item Name, Employee, Cupboard, and Box ──
function AutocompleteInput({
  value, onChangeText, options, getLabel, onSelect, onCreateNew, placeholder, newLabelPrefix, onPasteCapture,
}: {
  value: string;
  onChangeText: (v: string) => void;
  options: any[];
  getLabel: (o: any) => string;
  onSelect: (o: any) => void;
  onCreateNew: (name: string) => void;
  placeholder: string;
  newLabelPrefix: string;
  onPasteCapture?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  // Real sheet rows can have a blank/non-string label — coerce before calling string methods.
  const label = (o: any) => String(getLabel(o) || '');
  const matches = q ? options.filter(o => label(o).toLowerCase().includes(q)).slice(0, 6) : [];
  const exact = q ? options.some(o => label(o).toLowerCase() === q) : true;

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={e => { onChangeText(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onPaste={onPasteCapture}
        placeholder={placeholder}
        className="h-9 text-sm"
        autoComplete="off"
      />
      {open && q && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden divide-y divide-gray-100 text-sm max-h-56 overflow-y-auto">
          {!exact && (
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { onCreateNew(value.trim()); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
              <Plus className="h-3 w-3" /> {newLabelPrefix} &ldquo;{value.trim()}&rdquo;
            </button>
          )}
          {matches.map((o, i) => {
            const hasItemCode = o && typeof o === 'object' && 'Item_Code' in o;
            const content = (
              <button key={i} type="button" onMouseDown={e => e.preventDefault()} onClick={() => { onSelect(o); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50">
                {getLabel(o)}
              </button>
            );
            if (hasItemCode) {
              return (
                <ItemTooltip key={i} itemCode={o.Item_Code}>
                  {content}
                </ItemTooltip>
              );
            }
            return content;
          })}
        </div>
      )}
    </div>
  );
}

// ── Location allocator — split a row's quantity across multiple cupboard/box locations.
// Cupboard and Box are picked with the same autocomplete-with-inline-create pattern as Item Name.
function LocationPicker({ rowQty, value, onChange }: {
  rowQty: number;
  value: LocationAllocation[];
  onChange: (locs: LocationAllocation[]) => void;
}) {
  const { cupboards, addCupboard } = useCupboards();
  const { getBoxesForCupboard, addBox } = useBoxesAndPlacements();
  const [open, setOpen] = useState(false);
  const [cupboardId, setCupboardId] = useState('');
  const [cupboardText, setCupboardText] = useState('');
  const [boxId, setBoxId] = useState('');
  const [boxText, setBoxText] = useState('');
  const [qty, setQty] = useState('');

  const boxes = cupboardId ? getBoxesForCupboard(cupboardId) : [];
  const allocated = value.reduce((s, l) => s + parseFloat(l.qty || '0'), 0);
  const remaining = Math.max(rowQty - allocated, 0);

  const resetMiniForm = () => { setCupboardId(''); setCupboardText(''); setBoxId(''); setBoxText(''); setQty(''); };

  const handleCreateCupboard = async (name: string) => {
    const res = await addCupboard({ number: String(cupboards.length + 1).padStart(2, '0'), name });
    if (res.success && res.cupboardId) { setCupboardId(res.cupboardId); setCupboardText(name); setBoxId(''); setBoxText(''); }
  };

  const handleCreateBox = async (name: string) => {
    if (!cupboardId) return;
    const res = await addBox(cupboardId, name);
    if (res.success && res.box) { setBoxId(res.box.Box_ID); setBoxText(name); }
  };

  const addAllocation = () => {
    const qn = parseFloat(qty || '0');
    if (!cupboardId || !boxId || qn <= 0) return;
    const cup = cupboards.find(c => c.Cupboard_ID === cupboardId);
    const box = boxes.find(b => b.Box_ID === boxId);
    if (!cup || !box) return;
    onChange([...value, {
      key: Math.random().toString(36).slice(2),
      cupboardId: cup.Cupboard_ID, cupboardName: cup.Name,
      boxId: box.Box_ID, boxName: box.Box_Name, qty: String(qn),
    }]);
    resetMiniForm();
  };

  const removeAllocation = (key: string) => onChange(value.filter(l => l.key !== key));

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {value.map(loc => (
            <span key={loc.key} className="inline-flex items-center gap-1 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full pl-2 pr-1 py-0.5">
              {loc.cupboardName}/{loc.boxName}: {loc.qty}
              <button type="button" onClick={() => removeAllocation(loc.key)} className="hover:text-red-600"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md border bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 w-full justify-center">
            <MapPin className="h-3 w-3" /> {value.length > 0 ? 'Add another' : 'Set location'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-w-[calc(100vw-32px)] space-y-3" align="start">
          {rowQty > 0 && (
            <p className="text-xs text-gray-500">Remaining to place: <span className="font-semibold text-gray-700">{remaining}</span> of {rowQty}</p>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-700">Cupboard</label>
            <div className="mt-1">
              <AutocompleteInput
                value={cupboardText}
                onChangeText={v => { setCupboardText(v); setCupboardId(''); }}
                options={cupboards}
                getLabel={c => c.Name}
                placeholder="Search or create cupboard…"
                newLabelPrefix="Create cupboard"
                onSelect={c => { setCupboardId(c.Cupboard_ID); setCupboardText(c.Name); setBoxId(''); setBoxText(''); }}
                onCreateNew={handleCreateCupboard}
              />
            </div>
          </div>

          {cupboardId && (
            <div>
              <label className="text-xs font-semibold text-gray-700">Box</label>
              <div className="mt-1">
                <AutocompleteInput
                  value={boxText}
                  onChangeText={v => { setBoxText(v); setBoxId(''); }}
                  options={boxes}
                  getLabel={b => b.Box_Name}
                  placeholder="Search or create box…"
                  newLabelPrefix="Create box"
                  onSelect={b => { setBoxId(b.Box_ID); setBoxText(b.Box_Name); }}
                  onCreateNew={handleCreateBox}
                />
              </div>
            </div>
          )}

          {boxId && (
            <div>
              <label className="text-xs font-semibold text-gray-700">Quantity to place here</label>
              <Input 
                type="number" 
                min="1" 
                value={qty} 
                onChange={e => setQty(e.target.value)} 
                className={cn(
                  "h-9 mt-1",
                  qty && parseFloat(qty) > remaining && "border-red-500 text-red-600 focus-visible:ring-red-500"
                )} 
              />
              {qty && parseFloat(qty) > remaining && (
                <p className="text-[11px] text-red-600 mt-1 font-semibold">Max allowed: {remaining}</p>
              )}
            </div>
          )}

          <Button 
            type="button" 
            size="sm" 
            className="w-full" 
            disabled={!cupboardId || !boxId || !qty || parseFloat(qty) <= 0 || parseFloat(qty) > remaining} 
            onClick={addAllocation}
          >
            Add Location
          </Button>
          {value.length > 0 && (
            <button type="button" onClick={() => setOpen(false)} className="w-full text-center text-xs text-gray-500 hover:text-gray-700">Done</button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Caller must conditionally mount this (`{show && <InwardModal .../>}`) rather than always
// rendering with an `open` prop — every hook below polls the backend on mount, so mounting
// it unconditionally means it's still hammering the API even while "closed".
export function InwardModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { items: catalogItems, refresh: refreshCatalog } = useItemMaster();
  const { employees, refresh: refreshEmployees } = useEmployees();
  const { saveInwardBatch, refresh: refreshEntries } = useInventoryEntries();
  const { refresh: refreshPlacements } = useBoxesAndPlacements();
  const { invoices, refresh: refreshInvoices } = useInvoices();
  const { refresh: refreshCupboards } = useCupboards();
  const { toast } = useToast();

  const [step, setStep] = useState<'choose' | 'table'>('choose');
  const [mode, setMode] = useState<'with' | 'without'>('without');
  const [rows, setRows] = useState<Row[]>([blankRow()]);

  // Common fields — asked once for the whole submission, not per row.
  const [entryDate, setEntryDate] = useState(todayISO());
  const [employeeName, setEmployeeName] = useState(user?.name || '');
  const [isNewEmployee, setIsNewEmployee] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [grnNo, setGrnNo] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [dupInvoiceData, setDupInvoiceData] = useState<Invoice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedFile, setScannedFile] = useState<{ base64Data: string; mimeType: string; name: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (user?.name && !employeeName) {
      setEmployeeName(user.name);
    }
  }, [user, employeeName]);

  const hasUnsavedChanges = () => {
    // If the only change is the default employee name, we shouldn't block closing as "unsaved changes"
    const currentEmp = employeeName.trim();
    const defaultEmp = (user?.name || '').trim();
    if ((currentEmp !== defaultEmp && currentEmp) || invoiceNo.trim() || vendorName.trim() || grnNo.trim()) return true;
    if (rows.length > 1) return true;
    const r0 = rows[0];
    if (r0.itemName.trim() || r0.qty || r0.price || r0.remarks.trim() || r0.locations.length > 0) return true;
    return false;
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges()) {
      setShowConfirm(true);
    } else {
      close();
    }
  };

  const reset = () => {
    setStep('choose'); setMode('without'); setRows([blankRow()]);
    setEntryDate(todayISO()); setEmployeeName(user?.name || ''); setIsNewEmployee(false);
    setInvoiceNo(''); setVendorName(''); setGrnNo(''); setError('');
    setErrors({});
    setScannedFile(null);
  };

  const close = () => { reset(); onClose(); };

  const chooseMode = (m: 'with' | 'without') => { setMode(m); setStep('table'); };

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));
  };
  const addRow = () => setRows(prev => [...prev, blankRow()]);
  const removeRow = (key: string) => setRows(prev => prev.length > 1 ? prev.filter(r => r.key !== key) : prev);

  // Matches a pasted/typed name against the catalog, same resolution the "create new" click does.
  const resolveItemForName = (name: string, itemCode?: string): Partial<Row> => {
    if (itemCode) {
      const matchByCode = catalogItems.find(
        o => String(o.Item_Code || '').trim().toLowerCase() === String(itemCode).trim().toLowerCase()
      );
      if (matchByCode) {
        return {
          itemName: matchByCode.Item_Name, itemCode: matchByCode.Item_Code, hsnCode: matchByCode.HSN_Code || '',
          category: matchByCode.Category || '', unit: matchByCode.Unit || '', isNewItem: false,
        };
      }
    }
    const normalize = (str: string) => {
      return String(str || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' '); // collapse spaces
    };
    const normName = normalize(name);
    const matchByName = catalogItems.find(o => normalize(o.Item_Name) === normName);
    if (matchByName) {
      return {
        itemName: matchByName.Item_Name, itemCode: matchByName.Item_Code, hsnCode: matchByName.HSN_Code || '',
        category: matchByName.Category || '', unit: matchByName.Unit || '', isNewItem: false,
      };
    }
    return { itemName: name, itemCode: itemCode || '', isNewItem: true };
  };

  const convertDateToISO = (dStr: string): string => {
    if (!dStr) return todayISO();
    const m = /^(\d{2})-(\d{2})-(\d{4})/.exec(dStr);
    if (m) {
      const [, d, mo, y] = m;
      return `${y}-${mo}-${d}`;
    }
    const parsed = new Date(dStr);
    if (!isNaN(parsed.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
    }
    return todayISO();
  };

  const triggerOcr = async (base64Image: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await fetch('/api/extract-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        if (data.invoiceNo) setInvoiceNo(data.invoiceNo);
        if (data.vendorName) setVendorName(data.vendorName);
        if (data.date) setEntryDate(convertDateToISO(data.date));

        // Attempt to extract items
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          const newRows = data.items.map((item: any) => {
            const resolved = resolveItemForName(item.itemName || '', item.itemCode || '');
            return {
              ...blankRow(),
              ...resolved,
              qty: String(item.qty || ''),
              price: String(item.price || ''),
              gstRate: String(item.gstRate || '18'),
              discountPct: String(item.discountPct || '0'),
              remarks: item.remarks || '',
            };
          });
          setRows(newRows);
          toast({ title: 'Success', description: `Invoice scanned! Extracted headers and ${newRows.length} item rows.` });
        } else {
          setScanError('Could not read item details — please add items manually.');
          toast({ title: 'Success (Headers Only)', description: 'Invoice scanned! Extracted headers, but items must be entered manually.', variant: 'default' });
        }
      } else {
        setScanError(json.error || 'Failed to extract details automatically.');
        toast({ title: 'Extraction Failed', description: 'Failed to extract details. You can still fill the form manually.', variant: 'destructive' });
      }
    } catch (err: any) {
      setScanError('Connection error: ' + err.message);
      toast({ title: 'Connection Error', description: 'Failed to connect to extraction service.', variant: 'destructive' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setScannedFile({
        base64Data: reader.result as string,
        mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (validTypes.includes(file.type) || file.name.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = () => {
          setScannedFile({
            base64Data: reader.result as string,
            mimeType: file.type || 'application/pdf',
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      } else {
        toast({ title: 'Invalid File', description: 'Please upload a PDF or image file (.png, .jpg, .svg, .webp).', variant: 'destructive' });
      }
    }
  };

  // Excel-style block paste: field order matches the visual column order, so pasting into
  // Qty also fills Price/GST to its right, and pasting into Item Name fills the whole row.
  // Rows below the paste point are UPDATED in place if they already exist — only lines that
  // run past the end of the table create new rows.
  const FIELD_ORDER: (keyof Row)[] = ['itemName', 'qty', 'price', 'gstRate'];

  const applyPasteBlock = (rowKey: string, startCol: number, block: string[][]) => {
    setRows(prev => {
      const startIdx = prev.findIndex(r => r.key === rowKey);
      if (startIdx === -1) return prev;
      const next = [...prev];
      block.forEach((cols, i) => {
        const patch: Partial<Row> = {};
        cols.forEach((raw, j) => {
          const field = FIELD_ORDER[startCol + j];
          if (!field) return; // pasted more columns than we have fields for — ignore the rest
          const val = raw.trim();
          if (field === 'itemName') Object.assign(patch, resolveItemForName(val));
          else if (field === 'gstRate') patch.gstRate = val.replace('%', '');
          else (patch as any)[field] = val;
        });
        const targetIdx = startIdx + i;
        if (targetIdx < next.length) next[targetIdx] = { ...next[targetIdx], ...patch };
        else next.push({ ...blankRow(), ...patch });
      });
      return next;
    });
  };

  // Only intercept multi-cell paste (newlines and/or tabs); a single value pastes natively.
  const handleFieldPaste = (rowKey: string, startCol: number) => (e: React.ClipboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\n') && !text.includes('\t')) return;
    e.preventDefault();
    const block = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0).map(l => l.split('\t'));
    applyPasteBlock(rowKey, startCol, block);
  };

  const handleSubmit = async (bypassDuplicateCheck = false) => {
    setError('');
    const errs: Record<string, string> = {};
    if (!employeeName.trim()) errs.employeeName = 'Employee name is required.';
    if (mode === 'with') {
      if (!invoiceNo.trim()) errs.invoiceNo = 'Invoice No is required.';
      if (!vendorName.trim()) errs.vendorName = 'Vendor Name is required.';
    }
    
    // Check rows for empty itemName/qty
    rows.forEach((r) => {
      if (!r.itemName.trim()) errs[`itemName_${r.key}`] = 'Item Name is required.';
      if (!r.qty || parseFloat(r.qty) <= 0) errs[`qty_${r.key}`] = 'Quantity is required.';
    });

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setError('Please correct the highlighted fields before saving.');
      return;
    }

    if (rows.some(r => {
      const allocated = r.locations.reduce((s, l) => s + parseFloat(l.qty || '0'), 0);
      return allocated > parseFloat(r.qty || '0');
    })) { setError('A row has more quantity placed across locations than it received.'); return; }

    if (mode === 'with' && !bypassDuplicateCheck) {
      const existing = invoices.find(inv => 
        inv.Invoice_No.trim().toLowerCase() === invoiceNo.trim().toLowerCase() &&
        inv.Vendor_Name.trim().toLowerCase() === vendorName.trim().toLowerCase()
      );
      if (existing) {
        setDupInvoiceData(existing);
        return;
      }
    }

    setSaving(true);

    const dateTime = toDisplayDateTime(entryDate);
    let totalValue = 0;
    rows.forEach(r => {
      totalValue += lineTotal(r);
    });

    const payload = {
      employeeName: employeeName.trim(),
      isNewEmployee,
      dateTime,
      grnNo: mode === 'with' ? grnNo : '',
      invoice: mode === 'with' ? {
        invoiceNo: invoiceNo.trim(),
        vendorName: vendorName.trim(),
        date: toDisplayDateTime(entryDate).split(' ')[0],
        totalValue
      } : null,
      rows: rows.map(r => ({
        itemName: r.itemName,
        itemCode: r.itemCode,
        hsnCode: r.hsnCode,
        category: r.category,
        unit: r.unit,
        isNewItem: r.isNewItem,
        qty: r.qty,
        price: r.price,
        gstRate: r.gstRate,
        discountPct: r.discountPct,
        locations: r.locations.map(l => ({
          cupboardId: l.cupboardId,
          cupboardName: l.cupboardName,
          boxId: l.boxId,
          boxName: l.boxName,
          qty: l.qty
        })),
        remarks: r.remarks
      }))
    };

    const res = await saveInwardBatch(payload);

    if (res.success) {
      if (scannedFile) {
        try {
          const urlStr = process.env.NEXT_PUBLIC_SHEETS_API_URL;
          if (urlStr) {
            const uploadRes = await fetch(urlStr, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({
                action: 'uploadInvoiceFile',
                fileData: scannedFile.base64Data,
                mimeType: scannedFile.mimeType,
                invoiceNo: invoiceNo.trim(),
                vendorName: vendorName.trim(),
                date: toDisplayDateTime(entryDate).split(' ')[0],
                token: localStorage.getItem('sicca_token') || ''
              })
            });
            const uploadJson = await uploadRes.json();
            if (uploadJson && uploadJson.success) {
              toast({ title: 'Invoice Uploaded', description: 'Invoice file successfully stored.' });
            } else {
              toast({ 
                title: 'Upload Warning', 
                description: 'Inward saved, but invoice file upload failed: ' + (uploadJson?.error || 'Unknown error'), 
                variant: 'destructive' 
              });
            }
          }
        } catch (err: any) {
          console.error('Invoice upload failed:', err);
          toast({ 
            title: 'Upload Warning', 
            description: 'Inward saved, but invoice file upload failed (network/server error).', 
            variant: 'destructive' 
          });
        }
      }

      toast({ title: 'Success', description: `${rows.length} inward ${rows.length === 1 ? 'entry' : 'entries'} saved.` });
      
      // Refresh the changed data sources
      refreshEntries();
      refreshCatalog();
      refreshPlacements();
      refreshInvoices();
      refreshEmployees();
      refreshCupboards();

      setSaving(false);
      close();
    } else {
      setError(res.error || 'Failed to save batch inward submission.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40" onClick={handleCloseAttempt} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between p-5 border-b bg-green-50 border-green-100">
          <h2 className="text-lg font-bold text-green-800">Inward Entry</h2>
          <button onClick={handleCloseAttempt} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        {step === 'choose' ? (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => chooseMode('with')}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors">
              <FileText className="h-8 w-8 text-green-700" />
              <span className="font-semibold text-gray-900">With Invoice</span>
              <span className="text-xs text-gray-500 text-center">Records an Invoice No, vendor and total against this delivery.</span>
            </button>
            <button onClick={() => chooseMode('without')}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors">
              <FileX className="h-8 w-8 text-gray-600" />
              <span className="font-semibold text-gray-900">Without Invoice</span>
              <span className="text-xs text-gray-500 text-center">Quick stock-in with no invoice paperwork attached.</span>
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Common fields — asked once, apply to every row below */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Date</label>
                <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="h-9 mt-1" />
              </div>
              <div className="relative">
                <label className="text-xs font-semibold text-gray-700">Employee (received by)</label>
                <div className="mt-1">
                  <AutocompleteInput
                    value={employeeName}
                    onChangeText={v => {
                      setEmployeeName(v);
                      setIsNewEmployee(false);
                      if (errors.employeeName) setErrors(err => ({ ...err, employeeName: '' }));
                    }}
                    options={employees}
                    getLabel={o => o.Full_Name}
                    placeholder="Employee name"
                    newLabelPrefix="New"
                    onSelect={o => {
                      setEmployeeName(o.Full_Name);
                      setIsNewEmployee(false);
                      if (errors.employeeName) setErrors(err => ({ ...err, employeeName: '' }));
                    }}
                    onCreateNew={name => {
                      const match = employees.find(emp => safeStr(emp.Full_Name).trim().toLowerCase() === safeStr(name).trim().toLowerCase());
                      if (match) {
                        setEmployeeName(match.Full_Name);
                        setIsNewEmployee(false);
                      } else {
                        setEmployeeName(name);
                        setIsNewEmployee(true);
                      }
                      if (errors.employeeName) setErrors(err => ({ ...err, employeeName: '' }));
                    }}
                  />
                </div>
                {errors.employeeName && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.employeeName}</p>
                )}
                {isNewEmployee && <span className="text-[10px] text-amber-600 font-medium">* unverified — new employee record will be created</span>}
              </div>
              {mode === 'with' && (
                <>
                  {!scannedFile ? (
                    <div 
                      className={cn(
                        "col-span-full border-2 border-dashed rounded-xl p-6 text-center transition-colors relative flex flex-col items-center justify-center gap-3",
                        dragActive ? "border-purple-500 bg-purple-50/50" : "border-purple-200 bg-purple-50/10 hover:bg-purple-50/20"
                      )}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="p-3 rounded-full bg-purple-100 text-purple-700">
                        <Camera className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-gray-900">Auto-fill via Gemini OCR</h4>
                        <p className="text-xs text-gray-500 max-w-sm mt-1">
                          Drag & drop your invoice file here, or click to upload. Accepts PDF, PNG, JPG, SVG, WebP.
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-center mt-1">
                        <input 
                          type="file" 
                          accept=".pdf,image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" 
                          className="hidden" 
                          id="invoice-modal-file-picker" 
                          onChange={handleFileChange}
                        />
                        <label 
                          htmlFor="invoice-modal-file-picker"
                          className="px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          Choose File
                        </label>

                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          className="hidden" 
                          id="invoice-modal-camera-input" 
                          onChange={handleFileChange}
                        />
                        <label 
                          htmlFor="invoice-modal-camera-input" 
                          className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Camera className="h-3.5 w-3.5" /> Camera Scan
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-full border border-purple-100 bg-purple-50/20 rounded-xl p-4 flex flex-col gap-4 text-center">
                      <div className="text-left font-semibold text-xs text-purple-700 uppercase tracking-wider">
                        Invoice File Selected
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="w-16 h-16 rounded-lg border bg-white flex items-center justify-center overflow-hidden shrink-0">
                            {scannedFile.mimeType.startsWith('image/') ? (
                              <img src={scannedFile.base64Data} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="h-8 w-8 text-purple-700" />
                            )}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{scannedFile.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{scannedFile.mimeType}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setScannedFile(null)}
                            disabled={isScanning}
                            className="text-xs font-semibold border hover:bg-gray-100 rounded-lg h-9 w-full sm:w-auto"
                          >
                            Change File
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isScanning}
                            onClick={() => triggerOcr(scannedFile.base64Data)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center justify-center gap-1.5 font-sans w-full sm:w-auto"
                          >
                            {isScanning ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Extracting...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3.5 w-3.5" /> Extract Details
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {scanError && (
                    <div className="col-span-full bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-3 text-xs text-left">
                      <p className="font-bold">⚠️ OCR Notice</p>
                      <p className="text-[11px] text-amber-700/80 leading-normal mt-0.5">{scanError}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-700">Invoice No <span className="text-red-500">*</span></label>
                    <Input 
                      value={invoiceNo} 
                      onChange={e => {
                        setInvoiceNo(e.target.value);
                        if (errors.invoiceNo) setErrors(err => ({ ...err, invoiceNo: '' }));
                      }} 
                      className={cn(
                        "h-9 mt-1",
                        errors.invoiceNo && "border-red-500 text-red-600 focus-visible:ring-red-500"
                      )} 
                    />
                    {errors.invoiceNo && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.invoiceNo}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Vendor Name <span className="text-red-500">*</span></label>
                    <Input 
                      value={vendorName} 
                      onChange={e => {
                        setVendorName(e.target.value);
                        if (errors.vendorName) setErrors(err => ({ ...err, vendorName: '' }));
                      }} 
                      className={cn(
                        "h-9 mt-1",
                        errors.vendorName && "border-red-500 text-red-600 focus-visible:ring-red-500"
                      )} 
                    />
                    {errors.vendorName && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.vendorName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">GRN No</label>
                    <Input value={grnNo} onChange={e => setGrnNo(e.target.value)} className="h-9 mt-1" />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={row.key} className="border border-gray-200 rounded-xl p-3 relative">
                  <span className="absolute -left-2 -top-2 h-6 w-6 flex items-center justify-center rounded-full bg-gray-700 text-white text-xs font-bold">
                    {idx + 1}
                  </span>
                  {rows.length > 1 && (
                    <button onClick={() => removeRow(row.key)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-12 gap-3 items-start pr-6 pl-2">
                    <div className="col-span-full md:col-span-4">
                      <label className="text-[11px] font-semibold text-gray-500">Item Name *</label>
                      <AutocompleteInput
                        value={row.itemName}
                        onChangeText={v => {
                          updateRow(row.key, { itemName: v, itemCode: '', isNewItem: false });
                          if (errors[`itemName_${row.key}`]) setErrors(err => ({ ...err, [`itemName_${row.key}`]: '' }));
                        }}
                        options={catalogItems}
                        getLabel={o => o.Item_Name}
                        placeholder="e.g. Digital Multimeter (paste a column to bulk-add rows)"
                        newLabelPrefix="Create new item"
                        onSelect={o => {
                          updateRow(row.key, {
                            itemName: o.Item_Name, itemCode: o.Item_Code, hsnCode: o.HSN_Code || '',
                            category: o.Category || '', unit: o.Unit || '', isNewItem: false,
                          });
                          if (errors[`itemName_${row.key}`]) setErrors(err => ({ ...err, [`itemName_${row.key}`]: '' }));
                        }}
                        onCreateNew={name => {
                          updateRow(row.key, { itemName: name, itemCode: '', isNewItem: true });
                          if (errors[`itemName_${row.key}`]) setErrors(err => ({ ...err, [`itemName_${row.key}`]: '' }));
                        }}
                        onPasteCapture={handleFieldPaste(row.key, 0)}
                      />
                      {errors[`itemName_${row.key}`] && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors[`itemName_${row.key}`]}</p>
                      )}
                      {row.isNewItem && <span className="text-[10px] text-blue-600 font-medium">New item — will be catalogued</span>}
                    </div>

                    <div className="col-span-6 md:col-span-1">
                      <label className="text-[11px] font-semibold text-gray-500">Qty *</label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={row.qty} 
                        onChange={e => {
                          updateRow(row.key, { qty: e.target.value });
                          if (errors[`qty_${row.key}`]) setErrors(err => ({ ...err, [`qty_${row.key}`]: '' }));
                        }}
                        onPaste={handleFieldPaste(row.key, 1)} 
                        className={cn(
                          "h-9",
                          errors[`qty_${row.key}`] && "border-red-500 text-red-600 focus-visible:ring-red-500"
                        )} 
                      />
                      {errors[`qty_${row.key}`] && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors[`qty_${row.key}`]}</p>
                      )}
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="text-[11px] font-semibold text-gray-500">Price ₹</label>
                      <Input type="number" min="0" value={row.price} onChange={e => updateRow(row.key, { price: e.target.value })}
                        onPaste={handleFieldPaste(row.key, 2)} className="h-9" />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <label className="text-[11px] font-semibold text-gray-500">GST %</label>
                      <select value={row.gstRate} onChange={e => updateRow(row.key, { gstRate: e.target.value })}
                        onPaste={handleFieldPaste(row.key, 3)}
                        className="w-full h-9 px-2 rounded-md border border-gray-300 text-sm bg-white">
                        {[0, 5, 12, 18, 28].map(r => <option key={r} value={String(r)}>{r}%</option>)}
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="text-[11px] font-semibold text-gray-500">Line Total</label>
                      <div className="h-9 flex items-center text-sm font-semibold text-gray-700">₹{lineTotal(row).toFixed(2)}</div>
                    </div>
                    <div className="col-span-full md:col-span-2">
                      <label className="text-[11px] font-semibold text-gray-500">Storage Location(s)</label>
                      <div className="mt-1">
                        <LocationPicker rowQty={parseFloat(row.qty || '0')} value={row.locations}
                          onChange={locs => updateRow(row.key, { locations: locs })} />
                      </div>
                    </div>
                  </div>

                  {row.isNewItem && (
                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-dashed">
                      <Input placeholder="HSN Code" value={row.hsnCode} onChange={e => updateRow(row.key, { hsnCode: e.target.value })} className="h-8 text-xs" />
                      <Input placeholder="Category" value={row.category} onChange={e => updateRow(row.key, { category: e.target.value })} className="h-8 text-xs" />
                      <Input placeholder="Unit (pcs)" value={row.unit} onChange={e => updateRow(row.key, { unit: e.target.value })} className="h-8 text-xs" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addRow} className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800">
              <Plus className="h-4 w-4" /> Add Row
            </button>
            <p className="text-[11px] text-gray-400">Tip: paste a column (Item Name, Qty, Price, or GST%) or a whole block copied from Excel — it fills down starting from that cell, reusing existing rows below before adding new ones.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-medium">⚠ {error}</div>
            )}
          </div>
        )}

        {step === 'table' && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-2xl w-full">
            <button onClick={() => setStep('choose')} className="text-sm text-gray-600 hover:text-gray-800 w-full sm:w-auto text-center sm:text-left py-2 sm:py-0">← Back</button>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={handleCloseAttempt} className="flex-1 sm:flex-none px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200">Cancel</button>
              <button onClick={() => handleSubmit()} disabled={saving}
                className="flex-1 sm:flex-none px-6 py-2 text-sm font-semibold text-white rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60">
                {saving ? '⏳ Saving…' : `Save ${rows.length} ${rows.length === 1 ? 'Entry' : 'Entries'}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900">Unsaved Changes</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              You have unsaved changes — {rows.length} {rows.length === 1 ? 'entry' : 'entries'} will not be saved. Discard and close?
            </p>
            <div className="flex gap-3 mt-5">
              <Button 
                variant="ghost" 
                onClick={() => setShowConfirm(false)} 
                className="flex-1 text-xs font-semibold h-9 rounded-xl border border-gray-200"
              >
                Keep Editing
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowConfirm(false);
                  close();
                }} 
                className="flex-1 text-xs font-semibold h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}

      {dupInvoiceData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDupInvoiceData(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-amber-600 flex items-center gap-2">⚠️ Duplicate Invoice</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              This invoice number already exists for <strong>{dupInvoiceData.Vendor_Name}</strong> — submitted on <strong>{dupInvoiceData.Date}</strong>. Continue anyway or cancel?
            </p>
            <div className="flex gap-3 mt-5">
              <Button 
                variant="ghost" 
                onClick={() => setDupInvoiceData(null)} 
                className="flex-1 text-xs font-semibold h-9 rounded-xl border border-gray-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setDupInvoiceData(null);
                  handleSubmit(true);
                }} 
                className="flex-1 text-xs font-semibold h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                Continue anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
