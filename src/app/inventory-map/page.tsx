"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Plus, MapPin, RefreshCw, X, Search,
  ChevronRight, Box, Pencil, Trash2, ImageIcon, PackageOpen, ArrowLeft,
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight
} from 'lucide-react';
import { useCupboards, useItemMaster, useInventoryEntries, useBoxesAndPlacements } from '@/hooks/use-inventory-data';
import { useToast } from '@/hooks/use-toast';
import { cn, safeStr, getSimilarity } from '@/lib/utils';
import { InfoPopup } from '@/components/shared/info-popup';
import { ItemTooltip } from '@/components/shared/item-tooltip';
import { InventoryTrendGraph } from '@/components/shared/inventory-trend-graph';
import { LocationPicker } from '@/components/shared/location-picker';
import { flashClick } from '@/lib/click-flash';

type Cupboard = {
  Cupboard_ID: string; Cupboard_Number: string; Name: string;
  Location: string; Description: string; Image_URL: string; Color: string;
  Status: string; Type?: string;
  _itemCount?: number; _totalQty?: number; _lowStock?: number;
};

const COLORS = [
  '#1B3A6B','#E87722','#16A34A','#DC2626',
  '#7C3AED','#0891B2','#D97706','#6B7280',
  '#BE185D','#0F766E',
];

const CONTAINER_TYPES = ['Cupboard', 'Drawer', 'Custom'];

export default function InventoryMapPage() {
  const router = useRouter();
  const { cupboards, addCupboard, updateCupboard, deleteCupboard: deleteCupboardHook, loading: loadingCupboards } = useCupboards();
  const { items: catalogItems, loading: loadingItems } = useItemMaster();
  const { entries, loading: loadingEntries } = useInventoryEntries();
  const { boxes, placements, getBoxesForCupboard, addBox, addPlacement, removePlacement, deleteBox: deleteBoxHook, loading: loadingPlacements } = useBoxesAndPlacements();
  const { toast } = useToast();

  const isDataLoading = (loadingCupboards && cupboards.length === 0) || (loadingPlacements && placements.length === 0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Container detail panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeCup, setActiveCup] = useState<Cupboard | null>(null);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null); // null = viewing the boxes grid

  // Add/Edit Container modal
  const [showCupModal, setShowCupModal] = useState(false);
  const [editingCup, setEditingCup] = useState<Cupboard | null>(null);
  const [cupForm, setCupForm] = useState({ type: 'Cupboard', customType: '', number: '', name: '', location: '', description: '', color: '#1B3A6B', imageUrl: '' });
  const [savingCup, setSavingCup] = useState(false);

  // Add Box modal
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [boxNameInput, setBoxNameInput] = useState('');
  const [savingBox, setSavingBox] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCupFormDirty = () => {
    if (editingCup) {
      return cupForm.number !== editingCup.Cupboard_Number ||
        cupForm.name !== editingCup.Name ||
        cupForm.location !== (editingCup.Location || '') ||
        cupForm.description !== (editingCup.Description || '') ||
        cupForm.imageUrl !== (editingCup.Image_URL || '') ||
        cupForm.color !== (editingCup.Color || '#1B3A6B');
    }
    return cupForm.number !== '' || cupForm.name !== '' || cupForm.location !== '' || cupForm.description !== '' || cupForm.imageUrl !== '';
  };

  const isBoxFormDirty = () => boxNameInput !== '';

  const isItemFormDirty = () => itemSearch !== '' || pickedItemCode !== '' || placeQty !== '' || modalCupboardId !== '' || (itemModalBoxId !== null && itemModalBoxId !== '');

  // Add Item (placement) modal — boxId is preset when opened from inside a box.
  // modalCupboardId is only used when opened without an activeCup context (e.g. the
  // "Place" quick-action from the Unassigned Items panel), so the flow can cascade
  // Container → Box instead of requiring you to open a container tile first.
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemModalBoxId, setItemModalBoxId] = useState<string | null>(null);
  const [modalCupboardId, setModalCupboardId] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [pickedItemCode, setPickedItemCode] = useState('');
  const [placeQty, setPlaceQty] = useState('');
  const [savingPlacement, setSavingPlacement] = useState(false);

  const [lightbox, setLightbox] = useState<{ url: string; caption: string } | null>(null);
  const [popupState, setPopupState] = useState<{ type: 'item' | 'employee' | 'cupboard' | 'box' | 'vendor' | 'invoice'; id: string } | null>(null);

  type AllocationRow = {
    key: string;
    cupboardId: string;
    boxId: string;
    qty: string;
  };

  const [allocations, setAllocations] = useState<AllocationRow[]>([
    { key: '0', cupboardId: '', boxId: '', qty: '' }
  ]);
  const [editingPlacementQty, setEditingPlacementQty] = useState<Record<string, string>>({});
  const [creatingForAllocationKey, setCreatingForAllocationKey] = useState<string | null>(null);
  const [creatingBoxForAllocationKey, setCreatingBoxForAllocationKey] = useState<string | null>(null);

  // ── Stock movement summary (all-time, from Stock_Register) ──────────────
  const [movementFilter, setMovementFilter] = useState<'all' | 'inward' | 'outward'>('all');
  const movementTotals = useMemo(() => {
    let totalIn = 0, totalOut = 0;
    entries.forEach(e => {
      totalIn += parseFloat(e.Inward_Qty || '0');
      totalOut += parseFloat(e.Outward_Qty || '0');
    });
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [entries]);

  // ── Balance / placed / unassigned per item ──────────────────────────────
  const balanceByCode = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => {
      const code = e.Item_Code || e.Item_Name;
      if (!code) return;
      map[code] = (map[code] || 0) + parseFloat(e.Inward_Qty || '0') - parseFloat(e.Outward_Qty || '0');
    });
    return map;
  }, [entries]);

  const placedByCode = useMemo(() => {
    const map: Record<string, number> = {};
    placements.forEach(p => {
      if (!p.Item_Code) return;
      map[p.Item_Code] = (map[p.Item_Code] || 0) + parseFloat(p.Quantity || '0');
    });
    return map;
  }, [placements]);

  // Items still needing a home — fully unassigned, or with leftover balance beyond what's placed.
  const unassignedItems = useMemo(() => {
    return catalogItems
      .filter(i => i.Status !== 'Deleted')
      .map(i => {
        const balance = balanceByCode[i.Item_Code] || 0;
        const placed = placedByCode[i.Item_Code] || 0;
        return { ...i, _balance: balance, _placed: placed, _unassigned: Math.max(balance - placed, 0) };
      })
      .filter(i => i._unassigned > 0);
  }, [catalogItems, balanceByCode, placedByCode]);

  const lastInitRef = useRef<string | null>(null);

  useEffect(() => {
    if (!showItemModal) {
      lastInitRef.current = null;
      return;
    }
    if (pickedItemCode && lastInitRef.current !== pickedItemCode) {
      lastInitRef.current = pickedItemCode;
      const match = unassignedItems.find(i => i.Item_Code === pickedItemCode);
      const remainingQty = match ? String(match._unassigned) : '';
      setPlaceQty(remainingQty);
      setAllocations([
        { 
          key: String(Date.now()), 
          cupboardId: activeCup?.Cupboard_ID || '', 
          boxId: activeBoxId || '', 
          qty: remainingQty 
        }
      ]);
    }
  }, [pickedItemCode, activeCup, activeBoxId, showItemModal, unassignedItems]);

  const filtered = cupboards.filter(c =>
    !search ||
    safeStr(c.Name).toLowerCase().includes(safeStr(search).toLowerCase()) ||
    safeStr(c.Cupboard_Number).toLowerCase().includes(safeStr(search).toLowerCase()) ||
    safeStr(c.Location).toLowerCase().includes(safeStr(search).toLowerCase())
  );

  const boxesInActiveCup = activeCup ? getBoxesForCupboard(activeCup.Cupboard_ID).map(b => {
    const boxPlacements = placements.filter(p => p.Box_ID === b.Box_ID && parseFloat(p.Quantity || '0') > 0);
    return { ...b, _itemCount: boxPlacements.length, _totalQty: boxPlacements.reduce((s, p) => s + parseFloat(p.Quantity || '0'), 0) };
  }) : [];

  const activeBox = boxesInActiveCup.find(b => b.Box_ID === activeBoxId) || null;
  const itemsInActiveBox = activeBoxId
    ? placements.filter(p => p.Box_ID === activeBoxId && parseFloat(p.Quantity || '0') > 0).map(p => {
        const item = catalogItems.find(i => i.Item_Code === p.Item_Code);
        return { ...p, _itemName: item?.Item_Name || p.Item_Code, _unit: item?.Unit || 'pcs', _itemId: item?.Item_ID };
      })
    : [];

  // ── Container CRUD ───────────────────────────────────────────────────────

  const openAddCupboard = () => {
    setEditingCup(null);
    setCupForm({ type: 'Cupboard', customType: '', number: '', name: '', location: '', description: '', color: '#1B3A6B', imageUrl: '' });
    setErrors({});
    setShowCupModal(true);
  };

  const openEditCupboard = (cup: Cupboard, e: React.MouseEvent) => {
    e.stopPropagation();
    const isKnownType = CONTAINER_TYPES.slice(0, 2).includes(cup.Type || 'Cupboard');
    setEditingCup(cup);
    setCupForm({
      type: isKnownType ? (cup.Type || 'Cupboard') : 'Custom',
      customType: isKnownType ? '' : (cup.Type || ''),
      number: cup.Cupboard_Number, name: cup.Name, location: cup.Location,
      description: cup.Description, color: cup.Color || '#1B3A6B', imageUrl: cup.Image_URL || ''
    });
    setErrors({});
    setShowCupModal(true);
  };

  const saveCupboard = async () => {
    const errs: Record<string, string> = {};
    if (!cupForm.number.trim()) errs.cupNumber = 'Container number is required.';
    if (!cupForm.name.trim()) errs.cupName = 'Container name is required.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const resolvedType = cupForm.type === 'Custom' ? (cupForm.customType.trim() || 'Custom') : cupForm.type;
    setSavingCup(true);
    try {
      const res = editingCup 
        ? await updateCupboard(editingCup.Cupboard_ID, { ...cupForm, type: resolvedType })
        : await addCupboard({ ...cupForm, type: resolvedType });

      if (res && res.success) {
        if (!editingCup && creatingForAllocationKey && 'cupboardId' in res) {
          setAllocations(prev => prev.map(r => r.key === creatingForAllocationKey ? { ...r, cupboardId: (res as any).cupboardId, boxId: '' } : r));
          setCreatingForAllocationKey(null);
        }
        setShowCupModal(false);
      }
    } finally {
      setSavingCup(false);
    }
  };

  const deleteCupboard = async (cup: Cupboard, e: React.MouseEvent) => {
    e.stopPropagation();
    const affectedPlacements = placements.filter(p => p.Cupboard_ID === cup.Cupboard_ID && parseFloat(p.Quantity || '0') > 0);
    const count = affectedPlacements.length;
    const msg = `This will remove ${count} item${count !== 1 ? 's' : ''} placed in this location. Continue?`;
    if (!window.confirm(msg)) return;
    await deleteCupboardHook(cup.Cupboard_ID);
    if (activeCup?.Cupboard_ID === cup.Cupboard_ID) setPanelOpen(false);
  };

  const deleteBox = async (boxId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const box = boxes.find(b => b.Box_ID === boxId);
    if (!box) return;
    const affectedPlacements = placements.filter(p => p.Box_ID === boxId && parseFloat(p.Quantity || '0') > 0);
    const count = affectedPlacements.length;
    const msg = `This will remove ${count} item${count !== 1 ? 's' : ''} placed in this location. Continue?`;
    if (!window.confirm(msg)) return;
    await deleteBoxHook(boxId);
    if (activeBoxId === boxId) setActiveBoxId(null);
  };

  const confirmRemovePlacement = async (p: any) => {
    const msg = `This will remove 1 item placed in this location. Continue?`;
    if (!window.confirm(msg)) return;
    await removePlacement(p.Placement_ID);
  };

  const openPanel = (cup: Cupboard) => {
    setActiveCup(cup);
    setActiveBoxId(null);
    setPanelOpen(true);
  };

  // ── Box CRUD ─────────────────────────────────────────────────────────────

  const saveBox = async () => {
    let targetCupId = '';
    if (creatingBoxForAllocationKey) {
      const row = allocations.find(r => r.key === creatingBoxForAllocationKey);
      if (row) targetCupId = row.cupboardId;
    } else if (activeCup) {
      targetCupId = activeCup.Cupboard_ID;
    }
    if (!targetCupId) {
      toast({ title: 'Error', description: 'No container selected for the box.', variant: 'destructive' });
      return;
    }
    const errs: Record<string, string> = {};
    if (!boxNameInput.trim()) errs.boxName = 'Box name is required.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSavingBox(true);
    const res = await addBox(targetCupId, boxNameInput.trim());
    setSavingBox(false);
    if (res.success) {
      setBoxNameInput('');
      setShowBoxModal(false);
      if (creatingBoxForAllocationKey) {
        setAllocations(prev => prev.map(r => r.key === creatingBoxForAllocationKey ? { ...r, boxId: (res as any).box.Box_ID } : r));
        setCreatingBoxForAllocationKey(null);
      }
    }
  };

  // ── Add Item (placement) ────────────────────────────────────────────────

  const openAddItem = (boxId: string | null) => {
    setIsRelocateMode(false);
    setItemModalBoxId(boxId);
    setModalCupboardId(activeCup?.Cupboard_ID || '');
    setItemSearch(''); setPickedItemCode(''); setPlaceQty('');
    setAllocations([
      { 
        key: String(Date.now()), 
        cupboardId: activeCup?.Cupboard_ID || '', 
        boxId: boxId || '', 
        qty: '' 
      }
    ]);
    setEditingPlacementQty({});
    setErrors({});
    setShowItemModal(true);
  };

  const [isRelocateMode, setIsRelocateMode] = useState(false);

  const openRelocateItem = (itemCode: string) => {
    const item = catalogItems.find(i => i.Item_Code === itemCode);
    if (!item) return;
    setIsRelocateMode(true);
    setPickedItemCode(itemCode);
    setItemSearch(item.Item_Name);
    
    // Find all active placements of this item
    const itemPlacements = placements.filter(p => p.Item_Code === itemCode && parseFloat(p.Quantity || '0') > 0);
    const totalQty = itemPlacements.reduce((sum, p) => sum + parseFloat(p.Quantity || '0'), 0);
    setPlaceQty(String(totalQty));
    
    setAllocations(
      itemPlacements.map((p, idx) => ({
        key: p.Placement_ID || String(idx),
        cupboardId: p.Cupboard_ID,
        boxId: p.Box_ID,
        qty: p.Quantity
      }))
    );
    
    setEditingPlacementQty({});
    setErrors({});
    setShowItemModal(true);
  };

  // Which container this placement targets — the open container, or (from the Unassigned
  // panel, opened with no container context) whichever one the user picks in the modal.
  const effectiveCupboardId = activeCup?.Cupboard_ID || modalCupboardId;
  const boxesForModal = effectiveCupboardId ? getBoxesForCupboard(effectiveCupboardId) : [];

  const pickedItem = useMemo(() => {
    if (!pickedItemCode) return null;
    const item = catalogItems.find(i => i.Item_Code === pickedItemCode);
    if (!item) return null;
    const balance = balanceByCode[item.Item_Code] || 0;
    const placed = placedByCode[item.Item_Code] || 0;
    const unassigned = Math.max(balance - placed, 0);
    return { ...item, _balance: balance, _placed: placed, _unassigned: unassigned };
  }, [pickedItemCode, catalogItems, balanceByCode, placedByCode]);

  const totalCurrentlyPlaced = useMemo(() => {
    if (!pickedItemCode) return 0;
    return placements
      .filter(p => p.Item_Code === pickedItemCode)
      .reduce((sum, p) => sum + parseFloat(p.Quantity || '0'), 0);
  }, [placements, pickedItemCode]);

  const maxAvailableToPlace = useMemo(() => {
    if (!pickedItemCode || !pickedItem) return 0;
    const balance = balanceByCode[pickedItemCode] || 0;
    const placed = placedByCode[pickedItemCode] || 0;
    const unassigned = Math.max(balance - placed, 0);
    return isRelocateMode ? totalCurrentlyPlaced : unassigned;
  }, [isRelocateMode, pickedItemCode, pickedItem, totalCurrentlyPlaced, balanceByCode, placedByCode]);

  const isQtyExceeded = parseFloat(placeQty || '0') > maxAvailableToPlace;

  const itemMatches = itemSearch.trim()
    ? unassignedItems.filter(i => safeStr(i.Item_Name).toLowerCase().includes(safeStr(itemSearch).toLowerCase())).slice(0, 8)
    : unassignedItems.slice(0, 8);

  const suggestedLocations = useMemo(() => {
    if (!pickedItemCode || !pickedItem) return [];
    
    // 1. Get similar item codes based on Category and name similarity
    const similarItemsMap = new Map<string, { unit: string }>();
    catalogItems
      .filter(i => i.Item_Code !== pickedItemCode && i.Status !== 'Deleted')
      .map(i => {
        let score = 0;
        if (pickedItem.Category && i.Category && safeStr(i.Category).toLowerCase() === safeStr(pickedItem.Category).toLowerCase()) {
          score += 0.5;
        }
        const similarity = getSimilarity(i.Item_Name, pickedItem.Item_Name);
        score += similarity;
        return { item: i, score };
      })
      .filter(x => x.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .forEach(x => {
        similarItemsMap.set(x.item.Item_Code, { unit: x.item.Unit || 'pcs' });
      });

    if (similarItemsMap.size === 0) return [];

    // 2. Find their active placements
    const activeSimilarPlacements = placements.filter(p =>
      similarItemsMap.has(p.Item_Code) && parseFloat(p.Quantity || '0') > 0
    );

    // 3. Aggregate quantities by location
    const locationAggr: Record<string, { cupboardNum: string; boxName: string; qty: number; unit: string }> = {};

    activeSimilarPlacements.forEach(p => {
      const cup = cupboards.find(c => c.Cupboard_ID === p.Cupboard_ID);
      if (!cup) return;
      
      const box = boxes.find(b => b.Box_ID === p.Box_ID);
      const cupboardNum = cup.Cupboard_Number;
      const boxName = box ? box.Box_Name : '';
      const key = boxName ? `${cupboardNum} / ${boxName}` : cupboardNum;
      
      const itemDetails = similarItemsMap.get(p.Item_Code);
      const unit = itemDetails?.unit || 'pcs';

      if (!locationAggr[key]) {
        locationAggr[key] = {
          cupboardNum,
          boxName,
          qty: 0,
          unit
        };
      }
      locationAggr[key].qty += parseFloat(p.Quantity || '0');
    });

    return Object.entries(locationAggr)
      .map(([label, info]) => ({
        label,
        qty: info.qty,
        unit: info.unit
      }))
      .slice(0, 3);
  }, [pickedItemCode, pickedItem, catalogItems, placements, cupboards, boxes]);

  const existingPlacements = useMemo(() => {
    if (!pickedItemCode) return [];
    return placements.filter(p => p.Item_Code === pickedItemCode && parseFloat(p.Quantity || '0') > 0);
  }, [placements, pickedItemCode]);

  const getCupboardName = (cupboardId: string) => {
    const cup = cupboards.find(c => c.Cupboard_ID === cupboardId);
    return cup ? `${cup.Cupboard_Number} - ${cup.Name}` : cupboardId;
  };
  const getBoxName = (boxId: string) => {
    const box = boxes.find(b => b.Box_ID === boxId);
    return box ? box.Box_Name : boxId;
  };

  const totalAllocated = allocations.reduce((sum, r) => sum + parseFloat(r.qty || '0'), 0);
  const targetQty = parseFloat(placeQty || '0');
  const isAllocationValid = 
    targetQty > 0 && 
    totalAllocated === targetQty && 
    allocations.every(r => r.cupboardId && r.boxId && parseFloat(r.qty || '0') > 0);

  const savePlacement = async () => {
    if (!pickedItemCode || !pickedItem) {
      toast({ title: 'Validation Error', description: 'An item must be selected.', variant: 'destructive' });
      return;
    }
    const qty = parseFloat(placeQty || '0');
    if (qty <= 0 || qty > maxAvailableToPlace) {
      toast({ title: 'Validation Error', description: `Quantity must be between 1 and ${maxAvailableToPlace}.`, variant: 'destructive' });
      return;
    }
    if (!isAllocationValid) {
      toast({ title: 'Validation Error', description: `Allocated quantities must sum exactly to ${qty}.`, variant: 'destructive' });
      return;
    }

    setSavingPlacement(true);
    try {
      if (isRelocateMode) {
        // Zero out all original placements of this item first
        const originalPlacements = placements.filter(p => p.Item_Code === pickedItemCode && parseFloat(p.Quantity || '0') > 0);
        for (const op of originalPlacements) {
          await removePlacement(op.Placement_ID);
        }
      }

      let allSuccess = true;
      for (const row of allocations) {
        const rowQty = parseFloat(row.qty);
        const res = await addPlacement(pickedItem.Item_Code, row.cupboardId, row.boxId, rowQty);
        if (!res.success) allSuccess = false;
      }
      if (allSuccess) {
        setShowItemModal(false);
        toast({
          title: isRelocateMode ? 'Relocated' : 'Placed',
          description: isRelocateMode ? 'Item successfully relocated to new locations.' : 'Item successfully assigned to locations.'
        });
      }
    } finally {
      setSavingPlacement(false);
    }
  };

  if (!mounted || isDataLoading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Storage Map</h1>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading storage map...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Storage Map</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Containers, boxes, and where every item actually lives.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center border rounded-lg px-3 bg-white h-9">
              <Search className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search containers…" className="border-none outline-none text-sm w-36 bg-transparent" />
            </div>
            <Button onClick={openAddCupboard} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Container
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 200); }}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── Stock Movement summary — Inward/Outward/All toggle with running totals ── */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <h3 className="font-bold text-sm">Stock Movement</h3>
            <div className="flex rounded-md border overflow-hidden">
              {([
                { key: 'all' as const, label: 'All' },
                { key: 'inward' as const, label: 'Inward' },
                { key: 'outward' as const, label: 'Outward' },
              ]).map(t => (
                <button key={t.key} onClick={() => setMovementFilter(t.key)}
                  className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                    movementFilter === t.key ? 'bg-primary text-primary-foreground' : 'bg-white hover:bg-gray-50 text-muted-foreground')}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(movementFilter === 'all' || movementFilter === 'inward') && (
              <div className="flex items-center gap-2.5 bg-green-50 border border-green-100 rounded-xl p-3">
                <ArrowDownToLine className="h-5 w-5 text-green-700 shrink-0" />
                <div><p className="text-lg font-bold text-green-800">{movementTotals.totalIn.toLocaleString('en-IN')}</p><p className="text-xs text-green-700/70">Total In</p></div>
              </div>
            )}
            {(movementFilter === 'all' || movementFilter === 'outward') && (
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <ArrowUpFromLine className="h-5 w-5 text-amber-700 shrink-0" />
                <div><p className="text-lg font-bold text-amber-800">{movementTotals.totalOut.toLocaleString('en-IN')}</p><p className="text-xs text-amber-700/70">Total Out</p></div>
              </div>
            )}
            {movementFilter === 'all' && (
              <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <ArrowLeftRight className="h-5 w-5 text-blue-700 shrink-0" />
                <div><p className="text-lg font-bold text-blue-800">{movementTotals.net.toLocaleString('en-IN')}</p><p className="text-xs text-blue-700/70">Net Change</p></div>
              </div>
            )}
          </div>
        </div>

        {/* ── Inventory level over time — reusable graph, shared with GST Summary ── */}
        <InventoryTrendGraph
          entries={entries}
          items={catalogItems.filter(i => i.Status !== 'Deleted').map(i => ({ code: i.Item_Code, name: i.Item_Name }))}
          title="Inventory Level Over Time"
        />

        {/* ── Unassigned Items — prominent, top of page ── */}
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <PackageOpen className="h-5 w-5 text-amber-700" />
            <h2 className="font-bold text-amber-900">Unassigned Items</h2>
            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold">{unassignedItems.length}</span>
          </div>
          {unassignedItems.length === 0 ? (
            <p className="text-sm text-amber-800/70">Everything in stock has a storage location. 🎉</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {unassignedItems.map(item => (
                <div key={item.Item_ID} className="bg-white rounded-xl border border-amber-200 p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <ItemTooltip itemCode={item.Item_Code}>
                      <button
                        onClick={(e) => { flashClick(e); router.push(`/item-master/${item.Item_ID}`); }}
                        className="text-sm font-semibold truncate text-blue-600 hover:text-blue-800 hover:underline text-left focus:outline-none block w-full"
                      >
                        {item.Item_Name}
                      </button>
                    </ItemTooltip>
                    <p className="text-xs text-muted-foreground font-mono">{item.Item_Code}</p>
                    <p className="text-xs text-amber-700 font-bold mt-0.5">{item._unassigned} {item.Unit || 'pcs'} unplaced</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs shrink-0"
                    onClick={() => {
                      setIsRelocateMode(false);
                      setActiveCup(null); setActiveBoxId(null); setModalCupboardId('');
                      setItemModalBoxId(null); setItemSearch(item.Item_Name);
                      setPickedItemCode(item.Item_Code); setPlaceQty(String(item._unassigned));
                      setAllocations([
                        { 
                          key: String(Date.now()), 
                          cupboardId: '', 
                          boxId: '', 
                          qty: String(item._unassigned) 
                        }
                      ]);
                      setEditingPlacementQty({});
                      setShowItemModal(true);
                    }}>
                    Place
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Container Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Box className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No containers found</p>
            <p className="text-sm mt-1">Click "Add Container" to create your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filtered.map(cup => (
              <div
                key={cup.Cupboard_ID}
                onClick={() => openPanel(cup)}
                className="group relative flex flex-col items-center text-center rounded-2xl border-2 p-4 cursor-pointer bg-white shadow-sm hover:shadow-md transition-all duration-150 select-none border-border hover:border-primary/40"
              >
                <div className="absolute top-2 left-2 hidden group-hover:flex gap-1 z-10">
                  <button onClick={e => openEditCupboard(cup, e)}
                    className="w-5 h-5 bg-white border rounded flex items-center justify-center shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors">
                    <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                  </button>
                  <button onClick={e => deleteCupboard(cup, e)}
                    className="w-5 h-5 bg-white border rounded flex items-center justify-center shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors">
                    <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
                  </button>
                </div>

                <div className="mb-3">
                  {cup.Image_URL ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 cursor-zoom-in" style={{ borderColor: (cup.Color || '#1B3A6B') + '40' }}
                      onClick={e => { e.stopPropagation(); setLightbox({ url: cup.Image_URL, caption: `${cup.Cupboard_Number} — ${cup.Name}` }); }}>
                      <img src={cup.Image_URL} alt={cup.Name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{ background: (cup.Color || '#1B3A6B') + '18' }}>
                      {cup.Type === 'Drawer' ? '🗃️' : '🗄️'}
                    </div>
                  )}
                </div>

                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground mb-1">{cup.Type || 'Cupboard'}</span>
                <div className="text-2xl font-black leading-none mb-1" style={{ color: cup.Color || '#1B3A6B' }}>{cup.Cupboard_Number}</div>
                <div className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{cup.Name}</div>
                {cup.Location && (
                  <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground mt-1">
                    <MapPin className="h-2.5 w-2.5 shrink-0" /> {cup.Location}
                  </div>
                )}
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground mt-2.5">
                  {getBoxesForCupboard(cup.Cupboard_ID).length} box{getBoxesForCupboard(cup.Cupboard_ID).length !== 1 ? 'es' : ''}
                </span>
                <div className="mt-2 text-[10px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Open <ChevronRight className="h-2.5 w-2.5" />
                </div>
              </div>
            ))}

            <div onClick={openAddCupboard}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/15 p-6 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all min-h-[180px] group">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors mb-2">
                <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">Add Container</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Container Detail Panel ── */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="w-full max-w-[440px] p-0 flex flex-col">
          {activeCup && (
            <>
              <div className="p-5 border-b text-white flex-shrink-0" style={{ background: activeCup.Color || '#1B3A6B' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {activeCup.Type === 'Drawer' ? '🗃️' : '🗄️'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold opacity-60 uppercase tracking-widest">{activeCup.Type || 'Cupboard'} {activeCup.Cupboard_Number}</div>
                      <button
                        onClick={(e) => { flashClick(e); setPopupState({ type: 'cupboard', id: activeCup.Cupboard_ID }); }}
                        className="text-left font-bold text-base leading-tight truncate hover:underline text-white focus:outline-none block"
                      >
                        {activeCup.Name}
                      </button>
                      {activeCup.Location && (
                        <div className="text-xs opacity-60 flex items-center gap-1 mt-0.5"><MapPin className="h-2.5 w-2.5" /> {activeCup.Location}</div>
                      )}
                    </div>
                  </div>
                  <button className="text-white/60 hover:text-white flex-shrink-0" onClick={() => setPanelOpen(false)}><X className="h-5 w-5" /></button>
                </div>
              </div>

              {activeBoxId === null ? (
                // ── Boxes view — prominent, primary content of the panel ──
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Boxes ({boxesInActiveCup.length})</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => openAddItem(null)}>
                        <Plus className="h-3 w-3" /> Add Item
                      </Button>
                      <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => { setBoxNameInput(''); setErrors({}); setShowBoxModal(true); }}>
                        <Plus className="h-3 w-3" /> Add Box
                      </Button>
                    </div>
                  </div>

                  {boxesInActiveCup.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Box className="h-10 w-10 mx-auto mb-2 opacity-15" />
                      <p className="text-sm font-medium">No boxes yet</p>
                      <p className="text-xs mt-1">Add a box to start placing items.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {boxesInActiveCup.map(box => (
                        <div key={box.Box_ID} onClick={() => setActiveBoxId(box.Box_ID)}
                          className="group relative rounded-xl border p-3 text-left hover:border-primary/40 hover:shadow-sm transition-all bg-white cursor-pointer select-none">
                          <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 z-10">
                            <button onClick={e => deleteBox(box.Box_ID, e)}
                              className="w-5 h-5 bg-white border rounded flex items-center justify-center shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors">
                              <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
                            </button>
                          </div>
                          <div className="text-2xl mb-1">📦</div>
                          <div className="text-sm font-semibold truncate pr-6">{box.Box_Name}</div>
                          <div className="text-[11px] text-muted-foreground">{box._itemCount} item{box._itemCount !== 1 ? 's' : ''} · {box._totalQty} qty</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // ── Single box's items ──
                <div className="flex-1 overflow-y-auto flex flex-col">
                  <div className="px-4 py-2.5 border-b flex items-center justify-between bg-muted/30 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveBoxId(null)} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mr-1">
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      {activeBox && (
                        <button
                          onClick={(e) => { flashClick(e); setPopupState({ type: 'box', id: activeBox.Box_ID }); }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                        >
                          {activeBox.Box_Name}
                        </button>
                      )}
                    </div>
                    <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => openAddItem(activeBoxId)}>
                      <Plus className="h-3 w-3" /> Add Item
                    </Button>
                  </div>
                  <div className="p-3 space-y-2">
                    {itemsInActiveBox.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground px-6">
                        <PackageOpen className="h-10 w-10 mx-auto mb-3 opacity-15" />
                        <p className="font-medium text-sm">This box is empty</p>
                        <p className="text-xs mt-1">Click "Add Item" to place something here.</p>
                      </div>
                    ) : itemsInActiveBox.map(p => (
                      <div key={p.Placement_ID} className="rounded-xl border p-3 flex items-center justify-between gap-2 bg-white group/item">
                        <div className="min-w-0">
                          <ItemTooltip itemCode={p.Item_Code}>
                            <button
                              onClick={() => router.push(`/item-master/${p._itemId || p.Item_Code}`)}
                              className="font-semibold text-sm truncate text-blue-600 hover:text-blue-800 hover:underline text-left focus:outline-none block w-full"
                            >
                              {p._itemName}
                            </button>
                          </ItemTooltip>
                          <div className="text-xs text-muted-foreground font-mono">{p.Item_Code}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{p.Quantity} {p._unit}</span>
                          <button
                            title="Relocate Item"
                            onClick={(evt) => {
                              evt.stopPropagation();
                              openRelocateItem(p.Item_Code);
                            }}
                            className="hidden group-hover/item:flex w-6 h-6 rounded border bg-white items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
                          >
                            <ArrowLeftRight className="h-3 w-3 text-muted-foreground hover:text-blue-600" />
                          </button>
                          <button onClick={() => confirmRemovePlacement(p)}
                            className="hidden group-hover/item:flex w-6 h-6 rounded border bg-white items-center justify-center hover:bg-red-50 hover:border-red-200">
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Add/Edit Container Modal ── */}
      <Dialog open={showCupModal} onOpenChange={(open) => { setShowCupModal(open); if (!open) setCreatingForAllocationKey(null); }}>
        <DialogContent className="max-w-md" preventClose={isCupFormDirty()}>
          <DialogHeader><DialogTitle>{editingCup ? 'Edit Container' : 'Add New Container'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <div className="flex gap-2">
                {CONTAINER_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => setCupForm(f => ({ ...f, type: t }))}
                    className={cn('flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                      cupForm.type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-white border-gray-200 hover:bg-gray-50')}>
                    {t}
                  </button>
                ))}
              </div>
              {cupForm.type === 'Custom' && (
                <Input value={cupForm.customType} onChange={e => setCupForm(f => ({ ...f, customType: e.target.value }))}
                  placeholder="Name this container type (e.g. Shelf, Rack)" className="h-9 mt-2" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Number *</Label>
                <Input value={cupForm.number} onChange={e => { setCupForm(f => ({ ...f, number: e.target.value })); if (errors.cupNumber) setErrors(err => ({ ...err, cupNumber: '' })); }} placeholder="C-01" className={cn("h-9", errors.cupNumber && "border-red-500 text-red-600 focus-visible:ring-red-500")} />
                {errors.cupNumber && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.cupNumber}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input value={cupForm.name} onChange={e => { setCupForm(f => ({ ...f, name: e.target.value })); if (errors.cupName) setErrors(err => ({ ...err, cupName: '' })); }} placeholder="Electronics Rack" className={cn("h-9", errors.cupName && "border-red-500 text-red-600 focus-visible:ring-red-500")} />
                {errors.cupName && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.cupName}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Input value={cupForm.location} onChange={e => setCupForm(f => ({ ...f, location: e.target.value }))} placeholder="Sector A, Floor 1" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={cupForm.description} onChange={e => setCupForm(f => ({ ...f, description: e.target.value }))} placeholder="What's stored here?" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Image URL</Label>
              <Input value={cupForm.imageUrl} onChange={e => setCupForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://…" className="h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Color Tag</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setCupForm(f => ({ ...f, color: c }))}
                    className={cn("w-7 h-7 rounded-full border-2 transition-transform hover:scale-110", cupForm.color === c ? "border-foreground scale-110" : "border-transparent")}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowCupModal(false); setCreatingForAllocationKey(null); }}>Cancel</Button>
            <Button onClick={saveCupboard} disabled={savingCup}>{savingCup ? 'Saving…' : editingCup ? 'Save Changes' : 'Add Container'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Box Modal ── */}
      <Dialog open={showBoxModal} onOpenChange={(open) => { setShowBoxModal(open); if (!open) setCreatingBoxForAllocationKey(null); }}>
        <DialogContent className="max-w-sm" preventClose={isBoxFormDirty()}>
          <DialogHeader><DialogTitle>Add Box to {activeCup?.Name || (creatingBoxForAllocationKey && cupboards.find(c => c.Cupboard_ID === allocations.find(r => r.key === creatingBoxForAllocationKey)?.cupboardId)?.Name) || 'Container'}</DialogTitle></DialogHeader>
          <div className="py-2 space-y-1">
            <Label className="text-xs">Box Name *</Label>
            <Input value={boxNameInput} onChange={e => { setBoxNameInput(e.target.value); if (errors.boxName) setErrors(err => ({ ...err, boxName: '' })); }} placeholder="e.g. Top Shelf, Bin 3" className={cn("h-9", errors.boxName && "border-red-500 text-red-600 focus-visible:ring-red-500")} />
            {errors.boxName && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.boxName}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowBoxModal(false); setCreatingBoxForAllocationKey(null); }}>Cancel</Button>
            <Button onClick={saveBox} disabled={savingBox || !boxNameInput.trim()}>{savingBox ? 'Saving…' : 'Add Box'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-md" preventClose={true}>
          <DialogHeader>
            <DialogTitle>{isRelocateMode ? 'Relocate Item' : `Place an Item${activeCup ? ` in ${activeCup.Name}` : ''}`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1 relative">
              <Label className="text-xs">{isRelocateMode ? 'Item' : 'Item (only items with unplaced stock shown) *'}</Label>
              <Input 
                value={itemSearch} 
                onChange={e => { 
                  setItemSearch(e.target.value); 
                  setPickedItemCode(''); 
                  if (errors.pickedItem) setErrors(err => ({ ...err, pickedItem: '' })); 
                }}
                disabled={isRelocateMode}
                onKeyDown={e => e.stopPropagation()}
                placeholder="Search item name…" 
                className={cn("h-9", errors.pickedItem && "border-red-500 text-red-600 focus-visible:ring-red-500")} 
                autoComplete="off" 
              />
              {errors.pickedItem && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.pickedItem}</p>}
              {!isRelocateMode && itemSearch && !pickedItemCode && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-56 overflow-y-auto divide-y font-sans">
                  {itemMatches.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No unplaced items match.</p>
                  ) : itemMatches.map(i => (
                    <button key={i.Item_ID} type="button"
                      onClick={() => { 
                        setPickedItemCode(i.Item_Code); 
                        setItemSearch(i.Item_Name); 
                        setPlaceQty(String(i._unassigned)); 
                        if (errors.pickedItem) setErrors(err => ({ ...err, pickedItem: '' })); 
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
                      <div className="font-medium text-gray-900">{i.Item_Name}</div>
                      <div className="text-[11px] text-muted-foreground">{i._unassigned} {i.Unit || 'pcs'} unplaced</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {pickedItem && (
              <div className="bg-muted/40 p-3 rounded-lg border border-dashed text-xs space-y-1">
                {isRelocateMode ? (
                  <div>Total placed quantity: <span className="font-bold">{totalCurrentlyPlaced} {pickedItem.Unit || 'pcs'}</span></div>
                ) : (
                  <div>Unplaced balance: <span className="font-bold">{maxAvailableToPlace} {pickedItem.Unit || 'pcs'}</span></div>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 pt-1.5 border-t border-muted-foreground/10 text-muted-foreground">
                  <div>Code: <span className="font-semibold text-foreground">{pickedItem.Item_Code}</span></div>
                  <div>Category: <span className="font-semibold text-foreground">{pickedItem.Category}</span></div>
                  <div>Unit: <span className="font-semibold text-foreground">{pickedItem.Unit}</span></div>
                  <div>HSN: <span className="font-semibold text-foreground">{pickedItem.HSN_Code || 'N/A'}</span></div>
                </div>
              </div>
            )}

            {/* Existing Placements List */}
            {!isRelocateMode && existingPlacements.length > 0 && (
              <div className="space-y-2 border border-blue-100 bg-blue-50/20 p-3.5 rounded-xl">
                <Label className="text-xs font-bold text-gray-700 block">Current Placements</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {existingPlacements.map(p => {
                    const cupName = getCupboardName(p.Cupboard_ID);
                    const boxName = getBoxName(p.Box_ID);
                    return (
                      <div key={p.Placement_ID} className="flex items-center justify-between gap-3 p-2 bg-white border rounded-xl text-xs shadow-sm">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{cupName} › {boxName}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input 
                            type="number" 
                            min="1" 
                            value={editingPlacementQty[p.Placement_ID] ?? p.Quantity}
                            onChange={e => setEditingPlacementQty(prev => ({ ...prev, [p.Placement_ID]: e.target.value }))}
                            onKeyDown={e => e.stopPropagation()}
                            className="w-14 h-7 border rounded text-center font-bold px-1"
                          />
                          {editingPlacementQty[p.Placement_ID] !== undefined && editingPlacementQty[p.Placement_ID] !== p.Quantity && (
                            <Button 
                              size="sm" 
                              className="h-7 text-[10px] px-2 bg-teal-600 hover:bg-teal-700 text-white"
                              onClick={async () => {
                                const newQty = parseFloat(editingPlacementQty[p.Placement_ID]);
                                const oldQty = parseFloat(p.Quantity);
                                if (isNaN(newQty) || newQty <= 0) return;
                                const diff = newQty - oldQty;
                                if (diff > (pickedItem?._unassigned || 0)) {
                                  toast({ title: 'Validation Error', description: `Not enough unplaced stock. Max additional allowed: ${pickedItem?._unassigned}`, variant: 'destructive' });
                                  return;
                                }
                                await addPlacement(p.Item_Code, p.Cupboard_ID, p.Box_ID, diff);
                                setEditingPlacementQty(prev => {
                                  const next = { ...prev };
                                  delete next[p.Placement_ID];
                                  return next;
                                });
                                toast({ title: 'Success', description: 'Placement quantity updated.' });
                              }}
                            >
                              Update
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              if (window.confirm(`This will remove this placement of ${p.Quantity} pcs. Continue?`)) {
                                await removePlacement(p.Placement_ID);
                                toast({ title: 'Success', description: 'Placement removed.' });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Allocation Locations splitting section */}
            <div className="space-y-2 border-t pt-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700 block">Allocate Locations</Label>
                {suggestedLocations.length > 0 && (
                  <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-2.5 space-y-1.5 animate-in fade-in duration-200">
                    <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                      <span>💡 Suggested Locations</span>
                      <span className="text-[9px] font-normal text-indigo-600/70 lowercase">(where similar items reside)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedLocations.map((loc, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-lg text-[10px] text-indigo-950 font-mono shadow-sm"
                        >
                          <span className="font-semibold">{loc.label}</span>
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {loc.qty} {loc.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {allocations.map((row, index) => {
                  return (
                    <div key={row.key} className="space-y-2.5 bg-gray-50/50 p-3 border rounded-xl relative animate-in fade-in duration-200">
                      {/* Delete row button */}
                      {allocations.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setAllocations(prev => prev.filter(r => r.key !== row.key))}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 uppercase font-bold">Storage Location *</Label>
                        <LocationPicker
                          cupboards={cupboards}
                          boxes={boxes}
                          selectedCupboardId={row.cupboardId}
                          selectedBoxId={row.boxId}
                          onChange={(cupboardId, boxId) => {
                            setAllocations(prev => prev.map(r => r.key === row.key ? { ...r, cupboardId, boxId } : r));
                          }}
                          onAddNewContainer={openAddCupboard}
                          onAddNewBox={(cupboardId) => {
                            setCreatingBoxForAllocationKey(row.key);
                            setBoxNameInput('');
                            setErrors({});
                            setShowBoxModal(true);
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-8 space-y-1">
                          <Label className="text-[10px] text-gray-500 uppercase font-bold">Allocated Qty *</Label>
                          <Input 
                            type="number" 
                            min="1" 
                            value={row.qty} 
                            onChange={e => {
                              const qVal = e.target.value;
                              setAllocations(prev => prev.map(r => r.key === row.key ? { ...r, qty: qVal } : r));
                            }}
                            onKeyDown={e => e.stopPropagation()}
                            className="h-8 text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                type="button" 
                onClick={() => setAllocations(prev => [...prev, { key: String(Date.now()), cupboardId: '', boxId: '', qty: '' }])}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 transition-colors mt-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add another location
              </button>
            </div>

            {/* Total Qty to Place Input */}
            <div className="space-y-1 border-t pt-3">
              <Label className="text-xs font-semibold">Total Quantity to Place *</Label>
              <Input type="number" min="1" max={maxAvailableToPlace || undefined} value={placeQty}
                onChange={e => { setPlaceQty(e.target.value); if (errors.placeQty) setErrors(err => ({ ...err, placeQty: '' })); }} 
                onKeyDown={e => e.stopPropagation()}
                className={cn("h-9", (errors.placeQty || isQtyExceeded) && "border-red-500 text-red-600 focus-visible:ring-red-500")} 
              />
              {errors.placeQty && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.placeQty}</p>}
              {isQtyExceeded && <p className="text-[11px] text-red-600 mt-1 font-semibold">Max allowed: {maxAvailableToPlace}</p>}
            </div>

            {/* Validation Message / Sum checker */}
            {targetQty > 0 && (
              <div className="text-xs p-2 rounded-lg flex items-center justify-between border bg-gray-50 mt-1">
                <span className="text-gray-500 font-medium">Allocation Status:</span>
                <span className={cn("font-bold px-2 py-0.5 rounded-full", isAllocationValid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                  {totalAllocated} of {targetQty} allocated {isAllocationValid ? '✓' : `(${targetQty - totalAllocated > 0 ? `${targetQty - totalAllocated} remaining` : `${totalAllocated - targetQty} over-allocated`})`}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowItemModal(false)}>Cancel</Button>
            <Button onClick={savePlacement} disabled={savingPlacement || !pickedItem || !isAllocationValid || isQtyExceeded}>
              {savingPlacement ? 'Saving…' : isRelocateMode ? 'Relocate Item' : 'Place Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/25 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg transition-colors z-10"
            onClick={() => setLightbox(null)}>✕</button>
          <div className="flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption} className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain" />
            {lightbox.caption && <p className="text-white/70 text-sm text-center">{lightbox.caption}</p>}
          </div>
        </div>
      )}
      {popupState && (
        <InfoPopup 
          type={popupState.type} 
          id={popupState.id} 
          onClose={() => setPopupState(null)} 
        />
      )}
    </AppShell>
  );
}
