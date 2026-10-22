// supabase/functions/confirm-disposal/index.ts
// Supabase Edge Function: confirm-disposal (BIN-01, BIN-02, COM-03)
// Confirms waste disposal after user taps "I threw it", awarding recycling points and deeds.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

function getMalaysiaDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // Formats as YYYY-MM-DD
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

    // 2. Authentication Verification
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

    // 3. Resolve Household ID from Profiles
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

    // 4. Parse & Validate Payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scanId = body.scan_id;
    if (!scanId || typeof scanId !== "string") {
      return new Response(JSON.stringify({ error: "Missing required parameter: scan_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Load Scan and verify household ownership & age
    const { data: scan, error: scanFetchError } = await supabaseAdmin
      .from("waste_scans")
      .select("*")
      .eq("id", scanId)
      .maybeSingle();

    if (scanFetchError || !scan) {
      return new Response(JSON.stringify({ error: "Scan record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (scan.household_id !== householdId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: scan does not belong to user's household" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if scan is older than 24 hours
    const scanAgeMs = Date.now() - new Date(scan.created_at).getTime();
    if (scanAgeMs > 24 * 60 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Scan is older than 24 hours" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Atomic Update: confirmed_at = now() where id = scanId and confirmed_at is null
    const { data: updatedScan, error: updateError } = await supabaseAdmin
      .from("waste_scans")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", scanId)
      .is("confirmed_at", null)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("Failed to update waste_scans confirmed_at:", updateError);
      return new Response(JSON.stringify({ error: "Database error confirming disposal" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If update returned no row, the scan was already confirmed!
    if (!updatedScan) {
      return new Response(
        JSON.stringify({
          success: true,
          already_confirmed: true,
          points_awarded: 0,
          pointsAwarded: 0,
          deed_id: null,
          daily_limit_reached: false,
          dailyLimitReached: false,
          scan_id: scanId,
          message: "Disposal was already confirmed.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. General Waste (Not recyclable): confirm disposal without deed or points
    if (!updatedScan.is_recyclable || updatedScan.bin_type === "general") {
      return new Response(
        JSON.stringify({
          success: true,
          already_confirmed: false,
          is_recyclable: false,
          points_awarded: 0,
          pointsAwarded: 0,
          deed_id: null,
          daily_limit_reached: false,
          dailyLimitReached: false,
          scan_id: scanId,
          message: "General waste disposal confirmed. No eco points awarded.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Recyclable Waste: Check daily limit & award deed + 10 points
    const mytDate = getMalaysiaDateString();

    // Count today's recycling deeds in Malaysia time
    const { count: deedsTodayCount } = await supabaseAdmin
      .from("deeds")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("task_type", "recycle")
      .eq("deed_date", mytDate);

    const dailyLimitReached = (deedsTodayCount ?? 0) >= 3;

    if (dailyLimitReached) {
      return new Response(
        JSON.stringify({
          success: true,
          already_confirmed: false,
          is_recyclable: true,
          points_awarded: 0,
          pointsAwarded: 0,
          deed_id: null,
          daily_limit_reached: true,
          dailyLimitReached: true,
          scan_id: scanId,
          message: "Daily recycling deeds limit reached (3/3). 0 points awarded.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fewer than 3 deeds today: insert one deed and one points row (+10) with service role
    let deedRecord: any = null;
    const { data: deed, error: deedError } = await supabaseAdmin
      .from("deeds")
      .insert({
        household_id: householdId,
        task_type: "recycle",
        deed_date: mytDate,
      })
      .select()
      .single();

    if (deedError) {
      console.error("Failed to insert deed:", deedError);
      return new Response(JSON.stringify({ error: "Failed to record recycling deed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    deedRecord = deed;

    let pointsRecord: any = null;
    const { data: pt, error: ptError } = await supabaseAdmin
      .from("points")
      .insert({
        household_id: householdId,
        source: "recycling",
        amount: 10,
        deed_id: deedRecord.id,
      })
      .select()
      .single();

    if (ptError) {
      console.error("Failed to insert points:", ptError);
      return new Response(JSON.stringify({ error: "Failed to record recycling points" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    pointsRecord = pt;

    return new Response(
      JSON.stringify({
        success: true,
        already_confirmed: false,
        is_recyclable: true,
        points_awarded: 10,
        pointsAwarded: 10,
        deed_id: deedRecord.id,
        daily_limit_reached: false,
        dailyLimitReached: false,
        scan_id: scanId,
        message: "+10 points awarded for recycling!",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unhandled error in confirm-disposal Edge Function:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
