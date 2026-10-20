import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Plus } from 'lucide-react-native';
import { StoredRoom } from '../logic/storage';
import { ROOM_TYPE_SETTINGS } from '../logic/roomData';

interface RoomProps {
  room: StoredRoom;
  width: number;
  height: number;
  left: number;
  top: number;
  isLightOn: boolean;
  isHovered?: boolean;
  onPress: (room: StoredRoom) => void;
}

type Side = 'top' | 'right' | 'bottom' | 'left';

const ROOM_DOORS: Record<StoredRoom['slot'], Partial<Record<Side, number>>> = {
  A: { right: 0.545, bottom: 0.483 },
  B: { left: 0.545, bottom: 0.833 },
  C: { top: 0.56, right: 0.51 },
  D: { left: 0.51, right: 0.51 },
};

export function Room({ room, width, height, left, top, isLightOn, isHovered, onPress }: RoomProps) {
  const theme = ROOM_TYPE_SETTINGS[room.type];
  const [darkOpacity] = useState(() => new Animated.Value(room.isSetUp ? 0 : 0.45));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    Animated.timing(darkOpacity, {
      toValue: room.isSetUp ? 0 : 0.45,
      duration: reduceMotion ? 0 : 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [darkOpacity, reduceMotion, room.isSetUp]);

  const doorGap = Math.max(24, Math.min(38, Math.min(width, height) * 0.24));
  const doors = ROOM_DOORS[room.slot];

  const wallLines = useMemo(() => {
    const walls: React.ReactNode[] = [];
    const addWall = (side: Side, length: number, gapRatio?: number) => {
      const gapStart = gapRatio === undefined ? length : Math.max(8, length * gapRatio - doorGap / 2);
      const gapEnd = gapRatio === undefined ? length : Math.min(length - 8, length * gapRatio + doorGap / 2);
      const segments = gapRatio === undefined ? [[0, length]] : [[0, gapStart], [gapEnd, length]];
      segments.forEach(([start, end], index) => {
        const horizontal = side === 'top' || side === 'bottom';
        const fixed = side === 'bottom' ? height : side === 'right' ? width : 0;
        walls.push(
          <Line
            key={`${side}-${index}`}
            x1={horizontal ? start : fixed}
            y1={horizontal ? fixed : start}
            x2={horizontal ? end : fixed}
            y2={horizontal ? fixed : end}
            stroke="#5C4033"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        );
      });
    };
    addWall('top', width, doors.top);
    addWall('right', height, doors.right);
    addWall('bottom', width, doors.bottom);
    addWall('left', height, doors.left);
    return walls;
  }, [doorGap, doors, height, width]);

  return (
    <Pressable
      onPress={() => onPress(room)}
      accessibilityRole="button"
      accessibilityLabel={room.isSetUp ? `Room: ${room.name}` : 'Tap to set up room'}
      style={({ pressed }) => [
        styles.roomContainer,
        { width, height, left, top, backgroundColor: theme.floorColor },
        isHovered && styles.hoveredBorder,
        pressed && styles.pressed,
      ]}
    >
      <View pointerEvents="none" style={[styles.depthStrip, { backgroundColor: theme.depthStripColor }]} />
      <Svg width={width} height={height} pointerEvents="none" style={StyleSheet.absoluteFill}>
        {room.type === 'living' && Array.from({ length: Math.ceil(height / 18) }, (_, index) => (
          <Line key={index} x1={0} x2={width} y1={index * 18} y2={index * 18} stroke="#5C4033" strokeOpacity={0.08} strokeWidth={1} />
        ))}
        {room.type === 'kitchen' && <Circle cx={width * 0.55} cy={height * 0.48} r={10} fill="#D6D3CD" fillOpacity={0.55} />}
        {room.type === 'bathroom' && <Circle cx={width * 0.55} cy={height * 0.58} r={9} fill="#A8A29E" fillOpacity={0.45} />}
        {wallLines}
      </Svg>

      {isLightOn && room.isSetUp && <View pointerEvents="none" style={styles.roomLightLayer} />}
      <Animated.View pointerEvents="none" style={[styles.darkLayer, { opacity: darkOpacity }]} />

      <View pointerEvents="none" style={styles.namePill}>
        {room.isSetUp ? (
          <View style={[styles.namePillDot, { backgroundColor: theme.accentColor }]} />
        ) : (
          <Plus size={14} color="#57534E" strokeWidth={1.5} />
        )}
        <Text style={styles.namePillText} numberOfLines={1}>
          {room.isSetUp ? room.name : 'Tap to set up'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  roomContainer: { position: 'absolute', overflow: 'hidden' },
  depthStrip: { position: 'absolute', top: 4, left: 4, right: 4, height: 5, opacity: 0.9 },
  hoveredBorder: { borderColor: '#D4A373', borderWidth: 3 },
  pressed: { opacity: 0.88 },
  roomLightLayer: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(246, 232, 216, 0.34)' },
  darkLayer: { ...StyleSheet.absoluteFill, backgroundColor: '#57534E', zIndex: 8 },
  namePill: {
    position: 'absolute', top: 10, left: 8, minHeight: 28, maxWidth: '82%',
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF',
    borderRadius: 9999, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1,
    borderColor: '#E7E5E4', zIndex: 12,
  },
  namePillDot: { width: 7, height: 7, borderRadius: 4 },
  namePillText: {
    flexShrink: 1, fontFamily: 'SourceSans3_600SemiBold', fontSize: 12,
    color: '#292524',
  },
});
