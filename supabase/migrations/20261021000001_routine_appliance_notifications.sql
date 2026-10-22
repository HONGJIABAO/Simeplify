-- ============================================================================
-- Migration: 20261021000001_routine_appliance_notifications.sql
-- Purpose: Smart appliance & routine transition notifications
--          1. Expand notifications type check constraint
--          2. Create public.sync_routine_appliance_notifications()
--          3. Hook automated trigger on day_blocks & schedules
-- ============================================================================

-- 1. Safely expand notifications type check constraint
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'bill_alert',
    'voting_open',
    'month_result',
    'reward_ready',
    'routine_reminder',
    'appliance_reminder'
  ));

-- 2. Core RPC: sync_routine_appliance_notifications
create or replace function public.sync_routine_appliance_notifications(
  p_household_id uuid default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_inserted_count int := 0;
  v_today date := current_date;

  -- Block variables
  v_block record;
  v_next_block record;
  v_sleep_block record;
  v_evening_block record;
  v_room_name text;
  v_appliance_names text;
  v_title text;
  v_msg text;

  -- Schedule away variable
  v_schedule record;
  v_has_switchable_appliances boolean;
begin
  -- Resolve household ID
  if p_household_id is not null then
    v_household_id := p_household_id;
  else
    v_household_id := (select private.current_household_id());
  end if;

  if v_household_id is null then
    return 0;
  end if;

  -- Check if household has any switchable (non-always_on) appliances
  select exists (
    select 1
    from public.appliances a
    join public.appliance_types at on a.type = at.id
    where a.household_id = v_household_id
      and at.always_on = false
  ) into v_has_switchable_appliances;

  -- If household has no switchable appliances at all, skip generating reminders
  if not v_has_switchable_appliances then
    return 0;
  end if;

  -- =========================================================================
  -- (1) PRE-SLEEP LIGHTS & APPLIANCES REMINDER
  -- =========================================================================
  -- Find sleep block
  select db.*, r.name as room_title
  into v_sleep_block
  from public.day_blocks db
  left join public.rooms r on db.room_id = r.id
  where db.household_id = v_household_id
    and db.type = 'sleep'
  order by db.start_time asc
  limit 1;

  -- Find evening or late-night block right before sleep
  select db.*, r.name as room_title
  into v_evening_block
  from public.day_blocks db
  left join public.rooms r on db.room_id = r.id
  where db.household_id = v_household_id
    and db.type in ('evening', 'other', 'meal', 'work')
  order by db.start_time desc
  limit 1;

  if v_evening_block.id is not null then
    -- Find active non-always_on appliances in evening block
    select string_agg(distinct at.name, ', ' order by at.name)
    into v_appliance_names
    from public.appliances a
    join public.appliance_types at on a.type = at.id
    where a.household_id = v_household_id
      and at.always_on = false
      and (
        a.room_id = v_evening_block.room_id
        or (
          v_evening_block.appliances_on is not null
          and v_evening_block.appliances_on ? a.id::text
        )
      );

    if v_appliance_names is not null and v_appliance_names <> '' then
      v_room_name := coalesce(v_evening_block.room_title, 'Living Room');
      v_title := 'Bedtime Reminder: Switch Off Lights & Appliances';
      v_msg := 'Bedtime Reminder: Don''t forget to switch off your ' || v_room_name || ' ' || v_appliance_names || ' before sleeping.';

      if not exists (
        select 1
        from public.notifications n
        where n.household_id = v_household_id
          and n.title = v_title
          and n.created_at::date = v_today
      ) then
        insert into public.notifications (
          household_id,
          type,
          title,
          message,
          is_read,
          linked_path,
          created_at,
          updated_at
        ) values (
          v_household_id,
          'routine_reminder',
          v_title,
          v_msg,
          false,
          '/(tabs)/simulator',
          now(),
          now()
        );
        v_inserted_count := v_inserted_count + 1;
      end if;
    end if;
  end if;

  -- =========================================================================
  -- (2) ROUTINE TRANSITION: AC & ACTIVE APPLIANCES REMINDER
  -- =========================================================================
  for v_block in
    select db.*, r.name as room_title
    from public.day_blocks db
    left join public.rooms r on db.room_id = r.id
    where db.household_id = v_household_id
      and db.type not in ('sleep', 'away')
    order by db.start_time asc
  loop
    -- Look for the subsequent block
    select db_next.*, r_next.name as next_room_title
    into v_next_block
    from public.day_blocks db_next
    left join public.rooms r_next on db_next.room_id = r_next.id
    where db_next.household_id = v_household_id
      and db_next.start_time >= v_block.end_time
      and db_next.id <> v_block.id
    order by db_next.start_time asc
    limit 1;

    -- Collect non-always_on appliances that should be turned off
    select string_agg(distinct at.name, ' and ' order by at.name)
    into v_appliance_names
    from public.appliances a
    join public.appliance_types at on a.type = at.id
    where a.household_id = v_household_id
      and at.always_on = false
      and (
        a.room_id = v_block.room_id
        or (
          v_block.appliances_on is not null
          and v_block.appliances_on ? a.id::text
        )
      );

    if v_appliance_names is not null and v_appliance_names <> '' then
      v_room_name := coalesce(v_block.room_title, 'Room');
      v_title := 'Next Routine: Turn Off Appliances in ' || v_room_name;

      if v_next_block.id is not null then
        v_msg := 'Heading to your next routine (' || v_next_block.title || ')? Remember to turn off the ' || v_appliance_names || ' in ' || v_room_name || '.';
      else
        v_msg := 'Wrapping up ' || v_block.title || '? Remember to turn off the ' || v_appliance_names || ' in ' || v_room_name || '.';
      end if;

      if not exists (
        select 1
        from public.notifications n
        where n.household_id = v_household_id
          and n.title = v_title
          and n.created_at::date = v_today
      ) then
        insert into public.notifications (
          household_id,
          type,
          title,
          message,
          is_read,
          linked_path,
          created_at,
          updated_at
        ) values (
          v_household_id,
          'appliance_reminder',
          v_title,
          v_msg,
          false,
          '/(tabs)/simulator',
          now(),
          now()
        );
        v_inserted_count := v_inserted_count + 1;
      end if;
    end if;
  end loop;

  -- =========================================================================
  -- (3) PRE-AWAY WINDOW: ALL APPLIANCES CHECK
  -- =========================================================================
  for v_schedule in
    select *
    from public.schedules
    where household_id = v_household_id
    order by start_time asc
    limit 1
  loop
    v_title := 'Leaving Home: Appliance Checklist';
    v_msg := 'Leaving home for the day (' || substring(v_schedule.start_time::text from 1 for 5) || ' - ' || substring(v_schedule.end_time::text from 1 for 5) || ')? Switch off all active Air Conditioners, Lights, and Water Heaters.';

    if not exists (
      select 1
      from public.notifications n
      where n.household_id = v_household_id
        and n.title = v_title
        and n.created_at::date = v_today
    ) then
      insert into public.notifications (
        household_id,
        type,
        title,
        message,
        is_read,
        linked_path,
        created_at,
        updated_at
      ) values (
        v_household_id,
        'routine_reminder',
        v_title,
        v_msg,
        false,
        '/(tabs)/simulator',
        now(),
        now()
      );
      v_inserted_count := v_inserted_count + 1;
    end if;
  end loop;

  return v_inserted_count;
end;
$$;

revoke all on function public.sync_routine_appliance_notifications(uuid) from public, anon;
grant execute on function public.sync_routine_appliance_notifications(uuid) to authenticated, service_role;

-- 3. Automated trigger helper
create or replace function public.trigger_sync_routine_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.sync_routine_appliance_notifications(new.household_id);
  return new;
end;
$$;

-- 4. Triggers on day_blocks and schedules
drop trigger if exists trg_sync_routine_notifications_on_blocks on public.day_blocks;
create trigger trg_sync_routine_notifications_on_blocks
  after insert or update on public.day_blocks
  for each row execute function public.trigger_sync_routine_notifications();

drop trigger if exists trg_sync_routine_notifications_on_schedules on public.schedules;
create trigger trg_sync_routine_notifications_on_schedules
  after insert or update on public.schedules
  for each row execute function public.trigger_sync_routine_notifications();
