"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  useInventoryEntries,
  useItemMaster,
  useUsers,
  useCupboards,
  useBoxesAndPlacements,
  useVendors,
  useInvoices
} from '@/hooks/use-inventory-data';
import { Badge } from '@/components/ui/badge';
import {
  X, Package, User, LayoutGrid, Box as BoxIcon, Building2, FileText, Search, MapPin, Calendar, Phone, Mail, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { flashClick } from '@/lib/click-flash';

interface InfoPopupProps {
  type: 'item' | 'employee' | 'cupboard' | 'box' | 'vendor' | 'invoice';
  id: string;
  onClose: () => void;
}

export function InfoPopup(props: InfoPopupProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!props.id || !mounted) return null;
  return createPortal(<InfoPopupInner {...props} />, document.body);
}

function InfoPopupInner({ type, id, onClose }: InfoPopupProps) {
  const router = useRouter();
  const { entries, items } = useInventoryEntries();
  const { items: catalogItems } = useItemMaster();
  const { users } = useUsers();
  const { cupboards, getCupboardItems } = useCupboards();
  const { boxes, placements } = useBoxesAndPlacements();
  const { vendors } = useVendors();
  const { invoices } = useInvoices();

  if (!id) return null;

  // Render Item Modal
  if (type === 'item') {
    const itemName = id;
    const catalogItem = catalogItems.find(i => 
      String(i.Item_Code).toLowerCase() === itemName.toLowerCase() || 
      String(i.Item_Name).toLowerCase() === itemName.toLowerCase()
    );
    const summaryItem = items.find(i => 
      i.name.toLowerCase() === itemName.toLowerCase() ||
      i.code.toLowerCase() === itemName.toLowerCase()
    );
    const itemHistory = entries.filter(e => 
      e.Item_Name.toLowerCase() === (summaryItem?.name || itemName).toLowerCase() || 
      e.Item_Code.toLowerCase() === (summaryItem?.code || itemName).toLowerCase()
    ).slice(0, 5);

    const displayName = summaryItem?.name || catalogItem?.Item_Name || itemName;
    const displayCode = summaryItem?.code || catalogItem?.Item_Code || 'N/A';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10 border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 text-gray-900">
          <div className="flex items-center justify-between p-5 border-b bg-blue-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{displayName}</h2>
                <p className="text-xs font-mono text-gray-500 mt-0.5">Item Code: {displayCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {catalogItem && (
                <button
                  onClick={(e) => { flashClick(e); onClose(); router.push(`/item-master/${catalogItem.Item_ID || catalogItem.Item_Code}`); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-100/60 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  View Full Page <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Category</span>
                <span className="text-sm font-semibold text-gray-800 mt-0.5 block">{catalogItem?.Category || 'Other'}</span>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Current Balance</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base font-bold text-primary">{summaryItem?.balance ?? 0}</span>
                  <Badge variant="outline" className={cn('text-[9px] font-extrabold px-1.5 py-0',
                    summaryItem?.status==='Normal' ? 'bg-green-50 text-green-700 border-green-200' :
                    summaryItem?.status==='Low' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  )}>
                    {summaryItem?.status || 'Normal'}
                  </Badge>
                </div>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Primary Location</span>
                <span className="text-sm font-semibold text-gray-800 mt-0.5 block">{catalogItem?.Location || summaryItem?.location || 'Default'}</span>
              </div>
            </div>

            {catalogItem && (catalogItem.Description || catalogItem.Min_Stock || catalogItem.HSN_Code) && (
              <div className="border-t pt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Catalog Specifications</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {catalogItem.HSN_Code && (
                    <div>
                      <span className="text-gray-500 text-xs">HSN Code:</span> <span className="font-semibold text-gray-800">{catalogItem.HSN_Code}</span>
                    </div>
                  )}
                  {catalogItem.Min_Stock && (
                    <div>
                      <span className="text-gray-500 text-xs">Min Stock Level:</span> <span className="font-semibold text-gray-800">{catalogItem.Min_Stock} {catalogItem.Unit || 'pcs'}</span>
                    </div>
                  )}
                  {catalogItem.Description && (
                    <div className="col-span-2 mt-1">
                      <span className="text-gray-500 text-xs block">Description:</span>
                      <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 italic">
                        "{catalogItem.Description}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Transactions</h3>
              {itemHistory.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4 text-center">No transaction history found for this item.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2">Date & Time</th>
                        <th className="px-3 py-2 text-center">Type</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Balance</th>
                        <th className="px-3 py-2">Vendor / Recipient</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                      {itemHistory.map((h, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 whitespace-nowrap">{h.Date_Time}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge className={cn('text-[9px] font-bold px-1.5 py-0',
                              h.Transaction_Type==='Inward' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            )} variant="outline">
                              {h.Transaction_Type==='Inward' ? 'IN' : 'OUT'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-bold">{h.Transaction_Type==='Inward' ? h.Inward_Qty : h.Outward_Qty}</td>
                          <td className="px-3 py-2 text-right font-semibold text-primary">{h.Balance_Qty}</td>
                          <td className="px-3 py-2 truncate max-w-[150px]">{h.Transaction_Type==='Inward' ? h.Vendor_Name : h.Issued_To}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Employee Modal
  if (type === 'employee') {
    const employeeName = id;
    const employeeUser = users.find(u => 
      u.Full_Name.toLowerCase() === employeeName.toLowerCase() ||
      u.User_ID.toLowerCase() === employeeName.toLowerCase()
    );
    const employeeHistory = entries.filter(e => 
      e.Employee_Name.toLowerCase() === (employeeUser?.Full_Name || employeeName).toLowerCase()
    ).slice(0, 5);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10 border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 text-gray-900">
          <div className="flex items-center justify-between p-5 border-b bg-green-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{employeeUser?.Full_Name || employeeName}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {employeeUser ? `Employee ID: ${employeeUser.Employee_ID}` : 'System User'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {employeeUser && (
                <button
                  onClick={(e) => { flashClick(e); onClose(); router.push(`/users/${employeeUser.User_ID}`); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-900 hover:bg-green-100/60 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  View Full Profile <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Department</span>
                <span className="text-sm font-semibold text-gray-800 mt-0.5 block">{employeeUser?.Department || 'N/A'}</span>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Role</span>
                <span className="text-sm font-semibold text-gray-800 mt-0.5 block">{employeeUser?.Role || 'Operator'}</span>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Email Address</span>
                <span className="text-sm font-semibold text-gray-800 mt-0.5 block truncate">{employeeUser?.Email || 'N/A'}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Ledger Entries</h3>
              {employeeHistory.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4 text-center">No recent entries recorded by this employee.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2">Date & Time</th>
                        <th className="px-3 py-2">Item Name</th>
                        <th className="px-3 py-2 text-center">Type</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2">Invoice / Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                      {employeeHistory.map((h, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 whitespace-nowrap">{h.Date_Time}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{h.Item_Name}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge className={cn('text-[9px] font-bold px-1.5 py-0',
                              h.Transaction_Type==='Inward' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            )} variant="outline">
                              {h.Transaction_Type==='Inward' ? 'IN' : 'OUT'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-bold">{h.Transaction_Type==='Inward' ? h.Inward_Qty : h.Outward_Qty}</td>
                          <td className="px-3 py-2 text-gray-500">{h.Invoice_No || h.Remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Cupboard Modal
  if (type === 'cupboard') {
    const cupboard = cupboards.find(c => 
      c.Cupboard_ID === id || 
      c.Cupboard_Number.toLowerCase() === id.toLowerCase() ||
      c.Name.toLowerCase() === id.toLowerCase()
    );
    if (!cupboard) return null;

    const cupboardItemsList = getCupboardItems(cupboard.Cupboard_ID);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10 border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 text-gray-900">
          <div className="flex items-center justify-between p-5 border-b" style={{ backgroundColor: (cupboard.Color || '#1B3A6B') + '10' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg text-white" style={{ backgroundColor: cupboard.Color || '#1B3A6B' }}>
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">{cupboard.Type || 'Cupboard'}</span>
                <h2 className="text-xl font-bold text-gray-900 leading-tight mt-0.5">{cupboard.Cupboard_Number} — {cupboard.Name}</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Location</span>
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{cupboard.Location || 'N/A'}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Total Items Listed</span>
                <span className="text-base font-bold text-primary mt-0.5 block">{cupboardItemsList.length}</span>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Description</span>
                <span className="text-sm font-medium text-gray-700 mt-0.5 block line-clamp-2">{cupboard.Description || 'No description available'}</span>
              </div>
            </div>

            {cupboard.Image_URL && (
              <div className="border rounded-xl overflow-hidden max-h-48 bg-muted flex items-center justify-center">
                <img src={cupboard.Image_URL} alt={cupboard.Name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Stored Items</h3>
              {cupboardItemsList.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4 text-center">No items catalogued inside this container.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2">Item Name</th>
                        <th className="px-3 py-2">Item Code</th>
                        <th className="px-3 py-2 text-center">Category</th>
                        <th className="px-3 py-2 text-right">Min Qty</th>
                        <th className="px-3 py-2 text-right">Live Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                      {cupboardItemsList.map((i) => {
                        const min = parseFloat(i.Min_Qty || '0');
                        const qty = parseFloat(i.Quantity || '0');
                        const isLow = qty <= min && qty > 0;
                        return (
                          <tr key={i.Item_ID} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 font-semibold text-gray-900">{i.Item_Name}</td>
                            <td className="px-3 py-2 font-mono text-gray-500">{i.Item_Code}</td>
                            <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-[9px]">{i.Category || 'Other'}</Badge></td>
                            <td className="px-3 py-2 text-right text-gray-500">{i.Min_Qty}</td>
                            <td className="px-3 py-2 text-right font-bold">
                              <span className={cn(isLow ? 'text-amber-600' : (qty <= 0 ? 'text-red-600' : 'text-green-700'))}>
                                {i.Quantity} {i.Unit || 'pcs'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors" style={{ backgroundColor: cupboard.Color || '#1B3A6B' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Box Modal
  if (type === 'box') {
    const box = boxes.find(b => b.Box_ID === id || b.Box_Name.toLowerCase() === id.toLowerCase());
    if (!box) return null;

    const parentCupboard = cupboards.find(c => c.Cupboard_ID === box.Cupboard_ID);
    const boxPlacements = placements.filter(p => p.Box_ID === box.Box_ID && parseFloat(p.Quantity || '0') > 0);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10 border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 text-gray-900">
          <div className="flex items-center justify-between p-5 border-b bg-amber-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
                <BoxIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">Box Location</span>
                <h2 className="text-xl font-bold text-gray-900 leading-tight mt-0.5">{box.Box_Name}</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Parent Container</span>
                <span className="text-sm font-semibold text-gray-800 mt-0.5 block">
                  {parentCupboard ? `${parentCupboard.Cupboard_Number} — ${parentCupboard.Name}` : 'N/A'}
                </span>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Items count</span>
                <span className="text-sm font-semibold text-gray-800 mt-0.5 block">
                  {boxPlacements.length} unique item types placed
                </span>
              </div>
              {box.Description && (
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 col-span-2">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Box Notes</span>
                  <span className="text-sm font-medium text-gray-700 mt-0.5 block italic">"{box.Description}"</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contents inside Box</h3>
              {boxPlacements.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4 text-center">No items placed in this box yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2">Item Name</th>
                        <th className="px-3 py-2">Item Code</th>
                        <th className="px-3 py-2 text-right">Quantity</th>
                        <th className="px-3 py-2 text-right">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                      {boxPlacements.map((p) => {
                        const catalogItem = catalogItems.find(i => i.Item_Code === p.Item_Code);
                        return (
                          <tr key={p.Placement_ID} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 font-semibold text-gray-900">{catalogItem?.Item_Name || 'Unknown Item'}</td>
                            <td className="px-3 py-2 font-mono text-gray-500">{p.Item_Code}</td>
                            <td className="px-3 py-2 text-right font-bold text-primary">{p.Quantity} {catalogItem?.Unit || 'pcs'}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{p.Last_Updated}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Vendor Modal
  if (type === 'vendor') {
    const vendor = vendors.find(v => v.Vendor_ID === id || v.Vendor_Name.toLowerCase() === id.toLowerCase());
    if (!vendor) return null;

    const vendorHistory = entries.filter(e => 
      e.Vendor_Name.toLowerCase() === vendor.Vendor_Name.toLowerCase()
    ).slice(0, 5);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10 border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 text-gray-900">
          <div className="flex items-center justify-between p-5 border-b bg-purple-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">{vendor.Category || 'Supplier'}</span>
                <h2 className="text-xl font-bold text-gray-900 leading-tight mt-0.5">{vendor.Vendor_Name}</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Contact Person</span>
                <span className="text-sm font-semibold text-gray-800 mt-0.5 block">{vendor.Contact_Person || 'N/A'}</span>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">GSTIN Registration</span>
                <span className="text-sm font-mono font-bold text-gray-800 mt-0.5 block">{vendor.GSTIN || 'Unregistered'}</span>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Status</span>
                <Badge variant="outline" className={cn('text-[10px] font-bold mt-0.5', 
                  vendor.Status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                )}>
                  {vendor.Status || 'Active'}
                </Badge>
              </div>
              {vendor.Phone || vendor.Email ? (
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 col-span-2">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Contact Info</span>
                  <div className="text-sm font-medium text-gray-700 mt-1 space-y-1">
                    {vendor.Phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {vendor.Phone}</p>}
                    {vendor.Email && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {vendor.Email}</p>}
                  </div>
                </div>
              ) : null}
              {vendor.Address ? (
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Address</span>
                  <p className="text-xs text-gray-600 mt-1 flex items-start gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" /> <span>{vendor.Address}</span></p>
                </div>
              ) : null}
            </div>

            {vendor.Notes && (
              <div className="border-t pt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vendor Notes</h3>
                <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 italic">
                  "{vendor.Notes}"
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Supplies (Inwards)</h3>
              {vendorHistory.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4 text-center">No recent stock supply records for this vendor.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2">Date & Time</th>
                        <th className="px-3 py-2">Item Supplied</th>
                        <th className="px-3 py-2 text-right">Inward Qty</th>
                        <th className="px-3 py-2 text-right">Invoice Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                      {vendorHistory.map((h, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 whitespace-nowrap">{h.Date_Time}</td>
                          <td className="px-3 py-2 font-semibold text-gray-900">{h.Item_Name}</td>
                          <td className="px-3 py-2 text-right font-bold text-green-700">+{h.Inward_Qty}</td>
                          <td className="px-3 py-2 text-right font-semibold">₹{parseFloat(h.Total_Invoice_Value || '0').toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Invoice Modal
  if (type === 'invoice') {
    const invDetails = invoices.find(i => i.Invoice_No === id);
    const invoiceEntries = entries.filter(e => e.Invoice_No === id);

    const vendorName = invDetails?.Vendor_Name || invoiceEntries[0]?.Vendor_Name || 'N/A';
    const employeeName = invDetails?.Employee_Name || invoiceEntries[0]?.Employee_Name || 'N/A';
    const date = invDetails?.Date || invoiceEntries[0]?.Date_Time || 'N/A';
    const totalValue = invDetails?.Total_Value || invoiceEntries.reduce((sum, e) => sum + parseFloat(e.Total_Invoice_Value || '0'), 0).toFixed(2);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10 border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 text-gray-900">
          <div className="flex items-center justify-between p-5 border-b bg-teal-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-teal-100 text-teal-700">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-200 text-teal-800">GST Invoice</span>
                <h2 className="text-xl font-bold text-gray-900 leading-tight mt-0.5">{id}</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Supplier / Vendor</span>
                <span className="text-xs font-semibold text-gray-800 mt-0.5 block truncate">{vendorName}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Invoice Date</span>
                <span className="text-xs font-semibold text-gray-800 mt-0.5 block">{date}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Received By</span>
                <span className="text-xs font-semibold text-gray-800 mt-0.5 block">{employeeName}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Invoice Amount</span>
                <span className="text-sm font-bold text-teal-700 mt-0.5 block">₹{parseFloat(totalValue).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Invoice Line Items</h3>
              {invoiceEntries.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4 text-center">No lines linked to this invoice number.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2">Item Name</th>
                        <th className="px-3 py-2">Item Code</th>
                        <th className="px-3 py-2 text-right">Inward Qty</th>
                        <th className="px-3 py-2 text-right">Price / Item</th>
                        <th className="px-3 py-2 text-right">GST Rate</th>
                        <th className="px-3 py-2 text-right">Total ₹</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                      {invoiceEntries.map((h, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 font-semibold text-gray-900">{h.Item_Name}</td>
                          <td className="px-3 py-2 font-mono text-gray-500">{h.Item_Code}</td>
                          <td className="px-3 py-2 text-right font-bold">{h.Inward_Qty}</td>
                          <td className="px-3 py-2 text-right text-gray-500">₹{parseFloat(h.Price_Per_Item || '0').toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{h.GST_Rate}%</td>
                          <td className="px-3 py-2 text-right font-semibold text-teal-700">₹{parseFloat(h.Total_Invoice_Value || '0').toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
