import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, AlertCircle, Droplets } from 'lucide-react-native';
import { type WaterAlertLevel } from '@/lib/waterLevel';

export interface WaterAlertProps {
  level?: WaterAlertLevel;
  momPercent?: number | null;
  monthName?: string;
}

export function WaterAlert({
  level = 'normal',
  momPercent,
  monthName,
}: WaterAlertProps) {
  if (!level || level === 'normal') {
    return null;
  }

  const momText = typeof momPercent === 'number' && !isNaN(momPercent) ? `${momPercent > 0 ? '+' : ''}${Math.round(momPercent)}%` : null;

  if (level === 'minor_drip') {
    return (
      <View style={styles.minorDripContainer}>
        <Droplets size={18} color="#566549" strokeWidth={1.5} />
        <Text style={styles.minorDripText}>
          {momText ? `Water usage is up ${momText} vs last month. ` : 'Water usage is elevated. '}
          Check for minor drips or loose tap fittings.
        </Text>
      </View>
    );
  }

  if (level === 'major_pipe_burst') {
    return (
      <View style={styles.majorBurstBanner}>
        <View style={styles.headerRow}>
          <View style={styles.badgeLeft}>
            <View style={styles.majorIconCircle}>
              <AlertCircle size={20} color="#a8442f" strokeWidth={1.5} />
            </View>
            <Text style={styles.majorTitle}>MAJOR PIPE BURST ALERT</Text>
          </View>
          {monthName ? <Text style={styles.majorStatement}>{monthName}</Text> : null}
        </View>
        <Text style={styles.majorBody}>
          {momText ? `Water use doubled (${momText}). ` : 'Extremely high water volume detected. '}
          Check for a burst pipe and consider closing the main valve immediately.
        </Text>
      </View>
    );
  }

  // level === 'leak_detected'
  return (
    <View style={styles.leakBanner}>
      <View style={styles.headerRow}>
        <View style={styles.badgeLeft}>
          <View style={styles.leakIconCircle}>
            <AlertTriangle size={18} color="#8F5B14" strokeWidth={1.5} />
          </View>
          <Text style={styles.leakTitle}>ANOMALY DETECTED</Text>
        </View>
        {monthName ? <Text style={styles.leakStatement}>{monthName}</Text> : null}
      </View>

      <Text style={styles.leakBody}>
        {momText ? `Water bill up ${momText} vs last month. ` : 'Unusual water consumption detected. '}
        Check the toilet cistern seal and outdoor pipes.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  leakBanner: {
    backgroundColor: '#FDF6E4',
    borderColor: '#F5E4B8',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leakIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5E6C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leakTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#8F5B14',
    letterSpacing: 0.5,
  },
  leakStatement: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#8F5B14',
  },
  leakBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#8F5B14',
    lineHeight: 20,
  },

  majorBurstBanner: {
    backgroundColor: '#FBECE8',
    borderColor: '#F2C8BE',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  majorIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7D6CF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  majorTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#A8442F',
    letterSpacing: 0.5,
  },
  majorStatement: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#A8442F',
  },
  majorBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#A8442F',
    lineHeight: 20,
  },

  minorDripContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F1F4EE',
    borderColor: '#E0E6D9',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  minorDripText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#566549',
    flex: 1,
    lineHeight: 18,
  },
});
