/**
 * SIM-05 fixed room layouts.
 * Slot x/y coordinates are centres inside INNER_FLOOR_RECT. Slot width is a
 * fraction of the inner floor width. Components do not own room coordinates.
 */

import type { StoredPlacedItem, StoredRoom } from './storage';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { getSlotRect, type FractionRect, type RoomSlot } from './roomLayout.ts';

export const BACK_WALL_STRIP: FractionRect = { x: 0, y: 0, width: 1, height: 0.18 };
export const INNER_FLOOR_RECT: FractionRect = { x: 0.06, y: 0.20, width: 0.88, height: 0.72 };
export const DOOR_KEEP_OUT_DEPTH = 0.16;
export const DOOR_KEEP_OUT_SIDE_MARGIN = 0.06;
const FIXED_SLOT_SAFE_SCALE = 0.95;

export type Facing = 'up' | 'down' | 'left' | 'right';
export type RoomTemplateId = 'f1-A' | 'f1-B' | 'f1-C' | 'f1-D' | 'f2-A' | 'f2-B' | 'f2-C' | 'f2-D';
export type RoomSide = 'top' | 'right' | 'bottom' | 'left';

export interface RoomSlotDefinition {
  type: string;
  spriteKey: string;
  x: number;
  y: number;
  w: number;
  facing?: Facing;
  layer?: 'ceiling' | 'floor';
  role?: string;
  rotation?: number;
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
      { type: 'air_conditioner', spriteKey: 'air_conditioner', x: 0.17, y: 0.07, w: ITEM_SLOT_WIDTHS.air_conditioner, facing: 'down' },
      { type: 'tv', spriteKey: 'tv', x: 0.45, y: 0.10, w: ITEM_SLOT_WIDTHS.tv, facing: 'down' },
      { type: 'router', spriteKey: 'router', x: 0.84, y: 0.08, w: ITEM_SLOT_WIDTHS.router, facing: 'down' },
      { type: 'table', spriteKey: 'table', x: 0.47, y: 0.40, w: ITEM_SLOT_WIDTHS.table, role: 'coffee table' },
      { type: 'sofa', spriteKey: 'sofa', x: 0.47, y: 0.62, w: ITEM_SLOT_WIDTHS.sofa, facing: 'up', rotation: 180 },
      { type: 'table', spriteKey: 'table', x: 0.22, y: 0.74, w: ITEM_SLOT_WIDTHS.table, role: 'side table left' },
      { type: 'table', spriteKey: 'table', x: 0.78, y: 0.74, w: ITEM_SLOT_WIDTHS.table, role: 'side table right' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.47, y: 0.78, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
      { type: 'fan', spriteKey: 'fan', x: 0.14, y: 0.86, w: ITEM_SLOT_WIDTHS.fan },
    ],
    clearZones: [{ x: 0.58, y: 0.36, width: 0.10, height: 0.18 }],
  },
  'f1-B': {
    slots: [
      { type: 'refrigerator', spriteKey: 'refrigerator', x: 0.21, y: 0.15, w: ITEM_SLOT_WIDTHS.refrigerator, facing: 'down' },
      { type: 'air_conditioner', spriteKey: 'air_conditioner', x: 0.72, y: 0.07, w: ITEM_SLOT_WIDTHS.air_conditioner, facing: 'down' },
      { type: 'table', spriteKey: 'table', x: 0.78, y: 0.16, w: ITEM_SLOT_WIDTHS.table, facing: 'down', role: 'counter' },
      { type: 'table', spriteKey: 'table', x: 0.50, y: 0.70, w: ITEM_SLOT_WIDTHS.table, role: 'dining' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.40, y: 0.55, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
      { type: 'sink', spriteKey: 'sink', x: 0.80, y: 0.52, w: ITEM_SLOT_WIDTHS.sink, facing: 'up' },
    ],
    clearZones: [{ x: 0.43, y: 0.25, width: 0.14, height: 0.28 }],
  },
  'f1-C': {
    slots: [
      { type: 'washing_machine', spriteKey: 'washing_machine', x: 0.25, y: 0.14, w: ITEM_SLOT_WIDTHS.washing_machine, facing: 'down' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.58, y: 0.52, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
    ],
    clearZones: [],
  },
  'f1-D': {
    slots: [
      { type: 'water_heater', spriteKey: 'water_heater', x: 0.74, y: 0.12, w: ITEM_SLOT_WIDTHS.water_heater, facing: 'down' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.50, y: 0.52, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
      { type: 'toilet', spriteKey: 'toilet', x: 0.22, y: 0.78, w: ITEM_SLOT_WIDTHS.toilet, facing: 'up' },
      { type: 'sink', spriteKey: 'sink', x: 0.82, y: 0.78, w: ITEM_SLOT_WIDTHS.sink, facing: 'up' },
    ],
    clearZones: [],
  },
  'f2-A': {
    slots: [
      { type: 'bed', spriteKey: 'bed', x: 0.25, y: 0.22, w: ITEM_SLOT_WIDTHS.bed, facing: 'down' },
      { type: 'lights', spriteKey: 'lights', x: 0.57, y: 0.12, w: ITEM_SLOT_WIDTHS.lights, role: 'bedside left' },
      { type: 'lights', spriteKey: 'lights', x: 0.68, y: 0.12, w: ITEM_SLOT_WIDTHS.lights, role: 'bedside right' },
      { type: 'air_conditioner', spriteKey: 'air_conditioner', x: 0.82, y: 0.07, w: ITEM_SLOT_WIDTHS.air_conditioner, facing: 'down' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.50, y: 0.60, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
      { type: 'fan', spriteKey: 'fan', x: 0.85, y: 0.78, w: ITEM_SLOT_WIDTHS.fan },
    ],
    clearZones: [{ x: 0.44, y: 0.68, width: 0.12, height: 0.24 }],
  },
  'f2-B': {
    slots: [
      { type: 'air_conditioner', spriteKey: 'air_conditioner', x: 0.20, y: 0.07, w: ITEM_SLOT_WIDTHS.air_conditioner, facing: 'down' },
      { type: 'bed', spriteKey: 'bed', x: 0.36, y: 0.30, w: ITEM_SLOT_WIDTHS.bed, facing: 'down' },
      { type: 'lights', spriteKey: 'lights', x: 0.16, y: 0.38, w: ITEM_SLOT_WIDTHS.lights, role: 'bedside left' },
      { type: 'lights', spriteKey: 'lights', x: 0.56, y: 0.38, w: ITEM_SLOT_WIDTHS.lights, role: 'bedside right' },
      { type: 'workplace', spriteKey: 'workplace', x: 0.78, y: 0.26, w: ITEM_SLOT_WIDTHS.workplace, facing: 'down' },
      { type: 'fan', spriteKey: 'fan', x: 0.86, y: 0.80, w: ITEM_SLOT_WIDTHS.fan },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.48, y: 0.60, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
    ],
    clearZones: [{ x: 0.43, y: 0.54, width: 0.14, height: 0.38 }],
  },
  'f2-C': {
    slots: [
      { type: 'workplace', spriteKey: 'workplace', x: 0.26, y: 0.12, w: ITEM_SLOT_WIDTHS.workplace, facing: 'down' },
      { type: 'air_conditioner', spriteKey: 'air_conditioner', x: 0.70, y: 0.07, w: ITEM_SLOT_WIDTHS.air_conditioner, facing: 'down' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.55, y: 0.50, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
    ],
    clearZones: [],
  },
  'f2-D': {
    slots: [
      { type: 'water_heater', spriteKey: 'water_heater', x: 0.40, y: 0.12, w: ITEM_SLOT_WIDTHS.water_heater, facing: 'down' },
      { type: 'light_bulb', spriteKey: 'light_bulb', x: 0.58, y: 0.42, w: ITEM_SLOT_WIDTHS.light_bulb, layer: 'ceiling' },
      { type: 'toilet', spriteKey: 'toilet', x: 0.26, y: 0.77, w: ITEM_SLOT_WIDTHS.toilet, facing: 'up' },
      { type: 'sink', spriteKey: 'sink', x: 0.83, y: 0.78, w: ITEM_SLOT_WIDTHS.sink, facing: 'up' },
    ],
    clearZones: [],
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
  const roleMatch = item.role ? matches.find((slot) => slot.role === item.role) : undefined;
  if (roleMatch) return roleMatch;
  const sameTypeItems = roomItems.filter((candidate) => canonicalItemType(candidate) === type);
  const occurrence = item.id ? Math.max(0, sameTypeItems.findIndex((candidate) => candidate.id === item.id)) : 0;
  return matches[Math.min(occurrence, Math.max(0, matches.length - 1))];
}

function slotLocalCenter(slot: RoomSlotDefinition) {
  return {
    x: INNER_FLOOR_RECT.x + slot.x * INNER_FLOOR_RECT.width,
    y: INNER_FLOOR_RECT.y + slot.y * INNER_FLOOR_RECT.height,
  };
}

export function getSlotPlanPoint(room: Pick<StoredRoom, 'slot'>, slot: RoomSlotDefinition) {
  const roomRect = getSlotRect(room.slot);
  const center = slotLocalCenter(slot);
  return { x: roomRect.x + center.x * roomRect.width, y: roomRect.y + center.y * roomRect.height };
}

export function layoutItemsInRooms(items: StoredPlacedItem[], rooms: StoredRoom[]): StoredPlacedItem[] {
  return items.flatMap((item) => {
    const room = rooms.find((candidate) => candidate.id === item.roomId);
    if (!room?.isSetUp) return [];
    const roomItems = items.filter((candidate) => candidate.roomId === room.id);
    const slot = getRoomSlotDefinition(item, room, roomItems);
    if (!slot) return [];
    const point = getSlotPlanPoint(room, slot);
    return [{ ...item, posX: point.x, posY: point.y,
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
    const point = getSlotPlanPoint(room, slot);
    const placed = { ...item, posX: point.x, posY: point.y,
      ...(slot.rotation !== undefined ? { rotation: slot.rotation } : {}) };
    if (Math.abs(placed.posX - item.posX) > 0.0001 || Math.abs(placed.posY - item.posY) > 0.0001) moved.push(placed);
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

export function sortItemsForRoom(items: StoredPlacedItem[]): StoredPlacedItem[] {
  return [...items].sort((a, b) => {
    const layerDifference = Number(getPlacementLayer(a) !== 'ceiling') - Number(getPlacementLayer(b) !== 'ceiling');
    return layerDifference || a.posY - b.posY;
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
