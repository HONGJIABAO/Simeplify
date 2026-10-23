/** Named Simulator fixtures built from the fixed ROOM_SLOTS table. */

import type { StoredPlacedItem, StoredRoom } from './storage';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { layoutItemsInRooms } from './furnishedLayout.ts';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { createDefaultRooms } from './roomData.ts';
import type { RoomSlot } from './roomLayout';

export interface RawSpecItem {
  item: string;
  category: 'Appliances' | 'Furniture';
  label: string;
  wattage?: number;
  stars?: number | 'none';
  floor: 1 | 2;
  slot: RoomSlot;
  x: number;
  y: number;
  size: 'tall' | 'medium' | 'small' | 'wall';
  type: string;
  spriteKey: string;
  alwaysOn?: boolean;
  role?: string;
}

type FixtureItem = Omit<StoredPlacedItem, 'posX' | 'posY'>;

const appliance = (
  id: string,
  roomId: string,
  type: string,
  name: string,
  wattage: number,
  extra: Partial<FixtureItem> = {}
): FixtureItem => ({
  id, roomId, type, spriteKey: type, name, wattage,
  category: 'Appliances', stars: type === 'workplace' ? 0 : 5,
  hoursPerDay: type === 'refrigerator' ? 24 : 6,
  alwaysOn: type === 'refrigerator', isOn: false, ...extra,
});

const furniture = (id: string, roomId: string, type: string, name: string, role?: string): FixtureItem => ({
  id, roomId, type, spriteKey: type, name, category: 'Furniture', role,
});

const DEFAULT_ITEMS: FixtureItem[] = [
  appliance('f1-ac-living', 'f1-A', 'air_conditioner', 'Daikin Air Conditioner', 1000, { brand: 'Daikin' }),
  appliance('f1-tv-living', 'f1-A', 'tv', 'Sony Television', 90, { brand: 'Sony' }),
  appliance('f1-router-living', 'f1-A', 'router', 'TP-Link Wi-Fi Router', 15, { brand: 'TP-Link', alwaysOn: true }),
  furniture('f1-coffee-living', 'f1-A', 'table', 'Coffee Table', 'coffee table'),
  furniture('f1-sofa-living', 'f1-A', 'sofa', 'Sofa'),
  appliance('f1-bulb-a', 'f1-A', 'light_bulb', 'Living room light', 9),
  appliance('f1-fan-living', 'f1-A', 'fan', 'KDK Standing Fan', 55, { brand: 'KDK' }),

  appliance('f1-fridge-kitchen', 'f1-B', 'refrigerator', 'Hitachi Refrigerator', 150, { brand: 'Hitachi', alwaysOn: true }),
  appliance('f1-bulb-b', 'f1-B', 'light_bulb', 'Kitchen light', 9),
  furniture('f1-sink-kitchen', 'f1-B', 'sink', 'Kitchen Sink'),
  furniture('f1-table-kitchen', 'f1-B', 'table', 'Kitchen Table', 'kitchen table'),
  appliance('f1-ac-kitchen', 'f1-B', 'air_conditioner', 'Daikin Air Conditioner', 1000, { brand: 'Daikin' }),

  appliance('f1-washer-laundry', 'f1-C', 'washing_machine', 'Washing Machine', 500),
  appliance('f1-bulb-c', 'f1-C', 'light_bulb', 'Laundry room light', 9),

  appliance('f1-shower-bath', 'f1-D', 'water_heater', 'Joven Water Heater', 3500, { brand: 'Joven' }),
  appliance('f1-bulb-d', 'f1-D', 'light_bulb', 'Downstairs toilet light', 9),
  furniture('f1-toilet-bath', 'f1-D', 'toilet', 'Toilet'),
  furniture('f1-sink-bath', 'f1-D', 'sink', 'Sink'),

  furniture('f2-bed-master', 'f2-A', 'bed', 'Bed'),
  appliance('f2-lamp-master', 'f2-A', 'lights', 'Philips Bedside Lamp', 9, { brand: 'Philips', role: 'bedside right' }),
  appliance('f2-fan-master', 'f2-A', 'fan', 'KDK Standing Fan', 55, { brand: 'KDK', stars: 4 }),
  appliance('f2-bulb-a', 'f2-A', 'light_bulb', 'Master bedroom light', 9),
  appliance('f2-ac-master', 'f2-A', 'air_conditioner', 'Panasonic Air Conditioner', 1000, { brand: 'Panasonic' }),

  furniture('f2-bed-bedroom2', 'f2-B', 'bed', 'Bed'),
  appliance('f2-lamp-bedroom2', 'f2-B', 'lights', 'Philips Bedside Lamp', 9, { brand: 'Philips', role: 'bedside right' }),
  appliance('f2-fan-bedroom2', 'f2-B', 'fan', 'KDK Standing Fan', 55, { brand: 'KDK' }),
  appliance('f2-bulb-b', 'f2-B', 'light_bulb', 'Bedroom light', 9),

  appliance('f2-workplace', 'f2-C', 'workplace', 'Workplace', 80, { brand: '' }),
  appliance('f2-bulb-c', 'f2-C', 'light_bulb', 'Work room light', 9),
  appliance('f2-ac-work', 'f2-C', 'air_conditioner', 'Daikin Air Conditioner', 1000, { brand: 'Daikin' }),

  appliance('f2-shower-bath', 'f2-D', 'water_heater', 'Panasonic Water Heater', 3500, { brand: 'Panasonic' }),
  appliance('f2-bulb-d', 'f2-D', 'light_bulb', 'Upstairs toilet light', 9),
  furniture('f2-toilet-bath', 'f2-D', 'toilet', 'Toilet'),
  furniture('f2-sink-bath', 'f2-D', 'sink', 'Sink'),
];
const EXTRA_ITEMS: FixtureItem[] = [];

function materialize(items: FixtureItem[], setupAllFloor2 = false): StoredPlacedItem[] {
  const rooms = createDefaultRooms(setupAllFloor2);
  return layoutItemsInRooms(items.map((item) => ({ ...item, posX: 0.5, posY: 0.5 })), rooms);
}

export const MOCK_SIMULATOR_ITEMS = materialize(DEFAULT_ITEMS);
export const MOCK_FLOOR2_EXTRA_ITEMS = materialize(EXTRA_ITEMS, true);
export const MOCK_SIMULATOR_ITEMS_ALL = materialize([...DEFAULT_ITEMS, ...EXTRA_ITEMS], true);

/**
 * Keeps a newly-created or partially-seeded household visually usable without
 * overwriting any real rows. Defaults are injected only into set-up rooms that
 * contain no persisted appliance or furniture at all.
 */
export function furnishEmptyRooms(
  persistedItems: StoredPlacedItem[],
  rooms: StoredRoom[]
): StoredPlacedItem[] {
  const result = persistedItems.map((item) => ({ ...item }));
  const fixtureRooms = createDefaultRooms(true);

  for (const room of rooms.filter((candidate) => candidate.isSetUp)) {
    if (result.some((item) => item.roomId === room.id)) continue;
    const fixtureRoom = fixtureRooms.find(
      (candidate) => candidate.floor === room.floor && candidate.slot === room.slot
    );
    if (!fixtureRoom) continue;

    for (const item of MOCK_SIMULATOR_ITEMS_ALL.filter(
      (candidate) => candidate.roomId === fixtureRoom.id
    )) {
      result.push({
        ...item,
        id: `mock_default_${room.id}_${item.id}`,
        roomId: room.id,
      });
    }
  }

  return result;
}

function toRaw(item: StoredPlacedItem): RawSpecItem {
  const room = createDefaultRooms(true).find((candidate) => candidate.id === item.roomId)!;
  return {
    item: item.name, category: item.category, label: item.name, wattage: item.wattage,
    stars: item.stars, floor: room.floor, slot: room.slot, x: item.posX, y: item.posY,
    size: item.type === 'air_conditioner' || item.type === 'water_heater' ? 'wall' : 'medium',
    type: item.type, spriteKey: item.spriteKey, alwaysOn: item.alwaysOn, role: item.role,
  };
}

export const RAW_SPEC_APPLIANCES = MOCK_SIMULATOR_ITEMS_ALL
  .filter((item) => item.category === 'Appliances').map(toRaw);
export const RAW_SPEC_FURNITURE = MOCK_SIMULATOR_ITEMS_ALL
  .filter((item) => item.category === 'Furniture').map(toRaw);

/** Types intentionally absent because no matching local picture exists. */
export const SKIPPED_ITEM_TYPES = ['rug', 'plant', 'wardrobe', 'bedside_table', 'kitchen_counter'] as const;
