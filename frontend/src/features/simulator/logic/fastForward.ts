/**
 * SIM-04
 * Logic for Savings Time Fast-Forward.
 * Source: docs/Feature_Requirements.md SIM-04, docs/Workflow.md W3c, docs/design.md Unit 12 §3c.
 *
 * Rules:
 * - Time stops: 1M (1 month), 6M (6 months), 1Y (12 months).
 * - Total savings = monthly saving × months.
 * - With no swap and no solar, savings is RM 0.
 * - Animation duration: 4 s (1M), 6 s (6M), 8 s (1Y).
 * - Animation never alters calculated savings. Reads and writes no data.
 */

export type FastForwardPeriod = '1M' | '6M' | '1Y';

export const PERIOD_MONTHS: Record<FastForwardPeriod, number> = {
  '1M': 1,
  '6M': 6,
  '1Y': 12,
};

export const PERIOD_DURATIONS_MS: Record<FastForwardPeriod, number> = {
  '1M': 4000,
  '6M': 6000,
  '1Y': 8000,
};

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

  const totalDays = PERIOD_MONTHS[period] * 30;
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
