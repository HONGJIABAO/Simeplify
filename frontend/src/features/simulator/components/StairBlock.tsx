import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import type { FloorNumber } from '../logic/roomLayout';
import { STAIR_IMAGE_FIT } from '../logic/roomLayout';

export { STAIR_IMAGE_FIT };

interface StairBlockProps {
  floor: FloorNumber;
  width: number;
  height: number;
  left: number;
  top: number;
  onChangeFloor: (floor: FloorNumber) => void;
}

export function StairBlock({ floor, width, height, left, top, onChangeFloor }: StairBlockProps) {
  const goesUp = floor === 1;
  const nextFloor: FloorNumber = goesUp ? 2 : 1;
  const label = goesUp ? 'Up · 2F' : 'Down · 1F';
  const accessibilityLabel = goesUp
    ? 'Go up to the second floor'
    : 'Go down to the first floor';

  const horizontalSlop = Math.max(4, Math.ceil((48 - width) / 2));
  const verticalSlop = Math.max(4, Math.ceil((48 - height) / 2));

  return (
    <Pressable
      onPress={() => onChangeFloor(nextFloor)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{
        top: verticalSlop,
        bottom: verticalSlop,
        left: horizontalSlop,
        right: horizontalSlop,
      }}
      style={({ pressed }) => [
        styles.container,
        { width, height, left, top },
        pressed && styles.pressed,
      ]}
    >
      <Image
        testID="stair-image"
        source={require('../../../../assets/sprites/furniture/stair.png')}
        style={{ width, height }}
        resizeMode={STAIR_IMAGE_FIT}
      />

      <View pointerEvents="none" style={styles.directionPill}>
        {goesUp
          ? <ArrowUp size={13} color="#566549" strokeWidth={1.5} />
          : <ArrowDown size={13} color="#566549" strokeWidth={1.5} />}
        <Text numberOfLines={1} style={styles.directionText}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  pressed: {
    opacity: 0.85,
  },
  directionPill: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    minHeight: 24,
    width: 'auto',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    zIndex: 10,
  },
  directionText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#566549',
    flexShrink: 0,
  },
});

