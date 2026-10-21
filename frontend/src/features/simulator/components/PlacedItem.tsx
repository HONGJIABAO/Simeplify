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

  const isCeilingLayer = item.type === 'light_bulb' || item.spriteKey === 'light_bulb';
  const zIndex = isCeilingLayer
    ? 1
    : Math.floor(item.posY * 100) + (isFurniture ? 2 : 5) + (isSelected ? 50 : 0);

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
          appearance.surface,
        ]}
      >
        {/* Android fallback glow: scaled warm tinted copy behind sprite */}
        {Platform.OS === 'android' && isOn && !isFurniture && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.pictureOnly,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, appearance.androidCopy?.opacity ?? 0],
                }),
                transform: [{ scale: appearance.androidCopy?.scale ?? 1 }],
              },
            ]}
          >
            <Sprite
              type={item.spriteKey || item.type}
              width={width}
              height={height}
              cropTransparent
              style={{ tintColor: appearance.androidCopy?.tintColor }}
              containerStyle={{ transform: [{ rotate: `${item.rotation ?? 0}deg` }] }}
            />
          </Animated.View>
        )}

        <Animated.View pointerEvents="none" style={[styles.pictureOnly, appearance.iosShadow, appearance.iosShadow ? {
          shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
        } : undefined]}>
          <Sprite
            type={item.spriteKey || item.type}
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
        </Animated.View>

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
