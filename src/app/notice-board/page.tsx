"use client";
import { PAGE_CONFIG } from '@/config/pages';
import { UnderDevelopment } from '@/components/under-development';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Plus, Calendar, User, RefreshCw } from 'lucide-react';
import { useNoticeBoard, useUsers } from '@/hooks/use-inventory-data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-l-red-500 bg-red-50',
  important: 'border-l-amber-500 bg-amber-50',
  info: 'border-l-blue-400 bg-blue-50',
};
const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  important: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
};

export default function NoticeBoardPage() {
  const { notices, addNotice, loading: loadingNotices } = useNoticeBoard();
  const { users } = useUsers();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isDemo] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', content:'', priority:'info', expiry:'' });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFormDirty = () => {
    return form.title !== '' || form.content !== '' || selectedUsers.length > 0;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 200);
  };

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.content.trim()) errs.content = 'Content is required.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await addNotice({ ...form, author: 'Admin', taggedUsers: selectedUsers });
      setShowModal(false);
      setForm({ title:'', content:'', priority:'info', expiry:'' });
      setSelectedUsers([]);
      setErrors({});
    } catch {
      toast({ title: 'Error', description: 'Failed to post notice.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Notice Board</h1>
                <p className="text-muted-foreground mt-1">Broadcast system announcements and priorities.</p>
              </div>
            </div>
          </div>
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading announcements...
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
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Notice Board</h1>
              <p className="text-muted-foreground mt-1">
                Centralized internal announcements.
                {isDemo && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Demo data</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={load} className={loading?'animate-spin':''}><RefreshCw className="h-4 w-4" /></Button>
            <Button onClick={() => { setSelectedUsers([]); setErrors({}); setShowModal(true); }} className="gap-2"><Plus className="h-4 w-4" /> Post Notice</Button>
          </div>
        </div>

        {(loading || (loadingNotices && notices.length === 0)) ? (
          <div className="py-16 text-center text-muted-foreground"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />Loading…</div>
        ) : (
          <div className="space-y-4">
            {notices.map((n: any) => (
              <Card key={n.Notice_ID} className={cn('border-none shadow-md border-l-4', PRIORITY_STYLES[n.Priority] || PRIORITY_STYLES.info)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-bold">{n.Title}</CardTitle>
                    <Badge className={cn('text-[10px] font-bold capitalize flex-shrink-0', PRIORITY_BADGE[n.Priority] || PRIORITY_BADGE.info)}>
                      {n.Priority}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-3 text-xs mt-1">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{n.Posted_By}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{n.Date_Time}</span>
                    {n.Expiry && <span className="text-muted-foreground">Expires: {n.Expiry}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed">{n.Content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg" preventClose={isFormDirty()}>
          <DialogHeader><DialogTitle>Post New Notice</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input 
                value={form.title} 
                onChange={e => {
                  setForm(f => ({ ...f, title: e.target.value }));
                  if (errors.title) setErrors(err => ({ ...err, title: '' }));
                }} 
                placeholder="Notice title" 
                className={cn("mt-1", errors.title && "border-red-500 text-red-600 focus-visible:ring-red-500")} 
              />
              {errors.title && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.title}</p>}
            </div>
            <div>
              <Label>Content *</Label>
              <textarea 
                value={form.content} 
                onChange={e => {
                  setForm(f => ({ ...f, content: e.target.value }));
                  if (errors.content) setErrors(err => ({ ...err, content: '' }));
                }}
                placeholder="Notice details…" 
                rows={4}
                className={cn(
                  "mt-1 w-full border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-white",
                  errors.content && "border-red-500 text-red-600 focus-visible:ring-red-500"
                )} 
              />
              {errors.content && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.content}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v=>setForm(f=>({...f,priority:v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Expiry Date</Label><Input value={form.expiry} onChange={e=>setForm(f=>({...f,expiry:e.target.value}))} placeholder="DD-MM-YYYY" className="mt-1" /></div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Tag Users (Assign Tasks)</Label>
              <div className="mt-1.5 border rounded-xl p-2.5 max-h-32 overflow-y-auto space-y-2 bg-gray-50/50">
                {users && users.filter((u: any) => u.Status === 'Active').map((user: any) => {
                  const isChecked = selectedUsers.includes(user.User_ID);
                  return (
                    <label key={user.User_ID} className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:bg-white p-1 rounded-lg border border-transparent hover:border-gray-200 transition-all text-gray-800">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedUsers(prev => prev.filter(id => id !== user.User_ID));
                          } else {
                            setSelectedUsers(prev => [...prev, user.User_ID]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>{user.Full_Name} <span className="text-[10px] text-gray-400 font-normal">({user.Role})</span></span>
                    </label>
                  );
                })}
                {(!users || users.filter((u: any) => u.Status === 'Active').length === 0) && (
                  <p className="text-xs text-gray-400 italic text-center py-2">No active users available to tag.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving?'Posting…':'Post Notice'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
