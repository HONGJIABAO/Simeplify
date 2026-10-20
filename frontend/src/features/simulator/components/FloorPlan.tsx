import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Hand, UserRound } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Room } from './Room';
import { StairBlock } from './StairBlock';
import { PlacedItem } from './PlacedItem';
import { Avatar } from './Avatar';
import { StoredPlacedItem, StoredRoom } from '../logic/storage';
import { AvatarSimulationState, Point } from '../logic/SimulationEngine';
import { SpriteItemDef } from '../logic/spriteMap';
import {
  clampPointToRect,
  FloorNumber,
  getFloorPlanLayout,
  getSlotRect,
} from '../logic/roomLayout';
import { getFloorSpriteSizes } from '../logic/spriteSizing';

export interface FloorViewport {
  scale: number;
  translateX: number;
  translateY: number;
}

interface FloorPlanProps {
  rooms: StoredRoom[];
  items: StoredPlacedItem[];
  currentFloor: FloorNumber;
  onFloorChange: (floor: FloorNumber) => void;
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
  floorPlanRef: React.RefObject<any>;
  onLayout: (event: LayoutChangeEvent) => void;
}

export function FloorPlan({
  rooms,
  items,
  currentFloor,
  onFloorChange,
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
  const [containerSize, setContainerSize] = useState({ width: 350, height: 360 });
  const [settledZoom, setSettledZoom] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);
  const floor2Opacity = useSharedValue(currentFloor === 2 ? 1 : 0);
  const width = containerSize.width;
  const height = containerSize.height;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    floor2Opacity.value = withTiming(currentFloor === 2 ? 1 : 0, {
      duration: reduceMotion ? 0 : 400,
      easing: Easing.inOut(Easing.ease),
    });
  }, [currentFloor, floor2Opacity, reduceMotion]);

  const publishViewport = (next: FloorViewport) => {
    setSettledZoom(next.scale);
    onViewportChange?.(next);
  };

  const resetViewport = () => {
    'worklet';
    const duration = reduceMotion ? 0 : 400;
    scale.value = withTiming(1, { duration, easing: Easing.inOut(Easing.ease) });
    translateX.value = withTiming(0, { duration, easing: Easing.inOut(Easing.ease) });
    translateY.value = withTiming(0, { duration, easing: Easing.inOut(Easing.ease) });
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
      const maxX = (width * (scale.value - 1)) / 2;
      const maxY = (height * (scale.value - 1)) / 2;
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
      const maxX = (width * (scale.value - 1)) / 2;
      const maxY = (height * (scale.value - 1)) / 2;
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
  const floor1Style = useAnimatedStyle(() => ({ opacity: 1 - floor2Opacity.value }));
  const floor2Style = useAnimatedStyle(() => ({ opacity: floor2Opacity.value }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout;
    if (next.width > 0 && next.height > 0) setContainerSize({ width: next.width, height: next.height });
    onLayout(event);
  };

  const spriteSizes = getFloorSpriteSizes(width);
  const labelOverlaps = useMemo(() => {
    const perFloor = new Map<FloorNumber, Set<string>>([[1, new Set()], [2, new Set()]]);
    for (const floor of [1, 2] as const) {
      const floorRoomIds = new Set(rooms.filter((room) => room.floor === floor).map((room) => room.id));
      const floorItems = items.filter((item) => floorRoomIds.has(item.roomId));
      for (let index = 0; index < floorItems.length; index += 1) {
        for (let other = index + 1; other < floorItems.length; other += 1) {
          const first = floorItems[index];
          const second = floorItems[other];
          if (Math.abs(first.posX - second.posX) * width < 120 && Math.abs(first.posY - second.posY) * height < 58) {
            perFloor.get(floor)!.add(first.id);
            perFloor.get(floor)!.add(second.id);
          }
        }
      }
    }
    return perFloor;
  }, [height, items, rooms, width]);

  const renderFloor = (floor: FloorNumber) => {
    const layout = getFloorPlanLayout(floor);
    const floorRooms = rooms.filter((room) => room.floor === floor);
    const visibleRoomIds = new Set(floorRooms.filter((room) => room.isSetUp).map((room) => room.id));
    const floorItems = items.filter((item) => visibleRoomIds.has(item.roomId));
    const pathPoints = avatarState.currentFloor === floor && avatarState.isWalking
      ? [{ x: avatarState.currentX, y: avatarState.currentY }, ...walkPath]
      : [];
    const sleepingBed = floorItems.find((item) =>
      item.category === 'Furniture'
      && (item.type === 'bed' || item.spriteKey === 'bed')
      && item.roomId === avatarState.targetRoomId
    );
    const avatarHasReachedBed = !sleepingBed || Math.hypot(
      avatarState.currentX - sleepingBed.posX,
      avatarState.currentY - sleepingBed.posY
    ) < 0.04;

    return (
      <>
        <View style={[styles.planBase, { width, height }]} />
        {floorRooms.map((room) => {
          const rect = layout.rooms.find((candidate) => candidate.slot === room.slot);
          if (!rect) return null;
          return (
            <Room
              key={room.id}
              room={room}
              left={rect.x * width}
              top={rect.y * height}
              width={rect.width * width}
              height={rect.height * height}
              isLightOn={activeRoomLightIds.includes(room.id)}
              isHovered={hoveredRoomId === room.id}
              onPress={onRoomPress}
            />
          );
        })}
        <StairBlock
          floor={floor}
          left={layout.stair.x * width}
          top={layout.stair.y * height}
          width={layout.stair.width * width}
          height={layout.stair.height * height}
          onChangeFloor={onFloorChange}
        />

        {pathPoints.slice(0, -1).map((point, index) => {
          const next = pathPoints[index + 1];
          const x1 = point.x * width;
          const y1 = point.y * height;
          const x2 = next.x * width;
          const y2 = next.y * height;
          const length = Math.hypot(x2 - x1, y2 - y1);
          const angle = Math.atan2(y2 - y1, x2 - x1);
          return <View key={`${index}-${x2}-${y2}`} pointerEvents="none" style={[styles.walkPath, { left: (x1 + x2) / 2 - length / 2, top: (y1 + y2) / 2 - 1.5, width: length, transform: [{ rotate: `${angle}rad` }] }]} />;
        })}

        {floorItems.map((item) => {
          const room = floorRooms.find((candidate) => candidate.id === item.roomId)!;
          const roomRect = getSlotRect(room.slot);
          const desiredSize = item.category === 'Furniture' ? spriteSizes.furniture : spriteSizes.appliance;
          const itemSize = Math.max(42, Math.min(desiredSize, roomRect.width * width - 12, roomRect.height * height - 32));
          const clampedPoint = clampPointToRect(
            roomRect,
            { x: item.posX, y: item.posY },
            itemSize / 2 / width,
            (itemSize / 2 + 12) / height
          );
          const isFurniture = item.category === 'Furniture';
          const isOn = !isFurniture && (activeApplianceIds.includes(item.id) || item.alwaysOn || item.isOn);
          return (
            <PlacedItem
              key={item.id}
              item={{ ...item, posX: clampedPoint.x, posY: clampedPoint.y }}
              canvasWidth={width}
              canvasHeight={height}
              itemSize={itemSize}
              labelFontSize={spriteSizes.labelFont}
              zoomScale={settledZoom}
              compactLabel={labelOverlaps.get(floor)?.has(item.id) ?? false}
              isEditMode={isEditMode}
              isSelected={selectedItemId === item.id}
              isOn={Boolean(isOn)}
              onSelect={onSelectItem}
              onDelete={onDeleteItem}
              onRotate={onRotateItem}
              onMoveEnd={onMoveItemEnd}
            />
          );
        })}

        <Avatar
          variant={avatarVariant}
          normX={avatarState.currentX}
          normY={avatarState.currentY}
          canvasWidth={width}
          canvasHeight={height}
          facingLeft={avatarState.facingLeft}
          isWalking={avatarState.isWalking}
          isSleeping={avatarState.isSleeping && !avatarState.isWalking && avatarHasReachedBed}
          isSitting={avatarState.isSitting}
          visible={avatarState.currentFloor === floor && !avatarState.isFloorTransitioning}
          reduceMotion={reduceMotion}
          sleepRotation={sleepingBed?.rotation ?? 0}
          size={spriteSizes.avatar}
        />
      </>
    );
  };

  const currentFloorHasAppliance = items.some((item) => {
    const room = rooms.find((candidate) => candidate.id === item.roomId);
    return item.category === 'Appliances' && room?.floor === currentFloor && room.isSetUp;
  });

  return (
    <View style={styles.cardContainer}>
      <GestureDetector gesture={viewportGesture}>
        <View ref={floorPlanRef} collapsable={false} onLayout={handleLayout} style={styles.floorCanvas}>
          <Animated.View style={[styles.zoomLayer, zoomStyle]}>
            <Animated.View pointerEvents={currentFloor === 1 ? 'auto' : 'none'} style={[styles.floorLayer, floor1Style]}>
              {renderFloor(1)}
            </Animated.View>
            <Animated.View pointerEvents={currentFloor === 2 ? 'auto' : 'none'} style={[styles.floorLayer, floor2Style]}>
              {renderFloor(2)}
            </Animated.View>
          </Animated.View>

          <View pointerEvents="none" style={styles.floorPill}>
            <Text style={styles.floorPillText}>{currentFloor}F</Text>
          </View>

          {avatarState.currentFloor !== currentFloor && (
            <View pointerEvents="none" style={styles.residentPill}>
              <UserRound size={14} color="#57534E" strokeWidth={1.5} />
              <Text style={styles.residentPillText}>Resident is on {avatarState.currentFloor}F</Text>
            </View>
          )}

          {!currentFloorHasAppliance && (
            <View pointerEvents="none" style={styles.emptyPill}>
              <Hand size={15} color="#57534E" strokeWidth={1.5} />
              <Text style={styles.emptyPillText}>{isEditMode ? 'Nothing here yet. Drag an appliance from below.' : 'Nothing here yet. Tap Edit to add appliances.'}</Text>
            </View>
          )}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    minHeight: 190,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  floorCanvas: {
    flex: 1,
    width: '100%',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#5C4033',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#EFEAD8',
  },
  zoomLayer: { ...StyleSheet.absoluteFill },
  floorLayer: { ...StyleSheet.absoluteFill },
  planBase: { position: 'absolute', top: 0, left: 0, backgroundColor: '#EFEAD8' },
  walkPath: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: 'rgba(86, 101, 73, 0.55)', zIndex: 15 },
  floorPill: {
    position: 'absolute', top: 10, right: 10, minWidth: 42, minHeight: 30,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10,
    borderRadius: 9999, backgroundColor: '#FAF6F1', borderWidth: 1,
    borderColor: '#D6D3D1', zIndex: 80,
  },
  floorPillText: { fontFamily: 'Lora_600SemiBold', fontSize: 13, color: '#292524' },
  residentPill: {
    position: 'absolute', top: 10, left: 10, minHeight: 30, flexDirection: 'row',
    alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 9999,
    backgroundColor: '#FAF6F1', borderWidth: 1, borderColor: '#D6D3D1', zIndex: 80,
  },
  residentPillText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#57534E' },
  emptyPill: {
    position: 'absolute', bottom: 10, left: 10, right: 10, minHeight: 36,
    backgroundColor: '#FFFFFF', borderRadius: 9999, paddingVertical: 8,
    paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#E7E5E4', zIndex: 90,
  },
  emptyPillText: {
    flexShrink: 1, fontFamily: 'SourceSans3_400Regular', fontSize: 12,
    lineHeight: 16, color: '#57534E', textAlign: 'center',
  },
});
