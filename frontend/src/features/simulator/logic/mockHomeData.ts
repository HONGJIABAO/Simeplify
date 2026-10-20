/**
 * SIM-05, SIM-06
 * Furnished mock data for both floors.
 * Source: specification tables for floor 1 & floor 2.
 */

import type { StoredPlacedItem } from './storage';

export interface RawSpecItem {
  item: string;
  category: 'Appliances' | 'Furniture';
  label: string;
  wattage?: number;
  stars?: number | 'none';
  floor: 1 | 2;
  slot: 'A' | 'B' | 'C' | 'D';
  x: number;
  y: number;
  size: 'tall' | 'medium' | 'small' | 'wall';
  type: string;
  spriteKey: string;
  alwaysOn?: boolean;
  onDesk?: boolean;
}

/** Complete specification table items (14 appliances, 9 furniture items) */
export const RAW_SPEC_APPLIANCES: RawSpecItem[] = [
  // Floor 1 Living room (slot A)
  { item: 'Air conditioner', category: 'Appliances', label: 'Panasonic Air Conditioner', wattage: 1200, stars: 4, floor: 1, slot: 'A', x: 0.22, y: 0.18, size: 'wall', type: 'air_conditioner', spriteKey: 'air_conditioner' },
  { item: 'TV', category: 'Appliances', label: 'Samsung TV', wattage: 90, stars: 3, floor: 1, slot: 'A', x: 0.60, y: 0.36, size: 'medium', type: 'tv', spriteKey: 'tv' },
  { item: 'Lamp', category: 'Appliances', label: 'Philips LED Lights', wattage: 18, stars: 5, floor: 1, slot: 'A', x: 0.90, y: 0.40, size: 'small', type: 'lights', spriteKey: 'lights' },
  // Floor 1 Kitchen (slot B)
  { item: 'Fridge', category: 'Appliances', label: 'Samsung Inverter Fridge', wattage: 150, stars: 3, floor: 1, slot: 'B', x: 0.30, y: 0.42, size: 'tall', type: 'refrigerator', spriteKey: 'refrigerator', alwaysOn: true },
  { item: 'Lamp', category: 'Appliances', label: 'Philips LED Lights', wattage: 18, stars: 5, floor: 1, slot: 'B', x: 0.78, y: 0.42, size: 'small', type: 'lights', spriteKey: 'lights' },
  // Floor 1 Bedroom 1 (slot C)
  { item: 'Bedside lamp', category: 'Appliances', label: 'Philips LED Lights', wattage: 9, stars: 5, floor: 1, slot: 'C', x: 0.70, y: 0.74, size: 'small', type: 'lights', spriteKey: 'lights' },
  { item: 'Fan', category: 'Appliances', label: 'Khind Table Fan', wattage: 55, stars: 3, floor: 1, slot: 'C', x: 0.86, y: 0.50, size: 'small', type: 'fan', spriteKey: 'fan' },
  // Floor 1 Bathroom (slot D)
  { item: 'Water heater', category: 'Appliances', label: 'Ariston Water Heater', wattage: 3500, stars: 3, floor: 1, slot: 'D', x: 0.50, y: 0.22, size: 'wall', type: 'water_heater', spriteKey: 'water_heater' },
  // Floor 2 Master bedroom (slot A)
  { item: 'Air conditioner', category: 'Appliances', label: 'Daikin Air Conditioner', wattage: 1000, stars: 2, floor: 2, slot: 'A', x: 0.30, y: 0.18, size: 'wall', type: 'air_conditioner', spriteKey: 'air_conditioner' },
  { item: 'Bedside lamp', category: 'Appliances', label: 'Philips LED Lights', wattage: 12, stars: 5, floor: 2, slot: 'A', x: 0.70, y: 0.76, size: 'small', type: 'lights', spriteKey: 'lights' },
  { item: 'Fan', category: 'Appliances', label: 'Khind Table Fan', wattage: 55, stars: 3, floor: 2, slot: 'A', x: 0.88, y: 0.52, size: 'small', type: 'fan', spriteKey: 'fan' },
  // Floor 2 Bedroom 2 (slot B)
  { item: 'Workplace', category: 'Appliances', label: 'Workplace', wattage: 80, stars: 'none', floor: 2, slot: 'B', x: 0.26, y: 0.47, size: 'small', type: 'workplace', spriteKey: 'workplace', onDesk: true },
  { item: 'Lamp', category: 'Appliances', label: 'Philips LED Lights', wattage: 9, stars: 5, floor: 2, slot: 'B', x: 0.60, y: 0.52, size: 'small', type: 'lights', spriteKey: 'lights' },
  { item: 'Fan', category: 'Appliances', label: 'Khind Table Fan', wattage: 55, stars: 3, floor: 2, slot: 'B', x: 0.84, y: 0.40, size: 'small', type: 'fan', spriteKey: 'fan' },
];

export const RAW_SPEC_FURNITURE: RawSpecItem[] = [
  // Floor 1 Living room (slot A)
  { item: 'Sofa', category: 'Furniture', label: 'Sofa', floor: 1, slot: 'A', x: 0.26, y: 0.74, size: 'medium', type: 'sofa', spriteKey: 'sofa' },
  { item: 'Coffee table', category: 'Furniture', label: 'Coffee table', floor: 1, slot: 'A', x: 0.62, y: 0.80, size: 'small', type: 'table', spriteKey: 'table' },
  // Floor 1 Kitchen (slot B)
  { item: 'Dining table', category: 'Furniture', label: 'Dining table', floor: 1, slot: 'B', x: 0.55, y: 0.85, size: 'small', type: 'table', spriteKey: 'table' },
  // Floor 1 Bedroom 1 (slot C)
  { item: 'Bed', category: 'Furniture', label: 'Bed', floor: 1, slot: 'C', x: 0.38, y: 0.84, size: 'medium', type: 'bed', spriteKey: 'bed' },
  // Floor 1 Bathroom (slot D)
  { item: 'Sink', category: 'Furniture', label: 'Sink', floor: 1, slot: 'D', x: 0.26, y: 0.60, size: 'small', type: 'sink', spriteKey: 'sink' },
  { item: 'Toilet', category: 'Furniture', label: 'Toilet', floor: 1, slot: 'D', x: 0.72, y: 0.64, size: 'small', type: 'toilet', spriteKey: 'toilet' },
  // Floor 2 Master bedroom (slot A)
  { item: 'Bed', category: 'Furniture', label: 'Bed', floor: 2, slot: 'A', x: 0.40, y: 0.84, size: 'medium', type: 'bed', spriteKey: 'bed' },
  // Floor 2 Bedroom 2 (slot B)
  { item: 'Bed', category: 'Furniture', label: 'Bed', floor: 2, slot: 'B', x: 0.50, y: 0.86, size: 'medium', type: 'bed', spriteKey: 'bed' },
  { item: 'Desk', category: 'Furniture', label: 'Desk', floor: 2, slot: 'B', x: 0.26, y: 0.50, size: 'small', type: 'table', spriteKey: 'table' },
];

/** Items skipped because no picture file exists in frontend/assets/sprites/ */
export const SKIPPED_ITEM_TYPES = [
  'fan',
  'toilet',
  'rug',
  'plant',
  'wardrobe',
  'bedside_table',
  'kitchen_counter',
] as const;

/** Floor 2 optional setup items for Bedroom 3 and Bathroom 2 (when MOCK_FLOOR2_SETUP_ALL = true) */
export const MOCK_FLOOR2_EXTRA_ITEMS: StoredPlacedItem[] = [
  // Bedroom 3 (slot C)
  { id: 'f2-bed-bed3', category: 'Furniture', type: 'bed', spriteKey: 'bed', name: 'Bed', roomId: 'f2-C', posX: 0.2000, posY: 0.8690 },
  { id: 'f2-lamp-bed3', category: 'Appliances', type: 'lights', spriteKey: 'lights', name: 'Philips LED Lights', brand: 'Philips', wattage: 9, stars: 5, hoursPerDay: 6, alwaysOn: false, roomId: 'f2-C', posX: 0.3500, posY: 0.8515, color: '#f6e8d8' },
  // Bathroom 2 (slot D)
  { id: 'f2-sink-bath2', category: 'Furniture', type: 'sink', spriteKey: 'sink', name: 'Sink', roomId: 'f2-D', posX: 0.5936, posY: 0.7700 },
];

/** Placed items on floor plan with verified existing picture files only */
export const MOCK_SIMULATOR_ITEMS: StoredPlacedItem[] = [
  // ── FLOOR 1 ──
  // Living room (f1-A): AC, TV, Lamp, Sofa, Coffee table
  { id: 'f1-ac-living', category: 'Appliances', type: 'air_conditioner', spriteKey: 'air_conditioner', name: 'Panasonic Air Conditioner', brand: 'Panasonic', wattage: 1200, stars: 4, hoursPerDay: 8, alwaysOn: false, roomId: 'f1-A', posX: 0.1276, posY: 0.0657, color: '#d4a373' },
  { id: 'f1-tv-living', category: 'Appliances', type: 'tv', spriteKey: 'tv', name: 'Samsung TV', brand: 'Samsung', wattage: 90, stars: 3, hoursPerDay: 4, alwaysOn: false, roomId: 'f1-A', posX: 0.3480, posY: 0.1262, color: '#8b9d77' },
  { id: 'f1-lamp-living', category: 'Appliances', type: 'lights', spriteKey: 'lights', name: 'Philips LED Lights', brand: 'Philips', wattage: 18, stars: 5, hoursPerDay: 6, alwaysOn: false, roomId: 'f1-A', posX: 0.5220, posY: 0.1700, color: '#f6e8d8' },
  { id: 'f1-sofa-living', category: 'Furniture', type: 'sofa', spriteKey: 'sofa', name: 'Sofa', roomId: 'f1-A', posX: 0.1508, posY: 0.3352 },
  { id: 'f1-table-living', category: 'Furniture', type: 'table', spriteKey: 'table', name: 'Coffee Table', roomId: 'f1-A', posX: 0.3712, posY: 0.3682 },

  // Kitchen (f1-B): Fridge (always on), Lamp, Dining table
  { id: 'f1-fridge-kitchen', category: 'Appliances', type: 'refrigerator', spriteKey: 'refrigerator', name: 'Samsung Inverter Fridge', brand: 'Samsung', wattage: 150, stars: 3, hoursPerDay: 24, alwaysOn: true, roomId: 'f1-B', posX: 0.7060, posY: 0.1374, color: '#5c4033' },
  { id: 'f1-lamp-kitchen', category: 'Appliances', type: 'lights', spriteKey: 'lights', name: 'Philips LED Lights', brand: 'Philips', wattage: 18, stars: 5, hoursPerDay: 6, alwaysOn: false, roomId: 'f1-B', posX: 0.9076, posY: 0.1810, color: '#f6e8d8' },
  { id: 'f1-table-kitchen', category: 'Furniture', type: 'table', spriteKey: 'table', name: 'Dining Table', roomId: 'f1-B', posX: 0.8110, posY: 0.3957 },

  // Bedroom 1 (f1-C): Bed, Bedside lamp (Fan skipped: fan.png missing)
  { id: 'f1-bed-bed1', category: 'Furniture', type: 'bed', spriteKey: 'bed', name: 'Bed', roomId: 'f1-C', posX: 0.1900, posY: 0.8690 },
  { id: 'f1-lamp-bed1', category: 'Appliances', type: 'lights', spriteKey: 'lights', name: 'Philips LED Lights', brand: 'Philips', wattage: 9, stars: 5, hoursPerDay: 6, alwaysOn: false, roomId: 'f1-C', posX: 0.3500, posY: 0.8420, color: '#f6e8d8' },

  // Bathroom (f1-D): Water heater, Sink (Toilet skipped: toilet.png missing)
  { id: 'f1-wh-bath', category: 'Appliances', type: 'water_heater', spriteKey: 'water_heater', name: 'Ariston Water Heater', brand: 'Ariston', wattage: 3500, stars: 3, hoursPerDay: 1, alwaysOn: false, roomId: 'f1-D', posX: 0.6800, posY: 0.6221, color: '#8b9d77' },
  { id: 'f1-sink-bath', category: 'Furniture', type: 'sink', spriteKey: 'sink', name: 'Sink', roomId: 'f1-D', posX: 0.5936, posY: 0.7700 },

  // ── FLOOR 2 ──
  // Master bedroom (f2-A): AC, Bedside lamp, Bed (Fan skipped: fan.png missing)
  { id: 'f2-ac-master', category: 'Appliances', type: 'air_conditioner', spriteKey: 'air_conditioner', name: 'Daikin Air Conditioner', brand: 'Daikin', wattage: 1000, stars: 2, hoursPerDay: 8, alwaysOn: false, roomId: 'f2-A', posX: 0.1740, posY: 0.0657, color: '#d4a373' },
  { id: 'f2-lamp-master', category: 'Appliances', type: 'lights', spriteKey: 'lights', name: 'Philips LED Lights', brand: 'Philips', wattage: 12, stars: 5, hoursPerDay: 6, alwaysOn: false, roomId: 'f2-A', posX: 0.4060, posY: 0.3680, color: '#f6e8d8' },
  { id: 'f2-bed-master', category: 'Furniture', type: 'bed', spriteKey: 'bed', name: 'Bed', roomId: 'f2-A', posX: 0.2320, posY: 0.3902 },

  // Bedroom 2 (f2-B): Desk, Workplace (on desk), Lamp, Bed (Fan skipped: fan.png missing)
  { id: 'f2-desk-bed2', category: 'Furniture', type: 'table', spriteKey: 'table', name: 'Desk', roomId: 'f2-B', posX: 0.7018, posY: 0.2032 },
  { id: 'f2-workplace-bed2', category: 'Appliances', type: 'workplace', spriteKey: 'workplace', name: 'Workplace', brand: '', wattage: 80, stars: 0, hoursPerDay: 8, alwaysOn: false, roomId: 'f2-B', posX: 0.7018, posY: 0.1867, color: '#8b9d77' },
  { id: 'f2-lamp-bed2', category: 'Appliances', type: 'lights', spriteKey: 'lights', name: 'Philips LED Lights', brand: 'Philips', wattage: 9, stars: 5, hoursPerDay: 6, alwaysOn: false, roomId: 'f2-B', posX: 0.8488, posY: 0.2360, color: '#f6e8d8' },
  { id: 'f2-bed-bed2', category: 'Furniture', type: 'bed', spriteKey: 'bed', name: 'Bed', roomId: 'f2-B', posX: 0.7900, posY: 0.4012 },
];

export const MOCK_SIMULATOR_ITEMS_ALL: StoredPlacedItem[] = [
  ...MOCK_SIMULATOR_ITEMS,
  ...MOCK_FLOOR2_EXTRA_ITEMS,
];
