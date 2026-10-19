/**
 * SIM-06
 * Pure logic for resident avatar placement, poses, and home look styling.
 * Source: docs/design.md Unit 12 §3a & §3b, docs/Feature_Requirements.md SIM-06.
 *
 * Rules:
 * - Avatar poses: stand, walk, sit (TV), lie (sleep), cook (kitchen), shower (bathroom).
 * - Room coordinates in normalized canvas space (0–1).
 * - Away status: avatar walks to front door, soft stone-100 layer, "Energy saving" pill.
 * - Backdrop color transitions according to time of day.
 */

import { RoutineBlock, timeToMinutes } from './myDayLogic';

export type AvatarPose = 'stand' | 'walk' | 'sit' | 'lie' | 'cook' | 'shower';

export interface AvatarState {
  roomId: string;
  pose: AvatarPose;
  normalizedPos: { x: number; y: number };
  isAway: boolean;
  awayLabel?: string;
  isEnergySaving: boolean;
  activeApplianceIds: string[];
}

export const ROOM_AVATAR_POSITIONS: Record<string, { x: number; y: number }> = {
  living: { x: 0.32, y: 0.35 },
  kitchen: { x: 0.72, y: 0.32 },
  bedroom: { x: 0.32, y: 0.72 },
  bathroom: { x: 0.75, y: 0.72 },
};

/**
 * Determines avatar state and pose based on active routine block and current time.
 */
export function getAvatarState(
  activeBlock: RoutineBlock | null,
  isAwayOverride = false
): AvatarState {
  if (isAwayOverride || activeBlock?.isAway) {
    return {
      roomId: 'living',
      pose: 'walk',
      normalizedPos: { x: 0.5, y: 0.92 }, // near front door
      isAway: true,
      awayLabel: 'Out • back at 17:30',
      isEnergySaving: true,
      activeApplianceIds: ['fridge1'], // only always-on appliances
    };
  }

  if (!activeBlock) {
    return {
      roomId: 'living',
      pose: 'stand',
      normalizedPos: ROOM_AVATAR_POSITIONS.living,
      isAway: false,
      isEnergySaving: false,
      activeApplianceIds: [],
    };
  }

  let pose: AvatarPose = 'stand';
  if (activeBlock.iconType === 'sleep') {
    pose = 'lie';
  } else if (activeBlock.iconType === 'shower') {
    pose = 'shower';
  } else if (activeBlock.iconType === 'meal') {
    pose = 'cook';
  } else if (activeBlock.iconType === 'evening') {
    pose = 'sit';
  }

  const roomPos = ROOM_AVATAR_POSITIONS[activeBlock.roomId] ?? ROOM_AVATAR_POSITIONS.living;

  return {
    roomId: activeBlock.roomId,
    pose,
    normalizedPos: roomPos,
    isAway: false,
    isEnergySaving: false,
    activeApplianceIds: activeBlock.applianceIds,
  };
}

/**
 * Returns canvas backdrop color based on current time (HH:MM).
 * Source: design.md Unit 12 §3b
 */
export function getBackdropColorForTime(timeStr: string): string {
  const m = timeToMinutes(timeStr);
  const m0700 = 7 * 60;
  const m0900 = 9 * 60;
  const m1700 = 17 * 60;
  const m1900 = 19 * 60;

  if (m >= m0700 && m < m0900) {
    return '#f6e8d8'; // tan-100 (morning glow)
  }
  if (m >= m0900 && m < m1700) {
    return '#faf6f1'; // cream (daytime daylight)
  }
  if (m >= m1700 && m < m1900) {
    return 'rgba(230, 195, 155, 0.4)'; // tan-300 at 40% (dusk)
  }
  return '#d6d3d1'; // stone-300 (night warm gray)
}
