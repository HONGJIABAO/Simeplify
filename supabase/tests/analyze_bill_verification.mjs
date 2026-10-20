// supabase/tests/analyze_bill_verification.mjs
// Verification suite for Stage 5 (Part 2): analyze-bill Edge Function
// Verifies: Auth enforcement, cross-household path rejection, electricity bill analysis (estimate comparison,
// deeds, +50 energy points, duplicate avoidance), water bill anomaly detection (normal, leak_detected, major_pipe_burst),
// and automatic notification trigger execution.

import { getTestCredentials } from './testSafety.mjs';

const { apiUrl, functionsUrl, anonKey, serviceRoleKey } = getTestCredentials();

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

async function main() {
  const runId = Date.now();
  const testPassword = 'Password_Test_123!';

  let userA, userB, userC;
  let tokenA, tokenB, tokenC;
  let householdAId, householdBId;

  console.log('--- Setting up Stage 5 (Part 2) Test Fixtures ---');
  try {
    userA = await createTestUser(`user_a_bill_${runId}@example.com`, testPassword, 'User A Bill');
    userB = await createTestUser(`user_b_bill_${runId}@example.com`, testPassword, 'User B Bill');
    userC = await createTestUser(`user_c_nohh_bill_${runId}@example.com`, testPassword, 'User C No Household');

    // 3 residents for User A to match Appendix B baseline
    householdAId = await createTestHousehold('Petaling Jaya', `18 Jalan SS 2/6 ${runId}`, 3);
    householdBId = await createTestHousehold('Bangsar', `42 Jalan Telawi ${runId}`, 2);

    await linkProfile(userA.id, householdAId);
    await linkProfile(userB.id, householdBId);

    tokenA = await signInUser(`user_a_bill_${runId}@example.com`, testPassword);
    tokenB = await signInUser(`user_b_bill_${runId}@example.com`, testPassword);
    tokenC = await signInUser(`user_c_nohh_bill_${runId}@example.com`, testPassword);

    const dummyPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);

    // Upload test files to bills bucket
    await uploadBillFile(`${householdAId}/elec_oct.png`, dummyPng, tokenA);
    await uploadBillFile(`${householdAId}/water_sep.png`, dummyPng, tokenA);
    await uploadBillFile(`${householdAId}/water_oct.png`, dummyPng, tokenA);
    await uploadBillFile(`${householdAId}/water_nov.png`, dummyPng, tokenA);
    await uploadBillFile(`${householdBId}/b_bill.png`, dummyPng, tokenB);

    console.log('--- Executing analyze-bill Verification Tests ---\n');

    // ------------------------------------------------------------------------
    // TEST 1: Unauthenticated request -> should be rejected (401)
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill({ file_path: `${householdAId}/elec_oct.png` }, null);
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
      const res = await callAnalyzeBill({ file_path: `${householdAId}/elec_oct.png` }, tokenC);
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
    // TEST 3: Cross-household file path access -> should be rejected (403)
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill({ file_path: `${householdBId}/b_bill.png` }, tokenA);
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
    // TEST 4: Bucket root path access -> should be rejected (403)
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill({ file_path: 'root_bill.png' }, tokenA);
      const passed = res.status === 403;
      recordResult(
        4,
        'Root file path rejected',
        'HTTP 403 Forbidden',
        res.status,
        JSON.stringify(res.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 5: Electricity Bill (usage < estimate) -> Bill saved, deed created, +50 energy points
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill(
        {
          file_path: `${householdAId}/elec_oct.png`,
          type: 'electricity',
          billing_month: '2026-10-01',
          usage: 280,
          amount: 75.00,
          estimate_usage: 350,
        },
        tokenA
      );
      const body = res.body;

      // Verify in DB: bills
      const billsData = await queryTable('bills', `household_id=eq.${householdAId}&type=eq.electricity&billing_month=eq.2026-10-01`);
      const bill = billsData[0];

      // Verify in DB: deeds
      const deedsData = await queryTable('deeds', `household_id=eq.${householdAId}&task_type=eq.upload_lower_bill`);

      // Verify in DB: points
      const pointsData = await queryTable('points', `household_id=eq.${householdAId}&source=eq.energy&billing_month=eq.2026-10-01`);

      const passed =
        res.ok &&
        res.status === 200 &&
        body.lower_than_estimate === true &&
        body.points_awarded === 50 &&
        bill?.usage == 280 &&
        bill?.analysis?.lower_than_estimate === true &&
        deedsData.length >= 1 &&
        pointsData.length === 1 &&
        pointsData[0].amount === 50;

      recordResult(
        5,
        'Electricity bill lower than estimate',
        'HTTP 200, lower_than_estimate=true, points=50, deed created',
        res.status,
        `lower=${body.lower_than_estimate}, pts=${body.points_awarded}, bill_id=${body.bill_id}, points_rows=${pointsData.length}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 6: Re-uploading Electricity Bill for same month -> No duplicate points
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill(
        {
          file_path: `${householdAId}/elec_oct.png`,
          type: 'electricity',
          billing_month: '2026-10-01',
          usage: 275, // corrected usage
          amount: 72.00,
          estimate_usage: 350,
        },
        tokenA
      );
      const body = res.body;

      // Verify points row count is still exactly 1
      const pointsData = await queryTable('points', `household_id=eq.${householdAId}&source=eq.energy&billing_month=eq.2026-10-01`);

      const passed =
        res.ok &&
        res.status === 200 &&
        body.already_awarded === true &&
        body.points_awarded === 0 &&
        pointsData.length === 1;

      recordResult(
        6,
        'Electricity re-upload same month duplicate prevention',
        'HTTP 200, points_awarded=0, already_awarded=true, 1 points row',
        res.status,
        `pts=${body.points_awarded}, already_awarded=${body.already_awarded}, points_rows=${pointsData.length}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 7: Water Bill baseline (September: 12 m³) -> Normal level, no notification
    // ------------------------------------------------------------------------
    {
      const res = await callAnalyzeBill(
        {
          file_path: `${householdAId}/water_sep.png`,
          type: 'water',
          billing_month: '2026-09-01',
          usage: 12.0,
          amount: 25.00,
        },
        tokenA
      );
      const body = res.body;

      const alertsData = await queryTable('alerts', `household_id=eq.${householdAId}&bill_id=eq.${body.bill_id}`);
      const notifsData = await queryTable('notifications', `household_id=eq.${householdAId}&type=eq.bill_alert`);

      const passed =
        res.ok &&
        res.status === 200 &&
        body.level === 'normal' &&
        alertsData[0]?.level === 'normal' &&
        notifsData.length === 0;

      recordResult(
        7,
        'Water baseline bill (normal)',
        'HTTP 200, level=normal, 0 notifications',
        res.status,
        `level=${body.level}, alert_level=${alertsData[0]?.level}, notifs=${notifsData.length}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 8: Water Bill with MoM spike (+50% vs Sep) -> Leak detected + Trigger creates notification
    // ------------------------------------------------------------------------
    {
      // Sep was 12.0 m³. Oct is 18.0 m³ ((18 - 12)/12 = +50%, in +30%..+99% range -> leak_detected)
      const res = await callAnalyzeBill(
        {
          file_path: `${householdAId}/water_oct.png`,
          type: 'water',
          billing_month: '2026-10-01',
          usage: 18.0,
          amount: 35.00,
        },
        tokenA
      );
      const body = res.body;

      const alertsData = await queryTable('alerts', `household_id=eq.${householdAId}&bill_id=eq.${body.bill_id}`);
      const notifsData = await queryTable('notifications', `household_id=eq.${householdAId}&type=eq.bill_alert&order=created_at.desc`);
      const latestNotif = notifsData[0];

      const passed =
        res.ok &&
        res.status === 200 &&
        body.level === 'leak_detected' &&
        alertsData[0]?.level === 'leak_detected' &&
        latestNotif &&
        latestNotif.type === 'bill_alert' &&
        latestNotif.title === 'Water Leak Detected' &&
        latestNotif.is_read === false &&
        latestNotif.linked_path === '/(tabs)/scanner';

      recordResult(
        8,
        'Water leak detected (+50% MoM) + notification trigger',
        'HTTP 200, level=leak_detected, notification created via trigger',
        res.status,
        `level=${body.level}, notif_title="${latestNotif?.title}", path=${latestNotif?.linked_path}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 9: Water Bill with Major pipe burst (+122% MoM vs Oct) -> Major pipe burst + notification
    // ------------------------------------------------------------------------
    {
      // Oct was 18.0 m³. Nov is 40.0 m³ ((40 - 18)/18 = +122%, >= +100% -> major_pipe_burst)
      const res = await callAnalyzeBill(
        {
          file_path: `${householdAId}/water_nov.png`,
          type: 'water',
          billing_month: '2026-11-01',
          usage: 40.0,
          amount: 95.00,
        },
        tokenA
      );
      const body = res.body;

      const alertsData = await queryTable('alerts', `household_id=eq.${householdAId}&bill_id=eq.${body.bill_id}`);
      const notifsData = await queryTable('notifications', `household_id=eq.${householdAId}&type=eq.bill_alert&order=created_at.desc`);
      const latestNotif = notifsData[0];

      const passed =
        res.ok &&
        res.status === 200 &&
        body.level === 'major_pipe_burst' &&
        alertsData[0]?.level === 'major_pipe_burst' &&
        latestNotif &&
        latestNotif.title === 'Major Pipe Burst Detected';

      recordResult(
        9,
        'Major pipe burst (+122% MoM) + notification trigger',
        'HTTP 200, level=major_pipe_burst, notification="Major Pipe Burst Detected"',
        res.status,
        `level=${body.level}, notif_title="${latestNotif?.title}"`,
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
        await fetch(`${apiUrl}/storage/v1/object/bills`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prefixes: [
              `${householdAId}/elec_oct.png`,
              `${householdAId}/water_sep.png`,
              `${householdAId}/water_oct.png`,
              `${householdAId}/water_nov.png`,
            ],
          }),
        });
      }
      if (householdBId) {
        await fetch(`${apiUrl}/rest/v1/households?id=eq.${householdBId}`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        });
        await fetch(`${apiUrl}/storage/v1/object/bills`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefixes: [`${householdBId}/b_bill.png`] }),
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
  for (const r of results) {
    console.log(`Test ${r.testNumber}: ${r.testName}`);
    console.log(`  Expected: ${r.expected}`);
    console.log(`  Actual Status: ${r.actualStatus}`);
    console.log(`  Actual Details: ${r.actualMessage}`);
    console.log(`  Status: ${r.passed ? 'PASSED' : 'FAILED'}\n`);
  }
}

main();
