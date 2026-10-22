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

export interface FurnitureTrayRow {
  id: string;
  name: string;
  sprite_key: string;
  in_tray: boolean;
  sort_order: number;
  active?: boolean;
}

export const ENABLE_FURNITURE_TAB = true;

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
  const fallback = APPLIANCE_SPRITES.filter((item) => item.inTray !== false);
  if (!rows || !rows.length) return fallback;
  const byId = new Map(rows.map((row) => [row.id, row]));
  const inTrayIds = getInTrayTypeIds(rows);
  if (!inTrayIds.length) return fallback;
  const items = inTrayIds
    .map((id) => {
      const row = byId.get(id);
      if (!row) return SPRITE_MAP[id];
      const manifest =
        SPRITE_MAP[row.sprite_key] ??
        SPRITE_MAP[row.id] ??
        (row.id === 'router' || row.sprite_key === 'router' ? SPRITE_MAP['wifi_router'] : undefined);
      return manifest
        ? { ...manifest, key: row.id, label: row.name, fullName: row.name, inTray: true }
        : missingCatalogItem(row);
    });
  return items.filter((item): item is SpriteItemDef => Boolean(item)).length
    ? items.filter((item): item is SpriteItemDef => Boolean(item))
    : fallback;
}

export function buildFurnitureTrayItems(rows: readonly FurnitureTrayRow[]): SpriteItemDef[] {
  const fallback = FURNITURE_SPRITES.filter((item) => item.inTray !== false);
  if (!rows.length) return fallback;
  const byId = new Map(FURNITURE_SPRITES.map((item) => [item.key, item]));
  return [...rows]
    .filter((row) => row.in_tray && row.active !== false)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => {
      const manifest = byId.get(row.sprite_key) ?? byId.get(row.id);
      return manifest
        ? { ...manifest, key: row.id, label: row.name, fullName: row.name, inTray: true }
        : missingCatalogItem({ ...row, always_on: false, needs_person: false, has_star_rating: false, swap_eligible: false });
    });
}
