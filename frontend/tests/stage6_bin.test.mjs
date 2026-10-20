import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { getTestCredentials } from './testSafety.mjs';

const { supabaseUrl: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = getTestCredentials();

test('Stage 6 & Fix 1: Bin Storage, scan-waste (classify only), confirm-disposal, and Database State Integration', async () => {
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

  // 4. Invoke scan-waste Edge Function -> CLASSIFY ONLY (0 points, 0 deeds, confirmed_at = null)
  const { data: scan1, error: scan1Error } = await client.functions.invoke('scan-waste', {
    body: {
      image_path: cartonStoragePath,
    },
  });
  assert.equal(scan1Error, null, `scan-waste invocation failed: ${scan1Error?.message}`);
  assert.equal(scan1.success, true);
  assert.equal(scan1.bin_type, 'paper');
  assert.equal(scan1.is_recyclable, true);
  assert.equal(scan1.points_awarded, 0, 'Scan must not award points before "I threw it"');
  assert.equal(scan1.deed_id, null, 'Scan must not record deed before "I threw it"');
  assert.ok(scan1.scan_id, 'Expected scan_id');

  // Verify DB waste_scans row has confirmed_at = null, deeds count = 0, points count = 0
  const { data: dbScansBeforeConfirm } = await client
    .from('waste_scans')
    .select('*')
    .eq('id', scan1.scan_id);
  assert.equal(dbScansBeforeConfirm.length, 1);
  assert.equal(dbScansBeforeConfirm[0].confirmed_at, null);

  const { data: dbDeedsBeforeConfirm } = await client
    .from('deeds')
    .select('*')
    .eq('household_id', householdId);
  assert.equal(dbDeedsBeforeConfirm.length, 0);

  const { data: dbPointsBeforeConfirm } = await client
    .from('points')
    .select('*')
    .eq('household_id', householdId);
  assert.equal(dbPointsBeforeConfirm.length, 0);

  // 5. Invoke confirm-disposal Edge Function ("I threw it" tapped) -> +10 points & 1 deed
  const { data: confirm1, error: confirm1Error } = await client.functions.invoke('confirm-disposal', {
    body: {
      scan_id: scan1.scan_id,
    },
  });
  assert.equal(confirm1Error, null, `confirm-disposal failed: ${confirm1Error?.message}`);
  assert.equal(confirm1.success, true);
  assert.equal(confirm1.points_awarded, 10);
  assert.equal(confirm1.already_confirmed, false);
  assert.equal(confirm1.daily_limit_reached, false);
  assert.ok(confirm1.deed_id, 'Expected deed_id after confirm');

  // Verify DB row now confirmed
  const { data: dbScansAfterConfirm } = await client
    .from('waste_scans')
    .select('*')
    .eq('id', scan1.scan_id);
  assert.ok(dbScansAfterConfirm[0].confirmed_at !== null, 'Expected confirmed_at to be populated');

  const { data: dbDeedsAfterConfirm } = await client
    .from('deeds')
    .select('*')
    .eq('household_id', householdId);
  assert.equal(dbDeedsAfterConfirm.length, 1);
  assert.equal(dbDeedsAfterConfirm[0].task_type, 'recycle');

  const { data: dbPointsAfterConfirm } = await client
    .from('points')
    .select('*')
    .eq('household_id', householdId);
  assert.equal(dbPointsAfterConfirm.length, 1);
  assert.equal(dbPointsAfterConfirm[0].amount, 10);

  // 6. Confirm twice -> no extra points or deeds (already_confirmed = true)
  const { data: confirm1Again, error: confirm1AgainError } = await client.functions.invoke('confirm-disposal', {
    body: {
      scan_id: scan1.scan_id,
    },
  });
  assert.equal(confirm1AgainError, null);
  assert.equal(confirm1Again.already_confirmed, true);
  assert.equal(confirm1Again.points_awarded, 0);

  const { data: dbPointsAfterConfirmAgain } = await client
    .from('points')
    .select('*')
    .eq('household_id', householdId);
  assert.equal(dbPointsAfterConfirmAgain.length, 1, 'Confirm twice must not add points row');

  // 7. Test Daily Deed Cap (First 3 give points, 4th confirm gives 0 points and daily_limit_reached = true)
  // Scan 2 & Confirm 2
  const plasticPath = `${householdId}/${Date.now()}_pet_water_bottle.jpg`;
  await client.storage.from('waste-photos').upload(plasticPath, dummyImageBytes, { contentType: 'image/jpeg' });
  const { data: scan2 } = await client.functions.invoke('scan-waste', { body: { image_path: plasticPath } });
  const { data: confirm2 } = await client.functions.invoke('confirm-disposal', { body: { scan_id: scan2.scan_id } });
  assert.equal(confirm2.points_awarded, 10);
  assert.equal(confirm2.daily_limit_reached, false);

  // Scan 3 & Confirm 3
  const glassPath = `${householdId}/${Date.now()}_glass_olive_jar.jpg`;
  await client.storage.from('waste-photos').upload(glassPath, dummyImageBytes, { contentType: 'image/jpeg' });
  const { data: scan3 } = await client.functions.invoke('scan-waste', { body: { image_path: glassPath } });
  const { data: confirm3 } = await client.functions.invoke('confirm-disposal', { body: { scan_id: scan3.scan_id } });
  assert.equal(confirm3.points_awarded, 10);
  assert.equal(confirm3.daily_limit_reached, false);

  // Scan 4 & Confirm 4 (hits daily cap)
  const cartonPath2 = `${householdId}/${Date.now()}_carton_box_2.jpg`;
  await client.storage.from('waste-photos').upload(cartonPath2, dummyImageBytes, { contentType: 'image/jpeg' });
  const { data: scan4 } = await client.functions.invoke('scan-waste', { body: { image_path: cartonPath2 } });
  const { data: confirm4 } = await client.functions.invoke('confirm-disposal', { body: { scan_id: scan4.scan_id } });
  assert.equal(confirm4.points_awarded, 0, 'Expected 0 points after 3 deeds');
  assert.equal(confirm4.daily_limit_reached, true, 'Expected daily_limit_reached to be true');
  assert.equal(confirm4.deed_id, null, 'No new deed should be recorded after daily limit reached');

  // 8. Test General Waste (Non-recyclable) -> confirm gives 0 points and no deed
  const foodPath = `${householdId}/${Date.now()}_food_scrap.jpg`;
  await client.storage.from('waste-photos').upload(foodPath, dummyImageBytes, { contentType: 'image/jpeg' });
  const { data: scan5 } = await client.functions.invoke('scan-waste', { body: { image_path: foodPath } });
  assert.equal(scan5.bin_type, 'general');
  assert.equal(scan5.is_recyclable, false);

  const { data: confirm5 } = await client.functions.invoke('confirm-disposal', { body: { scan_id: scan5.scan_id } });
  assert.equal(confirm5.is_recyclable, false);
  assert.equal(confirm5.points_awarded, 0);
  assert.equal(confirm5.deed_id, null);

  // 9. Confirming another household's scan fails
  const testEmail2 = `stage6_bin_other_${Date.now()}@example.com`;
  const { data: signUp2 } = await client.auth.signUp({
    email: testEmail2,
    password: testPassword,
  });
  const { data: signIn2 } = await client.auth.signInWithPassword({
    email: testEmail2,
    password: testPassword,
  });
  const { data: householdId2 } = await client.rpc('create_household', {
    p_state: 'Selangor',
    p_city: 'Klang',
    p_street: '99 Jalan Meru',
  });
  const otherCartonPath = `${householdId2}/${Date.now()}_other_carton.jpg`;
  await client.storage.from('waste-photos').upload(otherCartonPath, dummyImageBytes, { contentType: 'image/jpeg' });
  const { data: scanOther } = await client.functions.invoke('scan-waste', { body: { image_path: otherCartonPath } });

  // Now switch back to user 1 and attempt to confirm user 2's scan
  await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  const { data: crossConfirmData, error: crossConfirmError } = await client.functions.invoke('confirm-disposal', {
    body: {
      scan_id: scanOther.scan_id,
    },
  });
  // Cross-household confirm must fail with 403 / error
  assert.ok(
    crossConfirmError !== null || crossConfirmData?.error,
    'Expected cross-household scan confirmation to fail'
  );
});
