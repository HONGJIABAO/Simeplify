import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, PanResponder, Platform } from 'react-native';
import { Sprite } from './Sprite';
import { StoredPlacedItem } from '../logic/storage';
import { X } from 'lucide-react-native';

interface PlacedItemProps {
  item: StoredPlacedItem;
  canvasWidth: number;
  canvasHeight: number;
  isEditMode: boolean;
  isSelected: boolean;
  isOn: boolean;
  onSelect: (item: StoredPlacedItem) => void;
  onDelete: (itemId: string) => void;
  onMoveEnd: (itemId: string, newNormX: number, newNormY: number) => void;
}

export function PlacedItem({
  item,
  canvasWidth,
  canvasHeight,
  isEditMode,
  isSelected,
  isOn,
  onSelect,
  onDelete,
  onMoveEnd,
}: PlacedItemProps) {
  const isFurniture = item.category === 'Furniture';
  const size = isFurniture ? 56 : 46;

  // Pixel coordinates on floor plan
  const posX = item.posX * canvasWidth;
  const posY = item.posY * canvasHeight;

  // Glow pulsing animation for ON state
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (isOn) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOn, pulseAnim]);

  // Drag responder in edit mode
  const [pan] = useState(() => new Animated.ValueXY());

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isEditMode,
        onMoveShouldSetPanResponder: (_, gesture) =>
          isEditMode && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
        onPanResponderGrant: () => {
          onSelect(item);
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          pan.setValue({ x: 0, y: 0 });

          if (Math.hypot(gesture.dx, gesture.dy) < 6) {
            // Just a tap
            onSelect(item);
          } else {
            // Dropped at new position
            const newX = Math.max(0.08, Math.min(0.92, (posX + gesture.dx) / canvasWidth));
            const newY = Math.max(0.08, Math.min(0.92, (posY + gesture.dy) / canvasHeight));
            onMoveEnd(item.id, newX, newY);
          }
        },
        onPanResponderTerminate: () => {
          pan.setValue({ x: 0, y: 0 });
        },
      }),
    [isEditMode, item, onSelect, onMoveEnd, pan, posX, posY, canvasWidth, canvasHeight]
  );

  // Z-order: based on vertical Y position so lower items overlap higher items
  const zIndex = Math.floor(item.posY * 100) + (isFurniture ? 2 : 5) + (isSelected ? 50 : 0);

  return (
    <Animated.View
      {...(isEditMode ? panResponder.panHandlers : {})}
      style={[
        styles.itemContainer,
        {
          left: posX - size / 2,
          top: posY - size / 2,
          width: size,
          height: size,
          zIndex,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: isOn ? pulseAnim : 1 },
          ],
        },
      ]}
    >
      <Pressable
        onPress={() => onSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}${isOn ? ', turned on' : ', turned off'}`}
        style={[
          styles.pressableArea,
          isOn && styles.glowActive,
          !isOn && !isFurniture && styles.dimmedOffline,
          isSelected && isEditMode && styles.selectedHandles,
        ]}
      >
        <Sprite type={item.spriteKey || item.type} size={size * 0.9} />

        {/* ON indicator badge */}
        {isOn && !isFurniture && (
          <View pointerEvents="none" style={styles.onPill}>
            <Text style={styles.onPillText}>ON</Text>
          </View>
        )}

        {/* Selected outline handles in edit mode */}
        {isSelected && isEditMode && (
          <>
            <View style={[styles.handleDot, styles.dotTL]} />
            <View style={[styles.handleDot, styles.dotTR]} />
            <View style={[styles.handleDot, styles.dotBL]} />
            <View style={[styles.handleDot, styles.dotBR]} />
          </>
        )}
      </Pressable>

      {/* Quick delete button (sibling to Pressable to avoid nested button error) */}
      {isSelected && isEditMode && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          style={styles.deleteBadge}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.name}`}
        >
          <X size={12} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressableArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    position: 'relative',
  },
  glowActive: {
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 0px 8px rgba(245, 158, 11, 0.75))',
      } as any,
      default: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  dimmedOffline: {
    opacity: 0.78,
  },
  onPill: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    zIndex: 10,
  },
  onPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 8.5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  selectedHandles: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 8,
  },
  handleDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 1,
  },
  dotTL: { top: -3, left: -3 },
  dotTR: { top: -3, right: -3 },
  dotBL: { bottom: -3, left: -3 },
  dotBR: { bottom: -3, right: -3 },
  deleteBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 30,
  },
});
