export type CommunityViewMode = 'letter' | 'living_leaf';

export type VotingPhase = 'new' | 'sealed' | 'tasks';

export type VotingOptionId = 'tree' | 'discount' | 'tools';

export interface VotingOption {
  id: VotingOptionId;
  title: string;
  subtitle: string;
  votes: number;
  percent: number;
  category: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  durationOrMetric: string;
  iconType: 'recycle' | 'receipt' | 'appliance';
  actionLabel: string;
  route: string;
  completed: boolean;
}

export interface OakridgeParticipationStats {
  sector: string;
  totalHouseholds: number;
  activeToday: number;
  participationRate: number;
  watering: {
    count: number;
    percent: number;
  };
  fertilizing: {
    count: number;
    percent: number;
  };
  pending: {
    count: number;
    percent: number;
  };
  updatedAt: string;
}
