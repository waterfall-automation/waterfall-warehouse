"use client";

import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useItemMaster, useInventoryEntries } from '@/hooks/use-inventory-data';
import { safeStr } from '@/lib/utils';

interface ItemTooltipProps {
  itemName?: string;
  itemCode?: string;
  children: React.ReactNode;
}

export function ItemTooltip({ itemName, itemCode, children }: ItemTooltipProps) {
  const { items } = useItemMaster();

  // Find the item in the Item Master (fast lookup)
  const item = items.find(
    i =>
      (itemCode && i.Item_Code === itemCode) ||
      (itemName && safeStr(i.Item_Name).toLowerCase() === safeStr(itemName).toLowerCase())
  );

  if (!item) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="p-3 bg-white text-gray-900 border border-gray-200 shadow-lg rounded-xl max-w-xs space-y-2 z-50">
          <ItemTooltipInner item={item} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ItemTooltipInner({ item }: { item: any }) {
  const { entries } = useInventoryEntries();

  // Heavy balance calculation is deferred until hover mount
  const getBalance = () => {
    let balance = 0;
    const targetCode = item.Item_Code;
    const targetNameLower = safeStr(item.Item_Name).toLowerCase();

    entries.forEach(e => {
      const nameMatch = safeStr(e.Item_Name).toLowerCase() === targetNameLower;
      const codeMatch = e.Item_Code && e.Item_Code === targetCode;
      if (nameMatch || codeMatch) {
        const inQty = parseFloat(e.Inward_Qty || '0');
        const outQty = parseFloat(e.Outward_Qty || '0');
        balance += inQty - outQty;
      }
    });
    return balance;
  };

  const balance = getBalance();

  return (
    <>
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">{item.Item_Code}</span>
        <h4 className="text-sm font-bold leading-tight text-gray-900">{item.Item_Name}</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t pt-2">
        <div>
          <span className="text-gray-400 block font-medium text-[10px]">Category</span>
          <span className="font-semibold text-gray-700">{item.Category || 'Other'}</span>
        </div>
        <div>
          <span className="text-gray-400 block font-medium text-[10px]">Total Stock</span>
          <span className={`font-bold ${balance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {balance} {item.Unit || 'pcs'}
          </span>
        </div>
        {item.HSN_Code && (
          <div className="col-span-2">
            <span className="text-gray-400 block font-medium text-[10px]">HSN Code</span>
            <span className="font-semibold text-gray-700 font-mono">{item.HSN_Code}</span>
          </div>
        )}
      </div>
    </>
  );
}
