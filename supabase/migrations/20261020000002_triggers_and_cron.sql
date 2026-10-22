-- Migration: 20261020000002_triggers_and_cron.sql
-- Simeplify / EcoTwin Supabase Backend Stage 4
-- 1. Database Triggers (Leak/Major Alert to Notification)
-- 2. pg_cron Monthly Jobs (Voting Resolution & Energy Points/Bill Check in Malaysia Time)

begin;

-- ============================================================================
-- 1. ALERT-TO-NOTIFICATION TRIGGER
-- Environment_Setup.md §6 Rule 4 & SCN-02 / NOT-01:
-- Automatically insert a row into public.notifications when an alert with
-- level 'leak_detected' or 'major_pipe_burst' is created.
-- ============================================================================

create or replace function public.handle_alert_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  -- Only trigger for severe leak anomalies ('leak_detected' or 'major_pipe_burst')
  -- Normal and minor_drip do not generate notifications per SCN-02 requirement.
  if new.level in ('leak_detected', 'major_pipe_burst') then
    if new.level = 'major_pipe_burst' then
      v_title := 'Major Pipe Burst Detected';
    else
      v_title := 'Water Leak Detected';
    end if;

    insert into public.notifications (
      household_id,
      type,
      title,
      message,
      is_read,
      linked_path
    ) values (
      new.household_id,
      'bill_alert',
      v_title,
      new.message,
      false,
      '/(tabs)/scanner'
    );
  end if;

  return new;
end;
$$;

revoke all on function public.handle_alert_notification() from public;

drop trigger if exists on_alert_created on public.alerts;
create trigger on_alert_created
  after insert on public.alerts
  for each row execute function public.handle_alert_notification();

-- ============================================================================
-- 2. PG_CRON EXTENSION & MONTHLY SCHEDULED JOBS
-- Timezone: Malaysia Time (Asia/Kuala_Lumpur, UTC+8)
-- 00:00 MYT on the 1st of every month = 16:00 UTC on the last day of the month.
-- ============================================================================

-- Enable pg_cron safely
create extension if not exists pg_cron with schema pg_catalog;

-- ----------------------------------------------------------------------------
-- 2a. HELPER FUNCTION: Monthly Community Voting / Reward Resolution (COM-01, COM-02)
-- Closes previous month voting cycle, determines winning reward, checks target,
-- and issues 'month_result' and 'voting_open' notifications to households.
-- ----------------------------------------------------------------------------

create or replace function public.resolve_monthly_community_voting(p_as_of_date date default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now_myt timestamptz;
  v_settlement_month date;
  v_new_month date;
  v_winning_reward_id uuid;
  v_winning_title text;
  v_winning_target_points int;
  v_top_votes bigint := 0;
  v_total_points bigint := 0;
  v_is_unlocked boolean := false;
  v_notified_result_count int := 0;
  v_notified_voting_count int := 0;
begin
  -- Resolve execution time in Malaysia Time (Asia/Kuala_Lumpur)
  if p_as_of_date is not null then
    v_now_myt := p_as_of_date::timestamptz;
  else
    v_now_myt := now() at time zone 'Asia/Kuala_Lumpur';
    -- Guard for cron execution: only execute on day 1 of the month in MYT
    if extract(day from v_now_myt) <> 1 then
      return jsonb_build_object('status', 'skipped_not_first_day_of_month');
    end if;
  end if;

  v_settlement_month := (date_trunc('month', v_now_myt) - interval '1 month')::date;
  v_new_month := date_trunc('month', v_now_myt)::date;

  -- 1. Identify winning reward for settlement month from public.votes
  select
    r.id,
    r.title,
    r.target_points,
    count(v.id) as vote_count
  into
    v_winning_reward_id,
    v_winning_title,
    v_winning_target_points,
    v_top_votes
  from public.rewards r
  left join public.votes v
    on v.reward_id = r.id
   and v.voting_month = v_settlement_month
  where r.voting_month = v_settlement_month
  group by r.id, r.title, r.target_points, r.created_at
  order by count(v.id) desc, r.created_at asc
  limit 1;

  -- 2. Calculate community points total earned in settlement month
  -- TODO(open-item 1): Monthly points target number and household milestones are not decided yet.
  -- TODO(open-item 3, 5): Unlock state is global for now and will move to a per-community result table when community rule is decided.
  select coalesce(sum(p.amount), 0)
  into v_total_points
  from public.points p
  where (p.billing_month = v_settlement_month)
     or (p.billing_month is null
         and (p.created_at at time zone 'Asia/Kuala_Lumpur')::date >= v_settlement_month
         and (p.created_at at time zone 'Asia/Kuala_Lumpur')::date < v_new_month);

  -- 3. Determine if winning reward is unlocked
  if v_winning_reward_id is not null then
    if v_winning_target_points is not null and v_winning_target_points > 0 then
      v_is_unlocked := (v_total_points >= v_winning_target_points);
    else
      -- If target points is not set, unlocked if votes were cast
      v_is_unlocked := (v_top_votes > 0);
    end if;

    -- Update rewards unlock state
    update public.rewards
    set is_unlocked = v_is_unlocked
    where id = v_winning_reward_id;

    update public.rewards
    set is_unlocked = false
    where voting_month = v_settlement_month
      and id <> v_winning_reward_id;
  end if;

  -- 4. Send 'month_result' notification to all households (idempotent for settlement month)
  with inserted_results as (
    insert into public.notifications (
      household_id,
      type,
      title,
      message,
      is_read,
      linked_path
    )
    select
      h.id,
      'month_result',
      'Monthly Community Reward Result',
      case
        when v_winning_reward_id is not null then
          'Votes are in for ' || to_char(v_settlement_month, 'FMMonth YYYY') ||
          '! Winning reward: "' || v_winning_title || '" with ' || v_top_votes || ' votes' ||
          case
            when v_is_unlocked then ' (Unlocked with ' || v_total_points || ' community points!)'
            else ' (Locked - community reached ' || v_total_points || ' of ' || coalesce(v_winning_target_points::text, '0') || ' target points)'
          end
        else
          'The voting cycle for ' || to_char(v_settlement_month, 'FMMonth YYYY') || ' has concluded.'
      end,
      false,
      '/(tabs)/community'
    from public.households h
    where not exists (
      select 1 from public.notifications n
      where n.household_id = h.id
        and n.type = 'month_result'
        and (n.created_at at time zone 'Asia/Kuala_Lumpur')::date >= v_new_month
        and (n.created_at at time zone 'Asia/Kuala_Lumpur')::date < (v_new_month + interval '1 month')::date
    )
    returning id
  )
  select count(*) into v_notified_result_count from inserted_results;

  -- 5. Seed default community rewards for new month if none exist
  -- TODO(open-item 1, 3): Template options used until admin reward management is built.
  if not exists (select 1 from public.rewards where voting_month = v_new_month) then
    insert into public.rewards (voting_month, title, description, target_points, is_unlocked)
    values
      (v_new_month, 'Community Solar Canopy', '50% clean energy for local central park and walking trails', 1000, false),
      (v_new_month, 'Urban Tree Planting Drive', 'Plant 100 native shade trees across neighbourhood sectors', 800, false),
      (v_new_month, 'Compost Tumbler Station', 'Shared community organic composting stations for residential waste', 600, false);
  end if;

  -- 6. Send 'voting_open' notification for new month to all households (idempotent)
  with inserted_voting as (
    insert into public.notifications (
      household_id,
      type,
      title,
      message,
      is_read,
      linked_path
    )
    select
      h.id,
      'voting_open',
      'Monthly Reward Voting Open',
      'Voting for ' || to_char(v_new_month, 'FMMonth YYYY') || ' community rewards is now open! Cast your vote in the Community tab.',
      false,
      '/(tabs)/community'
    from public.households h
    where not exists (
      select 1 from public.notifications n
      where n.household_id = h.id
        and n.type = 'voting_open'
        and (n.created_at at time zone 'Asia/Kuala_Lumpur')::date >= v_new_month
        and (n.created_at at time zone 'Asia/Kuala_Lumpur')::date < (v_new_month + interval '1 month')::date
    )
    returning id
  )
  select count(*) into v_notified_voting_count from inserted_voting;

  return jsonb_build_object(
    'settlement_month', v_settlement_month,
    'new_month', v_new_month,
    'winning_reward_id', v_winning_reward_id,
    'winning_title', v_winning_title,
    'top_votes', v_top_votes,
    'total_points', v_total_points,
    'is_unlocked', v_is_unlocked,
    'month_result_notifications_sent', v_notified_result_count,
    'voting_open_notifications_sent', v_notified_voting_count,
    'status', 'completed'
  );
end;
$$;

revoke all on function public.resolve_monthly_community_voting(date) from public, anon, authenticated;
grant execute on function public.resolve_monthly_community_voting(date) to service_role;

-- ----------------------------------------------------------------------------
-- 2b. HELPER FUNCTION: Monthly Energy Points / Bill Check Job (COM-02, SCN-01)
-- Evaluates electricity bills for the concluded month, reconciles energy points
-- (+50 points per billing month when bill is lower than estimate), and records deeds.
-- ----------------------------------------------------------------------------

create or replace function public.check_monthly_energy_bills(p_as_of_date date default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now_myt timestamptz;
  v_settlement_month date;
  v_evaluated_bills int := 0;
  v_awarded_points_count int := 0;
  v_rec record;
  v_deed_id uuid;
begin
  if p_as_of_date is not null then
    v_now_myt := p_as_of_date::timestamptz;
  else
    v_now_myt := now() at time zone 'Asia/Kuala_Lumpur';
    -- Guard for cron execution: only execute on day 1 of the month in MYT
    if extract(day from v_now_myt) <> 1 then
      return jsonb_build_object('status', 'skipped_not_first_day_of_month');
    end if;
  end if;

  v_settlement_month := (date_trunc('month', v_now_myt) - interval '1 month')::date;

  -- TODO(open-item 2): Simulator action points value and qualification rule are not decided yet.
  -- TODO(open-item 1): Monthly points target number and household milestones are not decided yet.
  -- Reconcile bills where lower_than_estimate was flagged during upload analysis
  -- but energy points were not yet awarded.
  for v_rec in
    select b.id as bill_id, b.household_id, b.billing_month, b.usage, b.amount, b.analysis
    from public.bills b
    where b.type = 'electricity'
      and b.billing_month = v_settlement_month
      and not exists (
        select 1 from public.points p
        where p.household_id = b.household_id
          and p.source = 'energy'
          and p.billing_month = b.billing_month
      )
  loop
    v_evaluated_bills := v_evaluated_bills + 1;

    -- Award +50 energy points if the bill analysis marked it lower than estimate
    if (v_rec.analysis->>'lower_than_estimate')::boolean = true
       or (v_rec.analysis->>'awarded_energy_points')::boolean = true then

      -- Insert deed record for the energy saving action
      insert into public.deeds (household_id, task_type, deed_date)
      values (v_rec.household_id, 'upload_lower_bill', (v_now_myt)::date)
      returning id into v_deed_id;

      -- Insert 50 energy points for this billing month
      insert into public.points (household_id, source, amount, deed_id, billing_month)
      values (v_rec.household_id, 'energy', 50, v_deed_id, v_rec.billing_month)
      on conflict do nothing;

      v_awarded_points_count := v_awarded_points_count + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'settlement_month', v_settlement_month,
    'evaluated_bills_count', v_evaluated_bills,
    'awarded_points_count', v_awarded_points_count,
    'status', 'completed'
  );
end;
$$;

revoke all on function public.check_monthly_energy_bills(date) from public, anon, authenticated;
grant execute on function public.check_monthly_energy_bills(date) to service_role;

-- ----------------------------------------------------------------------------
-- 2c. SCHEDULE PG_CRON MONTHLY JOBS
-- Idempotent registration using cron.schedule (updates if job name already exists).
-- Schedule: 16:00 UTC on days 28-31 of every month = 00:00 MYT on 1st of month.
-- ----------------------------------------------------------------------------

-- Job 1: Monthly Community Voting / Reward Resolution
select cron.schedule(
  'monthly_community_voting_resolution',
  '0 16 28-31 * *',
  'select public.resolve_monthly_community_voting();'
);

-- Job 2: Monthly Energy Points / Bill Check Job (runs 5 mins after midnight MYT)
select cron.schedule(
  'monthly_energy_points_bill_check',
  '5 16 28-31 * *',
  'select public.check_monthly_energy_bills();'
);

commit;
