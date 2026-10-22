/** Named Simulator fixtures built from the fixed ROOM_SLOTS table. */

import type { StoredPlacedItem } from './storage';
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
  // 1F A · Living room. Repeated table sprites have explicit roles.
  appliance('f1-tv-living', 'f1-A', 'tv', 'Samsung TV', 90, { brand: 'Samsung' }),
  appliance('f1-ac-living', 'f1-A', 'air_conditioner', 'Panasonic Air Conditioner', 1200, { brand: 'Panasonic', hoursPerDay: 8 }),
  appliance('f1-router-living', 'f1-A', 'router', 'TP-Link Wi-Fi Router', 15, { brand: 'TP-Link', hoursPerDay: 24, alwaysOn: true }),
  furniture('f1-sofa-living', 'f1-A', 'sofa', 'Sofa'),
  furniture('f1-coffee-living', 'f1-A', 'table', 'Coffee Table', 'coffee table'),
  furniture('f1-side-left-living', 'f1-A', 'table', 'Left Side Table', 'side table left'),
  furniture('f1-side-right-living', 'f1-A', 'table', 'Right Side Table', 'side table right'),
  appliance('f1-fan-living', 'f1-A', 'fan', 'KDK Standing Fan', 55, { brand: 'KDK', stars: 3 }),
  appliance('f1-bulb-a', 'f1-A', 'light_bulb', 'Living room light', 9),

  // 1F B · Kitchen.
  appliance('f1-fridge-kitchen', 'f1-B', 'refrigerator', 'Samsung Inverter Fridge', 150, { brand: 'Samsung' }),
  furniture('f1-counter-kitchen', 'f1-B', 'table', 'Kitchen Counter', 'counter'),
  furniture('f1-table-kitchen', 'f1-B', 'table', 'Dining Table', 'dining'),
  appliance('f1-bulb-b', 'f1-B', 'light_bulb', 'Kitchen light', 9),

  // 1F C · Laundry Room. The washing-machine catalog has no placed row yet.
  appliance('f1-bulb-c', 'f1-C', 'light_bulb', 'Laundry room light', 9),

  // 1F D · Bathroom. Existing bathroom items moved here; one new ceiling bulb.
  furniture('f1-toilet-bath', 'f1-D', 'toilet', 'Toilet'),
  furniture('f1-sink-bath', 'f1-D', 'sink', 'Sink'),
  appliance('f1-shower-bath', 'f1-D', 'water_heater', 'Ariston Water Heater', 3500, { brand: 'Ariston', hoursPerDay: 1 }),
  appliance('f1-bulb-d', 'f1-D', 'light_bulb', 'Downstairs bathroom light', 9),

  // 2F A · Bedroom.
  furniture('f2-bed-master', 'f2-A', 'bed', 'Bed'),
  appliance('f2-ac-master', 'f2-A', 'air_conditioner', 'Daikin Air Conditioner', 1000, { brand: 'Daikin', hoursPerDay: 8 }),
  appliance('f2-lamp-master-left', 'f2-A', 'lights', 'Philips Bedside Lamp', 9, { brand: 'Philips', stars: 5, role: 'bedside left' }),
  appliance('f2-lamp-master-right', 'f2-A', 'lights', 'Philips Bedside Lamp', 9, { brand: 'Philips', stars: 5, role: 'bedside right' }),
  appliance('f2-fan-master', 'f2-A', 'fan', 'KDK Standing Fan', 55, { brand: 'KDK', stars: 3 }),
  appliance('f2-bulb-a', 'f2-A', 'light_bulb', 'Master bedroom light', 9),

  // 2F B · Study & Guest. Workplace is the desk, laptop, and phone in one sprite.
  furniture('f2-bed-study', 'f2-B', 'bed', 'Guest Bed'),
  appliance('f2-ac-study', 'f2-B', 'air_conditioner', 'Daikin Air Conditioner', 1000, { brand: 'Daikin', hoursPerDay: 8 }),
  appliance('f2-lamp-study-left', 'f2-B', 'lights', 'Philips Bedside Lamp', 9, { brand: 'Philips', stars: 5, role: 'bedside left' }),
  appliance('f2-lamp-study-right', 'f2-B', 'lights', 'Philips Bedside Lamp', 9, { brand: 'Philips', stars: 5, role: 'bedside right' }),
  appliance('f2-workplace-study', 'f2-B', 'workplace', 'Workplace', 80, { brand: '' }),
  appliance('f2-fan-study', 'f2-B', 'fan', 'KDK Standing Fan', 55, { brand: 'KDK', stars: 3 }),
  appliance('f2-bulb-b', 'f2-B', 'light_bulb', 'Study light', 9),

  // 2F C · Work Room. No separate Workplace/air-conditioner rows exist here.
  appliance('f2-bulb-c', 'f2-C', 'light_bulb', 'Work room light', 9),

  // 2F D · Bathroom. Existing upstairs bathroom items moved here.
  furniture('f2-toilet-bath', 'f2-D', 'toilet', 'Toilet'),
  furniture('f2-sink-bath', 'f2-D', 'sink', 'Sink'),
  appliance('f2-shower-bath', 'f2-D', 'water_heater', 'Panasonic Water Heater', 3500, { brand: 'Panasonic', hoursPerDay: 1 }),
  appliance('f2-bulb-d', 'f2-D', 'light_bulb', 'Upstairs bathroom light', 9),
];

const EXTRA_ITEMS: FixtureItem[] = [];

function materialize(items: FixtureItem[], setupAllFloor2 = false): StoredPlacedItem[] {
  const rooms = createDefaultRooms(setupAllFloor2);
  return layoutItemsInRooms(items.map((item) => ({ ...item, posX: 0.5, posY: 0.5 })), rooms);
}

export const MOCK_SIMULATOR_ITEMS = materialize(DEFAULT_ITEMS);
export const MOCK_FLOOR2_EXTRA_ITEMS = materialize(EXTRA_ITEMS, true);
export const MOCK_SIMULATOR_ITEMS_ALL = materialize([...DEFAULT_ITEMS, ...EXTRA_ITEMS], true);

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
