import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { BILL_COUNT_DURATION_MS, billCountValue } from '../logic/billCount';

/** Display-only bill animation. Reel progress is linear; normal changes restart at RM 0. */
export function useBillCountUp(target: number, reelProgress: number | null = null): number {
  const [display, setDisplay] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const previousReelProgress = useRef<number | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const wasReel = previousReelProgress.current !== null;
    previousReelProgress.current = reelProgress;
    if (reduceMotion) {
      const timer = setTimeout(() => setDisplay(target), 0);
      return () => clearTimeout(timer);
    }
    if (reelProgress !== null) {
      const timer = setTimeout(() => setDisplay(billCountValue(target, reelProgress, true)), 0);
      return () => clearTimeout(timer);
    }
    if (wasReel) {
      const timer = setTimeout(() => setDisplay(target), 0);
      return () => clearTimeout(timer);
    }

    const startedAt = Date.now();
    const resetTimer = setTimeout(() => setDisplay(0), 0);
    const timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / BILL_COUNT_DURATION_MS);
      setDisplay(billCountValue(target, progress));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => {
      clearTimeout(resetTimer);
      clearInterval(timer);
    };
  }, [reduceMotion, reelProgress, target]);

  return display;
}
