import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { House, Bell, Mail, Sprout, Check, ChevronDown } from 'lucide-react-native';
import { CommunityViewMode, VotingPhase } from '../types';

interface CommunityHeaderProps {
  votingPhase: VotingPhase;
  viewMode: CommunityViewMode;
  onToggleViewMode: (mode: CommunityViewMode) => void;
  onPressNotifications?: () => void;
  onPressOakridge?: () => void;
}

export function CommunityHeader({
  votingPhase,
  viewMode,
  onToggleViewMode,
  onPressNotifications,
  onPressOakridge,
}: CommunityHeaderProps) {
  return (
    <View style={styles.headerWrapper}>
      {/* Top Sector & Edition Bar */}
      <View style={styles.topRow}>
        <Pressable
          onPress={onPressOakridge}
          accessibilityRole="button"
          accessibilityLabel="Oakridge Commons participation breakdown"
          style={({ pressed }) => [
            styles.sectorRow,
            pressed && { opacity: 0.75 },
          ]}
        >
          <House size={16} color="#57534E" strokeWidth={1.5} />
          <Text style={styles.sectorText}>Oakridge Commons • Sector 4B</Text>
          <ChevronDown size={14} color="#78716C" strokeWidth={1.8} />
        </Pressable>

        <View style={styles.rightGroup}>
          <Text style={styles.editionText}>October Edition</Text>
          <Pressable
            onPress={onPressNotifications}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={({ pressed }) => [
              styles.notificationButton,
              pressed && styles.notificationButtonPressed,
            ]}
          >
            <Bell size={19} color="#292524" strokeWidth={1.5} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
      </View>

      {/* Dynamic Header / Tab State */}
      {/* Phase 1: Initial / New Letter (Only letter element is visible, Living Task is hidden) */}
      {votingPhase === 'new' && (
        <View style={styles.singlePillWrapper}>
          <View style={styles.singleIndicatorPill}>
            <Mail size={14} color="#566549" strokeWidth={1.8} />
            <Text style={styles.singleIndicatorText}>Monthly Letter</Text>
            <View style={styles.pulseDot} />
          </View>
        </View>
      )}

      {/* Phase 2: Voted / Waiting / Result Announced before clicking "Got it" */}
      {votingPhase === 'sealed' && (
        <View style={styles.singlePillWrapper}>
          <View style={styles.singleIndicatorPill}>
            <Check size={14} color="#566549" strokeWidth={2.5} />
            <Text style={styles.singleIndicatorText}>Ballot Sealed</Text>
            <View style={styles.sealedTagDot} />
          </View>
        </View>
      )}

      {/* Phase 3: Challenge Started (Living Task) */}
      {/* "Ballot Sealed" is COMPLETELY UNMOUNTED AND REMOVED. Only "Living Task (Day 1)" is visible */}
      {votingPhase === 'tasks' && (
        <View style={styles.singlePillWrapper}>
          <View style={styles.activeLivingTaskPill}>
            <Sprout size={14} color="#566549" strokeWidth={2} />
            <Text style={styles.activeLivingTaskText}>Living Task</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day 1</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 4,
  },
  sectorText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#57534E',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editionText: {
    fontFamily: 'Lora_500Medium',
    fontSize: 15,
    color: '#292524',
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationButtonPressed: {
    backgroundColor: '#F5F5F4',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#A97A4A',
  },
  singlePillWrapper: {
    marginTop: 12,
    alignItems: 'center',
  },
  singleIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#E5ECE0',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#C5D4BF',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  singleIndicatorText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#425438',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#566549',
    marginLeft: 2,
  },
  sealedTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#566549',
    marginLeft: 2,
  },
  activeLivingTaskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 7.5,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: '#8B9D77',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  activeLivingTaskText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13.5,
    color: '#292524',
  },
  dayBadge: {
    backgroundColor: '#E5ECE0',
    paddingHorizontal: 7.5,
    paddingVertical: 1.5,
    borderRadius: 9999,
    marginLeft: 3,
  },
  dayBadgeText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 10.5,
    color: '#425438',
  },
});
