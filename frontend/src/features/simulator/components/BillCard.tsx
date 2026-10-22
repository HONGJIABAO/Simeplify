import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CalendarCheck, CalendarDays, FastForward, Gauge, Square } from 'lucide-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BellPill } from '@/components/layout/BellPill';

export type FastForwardPeriod = '1M' | '6M' | '1Y';

interface BillCardProps {
  monthlyBillRm: number;
  usageBadge?: 'Low Usage' | 'Normal Usage' | 'High Usage' | null;
  simulatedDateStr: string;
  activeFastForward: FastForwardPeriod | null;
  isFastForwardPlaying?: boolean;
  fastForwardSavingsRm?: number | null;
  fastForwardDisabled?: boolean;
  isEditMode?: boolean;
  hasUnreadNotifications?: boolean;
  onSelectFastForward: (period: FastForwardPeriod) => void;
  onToggleFastForward?: () => void;
  onToggleEdit?: () => void;
  onTidyUp?: () => void;
  onPressBillCard?: () => void;
  onPressBell?: () => void;
  onPressCalendar?: () => void;
}

export function BillCard({
  monthlyBillRm,
  usageBadge: _usageBadge,
  simulatedDateStr,
  activeFastForward,
  isFastForwardPlaying = false,
  fastForwardSavingsRm,
  fastForwardDisabled = false,
  isEditMode = false,
  hasUnreadNotifications = false,
  onSelectFastForward,
  onToggleFastForward,
  onToggleEdit,
  onTidyUp,
  onPressBillCard,
  onPressBell,
  onPressCalendar,
}: BillCardProps) {
  const [fastForwardOpen, setFastForwardOpen] = useState(false);
  const menuProgress = useSharedValue(0);

  useEffect(() => {
    menuProgress.value = withTiming(fastForwardOpen ? 1 : 0, {
      duration: 450,
      easing: Easing.inOut(Easing.ease),
    });
  }, [fastForwardOpen, menuProgress]);

  const fastForwardMenuStyle = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
    transform: [{ translateX: (1 - menuProgress.value) * 20 }],
  }));

  return (
    <View style={styles.topContainer}>
      <View style={styles.topRow}>
        {/* ── Left: Compact Estimated Bill Card (p-4, 28px Lora RM 0) ─────── */}
        <Pressable
          style={styles.billCard}
          onPress={onPressBillCard}
          accessibilityRole="button"
          accessibilityLabel={`Estimated monthly bill RM ${monthlyBillRm}`}
        >
        {/* Header row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleRow}>
            <Gauge size={13} color="#78716C" strokeWidth={1.5} />
            <Text style={styles.cardTitle}>ESTIMATED BILL</Text>
          </View>
        </View>

        {/* Hero Number (exact 28px Lora font) */}
        <View style={styles.heroRow}>
          <Text style={styles.heroAmount}>RM {monthlyBillRm}</Text>
          <Text style={styles.heroUnit}> / mo</Text>
        </View>

        {/* Subtle Divider */}
        <View style={styles.divider} />

        {/* Simulated Date */}
        <View style={styles.timeRow}>
          <CalendarDays size={12} color="#78716C" strokeWidth={1.5} />
          <Text style={styles.timeText}>{simulatedDateStr}</Text>
        </View>
        </Pressable>

        {/* ── Right: notification and schedule buttons ─────────────────── */}
        <View style={styles.buttonStack}>
          {/* Bell Button (matching Bin page unified pill) */}
          <BellPill hasUnread={hasUnreadNotifications} onPress={onPressBell} />

          {/* Calendar Check Button */}
        <Pressable
          style={styles.roundButton}
          onPress={onPressCalendar}
          accessibilityRole="button"
          accessibilityLabel="Set My Day schedule"
          accessibilityHint="Opens your daily routine and time blocks"
        >
          <CalendarCheck size={18} color="#292524" strokeWidth={1.5} />
        </Pressable>

        </View>
      </View>

      {/* A full-width control row keeps Edit under the bill and FF at the far right. */}
      <View style={styles.controlRow}>
        {onToggleEdit ? <View style={styles.editActions}>
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
        </View> : <View style={styles.editButtonPlaceholder} />}

        {/* Fast-forward Button + period menu that grows to the left */}
        <View style={styles.fastForwardRow}>
          <Animated.View
            pointerEvents={fastForwardOpen ? 'auto' : 'none'}
            style={[styles.fastForwardTray, fastForwardMenuStyle]}
          >
            {(['1M', '6M', '1Y'] as FastForwardPeriod[]).map((period) => (
              <Pressable
                key={period}
                onPress={() => {
                  onSelectFastForward(period);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Fast forward ${period === '1M' ? 'one month' : period === '6M' ? 'six months' : 'one year'}`}
                style={({ pressed }) => [
                  styles.periodButton,
                  activeFastForward === period && styles.periodButtonActive,
                  pressed && styles.periodButtonPressed,
                ]}
              >
                <Text style={[
                  styles.periodButtonText,
                  activeFastForward === period && styles.periodButtonTextActive,
                ]}>
                  {period}
                </Text>
              </Pressable>
            ))}
          </Animated.View>

          <Pressable
            style={[styles.roundButton, styles.fastForwardButton, fastForwardDisabled && styles.fastForwardDisabled]}
            disabled={fastForwardDisabled}
            onPress={() => {
              if (isFastForwardPlaying) { onToggleFastForward?.(); return; }
              if (!fastForwardOpen) { setFastForwardOpen(true); return; }
              onToggleFastForward?.();
              setFastForwardOpen(false);
            }}
            accessibilityRole="button"
            accessibilityLabel={isFastForwardPlaying ? 'Stop fast-forward week preview' : fastForwardOpen ? 'Play fast-forward week preview' : 'Choose fast-forward period'}
            accessibilityState={{ expanded: fastForwardOpen }}
          >
            {isFastForwardPlaying ? <Square size={15} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1.5} />
              : <FastForward size={17} color="#FFFFFF" strokeWidth={1.5} />}
            {!!activeFastForward && (
              <View style={styles.speedBadge}>
                <Text style={styles.speedBadgeText}>{activeFastForward}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    width: '100%',
    marginBottom: 8,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  savingsText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 11, color: '#566549' },
  buttonStack: {
    alignItems: 'flex-end',
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
  fastForwardButton: {
    backgroundColor: '#1E1E1E',
    borderColor: '#1E1E1E',
  },
  fastForwardDisabled: { opacity: 0.4 },
  fastForwardRow: {
    width: 44,
    height: 44,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  fastForwardTray: {
    position: 'absolute',
    right: 52,
    width: 164,
    height: 56,
    borderRadius: 28,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF6F1',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  periodButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6D3D1',
  },
  periodButtonActive: {
    backgroundColor: '#E0E6D9',
    borderColor: '#8B9D77',
  },
  periodButtonPressed: {
    backgroundColor: '#F5F5F4',
    transform: [{ translateY: 2 }],
  },
  periodButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
  },
  periodButtonTextActive: {
    color: '#566549',
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
    minWidth: 52,
    height: 44,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#F1F4EE',
    borderWidth: 1,
    borderColor: '#C5D0B9',
  },
  editButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#3D5236',
  },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tidyButton: { height: 44, minWidth: 92, paddingHorizontal: 12, borderRadius: 22, flexDirection: 'row', gap: 6,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F2', borderWidth: 1, borderColor: '#C5D0B9' },
  tidyButtonText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 13, color: '#566549' },
  editButtonPlaceholder: {
    width: 52,
    height: 44,
  },
  controlRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    marginTop: 8,
  },
});
