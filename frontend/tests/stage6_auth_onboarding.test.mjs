import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

test('Stage 6: Real Supabase Client, Auth, and Onboarding Flow', async () => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const testEmail = `stage6_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // 1. Sign Up
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        name: 'Stage6 Tester',
        gender: 'girl',
        state: 'Selangor',
        city: 'Petaling Jaya',
        street: '18, Jalan SS 2/6',
      },
    },
  });

  assert.equal(signUpError, null, `Sign up failed: ${signUpError?.message}`);
  assert.ok(signUpData.user, 'Expected user to be returned on sign up');
  const userId = signUpData.user.id;

  // Sign In to establish authenticated session with client
  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  assert.equal(signInError, null, `Sign in failed: ${signInError?.message}`);
  assert.ok(signInData.session, 'Expected session after sign in');

  // Verify profiles row was created by trigger
  const { data: initialProfile, error: profileError } = await client
    .from('profiles')
    .select('id, name, email, household_id, onboarding_done, onboarding_step')
    .eq('id', userId)
    .single();

  assert.equal(profileError, null, `Profile query error: ${profileError?.message}`);
  assert.equal(initialProfile.id, userId);
  assert.equal(initialProfile.onboarding_done, false);
  assert.equal(initialProfile.onboarding_step, 1);
  assert.equal(initialProfile.household_id, null);

  // 2. Step 1 (Household & Address - ONB-01)
  // Call create_household RPC
  const { data: householdId, error: rpcError } = await client.rpc('create_household', {
    p_state: 'Selangor',
    p_city: 'Petaling Jaya',
    p_street: '18, Jalan SS 2/6',
  });

  assert.equal(rpcError, null, `create_household RPC failed: ${rpcError?.message}`);
  assert.ok(householdId, 'Expected household UUID from create_household RPC');

  // Update residents_count and verify household row
  const { error: updHouseholdError } = await client
    .from('households')
    .update({ residents_count: 4 })
    .eq('id', householdId);

  assert.equal(updHouseholdError, null, `Update household failed: ${updHouseholdError?.message}`);

  // Advance onboarding_step to 2
  const { error: step2Error } = await client
    .from('profiles')
    .update({ onboarding_step: 2 })
    .eq('id', userId);

  assert.equal(step2Error, null);

  // Verify profile has linked household_id and onboarding_step 2
  const { data: updatedProfile1 } = await client
    .from('profiles')
    .select('household_id, onboarding_step')
    .eq('id', userId)
    .single();

  assert.equal(updatedProfile1.household_id, householdId);
  assert.equal(updatedProfile1.onboarding_step, 2);

  // Verify 8 rooms were created by create_household
  const { data: initialRooms, error: roomsError } = await client
    .from('rooms')
    .select('id, floor, slot, is_set_up')
    .eq('household_id', householdId)
    .order('floor')
    .order('slot');

  assert.equal(roomsError, null);
  assert.equal(initialRooms.length, 8);
  assert.ok(initialRooms.every((r) => r.is_set_up === false));

  // 3. Step 2 (Schedule / Habits - ONB-02)
  // Insert schedules (weekday and weekend)
  const { error: schedError } = await client.from('schedules').insert([
    {
      household_id: householdId,
      day_type: 'weekday',
      start_time: '08:30:00',
      end_time: '18:30:00',
    },
    {
      household_id: householdId,
      day_type: 'weekend',
      start_time: '11:00:00',
      end_time: '15:00:00',
    },
  ]);
  assert.equal(schedError, null, `Insert schedules error: ${schedError?.message}`);

  // Update shower habits on households
  const { error: habitsError } = await client
    .from('households')
    .update({
      showers_per_person: 3,
      minutes_per_shower: 15,
    })
    .eq('id', householdId);

  assert.equal(habitsError, null, `Update habits error: ${habitsError?.message}`);

  // Advance onboarding_step to 3
  await client.from('profiles').update({ onboarding_step: 3 }).eq('id', userId);

  // 4. Step 3 (Initial Rooms & Appliances - ONB-03)
  // Query appliance_types catalog
  const { data: catalog, error: catError } = await client
    .from('appliance_types')
    .select('*')
    .eq('active', true)
    .order('sort_order');

  assert.equal(catError, null, `Catalog query error: ${catError?.message}`);
  assert.ok(catalog.length >= 5, 'Expected appliance types in catalog');

  // Configure Floor 1 Slot A (Living Room) and Floor 2 Slot A (Bedroom)
  const livingRoom = initialRooms.find((r) => r.floor === 1 && r.slot === 'A');
  const bedroom = initialRooms.find((r) => r.floor === 2 && r.slot === 'A');

  await client
    .from('rooms')
    .update({ is_set_up: true, type: 'living_room', name: 'Living Room' })
    .eq('id', livingRoom.id);

  await client
    .from('rooms')
    .update({ is_set_up: true, type: 'bedroom', name: 'Master Bedroom' })
    .eq('id', bedroom.id);

  // Insert initial appliances
  const { error: insertAppsError } = await client.from('appliances').insert([
    {
      household_id: householdId,
      room_id: livingRoom.id,
      type: 'tv',
      brand: 'Sony',
      wattage: 95,
      star_rating: 4,
      quantity: 1,
    },
    {
      household_id: householdId,
      room_id: bedroom.id,
      type: 'air_conditioner',
      brand: 'Daikin',
      wattage: 1050,
      star_rating: 5,
      quantity: 1,
    },
  ]);

  assert.equal(insertAppsError, null, `Insert appliances error: ${insertAppsError?.message}`);

  // Mark onboarding_done = true
  const { error: doneError } = await client
    .from('profiles')
    .update({ onboarding_done: true, onboarding_step: 3 })
    .eq('id', userId);

  assert.equal(doneError, null, `Mark onboarding_done error: ${doneError?.message}`);

  // 5. Verify final completed state
  const { data: finalProfile } = await client
    .from('profiles')
    .select('household_id, onboarding_done, onboarding_step')
    .eq('id', userId)
    .single();

  assert.equal(finalProfile.onboarding_done, true);
  assert.equal(finalProfile.onboarding_step, 3);
  assert.equal(finalProfile.household_id, householdId);

  // Verify household record
  const { data: finalHousehold } = await client
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single();

  assert.equal(finalHousehold.address_state, 'Selangor');
  assert.equal(finalHousehold.address_city, 'Petaling Jaya');
  assert.equal(finalHousehold.residents_count, 4);
  assert.equal(finalHousehold.showers_per_person, 3);
  assert.equal(finalHousehold.minutes_per_shower, 15);

  // 6. Sign Out
  const { error: signOutError } = await client.auth.signOut();
  assert.equal(signOutError, null);
});
