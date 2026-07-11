"use client";
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, Globe, Bell, Shield, Database, KeyRound, Loader2, CheckCircle } from 'lucide-react';
import { useSettings } from '@/hooks/use-inventory-data';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, saveSettings, changePassword: changePasswordHook } = useSettings();

  // General settings
  const [org, setOrg] = useState({
    orgName: settings?.orgName || 'Sicca Automation India Pvt Ltd',
    gstNo: settings?.gstNo || '27AAACS1234A1Z5',
    address: settings?.address || 'Sector-A, Industrial Estate, Pune, MH',
    phone: settings?.phone || '',
    email: settings?.email || ''
  });
  // Notification settings
  const [notif, setNotif] = useState({
    lowStockEmail: settings?.lowStockEmail === 'true',
    weeklyDigest: settings?.weeklyDigest === 'true',
    outwardAlert: settings?.outwardAlert === 'true'
  });
  // Security settings
  const [security, setSecurity] = useState({ sessionTimeout: true, forcePasswordChange: false });
  // Apps Script URL
  const [appsUrl, setAppsUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });

  // Sync state if settings change
  useEffect(() => {
    if (settings) {
      setOrg({
        orgName: settings.orgName || '',
        gstNo: settings.gstNo || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || ''
      });
      setNotif({
        lowStockEmail: settings.lowStockEmail === 'true',
        weeklyDigest: settings.weeklyDigest === 'true',
        outwardAlert: settings.outwardAlert === 'true'
      });
    }
  }, [settings]);

  const saveGeneral = async () => {
    setSaving(true);
    try {
      saveSettings({ orgName: org.orgName, gstin: org.gstNo, address: org.address, phone: org.phone, email: org.email });
    } catch {
      toast({ title: 'Error', description: 'Could not save.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      saveSettings({ lowStockEmail: String(notif.lowStockEmail), weeklyDigest: String(notif.weeklyDigest), outwardAlert: String(notif.outwardAlert) });
    } catch {
      toast({ title: 'Error', description: 'Could not save.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast({ title: 'Required', description: 'All fields required.', variant: 'destructive' }); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast({ title: 'Mismatch', description: 'New passwords do not match.', variant: 'destructive' }); return; }
    if (pwForm.newPassword.length < 8) { toast({ title: 'Too short', description: 'Password must be at least 8 characters.', variant: 'destructive' }); return; }
    setSavingPass(true);
    try {
      const res = changePasswordHook({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      if (res && res.success) {
        toast({ title: '✓ Password Changed', description: 'Your password has been updated.' });
        setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      } else {
        toast({ title: 'Error', description: 'Failed to change password.', variant: 'destructive' });
      }
    } catch { toast({ title: 'Error', description: 'Network error.', variant: 'destructive' }); }
    finally { setSavingPass(false); }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">System Config</h1>
            <p className="text-muted-foreground mt-1">Global preferences and organisation settings.</p>
          </div>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="bg-card border w-full justify-start p-1 h-11">
            <TabsTrigger value="general"  className="gap-2 text-xs"><Globe className="h-3.5 w-3.5"/>General</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 text-xs"><Bell className="h-3.5 w-3.5"/>Notifications</TabsTrigger>
            <TabsTrigger value="security" className="gap-2 text-xs"><Shield className="h-3.5 w-3.5"/>Security</TabsTrigger>
            <TabsTrigger value="connection" className="gap-2 text-xs"><Database className="h-3.5 w-3.5"/>Connection</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="mt-5 space-y-5">
            <Card className="border-none shadow-md">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4"/>Organisation Details</CardTitle>
                <CardDescription>Company profile shown on reports and exports.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Organisation Name</Label><Input value={org.orgName} onChange={e=>setOrg(o=>({...o,orgName:e.target.value}))} className="mt-1" /></div>
                  <div><Label>GST Identification No.</Label><Input value={org.gstNo} onChange={e=>setOrg(o=>({...o,gstNo:e.target.value}))} className="mt-1 font-mono" /></div>
                </div>
                <div><Label>Registered Address</Label><Input value={org.address} onChange={e=>setOrg(o=>({...o,address:e.target.value}))} className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Phone</Label><Input value={org.phone} onChange={e=>setOrg(o=>({...o,phone:e.target.value}))} placeholder="+91 XXXXX XXXXX" className="mt-1" /></div>
                  <div><Label>Email</Label><Input type="email" value={org.email} onChange={e=>setOrg(o=>({...o,email:e.target.value}))} placeholder="info@company.com" className="mt-1" /></div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={saveGeneral} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="mt-5">
            <Card className="border-none shadow-md">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4"/>Alert Preferences</CardTitle>
                <CardDescription>Control when you receive system alerts.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                {[
                  { key:'lowStockEmail',  label:'Low Stock Email Alerts',     desc:'Email when items fall below reorder level' },
                  { key:'weeklyDigest',   label:'Weekly Inventory Digest',    desc:'Consolidated report every Monday morning' },
                  { key:'outwardAlert',   label:'Outward Issue Notifications', desc:'Notify when items are issued from stock' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={(notif as any)[item.key]} onCheckedChange={v => setNotif(n=>({...n,[item.key]:v}))} />
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button onClick={saveNotifications} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="mt-5 space-y-5">
            <Card className="border-none shadow-md">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4"/>Access Security</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {[
                  { key:'sessionTimeout',       label:'Auto Session Timeout',       desc:'Log out users after 8 hours of inactivity' },
                  { key:'forcePasswordChange',  label:'Force Password Change',       desc:'Require new users to change password on first login' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={(security as any)[item.key]} onCheckedChange={v => setSecurity(s=>({...s,[item.key]:v}))} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="border-none shadow-md">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4"/>Change Your Password</CardTitle>
                <CardDescription>Logged in as <strong>{user?.email}</strong></CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Current Password</Label><Input type="password" value={pwForm.currentPassword} onChange={e=>setPwForm(p=>({...p,currentPassword:e.target.value}))} className="mt-1 max-w-sm" /></div>
                <div><Label>New Password</Label><Input type="password" value={pwForm.newPassword} onChange={e=>setPwForm(p=>({...p,newPassword:e.target.value}))} className="mt-1 max-w-sm" placeholder="Min 8 characters" /></div>
                <div><Label>Confirm New Password</Label><Input type="password" value={pwForm.confirmPassword} onChange={e=>setPwForm(p=>({...p,confirmPassword:e.target.value}))} className="mt-1 max-w-sm" /></div>
                <Button onClick={changePassword} disabled={savingPass} variant="outline" className="gap-2">
                  {savingPass ? <Loader2 className="h-4 w-4 animate-spin"/> : <KeyRound className="h-4 w-4"/>}
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connection */}
          <TabsContent value="connection" className="mt-5">
            <Card className="border-none shadow-md">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4"/>Google Apps Script Connection</CardTitle>
                <CardDescription>This is where all data is stored and read from.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <div className="bg-muted/50 rounded-xl p-5 border space-y-4 text-sm">
                  <p className="font-bold">How to connect your Google Sheet:</p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-xs leading-relaxed">
                    <li>Open your Google Sheet → <strong>Extensions → Apps Script</strong></li>
                    <li>Paste all 4 files from the <code className="bg-muted px-1 rounded">apps-script/</code> folder in this project</li>
                    <li>Run <code className="bg-muted px-1 rounded">initialSetup()</code> once from the editor — it creates all sheet tabs and a default admin user</li>
                    <li><strong>Deploy → New deployment → Web app</strong><br />Execute as: <em>Me</em> · Who has access: <em>Anyone</em></li>
                    <li>Copy the Web App URL and paste it in <code className="bg-muted px-1 rounded">.env.local</code>:</li>
                  </ol>
                  <div className="bg-black text-green-400 rounded-lg p-3 font-mono text-xs">
                    APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
                  </div>
                  <p className="text-xs text-muted-foreground">After adding the URL, restart the dev server (<code>npm run dev</code>) for it to take effect.</p>
                </div>

                <div>
                  <Label>Default Login (after initialSetup)</Label>
                  <div className="bg-muted/40 rounded-lg p-3 font-mono text-xs mt-2 space-y-1">
                    <p>Email: <span className="text-primary">admin@sicca.com</span></p>
                    <p>Password: <span className="text-primary">Admin@1234</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
