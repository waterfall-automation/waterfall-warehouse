"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUsers } from '@/hooks/use-inventory-data';
import { parsePermissions, allPagesGranted, canAccessPage as canAccessPageImpl, pathToPageKey, PermData, isBroadAccessRole } from '@/lib/permissions';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users } = useUsers();
  const [devViewAsUserId, setDevViewAsUserIdState] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  const setDevViewAs = useCallback((userId: string | null) => {
    setDevViewAsUserIdState(userId);
    if (userId) localStorage.setItem('sicca_dev_view_as', userId);
    else localStorage.removeItem('sicca_dev_view_as');
  }, []);

  const performLogout = useCallback(async () => {
    const currentToken = localStorage.getItem('sicca_token') || token;
    localStorage.removeItem('sicca_token');
    localStorage.removeItem('sicca_user');
    localStorage.removeItem('sicca_dev_view_as');
    setToken(null);
    setLoggedInUser(null);
    setDevViewAsUserIdState(null);
    
    router.replace('/login');

    if (currentToken) {
      try {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout', token: currentToken }),
        });
      } catch (err) {
        console.error('Failed to notify backend of logout:', err);
      }
    }
  }, [token, router]);

  const logout = performLogout;

  useEffect(() => {
    // Restore dev-only override
    if (process.env.NODE_ENV !== 'production') {
      const storedDev = localStorage.getItem('sicca_dev_view_as');
      if (storedDev) setDevViewAsUserIdState(storedDev);

      // Dev-only session bootstrap (testing/automation): a synthetic session
      // with no backend validation. Same gating as the View As switcher;
      // dead code in production builds.
      if (localStorage.getItem('sicca_dev_session')) {
        setToken('dev-session');
        setLoggedInUser({ id: 'DEV', name: 'Dev Session', email: 'dev@local', role: 'Super Admin', department: '' });
        setLoading(false);
        return;
      }
    }

    // Restore real session
    const storedToken = localStorage.getItem('sicca_token');
    const storedUser = localStorage.getItem('sicca_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const u = JSON.parse(storedUser);
        setLoggedInUser(u);

        // Background validate token against the backend
        fetch(`/api/auth?action=validateToken&token=${encodeURIComponent(storedToken)}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.valid === false) {
              console.warn("Session expired or invalid, logging out...");
              performLogout();
            }
          })
          .catch(err => {
            console.error("Background token validation failed:", err);
          });
      } catch {
        setLoggedInUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  }, [performLogout]);

  const user = useMemo<AppUser | null>(() => {
    // If dev-only override is set, use that user if found
    if (process.env.NODE_ENV !== 'production' && devViewAsUserId) {
      const u = users.find((x: any) => x.User_ID === devViewAsUserId);
      if (u) {
        return {
          id: u.User_ID,
          name: u.Full_Name,
          email: u.Email,
          role: u.Role,
          department: u.Department,
          permissions: parsePermissions(u.Permissions),
          forceChange: u.Force_Change === 'YES',
        };
      }
    }

    if (!loggedInUser) return null;

    // Find the logged-in user in the loaded users sheet data to resolve permissions dynamically
    const u = users.find((x: any) => x.User_ID === loggedInUser.id || (x.Email && x.Email.toLowerCase() === loggedInUser.email.toLowerCase()));
    if (u) {
      return {
        id: u.User_ID,
        name: u.Full_Name,
        email: u.Email,
        role: u.Role,
        department: u.Department,
        permissions: parsePermissions(u.Permissions),
        forceChange: u.Force_Change === 'YES',
      };
    }

    // Fallback if the user is not in users list (or users list is loading)
    return {
      id: loggedInUser.id,
      name: loggedInUser.name,
      email: loggedInUser.email,
      role: loggedInUser.role,
      department: loggedInUser.department,
      forceChange: loggedInUser.forceChange,
      permissions: isBroadAccessRole(loggedInUser.role)
        ? { pages: allPagesGranted(), granular: {}, notifications: {} }
        : { pages: {}, granular: {}, notifications: {} }
    };
  }, [devViewAsUserId, loggedInUser, users]);

  // Route guarding
  useEffect(() => {
    if (loading) return;

    if (!token) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
    } else {
      if (pathname === '/login') {
        router.replace('/dashboard');
      }
    }
  }, [token, pathname, router, loading]);

  const pageKeyHere = pathname ? pathToPageKey(pathname) : null;
  const allowedHere = (user && pageKeyHere) ? canAccessPageImpl(user.role, user.permissions, pageKeyHere) : true;

  useEffect(() => {
    if (loading || !token) return;
    if (pageKeyHere && !allowedHere) {
      router.replace('/dashboard');
    }
  }, [pageKeyHere, allowedHere, router, loading, token]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`/api/auth?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (data && data.success) {
        localStorage.setItem('sicca_token', data.token);
        localStorage.setItem('sicca_user', JSON.stringify(data.user));
        setToken(data.token);
        setLoggedInUser(data.user);
        router.replace('/dashboard');
        return { success: true };
      } else {
        return { success: false, error: data?.error || 'Login failed.' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during login.' };
    }
  }, [router]);

  const canAccessPage = useCallback((pageKey: string) => {
    if (!user) return false;
    return canAccessPageImpl(user.role, user.permissions, pageKey);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, canAccessPage, devViewAsUserId, setDevViewAs }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
