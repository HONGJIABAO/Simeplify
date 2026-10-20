/**
 * SIM-05, SIM-06
 * Room schema defaults and display helpers shared by the floor plan and pickers.
 */

import type { StoredRoom } from './storage';
import type { FloorNumber, RoomSlot } from './roomLayout';

export type SimulatorRoomType = 'living' | 'kitchen' | 'bedroom' | 'bathroom';

export const ROOM_TYPE_SETTINGS: Record<SimulatorRoomType, {
  label: string;
  floorColor: string;
  depthStripColor: string;
  accentColor: string;
}> = {
  living: {
    label: 'Living room',
    floorColor: '#E6C08E',
    depthStripColor: '#F2D8B3',
    accentColor: '#A97A4A',
  },
  kitchen: {
    label: 'Kitchen',
    floorColor: '#EFEAD8',
    depthStripColor: '#F8F4E9',
    accentColor: '#A97A4A',
  },
  bedroom: {
    label: 'Bedroom',
    floorColor: '#B6C4A6',
    depthStripColor: '#CFD8C4',
    accentColor: '#566549',
  },
  bathroom: {
    label: 'Bathroom',
    floorColor: '#D6D3CD',
    depthStripColor: '#E8E6E2',
    accentColor: '#57534E',
  },
};

interface DefaultRoomSeed {
  floor: FloorNumber;
  slot: RoomSlot;
  type: SimulatorRoomType;
  name: string;
  isSetUp: boolean;
}

// TODO(open-item): The final room assignment for floor 2 has not been decided.
// These are the user-approved temporary defaults for this stage.
const DEFAULT_ROOM_SEEDS: DefaultRoomSeed[] = [
  { floor: 1, slot: 'A', type: 'living', name: 'Living room', isSetUp: true },
  { floor: 1, slot: 'B', type: 'kitchen', name: 'Kitchen', isSetUp: true },
  { floor: 1, slot: 'C', type: 'bedroom', name: 'Bedroom 1', isSetUp: true },
  { floor: 1, slot: 'D', type: 'bathroom', name: 'Bathroom 1', isSetUp: true },
  { floor: 2, slot: 'A', type: 'bedroom', name: 'Bedroom 2', isSetUp: true },
  { floor: 2, slot: 'B', type: 'bedroom', name: 'Bedroom 3', isSetUp: true },
  { floor: 2, slot: 'C', type: 'bedroom', name: '', isSetUp: false },
  { floor: 2, slot: 'D', type: 'bathroom', name: '', isSetUp: false },
];

export function createDefaultRooms(): StoredRoom[] {
  return DEFAULT_ROOM_SEEDS.map((seed) => ({
    id: `f${seed.floor}-${seed.slot}`,
    ...seed,
  }));
}

export function getRoomSuggestedName(room: Pick<StoredRoom, 'floor' | 'slot' | 'type'>): string {
  const seed = DEFAULT_ROOM_SEEDS.find(
    (candidate) => candidate.floor === room.floor && candidate.slot === room.slot
  );
  if (seed?.name) return seed.name;
  if (room.type === 'bedroom') return 'Bedroom 4';
  if (room.type === 'bathroom') return 'Bathroom 2';
  return ROOM_TYPE_SETTINGS[room.type].label;
}

export function getSetUpRooms(rooms: StoredRoom[]): StoredRoom[] {
  return rooms.filter((room) => room.isSetUp);
}

export function getRoomDisplayName(room: StoredRoom, rooms: StoredRoom[]): string {
  const baseName = room.name.trim() || getRoomSuggestedName(room);
  const duplicateCount = rooms.filter(
    (candidate) => candidate.isSetUp && candidate.name.trim().toLowerCase() === baseName.toLowerCase()
  ).length;
  return duplicateCount > 1 ? `${baseName} (${room.floor}F)` : baseName;
}

const LEGACY_ROOM_ID_MAP: Record<string, string> = {
  living: 'f1-A',
  kitchen: 'f1-B',
  bedroom: 'f1-C',
  bathroom: 'f1-D',
};

export function migrateRoomId(roomId: string): string {
  return LEGACY_ROOM_ID_MAP[roomId] ?? roomId;
}

export function normalizeStoredRooms(savedRooms?: StoredRoom[]): StoredRoom[] {
  const defaults = createDefaultRooms();
  if (!savedRooms?.length) return defaults;

  const hasFloorSchema = savedRooms.every(
    (room) => (room.floor === 1 || room.floor === 2) && ['A', 'B', 'C', 'D'].includes(room.slot)
  );

  if (hasFloorSchema) {
    return defaults.map((fallback) => {
      const saved = savedRooms.find((room) => room.id === fallback.id);
      return saved ? { ...fallback, ...saved } : fallback;
    });
  }

  const legacyByType = new Map(savedRooms.map((room) => [room.type, room]));
  return defaults.map((fallback) => {
    if (fallback.floor !== 1) return fallback;
    const legacy = legacyByType.get(fallback.type);
    if (!legacy) return fallback;
    return {
      ...fallback,
      name: legacy.name.trim() || fallback.name,
      type: legacy.type,
      isSetUp: true,
    };
  });
}

