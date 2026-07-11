"use client";

import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUpFromLine, Minus, Plus, Search, Trash2, X } from 'lucide-react';
import {
  useItemMaster, useBoxesAndPlacements, useCupboards, useInventoryEntries,
} from '@/hooks/use-inventory-data';
import { useToast } from '@/hooks/use-toast';
import { cn, safeStr } from '@/lib/utils';

type CartLine = {
  placementId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  locationLabel: string; // e.g. "C-01" or "D-05/Tray 1"
  maxQty: number;
  qty: number;
};

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

function QtyStepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(1, Math.min(v, max));
  return (
    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={() => onChange(clamp(value - 1))}
        className="h-7 w-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
        disabled={value <= 1}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number" value={value} min={1} max={max}
        onChange={e => onChange(clamp(parseInt(e.target.value, 10) || 1))}
        className="h-7 w-14 text-center text-sm font-bold border border-gray-300 rounded-lg"
      />
      <button type="button" onClick={() => onChange(clamp(value + 1))}
        className="h-7 w-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
        disabled={value >= max}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function OutwardPicker({ onClose }: { onClose: () => void }) {
  const { items: catalogItems } = useItemMaster();
  const { placements, boxes, reducePlacementQty } = useBoxesAndPlacements();
  const { cupboards } = useCupboards();
  const { addEntry } = useInventoryEntries();
  const { toast } = useToast();

  // Common fields — asked once for the whole transaction.
  const [entryDate, setEntryDate] = useState(todayISO());
  const [employeeName, setEmployeeName] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [search, setSearch] = useState('');
  const [pickedItemCode, setPickedItemCode] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const locationLabelFor = (cupboardId: string, boxId: string) => {
    const cup = cupboards.find(c => c.Cupboard_ID === cupboardId);
    const box = boxes.find(b => b.Box_ID === boxId);
    if (!cup) return 'Unknown';
    return box ? `${cup.Cupboard_Number}/${box.Box_Name}` : cup.Cupboard_Number;
  };

  // Only items that actually have stock sitting in a location can be picked for Outward.
  const itemsWithPlacements = useMemo(() => {
    const codesWithStock = new Set(
      placements.filter(p => parseFloat(p.Quantity || '0') > 0).map(p => p.Item_Code)
    );
    return catalogItems.filter(i => i.Status !== 'Deleted' && codesWithStock.has(i.Item_Code));
  }, [catalogItems, placements]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return itemsWithPlacements;
    return itemsWithPlacements.filter(i =>
      safeStr(i.Item_Name).toLowerCase().includes(q) || safeStr(i.Item_Code).toLowerCase().includes(q)
    );
  }, [itemsWithPlacements, search]);

  const pickedItem = pickedItemCode ? catalogItems.find(i => i.Item_Code === pickedItemCode) || null : null;

  const pickedItemPlacements = useMemo(() => {
    if (!pickedItemCode) return [];
    return placements.filter(p => p.Item_Code === pickedItemCode && parseFloat(p.Quantity || '0') > 0);
  }, [placements, pickedItemCode]);

  const cartTotalQty = cart.reduce((sum, c) => sum + c.qty, 0);

  const toggleLocation = (placementId: string, maxQty: number) => {
    setCart(prev => {
      const exists = prev.find(c => c.placementId === placementId);
      if (exists) return prev.filter(c => c.placementId !== placementId);
      if (!pickedItem) return prev;
      const p = placements.find(pl => pl.Placement_ID === placementId);
      if (!p) return prev;
      return [...prev, {
        placementId,
        itemCode: pickedItem.Item_Code,
        itemName: pickedItem.Item_Name,
        unit: pickedItem.Unit || 'pcs',
        locationLabel: locationLabelFor(p.Cupboard_ID, p.Box_ID),
        maxQty,
        qty: 1,
      }];
    });
  };

  const updateCartQty = (placementId: string, qty: number) => {
    setCart(prev => prev.map(c => c.placementId === placementId ? { ...c, qty } : c));
  };

  const removeCartLine = (placementId: string) => {
    setCart(prev => prev.filter(c => c.placementId !== placementId));
  };

  const handleClose = () => {
    if (cart.length > 0 && !window.confirm('Discard the selected outward items?')) return;
    onClose();
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!issuedTo.trim()) errs.issuedTo = 'Issued To is required.';
    if (cart.length === 0) errs.cart = 'Select at least one item location to take stock from.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const byItem = new Map<string, CartLine[]>();
      cart.forEach(line => {
        if (!byItem.has(line.itemCode)) byItem.set(line.itemCode, []);
        byItem.get(line.itemCode)!.push(line);
      });

      const dateTime = toDisplayDateTime(entryDate);
      for (const [itemCode, lines] of byItem) {
        const totalQty = lines.reduce((sum, l) => sum + l.qty, 0);
        const locationLabel = lines.map(l => `${l.locationLabel} (${l.qty})`).join('; ');
        const entryRes = await addEntry({
          transactionType: 'Outward',
          itemName: lines[0].itemName,
          itemCode,
          location: locationLabel,
          outwardQty: String(totalQty),
          issuedTo,
          receivedBy: employeeName,
          dateTime,
          remarks,
        });
        if (!entryRes || !entryRes.success) {
          throw new Error(`Failed to save outward entry for ${lines[0].itemName}`);
        }
        for (const line of lines) {
          await reducePlacementQty(line.placementId, line.qty);
        }
      }

      toast({ title: 'Success', description: `Outward recorded for ${byItem.size} item(s), ${cartTotalQty} unit(s) total.` });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to process outward entry.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col z-10">
        <div className="flex items-center justify-between p-5 border-b bg-amber-50 border-amber-100 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-bold text-amber-800">Outward Entry</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        {/* Common fields — asked once for the whole transaction */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 border-b border-gray-200 p-4 shrink-0">
          <div>
            <label className="text-xs font-semibold text-gray-700">Date</label>
            <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="h-9 mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Handled By (Employee)</label>
            <Input value={employeeName} onChange={e => setEmployeeName(e.target.value)}
              placeholder="Employee name" className="h-9 mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Issued To <span className="text-red-500">*</span></label>
            <Input
              value={issuedTo}
              onChange={e => { setIssuedTo(e.target.value); if (errors.issuedTo) setErrors(err => ({ ...err, issuedTo: '' })); }}
              placeholder="Employee / Department"
              className={cn("h-9 mt-1", errors.issuedTo && "border-red-500 text-red-600 focus-visible:ring-red-500")}
            />
            {errors.issuedTo && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.issuedTo}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Remarks</label>
            <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes" className="h-9 mt-1" />
          </div>
        </div>

        {/* Browser + cart */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left — item search / location browser */}
          <div className="flex-1 min-w-0 p-4 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-100">
            {!pickedItem ? (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search a placed item…" className="pl-9 h-9" autoFocus />
                </div>
                <div className="space-y-1.5">
                  {filteredItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">No placed items match your search.</p>
                  ) : filteredItems.map(item => {
                    const totalPlaced = placements
                      .filter(p => p.Item_Code === item.Item_Code)
                      .reduce((sum, p) => sum + parseFloat(p.Quantity || '0'), 0);
                    return (
                      <button key={item.Item_Code} type="button"
                        onClick={() => setPickedItemCode(item.Item_Code)}
                        className="w-full flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm text-left transition-all"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{item.Item_Name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.Item_Code}</p>
                        </div>
                        <span className="text-xs font-bold text-amber-700 shrink-0">{totalPlaced} {item.Unit || 'pcs'} placed</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <button type="button" onClick={() => setPickedItemCode(null)}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to items
                  </button>
                </div>
                <div className="mb-3">
                  <p className="font-bold text-gray-900">{pickedItem.Item_Name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{pickedItem.Item_Code}</p>
                </div>
                <div className="space-y-2">
                  {pickedItemPlacements.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">No stock currently placed for this item.</p>
                  ) : pickedItemPlacements.map(p => {
                    const maxQty = parseFloat(p.Quantity || '0');
                    const cartLine = cart.find(c => c.placementId === p.Placement_ID);
                    const checked = !!cartLine;
                    return (
                      <div key={p.Placement_ID}
                        onClick={() => toggleLocation(p.Placement_ID, maxQty)}
                        className={cn(
                          'flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                          checked ? 'border-amber-400 bg-amber-50/60' : 'border-gray-200 bg-white hover:border-amber-200'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input type="checkbox" checked={checked} readOnly className="h-4 w-4 accent-amber-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-mono font-semibold text-sm text-gray-900">{locationLabelFor(p.Cupboard_ID, p.Box_ID)}</p>
                            <p className="text-xs text-muted-foreground">{maxQty} {pickedItem.Unit || 'pcs'} available</p>
                          </div>
                        </div>
                        {checked && cartLine && (
                          <QtyStepper value={cartLine.qty} max={maxQty} onChange={v => updateCartQty(p.Placement_ID, v)} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right — running cart */}
          <div className="w-full md:w-72 shrink-0 p-4 overflow-y-auto bg-gray-50/50 flex flex-col">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Outward Cart</p>
            {errors.cart && <p className="text-[11px] text-red-600 mb-2 font-semibold">{errors.cart}</p>}
            {cart.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">No items selected yet. Pick an item and check a location to add it here.</p>
            ) : (
              <div className="space-y-2 flex-1">
                {cart.map(line => (
                  <div key={line.placementId} className="bg-white rounded-xl border border-gray-200 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-gray-900 truncate">{line.itemName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{line.locationLabel}</p>
                      </div>
                      <button type="button" onClick={() => removeCartLine(line.placementId)}
                        className="text-gray-300 hover:text-red-500 shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-amber-700 mt-1">{line.qty} {line.unit}</p>
                  </div>
                ))}
              </div>
            )}
            {cart.length > 0 && (
              <div className="pt-3 mt-3 border-t border-gray-200 text-xs font-semibold text-gray-700 flex justify-between">
                <span>Total units</span><span>{cartTotalQty}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-2xl shrink-0">
          <button onClick={handleClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-60 bg-amber-600 hover:bg-amber-700">
            {submitting ? '⏳ Saving…' : `Save Outward Entry (${cartTotalQty})`}
          </button>
        </div>
      </div>
    </div>
  );
}
