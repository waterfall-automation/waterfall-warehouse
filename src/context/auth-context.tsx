"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUsers } from '@/hooks/use-inventory-data';
import { parsePermissions, allPagesGranted, canAccessPage as canAccessPageImpl, pathToPageKey, PermData } from '@/lib/permissions';

export type AppUser = {
  id: string; name: string; email: string; role: string;
  department: string; forceChange?: boolean;
  permissions: PermData;
};

type AuthCtx = {
  user: AppUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  canAccessPage: (pageKey: string) => boolean;
  // Dev-only session override — swaps which real Users-sheet record the mock
  // session resolves to, so nav/route gating can be exercised against a real
  // restricted permission set without building real login. Not a real session.
  devViewAsUserId: string | null;
  setDevViewAs: (userId: string | null) => void;
};

const AuthContext = createContext<AuthCtx>({
  user: null, token: null,
  login: async () => ({ success: false }),
  logout: async () => {},
  loading: true,
  canAccessPage: () => false,
  devViewAsUserId: null,
  setDevViewAs: () => {},
});

const MOCK_ADMIN: AppUser = {
  id: 'USR001',
  name: 'Admin',
  email: 'admin@sicca.com',
  role: 'Super Admin',
  department: 'Admin',
  permissions: { pages: allPagesGranted(), granular: {}, notifications: {} },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users } = useUsers();
  const [devViewAsUserId, setDevViewAsUserIdState] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>('mock_token');
  const [loading, setLoading] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Dev-only override; never honor the stored value in a production build.
    if (process.env.NODE_ENV === 'production') return;
    const stored = localStorage.getItem('sicca_dev_view_as');
    if (stored) setDevViewAsUserIdState(stored);
  }, []);

  const setDevViewAs = useCallback((userId: string | null) => {
    setDevViewAsUserIdState(userId);
    if (userId) localStorage.setItem('sicca_dev_view_as', userId);
    else localStorage.removeItem('sicca_dev_view_as');
  }, []);

  const user: AppUser = useMemo(() => {
    if (devViewAsUserId) {
      const u = users.find((x: any) => x.User_ID === devViewAsUserId);
      if (u) {
        return {
          id: u.User_ID, name: u.Full_Name, email: u.Email, role: u.Role,
          department: u.Department, permissions: parsePermissions(u.Permissions),
        };
      }
    }
    return MOCK_ADMIN;
  }, [devViewAsUserId, users]);

  // Redirect to dashboard if trying to access login
  useEffect(() => {
    if (pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  // Shared route guard: redirects away from any page the current (mock or
  // dev-view-as) user isn't permitted to see. Lives here, once, rather than
  // copy-pasted into every page component. Depends on the resolved boolean,
  // not the whole `user` object, so it doesn't re-fire on every re-render
  // just because `users` got a new array reference from polling.
  const pageKeyHere = pathToPageKey(pathname);
  const allowedHere = pageKeyHere ? canAccessPageImpl(user.role, user.permissions, pageKeyHere) : true;
  useEffect(() => {
    if (pageKeyHere && !allowedHere) {
      router.replace('/dashboard');
    }
  }, [pageKeyHere, allowedHere, router]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('sicca_current_user', JSON.stringify(user));
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    // No-op or keep at dashboard
    router.replace('/dashboard');
  }, [router]);

  const canAccessPage = useCallback((pageKey: string) => {
    return canAccessPageImpl(user.role, user.permissions, pageKey);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, canAccessPage, devViewAsUserId, setDevViewAs }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
