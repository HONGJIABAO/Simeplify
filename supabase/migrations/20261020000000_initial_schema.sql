-- Migration: 20261020000000_initial_schema.sql
-- Simeplify / EcoTwin Supabase Backend Stage 1
-- Architecture: Single transaction schema, RLS policies, helper functions & triggers

begin;

-- ============================================================================
-- 1. SCHEMAS & EXTENSIONS
-- ============================================================================

-- Extensions
create extension if not exists pgcrypto;

-- Private schema for internal functions not exposed via PostgREST API
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Revoke default public/anon access to public schema routines/tables by default
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all routines in schema public from anon;

-- ============================================================================
-- 2. UTILITY & SECURITY FUNCTIONS
-- ============================================================================

-- Function to maintain updated_at timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 3. TABLES DEFINITION
-- ============================================================================

-- 1. households
create table public.households (
  id uuid primary key default gen_random_uuid(),
  address_state text not null,
  address_city text not null,
  address_street text,
  residents_count int not null default 1 check (residents_count >= 1),
  showers_per_person smallint not null default 2 check (showers_per_person >= 0 and showers_per_person <= 6),
  minutes_per_shower smallint not null default 10 check (minutes_per_shower >= 5 and minutes_per_shower <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. profiles (mirrors auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  household_id uuid references public.households(id) on delete set null,
  onboarding_done boolean not null default false,
  onboarding_step smallint not null default 1 check (onboarding_step >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_household_id on public.profiles(household_id);

-- Current household helper function in private schema
create or replace function private.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.household_id
  from public.profiles p
  where p.id = (select auth.uid());
$$;

revoke all on function private.current_household_id() from public, anon;
grant execute on function private.current_household_id() to authenticated;

-- 3. schedules (not-at-home ranges)
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  day_type text not null check (day_type in ('weekday', 'weekend')),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_schedules_time_order check (end_time > start_time)
);
create index idx_schedules_household_id on public.schedules(household_id);

-- 4. rooms
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  floor smallint not null check (floor in (1, 2)),
  slot text not null check (slot in ('A', 'B', 'C', 'D')),
  type text check (type is null or type in ('living_room', 'kitchen', 'bedroom', 'bathroom')),
  name text,
  is_set_up boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_rooms_household_floor_slot unique (household_id, floor, slot),
  constraint uq_rooms_id_household unique (id, household_id)
);
create index idx_rooms_household_id on public.rooms(household_id);

-- 5. appliance_types (reference table, global catalog)
create table public.appliance_types (
  id text primary key,
  name text not null,
  sprite_key text not null,
  always_on boolean not null default false,
  needs_person boolean not null default true,
  has_star_rating boolean not null default true,
  swap_eligible boolean not null default true,
  in_tray boolean not null default true,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 6. appliances
create table public.appliances (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  room_id uuid not null,
  type text not null references public.appliance_types(id),
  brand text,
  model text,
  wattage int not null check (wattage > 0),
  star_rating smallint check (star_rating is null or (star_rating >= 1 and star_rating <= 5)),
  quantity smallint not null default 1 check (quantity >= 1),
  position_x numeric(5,4) check (position_x is null or (position_x >= 0 and position_x <= 1)),
  position_y numeric(5,4) check (position_y is null or (position_y >= 0 and position_y <= 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_appliances_room_composite foreign key (room_id, household_id)
    references public.rooms(id, household_id) on delete cascade
);
create index idx_appliances_household_id on public.appliances(household_id);
create index idx_appliances_room on public.appliances(room_id, household_id);

-- 7. day_blocks
create table public.day_blocks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  type text not null check (type in ('sleep', 'meal', 'evening', 'shower', 'work', 'other', 'away')),
  title text not null,
  room_id uuid,
  start_time time not null,
  end_time time not null,
  appliances_on jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_day_blocks_room_composite foreign key (room_id, household_id)
    references public.rooms(id, household_id) on delete set null
);
create index idx_day_blocks_household_id on public.day_blocks(household_id);
create index idx_day_blocks_room on public.day_blocks(room_id, household_id);

-- 8. tariff_rates (reference table, TNB rates)
create table public.tariff_rates (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'domestic',
  region text not null default 'peninsular_malaysia',
  effective_from date not null,
  generation_rate_low numeric(8,5) not null,
  generation_rate_high numeric(8,5) not null,
  generation_threshold_kwh int not null default 1500,
  capacity_rate numeric(8,5) not null,
  network_rate numeric(8,5) not null,
  retail_charge numeric(8,2) not null default 10.00,
  retail_free_limit_kwh int not null default 600,
  afa_rate numeric(8,5) not null default 0.00000,
  created_at timestamptz not null default now(),
  constraint uq_tariff_rates_effective unique (type, region, effective_from)
);

-- 9. waste_scans
create table public.waste_scans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  image_path text not null,
  item_name text not null,
  bin_type text not null check (bin_type in ('paper', 'plastic', 'glass_metal', 'general')),
  is_recyclable boolean not null,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_waste_scans_household_id on public.waste_scans(household_id);

-- 10. bills
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  file_path text not null,
  type text not null check (type in ('electricity', 'water')),
  billing_month date not null check (extract(day from billing_month) = 1),
  usage numeric not null check (usage >= 0),
  amount numeric(10,2) not null check (amount >= 0),
  analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_bills_household_type_month unique (household_id, type, billing_month),
  constraint uq_bills_id_household unique (id, household_id)
);
create index idx_bills_household_id on public.bills(household_id);

-- 11. alerts
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  bill_id uuid not null,
  level text not null check (level in ('normal', 'minor_drip', 'leak_detected', 'major_pipe_burst')),
  message text not null,
  created_at timestamptz not null default now(),
  constraint fk_alerts_bill_composite foreign key (bill_id, household_id)
    references public.bills(id, household_id) on delete cascade
);
create index idx_alerts_household_id on public.alerts(household_id);
create index idx_alerts_bill on public.alerts(bill_id, household_id);

-- 12. deeds
create table public.deeds (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  task_type text not null check (task_type in ('recycle', 'upload_lower_bill', 'simulator_action')),
  deed_date date not null default ((now() at time zone 'Asia/Kuala_Lumpur')::date),
  created_at timestamptz not null default now()
);
create index idx_deeds_household_id on public.deeds(household_id);
create index idx_deeds_household_date on public.deeds(household_id, deed_date);

-- 13. points
-- TODO(open-item 2): Simulator action points value and qualification rule are not decided yet.
create table public.points (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  source text not null check (source in ('recycling', 'energy')),
  amount int not null check (amount > 0),
  deed_id uuid references public.deeds(id) on delete set null,
  billing_month date check (billing_month is null or extract(day from billing_month) = 1),
  created_at timestamptz not null default now(),
  constraint chk_points_energy_month check (source <> 'energy' or billing_month is not null)
);
create index idx_points_household_id on public.points(household_id);
create index idx_points_deed_id on public.points(deed_id);
create unique index uq_points_energy_billing_month on public.points(household_id, billing_month) where (source = 'energy');

-- 14. rewards (reference table, global for now)
-- TODO(open-item 1): Monthly points target number and household milestones are not decided yet.
-- TODO(open-item 3, 5): Unlock state is global for now and will move to a per-community result table when the community rule is decided.
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  voting_month date not null check (extract(day from voting_month) = 1),
  title text not null,
  description text not null default '',
  target_points int check (target_points is null or target_points > 0),
  is_unlocked boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_rewards_voting_month on public.rewards(voting_month);

-- 15. votes
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  voting_month date not null check (extract(day from voting_month) = 1),
  created_at timestamptz not null default now(),
  constraint uq_votes_household_month unique (household_id, voting_month)
);
create index idx_votes_household_id on public.votes(household_id);
create index idx_votes_reward_id on public.votes(reward_id);

-- 16. notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  type text not null check (type in ('bill_alert', 'voting_open', 'month_result', 'reward_ready')),
  title text not null,
  message text not null,
  is_read boolean not null default false,
  linked_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_notifications_household_id on public.notifications(household_id);

-- ============================================================================
-- 4. TRIGGERS FOR UPDATED_AT
-- ============================================================================

create trigger set_households_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_schedules_updated_at
  before update on public.schedules
  for each row execute function public.set_updated_at();

create trigger set_rooms_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

create trigger set_appliances_updated_at
  before update on public.appliances
  for each row execute function public.set_updated_at();

create trigger set_day_blocks_updated_at
  before update on public.day_blocks
  for each row execute function public.set_updated_at();

create trigger set_bills_updated_at
  before update on public.bills
  for each row execute function public.set_updated_at();

create trigger set_notifications_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 5. USER & HOUSEHOLD ONBOARDING FUNCTIONS & TRIGGERS
-- ============================================================================

-- Automatically insert a public.profiles row when auth.users is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create household, bind to profile, and instantiate 8 unconfigured rooms (Floor 1 & 2, Slots A-D)
create or replace function public.create_household(
  p_state text,
  p_city text,
  p_street text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_existing_household_id uuid;
  v_household_id uuid;
  v_floor smallint;
  v_slot text;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into v_existing_household_id
  from public.profiles
  where id = v_user_id;

  if not found then
    raise exception 'Profile not found for authenticated user';
  end if;

  if v_existing_household_id is not null then
    raise exception 'User already has a household';
  end if;

  insert into public.households (address_state, address_city, address_street)
  values (p_state, p_city, p_street)
  returning id into v_household_id;

  update public.profiles
  set household_id = v_household_id
  where id = v_user_id;

  -- Create 8 room rows: floor 1 and 2, slots A to D (is_set_up = false)
  foreach v_floor in array array[1, 2]::smallint[] loop
    foreach v_slot in array array['A', 'B', 'C', 'D']::text[] loop
      insert into public.rooms (household_id, floor, slot, is_set_up)
      values (v_household_id, v_floor, v_slot, false);
    end loop;
  end loop;

  return v_household_id;
end;
$$;

revoke all on function public.create_household(text, text, text) from public, anon;
grant execute on function public.create_household(text, text, text) to authenticated;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - ENABLE & FORCE ON ALL TABLES
-- ============================================================================

alter table public.households enable row level security;
alter table public.households force row level security;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

alter table public.schedules enable row level security;
alter table public.schedules force row level security;

alter table public.rooms enable row level security;
alter table public.rooms force row level security;

alter table public.appliance_types enable row level security;
alter table public.appliance_types force row level security;

alter table public.appliances enable row level security;
alter table public.appliances force row level security;

alter table public.day_blocks enable row level security;
alter table public.day_blocks force row level security;

alter table public.tariff_rates enable row level security;
alter table public.tariff_rates force row level security;

alter table public.waste_scans enable row level security;
alter table public.waste_scans force row level security;

alter table public.bills enable row level security;
alter table public.bills force row level security;

alter table public.alerts enable row level security;
alter table public.alerts force row level security;

alter table public.deeds enable row level security;
alter table public.deeds force row level security;

alter table public.points enable row level security;
alter table public.points force row level security;

alter table public.rewards enable row level security;
alter table public.rewards force row level security;

alter table public.votes enable row level security;
alter table public.votes force row level security;

alter table public.notifications enable row level security;
alter table public.notifications force row level security;

-- ============================================================================
-- 7. RLS POLICIES & PRIVILEGES (Authenticated Role Only)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and household_id is not distinct from (select private.current_household_id())
  );

grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (name, email, onboarding_done, onboarding_step) on public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- households
-- ----------------------------------------------------------------------------
create policy "households_select_own"
  on public.households
  for select
  to authenticated
  using (id = (select private.current_household_id()));

create policy "households_update_own"
  on public.households
  for update
  to authenticated
  using (id = (select private.current_household_id()))
  with check (id = (select private.current_household_id()));

grant select, update on public.households to authenticated;
revoke insert, delete on public.households from authenticated;

-- ----------------------------------------------------------------------------
-- schedules
-- ----------------------------------------------------------------------------
create policy "schedules_select_household"
  on public.schedules
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

create policy "schedules_insert_household"
  on public.schedules
  for insert
  to authenticated
  with check (household_id = (select private.current_household_id()));

create policy "schedules_update_household"
  on public.schedules
  for update
  to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

create policy "schedules_delete_household"
  on public.schedules
  for delete
  to authenticated
  using (household_id = (select private.current_household_id()));

grant select, insert, update, delete on public.schedules to authenticated;

-- ----------------------------------------------------------------------------
-- rooms
-- ----------------------------------------------------------------------------
create policy "rooms_select_household"
  on public.rooms
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

create policy "rooms_insert_household"
  on public.rooms
  for insert
  to authenticated
  with check (household_id = (select private.current_household_id()));

create policy "rooms_update_household"
  on public.rooms
  for update
  to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

create policy "rooms_delete_household"
  on public.rooms
  for delete
  to authenticated
  using (household_id = (select private.current_household_id()));

grant select, insert, update, delete on public.rooms to authenticated;

-- ----------------------------------------------------------------------------
-- appliances
-- ----------------------------------------------------------------------------
create policy "appliances_select_household"
  on public.appliances
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

create policy "appliances_insert_household"
  on public.appliances
  for insert
  to authenticated
  with check (household_id = (select private.current_household_id()));

create policy "appliances_update_household"
  on public.appliances
  for update
  to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

create policy "appliances_delete_household"
  on public.appliances
  for delete
  to authenticated
  using (household_id = (select private.current_household_id()));

grant select, insert, update, delete on public.appliances to authenticated;

-- ----------------------------------------------------------------------------
-- day_blocks
-- ----------------------------------------------------------------------------
create policy "day_blocks_select_household"
  on public.day_blocks
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

create policy "day_blocks_insert_household"
  on public.day_blocks
  for insert
  to authenticated
  with check (household_id = (select private.current_household_id()));

create policy "day_blocks_update_household"
  on public.day_blocks
  for update
  to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

create policy "day_blocks_delete_household"
  on public.day_blocks
  for delete
  to authenticated
  using (household_id = (select private.current_household_id()));

grant select, insert, update, delete on public.day_blocks to authenticated;

-- ----------------------------------------------------------------------------
-- bills
-- ----------------------------------------------------------------------------
create policy "bills_select_household"
  on public.bills
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

create policy "bills_insert_household"
  on public.bills
  for insert
  to authenticated
  with check (household_id = (select private.current_household_id()));

create policy "bills_update_household"
  on public.bills
  for update
  to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

create policy "bills_delete_household"
  on public.bills
  for delete
  to authenticated
  using (household_id = (select private.current_household_id()));

grant select, insert, update, delete on public.bills to authenticated;

-- ----------------------------------------------------------------------------
-- alerts
-- ----------------------------------------------------------------------------
create policy "alerts_select_household"
  on public.alerts
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

create policy "alerts_insert_household"
  on public.alerts
  for insert
  to authenticated
  with check (household_id = (select private.current_household_id()));

grant select, insert on public.alerts to authenticated;
revoke update, delete on public.alerts from authenticated;

-- ----------------------------------------------------------------------------
-- waste_scans
-- Written by Edge Function using service role. Authenticated users only read.
-- ----------------------------------------------------------------------------
create policy "waste_scans_select_household"
  on public.waste_scans
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

grant select on public.waste_scans to authenticated;
revoke insert, update, delete on public.waste_scans from authenticated;

-- ----------------------------------------------------------------------------
-- notifications
-- Inserted by DB trigger or Edge Function. Users can read and update is_read only.
-- ----------------------------------------------------------------------------
create policy "notifications_select_household"
  on public.notifications
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

create policy "notifications_update_household"
  on public.notifications
  for update
  to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

grant select on public.notifications to authenticated;
revoke update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;
revoke insert, delete on public.notifications from authenticated;

-- ----------------------------------------------------------------------------
-- deeds
-- Written only by Edge Functions with service role.
-- ----------------------------------------------------------------------------
create policy "deeds_select_household"
  on public.deeds
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

grant select on public.deeds to authenticated;
revoke insert, update, delete on public.deeds from authenticated;

-- ----------------------------------------------------------------------------
-- points
-- Written only by Edge Functions with service role.
-- ----------------------------------------------------------------------------
create policy "points_select_household"
  on public.points
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

grant select on public.points to authenticated;
revoke insert, update, delete on public.points from authenticated;

-- ----------------------------------------------------------------------------
-- votes
-- One vote per household per month. Reward month must match vote voting_month.
-- ----------------------------------------------------------------------------
create policy "votes_select_household"
  on public.votes
  for select
  to authenticated
  using (household_id = (select private.current_household_id()));

create policy "votes_insert_household"
  on public.votes
  for insert
  to authenticated
  with check (
    household_id = (select private.current_household_id())
    and exists (
      select 1
      from public.rewards r
      where r.id = reward_id
        and r.voting_month = voting_month
    )
  );

grant select, insert on public.votes to authenticated;
revoke update, delete on public.votes from authenticated;

-- ----------------------------------------------------------------------------
-- appliance_types (Global Reference Table)
-- ----------------------------------------------------------------------------
create policy "appliance_types_select_authenticated"
  on public.appliance_types
  for select
  to authenticated
  using (true);

grant select on public.appliance_types to authenticated;
revoke insert, update, delete on public.appliance_types from authenticated;

-- ----------------------------------------------------------------------------
-- tariff_rates (Global Reference Table)
-- ----------------------------------------------------------------------------
create policy "tariff_rates_select_authenticated"
  on public.tariff_rates
  for select
  to authenticated
  using (true);

grant select on public.tariff_rates to authenticated;
revoke insert, update, delete on public.tariff_rates from authenticated;

-- ----------------------------------------------------------------------------
-- rewards (Global Reference Table)
-- ----------------------------------------------------------------------------
create policy "rewards_select_authenticated"
  on public.rewards
  for select
  to authenticated
  using (true);

grant select on public.rewards to authenticated;
revoke insert, update, delete on public.rewards from authenticated;

commit;
