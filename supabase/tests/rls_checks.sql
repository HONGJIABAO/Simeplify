-- ============================================================================
-- Supabase Backend Stage 1: RLS & Permission Verification Script
-- File: supabase/tests/rls_checks.sql
--
-- DO NOT RUN AUTOMATICALLY (Per stage instructions, for manual verification).
-- This script sets up two test users (User A & User B), seeds sample data,
-- and verifies cross-household isolation and security policies.
-- Wrapped in a transaction with rollback to prevent persistent side effects.
-- ============================================================================

begin;

-- ============================================================================
-- 1. FIXTURE SETUP (Run as postgres / superuser)
-- ============================================================================

-- Create test authentication IDs
create temp table _test_fixtures as
select
  '00000000-0000-0000-0000-00000000000a'::uuid as user_a_id,
  '00000000-0000-0000-0000-00000000000b'::uuid as user_b_id,
  gen_random_uuid() as household_a_id,
  gen_random_uuid() as household_b_id,
  gen_random_uuid() as reward_id,
  '2026-11-01'::date as test_month;

-- Seed reference data: rewards & appliance_types & tariff_rates
insert into public.appliance_types (id, name, sprite_key, always_on, needs_person)
values ('air_conditioner', 'Air Conditioner', 'air_conditioner', false, true)
on conflict (id) do nothing;

insert into public.furniture_types (id, name, sprite_key, in_tray, sort_order)
values ('bed', 'Bed', 'bed', true, 1)
on conflict (id) do nothing;

insert into public.rewards (id, voting_month, title, description, is_unlocked)
select reward_id, test_month, 'Community Solar Canopy', '50% clean energy for park', false
from _test_fixtures;

insert into public.tariff_rates (
  type, region, effective_from,
  generation_rate_low, generation_rate_high, generation_threshold_kwh,
  capacity_rate, network_rate, retail_charge, retail_free_limit_kwh, afa_rate
) values (
  'domestic', 'peninsular_malaysia', '2025-07-01',
  0.2703, 0.3703, 1500,
  0.0455, 0.1285, 10.00, 600, 0.00000
)
on conflict do nothing;

-- Seed Household A & Profile A
insert into public.households (id, address_state, address_city, address_street, residents_count)
select household_a_id, 'Selangor', 'Petaling Jaya', '18 Jalan SS 2/6', 3
from _test_fixtures;

-- Seed Household B & Profile B
insert into public.households (id, address_state, address_city, address_street, residents_count)
select household_b_id, 'Kuala Lumpur', 'Bangsar', '42 Jalan Telawi', 2
from _test_fixtures;

-- Create auth.users records for both
insert into auth.users (id, email, raw_user_meta_data)
select user_a_id, 'user_a@example.com', '{"name": "User A"}'::jsonb from _test_fixtures;
insert into auth.users (id, email, raw_user_meta_data)
select user_b_id, 'user_b@example.com', '{"name": "User B"}'::jsonb from _test_fixtures;

-- Bind profiles to households
update public.profiles
set household_id = (select household_a_id from _test_fixtures)
where id = (select user_a_id from _test_fixtures);

update public.profiles
set household_id = (select household_b_id from _test_fixtures)
where id = (select user_b_id from _test_fixtures);

-- Initialize 8 standard rooms for both households
insert into public.rooms (household_id, floor, slot, type, name, is_set_up)
select f.household_a_id, fl, sl, 'bedroom', 'Room ' || fl || sl, true
from _test_fixtures f,
     unnest(array[1, 2]::smallint[]) fl,
     unnest(array['A', 'B', 'C', 'D']::text[]) sl;

insert into public.rooms (household_id, floor, slot, type, name, is_set_up)
select f.household_b_id, fl, sl, 'bedroom', 'Room B ' || fl || sl, true
from _test_fixtures f,
     unnest(array[1, 2]::smallint[]) fl,
     unnest(array['A', 'B', 'C', 'D']::text[]) sl;

-- Seed Household B rows in every household table
insert into public.schedules (household_id, day_type, start_time, end_time)
select household_b_id, 'weekday', '09:00', '18:00' from _test_fixtures;

insert into public.appliances (household_id, room_id, type, brand, wattage, star_rating)
select
  f.household_b_id,
  r.id,
  'air_conditioner',
  'Panasonic',
  1200,
  4
from _test_fixtures f
join public.rooms r on r.household_id = f.household_b_id and r.floor = 1 and r.slot = 'A';

insert into public.furniture_items (household_id, room_id, type, position_x, position_y)
select f.household_b_id, r.id, 'bed', 0.25, 0.50
from _test_fixtures f
join public.rooms r on r.household_id = f.household_b_id and r.floor = 1 and r.slot = 'A';

insert into public.day_blocks (household_id, type, title, start_time, end_time)
select household_b_id, 'sleep', 'Sleep block', '23:00', '07:00' from _test_fixtures;

insert into public.bills (household_id, file_path, type, billing_month, usage, amount)
select household_b_id, 'bills/b_oct.pdf', 'electricity', '2026-10-01', 450, 210.50 from _test_fixtures;

insert into public.alerts (household_id, bill_id, level, message)
select
  f.household_b_id,
  b.id,
  'leak_detected',
  'Water usage spiked by 48%'
from _test_fixtures f
join public.bills b on b.household_id = f.household_b_id;

insert into public.waste_scans (household_id, image_path, item_name, bin_type, is_recyclable, confidence)
select household_b_id, 'scans/b_bottle.jpg', 'PET Bottle', 'plastic', true, 0.95 from _test_fixtures;

insert into public.deeds (household_id, task_type, deed_date)
select household_b_id, 'recycle', '2026-10-20' from _test_fixtures;

insert into public.points (household_id, source, amount, billing_month)
select household_b_id, 'energy', 50, '2026-10-01' from _test_fixtures;

insert into public.votes (household_id, reward_id, voting_month)
select household_b_id, reward_id, test_month from _test_fixtures;

insert into public.notifications (household_id, type, title, message)
select household_b_id, 'bill_alert', 'High Usage Alert', 'Please check your water pipes.' from _test_fixtures;

-- Seed Household A initial vote
insert into public.votes (household_id, reward_id, voting_month)
select household_a_id, reward_id, test_month from _test_fixtures;

grant select on _test_fixtures to authenticated;

-- ============================================================================
-- 2. RUN CHECKS AS USER A (role = authenticated, sub = user_a_id)
-- ============================================================================

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-00000000000a';

-- ----------------------------------------------------------------------------
-- CHECK 1: User A cannot read B's rows in ANY household table
-- ----------------------------------------------------------------------------
do $$
declare
  v_count int;
  v_b_household uuid := '00000000-0000-0000-0000-00000000000b';
begin
  -- profiles
  select count(*) into v_count from public.profiles where id = v_b_household;
  assert v_count = 0, 'FAIL: User A was able to read Profile B';

  -- households
  select count(*) into v_count
  from public.households
  where id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Household B';

  -- schedules
  select count(*) into v_count
  from public.schedules
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Schedules of B';

  -- rooms
  select count(*) into v_count
  from public.rooms
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Rooms of B';

  -- appliances
  select count(*) into v_count
  from public.appliances
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Appliances of B';

  -- furniture_items
  select count(*) into v_count
  from public.furniture_items
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Furniture of B';

  -- day_blocks
  select count(*) into v_count
  from public.day_blocks
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Day Blocks of B';

  -- bills
  select count(*) into v_count
  from public.bills
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Bills of B';

  -- alerts
  select count(*) into v_count
  from public.alerts
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Alerts of B';

  -- waste_scans
  select count(*) into v_count
  from public.waste_scans
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Waste Scans of B';

  -- deeds
  select count(*) into v_count
  from public.deeds
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Deeds of B';

  -- points
  select count(*) into v_count
  from public.points
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Points of B';

  -- votes
  select count(*) into v_count
  from public.votes
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Votes of B';

  -- notifications
  select count(*) into v_count
  from public.notifications
  where household_id in (select household_b_id from _test_fixtures);
  assert v_count = 0, 'FAIL: User A was able to read Notifications of B';

  raise notice 'PASS: Check 1 (Cross-household data isolation verified across all 13 household tables).';
end;
$$;

-- ----------------------------------------------------------------------------
-- CHECK 2: User A cannot insert into points or deeds
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.deeds (household_id, task_type)
    values ((select household_a_id from _test_fixtures), 'recycle');
    raise exception 'FAIL: User A inserted into deeds directly!';
  exception when insufficient_privilege then
    raise notice 'PASS: User A denied direct insert into deeds.';
  end;

  begin
    insert into public.points (household_id, source, amount)
    values ((select household_a_id from _test_fixtures), 'recycling', 10);
    raise exception 'FAIL: User A inserted into points directly!';
  exception when insufficient_privilege then
    raise notice 'PASS: User A denied direct insert into points.';
  end;
end;
$$;

-- ----------------------------------------------------------------------------
-- CHECK 3: User A cannot change profiles.household_id
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    update public.profiles
    set household_id = (select household_b_id from _test_fixtures)
    where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: User A changed household_id on profiles!';
  exception when insufficient_privilege then
    raise notice 'PASS: User A denied column privilege to update household_id.';
  end;
end;
$$;

-- ----------------------------------------------------------------------------
-- CHECK 4: User A cannot insert into waste_scans
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.waste_scans (household_id, image_path, item_name, bin_type, is_recyclable, confidence)
    values (
      (select household_a_id from _test_fixtures),
      'scans/hack.jpg',
      'Aluminum Can',
      'glass_metal',
      true,
      0.99
    );
    raise exception 'FAIL: User A inserted into waste_scans directly!';
  exception when insufficient_privilege then
    raise notice 'PASS: User A denied direct insert into waste_scans.';
  end;
end;
$$;

-- ----------------------------------------------------------------------------
-- CHECK 5: User A cannot insert a second vote in the same month
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.votes (household_id, reward_id, voting_month)
    select household_a_id, reward_id, test_month from _test_fixtures;
    raise exception 'FAIL: User A inserted duplicate vote in same month!';
  exception when unique_violation then
    raise notice 'PASS: Duplicate vote prevented by unique constraint.';
  end;
end;
$$;

-- ----------------------------------------------------------------------------
-- CHECK 6: User A can read tariff_rates
-- ----------------------------------------------------------------------------
do $$
declare
  v_rate numeric;
begin
  select generation_rate_low into v_rate
  from public.tariff_rates
  where region = 'peninsular_malaysia';

  assert v_rate = 0.2703, 'FAIL: User A could not read tariff_rates or got incorrect value';
  raise notice 'PASS: User A successfully read tariff_rates (rate = %).', v_rate;
end;
$$;

-- ----------------------------------------------------------------------------
-- CHECK 7: User A cannot insert into tariff_rates
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.tariff_rates (
      type, region, effective_from,
      generation_rate_low, generation_rate_high, capacity_rate, network_rate
    ) values (
      'domestic', 'peninsular_malaysia', '2027-01-01',
      0.3000, 0.4000, 0.0500, 0.1300
    );
    raise exception 'FAIL: User A inserted into tariff_rates!';
  exception when insufficient_privilege then
    raise notice 'PASS: User A denied insert into tariff_rates.';
  end;
end;
$$;

-- Always rollback so test execution leaves zero database artifacts
rollback;
