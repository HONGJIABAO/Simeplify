/**
 * Routine & Simulation Configuration
 * Defines editable daily routine blocks, simulation speeds, and usage thresholds.
 */

export type RoomType = 'living' | 'kitchen' | 'bedroom' | 'bathroom';

export interface RoutineItem {
  id: string;
  name: string;
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
  targetRoomType: RoomType;
  isSleeping?: boolean;
  isAway?: boolean;
  activeApplianceTypes?: string[]; // appliances turned ON when resident is here
}

/**
 * Default daily routine array (editable)
 */
export const DEFAULT_ROUTINE: RoutineItem[] = [
  {
    id: 'night_sleep',
    name: 'Sleeping',
    startTime: '00:00',
    endTime: '07:00',
    targetRoomType: 'bedroom',
    isSleeping: true,
    activeApplianceTypes: ['air_conditioner', 'lights', 'light_bulb'],
  },
  {
    id: 'morning_bath',
    name: 'Morning Routine',
    startTime: '07:00',
    endTime: '08:00',
    targetRoomType: 'bathroom',
    activeApplianceTypes: ['water_heater', 'lights', 'light_bulb'],
  },
  {
    id: 'breakfast',
    name: 'Breakfast & Prep',
    startTime: '08:00',
    endTime: '09:00',
    targetRoomType: 'kitchen',
    activeApplianceTypes: ['refrigerator', 'lights', 'light_bulb'],
  },
  {
    id: 'work_or_leisure',
    name: 'Work / Study',
    startTime: '09:00',
    endTime: '18:00',
    targetRoomType: 'living',
    isAway: false, // Configurable: could be away or living room
    activeApplianceTypes: ['lights', 'light_bulb'],
  },
  {
    id: 'evening_relax',
    name: 'Evening Leisure',
    startTime: '18:00',
    endTime: '23:00',
    targetRoomType: 'living',
    activeApplianceTypes: ['tv', 'lights', 'light_bulb', 'air_conditioner'],
  },
  {
    id: 'night_wind_down',
    name: 'Wind Down',
    startTime: '23:00',
    endTime: '24:00',
    targetRoomType: 'bedroom',
    isSleeping: true,
    activeApplianceTypes: ['air_conditioner', 'lights', 'light_bulb'],
  },
];

/**
 * Speed configuration:
 * 1x: 1 sim hour = 5.0 real seconds (1 real second = 12 sim min)
 * 2x: 1 sim hour = 2.5 real seconds (1 real second = 24 sim min)
 * 4x: 1 sim hour = 1.25 real seconds (1 real second = 48 sim min)
 */
export type SimSpeed = 1 | 2 | 4;

export const SIM_SPEED_MULTIPLIERS: Record<SimSpeed, { label: string; realSecPerHour: number }> = {
  1: { label: '1x', realSecPerHour: 5.0 },
  2: { label: '2x', realSecPerHour: 2.5 },
  4: { label: '4x', realSecPerHour: 1.25 },
};

/**
 * Bill usage thresholds for badge
 */
export const USAGE_THRESHOLDS = {
  LOW_RM: 100,
  HIGH_RM: 250,
};

/**
 * Energy star rating efficiency factors
 */
export const STAR_EFFICIENCY_FACTORS: Record<number, number> = {
  5: 0.75, // 25% energy savings
  4: 0.85, // 15% energy savings
  3: 1.00, // Baseline
  2: 1.15, // 15% more consumption
  1: 1.30, // 30% more consumption
};
