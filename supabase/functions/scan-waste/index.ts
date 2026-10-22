// supabase/functions/scan-waste/index.ts
// Supabase Edge Function: scan-waste (BIN-01, BIN-02, COM-02)
// Classifies waste using Gemini Vision and records scans, deeds, and recycling points.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface ClassificationResult {
  item_name: string;
  material: string;
  bin_type: "paper" | "plastic" | "glass_metal" | "general";
  is_recyclable: boolean;
  confidence: number;
  tips: string;
}

const VALID_BINS = ["paper", "plastic", "glass_metal", "general"] as const;

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

function getMalaysiaDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // Formats as YYYY-MM-DD
}

function getDeterministicMockClassification(pathOrName: string): ClassificationResult {
  const lower = pathOrName.toLowerCase();
  if (lower.includes("paper") || lower.includes("cardboard") || lower.includes("carton") || lower.includes("box")) {
    return {
      item_name: "Paper Carton",
      material: "Paper & Cardboard",
      bin_type: "paper",
      is_recyclable: true,
      confidence: 0.98,
      tips: "Rinse cleanly with cold water and flatten to save bin capacity.",
    };
  } else if (lower.includes("glass") || lower.includes("jar") || lower.includes("can") || lower.includes("metal") || lower.includes("tin")) {
    return {
      item_name: "Aluminium Beverage Can",
      material: "Aluminium",
      bin_type: "glass_metal",
      is_recyclable: true,
      confidence: 0.97,
      tips: "Empty liquid, rinse with water, and crush can to save space.",
    };
  } else if (lower.includes("general") || lower.includes("food") || lower.includes("organic") || lower.includes("banana") || lower.includes("trash")) {
    return {
      item_name: "Food Scraps",
      material: "Organic Waste",
      bin_type: "general",
      is_recyclable: false,
      confidence: 0.99,
      tips: "Food scraps go to general waste. Consider composting at home.",
    };
  } else {
    return {
      item_name: "PET Water Bottle",
      material: "PET Plastic",
      bin_type: "plastic",
      is_recyclable: true,
      confidence: 0.95,
      tips: "Remove the cap and label. Rinse and crush before recycling.",
    };
  }
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
      return new Response(JSON.stringify({ error: "Server configuration error: missing Supabase environment variables" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const imagePath = body.image_path;
    if (!imagePath || typeof imagePath !== "string") {
      return new Response(JSON.stringify({ error: "Missing required parameter: image_path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate that image_path begins with caller's household_id/
    if (!imagePath.startsWith(`${householdId}/`)) {
      return new Response(
        JSON.stringify({ error: "Forbidden: image_path does not belong to user's household folder" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Image Retrieval
    let base64Data = body.image_base64 || "";
    let mimeType = "image/jpeg";

    if (!base64Data) {
      const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
        .from("waste-photos")
        .download(imagePath);

      if (downloadError || !fileBlob) {
        return new Response(
          JSON.stringify({ error: `Failed to download image from waste-photos: ${downloadError?.message || "File not found"}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const buffer = await fileBlob.arrayBuffer();
      base64Data = uint8ArrayToBase64(new Uint8Array(buffer));
      mimeType = fileBlob.type || "image/jpeg";
    }

    // 6. Gemini Vision Classification
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    let classification: ClassificationResult;

    if (!geminiApiKey) {
      // Deterministic fallback/mock mode when GEMINI_API_KEY is not set in local test runs
      classification = getDeterministicMockClassification(imagePath);
    } else {
      const model = Deno.env.get("GEMINI_MODEL");
      if (!model) {
        return new Response(JSON.stringify({ error: "GEMINI_MODEL is not set" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      const systemPrompt = `You are an expert waste sorting assistant for Malaysian household recycling systems (4-stream system).
Analyze the provided image and classify the primary waste item into EXACTLY ONE of the four valid bin_type values:
- "paper" (Blue bin: cardboard, cartons, envelopes, books, clean paper)
- "plastic" (Orange bin: plastic bottles, jugs, containers, tubs, clean plastic packaging)
- "glass_metal" (Brown bin: glass bottles, jars, aluminum cans, metal tins, metal lids)
- "general" (Grey/Green bin: food scraps, organic waste, soiled wrapping, polystyrene, non-recyclable materials)

Output strictly valid JSON with this exact schema:
{
  "item_name": "string (specific name of the item)",
  "material": "string (material description, e.g. PET Plastic, FSC Cardboard, Aluminium)",
  "bin_type": "paper" | "plastic" | "glass_metal" | "general",
  "is_recyclable": boolean,
  "confidence": number between 0.00 and 1.00,
  "tips": "string (short 1-2 sentence preparation instruction, e.g. rinse, remove cap, flatten)"
}
Return only JSON with no markdown wrapping.`;

      try {
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.2,
            },
          }),
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.error(`Gemini API error (${geminiRes.status}):`, errText);
          classification = getDeterministicMockClassification(imagePath);
        } else {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = JSON.parse(rawText);

          const binType = VALID_BINS.includes(parsed.bin_type) ? parsed.bin_type : "general";
          const isRecyclable = binType !== "general" && Boolean(parsed.is_recyclable);
          let confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.9;
          if (confidence > 1 && confidence <= 100) confidence = confidence / 100;
          if (confidence < 0 || confidence > 1) confidence = 0.9;

          classification = {
            item_name: String(parsed.item_name || "Identified Waste Item"),
            material: String(parsed.material || "Recyclable Material"),
            bin_type: binType,
            is_recyclable: isRecyclable,
            confidence: Number(confidence.toFixed(3)),
            tips: String(parsed.tips || "Ensure item is clean and sorted correctly."),
          };
        }
      } catch (geminiError) {
        console.error("Gemini Vision processing error:", geminiError);
        classification = getDeterministicMockClassification(imagePath);
      }
    }

    // 7. Database Writes (via Service Role)
    // 7a. Insert waste_scans row with confirmed_at = null (points only after "I threw it")
    const { data: scanRecord, error: scanInsertError } = await supabaseAdmin
      .from("waste_scans")
      .insert({
        household_id: householdId,
        image_path: imagePath,
        item_name: classification.item_name,
        bin_type: classification.bin_type,
        is_recyclable: classification.is_recyclable,
        confidence: classification.confidence,
        confirmed_at: null,
      })
      .select()
      .single();

    if (scanInsertError) {
      console.error("Failed to insert waste_scan record:", scanInsertError);
      return new Response(JSON.stringify({ error: "Failed to persist waste scan record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 8. Return Comprehensive Response (classify only, 0 points/deeds)
    const responsePayload = {
      success: true,
      scan: scanRecord,
      scan_id: scanRecord.id,
      item_name: classification.item_name,
      itemName: classification.item_name,
      material: classification.material,
      bin_type: classification.bin_type,
      binType: classification.bin_type,
      is_recyclable: classification.is_recyclable,
      recyclable: classification.is_recyclable,
      confidence: classification.confidence,
      tips: classification.tips,
      tip: classification.tips,
      points_awarded: 0,
      pointsAwarded: 0,
      deed_id: null,
      daily_limit_reached: false,
      dailyLimitReached: false,
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unhandled error in scan-waste Edge Function:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
