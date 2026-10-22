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
import { getLitAppearance, type GlowPlatform } from '../logic/litAppearance';
import { getPlanItemAccessibilityLabel, getPlanItemLabel } from '../logic/itemLabel';
import { FLOOR_ITEM_SCALE, FLOOR_SPRITE_BASE_SIZE } from '../logic/spriteSizing';

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
  onMoveEnd: (itemId: string, newNormX: number, newNormY: number) => { x: number; y: number } | null;
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
  const UNIFORM_ITEM_SIZE = FLOOR_SPRITE_BASE_SIZE.item * FLOOR_ITEM_SCALE;
  const width = itemWidth ?? itemSize ?? UNIFORM_ITEM_SIZE;
  const height = itemHeight ?? itemSize ?? UNIFORM_ITEM_SIZE;
  const labelWidth = isSelected ? 148 : compactLabel ? 72 : 120;
  const shouldShowLabel = isSelected;
  const visibleLabel = shouldShowLabel ? getPlanItemLabel(item) : '';

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
      useNativeDriver: false,
    }).start();
  }, [glowAnim, isOn, reduceMotion]);

  // Pixel coordinates on floor plan
  const posX = item.posX * canvasWidth;
  const posY = item.posY * canvasHeight;
  const [layoutPosition] = useState(() => new Animated.ValueXY({ x: posX - width / 2, y: posY - height / 2 }));
  useEffect(() => {
    Animated.timing(layoutPosition, {
      toValue: { x: posX - width / 2, y: posY - height / 2 },
      duration: reduceMotion ? 0 : 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [height, layoutPosition, posX, posY, reduceMotion, width]);

  // Drag responder in edit mode
  const [pan] = useState(() => new Animated.ValueXY());
  const [dragReady, setDragReady] = useState(false);
  const [didLongPress, setDidLongPress] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          isEditMode && dragReady && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
        onPanResponderGrant: () => {
          setDidLongPress(true);
          setIsDragging(true);
          layoutPosition.stopAnimation();
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          if (Math.hypot(gesture.dx, gesture.dy) >= 2) {
            const newX = Math.max(0.08, Math.min(0.92, (posX + gesture.dx / zoomScale) / canvasWidth));
            const newY = Math.max(0.08, Math.min(0.92, (posY + gesture.dy / zoomScale) / canvasHeight));
            // Move the animated base to the release point before clearing the
            // translation. This prevents a one-frame jump back to the old DB
            // coordinates while the parent commits the new position.
            const resolved = onMoveEnd(item.id, newX, newY);
            const releaseX = resolved?.x ?? item.posX;
            const releaseY = resolved?.y ?? item.posY;
            layoutPosition.setValue({
              x: releaseX * canvasWidth - width / 2,
              y: releaseY * canvasHeight - height / 2,
            });
            pan.setValue({ x: 0, y: 0 });
          } else {
            pan.setValue({ x: 0, y: 0 });
          }
          setDragReady(false);
          setDidLongPress(false);
          setIsDragging(false);
        },
        onPanResponderTerminate: () => {
          pan.setValue({ x: 0, y: 0 });
          setDragReady(false);
          setDidLongPress(false);
          setIsDragging(false);
        },
      }),
    [isEditMode, dragReady, item, onMoveEnd, pan, posX, posY, canvasWidth, canvasHeight, zoomScale, layoutPosition, width, height]
  );

  const isCeilingLayer = item.type === 'light_bulb' || item.spriteKey === 'light_bulb';
  const zIndex = isCeilingLayer
    ? 1
    : Math.floor(item.posY * 100) + (isFurniture ? 2 : 5) + (isSelected ? 50 : 0) + (isDragging ? 1000 : 0);

  const horizontalSlop = Math.max(0, Math.ceil((48 - width) / 2));
  const verticalSlop = Math.max(0, Math.ceil((48 - height) / 2));

  const appearance = getLitAppearance(isOn, isFurniture, Platform.OS as GlowPlatform);

  return (
    <Animated.View
      {...(isEditMode ? panResponder.panHandlers : {})}
      style={[
        styles.itemContainer,
        {
          left: layoutPosition.x,
          top: layoutPosition.y,
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
        delayLongPress={300}
        onLongPress={() => {
          if (!isEditMode) return;
          setDragReady(true);
          setDidLongPress(true);
        }}
        onPress={() => {
          if (didLongPress) {
            setDidLongPress(false);
            setDragReady(false);
            return;
          }
          onSelect(item);
        }}
        onPressOut={() => {
          if (!isDragging && !didLongPress) setDragReady(false);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${getPlanItemAccessibilityLabel(item)}${isOn ? ', turned on' : ', turned off'}`}
        hitSlop={{
          top: verticalSlop,
          bottom: verticalSlop,
          left: horizontalSlop,
          right: horizontalSlop,
        }}
        style={[
          styles.pressableArea,
          { width, height },
          appearance.surface,
        ]}
      >
        {/* Native / Cross-Platform fallback glow: 1-2 scaled, tinted silhouette copies behind main sprite */}
        {Platform.OS !== 'web' && isOn && !isFurniture && (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                styles.pictureOnly,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.45],
                  }),
                  transform: [{ scale: 1.12 }],
                },
              ]}
            >
              <Sprite
                type={item.spriteKey || item.type}
                facing={item.facing}
                width={width}
                height={height}
                cropTransparent
                style={{ tintColor: '#FFF3C4' }}
                containerStyle={{ transform: [{ rotate: `${item.rotation ?? 0}deg` }] }}
              />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                styles.pictureOnly,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.65],
                  }),
                  transform: [{ scale: 1.06 }],
                },
              ]}
            >
              <Sprite
                type={item.spriteKey || item.type}
                facing={item.facing}
                width={width}
                height={height}
                cropTransparent
                style={{ tintColor: '#FFF3C4' }}
                containerStyle={{ transform: [{ rotate: `${item.rotation ?? 0}deg` }] }}
              />
            </Animated.View>
          </>
        )}

        <View pointerEvents="none" style={styles.pictureOnly}>
          <Sprite
            type={item.spriteKey || item.type}
            facing={item.facing}
            width={width}
            height={height}
            cropTransparent
            style={({
              opacity: appearance.spriteOpacity,
              ...(appearance.webFilter ? {
                filter: appearance.webFilter,
                transition: reduceMotion ? 'none' : 'filter 500ms ease-in-out',
              } : {}),
            } as any)}
            containerStyle={{ transform: [{ rotate: `${item.rotation ?? 0}deg` }] }}
          />
        </View>

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
  pictureOnly: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
