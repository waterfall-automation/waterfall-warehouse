export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';

const APPS_URL = process.env.NEXT_PUBLIC_SHEETS_API_URL || '';
const DATA_FILE = process.env.DATA_FILE_PATH || join(tmpdir(), 'siccasync-data.json');

const DEMO_USER = {
  id: 'USR-001', name: 'Admin User', email: 'admin@sicca.com',
  role: 'Super Admin', department: 'Admin Office', forceChange: false,
};

function isRealAppsScript() {
  return APPS_URL && !APPS_URL.includes('YOUR_DEPLOYMENT_ID');
}

function loadLocalUsers(): any[] {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      if (raw?.trim()) {
        const store = JSON.parse(raw);
        return store.users || [];
      }
    }
  } catch (e) {
    console.error('Failed to load local users:', e);
  }
  return [];
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function proxyGet(params: Record<string, string>) {
  const url = new URL(APPS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { cache: 'no-store', redirect: 'follow' });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { throw new Error('Apps Script returned non-JSON: ' + text.slice(0, 200)); }
}

async function proxyPost(body: object) {
  const res = await fetch(APPS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'follow',
  });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { throw new Error('Apps Script returned non-JSON: ' + text.slice(0, 200)); }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || '';
  const email  = (searchParams.get('email') || '').trim().toLowerCase();
  const pass   = (searchParams.get('password') || '').trim();

  // Demo admin always works — regardless of Apps Script
  if (action === 'login' && email === 'admin@sicca.com' && pass === 'Admin@1234') {
    return NextResponse.json({
      success: true,
      token: 'demo-admin-token',   // constant token so sheets API recognizes it
      user: DEMO_USER,
    });
  }

  // If real Apps Script is configured, try it for other users
  if (isRealAppsScript()) {
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => { params[k] = v; });
    try {
      const data = await proxyGet(params);
      return NextResponse.json(data);
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message });
    }
  }

  // Fallback (when Apps Script is NOT configured)
  if (action === 'login') {
    const users = loadLocalUsers();
    const user = users.find((u: any) => (u.Email || '').toLowerCase() === email);
    if (user) {
      const hashed = hashPassword(pass);
      if (user.Password_Hash === hashed) {
        return NextResponse.json({
          success: true,
          token: `local-token-${user.User_ID}`,
          user: {
            id: user.User_ID,
            name: user.Display_Name || user.Full_Name,
            email: user.Email,
            role: user.Role,
            department: user.Department,
            forceChange: user.Force_Change === 'YES',
          }
        });
      } else {
        return NextResponse.json({ success: false, error: 'Incorrect password.' });
      }
    }
    return NextResponse.json({ success: false, error: 'Invalid credentials. Use admin@sicca.com / Admin@1234' });
  }

  if (action === 'validateToken') {
    const token = searchParams.get('token') || '';
    if (token === 'demo-admin-token') {
      return NextResponse.json({ valid: true });
    }
    if (token.startsWith('local-token-')) {
      const userId = token.replace('local-token-', '');
      const users = loadLocalUsers();
      const userExists = users.some((u: any) => u.User_ID === userId);
      return NextResponse.json({ valid: userExists });
    }
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  if (isRealAppsScript()) {
    try {
      const data = await proxyPost(body);
      return NextResponse.json(data);
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message });
    }
  }

  return NextResponse.json({ success: true });
}
