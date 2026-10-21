/** SIM-05 — data-driven edit tray lists. */
import type { ImageSourcePropType } from 'react-native';
// @ts-expect-error Node's TypeScript test runner requires the source extension.
import { APPLIANCE_SPRITES, FURNITURE_SPRITES, SPRITE_MAP, type SpriteItemDef } from './spriteMap.ts';
// @ts-expect-error Node's TypeScript test runner requires the source extension.
import { getInTrayTypeIds } from './trayRules.ts';

export interface ApplianceTrayRow {
  id: string;
  name: string;
  sprite_key: string;
  in_tray: boolean;
  sort_order: number;
  always_on?: boolean;
  needs_person?: boolean;
  has_star_rating?: boolean;
  swap_eligible?: boolean;
}

function missingCatalogItem(row: ApplianceTrayRow): SpriteItemDef {
  return {
    key: row.id,
    label: row.name,
    fullName: row.name,
    category: 'Appliances',
    source: 0 as unknown as ImageSourcePropType,
    defaultWattage: 0,
    defaultHours: 0,
    inTray: true,
    alwaysOn: row.always_on,
    needsPerson: row.needs_person,
    hasStarRating: row.has_star_rating,
    swapEligible: row.swap_eligible,
    baseWidth: 52,
    baseHeight: 52,
  };
}

export function buildApplianceTrayItems(rows: readonly ApplianceTrayRow[]): SpriteItemDef[] {
  if (!rows.length) return APPLIANCE_SPRITES.filter((item) => item.inTray);
  const byId = new Map(rows.map((row) => [row.id, row]));
  return getInTrayTypeIds(rows).map((id) => byId.get(id)!).map((row) => {
      const manifest = SPRITE_MAP[row.sprite_key] ?? SPRITE_MAP[row.id];
      return manifest ? { ...manifest, key: row.id, label: row.name, fullName: row.name, inTray: true }
        : missingCatalogItem(row);
    });
}

export function buildFurnitureTrayItems(): SpriteItemDef[] {
  return FURNITURE_SPRITES.filter((item) => item.inTray);
}
