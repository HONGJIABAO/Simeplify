import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { DoorOpen, Hand, UserRound } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { Image } from 'expo-image';
import { Room } from './Room';
import { StairBlock } from './StairBlock';
import { PlacedItem } from './PlacedItem';
import { Avatar } from './Avatar';
import { StoredPlacedItem, StoredRoom } from '../logic/storage';
import { AvatarSimulationState } from '../logic/SimulationEngine';
import type { Point } from '../logic/SimulationEngine';
import { SOLAR_RECOMMENDATION_SOURCE, SpriteItemDef } from '../logic/spriteMap';
import {
  calculateSquarePlanSide,
  FloorNumber,
  getFloorPlanLayout,
  getSlotRect,
} from '../logic/roomLayout';
import { getFloorSpriteSizes } from '../logic/spriteSizing';
import {
  footprintOverlapArea,
  getDoorKeepOuts,
  getItemLocalFootprint,
  INNER_FLOOR_RECT,
  isFootprintInside,
  getRoomTemplateId,
  ROOM_SLOTS,
  sortItemsForRoom,
} from '../logic/furnishedLayout';

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
  avatarVariant: 'avatar_girl' | 'avatar_boy';
  isAvatarAway?: boolean;
  walkPath?: Point[];
  activeApplianceIds: string[];
  activeRoomLightIds: string[];
  isEditMode: boolean;
  selectedItemId: string | null;
  dragGhost?: { item: SpriteItemDef; x: number; y: number } | null;
  hoveredRoomId: string | null;
  onRoomPress: (room: StoredRoom) => void;
  onSelectItem: (item: StoredPlacedItem) => void;
  onDeleteItem: (itemId: string) => void;
  onRotateItem: (itemId: string) => void;
  onMoveItemEnd: (itemId: string, newNormX: number, newNormY: number) => { x: number; y: number } | null;
  onViewportChange?: (viewport: FloorViewport) => void;
  floorPlanRef: React.RefObject<any>;
  onLayout: (event: LayoutChangeEvent) => void;
  debugLayout?: boolean;
  solarApplied?: boolean;
}

export { calculateSquarePlanSide };

export function FloorPlan({
  rooms,
  items,
  currentFloor,
  onFloorChange,
  avatarState,
  avatarVariant,
  isAvatarAway = false,
  walkPath = [],
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
  debugLayout = false,
  solarApplied = false,
}: FloorPlanProps) {
  const [containerSize, setContainerSize] = useState({ width: 350, height: 350 });
  const [settledZoom, setSettledZoom] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);
  const floor2Opacity = useSharedValue(currentFloor === 2 ? 1 : 0);

  const rawSide = calculateSquarePlanSide(containerSize.width, containerSize.height);
  const targetSide = Math.max(160, rawSide || 340);
  const sideAnim = useSharedValue(targetSide);

  const canvasSide = Math.max(140, targetSide - 18);
  const width = canvasSide;
  const height = canvasSide;

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

  useEffect(() => {
    sideAnim.value = withTiming(targetSide, {
      duration: reduceMotion ? 0 : 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [targetSide, reduceMotion, sideAnim]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    width: sideAnim.value,
    height: sideAnim.value,
  }));

  const spriteSizes = getFloorSpriteSizes(width);
  // Render persisted/session positions verbatim. Templates are applied only by
  // fixtures and the explicit Tidy up action.
  const arrangedItems = useMemo(() => items.filter((item) => rooms.some((room) => room.id === item.roomId && room.isSetUp)), [items, rooms]);
  const labelOverlaps = useMemo(() => {
    const perFloor = new Map<FloorNumber, Set<string>>([[1, new Set()], [2, new Set()]]);
    for (const floor of [1, 2] as const) {
      const floorRoomIds = new Set(rooms.filter((room) => room.floor === floor).map((room) => room.id));
      const floorItems = arrangedItems.filter((item) => floorRoomIds.has(item.roomId));
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
  }, [arrangedItems, height, rooms, width]);

  const renderFloor = (floor: FloorNumber) => {
    const layout = getFloorPlanLayout(floor);
    const floorRooms = rooms.filter((room) => room.floor === floor);
    const visibleRoomIds = new Set(floorRooms.filter((room) => room.isSetUp).map((room) => room.id));
    const floorItems = sortItemsForRoom(arrangedItems.filter((item) => visibleRoomIds.has(item.roomId)));
    const debugViolations: string[] = [];
    if (debugLayout) {
      for (const room of floorRooms.filter((candidate) => candidate.isSetUp)) {
        const roomRect = getSlotRect(room.slot);
        const roomItems = floorItems.filter((item) => item.roomId === room.id);
        const keepOuts = getDoorKeepOuts(room.slot, roomRect.width * width, roomRect.height * height);
        for (const item of roomItems) {
          const footprint = getItemLocalFootprint(item, room, width, height, roomItems);
          if (!isFootprintInside(footprint, INNER_FLOOR_RECT)) debugViolations.push(`${room.name}: ${item.name} outside inner floor`);
          if (keepOuts.some((keepOut) => footprintOverlapArea(footprint, keepOut) > 0)) debugViolations.push(`${room.name}: ${item.name} in doorway`);
        }
      }
    }
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
              isEditMode={isEditMode}
              isOccupied={avatarState.currentFloor === floor && avatarState.currentRoomId === room.id}
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

        {debugLayout && floorRooms.map((room) => {
          const rect = getSlotRect(room.slot);
          const roomItems = floorItems.filter((item) => item.roomId === room.id);
          const keepOuts = getDoorKeepOuts(room.slot, rect.width * width, rect.height * height);
        const lanes = ROOM_SLOTS[getRoomTemplateId(room, roomItems)].clearZones;
          return (
            <React.Fragment key={`debug-${room.id}`}>
              <View pointerEvents="none" style={[styles.debugInnerFloor, {
                left: (rect.x + INNER_FLOOR_RECT.x * rect.width) * width,
                top: (rect.y + INNER_FLOOR_RECT.y * rect.height) * height,
                width: INNER_FLOOR_RECT.width * rect.width * width,
                height: INNER_FLOOR_RECT.height * rect.height * height,
              }]} />
              {keepOuts.map((keepOut, index) => (
                <View key={`${room.id}-door-${index}`} pointerEvents="none" style={[styles.debugDoorKeepOut, {
                  left: (rect.x + keepOut.x * rect.width) * width,
                  top: (rect.y + keepOut.y * rect.height) * height,
                  width: keepOut.width * rect.width * width,
                  height: keepOut.height * rect.height * height,
                }]} />
              ))}
              {lanes.map((lane, index) => (
                <View key={`${room.id}-lane-${index}`} pointerEvents="none" style={[styles.debugLane, {
                  left: (rect.x + lane.x * rect.width) * width,
                  top: (rect.y + lane.y * rect.height) * height,
                  width: lane.width * rect.width * width,
                  height: lane.height * rect.height * height,
                }]} />
              ))}
              {roomItems.map((item) => {
                const footprint = getItemLocalFootprint(item, room, width, height, roomItems);
                return (
                  <React.Fragment key={`${item.id}-footprint`}>
                    <View pointerEvents="none" style={[styles.debugFootprint, {
                      left: (rect.x + footprint.x * rect.width) * width,
                      top: (rect.y + footprint.y * rect.height) * height,
                      width: footprint.width * rect.width * width,
                      height: footprint.height * rect.height * height,
                    }]} />
                    <View pointerEvents="none" style={[styles.debugAnchor, {
                      left: (rect.x + footprint.anchorX * rect.width) * width - 3,
                      top: (rect.y + footprint.anchorY * rect.height) * height - 3,
                    }]} />
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

        {debugLayout && (
          <View pointerEvents="none" style={styles.debugViolationPanel}>
            <Text style={styles.debugViolationText}>
              {debugViolations.length === 0 ? '✓ No layout violations' : debugViolations.join('\n')}
            </Text>
          </View>
        )}

        {floorItems.map((item) => {
          const room = floorRooms.find((candidate) => candidate.id === item.roomId);
          if (!room) return null;
          const uniformItemSize = spriteSizes.item;
          const isFurniture = item.category === 'Furniture';
          const isOn = !isFurniture && (activeApplianceIds.includes(item.id) || item.alwaysOn || item.isOn);
          return (
            <PlacedItem
              key={item.id}
              item={item}
              canvasWidth={width}
              canvasHeight={height}
              itemWidth={uniformItemSize}
              itemHeight={uniformItemSize}
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

        {avatarState.currentFloor === floor && walkPath.length > 1 && (
          <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
            <Polyline
              points={walkPath.map((point) => `${point.x * width},${point.y * height}`).join(' ')}
              fill="none"
              stroke="#8B9D77"
              strokeWidth={2}
              strokeDasharray="4 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.72}
            />
          </Svg>
        )}

        <Avatar
          variant={avatarVariant}
          normX={avatarState.currentX}
          normY={avatarState.currentY}
          canvasWidth={width}
          canvasHeight={height}
          facingLeft={avatarState.facingLeft}
          isWalking={avatarState.isWalking}
          isSleeping={false}
          isSitting={false}
          visible={avatarState.currentFloor === floor && !avatarState.isFloorTransitioning}
          reduceMotion={reduceMotion}
          sleepRotation={0}
          size={spriteSizes.avatar}
          dimmed={isAvatarAway}
        />
        {isAvatarAway && avatarState.currentFloor === floor && !avatarState.isFloorTransitioning && (
          <View pointerEvents="none" style={[styles.awayTag, {
            left: Math.max(4, avatarState.currentX * width - 30),
            top: Math.max(4, avatarState.currentY * height - spriteSizes.avatar - 25),
          }]}>
            <DoorOpen size={13} color="#57534E" strokeWidth={1.6} />
            <Text style={styles.awayTagText}>Away</Text>
          </View>
        )}
      </>
    );
  };

  const homeHasAppliance = arrangedItems.some((item) => {
    const room = rooms.find((candidate) => candidate.id === item.roomId);
    return item.category === 'Appliances' && room?.isSetUp;
  });

  return (
    <View style={styles.cardOuter} onLayout={handleLayout}>
      <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
        <GestureDetector gesture={viewportGesture}>
          <View ref={floorPlanRef} collapsable={false} style={[styles.floorCanvas, { width, height }]}>
            <Animated.View style={[styles.zoomLayer, zoomStyle]}>
              <Animated.View pointerEvents={currentFloor === 1 ? 'auto' : 'none'} style={[styles.floorLayer, floor1Style]}>
                {renderFloor(1)}
              </Animated.View>
              <Animated.View pointerEvents={currentFloor === 2 ? 'auto' : 'none'} style={[styles.floorLayer, floor2Style]}>
                {renderFloor(2)}
              </Animated.View>
            </Animated.View>

            {!homeHasAppliance && (
              <View pointerEvents="none" style={[styles.emptyPill, { right: Math.ceil(width * 0.14) + 14 }]}>
                <Hand size={15} color="#57534E" strokeWidth={1.5} />
                <Text style={styles.emptyPillText}>{isEditMode ? 'Nothing here yet. Drag an appliance from below.' : 'Nothing here yet. Tap Edit to add appliances.'}</Text>
              </View>
            )}
            {avatarState.currentFloor !== currentFloor && (
              <View pointerEvents="none" accessibilityRole="text" style={styles.residentFloorPill}>
                <UserRound size={14} color="#566549" strokeWidth={1.5} />
                <Text style={styles.residentFloorText}>Resident is on {avatarState.currentFloor}F</Text>
              </View>
            )}
            {solarApplied && (
              <View pointerEvents="none" style={styles.solarApplied} accessibilityRole="text" accessibilityLabel="Solar active">
                <View style={styles.solarImageBox}>
                  <Image source={SOLAR_RECOMMENDATION_SOURCE} style={styles.solarImage} contentFit="contain" />
                </View>
                <View style={styles.solarBadge}><Text style={styles.solarBadgeText}>Active</Text></View>
              </View>
            )}
          </View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorCanvas: {
    position: 'relative',
    borderWidth: 3,
    borderColor: '#5C4033',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#EFEAD8',
  },
  debugBackStrip: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#B85C38',
    backgroundColor: 'rgba(184,92,56,0.12)',
    zIndex: 300,
  },
  debugInnerFloor: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#566549',
    zIndex: 301,
  },
  debugDoorKeepOut: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#A97A4A',
    backgroundColor: 'rgba(212,163,115,0.24)',
    zIndex: 302,
  },
  debugLane: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#7C8F68',
    backgroundColor: 'rgba(139,157,119,0.16)',
    zIndex: 302,
  },
  debugFootprint: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#57534E',
    backgroundColor: 'rgba(87,83,78,0.08)',
    zIndex: 303,
  },
  debugAnchor: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B85C38',
    zIndex: 304,
  },
  debugViolationPanel: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#D6D3D1',
    paddingHorizontal: 7,
    paddingVertical: 4,
    zIndex: 400,
  },
  debugViolationText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#57534E',
  },
  zoomLayer: { ...StyleSheet.absoluteFill },
  floorLayer: { ...StyleSheet.absoluteFill },
  planBase: { position: 'absolute', top: 0, left: 0, backgroundColor: '#EFEAD8' },
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
  residentFloorPill: {
    position: 'absolute', top: 10, right: 10, minHeight: 32,
    paddingHorizontal: 10, borderRadius: 9999, flexDirection: 'row', gap: 6,
    alignItems: 'center', backgroundColor: '#E0E6D9', borderWidth: 1,
    borderColor: '#C5D0B9', zIndex: 410,
  },
  residentFloorText: {
    fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#566549',
  },
  awayTag: { position: 'absolute', minHeight: 22, paddingHorizontal: 7, borderRadius: 11, flexDirection: 'row',
    alignItems: 'center', gap: 4, backgroundColor: '#E7E5E4', borderWidth: 1, borderColor: '#D6D3D1', zIndex: 360 },
  awayTagText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#57534E' },
  solarApplied: { position: 'absolute', right: 10, bottom: 10, width: 68, alignItems: 'center', zIndex: 500 },
  solarImageBox: { width: 62, height: 62, borderRadius: 18, backgroundColor: '#E0E6D9', borderWidth: 1, borderColor: '#8B9D77', alignItems: 'center', justifyContent: 'center' },
  solarImage: { width: 52, height: 52 },
  solarBadge: { minHeight: 20, marginTop: 3, paddingHorizontal: 9, borderRadius: 9999, backgroundColor: '#566549', justifyContent: 'center' },
  solarBadgeText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#F5F5F4' },
});
