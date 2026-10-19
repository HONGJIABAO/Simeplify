import React, { useEffect, useState } from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  View,
  AccessibilityInfo,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Sprout } from 'lucide-react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'disabled';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LeafSpinner() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(rotation);
    };
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Sprout size={18} color="#292524" strokeWidth={1.75} />
    </Animated.View>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onPress,
  children,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      subscription?.remove();
    };
  }, []);

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const isActuallyDisabled = disabled || variant === 'disabled' || loading;

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {};
    }
    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    };
  });

  const handlePressIn = () => {
    if (isActuallyDisabled || reduceMotion) return;
    scale.value = withTiming(0.95, { duration: 150, easing: Easing.inOut(Easing.ease) });
    translateY.value = withTiming(2, { duration: 150, easing: Easing.inOut(Easing.ease) });
  };

  const handlePressOut = () => {
    if (isActuallyDisabled || reduceMotion) return;
    scale.value = withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) });
    translateY.value = withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) });
  };

  const variantViewStyle = variantStyles[variant] || variantStyles.primary;
  const variantTxtStyle = variantTextStyles[variant] || variantTextStyles.primary;
  const sizeViewStyle = sizeStyles[size] || sizeStyles.md;

  const accessibleText =
    accessibilityLabel || (typeof children === 'string' ? children : 'Button');

  return (
    <AnimatedPressable
      onPress={isActuallyDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isActuallyDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibleText}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isActuallyDisabled, busy: loading }}
      style={[
        styles.base,
        variantViewStyle,
        sizeViewStyle,
        isActuallyDisabled && styles.disabled,
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <View style={styles.contentRow}>
          <LeafSpinner />
          <Text style={[textStyles.baseText, variantTxtStyle, textStyles.loadingText, textStyle]}>
            Loading...
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
          {typeof children === 'string' ? (
            <Text style={[textStyles.baseText, variantTxtStyle, textStyle]}>
              {children}
            </Text>
          ) : (
            children
          )}
          {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 9999, // rounded-full
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: '#e7e5e4', // stone-200
    borderWidth: 0,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: '#292524', // stone-800
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d6d3d1', // stone-300
  },
  accent: {
    backgroundColor: '#8b9d77', // sage-400
    borderWidth: 0,
  },
  disabled: {
    backgroundColor: '#e7e5e4', // stone-200
    borderWidth: 0,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  md: {
    paddingHorizontal: 24, // px-6
    paddingVertical: 12, // py-3
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    minHeight: 54,
  },
});

const textStyles = StyleSheet.create({
  baseText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    textAlign: 'center',
  },
  loadingText: {
    marginLeft: 6,
  },
});

const variantTextStyles = StyleSheet.create({
  primary: {
    color: '#fafaf9', // stone-50
  },
  secondary: {
    color: '#292524', // stone-800
  },
  accent: {
    color: '#292524', // stone-800 (never white on sage-400 per design.md Unit 4)
  },
  disabled: {
    color: '#a8a29e', // stone-400
  },
});
