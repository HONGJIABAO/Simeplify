// supabase/tests/storage_verification.mjs
// Verification tests for Supabase Storage (Task 3)
// Household folder isolation, MIME limits, size limits, RLS policies.

import { getTestCredentials } from './testSafety.mjs';

const { apiUrl, anonKey, serviceRoleKey } = getTestCredentials();

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

// Helper: Admin User Creation
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
  if (!res.ok) {
    throw new Error(`Failed to create test user ${email}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data;
}

// Helper: User Sign-in to get JWT
async function signInUser(email, password) {
  const res = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Failed to sign in ${email}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

// Helper: Create household via service_role
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
  if (!res.ok) {
    throw new Error(`Failed to create household: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data[0].id;
}

// Helper: Bind user profile to household
async function linkUserProfile(userId, householdId) {
  const res = await fetch(`${apiUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ household_id: householdId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to link profile: ${res.status} ${await res.text()}`);
  }
}

// Storage operations
async function uploadObject(bucket, path, content, mimeType, token, upsert = false) {
  const headers = {
    apikey: anonKey,
    'Content-Type': mimeType,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (upsert) {
    headers['x-upsert'] = 'true';
  }

  const res = await fetch(`${apiUrl}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers,
    body: content,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, body: json };
}

async function downloadObject(bucket, path, token) {
  const headers = {
    apikey: anonKey,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${apiUrl}/storage/v1/object/authenticated/${bucket}/${path}`, {
    method: 'GET',
    headers,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, body: json };
}

async function listObjects(bucket, prefix, token) {
  const headers = {
    apikey: anonKey,
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${apiUrl}/storage/v1/object/list/${bucket}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prefix: prefix || '', limit: 100 }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, body: json };
}

async function deleteObjects(bucket, prefixes, token) {
  const headers = {
    apikey: anonKey,
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${apiUrl}/storage/v1/object/${bucket}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ prefixes }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, body: json };
}

async function main() {
  const runId = Date.now();
  const testPassword = 'Password_Test_123!';

  let userA, userB, userC;
  let tokenA, tokenB, tokenC;
  let householdAId, householdBId;

  console.log('--- Setting up Test Fixtures ---');
  try {
    // 1. Create User A, User B, User C
    userA = await createTestUser(`test_user_a_${runId}@example.com`, testPassword, 'User A');
    userB = await createTestUser(`test_user_b_${runId}@example.com`, testPassword, 'User B');
    userC = await createTestUser(`test_user_c_nohh_${runId}@example.com`, testPassword, 'User C No Household');

    // 2. Create Households A and B
    householdAId = await createTestHousehold('Petaling Jaya', '18 Jalan SS 2/6');
    householdBId = await createTestHousehold('Bangsar', '42 Jalan Telawi');

    // 3. Link Profiles
    await linkUserProfile(userA.id, householdAId);
    await linkUserProfile(userB.id, householdBId);
    // User C remains unlinked (no household)

    // 4. Authenticate to get JWT tokens
    tokenA = await signInUser(`test_user_a_${runId}@example.com`, testPassword);
    tokenB = await signInUser(`test_user_b_${runId}@example.com`, testPassword);
    tokenC = await signInUser(`test_user_c_nohh_${runId}@example.com`, testPassword);

    console.log(`User A: ${userA.id} in Household A: ${householdAId}`);
    console.log(`User B: ${userB.id} in Household B: ${householdBId}`);
    console.log(`User C (no household): ${userC.id}`);
    console.log('--- Starting Storage Verification Tests ---\n');

    const samplePng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);

    // Pre-seed a file for User B in User B's folder (bills and waste-photos)
    const bUploadBills = await uploadObject('bills', `${householdBId}/b_bill.png`, samplePng, 'image/png', tokenB);
    const bUploadWaste = await uploadObject('waste-photos', `${householdBId}/b_waste.png`, samplePng, 'image/png', tokenB);

    // ------------------------------------------------------------------------
    // TEST 1: A uploads to their own household folder → should succeed
    // ------------------------------------------------------------------------
    {
      const res = await uploadObject('bills', `${householdAId}/a_bill.png`, samplePng, 'image/png', tokenA);
      const passed = res.ok && res.status === 200;
      recordResult(
        1,
        'A uploads to their own household folder',
        'Should succeed (HTTP 200)',
        res.status,
        JSON.stringify(res.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 2: A uploads to B’s household folder → should be rejected
    // ------------------------------------------------------------------------
    {
      const res = await uploadObject('bills', `${householdBId}/a_invading.png`, samplePng, 'image/png', tokenA);
      const passed = !res.ok;
      recordResult(
        2,
        'A uploads to B’s household folder',
        'Should be rejected (RLS error)',
        res.status,
        JSON.stringify(res.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 3: A uploads to the bucket root → should be rejected
    // ------------------------------------------------------------------------
    {
      const res = await uploadObject('bills', 'root_file.png', samplePng, 'image/png', tokenA);
      const passed = !res.ok;
      recordResult(
        3,
        'A uploads to the bucket root',
        'Should be rejected (RLS error)',
        res.status,
        JSON.stringify(res.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 4: A downloads/lists B’s files → should be rejected or empty
    // ------------------------------------------------------------------------
    {
      const listRes = await listObjects('bills', householdBId, tokenA);
      const downloadRes = await downloadObject('bills', `${householdBId}/b_bill.png`, tokenA);
      const isListEmpty = Array.isArray(listRes.body) && listRes.body.length === 0;
      const isDownloadRejected = !downloadRes.ok;
      const passed = isListEmpty && isDownloadRejected;
      recordResult(
        4,
        'A downloads/lists B’s files',
        'Should be rejected or empty (List empty & Download rejected)',
        `List: ${listRes.status}, Download: ${downloadRes.status}`,
        `List count: ${Array.isArray(listRes.body) ? listRes.body.length : 'N/A'}, Download msg: ${JSON.stringify(downloadRes.body)}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 5: A deletes B’s file → should affect 0 rows
    // ------------------------------------------------------------------------
    {
      const delRes = await deleteObjects('bills', [`${householdBId}/b_bill.png`], tokenA);
      // Supabase storage delete returns empty array [] when RLS prevents deletion
      const affectedRows = Array.isArray(delRes.body) ? delRes.body.length : (delRes.ok ? 0 : 'error');
      // Also verify file still exists via service_role
      const verifyStillExists = await downloadObject('bills', `${householdBId}/b_bill.png`, serviceRoleKey);
      const passed = (affectedRows === 0 || !delRes.ok) && verifyStillExists.ok;
      recordResult(
        5,
        'A deletes B’s file',
        'Should affect 0 rows (file remains intact)',
        delRes.status,
        `Affected rows: ${affectedRows}, File still exists: ${verifyStillExists.ok}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 6: anon reads/uploads → should be rejected
    // ------------------------------------------------------------------------
    {
      const anonUpload = await uploadObject('bills', `${householdAId}/anon_test.png`, samplePng, 'image/png', null);
      const anonDownload = await downloadObject('bills', `${householdAId}/a_bill.png`, null);
      const passed = !anonUpload.ok && !anonDownload.ok;
      recordResult(
        6,
        'anon reads/uploads',
        'Should be rejected (Upload & Download rejected)',
        `Upload: ${anonUpload.status}, Download: ${anonDownload.status}`,
        `Upload: ${JSON.stringify(anonUpload.body)}, Download: ${JSON.stringify(anonDownload.body)}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 7: Upload a .gif to bills → should be rejected by the MIME limit
    // ------------------------------------------------------------------------
    {
      const gifBuffer = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');
      const gifRes = await uploadObject('bills', `${householdAId}/sample.gif`, gifBuffer, 'image/gif', tokenA);
      const passed = !gifRes.ok;
      recordResult(
        7,
        'Upload a .gif to bills',
        'Should be rejected by the MIME limit',
        gifRes.status,
        JSON.stringify(gifRes.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 8: Upload 11 MB to bills and 6 MB to waste-photos → should be rejected by the size limit
    // ------------------------------------------------------------------------
    {
      console.log('Testing size limits (generating 11MB and 6MB payloads)...');
      const large11MB = Buffer.alloc(11 * 1024 * 1024, 0x61);
      const large6MB = Buffer.alloc(6 * 1024 * 1024, 0x61);

      const bills11Res = await uploadObject('bills', `${householdAId}/large_11mb.pdf`, large11MB, 'application/pdf', tokenA);
      const waste6Res = await uploadObject('waste-photos', `${householdAId}/large_6mb.png`, large6MB, 'image/png', tokenA);

      const passed = !bills11Res.ok && !waste6Res.ok;
      recordResult(
        8,
        'Upload 11 MB to bills and 6 MB to waste-photos',
        'Should be rejected by the size limit',
        `Bills(11MB): ${bills11Res.status}, Waste(6MB): ${waste6Res.status}`,
        `Bills: ${JSON.stringify(bills11Res.body)} | Waste: ${JSON.stringify(waste6Res.body)}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 9: Overwrite a file in waste-photos with upsert: true → should be rejected
    // ------------------------------------------------------------------------
    {
      // 1. Initial upload to waste-photos (insert)
      const initialRes = await uploadObject('waste-photos', `${householdAId}/photo1.png`, samplePng, 'image/png', tokenA);
      // 2. Overwrite attempt with upsert: true
      const upsertRes = await uploadObject('waste-photos', `${householdAId}/photo1.png`, samplePng, 'image/png', tokenA, true);
      const passed = initialRes.ok && !upsertRes.ok;
      recordResult(
        9,
        'Overwrite a file in waste-photos with upsert: true',
        'Should be rejected (No UPDATE policy on waste-photos)',
        upsertRes.status,
        JSON.stringify(upsertRes.body),
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 10: A deletes their own file → should succeed
    // ------------------------------------------------------------------------
    {
      // Delete A's file in bills created in Test 1
      const delRes = await deleteObjects('bills', [`${householdAId}/a_bill.png`], tokenA);
      const verifyDeleted = await downloadObject('bills', `${householdAId}/a_bill.png`, tokenA);
      const affectedRows = Array.isArray(delRes.body) ? delRes.body.length : 0;
      const passed = delRes.ok && affectedRows === 1 && !verifyDeleted.ok;
      recordResult(
        10,
        'A deletes their own file',
        'Should succeed (File deleted, 1 row affected)',
        delRes.status,
        `Affected rows: ${affectedRows}, Deleted file verified gone: ${!verifyDeleted.ok}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 11: service_role reads any household’s file → should succeed
    // ------------------------------------------------------------------------
    {
      // Read B's file using service_role
      const readBRes = await downloadObject('bills', `${householdBId}/b_bill.png`, serviceRoleKey);
      const passed = readBRes.ok && readBRes.status === 200;
      recordResult(
        11,
        'service_role reads any household’s file',
        'Should succeed (HTTP 200)',
        readBRes.status,
        `Read successful, content length: ${typeof readBRes.body === 'string' ? readBRes.body.length : JSON.stringify(readBRes.body).length}`,
        passed
      );
    }

    // ------------------------------------------------------------------------
    // TEST 12: A new user with no household uploads → should be rejected
    // ------------------------------------------------------------------------
    {
      // User C has no household. Attempt upload to random household folder or C's ID
      const res = await uploadObject('bills', `${householdAId}/c_file.png`, samplePng, 'image/png', tokenC);
      const resRoot = await uploadObject('bills', `c_root_file.png`, samplePng, 'image/png', tokenC);
      const passed = !res.ok && !resRoot.ok;
      recordResult(
        12,
        'A new user with no household uploads',
        'Should be rejected (current_household_id is NULL)',
        `Targeting Folder: ${res.status}, Targeting Root: ${resRoot.status}`,
        `Folder: ${JSON.stringify(res.body)} | Root: ${JSON.stringify(resRoot.body)}`,
        passed
      );
    }
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------------
    console.log('\n--- Cleaning up Test Users and Files ---');
    try {
      // Clean storage files
      if (householdAId) {
        await deleteObjects('bills', [`${householdAId}/a_bill.png`, `${householdAId}/photo1.png`, `${householdAId}/sample.gif`, `${householdAId}/large_11mb.pdf`], serviceRoleKey);
        await deleteObjects('waste-photos', [`${householdAId}/photo1.png`, `${householdAId}/large_6mb.png`], serviceRoleKey);
      }
      if (householdBId) {
        await deleteObjects('bills', [`${householdBId}/b_bill.png`], serviceRoleKey);
        await deleteObjects('waste-photos', [`${householdBId}/b_waste.png`], serviceRoleKey);
      }

      // Clean users
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

      // Clean households
      if (householdAId) {
        await fetch(`${apiUrl}/rest/v1/households?id=eq.${householdAId}`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        });
      }
      if (householdBId) {
        await fetch(`${apiUrl}/rest/v1/households?id=eq.${householdBId}`, {
          method: 'DELETE',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        });
      }
      console.log('Cleanup completed successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }
  }

  // Print results table
  console.log('\n================================================================================');
  console.log('STORAGE VERIFICATION TEST RESULTS (TASK 3)');
  console.log('================================================================================\n');
  console.table(
    results.map((r) => ({
      '#': r.testNumber,
      'Test Description': r.testName,
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
