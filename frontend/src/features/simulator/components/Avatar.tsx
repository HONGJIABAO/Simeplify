import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
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
  sleepRotation?: number;
  size?: number;
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
  sleepRotation = 0,
  size = 44,
}: AvatarProps) {
  // Pixel coordinates
  const pixelX = normX * canvasWidth;
  const pixelY = normY * canvasHeight;

  // Smooth position animation
  const [posAnim] = useState(() => new Animated.ValueXY({ x: pixelX, y: pixelY }));

  useEffect(() => {
    Animated.spring(posAnim, {
      toValue: { x: pixelX, y: pixelY },
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [pixelX, pixelY, posAnim]);

  // Walking bob oscillation
  const [bobAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (isWalking) {
      const bobLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bobAnim, {
            toValue: -4,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(bobAnim, {
            toValue: 2,
            duration: 150,
            useNativeDriver: true,
          }),
        ])
      );
      bobLoop.start();
      return () => bobLoop.stop();
    } else {
      Animated.timing(bobAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isWalking, bobAnim]);

  // Sleeping "zZ" pulse
  const [zzAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (isSleeping) {
      const zzLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(zzAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(zzAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      zzLoop.start();
      return () => zzLoop.stop();
    }
  }, [isSleeping, zzAnim]);

  const zIndex = isSleeping ? 250 : Math.floor(normY * 100) + 20;

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
          marginTop: isSleeping ? -size / 2 : -size * 0.64,
          zIndex,
          transform: [
            { translateX: posAnim.x },
            { translateY: Animated.add(posAnim.y, bobAnim) },
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
    borderColor: '#E2E8F0',
    shadowColor: '#000',
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
