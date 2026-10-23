import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Leaf,
  Lock,
  Recycle,
  RotateCcw,
  Sparkles,
  Unlock,
  Vote,
  X,
  Zap,
} from 'lucide-react-native';

import { useEcoHabit } from '@/lib/ecoHabitContext';
import { RESTORE_COST, DEED_POINTS, MAX_DEEDS_PER_DAY } from '@/features/community/config';

interface EcoDemoControlModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EcoDemoControlModal({ visible, onClose }: EcoDemoControlModalProps) {
  const {
    demoDate,
    setDemoDate,
    advanceNextDay,
    todayDeedsCount,
    currentHousehold,
    isLeafLocked,
    unlockLeaf,
    setIsLeafLocked,
    isVotingVisible,
    countdown,
    penaltyNotice,
    completeGreenAction,
    sortRecycleItem,
    restoreDeed,
    resetAll,
  } = useEcoHabit();

  const handleAction = () => {
    completeGreenAction();
  };

  const handleSort = () => {
    sortRecycleItem();
  };

  const handleRestore = () => {
    restoreDeed();
  };

  const canRestore =
    currentHousehold.recyclingPts >= RESTORE_COST &&
    currentHousehold.penaltyDeedsLost > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable
          style={styles.scrimPressable}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close overlay"
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.iconTitleRow}>
              <View style={styles.badgeIcon}>
                <Sparkles size={16} color="#566549" />
              </View>
              <View style={styles.titleCol}>
                <Text style={styles.title} numberOfLines={1}>Demo Date & Habits</Text>
                <Text style={styles.subtitle} numberOfLines={1}>Test scenarios for jury / demo</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close demo controls"
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <X size={20} color="#292524" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Status overview card */}
            <View style={styles.statusCard}>
              <Text style={styles.cardHeader}>Current Live State</Text>
              <View style={styles.grid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Demo Date</Text>
                  <Text style={styles.statValue}>{demoDate}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Deeds Today</Text>
                  <Text style={styles.statValue}>{todayDeedsCount} / {MAX_DEEDS_PER_DAY}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Leaf Status</Text>
                  <Text style={[styles.statValue, isLeafLocked ? styles.statValueAlert : styles.statValueGreen]}>
                    {isLeafLocked ? '🔒 Locked (Next Day)' : `${currentHousehold.leafStage.toUpperCase()} (Unlocked)`}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Leaf Stage</Text>
                  <Text style={styles.statValue}>
                    {currentHousehold.leafStage.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Monthly Deeds</Text>
                  <Text style={styles.statValue}>{currentHousehold.monthlyDeeds}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Monthly Points</Text>
                  <Text style={styles.statValue}>{currentHousehold.monthlyPoints} pts</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Recycling Pts</Text>
                  <Text style={styles.statValue}>{currentHousehold.recyclingPts}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Penalty Lost</Text>
                  <Text style={[styles.statValue, currentHousehold.penaltyDeedsLost > 0 && styles.statValueAlert]}>
                    {currentHousehold.penaltyDeedsLost} deeds
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Voting Card</Text>
                  <Text style={[styles.statValue, isVotingVisible && styles.statValueGreen]}>
                    {isVotingVisible ? 'Visible' : currentHousehold.hasVoted ? 'Voted' : 'Hidden'}
                  </Text>
                </View>
              </View>

              {penaltyNotice && (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>{penaltyNotice}</Text>
                </View>
              )}
            </View>

            {/* Section 1: Demo Date Override Presets */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Demo Date Override</Text>
              <Text style={styles.sectionDesc}>
                Set the simulated "today" to demonstrate month transitions, voting window, and penalties.
              </Text>

              <View style={styles.presetButtons}>
                {/* Oct 23 */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDemoDate('2026-10-23')}
                  style={({ pressed }) => [
                    styles.presetBtn,
                    demoDate === '2026-10-23' && styles.presetBtnActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Calendar size={15} color={demoDate === '2026-10-23' ? '#FFFFFF' : '#566549'} />
                  <View style={styles.btnTextCol}>
                    <Text
                      style={[
                        styles.presetTitle,
                        demoDate === '2026-10-23' && styles.presetTextActive,
                      ]}
                    >
                      Oct 23, 2026 (Default)
                    </Text>
                    <Text
                      style={[
                        styles.presetHint,
                        demoDate === '2026-10-23' && styles.presetHintActive,
                      ]}
                    >
                      Before Oct 27 · Vote tab hidden
                    </Text>
                  </View>
                </Pressable>

                {/* Oct 28 */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDemoDate('2026-10-28')}
                  style={({ pressed }) => [
                    styles.presetBtn,
                    demoDate === '2026-10-28' && styles.presetBtnActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Vote size={15} color={demoDate === '2026-10-28' ? '#FFFFFF' : '#566549'} />
                  <View style={styles.btnTextCol}>
                    <Text
                      style={[
                        styles.presetTitle,
                        demoDate === '2026-10-28' && styles.presetTextActive,
                      ]}
                    >
                      Oct 28, 2026 (Last 5 Days)
                    </Text>
                    <Text
                      style={[
                        styles.presetHint,
                        demoDate === '2026-10-28' && styles.presetHintActive,
                      ]}
                    >
                      Vote card visible with countdown
                    </Text>
                  </View>
                </Pressable>

                {/* Advance Next Day */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => advanceNextDay()}
                  style={({ pressed }) => [
                    styles.presetBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Calendar size={15} color="#566549" />
                  <View style={styles.btnTextCol}>
                    <Text style={styles.presetTitle}>
                      Advance Next Day (+1 Day)
                    </Text>
                    <Text style={styles.presetHint}>
                      Transition to next day: if locked with no action, drops 1 status & unlocks
                    </Text>
                  </View>
                </Pressable>

                {/* Skip Day (Oct 25) */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDemoDate('2026-10-25')}
                  style={({ pressed }) => [
                    styles.presetBtn,
                    demoDate === '2026-10-25' && styles.presetBtnActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Clock size={15} color={demoDate === '2026-10-25' ? '#FFFFFF' : '#A97A4A'} />
                  <View style={styles.btnTextCol}>
                    <Text
                      style={[
                        styles.presetTitle,
                        demoDate === '2026-10-25' && styles.presetTextActive,
                      ]}
                    >
                      Skip Day (Jump to Oct 25)
                    </Text>
                    <Text
                      style={[
                        styles.presetHint,
                        demoDate === '2026-10-25' && styles.presetHintActive,
                      ]}
                    >
                      Triggers missed-day penalty (-1 deed). Recycling points remain unaffected.
                    </Text>
                  </View>
                </Pressable>

                {/* Nov 1 */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDemoDate('2026-11-01')}
                  style={({ pressed }) => [
                    styles.presetBtn,
                    demoDate === '2026-11-01' && styles.presetBtnActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <RotateCcw size={15} color={demoDate === '2026-11-01' ? '#FFFFFF' : '#566549'} />
                  <View style={styles.btnTextCol}>
                    <Text
                      style={[
                        styles.presetTitle,
                        demoDate === '2026-11-01' && styles.presetTextActive,
                      ]}
                    >
                      Nov 1, 2026 (New Month)
                    </Text>
                    <Text
                      style={[
                        styles.presetHint,
                        demoDate === '2026-11-01' && styles.presetHintActive,
                      ]}
                    >
                      Monthly stats reset to 0 · Leaf stage Dry
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Section 2: Action Simulation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Action Simulation</Text>
              <Text style={styles.sectionDesc}>
                Simulate resident eco-actions, recycling deposits, and deed restoration.
              </Text>

              <View style={styles.actionsList}>
                {/* Complete Green Action */}
                <Pressable
                  accessibilityRole="button"
                  disabled={todayDeedsCount >= MAX_DEEDS_PER_DAY}
                  onPress={handleAction}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    todayDeedsCount >= MAX_DEEDS_PER_DAY && styles.actionBtnDisabled,
                    pressed && todayDeedsCount < MAX_DEEDS_PER_DAY && styles.pressed,
                  ]}
                >
                  <Leaf size={16} color="#FFFFFF" />
                  <View style={styles.flexOne}>
                    <Text style={styles.actionBtnTitle}>Complete green action</Text>
                    <Text style={styles.actionBtnSub}>
                      +1 deed & +{DEED_POINTS} pts (Today: {todayDeedsCount}/{MAX_DEEDS_PER_DAY})
                    </Text>
                  </View>
                </Pressable>

                {/* Sort Item */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleSort}
                  style={({ pressed }) => [styles.actionBtnSecondary, pressed && styles.pressed]}
                >
                  <Recycle size={16} color="#566549" />
                  <View style={styles.flexOne}>
                    <Text style={styles.actionBtnSecondaryTitle}>Sort an item cleanly in bin</Text>
                    <Text style={styles.actionBtnSecondarySub}>
                      +10 recycling pts & +10 monthly pts (Now: {currentHousehold.recyclingPts} pts)
                    </Text>
                  </View>
                </Pressable>

                {/* Toggle Leaf Lock State */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsLeafLocked((prev) => !prev)}
                  style={({ pressed }) => [styles.actionBtnSecondary, pressed && styles.pressed]}
                >
                  {isLeafLocked ? <Unlock size={16} color="#566549" /> : <Lock size={16} color="#D97706" />}
                  <View style={styles.flexOne}>
                    <Text style={styles.actionBtnSecondaryTitle}>
                      {isLeafLocked ? 'Unlock leaf manually' : 'Lock leaf (Test locked status)'}
                    </Text>
                    <Text style={styles.actionBtnSecondarySub}>
                      {isLeafLocked
                        ? 'Currently 🔒 Locked. Advance day without action to test -1 stage drop & unlock.'
                        : 'Currently 🔓 Unlocked. Tap to lock leaf.'}
                    </Text>
                  </View>
                </Pressable>

                {/* Restore Deed */}
                <Pressable
                  accessibilityRole="button"
                  disabled={!canRestore}
                  onPress={handleRestore}
                  style={({ pressed }) => [
                    styles.restoreBtn,
                    !canRestore && styles.restoreBtnDisabled,
                    pressed && canRestore && styles.pressed,
                  ]}
                >
                  <RotateCcw size={16} color={canRestore ? '#FFFFFF' : '#A8A29E'} />
                  <View style={styles.flexOne}>
                    <Text style={[styles.restoreBtnTitle, !canRestore && styles.restoreBtnTitleDisabled]}>
                      Restore lost deed ({RESTORE_COST} recycling pts)
                    </Text>
                    <Text style={[styles.restoreBtnSub, !canRestore && styles.restoreBtnSubDisabled]}>
                      {currentHousehold.penaltyDeedsLost === 0
                        ? 'No lost deeds to restore'
                        : currentHousehold.recyclingPts < RESTORE_COST
                        ? `${currentHousehold.recyclingPts}/${RESTORE_COST} pts needed (${currentHousehold.penaltyDeedsLost} lost)`
                        : `Recovers 1 deed, 1 stage & +${DEED_POINTS} pts (${currentHousehold.penaltyDeedsLost} lost)`}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Reset All */}
            <View style={styles.bottomRow}>
              <Pressable
                accessibilityRole="button"
                onPress={resetAll}
                style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
              >
                <RotateCcw size={14} color="#78716C" />
                <Text style={styles.resetBtnText}>Reset to Initial Demo State (Oct 23)</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(41,37,36,0.48)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scrimPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#FAF6F1',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    alignSelf: 'center',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D3D1',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  titleCol: {
    flex: 1,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E7EEE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 17,
    color: '#292524',
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 520,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 14,
    marginBottom: 16,
  },
  cardHeader: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
    color: '#566549',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'column',
    gap: 8,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#EFECE8',
  },
  statLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
  },
  statValue: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 13.5,
    color: '#292524',
  },
  statValueAlert: {
    color: '#B91C1C',
  },
  statValueGreen: {
    color: '#566549',
  },
  noticeBox: {
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noticeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#92400E',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 15,
    color: '#292524',
    marginBottom: 3,
  },
  sectionDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#78716C',
    marginBottom: 10,
  },
  presetButtons: {
    gap: 8,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 16,
    padding: 12,
  },
  presetBtnActive: {
    backgroundColor: '#566549',
    borderColor: '#566549',
  },
  btnTextCol: {
    flex: 1,
  },
  presetTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  presetHint: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#78716C',
    marginTop: 1,
  },
  presetHintActive: {
    color: '#E7EEE2',
  },
  actionsList: {
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#566549',
    borderRadius: 16,
    padding: 12,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  actionBtnSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#E7EEE2',
    marginTop: 1,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5D7',
    borderRadius: 16,
    padding: 12,
  },
  actionBtnSecondaryTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
  },
  actionBtnSecondarySub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#566549',
    marginTop: 1,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#829A78',
    borderRadius: 16,
    padding: 12,
  },
  restoreBtnDisabled: {
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  restoreBtnTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  restoreBtnTitleDisabled: {
    color: '#A8A29E',
  },
  restoreBtnSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#E7EEE2',
    marginTop: 1,
  },
  restoreBtnSubDisabled: {
    color: '#78716C',
  },
  bottomRow: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resetBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#78716C',
  },
  flexOne: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
