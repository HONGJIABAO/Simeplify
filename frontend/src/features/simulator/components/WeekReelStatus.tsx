import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarRange, MapPin } from 'lucide-react-native';
import type { WeekReelSegment } from '../logic/weekReel';

export function WeekReelCaption({ segment, roomName }: {
  segment: WeekReelSegment;
  roomName?: string;
  savingsRm?: number;
}) {
  const task = segment.isAway ? 'Away' : segment.block?.name ?? 'No routine';
  return <View style={styles.captionWrap} accessibilityRole="text">
    <View style={styles.captionRow}>
      <CalendarRange size={16} color="#566549" strokeWidth={1.6} />
      <Text style={styles.dayText}>{segment.day}</Text>
      <Text style={styles.taskText} numberOfLines={1}>· {task}{segment.block && !segment.isAway ? ` · ${segment.block.startTime}` : ''}</Text>
    </View>
    {!!roomName && !segment.isAway && <View style={styles.roomRow}><MapPin size={13} color="#78716C" />
      <Text style={styles.roomText}>{roomName}</Text></View>}
  </View>;
}

export function WeekReelSummary({ segments }: { segments: WeekReelSegment[]; finalSavingsRm?: number }) {
  return <View style={styles.summary} accessibilityRole="summary">
    <View style={styles.summaryHeading}><CalendarRange size={18} color="#566549" />
      <Text style={styles.summaryTitle}>Week preview</Text>
    </View>
    {segments.map((segment) => <View key={segment.day} style={styles.summaryLine}>
      <Text style={styles.summaryDay}>{segment.day.slice(0, 3)}</Text>
      <Text style={styles.summaryTask} numberOfLines={1}>{segment.isAway ? 'Away' : segment.block?.name ?? 'No routine'}</Text>
      <Text style={styles.summaryTime}>{segment.block && !segment.isAway ? segment.block.startTime : ''}</Text>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  captionWrap: { minHeight: 46, paddingHorizontal: 4, paddingVertical: 4 },
  captionRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 5 },
  dayText: { fontFamily: 'Lora_600SemiBold', fontSize: 15, color: '#292524' },
  taskText: { flex: 1, fontFamily: 'SourceSans3_600SemiBold', fontSize: 13, color: '#57534E' },
  roomRow: { height: 18, flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 21 },
  roomText: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, color: '#78716C' },
  summary: { marginVertical: 4, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: '#D9DED2', backgroundColor: '#FAF7F2' },
  summaryHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  summaryTitle: { flex: 1, fontFamily: 'Lora_600SemiBold', fontSize: 16, color: '#292524' },
  summaryLine: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryDay: { width: 28, fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#566549' },
  summaryTask: { flex: 1, fontFamily: 'SourceSans3_400Regular', fontSize: 12, color: '#292524' },
  summaryTime: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, color: '#78716C' },
});
