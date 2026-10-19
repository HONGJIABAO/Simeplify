/**
 * SIM-04
 * Fast-forward time selector and animation control panel.
 * Source: docs/Feature_Requirements.md SIM-04, docs/Workflow.md W3c, docs/design.md Unit 12 §3c.
 *
 * Rules:
 * - Opens under the top area and pushes the floor plan down (never covers it).
 * - Selector with 3 stops: 1M · 6M · 1Y (default 1M).
 * - Total savings = monthly saving × months.
 * - Displays "Save RM {amount}" (Lora 18, sage-600) and hint "Tap again to play."
 * - Letting go of the slider does NOT play.
 * - Tapping during playback stops it.
 * - Reduced motion skips animation and displays final values directly.
 * - Auto-closes 10 s after completion.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { Slider, SliderStop } from '@/components/Slider';
import {
  FastForwardPeriod,
  calcTotalSavings,
  PERIOD_DURATIONS_MS,
  getSimulatedDate,
} from '../logic/fastForward';

interface FastForwardPanelProps {
  visible: boolean;
  period: FastForwardPeriod;
  onPeriodChange: (period: FastForwardPeriod) => void;
  monthlySavingRm: number;
  isPlaying: boolean;
  onPlaybackComplete: () => void;
  onPlaybackStop: () => void;
  onSimulatedDateChange?: (dateStr: string | null) => void;
  onClose: () => void;
}

const STOPS: SliderStop[] = [
  { value: 0, label: '1M' },
  { value: 1, label: '6M' },
  { value: 2, label: '1Y' },
];

const STOP_INDEX_TO_PERIOD: Record<number, FastForwardPeriod> = {
  0: '1M',
  1: '6M',
  2: '1Y',
};

const PERIOD_TO_STOP_INDEX: Record<FastForwardPeriod, number> = {
  '1M': 0,
  '6M': 1,
  '1Y': 2,
};

export function FastForwardPanel({
  visible,
  period,
  onPeriodChange,
  monthlySavingRm,
  isPlaying,
  onPlaybackComplete,
  onPlaybackStop,
  onSimulatedDateChange,
  onClose,
}: FastForwardPanelProps) {
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSavings = useMemo(
    () => calcTotalSavings(monthlySavingRm, period),
    [monthlySavingRm, period]
  );

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      if (animationFrameRef.current) clearInterval(animationFrameRef.current);
    };
  }, []);

  // Handle playback animation
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) clearInterval(animationFrameRef.current);
      return;
    }

    // Check reduced motion
    AccessibilityInfo.isReduceMotionEnabled().then((isReduced) => {
      if (isReduced) {
        // Immediately complete with final date
        const finalDate = getSimulatedDate(new Date(), period, 1);
        onSimulatedDateChange?.(finalDate);
        onPlaybackComplete();
        // Auto-close in 10s
        autoCloseTimerRef.current = setTimeout(onClose, 10000);
        return;
      }

      const duration = PERIOD_DURATIONS_MS[period];
      const startTime = Date.now();
      const startDate = new Date();

      animationFrameRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentDateStr = getSimulatedDate(startDate, period, progress);
        onSimulatedDateChange?.(currentDateStr);

        if (progress >= 1) {
          if (animationFrameRef.current) clearInterval(animationFrameRef.current);
          onPlaybackComplete();
          // Auto-close 10 s after completion
          autoCloseTimerRef.current = setTimeout(onClose, 10000);
        }
      }, 50);
    });

    return () => {
      if (animationFrameRef.current) clearInterval(animationFrameRef.current);
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [isPlaying, period, onPlaybackComplete, onSimulatedDateChange, onClose]);

  if (!visible) return null;

  const sliderValue = PERIOD_TO_STOP_INDEX[period];

  const handleSliderChange = (val: number) => {
    if (isPlaying) {
      onPlaybackStop();
    }
    const snapped = Math.round(val);
    const newPeriod = STOP_INDEX_TO_PERIOD[snapped] ?? '1M';
    onPeriodChange(newPeriod);
  };

  return (
    <View style={styles.panel}>
      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          value={sliderValue}
          min={0}
          max={2}
          step={1}
          stops={STOPS}
          onChange={handleSliderChange}
        />
      </View>

      {/* Info row */}
      <View style={styles.infoRow}>
        <View>
          <Text style={styles.savingsHero}>
            {totalSavings > 0 ? `Save RM ${totalSavings.toLocaleString('en-MY')}` : 'Save RM 0'}
          </Text>
          <Text style={styles.savingsSub}>
            {isPlaying
              ? 'Fast-forward playing • Tap to stop'
              : 'Tap fast-forward button again to play.'}
          </Text>
        </View>

        <View style={styles.periodBadge}>
          <Text style={styles.periodBadgeText}>{period}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#faf6f1',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 16,
    marginBottom: 8,
  },
  sliderContainer: {
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingsHero: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#566549', // sage-600
  },
  savingsSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e', // stone-600
    marginTop: 2,
  },
  periodBadge: {
    backgroundColor: '#e0e6d9', // sage-100
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  periodBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#566549', // sage-600
  },
});
