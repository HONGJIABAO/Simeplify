/**
 * Simulation Engine for Simeplify
 * Manages simulated time, routine progression, avatar movement via hallway waypoints,
 * on/off appliance state calculation, and live monthly bill updates.
 */

import { DEFAULT_ROUTINE, RoutineItem, STAR_EFFICIENCY_FACTORS, USAGE_THRESHOLDS } from './routineConfig';
import { StoredPlacedItem, StoredRoom } from './storage';
import { calcBillFromKwh } from './billCalc';

export interface Point {
  x: number;
  y: number;
}

export interface AvatarSimulationState {
  currentX: number; // 0 to 1 normalized
  currentY: number; // 0 to 1 normalized
  facingLeft: boolean;
  isWalking: boolean;
  isSleeping: boolean;
  currentRoomId: string | null;
  targetRoomId: string | null;
  currentActivity: string;
}

export interface EngineTickResult {
  simulatedMinutes: number;
  timeString: string;
  avatarState: AvatarSimulationState;
  activeApplianceIds: string[];
  activeRoomLightIds: string[]; // roomIds where lights are currently ON
  totalKwh: number;
  monthlyBillRm: number;
  usageBadge: 'Low Usage' | 'Normal Usage' | 'High Usage';
}

/** Hallway and doorway waypoints for 4-room layout (0-1 normalized coordinates) */
export const ROOM_DOORWAYS: Record<string, Point> = {
  living: { x: 0.38, y: 0.48 },
  kitchen: { x: 0.62, y: 0.48 },
  bedroom: { x: 0.48, y: 0.68 },
  bathroom: { x: 0.52, y: 0.68 },
};

export const HALLWAY_INTERSECTION: Point = { x: 0.50, y: 0.50 };

export function formatTimeMinutes(minutes: number): string {
  const m = Math.floor(minutes) % 1440;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Find current routine item based on simulated minutes (0-1439)
 */
export function getCurrentRoutine(
  minutes: number,
  routine: RoutineItem[] = DEFAULT_ROUTINE
): RoutineItem {
  const currentMin = Math.floor(minutes) % 1440;

  for (const item of routine) {
    const start = parseTimeToMinutes(item.startTime);
    const end = parseTimeToMinutes(item.endTime);

    if (start <= end) {
      if (currentMin >= start && currentMin < end) {
        return item;
      }
    } else {
      // Overnight block (e.g. 23:00 to 07:00)
      if (currentMin >= start || currentMin < end) {
        return item;
      }
    }
  }

  return routine[0];
}

/**
 * Get the target center position for a room
 */
export function getRoomCenter(room: StoredRoom): Point {
  const cx = (room.gridCol + room.gridColSpan * 0.5) / 4;
  const cy = (room.gridRow + room.gridRowSpan * 0.5) / 4;
  return { x: cx, y: cy };
}

/**
 * Build waypoints array from start to end position across rooms
 */
export function buildWaypoints(
  fromPos: Point,
  fromRoomId: string | null,
  toPos: Point,
  toRoomId: string | null
): Point[] {
  if (!fromRoomId || !toRoomId || fromRoomId === toRoomId) {
    return [toPos];
  }

  const fromDoor = ROOM_DOORWAYS[fromRoomId] || fromPos;
  const toDoor = ROOM_DOORWAYS[toRoomId] || toPos;

  return [
    fromDoor,
    HALLWAY_INTERSECTION,
    toDoor,
    toPos,
  ];
}

/**
 * Compute monthly bill & usage from placed appliances
 */
export function computeSimulationBill(appliances: StoredPlacedItem[]): {
  totalKwh: number;
  monthlyBillRm: number;
  usageBadge: 'Low Usage' | 'Normal Usage' | 'High Usage';
} {
  const appList = appliances.filter((item) => item.category === 'Appliances');
  if (appList.length === 0) {
    return {
      totalKwh: 0,
      monthlyBillRm: 0,
      usageBadge: 'High Usage', // Default from screenshot 1
    };
  }

  let totalMonthlyKwh = 0;

  for (const app of appList) {
    const wattage = app.wattage || 100;
    const hours = app.alwaysOn ? 24 : app.hoursPerDay || 6;
    const starRating = app.stars || 3;
    const starFactor = STAR_EFFICIENCY_FACTORS[starRating] || 1.0;

    // Monthly kWh = (W * h / 1000) * 30 * efficiency
    const kwh = (wattage * hours / 1000) * 30 * starFactor;
    totalMonthlyKwh += kwh;
  }

  const monthlyBillRm = calcBillFromKwh(totalMonthlyKwh);

  let usageBadge: 'Low Usage' | 'Normal Usage' | 'High Usage' = 'High Usage';
  if (monthlyBillRm < USAGE_THRESHOLDS.LOW_RM) {
    usageBadge = 'Low Usage';
  } else if (monthlyBillRm <= USAGE_THRESHOLDS.HIGH_RM) {
    usageBadge = 'Normal Usage';
  } else {
    usageBadge = 'High Usage';
  }

  return {
    totalKwh: Math.round(totalMonthlyKwh),
    monthlyBillRm: Math.round(monthlyBillRm),
    usageBadge,
  };
}
