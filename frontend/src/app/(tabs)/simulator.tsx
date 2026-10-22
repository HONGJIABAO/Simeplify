/** SIM-05, SIM-06, SIM-07 — two-floor Simulator floor plan. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CircleAlert, MoveUp, Undo2 } from 'lucide-react-native';
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
import { TidyUpSheet } from '@/features/simulator/components/TidyUpSheet';
import { WeekReelCaption, WeekReelSummary } from '@/features/simulator/components/WeekReelStatus';
import {
  StoredRoom, StoredPlacedItem, loadLayoutState, saveLayoutState, loadSimulationState,
  saveSimulationState, loadRoutineBlocks, saveRoutineBlocks,
} from '@/features/simulator/logic/storage';
import { DEFAULT_ROUTINE_BLOCKS, RoutineBlock, getActiveBlockAtTime } from '@/features/simulator/logic/myDayLogic';
import { DEFAULT_ROUTINE, SimSpeed, SIM_SPEED_MULTIPLIERS } from '@/features/simulator/logic/routineConfig';
import {
  AvatarSimulationState, getCurrentRoutine, getRoomCenter,
  formatTimeMinutes, Point,
} from '@/features/simulator/logic/SimulationEngine';
import { resolveAvatarPlacement } from '@/features/simulator/logic/avatarPlace';
import { clampDraggedItemToRoom, getRoomSlotDefinition, getSlotPlanPoint, tidyFloorItems } from '@/features/simulator/logic/furnishedLayout';
import { SpriteItemDef } from '@/features/simulator/logic/spriteMap';
import { PLAN_ITEM_LABEL_DURATION_MS } from '@/features/simulator/logic/itemLabel';
import { getFloorSpriteSizes } from '@/features/simulator/logic/spriteSizing';
import { createDefaultRooms, getSetUpRooms, migrateRoomId, normalizeStoredRooms } from '@/features/simulator/logic/roomData';
import { containsPoint, FloorNumber, getFloorPlanLayout, getSlotRect, STAIR_CENTER } from '@/features/simulator/logic/roomLayout';
import { shouldFollowAvatarFloor } from '@/features/simulator/logic/floorFollow';
import { AVATAR_PLAN_SPEED_PER_SECOND, findHomeWalkRoute } from '@/features/simulator/logic/walkGraph';
import { buildWeekReel, getReducedMotionSummary, getReelSavings, getReelTargetDate, type WeekReelSegment } from '@/features/simulator/logic/weekReel';
import { calcTotalSavings } from '@/features/simulator/logic/fastForward';
import { Appliance, MOCK_SIMULATOR_ITEMS } from '@/lib/mockData';
import { useAuthSession } from '@/lib/authSession';
import { useUnreadNotifications } from '@/lib/services/notificationService';
import {
  fetchSimulatorState,
  saveRoom,
  createAppliance,
  updateAppliance,
  deleteAppliance,
  saveRoutineBlocksToDb,
  calculateLiveTnbBill,
  type ApplianceTypeRow,
  type ScheduleRow,
  type TariffRateRow,
} from '@/lib/services/simulatorService';

const CURRENT_MONTHLY_SAVINGS_RM = 0;
interface WeekReelSnapshot {
  simulatedMinutes: number;
  simulatedDateTime: Date;
  avatarState: AvatarSimulationState;
  viewedFloor: FloorNumber;
  walkPath: Point[];
}
interface WeekReelRun {
  period: FastForwardPeriod;
  segments: WeekReelSegment[];
  index: number;
  segmentStartedAt: number;
  segmentDurationMs: number;
  completedDurationMs: number;
  totalDurationMs: number;
  totalSavingsRm: number;
  startDate: Date;
  snapshot: WeekReelSnapshot;
  completing?: boolean;
}
type PendingRoomAction =
  | { kind: 'new'; itemDef: SpriteItemDef; point: Point }
  | { kind: 'move'; itemId: string; point: Point };

export default function SimulatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarClearance = 56 + Math.max(insets.bottom, 16) + 8;
  const { showToast } = useToast();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [initialLayout] = useState(loadLayoutState);
  const [initialSimulation] = useState(loadSimulationState);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [rooms, setRooms] = useState<StoredRoom[]>(() => normalizeStoredRooms(initialLayout?.rooms));
  const [items, setItems] = useState<StoredPlacedItem[]>(() =>
    (initialLayout?.items && initialLayout.items.length > 0 ? initialLayout.items : MOCK_SIMULATOR_ITEMS).map((item) => ({ ...item, roomId: migrateRoomId(item.roomId) }))
  );
  const [currentFloor, setCurrentFloor] = useState<FloorNumber>(initialSimulation?.viewedFloor ?? 1);
  const currentFloorRef = useRef(currentFloor);
  useEffect(() => { currentFloorRef.current = currentFloor; }, [currentFloor]);
  const setupRooms = useMemo(() => getSetUpRooms(rooms), [rooms]);
  const [simSpeed] = useState<SimSpeed>(initialSimulation?.simSpeed ?? 1);
  const [simulatedMinutes, setSimulatedMinutes] = useState(initialSimulation?.simulatedMinutes ?? 18 * 60 + 30);
  const [simulatedDateTime, setSimulatedDateTime] = useState(() => {
    const date = new Date(2026, 9, 22, 0, 0, 0, 0);
    date.setMinutes(initialSimulation?.simulatedMinutes ?? 18 * 60 + 30);
    return date;
  });
  const { session } = useAuthSession();
  const householdId = session.profile?.household_id;
  const { hasUnread: liveHasUnread } = useUnreadNotifications(householdId);

  const [applianceTypes, setApplianceTypes] = useState<ApplianceTypeRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [activeTariff, setActiveTariff] = useState<TariffRateRow | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const hasUnreadNotifications = liveHasUnread || unreadNotificationsCount > 0;

  const avatarVariant: 'avatar_girl' | 'avatar_boy' =
    session.gender === 'boy' || (!session.gender && (initialSimulation?.avatarVariant === 'avatar_boy' || initialSimulation?.avatarVariant === 'boy'))
      ? 'avatar_boy'
      : 'avatar_girl';

  // Fetch real household state from Supabase
  useEffect(() => {
    if (!householdId) return;

    let isMounted = true;
    fetchSimulatorState(householdId)
      .then((data) => {
        if (!isMounted) return;
        if (data.rooms.length > 0) {
          setRooms(data.rooms);
        }
        if (data.appliances.length > 0) {
          setItems((prev) => {
            const furniture = prev.filter((it) => it.category === 'Furniture').map((item) => {
              const legacyMatch = /^f([12])-([A-D])$/.exec(item.roomId);
              if (!legacyMatch) return item;
              const room = data.rooms.find((candidate) => candidate.floor === Number(legacyMatch[1]) && candidate.slot === legacyMatch[2]);
              return room ? { ...item, roomId: room.id } : item;
            });
            return [...data.appliances, ...furniture];
          });
        }
        if (data.routineBlocks.length > 0) {
          setRoutineBlocks(data.routineBlocks);
        }
        setApplianceTypes(data.applianceTypes);
        setSchedules(data.schedules);
        setActiveTariff(data.tariff);
        setUnreadNotificationsCount(data.unreadNotificationsCount);
      })
      .catch((err) => console.error('Failed to load simulator data:', err));

    return () => {
      isMounted = false;
    };
  }, [householdId]);

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
  const itemLabelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedPendingItem, setSelectedPendingItem] = useState<SpriteItemDef | null>(null);
  const [applianceSheetVisible, setApplianceSheetVisible] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<StoredPlacedItem | null>(null);
  const [furnitureSheetVisible, setFurnitureSheetVisible] = useState(false);
  const [editingFurniture, setEditingFurniture] = useState<StoredPlacedItem | null>(null);
  const [namingModalVisible, setNamingModalVisible] = useState(false);
  const [namingRoom, setNamingRoom] = useState<StoredRoom | null>(null);
  const [pendingRoomAction, setPendingRoomAction] = useState<PendingRoomAction | null>(null);
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [tidySheetVisible, setTidySheetVisible] = useState(false);
  const [tidyUndoItems, setTidyUndoItems] = useState<StoredPlacedItem[] | null>(null);
  const tidyUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const [placementMessage, setPlacementMessage] = useState<string | null>(null);
  const placementMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const publishPlacementMessage = useCallback((message: string) => {
    if (placementMessageTimerRef.current) clearTimeout(placementMessageTimerRef.current);
    setPlacementMessage(message);
    placementMessageTimerRef.current = setTimeout(() => setPlacementMessage(null), 2500);
  }, []);
  useEffect(() => () => {
    if (placementMessageTimerRef.current) clearTimeout(placementMessageTimerRef.current);
    if (itemLabelTimerRef.current) clearTimeout(itemLabelTimerRef.current);
  }, []);
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
  const avatarTargetRef = useRef<{
    point: Point;
    floor: FloorNumber;
    roomId: string | null;
    facingLeft: boolean;
    isStair: boolean;
  } | null>(null);
  const avatarPathQueueRef = useRef<Point[]>([]);
  const [walkPath, setWalkPath] = useState<Point[]>([]);
  const pendingFloorTransferRef = useRef<{
    floor: FloorNumber;
    roomId: string;
    destination: Point;
    facingLeft: boolean;
    followView: boolean;
    destinationPath: Point[];
  } | null>(null);
  const userChangedFloorDuringWalkRef = useRef(false);
  const transitionStartedRef = useRef(false);
  const reelRunRef = useRef<WeekReelRun | null>(null);
  const reelCompletionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedFastForward, setSelectedFastForward] = useState<FastForwardPeriod>('1M');
  const [isWeekReelPlaying, setIsWeekReelPlaying] = useState(false);
  const [weekReelView, setWeekReelView] = useState<{ segment: WeekReelSegment; savingsRm: number } | null>(null);
  const [reducedWeekSummary, setReducedWeekSummary] = useState<ReturnType<typeof getReducedMotionSummary> | null>(null);
  const [animatedBillRm, setAnimatedBillRm] = useState<number | null>(null);
  const monthlyBillRmRef = useRef<number>(0);

  const installAvatarRoute = useCallback((
    points: Point[],
    meta: Omit<NonNullable<typeof avatarTargetRef.current>, 'point'>
  ) => {
    const route = points.length ? points : [{
      x: avatarStateRef.current.currentX,
      y: avatarStateRef.current.currentY,
    }];
    const pending = route.slice(1);
    const first = pending.shift() ?? route[0];
    avatarPathQueueRef.current = pending;
    avatarTargetRef.current = { ...meta, point: first };
    setWalkPath(route);
  }, []);

  const stopWeekReel = useCallback(() => {
    if (reelCompletionTimerRef.current) clearTimeout(reelCompletionTimerRef.current);
    const run = reelRunRef.current;
    reelRunRef.current = null;
    setIsWeekReelPlaying(false);
    setWeekReelView(null);
    setReducedWeekSummary(null);
    const baseBill = monthlyBillRmRef.current;
    const targetMax = Math.max(237, Math.round(baseBill * 2.2));
    setAnimatedBillRm(targetMax);
    if (!run) return;
    avatarTargetRef.current = null;
    avatarPathQueueRef.current = [];
    pendingFloorTransferRef.current = null;
    transitionStartedRef.current = false;
    setWalkPath(run.snapshot.walkPath);
    setAvatarState(run.snapshot.avatarState);
    setCurrentFloor(run.snapshot.viewedFloor);
    setSimulatedMinutes(run.snapshot.simulatedMinutes);
    setSimulatedDateTime(run.snapshot.simulatedDateTime);
  }, []);

  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;
      const simMinutesDelta = reelRunRef.current ? 0 : deltaSec / SIM_SPEED_MULTIPLIERS[simSpeed].realSecPerHour * 60;
      setSimulatedMinutes((value) => (value + simMinutesDelta) % 1440);
      setSimulatedDateTime((value) => new Date(value.getTime() + simMinutesDelta * 60_000));
      const target = avatarTargetRef.current;
      if (!target) return;
      const nextTarget = target.point;
      setAvatarState((previous) => {
        const dx = nextTarget.x - previous.currentX;
        const dy = nextTarget.y - previous.currentY;
        const distance = Math.hypot(dx, dy);
        const step = AVATAR_PLAN_SPEED_PER_SECOND * deltaSec;
        if (distance <= step) {
          const nextPathPoint = avatarPathQueueRef.current.shift();
          if (nextPathPoint) {
            avatarTargetRef.current = { ...target, point: nextPathPoint };
            return {
              ...previous, currentX: nextTarget.x, currentY: nextTarget.y, isWalking: true,
              facingLeft: nextPathPoint.x < nextTarget.x ? true : nextPathPoint.x > nextTarget.x ? false : previous.facingLeft,
            };
          }
          avatarTargetRef.current = null;
          setWalkPath([]);
          const transfer = pendingFloorTransferRef.current;
          if (target.isStair && transfer && previous.currentFloor !== transfer.floor && !transitionStartedRef.current) {
            transitionStartedRef.current = true;
            const fadeOutMs = reduceMotion ? 0 : 200;
            setTimeout(() => {
              const shouldFollow = transfer.followView && !userChangedFloorDuringWalkRef.current;
              if (shouldFollow) setCurrentFloor(transfer.floor);
              const floorFadeMs = reduceMotion || !shouldFollow ? 0 : 400;
              setTimeout(() => {
                pendingFloorTransferRef.current = null;
                transitionStartedRef.current = false;
                installAvatarRoute(transfer.destinationPath, {
                  floor: transfer.floor, roomId: transfer.roomId,
                  facingLeft: transfer.facingLeft, isStair: false,
                });
                setAvatarState((state) => ({
                  ...state, currentFloor: transfer.floor, targetFloor: transfer.floor,
                  currentX: STAIR_CENTER.x, currentY: STAIR_CENTER.y,
                  isFloorTransitioning: false, isWalking: true,
                }));
              }, floorFadeMs);
            }, fadeOutMs);
            return { ...previous, currentX: nextTarget.x, currentY: nextTarget.y, isWalking: false, isFloorTransitioning: true };
          }
          return {
            ...previous, currentX: nextTarget.x, currentY: nextTarget.y, isWalking: false,
            currentRoomId: target.roomId ?? previous.currentRoomId,
            facingLeft: target.facingLeft,
          };
        }
        const ratio = step / distance;
        return {
          ...previous, currentX: previous.currentX + dx * ratio, currentY: previous.currentY + dy * ratio,
          isWalking: true, facingLeft: dx < 0 ? true : dx > 0 ? false : previous.facingLeft,
        };
      });
    }, 50);
    return () => clearInterval(interval);
  }, [installAvatarRoute, reduceMotion, simSpeed]);

  useEffect(() => {
    const interval = setInterval(() => {
      const run = reelRunRef.current;
      if (!run || run.completing) return;
      const elapsed = Date.now() - run.segmentStartedAt;
      const segmentProgress = Math.min(1, elapsed / run.segmentDurationMs);
      const overallProgress = Math.min(1, (run.completedDurationMs + Math.min(elapsed, run.segmentDurationMs)) / run.totalDurationMs);
      const savingsRm = getReelSavings(run.totalSavingsRm, run.index, segmentProgress);
      setWeekReelView({ segment: run.segments[run.index], savingsRm });
      setSimulatedDateTime(getReelTargetDate(run.startDate, run.period, overallProgress));
      const baseBill = monthlyBillRmRef.current;
      const targetMax = Math.max(237, Math.round(baseBill * 2.2));
      const tickingBill = Math.round(baseBill + (targetMax - baseBill) * overallProgress);
      setAnimatedBillRm(tickingBill);
      if (segmentProgress < 1) return;
      if (run.index === run.segments.length - 1) {
        run.completing = true;
        setAnimatedBillRm(targetMax);
        setWeekReelView({ segment: run.segments[run.index], savingsRm: run.totalSavingsRm });
        setSimulatedDateTime(getReelTargetDate(run.startDate, run.period, 1));
        reelCompletionTimerRef.current = setTimeout(stopWeekReel, reduceMotion ? 0 : 700);
        return;
      }
      run.completedDurationMs += run.segmentDurationMs;
      run.index += 1;
      run.segmentStartedAt = Date.now();
      const targetRoomId = run.segments[run.index].block?.roomId;
      const targetRoom = rooms.find((room) => room.id === targetRoomId);
      const isAway = run.segments[run.index].isAway;
      run.segmentDurationMs = isAway ? 2500 : (targetRoom && targetRoom.floor !== avatarStateRef.current.currentFloor ? 6000 : 4000);
      setWeekReelView({ segment: run.segments[run.index], savingsRm });
    }, 50);
    return () => clearInterval(interval);
  }, [reduceMotion, rooms, stopWeekReel]);

  const currentRoutine = useMemo(() => {
    if (weekReelView) {
      const featured = weekReelView.segment.block;
      if (weekReelView.segment.isAway || !featured) return {
        id: `reel-${weekReelView.segment.day}-away`, name: 'Away', startTime: featured?.startTime ?? '', endTime: featured?.endTime ?? '',
        targetRoomId: setupRooms.find((room) => room.type === 'living')?.id ?? setupRooms[0]?.id,
        targetRoomType: 'living' as const, isSleeping: false, isAway: true, activeApplianceTypes: [] as string[],
        iconType: 'away' as const, avatarWalks: true,
      };
      return {
        id: `reel-${weekReelView.segment.day}-${featured.id}`, name: featured.name,
        startTime: featured.startTime, endTime: featured.endTime,
        targetRoomId: featured.roomId, targetRoomType: undefined,
        isSleeping: featured.iconType === 'sleep', isAway: false,
        activeApplianceTypes: featured.applianceIds, iconType: featured.iconType, avatarWalks: featured.avatarWalks,
      };
    }
    const active = getActiveBlockAtTime(formatTimeMinutes(simulatedMinutes), routineBlocks);
    if (active) return {
      id: active.id, name: active.name, startTime: active.startTime, endTime: active.endTime,
      targetRoomId: active.roomId, targetRoomType: active.roomId === 'away' ? 'living' : undefined,
      isSleeping: active.iconType === 'sleep', isAway: active.isAway, activeApplianceTypes: active.applianceIds,
      iconType: active.iconType, avatarWalks: active.avatarWalks,
    };
    const fallback = getCurrentRoutine(simulatedMinutes, DEFAULT_ROUTINE);
    return {
      ...fallback, targetRoomId: undefined as string | undefined,
      iconType: fallback.isSleeping ? 'sleep' as const : fallback.name.toLowerCase().includes('shower') ? 'shower' as const : 'custom' as const,
      avatarWalks: true,
    };
  }, [routineBlocks, setupRooms, simulatedMinutes, weekReelView]);
  const routineKey = `${currentRoutine.id}|${currentRoutine.name}|${currentRoutine.targetRoomId ?? currentRoutine.targetRoomType}|${currentRoutine.isSleeping}|${currentRoutine.isAway}|${currentRoutine.avatarWalks}|${currentRoutine.activeApplianceTypes?.join(',')}`;
  useEffect(() => {
    if (!setupRooms.length) return;
    const directId = currentRoutine.targetRoomId && currentRoutine.targetRoomId !== 'away' ? migrateRoomId(currentRoutine.targetRoomId) : null;
    const targetRoom = setupRooms.find((room) => room.id === directId)
      ?? setupRooms.find((room) => room.type === currentRoutine.targetRoomType) ?? setupRooms[0];
    const arrangedRoomItems = items.filter((item) => item.roomId === targetRoom.id);
    const placement = resolveAvatarPlacement({
      name: currentRoutine.name,
      iconType: currentRoutine.iconType,
      applianceIds: currentRoutine.activeApplianceTypes ?? [],
      avatarWalks: currentRoutine.avatarWalks,
    }, targetRoom, arrangedRoomItems);
    const destination = currentRoutine.isAway ? { x: 0.29, y: 0.50 } : placement.target;
    const previous = avatarStateRef.current;
    const routes = findHomeWalkRoute({
      rooms: setupRooms,
      startFloor: previous.currentFloor,
      endFloor: targetRoom.floor,
      start: { x: previous.currentX, y: previous.currentY },
      startRoomId: previous.currentRoomId,
      end: destination,
      endRoomId: targetRoom.id,
    });
    if (targetRoom.floor !== previous.currentFloor) {
      userChangedFloorDuringWalkRef.current = false;
      pendingFloorTransferRef.current = {
        floor: targetRoom.floor, roomId: targetRoom.id, destination, facingLeft: placement.facingLeft,
        destinationPath: routes[1]?.points ?? [STAIR_CENTER, destination],
        followView: shouldFollowAvatarFloor({
          viewedFloor: currentFloorRef.current,
          avatarFloorAtWalkStart: previous.currentFloor,
          isEditMode,
        }),
      };
      installAvatarRoute(routes[0]?.points ?? [{ x: previous.currentX, y: previous.currentY }, STAIR_CENTER], {
        floor: previous.currentFloor, roomId: null,
        facingLeft: STAIR_CENTER.x < previous.currentX, isStair: true,
      });
    } else {
      pendingFloorTransferRef.current = null;
      installAvatarRoute(routes[0]?.points ?? [{ x: previous.currentX, y: previous.currentY }, destination], {
        floor: targetRoom.floor, roomId: targetRoom.id,
        facingLeft: placement.facingLeft, isStair: false,
      });
    }
    const stateTimer = setTimeout(() => {
      setAvatarState((state) => ({
        ...state, targetRoomId: targetRoom.id, targetFloor: targetRoom.floor, currentActivity: currentRoutine.name,
        isSleeping: false, isSitting: false, isWalking: true,
      }));
    }, 0);
    return () => clearTimeout(stateTimer);
  }, [routineKey, setupRooms, items, rooms, currentRoutine.activeApplianceTypes, currentRoutine.avatarWalks, currentRoutine.iconType, currentRoutine.isAway, currentRoutine.name, currentRoutine.targetRoomId, currentRoutine.targetRoomType, isEditMode, installAvatarRoute]);

  const handleFloorChange = useCallback((floor: FloorNumber) => {
    if (isWeekReelPlaying) stopWeekReel();
    if (pendingFloorTransferRef.current || transitionStartedRef.current) {
      userChangedFloorDuringWalkRef.current = true;
      if (pendingFloorTransferRef.current) pendingFloorTransferRef.current.followView = false;
    }
    setCurrentFloor(floor);
  }, [isWeekReelPlaying, stopWeekReel]);

  const { activeApplianceIds, activeRoomLightIds } = useMemo(() => {
    const activeIds: string[] = [];
    const lightRooms: string[] = [];
    const targetRoom = setupRooms.find((room) => room.id === avatarState.targetRoomId);
    const arrangedRoomItems = targetRoom
      ? items.filter((item) => item.roomId === targetRoom.id)
      : [];
    const visualActiveIds = targetRoom ? resolveAvatarPlacement({
      name: currentRoutine.name,
      iconType: currentRoutine.iconType,
      applianceIds: currentRoutine.activeApplianceTypes ?? [],
      avatarWalks: currentRoutine.avatarWalks,
    }, targetRoom, arrangedRoomItems).activeApplianceIds : [];
    const residentHasArrived = Boolean(targetRoom
      && avatarState.currentRoomId === targetRoom.id
      && !avatarState.isWalking
      && !avatarState.isFloorTransitioning);
    for (const item of items) {
      if (item.category !== 'Appliances') continue;
      const isRoomCeilingLight = residentHasArrived && item.roomId === targetRoom?.id && item.type === 'light_bulb';
      if (!(item.alwaysOn || (residentHasArrived && visualActiveIds.includes(item.id)) || isRoomCeilingLight)) continue;
      activeIds.push(item.id);
      if (item.type === 'lights' || item.type === 'light_bulb') lightRooms.push(item.roomId);
    }
    return { activeApplianceIds: activeIds, activeRoomLightIds: [...new Set(lightRooms)] };
  }, [avatarState.currentRoomId, avatarState.isFloorTransitioning, avatarState.isWalking, avatarState.targetRoomId,
    currentRoutine.activeApplianceTypes, currentRoutine.avatarWalks, currentRoutine.iconType, currentRoutine.name, items, setupRooms]);

  const { totalKwh, monthlyBillRm, usageBadge } = useMemo(() => {
    return calculateLiveTnbBill({
      appliances: items,
      applianceTypes,
      schedules,
      dayBlocks: routineBlocks,
      residentsCount: session.household?.residents_count ?? 3,
      showersPerPerson: session.household?.showers_per_person ?? 2,
      minutesPerShower: session.household?.minutes_per_shower ?? 10,
      tariff: activeTariff,
    });
  }, [items, applianceTypes, schedules, routineBlocks, session.household, activeTariff]);

  useEffect(() => {
    monthlyBillRmRef.current = monthlyBillRm;
  }, [monthlyBillRm]);

  const displayBillRm = animatedBillRm ?? monthlyBillRm;

  const simulatedDateStr = useMemo(() => simulatedDateTime.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur',
  }), [simulatedDateTime]);
  const handleFastForwardPeriod = (period: FastForwardPeriod) => {
    if (isWeekReelPlaying) stopWeekReel();
    setSelectedFastForward(period);
  };

  const handleFastForwardToggle = () => {
    if (isEditMode) return;
    if (isWeekReelPlaying || reducedWeekSummary) { stopWeekReel(); return; }
    const segments = buildWeekReel(routineBlocks);
    const totalSavingsRm = calcTotalSavings(CURRENT_MONTHLY_SAVINGS_RM, selectedFastForward);
    const targetMax = Math.max(237, Math.round(monthlyBillRm * 2.2));
    if (reduceMotion) {
      setReducedWeekSummary(getReducedMotionSummary(routineBlocks, totalSavingsRm));
      setAnimatedBillRm(targetMax);
      return;
    }
    setAnimatedBillRm(monthlyBillRm);
    const durations: number[] = [];
    let expectedFloor = avatarState.currentFloor;
    for (const segment of segments) {
      if (segment.isAway) {
        durations.push(2500);
      } else {
        const roomId = segment.block?.roomId;
        const room = rooms.find((candidate) => candidate.id === roomId);
        const changesFloor = Boolean(room && room.floor !== expectedFloor);
        durations.push(changesFloor ? 6000 : 4000);
        if (room) expectedFloor = room.floor;
      }
    }
    const snapshot: WeekReelSnapshot = {
      simulatedMinutes, simulatedDateTime: new Date(simulatedDateTime.getTime()),
      avatarState: { ...avatarState }, viewedFloor: currentFloor, walkPath: [...walkPath],
    };
    reelRunRef.current = {
      period: selectedFastForward, segments, index: 0, segmentStartedAt: Date.now(),
      segmentDurationMs: durations[0], completedDurationMs: 0,
      totalDurationMs: durations.reduce((sum, duration) => sum + duration, 0),
      totalSavingsRm, startDate: new Date(simulatedDateTime.getTime()), snapshot,
    };
    setReducedWeekSummary(null);
    setWeekReelView({ segment: segments[0], savingsRm: 0 });
    setIsWeekReelPlaying(true);
  };

  const getFixedPlacementPoint = (
    item: Pick<StoredPlacedItem, 'type' | 'spriteKey'>,
    room: StoredRoom
  ) => {
    const roomItems = [...items.filter((candidate) => candidate.roomId === room.id), item as StoredPlacedItem];
    const slot = getRoomSlotDefinition(item, room, roomItems);
    return slot ? getSlotPlanPoint(room, slot) : null;
  };
  const calculateFallbackPlacementPoint = (targetRoom: StoredRoom): Point => {
    const roomRect = getSlotRect(targetRoom.slot);
    const existingInRoom = items.filter((candidate) => candidate.roomId === targetRoom.id);
    const count = existingInRoom.length;
    const col = count % 3;
    const row = Math.floor(count / 3) % 3;
    const offsetX = 0.28 + col * 0.22;
    const offsetY = 0.30 + row * 0.22;
    return {
      x: Math.max(0.08, Math.min(0.92, roomRect.x + roomRect.width * offsetX)),
      y: Math.max(0.08, Math.min(0.92, roomRect.y + roomRect.height * offsetY)),
    };
  };

  const placeItem = (itemDef: SpriteItemDef, targetRoom: StoredRoom, point?: Point) => {
    const fixed = getFixedPlacementPoint({ type: itemDef.key, spriteKey: itemDef.key }, targetRoom);
    const placementPoint = fixed ?? (point && point.x > 0 && point.y > 0 ? point : calculateFallbackPlacementPoint(targetRoom));

    if (itemDef.category === 'Furniture') {
      setItems((previous) => [...previous, {
        id: `furn_${Date.now()}`, category: 'Furniture', type: itemDef.key, spriteKey: itemDef.key,
        name: itemDef.label, roomId: targetRoom.id, posX: placementPoint.x, posY: placementPoint.y,
      }]);
      showToast(`Placed ${itemDef.label}`, 'success');
      return;
    }
    const pending: StoredPlacedItem = {
      id: `pending_${Date.now()}`, category: 'Appliances', type: itemDef.key, spriteKey: itemDef.key,
      name: itemDef.fullName, roomId: targetRoom.id, posX: placementPoint.x, posY: placementPoint.y,
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
    if (isWeekReelPlaying) {
      stopWeekReel();
      return;
    }
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
    if (pendingRoomAction?.kind === 'move') {
      const movedItem = items.find((it) => it.id === pendingRoomAction.itemId);
      const planWidth = floorRectRef.current?.width ?? 350;
      const planHeight = floorRectRef.current?.height ?? planWidth;
      const resolvedPoint = clampDraggedItemToRoom(
        pendingRoomAction.point,
        setUpRoom,
        planWidth,
        planHeight,
        getFloorSpriteSizes(planWidth).item
      );
      setItems((previous) => previous.map((item) => item.id === pendingRoomAction.itemId
        ? { ...item, ...resolvedPoint, roomId } : item));
      if (movedItem?.category === 'Appliances' && !pendingRoomAction.itemId.startsWith('pending_') && !pendingRoomAction.itemId.startsWith('mock_')) {
        updateAppliance(pendingRoomAction.itemId, {
          roomId,
          posX: resolvedPoint.x,
          posY: resolvedPoint.y,
        }).catch((err) => console.error('Failed to update moved appliance in Supabase:', err));
      }
    }
    setPendingRoomAction(null);

    // Persist room changes to Supabase
    saveRoom(roomId, name, type, true, householdId).catch((err) => console.error('Failed to save room in Supabase:', err));
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
    if (target?.kind === 'stair') publishPlacementMessage("Stairs can't hold items");
    else if (target?.kind === 'room' && point) requestPlacement(itemDef, target.room, point);
    else publishPlacementMessage('Drop inside a room to place item');
  };
  const handleItemPointerDown = (itemDef: SpriteItemDef, clientX: number, clientY: number) => {
    measureFloorPlan();
    setDragGhost({ item: itemDef, x: clientX, y: clientY });
  };

  const handleSelectItem = (item: StoredPlacedItem) => {
    if (isWeekReelPlaying) {
      stopWeekReel();
      return;
    }
    if (!isEditMode) {
      if (itemLabelTimerRef.current) clearTimeout(itemLabelTimerRef.current);
      setSelectedItemId(item.id);
      itemLabelTimerRef.current = setTimeout(() => {
        setSelectedItemId((current) => current === item.id ? null : current);
      }, PLAN_ITEM_LABEL_DURATION_MS);
      return;
    }
    if (selectedItemId !== item.id) {
      setSelectedItemId(item.id);
      return;
    }
    if (item.category === 'Appliances') { setEditingAppliance(item); setApplianceSheetVisible(true); }
    else { setEditingFurniture(item); setFurnitureSheetVisible(true); }
  };
  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = items.find((it) => it.id === itemId);
    if (itemToDelete?.category === 'Appliances' && !itemId.startsWith('pending_') && !itemId.startsWith('mock_')) {
      deleteAppliance(itemId).catch((err) => console.error('Failed to delete appliance from Supabase:', err));
    }
    setItems((value) => value.filter((item) => item.id !== itemId));
    setSelectedItemId(null);
    showToast('Item removed', 'info');
  };

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
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const planWidth = floorRectRef.current?.width ?? 350;
    const planHeight = floorRectRef.current?.height ?? planWidth;
    const resolvedPoint = clampDraggedItemToRoom(
      point,
      target.room,
      planWidth,
      planHeight,
      getFloorSpriteSizes(planWidth).item
    );
    setItems((value) => value.map((it) => it.id === itemId
      ? { ...it, ...resolvedPoint, roomId: target.room.id } : it));

    if (item?.category === 'Appliances' && !itemId.startsWith('pending_') && !itemId.startsWith('mock_')) {
      updateAppliance(itemId, {
        roomId: target.room.id,
        posX: resolvedPoint.x,
        posY: resolvedPoint.y,
      }).catch((err) => console.error('Failed to update appliance position in Supabase:', err));
    }
  };

  const handleSaveAppliance = (saved: StoredPlacedItem) => {
    const isNew = !saved.id || editingAppliance?.id.startsWith('pending_') || editingAppliance?.id.startsWith('mock_');
    if (isNew && householdId && saved.category === 'Appliances') {
      createAppliance(householdId, {
        roomId: saved.roomId,
        type: saved.type,
        brand: saved.brand,
        model: saved.model,
        wattage: saved.wattage || 100,
        starRating: saved.stars ?? 3,
        quantity: saved.quantity || 1,
        posX: saved.posX,
        posY: saved.posY,
      })
        .then((dbId) => {
          setItems((value) => value.map((item) => (item.id === editingAppliance?.id ? { ...saved, id: dbId } : item)));
        })
        .catch((err) => console.error('Failed to create appliance in Supabase:', err));
    } else if (!isNew && saved.category === 'Appliances') {
      updateAppliance(saved.id, {
        roomId: saved.roomId,
        brand: saved.brand,
        model: saved.model,
        wattage: saved.wattage,
        starRating: saved.stars,
        quantity: saved.quantity,
        posX: saved.posX,
        posY: saved.posY,
      }).catch((err) => console.error('Failed to update appliance in Supabase:', err));
    }

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

  const saveMovedAppliancePositions = (moved: StoredPlacedItem[]) => Promise.all(moved
    .filter((item) => item.category === 'Appliances' && !item.id.startsWith('pending_') && !item.id.startsWith('mock_'))
    .map((item) => updateAppliance(item.id, { roomId: item.roomId, posX: item.posX, posY: item.posY })));

  const handleTidyFloor = () => {
    const before = items.map((item) => ({ ...item }));
    const result = tidyFloorItems(items, rooms, currentFloor);
    setItems(result.items);
    setTidyUndoItems(before);
    if (tidyUndoTimerRef.current) clearTimeout(tidyUndoTimerRef.current);
    tidyUndoTimerRef.current = setTimeout(() => setTidyUndoItems(null), 6000);
    saveMovedAppliancePositions(result.moved).catch((err) => console.error('Failed to save tidy positions:', err));
    showToast(result.leftovers.length
      ? `Tidied ${result.moved.length} items; ${result.leftovers.length} stayed in place`
      : `Tidied ${result.moved.length} items on ${currentFloor}F`, 'success');
  };

  const handleUndoTidy = () => {
    if (!tidyUndoItems) return;
    const restored = tidyUndoItems;
    const restoredFloorItems = restored.filter((item) => rooms.find((room) => room.id === item.roomId)?.floor === currentFloor);
    setItems(restored);
    setTidyUndoItems(null);
    if (tidyUndoTimerRef.current) clearTimeout(tidyUndoTimerRef.current);
    saveMovedAppliancePositions(restoredFloorItems).catch((err) => console.error('Failed to save restored positions:', err));
    showToast('Tidy up undone', 'info');
  };

  useEffect(() => () => {
    if (tidyUndoTimerRef.current) clearTimeout(tidyUndoTimerRef.current);
  }, []);

  const appliancesForBillModal: Appliance[] = useMemo(() => items.filter((item) => item.category === 'Appliances').map((item) => ({
    id: item.id, name: item.name, type: item.type as any, brand: item.brand || 'Standard', wattage: item.wattage || 100,
    stars: item.stars ?? 3, roomId: item.roomId, posX: item.posX, posY: item.posY, alwaysOn: item.alwaysOn || false,
    color: '#D4A373', spriteKey: item.spriteKey, isOn: item.isOn,
  })), [items]);

  const reelRoomName = useMemo(() => {
    if (!weekReelView?.segment.block?.roomId) return weekReelView?.segment.isAway ? 'Entrance' : undefined;
    const targetId = weekReelView.segment.block.roomId;
    const directId = targetId !== 'away' ? migrateRoomId(targetId) : null;
    const targetRoom = (directId ? setupRooms.find((r) => r.id === directId) : null)
      ?? setupRooms.find((r) => r.type === targetId)
      ?? rooms.find((r) => r.id === targetId || r.type === targetId);
    return targetRoom?.name ?? (targetId.charAt(0).toUpperCase() + targetId.slice(1));
  }, [rooms, setupRooms, weekReelView]);

  return <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    <View style={styles.mobileShell}>
      <View style={styles.mainContainer}>
        <BillCard monthlyBillRm={displayBillRm} usageBadge={usageBadge} simulatedDateStr={simulatedDateStr}
          activeFastForward={selectedFastForward}
          isFastForwardPlaying={isWeekReelPlaying || Boolean(reducedWeekSummary)}
          fastForwardSavingsRm={weekReelView?.savingsRm ?? (reducedWeekSummary ? reducedWeekSummary.finalSavingsRm : null)}
          fastForwardDisabled={isEditMode}
          isEditMode={isEditMode}
          hasUnreadNotifications={hasUnreadNotifications}
          onToggleEdit={() => {
            if (isWeekReelPlaying) stopWeekReel();
            setAnimatedBillRm(null);
            if (itemLabelTimerRef.current) clearTimeout(itemLabelTimerRef.current);
            setIsEditMode((value) => !value);
            setSelectedItemId(null);
            setSelectedPendingItem(null);
          }}
          onTidyUp={() => setTidySheetVisible(true)}
          onSelectFastForward={handleFastForwardPeriod}
          onToggleFastForward={handleFastForwardToggle}
          onPressBillCard={() => {
            if (isWeekReelPlaying) stopWeekReel();
            else setBillModalVisible(true);
          }}
          onPressBell={() => {
            if (isWeekReelPlaying) stopWeekReel();
            router.push('/notifications');
          }}
          onPressCalendar={() => {
            if (isWeekReelPlaying) stopWeekReel();
            setTimelineVisible(true);
          }} />
        {!(isEditMode && Math.min(screenWidth - 32, screenHeight - 460) < 280) && (
          weekReelView ? (
            <WeekReelCaption
              segment={weekReelView.segment}
              roomName={reelRoomName}
              savingsRm={weekReelView.savingsRm}
            />
          ) : reducedWeekSummary ? (
            <WeekReelSummary
              segments={reducedWeekSummary.segments}
              finalSavingsRm={reducedWeekSummary.finalSavingsRm}
            />
          ) : (
            <View style={styles.currentTaskRow} accessibilityRole="text">
              <View style={styles.currentTaskDot} />
              <View style={styles.currentTaskCopy}>
                <Text style={styles.currentTaskLabel}>Current task</Text>
                <Text style={styles.currentTaskName} numberOfLines={1}>{currentRoutine.name}</Text>
              </View>
              <Text style={styles.currentTaskTime}>{currentRoutine.startTime}–{currentRoutine.endTime}</Text>
            </View>
          )
        )}
        <View
          style={[
            styles.floorPlanArea,
            { paddingBottom: isEditMode ? 256 : tabBarClearance },
          ]}
          onTouchStart={() => {
            if (isWeekReelPlaying) stopWeekReel();
          }}
        >
          <FloorPlan rooms={rooms} items={items} currentFloor={currentFloor} onFloorChange={handleFloorChange}
            avatarState={avatarState} avatarVariant={avatarVariant}
            isAvatarAway={Boolean(weekReelView?.segment.isAway || currentRoutine.isAway)}
            walkPath={walkPath}
            activeApplianceIds={activeApplianceIds} activeRoomLightIds={activeRoomLightIds}
            isEditMode={isEditMode} selectedItemId={selectedItemId} dragGhost={dragGhost} hoveredRoomId={hoveredRoomId}
            onRoomPress={handleRoomPress} onSelectItem={handleSelectItem} onDeleteItem={handleDeleteItem}
            onRotateItem={handleRotateItem} onMoveItemEnd={handleMoveItemEnd}
            onViewportChange={(viewport) => { floorViewportRef.current = viewport; }} floorPlanRef={floorPlanRef} onLayout={onFloorLayout} />
        </View>
      </View>
      {isEditMode && <View style={styles.editTrayOverlay}><EditSheet visible applianceTypes={applianceTypes} isDragging={Boolean(dragGhost)}
        onItemPointerDown={handleItemPointerDown} onItemDragMove={updateTrayDrag} onItemDragEnd={completeTrayDrop}
        onItemTap={(item) => { setDragGhost(null); setSelectedPendingItem(item); publishPlacementMessage(`Tap a room to place ${item.label}`); }}
        selectedPendingKey={selectedPendingItem?.key} /></View>}
      {isEditMode && (dragGhost || selectedPendingItem || placementMessage) && <View pointerEvents="none" style={styles.placementPill}>
        {placementMessage ? <CircleAlert size={16} color="#A65A43" strokeWidth={1.8} /> : <MoveUp size={16} color="#566549" strokeWidth={1.8} />}
        <Text style={[styles.placementPillText, placementMessage && styles.placementPillError]}>
          {placementMessage ?? (selectedPendingItem ? `Tap a room to place ${selectedPendingItem.label}` : 'Drop inside a room to place item')}
        </Text>
      </View>}
      {isEditMode && tidyUndoItems && !dragGhost && !selectedPendingItem && <Pressable style={styles.undoTidyPill}
        onPress={handleUndoTidy} accessibilityRole="button" accessibilityLabel="Undo tidy up">
        <Undo2 size={16} color="#566549" strokeWidth={1.8} />
        <Text style={styles.undoTidyText}>Undo tidy up</Text>
      </Pressable>}
      {dragGhost && <View pointerEvents="none" style={[styles.dragGhostRoot, { left: dragGhost.x - 26, top: dragGhost.y - 26 }]}>
        <Sprite type={dragGhost.item.key} size={52} /></View>}
      <ApplianceDetailsSheet visible={applianceSheetVisible} item={editingAppliance} rooms={setupRooms}
        onSave={handleSaveAppliance} onCancel={handleCancelApplianceSheet} onDelete={handleDeleteItem} />
      <FurnitureDetailsSheet visible={furnitureSheetVisible} item={editingFurniture} rooms={setupRooms}
        onSave={handleSaveFurniture} onCancel={() => { setFurnitureSheetVisible(false); setEditingFurniture(null); }} onDelete={handleDeleteItem} />
      <RoomNamingModal visible={namingModalVisible} room={namingRoom} onSave={handleSaveRoomName}
        onClose={() => { setNamingModalVisible(false); setNamingRoom(null); setPendingRoomAction(null); }} />
      <TidyUpSheet visible={tidySheetVisible} onConfirm={handleTidyFloor} onClose={() => setTidySheetVisible(false)} />
      <BillModal visible={billModalVisible} onClose={() => setBillModalVisible(false)} appliances={appliancesForBillModal}
        totalKwh={totalKwh} rooms={setupRooms as any} onAddAppliances={() => { setBillModalVisible(false); setIsEditMode(true); }} />
      <MyDayTimelineSheet visible={timelineVisible} onClose={() => setTimelineVisible(false)} blocks={routineBlocks}
        rooms={setupRooms} appliances={appliancesForBillModal} onAddBlockPress={() => { setTimelineVisible(false); setAddBlockVisible(true); }}
        onEditBlockPress={(block) => { setTimelineVisible(false); setSelectedBlockForEdit(block); setEditBlockVisible(true); }}
        onSaveSchedule={() => {
          saveRoutineBlocks(routineBlocks);
          if (householdId) {
            saveRoutineBlocksToDb(householdId, routineBlocks)
              .then(() => showToast('Schedule saved', 'success'))
              .catch((err) => console.error('Failed to save day_blocks to Supabase:', err));
          } else {
            showToast('Schedule saved', 'success');
          }
        }} />
      <AddBlockSheet visible={addBlockVisible} onClose={() => { setAddBlockVisible(false); setTimelineVisible(true); }}
        rooms={setupRooms} appliances={appliancesForBillModal} existingBlocks={routineBlocks}
        onSaveBlock={(block) => {
          const newBlocks = [...routineBlocks, { ...block, id: `block_${Date.now()}` }];
          setRoutineBlocks(newBlocks);
          if (householdId) {
            saveRoutineBlocksToDb(householdId, newBlocks).catch((err) =>
              console.error('Failed to save day_blocks to Supabase:', err)
            );
          }
          showToast(`Added ${block.name}`, 'success');
        }} />
      <EditBlockSheet visible={editBlockVisible} onClose={() => { setEditBlockVisible(false); setSelectedBlockForEdit(null); setTimelineVisible(true); }}
        block={selectedBlockForEdit} rooms={setupRooms} appliances={appliancesForBillModal} existingBlocks={routineBlocks}
        onUpdateBlock={(updated) => {
          const updatedBlocks = routineBlocks.map((block) => (block.id === updated.id ? updated : block));
          setRoutineBlocks(updatedBlocks);
          if (householdId) {
            saveRoutineBlocksToDb(householdId, updatedBlocks).catch((err) =>
              console.error('Failed to update day_blocks in Supabase:', err)
            );
          }
          showToast(`Updated ${updated.name}`, 'success');
        }}
        onRemoveBlock={(id) => {
          const remainingBlocks = routineBlocks.filter((block) => block.id !== id);
          setRoutineBlocks(remainingBlocks);
          if (householdId) {
            saveRoutineBlocksToDb(householdId, remainingBlocks).catch((err) =>
              console.error('Failed to remove day_block in Supabase:', err)
            );
          }
          showToast('Time block removed', 'info');
        }} />
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
  editTrayOverlay: { position: 'absolute', left: 0, right: 0, bottom: 64, zIndex: 40, height: 184 },
  placementPill: { position: 'absolute', left: 32, right: 32, bottom: 256, zIndex: 42, minHeight: 40, borderRadius: 999,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#FAF7F2', borderWidth: 1, borderColor: '#D9DED2' },
  placementPillText: { flexShrink: 1, fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#566549', textAlign: 'center' },
  placementPillError: { color: '#A65A43' },
  undoTidyPill: { position: 'absolute', alignSelf: 'center', bottom: 256, zIndex: 43, minHeight: 48, borderRadius: 24,
    paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#FAF7F2', borderWidth: 1, borderColor: '#C5D0B9' },
  undoTidyText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 13, color: '#566549' },
  dragGhostRoot: { position: Platform.OS === 'web' ? 'fixed' as any : 'absolute', width: 52, height: 52, opacity: 0.88, zIndex: 9999 },
});
