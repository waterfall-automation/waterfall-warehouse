"use client";
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReceiptText, Download, RefreshCw } from 'lucide-react';
import { useGstSummary, useInventoryEntries, useItemMaster } from '@/hooks/use-inventory-data';
import { InventoryTrendGraph } from '@/components/shared/inventory-trend-graph';

const fmt = (n: number) => '₹' + (n||0).toLocaleString('en-IN', { minimumFractionDigits:2 });

export default function GstSummaryPage() {
  if (!PAGE_CONFIG.gstSummary) return <UnderDevelopment pageName="GST Summary" />;
  const { byRate, summary, loading: loadingGst } = useGstSummary();
  const { entries } = useInventoryEntries();
  const { items: catalogItems } = useItemMaster();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 200);
  };

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center shadow-lg">
                <ReceiptText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Taxation Ledger</h1>
                <p className="text-muted-foreground mt-1">GST summary across all inward transactions.</p>
              </div>
            </div>
          </div>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading taxation ledger...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center shadow-lg">
              <ReceiptText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Taxation Ledger</h1>
              <p className="text-muted-foreground mt-1">GST summary across all inward transactions.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={load} className={loading?'animate-spin':''}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}><Download className="h-4 w-4" /> Export</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Total Taxable Value', value: fmt(summary.totalTaxable) },
            { label:'Total CGST', value: fmt(summary.totalCGST) },
            { label:'Total SGST', value: fmt(summary.totalSGST) },
            { label:'Total Invoice Value', value: fmt(summary.totalInvoice) },
          ].map((s,i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className="text-xl font-bold text-primary mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <InventoryTrendGraph
          entries={entries.filter(e => e.Transaction_Type === 'Inward')}
          items={catalogItems.filter(i => i.Status !== 'Deleted').map(i => ({ code: i.Item_Code, name: i.Item_Name }))}
          title="GST Paid/Accrued Over Time"
          valueLabel=""
          formatValue={(n) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          getIn={(e) => {
            const qty = parseFloat(e.Inward_Qty || '0');
            const price = parseFloat(e.Price_Per_Item || '0');
            const rate = parseFloat(e.GST_Rate || '0');
            return (qty * price * rate) / 100;
          }}
          getOut={() => 0}
        />

        <Card className="border-none shadow-md">
          <CardHeader className="border-b"><CardTitle className="text-lg">GST Rate-wise Breakup</CardTitle></CardHeader>
          <CardContent className="p-0">
            {(loading || (loadingGst && byRate.length === 0)) ? (
              <div className="py-12 text-center text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Loading…</div>
            ) : byRate.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No GST data yet. Add inward entries with price and GST rate to see the summary.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left">GST Rate</th>
                      <th className="px-5 py-3 text-right">Entries</th>
                      <th className="px-5 py-3 text-right">Taxable Value</th>
                      <th className="px-5 py-3 text-right">CGST</th>
                      <th className="px-5 py-3 text-right">SGST</th>
                      <th className="px-5 py-3 text-right">Total Invoice Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {byRate.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/5">
                        <td className="px-5 py-4"><Badge variant="outline" className="font-bold text-xs">{row.rate}%</Badge></td>
                        <td className="px-5 py-4 text-right text-muted-foreground">{row.count||0}</td>
                        <td className="px-5 py-4 text-right font-medium">{fmt(row.taxable)}</td>
                        <td className="px-5 py-4 text-right">{fmt(row.cgst)}</td>
                        <td className="px-5 py-4 text-right">{fmt(row.sgst)}</td>
                        <td className="px-5 py-4 text-right font-bold text-primary">{fmt(row.invoice)}</td>
                      </tr>
                    ))}
                    <tr className="bg-primary/5 font-bold border-t-2">
                      <td className="px-5 py-4 text-primary">TOTAL</td>
                      <td className="px-5 py-4 text-right">{byRate.reduce((a,r)=>a+(r.count||0),0)}</td>
                      <td className="px-5 py-4 text-right">{fmt(summary.totalTaxable)}</td>
                      <td className="px-5 py-4 text-right">{fmt(summary.totalCGST)}</td>
                      <td className="px-5 py-4 text-right">{fmt(summary.totalSGST)}</td>
                      <td className="px-5 py-4 text-right text-primary">{fmt(summary.totalInvoice)}</td>
                    </tr>
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
