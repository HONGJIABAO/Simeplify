/**
 * Central deterministic seeded mock data module for Eco-Habit Demo
 *
 * Requirements:
 * - 100 mock households (including the demo household d3b00000-0000-0000-0000-000000000002)
 * - Fields: id, name, monthlyDeeds, leafStage, penaltyDeedsLost, recyclingPts, monthlyPoints, energySaved, lastActionDate, hasVoted
 * - Store data per month (dataByMonth). All monthly stats start at 0 on the 1st of a month.
 * - Realistic spread: ~15% with 0-5 deeds, most between 10-40, ~10% above 40. Max deeds <= 2 x days elapsed.
 * - October 2026: exactly 52% (52 of 100) households have 30+ deeds (close to but below 60% goal).
 * - September 2026: "Hit" (64 of 100 households reached 30+, 64% >= 60%).
 * - August 2026: "Not hit" (48 of 100 households reached 30+, 48% < 60%).
 * - November 2026: New month with all 0s.
 * - Deterministic, no Math.random at render time.
 */

import { DEMO_HOUSEHOLD_ID } from '../authSession';
import {
  DEED_POINTS,
  MAX_DEEDS_PER_DAY,
  HIT_THRESHOLD,
  COMMUNITY_GOAL,
  RESTORE_COST,
  RECYCLE_ITEM_POINTS,
} from '@/features/community/config';

export type LeafStage = 'dry' | 'healthy' | 'lush';

export function downgradeLeafStage(stage: LeafStage): LeafStage {
  if (stage === 'lush') return 'healthy';
  if (stage === 'healthy') return 'dry';
  return 'dry';
}

export interface MockHousehold {
  id: string;
  name: string;
  monthlyDeeds: number;
  leafStage: LeafStage;
  penaltyDeedsLost: number;
  recyclingPts: number;
  monthlyPoints: number;
  energySaved: number;
  lastActionDate: string; // YYYY-MM-DD
  hasVoted: boolean;
}

export interface MonthRewardDef {
  id: string;
  title: string;
  description: string;
}

export const MONTH_REWARDS: Record<string, MonthRewardDef> = {
  '2026-08': {
    id: 'reward-2026-08',
    title: 'Community Solar Sensor Night Lights',
    description: 'Install 10 solar LED trail lamps along the Oakridge community park.',
  },
  '2026-09': {
    id: 'reward-2026-09',
    title: 'Oakridge Tree Planting Initiative',
    description: 'Plant 50 native shade saplings and bird feeders across Cedar Grove Parkway.',
  },
  '2026-10': {
    id: 'reward-2026-10',
    title: 'Community Composting Facility & Herb Garden',
    description: 'Unlock neighborhood-wide composting bins and a shared raised herb garden for Sector 4B.',
  },
  '2026-11': {
    id: 'reward-2026-11',
    title: 'Subang Green Hub Tool Library',
    description: 'A shared lending library with electric lawn tools and community bike repair gear.',
  },
};

// 100 deterministic household names representing a lively Malaysian neighbourhood
const HOUSEHOLD_NAMES: string[] = [
  'Tan Household (You)',
  'Ahmad Family',
  'Lim Residence',
  'Wong Household',
  'Kaur Family',
  'Ramasamy Residence',
  'Chua Family',
  'Nurul & Farhan',
  'Lee Household',
  'Krishnan Residence',
  'Zainal Abidin Family',
  'Goh & Sons',
  'Ibrahim Household',
  'Devi & Anand',
  'Cheah Residence',
  'Syed & Aishah',
  'Ooi Family',
  'Pillai Household',
  'Teh Residence',
  'Hafiz & Maya',
  'Khoo Family',
  'Rajagopal Residence',
  'Chin Household',
  'Norazlan Family',
  'Siti Aminah',
  'Subramaniam Family',
  'Low Residence',
  'Fauzi & Sarah',
  'Ng Family',
  'Kamal & Linda',
  'Venkatesh Residence',
  'Chan Household',
  'Bakar Family',
  'Yong Residence',
  'Sundram Household',
  'Rozita & Daniel',
  'Lau Family',
  'Murali Residence',
  'Khairul Family',
  'Sim Household',
  'Ravindran Family',
  'Zul & Nadia',
  'Foo Residence',
  'Saravanan Household',
  'Yap Family',
  'Azman Residence',
  'Sanjay & Preeti',
  'Chong Household',
  'Wan & Hajar',
  'Tham Residence',
  'Ganesan Family',
  'Harith & Nabilah',
  'Tee Household',
  'Arumugam Residence',
  'Koh Family',
  'Rashid & Yasmin',
  'Balakrishnan Household',
  'Soo Residence',
  'Shahril & Farah',
  'Manickam Family',
  'Beh Household',
  'Hakim & Anis',
  'Naidu Residence',
  'Chiam Family',
  'Iskandar Household',
  'Thum Residence',
  'Selvam Family',
  'Daud & Mariam',
  'Ho Household',
  'Nadarajah Residence',
  'Ku & Sons',
  'Faizal & Zulaikha',
  'Sivakumar Family',
  'Yeoh Residence',
  'Hisham Household',
  'Appaduray Residence',
  'See Family',
  'Luqman & Alya',
  'Thevar Household',
  'Eng Residence',
  'Najib & Safiya',
  'Mohan Family',
  'Leong Household',
  'Saiful & Diana',
  'Chandran Residence',
  'Toh Family',
  'Radzi Household',
  'Paramasivam Residence',
  'Fong Family',
  'Idris & Natasha',
  'Muthu Household',
  'Ang Residence',
  'Shukri & Intan',
  'Jayaraman Family',
  'Quek Household',
  'Tariq & Hana',
  'Loganathan Residence',
  'Phang Family',
  'Firdaus & Mira',
  'Dharma Household',
];

/**
 * Deterministic PRNG (Mulberry32) for deterministic mock data generation
 */
function createPrng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build 100 deterministic mock households for a given month
 */
function buildMonthHouseholds(
  monthKey: '2026-08' | '2026-09' | '2026-10' | '2026-11'
): MockHousehold[] {
  const prng = createPrng(
    monthKey === '2026-08'
      ? 1008
      : monthKey === '2026-09'
      ? 1009
      : monthKey === '2026-10'
      ? 1010
      : 1011
  );

  const households: MockHousehold[] = [];

  // November 2026: Start of month reset - all 0s
  if (monthKey === '2026-11') {
    for (let i = 0; i < 100; i++) {
      const isDemo = i === 0;
      households.push({
        id: isDemo ? DEMO_HOUSEHOLD_ID : `hh-${String(i + 1).padStart(3, '0')}`,
        name: isDemo ? HOUSEHOLD_NAMES[0] : HOUSEHOLD_NAMES[i] || `Household #${i + 1}`,
        monthlyDeeds: 0,
        leafStage: 'dry',
        penaltyDeedsLost: 0,
        recyclingPts: 0,
        monthlyPoints: 0,
        energySaved: 0,
        lastActionDate: '2026-11-01',
        hasVoted: false,
      });
    }
    return households;
  }

  // Target count of households with >= 30 deeds:
  // Oct 2026 (day 23): exactly 52 households with >= 30 deeds (close to 60%, max deeds = 2 * 23 = 46)
  // Sep 2026 (day 30): exactly 64 households with >= 30 deeds (Hit, >= 60%)
  // Aug 2026 (day 31): exactly 48 households with >= 30 deeds (Not hit, < 60%)
  const targetQualified =
    monthKey === '2026-10' ? 52 : monthKey === '2026-09' ? 64 : 48;

  // Indices that will have >= 30 deeds (deterministic):
  // Put demo household (index 0) into below-30 in October (18 deeds), and into qualified in Sep (34 deeds)
  const qualifiedSet = new Set<number>();
  if (monthKey === '2026-09') {
    qualifiedSet.add(0); // Demo user qualified in Sep
  }

  let cand = 1;
  while (qualifiedSet.size < targetQualified) {
    if (monthKey === '2026-10' && cand === 0) {
      cand++;
      continue;
    }
    qualifiedSet.add(cand);
    cand++;
  }

  // Days elapsed in that month
  const maxAllowedDeeds =
    monthKey === '2026-10' ? 2 * 23 : monthKey === '2026-09' ? 2 * 30 : 2 * 31;

  for (let i = 0; i < 100; i++) {
    const isDemo = i === 0;
    const isQual = qualifiedSet.has(i);

    let monthlyDeeds = 0;
    if (isDemo && monthKey === '2026-10') {
      monthlyDeeds = 18; // Demo user current progress in October
    } else if (isDemo && monthKey === '2026-09') {
      monthlyDeeds = 34; // Demo user finished with 34 in Sep (Hit)
    } else if (isDemo && monthKey === '2026-08') {
      monthlyDeeds = 24; // Demo user finished with 24 in Aug (Not hit)
    } else if (isQual) {
      // Qualified: >= 30 deeds
      // ~10% above 40 (for indices 1..10 if month allows)
      if (i <= 10 && maxAllowedDeeds >= 41) {
        monthlyDeeds = 41 + Math.floor(prng() * Math.min(6, maxAllowedDeeds - 40));
      } else {
        // Between 30 and 40
        monthlyDeeds = 30 + Math.floor(prng() * 11);
      }
    } else {
      // Non-qualified: < 30 deeds
      // ~15% with 0-5 deeds (e.g. indices 85..99)
      if (i >= 85) {
        monthlyDeeds = Math.floor(prng() * 6); // 0 to 5 deeds
      } else {
        // Between 6 and 29
        monthlyDeeds = 6 + Math.floor(prng() * 24);
      }
    }

    monthlyDeeds = Math.min(monthlyDeeds, maxAllowedDeeds);

    // Leaf stage based on recent activity
    let leafStage: LeafStage = 'dry';
    if (monthlyDeeds >= 30) {
      leafStage = prng() > 0.3 ? 'lush' : 'healthy';
    } else if (monthlyDeeds >= 10) {
      leafStage = prng() > 0.4 ? 'healthy' : 'dry';
    } else {
      leafStage = 'dry';
    }

    if (isDemo) {
      leafStage = monthKey === '2026-10' ? 'healthy' : monthKey === '2026-09' ? 'lush' : 'healthy';
    }

    // Recycling points: 10 to 240
    let recyclingPts = 20 + Math.floor(prng() * 18) * 10;
    if (isDemo && monthKey === '2026-10') {
      recyclingPts = 120; // 120 pts allows demoing progress to 200 restore threshold
    }

    // Energy saved: kWh
    const energySaved = 12 + Math.floor(prng() * 45);

    // Monthly points = deeds * 10 + recyclingPts
    const penaltyDeedsLost = (isDemo && monthKey === '2026-08') ? 1 : 0;
    const monthlyPoints = Math.max(0, monthlyDeeds * DEED_POINTS + recyclingPts - penaltyDeedsLost * DEED_POINTS);

    // Voting: only completed months have votes, current month starts false
    const hasVoted = monthKey === '2026-10' ? false : true;

    households.push({
      id: isDemo ? DEMO_HOUSEHOLD_ID : `hh-${String(i + 1).padStart(3, '0')}`,
      name: isDemo ? HOUSEHOLD_NAMES[0] : HOUSEHOLD_NAMES[i] || `Household #${i + 1}`,
      monthlyDeeds,
      leafStage,
      penaltyDeedsLost,
      recyclingPts,
      monthlyPoints,
      energySaved,
      lastActionDate: `${monthKey}-23`,
      hasVoted,
    });
  }

  return households;
}

/**
 * Deterministic baseline data dictionary partitioned by month
 */
export const INITIAL_DATA_BY_MONTH: Record<string, MockHousehold[]> = {
  '2026-08': buildMonthHouseholds('2026-08'),
  '2026-09': buildMonthHouseholds('2026-09'),
  '2026-10': buildMonthHouseholds('2026-10'),
  '2026-11': buildMonthHouseholds('2026-11'),
};
