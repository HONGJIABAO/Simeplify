/**
 * SIM-01, SIM-02, SIM-03, SIM-04, SIM-05, SIM-06, SIM-07
 * Dev gallery for Stage 6, Stage 7 & Stage 8 Simulator states.
 * Accessible at /_dev/simulator
 * Each state can be opened directly for review.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  MOCK_APPLIANCES,
  MOCK_ROOMS,
  MOCK_MONTHLY_KWH,
  MOCK_SIMULATOR_ITEMS,
  MOCK_SIMULATOR_ITEMS_ALL,
  MOCK_SIMULATOR_ROOMS,
  Appliance,
} from '@/lib/mockData';
import { createDefaultRooms } from '@/features/simulator/logic/roomData';
import { calcBillFromKwh } from '@/features/simulator/logic/billCalc';
import { useBillAnimation } from '@/features/simulator/hooks/useBillAnimation';
import { FloorPlanCanvas } from '@/features/simulator/components/FloorPlanCanvas';
import { BillModal } from '@/features/simulator/components/BillModal';
import { FastForwardPanel } from '@/features/simulator/components/FastForwardPanel';
import { FastForwardPeriod } from '@/features/simulator/logic/fastForward';
import { EditTray } from '@/features/simulator/components/EditTray';
import { ApplianceDetailsSheet } from '@/features/simulator/components/ApplianceDetailsSheet';
import { FloorPlan } from '@/features/simulator/components/FloorPlan';
import { EditSheet } from '@/features/simulator/components/EditSheet';
import { RoomNamingModal } from '@/features/simulator/components/RoomNamingModal';
import { AvatarSimulationState, getRoomCenter } from '@/features/simulator/logic/SimulationEngine';
import { findFloorWalkPath } from '@/features/simulator/logic/walkGraph';
import { FloorNumber } from '@/features/simulator/logic/roomLayout';
import { SuggestionArea } from '@/features/simulator/components/SuggestionArea';
import { getSwapSuggestions, SwapSuggestion } from '@/features/simulator/logic/swapLogic';
import { ResidentAvatar } from '@/features/simulator/components/ResidentAvatar';
import { AvatarPose, resolveAvatarPlacement } from '@/features/simulator/logic/avatarPlace';
import {
  RoutineBlock,
  DEFAULT_ROUTINE_BLOCKS,
} from '@/features/simulator/logic/myDayLogic';
import { QuickSetupSheet } from '@/features/simulator/components/QuickSetupSheet';
import { MyDayTimelineSheet } from '@/features/simulator/components/MyDayTimelineSheet';
import { AddBlockSheet } from '@/features/simulator/components/AddBlockSheet';
import { EditBlockSheet } from '@/features/simulator/components/EditBlockSheet';
import { TidyUpSheet } from '@/features/simulator/components/TidyUpSheet';
import { AIAnalysisReportModal } from '@/features/simulator/components/AIAnalysisReportModal';
import { ApplianceSuggestionSheet } from '@/features/simulator/components/ApplianceSuggestionSheet';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { SKIPPED_ITEM_TYPES } from '@/features/simulator/logic/mockHomeData';
import { WeekReelCaption, WeekReelSummary } from '@/features/simulator/components/WeekReelStatus';
import { buildWeekReel } from '@/features/simulator/logic/weekReel';

type DemoState =
  // Stage 6
  | 'empty-plan'
  | 'plan-with-appliances'
  | 'bill-modal-filled'
  | 'bill-modal-empty'
  | 'loading-skeleton'
  // Stage 7 Edit Mode
  | 'edit-mode-tray'
  | 'drag-onto-room'
  | 'details-sheet'
  // Stage 7 Suggestions
  | 'suggestion-idle'
  | 'suggestion-first-time'
  | 'suggestion-swap'
  | 'suggestion-solar'
  // Stage 7 Fast-Forward
  | 'fast-forward-closed'
  | 'fast-forward-open-1m'
  | 'fast-forward-open-6m'
  | 'fast-forward-open-1y'
  | 'fast-forward-playing'
  | 'fast-forward-stopped'
  | 'fast-forward-reduced-motion'
  // Stage 8 My Day & Avatar
  | 'my-day-quick-setup'
  | 'my-day-timeline'
  | 'my-day-add-block-valid'
  | 'my-day-add-block-error'
  | 'my-day-edit-block'
  | 'my-day-away-note'
  | 'avatar-poses'
  | 'home-look-day'
  | 'home-look-evening'
  | 'home-look-away'
  | 'two-floor-plan'
  | 'floor-two-dark'
  | 'resident-other-floor'
  | 'room-setup-sheet'
  | 'workplace-details'
  | 'edit-tray-collapsed'
  | 'edit-tray-dragging'
  | 'tray-first-screen'
  | 'tray-scrolled-end'
  | 'tidy-up-confirm'
  | 'tidy-up-before'
  | 'tidy-up-after'
  // Floor Plan V2
  | 'stair-filled-floor-1'
  | 'stair-filled-floor-2'
  | 'square-plan-default'
  | 'square-plan-shrunk'
  | 'glow-on'
  | 'glow-off'
  | 'room-tags-default'
  | 'room-tags-hovered'
  | 'room-tags-edit-mode'
  | 'floor-items-2-2x'
  | 'item-label-tapped'
  | 'edit-selected-drag'
  // Furnished Mock States
  | 'home-furnished-floor-1'
  | 'home-furnished-floor-2'
  | 'home-furnished-floor-1-debug'
  | 'home-furnished-floor-2-debug'
  | 'floor-2-setup-all'
  | 'living-room-layout'
  | 'kitchen-layout'
  | 'bathroom-layout'
  | 'bedroom-layout'
  | 'workplace-room-layout'
  | 'avatar-at-sofa'
  | 'avatar-at-shower'
  | 'avatar-at-workplace'
  | 'floor-follow-transition'
  | 'floor-follow-looked-away'
  | 'floor-follow-edit-mode'
  | 'doorway-route-preview'
  | 'unreachable-room-route'
  // Fast-Forward Week Reel (Part 6)
  | 'week-reel-caption-shower'
  | 'week-reel-caption-away'
  | 'week-reel-playing'
  | 'week-reel-reduced-summary'
  | 'post-simulation-ai-report'
  | 'post-simulation-solar-suggestion'
  | 'solar-applied';

const STATE_GROUPS = [
  {
    title: 'Furnished Home Floor Plans',
    items: [
      { id: 'living-room-layout' as DemoState, label: 'Living room layout' },
      { id: 'kitchen-layout' as DemoState, label: 'Kitchen layout' },
      { id: 'bathroom-layout' as DemoState, label: 'Bathroom layout' },
      { id: 'bedroom-layout' as DemoState, label: 'Bedroom layout' },
      { id: 'workplace-room-layout' as DemoState, label: 'Workplace room layout' },
      { id: 'avatar-at-sofa' as DemoState, label: 'Avatar at sofa, TV lit' },
      { id: 'avatar-at-shower' as DemoState, label: 'Avatar at shower' },
      { id: 'avatar-at-workplace' as DemoState, label: 'Avatar at Workplace' },
      { id: 'home-furnished-floor-1' as DemoState, label: 'Home furnished, floor 1' },
      { id: 'home-furnished-floor-2' as DemoState, label: 'Home furnished, floor 2' },
      { id: 'home-furnished-floor-1-debug' as DemoState, label: 'Home furnished, floor 1 — layout overlay' },
      { id: 'home-furnished-floor-2-debug' as DemoState, label: 'Home furnished, floor 2 — layout overlay' },
      { id: 'floor-2-setup-all' as DemoState, label: 'Floor 2 with all rooms set up' },
    ],
  },
  {
    title: 'Floor Plan V2: Stair, Square, Glow, Room Tags',
    items: [
      { id: 'stair-filled-floor-1' as DemoState, label: 'stair filled, floor 1' },
      { id: 'stair-filled-floor-2' as DemoState, label: 'stair filled, floor 2' },
      { id: 'square-plan-default' as DemoState, label: 'Square plan — default (1:1)' },
      { id: 'square-plan-shrunk' as DemoState, label: 'Square plan — shrunk (Edit mode)' },
      { id: 'glow-on' as DemoState, label: 'Lit appliance — warm glow around picture' },
      { id: 'glow-off' as DemoState, label: 'Off appliance — 40% opacity, no glow' },
      { id: 'room-tags-default' as DemoState, label: 'Room tags — hidden by default' },
      { id: 'room-tags-hovered' as DemoState, label: 'Room tags — hovered / long press' },
      { id: 'room-tags-edit-mode' as DemoState, label: 'Room tags — Edit mode visible' },
      { id: 'floor-items-2-2x' as DemoState, label: 'All floor items — uniform 2.2×' },
      { id: 'item-label-tapped' as DemoState, label: 'Normal mode — tapped name + watts' },
      { id: 'edit-selected-drag' as DemoState, label: 'Edit mode — tap once, then drag' },
    ],
  },
  {
    title: 'Stage 6/7: Two-floor plan states (SIM-05, SIM-06)',
    items: [
      { id: 'two-floor-plan' as DemoState, label: '1F unequal rooms + stairs' },
      { id: 'floor-two-dark' as DemoState, label: '2F with two dark rooms' },
      { id: 'resident-other-floor' as DemoState, label: 'Resident is on the other floor' },
      { id: 'floor-follow-transition' as DemoState, label: 'Floor follows resident after stair crossing' },
      { id: 'floor-follow-looked-away' as DemoState, label: 'User looked away — resident floor pill' },
      { id: 'floor-follow-edit-mode' as DemoState, label: 'Edit mode — floor follow disabled' },
      { id: 'doorway-route-preview' as DemoState, label: 'Avatar doorway route preview' },
      { id: 'unreachable-room-route' as DemoState, label: 'No route — nearest reachable waypoint' },
      { id: 'room-setup-sheet' as DemoState, label: 'Dark-room setup sheet' },
      { id: 'workplace-details' as DemoState, label: 'Workplace details (no star rating)' },
      { id: 'edit-tray-collapsed' as DemoState, label: 'Collapsed item tray' },
      { id: 'edit-tray-dragging' as DemoState, label: 'Item tray while dragging (30%)' },
      { id: 'tray-first-screen' as DemoState, label: 'Tray — first screen' },
      { id: 'tray-scrolled-end' as DemoState, label: 'Tray — scrolled to end' },
      { id: 'tidy-up-confirm' as DemoState, label: 'Tidy up — confirm' },
      { id: 'tidy-up-before' as DemoState, label: 'Tidy up — before' },
      { id: 'tidy-up-after' as DemoState, label: 'Tidy up — after' },
    ],
  },
  {
    title: 'Stage 6: Floor Plan & Bill Modal',
    items: [
      { id: 'empty-plan' as DemoState, label: 'Floor plan — empty' },
      { id: 'plan-with-appliances' as DemoState, label: 'Floor plan — with appliances' },
      { id: 'bill-modal-filled' as DemoState, label: 'Bill modal — filled' },
      { id: 'bill-modal-empty' as DemoState, label: 'Bill modal — empty' },
      { id: 'loading-skeleton' as DemoState, label: 'Loading skeleton' },
    ],
  },
  {
    title: 'Stage 7: Edit Mode & Details Sheet (SIM-05)',
    items: [
      { id: 'edit-mode-tray' as DemoState, label: 'Edit mode tray (Appliances & Furniture)' },
      { id: 'drag-onto-room' as DemoState, label: 'Drag / place onto room' },
      { id: 'details-sheet' as DemoState, label: 'Appliance details sheet (with stars & Not sure)' },
    ],
  },
  {
    title: 'Stage 7: Suggestion Area (SIM-02, SIM-03)',
    items: [
      { id: 'suggestion-idle' as DemoState, label: 'Suggestion: idle row (My day button)' },
      { id: 'suggestion-first-time' as DemoState, label: 'Suggestion: first-time setup prompt' },
      { id: 'suggestion-swap' as DemoState, label: 'Suggestion: Swap & Compare (Try / Undo)' },
      { id: 'suggestion-solar' as DemoState, label: 'Suggestion: Solar panel (bill ≥ RM 500)' },
    ],
  },
  {
    title: 'Stage 7: Fast-Forward (SIM-04)',
    items: [
      { id: 'fast-forward-closed' as DemoState, label: 'Fast-forward: closed' },
      { id: 'fast-forward-open-1m' as DemoState, label: 'Fast-forward: open (1M)' },
      { id: 'fast-forward-open-6m' as DemoState, label: 'Fast-forward: open (1W)' },
      { id: 'fast-forward-open-1y' as DemoState, label: 'Fast-forward: open (1Y)' },
      { id: 'fast-forward-playing' as DemoState, label: 'Fast-forward: playing animation' },
      { id: 'fast-forward-stopped' as DemoState, label: 'Fast-forward: stopped on tap/drag' },
      { id: 'fast-forward-reduced-motion' as DemoState, label: 'Fast-forward: reduced motion' },
    ],
  },
  {
    title: 'Stage 8: My Day (SIM-07)',
    items: [
      { id: 'my-day-quick-setup' as DemoState, label: 'Quick setup (4 cards with bill changes)' },
      { id: 'my-day-timeline' as DemoState, label: 'Timeline sheet (24-hr strip & routine blocks)' },
      { id: 'my-day-add-block-valid' as DemoState, label: 'Add block sheet — valid state' },
      { id: 'my-day-add-block-error' as DemoState, label: 'Add block sheet — validation error state' },
      { id: 'my-day-edit-block' as DemoState, label: 'Edit block sheet — with shower stepper' },
      { id: 'my-day-away-note' as DemoState, label: 'Away-time locked block & note' },
    ],
  },
  {
    title: 'Stage 8: Avatar & Home Looks (SIM-06)',
    items: [
      { id: 'avatar-poses' as DemoState, label: 'Resident avatar poses (stand, walk, sit, lie, cook, shower)' },
      { id: 'home-look-day' as DemoState, label: 'Home look: daytime (cream backdrop)' },
      { id: 'home-look-evening' as DemoState, label: 'Home look: evening (lights on, warm gray backdrop)' },
      { id: 'home-look-away' as DemoState, label: 'Home look: away (energy saving overlay & out pill)' },
    ],
  },
  {
    title: 'Fast-Forward Week Reel (Part 6)',
    items: [
      { id: 'week-reel-caption-shower' as DemoState, label: 'Week reel caption (Mon Shower)' },
      { id: 'week-reel-caption-away' as DemoState, label: 'Week reel caption (Tue Away)' },
      { id: 'week-reel-playing' as DemoState, label: 'Week reel playing (Floor 1)' },
      { id: 'week-reel-reduced-summary' as DemoState, label: 'Week reel reduced motion summary' },
      { id: 'post-simulation-ai-report' as DemoState, label: 'Post-simulation AI report' },
      { id: 'post-simulation-solar-suggestion' as DemoState, label: 'Post-report solar suggestion' },
      { id: 'solar-applied' as DemoState, label: 'Floor plan with solar active' },
    ],
  },
];

function BillHero({ kWh }: { kWh: number }) {
  const text = useBillAnimation(Math.round(calcBillFromKwh(kWh)));
  return <Text style={galleryStyles.heroText}>{text}</Text>;
}

function TwoFloorPlanPreview({
  initialFloor = 1,
  residentFloor = 1,
  isEditMode = false,
  activeApplianceIds,
  hoveredRoomId = null,
  containerHeight,
  setupAllRooms = false,
  debugLayout = false,
  avatarScenario,
  routeScenario,
  messy = false,
  isAvatarAway = false,
  initialSelectedItemId = null,
  solarApplied = false,
}: {
  initialFloor?: FloorNumber;
  residentFloor?: FloorNumber;
  isEditMode?: boolean;
  activeApplianceIds?: string[];
  hoveredRoomId?: string | null;
  containerHeight?: number;
  setupAllRooms?: boolean;
  debugLayout?: boolean;
  avatarScenario?: 'sofa' | 'shower' | 'workplace';
  routeScenario?: 'doorway' | 'unreachable';
  messy?: boolean;
  isAvatarAway?: boolean;
  initialSelectedItemId?: string | null;
  solarApplied?: boolean;
}) {
  const [floor, setFloor] = useState<FloorNumber>(initialFloor);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialSelectedItemId);
  const floorRef = useRef<View>(null);
  const rooms = setupAllRooms ? createDefaultRooms(true) : MOCK_SIMULATOR_ROOMS;
  const baseItems = setupAllRooms ? MOCK_SIMULATOR_ITEMS_ALL : MOCK_SIMULATOR_ITEMS;
  const initialItems = messy ? baseItems.map((item, index) => item.roomId === 'f1-A'
    ? { ...item, posX: 0.18 + (index % 3) * 0.025, posY: 0.34 + (index % 2) * 0.02 }
    : item) : baseItems;
  const [items, setItems] = useState(initialItems);
  useEffect(() => {
    if (isEditMode || !selectedItemId) return;
    const timer = setTimeout(() => setSelectedItemId(null), 3000);
    return () => clearTimeout(timer);
  }, [isEditMode, selectedItemId]);
  const scenarioRoomId = avatarScenario === 'sofa' ? 'f1-A' : avatarScenario === 'shower' ? 'f1-C' : avatarScenario === 'workplace' ? 'f2-B' : null;
  const scenarioRoom = rooms.find((room) => room.id === scenarioRoomId);
  const scenarioItems = items.filter((item) => item.roomId === scenarioRoomId);
  const scenarioBlock = avatarScenario === 'sofa'
    ? { name: 'Watching TV', iconType: 'custom' as const, applianceIds: ['f1-tv-living', 'f1-lamp-living', 'f1-ac-living'], avatarWalks: true }
    : avatarScenario === 'shower'
      ? { name: 'Morning Shower', iconType: 'shower' as const, applianceIds: ['f1-shower-bath'], avatarWalks: true }
      : { name: 'Working', iconType: 'work' as const, applianceIds: ['f2-workplace-study'], avatarWalks: true };
  const scenarioPlacement = scenarioRoom ? resolveAvatarPlacement(scenarioBlock, scenarioRoom, scenarioItems) : null;
  const routeStartRoom = rooms.find((room) => room.id === 'f1-A')!;
  const routeEndRoom = rooms.find((room) => room.id === (routeScenario === 'unreachable' ? 'f1-D' : 'f1-C'))!;
  const routeResult = routeScenario ? findFloorWalkPath({
    floor: 1, rooms, start: getRoomCenter(routeStartRoom), startRoomId: routeStartRoom.id,
    end: getRoomCenter(routeEndRoom), endRoomId: routeEndRoom.id,
  }) : null;
  const routePosition = routeResult?.points[routeResult.points.length - 1];
  const shownFloor = routeScenario ? 1 : scenarioRoom?.floor ?? residentFloor;
  const avatarState: AvatarSimulationState = {
    currentX: isAvatarAway ? 0.29 : (routePosition?.x ?? scenarioPlacement?.target.x ?? (residentFloor === 1 ? 0.28 : 0.72)),
    currentY: isAvatarAway ? 0.50 : (routePosition?.y ?? scenarioPlacement?.target.y ?? (residentFloor === 1 ? 0.35 : 0.30)),
    facingLeft: scenarioPlacement?.facingLeft ?? false,
    isWalking: false,
    isSleeping: false,
    isSitting: false,
    currentRoomId: isAvatarAway ? 'f1-A' : (scenarioRoomId ?? (residentFloor === 1 ? 'f1-A' : 'f2-B')),
    targetRoomId: isAvatarAway ? 'f1-A' : (scenarioRoomId ?? (residentFloor === 1 ? 'f1-A' : 'f2-B')),
    currentActivity: isAvatarAway ? 'Away' : 'At home',
    currentFloor: isAvatarAway ? 1 : shownFloor,
    targetFloor: isAvatarAway ? 1 : shownFloor,
    isFloorTransitioning: false,
  };
  return (
    <View style={{ flex: 1, minHeight: containerHeight ?? 420, padding: 16 }}>
      {debugLayout && (
        <View style={galleryStyles.missingPicturesCard}>
          <Text style={galleryStyles.missingPicturesText}>
            Missing pictures: {SKIPPED_ITEM_TYPES.join(', ')}
          </Text>
        </View>
      )}
      <FloorPlan
        rooms={rooms}
        items={items}
        currentFloor={floor}
        onFloorChange={setFloor}
        avatarState={avatarState}
        avatarVariant="avatar_girl"
        isAvatarAway={isAvatarAway}
        walkPath={routeResult?.points}
        activeApplianceIds={activeApplianceIds ?? scenarioPlacement?.activeApplianceIds ?? ['f1-fridge-kitchen', 'f1-ac-living']}
        activeRoomLightIds={[]}
        isEditMode={isEditMode}
        selectedItemId={selectedItemId}
        hoveredRoomId={hoveredRoomId}
        onRoomPress={() => {}}
        onSelectItem={(item) => setSelectedItemId(item.id)}
        onDeleteItem={() => {}}
        onRotateItem={() => {}}
        onMoveItemEnd={(itemId, posX, posY) => {
          setItems((current) => current.map((item) =>
            item.id === itemId ? { ...item, posX, posY } : item));
          return { x: posX, y: posY };
        }}
        floorPlanRef={floorRef}
        onLayout={() => {}}
        debugLayout={debugLayout}
        solarApplied={solarApplied}
      />
    </View>
  );
}

export default function SimulatorGallery() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeState, setActiveState] = useState<DemoState | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [detailsSheetVisible, setDetailsSheetVisible] = useState(false);

  // Stage 8 Sheets
  const [quickSetupVisible, setQuickSetupVisible] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [addBlockVisible, setAddBlockVisible] = useState(false);
  const [editBlockVisible, setEditBlockVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<RoutineBlock | null>(DEFAULT_ROUTINE_BLOCKS[0]);

  // Fast-forward demo state
  const [ffPeriod, setFfPeriod] = useState<FastForwardPeriod>('1M');
  const [ffPlaying, setFfPlaying] = useState(false);
  const [ffSimulatedDate, setFfSimulatedDate] = useState<string | null>(null);

  // In-memory swap demo state
  const [activeSwapIds, setActiveSwapIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeState !== 'home-furnished-floor-1-debug' && activeState !== 'home-furnished-floor-2-debug') return;
    SKIPPED_ITEM_TYPES.forEach((type) => console.warn(`[Simulator layout] Missing sprite picture: ${type}`));
  }, [activeState]);

  const onCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setCanvasSize({ width, height });
  };

  const appliances: Appliance[] =
    activeState === 'empty-plan' || activeState === 'bill-modal-empty'
      ? []
      : MOCK_APPLIANCES;

  const totalKwh = appliances.length === 0 ? 0 : MOCK_MONTHLY_KWH;
  const baseBillRm = calcBillFromKwh(totalKwh);
  const swapSuggestions = getSwapSuggestions(appliances, totalKwh, baseBillRm);

  const handleToggleSwap = (suggestion: SwapSuggestion) => {
    setActiveSwapIds((prev) => {
      const next = new Set(prev);
      if (next.has(suggestion.id)) {
        next.delete(suggestion.id);
      } else {
        next.add(suggestion.id);
      }
      return next;
    });
  };

  if (!__DEV__) {
    return (
      <SafeAreaView style={galleryStyles.container}>
        <Text>Dev only</Text>
      </SafeAreaView>
    );
  }

  // If a state is selected, preview it
  if (activeState) {
    return (
      <SafeAreaView
        style={galleryStyles.preview}
        edges={['top', 'left', 'right']}
      >
        {/* Header */}
        <View style={galleryStyles.previewHeader}>
          <Pressable
            onPress={() => {
              setActiveState(null);
              setBillModalVisible(false);
              setDetailsSheetVisible(false);
              setQuickSetupVisible(false);
              setTimelineVisible(false);
              setAddBlockVisible(false);
              setEditBlockVisible(false);
              setFfPlaying(false);
              setFfSimulatedDate(null);
            }}
            style={galleryStyles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to state list"
          >
            <ArrowLeft size={24} color="#292524" strokeWidth={1.5} />
          </Pressable>
          <Text style={galleryStyles.previewTitle}>
            {activeState}
          </Text>
          <View style={{ width: 48 }} />
        </View>

        {(activeState === 'two-floor-plan' || activeState === 'floor-two-dark' || activeState === 'resident-other-floor' ||
          activeState === 'stair-filled-floor-1' || activeState === 'stair-filled-floor-2' ||
          activeState === 'square-plan-default' || activeState === 'square-plan-shrunk' ||
          activeState === 'glow-on' || activeState === 'glow-off' ||
          activeState === 'room-tags-default' || activeState === 'room-tags-hovered' || activeState === 'room-tags-edit-mode' ||
          activeState === 'floor-items-2-2x' || activeState === 'item-label-tapped' || activeState === 'edit-selected-drag' ||
          activeState === 'home-furnished-floor-1' || activeState === 'home-furnished-floor-2' ||
          activeState === 'home-furnished-floor-1-debug' || activeState === 'home-furnished-floor-2-debug' || activeState === 'floor-2-setup-all' ||
          activeState === 'living-room-layout' || activeState === 'kitchen-layout' || activeState === 'bathroom-layout' ||
          activeState === 'bedroom-layout' || activeState === 'workplace-room-layout' ||
          activeState === 'avatar-at-sofa' || activeState === 'avatar-at-shower' || activeState === 'avatar-at-workplace' ||
          activeState === 'floor-follow-transition' || activeState === 'floor-follow-looked-away' || activeState === 'floor-follow-edit-mode' ||
          activeState === 'doorway-route-preview' || activeState === 'unreachable-room-route' || activeState === 'solar-applied') && (
          <TwoFloorPlanPreview
            key={activeState}
            initialFloor={activeState === 'floor-two-dark' || activeState === 'stair-filled-floor-2' || activeState === 'home-furnished-floor-2' || activeState === 'home-furnished-floor-2-debug' || activeState === 'floor-2-setup-all' || activeState === 'bedroom-layout' || activeState === 'workplace-room-layout' || activeState === 'avatar-at-workplace' || activeState === 'floor-follow-transition' ? 2 : 1}
            residentFloor={activeState === 'resident-other-floor' || activeState === 'home-furnished-floor-2' || activeState === 'home-furnished-floor-2-debug' || activeState === 'floor-2-setup-all' || activeState === 'bedroom-layout' || activeState === 'workplace-room-layout' || activeState === 'avatar-at-workplace' || activeState === 'floor-follow-transition' || activeState === 'floor-follow-looked-away' || activeState === 'floor-follow-edit-mode' ? 2 : 1}
            isEditMode={activeState === 'square-plan-shrunk' || activeState === 'room-tags-edit-mode' || activeState === 'floor-follow-edit-mode' || activeState === 'edit-selected-drag'}
            initialSelectedItemId={activeState === 'item-label-tapped' || activeState === 'edit-selected-drag' ? 'f1-ac-living' : null}
            activeApplianceIds={activeState === 'avatar-at-sofa' || activeState === 'avatar-at-shower' || activeState === 'avatar-at-workplace'
              ? undefined
              : activeState === 'glow-off' ? [] : ['f1-fridge-kitchen', 'f1-ac-living', 'f1-tv-living', 'f2-ac-master', 'fridge1', 'tv1', 'aircon1']}
            hoveredRoomId={activeState === 'room-tags-hovered' ? 'f1-A' : null}
            containerHeight={activeState === 'square-plan-shrunk' ? 260 : undefined}
            setupAllRooms={activeState === 'floor-2-setup-all'}
            debugLayout={activeState === 'home-furnished-floor-1-debug' || activeState === 'home-furnished-floor-2-debug'}
            avatarScenario={activeState === 'avatar-at-sofa' ? 'sofa' : activeState === 'avatar-at-shower' ? 'shower' : activeState === 'avatar-at-workplace' ? 'workplace' : undefined}
            routeScenario={activeState === 'doorway-route-preview' ? 'doorway' : activeState === 'unreachable-room-route' ? 'unreachable' : undefined}
            solarApplied={activeState === 'solar-applied'}
          />
        )}

        {(activeState === 'tidy-up-before' || activeState === 'tidy-up-after' || activeState === 'tidy-up-confirm') && <>
          <TwoFloorPlanPreview isEditMode messy={activeState === 'tidy-up-before'} debugLayout={activeState !== 'tidy-up-confirm'} />
          <TidyUpSheet visible={activeState === 'tidy-up-confirm'} onConfirm={() => setActiveState('tidy-up-after')}
            onClose={() => setActiveState(null)} />
        </>}

        {activeState === 'room-setup-sheet' && (
          <RoomNamingModal visible room={MOCK_SIMULATOR_ROOMS.find((room) => !room.isSetUp) ?? null}
            onSave={() => {}} onClose={() => setActiveState(null)} />
        )}

        {activeState === 'workplace-details' && (
          <ApplianceDetailsSheet visible
            item={MOCK_SIMULATOR_ITEMS.find((item) => item.type === 'workplace')}
            rooms={MOCK_SIMULATOR_ROOMS.filter((room) => room.isSetUp)}
            onSave={() => {}} onCancel={() => setActiveState(null)} />
        )}

        {(activeState === 'edit-tray-collapsed' || activeState === 'edit-tray-dragging' ||
          activeState === 'tray-first-screen' || activeState === 'tray-scrolled-end') && (
          <View style={{ flex: 1, justifyContent: 'flex-end', maxHeight: '22%' }}>
            <EditSheet visible initialCollapsed={activeState === 'edit-tray-collapsed'}
              initialScrollToEnd={activeState === 'tray-scrolled-end'}
              isDragging={activeState === 'edit-tray-dragging'} onItemPointerDown={() => {}} onItemTap={() => {}} />
          </View>
        )}

        {/* ── Week Reel (Part 6) ── */}
        {activeState === 'week-reel-caption-shower' && (
          <View style={{ flex: 1, padding: 16 }}>
            <WeekReelCaption
              segment={{
                day: 'Monday',
                dayIndex: 0,
                block: {
                  id: 'block-shower',
                  name: 'Morning Shower',
                  startTime: '06:30',
                  endTime: '07:15',
                  roomId: 'f1-C',
                  iconType: 'shower',
                  applianceIds: ['f1-shower-bath'],
                },
                isAway: false,
                caption: 'Monday · Morning Shower · 06:30',
              }}
              roomName="Bathroom"
              savingsRm={15}
            />
            <TwoFloorPlanPreview avatarScenario="shower" />
          </View>
        )}

        {activeState === 'week-reel-caption-away' && (
          <View style={{ flex: 1, padding: 16 }}>
            <WeekReelCaption
              segment={{
                day: 'Tuesday',
                dayIndex: 1,
                block: null,
                isAway: true,
                caption: 'Tuesday · Away',
              }}
              savingsRm={30}
            />
            <TwoFloorPlanPreview isAvatarAway />
          </View>
        )}

        {activeState === 'week-reel-playing' && (
          <View style={{ flex: 1, padding: 16 }}>
            <WeekReelCaption
              segment={{
                day: 'Monday',
                dayIndex: 0,
                block: {
                  id: 'block-shower',
                  name: 'Morning Shower',
                  startTime: '06:30',
                  endTime: '07:15',
                  roomId: 'f1-C',
                  iconType: 'shower',
                  applianceIds: ['f1-shower-bath'],
                },
                isAway: false,
                caption: 'Monday · Morning Shower · 06:30',
              }}
              roomName="Bathroom"
              savingsRm={12}
            />
            <TwoFloorPlanPreview routeScenario="doorway" />
          </View>
        )}

        {activeState === 'week-reel-reduced-summary' && (
          <View style={{ flex: 1, padding: 16 }}>
            <WeekReelSummary
              segments={buildWeekReel(DEFAULT_ROUTINE_BLOCKS)}
              finalSavingsRm={80}
            />
          </View>
        )}

        {activeState === 'post-simulation-ai-report' && (
          <AIAnalysisReportModal visible appliances={MOCK_APPLIANCES} onClose={() => setActiveState('post-simulation-solar-suggestion')} />
        )}

        {activeState === 'post-simulation-solar-suggestion' && (
          <ApplianceSuggestionSheet visible onClose={() => setActiveState(null)} onApply={() => setActiveState('solar-applied')} />
        )}

        {/* ── 1. Loading Skeleton ── */}
        {activeState === 'loading-skeleton' && (
          <View style={galleryStyles.skeletonDemo}>
            <Skeleton width="62%" height={120} borderRadius={32} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={240} borderRadius={32} />
          </View>
        )}

        {/* ── 2. Bill Modals ── */}
        {(activeState === 'bill-modal-filled' || activeState === 'bill-modal-empty') && (
          <View style={galleryStyles.modalTriggerArea}>
            <Pressable
              style={galleryStyles.openModalBtn}
              onPress={() => setBillModalVisible(true)}
            >
              <BillHero kWh={totalKwh} />
              <Text style={galleryStyles.tapHint}>Tap to open bill modal</Text>
            </Pressable>

            <BillModal
              visible={billModalVisible}
              onClose={() => setBillModalVisible(false)}
              appliances={appliances}
              totalKwh={totalKwh}
              onAddAppliances={() => setBillModalVisible(false)}
            />
          </View>
        )}

        {/* ── 3. Floor Plan States ── */}
        {(activeState === 'empty-plan' ||
          activeState === 'plan-with-appliances' ||
          activeState === 'drag-onto-room') && (
          <View style={galleryStyles.floorPlanPreview}>
            <View style={galleryStyles.floorPlanCard} onLayout={onCanvasLayout}>
              {canvasSize.width > 0 && canvasSize.height > 0 && (
                <FloorPlanCanvas
                  rooms={MOCK_ROOMS}
                  appliances={appliances}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  isEditMode={activeState === 'drag-onto-room'}
                  viewOnly={false}
                />
              )}
            </View>
          </View>
        )}

        {/* ── 4. Edit Mode Tray State ── */}
        {activeState === 'edit-mode-tray' && (
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={[galleryStyles.floorPlanCard, { flex: 0.6 }]} onLayout={onCanvasLayout}>
              {canvasSize.width > 0 && canvasSize.height > 0 && (
                <FloorPlanCanvas
                  rooms={MOCK_ROOMS}
                  appliances={appliances}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  isEditMode
                />
              )}
            </View>
            <EditTray
              visible
              onSelectApplianceType={() => setDetailsSheetVisible(true)}
            />
          </View>
        )}

        {/* ── 5. Details Sheet State ── */}
        {activeState === 'details-sheet' && (
          <View style={galleryStyles.modalTriggerArea}>
            <Pressable
              style={galleryStyles.openModalBtn}
              onPress={() => setDetailsSheetVisible(true)}
            >
              <Text style={galleryStyles.heroText}>Appliance Details</Text>
              <Text style={galleryStyles.tapHint}>Tap to open details sheet</Text>
            </Pressable>

            <ApplianceDetailsSheet
              visible={detailsSheetVisible}
              onClose={() => setDetailsSheetVisible(false)}
              applianceType="air_conditioner"
              defaultWattage={1200}
              onSave={() => setDetailsSheetVisible(false)}
            />
          </View>
        )}

        {/* ── 6. Suggestion Area States ── */}
        {activeState.startsWith('suggestion-') && (
          <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 20 }}>
            <SuggestionArea
              mode={
                activeState === 'suggestion-idle'
                  ? 'idle'
                  : activeState === 'suggestion-first-time'
                  ? 'first-time'
                  : activeState === 'suggestion-solar'
                  ? 'solar'
                  : 'swap'
              }
              suggestions={swapSuggestions}
              activeSwapIds={activeSwapIds}
              onToggleSwap={handleToggleSwap}
              onOpenMyDay={() => router.push('/_dev')}
              onFirstTimeStart={() => showToast('Starting routine setup', 'info')}
              onFirstTimeDismiss={() => showToast('Setup dismissed', 'info')}
              onSolarDismiss={() => showToast('Solar suggestion dismissed', 'info')}
              onSolarSeeHow={() => showToast('Solar panel calculator coming soon', 'info')}
            />
          </View>
        )}

        {/* ── 7. Fast-Forward States ── */}
        {activeState.startsWith('fast-forward-') && (
          <View style={{ flex: 1 }}>
            <FastForwardPanel
              visible={activeState !== 'fast-forward-closed'}
              period={
                activeState === 'fast-forward-open-6m'
                  ? '1W'
                  : activeState === 'fast-forward-open-1y'
                  ? '1Y'
                  : ffPeriod
              }
              onPeriodChange={setFfPeriod}
              monthlySavingRm={80}
              isPlaying={activeState === 'fast-forward-playing' || ffPlaying}
              onPlaybackComplete={() => setFfPlaying(false)}
              onPlaybackStop={() => {
                setFfPlaying(false);
                setFfSimulatedDate(null);
              }}
              onSimulatedDateChange={setFfSimulatedDate}
              onClose={() => setActiveState('fast-forward-closed')}
            />

            <View style={galleryStyles.floorPlanCard} onLayout={onCanvasLayout}>
              {canvasSize.width > 0 && canvasSize.height > 0 && (
                <FloorPlanCanvas
                  rooms={MOCK_ROOMS}
                  appliances={appliances}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  simulatedDate={
                    activeState === 'fast-forward-playing'
                      ? ffSimulatedDate ?? '18 Nov 2026'
                      : activeState === 'fast-forward-stopped'
                      ? '5 Dec 2026 (Stopped)'
                      : activeState === 'fast-forward-reduced-motion'
                      ? '18 Oct 2027 (Final)'
                      : null
                  }
                />
              )}
            </View>
          </View>
        )}

        {/* ── 8. Stage 8: Quick Setup Sheet ── */}
        {activeState === 'my-day-quick-setup' && (
          <View style={galleryStyles.modalTriggerArea}>
            <Pressable
              style={galleryStyles.openModalBtn}
              onPress={() => setQuickSetupVisible(true)}
            >
              <Text style={galleryStyles.heroText}>Quick Setup Flow</Text>
              <Text style={galleryStyles.tapHint}>Tap to open 4-card Quick Setup sheet</Text>
            </Pressable>

            <QuickSetupSheet
              visible={quickSetupVisible}
              onClose={() => setQuickSetupVisible(false)}
              onComplete={() => {
                setQuickSetupVisible(false);
                showToast('Quick setup complete!', 'success');
              }}
            />
          </View>
        )}

        {/* ── 9. Stage 8: My Day Timeline Sheet ── */}
        {(activeState === 'my-day-timeline' || activeState === 'my-day-away-note') && (
          <View style={galleryStyles.modalTriggerArea}>
            <Pressable
              style={galleryStyles.openModalBtn}
              onPress={() => setTimelineVisible(true)}
            >
              <Text style={galleryStyles.heroText}>Routine Timeline</Text>
              <Text style={galleryStyles.tapHint}>Tap to open 24-hr routine timeline sheet</Text>
            </Pressable>

            <MyDayTimelineSheet
              visible={timelineVisible}
              onClose={() => setTimelineVisible(false)}
              blocks={DEFAULT_ROUTINE_BLOCKS}
              onAddBlockPress={() => setAddBlockVisible(true)}
              onEditBlockPress={(b) => {
                setEditingBlock(b);
                setEditBlockVisible(true);
              }}
              onSaveSchedule={() => showToast('Schedule saved', 'success')}
            />
          </View>
        )}

        {/* ── 10. Stage 8: Add Block Sheet (Valid & Error) ── */}
        {(activeState === 'my-day-add-block-valid' || activeState === 'my-day-add-block-error') && (
          <View style={galleryStyles.modalTriggerArea}>
            <Pressable
              style={galleryStyles.openModalBtn}
              onPress={() => setAddBlockVisible(true)}
            >
              <Text style={galleryStyles.heroText}>
                {activeState === 'my-day-add-block-error' ? 'Add Block (Error)' : 'Add Block (Valid)'}
              </Text>
              <Text style={galleryStyles.tapHint}>Tap to open Add Block sheet</Text>
            </Pressable>

            <AddBlockSheet
              visible={addBlockVisible}
              onClose={() => setAddBlockVisible(false)}
              existingBlocks={DEFAULT_ROUTINE_BLOCKS}
              onSaveBlock={() => setAddBlockVisible(false)}
              initialSimulateError={activeState === 'my-day-add-block-error'}
            />
          </View>
        )}

        {/* ── 11. Stage 8: Edit Block Sheet ── */}
        {activeState === 'my-day-edit-block' && (
          <View style={galleryStyles.modalTriggerArea}>
            <Pressable
              style={galleryStyles.openModalBtn}
              onPress={() => setEditBlockVisible(true)}
            >
              <Text style={galleryStyles.heroText}>Edit Block Sheet</Text>
              <Text style={galleryStyles.tapHint}>Tap to open Edit Block sheet</Text>
            </Pressable>

            <EditBlockSheet
              visible={editBlockVisible}
              onClose={() => setEditBlockVisible(false)}
              block={editingBlock}
              onUpdateBlock={() => setEditBlockVisible(false)}
              onRemoveBlock={() => setEditBlockVisible(false)}
            />
          </View>
        )}

        {/* ── 12. Stage 8: Resident Avatar Poses Showcase ── */}
        {activeState === 'avatar-poses' && (
          <ScrollView contentContainerStyle={galleryStyles.avatarPosesGrid}>
            {(['stand', 'walk', 'sit', 'lie', 'cook', 'shower'] as AvatarPose[]).map((pose) => (
              <View key={pose} style={galleryStyles.avatarPoseCard}>
                <ResidentAvatar pose={pose} size={48} />
                <Text style={galleryStyles.poseLabel}>{pose}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── 13. Stage 8: Home Looks Preview (Day / Evening / Away) ── */}
        {(activeState === 'home-look-day' ||
          activeState === 'home-look-evening' ||
          activeState === 'home-look-away') && (
          <View style={galleryStyles.floorPlanPreview}>
            <View style={galleryStyles.floorPlanCard} onLayout={onCanvasLayout}>
              {canvasSize.width > 0 && canvasSize.height > 0 && (
                <FloorPlanCanvas
                  rooms={MOCK_ROOMS}
                  appliances={appliances}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  backdropColor={
                    activeState === 'home-look-day'
                      ? '#faf6f1'
                      : activeState === 'home-look-evening'
                      ? '#d6d3d1'
                      : '#f5f5f4'
                  }
                  avatarState={{
                    roomId: activeState === 'home-look-evening' ? 'living' : 'kitchen',
                    pose: activeState === 'home-look-evening' ? 'sit' : 'cook',
                    normalizedPos:
                      activeState === 'home-look-evening'
                        ? { x: 0.3, y: 0.3 }
                        : { x: 0.7, y: 0.3 },
                    isAway: activeState === 'home-look-away',
                    awayLabel: 'Out • back at 17:30',
                    isEnergySaving: activeState === 'home-look-away',
                    activeApplianceIds:
                      activeState === 'home-look-evening'
                        ? ['ac1', 'lights1', 'tv']
                        : ['fridge1'],
                  }}
                />
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // State picker
  return (
    <SafeAreaView style={galleryStyles.container} edges={['top', 'left', 'right']}>
      <View style={galleryStyles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/simulator');
            }
          }}
          style={galleryStyles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={24} color="#292524" strokeWidth={1.5} />
        </Pressable>
        <Text style={galleryStyles.title}>Simulator Gallery</Text>
        <View style={{ width: 48 }} />
      </View>

      <Text style={galleryStyles.subtitle}>Stages 6, 7 & 8 — SIM-01 to SIM-07</Text>

      <ScrollView contentContainerStyle={galleryStyles.list}>
        {STATE_GROUPS.map((group) => (
          <View key={group.title} style={galleryStyles.groupContainer}>
            <Text style={galleryStyles.groupTitle}>{group.title}</Text>
            {group.items.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  galleryStyles.stateRow,
                  pressed && galleryStyles.pressed,
                ]}
                onPress={() => {
                  setActiveState(item.id);
                  if (item.id === 'bill-modal-filled' || item.id === 'bill-modal-empty') {
                    setBillModalVisible(true);
                  }
                  if (item.id === 'details-sheet') {
                    setDetailsSheetVisible(true);
                  }
                  if (item.id === 'fast-forward-playing') {
                    setFfPlaying(true);
                  }
                  if (item.id === 'my-day-quick-setup') {
                    setQuickSetupVisible(true);
                  }
                  if (item.id === 'my-day-timeline' || item.id === 'my-day-away-note') {
                    setTimelineVisible(true);
                  }
                  if (item.id === 'my-day-add-block-valid' || item.id === 'my-day-add-block-error') {
                    setAddBlockVisible(true);
                  }
                  if (item.id === 'my-day-edit-block') {
                    setEditBlockVisible(true);
                  }
                }}
              >
                <Text style={galleryStyles.stateLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const galleryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    marginBottom: 16,
  },
  list: { paddingBottom: 40, gap: 16 },
  groupContainer: {
    gap: 8,
  },
  groupTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 15,
    color: '#566549', // sage-600
    marginBottom: 2,
    marginTop: 6,
  },
  stateRow: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 16,
  },
  pressed: { backgroundColor: '#f5f5f4', transform: [{ translateY: 2 }] },
  stateLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },

  // Preview
  preview: {
    flex: 1,
    backgroundColor: '#faf6f1',
    paddingHorizontal: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  previewTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#292524',
    textAlign: 'center',
  },
  heroText: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 28,
    color: '#292524',
    textAlign: 'center',
    marginBottom: 8,
  },
  tapHint: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#a8a29e',
    textAlign: 'center',
  },
  modalTriggerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openModalBtn: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    width: '100%',
  },
  floorPlanPreview: {
    flex: 1,
    paddingBottom: 20,
  },
  floorPlanCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 16,
    overflow: 'hidden',
  },
  missingPicturesCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  missingPicturesText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#57534E',
  },
  skeletonDemo: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  avatarPosesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 16,
    justifyContent: 'center',
  },
  avatarPoseCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  poseLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
    textTransform: 'capitalize',
  },
});
