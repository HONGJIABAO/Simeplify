// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { monthlyKwh, reportHours, type EnergyReportItem } from './energyReport.ts';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { getPeriodBillTotal, PERIOD_MONTHS, type FastForwardPeriod } from './fastForward.ts';

export type BillPeriod = FastForwardPeriod;

/** Display periods are derived from the monthly estimate; no tariff is changed. */
export const BILL_PERIOD_FACTORS: Record<BillPeriod, number> = PERIOD_MONTHS;

export const BILL_PERIOD_LABELS: Record<BillPeriod, 'week' | 'month' | 'year'> = {
  '1W': 'week',
  '1M': 'month',
  '1Y': 'year',
};

export const BILL_PERIOD_HEADINGS: Record<BillPeriod, 'weekly' | 'monthly' | 'yearly'> = {
  '1W': 'weekly',
  '1M': 'monthly',
  '1Y': 'yearly',
};

export function getBillPeriodFactor(period: BillPeriod): number {
  return BILL_PERIOD_FACTORS[period];
}

export function getBillPeriodTotal(monthlyAmount: number, period: BillPeriod): number {
  return getPeriodBillTotal(monthlyAmount, period);
}

/**
 * Produce a useful monthly kWh value when a persisted item has no usage row.
 * This is display-only; the live household total remains the source of truth.
 */
export function getReasonableMonthlyKwh(item: EnergyReportItem): number {
  return monthlyKwh(item.wattage ?? 100, reportHours(item));
}

/** Keep appliance shares aligned with the live household total. */
export function normalizeKwhToTotal(values: readonly number[], totalKwh: number): number[] {
  const positiveValues = values.map((value) => Math.max(0, value));
  const rawTotal = positiveValues.reduce((sum, value) => sum + value, 0);
  if (rawTotal <= 0 || totalKwh <= 0) return positiveValues;
  const scale = totalKwh / rawTotal;
  return positiveValues.map((value) => value * scale);
}

/** Allocate whole-number percentage points while keeping every used appliance visible. */
export function allocateAppliancePercentages(values: readonly number[]): number[] {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) return values.map(() => 0);

  const raw = values.map((value) => Math.max(0, value) / total * 100);
  const positiveIndexes = raw.flatMap((value, index) => (value > 0 ? [index] : []));
  const minimum = positiveIndexes.length <= 100 ? 1 : 0;
  const result = raw.map((value) => (value > 0 ? Math.max(minimum, Math.floor(value)) : 0));
  let remaining = 100 - result.reduce((sum, value) => sum + value, 0);
  const remainders = raw
    .map((value, index) => ({ index, value: value - result[index] }))
    .sort((a, b) => b.value - a.value || a.index - b.index);

  for (const entry of remainders) {
    if (remaining <= 0) break;
    result[entry.index] += 1;
    remaining -= 1;
  }
  return result;
}
