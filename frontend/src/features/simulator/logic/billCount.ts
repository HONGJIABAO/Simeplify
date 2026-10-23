/** Pure display-only helpers. They never alter the calculated bill. */
export const BILL_COUNT_DURATION_MS = 1500;

export function clampProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

export function easeOutBillProgress(progress: number): number {
  const value = clampProgress(progress);
  return 1 - Math.pow(1 - value, 3);
}

export function billCountValue(target: number, progress: number, linear = false): number {
  const safeTarget = Math.max(0, target);
  const applied = linear ? clampProgress(progress) : easeOutBillProgress(progress);
  return Math.min(safeTarget, Math.round(safeTarget * applied));
}
