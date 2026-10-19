/**
 * SIM-05
 * Helper: maps appliance type to a lucide icon name (string).
 * Used when a real sprite is missing (Stage 6, view only).
 * Source: docs/page_refined.md S4.2 appliance icon guidance.
 */

import { ApplianceType } from '@/lib/mockData';

/**
 * Returns the recommended lucide icon name for each appliance type.
 * Screens use <LucideIcon> components based on this.
 */
export function getApplianceIconName(type: ApplianceType): string {
  switch (type) {
    case 'air_conditioner':
      return 'air-vent';
    case 'refrigerator':
      return 'refrigerator';
    case 'water_heater':
      return 'shower-head';
    case 'tv':
      return 'tv';
    case 'fan':
      return 'fan';
    case 'lights':
      return 'lightbulb';
    default:
      return 'plug';
  }
}

/** Same as getApplianceIconName — re-exported for import convenience */
export const getApplianceIcon = getApplianceIconName;
