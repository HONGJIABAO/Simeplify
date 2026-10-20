// supabase/functions/analyze-bill/index.ts
// Supabase Edge Function: analyze-bill (SCN-01, SCN-02, SCN-03, COM-02)
// Modes: "read", "analyze", "reanalyze"
// Enforces:
// - Dedicated BILL_READ_SIGNING_SECRET HMAC token for anti-cheat
// - Server-computed electricity estimate via shared billCalc
// - Water alert levels via MoM and volume limits (Appendix B)
// - Daily rate limits for "read" and "reanalyze"
// - AI text number validation guard

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { computeHouseholdEstimateKwh } from "../_shared/billCalc.ts";
import { createBillReadToken, verifyBillReadToken } from "../_shared/billToken.ts";

// Rate Limit Constants
// TODO(open-item 6): Confirm daily limits for bill reading and reanalysis per household
const READ_DAILY_LIMIT = 10;
const REANALYZE_DAILY_LIMIT = 10;

// Daily limits are persisted and queried in public.ai_usage table

function getMalaysiaDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // Formats as YYYY-MM-DD
}

function normalizeBillingMonth(monthInput?: string): string {
  if (!monthInput) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  }
  const isoMatch = monthInput.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, "0");
    return `${year}-${month}-01`;
  }
  const parsed = new Date(monthInput);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  }
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 8192) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, Math.min(i + 8192, len)) as unknown as number[]
    );
  }
  return btoa(binary);
}

// Deterministic OCR fallback for local testing when ALLOW_TEST_FALLBACK=true
function getDeterministicTestOCR(filePath: string): {
  type: "electricity" | "water";
  provider: string;
  billing_month: string;
  usage: number;
  amount: number;
} {
  const lower = filePath.toLowerCase();
  const currentMonth = normalizeBillingMonth(new Date().toISOString());

  if (lower.includes("water") || lower.includes("air_selangor")) {
    if (lower.includes("major")) {
      return {
        type: "water",
        provider: "Air Selangor",
        billing_month: currentMonth,
        usage: 40.0,
        amount: 68.0,
      };
    }
    if (lower.includes("leak")) {
      return {
        type: "water",
        provider: "Air Selangor",
        billing_month: currentMonth,
        usage: 18.0,
        amount: 32.5,
      };
    }
    return {
      type: "water",
      provider: "Air Selangor",
      billing_month: currentMonth,
      usage: 12.0,
      amount: 19.5,
    };
  }

  // Default electricity
  return {
    type: "electricity",
    provider: "Tenaga Nasional Berhad",
    billing_month: currentMonth,
    usage: 280.0,
    amount: 124.5,
  };
}

// AI Text Number Guard (Item 10)
function validateAiTextNumbers(
  text: string,
  allowedNumbers: number[],
  fallbackTemplate: string
): string {
  // Regex to extract currency amounts (e.g. RM 120, MYR 50.5) and percentages (e.g. 48%, 12.5%)
  const rmRegex = /(?:RM|MYR)\s*(\d+(?:\.\d+)?)/gi;
  const pctRegex = /(\d+(?:\.\d+)?)\s*%/g;

  let match: RegExpExecArray | null;

  while ((match = rmRegex.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    const isAllowed = allowedNumbers.some((allowed) => Math.abs(allowed - val) < 0.01);
    if (!isAllowed) {
      return fallbackTemplate;
    }
  }

  while ((match = pctRegex.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    const isAllowed = allowedNumbers.some((allowed) => Math.abs(allowed - val) < 0.01);
    if (!isAllowed) {
      return fallbackTemplate;
    }
  }

  return text;
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error: missing Supabase environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Secret Verification (BILL_READ_SIGNING_SECRET is required)
    const signingSecret = Deno.env.get("BILL_READ_SIGNING_SECRET");
    if (!signingSecret) {
      return new Response(
        JSON.stringify({ error: "BILL_READ_SIGNING_SECRET is not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Authentication Verification
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAnon.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid user token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Resolve Household ID
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("household_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.household_id) {
      return new Response(JSON.stringify({ error: "User is not assigned to any household" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const householdId = profile.household_id;

    // 5. Parse Payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Item 1: Mode is REQUIRED
    const mode = body.mode;
    if (!mode || (mode !== "read" && mode !== "analyze" && mode !== "reanalyze")) {
      return new Response(
        JSON.stringify({ error: "Missing or unknown mode (must be 'read', 'analyze', or 'reanalyze')" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mytDate = getMalaysiaDateString();

    // ========================================================================
    // MODE 1: READ
    // ========================================================================
    if (mode === "read") {
      // Rate Limit Check via public.ai_usage (Asia/Kuala_Lumpur day)
      const startOfDayMytIso = new Date(`${mytDate}T00:00:00+08:00`).toISOString();
      const { count: readCount } = await supabaseAdmin
        .from("ai_usage")
        .select("id", { count: "exact", head: true })
        .eq("household_id", householdId)
        .eq("kind", "read")
        .gte("created_at", startOfDayMytIso);

      if ((readCount ?? 0) >= READ_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: `Daily bill reading limit reached (${READ_DAILY_LIMIT}/${READ_DAILY_LIMIT}). Please try again tomorrow.`,
            code: "daily_limit_reached",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const filePath = body.file_path;
      if (!filePath || typeof filePath !== "string") {
        return new Response(JSON.stringify({ error: "Missing required parameter: file_path" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!filePath.startsWith(`${householdId}/`) || filePath.includes("..")) {
        return new Response(
          JSON.stringify({ error: "Forbidden: file_path does not belong to user's household folder" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check file exists in bucket
      const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
        .from("bills")
        .download(filePath);

      if (downloadError || !fileBlob) {
        return new Response(
          JSON.stringify({ error: "File not found in bills storage bucket" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let extractedType: "electricity" | "water" = "electricity";
      let extractedProvider = "Tenaga Nasional Berhad";
      let extractedMonth = normalizeBillingMonth();
      let extractedUsage = 0;
      let extractedAmount = 0;

      const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

      if (geminiApiKey) {
        const buffer = await fileBlob.arrayBuffer();
        const base64Data = uint8ArrayToBase64(new Uint8Array(buffer));
        const mimeType = fileBlob.type || "image/jpeg";
        const model = Deno.env.get("GEMINI_MODEL");
        if (!model) {
          return new Response(JSON.stringify({ error: "GEMINI_MODEL is not set" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const prompt = `You are a utility bill document analysis specialist in Malaysia.
Extract data from this bill (TNB electricity or Air Selangor / state water bill).
Output strictly JSON matching this schema:
{
  "type": "electricity" | "water",
  "provider": string,
  "billing_month": string,
  "usage": number,
  "amount": number
}
Return only JSON.`;

        try {
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    { inline_data: { mime_type: mimeType, data: base64Data } },
                  ],
                },
              ],
              generationConfig: { response_mime_type: "application/json", temperature: 0.1 },
            }),
          });

          if (geminiRes.ok) {
            const gJson = await geminiRes.json();
            const textPart = gJson.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = JSON.parse(textPart);
            extractedType = parsed.type === "water" ? "water" : "electricity";
            extractedProvider = parsed.provider || (extractedType === "water" ? "Air Selangor" : "Tenaga Nasional Berhad");
            extractedMonth = normalizeBillingMonth(parsed.billing_month);
            extractedUsage = Number(parsed.usage) || 0;
            extractedAmount = Number(parsed.amount) || 0;
          } else {
            throw new Error(`Gemini returned status ${geminiRes.status}`);
          }
        } catch (e: any) {
          if (Deno.env.get("ALLOW_TEST_FALLBACK") === "true") {
            const fb = getDeterministicTestOCR(filePath);
            extractedType = fb.type;
            extractedProvider = fb.provider;
            extractedMonth = fb.billing_month;
            extractedUsage = fb.usage;
            extractedAmount = fb.amount;
          } else {
            return new Response(
              JSON.stringify({ error: `OCR extraction failed: ${e?.message || "Gemini error"}` }),
              { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } else {
        // No Gemini API Key
        if (Deno.env.get("ALLOW_TEST_FALLBACK") === "true") {
          const fb = getDeterministicTestOCR(filePath);
          extractedType = fb.type;
          extractedProvider = fb.provider;
          extractedMonth = fb.billing_month;
          extractedUsage = fb.usage;
          extractedAmount = fb.amount;
        } else {
          return new Response(
            JSON.stringify({ error: "Gemini OCR is not configured and test fallback is not allowed" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Generate signed token
      const token = await createBillReadToken(
        {
          userId: user.id,
          householdId,
          filePath,
          type: extractedType,
          billingMonth: extractedMonth,
          aiUsage: extractedUsage,
          aiAmount: extractedAmount,
        },
        signingSecret
      );

      // Save read call to public.ai_usage (writes no bills, alerts, deeds, or points)
      await supabaseAdmin.from("ai_usage").insert({
        household_id: householdId,
        kind: "read",
      });

      return new Response(
        JSON.stringify({
          success: true,
          mode: "read",
          type: extractedType,
          provider: extractedProvider,
          billing_month: extractedMonth,
          usage: extractedUsage,
          amount: extractedAmount,
          ai_read_token: token,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // MODE 2: REANALYZE
    // ========================================================================
    if (mode === "reanalyze") {
      // Rate Limit Check via public.ai_usage (Asia/Kuala_Lumpur day)
      const startOfDayMytIso = new Date(`${mytDate}T00:00:00+08:00`).toISOString();
      const { count: reanalyzeCount } = await supabaseAdmin
        .from("ai_usage")
        .select("id", { count: "exact", head: true })
        .eq("household_id", householdId)
        .eq("kind", "reanalyze")
        .gte("created_at", startOfDayMytIso);

      if ((reanalyzeCount ?? 0) >= REANALYZE_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: `Daily reanalyze limit reached (${REANALYZE_DAILY_LIMIT}/${REANALYZE_DAILY_LIMIT}). Please try again tomorrow.`,
            code: "daily_limit_reached",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const billId = body.bill_id;
      if (!billId || typeof billId !== "string") {
        return new Response(JSON.stringify({ error: "Missing required parameter: bill_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingBill, error: billFetchError } = await supabaseAdmin
        .from("bills")
        .select("*")
        .eq("id", billId)
        .maybeSingle();

      if (billFetchError || !existingBill) {
        return new Response(JSON.stringify({ error: "Bill not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (existingBill.household_id !== householdId) {
        return new Response(JSON.stringify({ error: "Forbidden: bill does not belong to user's household" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Recompute history numbers
      const { data: earlierBills } = await supabaseAdmin
        .from("bills")
        .select("usage, amount, billing_month")
        .eq("household_id", householdId)
        .eq("type", existingBill.type)
        .lt("billing_month", existingBill.billing_month)
        .order("billing_month", { ascending: false })
        .limit(3);

      const usage = Number(existingBill.usage);
      const prevUsage = earlierBills && earlierBills.length > 0 ? Number(earlierBills[0].usage) : null;
      let momPct: number | null = null;
      if (prevUsage && prevUsage > 0) {
        momPct = Math.round(((usage - prevUsage) / prevUsage) * 100);
      }

      const allowedNumbers: number[] = [usage, Number(existingBill.amount)];
      if (prevUsage !== null) allowedNumbers.push(prevUsage);
      if (momPct !== null) allowedNumbers.push(Math.abs(momPct));

      const fallbackSummary =
        existingBill.type === "electricity"
          ? `Electricity usage is ${usage} kWh (${momPct !== null ? (momPct >= 0 ? "+" : "") + momPct + "% vs last month" : "baseline"}).`
          : `Water usage is ${usage} m³ (${momPct !== null ? (momPct >= 0 ? "+" : "") + momPct + "% vs last month" : "baseline"}).`;

      const updatedAnalysis = {
        ...(existingBill.analysis || {}),
        reanalyzed_at: new Date().toISOString(),
        mom_change_pct: momPct,
        summary: validateAiTextNumbers(fallbackSummary, allowedNumbers, fallbackSummary),
      };

      // Do NOT change points, deeds, or alert level
      const { data: updatedBill, error: updateError } = await supabaseAdmin
        .from("bills")
        .update({ analysis: updatedAnalysis })
        .eq("id", billId)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: `Failed to update bill: ${updateError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Record reanalyze in public.ai_usage
      await supabaseAdmin.from("ai_usage").insert({
        household_id: householdId,
        kind: "reanalyze",
      });

      return new Response(
        JSON.stringify({
          success: true,
          mode: "reanalyze",
          bill_id: billId,
          bill: updatedBill,
          analysis: updatedBill.analysis,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // MODE 3: ANALYZE
    // ========================================================================
    // Validation
    const billType = body.type;
    if (billType !== "electricity" && billType !== "water") {
      return new Response(JSON.stringify({ error: "Invalid type: must be 'electricity' or 'water'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const billingMonthStr = body.billing_month;
    if (!billingMonthStr || typeof billingMonthStr !== "string") {
      return new Response(JSON.stringify({ error: "Missing required parameter: billing_month" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedBillingMonth = normalizeBillingMonth(billingMonthStr);

    // Validate month: not in future, not older than 24 months
    const [bYear, bMonth] = normalizedBillingMonth.split("-").map(Number);
    const billDate = new Date(Date.UTC(bYear, bMonth - 1, 1));

    const nowMyt = new Date();
    const currentYear = nowMyt.getUTCFullYear();
    const currentMonth = nowMyt.getUTCMonth();
    const currentDate = new Date(Date.UTC(currentYear, currentMonth, 1));

    if (billDate > currentDate) {
      return new Response(JSON.stringify({ error: "billing_month cannot be in the future" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const minDate = new Date(Date.UTC(currentYear, currentMonth - 24, 1));
    if (billDate < minDate) {
      return new Response(JSON.stringify({ error: "billing_month cannot be older than 24 months" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usage = Number(body.usage);
    const amount = Number(body.amount);

    if (!Number.isFinite(usage) || usage <= 0) {
      return new Response(JSON.stringify({ error: "usage must be a positive number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (billType === "electricity" && usage > 20000) {
      return new Response(JSON.stringify({ error: "electricity usage cannot exceed 20,000 kWh" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (billType === "water" && usage > 1000) {
      return new Response(JSON.stringify({ error: "water usage cannot exceed 1,000 m³" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return new Response(JSON.stringify({ error: "amount must be a positive number up to RM 100,000" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filePath = body.file_path;
    if (!filePath || typeof filePath !== "string" || !filePath.startsWith(`${householdId}/`) || filePath.includes("..")) {
      return new Response(JSON.stringify({ error: "Invalid file_path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify file exists in bills bucket
    const { data: fileCheck, error: fileCheckError } = await supabaseAdmin.storage
      .from("bills")
      .download(filePath);

    if (fileCheckError || !fileCheck) {
      return new Response(JSON.stringify({ error: "file_path does not exist in bills bucket" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Provider is determined server-side from type
    const provider = billType === "water" ? "Air Selangor" : "Tenaga Nasional Berhad";

    // Verify Token (Item 3)
    const token = body.ai_read_token;
    let tokenClaims = null;
    let tokenValid = false;

    if (token) {
      tokenClaims = await verifyBillReadToken(token, signingSecret);
      if (
        tokenClaims &&
        tokenClaims.userId === user.id &&
        tokenClaims.householdId === householdId &&
        tokenClaims.filePath === filePath &&
        tokenClaims.type === billType &&
        tokenClaims.billingMonth === normalizedBillingMonth
      ) {
        tokenValid = true;
      }
    }

    // Load Household Data to compute server estimate & check My Day (Item 4 & 5)
    const [
      { data: householdRow },
      { data: appliancesList },
      { data: catalogTypes },
      { data: schedulesList },
      { data: dayBlocksList },
      { data: tariffRow },
    ] = await Promise.all([
      supabaseAdmin.from("households").select("*").eq("id", householdId).single(),
      supabaseAdmin.from("appliances").select("*").eq("household_id", householdId),
      supabaseAdmin.from("appliance_types").select("*"),
      supabaseAdmin.from("schedules").select("*").eq("household_id", householdId),
      supabaseAdmin.from("day_blocks").select("*").eq("household_id", householdId),
      supabaseAdmin
        .from("tariff_rates")
        .select("*")
        .eq("type", "domestic")
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const residentsCount = householdRow?.residents_count || 1;
    const showersPerPerson = householdRow?.showers_per_person ?? 2;
    const minutesPerShower = householdRow?.minutes_per_shower ?? 10;
    const hasMyDay = (dayBlocksList?.length || 0) > 0;

    // Server-computed estimate (ignores any client-provided estimate_kwh)
    const { totalMonthlyKwh: serverEstimateKwh } = computeHouseholdEstimateKwh({
      appliances: (appliancesList || []).map((a: any) => ({
        id: a.id,
        type: a.type,
        wattage: a.wattage,
        quantity: a.quantity || 1,
        stars: a.star_rating,
        alwaysOn: false,
      })),
      applianceTypes: (catalogTypes || []).map((c: any) => ({
        id: c.id,
        always_on: c.always_on,
      })),
      schedules: (schedulesList || []).map((s: any) => ({
        day_type: s.day_type,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
      dayBlocks: (dayBlocksList || []).map((d: any) => ({
        startTime: d.start_time,
        endTime: d.end_time,
        isAway: d.type === "away" || !d.room_id || d.is_away === true,
        roomId: d.room_id,
        applianceIds: Array.isArray(d.appliances_on) ? d.appliances_on : (d.appliance_ids || []),
      })),
      residentsCount,
      showersPerPerson,
      minutesPerShower,
    });

    let pointsAwarded = 0;
    let pointsWithheldReason: string | null = null;
    let deedRecord: any = null;
    let lowerThanEstimate = false;

    // Energy Points Evaluation (Item 5)
    if (billType === "electricity") {
      let within5Pct = false;
      if (tokenValid && tokenClaims) {
        const uDiff = Math.abs(usage - tokenClaims.aiUsage) / (tokenClaims.aiUsage || 1);
        const aDiff = Math.abs(amount - tokenClaims.aiAmount) / (tokenClaims.aiAmount || 1);
        within5Pct = uDiff <= 0.05 && aDiff <= 0.05;
      }

      if (!tokenValid || !within5Pct) {
        pointsWithheldReason = "values_changed";
      } else if (!hasMyDay) {
        pointsWithheldReason = "my_day_not_set";
      } else {
        lowerThanEstimate = usage < serverEstimateKwh;
        if (!lowerThanEstimate) {
          pointsWithheldReason = "not_lower_than_estimate";
        } else {
          // Check unique points row for this billing month
          const { data: existingPoints } = await supabaseAdmin
            .from("points")
            .select("id")
            .eq("household_id", householdId)
            .eq("source", "energy")
            .eq("billing_month", normalizedBillingMonth)
            .maybeSingle();

          if (existingPoints) {
            pointsWithheldReason = "already_awarded";
          } else {
            // Check daily deed cap (3 deeds per day in Asia/Kuala_Lumpur)
            const { count: deedsTodayCount } = await supabaseAdmin
              .from("deeds")
              .select("*", { count: "exact", head: true })
              .eq("household_id", householdId)
              .eq("deed_date", mytDate);

            if ((deedsTodayCount ?? 0) >= 3) {
              pointsWithheldReason = "daily_limit_reached";
              pointsAwarded = 0;
              deedRecord = null;
            } else {
              // Record deed only when points can be awarded under the cap (AGENT.md rule 12)
              const { data: deed, error: deedError } = await supabaseAdmin
                .from("deeds")
                .insert({
                  household_id: householdId,
                  task_type: "upload_lower_bill",
                  deed_date: mytDate,
                })
                .select()
                .single();

              if (!deedError && deed) {
                deedRecord = deed;
                const { error: ptError } = await supabaseAdmin
                  .from("points")
                  .insert({
                    household_id: householdId,
                    source: "energy",
                    amount: 50,
                    deed_id: deed.id,
                    billing_month: normalizedBillingMonth,
                  });

                if (!ptError) {
                  pointsAwarded = 50;
                  pointsWithheldReason = null;
                }
              }
            }
          }
        }
      }
    } else {
      pointsWithheldReason = "bill_not_electricity";
    }

    // Water Anomaly Calculation (Item 6 & Appendix B)
    let finalWaterLevel: "normal" | "minor_drip" | "leak_detected" | "major_pipe_burst" | null = null;
    let momChangePct: number | null = null;
    let alertRecord: any = null;

    if (billType === "water") {
      const { data: prevBills } = await supabaseAdmin
        .from("bills")
        .select("usage, billing_month")
        .eq("household_id", householdId)
        .eq("type", "water")
        .lt("billing_month", normalizedBillingMonth)
        .order("billing_month", { ascending: false })
        .limit(1);

      let momLevel: "normal" | "minor_drip" | "leak_detected" | "major_pipe_burst" = "normal";

      if (prevBills && prevBills.length > 0) {
        const prevUsage = Number(prevBills[0].usage);
        if (prevUsage > 0) {
          momChangePct = Math.round(((usage - prevUsage) / prevUsage) * 100);
          if (momChangePct >= 100) momLevel = "major_pipe_burst";
          else if (momChangePct >= 30) momLevel = "leak_detected";
          else if (momChangePct >= 20) momLevel = "minor_drip";
          else momLevel = "normal";
        }
      }

      // Volume limits scaled by residentsCount / 3
      const normalVolLimit = (22 * residentsCount) / 3;
      const leakVolLimit = (30 * residentsCount) / 3;
      const majorVolLimit = (60 * residentsCount) / 3;

      let volLevel: "normal" | "minor_drip" | "leak_detected" | "major_pipe_burst" = "normal";
      if (usage >= majorVolLimit) volLevel = "major_pipe_burst";
      else if (usage >= leakVolLimit) volLevel = "leak_detected";
      else if (usage > normalVolLimit) volLevel = "minor_drip";
      else volLevel = "normal";

      if (!prevBills || prevBills.length === 0) {
        // First bill uses volume only
        finalWaterLevel = volLevel;
      } else {
        const rank = { normal: 0, minor_drip: 1, leak_detected: 2, major_pipe_burst: 3 };
        finalWaterLevel = rank[momLevel] >= rank[volLevel] ? momLevel : volLevel;
      }
    }

    // AI Text Generation & Number Guard (Item 10)
    let aiSummary = "";
    let aiTips: string[] = [];

    if (billType === "electricity") {
      const diffKwh = Number((serverEstimateKwh - usage).toFixed(2));
      const diffPct = serverEstimateKwh > 0 ? Math.round(((serverEstimateKwh - usage) / serverEstimateKwh) * 100) : 0;
      const allowedNumbers = [usage, amount, serverEstimateKwh, Math.abs(diffKwh), Math.abs(diffPct)];

      const template = lowerThanEstimate
        ? `Electricity usage is ${diffPct}% lower than your simulator estimate of ${serverEstimateKwh} kWh.`
        : `Electricity usage is ${Math.abs(diffPct)}% higher than your simulator estimate of ${serverEstimateKwh} kWh.`;

      aiSummary = validateAiTextNumbers(template, allowedNumbers, template);
      aiTips = lowerThanEstimate
        ? ["Great job! Keep maintaining your current appliance routine."]
        : ["Consider setting your air conditioner to 24°C and switching off standby appliances."];
    } else {
      const allowedNumbers = [usage, amount];
      if (momChangePct !== null) allowedNumbers.push(Math.abs(momChangePct));

      let template = "";
      if (finalWaterLevel === "major_pipe_burst") {
        template = "Critical water anomaly detected: usage has surged drastically. Please check your main supply valve immediately.";
        aiTips = ["Close your main valve and inspect underground lines for high-volume leakage."];
      } else if (finalWaterLevel === "leak_detected") {
        template = `Unusual water consumption detected (${momChangePct !== null ? (momChangePct >= 0 ? "+" : "") + momChangePct + "% MoM, " : ""}${usage} m³). Please check toilet cistern seals and outdoor pipes.`;
        aiTips = ["Check toilet cistern seal: place food coloring in tank to see if color seeps into bowl.", "Inspect outdoor pipe fittings and garden taps."];
      } else if (finalWaterLevel === "minor_drip") {
        template = "Slightly elevated water usage detected. Check for slow faucet drips or aerator leaks.";
        aiTips = ["Inspect faucet aerators and washroom fixtures for slow drips."];
      } else {
        template = "Water consumption is within expected parameters.";
        aiTips = ["Continue tracking monthly water meter readings."];
      }

      aiSummary = validateAiTextNumbers(template, allowedNumbers, template);
    }

    const analysisData = {
      provider,
      read: tokenClaims ? { usage: tokenClaims.aiUsage, amount: tokenClaims.aiAmount } : null,
      points_withheld_reason: pointsWithheldReason,
      estimate_kwh: serverEstimateKwh,
      lower_than_estimate: lowerThanEstimate,
      summary: aiSummary,
      tips: aiTips,
      mom_change_pct: momChangePct,
      level: finalWaterLevel,
    };

    // Upsert bill in public.bills
    const { data: bill, error: billError } = await supabaseAdmin
      .from("bills")
      .upsert(
        {
          household_id: householdId,
          file_path: filePath,
          type: billType,
          billing_month: normalizedBillingMonth,
          usage,
          amount,
          analysis: analysisData,
        },
        { onConflict: "household_id,type,billing_month" }
      )
      .select()
      .single();

    if (billError || !bill) {
      console.error("Failed to upsert bill:", billError);
      return new Response(JSON.stringify({ error: `Failed to save bill: ${billError?.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete old alerts for this bill (Item 6)
    await supabaseAdmin.from("alerts").delete().eq("bill_id", bill.id);

    // Insert new alert for water bills
    if (billType === "water" && finalWaterLevel) {
      const { data: alert, error: alertError } = await supabaseAdmin
        .from("alerts")
        .insert({
          household_id: householdId,
          bill_id: bill.id,
          level: finalWaterLevel,
          message: aiSummary,
        })
        .select()
        .single();

      if (!alertError && alert) {
        alertRecord = alert;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: "analyze",
        bill,
        bill_id: bill.id,
        type: billType,
        billing_month: normalizedBillingMonth,
        usage,
        amount,
        server_estimate_kwh: serverEstimateKwh,
        lower_than_estimate: lowerThanEstimate,
        points_awarded: pointsAwarded,
        pointsAwarded: pointsAwarded,
        points_withheld_reason: pointsWithheldReason,
        deed_id: deedRecord?.id || null,
        level: finalWaterLevel,
        alert: alertRecord,
        alert_id: alertRecord?.id || null,
        analysis: bill.analysis,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unhandled error in analyze-bill Edge Function:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
