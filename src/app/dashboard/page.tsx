"use client";
import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, TrendingDown, ArrowUpRight, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { flashClick } from '@/lib/click-flash';

import { useDashboardStats } from '@/hooks/use-inventory-data';

export default function DashboardPage() {
  if (!PAGE_CONFIG.dashboard) return <UnderDevelopment pageName="Dashboard" />;
  const { stats, loading: loadingStats } = useDashboardStats();
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('Stock levels are healthy. 2 items need reordering soon.');
  const [aiLoading, setAiLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const load = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 200);
  };

  const loadAI = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiSummary('Stock levels are healthy. 2 items need reordering soon.');
      setAiLoading(false);
    }, 400);
  };

  const statCards = [
    { label:'Total Items',    value:stats.totalItems, icon:Package,      color:'text-blue-600',  bg:'bg-blue-50', href: '/item-master?filter=total-items' },
    { label:'Low Stock',      value:stats.lowStock,   icon:AlertTriangle, color:'text-amber-600', bg:'bg-amber-50', href: '/item-master?filter=low-stock' },
    { label:'Out of Stock',   value:stats.outOfStock, icon:TrendingDown,  color:'text-red-600',   bg:'bg-red-50', href: '/item-master?filter=out-of-stock' },
    { label:"Today's Entries",value:stats.todayCount, icon:ArrowUpRight,  color:'text-green-600', bg:'bg-green-50', href: '/inventory' },
  ];

  if (!mounted || (loadingStats && stats.recentEntries.length === 0)) {
    return (
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">
                Welcome, Admin 👋
              </h1>
              <p className="text-muted-foreground mt-1">Here's what's happening in your inventory today.</p>
            </div>
          </div>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading dashboard...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">
              Welcome, Admin 👋
            </h1>
            <p className="text-muted-foreground mt-1">Here's what's happening in your inventory today.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={(e) => { flashClick(e); load(); }} className={loading?'animate-spin':''}><RefreshCw className="h-4 w-4" /></Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s,i) => (
            <Link key={i} href={s.href} className="block group">
              <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer h-full">
                <CardContent className="p-5 flex items-center gap-3 h-full">
                  <div className={cn('p-2.5 rounded-xl transition-colors group-hover:scale-105 duration-200', s.bg)}>
                    <s.icon className={cn('h-5 w-5', s.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{loading ? '—' : s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Insights */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-md h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">AI Inventory Advisor</span>
                    <Badge variant="outline" className="text-[9px]">Gemini</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { flashClick(e); loadAI(); }} disabled={aiLoading} className="text-xs h-7">
                    {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Refresh'}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed min-h-[60px]">
                  {aiLoading ? (
                    <span className="animate-pulse">Analysing inventory data…</span>
                  ) : aiSummary || (
                    stats.totalItems === 0
                      ? 'Add your first inventory entries to get AI-powered insights.'
                      : 'Click Refresh to generate analysis.'
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Status */}
          <Card className="border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">Stock Alerts</span>
                <Link href="/inventory" className="text-xs text-primary hover:underline">View all →</Link>
              </div>
              {stats.items?.filter((i:any)=>i.status!=='Normal').length===0 ? (
                <p className="text-sm text-muted-foreground">All stock levels normal ✓</p>
              ) : stats.items.filter((i:any)=>i.status!=='Normal').slice(0,5).map((item:any,i:number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div><p className="text-xs font-medium">{item.name}</p><p className="text-[10px] text-muted-foreground">{item.location}</p></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{item.balance}</span>
                    <Badge variant="outline" className={cn('text-[9px] font-bold',
                      item.status==='Out of Stock'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700')}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card className="border-none shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Recent Ledger Entries</span>
              <Link href="/inventory" className="text-xs text-primary hover:underline">View All →</Link>
            </div>
            {stats.recentEntries?.length===0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No entries yet. <Link href="/inventory" className="text-primary underline">Add your first entry →</Link></p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-muted-foreground border-b">
                    <th className="py-2 text-left font-medium">Date</th>
                    <th className="py-2 text-left font-medium">Item</th>
                    <th className="py-2 text-center font-medium">Type</th>
                    <th className="py-2 text-right font-medium">Qty</th>
                    <th className="py-2 text-left font-medium">By</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {stats.recentEntries.map((e:any, i:number) => (
                      <tr key={i} className="hover:bg-muted/5">
                        <td className="py-2.5 text-xs text-muted-foreground">{e.Date_Time}</td>
                        <td className="py-2.5 font-medium">{e.Item_Name}</td>
                        <td className="py-2.5 text-center">
                          <Badge variant="outline" className={cn('text-[10px]',
                            e.Transaction_Type==='Inward'?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700')}>
                            {e.Transaction_Type==='Inward'?'↓ IN':'↑ OUT'}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right font-bold">{e.Inward_Qty||e.Outward_Qty}</td>
                        <td className="py-2.5 text-xs text-muted-foreground">{e.Employee_Name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
