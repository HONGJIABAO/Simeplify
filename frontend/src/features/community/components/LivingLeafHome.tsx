import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import {
  Leaf,
  Users,
  Zap,
  RefreshCw,
  Clock,
  ChevronRight,
  Recycle,
  ReceiptText,
  Sliders,
  TreePine,
  AlertTriangle,
  Info,
} from 'lucide-react-native';
import { TaskItem } from '../types';

export type LivingLeafVariation = 'healthy' | 'dry';

interface LivingLeafHomeProps {
  tasks: TaskItem[];
  onCompleteTask: (taskId: string) => void;
  onOpenRewardModal: () => void;
  onPressOakridge?: () => void;
  variation?: LivingLeafVariation;
  onToggleVariation?: (variation: LivingLeafVariation) => void;
}

export function LivingLeafHome({
  tasks,
  onCompleteTask,
  onOpenRewardModal,
  onPressOakridge,
  variation: controlledVariation,
  onToggleVariation,
}: LivingLeafHomeProps) {
  const router = useRouter();
  const [internalVariation, setInternalVariation] =
    useState<LivingLeafVariation>('healthy');

  const currentVariation = controlledVariation ?? internalVariation;
  const isDry = currentVariation === 'dry';

  const handleSetVariation = (newVar: LivingLeafVariation) => {
    if (onToggleVariation) {
      onToggleVariation(newVar);
    } else {
      setInternalVariation(newVar);
    }
  };

  const handleTaskAction = (task: TaskItem) => {
    onCompleteTask(task.id);
    onOpenRewardModal();
  };

  // Dimensions for SVG circular progress tracker
  const ringSize = 220;
  const strokeWidth = 8;
  const center = ringSize / 2; // 110
  const radius = center - strokeWidth / 2 - 4; // 102
  const circumference = 2 * Math.PI * radius; // ~640.88
  // 50% progress for 1/2 deeds in healthy state
  const healthyProgressOffset = circumference * 0.5;

  return (
    <View style={styles.container}>
      {/* ── 1. Hero Living Leaf Section (Two Variations) ─────────────────────── */}
      <View style={styles.dialSection}>
        {/* Variation Quick Toggle Bar */}
        <View style={styles.variationSelectorRow}>
          <Pressable
            onPress={() => handleSetVariation('healthy')}
            style={[
              styles.variationSelectorBtn,
              !isDry && styles.variationSelectorBtnActiveHealthy,
            ]}
          >
            <Leaf
              size={13}
              color={!isDry ? '#FFFFFF' : '#4A6D56'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.variationSelectorText,
                !isDry
                  ? styles.variationSelectorTextActive
                  : styles.variationSelectorTextInactive,
              ]}
            >
              Variation 1: Healthy
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSetVariation('dry')}
            style={[
              styles.variationSelectorBtn,
              isDry && styles.variationSelectorBtnActiveDry,
            ]}
          >
            <Leaf
              size={13}
              color={isDry ? '#FFFFFF' : '#92400E'}
              strokeWidth={2}
              style={{ transform: [{ rotate: '45deg' }] }}
            />
            <Text
              style={[
                styles.variationSelectorText,
                isDry
                  ? styles.variationSelectorTextActive
                  : styles.variationSelectorTextInactive,
              ]}
            >
              Variation 2: Dry (0 Actions)
            </Text>
          </Pressable>
        </View>

        {/* 
          CRITICAL FIX: Zero Text Overlap Layout
          Using flex-col, items-center, and gap-4 (16px) to place the badge
          DIRECTLY BELOW and OUTSIDE the circular progress ring.
        */}
        <View style={styles.trackerContainer}>
          {/* Circular Progress Ring Container */}
          <View style={styles.circularRingBox}>
            <Svg width={ringSize} height={ringSize} style={styles.svgRing}>
              <Defs>
                <LinearGradient
                  id="healthyLeafGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <Stop offset="0%" stopColor="#6C885B" />
                  <Stop offset="100%" stopColor="#3F5833" />
                </LinearGradient>
              </Defs>

              {/* Background Circular Ring Track */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={isDry ? '#E7D9CB' : '#E5ECE0'}
                strokeWidth={strokeWidth}
                strokeDasharray={isDry ? '6 6' : undefined}
                fill={isDry ? '#FEFBF6' : '#F6FAF3'}
              />

              {/* Active Progress Circle: 50% for 1/2 deeds in healthy, 0% in dry */}
              {!isDry && (
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#566549"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${healthyProgressOffset}`}
                  strokeLinecap="round"
                  fill="none"
                  transform={`rotate(-90 ${center} ${center})`}
                />
              )}
            </Svg>

            {/* Center Graphic */}
            <View style={styles.centerGraphicContainer}>
              {!isDry ? (
                /* Variation 1: Healthy Green Leaf Graphic */
                <Image
                  source={require('../../../../assets/images/community/living_leaf_dial.png')}
                  style={styles.healthyDialImage}
                  resizeMode="contain"
                />
              ) : (
                /* Variation 2: Stylized Dry, Brown, Withered Leaf Design */
                <View style={styles.witheredGraphicWrapper}>
                  <View style={styles.witheredSunAura} />
                  <Svg width={130} height={130} viewBox="0 0 100 100">
                    {/* Drooping Stem */}
                    <Path
                      d="M 50 85 Q 48 70 52 50"
                      stroke="#78350F"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Withered, Curled Dry Leaf Body */}
                    <Path
                      d="M 50 80 C 32 72 24 54 28 36 C 30 24 40 16 52 14 C 64 22 72 38 68 56 C 65 70 56 78 50 80 Z"
                      fill="#B45309"
                      stroke="#78350F"
                      strokeWidth="2"
                    />
                    {/* Dry Ochre Secondary Fold */}
                    <Path
                      d="M 52 14 C 58 26 62 42 58 58 C 55 68 50 80 50 80 C 46 68 45 44 52 14 Z"
                      fill="#D97706"
                      opacity={0.85}
                    />
                    {/* Dry Veins */}
                    <Path
                      d="M 52 24 L 38 32 M 54 36 L 40 46 M 56 48 L 44 58 M 52 30 L 64 38 M 54 44 L 62 52"
                      stroke="#78350F"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
              )}
            </View>
          </View>

          {/* 
            CRITICAL FIX: Placed neatly BELOW the circle with NO OVERLAP.
            flex-col, items-center, gap-4 layout.
          */}
          <View style={[styles.deedsPillBelow, isDry && styles.deedsPillBelowDry]}>
            <Leaf
              size={13}
              color="#FFFFFF"
              strokeWidth={2}
              style={isDry ? { transform: [{ rotate: '45deg' }] } : undefined}
            />
            <Text style={styles.deedsPillText}>
              {isDry ? '0 / 2 deeds' : '1 / 2 deeds'}
            </Text>
          </View>
        </View>

        {/* Status Tag */}
        <View
          style={[
            styles.stageStatusBadge,
            isDry && styles.stageStatusBadgeDry,
          ]}
        >
          <View
            style={[
              styles.stageDot,
              isDry && styles.stageDotDry,
            ]}
          />
          <Text
            style={[
              styles.stageStatusText,
              isDry && styles.stageStatusTextDry,
            ]}
          >
            {isDry
              ? 'Dry Stage • 0 actions today'
              : 'Healthy Stage • 1 action today'}
          </Text>
        </View>

        {/* Heading & Subtitle */}
        <Text style={[styles.leafTitle, isDry && styles.leafTitleDry]}>
          {isDry ? 'Living Leaf is Dry' : 'Living Leaf is Thriving'}
        </Text>

        <Text style={[styles.leafSubtitle, isDry && styles.leafSubtitleDry]}>
          {isDry
            ? 'No green actions were recorded yesterday. Complete an action today to revive your leaf and community impact.'
            : 'Complete 1 more green action today to unlock tomorrow’s Lush state & community perks.'}
        </Text>

        {/* Stage Stepper Row */}
        <View style={styles.stepperRow}>
          {/* Step 1: Dry (0) */}
          <View
            style={[
              styles.stepperPill,
              isDry ? styles.stepperPillActiveDry : styles.stepperPillInactive,
            ]}
          >
            <View
              style={[
                styles.stepperDot,
                isDry ? styles.stepperDotDry : styles.stepperDotInactive,
              ]}
            />
            <Text
              style={[
                styles.stepperText,
                isDry ? styles.stepperTextActiveDry : styles.stepperTextInactive,
              ]}
            >
              {isDry ? 'Dry (0) • Active' : 'Dry (0)'}
            </Text>
          </View>

          <Text style={[styles.stepperArrow, isDry && styles.stepperArrowDry]}>
            →
          </Text>

          {/* Step 2: Healthy (Active) */}
          <View
            style={[
              styles.stepperPill,
              !isDry ? styles.stepperPillActive : styles.stepperPillInactive,
            ]}
          >
            <View
              style={[
                styles.stepperDot,
                !isDry ? styles.stepperDotActive : styles.stepperDotInactive,
              ]}
            />
            <Text
              style={[
                styles.stepperText,
                !isDry ? styles.stepperTextActive : styles.stepperTextInactive,
              ]}
            >
              {!isDry ? 'Healthy (Active)' : 'Healthy'}
            </Text>
          </View>

          <Text style={styles.stepperArrow}>→</Text>

          {/* Step 3: Lush (2+) */}
          <View style={[styles.stepperPill, styles.stepperPillInactive]}>
            <View style={[styles.stepperDot, styles.stepperDotInactive]} />
            <Text style={[styles.stepperText, styles.stepperTextInactive]}>
              Lush (2+)
            </Text>
          </View>
        </View>

        {/* Penalty Recovery Alert Notice (Displayed in Dry State) */}
        {isDry && (
          <View style={styles.penaltyNoticeCard}>
            <AlertTriangle size={15} color="#92400E" strokeWidth={2} />
            <Text style={styles.penaltyNoticeText}>
              Penalty Notice: 0 eco-actions yesterday. Complete any green action
              below right now to revive your Living Leaf!
            </Text>
          </View>
        )}
      </View>

      {/* ── 2. Oakridge Community Impact Card ─────────────────────────────────── */}
      <View style={styles.impactCard}>
        <Pressable
          onPress={onPressOakridge}
          accessibilityRole="button"
          accessibilityLabel="View Oakridge community participation breakdown"
          style={({ pressed }) => [
            styles.impactHeader,
            pressed && { opacity: 0.75 },
          ]}
        >
          <View style={styles.impactTitleGroup}>
            <Users size={18} color="#292524" strokeWidth={1.8} />
            <Text style={styles.impactTitle}>Oakridge Community Impact</Text>
          </View>
          <View style={styles.monthBadge}>
            <Text style={styles.monthBadgeText}>View Activity Dashboard →</Text>
          </View>
        </Pressable>

        <View style={styles.miniCardsRow}>
          {/* Energy Saved */}
          <View style={styles.energyMiniCard}>
            <View style={styles.metricLabelRow}>
              <Zap size={14} color="#D4A373" strokeWidth={2} />
              <Text style={styles.metricLabel}>ENERGY SAVED</Text>
            </View>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricHeroNumber}>18,420</Text>
              <Text style={styles.metricUnit}>kWh</Text>
            </View>
          </View>

          {/* Points Earned */}
          <View style={styles.pointsMiniCard}>
            <View style={styles.metricLabelRow}>
              <Leaf size={14} color="#566549" strokeWidth={2} />
              <Text style={styles.metricLabel}>POINTS EARNED</Text>
            </View>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricHeroNumber}>2,840</Text>
              <Text style={styles.metricUnit}>pts</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── 3. Oakridge Tree Planting Challenge Card ─────────────────────────── */}
      <View style={styles.challengeCard}>
        <Pressable
          onPress={onPressOakridge}
          style={({ pressed }) => [
            styles.challengeHeaderRow,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={styles.challengeTitleGroup}>
            <TreePine size={17} color="#4A6D56" strokeWidth={2} />
            <Text style={styles.challengeTitle}>Oakridge Tree Planting</Text>
          </View>
          <Text style={styles.challengeTurnoutTag}>185/240 Voted</Text>
        </Pressable>

        <Text style={styles.challengeSubtext}>
          Goal: Reach 180 verified community actions to unlock tree saplings for
          Cedar Grove Parkway.
        </Text>

        <View style={styles.challengeProgressTrack}>
          <View style={[styles.challengeProgressFill, { width: '82%' }]} />
        </View>

        <View style={styles.challengeFooterRow}>
          <Text style={styles.challengeFooterText}>82% Complete</Text>
          <Text style={styles.challengeDaysLeftText}>3 days left</Text>
        </View>
      </View>

      {/* ── 4. Daily Action Tasks ────────────────────────────────────────────── */}
      <View style={styles.tasksSection}>
        <View style={styles.tasksHeaderRow}>
          <Text style={styles.tasksSectionTitle}>Daily Green Actions</Text>
          <Text style={styles.tasksRefreshText}>Resets midnight</Text>
        </View>

        {tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskCardTop}>
              <View style={styles.taskIconCircle}>
                {task.iconType === 'recycle' && (
                  <Recycle size={18} color="#4A6D56" strokeWidth={2} />
                )}
                {task.iconType === 'receipt' && (
                  <ReceiptText size={18} color="#D4A373" strokeWidth={2} />
                )}
                {task.iconType === 'appliance' && (
                  <Sliders size={18} color="#566549" strokeWidth={2} />
                )}
              </View>

              <View style={styles.taskInfoCol}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDescription}>{task.description}</Text>
              </View>
            </View>

            <View style={styles.taskActionRow}>
              <View style={styles.taskMetricPill}>
                <Clock size={12} color="#78716C" strokeWidth={2} />
                <Text style={styles.taskMetricText}>
                  {task.durationOrMetric}
                </Text>
              </View>

              <Pressable
                onPress={() => handleTaskAction(task)}
                style={({ pressed }) => [
                  styles.taskActionBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.taskActionBtnText}>{task.actionLabel}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // ── Dial Section ──────────────────────────────────────────────────────────
  dialSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  variationSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    width: '100%',
    maxWidth: 340,
  },
  variationSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DECE',
  },
  variationSelectorBtnActiveHealthy: {
    backgroundColor: '#3A5A43',
    borderColor: '#2D4734',
  },
  variationSelectorBtnActiveDry: {
    backgroundColor: '#92400E',
    borderColor: '#78350F',
  },
  variationSelectorText: {
    fontSize: 11.5,
    fontFamily: 'SourceSans3_700Bold',
  },
  variationSelectorTextActive: {
    color: '#FFFFFF',
  },
  variationSelectorTextInactive: {
    color: '#57534E',
  },

  // ── Circular Tracker Container (Zero Overlap with flex-col & gap-4) ──────
  trackerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16, // gap-4 (16px) clean breathing space between circle and badge
    marginBottom: 14,
  },
  circularRingBox: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerGraphicContainer: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthyDialImage: {
    width: 160,
    height: 160,
  },
  witheredGraphicWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  witheredSunAura: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FEF3C7',
    opacity: 0.6,
  },

  // Badge placed OUTSIDE and DIRECTLY BELOW the circular progress ring
  deedsPillBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#263321', // Dark contrast pill
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    shadowColor: '#263321',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  deedsPillBelowDry: {
    backgroundColor: '#451A03', // Deep dry amber
  },
  deedsPillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12.5,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Stage Status Badge
  stageStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5ECE0',
    borderColor: '#C5D8C1',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 9999,
    marginBottom: 8,
  },
  stageStatusBadgeDry: {
    backgroundColor: '#FEF3C7', // bg-amber-100
    borderColor: '#FDE68A',
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#425438',
  },
  stageDotDry: {
    backgroundColor: '#D97706',
  },
  stageStatusText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    color: '#425438',
  },
  stageStatusTextDry: {
    fontFamily: 'SourceSans3_700Bold',
    color: '#92400E', // text-amber-800
  },

  // Heading & Subtitle
  leafTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
    color: '#292524',
    textAlign: 'center',
    marginBottom: 6,
  },
  leafTitleDry: {
    color: '#78350F',
  },
  leafSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13.5,
    lineHeight: 20,
    color: '#57534E',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  leafSubtitleDry: {
    color: '#78350F',
  },

  // Stepper Row
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  stepperPillActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#8B9D77',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperPillActiveDry: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#D97706',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  stepperPillInactive: {
    backgroundColor: '#F0EDE7',
  },
  stepperDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepperDotActive: {
    backgroundColor: '#566549',
  },
  stepperDotDry: {
    backgroundColor: '#D97706',
  },
  stepperDotInactive: {
    backgroundColor: '#8C867E',
  },
  stepperText: {
    fontSize: 11.5,
  },
  stepperTextActive: {
    fontFamily: 'SourceSans3_700Bold',
    color: '#263321',
  },
  stepperTextActiveDry: {
    fontFamily: 'SourceSans3_700Bold',
    color: '#92400E',
  },
  stepperTextInactive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#8C867E',
  },
  stepperArrow: {
    fontSize: 13,
    color: '#A8A29E',
  },
  stepperArrowDry: {
    color: '#D97706',
  },

  penaltyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 14,
    width: '100%',
    maxWidth: 370,
  },
  penaltyNoticeText: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    lineHeight: 17,
    color: '#92400E',
  },

  // ── Impact Card ───────────────────────────────────────────────────────────
  impactCard: {
    backgroundColor: '#FAF5ED',
    borderWidth: 1,
    borderColor: '#E6DECE',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  impactTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  impactTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  monthBadge: {
    backgroundColor: '#EDE5D5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  monthBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#566549',
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  energyMiniCard: {
    flex: 1,
    backgroundColor: '#F3EDE2',
    borderRadius: 12,
    padding: 12,
  },
  pointsMiniCard: {
    flex: 1,
    backgroundColor: '#F3EDE2',
    borderRadius: 12,
    padding: 12,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  metricLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10,
    color: '#78716C',
    letterSpacing: 0.5,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricHeroNumber: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 18,
    color: '#292524',
  },
  metricUnit: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#78716C',
  },

  // ── Tree Planting Challenge Card ──────────────────────────────────────────
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DFD5',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  challengeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  challengeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challengeTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  challengeTurnoutTag: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#4A6D56',
    backgroundColor: '#EAF2E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  challengeSubtext: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#57534E',
    marginBottom: 10,
  },
  challengeProgressTrack: {
    height: 8,
    backgroundColor: '#F0EDE7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#4A6D56',
    borderRadius: 4,
  },
  challengeFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeFooterText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#4A6D56',
  },
  challengeDaysLeftText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11.5,
    color: '#8C867E',
  },

  // ── Tasks Section ─────────────────────────────────────────────────────────
  tasksSection: {
    marginBottom: 24,
  },
  tasksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tasksSectionTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 17,
    color: '#292524',
  },
  tasksRefreshText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#8C867E',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DFD5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  taskCardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  taskIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0EDE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 14.5,
    lineHeight: 19,
    color: '#292524',
    marginBottom: 2,
  },
  taskDescription: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#57534E',
  },
  taskActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F2EC',
  },
  taskMetricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  taskMetricText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#78716C',
  },
  taskActionBtn: {
    backgroundColor: '#566549',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  taskActionBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
});
