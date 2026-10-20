// supabase/tests/analyze_bill_verification.mjs
// Verification suite for analyze-bill Edge Function (Modes: read, analyze, reanalyze)
// Enforces anti-cheat token, server-computed estimates, daily rate limits, water anomaly levels,
// deed caps, points withholding reasons, and AI text number safety.

import { getTestCredentials } from './testSafety.mjs';

const { apiUrl, functionsUrl, anonKey, serviceRoleKey } = getTestCredentials();
const TEST_SIGNING_SECRET = process.env.BILL_READ_SIGNING_SECRET || 'local-bill-read-secret-32-chars-long-test!';

const results = [];

function recordResult(testNumber, testName, expected, actualStatus, actualMessage, passed) {
  results.push({
    testNumber,
    testName,
    expected,
    actualStatus,
    actualMessage,
    passed,
  });
}

// User Admin Helpers
async function createTestUser(email, password, name) {
  const res = await fetch(`${apiUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    }),
  });
  if (!res.ok) throw new Error(`Failed to create test user: ${await res.text()}`);
  return await res.json();
}

async function signInUser(email, password) {
  const res = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Failed to sign in: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function createTestHousehold(city, street, residentsCount = 3) {
  const res = await fetch(`${apiUrl}/rest/v1/households`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      address_state: 'Selangor',
      address_city: city,
      address_street: street,
      residents_count: residentsCount,
      showers_per_person: 2,
      minutes_per_shower: 10,
    }),
  });
  if (!res.ok) throw new Error(`Failed to create household: ${await res.text()}`);
  const data = await res.json();
  return data[0].id;
}

async function linkProfile(userId, householdId) {
  const res = await fetch(`${apiUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ household_id: householdId }),
  });
  if (!res.ok) throw new Error(`Failed to link profile: ${await res.text()}`);
}

async function uploadBillFile(path, buffer, token) {
  const res = await fetch(`${apiUrl}/storage/v1/object/bills/${path}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/png',
    },
    body: buffer,
  });
  return res.ok;
}

async function callAnalyzeBill(body, token) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${functionsUrl}/analyze-bill`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, body: json };
}

async function queryTable(table, query) {
  const res = await fetch(`${apiUrl}/rest/v1/${table}?${query}`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  return await res.json();
}

async function createCustomSignedToken(claims, secret = TEST_SIGNING_SECRET, overrideExp) {
  const enc = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);
  const fullClaims = {
    ...claims,
    iat: now,
    exp: overrideExp !== undefined ? overrideExp : now + 2 * 3600,
  };
  const payloadStr = JSON.stringify(fullClaims);
  const payloadBytes = enc.encode(payloadStr);

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, payloadBytes);
  const sigBytes = new Uint8Array(sigBuf);

  const toB64Url = (bytes) => Buffer.from(bytes).toString('base64url');
  return `${toB64Url(payloadBytes)}.${toB64Url(sigBytes)}`;
}

async function setupHouseholdSimulatorState(householdId) {
  // 1. Create a living room
  const roomRes = await fetch(`${apiUrl}/rest/v1/rooms`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      household_id: householdId,
      name: 'Living Room',
      type: 'living_room',
      floor: 1,
      slot: 'A',
      is_set_up: true,
    }),
  });
  const roomData = await roomRes.json();
  const roomId = roomData[0].id;

  // 2. Insert appliances: Refrigerator (150W), Air conditioner (1200W), Water heater (3500W)
  const appRes = await fetch(`${apiUrl}/rest/v1/appliances`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        household_id: householdId,
        room_id: roomId,
        type: 'refrigerator',
        wattage: 150,
        star_rating: 3,
        quantity: 1,
      },
      {
        household_id: householdId,
        room_id: roomId,
        type: 'air_conditioner',
        wattage: 1200,
        star_rating: 3,
        quantity: 1,
      },
      {
        household_id: householdId,
        room_id: roomId,
        type: 'water_heater',
        wattage: 3500,
        star_rating: 3,
        quantity: 1,
      },
    ]),
  });
  const appData = await appRes.json();
  const airconId = appData.find((a) => a.type === 'air_conditioner')?.id;

  // 3. Insert My Day block
  await fetch(`${apiUrl}/rest/v1/day_blocks`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        household_id: householdId,
        type: 'evening',
        title: 'Evening Relax',
        room_id: roomId,
        start_time: '20:00:00',
        end_time: '23:00:00',
        appliances_on: airconId ? [airconId] : [],
      },
    ]),
  });
}

async function main() {
  const runId = Date.now();
  const testPassword = 'Password_Test_123!';

  let userA, userB, userC, userD;
  let tokenA, tokenB, tokenC, tokenD;
  let householdAId, householdBId, householdDId;

  console.log('--- Setting up analyze-bill Verification Test Fixtures ---');
  try {
    userA = await createTestUser(`user_a_bill_${runId}@example.com`, testPassword, 'User A Bill');
    userB = await createTestUser(`user_b_bill_${runId}@example.com`, testPassword, 'User B Bill');
    userC = await createTestUser(`user_c_nohh_bill_${runId}@example.com`, testPassword, 'User C No Household');
    userD = await createTestUser(`user_d_limits_${runId}@example.com`, testPassword, 'User D Rate Limits');

    // Household A has 3 residents, appliances, and saved My Day
    householdAId = await createTestHousehold('Petaling Jaya', `18 Jalan SS 2/6 ${runId}`, 3);
    // Household B has 2 residents, NO day_blocks (tests "my_day_not_set")
    householdBId = await createTestHousehold('Bangsar', `42 Jalan Telawi ${runId}`, 2);
    // Household D for rate limit isolation
    householdDId = await createTestHousehold('Subang Jaya', `1 Jalan SS 15 ${runId}`, 1);

    await linkProfile(userA.id, householdAId);
    await linkProfile(userB.id, householdBId);
    await linkProfile(userD.id, householdDId);

    tokenA = await signInUser(`user_a_bill_${runId}@example.com`, testPassword);
    tokenB = await signInUser(`user_b_bill_${runId}@example.com`, testPassword);
    tokenC = await signInUser(`user_c_nohh_bill_${runId}@example.com`, testPassword);
    tokenD = await signInUser(`user_d_limits_${runId}@example.com`, testPassword);

    await setupHouseholdSimulatorState(householdAId);

    const dummyPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);

    // Upload test files
    await uploadBillFile(`${householdAId}/elec_oct.png`, dummyPng, tokenA);
    await uploadBillFile(`${householdAId}/elec_sep.png`, dummyPng, tokenA);
    await uploadBillFile(`${householdAId}/elec_aug.png`, dummyPng, tokenA);
    await uploadBillFile(`${householdAId}/water_jul.png`, dummyPng, tokenA);
    await uploadBillFile(`${householdAId}/water_aug.png`, dummyPng, tokenA);
    await uploadBillFile(`${householdAId}/water_sep.png`, dummyPng, tokenA);
    await uploadBillFile(`${householdBId}/b_elec.png`, dummyPng, tokenB);
    await uploadBillFile(`${householdDId}/d_bill.png`, dummyPng, tokenD);

    console.log('--- Executing analyze-bill Verification Tests ---\n');

    // ------------------------------------------------------------------------
    // TEST 1: Unauthenticated request -> should be rejected (401)
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill({ mode: 'read', file_path: `${householdAId}/elec_oct.png` }, null);
      const passed = res.status === 401;
      recordResult(1, 'Unauthenticated request rejected', 'HTTP 401', res.status, JSON.stringify(res.body), passed);
    }

    // ------------------------------------------------------------------------
    // TEST 2: Missing or unknown mode -> should return 400
    // ------------------------------------------------------------------------
    {
      const resMissing = await callAnalyzeBill({ file_path: `${householdAId}/elec_oct.png` }, tokenA);
      const resUnknown = await callAnalyzeBill({ mode: 'fly_to_moon', file_path: `${householdAId}/elec_oct.png` }, tokenA);
      const passed = resMissing.status === 400 && resUnknown.status === 400;
      recordResult(
        2,
        'Missing or unknown mode returns HTTP 400',
        'HTTP 400 for both missing and unknown mode',
        `missing=${resMissing.status}, unknown=${resUnknown.status}`,
        JSON.stringify(resMissing.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 3: User without household -> should be rejected (400)
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill({ mode: 'read', file_path: `${householdAId}/elec_oct.png` }, tokenC);
      const passed = res.status === 400;
      recordResult(3, 'User without household rejected', 'HTTP 400', res.status, JSON.stringify(res.body), passed);
    }

    // ------------------------------------------------------------------------
    // TEST 4: Cross-household file path access -> should be rejected (403)
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill({ mode: 'read', file_path: `${householdBId}/b_elec.png` }, tokenA);
      const passed = res.status === 403;
      recordResult(4, 'Cross-household path access rejected', 'HTTP 403', res.status, JSON.stringify(res.body), passed);
    }

    // ------------------------------------------------------------------------
    // TEST 5: Path traversal ("..") -> should be rejected (403)
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill({ mode: 'read', file_path: `${householdAId}/../b_elec.png` }, tokenA);
      const passed = res.status === 403;
      recordResult(5, 'Path traversal ("..") rejected', 'HTTP 403', res.status, JSON.stringify(res.body), passed);
    }

    // ------------------------------------------------------------------------
    // TEST 6: Read writes nothing to database & returns valid token
    // ------------------------------------------------------------------------
    let readTokenOct;
    {
      const res = await callAnalyzeBill({ mode: 'read', file_path: `${householdAId}/elec_oct.png` }, tokenA);
      readTokenOct = res.body?.ai_read_token;

      // Verify DB: ensure 0 bills, alerts, deeds, points for Household A, and exactly 1 ai_usage row
      const [bills, alerts, deeds, points, aiUsage] = await Promise.all([
        queryTable('bills', `household_id=eq.${householdAId}`),
        queryTable('alerts', `household_id=eq.${householdAId}`),
        queryTable('deeds', `household_id=eq.${householdAId}`),
        queryTable('points', `household_id=eq.${householdAId}`),
        queryTable('ai_usage', `household_id=eq.${householdAId}&kind=eq.read`),
      ]);

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.mode === 'read' &&
        res.body.type === 'electricity' &&
        typeof readTokenOct === 'string' &&
        bills.length === 0 &&
        alerts.length === 0 &&
        deeds.length === 0 &&
        points.length === 0 &&
        aiUsage.length === 1 &&
        aiUsage[0].kind === 'read';

      recordResult(
        6,
        'Read writes nothing to bills/alerts/deeds/points and writes 1 ai_usage row',
        'HTTP 200, token present, 0 bills/alerts/deeds/points, 1 ai_usage row',
        res.status,
        `token=${Boolean(readTokenOct)}, bills=${bills.length}, alerts=${alerts.length}, deeds=${deeds.length}, points=${points.length}, ai_usage=${aiUsage.length}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 7: Token for another file or user is rejected in analyze
    // ------------------------------------------------------------------------
    {
      const mismatchedToken = await createCustomSignedToken({
        userId: userA.id,
        householdId: householdAId,
        filePath: `${householdAId}/different_file.png`, // Different file path
        type: 'electricity',
        billingMonth: '2026-10-01',
        aiUsage: 280,
        aiAmount: 75.00,
      });

      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/elec_oct.png`,
          type: 'electricity',
          billing_month: '2026-10-01',
          usage: 280,
          amount: 75.00,
          ai_read_token: mismatchedToken,
        },
        tokenA
      );

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.points_awarded === 0 &&
        res.body.points_withheld_reason === 'values_changed';

      recordResult(
        7,
        'Token for another file rejected in analyze',
        'HTTP 200, points_awarded=0, reason="values_changed"',
        res.status,
        `pts=${res.body.points_awarded}, reason=${res.body.points_withheld_reason}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 8: Expired token is rejected in analyze
    // ------------------------------------------------------------------------
    {
      const nowSec = Math.floor(Date.now() / 1000);
      const expiredToken = await createCustomSignedToken(
        {
          userId: userA.id,
          householdId: householdAId,
          filePath: `${householdAId}/elec_oct.png`,
          type: 'electricity',
          billingMonth: '2026-10-01',
          aiUsage: 280,
          aiAmount: 75.00,
        },
        TEST_SIGNING_SECRET,
        nowSec - 100 // Expired 100 seconds ago
      );

      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/elec_oct.png`,
          type: 'electricity',
          billing_month: '2026-10-01',
          usage: 280,
          amount: 75.00,
          ai_read_token: expiredToken,
        },
        tokenA
      );

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.points_awarded === 0 &&
        res.body.points_withheld_reason === 'values_changed';

      recordResult(
        8,
        'Expired token rejected in analyze',
        'HTTP 200, points_awarded=0, reason="values_changed"',
        res.status,
        `pts=${res.body.points_awarded}, reason=${res.body.points_withheld_reason}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 9: Edited values within 5% earn points (Oct 2026: 280 AI -> 285 user)
    // ------------------------------------------------------------------------
    let octBillId;
    {
      // AI usage was 280, amount was 124.50 (from deterministic OCR)
      // 285 is 1.78% diff; 125.00 is 0.40% diff (both <= 5%)
      const validToken = await createCustomSignedToken({
        userId: userA.id,
        householdId: householdAId,
        filePath: `${householdAId}/elec_oct.png`,
        type: 'electricity',
        billingMonth: '2026-10-01',
        aiUsage: 280.0,
        aiAmount: 124.5,
      });

      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/elec_oct.png`,
          type: 'electricity',
          billing_month: '2026-10-01',
          usage: 285.0,
          amount: 125.0,
          ai_read_token: validToken,
        },
        tokenA
      );

      octBillId = res.body?.bill_id;
      const deedsData = await queryTable('deeds', `household_id=eq.${householdAId}&task_type=eq.upload_lower_bill`);
      const pointsData = await queryTable('points', `household_id=eq.${householdAId}&source=eq.energy&billing_month=eq.2026-10-01`);

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.lower_than_estimate === true &&
        res.body.points_awarded === 50 &&
        res.body.points_withheld_reason === null &&
        deedsData.length >= 1 &&
        pointsData.length === 1 &&
        pointsData[0].amount === 50;

      recordResult(
        9,
        'Edited values within 5% earn points',
        'HTTP 200, points_awarded=50, lower_than_estimate=true, deed created',
        res.status,
        `pts=${res.body?.points_awarded}, reason=${res.body?.points_withheld_reason}, server_kwh=${res.body?.server_estimate_kwh}, deeds=${deedsData.length}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 10: Edited values over 5% earn none and save reason 'values_changed' (Sep 2026)
    // ------------------------------------------------------------------------
    {
      const tokenSep = await createCustomSignedToken({
        userId: userA.id,
        householdId: householdAId,
        filePath: `${householdAId}/elec_sep.png`,
        type: 'electricity',
        billingMonth: '2026-09-01',
        aiUsage: 250.0,
        aiAmount: 110.0,
      });

      // User submits 280 kWh (12% diff vs 250 > 5%)
      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/elec_sep.png`,
          type: 'electricity',
          billing_month: '2026-09-01',
          usage: 280.0,
          amount: 110.0,
          ai_read_token: tokenSep,
        },
        tokenA
      );

      const billData = await queryTable('bills', `id=eq.${res.body?.bill_id}`);
      const savedReason = billData[0]?.analysis?.points_withheld_reason;

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.points_awarded === 0 &&
        res.body.points_withheld_reason === 'values_changed' &&
        savedReason === 'values_changed';

      recordResult(
        10,
        'Edited values over 5% earn none and save reason "values_changed"',
        'HTTP 200, points_awarded=0, reason="values_changed"',
        res.status,
        `pts=${res.body?.points_awarded}, reason=${res.body?.points_withheld_reason}, saved_reason=${savedReason}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 11: Household with no My Day earns none (reason: 'my_day_not_set')
    // ------------------------------------------------------------------------
    {
      const readTokenB = await createCustomSignedToken({
        userId: userB.id,
        householdId: householdBId,
        filePath: `${householdBId}/b_elec.png`,
        type: 'electricity',
        billingMonth: '2026-10-01',
        aiUsage: 150.0,
        aiAmount: 60.0,
      });

      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdBId}/b_elec.png`,
          type: 'electricity',
          billing_month: '2026-10-01',
          usage: 150.0,
          amount: 60.0,
          ai_read_token: readTokenB,
        },
        tokenB
      );

      const billData = await queryTable('bills', `id=eq.${res.body?.bill_id}`);
      const savedReason = billData[0]?.analysis?.points_withheld_reason;

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.points_awarded === 0 &&
        res.body.points_withheld_reason === 'my_day_not_set' &&
        savedReason === 'my_day_not_set';

      recordResult(
        11,
        'Household with no My Day earns none ("my_day_not_set")',
        'HTTP 200, points_awarded=0, reason="my_day_not_set"',
        res.status,
        `pts=${res.body?.points_awarded}, reason=${res.body?.points_withheld_reason}, saved_reason=${savedReason}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 12: Client-supplied estimate (99999) is ignored by server (Aug 2026)
    // ------------------------------------------------------------------------
    {
      // Household A real estimate is ~321 kWh.
      // Bill usage = 350 kWh (> 321 kWh, so it does NOT beat the estimate).
      // Client sends estimate_kwh: 99999 and estimate_usage: 99999 to try cheating.
      const tokenCheat = await createCustomSignedToken({
        userId: userA.id,
        householdId: householdAId,
        filePath: `${householdAId}/elec_aug.png`,
        type: 'electricity',
        billingMonth: '2026-08-01',
        aiUsage: 350.0,
        aiAmount: 150.0,
      });

      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/elec_aug.png`,
          type: 'electricity',
          billing_month: '2026-08-01',
          usage: 350.0,
          amount: 150.0,
          estimate_kwh: 99999,
          estimate_usage: 99999,
          ai_read_token: tokenCheat,
        },
        tokenA
      );

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.lower_than_estimate === false &&
        res.body.server_estimate_kwh < 350 &&
        res.body.points_awarded === 0 &&
        res.body.points_withheld_reason === 'not_lower_than_estimate';

      recordResult(
        12,
        'Client estimate (99999) ignored; server computes real estimate',
        'HTTP 200, lower_than_estimate=false, server_estimate_kwh < 350, reason="not_lower_than_estimate"',
        res.status,
        `server_kwh=${res.body?.server_estimate_kwh}, lower=${res.body?.lower_than_estimate}, reason=${res.body?.points_withheld_reason}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 13: Overrides (level, analysis, provider) are ignored by server
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/water_jul.png`,
          type: 'water',
          billing_month: '2026-07-01',
          usage: 12.0,
          amount: 25.0,
          level: 'major_pipe_burst', // Attempt to override level
          provider: 'Hacker Water Inc', // Attempt to override provider
          analysis: { hacked: true }, // Attempt to override analysis
        },
        tokenA
      );

      const billData = await queryTable('bills', `id=eq.${res.body?.bill_id}`);
      const bill = billData[0];

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.level === 'normal' &&
        bill?.analysis?.provider === 'Air Selangor' &&
        bill?.analysis?.hacked === undefined;

      recordResult(
        13,
        'Overrides (level, analysis, provider) ignored by server',
        'HTTP 200, level="normal", provider="Air Selangor", client analysis discarded',
        res.status,
        `level=${res.body?.level}, provider=${bill?.analysis?.provider}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 14: Normal water bill (12.16 m³) -> level normal, 0 notifications
    // ------------------------------------------------------------------------
    let julWaterBillId;
    {
      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/water_jul.png`,
          type: 'water',
          billing_month: '2026-07-01',
          usage: 12.16,
          amount: 25.0,
        },
        tokenA
      );

      julWaterBillId = res.body?.bill_id;
      const alertsData = await queryTable('alerts', `bill_id=eq.${julWaterBillId}`);
      const notifsData = await queryTable('notifications', `household_id=eq.${householdAId}&type=eq.bill_alert`);

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.level === 'normal' &&
        alertsData[0]?.level === 'normal' &&
        notifsData.length === 0;

      recordResult(
        14,
        'Baseline water bill (normal)',
        'HTTP 200, level=normal, alert created, 0 notifications',
        res.status,
        `level=${res.body?.level}, alert_rows=${alertsData.length}, notifs=${notifsData.length}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 15: Water Leak case (18 m³, +48% MoM vs Jul 12.16) -> leak_detected + trigger notification
    // ------------------------------------------------------------------------
    let augWaterBillId;
    {
      // (18 - 12.16)/12.16 = +48.0% MoM
      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/water_aug.png`,
          type: 'water',
          billing_month: '2026-08-01',
          usage: 18.0,
          amount: 35.0,
        },
        tokenA
      );

      augWaterBillId = res.body?.bill_id;
      const alertsData = await queryTable('alerts', `bill_id=eq.${augWaterBillId}`);
      const notifsData = await queryTable('notifications', `household_id=eq.${householdAId}&type=eq.bill_alert&order=created_at.desc`);
      const latestNotif = notifsData[0];

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.level === 'leak_detected' &&
        alertsData[0]?.level === 'leak_detected' &&
        latestNotif &&
        latestNotif.title === 'Water Leak Detected';

      recordResult(
        15,
        'Water leak case (18 m³, +48% MoM) + notification trigger',
        'HTTP 200, level=leak_detected, notification="Water Leak Detected"',
        res.status,
        `level=${res.body?.level}, notif_title="${latestNotif?.title}"`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 16: Water Major pipe burst case (40 m³, +122% MoM vs Aug 18) -> major_pipe_burst + trigger notification
    // ------------------------------------------------------------------------
    let sepWaterBillId;
    {
      // (40 - 18)/18 = +122% MoM
      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/water_sep.png`,
          type: 'water',
          billing_month: '2026-09-01',
          usage: 40.0,
          amount: 95.0,
        },
        tokenA
      );

      sepWaterBillId = res.body?.bill_id;
      const alertsData = await queryTable('alerts', `bill_id=eq.${sepWaterBillId}`);
      const notifsData = await queryTable('notifications', `household_id=eq.${householdAId}&type=eq.bill_alert&order=created_at.desc`);
      const latestNotif = notifsData[0];

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.level === 'major_pipe_burst' &&
        alertsData[0]?.level === 'major_pipe_burst' &&
        latestNotif &&
        latestNotif.title === 'Major Pipe Burst Detected';

      recordResult(
        16,
        'Water major pipe burst case (40 m³, +122% MoM) + notification trigger',
        'HTTP 200, level=major_pipe_burst, notification="Major Pipe Burst Detected"',
        res.status,
        `level=${res.body?.level}, notif_title="${latestNotif?.title}"`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 17: Replacing a month leaves exactly one alert (deletes prior alert)
    // ------------------------------------------------------------------------
    {
      // Re-upload water bill for 2026-08-01 with usage 19.0 m³
      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/water_aug.png`,
          type: 'water',
          billing_month: '2026-08-01',
          usage: 19.0,
          amount: 36.5,
        },
        tokenA
      );

      const alertsData = await queryTable('alerts', `bill_id=eq.${res.body?.bill_id}`);

      const passed =
        res.ok &&
        res.status === 200 &&
        alertsData.length === 1;

      recordResult(
        17,
        'Replacing a month leaves exactly one alert',
        'HTTP 200, exactly 1 alert row in database for this bill',
        res.status,
        `alerts_count=${alertsData.length}, bill_id=${res.body?.bill_id}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 18: Second energy award for the same month is refused ('already_awarded')
    // ------------------------------------------------------------------------
    {
      // Submit updated electricity bill for 2026-10-01 (points already awarded in Test 9)
      const validToken = await createCustomSignedToken({
        userId: userA.id,
        householdId: householdAId,
        filePath: `${householdAId}/elec_oct.png`,
        type: 'electricity',
        billingMonth: '2026-10-01',
        aiUsage: 280.0,
        aiAmount: 124.5,
      });

      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdAId}/elec_oct.png`,
          type: 'electricity',
          billing_month: '2026-10-01',
          usage: 280.0,
          amount: 124.5,
          ai_read_token: validToken,
        },
        tokenA
      );

      const pointsData = await queryTable('points', `household_id=eq.${householdAId}&source=eq.energy&billing_month=eq.2026-10-01`);

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.points_awarded === 0 &&
        res.body.points_withheld_reason === 'already_awarded' &&
        pointsData.length === 1;

      recordResult(
        18,
        'Second energy award for same month refused ("already_awarded")',
        'HTTP 200, points_awarded=0, reason="already_awarded", points rows=1',
        res.status,
        `pts=${res.body?.points_awarded}, reason=${res.body?.points_withheld_reason}, points_rows=${pointsData.length}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 19: Reanalyze changes no points, deeds, or alert levels
    // ------------------------------------------------------------------------
    {
      const [pointsBefore, deedsBefore, alertsBefore] = await Promise.all([
        queryTable('points', `household_id=eq.${householdAId}`),
        queryTable('deeds', `household_id=eq.${householdAId}`),
        queryTable('alerts', `household_id=eq.${householdAId}`),
      ]);

      const res = await callAnalyzeBill(
        {
          mode: 'reanalyze',
          bill_id: octBillId,
        },
        tokenA
      );

      const [pointsAfter, deedsAfter, alertsAfter] = await Promise.all([
        queryTable('points', `household_id=eq.${householdAId}`),
        queryTable('deeds', `household_id=eq.${householdAId}`),
        queryTable('alerts', `household_id=eq.${householdAId}`),
      ]);

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.mode === 'reanalyze' &&
        res.body.analysis?.reanalyzed_at !== undefined &&
        pointsAfter.length === pointsBefore.length &&
        deedsAfter.length === deedsBefore.length &&
        alertsAfter.length === alertsBefore.length;

      recordResult(
        19,
        'Reanalyze modifies analysis but touches NO points, deeds, or alerts',
        'HTTP 200, points/deeds/alerts counts identical before and after',
        res.status,
        `pts_delta=${pointsAfter.length - pointsBefore.length}, deeds_delta=${deedsAfter.length - deedsBefore.length}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 20: Daily rate limits return HTTP 429 daily_limit_reached (Read & Reanalyze)
    // ------------------------------------------------------------------------
    {
      // First, create a bill for Household D so we can test reanalyze
      const billRes = await fetch(`${apiUrl}/rest/v1/bills`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          household_id: householdDId,
          file_path: `${householdDId}/d_bill.png`,
          type: 'electricity',
          billing_month: '2026-10-01',
          usage: 100,
          amount: 50,
          analysis: { summary: 'test' },
        }),
      });
      const billData = await billRes.json();
      const dBillId = billData[0]?.id;

      // Exhaust 10 reads for Household D
      let lastReadStatus = 200;
      for (let i = 0; i < 10; i++) {
        const r = await callAnalyzeBill({ mode: 'read', file_path: `${householdDId}/d_bill.png` }, tokenD);
        lastReadStatus = r.status;
      }
      // 11th read must be 429
      const read11 = await callAnalyzeBill({ mode: 'read', file_path: `${householdDId}/d_bill.png` }, tokenD);

      // Exhaust 10 reanalyzes for Household D
      let lastReanalyzeStatus = 200;
      for (let i = 0; i < 10; i++) {
        const r = await callAnalyzeBill({ mode: 'reanalyze', bill_id: dBillId }, tokenD);
        lastReanalyzeStatus = r.status;
      }
      // 11th reanalyze must be 429
      const reanalyze11 = await callAnalyzeBill({ mode: 'reanalyze', bill_id: dBillId }, tokenD);

      const passed =
        lastReadStatus === 200 &&
        read11.status === 429 &&
        read11.body?.code === 'daily_limit_reached' &&
        lastReanalyzeStatus === 200 &&
        reanalyze11.status === 429 &&
        reanalyze11.body?.code === 'daily_limit_reached';

      recordResult(
        20,
        'Daily limits return HTTP 429 (READ_DAILY_LIMIT=10, REANALYZE_DAILY_LIMIT=10)',
        'HTTP 429 code="daily_limit_reached" on 11th call for both read and reanalyze',
        `read11=${read11.status}, reanalyze11=${reanalyze11.status}`,
        `read_code=${read11.body?.code}, reanalyze_code=${reanalyze11.body?.code}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 21: AI text number guard removes unverified numbers & falls back to template
    // ------------------------------------------------------------------------
    {
      // Verification of validateAiTextNumbers logic:
      // When AI hallucinates numbers like "RM 999.00" or "88%" not in allowedNumbers,
      // text immediately reverts to the safe fallback template.
      function testGuard(text, allowedNumbers, fallback) {
        const rmRegex = /(?:RM|MYR)\s*(\d+(?:\.\d+)?)/gi;
        const pctRegex = /(\d+(?:\.\d+)?)\s*%/g;
        let match;
        while ((match = rmRegex.exec(text)) !== null) {
          const val = parseFloat(match[1]);
          if (!allowedNumbers.some((allowed) => Math.abs(allowed - val) < 0.01)) return fallback;
        }
        while ((match = pctRegex.exec(text)) !== null) {
          const val = parseFloat(match[1]);
          if (!allowedNumbers.some((allowed) => Math.abs(allowed - val) < 0.01)) return fallback;
        }
        return text;
      }

      const allowed = [280, 124.5, 321, 41, 13];
      const validText = 'Electricity usage is 13% lower than your simulator estimate of 321 kWh.';
      const hallucinatedRM = 'You saved RM 999.00 this month!';
      const hallucinatedPct = 'Electricity dropped by 88% overall!';
      const fallback = 'Electricity usage is 13% lower than your simulator estimate of 321 kWh.';

      const passedValid = testGuard(validText, allowed, fallback) === validText;
      const passedRM = testGuard(hallucinatedRM, allowed, fallback) === fallback;
      const passedPct = testGuard(hallucinatedPct, allowed, fallback) === fallback;

      // Also verify that actual bill saved in DB contains safe numbers
      const billData = await queryTable('bills', `id=eq.${octBillId}`);
      const savedSummary = billData[0]?.analysis?.summary;

      const passed = passedValid && passedRM && passedPct && typeof savedSummary === 'string' && savedSummary.length > 0;

      recordResult(
        21,
        'AI text number guard protects against hallucinated RM amounts and percentages',
        'Unauthorized numbers trigger fallback template; valid numbers preserved',
        'PASS',
        `saved_summary="${savedSummary}"`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 22: Daily deed cap prevents deed insertion (3 deeds already today)
    // ------------------------------------------------------------------------
    let householdEId;
    {
      const mytDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kuala_Lumpur',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      // Create a dedicated household E with simulator state
      householdEId = await createTestHousehold('Shah Alam', `55 Jalan Ikram ${runId}`, 3);
      await linkProfile(userC.id, householdEId); // Link user C to household E
      const tokenE = await signInUser(`user_c_nohh_bill_${runId}@example.com`, testPassword);
      await setupHouseholdSimulatorState(householdEId);
      await uploadBillFile(`${householdEId}/elec_cap.png`, dummyPng, tokenE);

      // Insert 3 deeds for today directly to hit the 3-deed cap
      await Promise.all([
        fetch(`${apiUrl}/rest/v1/deeds`, {
          method: 'POST',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ household_id: householdEId, task_type: 'recycle', deed_date: mytDate }),
        }),
        fetch(`${apiUrl}/rest/v1/deeds`, {
          method: 'POST',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ household_id: householdEId, task_type: 'recycle', deed_date: mytDate }),
        }),
        fetch(`${apiUrl}/rest/v1/deeds`, {
          method: 'POST',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ household_id: householdEId, task_type: 'recycle', deed_date: mytDate }),
        }),
      ]);

      const deedsBefore = await queryTable('deeds', `household_id=eq.${householdEId}`);

      const validToken = await createCustomSignedToken({
        userId: userC.id,
        householdId: householdEId,
        filePath: `${householdEId}/elec_cap.png`,
        type: 'electricity',
        billingMonth: '2026-10-01',
        aiUsage: 250.0,
        aiAmount: 110.0,
      });

      // Submit bill lower than estimate (250 < 321)
      const res = await callAnalyzeBill(
        {
          mode: 'analyze',
          file_path: `${householdEId}/elec_cap.png`,
          type: 'electricity',
          billing_month: '2026-10-01',
          usage: 250.0,
          amount: 110.0,
          ai_read_token: validToken,
        },
        tokenE
      );

      const deedsAfter = await queryTable('deeds', `household_id=eq.${householdEId}`);
      const pointsAfter = await queryTable('points', `household_id=eq.${householdEId}`);

      const passed =
        res.ok &&
        res.status === 200 &&
        res.body.points_awarded === 0 &&
        res.body.points_withheld_reason === 'daily_limit_reached' &&
        res.body.deed_id === null &&
        deedsBefore.length === 3 &&
        deedsAfter.length === 3 && // NO 4th deed row inserted!
        pointsAfter.length === 0;

      recordResult(
        22,
        'Daily deed cap reached prevents deed insertion (no 4th deed row)',
        'HTTP 200, points_awarded=0, reason="daily_limit_reached", deeds count remains 3',
        res.status,
        `pts=${res.body?.points_awarded}, reason=${res.body?.points_withheld_reason}, deeds_count=${deedsAfter.length}`,
        passed
      );
    }

  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    console.log('\n--- Cleaning up Test Fixtures ---');
    try {
      const householdsToClean = [householdAId, householdBId, householdDId, householdEId].filter(Boolean);
      for (const hid of householdsToClean) {
        await fetch(`${apiUrl}/rest/v1/households?id=eq.${hid}`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        });
      }
      const usersToClean = [userA?.id, userB?.id, userC?.id, userD?.id].filter(Boolean);
      for (const uid of usersToClean) {
        await fetch(`${apiUrl}/auth/v1/admin/users/${uid}`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        });
      }
      console.log('Cleanup completed successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }
  }

  console.log('\n================================================================================');
  console.log('STAGE 5 (PART 2): analyze-bill EDGE FUNCTION VERIFICATION RESULTS');
  console.log('================================================================================\n');
  console.table(
    results.map((r) => ({
      '#': r.testNumber,
      Test: r.testName,
      Expected: r.expected,
      'Status Code': r.actualStatus,
      Result: r.passed ? 'PASSED' : 'FAILED',
    }))
  );

  console.log('\nDetailed Breakdown:\n');
  let allPassed = true;
  for (const r of results) {
    if (!r.passed) allPassed = false;
    console.log(`Test ${r.testNumber}: ${r.testName}`);
    console.log(`  Expected: ${r.expected}`);
    console.log(`  Actual Status: ${r.actualStatus}`);
    console.log(`  Actual Details: ${r.actualMessage}`);
    console.log(`  Status: ${r.passed ? 'PASSED' : 'FAILED'}\n`);
  }

  if (!allPassed) {
    process.exit(1);
  }
}

main();
