import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Leaf,
  Recycle,
  Trophy,
  Users,
  XCircle,
  Zap,
} from 'lucide-react-native';

import { useEcoHabit } from '@/lib/ecoHabitContext';
import { formatMonthLabel, shiftMonth } from '@/lib/services/monthlyWrapUpService';

interface MonthlyWrapUpSectionProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  data?: any;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function MonthlyWrapUpSection({
  selectedMonth,
  onMonthChange,
}: MonthlyWrapUpSectionProps) {
  const { demoDate, getMonthSummary } = useEcoHabit();

  // Current active month in the app
  const currentMonth = demoDate.slice(0, 7) + '-01';
  const selectedMonthIso = selectedMonth.length === 7 ? `${selectedMonth}-01` : selectedMonth;
  const isCurrentMonth = selectedMonthIso >= currentMonth;
  const monthDisplay = formatMonthLabel(selectedMonthIso);

  // Derive all data deterministically from 100 mock households
  const summary = getMonthSummary(selectedMonthIso);

  const handlePrevMonth = () => {
    const prev = shiftMonth(selectedMonthIso, -1);
    onMonthChange(prev);
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    const next = shiftMonth(selectedMonthIso, 1);
    if (next <= currentMonth) {
      onMonthChange(next);
    }
  };

  return (
    <View style={styles.container} accessibilityLabel="Monthly Wrap-up Section">
      {/* ── Section Header with Month Navigation ────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.iconTextRow}>
          <Calendar size={18} color="#566549" />
          <Text style={styles.sectionHeaderTitle}>Monthly wrap-up</Text>
        </View>

        {/* Month Picker Stepper (< Month >) */}
        <View
          style={styles.monthPicker}
          accessibilityRole="toolbar"
          accessibilityLabel="Month Selector"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={handlePrevMonth}
            style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
          >
            <ChevronLeft size={18} color="#292524" />
          </Pressable>

          <Text style={styles.monthPickerLabel}>{monthDisplay}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            disabled={isCurrentMonth}
            onPress={handleNextMonth}
            style={({ pressed }) => [
              styles.arrowButton,
              isCurrentMonth && styles.arrowButtonDisabled,
              pressed && !isCurrentMonth && styles.pressed,
            ]}
          >
            <ChevronRight size={18} color={isCurrentMonth ? '#C6C3BF' : '#292524'} />
          </Pressable>
        </View>
      </View>

      {/* ── 1. Reward Banner Card ─────────────────────────────────────────── */}
      <View style={styles.rewardBannerCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconTextRow}>
            <Trophy size={18} color="#566549" />
            <Text style={styles.cardTitle}>Community reward</Text>
          </View>

          {/* Status Badge: "In progress", "Hit", or "Not hit" (icon + text, not color alone) */}
          <View
            style={[
              styles.statusBadge,
              summary.status === 'Hit'
                ? styles.statusBadgeHit
                : summary.status === 'Not hit'
                ? styles.statusBadgeMissed
                : styles.statusBadgeProgress,
            ]}
            accessibilityLabel={`Reward status: ${summary.status}`}
          >
            {summary.status === 'Hit' && <CheckCircle2 size={13} color="#2D4A36" />}
            {summary.status === 'Not hit' && <XCircle size={13} color="#78350F" />}
            {summary.status === 'In progress' && <Clock3 size={13} color="#566549" />}
            <Text
              style={[
                styles.statusBadgeText,
                summary.status === 'Hit'
                  ? styles.statusTextHit
                  : summary.status === 'Not hit'
                  ? styles.statusTextMissed
                  : styles.statusTextProgress,
              ]}
            >
              {summary.status === 'Hit'
                ? 'Hit'
                : summary.status === 'Not hit'
                ? 'Not hit'
                : 'In progress'}
            </Text>
          </View>
        </View>

        <Text style={styles.rewardTitle}>{summary.reward.title}</Text>
        <Text style={styles.rewardDescription}>{summary.reward.description}</Text>

        {/* Rule Text Banner */}
        <View style={styles.rulePill}>
          <Users size={14} color="#566549" />
          <Text style={styles.rulePillText}>
            Goal: {summary.thresholdPct}% of households with 30+ deeds
          </Text>
        </View>
      </View>

      {/* ── 2. Leaf Status Card ───────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconTextRow}>
            <Leaf size={18} color="#566549" />
            <Text style={styles.cardTitle}>Leaf status</Text>
          </View>
          <View style={styles.softPill}>
            <Text style={styles.softPillText}>{summary.percentage}%</Text>
          </View>
        </View>

        {/* Headline: "X of 100 households reached 30+ deeds (Y%)" */}
        <Text style={styles.leafHeadline}>
          {summary.qualifiedHouseholds} of {summary.eligibleHouseholds} households reached 30+ deeds ({summary.percentage}%)
        </Text>

        {/* "Your household has completed N of 30 deeds" */}
        <Text style={styles.leafSubtext}>
          {summary.householdMonthlyDeeds > 30
            ? `Your household has completed ${summary.householdMonthlyDeeds} deeds · Leaf earned!`
            : `Your household has completed ${summary.householdMonthlyDeeds} of 30 deeds${
                summary.householdHasLeaf ? ' (Leaf earned!)' : ''
              }.`}
        </Text>

        {/* Progress Bar with exact 60% Target Marker */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, summary.percentage))}%` },
              ]}
            />
          </View>

          {/* Target Marker at exactly 60% of width */}
          <View
            style={styles.targetMarker}
            accessibilityLabel={`Target marker at ${summary.thresholdPct}%`}
          >
            <View style={styles.targetTick} />
            <View style={styles.targetTag}>
              <Text style={styles.targetTagText}>{summary.thresholdPct}% Target</Text>
            </View>
          </View>
        </View>

        {/* Status / Needed Notice */}
        <View style={styles.neededRow}>
          {summary.isHit ? (
            <View style={styles.hitNotice}>
              <Check size={14} color="#2D4A36" />
              <Text style={styles.hitNoticeText}>
                Community goal of {summary.thresholdPct}% achieved ({summary.qualifiedHouseholds}/100)!
              </Text>
            </View>
          ) : (
            <View style={styles.neededNotice}>
              <Users size={14} color="#8A5F36" />
              <Text style={styles.neededNoticeText}>
                <Text style={styles.boldText}>{summary.neededHouseholds} more</Text>{' '}
                {summary.neededHouseholds === 1 ? 'household' : 'households'} needed to reach the{' '}
                {summary.thresholdPct}% goal.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── 3. Monthly Impact Card (same design as This month) ────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconTextRow}>
            <Zap size={18} color="#A97A4A" />
            <Text style={styles.cardTitle}>Month impact</Text>
          </View>
          <View style={styles.softPill}>
            <Text style={styles.softPillText}>Estimated</Text>
          </View>
        </View>

        <Text style={styles.pointsHero}>{summary.totalCommunityDeeds.toLocaleString('en-US')}</Text>
        <Text style={styles.pointsUnit}>community deeds in {monthDisplay}</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryTile}>
            <Leaf size={18} color="#566549" />
            <Text style={styles.summaryValue}>{summary.qualifiedHouseholds}</Text>
            <Text style={styles.summaryLabel}>Leaves earned</Text>
          </View>
          <View style={styles.summaryTile}>
            <Zap size={18} color="#A97A4A" />
            <Text style={styles.summaryValue}>
              {summary.totalCommunityEnergySaved.toLocaleString('en-US')} kWh
            </Text>
            <Text style={styles.summaryLabel}>Energy saved</Text>
          </View>
          <View style={styles.summaryTile}>
            <Trophy size={18} color="#566549" />
            <Text style={styles.summaryValue}>
              {summary.totalCommunityPoints.toLocaleString('en-US')}
            </Text>
            <Text style={styles.summaryLabel}>Total points</Text>
          </View>
        </View>

        <Text style={styles.impactCaption}>
          ≈ RM {summary.communityRMSaved.toLocaleString('en-US')} saved · Estimated from household appliance routines and billing baselines
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonDisabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.75,
  },
  monthPickerLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 18,
    marginBottom: 16,
  },
  rewardBannerCard: {
    backgroundColor: '#FAF8F4',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 17,
    color: '#292524',
  },
  softPill: {
    backgroundColor: '#E7EEE2',
    borderRadius: 999,
    minHeight: 26,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  softPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#566549',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeHit: {
    backgroundColor: '#EAF2E8',
    borderColor: '#C5D8C1',
    borderWidth: 1,
  },
  statusBadgeMissed: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  statusBadgeProgress: {
    backgroundColor: '#F0EDE7',
  },
  statusBadgeText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11.5,
  },
  statusTextHit: {
    color: '#2D4A36',
  },
  statusTextMissed: {
    color: '#78350F',
  },
  statusTextProgress: {
    color: '#566549',
  },
  rewardTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 19,
    lineHeight: 25,
    color: '#292524',
    marginBottom: 4,
  },
  rewardDescription: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#57534E',
    marginBottom: 12,
  },
  rulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E7EEE2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  rulePillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#3A5A43',
  },
  leafHeadline: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
    marginTop: 2,
    marginBottom: 4,
  },
  leafSubtext: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#78716C',
    marginBottom: 16,
  },
  progressContainer: {
    marginVertical: 14,
    position: 'relative',
    width: '100%',
    height: 44,
  },
  progressBarTrack: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    width: '100%',
    height: 12,
    backgroundColor: '#EDE7DF',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#566549',
    borderRadius: 6,
  },
  targetMarker: {
    position: 'absolute',
    left: '60%',
    top: 0,
    width: 60,
    marginLeft: -30,
    alignItems: 'center',
    zIndex: 2,
  },
  targetTick: {
    width: 2,
    height: 24,
    backgroundColor: '#8A5F36',
    borderRadius: 1,
  },
  targetTag: {
    backgroundColor: '#FAF5ED',
    borderWidth: 1,
    borderColor: '#E6DECE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  targetTagText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 9.5,
    color: '#8A5F36',
  },
  neededRow: {
    marginTop: 6,
  },
  hitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF2E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hitNoticeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    color: '#2D4A36',
  },
  neededNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF4EC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  neededNoticeText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#78350F',
  },
  boldText: {
    fontFamily: 'SourceSans3_700Bold',
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
    minHeight: 88,
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
  impactCaption: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: '#78716C',
    marginTop: 14,
  },
});
