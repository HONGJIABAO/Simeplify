import { VotingOption, TaskItem } from './types';

export const COMMUNITY_VOTING_OPTIONS: VotingOption[] = [
  {
    id: 'tree',
    title: 'Plant a tree in our community',
    subtitle: 'Adds native shaded greenery to the parkway',
    votes: 139,
    percent: 58,
    category: 'Quarterly Green Commons Project',
  },
  {
    id: 'discount',
    title: '50% off organic food at Sime Darby Mall',
    subtitle: 'Redeemable voucher for seasonal fresh produce',
    votes: 65,
    percent: 27,
    category: 'Local Merchant Partnership',
  },
  {
    id: 'tools',
    title: 'Community tool & seed library',
    subtitle: 'Free borrowing station for garden equipment',
    votes: 36,
    percent: 15,
    category: 'Neighborhood Shared Resources',
  },
];

export const COMMUNITY_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Recycle 1 item',
    description: 'Scan & correctly sort paper, plastic or metal at the community bin station.',
    durationOrMetric: '~30s',
    iconType: 'recycle',
    actionLabel: 'Go to Bin →',
    route: '/(tabs)/bin',
    completed: false,
  },
  {
    id: 'task-2',
    title: 'Upload lower bill',
    description: 'Snap electricity or water bill showing baseline (< 280 kWh) or conservation.',
    durationOrMetric: '< 280 kWh',
    iconType: 'receipt',
    actionLabel: 'Go to Scanner →',
    route: '/(tabs)/scanner',
    completed: false,
  },
  {
    id: 'task-3',
    title: 'Appliance swap simulation',
    description: 'Test replacing old AC with a 5-star inverter in the bedroom.',
    durationOrMetric: '+40 pts',
    iconType: 'appliance',
    actionLabel: 'Go to Sim →',
    route: '/(tabs)/simulator',
    completed: false,
  },
];
