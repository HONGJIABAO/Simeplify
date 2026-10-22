/**
 * SCN-01 / SCN-02 / SCN-03 / SCN-04
 * Core Scanner logic, pure reason mapping, and chart calculation functions.
 * Pure TypeScript with no platform dependencies.
 */

export type WaterAlertLevel = 'normal' | 'minor_drip' | 'leak_detected' | 'major_pipe_burst';

export interface BillAnalysisComparison {
  mom_change_pct?: number | null;
  avg_3m_diff?: number | null;
  yoy_diff?: number | null;
  rank_6m?: string | null;
  streak?: string | null;
}

export interface BillAnalysis {
  summary?: string;
  estimate_kwh?: number;
  comparison?: BillAnalysisComparison;
  reasons?: string[];
  tips?: string[];
  footer_disclaimer?: string;
}

export interface Bill {
  id: string;
  household_id: string;
  file_path: string;
  type: 'electricity' | 'water';
  billing_month: string; // ISO date 'YYYY-MM-01'
  usage: number;
  amount: number;
  analysis?: BillAnalysis | null;
  created_at: string;
  updated_at: string;
  provider?: string | null;
  alertLevel?: WaterAlertLevel;
}

export interface BillAlert {
  id: string;
  household_id: string;
  bill_id: string;
  level: WaterAlertLevel;
  message: string;
  created_at: string;
}

export interface MonthlyChartDataPoint {
  month: string; // 'YYYY-MM-01'
  label: string; // 'Jun', 'Jul', etc.
  electricityRm: number;
  electricityKwh: number;
  waterRm: number;
  waterM3: number;
  totalRm: number;
  waterAlertLevel?: WaterAlertLevel;
}

/**
 * Calm, user-facing copy for points withheld reason codes.
 * Constant mapping; raw codes are never exposed to users.
 */
export const POINTS_WITHHELD_MESSAGES: Record<string, string> = {
  values_changed: 'No points: the numbers were changed after we read your bill.',
  my_day_not_set: 'Set up My day in the Simulator to earn energy points.',
  not_lower_than_estimate: "This month's usage was not lower than your estimate.",
  already_awarded: 'You already earned energy points for this month.',
  daily_limit_reached: "You have reached today's limit of 3 green deeds.",
  bill_not_electricity: '',
};

/**
 * Resolves user-facing message for points withheld reason.
 * Returns null if points awarded or no reason applies.
 */
export function getPointsWithheldMessage(reason: string | null | undefined): string | null {
  if (!reason || reason === 'bill_not_electricity') return null;
  return POINTS_WITHHELD_MESSAGES[reason] || null;
}

/**
 * Normalizes input billing month string into the required database date format 'YYYY-MM-01'.
 */
export function normalizeBillingMonth(monthStr: string): string {
  if (!monthStr || typeof monthStr !== 'string') {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  const trimmed = monthStr.trim();
  // Check YYYY-MM or YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    return `${y}-${m}-01`;
  }

  // Parse strings like "October 2026" or "Oct 2026"
  const parsed = Date.parse(trimmed.includes('1,') ? trimmed : `1 ${trimmed}`);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }

  const fallback = new Date();
  return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Formats ISO date 'YYYY-MM-01' into human readable format, e.g. "October 2026" or "Oct".
 */
export function formatBillingMonthDisplay(isoDate: string, short = false): string {
  if (!isoDate) return '';
  const d = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00Z`);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-MY', {
    month: short ? 'short' : 'long',
    year: short ? undefined : 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Builds 5-month chart data points from real bills history.
 */
export function buildUsageChartData(bills: Bill[]): MonthlyChartDataPoint[] {
  if (!bills || bills.length === 0) return [];

  const monthMap = new Map<string, { electricity?: Bill; water?: Bill }>();

  for (const b of bills) {
    const key = b.billing_month;
    const entry = monthMap.get(key) || {};
    if (b.type === 'electricity') entry.electricity = b;
    if (b.type === 'water') entry.water = b;
    monthMap.set(key, entry);
  }

  const sortedMonths = Array.from(monthMap.keys()).sort();
  const recentMonths = sortedMonths.slice(-6);

  return recentMonths.map((monthKey) => {
    const pair = monthMap.get(monthKey)!;
    const elecBill = pair.electricity;
    const waterBill = pair.water;

    const elecRm = elecBill?.amount ?? 0;
    const elecKwh = elecBill?.usage ?? 0;
    const waterRm = waterBill?.amount ?? 0;
    const waterM3 = waterBill?.usage ?? 0;

    return {
      month: monthKey,
      label: formatBillingMonthDisplay(monthKey, true),
      electricityRm: elecRm,
      electricityKwh: elecKwh,
      waterRm: waterRm,
      waterM3: waterM3,
      totalRm: Math.round((elecRm + waterRm) * 100) / 100,
      waterAlertLevel: waterBill?.alertLevel,
    };
  });
}
