/**
 * SIM-07
 * Full-height bottom sheet for My Day routine timeline.
 * Matches docs/screenshot/simulator/simulator_routine.png
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
  Armchair,
  Snowflake,
  Fan,
  Lightbulb,
  MoreVertical,
  Plus,
  Info,
} from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { StoredRoom } from '../logic/storage';
import { RoutineBlock, ApplianceInUse } from '../logic/myDayLogic';

interface MyDayTimelineSheetProps {
  visible: boolean;
  onClose: () => void;
  blocks: RoutineBlock[];
  rooms?: StoredRoom[];
  onAddBlockPress: () => void;
  onEditBlockPress: (block: RoutineBlock) => void;
  onSaveSchedule: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getBlockIcon(iconType: RoutineBlock['iconType']) {
  const props = { size: 18, color: '#292524', strokeWidth: 1.5 };
  switch (iconType) {
    case 'sleep':
      return <Moon {...props} />;
    case 'shower':
      return <ShowerHead {...props} />;
    case 'meal':
      return <Utensils {...props} />;
    case 'away':
      return <Lock {...props} />;
    case 'evening':
      return <Armchair {...props} />;
    default:
      return <Tv {...props} />;
  }
}

function getBlockIconBg(iconType: RoutineBlock['iconType']) {
  switch (iconType) {
    case 'sleep':
      return '#F7EFE6';
    case 'shower':
      return '#E0E8D7';
    case 'meal':
      return '#FCEEE5';
    case 'away':
      return '#EFECE6';
    case 'evening':
    default:
      return '#E0E8D7';
  }
}

function getApplianceIcon(icon?: ApplianceInUse['icon']) {
  const props = { size: 16, color: '#57534E', strokeWidth: 1.5 };
  switch (icon) {
    case 'ac':
      return <Snowflake {...props} />;
    case 'fan':
      return <Fan {...props} />;
    case 'light':
      return <Lightbulb {...props} />;
    case 'tv':
    default:
      return <Tv {...props} />;
  }
}

export function MyDayTimelineSheet({
  visible,
  onClose,
  blocks,
  rooms = [],
  onAddBlockPress,
  onEditBlockPress,
  onSaveSchedule,
}: MyDayTimelineSheetProps) {
  const [activeDay, setActiveDay] = useState('Mon');

  const getRoomName = (roomId: string) => {
    const found = rooms.find((r) => r.id === roomId || r.type === roomId);
    if (found?.name) return found.name;
    if (found?.type) {
      return found.type.charAt(0).toUpperCase() + found.type.slice(1);
    }
    return roomId.charAt(0).toUpperCase() + roomId.slice(1);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="My day"
      height="88%"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
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
                <Text
                  style={[
                    styles.dayPillText,
                    isSelected && styles.dayPillTextActive,
                  ]}
                >
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
            <View style={[styles.timelineSegment, { flex: 3, backgroundColor: '#8b9d77' }]} />
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
            const hasAppliancesInUse =
              Boolean(block.appliancesInUse && block.appliancesInUse.length > 0);

            return (
              <View
                key={block.id}
                style={[
                  styles.blockCard,
                  isAway && styles.blockCardAway,
                ]}
              >
                <Pressable
                  style={styles.blockHeader}
                  onPress={() => !isAway && onEditBlockPress(block)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${block.name}`}
                  disabled={isAway}
                >
                  <View
                    style={[
                      styles.blockIconCircle,
                      { backgroundColor: getBlockIconBg(block.iconType) },
                    ]}
                  >
                    {getBlockIcon(block.iconType)}
                  </View>

                  <View style={styles.blockMeta}>
                    <Text style={styles.blockTimeTitle}>
                      {block.startTime} – {block.endTime} · {block.name}
                    </Text>
                    {block.description && (
                      <Text style={styles.blockDesc}>{block.description}</Text>
                    )}
                    <View style={styles.roomTagRow}>
                      <View style={styles.roomTag}>
                        <Text style={styles.roomTagText}>
                          {getRoomName(block.roomId)}
                        </Text>
                      </View>
                      {!isAway && (
                        <Text style={styles.activeAppCount}>
                          {block.applianceIds.length || 3} active appliances
                        </Text>
                      )}
                    </View>
                  </View>

                  {!isAway && (
                    <Pressable
                      style={styles.moreBtn}
                      onPress={() => onEditBlockPress(block)}
                      accessibilityRole="button"
                      accessibilityLabel={`Options for ${block.name}`}
                    >
                      <MoreVertical size={18} color="#78716C" strokeWidth={1.5} />
                    </Pressable>
                  )}
                </Pressable>

                {/* Away notice banner */}
                {isAway && (
                  <View style={styles.awayBanner}>
                    <Info size={16} color="#92600E" strokeWidth={1.5} />
                    <Text style={styles.awayBannerText}>
                      You are marked away at this time. Manual appliance consumption will not be counted.
                    </Text>
                  </View>
                )}

                {/* Room Appliances in Use (matching screenshot 5th block) */}
                {hasAppliancesInUse && (
                  <View style={styles.appliancesInUseSection}>
                    <Text style={styles.appliancesInUseHeading}>
                      ROOM APPLIANCES IN USE
                    </Text>
                    <View style={styles.appliancesInUseList}>
                      {block.appliancesInUse?.map((app) => (
                        <View key={app.id} style={styles.applianceInUseRow}>
                          <View style={styles.applianceInUseLeft}>
                            <View style={styles.applianceInUseIconBox}>
                              {getApplianceIcon(app.icon)}
                            </View>
                            <View>
                              <Text style={styles.applianceInUseName}>
                                {app.name}
                              </Text>
                              <Text style={styles.applianceInUseTime}>
                                {app.timeRange || `${block.startTime}-${block.endTime}`}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.applianceInUseWatts}>
                            {app.wattage} W
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
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
    backgroundColor: '#F5F5F4', // stone-100
  },
  dayPillActive: {
    backgroundColor: '#E0E6D9', // sage-100
  },
  dayPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#78716C',
  },
  dayPillTextActive: {
    color: '#292524',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4A373', // tan-400
    marginTop: 4,
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 16,
    gap: 8,
  },
  timelineBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: '#E7E5E4',
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
    color: '#A8A29E',
  },
  blocksList: {
    gap: 12,
  },
  blockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 16,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  blockCardAway: {
    backgroundColor: '#F9F8F6',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  blockIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockMeta: {
    flex: 1,
    gap: 2,
  },
  blockTimeTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14.5,
    color: '#292524',
  },
  blockDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534E',
    lineHeight: 18,
    marginTop: 1,
  },
  roomTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  roomTag: {
    backgroundColor: '#FAF6F1',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  roomTagText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#57534E',
  },
  activeAppCount: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
  },
  moreBtn: {
    padding: 4,
    marginTop: -2,
  },
  awayBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  awayBannerText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#92600E',
    flex: 1,
    lineHeight: 16.5,
  },
  appliancesInUseSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
    gap: 8,
  },
  appliancesInUseHeading: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: '#78716C',
    marginBottom: 4,
  },
  appliancesInUseList: {
    gap: 8,
  },
  applianceInUseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ECE7DE',
  },
  applianceInUseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  applianceInUseIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  applianceInUseName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    color: '#292524',
  },
  applianceInUseTime: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#78716C',
  },
  applianceInUseWatts: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#57534E',
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  addBlockBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 9999,
  },
  saveBtn: {
    width: '100%',
    backgroundColor: '#566549',
    borderRadius: 9999,
  },
});
