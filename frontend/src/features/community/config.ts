/**
 * Eco-Habit App Constants & Configuration
 */

export const DEED_POINTS = 10;
export const MAX_DEEDS_PER_DAY = 2;
export const HIT_THRESHOLD = 30;
export const COMMUNITY_GOAL = 60; // 60% of households hitting the threshold
export const RESTORE_COST = 200; // 200 recycling points
export const RECYCLE_ITEM_POINTS = 10; // +10 per cleanly sorted item

export const COMMUNITY_WRAPUP_CONFIG = {
  MIN_DEEDS_PER_USER: HIT_THRESHOLD,
  REWARD_THRESHOLD_PCT: COMMUNITY_GOAL,
  DEED_POINTS,
  MAX_DEEDS_PER_DAY,
  RESTORE_COST,
  RECYCLE_ITEM_POINTS,
} as const;
