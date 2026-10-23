/**
 * Simulator <-> Scanner Data Integration Bridge
 *
 * Bridges the user's Simulator inventory (appliances, rooms, routine blocks)
 * with the Bill Scanner for personalized, routine-based AI analysis.
 */

// @ts-ignore
import { loadLayoutState, loadRoutineBlocks, type StoredPlacedItem, type StoredRoom } from './storage.ts';
// @ts-ignore
import { DEFAULT_ROUTINE_BLOCKS, type RoutineBlock } from './myDayLogic.ts';
// @ts-ignore
import { MOCK_SIMULATOR_ITEMS } from './mockHomeData.ts';
// @ts-ignore
import { createDefaultRooms } from './roomData.ts';
// @ts-ignore
import { calcBillFromKwh } from './billCalc.ts';

const STAR_FACTORS: Record<number, number> = {
  5: 0.75,
  4: 0.85,
  3: 1.0,
  2: 1.15,
  1: 1.25,
};

export function calcPlacedAppliancesMonthlyKwh(items: StoredPlacedItem[]): number {
  let totalKwh = 0;
  for (const item of items) {
    if (item.category !== 'Appliances') continue;
    const wattage = item.wattage || 100;
    const hours = item.alwaysOn ? 24 : item.hoursPerDay || 6;
    const starFactor = item.stars ? STAR_FACTORS[item.stars] || 1.0 : 1.0;
    const quantity = Math.max(1, item.quantity || 1);
    totalKwh += ((wattage * hours) / 1000) * 30 * starFactor * quantity;
  }
  return Math.round(totalKwh);
}

export interface SimulatorApplianceSummary {
  id: string;
  name: string;
  type: string;
  roomName: string;
  roomId: string;
  wattage: number;
  hoursPerDay: number;
  alwaysOn: boolean;
  stars?: number;
  brand?: string;
  isHighDrain: boolean;
}

export interface SimulatorRoutineBlockSummary {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  roomName: string;
  roomId: string;
  iconType: string;
  temperature?: number;
  fanSpeed?: string;
  minutesPerShower?: number;
  description?: string;
}

export interface SimulatorRoutineProfile {
  appliances: SimulatorApplianceSummary[];
  routineBlocks: SimulatorRoutineBlockSummary[];
  estimatedMonthlyCostRm: number;
  estimatedUsage: number;
  utilityType: 'electricity' | 'water';
  highDrainAppliances: string[];
  minorAppliances: string[];
}

const HIGH_DRAIN_TYPES = new Set([
  'air_conditioner',
  'refrigerator',
  'water_heater',
  'washing_machine',
  'dryer',
  'oven',
  'induction_cooker',
]);

const MINOR_APPLIANCE_TYPES = new Set([
  'light_bulb',
  'lights',
  'fan',
  'router',
  'tv',
  'charger',
  'workplace',
]);

/**
 * Builds a friendly room name lookup table from stored rooms or default seeds.
 */
function buildRoomMap(rooms?: StoredRoom[]): Map<string, string> {
  const roomList = rooms && rooms.length > 0 ? rooms : createDefaultRooms(true);
  const map = new Map<string, string>();
  for (const r of roomList) {
    map.set(r.id, r.name || `${r.type.replace('_', ' ')} (${r.id})`);
  }
  return map;
}

/**
 * Retrieves the user's active Simulator appliance inventory and daily routines,
 * calculating their routine baseline cost for either electricity or water.
 */
export function getSimulatorRoutineProfile(
  utilityType: 'electricity' | 'water' = 'electricity',
  customHousehold?: { residents_count?: number; showers_per_person?: number; minutes_per_shower?: number } | null
): SimulatorRoutineProfile {
  // 1. Retrieve user's appliance inventory from Simulator
  const layout = loadLayoutState();
  let rawItems: StoredPlacedItem[] = [];
  if (layout?.items && layout.items.length > 0) {
    rawItems = layout.items.filter((item) => item.category === 'Appliances');
  }
  if (rawItems.length === 0) {
    rawItems = MOCK_SIMULATOR_ITEMS.filter((item) => item.category === 'Appliances');
  }

  const roomMap = buildRoomMap(layout?.rooms);

  const appliances: SimulatorApplianceSummary[] = rawItems.map((item) => {
    const isHigh =
      HIGH_DRAIN_TYPES.has(item.type) ||
      (item.wattage != null && item.wattage >= 800) ||
      item.type.includes('air') ||
      item.type.includes('fridge') ||
      item.type.includes('heater');

    const roomName = roomMap.get(item.roomId) || 'Living area';

    return {
      id: item.id,
      name: item.name || `${item.type} in ${roomName}`,
      type: item.type,
      roomName,
      roomId: item.roomId,
      wattage: item.wattage || 100,
      hoursPerDay: item.alwaysOn ? 24 : item.hoursPerDay || 6,
      alwaysOn: Boolean(item.alwaysOn),
      stars: item.stars,
      brand: item.brand,
      isHighDrain: isHigh,
    };
  });

  // 2. Retrieve user's daily usage routines
  const savedBlocks = loadRoutineBlocks();
  const rawBlocks: RoutineBlock[] =
    savedBlocks && savedBlocks.length > 0 ? savedBlocks : DEFAULT_ROUTINE_BLOCKS;

  const routineBlocks: SimulatorRoutineBlockSummary[] = rawBlocks.map((block) => ({
    id: block.id,
    name: block.name,
    startTime: block.startTime,
    endTime: block.endTime,
    roomName: roomMap.get(block.roomId) || 'Home',
    roomId: block.roomId,
    iconType: block.iconType,
    temperature: block.temperature,
    fanSpeed: block.fanSpeed,
    minutesPerShower: block.minutesPerShower,
    description: block.description,
  }));

  // 3. Compute baseline estimated monthly cost and consumption
  let estimatedMonthlyCostRm = 0;
  let estimatedUsage = 0;

  if (utilityType === 'electricity') {
    estimatedUsage = calcPlacedAppliancesMonthlyKwh(rawItems);
    estimatedMonthlyCostRm = Math.round(calcBillFromKwh(estimatedUsage));
  } else {
    // Water estimation: based on shower routines and household residents
    const residents = Math.max(1, customHousehold?.residents_count ?? 3);
    const showersPerDay = Math.max(1, customHousehold?.showers_per_person ?? 2);
    const minutes = Math.max(5, customHousehold?.minutes_per_shower ?? 8);

    // Standard Malaysian shower head ~9 L/min
    const showerLitersPerDay = residents * showersPerDay * minutes * 9;
    // General domestic daily water (kitchen, sinks, toilet ~120 L/resident/day)
    const generalLitersPerDay = residents * 120;
    const totalMonthlyM3 = Math.round(((showerLitersPerDay + generalLitersPerDay) * 30) / 1000);

    // Air Selangor Tier 1 & 2 domestic tariff estimate (~RM 0.70 / m³ + base charge)
    const estimatedWaterRm = Math.max(12, Math.round(totalMonthlyM3 * 0.95 + 6));

    estimatedMonthlyCostRm = estimatedWaterRm;
    estimatedUsage = totalMonthlyM3;
  }

  const highDrainAppliances = appliances
    .filter((a) => a.isHighDrain)
    .map((a) => `${a.name} (${a.roomName})`);

  const minorAppliances = appliances
    .filter((a) => !a.isHighDrain && (MINOR_APPLIANCE_TYPES.has(a.type) || (a.wattage && a.wattage < 200)))
    .map((a) => `${a.name} (${a.roomName})`);

  return {
    appliances,
    routineBlocks,
    estimatedMonthlyCostRm,
    estimatedUsage,
    utilityType,
    highDrainAppliances,
    minorAppliances,
  };
}
