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
  shouldWalk: boolean;
}

// TODO(open-item): replace keyword matching when routine blocks store a stable activity kind.
export const BLOCK_PRIMARY_ITEM = {
  watchingTv: 'sofa',
  shower: 'water_heater',
  breakfastOrKitchen: 'refrigerator',
  laundry: 'washing_machine',
  workingOrStudying: 'workplace',
  chargingPhone: null,
  sleeping: 'bed',
  fallback: null,
} as const;

function itemType(item: Pick<StoredPlacedItem, 'type' | 'spriteKey'>) {
  return item.type || item.spriteKey;
}

/** Resolve legacy fixture references (for example f1-fridge-kitchen) to the
 * persisted appliance type used by the logged-in household. */
function referenceType(reference: string): string | null {
  const value = reference.toLowerCase();
  if (value.includes('fridge') || value.includes('refrigerator')) return 'refrigerator';
  if (value.includes('washing') || value.includes('washer')) return 'washing_machine';
  if (value.includes('shower') || value.includes('water_heater') || value.includes('heater')) return 'water_heater';
  if (value.includes('aircon') || value.includes('air_conditioner') || value.includes('ac-')) return 'air_conditioner';
  if (value.includes('workplace') || value.includes('desk')) return 'workplace';
  if (value.includes('router') || value.includes('wifi')) return 'router';
  if (value.includes('tv') || value.includes('television')) return 'tv';
  if (value.includes('fan')) return 'fan';
  if (value.includes('lamp')) return 'lights';
  if (value.includes('bulb') || value.includes('light')) return 'light_bulb';
  return null;
}

function matchesApplianceReference(item: StoredPlacedItem, references: Set<string>): boolean {
  if (references.has(item.id) || references.has(item.type) || references.has(item.spriteKey)) return true;
  return [...references].some((reference) => referenceType(reference) === itemType(item));
}

function roomCenter(room: Pick<StoredRoom, 'slot'>) {
  const rect = getSlotRect(room.slot);
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * Resolves one final use target for an active block. The Simulator's existing
 * walk graph supplies the doorway/stair route to this point.
 */
export function resolveAvatarPlacement(
  block: Pick<RoutineBlock, 'name' | 'iconType' | 'applianceIds' | 'avatarWalks'>,
  room: StoredRoom,
  roomItems: StoredPlacedItem[]
): AvatarPlacement {
  const activity = block.name.toLowerCase();
  const isTv = activity.includes('tv') || activity.includes('watching');
  const isLivingEvening = activity.includes('living') || activity.includes('evening');
  const isShower = block.iconType === 'shower' || activity.includes('shower');
  const isWork = activity.includes('working') || activity.includes('studying') || activity.includes('work');
  const isCharging = activity.includes('charging phone') || block.avatarWalks === false;
  const isSleeping = block.iconType === 'sleep' || activity.includes('sleep');
  const isKitchen = block.iconType === 'meal' || activity.includes('breakfast') || activity.includes('cooking') || activity.includes('kitchen');
  const isLaundry = activity.includes('laundry') || activity.includes('washing clothes');

  const selectedIds = new Set(block.applianceIds);
  let active = roomItems.filter((item) => item.category === 'Appliances'
    && matchesApplianceReference(item, selectedIds)).map((item) => item.id);
  const defaultTypes = isTv || isLivingEvening
      ? new Set(['tv', 'lights', 'light_bulb', 'air_conditioner'])
      : isShower
        ? new Set(['water_heater'])
        : isKitchen
          ? new Set(['refrigerator'])
          : isLaundry
            ? new Set(['washing_machine'])
        : isWork || isCharging
          ? new Set(['workplace'])
          : new Set<string>();
  const contextual = roomItems.filter((item) => item.category === 'Appliances' && defaultTypes.has(itemType(item))).map((item) => item.id);
  active = [...new Set([...active, ...contextual])];

  let interactionItem: StoredPlacedItem | undefined;
  if (isTv || isLivingEvening) interactionItem = roomItems.find((item) => itemType(item) === BLOCK_PRIMARY_ITEM.watchingTv);
  else if (isShower) interactionItem = roomItems.find((item) => itemType(item) === BLOCK_PRIMARY_ITEM.shower);
  else if (isKitchen) interactionItem = roomItems.find((item) => itemType(item) === BLOCK_PRIMARY_ITEM.breakfastOrKitchen);
  else if (isLaundry) interactionItem = roomItems.find((item) => itemType(item) === BLOCK_PRIMARY_ITEM.laundry);
  else if (isWork && !isCharging) interactionItem = roomItems.find((item) => itemType(item) === BLOCK_PRIMARY_ITEM.workingOrStudying);
  else if (isSleeping) interactionItem = roomItems.find((item) => itemType(item) === BLOCK_PRIMARY_ITEM.sleeping);

  const target = interactionItem ? getItemUseSpot(interactionItem, room, roomItems) : roomCenter(room);
  return {
    target,
    activeApplianceIds: active,
    interactionItemId: interactionItem?.id ?? null,
    facingLeft: interactionItem ? target.x > interactionItem.posX : false,
    pose: 'stand',
    shouldWalk: !isCharging && block.avatarWalks !== false,
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
