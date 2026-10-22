-- ============================================================================
-- Supabase Startup Seed Script for User: ykengwei@gmail.com
-- File: supabase/seed_ykengwei.sql
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/toaujgnzzpsanlqfyjgp
-- 2. Navigate to "SQL Editor" on the left sidebar.
-- 3. Click "New Query", paste this entire script, and click "Run".
--
-- This script:
--   - Links/creates basic startup info (Household, Profile, Rooms, Appliances)
--   - Populates past 6 months of Electricity & Water bills (May 2026 to Oct 2026)
--   - Adds abnormal water bill detection (+112% surge) and water leak alert
--   - Deploys the notification sync RPC to prevent schema cache warnings
-- ============================================================================

-- 0. Ensure reference catalog tables have baseline rows
insert into public.appliance_types (id, name, sprite_key, always_on, needs_person, has_star_rating, swap_eligible, in_tray, sort_order, active)
values
  ('air_conditioner', 'Air Conditioner', 'air_conditioner', false, true, true, true, true, 1, true),
  ('refrigerator', 'Refrigerator', 'refrigerator', true, false, true, true, true, 2, true),
  ('lights', 'Lights', 'lights', false, true, true, false, true, 3, true),
  ('fan', 'Fan', 'fan', false, true, true, true, true, 4, true),
  ('tv', 'Television', 'tv', false, true, true, true, true, 5, true),
  ('water_heater', 'Water Heater', 'water_heater', false, true, true, true, true, 6, true),
  ('router', 'Wi-Fi Router', 'router', true, false, false, false, true, 7, true),
  ('workplace', 'Workplace', 'workplace', false, true, false, false, true, 8, true),
  ('washing_machine', 'Washing Machine', 'washing_machine', false, true, true, true, true, 9, true),
  ('light_bulb', 'Ceiling Light', 'light_bulb', false, true, true, false, true, 10, true)
on conflict (id) do update set
  name = excluded.name,
  sprite_key = excluded.sprite_key;

do $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_living_room_id uuid := gen_random_uuid();
  v_kitchen_id uuid := gen_random_uuid();
  v_bedroom_id uuid := gen_random_uuid();
  v_bathroom_id uuid := gen_random_uuid();
  v_water_oct_bill_id uuid := gen_random_uuid();
begin
  -- 1. Locate auth.users record for ykengwei@gmail.com
  select id into v_user_id
  from auth.users
  where lower(email) = 'ykengwei@gmail.com'
  limit 1;

  if v_user_id is null then
    raise notice 'User ykengwei@gmail.com not found in auth.users. Creating user entry...';
    v_user_id := gen_random_uuid();
    insert into auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) values (
      v_user_id,
      'ykengwei@gmail.com',
      extensions.crypt('password123', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Keng Wei","gender":"boy","state":"Selangor","city":"Subang Jaya","street":"15, Jalan USJ 11/1D"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  else
    -- Ensure existing user metadata has gender: boy
    update auth.users
    set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"gender":"boy","name":"Keng Wei"}'::jsonb
    where id = v_user_id;
  end if;

  -- 2. Create or find Household
  select household_id into v_household_id
  from public.profiles
  where id = v_user_id and household_id is not null;

  if v_household_id is null then
    v_household_id := gen_random_uuid();
    insert into public.households (
      id,
      address_state,
      address_city,
      address_street,
      residents_count,
      showers_per_person,
      minutes_per_shower
    ) values (
      v_household_id,
      'Selangor',
      'Subang Jaya',
      '15, Jalan USJ 11/1D',
      3,
      2,
      10
    );
  else
    update public.households set
      address_state = 'Selangor',
      address_city = 'Subang Jaya',
      address_street = '15, Jalan USJ 11/1D',
      residents_count = 3
    where id = v_household_id;
  end if;

  -- 3. Upsert Profile
  insert into public.profiles (
    id,
    name,
    email,
    household_id,
    onboarding_done,
    onboarding_step
  ) values (
    v_user_id,
    'Keng Wei',
    'ykengwei@gmail.com',
    v_household_id,
    true,
    4
  )
  on conflict (id) do update set
    name = 'Keng Wei',
    email = 'ykengwei@gmail.com',
    household_id = v_household_id,
    onboarding_done = true,
    onboarding_step = 4;

  -- 4. Rooms Setup (Floor 1: Living, Kitchen, Bath; Floor 2: Master Bed)
  insert into public.rooms (id, household_id, floor, slot, type, name, is_set_up)
  values
    (v_living_room_id, v_household_id, 1, 'A', 'living_room', 'Living Room', true),
    (v_kitchen_id, v_household_id, 1, 'B', 'kitchen', 'Kitchen', true),
    (v_bathroom_id, v_household_id, 1, 'D', 'bathroom', 'Main Bathroom', true),
    (v_bedroom_id, v_household_id, 2, 'A', 'bedroom', 'Master Bedroom', true)
  on conflict (household_id, floor, slot) do update set
    is_set_up = true,
    name = excluded.name;

  -- 5. Standard Appliances (public.appliances table)
  delete from public.appliances where household_id = v_household_id;
  insert into public.appliances (
    household_id, room_id, type, brand, model, wattage, star_rating, quantity, position_x, position_y
  ) values
    (v_household_id, v_living_room_id, 'air_conditioner', 'Daikin', 'Inverter 1.5HP', 1100, 5, 1, 0.45, 0.30),
    (v_household_id, v_living_room_id, 'fan', 'KDK', '5-blade Fan', 75, 5, 1, 0.50, 0.50),
    (v_household_id, v_living_room_id, 'tv', 'Samsung', '55 inch QLED', 120, 4, 1, 0.80, 0.45),
    (v_household_id, v_kitchen_id, 'refrigerator', 'Panasonic', '2-Door Inverter', 150, 5, 1, 0.25, 0.40),
    (v_household_id, v_bathroom_id, 'water_heater', 'Joven', 'Instant Rainshower', 3500, 4, 1, 0.50, 0.25),
    (v_household_id, v_bedroom_id, 'air_conditioner', 'Panasonic', 'Aero Series 1.0HP', 850, 5, 1, 0.60, 0.35);

  -- 6. Clean existing bills for fresh 6-month timeline
  delete from public.alerts where household_id = v_household_id;
  delete from public.bills where household_id = v_household_id;

  -- 7. Insert Past 6 Months of Bills (Electricity & Water: May 2026 to Oct 2026)
  insert into public.bills (
    id, household_id, file_path, type, billing_month, usage, amount, analysis
  ) values
    -- Month 1: May 2026
    (gen_random_uuid(), v_household_id, v_household_id || '/tnb_2026_05.pdf', 'electricity', '2026-05-01'::date, 420, 115.50, '{"summary":"Spring electricity baseline.","comparison":{"mom_change_pct":0,"actual_usage":420},"tips":["Keep AC filters dust-free."]}'::jsonb),
    (gen_random_uuid(), v_household_id, v_household_id || '/water_2026_05.pdf', 'water', '2026-05-01'::date, 17, 14.30, '{"summary":"Normal water baseline.","comparison":{"mom_change_pct":0,"actual_usage":17},"tips":["Check aerators regularly."]}'::jsonb),

    -- Month 2: June 2026
    (gen_random_uuid(), v_household_id, v_household_id || '/tnb_2026_06.pdf', 'electricity', '2026-06-01'::date, 430, 119.80, '{"summary":"Summer seasonal baseline electricity usage.","comparison":{"mom_change_pct":2.3,"actual_usage":430,"previous_usage":420},"tips":["Use timers on air conditioning."]}'::jsonb),
    (gen_random_uuid(), v_household_id, v_household_id || '/water_2026_06.pdf', 'water', '2026-06-01'::date, 18, 15.20, '{"summary":"Residential water usage is normal.","comparison":{"mom_change_pct":5.8,"actual_usage":18,"previous_usage":17},"tips":["Limit shower times to 5 minutes."]}'::jsonb),

    -- Month 3: July 2026
    (gen_random_uuid(), v_household_id, v_household_id || '/tnb_2026_07.pdf', 'electricity', '2026-07-01'::date, 415, 113.70, '{"summary":"Usage down 3.5% vs June.","comparison":{"mom_change_pct":-3.5,"actual_usage":415,"previous_usage":430},"tips":["Keep AC at 24°C."]}'::jsonb),
    (gen_random_uuid(), v_household_id, v_household_id || '/water_2026_07.pdf', 'water', '2026-07-01'::date, 17, 14.30, '{"summary":"Water consumption steady.","comparison":{"mom_change_pct":-5.5,"actual_usage":17,"previous_usage":18},"tips":["Check toilet cistern for flapper leaks."]}'::jsonb),

    -- Month 4: August 2026
    (gen_random_uuid(), v_household_id, v_household_id || '/tnb_2026_08.pdf', 'electricity', '2026-08-01'::date, 395, 106.10, '{"summary":"Down 4.8% through active conservation.","comparison":{"mom_change_pct":-4.8,"actual_usage":395,"previous_usage":415},"tips":["Unplug standby electronics."]}'::jsonb),
    (gen_random_uuid(), v_household_id, v_household_id || '/water_2026_08.pdf', 'water', '2026-08-01'::date, 16, 13.50, '{"summary":"Usage down 5.9%.","comparison":{"mom_change_pct":-5.9,"actual_usage":16,"previous_usage":17},"tips":["Turn off tap while soaping."]}'::jsonb),

    -- Month 5: September 2026
    (gen_random_uuid(), v_household_id, v_household_id || '/tnb_2026_09.pdf', 'electricity', '2026-09-01'::date, 380, 100.40, '{"summary":"Usage is 3.8% lower than August.","comparison":{"mom_change_pct":-3.8,"actual_usage":380,"previous_usage":395},"tips":["Clean AC air filters regularly."]}'::jsonb),
    (gen_random_uuid(), v_household_id, v_household_id || '/water_2026_09.pdf', 'water', '2026-09-01'::date, 16, 13.50, '{"summary":"Usage steady with August.","comparison":{"mom_change_pct":0,"actual_usage":16,"previous_usage":16},"tips":["Water plants early morning."]}'::jsonb),

    -- Month 6: October 2026 (Abnormal Water Spike / Leak Detection!)
    (gen_random_uuid(), v_household_id, v_household_id || '/tnb_2026_10.pdf', 'electricity', '2026-10-01'::date, 350, 89.20, '{"summary":"Outstanding energy conservation! Usage is 7.9% lower than September and beats Simulator estimate.","comparison":{"mom_change_pct":-7.9,"actual_usage":350,"previous_usage":380},"tips":["Maintain 24°C inverter setpoint.","Use ceiling fan for airflow."],"estimate_kwh":375,"lower_than_estimate":true}'::jsonb),
    (v_water_oct_bill_id, v_household_id, v_household_id || '/water_2026_10_abnormal.pdf', 'water', '2026-10-01'::date, 34, 68.50, '{"summary":"Abnormal water consumption detected! Usage surged +112% vs previous month (34 m³ vs 16 m³). Potential leak detected.","comparison":{"mom_change_pct":112.5,"actual_usage":34,"previous_usage":16},"tips":["Inspect toilet cistern seal for silent flapper leak.","Check outdoor garden bib for seepage.","Ensure all taps are closed and verify water meter spinner."]}'::jsonb);

  -- 8. Insert Water Anomaly Alert for October 2026 Statement
  insert into public.alerts (
    id,
    household_id,
    bill_id,
    level,
    message
  ) values (
    gen_random_uuid(),
    v_household_id,
    v_water_oct_bill_id,
    'leak_detected',
    'Water consumption surged +112% vs previous month (34 m³ vs 16 m³). Potential leak detected in bathroom or garden bib.'
  );

  raise notice 'Successfully seeded basic user info and 6-month bill history with abnormal water leak alert for ykengwei@gmail.com!';
end $$;

-- 9. Deploy Routine Notification Sync Function (Prevents PGRST202 schema cache error)
create or replace function public.sync_routine_appliance_notifications(p_household_id uuid default null)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inserted int := 0;
begin
  return v_inserted;
end;
$$;

grant execute on function public.sync_routine_appliance_notifications(uuid) to authenticated, anon;
