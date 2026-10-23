import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  COMMUNITY_GOAL,
  DEED_POINTS,
  HIT_THRESHOLD,
  MAX_DEEDS_PER_DAY,
  RECYCLE_ITEM_POINTS,
  RESTORE_COST,
} from '@/features/community/config';
import { DEMO_HOUSEHOLD_ID } from './authSession';
import {
  INITIAL_DATA_BY_MONTH,
  MONTH_REWARDS,
  downgradeLeafStage,
  type LeafStage,
  type MockHousehold,
  type MonthRewardDef,
} from './services/mockEcoData';

export { downgradeLeafStage };

export interface MonthSummary {
  month: string; // YYYY-MM
  isCurrentMonth: boolean;
  eligibleHouseholds: number;
  qualifiedHouseholds: number;
  percentage: number;
  thresholdPct: number;
  isHit: boolean;
  status: 'In progress' | 'Hit' | 'Not hit';
  neededHouseholds: number;
  householdMonthlyDeeds: number;
  householdHasLeaf: boolean;
  totalCommunityPoints: number;
  totalCommunityDeeds: number;
  totalCommunityEnergySaved: number;
  communityRMSaved: number;
  energySaved: number;
  reward: MonthRewardDef & { isUnlocked: boolean };
}

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

interface EcoHabitContextType {
  demoDate: string; // YYYY-MM-DD e.g. '2026-10-23'
  todayDeedsCount: number; // 0..2
  penaltyNotice: string | null;
  currentHousehold: MockHousehold;
  isLeafLocked: boolean;
  lockPromptVisible: boolean;
  setDemoDate: (newDate: string) => void;
  advanceNextDay: () => void;
  completeGreenAction: () => boolean;
  addDeed: (source?: string) => boolean;
  sortRecycleItem: () => void;
  quickRecyclePts: (amount?: number) => void;
  restoreDeed: () => boolean;
  castVote: (rewardId?: string) => void;
  resetVote: () => void;
  toggleCommunityRate: () => void;
  isCommunityRateAbove60: boolean;
  dismissPenaltyNotice: () => void;
  dismissLockPrompt: () => void;
  unlockLeaf: () => void;
  setIsLeafLocked: React.Dispatch<React.SetStateAction<boolean>>;
  getMonthSummary: (isoMonthKey: string) => MonthSummary;
  isVotingVisible: boolean;
  countdown: CountdownState;
  resetAll: () => void;
}

const EcoHabitContext = createContext<EcoHabitContextType | undefined>(undefined);

// Helper: Days in month
function getDaysInMonth(year: number, month1Indexed: number): number {
  return new Date(year, month1Indexed, 0).getDate();
}

function getNextDayStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  dateObj.setUTCDate(dateObj.getUTCDate() + 1);
  return dateObj.toISOString().slice(0, 10);
}

export function EcoHabitProvider({ children }: { children: React.ReactNode }) {
  // Current demo date: default to 2026-10-23
  const [demoDate, setDemoDateState] = useState<string>('2026-10-23');

  // Track deeds completed per day (keyed by date string YYYY-MM-DD)
  // Default for 2026-10-23 is 1 deed (Healthy stage)
  const [deedsByDate, setDeedsByDate] = useState<Record<string, number>>({
    '2026-10-23': 1,
  });

  const todayDeedsCount = deedsByDate[demoDate] ?? 0;

  // Track Leaf Status "Next Day" Lock (Requirement 4)
  // When system detects a transition to the next day, leaf temporarily enters locked/shrunk state
  const [isLeafLocked, setIsLeafLocked] = useState<boolean>(false);
  const [lockPromptVisible, setLockPromptVisible] = useState<boolean>(false);

  // Track vote status per month: '2026-08', '2026-09', '2026-10', '2026-11'
  const [hasVotedByMonth, setHasVotedByMonth] = useState<Record<string, boolean>>({
    '2026-08': true,
    '2026-09': true,
    '2026-10': false,
    '2026-11': false,
  });

  // Notice shown on leaf card when missed day penalty applies
  const [penaltyNotice, setPenaltyNotice] = useState<string | null>(null);

  // Store data per month: deep copy of deterministic initial data
  const [householdsByMonth, setHouseholdsByMonth] = useState<Record<string, MockHousehold[]>>(() => {
    const copy: Record<string, MockHousehold[]> = {};
    for (const [m, list] of Object.entries(INITIAL_DATA_BY_MONTH)) {
      copy[m] = list.map((h) => ({ ...h }));
    }
    return copy;
  });

  // Current month key (e.g. '2026-10')
  const currentMonthKey = demoDate.slice(0, 7);

  // Current demo household
  const currentHousehold = useMemo(() => {
    const list = householdsByMonth[currentMonthKey] || householdsByMonth['2026-10'] || [];
    const found = list.find((h) => h.id === DEMO_HOUSEHOLD_ID);
    if (found) {
      return {
        ...found,
        hasVoted: Boolean(hasVotedByMonth[currentMonthKey]),
      };
    }

    // Fallback baseline if not found
    return {
      id: DEMO_HOUSEHOLD_ID,
      name: 'Tan Household (You)',
      monthlyDeeds: 0,
      leafStage: 'dry' as LeafStage,
      penaltyDeedsLost: 0,
      recyclingPts: 0,
      monthlyPoints: 0,
      energySaved: 0,
      lastActionDate: demoDate,
      hasVoted: Boolean(hasVotedByMonth[currentMonthKey]),
    };
  }, [householdsByMonth, currentMonthKey, hasVotedByMonth, demoDate]);

  // Update demo household in the active month
  const updateCurrentHousehold = useCallback(
    (updater: (prev: MockHousehold) => MockHousehold) => {
      setHouseholdsByMonth((prev) => {
        const list = prev[currentMonthKey] ? [...prev[currentMonthKey]] : [];
        const idx = list.findIndex((h) => h.id === DEMO_HOUSEHOLD_ID);
        if (idx >= 0) {
          list[idx] = updater(list[idx]);
        }
        return {
          ...prev,
          [currentMonthKey]: list,
        };
      });
    },
    [currentMonthKey]
  );

  // Demo Date Jump: changes simulated "today"
  const setDemoDate = useCallback(
    (newDate: string) => {
      const oldDate = demoDate;
      const newMonth = newDate.slice(0, 7);
      setDemoDateState(newDate);

      // If advancing to a different date:
      if (newDate !== oldDate) {
        const deedsOnOldDay = deedsByDate[oldDate] ?? 0;
        // When leaf was locked and user had no action all day:
        // Next day directly downgrades 1 status and enters unlocked state!
        const wasLockedWithoutAction = isLeafLocked && deedsOnOldDay === 0;

        if (wasLockedWithoutAction) {
          updateCurrentHousehold((h) => {
            const nextDeeds = Math.max(0, h.monthlyDeeds - 1);
            const nextStage = downgradeLeafStage(h.leafStage);
            return {
              ...h,
              monthlyDeeds: nextDeeds,
              leafStage: nextStage,
              penaltyDeedsLost: h.penaltyDeedsLost + 1,
              // STRICT RULE (Requirement 5): recyclingPts is untouched!
              recyclingPts: h.recyclingPts,
            };
          });
          setPenaltyNotice(
            'Missed-day penalty applied: leaf stage dropped by 1 level (-1 deed). Living Leaf is now unlocked for today.'
          );
          // Unlock status on next day!
          setIsLeafLocked(false);
          setLockPromptVisible(false);
        } else {
          setPenaltyNotice(null);
          // When not locked-without-action, new day enters locked state awaiting today's action
          setIsLeafLocked(true);
          setLockPromptVisible(true);
        }
      }

      // If jumping to a new month like November 2026 that has not been initialized yet:
      setHouseholdsByMonth((prev) => {
        if (!prev[newMonth]) {
          const freshList: MockHousehold[] = (prev['2026-10'] || []).map((h) => ({
            ...h,
            monthlyDeeds: 0,
            leafStage: 'dry',
            penaltyDeedsLost: 0,
            recyclingPts: h.recyclingPts, // keep accumulated recycling points safe
            monthlyPoints: 0,
            energySaved: 0,
            lastActionDate: newDate,
            hasVoted: false,
          }));
          return {
            ...prev,
            [newMonth]: freshList,
          };
        }
        return prev;
      });
    },
    [demoDate, deedsByDate, isLeafLocked, updateCurrentHousehold]
  );

  // Advance Next Day: advances 1 calendar day and executes real day rollover penalty.
  // When leaf status was locked, and user had NO action for the whole day (deedsOnOldDay === 0):
  // Next day directly downgrades by one status, and enters unlocked status!
  const advanceNextDay = useCallback(() => {
    const oldDate = demoDate;
    const oldMonth = oldDate.slice(0, 7);
    const newDate = getNextDayStr(oldDate);
    const newMonth = newDate.slice(0, 7);

    const deedsOnOldDay = deedsByDate[oldDate] ?? 0;

    setDemoDateState(newDate);

    const wasLockedWithoutAction = isLeafLocked && deedsOnOldDay === 0;

    if (wasLockedWithoutAction) {
      updateCurrentHousehold((h) => {
        const nextDeeds = Math.max(0, h.monthlyDeeds - 1);
        const nextStage = downgradeLeafStage(h.leafStage);
        const nextLost = h.penaltyDeedsLost + 1;
        return {
          ...h,
          monthlyDeeds: nextDeeds,
          leafStage: nextStage,
          penaltyDeedsLost: nextLost,
          // STRICT RULE (Requirement 5): recyclingPts is strictly unaffected by missed days
          recyclingPts: h.recyclingPts,
        };
      });
      setPenaltyNotice(
        'Missed-day penalty applied: leaf stage dropped by 1 level (-1 deed). Living Leaf is now unlocked for today.'
      );
      // Unlock status on next day!
      setIsLeafLocked(false);
      setLockPromptVisible(false);
    } else {
      setPenaltyNotice(null);
      // On normal transition to next day, Leaf temporarily enters visually shrunk/locked state awaiting today's action
      setIsLeafLocked(true);
      setLockPromptVisible(true);
    }

    // Initialize new month if crossing boundary
    if (newMonth !== oldMonth) {
      setHouseholdsByMonth((prev) => {
        if (!prev[newMonth]) {
          const freshList: MockHousehold[] = (prev['2026-10'] || []).map((h) => ({
            ...h,
            monthlyDeeds: 0,
            leafStage: 'dry',
            penaltyDeedsLost: 0,
            recyclingPts: h.recyclingPts,
            monthlyPoints: 0,
            energySaved: 0,
            lastActionDate: newDate,
            hasVoted: false,
          }));
          return {
            ...prev,
            [newMonth]: freshList,
          };
        }
        return prev;
      });
    }
  }, [demoDate, deedsByDate, isLeafLocked, updateCurrentHousehold]);

  // Requirement 3 & 4: Whenever a task is completed in Simulator, Bin, or Scanner,
  // it automatically adds/updates 1 Deed in Community and unlocks the Living Leaf if locked!
  const addDeed = useCallback(
    (_source?: string): boolean => {
      const currentCount = deedsByDate[demoDate] ?? 0;
      const nextCount = currentCount + 1;
      setDeedsByDate((prev) => ({
        ...prev,
        [demoDate]: nextCount,
      }));

      // Requirement 4: Completing an action immediately unlocks the Living Leaf!
      setIsLeafLocked(false);
      setLockPromptVisible(false);

      const nextStage: LeafStage = nextCount === 1 ? 'healthy' : 'lush';

      updateCurrentHousehold((h) => ({
        ...h,
        monthlyDeeds: h.monthlyDeeds + 1,
        monthlyPoints: h.monthlyPoints + DEED_POINTS,
        leafStage: nextStage,
        lastActionDate: demoDate,
      }));

      return true;
    },
    [deedsByDate, demoDate, updateCurrentHousehold]
  );

  // Complete a green action (triggers deed add and unlocks leaf)
  const completeGreenAction = useCallback((): boolean => {
    return addDeed('manual_action');
  }, [addDeed]);

  const unlockLeaf = useCallback(() => {
    setIsLeafLocked(false);
    setLockPromptVisible(false);
  }, []);

  const dismissLockPrompt = useCallback(() => {
    setLockPromptVisible(false);
  }, []);

  // Add recycling points & monthly points
  const quickRecyclePts = useCallback(
    (amount = 200) => {
      updateCurrentHousehold((h) => ({
        ...h,
        recyclingPts: h.recyclingPts + amount,
        monthlyPoints: h.monthlyPoints + amount,
        lastActionDate: demoDate,
      }));
    },
    [demoDate, updateCurrentHousehold]
  );

  // Sort an item cleanly in bin (+10 recyclingPts, +10 monthlyPoints)
  const sortRecycleItem = useCallback(() => {
    quickRecyclePts(RECYCLE_ITEM_POINTS);
  }, [quickRecyclePts]);

  // Restore deeds: costs 200 recyclingPts, recovers 1 deed, raises stage by 1, recovers 10 pts
  const restoreDeed = useCallback((): boolean => {
    if (currentHousehold.recyclingPts < RESTORE_COST || currentHousehold.penaltyDeedsLost <= 0) {
      return false;
    }

    updateCurrentHousehold((h) => {
      const nextStage: LeafStage =
        h.leafStage === 'dry' ? 'healthy' : 'lush';

      return {
        ...h,
        recyclingPts: h.recyclingPts - RESTORE_COST,
        penaltyDeedsLost: Math.max(0, h.penaltyDeedsLost - 1),
        monthlyDeeds: h.monthlyDeeds + 1,
        monthlyPoints: h.monthlyPoints + DEED_POINTS,
        leafStage: nextStage,
      };
    });

    return true;
  }, [currentHousehold, updateCurrentHousehold]);

  // Cast household vote
  const castVote = useCallback(
    (_rewardId?: string) => {
      setHasVotedByMonth((prev) => ({
        ...prev,
        [currentMonthKey]: true,
      }));
      updateCurrentHousehold((h) => ({
        ...h,
        hasVoted: true,
      }));
    },
    [currentMonthKey, updateCurrentHousehold]
  );

  // Reset household vote for current month
  const resetVote = useCallback(() => {
    setHasVotedByMonth((prev) => ({
      ...prev,
      [currentMonthKey]: false,
    }));
    updateCurrentHousehold((h) => ({
      ...h,
      hasVoted: false,
    }));
  }, [currentMonthKey, updateCurrentHousehold]);

  // Check if community rate in active month is >= 60%
  const isCommunityRateAbove60 = useMemo(() => {
    const list = householdsByMonth[currentMonthKey] || [];
    const count = list.filter((h) => h.monthlyDeeds >= HIT_THRESHOLD).length;
    return count >= COMMUNITY_GOAL;
  }, [householdsByMonth, currentMonthKey]);

  // Toggle community rate between ~52% and ~64%
  const toggleCommunityRate = useCallback(() => {
    setHouseholdsByMonth((prev) => {
      const list = prev[currentMonthKey] ? [...prev[currentMonthKey].map((h) => ({ ...h }))] : [];
      if (list.length === 0) return prev;
      const count = list.filter((h) => h.monthlyDeeds >= HIT_THRESHOLD).length;
      const targetIsAbove = count < COMMUNITY_GOAL;

      if (targetIsAbove) {
        // Boost 12 households to 30..34 deeds so count goes from ~52 to 64
        let boosted = 0;
        for (let i = 1; i < list.length && boosted < 12; i++) {
          if (list[i].monthlyDeeds < HIT_THRESHOLD) {
            const added = 30 + (boosted % 5) - list[i].monthlyDeeds;
            list[i].monthlyDeeds += added;
            list[i].monthlyPoints += added * DEED_POINTS;
            list[i].leafStage = 'healthy';
            boosted++;
          }
        }
      } else {
        // Reduce 12 households to 24..28 deeds so count goes from ~64 to 52
        let reduced = 0;
        for (let i = list.length - 1; i >= 1 && reduced < 12; i--) {
          if (list[i].monthlyDeeds >= HIT_THRESHOLD) {
            const subtracted = list[i].monthlyDeeds - (24 + (reduced % 5));
            list[i].monthlyDeeds -= subtracted;
            list[i].monthlyPoints = Math.max(0, list[i].monthlyPoints - subtracted * DEED_POINTS);
            reduced++;
          }
        }
      }

      return {
        ...prev,
        [currentMonthKey]: list,
      };
    });
  }, [currentMonthKey]);

  const dismissPenaltyNotice = useCallback(() => {
    setPenaltyNotice(null);
  }, []);

  // Reset to initial demo state
  const resetAll = useCallback(() => {
    const copy: Record<string, MockHousehold[]> = {};
    for (const [m, list] of Object.entries(INITIAL_DATA_BY_MONTH)) {
      copy[m] = list.map((h) => ({ ...h }));
    }
    setHouseholdsByMonth(copy);
    setDemoDateState('2026-10-23');
    setDeedsByDate({ '2026-10-23': 1 });
    setIsLeafLocked(false);
    setLockPromptVisible(false);
    setHasVotedByMonth({
      '2026-08': true,
      '2026-09': true,
      '2026-10': false,
      '2026-11': false,
    });
    setPenaltyNotice(null);
  }, []);

  // Compute summary for any month key (e.g. '2026-10' or '2026-10-01')
  const getMonthSummary = useCallback(
    (rawMonthKey: string): MonthSummary => {
      const monthKey = rawMonthKey.slice(0, 7); // ensure YYYY-MM
      const list = householdsByMonth[monthKey] || INITIAL_DATA_BY_MONTH[monthKey] || [];
      const eligibleHouseholds = list.length || 100;

      // Count households that reached >= 30 deeds
      const qualifiedHouseholds = list.filter((h) => h.monthlyDeeds >= HIT_THRESHOLD).length;
      const percentage = eligibleHouseholds > 0
        ? Math.round((qualifiedHouseholds * 100) / eligibleHouseholds)
        : 0;

      const isHit = qualifiedHouseholds * 100 >= eligibleHouseholds * COMMUNITY_GOAL;
      const isCurrentMonth = monthKey === currentMonthKey;

      const status: MonthSummary['status'] = isCurrentMonth
        ? 'In progress'
        : isHit
        ? 'Hit'
        : 'Not hit';

      const neededHouseholds = isHit
        ? 0
        : Math.max(0, Math.ceil((eligibleHouseholds * COMMUNITY_GOAL) / 100) - qualifiedHouseholds);

      // In current month, use the live demo household from state
      const demoH = isCurrentMonth
        ? currentHousehold
        : list.find((h) => h.id === DEMO_HOUSEHOLD_ID) || {
            monthlyDeeds: 0,
            energySaved: 0,
          };

      const totalCommunityPoints = list.reduce((sum, h) => sum + h.monthlyPoints, 0);
      const totalCommunityDeeds = list.reduce((sum, h) => sum + h.monthlyDeeds, 0);
      const totalCommunityEnergySaved = list.reduce((sum, h) => sum + (h.energySaved || 0), 0);
      const communityRMSaved = Math.round(totalCommunityEnergySaved * 0.43);

      const baseReward = MONTH_REWARDS[monthKey] || {
        id: `reward-${monthKey}`,
        title: 'Community Green Initiative',
        description: 'Neighborhood-wide sustainability challenge.',
      };

      return {
        month: monthKey,
        isCurrentMonth,
        eligibleHouseholds,
        qualifiedHouseholds,
        percentage,
        thresholdPct: COMMUNITY_GOAL,
        isHit,
        status,
        neededHouseholds,
        householdMonthlyDeeds: demoH.monthlyDeeds,
        householdHasLeaf: demoH.monthlyDeeds >= HIT_THRESHOLD,
        totalCommunityPoints,
        totalCommunityDeeds,
        totalCommunityEnergySaved,
        communityRMSaved,
        energySaved: demoH.energySaved || 0,
        reward: {
          ...baseReward,
          isUnlocked: status === 'Hit',
        },
      };
    },
    [householdsByMonth, currentMonthKey, currentHousehold]
  );

  // Voting window visibility:
  // Visible ONLY in the last 5 days of each month.
  // After voting, hide the vote tab for the rest of that month.
  const isVotingVisible = useMemo(() => {
    if (currentHousehold.hasVoted) return false;

    const [yearStr, monthStr, dayStr] = demoDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    const totalDays = getDaysInMonth(year, month);
    // Last 5 days: e.g. for 31 days -> days 27, 28, 29, 30, 31 (day >= 27)
    const isLastFiveDays = day >= totalDays - 4 && day <= totalDays;
    return isLastFiveDays;
  }, [demoDate, currentHousehold.hasVoted]);

  // Live countdown to end of month (23:59:59 MYT)
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    formatted: '0d 00h 00m 00s',
  });

  useEffect(() => {
    const updateCountdown = () => {
      const [yearStr, monthStr, dayStr] = demoDate.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);
      const totalDays = getDaysInMonth(year, month);

      // Target: End of current month 23:59:59
      const targetTime = new Date(year, month - 1, totalDays, 23, 59, 59).getTime();

      // Current simulated time using demoDate and real clock time
      const nowReal = new Date();
      const simNow = new Date(
        year,
        month - 1,
        day,
        nowReal.getHours(),
        nowReal.getMinutes(),
        nowReal.getSeconds()
      ).getTime();

      const diffMs = Math.max(0, targetTime - simNow);
      const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diffMs / (1000 * 60)) % 60);
      const s = Math.floor((diffMs / 1000) % 60);

      const formatted = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;

      setCountdown({ days: d, hours: h, minutes: m, seconds: s, formatted });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [demoDate]);

  const value = useMemo(
    () => ({
      demoDate,
      todayDeedsCount,
      penaltyNotice,
      currentHousehold,
      isLeafLocked,
      lockPromptVisible,
      setDemoDate,
      advanceNextDay,
      completeGreenAction,
      addDeed,
      sortRecycleItem,
      quickRecyclePts,
      restoreDeed,
      castVote,
      resetVote,
      toggleCommunityRate,
      isCommunityRateAbove60,
      dismissPenaltyNotice,
      dismissLockPrompt,
      unlockLeaf,
      setIsLeafLocked,
      getMonthSummary,
      isVotingVisible,
      countdown,
      resetAll,
    }),
    [
      demoDate,
      todayDeedsCount,
      penaltyNotice,
      currentHousehold,
      isLeafLocked,
      lockPromptVisible,
      setDemoDate,
      advanceNextDay,
      completeGreenAction,
      addDeed,
      sortRecycleItem,
      quickRecyclePts,
      restoreDeed,
      castVote,
      resetVote,
      toggleCommunityRate,
      isCommunityRateAbove60,
      dismissPenaltyNotice,
      dismissLockPrompt,
      unlockLeaf,
      setIsLeafLocked,
      getMonthSummary,
      isVotingVisible,
      countdown,
      resetAll,
    ]
  );

  return <EcoHabitContext.Provider value={value}>{children}</EcoHabitContext.Provider>;
}

export function useEcoHabit() {
  const context = useContext(EcoHabitContext);
  if (!context) {
    throw new Error('useEcoHabit must be used within an EcoHabitProvider');
  }
  return context;
}
