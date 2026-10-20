/**
 * SIM-05, SIM-06
 * Pure, responsive floor-plan geometry for both simulator floors.
 */

export type FloorNumber = 1 | 2;
export type RoomSlot = 'A' | 'B' | 'C' | 'D';

export interface FractionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorRoomRect extends FractionRect {
  kind: 'room';
  slot: RoomSlot;
}

export interface StairRect extends FractionRect {
  kind: 'stair';
}

export interface FloorPlanLayout {
  floor: FloorNumber;
  rooms: FloorRoomRect[];
  stair: StairRect;
}

const ROOM_RECTS: Record<RoomSlot, FractionRect> = {
  A: { x: 0, y: 0, width: 0.58, height: 0.55 },
  B: { x: 0.58, y: 0, width: 0.42, height: 0.55 },
  C: { x: 0, y: 0.55, width: 0.5, height: 0.45 },
  D: { x: 0.5, y: 0.55, width: 0.36, height: 0.45 },
};

export const STAIR_RECT: StairRect = {
  kind: 'stair',
  x: 0.86,
  y: 0.55,
  width: 0.14,
  height: 0.45,
};

export const STAIR_CENTER = {
  x: STAIR_RECT.x + STAIR_RECT.width / 2,
  y: STAIR_RECT.y + STAIR_RECT.height / 2,
};

export function getFloorPlanLayout(floor: FloorNumber): FloorPlanLayout {
  return {
    floor,
    rooms: (Object.entries(ROOM_RECTS) as [RoomSlot, FractionRect][]).map(
      ([slot, rect]) => ({ kind: 'room' as const, slot, ...rect })
    ),
    stair: { ...STAIR_RECT },
  };
}

export function getSlotRect(slot: RoomSlot): FractionRect {
  return { ...ROOM_RECTS[slot] };
}

export function containsPoint(rect: FractionRect, x: number, y: number): boolean {
  return x >= rect.x
    && x <= rect.x + rect.width
    && y >= rect.y
    && y <= rect.y + rect.height;
}

export function rectanglesOverlap(a: FractionRect, b: FractionRect): boolean {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

export function clampPointToRect(
  rect: FractionRect,
  point: { x: number; y: number },
  marginX = 0,
  marginY = 0
): { x: number; y: number } {
  const minX = rect.x + Math.min(marginX, rect.width / 2);
  const maxX = rect.x + rect.width - Math.min(marginX, rect.width / 2);
  const minY = rect.y + Math.min(marginY, rect.height / 2);
  const maxY = rect.y + rect.height - Math.min(marginY, rect.height / 2);
  return {
    x: Math.max(minX, Math.min(maxX, point.x)),
    y: Math.max(minY, Math.min(maxY, point.y)),
  };
}

export function canRoomHoldItems(room: { isSetUp: boolean }): boolean {
  return room.isSetUp;
}

