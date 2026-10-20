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
  ('washing_machine', 'Washing Machine', 'washing_machine', false, true, true, true, true, 9, true)

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
