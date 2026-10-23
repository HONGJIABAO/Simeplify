/**
 * SIM-04
 * Logic for Savings Time Fast-Forward.
 * Source: docs/Feature_Requirements.md SIM-04, docs/Workflow.md W3c, docs/design.md Unit 12 §3c.
 *
 * Rules:
 * - Time stops: 1W, 1M, 1Y (weekly, monthly, annual).
 * - Total savings = monthly saving × the selected period's month fraction.
 * - With no swap and no solar, savings is RM 0.
 * - Legacy selector animation duration: 3 s (1W), 4 s (1M), 8 s (1Y).
 * - Animation never alters calculated savings. Reads and writes no data.
 */

export type FastForwardPeriod = '1W' | '1M' | '1Y';

export function isFastForwardPeriod(value: unknown): value is FastForwardPeriod {
  return value === '1W' || value === '1M' || value === '1Y';
}

export const PERIOD_MONTHS: Record<FastForwardPeriod, number> = {
  '1W': 0.25,
  '1M': 1,
  '1Y': 12,
};

export const PERIOD_DURATIONS_MS: Record<FastForwardPeriod, number> = {
  '1W': 3000,
  '1M': 4000,
  '1Y': 8000,
};

export const PERIOD_BILL_UNITS: Record<FastForwardPeriod, '/ week' | '/ month' | '/ year'> = {
  '1W': '/ week',
  '1M': '/ month',
  '1Y': '/ year',
};

export function getPeriodBillTotal(monthlyBillRm: number, period: FastForwardPeriod): number {
  return Math.max(0, monthlyBillRm) * PERIOD_MONTHS[period];
}

/**
 * Calculates total savings over the selected period.
 */
export function calcTotalSavings(
  monthlySaving: number,
  period: FastForwardPeriod
): number {
  return Math.max(0, Math.round(monthlySaving * PERIOD_MONTHS[period]));
}

/**
 * Computes simulated date string given progress (0 to 1).
 * The speed slows down in the last 20% of progress (Unit 12 §3c).
 */
export function getSimulatedDate(
  startDate: Date,
  period: FastForwardPeriod,
  progress: number
): string {
  // Slower easing in the last 20%
  const easedProgress =
    progress < 0.8
      ? (progress / 0.8) * 0.75
      : 0.75 + ((progress - 0.8) / 0.2) * 0.25;

  const totalDays = period === '1W' ? 7 : period === '1Y' ? 365 : 30;
  const currentDays = Math.round(easedProgress * totalDays);

  const targetDate = new Date(startDate.getTime());
  targetDate.setDate(targetDate.getDate() + currentDays);

  const day = targetDate.getDate();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const month = monthNames[targetDate.getMonth()];
  const year = targetDate.getFullYear();

  return `${day} ${month} ${year}`;
}
