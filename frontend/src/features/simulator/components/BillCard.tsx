import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Bell, CalendarCheck, FastForward, Gauge, Clock } from 'lucide-react-native';
import { SimSpeed } from '../logic/routineConfig';

interface BillCardProps {
  monthlyBillRm: number;
  usageBadge: 'Low Usage' | 'Normal Usage' | 'High Usage';
  simulatedTimeStr: string;
  simSpeed: SimSpeed;
  isEditMode?: boolean;
  onCycleSpeed: () => void;
  onToggleEdit?: () => void;
  onPressBillCard?: () => void;
  onPressBell?: () => void;
  onPressCalendar?: () => void;
}

export function BillCard({
  monthlyBillRm,
  usageBadge,
  simulatedTimeStr,
  simSpeed,
  isEditMode = false,
  onCycleSpeed,
  onToggleEdit,
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
      {/* ── Left: Compact Estimated Bill Card (p-4, 28px Lora RM 0) ─────── */}
      <Pressable
        style={styles.billCard}
        onPress={onPressBillCard}
        accessibilityRole="button"
        accessibilityLabel={`Estimated monthly bill RM ${monthlyBillRm}, ${usageBadge}`}
      >
        {/* Header row with badge */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleRow}>
            <Gauge size={13} color="#78716C" strokeWidth={1.5} />
            <Text style={styles.cardTitle}>ESTIMATED BILL</Text>
          </View>
          <View style={[styles.badgeContainer, { backgroundColor: badgeColors.bg }]}>
            <Text style={[styles.badgeText, { color: badgeColors.text }]}>
              {usageBadge}
            </Text>
          </View>
        </View>

        {/* Hero Number (exact 28px Lora font) */}
        <View style={styles.heroRow}>
          <Text style={styles.heroAmount}>RM {monthlyBillRm}</Text>
          <Text style={styles.heroUnit}> / mo</Text>
        </View>

        {/* Subtle Divider */}
        <View style={styles.divider} />

        {/* Simulated Time */}
        <View style={styles.timeRow}>
          <Clock size={12} color="#78716C" strokeWidth={1.5} />
          <Text style={styles.timeText}>Today • {simulatedTimeStr}</Text>
        </View>
      </Pressable>

      {/* ── Right: Button Stack + Edit/Done Button ──────────────────────── */}
      <View style={styles.buttonStack}>
        {/* Bell Button */}
        <Pressable
          style={styles.roundButton}
          onPress={onPressBell}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={18} color="#292524" strokeWidth={1.5} />
          <View style={styles.bellDot} />
        </Pressable>

        {/* Calendar Check Button */}
        <Pressable
          style={styles.roundButton}
          onPress={onPressCalendar}
          accessibilityRole="button"
          accessibilityLabel="View Routine Schedule"
        >
          <CalendarCheck size={18} color="#292524" strokeWidth={1.5} />
        </Pressable>

        {/* Fast-forward Button */}
        <Pressable
          style={[styles.roundButton, styles.fastForwardButton]}
          onPress={onCycleSpeed}
          accessibilityRole="button"
          accessibilityLabel={`Simulation speed ${simSpeed}x. Tap to cycle speed.`}
        >
          <FastForward size={17} color="#FFFFFF" strokeWidth={1.5} />
          <View style={styles.speedBadge}>
            <Text style={styles.speedBadgeText}>{simSpeed}x</Text>
          </View>
        </Pressable>

        {/* Edit / Done Button matching screenshot position */}
        {onToggleEdit && (
          <Pressable
            style={styles.editButton}
            onPress={onToggleEdit}
            accessibilityRole="button"
            accessibilityLabel={isEditMode ? 'Done editing floor plan' : 'Edit floor plan'}
          >
            <Text style={styles.editButtonText}>
              {isEditMode ? 'Done' : 'Edit'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  billCard: {
    width: '58%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#78716C',
  },
  badgeContainer: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 9999,
  },
  badgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 9.5,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  heroAmount: {
    fontFamily: 'Lora_700Bold',
    fontSize: 28, // strictly 28px Lora font
    lineHeight: 32,
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  heroUnit: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716C',
    marginLeft: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EFE9',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#57534E',
  },
  buttonStack: {
    alignItems: 'center',
    gap: 8,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
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
    borderRadius: 5,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
  },
  speedBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 8,
    color: '#FFFFFF',
  },
  editButton: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  editButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#3D5236',
  },
});
