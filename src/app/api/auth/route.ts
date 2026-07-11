export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

const APPS_URL = process.env.NEXT_PUBLIC_SHEETS_API_URL || '';

const DEMO_USER = {
  id: 'USR-001', name: 'Admin User', email: 'admin@sicca.com',
  role: 'Super Admin', department: 'Admin Office', forceChange: false,
};

function isRealAppsScript() {
  return APPS_URL && !APPS_URL.includes('YOUR_DEPLOYMENT_ID');
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

  // Fallback
  if (action === 'login') {
    return NextResponse.json({ success: false, error: 'Invalid credentials. Use admin@sicca.com / Admin@1234' });
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
