// supabase/functions/_shared/billToken.ts
// HMAC-SHA256 token signer & verifier for bill read anti-cheat workflow.
// Verifies signatures in constant time.

export interface BillReadTokenClaims {
  userId: string;
  householdId: string;
  filePath: string;
  type: 'electricity' | 'water';
  billingMonth: string; // YYYY-MM-01
  aiUsage: number;
  aiAmount: number;
  iat: number;
  exp: number;
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  const len = data.byteLength;
  for (let i = 0; i < len; i += 8192) {
    binary += String.fromCharCode.apply(null, data.subarray(i, Math.min(i + 8192, len)) as unknown as number[]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createBillReadToken(
  claims: Omit<BillReadTokenClaims, "iat" | "exp">,
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullClaims: BillReadTokenClaims = {
    ...claims,
    iat: now,
    exp: now + 2 * 3600, // 2 hours
  };
  const payloadStr = JSON.stringify(fullClaims);
  const payloadBytes = new TextEncoder().encode(payloadStr);
  const key = await getHmacKey(secret);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadBytes);
  const signatureBytes = new Uint8Array(signatureBuffer);

  return `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(signatureBytes)}`;
}

export async function verifyBillReadToken(
  token: string,
  secret: string
): Promise<BillReadTokenClaims | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  try {
    const payloadBytes = base64UrlDecode(parts[0]);
    const signatureBytes = base64UrlDecode(parts[1]);
    const key = await getHmacKey(secret);
    const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, payloadBytes);
    const expectedSigBytes = new Uint8Array(expectedSigBuffer);

    if (!timingSafeEqual(signatureBytes, expectedSigBytes)) {
      return null;
    }

    const payloadStr = new TextDecoder().decode(payloadBytes);
    const claims = JSON.parse(payloadStr) as BillReadTokenClaims;

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (now >= claims.exp) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}
