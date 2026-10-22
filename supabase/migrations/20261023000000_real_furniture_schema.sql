-- SIM-05/SIM-06: Persist furniture and item facing for the two-floor home.
begin;

alter table public.rooms drop constraint if exists rooms_type_check;
alter table public.rooms
  add constraint rooms_type_check
  check (type is null or type in (
    'living_room', 'kitchen', 'bedroom', 'bathroom', 'laundry_room', 'work_room'
  ));

alter table public.appliances
  add column if not exists facing text not null default 'front';

alter table public.appliances drop constraint if exists appliances_facing_check;
alter table public.appliances
  add constraint appliances_facing_check check (facing in ('front', 'back'));

create table if not exists public.furniture_types (
  id text primary key,
  name text not null,
  sprite_key text not null,
  in_tray boolean not null default true,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.furniture_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  room_id uuid not null,
  type text not null references public.furniture_types(id),
  role text,
  facing text not null default 'front' check (facing in ('front', 'back')),
  position_x numeric(5,4) not null check (position_x >= 0 and position_x <= 1),
  position_y numeric(5,4) not null check (position_y >= 0 and position_y <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_furniture_items_room_composite foreign key (room_id, household_id)
    references public.rooms(id, household_id) on delete cascade
);

create index if not exists idx_furniture_items_household_id
  on public.furniture_items(household_id);
create index if not exists idx_furniture_items_room
  on public.furniture_items(room_id, household_id);

drop trigger if exists set_furniture_items_updated_at on public.furniture_items;
create trigger set_furniture_items_updated_at
  before update on public.furniture_items
  for each row execute function public.set_updated_at();

alter table public.furniture_types enable row level security;
alter table public.furniture_types force row level security;
alter table public.furniture_items enable row level security;
alter table public.furniture_items force row level security;

drop policy if exists "furniture_types_select_authenticated" on public.furniture_types;
create policy "furniture_types_select_authenticated"
  on public.furniture_types for select to authenticated using (true);

drop policy if exists "furniture_items_select_household" on public.furniture_items;
create policy "furniture_items_select_household"
  on public.furniture_items for select to authenticated
  using (household_id = (select private.current_household_id()));

drop policy if exists "furniture_items_insert_household" on public.furniture_items;
create policy "furniture_items_insert_household"
  on public.furniture_items for insert to authenticated
  with check (household_id = (select private.current_household_id()));

drop policy if exists "furniture_items_update_household" on public.furniture_items;
create policy "furniture_items_update_household"
  on public.furniture_items for update to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

drop policy if exists "furniture_items_delete_household" on public.furniture_items;
create policy "furniture_items_delete_household"
  on public.furniture_items for delete to authenticated
  using (household_id = (select private.current_household_id()));

grant select on public.furniture_types to authenticated;
revoke insert, update, delete on public.furniture_types from authenticated;
grant select, insert, update, delete on public.furniture_items to authenticated;
revoke all on public.furniture_types, public.furniture_items from anon;

commit;
