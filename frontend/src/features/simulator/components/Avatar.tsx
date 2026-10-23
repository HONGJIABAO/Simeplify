import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { Sprite } from './Sprite';

interface AvatarProps {
  variant: 'avatar_girl' | 'avatar_boy';
  normX: number; // 0 to 1
  normY: number; // 0 to 1
  canvasWidth: number;
  canvasHeight: number;
  facingLeft: boolean;
  isWalking: boolean;
  isSleeping: boolean;
  isSitting?: boolean;
  visible?: boolean;
  reduceMotion?: boolean;
  sleepRotation?: number;
  size?: number;
  dimmed?: boolean;
}

export function Avatar({
  variant,
  normX,
  normY,
  canvasWidth,
  canvasHeight,
  facingLeft,
  isWalking,
  isSleeping,
  isSitting = false,
  visible = true,
  reduceMotion = false,
  sleepRotation = 0,
  size = 44,
  dimmed = false,
}: AvatarProps) {
  // Pixel coordinates
  const pixelX = normX * canvasWidth;
  const pixelY = normY * canvasHeight;

  const [visibilityAnim] = useState(() => new Animated.Value(visible ? 1 : 0));

  useEffect(() => {
    Animated.timing(visibilityAnim, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, visibilityAnim, visible]);

  // Sleeping "zZ" pulse
  const [zzAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (isSleeping && !reduceMotion) {
      const zzLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(zzAnim, {
            toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(zzAnim, {
            toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      zzLoop.start();
      return () => zzLoop.stop();
    } else {
      zzAnim.setValue(isSleeping ? 1 : 0);
    }
  }, [isSleeping, reduceMotion, zzAnim]);

  // The resident is always drawn in front of the appliance being used; room
  // tags remain the final overlay at z-index 3000.
  const zIndex = 280;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.avatarWrapper,
        {
          left: 0,
          top: 0,
          width: size,
          height: size,
          marginLeft: -size / 2,
          // The normalized route point represents the resident's feet.
          marginTop: isSleeping ? -size / 2 : -size,
          zIndex,
          opacity: dimmed ? Animated.multiply(visibilityAnim, 0.45) : visibilityAnim,
          transform: [
            { translateX: pixelX },
            { translateY: pixelY },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.innerContainer,
          {
            transform: [
              { scaleX: facingLeft ? -1 : 1 },
              { scaleY: isSitting ? 0.82 : 1 },
              { translateY: isSitting ? size * 0.08 : 0 },
              { rotate: isSleeping ? `${sleepRotation}deg` : '0deg' },
            ],
          },
        ]}
      >
        <Sprite type={variant} size={size} />
      </View>

      {/* Floating sleeping bubble */}
      {isSleeping && (
        <Animated.View
          style={[
            styles.sleepBubble,
            {
              opacity: zzAnim,
              transform: [
                {
                  translateY: zzAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sleepText}>zZ</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepBubble: {
    position: 'absolute',
    top: -14,
    right: -6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sleepText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#566549',
  },
});
