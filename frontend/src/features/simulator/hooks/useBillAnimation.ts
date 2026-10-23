/**
 * SIM-01
 * Hook: animates a bill number counting up or down over 700 ms.
 * Source: docs/design.md Unit 7, docs/page_refined.md S4.1.
 * Respects AccessibilityInfo.isReduceMotionEnabled.
 */

import { useBillCountUp } from './useBillCountUp';

/**
 * Returns a formatted RM string for the animated bill value.
 * Counts up or down over 700 ms when `target` changes.
 */
export function useBillAnimation(target: number): string {
  const displayValue = useBillCountUp(target);

  return (
    'RM ' +
    displayValue.toLocaleString('en-MY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}
