import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Hand } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Room } from './Room';
import { PlacedItem } from './PlacedItem';
import { Avatar } from './Avatar';
import { StoredPlacedItem, StoredRoom } from '../logic/storage';
import { AvatarSimulationState, Point } from '../logic/SimulationEngine';
import { SpriteItemDef } from '../logic/spriteMap';

export interface FloorViewport {
  scale: number;
  translateX: number;
  translateY: number;
}

interface FloorPlanProps {
  rooms: StoredRoom[];
  items: StoredPlacedItem[];
  avatarState: AvatarSimulationState;
  walkPath?: Point[];
  avatarVariant: 'avatar_girl' | 'avatar_boy';
  activeApplianceIds: string[];
  activeRoomLightIds: string[];
  isEditMode: boolean;
  selectedItemId: string | null;
  dragGhost: { item: SpriteItemDef; x: number; y: number } | null;
  hoveredRoomId: string | null;
  onRoomPress: (room: StoredRoom) => void;
  onSelectItem: (item: StoredPlacedItem) => void;
  onDeleteItem: (itemId: string) => void;
  onRotateItem: (itemId: string) => void;
  onMoveItemEnd: (itemId: string, newNormX: number, newNormY: number) => void;
  onViewportChange?: (viewport: FloorViewport) => void;
  floorPlanRef: React.RefObject<View | null>;
  onLayout: (e: LayoutChangeEvent) => void;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function FloorPlan({
  rooms,
  items,
  avatarState,
  walkPath = [],
  avatarVariant,
  activeApplianceIds,
  activeRoomLightIds,
  isEditMode,
  selectedItemId,
  hoveredRoomId,
  onRoomPress,
  onSelectItem,
  onDeleteItem,
  onRotateItem,
  onMoveItemEnd,
  onViewportChange,
  floorPlanRef,
  onLayout,
}: FloorPlanProps) {
  const [containerSize, setContainerSize] = useState({ width: 350, height: 480 });
  const [settledZoom, setSettledZoom] = useState(1);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);
  const w = containerSize.width;
  const h = containerSize.height;

  const publishViewport = (next: FloorViewport) => {
    setSettledZoom(next.scale);
    onViewportChange?.(next);
  };

  const resetViewport = () => {
    'worklet';
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    startScale.value = 1;
    startTranslateX.value = 0;
    startTranslateY.value = 0;
    runOnJS(publishViewport)({ scale: 1, translateX: 0, translateY: 0 });
  };

  const pinch = Gesture.Pinch()
    .onBegin(() => { startScale.value = scale.value; })
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(2.5, startScale.value * event.scale));
    })
    .onEnd(() => {
      const maxX = (w * (scale.value - 1)) / 2;
      const maxY = (h * (scale.value - 1)) / 2;
      translateX.value = Math.max(-maxX, Math.min(maxX, translateX.value));
      translateY.value = Math.max(-maxY, Math.min(maxY, translateY.value));
      startScale.value = scale.value;
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
      runOnJS(publishViewport)({ scale: scale.value, translateX: translateX.value, translateY: translateY.value });
    });

  const pan = Gesture.Pan()
    .minPointers(isEditMode ? 2 : 1)
    .onBegin(() => {
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const maxX = (w * (scale.value - 1)) / 2;
      const maxY = (h * (scale.value - 1)) / 2;
      translateX.value = Math.max(-maxX, Math.min(maxX, startTranslateX.value + event.translationX));
      translateY.value = Math.max(-maxY, Math.min(maxY, startTranslateY.value + event.translationY));
    })
    .onEnd(() => {
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
      runOnJS(publishViewport)({ scale: scale.value, translateX: translateX.value, translateY: translateY.value });
    });

  const doubleTap = Gesture.Tap().numberOfTaps(2).maxDuration(280).onEnd(resetViewport);
  const viewportGesture = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));
  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setContainerSize({ width, height });
    onLayout(event);
  };

  const gridColumns = Math.max(1, ...rooms.map((room) => room.gridCol + room.gridColSpan));
  const gridRows = Math.max(1, ...rooms.map((room) => room.gridRow + room.gridRowSpan));
  const hallwayGap = clamp(Math.min(w, h) * 0.03, 10, 16);
  const cellWidth = w / gridColumns;
  const cellHeight = h / gridRows;
  const roomLayouts = useMemo(() => new Map(rooms.map((room) => {
    const leftInset = room.gridCol > 0 ? hallwayGap / 2 : 0;
    const rightInset = room.gridCol + room.gridColSpan < gridColumns ? hallwayGap / 2 : 0;
    const topInset = room.gridRow > 0 ? hallwayGap / 2 : 0;
    const bottomInset = room.gridRow + room.gridRowSpan < gridRows ? hallwayGap / 2 : 0;
    return [room.id, {
      left: room.gridCol * cellWidth + leftInset,
      top: room.gridRow * cellHeight + topInset,
      width: room.gridColSpan * cellWidth - leftInset - rightInset,
      height: room.gridRowSpan * cellHeight - topInset - bottomInset,
    }] as const;
  })), [rooms, hallwayGap, gridColumns, gridRows, cellWidth, cellHeight]);

  const visualScale = clamp(w / 350, 0.92, 1.25);
  const applianceSize = clamp(48 * visualScale, 44, 56) * 1.6;
  const furnitureSize = clamp(66 * visualScale, 56, 80) * 1.6;
  const avatarSize = clamp(66 * visualScale, 60, 72);
  const labelFontSize = clamp(12 * visualScale, 12, 14);

  const overlappingLabels = useMemo(() => {
    const overlapping = new Set<string>();
    for (let index = 0; index < items.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < items.length; otherIndex += 1) {
        const first = items[index];
        const second = items[otherIndex];
        if (Math.abs(first.posX - second.posX) * w < 112 && Math.abs(first.posY - second.posY) * h < 54) {
          overlapping.add(first.id);
          overlapping.add(second.id);
        }
      }
    }
    return overlapping;
  }, [items, w, h]);

  const pathPoints = avatarState.isWalking ? [{ x: avatarState.currentX, y: avatarState.currentY }, ...walkPath] : [];
  const showEmptyPill = items.every((item) => item.category !== 'Appliances');
  const sleepingBed = items.find((item) =>
    item.category === 'Furniture'
    && (item.type === 'bed' || item.spriteKey === 'bed')
    && item.roomId === avatarState.targetRoomId
  );
  const avatarHasReachedBed = !sleepingBed || Math.hypot(
    avatarState.currentX - sleepingBed.posX,
    avatarState.currentY - sleepingBed.posY
  ) < 0.04;
  const avatarIsSleeping = avatarState.isSleeping && !avatarState.isWalking && avatarHasReachedBed;

  return (
    <View style={styles.cardContainer}>
      <GestureDetector gesture={viewportGesture}>
        <View ref={floorPlanRef as any} collapsable={false} onLayout={handleLayout} style={styles.floorCanvas}>
          <Animated.View style={[styles.zoomLayer, zoomStyle]}>
            <View style={[styles.hallwayBg, { width: w, height: h }]} />
            {rooms.map((room) => {
              const layout = roomLayouts.get(room.id);
              if (!layout) return null;
              return <Room key={room.id} room={room} {...layout} isLightOn={activeRoomLightIds.includes(room.id)} isHovered={hoveredRoomId === room.id} onPress={onRoomPress} />;
            })}

            {pathPoints.slice(0, -1).map((point, index) => {
              const next = pathPoints[index + 1];
              const x1 = point.x * w;
              const y1 = point.y * h;
              const x2 = next.x * w;
              const y2 = next.y * h;
              const length = Math.hypot(x2 - x1, y2 - y1);
              const angle = Math.atan2(y2 - y1, x2 - x1);
              return <View key={`${index}-${x2}-${y2}`} pointerEvents="none" style={[styles.walkPath, { left: (x1 + x2) / 2 - length / 2, top: (y1 + y2) / 2 - 1.5, width: length, transform: [{ rotate: `${angle}rad` }] }]} />;
            })}

            {items.map((item) => {
              const isFurniture = item.category === 'Furniture';
              const isOn = !isFurniture && (activeApplianceIds.includes(item.id) || item.alwaysOn || item.isOn);
              return <PlacedItem key={item.id} item={item} canvasWidth={w} canvasHeight={h} itemSize={isFurniture ? furnitureSize : applianceSize} labelFontSize={labelFontSize} zoomScale={settledZoom} compactLabel={overlappingLabels.has(item.id)} isEditMode={isEditMode} isSelected={selectedItemId === item.id} isOn={!!isOn} onSelect={onSelectItem} onDelete={onDeleteItem} onRotate={onRotateItem} onMoveEnd={onMoveItemEnd} />;
            })}

            <Avatar variant={avatarVariant} normX={avatarState.currentX} normY={avatarState.currentY} canvasWidth={w} canvasHeight={h} facingLeft={avatarState.facingLeft} isWalking={avatarState.isWalking} isSleeping={avatarIsSleeping} sleepRotation={sleepingBed?.rotation ?? 0} size={avatarSize} />
          </Animated.View>

          {showEmptyPill && <View pointerEvents="none" style={styles.emptyPill}>
            <Hand size={15} color="#78716C" strokeWidth={1.5} />
            <Text style={styles.emptyPillText}>{isEditMode ? 'Nothing here yet. Drag an appliance from below.' : 'Nothing here yet. Press edit to add appliances.'}</Text>
          </View>}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { width: '100%', aspectRatio: 4 / 3, maxHeight: 280, flexShrink: 0, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 8, shadowColor: '#5C4033', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4, borderWidth: 1, borderColor: '#EFEAE2' },
  floorCanvas: { flex: 1, width: '100%', position: 'relative', borderWidth: 3, borderColor: '#80624E', borderRadius: 14, overflow: 'hidden', backgroundColor: '#E8C8A2' },
  zoomLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  hallwayBg: { position: 'absolute', top: 0, left: 0, backgroundColor: '#E8C8A2' },
  walkPath: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: 'rgba(86, 101, 73, 0.55)', zIndex: 15 },
  emptyPill: { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: '#FFFFFF', borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: '#5C4033', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4, zIndex: 60 },
  emptyPillText: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, color: '#57534E', flexShrink: 1, textAlign: 'center' },
});
