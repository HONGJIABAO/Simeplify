import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions,
  AccessibilityInfo,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { X } from 'lucide-react-native';

export type BottomSheetHeight = 'auto' | '88%' | 'full';
export type BottomSheetVariant = 'modal' | 'docked';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  height?: BottomSheetHeight;
  variant?: BottomSheetVariant;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomSheet({
  visible,
  onClose,
  title,
  height = 'auto',
  variant = 'modal',
  children,
  contentStyle,
}: BottomSheetProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mounted, setMounted] = useState(visible);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setMounted(true);
    }
  }

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => sub?.remove();
  }, []);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  const getSheetHeight = () => {
    if (height === 'full') return SCREEN_HEIGHT;
    if (height === '88%') return SCREEN_HEIGHT * 0.88;
    return undefined; // auto
  };

  const sheetHeightValue = getSheetHeight();

  const handleClose = () => {
    'worklet';
    runOnJS(onClose)();
  };

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        translateY.value = 0;
        opacity.value = withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) });
      } else {
        opacity.value = withTiming(1, { duration: 300 });
        translateY.value = withTiming(0, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        });
      }
    } else {
      if (reduceMotion) {
        opacity.value = withTiming(0, { duration: 250 }, (finished) => {
          if (finished) runOnJS(setMounted)(false);
        });
      } else {
        opacity.value = withTiming(0, { duration: 400 });
        translateY.value = withTiming(
          SCREEN_HEIGHT,
          { duration: 500, easing: Easing.inOut(Easing.ease) },
          (finished) => {
            if (finished) runOnJS(setMounted)(false);
          }
        );
      }
    }
  }, [visible, reduceMotion, opacity, translateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (reduceMotion) return;
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (reduceMotion) return;
      if (e.translationY > 120 || e.velocityY > 600) {
        translateY.value = withTiming(
          SCREEN_HEIGHT,
          { duration: 400, easing: Easing.inOut(Easing.ease) },
          (finished) => {
            if (finished) handleClose();
          }
        );
      } else {
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: opacity.value };
    }
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const animatedScrimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!mounted) return null;

  const isDocked = variant === 'docked';

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Scrim (none if docked) */}
        {!isDocked ? (
          <Animated.View style={[styles.scrim, animatedScrimStyle]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Dismiss sheet"
            />
          </Animated.View>
        ) : null}

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              sheetHeightValue ? { height: sheetHeightValue } : null,
              height === 'full' ? styles.sheetFull : null,
              animatedSheetStyle,
            ]}
          >
            {/* Drag Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header if title exists */}
            {title ? (
              <View style={styles.header}>
                <Text style={styles.titleText}>{title}</Text>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.closeButtonPressed,
                  ]}
                >
                  <X size={20} color="#292524" strokeWidth={1.5} />
                </Pressable>
              </View>
            ) : null}

            {/* Content */}
            <View style={[styles.content, contentStyle]}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(41, 37, 36, 0.4)', // stone-800 at 40%
  },
  sheet: {
    width: '100%',
    backgroundColor: '#faf6f1', // cream
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: '#e7e5e4', // stone-200
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    paddingBottom: 24,
    maxHeight: '100%',
  },
  sheetFull: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 9999,
    backgroundColor: '#d6d3d1', // stone-300
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  titleText: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524', // stone-800
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: '#f5f5f4',
  },
  content: {
    paddingHorizontal: 24,
  },
});
