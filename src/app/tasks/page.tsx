"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, RefreshCw, ClipboardList, User, Calendar, Search } from 'lucide-react';
import { useTasks } from '@/hooks/use-inventory-data';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  const { tasks, updateTaskStatus, refresh, loading: loadingTasks } = useTasks();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'my' | 'all'>('my');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await refresh();
    setLoading(false);
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Done' ? 'Pending' : 'Done';
    const res = await updateTaskStatus(taskId, nextStatus);
    if (res.success) {
      toast({
        title: 'Task Updated',
        description: `Task marked as ${nextStatus.toLowerCase()}.`,
      });
    }
  };

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Tasks</h1>
              <p className="text-muted-foreground mt-1 font-sans">Loading your checklist...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Filter tasks based on user and selector
  const filteredTasks = tasks.filter(t => {
    // 1. User Filter
    if (filter === 'my' && user) {
      const matchId = String(t.Assigned_To_User_ID).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 
                      String(user.id).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (!matchId) return false;
    }
    
    // 2. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.Text.toLowerCase().includes(q) ||
        t.Created_By.toLowerCase().includes(q)
      );
    }
    
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Tasks</h1>
              <p className="text-muted-foreground mt-1 font-sans">
                Track notice-related action items assigned to you.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleRefresh} className={loading ? 'animate-spin' : ''}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilter('my')}
              className={cn(
                'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all',
                filter === 'my' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all',
                filter === 'all' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              All Tasks
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 h-9 border-gray-200 focus:border-blue-500 rounded-xl"
            />
          </div>
        </div>

        {/* Task Cards */}
        {(loading || (loadingTasks && tasks.length === 0)) ? (
          <div className="py-16 text-center text-muted-foreground"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />Loading…</div>
        ) : filteredTasks.length === 0 ? (
          <Card className="border border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <CardContent className="space-y-3 pt-6">
              <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto text-gray-400">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No tasks found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {filter === 'my'
                  ? "Great job! You have no pending action items assigned to your account."
                  : "No notices have tagged users to create action items yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredTasks.map(t => {
              const isDone = t.Status === 'Done';
              return (
                <Card
                  key={t.Task_ID}
                  className={cn(
                    'border-none shadow-sm transition-all duration-200 group relative',
                    isDone ? 'bg-gray-50/70 opacity-80' : 'bg-white hover:shadow-md'
                  )}
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleStatus(t.Task_ID, t.Status)}
                        className={cn(
                          'mt-0.5 rounded-full p-0.5 transition-colors focus:outline-none flex-shrink-0',
                          isDone ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-blue-600'
                        )}
                      >
                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>
                      <div className="min-w-0 space-y-1">
                        <p
                          className={cn(
                            'text-sm font-semibold text-gray-800 leading-snug break-words',
                            isDone && 'line-through text-gray-400 font-normal'
                          )}
                        >
                          {t.Text}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" /> By: {t.Created_By}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Assigned: {t.Created_On}
                          </span>
                          {filter === 'all' && (
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-mono text-[10px]">
                              User: {t.Assigned_To_User_ID}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end sm:justify-start">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider',
                          isDone
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        {t.Status || 'Pending'}
                      </Badge>
                      <Button
                        size="sm"
                        variant={isDone ? 'outline' : 'default'}
                        onClick={() => handleToggleStatus(t.Task_ID, t.Status)}
                        className={cn(
                          'h-8 text-xs font-semibold px-4 rounded-xl shadow-none',
                          isDone ? 'border-gray-200 hover:bg-gray-100 text-gray-600' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        )}
                      >
                        {isDone ? 'Mark Pending' : 'Mark Completed'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
