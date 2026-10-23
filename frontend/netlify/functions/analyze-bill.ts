/**
 * Netlify Function: /.netlify/functions/analyze-bill
 * Gemini AI PDF/Image Utility Bill Extraction & Anomaly Analysis.
 *
 * Environment variables read at runtime from process.env:
 * - GEMINI_API_KEY
 * - GEMINI_API_KEY_BACKUP (optional)
 * - GEMINI_MODEL (optional, default: gemini-2.5-flash)
 */

const EXTRACT_PROMPT = `You are an information extraction system for Malaysian utility bills (TNB electricity and Air Selangor/Syabas water bills).

Read the uploaded bill image or document and extract the fields below.

Rules:
1. Extract only values that are visibly printed on the bill.
2. Do not calculate, estimate, or invent missing values.
3. Do not confuse current charges with total outstanding balance.
4. "Current Bill Amount" means charges for the current billing period, before previous balances or payments.
   - For TNB: Look for "Bil Anda Bulan ini / Bayaran Penuh" or "Caj Semasa" (e.g. 54.95 or 54.93).
   - For Air Selangor: Look for "Caj Semasa" or "Jumlah Caj Air Bulan Ini".
5. "Total Payable" means the final outstanding amount payable after applicable previous balances and payments.
   - Look for "Jumlah Perlu Dibayar" or "Sila Bayar". (Note: if previous credit/tunggakan covers the bill, this is 0.00).
6. Extract electricity consumption from the kWh field (look for "Kegunaan / Jumlah kWh"), or water consumption from the m³ field.
7. Read the billing month from the bill period (Tarikh Bil or Tempoh Bil) formatted as "YYYY-MM" (e.g. "2020-09").
8. Determine provider: "TNB" for electricity, "Air Selangor" for water.
9. If a field is unclear, return null rather than guessing.
10. Preserve the exact amount and field label as printed.

Return JSON only matching this exact schema:
{
  "billing_month": "YYYY-MM",
  "usage_kwh": null,
  "usage_m3": null,
  "current_bill_rm": null,
  "total_payable_rm": null,
  "previous_balance_rm": null,
  "bill_type": "electricity",
  "provider": "TNB",
  "confidence": "high",
  "evidence": {
    "current_bill_label": "",
    "total_payable_label": ""
  }
}`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PreviousBillItem {
  type: 'electricity' | 'water';
  billing_month: string;
  usage: number;
  amount: number;
}

export function detectBillAnomaly(
  current: { type: 'electricity' | 'water'; usage: number; amount: number; billingMonth: string },
  previousBills: PreviousBillItem[] = []
) {
  // Find most recent previous bill of same utility type
  const matchingPrevious = previousBills
    .filter((b) => b.type === current.type && b.billing_month !== current.billingMonth)
    .sort((a, b) => b.billing_month.localeCompare(a.billing_month));

  const prevBill = matchingPrevious[0] || null;

  let momChangePct = 0;
  if (prevBill && prevBill.usage > 0) {
    momChangePct = ((current.usage - prevBill.usage) / prevBill.usage) * 100;
  }

  let isAnomaly = false;
  let anomalyType: 'none' | 'leak_detected' | 'spike_detected' = 'none';
  let title = 'Normal consumption';
  let message = 'Consumption is steady and matches normal household usage.';
  let promptAction = 'No unusual activity detected.';

  if (current.type === 'water') {
    // Water anomaly threshold: >= 25% increase or significant volume spike
    if (momChangePct >= 25 || (prevBill && current.usage >= 25 && prevBill.usage < 18)) {
      isAnomaly = true;
      anomalyType = 'leak_detected';
      title = 'Unusual water usage detected';
      message = `Unusual water usage detected (+${Math.round(momChangePct)}% vs previous month). Please check for potential pipe leakages, leaking toilet cisterns, or outdoor taps.`;
      promptAction = 'Please check your household water fixtures and inspect your water meter when all taps are closed to verify for leaks.';
    }
  } else {
    // Electricity anomaly threshold: >= 20% increase
    if (momChangePct >= 20 || (prevBill && current.usage >= 400 && prevBill.usage < 300)) {
      isAnomaly = true;
      anomalyType = 'spike_detected';
      title = 'High electricity spike detected';
      message = `High electricity spike detected (+${Math.round(momChangePct)}% vs previous month). Please check if high-drain appliances (such as air conditioning, water heaters) or lights were accidentally left on.`;
      promptAction = 'Please check your household appliances, thermostat settings, and verify if cooling or heating appliances were left running continuously.';
    }
  }

  return {
    isAnomaly,
    anomalyType,
    momChangePct: Math.round(momChangePct),
    title,
    message,
    promptAction,
    previousBill: prevBill
      ? {
          billingMonth: prevBill.billing_month,
          usage: prevBill.usage,
          amount: prevBill.amount,
        }
      : null,
  };
}

type GeminiServerFailureCode =
  | 'quota'
  | 'invalid_key'
  | 'http_error'
  | 'network_error'
  | 'invalid_response';

class GeminiServerError extends Error {
  readonly status: number | null;
  readonly code: GeminiServerFailureCode;

  constructor(code: GeminiServerFailureCode, status: number | null = null) {
    super(status === null ? `Gemini request failed (${code})` : `Gemini request failed (${status}, ${code})`);
    this.name = 'GeminiServerError';
    this.status = status;
    this.code = code;
  }
}

function classifyFailure(status: number, responseBody: string): GeminiServerFailureCode {
  const normalized = responseBody.toLowerCase();
  if (status === 429 || normalized.includes('resource_exhausted') || normalized.includes('quota')) {
    return 'quota';
  }
  if (
    status === 401 ||
    normalized.includes('api_key_invalid') ||
    normalized.includes('api key not valid') ||
    normalized.includes('invalid api key') ||
    normalized.includes('unauthenticated')
  ) {
    return 'invalid_key';
  }
  return 'http_error';
}

async function requestGemini(options: {
  apiKey: string;
  backupApiKey?: string;
  model: string;
  body: unknown;
}): Promise<any> {
  const keys = [options.apiKey.trim(), options.backupApiKey?.trim() || '']
    .filter((key, index, all) => Boolean(key) && all.indexOf(key) === index);

  if (keys.length === 0) {
    throw new GeminiServerError('invalid_key');
  }

  const model = options.model.trim() || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  for (let index = 0; index < keys.length; index += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': keys[index],
        },
        body: JSON.stringify(options.body),
      });
    } catch {
      throw new GeminiServerError('network_error');
    }

    if (response.ok) {
      try {
        return await response.json();
      } catch {
        throw new GeminiServerError('invalid_response', response.status);
      }
    }

    const responseBody = await response.text().catch(() => '');
    const code = classifyFailure(response.status, responseBody);
    const canUseBackup =
      index === 0 &&
      keys.length > 1 &&
      (code === 'quota' || code === 'invalid_key');

    if (canUseBackup) {
      continue;
    }

    throw new GeminiServerError(code, response.status);
  }

  throw new GeminiServerError('http_error');
}

/**
 * Core Request handler for analyze-bill
 */
export async function handleAnalyzeBill(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    const geminiBackupApiKey = process.env.GEMINI_API_KEY_BACKUP || '';
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!geminiApiKey && !geminiBackupApiKey) {
      return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY environment variable' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    const { fileBase64, mimeType = 'application/pdf', previousBills = [] } = body;

    if (!fileBase64) {
      return new Response(JSON.stringify({ error: 'Missing fileBase64 parameter' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const cleanBase64 = fileBase64.replace(/^data:[a-zA-Z0-9+/.-]+;base64,/, '');

    const requestPayload = {
      contents: [
        {
          parts: [
            { text: EXTRACT_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    };

    const data = await requestGemini({
      apiKey: geminiApiKey,
      backupApiKey: geminiBackupApiKey,
      model: geminiModel,
      body: requestPayload,
    });

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    let extracted: any = null;

    if (text) {
      let jsonStr = text.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      }
      extracted = JSON.parse(jsonStr);
    }

    if (!extracted) {
      return new Response(
        JSON.stringify({
          error: 'Could not extract bill values with Gemini AI',
        }),
        { status: 422, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const billType: 'electricity' | 'water' =
      extracted.bill_type === 'water' ||
      extracted.billType === 'water' ||
      (extracted.provider || '').toLowerCase().includes('selangor')
        ? 'water'
        : 'electricity';

    const provider = extracted.provider || (billType === 'electricity' ? 'TNB' : 'Air Selangor');

    let usage = 0;
    if (typeof extracted.usage_kwh === 'number') {
      usage = extracted.usage_kwh;
    } else if (typeof extracted.usage_m3 === 'number') {
      usage = extracted.usage_m3;
    } else if (typeof extracted.usage === 'number') {
      usage = extracted.usage;
    }

    let amount = 0;
    if (typeof extracted.current_bill_rm === 'number') {
      amount = extracted.current_bill_rm;
    } else if (typeof extracted.total_payable_rm === 'number') {
      amount = extracted.total_payable_rm;
    } else if (typeof extracted.amount === 'number') {
      amount = extracted.amount;
    }

    const billingMonth = extracted.billing_month || extracted.billingMonth || '';

    // Run anomaly detection comparing against previous bills
    const anomaly = detectBillAnomaly(
      {
        type: billType,
        usage,
        amount,
        billingMonth,
      },
      previousBills
    );

    return new Response(
      JSON.stringify({
        extracted: {
          billType,
          provider,
          billingMonth,
          usage,
          amount,
          confidence: extracted.confidence === 'high' ? 0.95 : 0.85,
          currentBillRm: typeof extracted.current_bill_rm === 'number' ? extracted.current_bill_rm : null,
          totalPayableRm: typeof extracted.total_payable_rm === 'number' ? extracted.total_payable_rm : null,
          previousBalanceRm: typeof extracted.previous_balance_rm === 'number' ? extracted.previous_balance_rm : null,
        },
        anomaly,
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const safeError =
      err instanceof GeminiServerError
        ? { error: 'Gemini request failed', code: err.code, status: err.status }
        : { error: 'Bill analysis failed' };
    return new Response(JSON.stringify(safeError), {
      status: err instanceof GeminiServerError && err.status === 429 ? 429 : 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}

// Netlify Functions v2 (Default export Web Standard Request/Response)
export default async function (request: Request) {
  return handleAnalyzeBill(request);
}

// Netlify Functions v1 (Classic Lambda handler compatibility)
export const handler = async (event: any, context?: any) => {
  if (event.httpMethod && typeof event.body === 'string') {
    const url = `https://${event.headers?.host || 'localhost'}${event.path || ''}`;
    const req = new Request(url, {
      method: event.httpMethod,
      headers: event.headers,
      body: event.isBase64Encoded
        ? (typeof (globalThis as any).Buffer !== 'undefined'
            ? (globalThis as any).Buffer.from(event.body, 'base64').toString('utf-8')
            : atob(event.body))
        : event.body,
    });
    const res = await handleAnalyzeBill(req);
    return {
      statusCode: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: await res.text(),
    };
  }
  return handleAnalyzeBill(event as unknown as Request);
};
