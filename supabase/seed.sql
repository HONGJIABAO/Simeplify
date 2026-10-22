-- ============================================================================
-- Supabase Backend Stage 2: Reference Seed Data
-- File: supabase/seed.sql
--
-- Populates reference tables (tariff_rates, appliance_types, rewards)
-- using idempotent INSERT ... ON CONFLICT statements for safe repeated execution.
-- ============================================================================

-- ============================================================================
-- 1. TARIFF RATES (Peninsular Malaysia TNB Domestic Tariff)
-- Source: Feature_Requirements.md Appendix A
-- ============================================================================

-- TODO(open-item 7): AFA (Automatic Fuel Adjustment) changes monthly.
-- Update tariff_rates each month. Default 0.
-- TODO(open-item 8): Generation charge above 1,500 kWh applies higher rate
-- only to kWh above 1,500 (marginal rate in v1).
insert into public.tariff_rates (
  type,
  region,
  effective_from,
  generation_rate_low,
  generation_rate_high,
  generation_threshold_kwh,
  capacity_rate,
  network_rate,
  retail_charge,
  retail_free_limit_kwh,
  afa_rate
) values (
  'domestic',
  'peninsular_malaysia',
  '2025-07-01'::date,
  0.2703,   -- 27.03 sen/kWh (up to 1,500 kWh/month)
  0.3703,   -- 37.03 sen/kWh (above 1,500 kWh/month)
  1500,     -- Threshold in kWh
  0.0455,   -- 4.55 sen/kWh (all kWh)
  0.1285,   -- 12.85 sen/kWh (all kWh)
  10.00,    -- RM 10.00/month (only when usage > 600 kWh)
  600,      -- Free limit: RM 0 when usage <= 600 kWh
  0.00000   -- AFA default 0.00000 RM/kWh
)
on conflict (type, region, effective_from) do update set
  generation_rate_low      = excluded.generation_rate_low,
  generation_rate_high     = excluded.generation_rate_high,
  generation_threshold_kwh = excluded.generation_threshold_kwh,
  capacity_rate            = excluded.capacity_rate,
  network_rate             = excluded.network_rate,
  retail_charge            = excluded.retail_charge,
  retail_free_limit_kwh    = excluded.retail_free_limit_kwh,
  afa_rate                 = excluded.afa_rate;

-- ============================================================================
-- 2. APPLIANCE TYPES (Standard Malaysian Household Equipment)
-- Source: Feature_Requirements.md ONB-03 & SIM-01
-- All default wattages marked as estimates.
-- ============================================================================

insert into public.appliance_types (
  id,
  name,
  sprite_key,
  always_on,
  needs_person,
  has_star_rating,
  swap_eligible,
  in_tray,
  sort_order,
  active
) values
  -- Air Conditioner: estimated typical wattage ~1,000W to 1,200W (Inverter/Non-Inverter)
  ('air_conditioner', 'Air Conditioner', 'air_conditioner', false, true, true, true, true, 1, true),

  -- Refrigerator: estimated typical wattage ~150W (inverter compressor cycle, always on)
  ('refrigerator', 'Refrigerator', 'refrigerator', true, false, true, true, true, 2, true),

  -- LED Lights: estimated typical wattage ~18W per room/fixture
  ('lights', 'Lights', 'lights', false, true, true, false, true, 3, true),

  -- Fan: estimated typical wattage ~55W (Ceiling / Table fan)
  ('fan', 'Fan', 'fan', false, true, true, true, true, 4, true),

  -- Television: estimated typical wattage ~90W (Smart TV / LED display)
  ('tv', 'Television', 'tv', false, true, true, true, true, 5, true),

  -- Water Heater: estimated typical wattage ~3,500W (Instant bathroom shower heater)
  ('water_heater', 'Water Heater', 'water_heater', false, true, true, true, true, 6, true),

  -- Wi-Fi Router: estimated typical wattage ~15W (always on, standby)
  ('router', 'Wi-Fi Router', 'router', true, false, false, false, true, 7, true),

  -- Workplace: estimated typical wattage ~80W (Laptop charger ~65W + smartphone ~15W)
  ('workplace', 'Workplace', 'workplace', false, true, false, false, true, 8, true),

  -- Washing Machine: estimated typical wattage ~500W (motor wash cycle)
  ('washing_machine', 'Washing Machine', 'washing_machine', false, true, true, true, true, 9, true),

  -- Ceiling light: 9W / 5-star default for newly added demo rows.
  ('light_bulb', 'Ceiling Light', 'light_bulb', false, true, true, false, true, 10, true)

on conflict (id) do update set
  name            = excluded.name,
  sprite_key      = excluded.sprite_key,
  always_on       = excluded.always_on,
  needs_person    = excluded.needs_person,
  has_star_rating = excluded.has_star_rating,
  swap_eligible   = excluded.swap_eligible,
  in_tray         = excluded.in_tray,
  sort_order      = excluded.sort_order,
  active          = excluded.active;

-- ============================================================================
-- 3. REWARDS (Monthly Community Voting Options)
-- Source: screen_spec.md §S6.1 & Feature_Requirements.md COM-01
-- Uses deterministic UUIDs targeting rewards_pkey (Option A).
-- Voting month is calculated as the 1st of current month in Asia/Kuala_Lumpur.
-- ============================================================================

-- TODO(open-item 1): Monthly points target number and household milestones are not decided yet.
-- TODO(open-item 3, 5): Unlock state is global for now and will move to a per-community
-- result table when the community sector rule is decided.
insert into public.rewards (
  id,
  voting_month,
  title,
  description,
  target_points,
  is_unlocked
) values
  (
    '00000000-0000-0000-0000-000000000101'::uuid,
    (date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur'))::date,
    'Plant a tree in our community',
    'Adds native shaded greenery to the parkway',
    null,   -- TODO(open-item 1): Target points not decided yet
    false   -- Locked until monthly settlement
  ),
  (
    '00000000-0000-0000-0000-000000000102'::uuid,
    (date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur'))::date,
    '50% off organic food at Sime Darby Mall',
    'Redeemable voucher for seasonal fresh produce',
    null,   -- TODO(open-item 1): Target points not decided yet
    false   -- Locked until monthly settlement
  ),
  (
    '00000000-0000-0000-0000-000000000103'::uuid,
    (date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur'))::date,
    'Community tool & seed library',
    'Free borrowing station for garden equipment',
    null,   -- TODO(open-item 1): Target points not decided yet
    false   -- Locked until monthly settlement
  )
on conflict (id) do update set
  voting_month  = excluded.voting_month,
  title         = excluded.title,
  description   = excluded.description,
  target_points = excluded.target_points,
  is_unlocked   = excluded.is_unlocked;

-- ============================================================================
-- 4. DEMO USER & HOUSEHOLD (Mei Ling Tan - meiling.tan@example.com / password123)
-- Source: Login Screen ("Tap to auto-fill Mei Ling's login")
-- Populates rich initial state across Auth, Profile, Household, Simulator,
-- Scanner, Bin, and Community for ready-to-demo experience.
-- ============================================================================

-- 4.1. Auth User
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'd3b00000-0000-0000-0000-000000000001'::uuid,
  'authenticated',
  'authenticated',
  'meiling.tan@example.com',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Mei Ling Tan","gender":"girl","state":"Selangor","city":"Subang Jaya","street":"15, Jalan USJ 11/1D"}'::jsonb,
  false,
  now(),
  now()
)
on conflict (id) do update set
  email                      = excluded.email,
  encrypted_password         = excluded.encrypted_password,
  email_confirmed_at         = excluded.email_confirmed_at,
  confirmation_token         = excluded.confirmation_token,
  recovery_token             = excluded.recovery_token,
  email_change_token_new     = excluded.email_change_token_new,
  email_change               = excluded.email_change,
  phone_change               = excluded.phone_change,
  phone_change_token         = excluded.phone_change_token,
  email_change_token_current = excluded.email_change_token_current,
  reauthentication_token     = excluded.reauthentication_token,
  raw_app_meta_data          = excluded.raw_app_meta_data,
  raw_user_meta_data         = excluded.raw_user_meta_data,
  updated_at                 = now();

-- 4.2. Auth Identity
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'd3b00000-0000-0000-0000-000000000001'::uuid,
  'd3b00000-0000-0000-0000-000000000001'::uuid,
  '{"sub":"d3b00000-0000-0000-0000-000000000001","email":"meiling.tan@example.com","name":"Mei Ling Tan"}'::jsonb,
  'email',
  'd3b00000-0000-0000-0000-000000000001',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do update set
  identity_data = excluded.identity_data,
  updated_at    = now();

-- 4.3. Household
insert into public.households (
  id,
  address_state,
  address_city,
  address_street,
  residents_count,
  showers_per_person,
  minutes_per_shower
) values (
  'd3b00000-0000-0000-0000-000000000002'::uuid,
  'Selangor',
  'Subang Jaya',
  '15, Jalan USJ 11/1D',
  3,
  2,
  10
)
on conflict (id) do update set
  address_state      = excluded.address_state,
  address_city       = excluded.address_city,
  address_street     = excluded.address_street,
  residents_count    = excluded.residents_count,
  showers_per_person = excluded.showers_per_person,
  minutes_per_shower = excluded.minutes_per_shower;

-- 4.4. Profile (created automatically by trigger, update household link & onboarding status)
insert into public.profiles (
  id,
  name,
  email,
  household_id,
  onboarding_done,
  onboarding_step
) values (
  'd3b00000-0000-0000-0000-000000000001'::uuid,
  'Mei Ling Tan',
  'meiling.tan@example.com',
  'd3b00000-0000-0000-0000-000000000002'::uuid,
  true,
  3
)
on conflict (id) do update set
  name            = excluded.name,
  email           = excluded.email,
  household_id    = excluded.household_id,
  onboarding_done = excluded.onboarding_done,
  onboarding_step = excluded.onboarding_step;

-- 4.5. Schedules (Not-at-home intervals)
insert into public.schedules (
  id,
  household_id,
  day_type,
  start_time,
  end_time
) values
  ('d3b00000-0000-0000-0003-000000000001'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'weekday', '09:00', '17:00'),
  ('d3b00000-0000-0000-0003-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'weekend', '14:00', '18:00')
on conflict (id) do update set
  day_type   = excluded.day_type,
  start_time = excluded.start_time,
  end_time   = excluded.end_time;

-- 4.6. Rooms (Floor 1 & 2 layout, Slots A-D)
insert into public.rooms (
  id,
  household_id,
  floor,
  slot,
  type,
  name,
  is_set_up
) values
  ('d3b00000-0000-0000-0001-000000000001'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 1, 'A', 'living_room', 'Living Room', true),
  ('d3b00000-0000-0000-0001-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 1, 'B', 'kitchen', 'Kitchen', true),
  ('d3b00000-0000-0000-0001-000000000003'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 1, 'C', 'bathroom', 'Laundry Room', true),
  ('d3b00000-0000-0000-0001-000000000004'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 1, 'D', 'bathroom', 'Bathroom', true),
  ('d3b00000-0000-0000-0002-000000000001'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 2, 'A', 'bedroom', 'Master Bedroom', true),
  ('d3b00000-0000-0000-0002-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 2, 'B', 'bedroom', 'Study & Guest', true),
  ('d3b00000-0000-0000-0002-000000000003'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 2, 'C', 'bathroom', 'Work Room', true),
  ('d3b00000-0000-0000-0002-000000000004'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 2, 'D', 'bathroom', 'Bathroom', true)
on conflict (id) do update set
  type      = excluded.type,
  name      = excluded.name,
  is_set_up = excluded.is_set_up;

-- 4.7. Appliances (Room Placement, Star Ratings, Wattages)
insert into public.appliances (
  id,
  household_id,
  room_id,
  type,
  brand,
  model,
  wattage,
  star_rating,
  quantity,
  position_x,
  position_y
) values
  -- Living Room
  ('d3b00000-0000-0000-0004-000000000001'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0001-000000000001'::uuid, 'air_conditioner', 'Daikin', 'Inverter FTKV25N', 1000, 5, 1, 0.121568, 0.137720),
  ('d3b00000-0000-0000-0004-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0001-000000000001'::uuid, 'tv', 'Sony', 'Bravia 4K 55"', 90, 5, 1, 0.264480, 0.149600),
  ('d3b00000-0000-0000-0004-000000000003'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0001-000000000001'::uuid, 'fan', 'Panasonic', 'Bayu 5-Blade', 55, 4, 1, 0.106256, 0.450560),
  ('d3b00000-0000-0000-0004-000000000004'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'light_bulb', 'Philips', 'Essential Warm LED', 18, 5, 2, 0.274688, 0.418880),
  ('d3b00000-0000-0000-0004-000000000005'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0001-000000000001'::uuid, 'router', 'TP-Link', 'Archer AX55 Wi-Fi 6', 15, null, 1, 0.463536, 0.141680),
  -- Kitchen
  ('d3b00000-0000-0000-0004-000000000006'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0001-000000000002'::uuid, 'refrigerator', 'Hitachi', 'Inverter Big2', 150, 5, 1, 0.682816, 0.169400),
  ('d3b00000-0000-0000-0004-000000000007'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0001-000000000002'::uuid, 'light_bulb', 'Philips', 'Downlight LED', 18, 5, 2, 0.753040, 0.327800),
  -- Downstairs Bathroom and Laundry Room ceiling light
  ('d3b00000-0000-0000-0004-000000000008'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0001-000000000004'::uuid, 'water_heater', 'Joven', 'Instant Rainshower', 3500, 4, 1, 0.756032, 0.678880),
  ('d3b00000-0000-0000-0004-000000000009'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0001-000000000003'::uuid, 'light_bulb', 'Philips', 'Ceiling LED', 18, 5, 1, 0.285200, 0.808480),
  -- Master Bedroom
  ('d3b00000-0000-0000-0004-000000000010'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000001'::uuid, 'air_conditioner', 'Panasonic', 'Aero Inverter', 1000, 5, 1, 0.453328, 0.137720),
  ('d3b00000-0000-0000-0004-000000000011'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000001'::uuid, 'fan', 'KDK', 'SensAir Remote', 55, 5, 1, 0.50, 0.50),
  ('d3b00000-0000-0000-0004-000000000012'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000001'::uuid, 'lights', 'Philips', 'Warm LED', 18, 5, 2, 0.30, 0.70),
  -- Study & Guest
  ('d3b00000-0000-0000-0004-000000000013'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000002'::uuid, 'workplace', 'Dell', 'UltraSharp & Laptop', 80, null, 1, 0.40, 0.40),
  ('d3b00000-0000-0000-0004-000000000014'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000002'::uuid, 'fan', 'KDK', 'Wall Fan', 55, 4, 1, 0.60, 0.60),
  ('d3b00000-0000-0000-0004-000000000015'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000002'::uuid, 'lights', 'Philips', 'Study Tube LED', 18, 5, 1, 0.50, 0.50),
  -- Upstairs Bathroom and Work Room ceiling light
  ('d3b00000-0000-0000-0004-000000000016'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000004'::uuid, 'water_heater', 'Panasonic', 'Home Shower', 3500, 5, 1, 0.648320, 0.678880),
  ('d3b00000-0000-0000-0004-000000000017'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000003'::uuid, 'light_bulb', 'Philips', 'Moistureproof LED', 18, 5, 1, 0.272000, 0.802000),
  -- New ceiling-light rows only (the task does not add other appliance rows)
  ('d3b00000-0000-0000-0004-000000000018'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0001-000000000004'::uuid, 'light_bulb', 'Philips', 'Ceiling LED', 9, 5, 1, 0.680000, 0.808480),
  ('d3b00000-0000-0000-0004-000000000019'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000001'::uuid, 'light_bulb', 'Philips', 'Ceiling LED', 9, 5, 1, 0.290000, 0.347600),
  ('d3b00000-0000-0000-0004-000000000020'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000002'::uuid, 'light_bulb', 'Philips', 'Ceiling LED', 9, 5, 1, 0.782608, 0.347600),
  ('d3b00000-0000-0000-0004-000000000021'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0002-000000000004'::uuid, 'light_bulb', 'Philips', 'Ceiling LED', 9, 5, 1, 0.705344, 0.776080)
on conflict (id) do update set
  room_id     = excluded.room_id,
  type        = excluded.type,
  brand       = excluded.brand,
  model       = excluded.model,
  wattage     = excluded.wattage,
  star_rating = excluded.star_rating,
  quantity    = excluded.quantity,
  position_x  = excluded.position_x,
  position_y  = excluded.position_y;

-- 4.8. My Day Routine Blocks
insert into public.day_blocks (
  id,
  household_id,
  type,
  title,
  room_id,
  start_time,
  end_time,
  appliances_on
) values
  ('d3b00000-0000-0000-0005-000000000001'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'shower', 'Morning Showers', 'd3b00000-0000-0000-0001-000000000004'::uuid, '06:30', '07:30', '["d3b00000-0000-0000-0004-000000000008"]'::jsonb),
  ('d3b00000-0000-0000-0005-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'meal', 'Family Breakfast', 'd3b00000-0000-0000-0001-000000000002'::uuid, '07:30', '08:30', '["d3b00000-0000-0000-0004-000000000006", "d3b00000-0000-0000-0004-000000000007"]'::jsonb),
  ('d3b00000-0000-0000-0005-000000000003'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'work', 'Remote Work & Study', 'd3b00000-0000-0000-0002-000000000002'::uuid, '09:00', '17:00', '["d3b00000-0000-0000-0004-000000000013", "d3b00000-0000-0000-0004-000000000014"]'::jsonb),
  ('d3b00000-0000-0000-0005-000000000004'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'evening', 'Living Room & TV', 'd3b00000-0000-0000-0001-000000000001'::uuid, '19:00', '22:00', '["d3b00000-0000-0000-0004-000000000001", "d3b00000-0000-0000-0004-000000000002", "d3b00000-0000-0000-0004-000000000004"]'::jsonb),
  ('d3b00000-0000-0000-0005-000000000005'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'sleep', 'Night Sleep', 'd3b00000-0000-0000-0002-000000000001'::uuid, '22:30', '06:30', '["d3b00000-0000-0000-0004-000000000010", "d3b00000-0000-0000-0004-000000000011"]'::jsonb)
on conflict (id) do update set
  type          = excluded.type,
  title         = excluded.title,
  room_id       = excluded.room_id,
  start_time    = excluded.start_time,
  end_time      = excluded.end_time,
  appliances_on = excluded.appliances_on;

-- 4.9. Bills History (Past 5 months of Electricity & Water for Scanner 5-month Chart)
insert into public.bills (
  id,
  household_id,
  file_path,
  type,
  billing_month,
  usage,
  amount,
  analysis
) values
  -- Electricity (Past 5 billing cycles)
  ('d3b00000-0000-0000-0006-000000000001'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/tnb_2026_06.pdf', 'electricity', '2026-06-01'::date, 430, 119.80, '{"summary":"Summer baseline electricity usage.","comparison":{"mom_change_pct":0,"actual_usage":430,"previous_usage":null},"tips":["Use timers on air conditioning."],"estimate_kwh":450,"lower_than_estimate":true}'::jsonb),
  ('d3b00000-0000-0000-0006-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/tnb_2026_07.pdf', 'electricity', '2026-07-01'::date, 415, 113.70, '{"summary":"Usage down 3.5% vs previous month.","comparison":{"mom_change_pct":-3.5,"actual_usage":415,"previous_usage":430},"tips":["Keep aircon at 24°C."],"estimate_kwh":430,"lower_than_estimate":true}'::jsonb),
  ('d3b00000-0000-0000-0006-000000000003'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/tnb_2026_08.pdf', 'electricity', '2026-08-01'::date, 395, 106.10, '{"summary":"Consistent downward trend in electricity consumption.","comparison":{"mom_change_pct":-4.8,"actual_usage":395,"previous_usage":415},"tips":["Unplug standby electronics."],"estimate_kwh":410,"lower_than_estimate":true}'::jsonb),
  ('d3b00000-0000-0000-0006-000000000004'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/tnb_2026_09.pdf', 'electricity', '2026-09-01'::date, 380, 100.40, '{"summary":"Great energy savings. Usage is 3.8% lower than last month.","comparison":{"mom_change_pct":-3.8,"actual_usage":380,"previous_usage":395},"tips":["Clean AC air filters regularly."],"estimate_kwh":390,"lower_than_estimate":true}'::jsonb),
  ('d3b00000-0000-0000-0006-000000000005'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/tnb_2026_10.pdf', 'electricity', '2026-10-01'::date, 350, 89.20, '{"summary":"Outstanding energy conservation! Usage is 7.9% lower than last month and beats your Simulator estimate.","comparison":{"mom_change_pct":-7.9,"actual_usage":350,"previous_usage":380},"tips":["Maintain 24°C inverter setpoint.","Use ceiling fan for airflow."],"estimate_kwh":375,"lower_than_estimate":true}'::jsonb),
  -- Water (Past 5 billing cycles)
  ('d3b00000-0000-0000-0006-000000000006'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/air_selangor_2026_06.pdf', 'water', '2026-06-01'::date, 18, 15.20, '{"summary":"Normal residential water consumption.","comparison":{"mom_change_pct":0,"actual_usage":18,"previous_usage":null},"tips":["Limit shower times."]}'::jsonb),
  ('d3b00000-0000-0000-0006-000000000007'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/air_selangor_2026_07.pdf', 'water', '2026-07-01'::date, 17, 14.30, '{"summary":"Water consumption steady.","comparison":{"mom_change_pct":-5.5,"actual_usage":17,"previous_usage":18},"tips":["Check toilet flappers for leaks."]}'::jsonb),
  ('d3b00000-0000-0000-0006-000000000008'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/air_selangor_2026_08.pdf', 'water', '2026-08-01'::date, 16, 13.50, '{"summary":"Usage down 5.9%.","comparison":{"mom_change_pct":-5.9,"actual_usage":16,"previous_usage":17},"tips":["Turn off tap while soaping."]}'::jsonb),
  ('d3b00000-0000-0000-0006-000000000009'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/air_selangor_2026_09.pdf', 'water', '2026-09-01'::date, 16, 13.50, '{"summary":"Usage consistent with previous month.","comparison":{"mom_change_pct":0,"actual_usage":16,"previous_usage":16},"tips":["Water plants early in the morning."]}'::jsonb),
  ('d3b00000-0000-0000-0006-000000000010'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/air_selangor_2026_10.pdf', 'water', '2026-10-01'::date, 15, 12.60, '{"summary":"Excellent water conservation! Usage is 6.25% lower than last month with zero leaks detected.","comparison":{"mom_change_pct":-6.25,"actual_usage":15,"previous_usage":16},"tips":["Keep up the short shower habit.","Use aerators on sink taps."]}'::jsonb)
on conflict (household_id, type, billing_month) do update set
  usage    = excluded.usage,
  amount   = excluded.amount,
  analysis = excluded.analysis;

-- 4.10. Water Alerts
insert into public.alerts (
  id,
  household_id,
  bill_id,
  level,
  message
) values (
  'd3b00000-0000-0000-0007-000000000001'::uuid,
  'd3b00000-0000-0000-0000-000000000002'::uuid,
  'd3b00000-0000-0000-0006-000000000010'::uuid,
  'normal',
  'Water usage is within normal residential bounds.'
)
on conflict (id) do update set
  level   = excluded.level,
  message = excluded.message;

-- 4.11. Green Deeds
insert into public.deeds (
  id,
  household_id,
  task_type,
  deed_date
) values
  ('d3b00000-0000-0000-0008-000000000001'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'recycle', (now() at time zone 'Asia/Kuala_Lumpur')::date),
  ('d3b00000-0000-0000-0008-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'upload_lower_bill', (now() at time zone 'Asia/Kuala_Lumpur')::date)
on conflict (id) do update set
  task_type = excluded.task_type,
  deed_date = excluded.deed_date;

-- 4.12. Points (+10 recycling, +50 energy = 60 pts current month)
insert into public.points (
  id,
  household_id,
  source,
  amount,
  deed_id,
  billing_month
) values
  ('d3b00000-0000-0000-0009-000000000001'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'recycling', 10, 'd3b00000-0000-0000-0008-000000000001'::uuid, null),
  ('d3b00000-0000-0000-0009-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'energy', 50, 'd3b00000-0000-0000-0008-000000000002'::uuid, '2026-10-01'::date)
on conflict (id) do update set
  source        = excluded.source,
  amount        = excluded.amount,
  deed_id       = excluded.deed_id,
  billing_month = excluded.billing_month;

-- 4.13. Waste Scans History
insert into public.waste_scans (
  id,
  household_id,
  image_path,
  item_name,
  bin_type,
  is_recyclable,
  confidence,
  confirmed_at
) values
  ('d3b00000-0000-0000-0010-000000000001'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/sample_carton.jpg', 'Plain Carton Box', 'paper', true, 0.96, now()),
  ('d3b00000-0000-0000-0010-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002/sample_bottle.jpg', 'PET Water Bottle', 'plastic', true, 0.98, now())
on conflict (id) do update set
  item_name    = excluded.item_name,
  bin_type     = excluded.bin_type,
  confirmed_at = excluded.confirmed_at;

-- 4.14. Community Monthly Vote
insert into public.votes (
  id,
  household_id,
  reward_id,
  voting_month
) values (
  'd3b00000-0000-0000-0011-000000000001'::uuid,
  'd3b00000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  (date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur'))::date
)
on conflict (household_id, voting_month) do update set
  reward_id = excluded.reward_id;

-- 4.15. Notifications
insert into public.notifications (
  id,
  household_id,
  type,
  title,
  message,
  is_read,
  linked_path
) values
  ('d3b00000-0000-0000-0012-000000000001'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'bill_alert', 'October electricity statement analyzed', 'Your usage (350 kWh) was lower than your Simulator estimate (375 kWh). You earned +50 energy points!', false, '/(tabs)/scanner'),
  ('d3b00000-0000-0000-0012-000000000002'::uuid, 'd3b00000-0000-0000-0000-000000000002'::uuid, 'voting_open', 'Monthly Community Voting Open', 'Vote for your preferred October sustainability project!', true, '/(tabs)/community')
on conflict (id) do update set
  type        = excluded.type,
  title       = excluded.title,
  message     = excluded.message,
  is_read     = excluded.is_read,
  linked_path = excluded.linked_path;

-- 4.16. Generate Smart Routine & Appliance Reminders for Demo Household
select public.sync_routine_appliance_notifications('d3b00000-0000-0000-0000-000000000002'::uuid);

