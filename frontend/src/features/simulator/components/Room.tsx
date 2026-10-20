import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { StoredRoom } from '../logic/storage';

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

const ROOM_THEMES = {
  living: {
    bgColor: '#E8C8A2',
    dotColor: '#7C4A26',
    borderWall: '#80624E',
  },
  kitchen: {
    bgColor: '#F4EFE6',
    dotColor: '#7C4A26',
    borderWall: '#80624E',
  },
  bedroom: {
    bgColor: '#B4C5A6',
    dotColor: '#4A633F',
    borderWall: '#80624E',
  },
  bathroom: {
    bgColor: '#D9D5CF',
    dotColor: '#57534E',
    borderWall: '#80624E',
  },
};

export function Room({
  room,
  width,
  height,
  left,
  top,
  isLightOn,
  isHovered,
  onPress,
}: RoomProps) {
  const theme = ROOM_THEMES[room.type] || ROOM_THEMES.living;

  // Doorways coordinates per room type
  // Living room: doorway at bottom wall
  // Kitchen: doorway at bottom wall
  // Bedroom: doorway at right wall
  // Bathroom: doorway at left wall
  const isLiving = room.type === 'living';
  const isKitchen = room.type === 'kitchen';
  const isBedroom = room.type === 'bedroom';
  const isBathroom = room.type === 'bathroom';

  const doorGapSize = 34;

  return (
    <Pressable
      onPress={() => onPress(room)}
      accessibilityRole="button"
      accessibilityLabel={room.name ? `Room: ${room.name}` : `Tap to name room`}
      style={[
        styles.roomContainer,
        {
          width,
          height,
          left,
          top,
          backgroundColor: theme.bgColor,
        },
        isHovered && styles.hoveredBorder,
      ]}
    >
      <Svg width={width} height={height} pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Living room floor planks */}
        {isLiving &&
          Array.from({ length: Math.ceil(height / 18) }, (_, i) => (
            <Line
              key={i}
              x1={0}
              x2={width}
              y1={i * 18}
              y2={i * 18}
              stroke="#80624E"
              strokeOpacity={0.08}
              strokeWidth={1}
            />
          ))}

        {/* Kitchen circular drain / mat accent */}
        {isKitchen && (
          <Circle
            cx={width * 0.5}
            cy={height * 0.45}
            r={12}
            fill="#E2DCD1"
            fillOpacity={0.65}
          />
        )}

        {/* Bathroom circular drain accent */}
        {isBathroom && (
          <Circle
            cx={width * 0.5}
            cy={height * 0.55}
            r={10}
            fill="#C9C5BF"
            fillOpacity={0.6}
          />
        )}

        {/* Outer boundary lines */}
        {/* Top wall */}
        <Line x1={0} y1={0} x2={width} y2={0} stroke="#80624E" strokeWidth={3} />
        {/* Left wall */}
        {isBathroom ? (
          <>
            <Line x1={0} y1={0} x2={0} y2={height * 0.35} stroke="#80624E" strokeWidth={3} />
            {/* Door opening */}
            <Line
              x1={0}
              y1={height * 0.35}
              x2={0}
              y2={height * 0.35 + doorGapSize}
              stroke="#80624E"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Line x1={0} y1={height * 0.35 + doorGapSize} x2={0} y2={height} stroke="#80624E" strokeWidth={3} />
          </>
        ) : (
          <Line x1={0} y1={0} x2={0} y2={height} stroke="#80624E" strokeWidth={3} />
        )}

        {/* Right wall */}
        {isBedroom ? (
          <>
            <Line x1={width} y1={0} x2={width} y2={height * 0.35} stroke="#80624E" strokeWidth={3} />
            {/* Door opening */}
            <Line
              x1={width}
              y1={height * 0.35}
              x2={width}
              y2={height * 0.35 + doorGapSize}
              stroke="#80624E"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Line x1={width} y1={height * 0.35 + doorGapSize} x2={width} y2={height} stroke="#80624E" strokeWidth={3} />
          </>
        ) : (
          <Line x1={width} y1={0} x2={width} y2={height} stroke="#80624E" strokeWidth={3} />
        )}

        {/* Bottom wall */}
        {isLiving ? (
          <>
            <Line x1={0} y1={height} x2={width * 0.4} y2={height} stroke="#80624E" strokeWidth={3} />
            {/* Door opening */}
            <Line
              x1={width * 0.4}
              y1={height}
              x2={width * 0.4 + doorGapSize}
              y2={height}
              stroke="#80624E"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Line x1={width * 0.4 + doorGapSize} y1={height} x2={width} y2={height} stroke="#80624E" strokeWidth={3} />
          </>
        ) : isKitchen ? (
          <>
            <Line x1={0} y1={height} x2={width * 0.3} y2={height} stroke="#80624E" strokeWidth={3} />
            {/* Door opening */}
            <Line
              x1={width * 0.3}
              y1={height}
              x2={width * 0.3 + doorGapSize}
              y2={height}
              stroke="#80624E"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Line x1={width * 0.3 + doorGapSize} y1={height} x2={width} y2={height} stroke="#80624E" strokeWidth={3} />
          </>
        ) : (
          <Line x1={0} y1={height} x2={width} y2={height} stroke="#80624E" strokeWidth={3} />
        )}
      </Svg>

      {/* Warm Light Glow Overlay when lights in room are ON */}
      {isLightOn && (
        <View pointerEvents="none" style={styles.roomLightOverlay} />
      )}

      {/* Room Name Pill (ONLY shown if room has been named by user!) */}
      {!!room.name && (
        <View pointerEvents="none" style={styles.namePill}>
          <View style={[styles.namePillDot, { backgroundColor: theme.dotColor }]} />
          <Text style={styles.namePillText} numberOfLines={1}>
            {room.name}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  roomContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  hoveredBorder: {
    borderColor: '#C89B6D',
    borderWidth: 2,
  },
  roomLightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 245, 205, 0.22)',
  },
  namePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  namePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  namePillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#292524',
  },
});
