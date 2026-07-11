"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Package, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Both fields are required.'); return; }
    setLoading(true); setError('');
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed.');
      setLoading(false);
    }
    // On success, auth-context redirects to /dashboard automatically
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col w-[45%] bg-primary text-white p-12 justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Waterfall Warehouse</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Internal Functioning Portal
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Compliance-grade inventory management, GST reporting, and team coordination — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label:'Stock Register', desc:'30-column GST ledger' },
              { label:'Storage Map', desc:'Visual cupboard grid' },
              { label:'Role-Based Access', desc:'Granular permissions' },
              { label:'AI Insights', desc:'Gemini-powered advisor' },
            ].map((f, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-4">
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-white/60 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs">Sicca Automation India Pvt. Ltd. © {new Date().getFullYear()}</p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Waterfall Warehouse</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1 text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
              <Input
                id="email" type="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@sicca.com" className="h-11"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <div className="relative">
                <Input
                  id="password" type={showPass ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" className="h-11 pr-11"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Signing in…</>
              ) : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
