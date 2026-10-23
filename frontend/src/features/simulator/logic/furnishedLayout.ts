/**
 * SIM-05 fixed room layouts.
 * Slot x/y coordinates are centres inside INNER_FLOOR_RECT. Slot width is a
 * fraction of the inner floor width. Components do not own room coordinates.
 */

import type { StoredPlacedItem, StoredRoom } from './storage';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { getSlotRect, type FractionRect, type RoomSlot } from './roomLayout.ts';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { getFloorVisibleContentSize, type FloorVisibleContentSize } from './spriteSizing.ts';

export const BACK_WALL_STRIP: FractionRect = { x: 0, y: 0, width: 1, height: 0.18 };
export const INNER_FLOOR_RECT: FractionRect = { x: 0.06, y: 0.20, width: 0.88, height: 0.72 };
export const DOOR_KEEP_OUT_DEPTH = 0.16;
export const DOOR_KEEP_OUT_SIDE_MARGIN = 0.06;
const FIXED_SLOT_SAFE_SCALE = 0.95;

export type Facing = 'up' | 'down' | 'left' | 'right';
export type RoomTemplateId = 'f1-A' | 'f1-B' | 'f1-C' | 'f1-D' | 'f2-A' | 'f2-B' | 'f2-C' | 'f2-D';
export type RoomSide = 'top' | 'right' | 'bottom' | 'left';
export type PlacementKind = 'lean_back' | 'hang_back' | 'lean_right' | 'lean_left';

export interface RoomSlotDefinition {
  type: string;
  spriteKey: string;
  x: number;
  y: number;
  /** Visible-content bottom edge as a fraction of the room. */
  bottom?: number;
  /** Approximate visible-content height used to convert bottom anchors to centres. */
  h?: number;
  /** Top anchor used by wall-edge placement kinds. */
  top?: number;
  w: number;
  facing?: Facing;
  layer?: 'ceiling' | 'floor';
  role?: string;
  rotation?: number;
  itemFacing?: 'front' | 'back';
  placement?: PlacementKind;
}

export interface RoomTemplateDefinition {
  slots: readonly RoomSlotDefinition[];
  clearZones: readonly FractionRect[];
}

type LayoutItemIdentity = Pick<StoredPlacedItem, 'type' | 'spriteKey'> & Pick<Partial<StoredPlacedItem>, 'id' | 'role'>;

const ITEM_SLOT_WIDTHS = {
  air_conditioner: 0.18,
  bed: 0.24,
  fan: 0.08,
  light_bulb: 0.07,
  lights: 0.06,
  refrigerator: 0.15,
  router: 0.10,
  sink: 0.09,
  sofa: 0.24,
  table: 0.12,
  toilet: 0.09,
  tv: 0.15,
  washing_machine: 0.14,
  water_heater: 0.12,
  workplace: 0.18,
} as const;

/** Single source of truth for every default room item position and size. */
export const ROOM_SLOTS: Record<RoomTemplateId, RoomTemplateDefinition> = {
  'f1-A': {
    slots: [
      { type: 'air_conditioner', spriteKey: 'air_conditioner', x: 0.16, y: 0.11, bottom: 0.17, h: 0.12, w: ITEM_SLOT_WIDTHS.air_conditioner, facing: 'down' },
      { type: 'tv', spriteKey: 'tv', x: 0.43, y: 0.21, bottom: 0.30, h: 0.18, w: ITEM_SLOT_WIDTHS.tv, facing: 'down' },
      { type: 'router', spriteKey: 'router', x: 0.86, y: 0.12, bottom: 0.17, h: 0.10, w: ITEM_SLOT_WIDTHS.router, facing: 'down' },
      { type: 'table', spriteKey: 'table', x: 0.48, y: 0.54, bottom: 0.62, h: 0.16, w: ITEM_SLOT_WIDTHS.table, role: 'coffee table' },
      { type: 'sofa', spriteKey: 'sofa', x: 0.48, y: 0.79, bottom: 0.88, h: 0.18, w: ITEM_SLOT_WIDTHS.sofa, facing: 'up', itemFacing: 'back' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.66, y: 0.44, bottom: 0.50, h: 0.12, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
      { type: 'fan', spriteKey: 'fan', x: 0.14, y: 0.83, bottom: 0.94, h: 0.22, w: ITEM_SLOT_WIDTHS.fan },
    ],
    clearZones: [{ x: 0.58, y: 0.36, width: 0.10, height: 0.18 }],
  },
  'f1-B': {
    slots: [
      { type: 'refrigerator', spriteKey: 'refrigerator', x: 0.22, y: 0.39, w: ITEM_SLOT_WIDTHS.refrigerator, facing: 'down', placement: 'lean_back' },
      { type: 'air_conditioner', spriteKey: 'air_conditioner', x: 0.78, y: 0.11, bottom: 0.17, h: 0.12, w: ITEM_SLOT_WIDTHS.air_conditioner, facing: 'down' },
      { type: 'sink', spriteKey: 'sink', x: 0.88, y: 0.50, top: 0.30, w: ITEM_SLOT_WIDTHS.sink, facing: 'down', placement: 'lean_right' },
      { type: 'table', spriteKey: 'table', x: 0.50, y: 0.52, bottom: 0.60, h: 0.16, w: ITEM_SLOT_WIDTHS.table, role: 'kitchen table' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.50, y: 0.66, bottom: 0.72, h: 0.12, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
    ],
    clearZones: [{ x: 0.66, y: 0.50, width: 0.12, height: 0.22 }],
  },
  'f1-C': {
    slots: [
      { type: 'washing_machine', spriteKey: 'washing_machine', x: 0.18, y: 0.39, w: ITEM_SLOT_WIDTHS.washing_machine, facing: 'down', placement: 'lean_back' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.65, y: 0.52, bottom: 0.58, h: 0.12, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
    ], clearZones: [],
  },
  'f1-D': {
    slots: [
      { type: 'water_heater', spriteKey: 'water_heater', x: 0.20, y: 0.055, w: ITEM_SLOT_WIDTHS.water_heater, facing: 'down', placement: 'hang_back' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.52, y: 0.30, bottom: 0.36, h: 0.12, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
      { type: 'toilet', spriteKey: 'toilet', x: 0.22, y: 0.77, bottom: 0.88, h: 0.22, w: ITEM_SLOT_WIDTHS.toilet, facing: 'up' },
      { type: 'sink', spriteKey: 'sink', x: 0.80, y: 0.78, bottom: 0.88, h: 0.20, w: ITEM_SLOT_WIDTHS.sink, facing: 'up' },
    ], clearZones: [],
  },
  'f2-A': {
    slots: [
      { type: 'bed', spriteKey: 'bed', x: 0.24, y: 0.38, w: ITEM_SLOT_WIDTHS.bed, facing: 'down', placement: 'lean_back' },
      { type: 'lights', spriteKey: 'lights', x: 0.44, y: 0.41, bottom: 0.50, h: 0.18, w: ITEM_SLOT_WIDTHS.lights, role: 'bedside right' },
      { type: 'lights', spriteKey: 'lights', x: 0.52, y: 0.41, bottom: 0.50, h: 0.18, w: ITEM_SLOT_WIDTHS.lights, role: 'bedside second' },
      { type: 'air_conditioner', spriteKey: 'air_conditioner', x: 0.82, y: 0.11, bottom: 0.17, h: 0.12, w: ITEM_SLOT_WIDTHS.air_conditioner, facing: 'down' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.54, y: 0.68, bottom: 0.74, h: 0.12, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
    ], clearZones: [{ x: 0.44, y: 0.68, width: 0.12, height: 0.24 }],
  },
  'f2-B': {
    slots: [
      { type: 'bed', spriteKey: 'bed', x: 0.24, y: 0.38, w: ITEM_SLOT_WIDTHS.bed, facing: 'down', placement: 'lean_back' },
      { type: 'lights', spriteKey: 'lights', x: 0.51, y: 0.41, bottom: 0.50, h: 0.18, w: ITEM_SLOT_WIDTHS.lights, role: 'bedside right' },
      { type: 'fan', spriteKey: 'fan', x: 0.86, y: 0.77, bottom: 0.88, h: 0.22, w: ITEM_SLOT_WIDTHS.fan },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.50, y: 0.65, bottom: 0.71, h: 0.12, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
    ], clearZones: [{ x: 0.43, y: 0.54, width: 0.14, height: 0.38 }],
  },
  'f2-C': {
    slots: [
      { type: 'workplace', spriteKey: 'workplace', x: 0.25, y: 0.34, bottom: 0.45, h: 0.22, w: ITEM_SLOT_WIDTHS.workplace, facing: 'down' },
      { type: 'air_conditioner', spriteKey: 'air_conditioner', x: 0.78, y: 0.11, bottom: 0.17, h: 0.12, w: ITEM_SLOT_WIDTHS.air_conditioner, facing: 'down' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.52, y: 0.52, bottom: 0.58, h: 0.12, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
    ], clearZones: [],
  },
  'f2-D': {
    slots: [
      { type: 'water_heater', spriteKey: 'water_heater', x: 0.20, y: 0.055, w: ITEM_SLOT_WIDTHS.water_heater, facing: 'down', placement: 'hang_back' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.55, y: 0.30, bottom: 0.36, h: 0.12, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
      { type: 'toilet', spriteKey: 'toilet', x: 0.26, y: 0.77, bottom: 0.88, h: 0.22, w: ITEM_SLOT_WIDTHS.toilet, facing: 'up' },
      { type: 'sink', spriteKey: 'sink', x: 0.82, y: 0.78, bottom: 0.88, h: 0.20, w: ITEM_SLOT_WIDTHS.sink, facing: 'up' },
    ], clearZones: [],
  },
};
/** PNG canvas and measured non-transparent content bounds. */
export const ITEM_IMAGE_META: Record<string, {
  canvasWidth: number; canvasHeight: number; contentX: number; contentY: number;
  contentWidth: number; contentHeight: number;
}> = {
  air_conditioner: { canvasWidth: 520, canvasHeight: 388, contentX: 100, contentY: 129, contentWidth: 320, contentHeight: 131 },
  refrigerator: { canvasWidth: 520, canvasHeight: 388, contentX: 179, contentY: 56, contentWidth: 162, contentHeight: 279 },
  lights: { canvasWidth: 520, canvasHeight: 388, contentX: 185, contentY: 89, contentWidth: 150, contentHeight: 201 },
  light_bulb: { canvasWidth: 388, canvasHeight: 388, contentX: 116, contentY: 0, contentWidth: 157, contentHeight: 336 },
  tv: { canvasWidth: 520, canvasHeight: 388, contentX: 169, contentY: 108, contentWidth: 182, contentHeight: 164 },
  fan: { canvasWidth: 521, canvasHeight: 388, contentX: 140, contentY: 41, contentWidth: 241, contentHeight: 332 },
  ceiling_fan: { canvasWidth: 520, canvasHeight: 388, contentX: 92, contentY: 92, contentWidth: 336, contentHeight: 190 },
  water_heater: { canvasWidth: 520, canvasHeight: 388, contentX: 169, contentY: 77, contentWidth: 202, contentHeight: 235 },
  workplace: { canvasWidth: 520, canvasHeight: 388, contentX: 114, contentY: 95, contentWidth: 292, contentHeight: 244 },
  bed: { canvasWidth: 520, canvasHeight: 388, contentX: 147, contentY: 112, contentWidth: 227, contentHeight: 164 },
  sofa: { canvasWidth: 520, canvasHeight: 388, contentX: 118, contentY: 116, contentWidth: 284, contentHeight: 156 },
  table: { canvasWidth: 520, canvasHeight: 388, contentX: 129, contentY: 116, contentWidth: 262, contentHeight: 161 },
  sink: { canvasWidth: 520, canvasHeight: 388, contentX: 194, contentY: 101, contentWidth: 133, contentHeight: 200 },
  toilet: { canvasWidth: 520, canvasHeight: 388, contentX: 193, contentY: 91, contentWidth: 134, contentHeight: 216 },
  washing_machine: { canvasWidth: 520, canvasHeight: 388, contentX: 164, contentY: 71, contentWidth: 205, contentHeight: 256 },
  wifi_router: { canvasWidth: 520, canvasHeight: 388, contentX: 137, contentY: 108, contentWidth: 244, contentHeight: 169 },
  router: { canvasWidth: 520, canvasHeight: 388, contentX: 137, contentY: 108, contentWidth: 244, contentHeight: 169 },
};

export const ROOM_DOOR_RATIOS: Record<RoomSlot, Partial<Record<RoomSide, number>>> = {
  A: { right: 0.545, bottom: 0.483 },
  B: { left: 0.545, bottom: 0.833 },
  C: { top: 0.56, right: 0.51 },
  D: { left: 0.51, right: 0.51 },
};

const TYPE_ALIASES: Record<string, string> = {
  aircon: 'air_conditioner', fridge: 'refrigerator', light: 'lights',
  stand_fan: 'fan', shower: 'water_heater', toilet_bin: 'toilet',
  wifi_router: 'router',
};

function canonicalItemType(item: Pick<StoredPlacedItem, 'type' | 'spriteKey'>): string {
  return TYPE_ALIASES[item.type] ?? TYPE_ALIASES[item.spriteKey] ?? item.type ?? item.spriteKey;
}

export function getRoomTemplateId(
  room: Pick<StoredRoom, 'id' | 'name' | 'floor' | 'slot'>,
  _roomItems: readonly Pick<StoredPlacedItem, 'type' | 'spriteKey'>[] = []
): RoomTemplateId {
  const direct = room.id as RoomTemplateId;
  if (ROOM_SLOTS[direct]) return direct;
  return `f${room.floor}-${room.slot}` as RoomTemplateId;
}

export function getRoomSlotDefinition(
  item: LayoutItemIdentity,
  room: Pick<StoredRoom, 'id' | 'name' | 'floor' | 'slot'>,
  roomItems: readonly LayoutItemIdentity[] = []
): RoomSlotDefinition | undefined {
  const type = canonicalItemType(item);
  const matches = ROOM_SLOTS[getRoomTemplateId(room, roomItems)].slots.filter((slot) => slot.type === type);
  const sameTypeItems = roomItems.filter((candidate) => canonicalItemType(candidate) === type);
  const occurrence = item.id ? Math.max(0, sameTypeItems.findIndex((candidate) => candidate.id === item.id)) : 0;
  const roleMatches = item.role ? matches.filter((slot) => slot.role === item.role) : [];
  if (roleMatches[occurrence]) return roleMatches[occurrence];
  return matches[Math.min(occurrence, Math.max(0, matches.length - 1))];
}

function slotLocalCenter(slot: RoomSlotDefinition) {
  return {
    x: slot.x,
    y: slot.bottom !== undefined ? slot.bottom - (slot.h ?? 0) / 2 : slot.y,
  };
}

export interface PlacementResult {
  x: number;
  y: number;
  scale: number;
  visibleWidth: number;
  visibleHeight: number;
  pictureWidth: number;
  pictureHeight: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function placementMetrics(slot: RoomSlotDefinition, planWidth: number): FloorVisibleContentSize {
  const small = slot.spriteKey === 'lights' || slot.spriteKey === 'light_bulb';
  return getFloorVisibleContentSize(slot.spriteKey, planWidth, small);
}

/** Place a visible sprite by its top edge and horizontal centre. */
export function placeLeanBack(
  roomRect: FractionRect,
  requestedX: number,
  metrics: FloorVisibleContentSize,
  planWidth = 390,
  planHeight = 390,
): PlacementResult {
  const roomHeight = roomRect.height * planHeight;
  const innerLeft = (roomRect.x + INNER_FLOOR_RECT.x * roomRect.width) * planWidth;
  const innerRight = (roomRect.x + (INNER_FLOOR_RECT.x + INNER_FLOOR_RECT.width) * roomRect.width) * planWidth;
  const backWall = (roomRect.y + INNER_FLOOR_RECT.y * roomRect.height) * planHeight;
  const gap = roomHeight * 0.01;
  const centerX = clamp(
    (roomRect.x + requestedX * roomRect.width) * planWidth,
    innerLeft + metrics.visibleWidth / 2,
    innerRight - metrics.visibleWidth / 2,
  );
  const centerY = backWall + gap + metrics.visibleHeight / 2;
  return {
    x: centerX / planWidth,
    y: centerY / planHeight,
    scale: 1,
    visibleWidth: metrics.visibleWidth,
    visibleHeight: metrics.visibleHeight,
    pictureWidth: metrics.pictureWidth,
    pictureHeight: metrics.pictureHeight,
  };
}

/** Place a wall sprite by its top edge while keeping the whole picture inside. */
export function placeHangBack(
  roomRect: FractionRect,
  requestedX: number,
  metrics: FloorVisibleContentSize,
  planWidth = 390,
  planHeight = 390,
): PlacementResult {
  const roomHeight = roomRect.height * planHeight;
  const innerLeft = (roomRect.x + INNER_FLOOR_RECT.x * roomRect.width) * planWidth;
  const innerRight = (roomRect.x + (INNER_FLOOR_RECT.x + INNER_FLOOR_RECT.width) * roomRect.width) * planWidth;
  const innerBottom = (roomRect.y + (INNER_FLOOR_RECT.y + INNER_FLOOR_RECT.height) * roomRect.height) * planHeight;
  const backWall = (roomRect.y + INNER_FLOOR_RECT.y * roomRect.height) * planHeight;
  const gap = roomHeight * 0.01;
  // The "whole picture" here means the whole painted picture, including a
  // hanging hose/cable; transparent canvas margins are not geometry.
  const scale = Math.min(1, (innerBottom - (backWall + gap)) / metrics.visibleHeight,
    (innerRight - innerLeft) / metrics.visibleWidth);
  const appliedScale = Math.max(0.8, scale);
  const pictureWidth = metrics.pictureWidth * appliedScale;
  const pictureHeight = metrics.pictureHeight * appliedScale;
  const visibleWidth = metrics.visibleWidth * appliedScale;
  const visibleHeight = metrics.visibleHeight * appliedScale;
  const centerX = clamp(
    (roomRect.x + requestedX * roomRect.width) * planWidth,
    innerLeft + visibleWidth / 2,
    innerRight - visibleWidth / 2,
  );
  const centerY = backWall + gap + visibleHeight / 2;
  return {
    x: centerX / planWidth,
    y: centerY / planHeight,
    scale: appliedScale,
    visibleWidth,
    visibleHeight,
    pictureWidth,
    pictureHeight,
  };
}

/** Place a visible sprite against the right wall with a supplied top anchor. */
export function placeLeanRight(
  roomRect: FractionRect,
  top: number,
  metrics: FloorVisibleContentSize,
  planWidth = 390,
  planHeight = 390,
): PlacementResult {
  const roomWidth = roomRect.width * planWidth;
  const innerRight = (roomRect.x + (INNER_FLOOR_RECT.x + INNER_FLOOR_RECT.width) * roomRect.width) * planWidth;
  const gap = roomWidth * 0.01;
  const centerX = innerRight - gap - metrics.visibleWidth / 2;
  const centerY = (roomRect.y + top * roomRect.height) * planHeight + metrics.visibleHeight / 2;
  return { x: centerX / planWidth, y: centerY / planHeight, scale: 1,
    visibleWidth: metrics.visibleWidth, visibleHeight: metrics.visibleHeight,
    pictureWidth: metrics.pictureWidth, pictureHeight: metrics.pictureHeight };
}

/** Place a visible sprite against the left wall with a supplied top anchor. */
export function placeLeanLeft(
  roomRect: FractionRect,
  top: number,
  metrics: FloorVisibleContentSize,
  planWidth = 390,
  planHeight = 390,
): PlacementResult {
  const roomWidth = roomRect.width * planWidth;
  const innerLeft = (roomRect.x + INNER_FLOOR_RECT.x * roomRect.width) * planWidth;
  const gap = roomWidth * 0.01;
  const centerX = innerLeft + gap + metrics.visibleWidth / 2;
  const centerY = (roomRect.y + top * roomRect.height) * planHeight + metrics.visibleHeight / 2;
  return { x: centerX / planWidth, y: centerY / planHeight, scale: 1,
    visibleWidth: metrics.visibleWidth, visibleHeight: metrics.visibleHeight,
    pictureWidth: metrics.pictureWidth, pictureHeight: metrics.pictureHeight };
}

function placeBedsideLamp(
  room: Pick<StoredRoom, 'slot'>,
  bedSlot: RoomSlotDefinition,
  lampSlot: RoomSlotDefinition,
  occurrence: number,
  planWidth: number,
  planHeight: number,
): PlacementResult {
  const roomRect = getSlotRect(room.slot);
  const bed = placeLeanBack(roomRect, bedSlot.x, placementMetrics(bedSlot, planWidth), planWidth, planHeight);
  const lamp = placementMetrics(lampSlot, planWidth);
  const roomWidth = roomRect.width * planWidth;
  const innerRight = (roomRect.x + (INNER_FLOOR_RECT.x + INNER_FLOOR_RECT.width) * roomRect.width) * planWidth;
  const gap = roomWidth * 0.02;
  const bedCenterX = bed.x * planWidth;
  const bedRight = bedCenterX + bed.visibleWidth / 2;
  const rightCenter = bedRight + gap + lamp.visibleWidth / 2 + occurrence * (lamp.visibleWidth + gap);
  const rightFits = rightCenter + lamp.visibleWidth / 2 <= innerRight;
  const bedLeft = bedCenterX - bed.visibleWidth / 2;
  const leftCenter = bedLeft - gap - lamp.visibleWidth / 2 - occurrence * (lamp.visibleWidth + gap);
  const centerX = rightFits ? rightCenter : leftCenter;
  const bedBottom = bed.y * planHeight + bed.visibleHeight / 2;
  const centerY = bedBottom - lamp.visibleHeight / 2;
  return { x: centerX / planWidth, y: centerY / planHeight, scale: 1,
    visibleWidth: lamp.visibleWidth, visibleHeight: lamp.visibleHeight,
    pictureWidth: lamp.pictureWidth, pictureHeight: lamp.pictureHeight };
}

function getPlacedSlotPoint(
  room: Pick<StoredRoom, 'slot'> & Partial<Pick<StoredRoom, 'id' | 'name' | 'floor'>>,
  slot: RoomSlotDefinition,
  roomItems: readonly LayoutItemIdentity[],
  planWidth: number,
  planHeight: number,
) {
  const roomRect = getSlotRect(room.slot);
  if (slot.placement) {
    const metrics = placementMetrics(slot, planWidth);
    if (slot.placement === 'lean_back') return placeLeanBack(roomRect, slot.x, metrics, planWidth, planHeight);
    if (slot.placement === 'hang_back') {
      const placed = placeHangBack(roomRect, slot.x, metrics, planWidth, planHeight);
      const roomWidth = roomRect.width * planWidth;
      const roomHeight = roomRect.height * planHeight;
      const local = {
        x: (placed.x - roomRect.x) / roomRect.width - (placed.visibleWidth / 2) / roomWidth,
        y: (placed.y - roomRect.y) / roomRect.height - (placed.visibleHeight / 2) / roomHeight,
        width: placed.visibleWidth / roomWidth,
        height: placed.visibleHeight / roomHeight,
      };
      const doorway = getDoorKeepOuts(room.slot, roomWidth, roomHeight).find((zone) => footprintOverlapArea(local, zone) > 0);
      if (doorway) {
        const halfWidth = local.width / 2;
        const roomInnerRight = INNER_FLOOR_RECT.x + INNER_FLOOR_RECT.width;
        const rightCandidate = doorway.x + doorway.width + halfWidth;
        const leftCandidate = doorway.x - halfWidth;
        const localX = rightCandidate + halfWidth <= roomInnerRight ? rightCandidate : leftCandidate;
        return { ...placed, x: (roomRect.x + localX * roomRect.width) };
      }
      return placed;
    }
    if (slot.placement === 'lean_right') return placeLeanRight(roomRect, slot.top ?? slot.y, metrics, planWidth, planHeight);
    return placeLeanLeft(roomRect, slot.top ?? slot.y, metrics, planWidth, planHeight);
  }
  if (slot.type === 'lights' && slot.role?.startsWith('bedside')) {
    const templateId = room.floor ? `f${room.floor}-${room.slot}` as RoomTemplateId : undefined;
    const template = templateId && ROOM_SLOTS[templateId];
    const bedSlot = template?.slots.find((candidate) => candidate.type === 'bed');
    if (bedSlot?.placement === 'lean_back') {
      const occurrence = slot.role === 'bedside second' ? 1 : 0;
      return placeBedsideLamp(room, bedSlot, slot, occurrence, planWidth, planHeight);
    }
  }
  const center = slotLocalCenter(slot);
  return { x: roomRect.x + center.x * roomRect.width, y: roomRect.y + center.y * roomRect.height,
    scale: 1, visibleWidth: 0, visibleHeight: 0, pictureWidth: 0, pictureHeight: 0 };
}

export function getSlotPlanPoint(
  room: Pick<StoredRoom, 'slot'> & Partial<Pick<StoredRoom, 'id' | 'name' | 'floor'>>,
  slot: RoomSlotDefinition,
  roomItems: readonly LayoutItemIdentity[] = [],
  planWidth = 390,
  planHeight = 390,
) {
  const point = getPlacedSlotPoint(room, slot, roomItems, planWidth, planHeight);
  return { x: point.x, y: point.y };
}

export function layoutItemsInRooms(items: StoredPlacedItem[], rooms: StoredRoom[]): StoredPlacedItem[] {
  return items.flatMap((item) => {
    const room = rooms.find((candidate) => candidate.id === item.roomId);
    if (!room?.isSetUp) return [];
    const roomItems = items.filter((candidate) => candidate.roomId === room.id);
    const slot = getRoomSlotDefinition(item, room, roomItems);
    if (!slot) return [];
    const point = getSlotPlanPoint(room, slot, roomItems);
    return [{ ...item, posX: point.x, posY: point.y,
      ...(slot.itemFacing ? { facing: slot.itemFacing } : {}),
      ...(slot.rotation !== undefined ? { rotation: slot.rotation } : {}) }];
  });
}

export interface TidyFloorResult {
  items: StoredPlacedItem[];
  moved: StoredPlacedItem[];
  leftovers: StoredPlacedItem[];
}

/** Re-lay out known items on one floor; unknown items and dark rooms stay put. */
export function tidyFloorItems(items: StoredPlacedItem[], rooms: StoredRoom[], floor: 1 | 2): TidyFloorResult {
  const moved: StoredPlacedItem[] = [];
  const leftovers: StoredPlacedItem[] = [];
  const next = items.map((item) => {
    const room = rooms.find((candidate) => candidate.id === item.roomId);
    if (!room || room.floor !== floor || !room.isSetUp) return item;
    const roomItems = items.filter((candidate) => candidate.roomId === room.id);
    const slot = getRoomSlotDefinition(item, room, roomItems);
    if (!slot) { leftovers.push(item); return item; }
    const point = getSlotPlanPoint(room, slot, roomItems);
    const placed = { ...item, posX: point.x, posY: point.y,
      ...(slot.itemFacing ? { facing: slot.itemFacing } : {}),
      ...(slot.rotation !== undefined ? { rotation: slot.rotation } : {}) };
    if (Math.abs(placed.posX - item.posX) > 0.0001 || Math.abs(placed.posY - item.posY) > 0.0001 || placed.facing !== item.facing) moved.push(placed);
    return placed;
  });
  return { items: next, moved, leftovers };
}

export function getFixedItemDimensions(
  item: Pick<StoredPlacedItem, 'type' | 'spriteKey'>,
  room: Pick<StoredRoom, 'id' | 'name' | 'floor' | 'slot'>,
  roomItems: readonly Pick<StoredPlacedItem, 'type' | 'spriteKey'>[],
  planWidth: number,
  planHeight: number
) {
  const slot = getRoomSlotDefinition(item, room, roomItems);
  const roomRect = getSlotRect(room.slot);
  if (slot?.placement || (slot?.type === 'lights' && slot.role?.startsWith('bedside'))) {
    const placed = getPlacedSlotPoint(room, slot, roomItems, planWidth, planHeight);
    return { width: placed.visibleWidth, height: placed.visibleHeight };
  }
  const meta = ITEM_IMAGE_META[canonicalItemType(item)] ?? {
    canvasWidth: 1, canvasHeight: 1, contentX: 0, contentY: 0, contentWidth: 1, contentHeight: 1,
  };
  // Slot width describes the visible sprite content. Most source PNGs have a
  // large transparent canvas, so size that canvas up enough for the painted
  // pixels to reach the requested room-relative width.
  const requestedWidth = (slot?.w ?? 0.12) * FIXED_SLOT_SAFE_SCALE
    * INNER_FLOOR_RECT.width * roomRect.width * planWidth;
  const center = slot ? slotLocalCenter(slot) : { x: 0.5, y: 0.5 };
  const availableWidth = 2 * Math.min(
    center.x - INNER_FLOOR_RECT.x,
    INNER_FLOOR_RECT.x + INNER_FLOOR_RECT.width - center.x
  ) * roomRect.width * planWidth;
  const availableHeight = 2 * Math.min(
    center.y - INNER_FLOOR_RECT.y,
    INNER_FLOOR_RECT.y + INNER_FLOOR_RECT.height - center.y
  ) * roomRect.height * planHeight;
  const width = Math.min(requestedWidth, availableWidth, availableHeight * meta.contentWidth / meta.contentHeight);
  return { width, height: width * meta.contentHeight / meta.contentWidth };
}

export interface ItemFootprint extends FractionRect { anchorX: number; anchorY: number }

/** Visible painted-content footprint for wall-edge placement/debug checks. */
export function getVisibleContentFootprint(
  item: StoredPlacedItem,
  room: Pick<StoredRoom, 'id' | 'name' | 'floor' | 'slot'>,
  planWidth = 390,
  planHeight = 390,
  roomItems: readonly StoredPlacedItem[] = [item],
): ItemFootprint {
  const roomRect = getSlotRect(room.slot);
  const slot = getRoomSlotDefinition(item, room, roomItems);
  if (slot?.placement || (slot?.type === 'lights' && slot.role?.startsWith('bedside'))) {
    const placed = getPlacedSlotPoint(room, slot, roomItems, planWidth, planHeight);
    // The helper supplies the footprint size (including a possible hang-back
    // shrink), while the persisted row remains the source of the rendered
    // anchor so edit-mode/manual positions are inspected accurately.
    const anchorX = (item.posX - roomRect.x) / roomRect.width;
    const anchorY = (item.posY - roomRect.y) / roomRect.height;
    const width = placed.visibleWidth / (roomRect.width * planWidth);
    const height = placed.visibleHeight / (roomRect.height * planHeight);
    return { x: anchorX - width / 2, y: anchorY - height / 2, width, height, anchorX, anchorY };
  }
  return getItemLocalFootprint(item, room, planWidth, planHeight, roomItems);
}

export function getItemLocalFootprint(
  item: StoredPlacedItem,
  room: Pick<StoredRoom, 'id' | 'name' | 'floor' | 'slot'>,
  planWidth = 390,
  planHeight = 390,
  roomItems: readonly StoredPlacedItem[] = [item]
): ItemFootprint {
  const roomRect = getSlotRect(room.slot);
  const dimensions = getFixedItemDimensions(item, room, roomItems, planWidth, planHeight);
  const centerX = (item.posX - roomRect.x) / roomRect.width;
  const centerY = (item.posY - roomRect.y) / roomRect.height;
  const width = dimensions.width / (roomRect.width * planWidth);
  const height = dimensions.height / (roomRect.height * planHeight);
  return { x: centerX - width / 2, y: centerY - height / 2, width, height, anchorX: centerX, anchorY: centerY };
}

export function getDoorKeepOuts(slot: RoomSlot, roomPixelWidth: number, roomPixelHeight: number): FractionRect[] {
  const doorGapPx = Math.max(24, Math.min(38, Math.min(roomPixelWidth, roomPixelHeight) * 0.24));
  return Object.entries(ROOM_DOOR_RATIOS[slot]).map(([rawSide, ratio]) => {
    const side = rawSide as RoomSide;
    if (side === 'top' || side === 'bottom') {
      const half = doorGapPx / roomPixelWidth / 2 + DOOR_KEEP_OUT_SIDE_MARGIN;
      return { x: Math.max(0, ratio - half), y: side === 'top' ? 0 : 1 - DOOR_KEEP_OUT_DEPTH,
        width: Math.min(1, ratio + half) - Math.max(0, ratio - half), height: DOOR_KEEP_OUT_DEPTH };
    }
    const half = doorGapPx / roomPixelHeight / 2 + DOOR_KEEP_OUT_SIDE_MARGIN;
    return { x: side === 'left' ? 0 : 1 - DOOR_KEEP_OUT_DEPTH, y: Math.max(0, ratio - half),
      width: DOOR_KEEP_OUT_DEPTH, height: Math.min(1, ratio + half) - Math.max(0, ratio - half) };
  });
}

export function footprintOverlapArea(a: FractionRect, b: FractionRect): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

export function isFootprintInside(footprint: FractionRect, bounds: FractionRect): boolean {
  const epsilon = 0.005;
  return footprint.x >= bounds.x - epsilon && footprint.y >= bounds.y - epsilon
    && footprint.x + footprint.width <= bounds.x + bounds.width + epsilon
    && footprint.y + footprint.height <= bounds.y + bounds.height + epsilon;
}

export function getPlacementLayer(item: Pick<StoredPlacedItem, 'type' | 'spriteKey'>): 'floor' | 'ceiling' {
  return canonicalItemType(item) === 'light_bulb' ? 'ceiling' : 'floor';
}

function getDrawRolePriority(item: Pick<StoredPlacedItem, 'category' | 'type' | 'role'>): number {
  if (item.category === 'Furniture') return 0;
  if (item.type === 'lights' || item.role?.startsWith('bedside')) return 1;
  return 2;
}

export function sortItemsForRoom(
  items: StoredPlacedItem[],
  room?: Pick<StoredRoom, 'id' | 'name' | 'floor' | 'slot'>
): StoredPlacedItem[] {
  const getBottomY = (item: StoredPlacedItem) => {
    if (!room) return item.posY;
    const slot = getRoomSlotDefinition(item, room, items);
    if (slot?.placement || (slot?.type === 'lights' && slot.role?.startsWith('bedside'))) {
      const footprint = getVisibleContentFootprint(item, room, 390, 390, items);
      return getSlotRect(room.slot).y + (footprint.y + footprint.height) * getSlotRect(room.slot).height;
    }
    return slot?.bottom === undefined ? item.posY : getSlotRect(room.slot).y + slot.bottom * getSlotRect(room.slot).height;
  };
  return [...items].sort((a, b) => {
    const layerDifference = Number(getPlacementLayer(a) !== 'ceiling') - Number(getPlacementLayer(b) !== 'ceiling');
    if (layerDifference) return layerDifference;
    const bottomDifference = getBottomY(a) - getBottomY(b);
    if (Math.abs(bottomDifference) > 0.0001) return bottomDifference;
    return getDrawRolePriority(a) - getDrawRolePriority(b) || a.posX - b.posX;
  });
}

function pointInRect(point: { x: number; y: number }, rect: FractionRect, padding = 0) {
  return point.x >= rect.x - padding && point.x <= rect.x + rect.width + padding
    && point.y >= rect.y - padding && point.y <= rect.y + rect.height + padding;
}

function clampPointToInner(point: { x: number; y: number }) {
  return { x: Math.max(INNER_FLOOR_RECT.x, Math.min(INNER_FLOOR_RECT.x + INNER_FLOOR_RECT.width, point.x)),
    y: Math.max(INNER_FLOOR_RECT.y, Math.min(INNER_FLOOR_RECT.y + INNER_FLOOR_RECT.height, point.y)) };
}

/** Keeps a freely dragged square item fully inside its room and off the walls. */
export function clampDraggedItemToRoom(
  point: { x: number; y: number },
  room: Pick<StoredRoom, 'slot'>,
  planWidth: number,
  planHeight: number,
  itemSize: number
) {
  const roomRect = getSlotRect(room.slot);
  const halfX = itemSize / Math.max(1, planWidth) / 2;
  const halfY = itemSize / Math.max(1, planHeight) / 2;
  const wallPaddingX = 4 / Math.max(1, planWidth);
  const wallPaddingY = 4 / Math.max(1, planHeight);
  const minX = roomRect.x + halfX + wallPaddingX;
  const maxX = roomRect.x + roomRect.width - halfX - wallPaddingX;
  const minY = roomRect.y + halfY + wallPaddingY;
  const maxY = roomRect.y + roomRect.height - halfY - wallPaddingY;
  return {
    x: minX <= maxX ? Math.max(minX, Math.min(maxX, point.x)) : roomRect.x + roomRect.width / 2,
    y: minY <= maxY ? Math.max(minY, Math.min(maxY, point.y)) : roomRect.y + roomRect.height / 2,
  };
}

/** Return the one standing point in front of an interactive item. */
export function useSpot(
  item: StoredPlacedItem,
  room: StoredRoom,
  roomItems: readonly StoredPlacedItem[] = [item],
  planWidth = 390,
  planHeight = 390
): { x: number; y: number } {
  const slot = getRoomSlotDefinition(item, room, roomItems);
  const footprint = getItemLocalFootprint(item, room, planWidth, planHeight, roomItems);
  const facing = slot?.facing ?? 'down';
  let local = { x: footprint.anchorX, y: footprint.anchorY };
  if (facing === 'up') local.y = footprint.y - 0.07;
  if (facing === 'down') local.y = footprint.y + footprint.height + 0.07;
  if (facing === 'left') local.x = footprint.x - 0.07;
  if (facing === 'right') local.x = footprint.x + footprint.width + 0.07;
  local = clampPointToInner(local);

  const roomRect = getSlotRect(room.slot);
  const doorKeepOuts = getDoorKeepOuts(room.slot, roomRect.width * planWidth, roomRect.height * planHeight);
  const occupied = roomItems.filter((candidate) => candidate.id !== item.id && getPlacementLayer(candidate) !== 'ceiling')
    .map((candidate) => getItemLocalFootprint(candidate, room, planWidth, planHeight, roomItems));
  const isFree = (candidate: { x: number; y: number }) => !doorKeepOuts.some((zone) => pointInRect(candidate, zone, 0.025))
    && !occupied.some((zone) => pointInRect(candidate, zone, 0.035));

  if (!isFree(local)) {
    const origin = local;
    let found: { x: number; y: number } | null = null;
    for (let radius = 1; radius <= 6 && !found; radius += 1) {
      for (let dx = -radius; dx <= radius && !found; dx += 1) {
        for (const dy of [-radius, radius]) {
          const candidate = clampPointToInner({ x: origin.x + dx * 0.04, y: origin.y + dy * 0.04 });
          if (isFree(candidate)) { found = candidate; break; }
        }
      }
      for (let dy = -radius + 1; dy < radius && !found; dy += 1) {
        for (const dx of [-radius, radius]) {
          const candidate = clampPointToInner({ x: origin.x + dx * 0.04, y: origin.y + dy * 0.04 });
          if (isFree(candidate)) { found = candidate; break; }
        }
      }
    }
    if (found) local = found;
  }

  return { x: roomRect.x + local.x * roomRect.width, y: roomRect.y + local.y * roomRect.height };
}
