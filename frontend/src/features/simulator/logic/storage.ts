/**
 * Persistence helper for Simulator state.
 * Stores layout state and simulation state separately to localStorage (or memory).
 */

export interface StoredRoom {
  id: string;
  name: string;
  type: 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'laundry_room' | 'work_room';
  floor: 1 | 2;
  slot: 'A' | 'B' | 'C' | 'D';
  isSetUp: boolean;
  /** Legacy v2 grid fields are read only during local-state migration. */
  gridCol?: number;
  gridRow?: number;
  gridColSpan?: number;
  gridRowSpan?: number;
}

export interface StoredPlacedItem {
  id: string;
  category: 'Appliances' | 'Furniture';
  type: string;
  spriteKey: string;
  name: string;
  roomId: string;
  posX: number;
  posY: number;
  brand?: string;
  model?: string;
  quantity?: number;
  wattage?: number;
  stars?: number;
  hoursPerDay?: number;
  alwaysOn?: boolean;
  isOn?: boolean;
  color?: string;
  rotation?: number;
  facing?: 'front' | 'back';
  /** Distinguishes repeated sprites, for example coffee table and side table. */
  role?: string;
}

export interface LayoutState {
  rooms: StoredRoom[];
  items: StoredPlacedItem[];
}

export interface SimulationState {
  simSpeed: 1 | 2 | 4;
  simulatedMinutes: number; // 0 to 1439
  avatarVariant: 'avatar_girl' | 'avatar_boy' | 'girl' | 'boy';
  viewedFloor?: 1 | 2;
}

const LAYOUT_KEY = 'simeplify_simulator_layout_v4';
const LEGACY_LAYOUT_KEY = 'simeplify_simulator_layout_v3';
const SIM_KEY = 'simeplify_simulator_sim_v2';

// In-memory fallback if localStorage is unavailable
const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Ignore error
  }
  return memoryStorage[key] || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore error
  }
  memoryStorage[key] = value;
}

export function loadLayoutState(): LayoutState | null {
  try {
    const raw = safeGetItem(LAYOUT_KEY) || safeGetItem(LEGACY_LAYOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LayoutState;
      if (parsed.items) {
        parsed.items = parsed.items.map((item) => {
          if ((item.type === 'refrigerator' || item.spriteKey === 'refrigerator') && item.roomId !== 'f1-B') {
            return { ...item, roomId: 'f1-B', posX: 0.7060, posY: 0.1374 };
          }
          return item;
        });
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse saved layout state:', err);
  }
  return null;
}

export function saveLayoutState(state: LayoutState): void {
  try {
    safeSetItem(LAYOUT_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save layout state:', err);
  }
}

export function loadSimulationState(): SimulationState | null {
  try {
    const raw = safeGetItem(SIM_KEY);
    if (raw) {
      return JSON.parse(raw) as SimulationState;
    }
  } catch (err) {
    console.error('Failed to parse saved simulation state:', err);
  }
  return null;
}

export function saveSimulationState(state: SimulationState): void {
  try {
    safeSetItem(SIM_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save simulation state:', err);
  }
}

const ROUTINE_KEY = 'simeplify_simulator_routine_blocks_v2';

export function loadRoutineBlocks(): any[] | null {
  try {
    const raw = safeGetItem(ROUTINE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse saved routine blocks:', err);
  }
  return null;
}

export function saveRoutineBlocks(blocks: any[]): void {
  try {
    safeSetItem(ROUTINE_KEY, JSON.stringify(blocks));
  } catch (err) {
    console.error('Failed to save routine blocks:', err);
  }
}
