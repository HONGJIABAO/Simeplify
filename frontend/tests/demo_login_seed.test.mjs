import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

import { getTestCredentials } from './testSafety.mjs';

const { supabaseUrl: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = getTestCredentials();

test('Demo User Seed: Login and Data Verification for Mei Ling Tan', async () => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. Sign In with Demo Credentials
  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email: 'meiling.tan@example.com',
    password: 'password123',
  });

  assert.equal(signInError, null, `Sign in failed: ${signInError?.message}`);
  assert.ok(signInData.session, 'Expected session after sign in');
  assert.equal(signInData.user?.id, 'd3b00000-0000-0000-0000-000000000001');
  assert.equal(signInData.user?.email, 'meiling.tan@example.com');

  const userId = signInData.user.id;
  const householdId = 'd3b00000-0000-0000-0000-000000000002';

  // 2. Profile Verification
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  assert.equal(profileError, null, `Profile query error: ${profileError?.message}`);
  assert.equal(profile.name, 'Mei Ling Tan');
  assert.equal(signInData.user.user_metadata.gender, 'girl');
  assert.equal(profile.onboarding_done, true);
  assert.equal(profile.onboarding_step, 3);
  assert.equal(profile.household_id, householdId);

  // 3. Household Verification
  const { data: household, error: householdError } = await client
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single();

  assert.equal(householdError, null, `Household query error: ${householdError?.message}`);
  assert.equal(household.address_state, 'Selangor');
  assert.equal(household.address_city, 'Subang Jaya');
  assert.equal(household.residents_count, 3);

  // 4. Rooms Verification (all eight product-layout rooms configured)
  const { data: rooms, error: roomsError } = await client
    .from('rooms')
    .select('*')
    .eq('household_id', householdId);

  assert.equal(roomsError, null, `Rooms query error: ${roomsError?.message}`);
  assert.equal(rooms.length, 8, `Expected 8 rooms, got ${rooms.length}`);
  const configuredRooms = rooms.filter((r) => r.is_set_up);
  assert.equal(configuredRooms.length, 8, `Expected 8 configured rooms, got ${configuredRooms.length}`);

  // 5. Appliances Verification (17 existing rows + 4 new ceiling bulbs)
  const { data: appliances, error: appliancesError } = await client
    .from('appliances')
    .select('*')
    .in(
      'room_id',
      rooms.map((r) => r.id)
    );

  assert.equal(appliancesError, null, `Appliances query error: ${appliancesError?.message}`);
  assert.equal(appliances.length, 21, `Expected 21 appliances, got ${appliances.length}`);

  // 6. Day Blocks Verification (5 blocks)
  const { data: blocks, error: blocksError } = await client
    .from('day_blocks')
    .select('*')
    .eq('household_id', householdId);

  assert.equal(blocksError, null, `Day blocks error: ${blocksError?.message}`);
  assert.equal(blocks.length, 5, `Expected 5 day blocks, got ${blocks.length}`);

  // 7. Bills Verification (10 bills: 5 electric, 5 water)
  const { data: bills, error: billsError } = await client
    .from('bills')
    .select('*')
    .eq('household_id', householdId)
    .order('billing_month', { ascending: false });

  assert.equal(billsError, null, `Bills error: ${billsError?.message}`);
  assert.equal(bills.length, 10, `Expected 10 bills, got ${bills.length}`);
  const electricBills = bills.filter((b) => b.type === 'electricity');
  const waterBills = bills.filter((b) => b.type === 'water');
  assert.equal(electricBills.length, 5);
  assert.equal(waterBills.length, 5);

  // 8. Alerts Verification
  const { data: alerts, error: alertsError } = await client
    .from('alerts')
    .select('*')
    .eq('household_id', householdId);

  assert.equal(alertsError, null, `Alerts error: ${alertsError?.message}`);
  assert.equal(alerts.length, 1, `Expected 1 alert, got ${alerts.length}`);
  assert.equal(alerts[0].level, 'normal');

  // 9. Points & Deeds Verification
  const { data: points, error: pointsError } = await client
    .from('points')
    .select('*')
    .eq('household_id', householdId);

  assert.equal(pointsError, null, `Points error: ${pointsError?.message}`);
  assert.equal(points.length, 2, `Expected 2 points rows, got ${points.length}`);
  const totalPoints = points.reduce((acc, p) => acc + p.amount, 0);
  assert.equal(totalPoints, 60, `Expected 60 points, got ${totalPoints}`);

  const { data: deeds, error: deedsError } = await client
    .from('deeds')
    .select('*')
    .eq('household_id', householdId);

  assert.equal(deedsError, null, `Deeds error: ${deedsError?.message}`);
  assert.equal(deeds.length, 2, `Expected 2 deeds rows, got ${deeds.length}`);

  // 10. Waste Scans Verification
  const { data: scans, error: scansError } = await client
    .from('waste_scans')
    .select('*')
    .eq('household_id', householdId);

  assert.equal(scansError, null, `Waste scans error: ${scansError?.message}`);
  assert.equal(scans.length, 2, `Expected 2 waste scans, got ${scans.length}`);

  // 11. Votes Verification
  const { data: votes, error: votesError } = await client
    .from('votes')
    .select('*')
    .eq('household_id', householdId);

  assert.equal(votesError, null, `Votes error: ${votesError?.message}`);
  assert.equal(votes.length, 1, `Expected 1 vote, got ${votes.length}`);

  // 12. Notifications Verification
  const { data: notifs, error: notifsError } = await client
    .from('notifications')
    .select('*')
    .eq('household_id', householdId);

  assert.equal(notifsError, null, `Notifications error: ${notifsError?.message}`);
  assert.ok(notifs.length >= 2, `Expected at least 2 notifications, got ${notifs.length}`);
  assert.ok(
    notifs.some((n) => n.title.includes('Bedtime Reminder') || n.title.includes('Turn Off Appliances')),
    'Expected smart routine/appliance reminder in notifications'
  );
});
