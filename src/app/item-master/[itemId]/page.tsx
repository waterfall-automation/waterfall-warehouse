"use client";

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, Box, MapPin, History, Info, Tag, Layers, Scale, 
  AlertTriangle, ArrowUpRight, ArrowDownRight, Archive
} from 'lucide-react';
import { 
  useItemMaster, 
  useBoxesAndPlacements, 
  useInventoryEntries, 
  useCupboards 
} from '@/hooks/use-inventory-data';
import { getSimilarity, safeStr } from '@/lib/utils';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = String(params.itemId);

  const { items, loading: loadingItems } = useItemMaster();
  const { cupboards, loading: loadingCupboards } = useCupboards();
  const { boxes, placements, loading: loadingPlacements } = useBoxesAndPlacements();
  const { entries, loading: loadingEntries } = useInventoryEntries();

  const isLoading = loadingItems || loadingEntries || loadingPlacements || loadingCupboards;

  // Find target item
  const item = useMemo(() => {
    return items.find(i => i.Item_ID === itemId || i.Item_Code === itemId);
  }, [items, itemId]);

  if (isLoading && !item) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Animated outer ring */}
            <div className="absolute w-12 h-12 rounded-full border-2 border-indigo-600/20 border-t-indigo-600 animate-spin" />
            {/* Inner pulsing center */}
            <div className="w-6 h-6 rounded-full bg-indigo-600/10 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-widest mt-2 animate-pulse">
            Fetching Catalog Specs...
          </span>
        </div>
      </AppShell>
    );
  }

  // Filter transaction entries for the item
  const itemEntries = useMemo(() => {
    if (!item) return [];
    return entries.filter(
      e =>
        e.Item_Code === item.Item_Code ||
        safeStr(e.Item_Name).toLowerCase() === safeStr(item.Item_Name).toLowerCase()
    );
  }, [item, entries]);

  // Compute live current stock total
  const totalStock = useMemo(() => {
    return itemEntries.reduce((sum, e) => {
      const inQty = parseFloat(e.Inward_Qty || '0');
      const outQty = parseFloat(e.Outward_Qty || '0');
      return sum + inQty - outQty;
    }, 0);
  }, [itemEntries]);

  // Map placements to container and box details
  const itemPlacements = useMemo(() => {
    if (!item) return [];
    return placements
      .filter(p => p.Item_Code === item.Item_Code && parseFloat(p.Quantity || '0') > 0)
      .map(p => {
        const cupboard = cupboards.find(c => c.Cupboard_ID === p.Cupboard_ID);
        const box = boxes.find(b => b.Box_ID === p.Box_ID);
        return {
          ...p,
          cupboardName: cupboard ? cupboard.Name : 'Unknown Container',
          boxName: box ? box.Box_Name : 'Open Shelving/Bulk',
          quantity: parseFloat(p.Quantity)
        };
      });
  }, [item, placements, cupboards, boxes]);

  // Compute similar items
  const similarItems = useMemo(() => {
    if (!item) return [];
    return items
      .filter(i => i.Item_ID !== item.Item_ID) // exclude itself
      .map(i => ({ item: i, score: getSimilarity(item.Item_Name, i.Item_Name) }))
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [item, items]);

  // Helper to compute stock totals for similar items
  const getItemStock = (targetItem: typeof item) => {
    if (!targetItem) return 0;
    const targetEntries = entries.filter(
      e =>
        e.Item_Code === targetItem.Item_Code ||
        safeStr(e.Item_Name).toLowerCase() === safeStr(targetItem.Item_Name).toLowerCase()
    );
    return targetEntries.reduce((sum, e) => {
      const inQty = parseFloat(e.Inward_Qty || '0');
      const outQty = parseFloat(e.Outward_Qty || '0');
      return sum + inQty - outQty;
    }, 0);
  };

  if (!item) {
    return (
      <AppShell>
        <div className="py-20 text-center text-muted-foreground animate-in fade-in duration-300">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <p className="text-lg font-semibold">Item Not Found</p>
          <p className="text-sm mt-1 max-w-sm mx-auto text-muted-foreground">The item ID or code "{itemId}" could not be resolved in the Master Catalogue.</p>
          <Button onClick={() => router.push('/item-master')} className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Item Master
          </Button>
        </div>
      </AppShell>
    );
  }

  const isLowStock = totalStock <= parseFloat(item.Min_Stock || '0');

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/item-master')} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Master Catalogue
          </Button>
          <Badge className={item.Status === 'Active' ? 'bg-green-600 text-white' : 'bg-amber-600 text-white'}>
            Status: {item.Status || 'Active'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT & MIDDLE COLUMNS - Core Details & Ledger */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Item Primary Info Card */}
            <Card className="border-none shadow-md overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <CardContent className="p-6 pt-8 space-y-4">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">{item.Item_Code}</span>
                    <h1 className="text-2xl font-headline font-bold text-primary mt-1.5 leading-snug">{item.Item_Name}</h1>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-medium text-muted-foreground">Total Stock Balance</span>
                    <span className={`text-3xl font-extrabold tracking-tight mt-1 ${totalStock <= 0 ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-green-600'}`}>
                      {totalStock} <span className="text-lg font-semibold text-muted-foreground">{item.Unit || 'pcs'}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t pt-4 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Layers className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none">Category</span>
                      <span className="font-semibold text-foreground mt-1 block">{item.Category || 'Other'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Scale className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none">HSN Code</span>
                      <span className="font-semibold text-foreground font-mono mt-1 block">{item.HSN_Code || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 col-span-2 sm:col-span-1">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none">Default Location</span>
                      <span className="font-semibold text-foreground mt-1 block">{item.Location || 'Default'}</span>
                    </div>
                  </div>
                </div>

                {item.Description && (
                  <div className="border-t pt-3">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none">Description</span>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{item.Description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction History Ledger Card */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4 flex flex-row items-center gap-3.5">
                <History className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base font-bold">Transaction Ledger History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                  {itemEntries.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <History className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No transactions recorded</p>
                      <p className="text-xs text-muted-foreground mt-0.5">This item currently has no ledger logs in the Stock Register.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-gray-50/70 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="text-xs font-bold">Date & Time</TableHead>
                          <TableHead className="text-xs font-bold">Action</TableHead>
                          <TableHead className="text-xs font-bold text-right">Quantity</TableHead>
                          <TableHead className="text-xs font-bold">Inward/Outward Details</TableHead>
                          <TableHead className="text-xs font-bold">Staff</TableHead>
                          <TableHead className="text-xs font-bold">Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemEntries.map((e, index) => (
                          <TableRow key={index} className="hover:bg-muted/5">
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{e.Date_Time}</TableCell>
                            <TableCell className="text-xs">
                              {e.Transaction_Type === 'Inward' ? (
                                <Badge className="bg-green-100 text-green-800 border-none font-semibold text-[10px] hover:bg-green-100 py-0.5">
                                  <ArrowDownRight className="h-3 w-3 mr-0.5" /> Inward
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 border-none font-semibold text-[10px] hover:bg-amber-100 py-0.5">
                                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> Outward
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className={`text-xs font-bold text-right ${e.Transaction_Type === 'Inward' ? 'text-green-600' : 'text-amber-600'}`}>
                              {e.Transaction_Type === 'Inward' ? `+${e.Inward_Qty}` : `-${e.Outward_Qty}`}
                            </TableCell>
                            <TableCell className="text-xs">
                              {e.Transaction_Type === 'Inward' ? (
                                <div className="space-y-0.5">
                                  {e.Invoice_No && <p className="font-semibold text-gray-800">Inv: {e.Invoice_No}</p>}
                                  {e.Vendor_Name && <p className="text-[10px] text-muted-foreground leading-none">Vendor: {e.Vendor_Name}</p>}
                                </div>
                              ) : (
                                <p className="font-semibold text-gray-800">{e.Issued_To || 'General Issue'}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{e.Employee_Name || 'Admin'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={e.Remarks}>{e.Remarks || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN - Placements & Recommendations */}
          <div className="space-y-6">
            
            {/* Storage Map Placements Card */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4 flex flex-row items-center gap-3.5">
                <Box className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base font-bold">Storage Map Placements</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {itemPlacements.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No storage locations allocated</p>
                    <p className="text-xs text-muted-foreground mt-0.5">This item is not currently placed in any cupboards or boxes on the map.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {itemPlacements.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-indigo-600 block uppercase leading-none font-mono">PL-{p.Placement_ID}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Archive className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-700">{p.cupboardName}</span>
                            <span className="text-gray-300 text-xs">/</span>
                            <span className="text-xs font-medium text-gray-500">{p.boxName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-gray-900">{p.quantity}</span>
                          <span className="text-[10px] text-muted-foreground font-medium block leading-none">{item.Unit || 'pcs'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Specifications Card */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4 flex flex-row items-center gap-3.5">
                <Info className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base font-bold">Catalog Configuration</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="border border-dashed border-gray-200 p-2.5 rounded-lg bg-gray-50/20">
                    <span className="text-muted-foreground block font-medium">Min Stock Target</span>
                    <span className="font-semibold text-gray-800 text-sm mt-0.5 block">{item.Min_Stock || '0'} {item.Unit || 'pcs'}</span>
                  </div>
                  <div className="border border-dashed border-gray-200 p-2.5 rounded-lg bg-gray-50/20">
                    <span className="text-muted-foreground block font-medium">Max Stock Target</span>
                    <span className="font-semibold text-gray-800 text-sm mt-0.5 block">{String(item.Max_Stock || '').trim() ? item.Max_Stock : '∞'} {item.Unit || 'pcs'}</span>
                  </div>
                  <div className="border border-dashed border-gray-200 p-2.5 rounded-lg bg-gray-50/20 col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground block font-medium">Reorder Alert Level</span>
                      <span className="font-semibold text-amber-600 text-sm mt-0.5 block">{item.Reorder_Level || '0'} {item.Unit || 'pcs'}</span>
                    </div>
                    {isLowStock && (
                      <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 border-none font-semibold text-[10px] px-2 py-0.5">
                        <AlertTriangle className="h-3 w-3 mr-1 text-amber-600 shrink-0" /> Low Stock
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground space-y-1.5 border-t pt-3">
                  <div className="flex justify-between">
                    <span>Created On:</span>
                    <span className="font-medium text-gray-700">{item.Created_On || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Synced/Updated:</span>
                    <span className="font-medium text-gray-700">{item.Last_Updated || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Items Suggestions */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4 flex flex-row items-center gap-3.5">
                <Tag className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base font-bold">Similar Catalogue Items</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {similarItems.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <Tag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No similar items found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">No other catalog items share key terms in their names.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {similarItems.map(({ item: simItem, score }) => {
                      const simStock = getItemStock(simItem);
                      return (
                        <div 
                          key={simItem.Item_ID} 
                          onClick={() => router.push(`/item-master/${simItem.Item_ID}`)}
                          className="cursor-pointer border border-gray-150 rounded-xl p-3 bg-white hover:border-indigo-400 hover:shadow-sm transition-all text-left flex justify-between items-start gap-4"
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold text-muted-foreground block">{simItem.Item_Code}</span>
                            <h4 className="text-xs font-bold text-gray-800 leading-snug hover:text-indigo-600">{simItem.Item_Name}</h4>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Badge variant="outline" className="text-[9px] py-0 px-1 hover:bg-transparent">{simItem.Category}</Badge>
                              <span className="text-[10px] text-muted-foreground font-medium">Similarity: {Math.round(score * 100)}%</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-gray-900 block">{simStock}</span>
                            <span className="text-[9px] text-muted-foreground font-medium block leading-none">{simItem.Unit || 'pcs'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    </AppShell>
  );
}
