import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AlertCircle,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock3,
  CloudOff,
  Coins,
  Leaf,
  Mail,
  ReceiptText,
  Recycle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trophy,
  Vote,
  X,
  Zap,
} from 'lucide-react-native';

import { useToast } from '@/components/Toast';
import { useEcoHabit } from '@/lib/ecoHabitContext';
import { RESTORE_COST, DEED_POINTS, MAX_DEEDS_PER_DAY } from '@/features/community/config';
import type { LeafStage } from '@/lib/services/mockEcoData';
import type { CommunityState } from '@/lib/services/communityCore';

type CommunityRoute = '/(tabs)/bin' | '/(tabs)/scanner' | '/(tabs)/simulator';

interface CommunityDashboardProps {
  state: CommunityState;
  votePending?: boolean;
  onVote: (rewardId: string) => Promise<void> | void;
  onAction: (route: CommunityRoute) => void;
  wrapUpNode?: React.ReactNode;
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

function monthLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat('en-MY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dt);
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

const STAGE_THEMES = {
  dry: {
    cardBg: '#F7F3ED',
    cardBorder: '#E6DDD0',
    dialBg: '#FAF7F2',
    dialBorder: '#DFD4C4',
    leafColor: '#A86E38',
    deedBadgeBg: '#6B4423',
    deedBadgeText: '#FFFFFF',
    stagePillBg: '#FFFFFF',
    stagePillBorder: '#E6DDD0',
    stageDot: '#A86E38',
    stagePillText: '#6B4423',
    heroTitle: 'Living Leaf is resting',
    heroBody: 'Complete a green deed today to help your Living Leaf grow.',
    stepActiveBg: '#FFFFFF',
    stepActiveBorder: '#DFD4C4',
    stepActiveDot: '#6B4423',
    stepActiveText: '#6B4423',
    reminderBg: '#FAF5EE',
    reminderBorder: '#E5D8C8',
    reminderIcon: '#A86E38',
    reminderText: '#6B4423',
  },
  healthy: {
    cardBg: '#F1F5EE',
    cardBorder: '#DCE5D7',
    dialBg: '#FFFFFF',
    dialBorder: '#D8E2D2',
    leafColor: '#566549',
    deedBadgeBg: '#566549',
    deedBadgeText: '#FFFFFF',
    stagePillBg: '#FFFFFF',
    stagePillBorder: '#DCE5D7',
    stageDot: '#829A78',
    stagePillText: '#566549',
    heroTitle: 'Living Leaf is thriving',
    heroBody: 'Complete one more green deed today to reach the Lush stage.',
    stepActiveBg: '#FFFFFF',
    stepActiveBorder: '#C8D5C1',
    stepActiveDot: '#566549',
    stepActiveText: '#566549',
    reminderBg: '#FAF8F4',
    reminderBorder: '#E7E5E4',
    reminderIcon: '#566549',
    reminderText: '#57534E',
  },
  lush: {
    cardBg: '#E7EFE3',
    cardBorder: '#BDD2B4',
    dialBg: '#FFFFFF',
    dialBorder: '#B2CBA8',
    leafColor: '#2F5734',
    deedBadgeBg: '#25472A',
    deedBadgeText: '#FFFFFF',
    stagePillBg: '#FFFFFF',
    stagePillBorder: '#BDD2B4',
    stageDot: '#3F7647',
    stagePillText: '#25472A',
    heroTitle: 'Living Leaf is thriving',
    heroBody: 'Your household has reached today’s Lush stage.',
    stepActiveBg: '#FFFFFF',
    stepActiveBorder: '#A9C69E',
    stepActiveDot: '#25472A',
    stepActiveText: '#25472A',
    reminderBg: '#EEF6EC',
    reminderBorder: '#BDD2B4',
    reminderIcon: '#2F5734',
    reminderText: '#25472A',
  },
};

export function CommunityDashboard({
  state,
  votePending = false,
  onVote,
  onAction,
  wrapUpNode,
}: CommunityDashboardProps) {
  const { showToast } = useToast();
  const {
    demoDate,
    todayDeedsCount,
    currentHousehold,
    penaltyNotice,
    setDemoDate,
    advanceNextDay,
    completeGreenAction,
    sortRecycleItem,
    quickRecyclePts,
    restoreDeed,
    castVote,
    resetVote,
    toggleCommunityRate,
    isCommunityRateAbove60,
    isVotingVisible,
    countdown,
    resetAll,
  } = useEcoHabit();

  const [showDemoControls, setShowDemoControls] = useState(false);
  const [ballotOpen, setBallotOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [votePromptVisible, setVotePromptVisible] = useState(false);
  const [hasPromptedThisMonth, setHasPromptedThisMonth] = useState<Record<string, boolean>>({});

  const currentMonthKey = demoDate.slice(0, 7);
  const formattedMonth = monthLabel(demoDate);

  // One-time prompt when entering vote window
  useEffect(() => {
    if (isVotingVisible && !hasPromptedThisMonth[currentMonthKey]) {
      setVotePromptVisible(true);
      setHasPromptedThisMonth((prev) => ({ ...prev, [currentMonthKey]: true }));
    }
  }, [isVotingVisible, currentMonthKey, hasPromptedThisMonth]);

  const stageKey: LeafStage =
    currentHousehold.leafStage || (todayDeedsCount === 0 ? 'dry' : todayDeedsCount === 1 ? 'healthy' : 'lush');
  const stageName = stageKey.charAt(0).toUpperCase() + stageKey.slice(1);
  const stageTheme = STAGE_THEMES[stageKey] || STAGE_THEMES.healthy;

  const rewardOptions = useMemo(() => {
    if (state.rewards && state.rewards.length > 0) {
      return state.rewards;
    }
    return [
      {
        id: 'dev-reward-tree',
        title: 'Plant a tree in our community',
        description: 'Adds native shaded greenery to the parkway',
        voting_month: `${currentMonthKey}-01`,
        target_points: null,
        is_unlocked: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'dev-reward-food',
        title: '50% off organic food at Sime Darby Mall',
        description: 'Redeemable voucher for seasonal fresh produce',
        voting_month: `${currentMonthKey}-01`,
        target_points: null,
        is_unlocked: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'dev-reward-tools',
        title: 'Community tool & seed library',
        description: 'Free borrowing station for garden equipment',
        voting_month: `${currentMonthKey}-01`,
        target_points: null,
        is_unlocked: false,
        created_at: new Date().toISOString(),
      },
    ];
  }, [state.rewards, currentMonthKey]);

  const selected = useMemo(
    () => rewardOptions.find((reward) => reward.id === selectedId) ?? null,
    [selectedId, rewardOptions]
  );

  const closeBallot = () => {
    if (!votePending) {
      setBallotOpen(false);
      setSelectedId(null);
    }
  };

  const submitVote = async () => {
    if (!selected) return;
    try {
      await onVote(selected.id);
    } catch {
      // Handled in demo/offline mode
    }
    castVote(selected.id);
    setBallotOpen(false);
    setSelectedId(null);
    showToast('Thanks for voting', 'success');
  };

  const handleResetVote = () => {
    resetVote();
    setHasPromptedThisMonth((prev) => ({ ...prev, [currentMonthKey]: false }));
    showToast('Vote reset for ' + formattedMonth, 'info');
  };

  return (
    <>
      {/* ── Top Header Row with Date Chip & Calendar-Check Demo Toggle ───────── */}
      <View style={styles.monthRow}>
        <View style={styles.iconTextRow}>
          <Leaf size={18} color="#566549" />
          <Text style={styles.eyebrow}>Your household · {formattedMonth}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle demo controls"
          onPress={() => setShowDemoControls((prev) => !prev)}
          style={({ pressed }) => [
            styles.dateChip,
            showDemoControls && styles.dateChipActive,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.dateChipText, showDemoControls && styles.dateChipTextActive]}>
            {formatDisplayDate(demoDate)}
          </Text>
          <CalendarCheck
            size={15}
            color={showDemoControls ? '#FFFFFF' : '#566549'}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      {/* ── Inline Demo Controls Panel ──────────────────────────────────────── */}
      {showDemoControls && (
        <View style={styles.demoControlsCard}>
          <View style={styles.demoControlsTop}>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>DEMO CONTROLS</Text>
            </View>
            <Text style={styles.demoReadoutText} numberOfLines={1}>
              {demoDate} · {todayDeedsCount}/2 deeds today · {stageName.toUpperCase()} · Vote card {isVotingVisible ? 'visible' : currentHousehold.hasVoted ? 'voted' : 'hidden'}
            </Text>
          </View>

          <Text style={styles.demoGroupTitle}>Date jump:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.demoScrollRow}
          >
            {[
              { date: '2026-10-23', label: 'Oct 23' },
              { date: '2026-10-26', label: 'Oct 26' },
              { date: '2026-10-27', label: 'Oct 27 – vote opens' },
              { date: '2026-10-28', label: 'Oct 28' },
              { date: '2026-10-31', label: 'Oct 31' },
              { date: '2026-11-01', label: 'Nov 1 – new month' },
            ].map((item) => (
              <Pressable
                key={item.date}
                onPress={() => setDemoDate(item.date)}
                style={[
                  styles.demoPill,
                  demoDate === item.date && styles.demoPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.demoPillText,
                    demoDate === item.date && styles.demoPillTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.demoGroupTitle}>Habit actions & overrides:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.demoScrollRow}
          >
            <Pressable
              onPress={() => advanceNextDay()}
              style={[styles.demoActionBtn, styles.demoNextDayBtn]}
            >
              <RotateCcw size={12} color="#FFFFFF" />
              <Text style={styles.demoNextDayBtnText}>Next day</Text>
            </Pressable>

            <Pressable
              disabled={todayDeedsCount >= MAX_DEEDS_PER_DAY}
              onPress={() => completeGreenAction()}
              style={[
                styles.demoActionBtn,
                todayDeedsCount >= MAX_DEEDS_PER_DAY && styles.demoActionBtnDisabled,
              ]}
            >
              <Leaf size={12} color={todayDeedsCount >= MAX_DEEDS_PER_DAY ? '#A8A29E' : '#566549'} />
              <Text
                style={[
                  styles.demoActionBtnText,
                  todayDeedsCount >= MAX_DEEDS_PER_DAY && styles.demoActionBtnTextDisabled,
                ]}
              >
                +1 green action
              </Text>
            </Pressable>

            <Pressable
              onPress={() => sortRecycleItem()}
              style={styles.demoActionBtn}
            >
              <Recycle size={12} color="#566549" />
              <Text style={styles.demoActionBtnText}>Sort item +10 recycle pts</Text>
            </Pressable>

            <Pressable
              onPress={() => quickRecyclePts(200)}
              style={styles.demoActionBtn}
            >
              <Sparkles size={12} color="#566549" />
              <Text style={styles.demoActionBtnText}>Recycle +200 pts (quick)</Text>
            </Pressable>

            <Pressable
              onPress={handleResetVote}
              style={styles.demoActionBtn}
            >
              <Vote size={12} color="#566549" />
              <Text style={styles.demoActionBtnText}>Reset vote</Text>
            </Pressable>

            <Pressable
              onPress={() => toggleCommunityRate()}
              style={styles.demoActionBtn}
            >
              <Text style={styles.demoActionBtnText}>
                Community rate: {isCommunityRateAbove60 ? 'above 60%' : 'below 60%'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => resetAll()}
              style={[styles.demoActionBtn, styles.demoResetBtn]}
            >
              <RotateCcw size={12} color="#B91C1C" />
              <Text style={styles.demoResetBtnText}>Reset demo</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* ── 2. Voting Card (Pinned at the very top, above Leaf Card) ─────────── */}
      {isVotingVisible && (
        <View style={styles.voteCard}>
          <View style={styles.voteCardHeader}>
            <View style={styles.voteIconBadge}>
              <Vote size={20} color="#8A5F36" />
            </View>
            <View style={styles.flexOne}>
              <Text style={styles.voteCardTitle}>Community vote is open</Text>
              <Text style={styles.voteCardSubtitle}>Choose next month's community reward</Text>
            </View>
          </View>

          <View style={styles.voteCountdownRow}>
            <Clock3 size={14} color="#8A5F36" />
            <Text style={styles.voteCountdownText}>{countdown.formatted} remaining</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vote now"
            onPress={() => setBallotOpen(true)}
            style={({ pressed }) => [styles.votePrimaryButton, pressed && styles.pressed]}
          >
            <Vote size={17} color="#FFFFFF" />
            <Text style={styles.votePrimaryButtonText}>Vote now</Text>
          </Pressable>
        </View>
      )}

      {/* ── 3. Living Leaf Card ──────────────────────────────────────────────── */}
      <View
        style={[
          styles.leafCard,
          {
            backgroundColor: stageTheme.cardBg,
            borderColor: stageTheme.cardBorder,
          },
        ]}
      >
        <View
          style={[
            styles.leafDial,
            {
              backgroundColor: stageTheme.dialBg,
              borderColor: stageTheme.dialBorder,
            },
          ]}
        >
          <Leaf size={74} color={stageTheme.leafColor} strokeWidth={1.4} />
          <View
            style={[
              styles.deedBadge,
              {
                backgroundColor: stageTheme.deedBadgeBg,
              },
            ]}
          >
            <Leaf size={13} color={stageTheme.deedBadgeText} />
            <Text style={[styles.deedBadgeText, { color: stageTheme.deedBadgeText }]}>
              {todayDeedsCount} / 2 deeds today
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.stagePill,
            {
              backgroundColor: stageTheme.stagePillBg,
              borderColor: stageTheme.stagePillBorder,
            },
          ]}
        >
          <View style={[styles.stageDot, { backgroundColor: stageTheme.stageDot }]} />
          <Text style={[styles.stagePillText, { color: stageTheme.stagePillText }]}>
            {stageName} stage · {todayDeedsCount} today
          </Text>
        </View>

        <Text style={styles.heroTitle}>{stageTheme.heroTitle}</Text>
        <Text style={styles.heroBody}>{stageTheme.heroBody}</Text>

        <View style={styles.stageRow}>
          {['Dry (0)', 'Healthy (1)', 'Lush (2)'].map((label, index) => {
            const active =
              index === (stageKey === 'dry' ? 0 : stageKey === 'healthy' ? 1 : 2);
            return (
              <View
                key={label}
                style={[
                  styles.stageStep,
                  active && [
                    styles.stageStepActive,
                    {
                      backgroundColor: stageTheme.stepActiveBg,
                      borderColor: stageTheme.stepActiveBorder,
                    },
                  ],
                ]}
              >
                <View
                  style={[
                    styles.stageStepDot,
                    active && [
                      styles.stageStepDotActive,
                      { backgroundColor: stageTheme.stepActiveDot },
                    ],
                  ]}
                />
                <Text
                  style={[
                    styles.stageStepText,
                    active && [
                      styles.stageStepTextActive,
                      { color: stageTheme.stepActiveText },
                    ],
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Reminder Box */}
        <View
          style={[
            styles.reminderBox,
            {
              backgroundColor: stageTheme.reminderBg,
              borderColor: stageTheme.reminderBorder,
            },
          ]}
        >
          <Leaf size={13} color={stageTheme.reminderIcon} />
          <Text style={[styles.reminderText, { color: stageTheme.reminderText }]}>
            Aim for at least 1 green deed every day to keep your leaf thriving and prevent missed-day penalties.
          </Text>
        </View>

        {/* Missed-day penalty notice */}
        {penaltyNotice && (
          <View style={styles.penaltyNoticeCard}>
            <AlertCircle size={15} color="#92400E" />
            <Text style={styles.penaltyNoticeText}>{penaltyNotice}</Text>
          </View>
        )}
      </View>

      {/* ── 4. "This month" Card Redesign ────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconTextRow}>
            <Sparkles size={18} color="#566549" />
            <Text style={styles.sectionTitle}>This month</Text>
          </View>
          <View style={styles.softPill}>
            <Text style={styles.softPillText}>{currentHousehold.monthlyDeeds} / 30 deeds</Text>
          </View>
        </View>

        {/* Big Number: User's monthly deeds */}
        <Text style={styles.pointsHero}>{currentHousehold.monthlyDeeds}</Text>
        <Text style={styles.pointsUnit}>deeds this month</Text>

        {/* Three tiles: Recycling pts | Energy saved | Estimated saved */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryTile}>
            <Recycle size={18} color="#566549" />
            <Text style={styles.summaryValue}>{currentHousehold.recyclingPts}</Text>
            <Text style={styles.summaryLabel}>Recycling pts</Text>
          </View>
          <View style={styles.summaryTile}>
            <Zap size={18} color="#A97A4A" />
            <Text style={styles.summaryValue}>{currentHousehold.energySaved} kWh</Text>
            <Text style={styles.summaryLabel}>Energy saved</Text>
          </View>
          <View style={styles.summaryTile}>
            <Coins size={18} color="#566549" />
            <Text style={styles.summaryValue}>
              RM {Math.round(currentHousehold.energySaved * 0.43)}
            </Text>
            <Text style={styles.summaryLabel}>Estimated saved</Text>
          </View>
        </View>

        {/* Restore deed button */}
        <View style={styles.restoreBox}>
          {currentHousehold.penaltyDeedsLost === 0 ? (
            <View style={styles.restoreDisabledBtn}>
              <Text style={styles.restoreDisabledText}>No deeds to restore</Text>
            </View>
          ) : currentHousehold.recyclingPts < RESTORE_COST ? (
            <View style={styles.restoreDisabledBtn}>
              <Text style={styles.restoreDisabledText}>
                {currentHousehold.recyclingPts} / {RESTORE_COST} pts to unlock restore ({currentHousehold.penaltyDeedsLost} lost)
              </Text>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Restore lost deed"
              onPress={() => restoreDeed()}
              style={({ pressed }) => [styles.restoreActiveBtn, pressed && styles.pressed]}
            >
              <RotateCcw size={15} color="#FFFFFF" />
              <Text style={styles.restoreActiveText}>
                Restore deed ({RESTORE_COST} recycling pts) • {currentHousehold.penaltyDeedsLost} lost
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Last month unlocked banner if any */}
      {state.lastMonthUnlockedReward && (
        <View style={styles.unlockedCard}>
          <View style={styles.iconCircle}>
            <Trophy size={20} color="#566549" />
          </View>
          <View style={styles.flexOne}>
            <Text style={styles.statusLabel}>Last month · Unlocked</Text>
            <Text style={styles.rewardTitle}>{state.lastMonthUnlockedReward.title}</Text>
            <Text style={styles.rewardDescription}>{state.lastMonthUnlockedReward.description}</Text>
          </View>
        </View>
      )}

      {/* ── 5. Monthly Wrap-Up Node ─────────────────────────────────────────── */}
      {wrapUpNode}

      {/* ── 6. Recommended For You ──────────────────────────────────────────── */}
      <View style={styles.sectionHeaderOutside}>
        <Text style={styles.sectionTitle}>Recommended for you</Text>
        <View style={styles.softPill}>
          <Text style={styles.softPillText}>
            {ACTIONS.filter((item) => !completedForAction(item.id, state)).length} to do
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
        {ACTIONS.map((item) => {
          const done = completedForAction(item.id, state);
          const Icon = item.id === 'recycle' ? Recycle : item.id === 'bill' ? ReceiptText : Zap;
          return (
            <View key={item.id} style={styles.actionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconCircle}>
                  <Icon size={20} color="#566549" />
                </View>
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

      {/* ── 7. Recent Activity ──────────────────────────────────────────────── */}
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
              <View style={styles.checkCircleSmall}>
                <Check size={13} color="#FFFFFF" />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.activityTitle}>{activityLabel(deed.task_type)}</Text>
                <Text style={styles.metaText}>{deed.deed_date}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── One-Time Voting Dialog / Prompt ─────────────────────────────────── */}
      <Modal visible={votePromptVisible} transparent animationType="fade" onRequestClose={() => setVotePromptVisible(false)}>
        <View style={styles.promptScrim}>
          <View style={styles.promptCard}>
            <View style={styles.promptIconCircle}>
              <Vote size={26} color="#8A5F36" />
            </View>
            <Text style={styles.promptTitle}>Voting is open — cast your vote</Text>
            <Text style={styles.promptBody}>
              Choose next month's community reward for Oakridge Commons before the month ends.
            </Text>
            <View style={styles.promptButtonsRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setVotePromptVisible(false)}
                style={({ pressed }) => [styles.promptLaterBtn, pressed && styles.pressed]}
              >
                <Text style={styles.promptLaterBtnText}>Later</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setVotePromptVisible(false);
                  setBallotOpen(true);
                }}
                style={({ pressed }) => [styles.promptVoteBtn, pressed && styles.pressed]}
              >
                <Vote size={15} color="#FFFFFF" />
                <Text style={styles.promptVoteBtnText}>Vote now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Official Ballot Modal ───────────────────────────────────────────── */}
      <Modal visible={ballotOpen} transparent animationType="fade" onRequestClose={closeBallot}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sectionHeader}>
              <View style={styles.softPill}>
                <Text style={styles.softPillText}>Official ballot</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close ballot"
                onPress={closeBallot}
                style={styles.closeButton}
              >
                <X size={22} color="#292524" />
              </Pressable>
            </View>
            <Text style={styles.sheetTitle}>This month’s community vote</Text>
            <Text style={styles.cardBody}>Choose one reward. One vote per household, and a submitted vote cannot be changed.</Text>
            <ScrollView style={styles.rewardList} showsVerticalScrollIndicator={false}>
              {rewardOptions.map((reward) => {
                const chosen = selectedId === reward.id;
                const voted = currentHousehold.hasVoted && state.vote?.reward_id === reward.id;
                return (
                  <Pressable
                    key={reward.id}
                    disabled={currentHousehold.hasVoted || votePending}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: chosen || voted, disabled: currentHousehold.hasVoted }}
                    onPress={() => {
                      setSelectedId(reward.id);
                    }}
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

            <Pressable
              disabled={!selectedId || votePending}
              accessibilityRole="button"
              onPress={() => void submitVote()}
              style={[
                styles.primaryButton,
                (!selectedId || votePending) && styles.buttonDisabled,
              ]}
            >
              {votePending ? <ActivityIndicator color="#FFFFFF" /> : <Check size={18} color="#FFFFFF" />}
              <Text style={styles.primaryButtonText}>Submit vote</Text>
            </Pressable>

            <Pressable accessibilityRole="button" onPress={closeBallot} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Later</Text>
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
      <View style={styles.statusIcon}>
        <Icon size={27} color="#8A5F36" />
      </View>
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
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconTextRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 14, color: '#566549' },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dateChipActive: {
    backgroundColor: '#566549',
    borderColor: '#566549',
  },
  dateChipText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#292524',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  demoControlsCard: {
    backgroundColor: '#FAF8F4',
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C5BEB3',
    padding: 12,
    marginBottom: 14,
  },
  demoControlsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  demoBadge: {
    backgroundColor: '#E7EEE2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  demoBadgeText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 9.5,
    color: '#566549',
    letterSpacing: 0.5,
  },
  demoReadoutText: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#78716C',
  },
  demoGroupTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 10.5,
    color: '#8A5F36',
    letterSpacing: 0.4,
    marginTop: 6,
    marginBottom: 4,
  },
  demoScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  demoPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  demoPillActive: {
    backgroundColor: '#566549',
    borderColor: '#566549',
  },
  demoPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#57534E',
  },
  demoPillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'SourceSans3_700Bold',
  },
  demoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5D7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  demoActionBtnDisabled: {
    opacity: 0.45,
  },
  demoActionBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#566549',
  },
  demoActionBtnTextDisabled: {
    color: '#A8A29E',
  },
  demoNextDayBtn: {
    backgroundColor: '#566549',
    borderColor: '#566549',
  },
  demoNextDayBtnText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  demoResetBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  demoResetBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#B91C1C',
  },
  voteCard: {
    backgroundColor: '#FBF5EE',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E6D2BA',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#8A5F36',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  voteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voteIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF0E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EBD7BE',
  },
  voteCardTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  voteCardSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716C',
    marginTop: 1,
  },
  voteCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF0E2',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EED9C3',
  },
  voteCountdownText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
    color: '#8A5F36',
  },
  votePrimaryButton: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: '#8A5F36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 14,
    shadowColor: '#8A5F36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  votePrimaryButtonText: {
    fontFamily: 'SourceSans3_700Bold',
    color: '#FFFFFF',
    fontSize: 15,
  },
  leafCard: {
    alignItems: 'center',
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
  },
  leafDial: {
    width: 166,
    height: 166,
    borderRadius: 83,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deedBadge: {
    position: 'absolute',
    bottom: -2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 30,
  },
  deedBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 30,
    borderWidth: 1,
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  stagePillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
  },
  heroTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 23,
    color: '#292524',
    marginTop: 12,
    textAlign: 'center',
  },
  heroBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#57534E',
    textAlign: 'center',
    marginTop: 6,
  },
  stageRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
    width: '100%',
  },
  stageStep: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    flexDirection: 'row',
    gap: 5,
  },
  stageStepActive: {
    borderWidth: 1,
  },
  stageStepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A8A29E',
  },
  stageStepDotActive: {},
  stageStepText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#78716C',
  },
  stageStepTextActive: {},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionHeaderOutside: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  softPill: {
    backgroundColor: '#E7EEE2',
    borderRadius: 999,
    minHeight: 28,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  softPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#566549',
  },
  pointsHero: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 42,
    color: '#292524',
    marginTop: 18,
  },
  pointsUnit: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716C',
    marginTop: -4,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: '#FAF8F4',
    borderRadius: 16,
    padding: 11,
    minHeight: 92,
  },
  summaryValue: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
    marginTop: 5,
  },
  summaryLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11.5,
    color: '#78716C',
  },
  cardBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#57534E',
    marginTop: 10,
    marginBottom: 14,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: '#566549',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#FFFFFF',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.78,
  },
  rewardTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: '#292524',
  },
  rewardDescription: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#57534E',
    marginTop: 2,
  },
  unlockedCard: {
    backgroundColor: '#F6EAD8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7CFB2',
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E7EEE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11.5,
    color: '#8A5F36',
    marginBottom: 3,
  },
  actionsRow: {
    gap: 12,
    paddingBottom: 16,
    paddingRight: 20,
  },
  actionCard: {
    width: 285,
    minHeight: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F0EE',
    borderRadius: 999,
    minHeight: 28,
    paddingHorizontal: 9,
  },
  donePill: {
    backgroundColor: '#E7EEE2',
  },
  statusPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#57534E',
  },
  actionTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
    marginTop: 14,
  },
  actionBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#57534E',
    marginTop: 5,
    flex: 1,
  },
  actionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#EFECE8',
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
  },
  linkButton: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#566549',
  },
  linkButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFECE8',
    paddingTop: 12,
    marginTop: 12,
  },
  checkCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#829A78',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13.5,
    color: '#292524',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(41,37,36,0.42)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: '#FAF6F1',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D3D1',
    marginBottom: 14,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 25,
    color: '#292524',
    marginTop: 8,
  },
  rewardList: {
    maxHeight: 330,
    marginBottom: 12,
  },
  rewardOption: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 9,
  },
  rewardOptionSelected: {
    backgroundColor: '#E7EEE2',
    borderColor: '#829A78',
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#A8A29E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#566549',
    borderColor: '#566549',
  },
  optionState: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#566549',
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#57534E',
  },
  loadingWrap: { gap: 16, padding: 20 },
  skeleton: { backgroundColor: '#E7E5E4', borderRadius: 22 },
  statusCard: {
    margin: 20,
    marginTop: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 24,
    alignItems: 'center',
  },
  statusIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F6EAD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 21,
    color: '#292524',
    marginTop: 14,
  },
  statusBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#57534E',
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 16,
  },
  retryButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#566549',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
    width: '100%',
    borderWidth: 1,
  },
  reminderText: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  penaltyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  penaltyNoticeText: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#92400E',
  },
  restoreBox: {
    marginTop: 14,
  },
  restoreDisabledBtn: {
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  restoreDisabledText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    color: '#A8A29E',
  },
  restoreActiveBtn: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#566549',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
  },
  restoreActiveText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  promptScrim: {
    flex: 1,
    backgroundColor: 'rgba(41,37,36,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  promptCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FAF6F1',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#292524',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  promptIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FAF0E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EBD7BE',
  },
  promptTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 19,
    color: '#292524',
    textAlign: 'center',
    marginBottom: 8,
  },
  promptBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#57534E',
    textAlign: 'center',
    marginBottom: 20,
  },
  promptButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  promptLaterBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptLaterBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#57534E',
  },
  promptVoteBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: '#8A5F36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  promptVoteBtnText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
