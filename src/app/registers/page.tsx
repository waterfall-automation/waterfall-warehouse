"use client";
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function RegistersPage() {
  if (!PAGE_CONFIG.registers) return <UnderDevelopment pageName="Custom Registers" />;
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">Custom Registers</h1>
            <p className="text-muted-foreground">Build custom data registers for your workflow.</p>
          </div>
        </div>
        <Card className="border-none shadow-md">
          <CardContent className="p-8 text-center text-muted-foreground">
            Custom register builder coming soon.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
