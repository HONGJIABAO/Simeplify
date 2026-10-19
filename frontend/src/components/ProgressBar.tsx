import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AccessibilityInfo, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  style?: StyleProp<ViewStyle>;
  fillColor?: string;
}

export function ProgressBar({
  progress,
  height = 10,
  style,
  fillColor = '#8b9d77', // sage-400
}: ProgressBarProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove();
  }, []);

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const animatedProgress = useSharedValue(clampedProgress);

  useEffect(() => {
    if (reduceMotion) {
      animatedProgress.value = clampedProgress;
    } else {
      animatedProgress.value = withTiming(clampedProgress, {
        duration: 700,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [clampedProgress, reduceMotion, animatedProgress]);

  const fillAnimatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View
      style={[styles.track, { height }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: fillColor, height },
          fillAnimatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: '#e7e5e4', // stone-200
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 9999,
  },
});
