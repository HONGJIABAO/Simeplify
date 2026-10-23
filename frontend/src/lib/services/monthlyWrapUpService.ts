import { supabase } from '../supabase';
import { COMMUNITY_WRAPUP_CONFIG } from '@/features/community/config';
import { MALAYSIA_TIME_ZONE } from './communityCore';

export interface MonthlyWrapUpReward {
  id: string | null;
  title: string;
  description: string;
  is_unlocked: boolean;
}

export interface MonthlyWrapUpHousehold {
  points_month: number;
  points_recycling: number;
  points_energy: number;
  points_all_time: number;
  deeds_month: number;
  has_leaf: boolean;
}

export interface MonthlyWrapUpEnergySaved {
  kwh: number | null;
  rm: number | null;
  status: 'no_baseline' | 'available';
  label: string;
  note: string;
}

export interface MonthlyWrapUpData {
  month: string;
  is_current_month: boolean;
  eligible_users: number;
  qualified_users: number;
  percentage: number;
  threshold_pct: number;
  min_deeds_per_user: number;
  needed_users: number;
  is_hit: boolean;
  status: 'In progress' | 'Hit' | 'Missed';
  reward: MonthlyWrapUpReward;
  community_points: number;
  community_deeds: number;
  household: MonthlyWrapUpHousehold;
  energy_saved: MonthlyWrapUpEnergySaved;
}

/**
 * Returns current month ISO date anchor (e.g. '2026-10-01') in Asia/Kuala_Lumpur
 */
export function getCurrentMonthMyt(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MALAYSIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '10';
  return `${year}-${month}-01`;
}

/**
 * Shifts an ISO month date by delta months (e.g. -1 for previous month)
 */
export function shiftMonth(isoMonth: string, delta: number): string {
  const [yearStr, monthStr] = isoMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + delta;

  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }

  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * Formats a month string (e.g. '2026-10-01') into "October 2026"
 */
export function formatMonthLabel(isoMonth: string): string {
  const [year, month] = isoMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat('en-MY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Fallback mock data generator for demo/offline preview or prior to DB migration execution
 */
export function getMockMonthlyWrapUp(
  isoMonth: string,
  currentMonth: string
): MonthlyWrapUpData {
  const isCurrent = isoMonth === currentMonth;
  const isPast = isoMonth < currentMonth;

  // Realistic mock data reflecting Oakridge Commons neighborhood
  const eligible = 25;
  // If past month, simulate Hit (e.g. 16/25 = 64%) or Missed; if current, simulate in progress (e.g. 11/25 = 44%)
  const qualified = isPast ? 16 : 11;
  const percentage = Math.floor((qualified * 100) / eligible);
  const isHit = qualified * 100 >= eligible * COMMUNITY_WRAPUP_CONFIG.REWARD_THRESHOLD_PCT;
  const needed = isHit
    ? 0
    : Math.max(
        0,
        Math.ceil((eligible * COMMUNITY_WRAPUP_CONFIG.REWARD_THRESHOLD_PCT) / 100) - qualified
      );

  const status: MonthlyWrapUpData['status'] = isCurrent
    ? 'In progress'
    : isHit
    ? 'Hit'
    : 'Missed';

  return {
    month: isoMonth,
    is_current_month: isCurrent,
    eligible_users: eligible,
    qualified_users: qualified,
    percentage,
    threshold_pct: COMMUNITY_WRAPUP_CONFIG.REWARD_THRESHOLD_PCT,
    min_deeds_per_user: COMMUNITY_WRAPUP_CONFIG.MIN_DEEDS_PER_USER,
    needed_users: needed,
    is_hit: isHit,
    status,
    reward: {
      id: 'demo-reward-1',
      title: 'Community Composting Facility & Herb Garden',
      description: 'Unlock neighborhood-wide composting kits and a shared raised herb garden for Sector 4B.',
      is_unlocked: status === 'Hit',
    },
    community_points: isPast ? 8420 : 5360,
    community_deeds: isPast ? 784 : 492,
    household: {
      points_month: isPast ? 340 : 210,
      points_recycling: isPast ? 140 : 90,
      points_energy: isPast ? 200 : 120,
      points_all_time: 1480,
      deeds_month: isPast ? 32 : 19,
      has_leaf: isPast ? true : false,
    },
    energy_saved: {
      kwh: null,
      rm: null,
      status: 'no_baseline',
      label: 'Estimated',
      note: 'No community baseline data available yet',
    },
  };
}

/**
 * Fetch monthly wrap-up data via the get_monthly_wrapup Postgres function
 */
export async function fetchMonthlyWrapUp(
  isoMonth: string
): Promise<MonthlyWrapUpData> {
  const currentMonth = getCurrentMonthMyt();

  try {
    const { data, error } = await supabase.rpc('get_monthly_wrapup' as any, {
      p_month: isoMonth,
      p_min_deeds: COMMUNITY_WRAPUP_CONFIG.MIN_DEEDS_PER_USER,
      p_threshold_pct: COMMUNITY_WRAPUP_CONFIG.REWARD_THRESHOLD_PCT,
    });

    if (error) {
      // If the function has not been applied yet or user is offline, fall back to mock data
      console.warn('get_monthly_wrapup RPC error, falling back to mock wrap-up:', error.message);
      return getMockMonthlyWrapUp(isoMonth, currentMonth);
    }

    if (!data) {
      return getMockMonthlyWrapUp(isoMonth, currentMonth);
    }

    return data as MonthlyWrapUpData;
  } catch (err) {
    console.warn('Network or RPC error fetching monthly wrap-up:', err);
    return getMockMonthlyWrapUp(isoMonth, currentMonth);
  }
}
