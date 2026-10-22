import type { StoredPlacedItem } from './storage';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { WORKPLACE_DEFAULT_WATTS } from './applianceConstants.ts';

export const PLAN_ITEM_LABEL_DURATION_MS = 3000;

function fallbackName(type: string) {
  return type
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getPlanItemDisplayName(item: Pick<StoredPlacedItem, 'brand' | 'name' | 'type'>) {
  return item.brand?.trim() || item.name?.trim() || fallbackName(item.type);
}

export function hasVisiblePlanWattage(
  item: Pick<StoredPlacedItem, 'category' | 'type' | 'spriteKey' | 'wattage'>
) {
  if (item.category !== 'Appliances' || !item.wattage || item.wattage <= 0) return false;
  const isWorkplace = item.type === 'workplace' || item.spriteKey === 'workplace';
  return !(isWorkplace && item.wattage === WORKPLACE_DEFAULT_WATTS);
}

export function getPlanItemLabel(item: StoredPlacedItem) {
  const name = getPlanItemDisplayName(item);
  return hasVisiblePlanWattage(item) ? `${name} · ${item.wattage} W` : name;
}

export function getPlanItemAccessibilityLabel(item: StoredPlacedItem) {
  const name = getPlanItemDisplayName(item);
  return hasVisiblePlanWattage(item) ? `${name}, ${item.wattage} watts` : name;
}
