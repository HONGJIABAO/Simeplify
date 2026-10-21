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

// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { timeToMinutes } from './myDayLogic.ts';
import type { RoutineBlock } from './myDayLogic';
import type { StoredPlacedItem, StoredRoom } from './storage';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { useSpot as getItemUseSpot } from './furnishedLayout.ts';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { getSlotRect } from './roomLayout.ts';

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

export interface AvatarPlacement {
  target: { x: number; y: number };
  activeApplianceIds: string[];
  interactionItemId: string | null;
  facingLeft: boolean;
  pose: 'stand';
}

function itemType(item: Pick<StoredPlacedItem, 'type' | 'spriteKey'>) {
  return item.type || item.spriteKey;
}

function roomCenter(room: Pick<StoredRoom, 'slot'>) {
  const rect = getSlotRect(room.slot);
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * Resolves one target for an active block. There is no intermediate route:
 * the Simulator moves straight toward this point and then remains still.
 */
export function resolveAvatarPlacement(
  block: Pick<RoutineBlock, 'name' | 'iconType' | 'applianceIds' | 'avatarWalks'>,
  room: StoredRoom,
  roomItems: StoredPlacedItem[]
): AvatarPlacement {
  const activity = block.name.toLowerCase();
  const isTv = activity.includes('tv') || activity.includes('watching');
  const isShower = block.iconType === 'shower' || activity.includes('shower');
  const isWork = activity.includes('working') || activity.includes('studying') || activity.includes('work');
  const isCharging = activity.includes('charging phone') || block.avatarWalks === false;
  const isSleeping = block.iconType === 'sleep' || activity.includes('sleep');

  const selectedIds = new Set(block.applianceIds);
  let active = roomItems.filter((item) => item.category === 'Appliances'
    && (selectedIds.has(item.id) || selectedIds.has(item.type))).map((item) => item.id);
  if (active.length === 0) {
    const defaultTypes = isTv
      ? new Set(['tv', 'lights', 'light_bulb', 'air_conditioner'])
      : isShower
        ? new Set(['water_heater'])
        : isWork || isCharging
          ? new Set(['workplace'])
          : new Set<string>();
    active = roomItems.filter((item) => item.category === 'Appliances' && defaultTypes.has(itemType(item))).map((item) => item.id);
  }

  let interactionItem: StoredPlacedItem | undefined;
  if (isTv) interactionItem = roomItems.find((item) => itemType(item) === 'sofa');
  else if (isShower) interactionItem = roomItems.find((item) => itemType(item) === 'water_heater');
  else if (isWork && !isCharging) interactionItem = roomItems.find((item) => itemType(item) === 'workplace');
  else if (isSleeping) interactionItem = roomItems.find((item) => itemType(item) === 'bed');

  const target = interactionItem ? getItemUseSpot(interactionItem, room, roomItems) : roomCenter(room);
  return {
    target,
    activeApplianceIds: active,
    interactionItemId: interactionItem?.id ?? null,
    facingLeft: interactionItem ? target.x > interactionItem.posX : false,
    pose: 'stand',
  };
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

  const roomPos = ROOM_AVATAR_POSITIONS[activeBlock.roomId] ?? ROOM_AVATAR_POSITIONS.living;

  return {
    roomId: activeBlock.roomId,
    pose: 'stand',
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
