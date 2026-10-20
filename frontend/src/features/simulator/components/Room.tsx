import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  isEditMode?: boolean;
  isOccupied?: boolean;
  onPress: (room: StoredRoom) => void;
}

type Side = 'top' | 'right' | 'bottom' | 'left';

const ROOM_DOORS: Record<StoredRoom['slot'], Partial<Record<Side, number>>> = {
  A: { right: 0.545, bottom: 0.483 },
  B: { left: 0.545, bottom: 0.833 },
  C: { top: 0.56, right: 0.51 },
  D: { left: 0.51, right: 0.51 },
};

export function Room({
  room,
  width,
  height,
  left,
  top,
  isLightOn,
  isHovered = false,
  isEditMode = false,
  isOccupied = false,
  onPress,
}: RoomProps) {
  const theme = ROOM_TYPE_SETTINGS[room.type];
  const [darkOpacity] = useState(() => new Animated.Value(room.isSetUp ? 0 : 0.45));
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMouseOver, setIsMouseOver] = useState(false);
  const [isLongPressActive, setIsLongPressActive] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTagVisible = isEditMode || isHovered || isMouseOver || isLongPressActive;
  const [tagOpacity] = useState(() => new Animated.Value(isTagVisible ? 1 : 0));

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

  useEffect(() => {
    Animated.timing(tagOpacity, {
      toValue: isTagVisible ? 1 : 0,
      duration: reduceMotion ? 0 : 150,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isTagVisible, reduceMotion, tagOpacity]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleLongPress = () => {
    setIsLongPressActive(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsLongPressActive(false);
    }, 2500);
  };

  const handlePress = () => {
    if (isLongPressActive) {
      setIsLongPressActive(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return;
    }
    onPress(room);
  };

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
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={400}
      onHoverIn={() => setIsMouseOver(true)}
      onHoverOut={() => setIsMouseOver(false)}
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

      {/* Dark rooms show a small round + button (48px) in the center */}
      {!room.isSetUp && (
        <View pointerEvents="none" style={styles.centerPlusButton}>
          <Plus size={22} color="#57534E" strokeWidth={2} />
        </View>
      )}

      {/* Room tag: hidden by default, shown on hover, long press, or edit mode */}
      <Animated.View pointerEvents="none" style={[styles.namePill, { opacity: tagOpacity }]}>
        {room.isSetUp ? (
          <View style={[styles.namePillDot, { backgroundColor: theme.accentColor }]} />
        ) : (
          <Plus size={14} color="#57534E" strokeWidth={1.5} />
        )}
        <Text style={styles.namePillText} numberOfLines={1}>
          {room.isSetUp ? room.name : 'Tap to set up'}
        </Text>
        {isOccupied && room.isSetUp && (
          <View style={styles.inUseBadge}>
            <Text style={styles.inUseBadgeText}>In use</Text>
          </View>
        )}
      </Animated.View>
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
  centerPlusButton: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D6D3D1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 14,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  namePill: {
    position: 'absolute',
    top: 10,
    left: 8,
    minHeight: 28,
    maxWidth: '82%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    zIndex: 16,
  },
  namePillDot: { width: 7, height: 7, borderRadius: 4 },
  namePillText: {
    flexShrink: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#292524',
  },
  inUseBadge: {
    backgroundColor: '#E0E6D9',
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  inUseBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#566549',
  },
});
