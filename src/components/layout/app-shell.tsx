"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, Map as MapIcon, Users, ClipboardList,
  Settings, Bell, LogOut, ShieldCheck, Megaphone, History,
  Trash2, ReceiptText, Menu, X, ChevronRight, Box, Building2,
  AlertTriangle, CheckCircle, Info, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { flashClick } from "@/lib/click-flash";
import { useAuth } from "@/context/auth-context";
import { useUsers } from "@/hooks/use-inventory-data";

const navItems = [
  { label: "Dashboard",    icon: LayoutDashboard, href: "/dashboard",     pageKey: "dashboard" },
  { label: "Stock Register",icon: Package,        href: "/inventory",    pageKey: "inventory" },
  { label: "Invoices",     icon: FileText,        href: "/invoices",     pageKey: "invoices" },
  { label: "Storage Map",  icon: MapIcon,         href: "/inventory-map",pageKey: "inventoryMap" },
  { label: "Item Master",  icon: Box,             href: "/item-master",  pageKey: "itemMaster" },
  { label: "Vendors",      icon: Building2,       href: "/vendors",      pageKey: "vendors" },
  { label: "GST Summary",  icon: ReceiptText,     href: "/gst-summary",  pageKey: "gstSummary" },
  { label: "Notice Board", icon: Megaphone,       href: "/notice-board", pageKey: "noticeBoard" },
  { label: "Tasks",        icon: ClipboardList,   href: "/tasks",        pageKey: "tasks" },
  { label: "Users",        icon: Users,           href: "/users",        pageKey: "users" },
  { label: "Roles",        icon: ShieldCheck,     href: "/roles",        pageKey: "roles" },
  { label: "Registers",    icon: ClipboardList,   href: "/registers",    pageKey: "registers" },
  { label: "Activity Log", icon: History,         href: "/activity-log",pageKey: "activityLog" },
  { label: "Recycle Bin",  icon: Trash2,          href: "/recycle-bin", pageKey: "recycleBin" },
  { label: "Settings",     icon: Settings,        href: "/settings",    pageKey: "settings" },
];

type Notification = { id: string; type: 'warning' | 'info' | 'success'; message: string; time: string };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, token, logout, loading, canAccessPage, devViewAsUserId, setDevViewAs } = useAuth();
  const { users: allUsers } = useUsers();
  const visibleNavItems = navItems.filter(item => canAccessPage(item.pageKey));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  // Load low-stock notifications
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sicca_item_summary');
      // If not present in localStorage, fallback to an empty array
      const items = stored ? JSON.parse(stored) : [];
      const notifs: Notification[] = [];
      items.filter((i: any) => i.status !== 'Normal').slice(0, 5).forEach((i: any) => {
        notifs.push({
          id: i.code || i.name,
          type: i.status === 'Out of Stock' ? 'warning' : 'info',
          message: `${i.name}: ${i.status} (Qty: ${i.balance})`,
          time: 'Now'
        });
      });
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch {}
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground animate-pulse">Loading…</div>
    </div>;
  }

  const SidebarContent = () => (
    <>
      <div className="p-5 flex items-center gap-3 border-b border-sidebar-border/30">
        <div className="h-8 w-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
          <Package className="text-primary-foreground h-5 w-5" />
        </div>
        <span className="font-bold text-lg tracking-tight text-sidebar-foreground">Waterfall Warehouse</span>
      </div>

      <ScrollArea className="flex-1">
        <nav className="px-3 py-3 space-y-0.5">
          {visibleNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                onClick={(e) => { flashClick(e); setSidebarOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  active
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-sidebar-foreground/65 hover:bg-white/8 hover:text-sidebar-foreground"
                )}>
                <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground")} />
                <span>{item.label}</span>
                {active && <ChevronRight className="ml-auto h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {process.env.NODE_ENV !== 'production' && (
        <div className="px-4 pb-2">
          <label className="text-[9px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
            Dev: View As (testing only)
          </label>
          <select
            value={devViewAsUserId || ''}
            onChange={e => setDevViewAs(e.target.value || null)}
            className="mt-1 w-full h-7 text-[10px] rounded-md border border-dashed border-sidebar-foreground/25 bg-sidebar-accent/30 text-sidebar-foreground px-1.5"
          >
            <option value="">Super Admin (default)</option>
            {allUsers.map(u => (
              <option key={u.User_ID} value={u.User_ID}>{u.Full_Name} — {u.Role}</option>
            ))}
          </select>
        </div>
      )}

      <div className="p-4 border-t border-sidebar-border/20">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Avatar className="h-8 w-8 bg-primary-foreground/10 border border-white/10">
            <AvatarFallback className="bg-transparent text-white text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.role}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-sidebar-foreground/50 hover:text-white hover:bg-white/10"
            onClick={logout} title="Logout">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] flex flex-col bg-sidebar text-sidebar-foreground shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Topbar */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0 z-20 shadow-sm gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu onOpenChange={open => { if (open) setUnreadCount(0); }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Stock Alerts</span>
                  <Link href="/inventory" className="text-xs text-primary font-normal">View all →</Link>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">All stock levels OK ✓</div>
                ) : notifications.map(n => (
                  <DropdownMenuItem key={n.id} className="flex items-start gap-2.5 py-2.5 cursor-default">
                    {n.type === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                      : <Info className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />}
                    <span className="text-xs leading-tight">{n.message}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 gap-2 px-2 rounded-full">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary text-white text-[10px] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium hidden sm:inline">{user?.name?.split(' ')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="text-[9px] mt-1">{user?.role}</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer gap-2 flex items-center">
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer gap-2">
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
