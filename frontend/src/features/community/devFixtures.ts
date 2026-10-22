import type { CommunityState } from '@/lib/services/communityCore';

const rewardIds = ['dev-reward-tree', 'dev-reward-food', 'dev-reward-tools'] as const;

const baseState: CommunityState = {
  currentVotingMonth: '2026-10-01',
  previousVotingMonth: '2026-09-01',
  todayMyt: '2026-10-21',
  rewards: [
    {
      id: rewardIds[0],
      voting_month: '2026-10-01',
      title: 'Plant a tree in our community',
      description: 'Adds native shaded greenery to the parkway',
      target_points: null,
      is_unlocked: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: rewardIds[1],
      voting_month: '2026-10-01',
      title: '50% off organic food at Sime Darby Mall',
      description: 'Redeemable voucher for seasonal fresh produce',
      target_points: null,
      is_unlocked: false,
      created_at: '2026-10-01T00:00:01Z',
    },
    {
      id: rewardIds[2],
      voting_month: '2026-10-01',
      title: 'Community tool & seed library',
      description: 'Free borrowing station for garden equipment',
      target_points: null,
      is_unlocked: false,
      created_at: '2026-10-01T00:00:02Z',
    },
  ],
  vote: null,
  selectedReward: null,
  visibleVoteCounts: {},
  lastMonthUnlockedReward: null,
  points: { currentMonth: 60, recycling: 10, energy: 50, allTime: 240 },
  deeds: {
    completedToday: 2,
    rawTodayCount: 2,
    recycledToday: true,
    uploadedLowerBillThisMonth: true,
    simulatorActionToday: false,
    today: [
      { id: 'dev-deed-1', household_id: 'dev-household', task_type: 'recycle', deed_date: '2026-10-21', created_at: '2026-10-21T01:00:00Z' },
      { id: 'dev-deed-2', household_id: 'dev-household', task_type: 'upload_lower_bill', deed_date: '2026-10-21', created_at: '2026-10-21T02:00:00Z' },
    ],
    currentMonth: [],
    recent: [],
  },
};

baseState.deeds.currentMonth = baseState.deeds.today;
baseState.deeds.recent = baseState.deeds.today;

export const COMMUNITY_DEV_FIXTURES = {
  'ready-unvoted': baseState,
  'ready-voted': {
    ...baseState,
    vote: {
      id: 'dev-vote',
      household_id: 'dev-household',
      reward_id: rewardIds[0],
      voting_month: '2026-10-01',
      created_at: '2026-10-21T03:15:00Z',
    },
    selectedReward: baseState.rewards[0],
    visibleVoteCounts: { [rewardIds[0]]: 1 },
  },
  empty: {
    ...baseState,
    rewards: [],
    points: { currentMonth: 0, recycling: 0, energy: 0, allTime: 0 },
    deeds: {
      completedToday: 0,
      rawTodayCount: 0,
      recycledToday: false,
      uploadedLowerBillThisMonth: false,
      simulatorActionToday: false,
      today: [],
      currentMonth: [],
      recent: [],
    },
  },
  'last-month-unlocked': {
    ...baseState,
    lastMonthUnlockedReward: {
      ...baseState.rewards[0],
      id: 'dev-last-month-reward',
      voting_month: '2026-09-01',
      is_unlocked: true,
    },
  },
} satisfies Record<string, CommunityState>;

export type CommunityDevFixtureName = keyof typeof COMMUNITY_DEV_FIXTURES;

