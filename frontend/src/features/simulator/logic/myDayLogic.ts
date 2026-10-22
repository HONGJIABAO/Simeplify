/**
 * SIM-01, SIM-07
 * Pure logic for My Day: routine blocks, schedule timeline, presence checks, and bill impact.
 * Source: docs/Feature_Requirements.md SIM-01, SIM-07, docs/page_refined.md S4.6, docs/Workflow.md W3a.
 *
 * Rules:
 * - Presence (away time from schedule) always wins over My day.
 * - Before user answers any My day question: bill is the "max" bill.
 * - Blocks cannot overlap. Overnight is allowed only for Sleep.
 * - Away blocks are locked and show an amber note (not an error).
 * - A month is 30 days (5/7 weekdays, 2/7 weekend days).
 */

export interface ApplianceInUse {
  id: string;
  name: string;
  wattage: number;
  timeRange?: string;
  icon?: 'ac' | 'fan' | 'light' | 'tv';
}

export interface RoutineBlock {
  id: string;
  name: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  roomId: string;
  isAway?: boolean;
  isLocked?: boolean;
  applianceIds: string[];
  minutesPerShower?: number;
  iconType: 'sleep' | 'shower' | 'meal' | 'away' | 'evening' | 'work' | 'custom';
  description?: string;
  appliancesInUse?: ApplianceInUse[];
  temperature?: number;
  timerHours?: number;
  fanSpeed?: 'Low' | 'Med' | 'High';
  repeatDays?: string[];
  /** Whether this activity moves the resident to its interactive item. */
  avatarWalks?: boolean;
}

export const WORK_ROUTINE_SUGGESTIONS = [
  { name: 'Working', roomType: 'bedroom' as const, avatarWalks: true },
  { name: 'Studying', roomType: 'bedroom' as const, avatarWalks: true },
  { name: 'Charging phone', roomType: 'bedroom' as const, avatarWalks: false },
] as const;

export const AWAY_RANGE_WEEKDAY = { start: '08:30', end: '17:30' };

export const DEFAULT_ROUTINE_BLOCKS: RoutineBlock[] = [
  {
    id: 'block-sleep',
    name: 'Sleep',
    startTime: '00:00',
    endTime: '06:30',
    roomId: 'f2-A',
    applianceIds: ['f2-ac-master', 'f2-lamp-master', 'f2-bulb-a'],
    iconType: 'sleep',
    description: 'Bedroom AC at 25°C, ceiling fan gentle',
    temperature: 25,
    timerHours: 7,
    fanSpeed: 'Low',
  },
  {
    id: 'block-shower',
    name: 'Morning Shower',
    startTime: '06:30',
    endTime: '07:15',
    roomId: 'f1-D',
    applianceIds: ['f1-shower-bath', 'f1-bulb-d'],
    minutesPerShower: 15,
    iconType: 'shower',
    description: 'Storage water heater (15-min eco timer)',
  },
  {
    id: 'block-breakfast',
    name: 'Breakfast & Prep',
    startTime: '07:15',
    endTime: '08:30',
    roomId: 'f1-B',
    applianceIds: ['f1-fridge-kitchen', 'f1-bulb-b'],
    iconType: 'meal',
    description: 'Kitchen induction burner, kettle, warm pendant lighting',
  },
  {
    id: 'block-away',
    name: 'Away (Office)',
    startTime: '08:30',
    endTime: '17:30',
    roomId: 'away',
    isAway: true,
    isLocked: true,
    applianceIds: [],
    iconType: 'away',
    description: 'Energy saving mode active (fridge/Wi-Fi router standby only)',
  },
  {
    id: 'block-evening',
    name: 'Evening Routine',
    startTime: '20:00',
    endTime: '23:00',
    roomId: 'f1-A',
    applianceIds: ['f1-ac-living', 'f1-tv-living', 'f1-bulb-a'],
    iconType: 'evening',
    description: 'Living room relaxation with ambient lights and AC',
    temperature: 23,
    timerHours: 1,
    fanSpeed: 'Med',
    appliancesInUse: [
      {
        id: 'panasonic_ac',
        name: 'Panasonic Air Conditioner',
        timeRange: '20:00-23:00',
        wattage: 1200,
        icon: 'ac',
      },
      {
        id: 'kdk_fan',
        name: 'KDK Table Fan',
        timeRange: '20:00-23:00',
        wattage: 35,
        icon: 'fan',
      },
      {
        id: 'muji_lamp',
        name: 'MUJI Bedside Lamp',
        timeRange: '20:00-23:00',
        wattage: 10,
        icon: 'light',
      },
    ],
  },
];

/**
 * Converts "HH:MM" to minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from midnight to "HH:MM".
 */
export function minutesToTime(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Validates a block's time range and checks for overlaps with other blocks.
 */
export function validateBlock(
  block: Omit<RoutineBlock, 'id'>,
  existingBlocks: RoutineBlock[],
  editingBlockId?: string
): {
  isValid: boolean;
  timeError?: string;
  overlapError?: string;
  overlapsWith?: RoutineBlock;
  isInsideAway?: boolean;
} {
  if (![block.startTime, block.endTime].every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) {
    return { isValid: false, timeError: 'Use a valid time in HH:MM format (00:00–23:59).' };
  }
  const start = timeToMinutes(block.startTime), end = timeToMinutes(block.endTime);
  if (start === end || (start > end && block.iconType !== 'sleep')) {
    return { isValid: false, timeError: 'End must be after start. Only Sleep can continue overnight.' };
  }
  const spans = (a: number, b: number): number[][] => a < b ? [[a, b]] : [[a, 1440], [0, b]];
  const own = spans(start, end);
  for (const other of existingBlocks) {
    if (other.id === editingBlockId) continue;
    const overlaps = own.some(([a, b]) => spans(timeToMinutes(other.startTime), timeToMinutes(other.endTime)).some(([c, d]) => Math.max(a, c) < Math.min(b, d)));
    if (overlaps) return { isValid: false, overlapError: `This overlaps with ${other.name} (${other.startTime} – ${other.endTime}).`, overlapsWith: other };
  }
  return { isValid: true };

}

/**
 * Finds the active block for a specific time of day.
 */
export function getActiveBlockAtTime(
  timeStr: string,
  blocks: RoutineBlock[]
): RoutineBlock | null {
  const current = timeToMinutes(timeStr);

  for (const b of [...blocks].sort((a, b) => Number(Boolean(b.isAway)) - Number(Boolean(a.isAway)))) {
    const start = timeToMinutes(b.startTime);
    const end = timeToMinutes(b.endTime);

    if (start < end) {
      if (current >= start && current < end) return b;
    } else {
      // Overnight block (e.g. 23:00 to 06:30)
      if (current >= start || current < end) return b;
    }
  }

  return null;
}

/**
 * Calculates adjusted monthly kWh from routine block answers.
 * Compares against max bill rule.
 */
export function calcMonthlyKwhFromRoutine(
  blocks: RoutineBlock[],
  baseKwh: number
): number {
  // If no custom blocks, returns baseline max bill
  if (blocks.length === 0) return baseKwh;

  // Each scheduled active block optimizes person-dependent appliances
  // Typical Malaysian household routine saves ~15% to 30% from the max bill
  const totalHoursOn = blocks.reduce((acc, b) => {
    if (b.isAway) return acc;
    const dur = (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60;
    return acc + Math.max(0, dur);
  }, 0);

  const optimizationFactor = Math.min(1, Math.max(0.65, 0.5 + (totalHoursOn / 24) * 0.5));
  return Math.round(baseKwh * optimizationFactor);
}
