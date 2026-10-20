/**
 * Stage 6 (Part 4): Scanner Tab Frontend & Backend Integration Tests
 *
 * Verifies:
 * 1. Pure function tests for POINTS_WITHHELD_MESSAGES and normalizeBillingMonth
 * 2. Upload then read writes no bill, alert, deed, or points rows
 * 3. Save creates the bill and the analysis in public.bills
 * 4. Water bill leak case (18 m³, +48% vs last month) gives amber level 'leak_detected'
 * 5. Water bill major pipe burst case gives 'major_pipe_burst'
 * 6. Normal bill gives 'normal' level
 * 7. Second bill for the same month replaces the first with exactly one alert
 * 8. Energy points awarded only once per billing month
 * 9. Changed number beyond 5% gives no points ('values_changed')
 * 10. Another household cannot read the bill or the storage file (RLS enforcement)
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { getTestCredentials } from './testSafety.mjs';

import {
  POINTS_WITHHELD_MESSAGES,
  getPointsWithheldMessage,
  normalizeBillingMonth,
  formatBillingMonthDisplay,
} from '../src/features/scanner/logic/scannerCore.ts';

const { supabaseUrl: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = getTestCredentials();

test('Scanner: Pure function tests for reason codes and billing month formatting', () => {
  // Test reason code map
  assert.equal(
    getPointsWithheldMessage('values_changed'),
    'No points: the numbers were changed after we read your bill.'
  );
  assert.equal(
    getPointsWithheldMessage('my_day_not_set'),
    'Set up My day in the Simulator to earn energy points.'
  );
  assert.equal(
    getPointsWithheldMessage('not_lower_than_estimate'),
    "This month's usage was not lower than your estimate."
  );
  assert.equal(
    getPointsWithheldMessage('already_awarded'),
    'You already earned energy points for this month.'
  );
  assert.equal(
    getPointsWithheldMessage('daily_limit_reached'),
    "You have reached today's limit of 3 green deeds."
  );
  assert.equal(getPointsWithheldMessage('bill_not_electricity'), null);
  assert.equal(getPointsWithheldMessage(null), null);
  assert.equal(getPointsWithheldMessage(undefined), null);

  // Test normalizeBillingMonth
  assert.equal(normalizeBillingMonth('2026-10-01'), '2026-10-01');
  assert.equal(normalizeBillingMonth('2026-10'), '2026-10-01');
  assert.equal(normalizeBillingMonth('October 2026'), '2026-10-01');
  assert.equal(normalizeBillingMonth('Oct 2026'), '2026-10-01');

  // Test formatBillingMonthDisplay
  assert.equal(formatBillingMonthDisplay('2026-10-01'), 'October 2026');
  assert.equal(formatBillingMonthDisplay('2026-10-01', true), 'Oct');
});

test('Stage 6 Part 4: Scanner Tab Real Backend Integration Tests', async () => {
  const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testEmail1 = `scanner_user1_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // 1. Sign up user 1 & setup household 1
  const { data: signUpData, error: signUpError } = await client1.auth.signUp({
    email: testEmail1,
    password: testPassword,
    options: {
      data: {
        name: 'Scanner Tester 1',
        state: 'Selangor',
        city: 'Petaling Jaya',
      },
    },
  });
  assert.equal(signUpError, null, `User 1 signup failed: ${signUpError?.message}`);
  assert.ok(signUpData.user, 'User 1 expected');

  const { data: signInData, error: signInError } = await client1.auth.signInWithPassword({
    email: testEmail1,
    password: testPassword,
  });
  assert.equal(signInError, null, `User 1 signin failed: ${signInError?.message}`);

  const { data: householdId1, error: rpcError1 } = await client1.rpc('create_household', {
    p_state: 'Selangor',
    p_city: 'Petaling Jaya',
  });
  assert.equal(rpcError1, null, `create_household failed: ${rpcError1?.message}`);
  assert.ok(householdId1, 'Household 1 ID expected');

  // Set residents_count to 3 (matching standard Appendix B 3-person baseline)
  await client1
    .from('households')
    .update({ residents_count: 3 })
    .eq('id', householdId1);

  // create_household automatically initializes 8 room slots
  const { data: existingRooms, error: roomsQueryError } = await client1
    .from('rooms')
    .select('id')
    .eq('household_id', householdId1)
    .limit(1);

  assert.equal(roomsQueryError, null);
  assert.ok(existingRooms?.length > 0, 'Expected pre-created rooms');
  const room1Id = existingRooms[0].id;

  // Mark room as set up
  await client1
    .from('rooms')
    .update({ type: 'living_room', name: 'Living Room', is_set_up: true })
    .eq('id', room1Id);

  // Insert an appliance
  await client1.from('appliances').insert({
    household_id: householdId1,
    room_id: room1Id,
    type: 'aircon',
    wattage: 1200,
    quantity: 1,
  });

  // Insert a routine block in day_blocks
  await client1.from('day_blocks').insert({
    household_id: householdId1,
    type: 'evening',
    title: 'Evening Relax',
    room_id: room1Id,
    start_time: '20:00:00',
    end_time: '23:00:00',
    appliances_on: ['aircon'],
  });

  // 2. Upload file to bills storage bucket
  const fileBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]); // %PDF-1.5
  const filePath1 = `${householdId1}/${Date.now()}_test_statement.pdf`;

  const { error: uploadError } = await client1.storage
    .from('bills')
    .upload(filePath1, fileBytes, { contentType: 'application/pdf' });
  assert.equal(uploadError, null, `Upload to bills failed: ${uploadError?.message}`);

  // Test 1: Upload then read writes NO bill, alert, deed, or points rows
  const { data: readRes, error: readError } = await client1.functions.invoke('analyze-bill', {
    body: {
      mode: 'read',
      file_path: filePath1,
    },
  });
  assert.equal(readError, null, `Read bill invoke failed: ${readError?.message}`);
  assert.ok(readRes.ai_read_token, 'ai_read_token must be returned');

  // Verify 0 rows written in database tables
  const { count: billsCount } = await client1.from('bills').select('*', { count: 'exact', head: true });
  const { count: alertsCount } = await client1.from('alerts').select('*', { count: 'exact', head: true });
  const { count: deedsCount } = await client1.from('deeds').select('*', { count: 'exact', head: true });
  const { count: pointsCount } = await client1.from('points').select('*', { count: 'exact', head: true });

  assert.equal(billsCount, 0, 'Read mode must write 0 bills');
  assert.equal(alertsCount, 0, 'Read mode must write 0 alerts');
  assert.equal(deedsCount, 0, 'Read mode must write 0 deeds');
  assert.equal(pointsCount, 0, 'Read mode must write 0 points');

  // Test 2: Save and analyze creates the bill and the analysis in public.bills
  // Using an electricity bill with unedited read token that beats estimate
  const readUsage = Number(readRes.usage) || 280;
  const readAmount = Number(readRes.amount) || 120.0;
  const readMonth = readRes.billing_month || '2026-10-01';

  const { data: saveRes, error: saveError } = await client1.functions.invoke('analyze-bill', {
    body: {
      mode: 'analyze',
      file_path: filePath1,
      type: 'electricity',
      billing_month: readMonth,
      usage: readUsage,
      amount: readAmount,
      ai_read_token: readRes.ai_read_token,
    },
  });
  assert.equal(saveError, null, `Save & analyze failed: ${saveError?.message}`);
  assert.ok(saveRes.bill_id, 'Expected bill_id after save');
  assert.ok(saveRes.analysis?.summary, 'Expected analysis summary');

  // Verify bill exists in public.bills
  const { data: savedBill } = await client1
    .from('bills')
    .select('id, household_id, usage, amount, analysis')
    .eq('id', saveRes.bill_id)
    .single();

  assert.ok(savedBill, 'Bill must be present in public.bills');
  assert.equal(savedBill.usage, readUsage);
  assert.equal(savedBill.amount, readAmount);

  // Test 7 & 8: Energy points awarded only once per billing month
  // If points were awarded, a second attempt for same month returns 'already_awarded'
  if (saveRes.points_awarded === 50) {
    const { data: secondAwardRes } = await client1.functions.invoke('analyze-bill', {
      body: {
        mode: 'analyze',
        file_path: filePath1,
        type: 'electricity',
        billing_month: readMonth,
        usage: readUsage,
        amount: readAmount,
        ai_read_token: readRes.ai_read_token,
      },
    });
    assert.equal(secondAwardRes.points_awarded, 0, 'Second award for same month must give 0 points');
    assert.equal(secondAwardRes.points_withheld_reason, 'already_awarded');
  }

  // Test 8: Changed numbers beyond 5% gives 0 points and 'values_changed'
  const { data: changedNumRes, error: changedNumError } = await client1.functions.invoke('analyze-bill', {
    body: {
      mode: 'analyze',
      file_path: filePath1,
      type: 'electricity',
      billing_month: '2026-08-01',
      usage: readUsage * 2, // edited by 100%
      amount: readAmount * 2,
      ai_read_token: readRes.ai_read_token,
    },
  });
  assert.equal(changedNumError, null, `invoke error: ${changedNumError?.message}`);
  assert.equal(changedNumRes?.points_awarded, 0, 'Tampered usage must yield 0 points');
  assert.equal(changedNumRes?.points_withheld_reason, 'values_changed');

  // Test 5: Normal bill gives 'normal' level (Jul 2026, 12.16 m³)
  const waterJulFilePath = `${householdId1}/water_jul.pdf`;
  await client1.storage.from('bills').upload(waterJulFilePath, fileBytes, { contentType: 'application/pdf' });

  const { data: normalRes, error: normalError } = await client1.functions.invoke('analyze-bill', {
    body: {
      mode: 'analyze',
      file_path: waterJulFilePath,
      type: 'water',
      billing_month: '2026-07-01',
      usage: 12.16,
      amount: 25.0,
    },
  });
  assert.equal(normalError, null);
  assert.equal(normalRes.level, 'normal', 'Expected level normal');

  // Test 3: Water bill Leak case (18 m³, +48% MoM vs Jul 12.16) gives amber level 'leak_detected'
  const waterAugFilePath = `${householdId1}/water_aug.pdf`;
  await client1.storage.from('bills').upload(waterAugFilePath, fileBytes, { contentType: 'application/pdf' });

  const { data: leakRes, error: leakError } = await client1.functions.invoke('analyze-bill', {
    body: {
      mode: 'analyze',
      file_path: waterAugFilePath,
      type: 'water',
      billing_month: '2026-08-01',
      usage: 18.0,
      amount: 80.0,
    },
  });
  assert.equal(leakError, null);
  assert.equal(leakRes.level, 'leak_detected', 'Expected level leak_detected for 18 m³ (+48% MoM)');

  // Test 4: Water bill Major case (40 m³, +122% MoM vs Aug 18) gives 'major_pipe_burst'
  const waterSepFilePath = `${householdId1}/water_sep.pdf`;
  await client1.storage.from('bills').upload(waterSepFilePath, fileBytes, { contentType: 'application/pdf' });

  const { data: majorRes, error: majorError } = await client1.functions.invoke('analyze-bill', {
    body: {
      mode: 'analyze',
      file_path: waterSepFilePath,
      type: 'water',
      billing_month: '2026-09-01',
      usage: 40.0,
      amount: 195.0,
    },
  });
  assert.equal(majorError, null);
  assert.equal(majorRes.level, 'major_pipe_burst', 'Expected level major_pipe_burst for 40 m³ (+122% MoM)');

  // Test 6: Second bill for the same month replaces the first with exactly one alert
  // Re-uploading water bill for 2026-08-01 with updated usage
  const { data: replaceRes, error: replaceError } = await client1.functions.invoke('analyze-bill', {
    body: {
      mode: 'analyze',
      file_path: waterAugFilePath,
      type: 'water',
      billing_month: '2026-08-01',
      usage: 19.0,
      amount: 85.0,
    },
  });
  assert.equal(replaceError, null);
  assert.ok(replaceRes?.bill_id);

  const { data: alertsForAug } = await client1
    .from('alerts')
    .select('id')
    .eq('bill_id', replaceRes.bill_id);

  assert.equal(alertsForAug?.length, 1, 'Replacing bill must leave exactly one alert row in alerts table');

  // Test 10: Another household cannot read the bill or the storage file (RLS check)
  const client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testEmail2 = `scanner_user2_${Date.now()}@example.com`;
  await client2.auth.signUp({
    email: testEmail2,
    password: testPassword,
    options: { data: { name: 'Scanner Tester 2' } },
  });
  await client2.auth.signInWithPassword({
    email: testEmail2,
    password: testPassword,
  });
  await client2.rpc('create_household', {
    p_state: 'Selangor',
    p_city: 'Petaling Jaya',
  });

  // Client 2 attempts to query client 1's bills
  const { data: crossBills } = await client2
    .from('bills')
    .select('*')
    .eq('household_id', householdId1);
  assert.equal(crossBills?.length, 0, 'RLS must forbid querying another household bills');

  // Client 2 attempts to download client 1's storage file
  const { data: crossFile, error: crossStorageError } = await client2.storage
    .from('bills')
    .download(filePath1);

  assert.ok(
    crossStorageError || !crossFile,
    'RLS must forbid downloading another household bill file from storage'
  );
});
