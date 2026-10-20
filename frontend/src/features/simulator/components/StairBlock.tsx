import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { Sprite } from './Sprite';
import type { FloorNumber } from '../logic/roomLayout';

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
  const gap = Math.min(34, Math.max(22, width * 0.55));
  const topGapStart = width / 2 - gap / 2;
  const topGapEnd = width / 2 + gap / 2;
  const sideGapStart = height * 0.51 - gap / 2;
  const sideGapEnd = height * 0.51 + gap / 2;

  return (
    <Pressable
      onPress={() => onChangeFloor(nextFloor)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.container,
        { width, height, left, top },
        pressed && styles.pressed,
      ]}
    >
      <View pointerEvents="none" style={styles.depthStrip} />
      <Svg width={width} height={height} pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Line x1={0} y1={0} x2={topGapStart} y2={0} stroke="#5C4033" strokeWidth={3.5} strokeLinecap="round" />
        <Line x1={topGapEnd} y1={0} x2={width} y2={0} stroke="#5C4033" strokeWidth={3.5} strokeLinecap="round" />
        <Line x1={0} y1={0} x2={0} y2={sideGapStart} stroke="#5C4033" strokeWidth={3.5} strokeLinecap="round" />
        <Line x1={0} y1={sideGapEnd} x2={0} y2={height} stroke="#5C4033" strokeWidth={3.5} strokeLinecap="round" />
        <Line x1={width} y1={0} x2={width} y2={height} stroke="#5C4033" strokeWidth={3.5} strokeLinecap="round" />
        <Line x1={0} y1={height} x2={width} y2={height} stroke="#5C4033" strokeWidth={3.5} strokeLinecap="round" />
      </Svg>

      <Sprite type="stair" size={Math.max(38, Math.min(width - 8, height * 0.58))} />

      <View pointerEvents="none" style={styles.directionPill}>
        {goesUp
          ? <ArrowUp size={13} color="#566549" strokeWidth={1.5} />
          : <ArrowDown size={13} color="#566549" strokeWidth={1.5} />}
        <Text style={styles.directionText}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#EFEAD8',
  },
  pressed: { backgroundColor: '#E0E6D9' },
  depthStrip: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    height: 5,
    backgroundColor: '#F8F4E9',
  },
  directionPill: {
    position: 'absolute',
    bottom: 8,
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  directionText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#566549',
  },
});
