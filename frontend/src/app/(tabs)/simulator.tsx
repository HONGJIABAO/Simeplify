/**
 * SIM-01, SIM-02, SIM-03, SIM-04, SIM-05, SIM-06, SIM-07
 * Simulator tab — Stage 8: My day, resident avatar, home looks.
 * Source: docs/page_refined.md S4.1 to S4.6, docs/design.md Unit 12.
 *
 * Rules:
 * - Presence wins over My day; before any My day answer, bill is max bill.
 * - Avatar walks to room of active block, poses match activity (lie, cook, shower, sit, stand).
 * - Away time: avatar walks to door, home shows energy saving overlay, "Energy saving" pill.
 * - Backdrop shifts according to time of day.
 * - My Day full-height bottom sheets: Quick setup, Timeline, Add block, Edit block.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  CalendarCheck,
  Gauge,
  Clock,
  FastForward,
  Play,
  Square,
} from 'lucide-react-native';

import {
  MOCK_APPLIANCES,
  MOCK_ROOMS,
  MOCK_MONTHLY_KWH,
  Appliance,
  ApplianceType,
  Room,
} from '@/lib/mockData';
import {
  HIGH_USAGE_THRESHOLD_RM,
} from '@/lib/flags';
import { calcBillFromKwh } from '@/features/simulator/logic/billCalc';
import { useBillAnimation } from '@/features/simulator/hooks/useBillAnimation';
import { FloorPlanCanvas } from '@/features/simulator/components/FloorPlanCanvas';
import { BillModal } from '@/features/simulator/components/BillModal';
import { FastForwardPanel } from '@/features/simulator/components/FastForwardPanel';
import { FastForwardPeriod } from '@/features/simulator/logic/fastForward';
import { EditTray } from '@/features/simulator/components/EditTray';
import { ApplianceDetailsSheet } from '@/features/simulator/components/ApplianceDetailsSheet';
import { SuggestionArea, SuggestionMode } from '@/features/simulator/components/SuggestionArea';
import { getSwapSuggestions, SwapSuggestion } from '@/features/simulator/logic/swapLogic';
import {
  RoutineBlock,
  DEFAULT_ROUTINE_BLOCKS,
  getActiveBlockAtTime,
  calcMonthlyKwhFromRoutine,
} from '@/features/simulator/logic/myDayLogic';
import {
  getAvatarState,
  getBackdropColorForTime,
} from '@/features/simulator/logic/avatarPlace';
import { QuickSetupSheet } from '@/features/simulator/components/QuickSetupSheet';
import { MyDayTimelineSheet } from '@/features/simulator/components/MyDayTimelineSheet';
import { AddBlockSheet } from '@/features/simulator/components/AddBlockSheet';
import { EditBlockSheet } from '@/features/simulator/components/EditBlockSheet';
import { useToast } from '@/components/Toast';
import { colors, shadows } from '@/lib/theme';

export default function SimulatorScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  // ── 1. Base Appliances & Routine State ────────────────────────────────────
  const [baseAppliances, setBaseAppliances] = useState<Appliance[]>(MOCK_APPLIANCES);
  const [baseKwh, setBaseKwh] = useState(MOCK_MONTHLY_KWH);
  const [myDayAnswered, setMyDayAnswered] = useState(false);
  const [routineBlocks, setRoutineBlocks] = useState<RoutineBlock[]>(DEFAULT_ROUTINE_BLOCKS);

  // In-memory swap replacements: map of applianceId -> SwapSuggestion
  const [activeSwaps, setActiveSwaps] = useState<Map<string, SwapSuggestion>>(new Map());

  // Appliances with active in-memory swaps applied
  const currentAppliances = useMemo(() => {
    return baseAppliances.map((app) => {
      const activeSwap = activeSwaps.get(app.id);
      if (activeSwap) {
        return {
          ...app,
          wattage: activeSwap.newWattage,
          stars: activeSwap.suggestedStars,
        };
      }
      return app;
    });
  }, [baseAppliances, activeSwaps]);

  // Total kWh after routine optimization and in-memory swaps
  const totalKwh = useMemo(() => {
    // If My day answered, optimize person-dependent usage
    const effectiveBase = myDayAnswered
      ? calcMonthlyKwhFromRoutine(routineBlocks, baseKwh)
      : baseKwh;

    let kwh = effectiveBase;
    activeSwaps.forEach((swap) => {
      const diff = baseKwh - swap.newMonthlyKwh;
      kwh -= Math.max(0, diff);
    });
    return Math.max(0, Math.round(kwh));
  }, [baseKwh, myDayAnswered, routineBlocks, activeSwaps]);

  const totalBillRm = useMemo(() => calcBillFromKwh(totalKwh), [totalKwh]);
  const animatedBillText = useBillAnimation(Math.round(totalBillRm));

  // Base bill (before swaps) to compute monthly savings
  const baseBillRm = useMemo(() => calcBillFromKwh(baseKwh), [baseKwh]);
  const monthlySavingRm = useMemo(
    () => Math.max(0, Math.round(baseBillRm - totalBillRm)),
    [baseBillRm, totalBillRm]
  );

  // ── 2. Clock & Avatar / Home Look State (SIM-06) ─────────────────────────
  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  const timeLabel = `Today • ${currentTimeStr}`;

  const activeBlock = useMemo(
    () => getActiveBlockAtTime(currentTimeStr, routineBlocks),
    [currentTimeStr, routineBlocks]
  );

  const avatarState = useMemo(
    () => getAvatarState(activeBlock),
    [activeBlock]
  );

  const backdropColor = useMemo(
    () => getBackdropColorForTime(currentTimeStr),
    [currentTimeStr]
  );

  // ── 3. Floor Plan Sizing ─────────────────────────────────────────────────
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const onFloorPlanLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCanvasSize({ width, height });
    }
  }, []);

  // ── 4. Fast-forward State (SIM-04) ───────────────────────────────────────
  const [fastForwardState, setFastForwardState] = useState<'closed' | 'open' | 'playing'>('closed');
  const [fastForwardPeriod, setFastForwardPeriod] = useState<FastForwardPeriod>('1M');
  const [simulatedDate, setSimulatedDate] = useState<string | null>(null);

  const handleFastForwardPress = useCallback(() => {
    if (fastForwardState === 'closed') {
      setFastForwardState('open');
    } else if (fastForwardState === 'open') {
      setFastForwardState('playing');
    } else {
      setFastForwardState('open');
      setSimulatedDate(null);
    }
  }, [fastForwardState]);

  // ── 5. Edit Mode State (SIM-05) ──────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedApplianceId, setSelectedApplianceId] = useState<string | null>(null);

  // Appliance details sheet state
  const [detailsSheetVisible, setDetailsSheetVisible] = useState(false);
  const [sheetApplianceType, setSheetApplianceType] = useState<ApplianceType>('air_conditioner');
  const [sheetDefaultWattage, setSheetDefaultWattage] = useState(1200);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);

  const handleSelectApplianceType = useCallback((type: ApplianceType, defaultWattage: number) => {
    setSheetApplianceType(type);
    setSheetDefaultWattage(defaultWattage);
    setEditingAppliance(null);
    setDetailsSheetVisible(true);
  }, []);

  const handleSaveAppliance = useCallback(
    (newAppData: Omit<Appliance, 'id'>) => {
      if (editingAppliance) {
        setBaseAppliances((prev) =>
          prev.map((a) => (a.id === editingAppliance.id ? { ...newAppData, id: a.id } : a))
        );
      } else {
        const newApp: Appliance = {
          ...newAppData,
          id: `app-${Date.now()}`,
        };
        setBaseAppliances((prev) => [...prev, newApp]);
        setBaseKwh((prev) => prev + Math.round(newAppData.wattage * 0.15));
      }
      setSelectedApplianceId(null);
    },
    [editingAppliance]
  );

  const handleSelectApplianceOnPlan = useCallback(
    (appliance: Appliance) => {
      setSelectedApplianceId((prev) => (prev === appliance.id ? null : appliance.id));
    },
    []
  );

  const handleRoomPress = useCallback(
    (room: Room) => {
      handleSelectApplianceType('air_conditioner', 1200);
    },
    [handleSelectApplianceType]
  );

  // ── 6. Suggestion Area State (SIM-02, SIM-03) ────────────────────────────
  const [firstTimeDismissed, setFirstTimeDismissed] = useState(false);
  const [solarDismissed, setSolarDismissed] = useState(false);

  const swapSuggestions = useMemo(() => {
    return getSwapSuggestions(currentAppliances, totalKwh, totalBillRm);
  }, [currentAppliances, totalKwh, totalBillRm]);

  const suggestionMode: SuggestionMode = useMemo(() => {
    if (totalBillRm >= 500 && !solarDismissed) {
      return 'solar';
    }
    if (!firstTimeDismissed && !myDayAnswered && currentAppliances.length > 0) {
      return 'first-time';
    }
    if (swapSuggestions.length > 0) {
      return 'swap';
    }
    return 'idle';
  }, [totalBillRm, solarDismissed, firstTimeDismissed, myDayAnswered, currentAppliances.length, swapSuggestions.length]);

  const handleToggleSwap = useCallback((suggestion: SwapSuggestion) => {
    setActiveSwaps((prev) => {
      const next = new Map(prev);
      if (next.has(suggestion.applianceId)) {
        next.delete(suggestion.applianceId);
      } else {
        next.set(suggestion.applianceId, suggestion);
      }
      return next;
    });
  }, []);

  // ── 7. My Day Sheets State (SIM-07) ──────────────────────────────────────
  const [quickSetupVisible, setQuickSetupVisible] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [addBlockVisible, setAddBlockVisible] = useState(false);
  const [editBlockVisible, setEditBlockVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<RoutineBlock | null>(null);

  const handleOpenMyDay = useCallback(() => {
    if (!myDayAnswered) {
      setQuickSetupVisible(true);
    } else {
      setTimelineVisible(true);
    }
  }, [myDayAnswered]);

  const handleAddBlock = useCallback((newBlock: Omit<RoutineBlock, 'id'>) => {
    setRoutineBlocks((prev) => [
      ...prev,
      { ...newBlock, id: `block-${Date.now()}` },
    ]);
    setMyDayAnswered(true);
    showToast('Time block added to schedule', 'success');
  }, [showToast]);

  const handleUpdateBlock = useCallback((updated: RoutineBlock) => {
    setRoutineBlocks((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    showToast('Block updated', 'success');
  }, [showToast]);

  const handleRemoveBlock = useCallback((id: string) => {
    setRoutineBlocks((prev) => prev.filter((b) => b.id !== id));
    showToast('Block removed', 'info');
  }, [showToast]);

  // ── 8. Bill Modal Visibility ─────────────────────────────────────────────
  const [billModalVisible, setBillModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* ── Top area ─────────────────────────────────────────────────── */}
      <View style={styles.topArea}>
        {/* Bill card (left, ~58% width) */}
        <Pressable
          style={styles.billCard}
          onPress={() => setBillModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Estimated bill. Tap to see details."
        >
          {/* Label row */}
          <View style={styles.billLabelRow}>
            <Gauge size={14} color={colors['tan-400']} strokeWidth={1.5} />
            <Text style={styles.billLabel}>Estimated bill</Text>
            {HIGH_USAGE_THRESHOLD_RM !== null &&
              totalBillRm >= HIGH_USAGE_THRESHOLD_RM && (
                <View style={styles.highUsageBadge}>
                  <Text style={styles.highUsageBadgeText}>High usage</Text>
                </View>
              )}
          </View>

          {/* Hero number + /mo */}
          <View style={styles.billHeroRow}>
            <Text style={styles.billHero}>{animatedBillText}</Text>
            <Text style={styles.billPerMo}>/ mo</Text>
          </View>

          {/* Max-bill note before My day answer */}
          {!myDayAnswered && totalKwh > 0 && (
            <Text style={styles.maxBillNote}>
              Max estimate before My day
            </Text>
          )}

          {/* Active in-memory swap saving indicator */}
          {monthlySavingRm > 0 && (
            <Text style={styles.swapSavingNote}>
              Active swap: saves RM {monthlySavingRm}/mo
            </Text>
          )}

          {/* Divider */}
          <View style={styles.billDivider} />

          {/* Scene time */}
          <View style={styles.billTimeRow}>
            <Clock size={13} color={colors['stone-400']} strokeWidth={1.5} />
            <Text style={styles.billTimeText}>{timeLabel}</Text>
          </View>
        </Pressable>

        {/* Button stack (right) */}
        <View style={styles.buttonStack}>
          {/* Bell pill */}
          <Pressable
            style={styles.bellPill}
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color={colors['stone-800']} strokeWidth={1.5} />
            <View style={styles.bellUnreadDot} />
          </Pressable>

          {/* My day button */}
          <Pressable
            style={styles.roundButton}
            onPress={handleOpenMyDay}
            accessibilityRole="button"
            accessibilityLabel="My day schedule"
          >
            <CalendarCheck size={20} color={colors['stone-800']} strokeWidth={1.5} />
          </Pressable>

          {/* Fast-forward button */}
          <Pressable
            style={[styles.roundButton, styles.fastForwardButton]}
            onPress={handleFastForwardPress}
            accessibilityRole="button"
            accessibilityLabel={
              fastForwardState === 'closed'
                ? 'Fast-forward. Opens the time selector.'
                : fastForwardState === 'open'
                ? `Play fast-forward for ${fastForwardPeriod}`
                : 'Stop fast-forward'
            }
          >
            {fastForwardState === 'closed' ? (
              <FastForward size={20} color={colors.paper} strokeWidth={1.5} />
            ) : fastForwardState === 'open' ? (
              <Play size={20} color={colors.paper} strokeWidth={1.5} fill={colors.paper} />
            ) : (
              <Square size={18} color={colors.paper} strokeWidth={1.5} fill={colors.paper} />
            )}
          </Pressable>
        </View>
      </View>

      {/* ── Fast-forward panel (SIM-04) ───────────────────────────────── */}
      <FastForwardPanel
        visible={fastForwardState !== 'closed'}
        period={fastForwardPeriod}
        onPeriodChange={setFastForwardPeriod}
        monthlySavingRm={monthlySavingRm}
        isPlaying={fastForwardState === 'playing'}
        onPlaybackComplete={() => {
          setFastForwardState('open');
        }}
        onPlaybackStop={() => {
          setFastForwardState('open');
          setSimulatedDate(null);
        }}
        onSimulatedDateChange={setSimulatedDate}
        onClose={() => {
          setFastForwardState('closed');
          setSimulatedDate(null);
        }}
      />

      {/* ── Edit row ──────────────────────────────────────────────────── */}
      <View style={styles.editRow}>
        <Pressable
          style={styles.editButton}
          onPress={() => {
            setIsEditMode((prev) => !prev);
            setSelectedApplianceId(null);
          }}
          accessibilityRole="button"
          accessibilityLabel={isEditMode ? 'Done editing floor plan' : 'Edit floor plan'}
        >
          <Text style={styles.editButtonText}>{isEditMode ? 'Done' : 'Edit'}</Text>
        </Pressable>
      </View>

      {/* ── Floor plan card ───────────────────────────────────────────── */}
      <View style={styles.floorPlanCard}>
        <View style={styles.floorPlanInner} onLayout={onFloorPlanLayout}>
          {canvasSize.width > 0 && canvasSize.height > 0 && (
            <FloorPlanCanvas
              rooms={MOCK_ROOMS}
              appliances={currentAppliances}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              viewOnly={false}
              isEditMode={isEditMode}
              selectedApplianceId={selectedApplianceId}
              onSelectAppliance={handleSelectApplianceOnPlan}
              onRoomPress={handleRoomPress}
              simulatedDate={simulatedDate}
              avatarState={avatarState}
              backdropColor={backdropColor}
            />
          )}
        </View>
      </View>

      {/* ── Docked Bottom Area: Edit Tray or Suggestion Area ───────────── */}
      <View style={styles.dockedBottomArea}>
        {isEditMode ? (
          <EditTray
            visible={isEditMode}
            onSelectApplianceType={handleSelectApplianceType}
          />
        ) : (
          <SuggestionArea
            mode={suggestionMode}
            suggestions={swapSuggestions}
            activeSwapIds={new Set(activeSwaps.keys())}
            onToggleSwap={handleToggleSwap}
            onOpenMyDay={handleOpenMyDay}
            onFirstTimeStart={() => setQuickSetupVisible(true)}
            onFirstTimeDismiss={() => setFirstTimeDismissed(true)}
            onSolarDismiss={() => setSolarDismissed(true)}
            onSolarSeeHow={() => showToast('Solar panel calculator coming soon', 'info')}
          />
        )}
      </View>

      {/* ── Estimated Bill Modal ───────────────────────────────────────── */}
      <BillModal
        visible={billModalVisible}
        onClose={() => setBillModalVisible(false)}
        appliances={currentAppliances}
        totalKwh={totalKwh}
        onAddAppliances={() => {
          setBillModalVisible(false);
          setIsEditMode(true);
        }}
      />

      {/* ── Appliance Details BottomSheet (SIM-05) ─────────────────────── */}
      <ApplianceDetailsSheet
        visible={detailsSheetVisible}
        onClose={() => setDetailsSheetVisible(false)}
        applianceType={sheetApplianceType}
        defaultWattage={sheetDefaultWattage}
        initialAppliance={editingAppliance}
        onSave={handleSaveAppliance}
      />

      {/* ── My Day Sheets (SIM-07) ─────────────────────────────────────── */}
      <QuickSetupSheet
        visible={quickSetupVisible}
        onClose={() => setQuickSetupVisible(false)}
        onComplete={() => {
          setMyDayAnswered(true);
          setFirstTimeDismissed(true);
          showToast('Quick setup saved — Bill updated!', 'success');
        }}
      />

      <MyDayTimelineSheet
        visible={timelineVisible}
        onClose={() => setTimelineVisible(false)}
        blocks={routineBlocks}
        onAddBlockPress={() => setAddBlockVisible(true)}
        onEditBlockPress={(block) => {
          setEditingBlock(block);
          setEditBlockVisible(true);
        }}
        onSaveSchedule={() => {
          setMyDayAnswered(true);
          showToast('Routine schedule saved', 'success');
        }}
      />

      <AddBlockSheet
        visible={addBlockVisible}
        onClose={() => setAddBlockVisible(false)}
        existingBlocks={routineBlocks}
        onSaveBlock={handleAddBlock}
      />

      <EditBlockSheet
        visible={editBlockVisible}
        onClose={() => {
          setEditBlockVisible(false);
          setEditingBlock(null);
        }}
        block={editingBlock}
        onUpdateBlock={handleUpdateBlock}
        onRemoveBlock={handleRemoveBlock}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#faf6f1', // cream
    paddingHorizontal: 20,
  },

  // Top Area
  topArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginBottom: 6,
  },
  billCard: {
    width: '62%',
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 16,
    ...shadows.sm,
  },
  billLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  billLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    flex: 1,
  },
  highUsageBadge: {
    backgroundColor: '#fffbeb',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  highUsageBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#92600e',
  },
  billHeroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 2,
  },
  billHero: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 28,
    color: '#292524',
    lineHeight: 34,
  },
  billPerMo: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
  },
  maxBillNote: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#92600e', // warning color
    marginBottom: 4,
  },
  swapSavingNote: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#566549', // sage-600
    marginBottom: 4,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#e7e5e4',
    marginVertical: 8,
  },
  billTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billTimeText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
  },

  // Button stack
  buttonStack: {
    gap: 12,
    alignItems: 'center',
  },
  bellPill: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.sm,
  },
  bellUnreadDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d4a373', // tan-400
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  fastForwardButton: {
    backgroundColor: '#292524', // stone-800
    borderColor: '#292524',
  },

  // Edit row
  editRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  editButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#566549', // sage-600
  },

  // Floor plan card
  floorPlanCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 12,
    overflow: 'hidden',
    marginBottom: 8,
    ...shadows.sm,
  },
  floorPlanInner: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },

  // Docked bottom area
  dockedBottomArea: {
    marginBottom: 8,
  },
});
