/** SIM-04 — pure seven-day fast-forward reel selection and progress. */
import type { RoutineBlock } from './myDayLogic';

export type ReelPeriod = '1W' | '1M' | '1Y';
export const REEL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type ReelDay = typeof REEL_DAYS[number];
export type FeaturedCategory = 'shower' | 'breakfast' | 'work' | 'evening' | 'dinner';

// TODO(open-item): Product owner to confirm the featured category for each weekday.
export const FEATURED_BLOCK_BY_DAY: Record<ReelDay, FeaturedCategory> = {
  Monday: 'shower',
  Tuesday: 'breakfast',
  Wednesday: 'work',
  Thursday: 'evening',
  Friday: 'dinner',
  Saturday: 'evening',
  Sunday: 'evening',
};

export interface WeekReelSegment {
  day: ReelDay;
  dayIndex: number;
  block: RoutineBlock | null;
  isAway: boolean;
  caption: string;
}

const DAY_ALIASES: Record<ReelDay, string[]> = {
  Monday: ['mon', 'monday'], Tuesday: ['tue', 'tues', 'tuesday'], Wednesday: ['wed', 'wednesday'],
  Thursday: ['thu', 'thur', 'thurs', 'thursday'], Friday: ['fri', 'friday'],
  Saturday: ['sat', 'saturday'], Sunday: ['sun', 'sunday'],
};

function appliesToDay(block: RoutineBlock, day: ReelDay) {
  if (!block.repeatDays?.length) return true;
  const aliases = DAY_ALIASES[day];
  return block.repeatDays.some((value) => aliases.includes(value.trim().toLowerCase()));
}

function blockCategory(block: RoutineBlock): FeaturedCategory | null {
  const name = block.name.toLowerCase();
  if (block.iconType === 'shower' || name.includes('shower')) return 'shower';
  if (block.iconType === 'work' || name.includes('work') || name.includes('study')) return 'work';
  if (name.includes('breakfast') || (block.iconType === 'meal' && timeValue(block) < 11 * 60)) return 'breakfast';
  if (name.includes('dinner') || (block.iconType === 'meal' && timeValue(block) >= 17 * 60)) return 'dinner';
  if (block.iconType === 'evening' || name.includes('evening') || name.includes('tv') || name.includes('watch') || name.includes('living')) return 'evening';
  return null;
}

function timeValue(block: RoutineBlock) {
  const [hour = 0, minute = 0] = block.startTime.split(':').map(Number);
  return hour * 60 + minute;
}

export function chooseFeaturedBlock(day: ReelDay, blocks: readonly RoutineBlock[]): WeekReelSegment {
  const today = blocks.filter((block) => appliesToDay(block, day)).sort((a, b) => timeValue(a) - timeValue(b));
  const away = today.filter((block) => block.isAway || block.roomId === 'away');
  const present = today.filter((block) => !block.isAway && block.roomId !== 'away');
  if (today.length > 0 && present.length === 0 && away.length > 0) {
    return { day, dayIndex: REEL_DAYS.indexOf(day), block: away[0], isAway: true, caption: `${day} · Away` };
  }
  const requested = FEATURED_BLOCK_BY_DAY[day];
  const nonSleep = present.filter((block) => block.iconType !== 'sleep');
  const featured = nonSleep.find((block) => blockCategory(block) === requested)
    ?? nonSleep[0]
    ?? present.find((block) => block.iconType === 'sleep')
    ?? null;
  return {
    day,
    dayIndex: REEL_DAYS.indexOf(day),
    block: featured,
    isAway: false,
    caption: featured ? `${day} · ${featured.name} · ${featured.startTime}` : `${day} · No routine`,
  };
}

export function buildWeekReel(blocks: readonly RoutineBlock[]): WeekReelSegment[] {
  return REEL_DAYS.map((day) => chooseFeaturedBlock(day, blocks));
}

export function getReelSavings(totalSavingsRm: number, dayIndex: number, segmentProgress: number): number {
  const progress = Math.max(0, Math.min(1, (dayIndex + Math.max(0, Math.min(1, segmentProgress))) / 7));
  return Math.round(Math.max(0, totalSavingsRm) * progress);
}

export function getReelTargetDate(start: Date, period: ReelPeriod, progress: number): Date {
  const end = new Date(start.getTime());
  if (period === '1Y') end.setFullYear(end.getFullYear() + 1);
  else if (period === '1W') end.setDate(end.getDate() + 7);
  else end.setMonth(end.getMonth() + 1);
  return new Date(start.getTime() + (end.getTime() - start.getTime()) * Math.max(0, Math.min(1, progress)));
}

export function getReducedMotionSummary(blocks: readonly RoutineBlock[], totalSavingsRm: number) {
  return { segments: buildWeekReel(blocks), finalSavingsRm: Math.max(0, Math.round(totalSavingsRm)) };
}

export interface PlayFlowState {
  menuOpen: boolean;
  isPlaying: boolean;
  isEditMode: boolean;
}

export type PlayFlowAction = 'tapButton' | 'tapOrDragScreen' | 'toggleEdit';

export function reducePlayFlow(state: PlayFlowState, action: PlayFlowAction): PlayFlowState {
  if (action === 'toggleEdit') {
    const nextEdit = !state.isEditMode;
    return {
      isEditMode: nextEdit,
      menuOpen: false,
      isPlaying: false,
    };
  }

  if (state.isEditMode) {
    return state;
  }

  if (action === 'tapOrDragScreen') {
    if (state.isPlaying) {
      return { ...state, isPlaying: false };
    }
    return state;
  }

  if (action === 'tapButton') {
    if (state.isPlaying) {
      return { ...state, isPlaying: false, menuOpen: false };
    }
    if (!state.menuOpen) {
      return { ...state, menuOpen: true };
    }
    return { ...state, menuOpen: false, isPlaying: true };
  }

  return state;
}

