import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

test('Stage 6 (Part 3): Bin Storage, scan-waste Edge Function, and Database State Integration', async () => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const testEmail = `stage6_bin_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // 1. Sign up & sign in authenticated user
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        name: 'Bin Tester',
        gender: 'girl',
        state: 'Selangor',
        city: 'Subang Jaya',
        street: '12, Jalan SS 15/4',
      },
    },
  });
  assert.equal(signUpError, null, `Sign up failed: ${signUpError?.message}`);
  assert.ok(signUpData.user, 'Expected user on sign up');

  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  assert.equal(signInError, null, `Sign in failed: ${signInError?.message}`);
  assert.ok(signInData.session, 'Expected session after sign in');

  // 2. Create household via RPC
  const { data: householdId, error: rpcError } = await client.rpc('create_household', {
    p_state: 'Selangor',
    p_city: 'Subang Jaya',
    p_street: '12, Jalan SS 15/4',
  });
  assert.equal(rpcError, null, `create_household RPC failed: ${rpcError?.message}`);
  assert.ok(householdId, 'Expected valid household ID');

  // 3. Upload a sample waste photo to 'waste-photos' bucket
  const cartonFileName = `${Date.now()}_beverage_carton.jpg`;
  const cartonStoragePath = `${householdId}/${cartonFileName}`;
  const dummyImageBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);

  const { data: uploadData, error: uploadError } = await client.storage
    .from('waste-photos')
    .upload(cartonStoragePath, dummyImageBytes, {
      contentType: 'image/jpeg',
      upsert: false,
    });
  assert.equal(uploadError, null, `Storage upload failed: ${uploadError?.message}`);
  assert.ok(uploadData?.path, 'Expected storage path in upload result');

  // Verify file can be listed inside user's household folder
  const { data: listFiles, error: listError } = await client.storage
    .from('waste-photos')
    .list(householdId);
  assert.equal(listError, null);
  const foundUploaded = listFiles.find((f) => f.name === cartonFileName);
  assert.ok(foundUploaded, 'Uploaded file must be present in household folder');

  // 4. Invoke scan-waste Edge Function
  const { data: scan1, error: scan1Error } = await client.functions.invoke('scan-waste', {
    body: {
      image_path: cartonStoragePath,
    },
  });
  assert.equal(scan1Error, null, `scan-waste invocation failed: ${scan1Error?.message}`);
  assert.equal(scan1.success, true);
  assert.equal(scan1.bin_type, 'paper');
  assert.equal(scan1.is_recyclable, true);
  assert.equal(scan1.points_awarded, 10, 'Expected 10 points for first recyclable item');
  assert.equal(scan1.daily_limit_reached, false);
  assert.ok(scan1.scan_id, 'Expected scan_id');
  assert.ok(scan1.deed_id, 'Expected deed_id');

  // 5. Verify database rows created by scan-waste
  // 5a. waste_scans row
  const { data: dbScans, error: dbScansError } = await client
    .from('waste_scans')
    .select('*')
    .eq('household_id', householdId);
  assert.equal(dbScansError, null);
  assert.equal(dbScans.length, 1);
  assert.equal(dbScans[0].bin_type, 'paper');
  assert.equal(dbScans[0].is_recyclable, true);

  // 5b. deeds row
  const { data: dbDeeds, error: dbDeedsError } = await client
    .from('deeds')
    .select('*')
    .eq('household_id', householdId);
  assert.equal(dbDeedsError, null);
  assert.equal(dbDeeds.length, 1);
  assert.equal(dbDeeds[0].task_type, 'recycle');

  // 5c. points row
  const { data: dbPoints, error: dbPointsError } = await client
    .from('points')
    .select('*')
    .eq('household_id', householdId);
  assert.equal(dbPointsError, null);
  assert.equal(dbPoints.length, 1);
  assert.equal(dbPoints[0].source, 'recycling');
  assert.equal(dbPoints[0].amount, 10);

  // 6. Test Daily Deed Cap (COM-03 rule: first 3 deeds give points, 4th gives 0 points)
  // Upload & scan 2nd recyclable item (PET plastic bottle)
  const plasticPath = `${householdId}/${Date.now()}_pet_water_bottle.jpg`;
  await client.storage.from('waste-photos').upload(plasticPath, dummyImageBytes, { contentType: 'image/jpeg' });
  const { data: scan2 } = await client.functions.invoke('scan-waste', { body: { image_path: plasticPath } });
  assert.equal(scan2.bin_type, 'plastic');
  assert.equal(scan2.points_awarded, 10);
  assert.equal(scan2.daily_limit_reached, false);

  // Upload & scan 3rd recyclable item (Glass jar / aluminium can)
  const glassPath = `${householdId}/${Date.now()}_glass_olive_jar.jpg`;
  await client.storage.from('waste-photos').upload(glassPath, dummyImageBytes, { contentType: 'image/jpeg' });
  const { data: scan3 } = await client.functions.invoke('scan-waste', { body: { image_path: glassPath } });
  assert.equal(scan3.bin_type, 'glass_metal');
  assert.equal(scan3.points_awarded, 10);
  assert.equal(scan3.daily_limit_reached, false);

  // Upload & scan 4th recyclable item (hits daily deed limit)
  const cartonPath2 = `${householdId}/${Date.now()}_carton_box_2.jpg`;
  await client.storage.from('waste-photos').upload(cartonPath2, dummyImageBytes, { contentType: 'image/jpeg' });
  const { data: scan4 } = await client.functions.invoke('scan-waste', { body: { image_path: cartonPath2 } });
  assert.equal(scan4.bin_type, 'paper');
  assert.equal(scan4.is_recyclable, true);
  assert.equal(scan4.points_awarded, 0, 'Expected 0 points after 3 deeds');
  assert.equal(scan4.daily_limit_reached, true, 'Expected daily_limit_reached to be true');

  // 7. Test General Waste (Non-recyclable)
  const foodPath = `${householdId}/${Date.now()}_food_scrap.jpg`;
  await client.storage.from('waste-photos').upload(foodPath, dummyImageBytes, { contentType: 'image/jpeg' });
  const { data: scan5 } = await client.functions.invoke('scan-waste', { body: { image_path: foodPath } });
  assert.equal(scan5.bin_type, 'general');
  assert.equal(scan5.is_recyclable, false);
  assert.equal(scan5.points_awarded, 0);
  assert.equal(scan5.deed_id, null, 'General waste should not produce a deed');

  // 8. Test Database Aggregations for fetchBinState
  // Total scans = 5 (4 recyclable, 1 general)
  const { data: allScans } = await client.from('waste_scans').select('*').eq('household_id', householdId);
  assert.equal(allScans.length, 5);

  // Total recyclable items diverted = 4
  const { count: divertedCount } = await client
    .from('waste_scans')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('is_recyclable', true);
  assert.equal(divertedCount, 4);

  // Total recycling points = 30 (10 + 10 + 10 + 0 + 0)
  const { data: pointsList } = await client
    .from('points')
    .select('amount')
    .eq('household_id', householdId)
    .eq('source', 'recycling');
  const sumPoints = pointsList.reduce((acc, r) => acc + r.amount, 0);
  assert.equal(sumPoints, 30);

  // Total deeds today = 4
  const mytDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const { count: deedsCount } = await client
    .from('deeds')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('deed_date', mytDate);
  assert.equal(deedsCount, 4);
});
