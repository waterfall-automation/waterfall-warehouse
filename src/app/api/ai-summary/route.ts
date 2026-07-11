import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}

  const { items = [], recentEntries = [] } = body;

  const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
  if (!GEMINI_KEY) {
    return NextResponse.json({ summary: 'AI advisor offline. Add GEMINI_API_KEY to .env.local to enable Gemini insights.' });
  }

  const low  = items.filter((i: any) => i.status === 'Low').map((i: any) => i.name).join(', ');
  const out  = items.filter((i: any) => i.status === 'Out of Stock').map((i: any) => i.name).join(', ');
  const recent = recentEntries.slice(0, 5).map((e: any) =>
    `${e.Date_Time}: ${e.Transaction_Type} — ${e.Item_Name} × ${e.Inward_Qty || e.Outward_Qty}`).join('\n');

  const prompt = `You are an inventory management advisor for an Indian manufacturing/automation company. 
Analyse the following inventory data and give a short, practical 2-3 sentence executive summary with specific actionable recommendations.

Total items: ${items.length}
Low stock items: ${low || 'None'}
Out of stock items: ${out || 'None'}
Recent activity:\n${recent || 'No recent entries'}

Be concise, direct, and mention specific items by name if critical. Use Indian business context.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await res.json();
    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate analysis.';
    return NextResponse.json({ summary });
  } catch (e: any) {
    return NextResponse.json({ summary: 'AI analysis failed: ' + e.message });
  }
}
