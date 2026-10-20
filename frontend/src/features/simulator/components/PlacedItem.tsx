import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, PanResponder, Platform } from 'react-native';
import { Sprite } from './Sprite';
import { StoredPlacedItem } from '../logic/storage';
import { RotateCw, X } from 'lucide-react-native';

interface PlacedItemProps {
  item: StoredPlacedItem;
  canvasWidth: number;
  canvasHeight: number;
  itemSize: number;
  labelFontSize: number;
  zoomScale: number;
  compactLabel: boolean;
  isEditMode: boolean;
  isSelected: boolean;
  isOn: boolean;
  onSelect: (item: StoredPlacedItem) => void;
  onDelete: (itemId: string) => void;
  onRotate: (itemId: string) => void;
  onMoveEnd: (itemId: string, newNormX: number, newNormY: number) => void;
}

export function PlacedItem({
  item,
  canvasWidth,
  canvasHeight,
  itemSize,
  labelFontSize,
  zoomScale,
  compactLabel,
  isEditMode,
  isSelected,
  isOn,
  onSelect,
  onDelete,
  onRotate,
  onMoveEnd,
}: PlacedItemProps) {
  const isFurniture = item.category === 'Furniture';
  const size = itemSize;
  const labelWidth = isSelected ? 148 : compactLabel ? 72 : 120;
  const shouldShowLabel = isEditMode || isSelected;
  const visibleLabel = !shouldShowLabel
    ? ''
    : compactLabel && !isSelected
      ? (isFurniture ? '' : `${item.wattage ?? 0} W`)
      : item.name;

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
            const newX = Math.max(0.08, Math.min(0.92, (posX + gesture.dx / zoomScale) / canvasWidth));
            const newY = Math.max(0.08, Math.min(0.92, (posY + gesture.dy / zoomScale) / canvasHeight));
            onMoveEnd(item.id, newX, newY);
          }
        },
        onPanResponderTerminate: () => {
          pan.setValue({ x: 0, y: 0 });
        },
      }),
    [isEditMode, item, onSelect, onMoveEnd, pan, posX, posY, canvasWidth, canvasHeight, zoomScale]
  );

  // Z-order: based on vertical Y position so lower items overlap higher items
  const zIndex = Math.floor(item.posY * 100) + (isFurniture ? 2 : 5) + (isSelected ? 50 : 0);

  return (
    <Animated.View
      {...(isEditMode ? panResponder.panHandlers : {})}
      style={[
        styles.itemContainer,
        {
          left: posX - labelWidth / 2,
          top: posY - size / 2,
          width: labelWidth,
          height: size + 24,
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
          { width: size, height: size },
          isOn && styles.glowActive,
          !isOn && !isFurniture && styles.dimmedOffline,
          isSelected && isEditMode && styles.selectedHandles,
        ]}
      >
        <Sprite
          type={item.spriteKey || item.type}
          size={size * 0.9}
          containerStyle={{ transform: [{ rotate: `${item.rotation ?? 0}deg` }] }}
        />

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

      {!!visibleLabel && (
        <View pointerEvents="none" style={[styles.itemLabelPill, { maxWidth: labelWidth }]}>
          <Text style={[styles.itemLabel, { fontSize: labelFontSize }]} numberOfLines={1}>
            {visibleLabel}
          </Text>
        </View>
      )}

      {/* Quick delete button (sibling to Pressable to avoid nested button error) */}
      {isSelected && isEditMode && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          style={[styles.deleteBadge, { right: (labelWidth - size) / 2 - 10 }]}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.name}`}
        >
          <X size={12} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      )}

      {isSelected && isEditMode && isFurniture && (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onRotate(item.id);
          }}
          style={[styles.rotateBadge, { left: (labelWidth - size) / 2 - 10 }]}
          accessibilityRole="button"
          accessibilityLabel={`Rotate ${item.name}`}
        >
          <RotateCw size={14} color="#FFFFFF" strokeWidth={2.4} />
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    position: 'relative',
  },
  glowActive: {
    ...Platform.select({
      web: {
        filter: 'brightness(1.28) saturate(1.18) drop-shadow(0px 0px 8px rgba(255, 183, 0, 1))',
      } as any,
      default: {
        shadowColor: '#FFB700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 7,
      },
    }),
  },
  dimmedOffline: {
    opacity: 0.62,
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
  rotateBadge: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#566549',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 30,
  },
  itemLabelPill: {
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minHeight: 18,
    justifyContent: 'center',
  },
  itemLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
    lineHeight: 16,
    textAlign: 'center',
  },
});
