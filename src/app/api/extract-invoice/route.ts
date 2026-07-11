import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const { image } = body;
  if (!image) {
    return NextResponse.json({ success: false, error: 'Missing image data.' }, { status: 400 });
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
  if (!GEMINI_KEY) {
    return NextResponse.json({ success: false, error: 'Gemini API key is not configured on the server.' }, { status: 500 });
  }

  // Extract base64 content and mimeType
  let base64Data = image;
  let mimeType = 'image/jpeg';
  const dataUrlRegex = /^data:(image\/[a-zA-Z+.-]+);base64,/;
  const match = image.match(dataUrlRegex);
  if (match) {
    mimeType = match[1];
    base64Data = image.split(';base64,')[1];
  }

  const prompt = `Analyze the attached invoice image. Extract the following fields as a JSON object:
- invoiceNo (string, the invoice number or reference number, or empty string if not found)
- vendorName (string, the name of the selling vendor/company, or empty string if not found)
- date (string, the invoice date formatted as DD-MM-YYYY, or empty string if not found)
- employeeName (string, name of the purchaser or person who received the goods, or empty string if not found)
- totalValue (number, the final total invoice amount including taxes, or 0 if not found)
- items (array of objects, representing line items in the invoice, or empty array if not readable/not present. Each object must have):
  * itemName (string, the name or description of the item)
  * itemCode (string, the item code / code / SKU / part number if listed in the invoice, or empty string if not found)
  * qty (number, quantity purchased)
  * price (number, unit price/rate per item before tax/discount)
  * gstRate (number, GST tax rate percentage if listed, e.g. 18 for 18%, default to 18 if not found)
  * discountPct (number, discount percentage if listed, default to 0)
  * remarks (string, line-specific remarks/notes if any, default to empty string)

Return ONLY the JSON object, matching the specified fields.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await res.json();
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return NextResponse.json({ success: false, error: 'No data returned from Gemini OCR.' }, { status: 500 });
    }

    const parsedData = JSON.parse(textResponse);
    return NextResponse.json({ success: true, data: parsedData });
  } catch (e: any) {
    console.error('Gemini OCR extraction failed:', e);
    return NextResponse.json({ success: false, error: 'OCR extraction failed: ' + e.message }, { status: 500 });
  }
}
