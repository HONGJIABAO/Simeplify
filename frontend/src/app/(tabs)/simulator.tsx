/**
 * Simulator tab — Simeplify
 * Mobile-first energy simulator with interactive 4-room floor plan,
 * custom room naming, drag-and-drop appliances & furniture,
 * living avatar simulation with daily routine, on/off appliance glows,
 * and live TNB tariff bill calculation.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useToast } from '@/components/Toast';

import { BillCard } from '@/features/simulator/components/BillCard';
import { FloorPlan } from '@/features/simulator/components/FloorPlan';
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
  StoredRoom,
  StoredPlacedItem,
  loadLayoutState,
  saveLayoutState,
  loadSimulationState,
  saveSimulationState,
  loadRoutineBlocks,
  saveRoutineBlocks,
} from '@/features/simulator/logic/storage';
import {
  DEFAULT_ROUTINE_BLOCKS,
  RoutineBlock,
  getActiveBlockAtTime,
} from '@/features/simulator/logic/myDayLogic';
import {
  DEFAULT_ROUTINE,
  SimSpeed,
  SIM_SPEED_MULTIPLIERS,
} from '@/features/simulator/logic/routineConfig';
import {
  AvatarSimulationState,
  getCurrentRoutine,
  getRoomCenter,
  buildWaypoints,
  computeSimulationBill,
  formatTimeMinutes,
  Point,
} from '@/features/simulator/logic/SimulationEngine';
import { SpriteItemDef } from '@/features/simulator/logic/spriteMap';
import { Appliance } from '@/lib/mockData';

const INITIAL_ROOMS: StoredRoom[] = [
  { id: 'living', name: '', type: 'living', gridCol: 0, gridRow: 0, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'kitchen', name: '', type: 'kitchen', gridCol: 2, gridRow: 0, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'bedroom', name: '', type: 'bedroom', gridCol: 0, gridRow: 2, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'bathroom', name: '', type: 'bathroom', gridCol: 2, gridRow: 2, gridColSpan: 2, gridRowSpan: 2 },
];

export default function SimulatorScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  // ── Layout State (persisted) ───────────────────────────────────────────────
  const [rooms, setRooms] = useState<StoredRoom[]>(() => {
    const saved = loadLayoutState();
    return saved?.rooms && saved.rooms.length > 0 ? saved.rooms : INITIAL_ROOMS;
  });

  const [items, setItems] = useState<StoredPlacedItem[]>(() => {
    const saved = loadLayoutState();
    return saved?.items ?? [];
  });

  // ── Simulation State (persisted separately) ───────────────────────────────
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(() => {
    const saved = loadSimulationState();
    return saved?.simSpeed ?? 1;
  });

  const [simulatedMinutes, setSimulatedMinutes] = useState<number>(() => {
    const saved = loadSimulationState();
    // Default 18:30 (1110 minutes) matching screenshot
    return saved?.simulatedMinutes ?? 18 * 60 + 30;
  });

  const [avatarVariant] = useState<'avatar_girl' | 'avatar_boy'>(() => {
    const saved = loadSimulationState();
    return saved?.avatarVariant === 'avatar_boy' || saved?.avatarVariant === 'boy'
      ? 'avatar_boy'
      : 'avatar_girl';
  });

  // Save layout state on changes
  useEffect(() => {
    saveLayoutState({ rooms, items });
  }, [rooms, items]);

  // Save simulation state on changes
  useEffect(() => {
    saveSimulationState({ simSpeed, simulatedMinutes, avatarVariant });
  }, [simSpeed, simulatedMinutes, avatarVariant]);

  // ── Edit Mode & UI State ───────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedPendingItem, setSelectedPendingItem] = useState<SpriteItemDef | null>(null);

  // Modals & Sheets
  const [applianceSheetVisible, setApplianceSheetVisible] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<StoredPlacedItem | null>(null);

  const [furnitureSheetVisible, setFurnitureSheetVisible] = useState(false);
  const [editingFurniture, setEditingFurniture] = useState<StoredPlacedItem | null>(null);

  const [namingModalVisible, setNamingModalVisible] = useState(false);
  const [namingRoom, setNamingRoom] = useState<StoredRoom | null>(null);

  const [billModalVisible, setBillModalVisible] = useState(false);

  // ── Routine Blocks State (persisted) ──────────────────────────────────────
  const [routineBlocks, setRoutineBlocks] = useState<RoutineBlock[]>(() => {
    const saved = loadRoutineBlocks();
    return saved && saved.length > 0 ? (saved as RoutineBlock[]) : DEFAULT_ROUTINE_BLOCKS;
  });

  useEffect(() => {
    saveRoutineBlocks(routineBlocks);
  }, [routineBlocks]);

  // Routine Sheet Modal States
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [addBlockVisible, setAddBlockVisible] = useState(false);
  const [editBlockVisible, setEditBlockVisible] = useState(false);
  const [selectedBlockForEdit, setSelectedBlockForEdit] = useState<RoutineBlock | null>(null);

  // Drag and Drop State
  const floorPlanRef = useRef<View>(null);
  const floorRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const [dragGhost, setDragGhost] = useState<{ item: SpriteItemDef; x: number; y: number } | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  // Measure floor plan canvas for drop detection
  const measureFloorPlan = useCallback(() => {
    (floorPlanRef.current as any)?.measureInWindow((x: number, y: number, width: number, height: number) => {
      if (width > 0 && height > 0) {
        floorRectRef.current = { left: x, top: y, width, height };
      }
    });
  }, []);

  const onFloorLayout = useCallback((e: LayoutChangeEvent) => {
    measureFloorPlan();
  }, [measureFloorPlan]);

  // ── Avatar Simulation & Waypoint Engine ────────────────────────────────────
  const [avatarState, setAvatarState] = useState<AvatarSimulationState>({
    currentX: 0.25,
    currentY: 0.25,
    facingLeft: false,
    isWalking: false,
    isSleeping: false,
    currentRoomId: 'living',
    targetRoomId: 'living',
    currentActivity: 'Standing in living room',
  });

  const waypointQueue = useRef<Point[]>([]);
  const currentTargetPos = useRef<Point>({ x: 0.25, y: 0.25 });

  // Main simulation tick timer (60fps animation / interval)
  useEffect(() => {
    let lastTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      // Advance simulated clock
      const realSecPerHour = SIM_SPEED_MULTIPLIERS[simSpeed].realSecPerHour;
      const simMinutesDelta = (deltaSec / realSecPerHour) * 60;

      setSimulatedMinutes((prev) => {
        const nextMin = (prev + simMinutesDelta) % 1440;
        return nextMin;
      });

      // Advance avatar movement along waypoints if any
      if (waypointQueue.current.length > 0) {
        const nextTarget = waypointQueue.current[0];
        setAvatarState((prev) => {
          const dx = nextTarget.x - prev.currentX;
          const dy = nextTarget.y - prev.currentY;
          const distance = Math.hypot(dx, dy);

          const step = 0.28 * deltaSec; // Walking speed

          if (distance <= step) {
            // Reached this waypoint
            waypointQueue.current.shift();
            const reachedFinal = waypointQueue.current.length === 0;

            return {
              ...prev,
              currentX: nextTarget.x,
              currentY: nextTarget.y,
              isWalking: !reachedFinal,
              facingLeft: dx < 0 ? true : dx > 0 ? false : prev.facingLeft,
            };
          } else {
            // Move toward waypoint
            const moveRatio = step / distance;
            return {
              ...prev,
              currentX: prev.currentX + dx * moveRatio,
              currentY: prev.currentY + dy * moveRatio,
              isWalking: true,
              facingLeft: dx < 0 ? true : dx > 0 ? false : prev.facingLeft,
            };
          }
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [simSpeed]);

  // Update routine activities and waypoints when routine changes
  const currentRoutine = useMemo(() => {
    const timeStr = formatTimeMinutes(simulatedMinutes);
    const active = getActiveBlockAtTime(timeStr, routineBlocks);
    if (active) {
      return {
        id: active.id,
        name: active.name,
        startTime: active.startTime,
        endTime: active.endTime,
        targetRoomType: (active.roomId === 'away' ? 'living' : (active.roomId as any)) || 'living',
        isSleeping: active.iconType === 'sleep',
        isAway: active.isAway,
        activeApplianceTypes: active.applianceIds,
      };
    }
    return getCurrentRoutine(simulatedMinutes, DEFAULT_ROUTINE);
  }, [simulatedMinutes, routineBlocks]);

  useEffect(() => {
    // Check if target room exists in user's rooms
    const targetRoom =
      rooms.find((r) => r.type === currentRoutine.targetRoomType) || rooms[0];

    // Find destination inside target room
    let destPoint: Point;
    let isSleeping = false;

    if (currentRoutine.isSleeping && targetRoom.type === 'bedroom') {
      // Look for a placed bed
      const bedItem = items.find(
        (i) => i.category === 'Furniture' && (i.type === 'bed' || i.spriteKey === 'bed')
      );
      if (bedItem) {
        destPoint = { x: bedItem.posX, y: bedItem.posY };
      } else {
        destPoint = getRoomCenter(targetRoom);
      }
      isSleeping = true;
    } else {
      destPoint = getRoomCenter(targetRoom);
      isSleeping = false;
    }

    // If destination differs significantly, generate new waypoints
    if (
      Math.hypot(destPoint.x - currentTargetPos.current.x, destPoint.y - currentTargetPos.current.y) >
      0.05
    ) {
      currentTargetPos.current = destPoint;
      const waypoints = buildWaypoints(
        { x: avatarState.currentX, y: avatarState.currentY },
        avatarState.currentRoomId,
        destPoint,
        targetRoom.id
      );
      waypointQueue.current = waypoints;

      setAvatarState((prev) => ({
        ...prev,
        targetRoomId: targetRoom.id,
        currentActivity: currentRoutine.name,
        isSleeping,
      }));
    } else {
      setAvatarState((prev) => ({
        ...prev,
        currentRoomId: targetRoom.id,
        isSleeping,
      }));
    }
  }, [
    currentRoutine,
    rooms,
    items,
    avatarState.currentX,
    avatarState.currentY,
    avatarState.currentRoomId,
  ]);

  // ── Determine which appliances and lights are ON ───────────────────────────
  const { activeApplianceIds, activeRoomLightIds } = useMemo(() => {
    const activeAppIds: string[] = [];
    const activeLightRoomIds: string[] = [];

    const currentRoom = rooms.find((r) => r.id === avatarState.targetRoomId) || rooms[0];

    for (const item of items) {
      if (item.category !== 'Appliances') continue;

      let isOn = false;

      if (item.alwaysOn || item.isOn) {
        isOn = true;
      } else if (item.roomId === currentRoom.id) {
        // If avatar is in this room and current routine uses this appliance type
        if (
          currentRoutine.activeApplianceTypes &&
          currentRoutine.activeApplianceTypes.includes(item.type)
        ) {
          isOn = true;
        }
      }

      if (isOn) {
        activeAppIds.push(item.id);
        if (item.type === 'lights' || item.type === 'light_bulb') {
          if (!activeLightRoomIds.includes(item.roomId)) {
            activeLightRoomIds.push(item.roomId);
          }
        }
      }
    }

    return { activeApplianceIds: activeAppIds, activeRoomLightIds: activeLightRoomIds };
  }, [items, rooms, avatarState.targetRoomId, currentRoutine]);

  // ── Calculate Live Bill & Usage Badge ─────────────────────────────────────
  const { totalKwh, monthlyBillRm, usageBadge } = useMemo(() => {
    return computeSimulationBill(items);
  }, [items]);

  const simulatedTimeStr = useMemo(() => {
    return formatTimeMinutes(simulatedMinutes);
  }, [simulatedMinutes]);

  // ── Speed Cycling (1x -> 2x -> 4x -> 1x) ──────────────────────────────────
  const handleCycleSpeed = () => {
    const nextSpeed: SimSpeed = simSpeed === 1 ? 2 : simSpeed === 2 ? 4 : 1;
    setSimSpeed(nextSpeed);
    showToast(`Simulation speed: ${nextSpeed}x`, 'info');
  };

  // ── Room Naming Interactions ───────────────────────────────────────────────
  const handleRoomPress = (room: StoredRoom) => {
    if (selectedPendingItem) {
      // Tap-to-place fallback
      handleDropItemAtRoom(selectedPendingItem, room, 0.5, 0.5);
      setSelectedPendingItem(null);
      return;
    }

    setNamingRoom(room);
    setNamingModalVisible(true);
  };

  const handleSaveRoomName = (roomId: string, name: string, type: StoredRoom['type']) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, name, type } : r))
    );
    showToast(`Saved room "${name}"`, 'success');
  };

  // ── Drag & Drop Logic ─────────────────────────────────────────────────────
  const getRoomAtNormalizedPos = (rx: number, ry: number): { room: StoredRoom; localX: number; localY: number } | null => {
    if (rx < 0 || rx > 1 || ry < 0 || ry > 1) return null;

    let targetType: StoredRoom['type'] | null = null;
    let localX = 0.5;
    let localY = 0.5;

    if (rx <= 0.49 && ry <= 0.49) {
      targetType = 'living';
      localX = rx / 0.49;
      localY = ry / 0.49;
    } else if (rx >= 0.51 && ry <= 0.49) {
      targetType = 'kitchen';
      localX = (rx - 0.51) / 0.49;
      localY = ry / 0.49;
    } else if (rx <= 0.49 && ry >= 0.51) {
      targetType = 'bedroom';
      localX = rx / 0.49;
      localY = (ry - 0.51) / 0.49;
    } else if (rx >= 0.51 && ry >= 0.51) {
      targetType = 'bathroom';
      localX = (rx - 0.51) / 0.49;
      localY = (ry - 0.51) / 0.49;
    }

    if (!targetType) return null;

    const matchedRoom = rooms.find((r) => r.type === targetType);
    if (!matchedRoom) return null;

    return {
      room: matchedRoom,
      localX: Math.max(0.15, Math.min(0.85, localX)),
      localY: Math.max(0.18, Math.min(0.82, localY)),
    };
  };

  const handleDropItemAtRoom = (
    itemDef: SpriteItemDef,
    targetRoom: StoredRoom,
    normX: number,
    normY: number
  ) => {
    // Calculate global position on floor plan
    const halfW = 0.48;
    const halfH = 0.48;
    let globalX = 0.25;
    let globalY = 0.25;

    if (targetRoom.type === 'living') {
      globalX = normX * halfW;
      globalY = normY * halfH;
    } else if (targetRoom.type === 'kitchen') {
      globalX = 0.52 + normX * halfW;
      globalY = normY * halfH;
    } else if (targetRoom.type === 'bedroom') {
      globalX = normX * halfW;
      globalY = 0.52 + normY * halfH;
    } else if (targetRoom.type === 'bathroom') {
      globalX = 0.52 + normX * halfW;
      globalY = 0.52 + normY * halfH;
    }

    if (itemDef.category === 'Furniture') {
      // Place furniture immediately
      const newFurniture: StoredPlacedItem = {
        id: `furn_${Date.now()}`,
        category: 'Furniture',
        type: itemDef.key,
        spriteKey: itemDef.key,
        name: itemDef.label,
        roomId: targetRoom.id,
        posX: globalX,
        posY: globalY,
      };
      setItems((prev) => [...prev, newFurniture]);
      showToast(`Placed ${itemDef.label}`, 'success');
    } else {
      // Create pending appliance and open details sheet
      const pendingApp: StoredPlacedItem = {
        id: `pending_${Date.now()}`,
        category: 'Appliances',
        type: itemDef.key,
        spriteKey: itemDef.key,
        name: itemDef.fullName,
        roomId: targetRoom.id,
        posX: globalX,
        posY: globalY,
        brand: '',
        wattage: itemDef.defaultWattage,
        stars: 3,
        hoursPerDay: itemDef.defaultHours,
        alwaysOn: itemDef.alwaysOn || false,
        isOn: false,
      };
      setItems((prev) => [...prev, pendingApp]);
      setEditingAppliance(pendingApp);
      setApplianceSheetVisible(true);
    }
  };

  // Pointer drag events for Web & Touch
  const handleItemPointerDown = (itemDef: SpriteItemDef, clientX: number, clientY: number) => {
    measureFloorPlan();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setDragGhost({ item: itemDef, x: clientX, y: clientY });

      const onPointerMove = (e: PointerEvent) => {
        setDragGhost({ item: itemDef, x: e.clientX, y: e.clientY });

        if (floorRectRef.current) {
          const { left, top, width, height } = floorRectRef.current;
          const rx = (e.clientX - left) / width;
          const ry = (e.clientY - top) / height;
          const match = getRoomAtNormalizedPos(rx, ry);
          setHoveredRoomId(match ? match.room.id : null);
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        setDragGhost(null);
        setHoveredRoomId(null);

        if (floorRectRef.current) {
          const { left, top, width, height } = floorRectRef.current;
          const rx = (e.clientX - left) / width;
          const ry = (e.clientY - top) / height;
          const match = getRoomAtNormalizedPos(rx, ry);

          if (match) {
            handleDropItemAtRoom(itemDef, match.room, match.localX, match.localY);
          } else {
            showToast('Drop inside a room to place item', 'info');
          }
        }
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
  };

  // ── Placed Items Interactions ─────────────────────────────────────────────
  const handleSelectItem = (item: StoredPlacedItem) => {
    setSelectedItemId(item.id);

    if (isEditMode) {
      if (item.category === 'Appliances') {
        setEditingAppliance(item);
        setApplianceSheetVisible(true);
      } else {
        setEditingFurniture(item);
        setFurnitureSheetVisible(true);
      }
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setSelectedItemId(null);
    showToast('Item removed', 'info');
  };

  const handleMoveItemEnd = (itemId: string, newNormX: number, newNormY: number) => {
    const match = getRoomAtNormalizedPos(newNormX, newNormY);
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              posX: newNormX,
              posY: newNormY,
              roomId: match ? match.room.id : i.roomId,
            }
          : i
      )
    );
  };

  const handleSaveAppliance = (savedApp: StoredPlacedItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === editingAppliance?.id ? savedApp : i))
    );
    setApplianceSheetVisible(false);
    setEditingAppliance(null);
    showToast(`Saved ${savedApp.name}`, 'success');
  };

  const handleCancelApplianceSheet = () => {
    // If cancelling a just-dropped pending appliance, remove it
    if (editingAppliance && editingAppliance.id.startsWith('pending_')) {
      setItems((prev) => prev.filter((i) => i.id !== editingAppliance.id));
    }
    setApplianceSheetVisible(false);
    setEditingAppliance(null);
  };

  const handleSaveFurniture = (savedFurn: StoredPlacedItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === editingFurniture?.id ? savedFurn : i))
    );
    setFurnitureSheetVisible(false);
    setEditingFurniture(null);
    showToast(`Saved ${savedFurn.name}`, 'success');
  };

  // Convert stored items to Appliance type for BillModal
  const appliancesForBillModal: Appliance[] = useMemo(() => {
    return items
      .filter((i) => i.category === 'Appliances')
      .map((i) => ({
        id: i.id,
        name: i.name,
        type: i.type as any,
        brand: i.brand || 'Standard',
        wattage: i.wattage || 100,
        stars: i.stars || 3,
        roomId: i.roomId,
        posX: i.posX,
        posY: i.posY,
        alwaysOn: i.alwaysOn || false,
        color: '#D4A373',
        spriteKey: i.spriteKey,
        isOn: i.isOn,
      }));
  }, [items]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Mobile Shell Container (~380px wide) */}
      <View style={styles.mobileShell}>
        {/* Fixed Non-Scrolling Layout Container */}
        <View style={styles.mainContainer}>
          {/* ── Top Section: Compact Estimated Bill Card, Round Buttons & Edit/Done ── */}
          <BillCard
            monthlyBillRm={monthlyBillRm}
            usageBadge={usageBadge}
            simulatedTimeStr={simulatedTimeStr}
            simSpeed={simSpeed}
            isEditMode={isEditMode}
            onToggleEdit={() => {
              setIsEditMode((prev) => !prev);
              setSelectedItemId(null);
              setSelectedPendingItem(null);
            }}
            onCycleSpeed={handleCycleSpeed}
            onPressBillCard={() => setBillModalVisible(true)}
            onPressBell={() => router.push('/notifications')}
            onPressCalendar={() => setTimelineVisible(true)}
          />

          {/* ── Middle Section: Strictly FIXED Floor Plan Card (No Shrinking) ── */}
          <View style={styles.floorPlanArea}>
            <FloorPlan
              rooms={rooms}
              items={items}
              avatarState={avatarState}
              avatarVariant={avatarVariant}
              activeApplianceIds={activeApplianceIds}
              activeRoomLightIds={activeRoomLightIds}
              isEditMode={isEditMode}
              selectedItemId={selectedItemId}
              dragGhost={dragGhost}
              hoveredRoomId={hoveredRoomId}
              onRoomPress={handleRoomPress}
              onSelectItem={handleSelectItem}
              onDeleteItem={handleDeleteItem}
              onMoveItemEnd={handleMoveItemEnd}
              floorPlanRef={floorPlanRef}
              onLayout={onFloorLayout}
            />
          </View>
        </View>

        {/* ── Edit Mode Tray (Absolute Overlay covering bottom of Floor Plan) ── */}
        {isEditMode && (
          <View style={styles.editTrayOverlay}>
            <EditSheet
              visible={isEditMode}
              onItemPointerDown={handleItemPointerDown}
              onItemTap={(item) => {
                setSelectedPendingItem(item);
                showToast(`Tap a room to place ${item.label}`, 'info');
              }}
              selectedPendingKey={selectedPendingItem?.key}
            />
          </View>
        )}

        {/* ── Drag Ghost following pointer across the screen ─────────────── */}
        {dragGhost && (
          <View
            pointerEvents="none"
            style={[
              styles.dragGhostRoot,
              {
                left: dragGhost.x - 26,
                top: dragGhost.y - 26,
              },
            ]}
          >
            <Sprite type={dragGhost.item.key} size={52} />
          </View>
        )}

        {/* ── Appliance Details Bottom Sheet ───────────────────────────────── */}
        <ApplianceDetailsSheet
          visible={applianceSheetVisible}
          item={editingAppliance}
          rooms={rooms}
          onSave={handleSaveAppliance}
          onCancel={handleCancelApplianceSheet}
          onDelete={handleDeleteItem}
        />

        {/* ── Furniture Details Bottom Sheet ───────────────────────────────── */}
        <FurnitureDetailsSheet
          visible={furnitureSheetVisible}
          item={editingFurniture}
          rooms={rooms}
          onSave={handleSaveFurniture}
          onCancel={() => {
            setFurnitureSheetVisible(false);
            setEditingFurniture(null);
          }}
          onDelete={handleDeleteItem}
        />

        {/* ── Room Naming Modal ────────────────────────────────────────────── */}
        <RoomNamingModal
          visible={namingModalVisible}
          room={namingRoom}
          onSave={handleSaveRoomName}
          onClose={() => {
            setNamingModalVisible(false);
            setNamingRoom(null);
          }}
        />

        {/* ── Bill Breakdown Modal ─────────────────────────────────────────── */}
        <BillModal
          visible={billModalVisible}
          onClose={() => setBillModalVisible(false)}
          appliances={appliancesForBillModal}
          totalKwh={totalKwh}
          rooms={rooms as any}
          onAddAppliances={() => {
            setBillModalVisible(false);
            setIsEditMode(true);
          }}
        />

        {/* ── My Day Routine Timeline Sheet ───────────────────────────────── */}
        <MyDayTimelineSheet
          visible={timelineVisible}
          onClose={() => setTimelineVisible(false)}
          blocks={routineBlocks}
          rooms={rooms}
          onAddBlockPress={() => {
            setAddBlockVisible(true);
          }}
          onEditBlockPress={(block) => {
            setSelectedBlockForEdit(block);
            setEditBlockVisible(true);
          }}
          onSaveSchedule={() => {
            saveRoutineBlocks(routineBlocks);
            showToast('Schedule saved', 'success');
          }}
        />

        {/* ── Add Routine Block Sheet ─────────────────────────────────────── */}
        <AddBlockSheet
          visible={addBlockVisible}
          onClose={() => setAddBlockVisible(false)}
          rooms={rooms}
          appliances={appliancesForBillModal}
          existingBlocks={routineBlocks}
          onSaveBlock={(newBlock) => {
            const blockWithId: RoutineBlock = {
              ...newBlock,
              id: `block_${Date.now()}`,
            };
            setRoutineBlocks((prev) => [...prev, blockWithId]);
            showToast(`Added ${newBlock.name}`, 'success');
          }}
        />

        {/* ── Edit Routine Block Sheet ────────────────────────────────────── */}
        <EditBlockSheet
          visible={editBlockVisible}
          onClose={() => {
            setEditBlockVisible(false);
            setSelectedBlockForEdit(null);
          }}
          block={selectedBlockForEdit}
          rooms={rooms}
          appliances={appliancesForBillModal}
          existingBlocks={routineBlocks}
          onUpdateBlock={(updated) => {
            setRoutineBlocks((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            );
            showToast(`Updated ${updated.name}`, 'success');
          }}
          onRemoveBlock={(blockId) => {
            setRoutineBlocks((prev) => prev.filter((b) => b.id !== blockId));
            showToast('Time block removed', 'info');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EDF1EB', // Soft sage/beige background from screenshot
  },
  mobileShell: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  floorPlanArea: {
    width: '100%',
    marginTop: 4,
  },
  editTrayOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  dragGhostRoot: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    width: 52,
    height: 52,
    opacity: 0.88,
    zIndex: 9999,
  },
});
