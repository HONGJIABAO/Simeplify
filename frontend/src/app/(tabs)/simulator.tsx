/** SIM-05, SIM-06, SIM-07 — two-floor Simulator floor plan. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useToast } from '@/components/Toast';
import { BillCard, FastForwardPeriod } from '@/features/simulator/components/BillCard';
import { FloorPlan, FloorViewport } from '@/features/simulator/components/FloorPlan';
import { EditSheet } from '@/features/simulator/components/EditSheet';
import { Sprite } from '@/features/simulator/components/Sprite';
import { ApplianceDetailsSheet } from '@/features/simulator/components/ApplianceDetailsSheet';
import { FurnitureDetailsSheet } from '@/features/simulator/components/FurnitureDetailsSheet';
import { RoomNamingModal } from '@/features/simulator/components/RoomNamingModal';
import { BillModal } from '@/features/simulator/components/BillModal';
import { MyDayTimelineSheet } from '@/features/simulator/components/MyDayTimelineSheet';
import { AddBlockSheet } from '@/features/simulator/components/AddBlockSheet';
import { EditBlockSheet } from '@/features/simulator/components/EditBlockSheet';
import {
  StoredRoom, StoredPlacedItem, loadLayoutState, saveLayoutState, loadSimulationState,
  saveSimulationState, loadRoutineBlocks, saveRoutineBlocks,
} from '@/features/simulator/logic/storage';
import { DEFAULT_ROUTINE_BLOCKS, RoutineBlock, getActiveBlockAtTime } from '@/features/simulator/logic/myDayLogic';
import { DEFAULT_ROUTINE, SimSpeed, SIM_SPEED_MULTIPLIERS } from '@/features/simulator/logic/routineConfig';
import {
  AvatarSimulationState, getCurrentRoutine, getRoomCenter, buildWaypoints,
  computeSimulationBill, formatTimeMinutes, Point,
} from '@/features/simulator/logic/SimulationEngine';
import { SPRITE_MAP, SpriteItemDef } from '@/features/simulator/logic/spriteMap';
import { createDefaultRooms, getSetUpRooms, migrateRoomId, normalizeStoredRooms } from '@/features/simulator/logic/roomData';
import { clampPointToRect, containsPoint, FloorNumber, getFloorPlanLayout, getSlotRect, STAIR_CENTER } from '@/features/simulator/logic/roomLayout';
import { getFloorSpriteSizes } from '@/features/simulator/logic/spriteSizing';
import { Appliance, MOCK_SIMULATOR_ITEMS } from '@/lib/mockData';

const FAST_FORWARD_CONFIG: Record<FastForwardPeriod, { durationSeconds: number; label: string }> = {
  '1w': { durationSeconds: 5, label: '1 week' },
  '1m': { durationSeconds: 10, label: '1 month' },
  '1y': { durationSeconds: 15, label: '1 year' },
};
interface FastForwardRun { period: FastForwardPeriod; durationSeconds: number; elapsedSeconds: number }
type PendingRoomAction =
  | { kind: 'new'; itemDef: SpriteItemDef; point: Point }
  | { kind: 'move'; itemId: string; point: Point };

export default function SimulatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarClearance = 56 + Math.max(insets.bottom, 16) + 8;
  const { showToast } = useToast();
  const [initialLayout] = useState(loadLayoutState);
  const [initialSimulation] = useState(loadSimulationState);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [rooms, setRooms] = useState<StoredRoom[]>(() => normalizeStoredRooms(initialLayout?.rooms));
  const [items, setItems] = useState<StoredPlacedItem[]>(() =>
    (initialLayout?.items && initialLayout.items.length > 0 ? initialLayout.items : MOCK_SIMULATOR_ITEMS).map((item) => ({ ...item, roomId: migrateRoomId(item.roomId) }))
  );
  const [currentFloor, setCurrentFloor] = useState<FloorNumber>(initialSimulation?.viewedFloor ?? 1);
  const setupRooms = useMemo(() => getSetUpRooms(rooms), [rooms]);
  const [simSpeed] = useState<SimSpeed>(initialSimulation?.simSpeed ?? 1);
  const [simulatedMinutes, setSimulatedMinutes] = useState(initialSimulation?.simulatedMinutes ?? 18 * 60 + 30);
  const [simulatedDateTime, setSimulatedDateTime] = useState(() => {
    const date = new Date(2026, 9, 20, 0, 0, 0, 0);
    date.setMinutes(initialSimulation?.simulatedMinutes ?? 18 * 60 + 30);
    return date;
  });
  const [avatarVariant] = useState<'avatar_girl' | 'avatar_boy'>(() =>
    initialSimulation?.avatarVariant === 'avatar_boy' || initialSimulation?.avatarVariant === 'boy'
      ? 'avatar_boy' : 'avatar_girl'
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  useEffect(() => saveLayoutState({ rooms, items }), [rooms, items]);
  useEffect(() => saveSimulationState({ simSpeed, simulatedMinutes, avatarVariant, viewedFloor: currentFloor }),
    [avatarVariant, currentFloor, simSpeed, simulatedMinutes]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedPendingItem, setSelectedPendingItem] = useState<SpriteItemDef | null>(null);
  const [applianceSheetVisible, setApplianceSheetVisible] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<StoredPlacedItem | null>(null);
  const [furnitureSheetVisible, setFurnitureSheetVisible] = useState(false);
  const [editingFurniture, setEditingFurniture] = useState<StoredPlacedItem | null>(null);
  const [namingModalVisible, setNamingModalVisible] = useState(false);
  const [namingRoom, setNamingRoom] = useState<StoredRoom | null>(null);
  const [pendingRoomAction, setPendingRoomAction] = useState<PendingRoomAction | null>(null);
  const [billModalVisible, setBillModalVisible] = useState(false);

  const [routineBlocks, setRoutineBlocks] = useState<RoutineBlock[]>(() => {
    const saved = loadRoutineBlocks();
    const blocks = saved?.length ? saved as RoutineBlock[] : DEFAULT_ROUTINE_BLOCKS;
    return blocks.map((block) => ({ ...block, roomId: block.roomId === 'away' ? 'away' : migrateRoomId(block.roomId) }));
  });
  useEffect(() => saveRoutineBlocks(routineBlocks), [routineBlocks]);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [addBlockVisible, setAddBlockVisible] = useState(false);
  const [editBlockVisible, setEditBlockVisible] = useState(false);
  const [selectedBlockForEdit, setSelectedBlockForEdit] = useState<RoutineBlock | null>(null);

  const floorPlanRef = useRef<View>(null);
  const floorRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const floorViewportRef = useRef<FloorViewport>({ scale: 1, translateX: 0, translateY: 0 });
  const [dragGhost, setDragGhost] = useState<{ item: SpriteItemDef; x: number; y: number } | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const measureFloorPlan = useCallback(() => {
    (floorPlanRef.current as any)?.measureInWindow((x: number, y: number, width: number, height: number) => {
      if (width > 0 && height > 0) floorRectRef.current = { left: x, top: y, width, height };
    });
  }, []);
  const onFloorLayout = useCallback((_event: LayoutChangeEvent) => measureFloorPlan(), [measureFloorPlan]);

  const firstRoom = setupRooms[0] ?? createDefaultRooms()[0];
  const firstCenter = getRoomCenter(firstRoom);
  const [avatarState, setAvatarState] = useState<AvatarSimulationState>({
    currentX: firstCenter.x, currentY: firstCenter.y, facingLeft: false,
    isWalking: false, isSleeping: false, isSitting: false,
    currentRoomId: firstRoom.id, targetRoomId: firstRoom.id, currentActivity: 'At home',
    currentFloor: firstRoom.floor, targetFloor: firstRoom.floor, isFloorTransitioning: false,
  });
  const avatarStateRef = useRef(avatarState);
  useEffect(() => { avatarStateRef.current = avatarState; }, [avatarState]);
  const waypointQueue = useRef<Point[]>([]);
  const arrivalRoomIdRef = useRef<string | null>(firstRoom.id);
  const pendingFloorTransferRef = useRef<{ floor: FloorNumber; roomId: string; destination: Point } | null>(null);
  const transitionStartedRef = useRef(false);
  const [avatarWalkPath, setAvatarWalkPath] = useState<Point[]>([]);
  const fastForwardRunRef = useRef<FastForwardRun | null>(null);
  const [activeFastForward, setActiveFastForward] = useState<FastForwardPeriod | null>(null);

  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;
      const run = fastForwardRunRef.current;
      let simMinutesDelta: number;
      if (run) {
        const frame = Math.min(deltaSec, Math.max(0, run.durationSeconds - run.elapsedSeconds));
        simMinutesDelta = frame / run.durationSeconds * 7 * 24 * 60;
        run.elapsedSeconds += frame;
        if (run.elapsedSeconds >= run.durationSeconds) { fastForwardRunRef.current = null; setActiveFastForward(null); }
      } else simMinutesDelta = deltaSec / SIM_SPEED_MULTIPLIERS[simSpeed].realSecPerHour * 60;
      setSimulatedMinutes((value) => (value + simMinutesDelta) % 1440);
      setSimulatedDateTime((value) => new Date(value.getTime() + simMinutesDelta * 60_000));
      if (waypointQueue.current.length === 0) return;
      const nextTarget = waypointQueue.current[0];
      setAvatarState((previous) => {
        const dx = nextTarget.x - previous.currentX;
        const dy = nextTarget.y - previous.currentY;
        const distance = Math.hypot(dx, dy);
        const step = (run ? 12 : 0.28) * deltaSec;
        if (distance <= step) {
          waypointQueue.current.shift();
          const reachedFinal = waypointQueue.current.length === 0;
          if (reachedFinal) {
            const transfer = pendingFloorTransferRef.current;
            if (transfer && previous.currentFloor !== transfer.floor && !transitionStartedRef.current) {
              transitionStartedRef.current = true;
              setTimeout(() => {
                pendingFloorTransferRef.current = null;
                transitionStartedRef.current = false;
                arrivalRoomIdRef.current = transfer.roomId;
                const route = buildWaypoints(STAIR_CENTER, null, transfer.destination, transfer.roomId);
                waypointQueue.current = route;
                setAvatarWalkPath(route);
                setAvatarState((state) => ({
                  ...state, currentFloor: transfer.floor, targetFloor: transfer.floor,
                  currentX: STAIR_CENTER.x, currentY: STAIR_CENTER.y,
                  isFloorTransitioning: false, isWalking: true,
                }));
              }, reduceMotion ? 0 : 400);
              return { ...previous, currentX: nextTarget.x, currentY: nextTarget.y, isWalking: false, isFloorTransitioning: true };
            }
          }
          return {
            ...previous, currentX: nextTarget.x, currentY: nextTarget.y, isWalking: !reachedFinal,
            currentRoomId: reachedFinal ? arrivalRoomIdRef.current : previous.currentRoomId,
            facingLeft: dx < 0 ? true : dx > 0 ? false : previous.facingLeft,
          };
        }
        const ratio = step / distance;
        return {
          ...previous, currentX: previous.currentX + dx * ratio, currentY: previous.currentY + dy * ratio,
          isWalking: true, facingLeft: dx < 0 ? true : dx > 0 ? false : previous.facingLeft,
        };
      });
      setAvatarWalkPath([...waypointQueue.current]);
    }, 50);
    return () => clearInterval(interval);
  }, [reduceMotion, simSpeed]);

  const currentRoutine = useMemo(() => {
    const active = getActiveBlockAtTime(formatTimeMinutes(simulatedMinutes), routineBlocks);
    if (active) return {
      id: active.id, name: active.name, startTime: active.startTime, endTime: active.endTime,
      targetRoomId: active.roomId, targetRoomType: active.roomId === 'away' ? 'living' : undefined,
      isSleeping: active.iconType === 'sleep', isAway: active.isAway, activeApplianceTypes: active.applianceIds,
    };
    const fallback = getCurrentRoutine(simulatedMinutes, DEFAULT_ROUTINE);
    return { ...fallback, targetRoomId: undefined as string | undefined };
  }, [routineBlocks, simulatedMinutes]);
  const routineKey = `${currentRoutine.id}|${currentRoutine.name}|${currentRoutine.targetRoomId ?? currentRoutine.targetRoomType}|${currentRoutine.isSleeping}`;
  useEffect(() => {
    if (!setupRooms.length) return;
    const directId = currentRoutine.targetRoomId && currentRoutine.targetRoomId !== 'away' ? migrateRoomId(currentRoutine.targetRoomId) : null;
    const targetRoom = setupRooms.find((room) => room.id === directId)
      ?? setupRooms.find((room) => room.type === currentRoutine.targetRoomType) ?? setupRooms[0];
    const activity = currentRoutine.name.toLowerCase();
    const activityItem = items.find((item) => {
      const definition = SPRITE_MAP[item.spriteKey || item.type];
      return item.roomId === targetRoom.id && definition?.activityNames?.some((name) => activity.includes(name));
    });
    const sleepingSpot = items.find((item) => {
      const definition = SPRITE_MAP[item.spriteKey || item.type];
      return item.roomId === targetRoom.id && item.category === 'Furniture' && definition?.isSleepingSpot;
    });
    const destination = currentRoutine.isSleeping && sleepingSpot
      ? { x: sleepingSpot.posX, y: sleepingSpot.posY }
      : activityItem ? { x: activityItem.posX, y: activityItem.posY } : getRoomCenter(targetRoom);
    const previous = avatarStateRef.current;
    arrivalRoomIdRef.current = targetRoom.id;
    if (targetRoom.floor !== previous.currentFloor) {
      pendingFloorTransferRef.current = { floor: targetRoom.floor, roomId: targetRoom.id, destination };
      waypointQueue.current = buildWaypoints({ x: previous.currentX, y: previous.currentY }, previous.currentRoomId, STAIR_CENTER, null);
    } else {
      pendingFloorTransferRef.current = null;
      waypointQueue.current = buildWaypoints({ x: previous.currentX, y: previous.currentY }, previous.currentRoomId, destination, targetRoom.id);
    }
    setAvatarWalkPath([...waypointQueue.current]);
    setAvatarState((state) => ({
      ...state, targetRoomId: targetRoom.id, targetFloor: targetRoom.floor, currentActivity: currentRoutine.name,
      isSleeping: Boolean(currentRoutine.isSleeping), isSitting: Boolean(activityItem), isWalking: waypointQueue.current.length > 0,
    }));
  }, [routineKey, setupRooms, items, currentRoutine.isSleeping, currentRoutine.name, currentRoutine.targetRoomId, currentRoutine.targetRoomType]);

  const { activeApplianceIds, activeRoomLightIds } = useMemo(() => {
    const activeIds: string[] = [];
    const lightRooms: string[] = [];
    const activity = currentRoutine.name.toLowerCase();
    for (const item of items) {
      if (item.category !== 'Appliances') continue;
      const definition = SPRITE_MAP[item.spriteKey || item.type];
      const scheduled = currentRoutine.activeApplianceTypes?.some((value) => value === item.id || value === item.type);
      const activityDriven = definition?.activityNames?.some((name) => activity.includes(name));
      if (!(item.alwaysOn || item.isOn || (item.roomId === avatarState.targetRoomId && (scheduled || activityDriven)))) continue;
      activeIds.push(item.id);
      if (item.type === 'lights' || item.type === 'light_bulb') lightRooms.push(item.roomId);
    }
    return { activeApplianceIds: activeIds, activeRoomLightIds: [...new Set(lightRooms)] };
  }, [avatarState.targetRoomId, currentRoutine.activeApplianceTypes, currentRoutine.name, items]);
  const { totalKwh, monthlyBillRm, usageBadge } = useMemo(() => computeSimulationBill(items), [items]);
  const simulatedDateStr = useMemo(() => simulatedDateTime.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur',
  }), [simulatedDateTime]);
  const handleFastForward = (period: FastForwardPeriod) => {
    const config = FAST_FORWARD_CONFIG[period];
    fastForwardRunRef.current = { period, durationSeconds: config.durationSeconds, elapsedSeconds: 0 };
    setActiveFastForward(period);
    showToast(`${config.label} preview: completing 7 days in ${config.durationSeconds} seconds`, 'info');
  };

  const clampItemPoint = (item: Pick<StoredPlacedItem, 'category'>, room: StoredRoom, point: Point) => {
    const planWidth = floorRectRef.current?.width ?? 358;
    const planHeight = floorRectRef.current?.height ?? 330;
    const sizes = getFloorSpriteSizes(planWidth);
    const size = item.category === 'Furniture' ? sizes.furniture : sizes.appliance;
    return clampPointToRect(getSlotRect(room.slot), point, size / 2 / planWidth, (size / 2 + 12) / planHeight);
  };
  const placeItem = (itemDef: SpriteItemDef, targetRoom: StoredRoom, point: Point) => {
    const clamped = clampItemPoint({ category: itemDef.category as 'Appliances' | 'Furniture' }, targetRoom, point);
    if (itemDef.category === 'Furniture') {
      setItems((previous) => [...previous, {
        id: `furn_${Date.now()}`, category: 'Furniture', type: itemDef.key, spriteKey: itemDef.key,
        name: itemDef.label, roomId: targetRoom.id, posX: clamped.x, posY: clamped.y,
      }]);
      showToast(`Placed ${itemDef.label}`, 'success');
      return;
    }
    const pending: StoredPlacedItem = {
      id: `pending_${Date.now()}`, category: 'Appliances', type: itemDef.key, spriteKey: itemDef.key,
      name: itemDef.fullName, roomId: targetRoom.id, posX: clamped.x, posY: clamped.y,
      brand: '', model: '', quantity: 1, wattage: itemDef.defaultWattage,
      stars: itemDef.hasStarRating === false ? undefined : 3, hoursPerDay: itemDef.defaultHours,
      alwaysOn: itemDef.alwaysOn ?? false, isOn: false,
    };
    setItems((previous) => [...previous, pending]);
    setEditingAppliance(pending);
    setApplianceSheetVisible(true);
  };
  const requestPlacement = (itemDef: SpriteItemDef, room: StoredRoom, point: Point) => {
    if (!room.isSetUp) {
      setPendingRoomAction({ kind: 'new', itemDef, point });
      setNamingRoom(room); setNamingModalVisible(true); return;
    }
    placeItem(itemDef, room, point);
  };
  const handleRoomPress = (room: StoredRoom) => {
    if (selectedPendingItem) {
      requestPlacement(selectedPendingItem, room, getRoomCenter(room));
      setSelectedPendingItem(null); return;
    }
    setNamingRoom(room); setNamingModalVisible(true);
  };
  const handleSaveRoomName = (roomId: string, name: string, type: StoredRoom['type']) => {
    const original = rooms.find((room) => room.id === roomId);
    if (!original) return;
    const setUpRoom = { ...original, name, type, isSetUp: true };
    setRooms((previous) => previous.map((room) => room.id === roomId ? setUpRoom : room));
    if (pendingRoomAction?.kind === 'new') placeItem(pendingRoomAction.itemDef, setUpRoom, pendingRoomAction.point);
    if (pendingRoomAction?.kind === 'move') setItems((previous) => previous.map((item) => item.id === pendingRoomAction.itemId
      ? { ...item, ...clampItemPoint(item, setUpRoom, pendingRoomAction.point), roomId } : item));
    setPendingRoomAction(null);
    showToast(`Saved room “${name}”`, 'success');
  };

  const pointerToPlanPosition = (clientX: number, clientY: number): Point | null => {
    const rect = floorRectRef.current;
    if (!rect) return null;
    const viewport = floorViewportRef.current;
    const sx = (clientX - rect.left) / rect.width;
    const sy = (clientY - rect.top) / rect.height;
    return { x: 0.5 + (sx - 0.5 - viewport.translateX / rect.width) / viewport.scale,
      y: 0.5 + (sy - 0.5 - viewport.translateY / rect.height) / viewport.scale };
  };
  const getPlanTarget = (point: Point): { kind: 'stair' } | { kind: 'room'; room: StoredRoom } | null => {
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return null;
    const layout = getFloorPlanLayout(currentFloor);
    if (containsPoint(layout.stair, point.x, point.y)) return { kind: 'stair' };
    const slot = layout.rooms.find((entry) => containsPoint(entry, point.x, point.y))?.slot;
    const room = rooms.find((candidate) => candidate.floor === currentFloor && candidate.slot === slot);
    return room ? { kind: 'room', room } : null;
  };
  const updateTrayDrag = (itemDef: SpriteItemDef, clientX: number, clientY: number) => {
    setDragGhost({ item: itemDef, x: clientX, y: clientY });
    const point = pointerToPlanPosition(clientX, clientY);
    const target = point ? getPlanTarget(point) : null;
    setHoveredRoomId(target?.kind === 'room' ? target.room.id : null);
  };
  const completeTrayDrop = (itemDef: SpriteItemDef, clientX: number, clientY: number) => {
    setDragGhost(null); setHoveredRoomId(null);
    const point = pointerToPlanPosition(clientX, clientY);
    const target = point ? getPlanTarget(point) : null;
    if (target?.kind === 'stair') showToast("Stairs can't hold items", 'info');
    else if (target?.kind === 'room' && point) requestPlacement(itemDef, target.room, point);
    else showToast('Drop inside a room to place item', 'info');
  };
  const handleItemPointerDown = (itemDef: SpriteItemDef, clientX: number, clientY: number) => {
    measureFloorPlan();
    setDragGhost({ item: itemDef, x: clientX, y: clientY });
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onPointerMove = (event: PointerEvent) => {
      updateTrayDrag(itemDef, event.clientX, event.clientY);
    };
    const onPointerUp = (event: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp);
      completeTrayDrop(itemDef, event.clientX, event.clientY);
    };
    window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', onPointerUp);
  };

  const handleSelectItem = (item: StoredPlacedItem) => {
    setSelectedItemId(item.id);
    if (!isEditMode) return;
    if (item.category === 'Appliances') { setEditingAppliance(item); setApplianceSheetVisible(true); }
    else { setEditingFurniture(item); setFurnitureSheetVisible(true); }
  };
  const handleDeleteItem = (itemId: string) => { setItems((value) => value.filter((item) => item.id !== itemId)); setSelectedItemId(null); showToast('Item removed', 'info'); };
  const handleRotateItem = (itemId: string) => setItems((value) => value.map((item) =>
    item.id === itemId && item.category === 'Furniture' ? { ...item, rotation: ((item.rotation ?? 0) + 90) % 360 } : item));
  const handleMoveItemEnd = (itemId: string, x: number, y: number) => {
    const point = { x, y };
    const target = getPlanTarget(point);
    if (target?.kind === 'stair') { showToast("Stairs can't hold items", 'info'); return; }
    if (target?.kind !== 'room') return;
    if (!target.room.isSetUp) {
      setPendingRoomAction({ kind: 'move', itemId, point }); setNamingRoom(target.room); setNamingModalVisible(true); return;
    }
    setItems((value) => value.map((item) => item.id === itemId
      ? { ...item, ...clampItemPoint(item, target.room, point), roomId: target.room.id } : item));
  };
  const handleSaveAppliance = (saved: StoredPlacedItem) => {
    setItems((value) => value.map((item) => item.id === editingAppliance?.id ? saved : item));
    setApplianceSheetVisible(false); setEditingAppliance(null); showToast(`Saved ${saved.name}`, 'success');
  };
  const handleCancelApplianceSheet = () => {
    if (editingAppliance?.id.startsWith('pending_')) setItems((value) => value.filter((item) => item.id !== editingAppliance.id));
    setApplianceSheetVisible(false); setEditingAppliance(null);
  };
  const handleSaveFurniture = (saved: StoredPlacedItem) => {
    setItems((value) => value.map((item) => item.id === editingFurniture?.id ? saved : item));
    setFurnitureSheetVisible(false); setEditingFurniture(null); showToast(`Saved ${saved.name}`, 'success');
  };

  const appliancesForBillModal: Appliance[] = useMemo(() => items.filter((item) => item.category === 'Appliances').map((item) => ({
    id: item.id, name: item.name, type: item.type as any, brand: item.brand || 'Standard', wattage: item.wattage || 100,
    stars: item.stars ?? 3, roomId: item.roomId, posX: item.posX, posY: item.posY, alwaysOn: item.alwaysOn || false,
    color: '#D4A373', spriteKey: item.spriteKey, isOn: item.isOn,
  })), [items]);

  return <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    <View style={styles.mobileShell}>
      <View style={styles.mainContainer}>
        <BillCard monthlyBillRm={monthlyBillRm} usageBadge={usageBadge} simulatedDateStr={simulatedDateStr}
          activeFastForward={activeFastForward} isEditMode={isEditMode}
          onToggleEdit={() => { setIsEditMode((value) => !value); setSelectedItemId(null); setSelectedPendingItem(null); }}
          onSelectFastForward={handleFastForward} onPressBillCard={() => setBillModalVisible(true)}
          onPressBell={() => router.push('/notifications')} onPressCalendar={() => setTimelineVisible(true)} />
        <View style={styles.currentTaskRow} accessibilityRole="text">
          <View style={styles.currentTaskDot} />
          <View style={styles.currentTaskCopy}><Text style={styles.currentTaskLabel}>Current task</Text>
            <Text style={styles.currentTaskName} numberOfLines={1}>{currentRoutine.name}</Text></View>
          <Text style={styles.currentTaskTime}>{currentRoutine.startTime}–{currentRoutine.endTime}</Text>
        </View>
        <View
          style={[
            styles.floorPlanArea,
            { paddingBottom: isEditMode ? 220 : tabBarClearance },
          ]}
        >
          <FloorPlan rooms={rooms} items={items} currentFloor={currentFloor} onFloorChange={setCurrentFloor}
            avatarState={avatarState} walkPath={avatarWalkPath} avatarVariant={avatarVariant}
            activeApplianceIds={activeApplianceIds} activeRoomLightIds={activeRoomLightIds}
            isEditMode={isEditMode} selectedItemId={selectedItemId} dragGhost={dragGhost} hoveredRoomId={hoveredRoomId}
            onRoomPress={handleRoomPress} onSelectItem={handleSelectItem} onDeleteItem={handleDeleteItem}
            onRotateItem={handleRotateItem} onMoveItemEnd={handleMoveItemEnd}
            onViewportChange={(viewport) => { floorViewportRef.current = viewport; }} floorPlanRef={floorPlanRef} onLayout={onFloorLayout} />
        </View>
      </View>
      {isEditMode && <View style={styles.editTrayOverlay}><EditSheet visible isDragging={Boolean(dragGhost)}
        onItemPointerDown={handleItemPointerDown} onItemDragMove={updateTrayDrag} onItemDragEnd={completeTrayDrop}
        onItemTap={(item) => { setDragGhost(null); setSelectedPendingItem(item); showToast(`Tap a room to place ${item.label}`, 'info'); }}
        selectedPendingKey={selectedPendingItem?.key} /></View>}
      {dragGhost && <View pointerEvents="none" style={[styles.dragGhostRoot, { left: dragGhost.x - 26, top: dragGhost.y - 26 }]}>
        <Sprite type={dragGhost.item.key} size={52} /></View>}
      <ApplianceDetailsSheet visible={applianceSheetVisible} item={editingAppliance} rooms={setupRooms}
        onSave={handleSaveAppliance} onCancel={handleCancelApplianceSheet} onDelete={handleDeleteItem} />
      <FurnitureDetailsSheet visible={furnitureSheetVisible} item={editingFurniture} rooms={setupRooms}
        onSave={handleSaveFurniture} onCancel={() => { setFurnitureSheetVisible(false); setEditingFurniture(null); }} onDelete={handleDeleteItem} />
      <RoomNamingModal visible={namingModalVisible} room={namingRoom} onSave={handleSaveRoomName}
        onClose={() => { setNamingModalVisible(false); setNamingRoom(null); setPendingRoomAction(null); }} />
      <BillModal visible={billModalVisible} onClose={() => setBillModalVisible(false)} appliances={appliancesForBillModal}
        totalKwh={totalKwh} rooms={setupRooms as any} onAddAppliances={() => { setBillModalVisible(false); setIsEditMode(true); }} />
      <MyDayTimelineSheet visible={timelineVisible} onClose={() => setTimelineVisible(false)} blocks={routineBlocks}
        rooms={setupRooms} appliances={appliancesForBillModal} onAddBlockPress={() => { setTimelineVisible(false); setAddBlockVisible(true); }}
        onEditBlockPress={(block) => { setTimelineVisible(false); setSelectedBlockForEdit(block); setEditBlockVisible(true); }}
        onSaveSchedule={() => { saveRoutineBlocks(routineBlocks); showToast('Schedule saved', 'success'); }} />
      <AddBlockSheet visible={addBlockVisible} onClose={() => { setAddBlockVisible(false); setTimelineVisible(true); }}
        rooms={setupRooms} appliances={appliancesForBillModal} existingBlocks={routineBlocks}
        onSaveBlock={(block) => { setRoutineBlocks((value) => [...value, { ...block, id: `block_${Date.now()}` }]); showToast(`Added ${block.name}`, 'success'); }} />
      <EditBlockSheet visible={editBlockVisible} onClose={() => { setEditBlockVisible(false); setSelectedBlockForEdit(null); setTimelineVisible(true); }}
        block={selectedBlockForEdit} rooms={setupRooms} appliances={appliancesForBillModal} existingBlocks={routineBlocks}
        onUpdateBlock={(updated) => { setRoutineBlocks((value) => value.map((block) => block.id === updated.id ? updated : block)); showToast(`Updated ${updated.name}`, 'success'); }}
        onRemoveBlock={(id) => { setRoutineBlocks((value) => value.filter((block) => block.id !== id)); showToast('Time block removed', 'info'); }} />
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EDF1EB' },
  mobileShell: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', position: 'relative', overflow: 'hidden' },
  mainContainer: { flex: 1, minHeight: 0, paddingHorizontal: 16, paddingTop: 10 },
  floorPlanArea: { flex: 1, minHeight: 0, width: '100%', marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  currentTaskRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginTop: 2, marginBottom: 4 },
  currentTaskDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#8B9D77', marginRight: 10 },
  currentTaskCopy: { flex: 1, minWidth: 0 },
  currentTaskLabel: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, lineHeight: 16, color: '#57534E' },
  currentTaskName: { fontFamily: 'Lora_500Medium', fontSize: 18, lineHeight: 23, color: '#292524', letterSpacing: -0.2 },
  currentTaskTime: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#566549', marginLeft: 10 },
  editTrayOverlay: { position: 'absolute', left: 0, right: 0, bottom: 64, zIndex: 40, maxHeight: '28%', overflow: 'hidden' },
  dragGhostRoot: { position: Platform.OS === 'web' ? 'fixed' as any : 'absolute', width: 52, height: 52, opacity: 0.88, zIndex: 9999 },
});
