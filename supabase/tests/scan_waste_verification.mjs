// supabase/tests/scan_waste_verification.mjs
// Verification suite for Stage 5: scan-waste Edge Function
// Verifies: Auth enforcement, user-without-household rejection, cross-household path rejection,
// classification, database writes (waste_scans, deeds, points), and daily deed cap.

import { execSync } from 'child_process';

function getCredentials() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      apiUrl: process.env.SUPABASE_URL,
      functionsUrl: process.env.FUNCTIONS_URL || `${process.env.SUPABASE_URL}/functions/v1`,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }
  const out = execSync('npx supabase status -o json', { encoding: 'utf-8' });
  const start = out.indexOf('{');
  const end = out.lastIndexOf('}');
  const json = JSON.parse(out.slice(start, end + 1));
  return {
    apiUrl: json.API_URL,
    functionsUrl: json.FUNCTIONS_URL || `${json.API_URL}/functions/v1`,
    anonKey: json.ANON_KEY,
    serviceRoleKey: json.SERVICE_ROLE_KEY,
  };
}

const { apiUrl, functionsUrl, anonKey, serviceRoleKey } = getCredentials();

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

async function createTestHousehold(city, street) {
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
      residents_count: 2,
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

async function uploadWastePhoto(path, buffer, token) {
  const res = await fetch(`${apiUrl}/storage/v1/object/waste-photos/${path}`, {
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

async function callScanWaste(body, token) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${functionsUrl}/scan-waste`, {
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

async function main() {
  const runId = Date.now();
  const testPassword = 'Password_Test_123!';

  let userA, userB, userC;
  let tokenA, tokenB, tokenC;
  let householdAId, householdBId;

  console.log('--- Setting up Stage 5 Test Fixtures ---');
  try {
    userA = await createTestUser(`user_a_waste_${runId}@example.com`, testPassword, 'User A');
    userB = await createTestUser(`user_b_waste_${runId}@example.com`, testPassword, 'User B');
    userC = await createTestUser(`user_c_nohh_${runId}@example.com`, testPassword, 'User C No Household');

    householdAId = await createTestHousehold('Petaling Jaya', `18 Jalan SS 2/6 ${runId}`);
    householdBId = await createTestHousehold('Bangsar', `42 Jalan Telawi ${runId}`);

    await linkProfile(userA.id, householdAId);
    await linkProfile(userB.id, householdBId);

    tokenA = await signInUser(`user_a_waste_${runId}@example.com`, testPassword);
    tokenB = await signInUser(`user_b_waste_${runId}@example.com`, testPassword);
    tokenC = await signInUser(`user_c_nohh_${runId}@example.com`, testPassword);

    const dummyPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);

    // Upload test photos
    await uploadWastePhoto(`${householdAId}/plastic_bottle.png`, dummyPng, tokenA);
    await uploadWastePhoto(`${householdAId}/paper_carton.png`, dummyPng, tokenA);
    await uploadWastePhoto(`${householdAId}/general_food_waste.png`, dummyPng, tokenA);
    await uploadWastePhoto(`${householdBId}/b_photo.png`, dummyPng, tokenB);

    console.log('--- Executing scan-waste Verification Tests ---\n');

    // ------------------------------------------------------------------------
    // TEST 1: Unauthenticated request -> should be rejected (401)
    // ------------------------------------------------------------------------
    {
      const res = await callScanWaste({ image_path: `${householdAId}/plastic_bottle.png` }, null);
      const passed = res.status === 401;
      recordResult(
        1,
        'Unauthenticated request rejected',
        'HTTP 401 Unauthorized',
        res.status,
        JSON.stringify(res.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 2: User with no household -> should be rejected (400)
    // ------------------------------------------------------------------------
    {
      const res = await callScanWaste({ image_path: `${householdAId}/plastic_bottle.png` }, tokenC);
      const passed = res.status === 400;
      recordResult(
        2,
        'User without household rejected',
        'HTTP 400 Bad Request',
        res.status,
        JSON.stringify(res.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 3: Cross-household image path -> should be rejected (403)
    // ------------------------------------------------------------------------
    {
      const res = await callScanWaste({ image_path: `${householdBId}/b_photo.png` }, tokenA);
      const passed = res.status === 403;
      recordResult(
        3,
        'Cross-household path access rejected',
        'HTTP 403 Forbidden',
        res.status,
        JSON.stringify(res.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 4: Bucket root / invalid prefix path -> should be rejected (403)
    // ------------------------------------------------------------------------
    {
      const res = await callScanWaste({ image_path: 'root_photo.png' }, tokenA);
      const passed = res.status === 403;
      recordResult(
        4,
        'Root image path rejected',
        'HTTP 403 Forbidden',
        res.status,
        JSON.stringify(res.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 5: Recyclable Scan 1 (Plastic Bottle) -> Success, Deed + 10 Points
    // ------------------------------------------------------------------------
    {
      const res = await callScanWaste({ image_path: `${householdAId}/plastic_bottle.png` }, tokenA);
      const isOk = res.ok && res.status === 200;
      const body = res.body;

      // Verify DB records
      const scansRes = await fetch(`${apiUrl}/rest/v1/waste_scans?id=eq.${body.scan_id}`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      });
      const scansData = await scansRes.json();

      const deedsRes = await fetch(`${apiUrl}/rest/v1/deeds?id=eq.${body.deed_id}`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      });
      const deedsData = await deedsRes.json();

      const pointsRes = await fetch(`${apiUrl}/rest/v1/points?deed_id=eq.${body.deed_id}`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      });
      const pointsData = await pointsRes.json();

      const passed =
        isOk &&
        body.bin_type === 'plastic' &&
        body.is_recyclable === true &&
        body.points_awarded === 10 &&
        body.daily_limit_reached === false &&
        scansData.length === 1 &&
        deedsData.length === 1 &&
        deedsData[0].task_type === 'recycle' &&
        pointsData.length === 1 &&
        pointsData[0].amount === 10;

      recordResult(
        5,
        'Recyclable scan: plastic bottle',
        'HTTP 200, bin=plastic, deed=recycle, points=10',
        res.status,
        `bin=${body.bin_type}, pts=${body.points_awarded}, deed=${body.deed_id}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 6: Non-recyclable Scan (General Food Scraps) -> Success, 0 Points, No Deed
    // ------------------------------------------------------------------------
    {
      const res = await callScanWaste({ image_path: `${householdAId}/general_food_waste.png` }, tokenA);
      const isOk = res.ok && res.status === 200;
      const body = res.body;

      const passed =
        isOk &&
        body.bin_type === 'general' &&
        body.is_recyclable === false &&
        body.points_awarded === 0 &&
        body.deed_id === null;

      recordResult(
        6,
        'Non-recyclable scan: food waste',
        'HTTP 200, bin=general, points=0, deed=null',
        res.status,
        `bin=${body.bin_type}, pts=${body.points_awarded}, deed=${body.deed_id}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 7: Daily Deed Cap Enforcement (First 3 give points, 4th capped at 0)
    // ------------------------------------------------------------------------
    {
      // We already completed 1 deed in Test 5.
      // Perform deed 2:
      await callScanWaste({ image_path: `${householdAId}/paper_carton.png` }, tokenA);
      // Perform deed 3:
      await callScanWaste({ image_path: `${householdAId}/plastic_bottle.png` }, tokenA);

      // Perform deed 4 (Exceeds daily deed limit of 3 in Malaysia time):
      const res4 = await callScanWaste({ image_path: `${householdAId}/paper_carton.png` }, tokenA);
      const body4 = res4.body;

      const passed =
        res4.ok &&
        body4.is_recyclable === true &&
        body4.deed_id !== null &&
        body4.points_awarded === 0 &&
        body4.daily_limit_reached === true;

      recordResult(
        7,
        'Daily deed cap (4th scan today)',
        'HTTP 200, deed recorded, points=0, daily_limit_reached=true',
        res4.status,
        `pts=${body4.points_awarded}, deed=${body4.deed_id}, daily_limit_reached=${body4.daily_limit_reached}`,
        passed
      );
    }
  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    console.log('\n--- Cleaning up Test Fixtures ---');
    try {
      if (householdAId) {
        await fetch(`${apiUrl}/rest/v1/households?id=eq.${householdAId}`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        });
        await fetch(`${apiUrl}/storage/v1/object/waste-photos`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefixes: [`${householdAId}/plastic_bottle.png`, `${householdAId}/paper_carton.png`, `${householdAId}/general_food_waste.png`] }),
        });
      }
      if (householdBId) {
        await fetch(`${apiUrl}/rest/v1/households?id=eq.${householdBId}`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        });
        await fetch(`${apiUrl}/storage/v1/object/waste-photos`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefixes: [`${householdBId}/b_photo.png`] }),
        });
      }
      if (userA?.id) {
        await fetch(`${apiUrl}/auth/v1/admin/users/${userA.id}`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        });
      }
      if (userB?.id) {
        await fetch(`${apiUrl}/auth/v1/admin/users/${userB.id}`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        });
      }
      if (userC?.id) {
        await fetch(`${apiUrl}/auth/v1/admin/users/${userC.id}`, {
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
  console.log('STAGE 5 (PART 1): scan-waste EDGE FUNCTION VERIFICATION RESULTS');
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
  for (const r of results) {
    console.log(`Test ${r.testNumber}: ${r.testName}`);
    console.log(`  Expected: ${r.expected}`);
    console.log(`  Actual Status: ${r.actualStatus}`);
    console.log(`  Actual Details: ${r.actualMessage}`);
    console.log(`  Status: ${r.passed ? 'PASSED' : 'FAILED'}\n`);
  }
}

main();
