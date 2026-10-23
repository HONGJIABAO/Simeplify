// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { calcBillFromKwh } from './billCalc.ts';
const DEFAULT_HOURS: Record<string, number> = {
  air_conditioner: 8, refrigerator: 24, lights: 6, light_bulb: 6, tv: 4,
  water_heater: 1, fan: 6, ceiling_fan: 6, workplace: 8,
  washing_machine: 1, router: 24,
};
const TYPE_NAMES: Record<string, string> = {
  air_conditioner: 'Air Conditioner', refrigerator: 'Refrigerator', lights: 'Room Lamp',
  light_bulb: 'Ceiling Light', tv: 'Television', water_heater: 'Water Heater',
  fan: 'Standing Fan', ceiling_fan: 'Ceiling Fan', workplace: 'Workplace',
  washing_machine: 'Washing Machine', router: 'Wi-Fi Router',
};

export interface EnergyReportItem {
  id: string;
  type: string;
  spriteKey?: string;
  name: string;
  brand?: string;
  wattage?: number;
  stars?: number;
  hoursPerDay?: number;
  alwaysOn?: boolean;
  category?: 'Appliances' | 'Furniture';
}

export interface SwapCatalogEntry {
  type: 'refrigerator' | 'air_conditioner' | 'lights' | 'light_bulb';
  brand: string;
  stars: number;
  wattage: number;
  model?: string;
  inverter?: boolean;
}

// TODO(open-item): replace these placeholder products with the real catalog.
export const SWAP_CATALOG: Record<SwapCatalogEntry['type'], SwapCatalogEntry> = {
  refrigerator: { type: 'refrigerator', brand: 'Panasonic', stars: 5, wattage: 90, model: '5-star inverter', inverter: true },
  air_conditioner: { type: 'air_conditioner', brand: 'Daikin', stars: 5, wattage: 700, model: '5-star inverter', inverter: true },
  lights: { type: 'lights', brand: 'LED', stars: 5, wattage: 9 },
  light_bulb: { type: 'light_bulb', brand: 'LED', stars: 5, wattage: 9 },
};

export interface EnergyReportRow {
  item: EnergyReportItem;
  typeName: string;
  brand: string;
  stars: number;
  hoursPerDay: number;
  watts: number;
  monthlyKwh: number;
  monthlyCostRm: number;
  sharePct: number;
}

export interface EnergySuggestion {
  source: EnergyReportRow;
  replacement: SwapCatalogEntry;
  savingKwh: number;
  savingRm: number;
  text: string;
}

export interface SwapSuggestionCard {
  source: EnergyReportRow;
  replacement: SwapCatalogEntry;
  spriteKey: string;
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function monthlyKwh(watts: number, hoursPerDay: number): number {
  return round(Math.max(0, watts) * Math.max(0, hoursPerDay) * 30 / 1000);
}

export function reportHours(item: EnergyReportItem): number {
  if (item.alwaysOn) return 24;
  return Math.max(0.25, item.hoursPerDay ?? DEFAULT_HOURS[item.spriteKey ?? item.type] ?? DEFAULT_HOURS[item.type] ?? 4);
}

function typeName(item: EnergyReportItem): string {
  return TYPE_NAMES[item.spriteKey ?? item.type] ?? TYPE_NAMES[item.type]
    ?? item.type.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildEnergyReport(items: readonly EnergyReportItem[], totalBillRm: number) {
  const allRows = items
    .filter((item) => item.category !== 'Furniture' && (item.wattage ?? 0) > 0)
    .map((item): EnergyReportRow => {
      const hoursPerDay = reportHours(item);
      const watts = item.wattage ?? 0;
      const kwh = monthlyKwh(watts, hoursPerDay);
      const brand = item.brand?.trim() || (item.type === 'refrigerator' ? 'Sharp' : 'Standard');
      const stars = item.stars ?? (item.type === 'refrigerator' ? 2 : 3);
      return {
        item,
        typeName: typeName(item),
        brand,
        stars,
        hoursPerDay,
        watts,
        monthlyKwh: kwh,
        monthlyCostRm: calcBillFromKwh(kwh),
        sharePct: 0,
      };
    });

  const totalKwh = allRows.reduce((sum, row) => sum + row.monthlyKwh, 0);
  const effectiveBill = totalBillRm > 0 ? totalBillRm : calcBillFromKwh(totalKwh);
  allRows.forEach((row) => {
    row.sharePct = effectiveBill > 0 ? Math.min(100, Math.round(row.monthlyCostRm / effectiveBill * 100)) : 0;
  });
  const topRows = [...allRows].sort((a, b) => b.monthlyKwh - a.monthlyKwh || a.item.id.localeCompare(b.item.id)).slice(0, 3);
  const insight = [...allRows].sort((a, b) => Number(b.item.alwaysOn) - Number(a.item.alwaysOn)
    || b.hoursPerDay - a.hoursPerDay || b.monthlyKwh - a.monthlyKwh)[0] ?? null;
  const biggest = insight && insight.monthlyKwh >= Math.max(...allRows.map((row) => row.monthlyKwh));
  const insightText = insight
    ? `Your ${insight.typeName.toLowerCase()} runs ${insight.hoursPerDay.toFixed(insight.hoursPerDay % 1 ? 1 : 0)} hours a day and is ${biggest ? 'the biggest user' : 'one of the longest-running users'} of electricity in your home.`
    : 'No appliance usage was recorded in this simulation.';

  const suggestionSource = (insight && SWAP_CATALOG[insight.item.type as keyof typeof SWAP_CATALOG] ? insight : null)
    ?? topRows.find((row) => SWAP_CATALOG[row.item.type as keyof typeof SWAP_CATALOG])
    ?? null;
  let suggestion: EnergySuggestion | null = null;
  if (suggestionSource) {
    const replacement = SWAP_CATALOG[suggestionSource.item.type as keyof typeof SWAP_CATALOG];
    const replacementKwh = monthlyKwh(replacement.wattage, suggestionSource.hoursPerDay);
    const savingKwh = round(Math.max(0, suggestionSource.monthlyKwh - replacementKwh));
    const savingRm = round(Math.max(0, suggestionSource.monthlyCostRm - calcBillFromKwh(replacementKwh)));
    suggestion = {
      source: suggestionSource,
      replacement,
      savingKwh,
      savingRm,
      text: `Replace the ${suggestionSource.brand} ${suggestionSource.stars}-star ${suggestionSource.typeName.toLowerCase()} with a ${replacement.brand} ${replacement.stars}-star${replacement.inverter ? ' inverter' : ''} ${suggestionSource.typeName.toLowerCase()}: saves about ${Math.round(savingKwh)} kWh and RM ${Math.round(savingRm)} every month.`,
    };
  }

  return { allRows, topRows, insight, insightText, suggestion, totalKwh, totalBillRm: effectiveBill };
}

export function buildSwapSuggestionCards(rows: readonly EnergyReportRow[]): SwapSuggestionCard[] {
  return rows.flatMap((source) => {
    const replacement = SWAP_CATALOG[source.item.type as keyof typeof SWAP_CATALOG];
    return replacement ? [{ source, replacement, spriteKey: source.item.spriteKey || source.item.type }] : [];
  });
}

export function applySwapToItem<T extends EnergyReportItem>(item: T, replacement: SwapCatalogEntry): T {
  return {
    ...item,
    brand: replacement.brand,
    wattage: replacement.wattage,
    stars: replacement.stars,
  };
}
