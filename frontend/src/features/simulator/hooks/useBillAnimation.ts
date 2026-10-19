/**
 * SIM-01
 * Hook: animates a bill number counting up or down over 700 ms.
 * Source: docs/design.md Unit 7, docs/page_refined.md S4.1.
 * Respects AccessibilityInfo.isReduceMotionEnabled.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

/**
 * Returns a formatted RM string for the animated bill value.
 * Counts up or down over 700 ms when `target` changes.
 */
export function useBillAnimation(target: number): string {
  const [displayValue, setDisplayValue] = useState(target);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [prevTarget, setPrevTarget] = useState(target);
  const animated = useSharedValue(target);

  // Check reduced motion once on mount
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Adjust state during render when target changes (official React pattern)
  if (target !== prevTarget) {
    setPrevTarget(target);
    if (reduceMotion) {
      setDisplayValue(target);
    }
  }

  useEffect(() => {
    if (reduceMotion || target === displayValue) return;

    animated.value = withTiming(target, {
      duration: 700,
      easing: Easing.inOut(Easing.ease),
    });

    const startVal = displayValue;
    const startTime = Date.now();
    const duration = 700;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-in-out approximation in JS
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const current = Math.round(startVal + (target - startVal) * eased);
      setDisplayValue(current);
      if (progress >= 1) {
        clearInterval(interval);
        setDisplayValue(target);
      }
    }, 16);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduceMotion]);

  return (
    'RM ' +
    displayValue.toLocaleString('en-MY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}
