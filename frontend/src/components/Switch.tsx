import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, AccessibilityInfo, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface SwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Switch({
  value,
  onValueChange,
  disabled = false,
  style,
  accessibilityLabel = 'Toggle switch',
}: SwitchProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove();
  }, []);

  const translateX = useSharedValue(value ? 20 : 0);

  useEffect(() => {
    if (reduceMotion) {
      translateX.value = value ? 20 : 0;
    } else {
      translateX.value = withTiming(value ? 20 : 0, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [value, reduceMotion, translateX]);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleToggle = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <Pressable
      onPress={handleToggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.touchTarget, style]}
    >
      <View
        style={[
          styles.track,
          value ? styles.trackOn : styles.trackOff,
          disabled && styles.trackDisabled,
        ]}
      >
        <Animated.View style={[styles.thumb, thumbAnimatedStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 50,
    height: 30,
    borderRadius: 9999, // rounded-full
    padding: 3,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  trackOff: {
    backgroundColor: '#e7e5e4', // stone-200
  },
  trackOn: {
    backgroundColor: '#8b9d77', // sage-400
    borderColor: '#6f8260',
  },
  trackDisabled: {
    opacity: 0.5,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 9999,
    backgroundColor: '#ffffff', // paper
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
});
