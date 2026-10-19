import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Bell, CalendarCheck, FastForward, Gauge, Clock } from 'lucide-react-native';
import { SimSpeed } from '../logic/routineConfig';

interface BillCardProps {
  monthlyBillRm: number;
  usageBadge: 'Low Usage' | 'Normal Usage' | 'High Usage';
  simulatedTimeStr: string;
  simSpeed: SimSpeed;
  onCycleSpeed: () => void;
  onPressBillCard?: () => void;
  onPressBell?: () => void;
  onPressCalendar?: () => void;
}

export function BillCard({
  monthlyBillRm,
  usageBadge,
  simulatedTimeStr,
  simSpeed,
  onCycleSpeed,
  onPressBillCard,
  onPressBell,
  onPressCalendar,
}: BillCardProps) {
  const badgeColors = {
    'High Usage': { bg: '#F5DCC8', text: '#8C6541' },
    'Normal Usage': { bg: '#EAE5D9', text: '#6B604B' },
    'Low Usage': { bg: '#E0E6D9', text: '#566549' },
  }[usageBadge];

  return (
    <View style={styles.topContainer}>
      {/* ── Left: Estimated Bill Card ────────────────────────────────────── */}
      <Pressable
        style={styles.billCard}
        onPress={onPressBillCard}
        accessibilityRole="button"
        accessibilityLabel={`Estimated monthly bill RM ${monthlyBillRm}, ${usageBadge}`}
      >
        {/* Header row with badge */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleRow}>
            <Gauge size={14} color="#78716C" strokeWidth={1.5} />
            <Text style={styles.cardTitle}>ESTIMATED BILL</Text>
          </View>
          <View style={[styles.badgeContainer, { backgroundColor: badgeColors.bg }]}>
            <Text style={[styles.badgeText, { color: badgeColors.text }]}>
              {usageBadge}
            </Text>
          </View>
        </View>

        {/* Hero Number */}
        <View style={styles.heroRow}>
          <Text style={styles.heroAmount}>RM {monthlyBillRm}</Text>
          <Text style={styles.heroUnit}> / mo</Text>
        </View>

        {/* Subtle Divider */}
        <View style={styles.divider} />

        {/* Simulated Time */}
        <View style={styles.timeRow}>
          <Clock size={13} color="#78716C" strokeWidth={1.5} />
          <Text style={styles.timeText}>Today • {simulatedTimeStr}</Text>
        </View>
      </Pressable>

      {/* ── Right: Button Stack ────────────────────────────────────────── */}
      <View style={styles.buttonStack}>
        {/* Bell Button */}
        <Pressable
          style={styles.roundButton}
          onPress={onPressBell}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={20} color="#292524" strokeWidth={1.5} />
          <View style={styles.bellDot} />
        </Pressable>

        {/* Calendar Check Button */}
        <Pressable
          style={styles.roundButton}
          onPress={onPressCalendar}
          accessibilityRole="button"
          accessibilityLabel="View Routine Schedule"
        >
          <CalendarCheck size={20} color="#292524" strokeWidth={1.5} />
        </Pressable>

        {/* Fast-forward Button */}
        <Pressable
          style={[styles.roundButton, styles.fastForwardButton]}
          onPress={onCycleSpeed}
          accessibilityRole="button"
          accessibilityLabel={`Simulation speed ${simSpeed}x. Tap to cycle speed.`}
        >
          <FastForward size={18} color="#FFFFFF" strokeWidth={1.5} />
          <View style={styles.speedBadge}>
            <Text style={styles.speedBadgeText}>{simSpeed}x</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 8,
  },
  billCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#78716C',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  heroAmount: {
    fontFamily: 'Lora_700Bold',
    fontSize: 32,
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  heroUnit: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#78716C',
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EFE9',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
  },
  buttonStack: {
    justifyContent: 'space-between',
    gap: 10,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#C87D55',
  },
  fastForwardButton: {
    backgroundColor: '#1E1E1E',
    borderColor: '#1E1E1E',
  },
  speedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#566549',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  speedBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 8.5,
    color: '#FFFFFF',
  },
});
