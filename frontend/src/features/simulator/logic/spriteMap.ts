/**
 * Central Sprite Map for Simulator
 * Maps every appliance, furniture, and avatar directly to local PNG assets.
 * NO emojis, NO icon fonts, NO placeholder shapes.
 */

import { ImageSourcePropType } from 'react-native';

export type SpriteCategory = 'Appliances' | 'Furniture' | 'Avatar';

export interface SpriteItemDef {
  key: string;
  label: string;
  fullName: string;
  category: SpriteCategory;
  source: ImageSourcePropType;
  defaultWattage: number;
  defaultHours: number;
  alwaysOn?: boolean;
  isSleepingSpot?: boolean;
  baseWidth: number;
  baseHeight: number;
}

export const APPLIANCE_SPRITES: SpriteItemDef[] = [
  {
    key: 'air_conditioner',
    label: 'Air cond.',
    fullName: 'Air Conditioner',
    category: 'Appliances',
    source: require('../../../../assets/sprites/appliances/aircon.png'),
    defaultWattage: 1200,
    defaultHours: 8,
    baseWidth: 54,
    baseHeight: 28,
  },
  {
    key: 'refrigerator',
    label: 'Fridge',
    fullName: 'Refrigerator',
    category: 'Appliances',
    source: require('../../../../assets/sprites/appliances/fridge.png'),
    defaultWattage: 120,
    defaultHours: 24,
    alwaysOn: true,
    baseWidth: 42,
    baseHeight: 52,
  },
  {
    key: 'lights',
    label: 'Lights',
    fullName: 'Room Lamp',
    category: 'Appliances',
    source: require('../../../../assets/sprites/appliances/light.png'),
    defaultWattage: 20,
    defaultHours: 6,
    baseWidth: 38,
    baseHeight: 48,
  },
  {
    key: 'tv',
    label: 'TV',
    fullName: 'Television',
    category: 'Appliances',
    source: require('../../../../assets/sprites/appliances/tv.png'),
    defaultWattage: 90,
    defaultHours: 4,
    baseWidth: 50,
    baseHeight: 42,
  },
  {
    key: 'light_bulb',
    label: 'Light bulb',
    fullName: 'Ceiling Light',
    category: 'Appliances',
    source: require('../../../../assets/sprites/appliances/light_bulb.png'),
    defaultWattage: 10,
    defaultHours: 6,
    baseWidth: 36,
    baseHeight: 44,
  },
  {
    key: 'water_heater',
    label: 'Water heater',
    fullName: 'Water Heater',
    category: 'Appliances',
    source: require('../../../../assets/sprites/appliances/shower.png'),
    defaultWattage: 3500,
    defaultHours: 1,
    baseWidth: 44,
    baseHeight: 50,
  },
];

export const FURNITURE_SPRITES: SpriteItemDef[] = [
  {
    key: 'bed',
    label: 'Bed',
    fullName: 'Comfort Bed',
    category: 'Furniture',
    source: require('../../../../assets/sprites/furniture/bed.png'),
    defaultWattage: 0,
    defaultHours: 0,
    isSleepingSpot: true,
    baseWidth: 62,
    baseHeight: 54,
  },
  {
    key: 'sofa',
    label: 'Sofa',
    fullName: 'Living Sofa',
    category: 'Furniture',
    source: require('../../../../assets/sprites/furniture/sofa.png'),
    defaultWattage: 0,
    defaultHours: 0,
    baseWidth: 60,
    baseHeight: 44,
  },
  {
    key: 'table',
    label: 'Table',
    fullName: 'Dining Table',
    category: 'Furniture',
    source: require('../../../../assets/sprites/furniture/table.png'),
    defaultWattage: 0,
    defaultHours: 0,
    baseWidth: 52,
    baseHeight: 44,
  },
  {
    key: 'sink',
    label: 'Sink',
    fullName: 'Bathroom Sink',
    category: 'Furniture',
    source: require('../../../../assets/sprites/furniture/sink.png'),
    defaultWattage: 0,
    defaultHours: 0,
    baseWidth: 44,
    baseHeight: 46,
  },
];

export const AVATAR_SPRITES = {
  avatar_girl: {
    key: 'avatar_girl',
    label: 'Girl Resident',
    source: require('../../../../assets/sprites/avatar/avatar_girl.png'),
    faceSource: require('../../../../assets/sprites/avatar/avatar_girl_face.png'),
    width: 44,
    height: 60,
  },
  avatar_boy: {
    key: 'avatar_boy',
    label: 'Boy Resident',
    source: require('../../../../assets/sprites/avatar/avatar_boy.png'),
    faceSource: require('../../../../assets/sprites/avatar/avatar_boy_face.png'),
    width: 44,
    height: 60,
  },
};

/** All catalog items combined */
export const ALL_CATALOG_ITEMS: SpriteItemDef[] = [
  ...APPLIANCE_SPRITES,
  ...FURNITURE_SPRITES,
];

/** Fast lookup by sprite key */
export const SPRITE_MAP: Record<string, SpriteItemDef> = ALL_CATALOG_ITEMS.reduce(
  (acc, item) => {
    acc[item.key] = item;
    return acc;
  },
  {} as Record<string, SpriteItemDef>
);

/** Get image source safely for any sprite key */
export function getSpriteSource(key: string): ImageSourcePropType | null {
  if (SPRITE_MAP[key]) {
    return SPRITE_MAP[key].source;
  }
  if (key === 'avatar_girl' || key === 'girl') {
    return AVATAR_SPRITES.avatar_girl.source;
  }
  if (key === 'avatar_boy' || key === 'boy') {
    return AVATAR_SPRITES.avatar_boy.source;
  }
  return null;
}
