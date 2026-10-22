import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Plus } from 'lucide-react-native';
import { StoredRoom } from '../logic/storage';
import { ROOM_TYPE_SETTINGS } from '../logic/roomData';
import { ROOM_DOOR_RATIOS, type RoomSide } from '../logic/furnishedLayout';

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
  onTagVisibilityChange?: (roomId: string, visible: boolean) => void;
  onPress: (room: StoredRoom) => void;
}

export function Room({
  room,
  width,
  height,
  left,
  top,
  isLightOn,
  isHovered = false,
  isEditMode = false,
  onTagVisibilityChange,
  onPress,
}: RoomProps) {
  const theme = ROOM_TYPE_SETTINGS[room.type];

  const handlePress = () => {
    onTagVisibilityChange?.(room.id, true);
    if (isEditMode) onPress(room);
  };

  const doorGap = Math.max(24, Math.min(38, Math.min(width, height) * 0.24));
  const doors = ROOM_DOOR_RATIOS[room.slot];

  const wallLines = useMemo(() => {
    const walls: React.ReactNode[] = [];
    const addWall = (side: RoomSide, length: number, gapRatio?: number) => {
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
      onHoverIn={() => onTagVisibilityChange?.(room.id, true)}
      onHoverOut={() => onTagVisibilityChange?.(room.id, false)}
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

      {/* Dark rooms show a small round + button (48px) in the center */}
      {!room.isSetUp && (
        <View pointerEvents="none" style={styles.centerPlusButton}>
          <Plus size={22} color="#57534E" strokeWidth={2} />
        </View>
      )}

    </Pressable>
  );
}

const styles = StyleSheet.create({
  roomContainer: { position: 'absolute', overflow: 'hidden' },
  depthStrip: { position: 'absolute', top: 4, left: 4, right: 4, height: 5, opacity: 0.9 },
  hoveredBorder: { borderColor: '#D4A373', borderWidth: 3 },
  pressed: { opacity: 0.88 },
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
});
