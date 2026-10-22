import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  House,
  Users,
  Leaf,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react-native';

interface CommunityActivityDashboardProps {
  showHeader?: boolean;
}

export function CommunityActivityDashboard({
  showHeader = true,
}: CommunityActivityDashboardProps) {
  // Circular ring dimensions
  const ringSize = 80;
  const strokeWidth = 6;
  const center = ringSize / 2; // 40
  const radius = center - strokeWidth / 2 - 2; // 35
  const circumference = 2 * Math.PI * radius; // ~219.9
  const halfProgressOffset = circumference * 0.5; // 50% for 1/2 deeds

  return (
    <View style={styles.container}>
      {/* ── 1. Header Section ─────────────────────────────────────────────────── */}
      {showHeader && (
        <View style={styles.headerSection}>
          <View style={styles.sectorBadge}>
            <House size={13} color="#4A6D56" strokeWidth={2} />
            <Text style={styles.sectorBadgeText}>Oakridge Commons • Sector 4B</Text>
          </View>

          <Text style={styles.headerTitle}>{"Today's Community Activity"}</Text>
          <Text style={styles.headerSubtext}>
            Real-time household participation breakdown across Oakridge Commons for
            {" today's green challenge."}
          </Text>
        </View>
      )}

      {/* ── 2. Global Progress Card (225 of 240 active, 94%) ──────────────────── */}
      <View style={styles.globalCard}>
        {/* Top meta row */}
        <View style={styles.globalTopRow}>
          <View style={styles.metaLabelGroup}>
            <Users size={15} color="#566549" strokeWidth={2} />
            <Text style={styles.metaLabel}>COMMUNITY PARTICIPATION</Text>
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Main headline stats with zero-overlap flex column */}
        <View style={styles.globalMetricsRow}>
          <View style={styles.globalMetricsTextCol}>
            <Text style={styles.globalHeroTitle}>
              225 of 240 households active
            </Text>
            <Text style={styles.globalHeroSub}>
              94% participation rate today
            </Text>
          </View>

          <View style={styles.participationPill}>
            <Text style={styles.participationPillText}>94%</Text>
          </View>
        </View>

        {/* Continuous Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '94%' }]} />
        </View>

        {/* Footnote stats */}
        <View style={styles.globalStatsFooter}>
          <Text style={styles.footerStatLeft}>
            <Text style={styles.boldGreen}>225</Text> completed eco-actions
          </Text>
          <Text style={styles.footerStatRight}>
            <Text style={styles.boldMuted}>15</Text> pending households
          </Text>
        </View>
      </View>

      {/* ── 3. Living Task Card (Replacing old Watering/Fertilizing) ─────────── */}
      <View style={styles.livingTaskCard}>
        {/* Card Header */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleGroup}>
            <Sparkles size={16} color="#4A6D56" strokeWidth={2} />
            <Text style={styles.cardTitle}>Living Leaf Status</Text>
          </View>

          <View style={styles.deedsBadge}>
            <Text style={styles.deedsBadgeText}>1 / 2 deeds completed</Text>
          </View>
        </View>

        {/* Circular Tracker + Status Text Row */}
        <View style={styles.trackerRow}>
          {/* Circular Tracker Column (Ring + Badge below with no overlap) */}
          <View style={styles.trackerVisualCol}>
            <View style={styles.circularVisualContainer}>
              <Svg width={ringSize} height={ringSize} style={styles.svgRing}>
                {/* Background Track Circle */}
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#E5ECE0"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Active Progress Circle (50% for 1/2 deeds) */}
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#4A6D56"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${halfProgressOffset}`}
                  strokeLinecap="round"
                  fill="none"
                  transform={`rotate(-90 ${center} ${center})`}
                />
              </Svg>

              {/* Centered stylized leaf icon */}
              <View style={styles.leafIconCenter}>
                <View style={styles.leafIconBackdrop}>
                  <Leaf size={24} color="#4A6D56" strokeWidth={2} />
                </View>
              </View>
            </View>

            {/* Badge placed neatly outside and directly below the circle */}
            <View style={styles.ringRatioTag}>
              <Text style={styles.ringRatioTagText}>1 / 2 deeds</Text>
            </View>
          </View>

          {/* Status text column - flex: 1 with breathing room */}
          <View style={styles.statusTextCol}>
            <View style={styles.stagePill}>
              <View style={styles.stageDotActive} />
              <Text style={styles.stagePillText}>Healthy Stage</Text>
            </View>

            <Text style={styles.statusMainDescription}>
              Healthy Stage • 1 action today. Complete 1 more green action today
              to unlock {"tomorrow's"} Lush state.
            </Text>

            <Text style={styles.statusMetaNotice}>
              Shared village perk unlocks at 2+ community deeds.
            </Text>
          </View>
        </View>

        {/* Stepper Divider */}
        <View style={styles.stepperDivider} />

        {/* Stepper: Dry (0) -> Healthy (Active) -> Lush (2+) */}
        <View style={styles.stepperContainer}>
          {/* Step 1: Dry (0) */}
          <View style={styles.stepPillInactive}>
            <View style={styles.stepDotInactive} />
            <Text style={styles.stepTextInactive}>Dry (0)</Text>
          </View>

          <ChevronRight size={14} color="#9CA3AF" strokeWidth={2} />

          {/* Step 2: Healthy (Active) */}
          <View style={styles.stepPillActive}>
            <View style={styles.stepDotActive} />
            <Text style={styles.stepTextActive}>Healthy (Active)</Text>
          </View>

          <ChevronRight size={14} color="#9CA3AF" strokeWidth={2} />

          {/* Step 3: Lush (2+) */}
          <View style={styles.stepPillTarget}>
            <View style={styles.stepDotTarget} />
            <Text style={styles.stepTextTarget}>Lush (2+)</Text>
          </View>
        </View>
      </View>

      {/* ── 4. "No Action" Withered State Demonstration Card ─────────────────── */}
      <View style={styles.witheredCard}>
        {/* Card Header with warning alert styling */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.witheredTitleGroup}>
            <AlertTriangle size={16} color="#B45309" strokeWidth={2} />
            <Text style={styles.witheredTitle}>
              Demonstration: No Action State
            </Text>
          </View>

          <View style={styles.witheredAlertBadge}>
            <Text style={styles.witheredAlertBadgeText}>Withered Warning</Text>
          </View>
        </View>

        {/* Circular Tracker + Status Text Row */}
        <View style={styles.trackerRow}>
          {/* Circular Tracker Column (Empty Ring + Badge below with no overlap) */}
          <View style={styles.trackerVisualCol}>
            <View style={styles.circularVisualContainer}>
              <Svg width={ringSize} height={ringSize} style={styles.svgRing}>
                {/* Background Track Circle with dry muted border */}
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#E7D9CB"
                  strokeWidth={strokeWidth}
                  strokeDasharray="4 3"
                  fill="none"
                />
              </Svg>

              {/* Centered stylized dry brown withered leaf icon */}
              <View style={styles.leafIconCenter}>
                <View style={styles.witheredLeafBackdrop}>
                  <Leaf
                    size={24}
                    color="#92400E"
                    strokeWidth={1.8}
                    style={styles.witheredTiltedLeaf}
                  />
                </View>
              </View>
            </View>

            {/* Small tag placed neatly outside below circle */}
            <View style={styles.witheredRatioTag}>
              <Text style={styles.witheredRatioTagText}>0 / 2 deeds</Text>
            </View>
          </View>

          {/* Status text column */}
          <View style={styles.statusTextCol}>
            <View style={styles.witheredStagePill}>
              <View style={styles.witheredDot} />
              <Text style={styles.witheredStagePillText}>Leaf is Dry</Text>
            </View>

            <Text style={styles.witheredStatusMainText}>
              0 actions taken. Living Leaf is Dry.
            </Text>

            <Text style={styles.witheredSubtext}>
              No eco-actions were recorded yesterday. Participate today to revive
              our community green space.
            </Text>
          </View>
        </View>

        {/* Stepper Divider */}
        <View style={styles.witheredDivider} />

        {/* Stepper showing Dry (0) as active warning */}
        <View style={styles.stepperContainer}>
          <View style={styles.witheredStepPillActive}>
            <View style={styles.witheredStepDotActive} />
            <Text style={styles.witheredStepTextActive}>Dry (0) • Active</Text>
          </View>

          <ChevronRight size={14} color="#D97706" strokeWidth={2} />

          <View style={styles.stepPillInactive}>
            <View style={styles.stepDotInactive} />
            <Text style={styles.stepTextInactive}>Healthy</Text>
          </View>

          <ChevronRight size={14} color="#D1D5DB" strokeWidth={2} />

          <View style={styles.stepPillTarget}>
            <View style={styles.stepDotTarget} />
            <Text style={styles.stepTextTarget}>Lush</Text>
          </View>
        </View>

        {/* Quick revive notice */}
        <View style={styles.reviveNoticeBox}>
          <Info size={14} color="#92400E" strokeWidth={2} />
          <Text style={styles.reviveNoticeText}>
            Submitting any 1 green deed today immediately restores Healthy stage!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // ── Header Styles ─────────────────────────────────────────────────────────
  headerSection: {
    marginBottom: 16,
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF2E8',
    borderColor: '#C5D8C1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  sectorBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#3A5A43',
  },
  headerTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    color: '#1C1917',
    marginBottom: 6,
  },
  headerSubtext: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13.5,
    lineHeight: 20,
    color: '#57534E',
  },

  // ── Global Progress Card ──────────────────────────────────────────────────
  globalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#292524',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  globalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  metaLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#566549',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#047857',
  },
  globalMetricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  globalMetricsTextCol: {
    flex: 1,
    minWidth: 0,
  },
  globalHeroTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 19,
    lineHeight: 25,
    color: '#1C1917',
    marginBottom: 2,
  },
  globalHeroSub: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13.5,
    lineHeight: 18,
    color: '#4A6D56',
  },
  participationPill: {
    backgroundColor: '#EAF2E8',
    borderColor: '#C5D8C1',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participationPillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 16,
    lineHeight: 20,
    color: '#2D4A36',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#F0EDE7',
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A6D56',
    borderRadius: 9999,
  },
  globalStatsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  footerStatLeft: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#57534E',
  },
  footerStatRight: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#78716C',
  },
  boldGreen: {
    fontFamily: 'SourceSans3_700Bold',
    color: '#4A6D56',
  },
  boldMuted: {
    fontFamily: 'SourceSans3_700Bold',
    color: '#44403C',
  },

  // ── Living Task Card ──────────────────────────────────────────────────────
  livingTaskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4DECE',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#4A6D56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#1C1917',
  },
  deedsBadge: {
    backgroundColor: '#EAF2E8',
    borderColor: '#C5D8C1',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999,
  },
  deedsBadgeText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11.5,
    color: '#3A5A43',
  },
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  trackerVisualCol: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6, // Placed neatly below circle with zero overlap
    flexShrink: 0,
  },
  circularVisualContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  leafIconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafIconBackdrop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF2E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringRatioTag: {
    backgroundColor: '#4A6D56',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
  },
  ringRatioTagText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  statusTextCol: {
    flex: 1,
    minWidth: 0,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  stageDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  stagePillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#065F46',
  },
  statusMainDescription: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    lineHeight: 18.5,
    color: '#292524',
    marginBottom: 4,
  },
  statusMetaNotice: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#78716C',
  },
  stepperDivider: {
    height: 1,
    backgroundColor: '#F0EDE7',
    marginVertical: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  stepPillInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5F5F4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  stepDotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A8A29E',
  },
  stepTextInactive: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#78716C',
  },
  stepPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF2E8',
    borderColor: '#7D9B76',
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  stepDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A6D56',
  },
  stepTextActive: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11.5,
    color: '#2D4A36',
  },
  stepPillTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAFAF9',
    borderColor: '#E7E5E4',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  stepDotTarget: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D6D3D1',
  },
  stepTextTarget: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#A8A29E',
  },

  // ── "No Action" Withered State Demonstration Card ────────────────────────
  witheredCard: {
    backgroundColor: '#FFFBEB', // bg-amber-50
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE68A', // amber-200
    padding: 18,
    marginBottom: 8,
  },
  witheredTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  witheredTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16.5,
    lineHeight: 22,
    color: '#78350F', // text-amber-900
  },
  witheredAlertBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  witheredAlertBadgeText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#92400E', // text-amber-800
  },
  witheredLeafBackdrop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  witheredTiltedLeaf: {
    transform: [{ rotate: '45deg' }],
  },
  witheredRatioTag: {
    backgroundColor: '#92400E',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
  },
  witheredRatioTagText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  witheredStagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  witheredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  witheredStagePillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#92400E',
  },
  witheredStatusMainText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13.5,
    lineHeight: 18.5,
    color: '#92400E', // text-amber-800
    marginBottom: 4,
  },
  witheredSubtext: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: '#78350F', // dry amber brown
  },
  witheredDivider: {
    height: 1,
    backgroundColor: '#FDE68A',
    marginVertical: 12,
  },
  witheredStepPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  witheredStepDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  witheredStepTextActive: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11.5,
    color: '#78350F',
  },
  reviveNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
  },
  reviveNoticeText: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#92400E',
  },
});
