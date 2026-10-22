/**
 * Stage 6 (Part 6 + Global Notifications): Profile and Smart Appliance Reminders
 *
 * Verifies:
 * 1. sync_routine_appliance_notifications creates real pre-sleep light reminders and
 *    pre-routine-transition AC/appliance shutoff reminders based on day_blocks & appliances
 *    (filtering out always_on devices like Refrigerator and Wi-Fi Router).
 * 2. Deduplication: calling the RPC twice does not duplicate notifications.
 * 3. Marking notifications as read updates unread count to 0.
 * 4. Profile data fetch, name/address update, and cross-household RLS isolation.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { getTestCredentials } from './testSafety.mjs';

import {
  fetchProfileDataWithClient,
  updateProfileAndHouseholdWithClient,
  formatAddressDisplay,
} from '../src/lib/services/profileCore.ts';

import {
  syncRoutineNotificationsWithClient,
  fetchUnreadNotificationsCountWithClient,
  fetchNotificationsWithClient,
  markNotificationAsReadWithClient,
  markAllNotificationsAsReadWithClient,
} from '../src/lib/services/notificationCore.ts';

const {
  supabaseUrl: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
} = getTestCredentials();

test('Stage 6: Profile Tab & Smart Routine Appliance Reminders Integration', async () => {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const timestamp = Date.now();
  const emailA = `stage6_smart_a_${timestamp}@example.com`;
  const emailB = `stage6_smart_b_${timestamp}@example.com`;
  const testPassword = 'Password123!';

  // =========================================================================
  // 1. Setup User A & Household A with Rooms, Appliances, and Day Blocks
  // =========================================================================
  const { data: signUpA, error: signUpAError } = await clientA.auth.signUp({
    email: emailA,
    password: testPassword,
    options: {
      data: {
        name: 'Mei Ling Tan',
        gender: 'girl',
        state: 'Selangor',
        city: 'Subang Jaya',
        street: '15, Jalan USJ 11/1D',
      },
    },
  });
  assert.equal(signUpAError, null, `Sign up A failed: ${signUpAError?.message}`);
  const userAId = signUpA.user?.id;
  assert.ok(userAId, 'Expected user A ID');

  const { data: signInA, error: signInAError } = await clientA.auth.signInWithPassword({
    email: emailA,
    password: testPassword,
  });
  assert.equal(signInAError, null, `Sign in A failed: ${signInAError?.message}`);
  assert.ok(signInA.session, 'Expected session for User A');

  // Create household for User A via security definer RPC
  const { data: householdAId, error: rpcAError } = await clientA.rpc('create_household', {
    p_state: 'Selangor',
    p_city: 'Subang Jaya',
    p_street: '15, Jalan USJ 11/1D',
  });
  assert.equal(rpcAError, null, `create_household A failed: ${rpcAError?.message}`);
  assert.ok(householdAId, 'Expected valid household A ID');

  // Fetch rooms for Household A
  const { data: roomsA } = await clientA
    .from('rooms')
    .select('id, slot, floor')
    .eq('household_id', householdAId)
    .order('slot', { ascending: true });

  assert.ok(roomsA && roomsA.length >= 2, 'Expected rooms for Household A');
  const livingRoom = roomsA[0];
  const bedroom = roomsA[1];

  // Set up living room and bedroom
  await clientA
    .from('rooms')
    .update({ type: 'living_room', name: 'Living Room', is_set_up: true })
    .eq('id', livingRoom.id);

  await clientA
    .from('rooms')
    .update({ type: 'bedroom', name: 'Master Bedroom', is_set_up: true })
    .eq('id', bedroom.id);

  // Add appliances: Air Conditioner, Lights, TV (active), and Refrigerator (always_on)
  const { data: acApp } = await clientA
    .from('appliances')
    .insert({
      household_id: householdAId,
      room_id: livingRoom.id,
      type: 'air_conditioner',
      brand: 'Daikin',
      wattage: 1000,
      star_rating: 5,
    })
    .select('id')
    .single();

  const { data: lightsApp } = await clientA
    .from('appliances')
    .insert({
      household_id: householdAId,
      room_id: livingRoom.id,
      type: 'lights',
      brand: 'Philips',
      wattage: 18,
      star_rating: 5,
    })
    .select('id')
    .single();

  const { data: fridgeApp } = await clientA
    .from('appliances')
    .insert({
      household_id: householdAId,
      room_id: livingRoom.id,
      type: 'refrigerator',
      brand: 'Hitachi',
      wattage: 150,
      star_rating: 5,
    })
    .select('id')
    .single();

  // Create Day Blocks: Evening Living Room (19:00 - 22:00) and Night Sleep (22:30 - 06:30)
  await clientA.from('day_blocks').insert([
    {
      household_id: householdAId,
      type: 'evening',
      title: 'Living Room Evening',
      room_id: livingRoom.id,
      start_time: '19:00:00',
      end_time: '22:00:00',
      appliances_on: [acApp?.id, lightsApp?.id],
    },
    {
      household_id: householdAId,
      type: 'sleep',
      title: 'Night Sleep',
      room_id: bedroom.id,
      start_time: '22:30:00',
      end_time: '06:30:00',
      appliances_on: [],
    },
  ]);

  // Set away schedule (09:00 - 17:00)
  await clientA.from('schedules').insert({
    household_id: householdAId,
    day_type: 'weekday',
    start_time: '09:00:00',
    end_time: '17:00:00',
  });

  // =========================================================================
  // 2. Verify Smart Routine Appliance Reminders Creation (via Trigger & RPC)
  // =========================================================================
  const notifsA = await fetchNotificationsWithClient(clientA, householdAId);
  assert.ok(notifsA.length >= 2, `Expected at least 2 reminder notifications created by automated trigger, got ${notifsA.length}`);

  // Verify Pre-Sleep Lights & Appliances Reminder
  const bedtimeNotif = notifsA.find((n) => n.title.includes('Bedtime Reminder'));
  assert.ok(bedtimeNotif, 'Expected Bedtime Reminder notification');
  assert.equal(bedtimeNotif.type, 'routine_reminder');
  assert.equal(bedtimeNotif.linked_path, '/(tabs)/simulator');
  assert.ok(
    bedtimeNotif.message.includes('Air Conditioner') || bedtimeNotif.message.includes('Lights'),
    `Bedtime message should mention active appliances: ${bedtimeNotif.message}`
  );
  // Must NOT include refrigerator because always_on = true
  assert.ok(
    !bedtimeNotif.message.toLowerCase().includes('refrigerator'),
    'Bedtime message should exclude always_on refrigerator'
  );

  // Verify Next Routine Transition AC & Appliances Reminder
  const transitionNotif = notifsA.find((n) => n.title.includes('Next Routine'));
  assert.ok(transitionNotif, 'Expected Next Routine transition notification');
  assert.equal(transitionNotif.type, 'appliance_reminder');
  assert.ok(
    transitionNotif.message.includes('Air Conditioner') || transitionNotif.message.includes('Lights'),
    `Transition message should mention turning off AC/lights: ${transitionNotif.message}`
  );

  // Verify Pre-Away Checklist Reminder
  const awayNotif = notifsA.find((n) => n.title.includes('Leaving Home'));
  assert.ok(awayNotif, 'Expected Leaving Home checklist notification');
  assert.equal(awayNotif.type, 'routine_reminder');
  assert.ok(awayNotif.message.includes('09:00'));

  // =========================================================================
  // 3. Deduplication Check (calling RPC again produces 0 new notifications)
  // =========================================================================
  const reSyncCount = await syncRoutineNotificationsWithClient(clientA, householdAId);
  assert.equal(reSyncCount, 0, 'Re-syncing on same day should generate 0 duplicate notifications');

  const notifsAfterReSync = await fetchNotificationsWithClient(clientA, householdAId);
  assert.equal(notifsAfterReSync.length, notifsA.length, 'Notification count must remain identical after re-sync');

  // =========================================================================
  // 4. Unread Notification Counter & Read State Transition
  // =========================================================================
  const initialUnreadCount = await fetchUnreadNotificationsCountWithClient(clientA, householdAId);
  assert.ok(initialUnreadCount >= 2, 'Initial unread count should match unread notifications');

  // Mark all as read
  await markAllNotificationsAsReadWithClient(clientA, householdAId);
  const unreadAfterMarkAll = await fetchUnreadNotificationsCountWithClient(clientA, householdAId);
  assert.equal(unreadAfterMarkAll, 0, 'Unread count should be 0 after markAllNotificationsAsRead');

  // =========================================================================
  // 5. Profile Tab Data & Updates
  // =========================================================================
  const profileDataA = await fetchProfileDataWithClient(clientA, userAId);
  assert.equal(profileDataA.profile?.name, 'Mei Ling Tan');
  assert.equal(profileDataA.household?.street, '15, Jalan USJ 11/1D');
  assert.equal(profileDataA.household?.city, 'Subang Jaya');
  assert.equal(profileDataA.household?.state, 'Selangor');
  assert.equal(profileDataA.addressDisplay, '15, Jalan USJ 11/1D, Subang Jaya, Selangor');
  assert.equal(profileDataA.unreadNotificationsCount, 0, 'Unread notifications should be 0 on profile');

  // Update profile and household
  await updateProfileAndHouseholdWithClient(
    clientA,
    userAId,
    householdAId,
    {
      name: 'Mei Ling Tan-Lim',
      street: '88, Persiaran Kewajipan',
      city: 'Subang Jaya',
      state: 'Selangor',
    }
  );

  const updatedProfileA = await fetchProfileDataWithClient(clientA, userAId);
  assert.equal(updatedProfileA.profile?.name, 'Mei Ling Tan-Lim');
  assert.equal(updatedProfileA.household?.street, '88, Persiaran Kewajipan');
  assert.equal(updatedProfileA.addressDisplay, '88, Persiaran Kewajipan, Subang Jaya, Selangor');

  // =========================================================================
  // 6. Security Locks & Cross-Household Isolation
  // =========================================================================
  // 6a. Client A cannot change profiles.household_id
  const { error: tamperError } = await clientA
    .from('profiles')
    .update({ household_id: '00000000-0000-0000-0000-999999999999' })
    .eq('id', userAId);
  assert.ok(tamperError, 'Client cannot change household_id');

  // 6b. Setup Household B
  const { data: signUpB } = await clientB.auth.signUp({
    email: emailB,
    password: testPassword,
    options: {
      data: {
        name: 'Household B User',
        gender: 'boy',
        state: 'Kuala Lumpur',
        city: 'Bangsar',
        street: '8, Jalan Bangsar',
      },
    },
  });
  await clientB.auth.signInWithPassword({
    email: emailB,
    password: testPassword,
  });
  await clientB.rpc('create_household', {
    p_state: 'Kuala Lumpur',
    p_city: 'Bangsar',
    p_street: '8, Jalan Bangsar',
  });

  // Household B CANNOT read Household A's notifications
  const { data: crossNotifs } = await clientB
    .from('notifications')
    .select('*')
    .eq('household_id', householdAId);
  assert.equal(crossNotifs?.length ?? 0, 0, 'Household B must not see Household A notifications');

  // Household B CANNOT read Household A's profile
  const { data: crossProfile } = await clientB
    .from('profiles')
    .select('*')
    .eq('id', userAId);
  assert.equal(crossProfile?.length ?? 0, 0, 'Household B must not see Household A profile');
});
