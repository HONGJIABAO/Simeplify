-- Migration: 20261023000002_monthly_wrapup.sql
-- Monthly wrap-up server-side aggregation function for community screen (COM-Wrapup)
-- Security: SECURITY DEFINER with empty search_path, aggregate data only, no PII returned.

begin;

create or replace function public.get_monthly_wrapup(
  p_month date,
  p_min_deeds int default 30,
  p_threshold_pct int default 60
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_user_household_id uuid;
  v_month_start date;
  v_next_month_start date;
  v_month_start_tz timestamptz;
  v_month_end_tz timestamptz;
  v_current_month_start date;
  v_is_current_month boolean;
  
  v_eligible_users int := 0;
  v_qualified_users int := 0;
  v_percentage int := 0;
  v_needed_users int := 0;
  v_is_hit boolean := false;
  v_reward_status text := 'In progress';
  
  v_reward_id uuid;
  v_reward_title text := 'Community Reward';
  v_reward_desc text := '';
  v_reward_unlocked boolean := false;
  
  v_hh_points_month int := 0;
  v_hh_points_recycling int := 0;
  v_hh_points_energy int := 0;
  v_hh_points_all_time int := 0;
  v_hh_deeds_month int := 0;
  
  v_comm_total_points int := 0;
  v_comm_total_deeds int := 0;
begin
  -- 1. Identify current authenticated user and household
  v_user_id := (select auth.uid());
  if v_user_id is not null then
    select p.household_id into v_user_household_id
    from public.profiles p
    where p.id = v_user_id;
  end if;

  -- 2. Timezone & date boundaries (Asia/Kuala_Lumpur)
  v_month_start := date_trunc('month', p_month)::date;
  v_next_month_start := (v_month_start + interval '1 month')::date;
  v_month_start_tz := (v_month_start::text || ' 00:00:00+08')::timestamptz;
  v_month_end_tz := (v_next_month_start::text || ' 00:00:00+08')::timestamptz;
  
  v_current_month_start := date_trunc('month', (now() at time zone 'Asia/Kuala_Lumpur'))::date;
  v_is_current_month := (v_month_start = v_current_month_start);

  -- 3. Denominator: eligible members
  -- All profiles with onboarding_done = true who joined on or before the end of the month
  select count(*)
  into v_eligible_users
  from public.profiles p
  where p.onboarding_done = true
    and p.created_at < v_month_end_tz;

  -- 4. Numerator: qualified members (members with >= p_min_deeds deeds in the month)
  -- For each eligible profile, count deeds associated with their household in this month
  with eligible_profiles as (
    select p.id as profile_id, p.household_id
    from public.profiles p
    where p.onboarding_done = true
      and p.created_at < v_month_end_tz
  ),
  household_deeds_count as (
    select
      d.household_id,
      count(*) as deeds_count
    from public.deeds d
    where d.deed_date >= v_month_start
      and d.deed_date < v_next_month_start
    group by d.household_id
  )
  select count(*)
  into v_qualified_users
  from eligible_profiles ep
  join household_deeds_count hdc on ep.household_id = hdc.household_id
  where hdc.deeds_count >= p_min_deeds;

  -- 5. Percentage and target calculations using integer math
  if v_eligible_users > 0 then
    v_percentage := (v_qualified_users * 100) / v_eligible_users;
    v_is_hit := (v_qualified_users * 100 >= v_eligible_users * p_threshold_pct);
    -- Needed users calculation: smallest additional qualified users needed
    if v_is_hit then
      v_needed_users := 0;
    else
      v_needed_users := greatest(0, ceil((v_eligible_users * p_threshold_pct)::numeric / 100.0)::int - v_qualified_users);
    end if;
  else
    v_percentage := 0;
    v_is_hit := false;
    v_needed_users := 0;
  end if;

  -- 6. Status determination
  if v_month_start > v_current_month_start then
    v_reward_status := 'In progress';
  elsif v_is_current_month then
    v_reward_status := 'In progress';
  else
    if v_is_hit then
      v_reward_status := 'Hit';
    else
      v_reward_status := 'Missed';
    end if;
  end if;

  -- 7. Community voted reward for this month
  -- Pick the reward with the most votes in public.votes for this voting_month,
  -- or the first reward seeded for this month
  select r.id, r.title, r.description, r.is_unlocked
  into v_reward_id, v_reward_title, v_reward_desc, v_reward_unlocked
  from public.rewards r
  left join (
    select reward_id, count(*) as vote_count
    from public.votes
    where voting_month = v_month_start
    group by reward_id
  ) v on v.reward_id = r.id
  where r.voting_month = v_month_start
  order by coalesce(v.vote_count, 0) desc, r.created_at asc
  limit 1;

  -- If status is 'Hit' and not yet marked unlocked, update it in public.rewards
  if v_reward_status = 'Hit' and v_reward_id is not null and not v_reward_unlocked then
    update public.rewards
    set is_unlocked = true
    where id = v_reward_id;
    v_reward_unlocked := true;
  end if;

  -- 8. Authenticated user's household points & deeds this month
  if v_user_household_id is not null then
    -- Current month points breakdown
    select
      coalesce(sum(amount), 0),
      coalesce(sum(case when source = 'recycling' then amount else 0 end), 0),
      coalesce(sum(case when source = 'energy' then amount else 0 end), 0)
    into v_hh_points_month, v_hh_points_recycling, v_hh_points_energy
    from public.points
    where household_id = v_user_household_id
      and created_at >= v_month_start_tz
      and created_at < v_month_end_tz;

    -- All-time points
    select coalesce(sum(amount), 0)
    into v_hh_points_all_time
    from public.points
    where household_id = v_user_household_id;

    -- Household deeds this month
    select count(*)
    into v_hh_deeds_month
    from public.deeds
    where household_id = v_user_household_id
      and deed_date >= v_month_start
      and deed_date < v_next_month_start;
  end if;

  -- 9. Community total points and deeds this month
  select coalesce(sum(amount), 0)
  into v_comm_total_points
  from public.points
  where created_at >= v_month_start_tz
    and created_at < v_month_end_tz;

  select count(*)
  into v_comm_total_deeds
  from public.deeds
  where deed_date >= v_month_start
    and deed_date < v_next_month_start;

  -- 10. Return only aggregate data & own household stats as JSON
  return jsonb_build_object(
    'month', v_month_start,
    'is_current_month', v_is_current_month,
    'eligible_users', v_eligible_users,
    'qualified_users', v_qualified_users,
    'percentage', v_percentage,
    'threshold_pct', p_threshold_pct,
    'min_deeds_per_user', p_min_deeds,
    'needed_users', v_needed_users,
    'is_hit', v_is_hit,
    'status', v_reward_status,
    'reward', jsonb_build_object(
      'id', v_reward_id,
      'title', coalesce(v_reward_title, 'Community Goal'),
      'description', coalesce(v_reward_desc, ''),
      'is_unlocked', coalesce(v_reward_unlocked, false)
    ),
    'community_points', v_comm_total_points,
    'community_deeds', v_comm_total_deeds,
    'household', jsonb_build_object(
      'points_month', v_hh_points_month,
      'points_recycling', v_hh_points_recycling,
      'points_energy', v_hh_points_energy,
      'points_all_time', v_hh_points_all_time,
      'deeds_month', v_hh_deeds_month,
      'has_leaf', (v_hh_deeds_month >= p_min_deeds)
    ),
    'energy_saved', jsonb_build_object(
      'kwh', null,
      'rm', null,
      'status', 'no_baseline',
      'label', 'Estimated',
      'note', 'No community baseline data available yet'
    )
  );
end;
$$;

revoke all on function public.get_monthly_wrapup(date, int, int) from public, anon;
grant execute on function public.get_monthly_wrapup(date, int, int) to authenticated;

commit;
