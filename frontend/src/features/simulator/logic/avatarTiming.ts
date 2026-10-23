/** Pure timing rules shared by normal simulation and every fast-forward horizon. */
import type { Point } from './SimulationEngine';

/** One steady plan-space walking speed for normal mode and every reel. */
export const AVATAR_SPEED = 0.45;
export const AVATAR_USE_HOLD_MS = 2500;
export const STAIR_FADE_OUT_MS = 200;
export const STAIR_CROSS_FADE_MS = 400;

export function pathLength(points: readonly Point[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
  }
  return length;
}

export function walkTimeMs(points: readonly Point[], speed = AVATAR_SPEED): number {
  return speed <= 0 ? 0 : pathLength(points) / speed * 1000;
}

export function routeTimeMs(paths: readonly (readonly Point[])[], changesFloor: boolean): number {
  const walking = paths.reduce((total, points) => total + walkTimeMs(points), 0);
  const stairs = changesFloor ? STAIR_FADE_OUT_MS + STAIR_CROSS_FADE_MS : 0;
  return walking + stairs;
}

export function reelSegmentDurationMs(paths: readonly (readonly Point[])[], changesFloor: boolean): number {
  return routeTimeMs(paths, changesFloor) + AVATAR_USE_HOLD_MS;
}

export function hasHeldUsePose(arrivedAtMs: number | null, nowMs: number): boolean {
  return arrivedAtMs !== null && nowMs - arrivedAtMs >= AVATAR_USE_HOLD_MS;
}
