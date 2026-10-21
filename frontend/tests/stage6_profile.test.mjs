/**
 * Stage 6 (Part 6): Profile Tab Backend Integration Tests
 *
 * Verifies:
 * 1. Signs up / loads a user with a household and verifies fetchProfileData returns the
 *    real name, formatted address (street, city, state), and unreadNotificationsCount = 0.
 * 2. Inserts an unread notification via service role -> verifies fetchProfileData reflects
 *    unreadNotificationsCount = 1, and marking it read resets count to 0.
 * 3. Updates name in public.profiles and street, city, state in public.households via
 *    updateProfileAndHousehold -> persists and reads back accurately.
 * 4. Verifies security locks:
 *    - Client attempt to change profiles.household_id to another UUID is rejected by column privilege / RLS.
 *    - Household B cannot read or update Household A's profiles or households.
 * 5. Verifies signOut clears the active session.
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

const {
  supabaseUrl: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
} = getTestCredentials();

test('Stage 6 Part 6: Profile Tab Backend Integration Tests', async () => {
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
  const emailA = `stage6_prof_a_${timestamp}@example.com`;
  const emailB = `stage6_prof_b_${timestamp}@example.com`;
  const testPassword = 'Password123!';

  // =========================================================================
  // 1. Setup Authenticated Household A & Verify Initial Profile Data
  // =========================================================================
  const { data: signUpA, error: signUpAError } = await clientA.auth.signUp({
    email: emailA,
    password: testPassword,
    options: {
      data: {
        name: 'Mei Ling Tester',
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
  assert.ok(signInA.session, 'Expected active session for User A');

  // Create household for User A via security definer RPC
  const { data: householdAId, error: rpcAError } = await clientA.rpc('create_household', {
    p_state: 'Selangor',
    p_city: 'Subang Jaya',
    p_street: '15, Jalan USJ 11/1D',
  });
  assert.equal(rpcAError, null, `create_household A failed: ${rpcAError?.message}`);
  assert.ok(householdAId, 'Expected valid household A ID');

  // Verify fetchProfileData returns accurate real data
  const profileDataA = await fetchProfileDataWithClient(clientA, userAId);
  assert.ok(profileDataA.profile, 'Expected profile data for User A');
  assert.equal(profileDataA.profile?.name, 'Mei Ling Tester');
  assert.equal(profileDataA.profile?.email, emailA);
  assert.equal(profileDataA.profile?.household_id, householdAId);

  assert.ok(profileDataA.household, 'Expected household data for User A');
  assert.equal(profileDataA.household?.street, '15, Jalan USJ 11/1D');
  assert.equal(profileDataA.household?.city, 'Subang Jaya');
  assert.equal(profileDataA.household?.state, 'Selangor');
  assert.equal(
    profileDataA.addressDisplay,
    '15, Jalan USJ 11/1D, Subang Jaya, Selangor'
  );
  assert.equal(profileDataA.unreadNotificationsCount, 0, 'Initial unread count should be 0');

  // =========================================================================
  // 2. Unread Notifications Integration
  // =========================================================================
  // Insert an unread notification for Household A using admin client
  const { data: notif, error: notifInsertError } = await adminClient
    .from('notifications')
    .insert({
      household_id: householdAId,
      type: 'bill_alert',
      title: 'Water leak detected',
      message: 'Unusual overnight water flow recorded.',
      is_read: false,
    })
    .select('id')
    .single();

  assert.equal(notifInsertError, null, `Failed to insert notification: ${notifInsertError?.message}`);
  assert.ok(notif?.id, 'Expected notification ID');

  // Verify unread count reflects 1
  const profileWithUnread = await fetchProfileDataWithClient(clientA, userAId);
  assert.equal(profileWithUnread.unreadNotificationsCount, 1, 'Expected unread count of 1');

  // User A marks the notification as read
  const { error: markReadError } = await clientA
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notif.id);

  assert.equal(markReadError, null, `User A should be able to mark notification as read: ${markReadError?.message}`);

  // Verify unread count resets to 0
  const profileAfterRead = await fetchProfileDataWithClient(clientA, userAId);
  assert.equal(profileAfterRead.unreadNotificationsCount, 0, 'Unread count should reset to 0');

  // =========================================================================
  // 3. Update Profile & Household Data via Service
  // =========================================================================
  await updateProfileAndHouseholdWithClient(
    clientA,
    userAId,
    householdAId,
    {
      name: 'Mei Ling Tan (Updated)',
      street: '22, Jalan SS 2/10',
      city: 'Petaling Jaya',
      state: 'Selangor',
    }
  );

  // Read back and verify persistence
  const updatedProfileA = await fetchProfileDataWithClient(clientA, userAId);
  assert.equal(updatedProfileA.profile?.name, 'Mei Ling Tan (Updated)');
  assert.equal(updatedProfileA.household?.street, '22, Jalan SS 2/10');
  assert.equal(updatedProfileA.household?.city, 'Petaling Jaya');
  assert.equal(updatedProfileA.household?.state, 'Selangor');
  assert.equal(
    updatedProfileA.addressDisplay,
    '22, Jalan SS 2/10, Petaling Jaya, Selangor'
  );

  // =========================================================================
  // 4. Security Locks & RLS Enforcements
  // =========================================================================
  // 4a. Client attempt to tamper with profiles.household_id must be rejected
  const fakeHouseholdId = '00000000-0000-0000-0000-999999999999';
  const { error: tamperError } = await clientA
    .from('profiles')
    .update({ household_id: fakeHouseholdId })
    .eq('id', userAId);

  assert.ok(
    tamperError,
    'Client updating household_id must fail due to column privileges / RLS check'
  );

  // 4b. Setup Household B
  const { data: signUpB, error: signUpBError } = await clientB.auth.signUp({
    email: emailB,
    password: testPassword,
    options: {
      data: {
        name: 'Household B User',
        gender: 'boy',
        state: 'Kuala Lumpur',
        city: 'Bangsar',
        street: '5, Jalan Telawi',
      },
    },
  });
  assert.equal(signUpBError, null, `Sign up B failed: ${signUpBError?.message}`);
  const userBId = signUpB.user?.id;
  assert.ok(userBId, 'Expected user B ID');

  const { data: signInB } = await clientB.auth.signInWithPassword({
    email: emailB,
    password: testPassword,
  });
  assert.ok(signInB?.session, 'Expected session for Household B');

  const { data: householdBId, error: rpcBError } = await clientB.rpc('create_household', {
    p_state: 'Kuala Lumpur',
    p_city: 'Bangsar',
    p_street: '5, Jalan Telawi',
  });
  assert.equal(rpcBError, null, `create_household B failed: ${rpcBError?.message}`);

  // Household B CANNOT read Household A's profile row
  const { data: crossProfile, error: crossProfileError } = await clientB
    .from('profiles')
    .select('*')
    .eq('id', userAId);
  assert.equal(
    crossProfile?.length ?? 0,
    0,
    'Household B must not see Household A profile'
  );

  // Household B CANNOT read Household A's household row
  const { data: crossHousehold } = await clientB
    .from('households')
    .select('*')
    .eq('id', householdAId);
  assert.equal(
    crossHousehold?.length ?? 0,
    0,
    'Household B must not see Household A household'
  );

  // Household B CANNOT update Household A's household row
  const { data: crossUpdateResult } = await clientB
    .from('households')
    .update({ address_city: 'Hacked City' })
    .eq('id', householdAId)
    .select();
  assert.equal(
    crossUpdateResult?.length ?? 0,
    0,
    'Household B must not be able to update Household A household'
  );

  // Verify Household A's city was NOT altered
  const verifyHouseholdA = await fetchProfileDataWithClient(clientA, userAId);
  assert.equal(verifyHouseholdA.household?.city, 'Petaling Jaya');

  // =========================================================================
  // 5. Sign Out Verification
  // =========================================================================
  const { error: signOutError } = await clientA.auth.signOut();
  assert.equal(signOutError, null, `Sign out failed: ${signOutError?.message}`);

  const { data: postSignOutSession } = await clientA.auth.getSession();
  assert.equal(postSignOutSession.session, null, 'Active session should be cleared after signOut');
});
