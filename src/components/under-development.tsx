import { AppShell } from '@/components/layout/app-shell';
import { Construction } from 'lucide-react';

export function UnderDevelopment({ pageName }: { pageName: string }) {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="h-20 w-20 rounded-3xl bg-amber-100 flex items-center justify-center">
          <Construction className="h-10 w-10 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary">{pageName}</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            This page is currently under development.<br />
            It will be available in a future update.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-3 text-sm text-amber-700 font-medium">
          🚧 Coming Soon
        </div>
        <a href="/dashboard" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 mt-2">
          Return to Dashboard
        </a>
      </div>
    </AppShell>
  );
}
