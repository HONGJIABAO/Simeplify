import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Clock3,
  CloudOff,
  Leaf,
  Mail,
  Recycle,
  RefreshCw,
  ReceiptText,
  Sparkles,
  Trophy,
  Vote,
  X,
  Zap,
} from 'lucide-react-native';

import type { CommunityReward, CommunityState } from '@/lib/services/communityCore';

type CommunityRoute = '/(tabs)/bin' | '/(tabs)/scanner' | '/(tabs)/simulator';

interface CommunityDashboardProps {
  state: CommunityState;
  votePending?: boolean;
  onVote: (rewardId: string) => Promise<void> | void;
  onAction: (route: CommunityRoute) => void;
}

const ACTIONS: Array<{
  id: 'recycle' | 'bill' | 'simulator';
  title: string;
  description: string;
  meta: string;
  action: string;
  route: CommunityRoute;
}> = [
  {
    id: 'recycle',
    title: 'Recycle 1 item',
    description: 'Scan an item and sort it into the right bin.',
    meta: '~30s',
    action: 'Go to Bin',
    route: '/(tabs)/bin',
  },
  {
    id: 'bill',
    title: 'Upload a lower electricity bill',
    description: "Upload this month's bill and compare it with your estimate.",
    meta: '1 bill',
    action: 'Go to Scanner',
    route: '/(tabs)/scanner',
  },
  {
    id: 'simulator',
    title: 'Try an energy-saving action',
    description: 'Review your routine and find an appliance you can reduce.',
    meta: '~2 min',
    action: 'Go to Simulator',
    route: '/(tabs)/simulator',
  },
];

function monthLabel(value: string): string {
  return new Intl.DateTimeFormat('en-MY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(`${value}T00:00:00+08:00`));
}

function activityLabel(type: string): string {
  if (type === 'recycle') return 'Recycled an item';
  if (type === 'upload_lower_bill') return 'Uploaded a lower electricity bill';
  return 'Completed a Simulator action';
}

function completedForAction(id: (typeof ACTIONS)[number]['id'], state: CommunityState): boolean {
  if (id === 'recycle') return state.deeds.recycledToday;
  if (id === 'bill') return state.deeds.uploadedLowerBillThisMonth;
  return state.deeds.simulatorActionToday;
}

export function CommunityDashboard({
  state,
  votePending = false,
  onVote,
  onAction,
}: CommunityDashboardProps) {
  const [ballotOpen, setBallotOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const deeds = state.deeds.completedToday;
  const stage = deeds === 0 ? 'Dry' : deeds === 1 ? 'Healthy' : 'Lush';
  const month = monthLabel(state.currentVotingMonth);
  const selected = useMemo(
    () => state.rewards.find((reward) => reward.id === selectedId) ?? null,
    [selectedId, state.rewards]
  );

  const closeBallot = () => {
    if (!votePending) {
      setBallotOpen(false);
      setSelectedId(null);
      setConfirming(false);
    }
  };

  const submitVote = async () => {
    if (!selected) return;
    try {
      await onVote(selected.id);
      setBallotOpen(false);
      setSelectedId(null);
      setConfirming(false);
    } catch {
      // The screen owns the error toast; keep the ballot open so the choice is not lost.
    }
  };

  return (
    <>
      <View style={styles.monthRow}>
        <View style={styles.iconTextRow}>
          <Leaf size={18} color="#566549" />
          <Text style={styles.eyebrow}>Your household</Text>
        </View>
        <Text style={styles.monthText}>{month}</Text>
      </View>

      <View style={styles.leafCard}>
        <View style={styles.leafDial}>
          <Leaf size={74} color={deeds === 0 ? '#A97A4A' : '#566549'} strokeWidth={1.4} />
          <View style={styles.deedBadge}>
            <Leaf size={13} color="#FFFFFF" />
            <Text style={styles.deedBadgeText}>{deeds} / 3 deeds</Text>
          </View>
        </View>
        <View style={styles.stagePill}>
          <View style={styles.stageDot} />
          <Text style={styles.stagePillText}>{stage} stage · {deeds} today</Text>
        </View>
        <Text style={styles.heroTitle}>Living Leaf is {stage === 'Dry' ? 'resting' : 'thriving'}</Text>
        <Text style={styles.heroBody}>
          {deeds === 0
            ? 'Complete a green deed today to help your Living Leaf grow.'
            : deeds === 1
              ? 'Complete one more green deed today to reach the Lush stage.'
              : 'Your household has reached today’s Lush stage.'}
        </Text>
        <View style={styles.stageRow}>
          {['Dry (0)', 'Healthy (1)', 'Lush (2–3)'].map((label, index) => {
            const active = index === (deeds === 0 ? 0 : deeds === 1 ? 1 : 2);
            return (
              <View key={label} style={[styles.stageStep, active && styles.stageStepActive]}>
                <View style={[styles.stageStepDot, active && styles.stageStepDotActive]} />
                <Text style={[styles.stageStepText, active && styles.stageStepTextActive]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconTextRow}>
            <Sparkles size={18} color="#566549" />
            <Text style={styles.sectionTitle}>This month</Text>
          </View>
          <View style={styles.softPill}>
            <Text style={styles.softPillText}>{state.points.currentMonth} pts</Text>
          </View>
        </View>
        <Text style={styles.pointsHero}>{state.points.currentMonth}</Text>
        <Text style={styles.pointsUnit}>household points this month</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryTile}>
            <Recycle size={18} color="#566549" />
            <Text style={styles.summaryValue}>{state.points.recycling}</Text>
            <Text style={styles.summaryLabel}>Recycling</Text>
          </View>
          <View style={styles.summaryTile}>
            <Zap size={18} color="#A97A4A" />
            <Text style={styles.summaryValue}>{state.points.energy}</Text>
            <Text style={styles.summaryLabel}>Energy</Text>
          </View>
          <View style={styles.summaryTile}>
            <Trophy size={18} color="#566549" />
            <Text style={styles.summaryValue}>{state.points.allTime}</Text>
            <Text style={styles.summaryLabel}>All time</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconTextRow}>
            <Vote size={18} color="#566549" />
            <Text style={styles.sectionTitle}>Monthly reward</Text>
          </View>
          <View style={styles.softPill}>
            <Text style={styles.softPillText}>{state.vote ? 'Voted' : 'Open'}</Text>
          </View>
        </View>
        {state.rewards.length === 0 ? (
          <View style={styles.emptyInline}>
            <Mail size={22} color="#78716C" />
            <Text style={styles.emptyInlineText}>No rewards have been seeded for {month}.</Text>
          </View>
        ) : state.vote && state.selectedReward ? (
          <View style={styles.votedReward}>
            <View style={styles.checkCircle}><Check size={18} color="#FFFFFF" /></View>
            <View style={styles.flexOne}>
              <Text style={styles.rewardTitle}>{state.selectedReward.title}</Text>
              <Text style={styles.rewardDescription}>{state.selectedReward.description}</Text>
            </View>
            <Text style={styles.votedText}>Voted</Text>
          </View>
        ) : (
          <>
            <Text style={styles.cardBody}>Choose the reward your household wants this month. The vote is final.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setBallotOpen(true)}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Mail size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Open ballot</Text>
            </Pressable>
          </>
        )}
      </View>

      {state.lastMonthUnlockedReward && (
        <View style={styles.unlockedCard}>
          <View style={styles.iconCircle}><Trophy size={20} color="#566549" /></View>
          <View style={styles.flexOne}>
            <Text style={styles.statusLabel}>Last month · Unlocked</Text>
            <Text style={styles.rewardTitle}>{state.lastMonthUnlockedReward.title}</Text>
            <Text style={styles.rewardDescription}>{state.lastMonthUnlockedReward.description}</Text>
          </View>
        </View>
      )}

      <View style={styles.sectionHeaderOutside}>
        <Text style={styles.sectionTitle}>Recommended for you</Text>
        <View style={styles.softPill}><Text style={styles.softPillText}>{ACTIONS.filter((item) => !completedForAction(item.id, state)).length} to do</Text></View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
        {ACTIONS.map((item) => {
          const done = completedForAction(item.id, state);
          const Icon = item.id === 'recycle' ? Recycle : item.id === 'bill' ? ReceiptText : Zap;
          return (
            <View key={item.id} style={styles.actionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconCircle}><Icon size={20} color="#566549" /></View>
                <View style={[styles.statusPill, done && styles.donePill]}>
                  {done ? <Check size={13} color="#566549" /> : <Clock3 size={13} color="#78716C" />}
                  <Text style={styles.statusPillText}>{done ? 'Done' : 'To do'}</Text>
                </View>
              </View>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionBody}>{item.description}</Text>
              <View style={styles.actionFooter}>
                <Text style={styles.metaText}>{item.meta}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onAction(item.route)}
                  style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
                >
                  <Text style={styles.linkButtonText}>{item.action}</Text>
                  <ChevronRight size={15} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.card}>
        <View style={styles.iconTextRow}>
          <Clock3 size={18} color="#566549" />
          <Text style={styles.sectionTitle}>Recent activity</Text>
        </View>
        {state.deeds.recent.length === 0 ? (
          <Text style={styles.cardBody}>No green deeds yet. Your completed actions will appear here.</Text>
        ) : (
          state.deeds.recent.slice(0, 5).map((deed) => (
            <View key={deed.id} style={styles.activityRow}>
              <View style={styles.checkCircleSmall}><Check size={13} color="#FFFFFF" /></View>
              <View style={styles.flexOne}>
                <Text style={styles.activityTitle}>{activityLabel(deed.task_type)}</Text>
                <Text style={styles.metaText}>{deed.deed_date}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal visible={ballotOpen} transparent animationType="fade" onRequestClose={closeBallot}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sectionHeader}>
              <View style={styles.softPill}><Text style={styles.softPillText}>Official ballot</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close ballot" onPress={closeBallot} style={styles.closeButton}>
                <X size={22} color="#292524" />
              </Pressable>
            </View>
            <Text style={styles.sheetTitle}>This month’s community vote</Text>
            <Text style={styles.cardBody}>Choose one reward. One vote per household, and a submitted vote cannot be changed.</Text>
            <ScrollView style={styles.rewardList} showsVerticalScrollIndicator={false}>
              {state.rewards.map((reward) => {
                const chosen = selectedId === reward.id;
                const voted = state.vote?.reward_id === reward.id;
                return (
                  <Pressable
                    key={reward.id}
                    disabled={Boolean(state.vote) || votePending}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: chosen || voted, disabled: Boolean(state.vote) }}
                    onPress={() => { setSelectedId(reward.id); setConfirming(false); }}
                    style={[styles.rewardOption, (chosen || voted) && styles.rewardOptionSelected]}
                  >
                    <View style={[styles.radio, (chosen || voted) && styles.radioSelected]}>
                      {(chosen || voted) && <Check size={14} color="#FFFFFF" />}
                    </View>
                    <View style={styles.flexOne}>
                      <Text style={styles.rewardTitle}>{reward.title}</Text>
                      <Text style={styles.rewardDescription}>{reward.description}</Text>
                    </View>
                    <Text style={styles.optionState}>{voted ? 'Voted' : chosen ? 'Selected' : 'Vote'}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {confirming && selected && (
              <View style={styles.confirmBox}>
                <AlertCircle size={18} color="#8A5F36" />
                <Text style={styles.confirmText}>Confirm “{selected.title}”? Your household cannot change this vote later.</Text>
              </View>
            )}
            {!state.vote && (
              <Pressable
                disabled={!selected || votePending}
                accessibilityRole="button"
                onPress={() => confirming ? void submitVote() : setConfirming(true)}
                style={[styles.primaryButton, (!selected || votePending) && styles.buttonDisabled]}
              >
                {votePending ? <ActivityIndicator color="#FFFFFF" /> : <Check size={18} color="#FFFFFF" />}
                <Text style={styles.primaryButtonText}>{confirming ? 'Confirm final vote' : 'Review final vote'}</Text>
              </Pressable>
            )}
            <Pressable accessibilityRole="button" onPress={closeBallot} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{state.vote ? 'Done' : 'Later'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function CommunityLoading() {
  return (
    <View style={styles.loadingWrap} accessibilityLabel="Loading Community">
      <View style={[styles.skeleton, { height: 26, width: '52%' }]} />
      <View style={[styles.skeleton, { height: 285 }]} />
      <View style={[styles.skeleton, { height: 210 }]} />
      <View style={[styles.skeleton, { height: 150 }]} />
    </View>
  );
}

export function CommunityStatus({
  offline,
  message,
  onRetry,
}: {
  offline?: boolean;
  message: string;
  onRetry: () => void;
}) {
  const Icon = offline ? CloudOff : AlertCircle;
  return (
    <View style={styles.statusCard}>
      <View style={styles.statusIcon}><Icon size={27} color="#8A5F36" /></View>
      <Text style={styles.statusTitle}>{offline ? 'You’re offline' : 'Community could not load'}</Text>
      <Text style={styles.statusBody}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
        <RefreshCw size={17} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  iconTextRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 14, color: '#566549' },
  monthText: { fontFamily: 'Lora_600SemiBold', fontSize: 15, color: '#292524' },
  leafCard: { alignItems: 'center', backgroundColor: '#F1F5EE', borderRadius: 28, padding: 22, marginBottom: 16, borderWidth: 1, borderColor: '#DCE5D7' },
  leafDial: { width: 166, height: 166, borderRadius: 83, backgroundColor: '#FFFFFF', borderWidth: 8, borderColor: '#D8E2D2', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  deedBadge: { position: 'absolute', bottom: -2, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#566549', borderRadius: 999, paddingHorizontal: 12, minHeight: 30 },
  deedBadgeText: { fontFamily: 'SourceSans3_600SemiBold', color: '#FFFFFF', fontSize: 12 },
  stagePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 12, minHeight: 30 },
  stageDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#829A78' },
  stagePillText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#566549' },
  heroTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 23, color: '#292524', marginTop: 12, textAlign: 'center' },
  heroBody: { fontFamily: 'SourceSans3_400Regular', fontSize: 14, lineHeight: 20, color: '#57534E', textAlign: 'center', marginTop: 6 },
  stageRow: { flexDirection: 'row', gap: 6, marginTop: 16, width: '100%' },
  stageStep: { flex: 1, minHeight: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, flexDirection: 'row', gap: 5 },
  stageStepActive: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C8D5C1' },
  stageStepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A8A29E' },
  stageStepDotActive: { backgroundColor: '#566549' },
  stageStepText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 11, color: '#78716C' },
  stageStepTextActive: { color: '#566549' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#E7E5E4', padding: 18, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionHeaderOutside: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 },
  sectionTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 18, color: '#292524' },
  softPill: { backgroundColor: '#E7EEE2', borderRadius: 999, minHeight: 28, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  softPillText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#566549' },
  pointsHero: { fontFamily: 'Lora_600SemiBold', fontSize: 42, color: '#292524', marginTop: 18 },
  pointsUnit: { fontFamily: 'SourceSans3_400Regular', fontSize: 13, color: '#78716C', marginTop: -4, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryTile: { flex: 1, backgroundColor: '#FAF8F4', borderRadius: 16, padding: 11, minHeight: 92 },
  summaryValue: { fontFamily: 'Lora_600SemiBold', fontSize: 20, color: '#292524', marginTop: 5 },
  summaryLabel: { fontFamily: 'SourceSans3_400Regular', fontSize: 11.5, color: '#78716C' },
  cardBody: { fontFamily: 'SourceSans3_400Regular', fontSize: 14, lineHeight: 20, color: '#57534E', marginTop: 10, marginBottom: 14 },
  primaryButton: { minHeight: 50, borderRadius: 999, backgroundColor: '#566549', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  primaryButtonText: { fontFamily: 'SourceSans3_600SemiBold', color: '#FFFFFF', fontSize: 15 },
  buttonDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  votedReward: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 14, backgroundColor: '#EEF3EA', borderRadius: 18, padding: 14 },
  checkCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#566549', alignItems: 'center', justifyContent: 'center' },
  rewardTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 15, lineHeight: 20, color: '#292524' },
  rewardDescription: { fontFamily: 'SourceSans3_400Regular', fontSize: 12.5, lineHeight: 17, color: '#57534E', marginTop: 2 },
  votedText: { fontFamily: 'SourceSans3_700Bold', fontSize: 12, color: '#566549' },
  emptyInline: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F7F5F2', borderRadius: 16, padding: 14, marginTop: 14 },
  emptyInlineText: { flex: 1, fontFamily: 'SourceSans3_400Regular', fontSize: 13.5, color: '#57534E' },
  unlockedCard: { backgroundColor: '#F6EAD8', borderRadius: 24, borderWidth: 1, borderColor: '#E7CFB2', padding: 16, marginBottom: 16, flexDirection: 'row', gap: 12 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E7EEE2', alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontFamily: 'SourceSans3_700Bold', fontSize: 11.5, color: '#8A5F36', marginBottom: 3 },
  actionsRow: { gap: 12, paddingBottom: 16, paddingRight: 20 },
  actionCard: { width: 285, minHeight: 220, backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: '#E7E5E4', padding: 16 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F0EE', borderRadius: 999, minHeight: 28, paddingHorizontal: 9 },
  donePill: { backgroundColor: '#E7EEE2' },
  statusPillText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 11.5, color: '#57534E' },
  actionTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 18, color: '#292524', marginTop: 14 },
  actionBody: { fontFamily: 'SourceSans3_400Regular', fontSize: 13.5, lineHeight: 19, color: '#57534E', marginTop: 5, flex: 1 },
  actionFooter: { borderTopWidth: 1, borderTopColor: '#EFECE8', paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, color: '#78716C' },
  linkButton: { minHeight: 48, borderRadius: 999, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#566549' },
  linkButtonText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12.5, color: '#FFFFFF' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#EFECE8', paddingTop: 12, marginTop: 12 },
  checkCircleSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#829A78', alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 13.5, color: '#292524' },
  scrim: { flex: 1, backgroundColor: 'rgba(41,37,36,0.42)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', backgroundColor: '#FAF6F1', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#D6D3D1', marginBottom: 14 },
  closeButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 25, color: '#292524', marginTop: 8 },
  rewardList: { maxHeight: 330, marginBottom: 12 },
  rewardOption: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 20, borderWidth: 1, borderColor: '#E7E5E4', backgroundColor: '#FFFFFF', padding: 14, marginBottom: 9 },
  rewardOptionSelected: { backgroundColor: '#E7EEE2', borderColor: '#829A78' },
  radio: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#A8A29E', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { backgroundColor: '#566549', borderColor: '#566549' },
  optionState: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#566549' },
  confirmBox: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: '#F6EAD8', borderRadius: 16, padding: 12, marginBottom: 10 },
  confirmText: { flex: 1, fontFamily: 'SourceSans3_600SemiBold', fontSize: 13, lineHeight: 18, color: '#6B4B2D' },
  secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  secondaryButtonText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 14, color: '#57534E' },
  loadingWrap: { gap: 16, padding: 20 },
  skeleton: { backgroundColor: '#E7E5E4', borderRadius: 22 },
  statusCard: { margin: 20, marginTop: 60, backgroundColor: '#FFFFFF', borderRadius: 26, borderWidth: 1, borderColor: '#E7E5E4', padding: 24, alignItems: 'center' },
  statusIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#F6EAD8', alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 21, color: '#292524', marginTop: 14 },
  statusBody: { fontFamily: 'SourceSans3_400Regular', fontSize: 14, lineHeight: 20, color: '#57534E', textAlign: 'center', marginTop: 7, marginBottom: 16 },
  retryButton: { minHeight: 48, borderRadius: 999, backgroundColor: '#566549', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
});

