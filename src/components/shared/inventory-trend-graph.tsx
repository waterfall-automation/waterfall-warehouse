"use client";

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Entries store Date_Time as "DD-MM-YYYY HH:mm" — parse that first, falling back to a
// direct Date parse for any other format already present in the sheet.
function parseDT(s: string): number {
  const m = /^(\d{2})-(\d{2})-(\d{4})[ T]?(\d{2}:\d{2})?/.exec(s || '');
  if (m) { const [, d, mo, y, hm] = m; return new Date(`${y}-${mo}-${d}T${hm || '00:00'}`).getTime(); }
  const t = new Date(s).getTime();
  return isNaN(t) ? NaN : t;
}

export type TrendEntry = {
  Date_Time: string;
  Item_Code?: string;
  Item_Name?: string;
  [key: string]: any;
};

export type InventoryTrendGraphProps = {
  /** Raw ledger rows — typically Stock_Register entries. */
  entries: TrendEntry[];
  /** Optional item list to enable an item-level filter dropdown; omit for whole-warehouse only. */
  items?: { code: string; name: string }[];
  /** Extracts the "in" amount from one entry. Defaults to parsing Inward_Qty. */
  getIn?: (e: TrendEntry) => number;
  /** Extracts the "out" amount from one entry. Defaults to parsing Outward_Qty. */
  getOut?: (e: TrendEntry) => number;
  title?: string;
  /** Unit label shown in the tooltip/axis, e.g. "units" or "₹". */
  valueLabel?: string;
  /** Custom number formatting, e.g. currency. Defaults to a plain locale number. */
  formatValue?: (n: number) => string;
  className?: string;
};

const defaultGetIn = (e: TrendEntry) => parseFloat(e.Inward_Qty || '0');
const defaultGetOut = (e: TrendEntry) => parseFloat(e.Outward_Qty || '0');

type ViewMode = 'month' | 'year' | 'custom';

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1); }
function toISO(d: Date) { const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }

export function InventoryTrendGraph({
  entries, items, getIn = defaultGetIn, getOut = defaultGetOut,
  title = 'Inventory Level Over Time', valueLabel = 'units',
  formatValue = (n) => n.toLocaleString('en-IN'),
  className,
}: InventoryTrendGraphProps) {
  const [view, setView] = useState<ViewMode>('month');
  const now = useMemo(() => new Date(), []);
  const [customFrom, setCustomFrom] = useState(toISO(startOfMonth(now)));
  const [customTo, setCustomTo] = useState(toISO(now));
  const [itemCode, setItemCode] = useState('');

  const scoped = useMemo(() => {
    if (!itemCode) return entries;
    return entries.filter(e => e.Item_Code === itemCode);
  }, [entries, itemCode]);

  const { rangeStart, rangeEnd, bucketUnit } = useMemo(() => {
    if (view === 'month') return { rangeStart: startOfMonth(now), rangeEnd: now, bucketUnit: 'day' as const };
    if (view === 'year') return { rangeStart: startOfYear(now), rangeEnd: now, bucketUnit: 'month' as const };
    const from = customFrom ? new Date(customFrom + 'T00:00:00') : startOfMonth(now);
    const to = customTo ? new Date(customTo + 'T23:59:59') : now;
    const spanDays = (to.getTime() - from.getTime()) / 86400000;
    return { rangeStart: from, rangeEnd: to, bucketUnit: (spanDays > 62 ? 'month' : 'day') as 'day' | 'month' };
  }, [view, customFrom, customTo, now]);

  const chartData = useMemo(() => {
    const rangeStartMs = rangeStart.getTime();
    const rangeEndMs = rangeEnd.getTime();

    // Baseline = net level accumulated from everything before the visible range.
    let baseline = 0;
    const inRange: { t: number; delta: number }[] = [];
    scoped.forEach(e => {
      const t = parseDT(e.Date_Time);
      if (isNaN(t)) return;
      const delta = getIn(e) - getOut(e);
      if (t < rangeStartMs) baseline += delta;
      else if (t <= rangeEndMs) inRange.push({ t, delta });
    });
    inRange.sort((a, b) => a.t - b.t);

    const bucketKey = (t: number) => {
      const d = new Date(t);
      return bucketUnit === 'month' ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const bucketLabel = (key: string) => {
      if (bucketUnit === 'month') {
        const [y, m] = key.split('-');
        return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }
      const [y, m, d] = key.split('-');
      return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    // Build the ordered list of bucket keys spanning the whole visible range (so gaps show
    // as flat line, not missing points).
    const keys: string[] = [];
    const cursor = new Date(rangeStart);
    while (cursor.getTime() <= rangeEndMs) {
      const key = bucketKey(cursor.getTime());
      if (keys[keys.length - 1] !== key) keys.push(key);
      cursor.setDate(cursor.getDate() + (bucketUnit === 'month' ? 15 : 1));
      if (bucketUnit === 'month') cursor.setDate(1);
    }
    // Ensure last real bucket (today/rangeEnd) is included.
    const endKey = bucketKey(rangeEndMs);
    if (keys[keys.length - 1] !== endKey) keys.push(endKey);

    const deltaByBucket = new Map<string, number>();
    inRange.forEach(({ t, delta }) => {
      const k = bucketKey(t);
      deltaByBucket.set(k, (deltaByBucket.get(k) || 0) + delta);
    });

    let level = baseline;
    return keys.map(k => {
      level += deltaByBucket.get(k) || 0;
      return { key: k, label: bucketLabel(k), level: Math.round(level * 100) / 100 };
    });
  }, [scoped, rangeStart, rangeEnd, bucketUnit, getIn, getOut]);

  return (
    <div className={cn('rounded-2xl border bg-card p-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-bold text-sm">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {items && items.length > 0 && (
            <select value={itemCode} onChange={e => setItemCode(e.target.value)}
              className="h-8 px-2 rounded-md border border-gray-300 text-xs bg-white max-w-[160px]">
              <option value="">All Items (warehouse)</option>
              {items.map(i => <option key={i.code} value={i.code}>{i.name}</option>)}
            </select>
          )}
          <div className="flex rounded-md border overflow-hidden">
            {(['month', 'year', 'custom'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={cn('px-2.5 py-1.5 text-xs font-medium transition-colors',
                  view === v ? 'bg-primary text-primary-foreground' : 'bg-white hover:bg-gray-50 text-muted-foreground')}>
                {v === 'month' ? 'This Month' : v === 'year' ? 'This Year' : 'Custom'}
              </button>
            ))}
          </div>
          {view === 'custom' && (
            <div className="flex items-center gap-1.5">
              <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-8 text-xs w-[130px]" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="h-8 text-xs w-[130px]" />
            </div>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">No data in this range.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              formatter={(value: number) => [`${formatValue(value)} ${valueLabel}`, 'Level']}
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e5e7eb' }}
            />
            <Area type="monotone" dataKey="level" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#trendFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
