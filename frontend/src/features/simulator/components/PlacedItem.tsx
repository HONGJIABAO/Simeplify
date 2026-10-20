import React, { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RotateCw, X } from 'lucide-react-native';
import { Sprite } from './Sprite';
import { StoredPlacedItem } from '../logic/storage';

interface PlacedItemProps {
  item: StoredPlacedItem;
  canvasWidth: number;
  canvasHeight: number;
  itemWidth?: number;
  itemHeight?: number;
  itemSize?: number;
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
  itemWidth,
  itemHeight,
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
  const width = itemWidth ?? itemSize ?? 48;
  const height = itemHeight ?? itemSize ?? 48;
  const labelWidth = isSelected ? 148 : compactLabel ? 72 : 120;
  const shouldShowLabel = isEditMode || isSelected;
  const visibleLabel = !shouldShowLabel
    ? ''
    : compactLabel && !isSelected
      ? (isFurniture ? '' : `${item.wattage ?? 0} W`)
      : item.name;

  const [reduceMotion, setReduceMotion] = useState(false);
  const [glowAnim] = useState(() => new Animated.Value(isOn ? 1 : 0));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: isOn ? 1 : 0,
      duration: reduceMotion ? 0 : 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [glowAnim, isOn, reduceMotion]);

  // Pixel coordinates on floor plan
  const posX = item.posX * canvasWidth;
  const posY = item.posY * canvasHeight;

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
            onSelect(item);
          } else {
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

  const zIndex = Math.floor(item.posY * 100) + (isFurniture ? 2 : 5) + (isSelected ? 50 : 0);

  const horizontalSlop = Math.max(0, Math.ceil((48 - width) / 2));
  const verticalSlop = Math.max(0, Math.ceil((48 - height) / 2));

  const glowRadius = Math.max(4, Math.round(height * 0.09));
  const webGlowFilter = Platform.OS === 'web' && isOn && !isFurniture
    ? `drop-shadow(0px 0px ${glowRadius}px rgba(243, 201, 139, 0.70)) drop-shadow(0px 0px ${Math.round(glowRadius * 1.5)}px rgba(243, 201, 139, 0.45))`
    : undefined;

  const iosGlowStyle = Platform.OS === 'ios' && isOn && !isFurniture
    ? {
        shadowColor: '#F3C98B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: glowRadius,
      }
    : undefined;

  return (
    <Animated.View
      {...(isEditMode ? panResponder.panHandlers : {})}
      style={[
        styles.itemContainer,
        {
          left: posX - width / 2,
          top: posY - height / 2,
          width,
          height: height + (shouldShowLabel ? 24 : 0),
          zIndex,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
    >
      <Pressable
        onPress={() => onSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}${isOn ? ', turned on' : ', turned off'}`}
        hitSlop={{
          top: verticalSlop,
          bottom: verticalSlop,
          left: horizontalSlop,
          right: horizontalSlop,
        }}
        style={[
          styles.pressableArea,
          { width, height },
          !isOn && !isFurniture && styles.dimmedOffline,
          iosGlowStyle,
        ]}
      >
        {/* Android fallback glow: scaled warm tinted copy behind sprite */}
        {Platform.OS === 'android' && isOn && !isFurniture && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.androidGlowContainer,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
          >
            <Sprite
              type={item.spriteKey || item.type}
              width={width * 1.12}
              height={height * 1.12}
              style={{ tintColor: '#F3C98B' }}
              containerStyle={{ transform: [{ rotate: `${item.rotation ?? 0}deg` }] }}
            />
          </Animated.View>
        )}

        <Sprite
          type={item.spriteKey || item.type}
          width={width}
          height={height}
          style={
            Platform.OS === 'web' && webGlowFilter
              ? ({
                  filter: webGlowFilter,
                  transition: reduceMotion ? 'none' : 'filter 500ms ease-in-out',
                } as any)
              : undefined
          }
          containerStyle={{ transform: [{ rotate: `${item.rotation ?? 0}deg` }] }}
        />

        {/* Small sage on-dot on top-right of lit appliance */}
        {isOn && !isFurniture && (
          <View
            accessibilityLabel="On"
            pointerEvents="none"
            style={styles.onDot}
          />
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

      {!!visibleLabel && (
        <View pointerEvents="none" style={[styles.itemLabelPill, { maxWidth: labelWidth }]}>
          <Text style={[styles.itemLabel, { fontSize: labelFontSize }]} numberOfLines={1}>
            {visibleLabel}
          </Text>
        </View>
      )}

      {/* Quick delete button */}
      {isSelected && isEditMode && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          style={styles.deleteBadge}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.name}`}
          hitSlop={12}
        >
          <X size={12} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      )}

      {/* Quick rotate button */}
      {isSelected && isEditMode && isFurniture && (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onRotate(item.id);
          }}
          style={styles.rotateBadge}
          accessibilityRole="button"
          accessibilityLabel={`Rotate ${item.name}`}
          hitSlop={12}
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
    position: 'relative',
    backgroundColor: 'transparent',
  },
  dimmedOffline: {
    opacity: 0.40,
  },
  androidGlowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B9D77',
    borderWidth: 1.2,
    borderColor: '#FAF6F1',
    zIndex: 20,
  },
  handleDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#566549',
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
    backgroundColor: '#B85C38',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 30,
  },
  rotateBadge: {
    position: 'absolute',
    top: -10,
    left: -10,
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
