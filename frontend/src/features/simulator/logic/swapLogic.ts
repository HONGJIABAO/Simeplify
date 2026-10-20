/**
 * SIM-02, SIM-03
 * Pure logic for Smart Appliance Swap & Compare and Solar Panel Suggestion.
 * Source: docs/Feature_Requirements.md SIM-02, SIM-03, docs/page_refined.md S4.4.
 *
 * Rules:
 * - Only suggest swaps for frequently used appliances with stars < 5.
 * - Suggested rating is strictly higher (5 stars).
 * - Air conditioner suggestion must specify "Inverter".
 * - Shows monthly saving ("Save RM 80/month").
 * - Solar suggestion triggers when monthly bill >= RM 500 (~40% saving).
 * - Try swap is in-memory only.
 */

import { Appliance } from '@/lib/mockData';
import { ENABLE_LIGHTS_SWAP } from '@/lib/flags';
import { calcBillFromKwh } from './billCalc';
import { SPRITE_MAP } from './spriteMap';

export interface SwapSuggestion {
  id: string;
  applianceId: string;
  originalApplianceName: string;
  originalStars: number;
  label: string;
  suggestedStars: number;
  isInverter: boolean;
  monthlySavingRm: number;
  newWattage: number;
  newMonthlyKwh: number;
}

/**
 * Derives swap recommendations for existing appliances.
 */
export function getSwapSuggestions(
  appliances: Appliance[],
  totalKwh: number,
  baseBillRm: number
): SwapSuggestion[] {
  const suggestions: SwapSuggestion[] = [];

  for (const app of appliances) {
    const typeDefinition = SPRITE_MAP[app.spriteKey || app.type];
    if (typeDefinition?.swapEligible === false) continue;
    // 5-star appliances have no higher rating to upgrade to
    if (app.stars >= 5) continue;

    // Check flag for lighting swap
    if (app.type === 'lights' && !ENABLE_LIGHTS_SWAP) continue;

    let label = '';
    let isInverter = false;
    let wattageFactor = 0.65; // ~35% energy reduction for 5-star upgrade

    if (app.type === 'air_conditioner') {
      label = '5★ Inverter AC';
      isInverter = true;
      wattageFactor = 0.55; // Inverter AC saves ~45%
    } else if (app.type === 'refrigerator') {
      label = '5★ Eco Fridge';
      wattageFactor = 0.60;
    } else if (app.type === 'lights') {
      label = 'Full Home LED';
      wattageFactor = 0.40;
    } else if (app.type === 'water_heater') {
      label = '5★ Heat Pump Heater';
      wattageFactor = 0.70;
    } else if (app.type === 'fan') {
      label = '5★ DC Motor Fan';
      wattageFactor = 0.50;
    } else {
      label = `5★ ${app.name}`;
      wattageFactor = 0.65;
    }

    const newWattage = Math.round(app.wattage * wattageFactor);
    // Estimated reduction in monthly kWh proportional to wattage reduction
    const kwhReduction = (app.wattage - newWattage) * 0.08; // approximate monthly usage hours
    const newKwh = Math.max(0, totalKwh - kwhReduction);
    const newBillRm = calcBillFromKwh(newKwh);
    const savingRm = Math.max(10, Math.round(baseBillRm - newBillRm));

    suggestions.push({
      id: `swap-${app.id}`,
      applianceId: app.id,
      originalApplianceName: app.name,
      originalStars: app.stars,
      label,
      suggestedStars: 5,
      isInverter,
      monthlySavingRm: savingRm,
      newWattage,
      newMonthlyKwh: newKwh,
    });
  }

  return suggestions;
}

/**
 * Checks whether solar suggestion should be shown.
 * Threshold: bill >= RM 500 (SIM-03).
 */
export function shouldShowSolar(billRm: number, sessionDismissed: boolean): boolean {
  if (sessionDismissed) return false;
  return billRm >= 500;
}

/**
 * Solar panel estimated monthly savings (~40% of bill).
 */
export function calcSolarSavings(billRm: number): number {
  return Math.round(billRm * 0.40);
}
