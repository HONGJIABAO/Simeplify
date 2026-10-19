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
  iconType: 'sleep' | 'shower' | 'meal' | 'away' | 'evening' | 'custom';
  description?: string;
}

export const AWAY_RANGE_WEEKDAY = { start: '08:30', end: '17:30' };

export const DEFAULT_ROUTINE_BLOCKS: RoutineBlock[] = [
  {
    id: 'block-sleep',
    name: 'Sleep',
    startTime: '00:00',
    endTime: '06:30',
    roomId: 'bedroom',
    applianceIds: ['ac1', 'fan1'],
    iconType: 'sleep',
    description: 'Bedroom AC at 25°C, ceiling fan gentle',
  },
  {
    id: 'block-shower',
    name: 'Morning Shower',
    startTime: '06:30',
    endTime: '07:15',
    roomId: 'bathroom',
    applianceIds: ['wh1'],
    minutesPerShower: 10,
    iconType: 'shower',
    description: 'Storage water heater (15-min eco timer)',
  },
  {
    id: 'block-breakfast',
    name: 'Breakfast & Prep',
    startTime: '07:15',
    endTime: '08:30',
    roomId: 'kitchen',
    applianceIds: ['fridge1', 'lights1'],
    iconType: 'meal',
    description: 'Kitchen induction burner, kettle, warm pendant lighting',
  },
  {
    id: 'block-away',
    name: 'Away (Office)',
    startTime: '08:30',
    endTime: '17:30',
    roomId: 'living',
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
    roomId: 'living',
    applianceIds: ['ac1', 'fan1', 'lights1'],
    iconType: 'evening',
    description: 'Living room relaxation with ambient lights and AC',
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
  const start = timeToMinutes(block.startTime);
  const end = timeToMinutes(block.endTime);

  // End must be after start (unless overnight sleep)
  if (start >= end && block.iconType !== 'sleep') {
    return {
      isValid: false,
      timeError: 'End time must be later than start time.',
    };
  }

  // Check overlap with away range (note, not a fatal blocking error)
  const awayStart = timeToMinutes(AWAY_RANGE_WEEKDAY.start);
  const awayEnd = timeToMinutes(AWAY_RANGE_WEEKDAY.end);
  const isInsideAway = !block.isAway && start < awayEnd && end > awayStart;

  // Check overlap with other blocks
  for (const b of existingBlocks) {
    if (editingBlockId && b.id === editingBlockId) continue;
    if (b.isAway) continue; // Away blocks are handled via note

    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);

    const overlaps = Math.max(start, bStart) < Math.min(end, bEnd);
    if (overlaps) {
      return {
        isValid: false,
        overlapError: `Schedule overlap. This overlaps with ${b.name} (${b.startTime} – ${b.endTime}).`,
        overlapsWith: b,
        isInsideAway,
      };
    }
  }

  return { isValid: true, isInsideAway };
}

/**
 * Finds the active block for a specific time of day.
 */
export function getActiveBlockAtTime(
  timeStr: string,
  blocks: RoutineBlock[]
): RoutineBlock | null {
  const current = timeToMinutes(timeStr);

  for (const b of blocks) {
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
