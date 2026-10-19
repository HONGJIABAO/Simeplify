/**
 * SIM-07
 * Full-height bottom sheet for My Day routine timeline.
 * Source: docs/screenshot/simulator/simulator_routine.png,
 *         docs/screen_spec.md §4.5,
 *         docs/page_refined.md S4.6.
 *
 * Features:
 * - Day-of-week / schedule toggle (Mon–Sun).
 * - 24-hour strip with time checkpoints (00:00, 06:00, 12:00, 18:00, 24:00).
 * - Activity block cards (Sleep, Shower, Meal, Away with locked amber notice, Evening).
 * - Action buttons: "+ Add time block" and "Save schedule".
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Moon,
  ShowerHead,
  Utensils,
  Lock,
  Tv,
  MoreVertical,
  Plus,
  Info,
} from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { RoutineBlock } from '../logic/myDayLogic';

interface MyDayTimelineSheetProps {
  visible: boolean;
  onClose: () => void;
  blocks: RoutineBlock[];
  onAddBlockPress: () => void;
  onEditBlockPress: (block: RoutineBlock) => void;
  onSaveSchedule: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getBlockIcon(iconType: RoutineBlock['iconType']) {
  const props = { size: 18, color: '#292524', strokeWidth: 1.5 };
  switch (iconType) {
    case 'sleep': return <Moon {...props} />;
    case 'shower': return <ShowerHead {...props} />;
    case 'meal': return <Utensils {...props} />;
    case 'away': return <Lock {...props} />;
    default: return <Tv {...props} />;
  }
}

export function MyDayTimelineSheet({
  visible,
  onClose,
  blocks,
  onAddBlockPress,
  onEditBlockPress,
  onSaveSchedule,
}: MyDayTimelineSheetProps) {
  const [activeDay, setActiveDay] = useState('Mon');

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="My day"
      height="88%"
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Day-of-week pills */}
        <View style={styles.daysRow}>
          {DAYS.map((d) => {
            const isSelected = activeDay === d;
            return (
              <Pressable
                key={d}
                style={[styles.dayPill, isSelected && styles.dayPillActive]}
                onPress={() => setActiveDay(d)}
                accessibilityRole="button"
                accessibilityLabel={d}
              >
                <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>
                  {d}
                </Text>
                {isSelected && <View style={styles.dayDot} />}
              </Pressable>
            );
          })}
        </View>

        {/* 24-Hour Timeline Bar */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineBar}>
            {/* Color-coded segments representing active blocks across 24h */}
            <View style={[styles.timelineSegment, { flex: 6.5, backgroundColor: '#c5d0b9' }]} />
            <View style={[styles.timelineSegment, { flex: 0.75, backgroundColor: '#8b9d77' }]} />
            <View style={[styles.timelineSegment, { flex: 1.25, backgroundColor: '#e6c39b' }]} />
            <View style={[styles.timelineSegment, { flex: 9, backgroundColor: '#e7e5e4' }]} />
            <View style={[styles.timelineSegment, { flex: 2.5, backgroundColor: '#faf6f1' }]} />
            <View style={[styles.timelineSegment, { flex: 3, backgroundColor: '#a8b896' }]} />
            <View style={[styles.timelineSegment, { flex: 1, backgroundColor: '#c5d0b9' }]} />
          </View>
          <View style={styles.timelineLabels}>
            <Text style={styles.timelineLabel}>00:00</Text>
            <Text style={styles.timelineLabel}>06:00</Text>
            <Text style={styles.timelineLabel}>12:00</Text>
            <Text style={styles.timelineLabel}>18:00</Text>
            <Text style={styles.timelineLabel}>24:00</Text>
          </View>
        </View>

        {/* Routine Activity Blocks List */}
        <View style={styles.blocksList}>
          {blocks.map((block) => {
            const isAway = block.isAway;

            return (
              <Pressable
                key={block.id}
                style={[
                  styles.blockCard,
                  isAway && styles.blockCardAway,
                ]}
                onPress={() => !isAway && onEditBlockPress(block)}
                disabled={isAway}
              >
                <View style={styles.blockHeader}>
                  <View style={styles.blockIconCircle}>
                    {getBlockIcon(block.iconType)}
                  </View>
                  <View style={styles.blockMeta}>
                    <Text style={styles.blockTimeTitle}>
                      {block.startTime} – {block.endTime} • {block.name}
                    </Text>
                    {block.description && (
                      <Text style={styles.blockDesc}>{block.description}</Text>
                    )}
                    <View style={styles.roomTagRow}>
                      <View style={styles.roomTag}>
                        <Text style={styles.roomTagText}>{block.roomId}</Text>
                      </View>
                      {!isAway && (
                        <Text style={styles.activeAppCount}>
                          {block.applianceIds.length} active appliances
                        </Text>
                      )}
                    </View>
                  </View>

                  {!isAway && (
                    <Pressable
                      style={styles.moreBtn}
                      onPress={() => onEditBlockPress(block)}
                    >
                      <MoreVertical size={18} color="#78716c" strokeWidth={1.5} />
                    </Pressable>
                  )}
                </View>

                {/* Away notice banner */}
                {isAway && (
                  <View style={styles.awayBanner}>
                    <Info size={16} color="#92600e" strokeWidth={1.5} />
                    <Text style={styles.awayBannerText}>
                      You are marked away at this time. Manual appliance consumption will not be counted.
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            variant="secondary"
            onPress={onAddBlockPress}
            leftIcon={<Plus size={18} color="#292524" strokeWidth={1.5} />}
            style={styles.addBlockBtn}
          >
            Add time block
          </Button>

          <Button
            variant="primary"
            onPress={() => {
              onSaveSchedule();
              onClose();
            }}
            style={styles.saveBtn}
          >
            Save schedule
          </Button>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#f5f5f4', // stone-100
  },
  dayPillActive: {
    backgroundColor: '#e0e6d9', // sage-100
  },
  dayPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#78716c',
  },
  dayPillTextActive: {
    color: '#292524',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d4a373', // tan-400
    marginTop: 4,
  },
  timelineContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 16,
    gap: 8,
  },
  timelineBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: '#e7e5e4',
  },
  timelineSegment: {
    height: 14,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#a8a29e',
  },
  blocksList: {
    gap: 12,
  },
  blockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 16,
  },
  blockCardAway: {
    backgroundColor: '#f5f5f4',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  blockIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#faf6f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockMeta: {
    flex: 1,
    gap: 2,
  },
  blockTimeTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  blockDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    lineHeight: 18,
  },
  roomTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  roomTag: {
    backgroundColor: '#faf6f1',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  roomTagText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#57534e',
    textTransform: 'capitalize',
  },
  activeAppCount: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
  },
  moreBtn: {
    padding: 4,
  },
  awayBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
  },
  awayBannerText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#92600e',
    flex: 1,
    lineHeight: 16,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  addBlockBtn: {
    width: '100%',
  },
  saveBtn: {
    width: '100%',
  },
});
