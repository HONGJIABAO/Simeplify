import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/database';

export const MALAYSIA_TIME_ZONE = 'Asia/Kuala_Lumpur';
export const DAILY_DEED_CAP = 3;

export type CommunityReward = Database['public']['Tables']['rewards']['Row'];
export type CommunityVote = Database['public']['Tables']['votes']['Row'];
export type CommunityPoint = Database['public']['Tables']['points']['Row'];
export type CommunityDeed = Database['public']['Tables']['deeds']['Row'];

export interface CommunityPointsSummary {
  currentMonth: number;
  recycling: number;
  energy: number;
  allTime: number;
}

export interface CommunityDeedsSummary {
  completedToday: number;
  rawTodayCount: number;
  today: CommunityDeed[];
  currentMonth: CommunityDeed[];
  recent: CommunityDeed[];
  recycledToday: boolean;
  uploadedLowerBillThisMonth: boolean;
  simulatorActionToday: boolean;
}

export interface CommunityState {
  currentVotingMonth: string;
  previousVotingMonth: string;
  todayMyt: string;
  rewards: CommunityReward[];
  vote: CommunityVote | null;
  selectedReward: CommunityReward | null;
  visibleVoteCounts: Record<string, number>;
  lastMonthUnlockedReward: CommunityReward | null;
  points: CommunityPointsSummary;
  deeds: CommunityDeedsSummary;
}

export class CommunityServiceError extends Error {
  readonly kind: 'already-voted' | 'offline' | 'query';
  readonly code?: string;

  constructor(
    message: string,
    kind: 'already-voted' | 'offline' | 'query' = 'query',
    code?: string
  ) {
    super(message);
    this.name = 'CommunityServiceError';
    this.kind = kind;
    this.code = code;
  }
}

function mytDateParts(value: Date | string): { year: number; month: number; day: number } {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MALAYSIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: read('year'), month: read('month'), day: read('day') };
}

function isoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getCommunityDateAnchors(now = new Date()): {
  currentVotingMonth: string;
  previousVotingMonth: string;
  todayMyt: string;
} {
  const { year, month, day } = mytDateParts(now);
  const previous = new Date(Date.UTC(year, month - 2, 1));
  return {
    currentVotingMonth: isoDate(year, month, 1),
    previousVotingMonth: isoDate(previous.getUTCFullYear(), previous.getUTCMonth() + 1, 1),
    todayMyt: isoDate(year, month, day),
  };
}

export function formatMytDate(value: Date | string): string {
  const { year, month, day } = mytDateParts(value);
  return isoDate(year, month, day);
}

export function aggregateCommunityRows(
  points: CommunityPoint[],
  todayDeeds: CommunityDeed[],
  monthDeeds: CommunityDeed[],
  recentDeeds: CommunityDeed[],
  currentVotingMonth: string
): Pick<CommunityState, 'points' | 'deeds'> {
  const monthlyPoints = points.filter(
    (point) => formatMytDate(point.created_at).slice(0, 7) === currentVotingMonth.slice(0, 7)
  );
  const sum = (rows: CommunityPoint[]) => rows.reduce((total, row) => total + row.amount, 0);

  return {
    points: {
      currentMonth: sum(monthlyPoints),
      recycling: sum(monthlyPoints.filter((point) => point.source === 'recycling')),
      energy: sum(monthlyPoints.filter((point) => point.source === 'energy')),
      allTime: sum(points),
    },
    deeds: {
      completedToday: Math.min(DAILY_DEED_CAP, todayDeeds.length),
      rawTodayCount: todayDeeds.length,
      today: todayDeeds,
      currentMonth: monthDeeds,
      recent: recentDeeds,
      recycledToday: todayDeeds.some((deed) => deed.task_type === 'recycle'),
      uploadedLowerBillThisMonth: monthDeeds.some(
        (deed) => deed.task_type === 'upload_lower_bill'
      ),
      simulatorActionToday: todayDeeds.some(
        (deed) => deed.task_type === 'simulator_action'
      ),
    },
  };
}

function queryFailure(message: string, error: { message?: string; code?: string } | null) {
  const detail = error?.message ? ` ${error.message}` : '';
  return new CommunityServiceError(`${message}${detail}`, 'query', error?.code);
}

export async function fetchCommunityStateWithClient(
  client: SupabaseClient<Database>,
  householdId: string,
  now = new Date()
): Promise<CommunityState> {
  const anchors = getCommunityDateAnchors(now);
  const [
    rewardsResult,
    voteResult,
    visibleVotesResult,
    previousRewardsResult,
    pointsResult,
    todayDeedsResult,
    monthDeedsResult,
    recentDeedsResult,
  ] = await Promise.all([
    client
      .from('rewards')
      .select('*')
      .eq('voting_month', anchors.currentVotingMonth)
      .order('created_at', { ascending: true }),
    client
      .from('votes')
      .select('*')
      .eq('household_id', householdId)
      .eq('voting_month', anchors.currentVotingMonth)
      .maybeSingle(),
    client.from('votes').select('reward_id').eq('voting_month', anchors.currentVotingMonth),
    client
      .from('rewards')
      .select('*')
      .eq('voting_month', anchors.previousVotingMonth)
      .eq('is_unlocked', true)
      .order('created_at', { ascending: true }),
    client
      .from('points')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false }),
    client
      .from('deeds')
      .select('*')
      .eq('household_id', householdId)
      .eq('deed_date', anchors.todayMyt)
      .order('created_at', { ascending: false }),
    client
      .from('deeds')
      .select('*')
      .eq('household_id', householdId)
      .gte('deed_date', anchors.currentVotingMonth)
      .lte('deed_date', anchors.todayMyt)
      .order('created_at', { ascending: false }),
    client
      .from('deeds')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  const failures: Array<[string, { message?: string; code?: string } | null]> = [
    ['Could not load this month’s rewards.', rewardsResult.error],
    ['Could not load your household vote.', voteResult.error],
    ['Could not load visible vote counts.', visibleVotesResult.error],
    ['Could not load last month’s reward.', previousRewardsResult.error],
    ['Could not load household points.', pointsResult.error],
    ['Could not load today’s deeds.', todayDeedsResult.error],
    ['Could not load this month’s deeds.', monthDeedsResult.error],
    ['Could not load recent activity.', recentDeedsResult.error],
  ];
  const failed = failures.find(([, error]) => error);
  if (failed) throw queryFailure(failed[0], failed[1]);

  const rewards = rewardsResult.data ?? [];
  const vote = voteResult.data ?? null;
  const visibleVoteCounts = (visibleVotesResult.data ?? []).reduce<Record<string, number>>(
    (counts, row) => {
      counts[row.reward_id] = (counts[row.reward_id] ?? 0) + 1;
      return counts;
    },
    {}
  );
  const aggregates = aggregateCommunityRows(
    pointsResult.data ?? [],
    todayDeedsResult.data ?? [],
    monthDeedsResult.data ?? [],
    recentDeedsResult.data ?? [],
    anchors.currentVotingMonth
  );

  return {
    ...anchors,
    rewards,
    vote,
    selectedReward: vote
      ? rewards.find((reward) => reward.id === vote.reward_id) ?? null
      : null,
    visibleVoteCounts,
    lastMonthUnlockedReward: previousRewardsResult.data?.[0] ?? null,
    ...aggregates,
  };
}

export async function castHouseholdVoteWithClient(
  client: SupabaseClient<Database>,
  householdId: string,
  rewardId: string,
  votingMonth: string
): Promise<CommunityVote> {
  const { data, error } = await client
    .from('votes')
    .insert({ household_id: householdId, reward_id: rewardId, voting_month: votingMonth })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505' || error.message.includes('uq_votes_household_month')) {
      throw new CommunityServiceError(
        'Your household has already voted this month.',
        'already-voted',
        error.code
      );
    }
    throw queryFailure('Could not save your vote. Try again.', error);
  }
  return data;
}

