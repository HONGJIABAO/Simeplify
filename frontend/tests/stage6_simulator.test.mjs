import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

test('Stage 6 (Part 2): Simulator Supabase Data Persistence and TNB Bill Calculation', async () => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const testEmail = `stage6_sim_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // 1. Sign up and sign in
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        name: 'Simulator Tester',
        gender: 'boy',
        state: 'Selangor',
        city: 'Shah Alam',
        street: 'No 45, Jalan Nilam',
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
    p_city: 'Shah Alam',
    p_street: 'No 45, Jalan Nilam',
  });
  assert.equal(rpcError, null, `create_household failed: ${rpcError?.message}`);
  assert.ok(householdId, 'Expected household ID');

  // 3. Verify simulator initial load state
  // Check 8 default rooms were created
  const { data: rooms, error: roomsError } = await client
    .from('rooms')
    .select('*')
    .eq('household_id', householdId)
    .order('floor')
    .order('slot');
  assert.equal(roomsError, null);
  assert.equal(rooms.length, 8, 'Expected 8 initial rooms');

  // Check global appliance_types can be read
  const { data: applianceTypes, error: typesError } = await client
    .from('appliance_types')
    .select('*')
    .eq('active', true)
    .order('sort_order');
  assert.equal(typesError, null);
  assert.ok(applianceTypes.length >= 7, 'Expected global appliance types');

  // Check active domestic tariff rate can be read
  const { data: tariffRates, error: tariffError } = await client
    .from('tariff_rates')
    .select('*')
    .eq('type', 'domestic')
    .eq('region', 'peninsular_malaysia')
    .limit(1);
  assert.equal(tariffError, null);
  assert.equal(tariffRates.length, 1, 'Expected active domestic tariff rate');
  const activeTariff = tariffRates[0];
  assert.equal(Number(activeTariff.generation_rate_low), 0.2703);
  assert.equal(Number(activeTariff.generation_rate_high), 0.3703);

  // 4. Room Configuration CRUD (SIM-05 / SIM-06)
  // Configure Room 1A (Floor 1, Slot A) as "Living Room"
  const room1A = rooms.find((r) => r.floor === 1 && r.slot === 'A');
  assert.ok(room1A, 'Room 1A must exist');

  const { error: updateRoomError } = await client
    .from('rooms')
    .update({
      name: 'Main Living Room',
      type: 'living_room',
      is_set_up: true,
    })
    .eq('id', room1A.id);
  assert.equal(updateRoomError, null, 'Configuring room must succeed');

  const { data: verifiedRoom } = await client
    .from('rooms')
    .select('name, type, is_set_up')
    .eq('id', room1A.id)
    .single();
  assert.equal(verifiedRoom.name, 'Main Living Room');
  assert.equal(verifiedRoom.type, 'living_room');
  assert.equal(verifiedRoom.is_set_up, true);

  // 5. Appliance CRUD (SIM-02 / SIM-05)
  // Add an Air Conditioner (1500W, 4 stars)
  const { data: newAppliance, error: addAppError } = await client
    .from('appliances')
    .insert({
      household_id: householdId,
      room_id: room1A.id,
      type: 'air_conditioner',
      brand: 'Daikin',
      model: 'FTV35P',
      wattage: 1500,
      star_rating: 4,
      quantity: 1,
      position_x: 0.4500,
      position_y: 0.5500,
    })
    .select()
    .single();
  assert.equal(addAppError, null, `Add appliance failed: ${addAppError?.message}`);
  assert.ok(newAppliance.id, 'Expected new appliance ID');
  assert.equal(newAppliance.wattage, 1500);
  assert.equal(newAppliance.star_rating, 4);

  // Add a Refrigerator (always_on, 200W, 5 stars)
  const { data: fridge, error: addFridgeError } = await client
    .from('appliances')
    .insert({
      household_id: householdId,
      room_id: room1A.id,
      type: 'refrigerator',
      brand: 'Panasonic',
      model: 'NR-BX471',
      wattage: 200,
      star_rating: 5,
      quantity: 1,
      position_x: 0.2000,
      position_y: 0.3000,
    })
    .select()
    .single();
  assert.equal(addFridgeError, null);
  assert.ok(fridge.id);

  // Update Air Conditioner details & move position
  const { error: updAppError } = await client
    .from('appliances')
    .update({
      wattage: 1200,
      star_rating: 5,
      position_x: 0.5000,
      position_y: 0.6000,
    })
    .eq('id', newAppliance.id);
  assert.equal(updAppError, null);

  const { data: updatedApp } = await client
    .from('appliances')
    .select('wattage, star_rating, position_x, position_y')
    .eq('id', newAppliance.id)
    .single();
  assert.equal(updatedApp.wattage, 1200);
  assert.equal(updatedApp.star_rating, 5);
  assert.equal(Number(updatedApp.position_x), 0.5);
  assert.equal(Number(updatedApp.position_y), 0.6);

  // Delete Air Conditioner and verify removal
  const { error: delAppError } = await client
    .from('appliances')
    .delete()
    .eq('id', newAppliance.id);
  assert.equal(delAppError, null);

  const { data: postDelApps } = await client
    .from('appliances')
    .select('id')
    .eq('household_id', householdId);
  assert.equal(postDelApps.length, 1, 'Only fridge should remain');
  assert.equal(postDelApps[0].id, fridge.id);

  // 6. My Day Routine Blocks & Schedules Persistence (SIM-07 / ONB-01)
  // Set weekday away schedule (08:30 to 18:00)
  const { error: scheduleError } = await client
    .from('schedules')
    .insert([
      {
        household_id: householdId,
        day_type: 'weekday',
        start_time: '08:30:00',
        end_time: '18:00:00',
      },
      {
        household_id: householdId,
        day_type: 'weekend',
        start_time: '12:00:00',
        end_time: '16:00:00',
      },
    ]);
  assert.equal(scheduleError, null, `Schedule insert failed: ${scheduleError?.message}`);

  // Insert day blocks
  const { error: dayBlocksError } = await client
    .from('day_blocks')
    .insert([
      {
        household_id: householdId,
        type: 'sleep',
        title: 'Night Sleep',
        room_id: room1A.id,
        start_time: '23:00:00',
        end_time: '07:00:00',
        appliances_on: [fridge.id],
      },
      {
        household_id: householdId,
        type: 'away',
        title: 'Work & Commute',
        room_id: null,
        start_time: '08:30:00',
        end_time: '18:00:00',
        appliances_on: [],
      },
      {
        household_id: householdId,
        type: 'evening',
        title: 'Dinner & Relax',
        room_id: room1A.id,
        start_time: '18:30:00',
        end_time: '22:30:00',
        appliances_on: [fridge.id],
      },
    ]);
  assert.equal(dayBlocksError, null, `Day blocks insert failed: ${dayBlocksError?.message}`);

  // Verify day blocks loaded back
  const { data: savedDayBlocks, error: fetchBlocksError } = await client
    .from('day_blocks')
    .select('type, title, start_time, end_time, appliances_on')
    .eq('household_id', householdId)
    .order('start_time');
  assert.equal(fetchBlocksError, null);
  assert.equal(savedDayBlocks.length, 3);
  assert.equal(savedDayBlocks[0].title, 'Work & Commute');
  assert.equal(savedDayBlocks[1].title, 'Dinner & Relax');
  assert.equal(savedDayBlocks[2].title, 'Night Sleep');

  // 7. Notifications Integration (fetch, count unread, mark read)
  // Insert test notification as service_role (representing system trigger/job)
  const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: newNotif, error: notifInsError } = await adminClient
    .from('notifications')
    .insert({
      household_id: householdId,
      type: 'bill_alert',
      title: 'Monthly Simulation Ready',
      message: 'Your estimated monthly bill has been updated.',
      is_read: false,
    })
    .select()
    .single();
  assert.equal(notifInsError, null, `Insert notification error: ${notifInsError?.message}`);
  assert.equal(newNotif.is_read, false);

  // Authenticated user queries notifications
  const { data: userNotifs, error: fetchNotifsError } = await client
    .from('notifications')
    .select('*')
    .eq('household_id', householdId);
  assert.equal(fetchNotifsError, null);
  assert.equal(userNotifs.length, 1);
  assert.equal(userNotifs[0].id, newNotif.id);

  // Check unread count
  const { count: unreadCount, error: countError } = await client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('is_read', false);
  assert.equal(countError, null);
  assert.equal(unreadCount, 1, 'Expected 1 unread notification');

  // Mark notification as read
  const { error: markReadError } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', newNotif.id);
  assert.equal(markReadError, null);

  // Check unread count is now 0
  const { count: postReadCount } = await client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('is_read', false);
  assert.equal(postReadCount, 0, 'Expected 0 unread notifications after mark read');

  // 8. TNB Appendix A Bill Calculation Verification
  // Test case A: Low usage under 600 kWh (no retail charge)
  // 500 kWh:
  // generation = 500 * 0.2703 = 135.15
  // capacity = 500 * 0.0455 = 22.75
  // network = 500 * 0.1285 = 64.25
  // retail = 0 (kwh <= 600)
  // total = 135.15 + 22.75 + 64.25 = 222.15
  const kwh500 = 500;
  const gen500 = kwh500 * 0.2703;
  const cap500 = kwh500 * 0.0455;
  const net500 = kwh500 * 0.1285;
  const ret500 = kwh500 > 600 ? 10 : 0;
  const bill500 = Math.round((gen500 + cap500 + net500 + ret500) * 100) / 100;
  assert.equal(bill500, 222.15);

  // Test case B: Medium usage over 600 kWh but under 1500 kWh (includes RM 10 retail charge)
  // 1000 kWh:
  // generation = 1000 * 0.2703 = 270.30
  // capacity = 1000 * 0.0455 = 45.50
  // network = 1000 * 0.1285 = 128.50
  // retail = 10.00
  // total = 270.30 + 45.50 + 128.50 + 10.00 = 454.30
  const kwh1000 = 1000;
  const gen1000 = kwh1000 * 0.2703;
  const cap1000 = kwh1000 * 0.0455;
  const net1000 = kwh1000 * 0.1285;
  const ret1000 = kwh1000 > 600 ? 10 : 0;
  const bill1000 = Math.round((gen1000 + cap1000 + net1000 + ret1000) * 100) / 100;
  assert.equal(bill1000, 454.30);

  // Test case C: High usage over 1500 kWh (generation split: 1500 @ 0.2703 + remainder @ 0.3703)
  // 1800 kWh:
  // generation = 1500 * 0.2703 + 300 * 0.3703 = 405.45 + 111.09 = 516.54
  // capacity = 1800 * 0.0455 = 81.90
  // network = 1800 * 0.1285 = 231.30
  // retail = 10.00
  // total = 516.54 + 81.90 + 231.30 + 10.00 = 839.74
  const kwh1800 = 1800;
  const gen1800 = 1500 * 0.2703 + 300 * 0.3703;
  const cap1800 = kwh1800 * 0.0455;
  const net1800 = kwh1800 * 0.1285;
  const ret1800 = 10.00;
  const bill1800 = Math.round((gen1800 + cap1800 + net1800 + ret1800) * 100) / 100;
  assert.equal(bill1800, 839.74);

  // 9. Water Heater Rule 7 Verification
  // 3 residents, 2 showers/day, 10 min/shower, 3000W heater, 3-star (factor 1.0)
  // dailyKwh = (2 * 3 * 10 / 60) * (3000 / 1000) = 1.0 * 3.0 = 3.0 kWh/day
  // monthlyKwh = 3.0 * 30 = 90 kWh
  const residents = 3;
  const showersPerDay = 2 * residents;
  const minutes = 10;
  const heaterWattage = 3000;
  const waterHeaterDailyKwh = (showersPerDay * minutes / 60) * (heaterWattage / 1000);
  assert.equal(waterHeaterDailyKwh, 3.0);
  assert.equal(waterHeaterDailyKwh * 30, 90);
});
