import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, AlertCircle, Droplets, Zap, ShieldAlert } from 'lucide-react-native';
import { type WaterAlertLevel } from '@/lib/waterLevel';

export type BillAlertDisplayLevel =
  | WaterAlertLevel
  | 'spike_detected'
  | 'electricity_spike'
  | 'anomaly';

export interface WaterAlertProps {
  level?: BillAlertDisplayLevel;
  momPercent?: number | null;
  monthName?: string;
  utilityType?: 'electricity' | 'water';
  title?: string;
  message?: string;
  promptAction?: string;
}

export function WaterAlert({
  level = 'normal',
  momPercent,
  monthName,
  utilityType,
  title,
  message,
  promptAction,
}: WaterAlertProps) {
  if (!level || level === 'normal') {
    return null;
  }

  const momText =
    typeof momPercent === 'number' && !isNaN(momPercent)
      ? `${momPercent > 0 ? '+' : ''}${Math.round(momPercent)}%`
      : null;

  // Electricity Spike Anomaly
  if (level === 'spike_detected' || level === 'electricity_spike' || utilityType === 'electricity') {
    return (
      <View style={styles.elecSpikeBanner}>
        <View style={styles.headerRow}>
          <View style={styles.badgeLeft}>
            <View style={styles.elecIconCircle}>
              <Zap size={18} color="#92400e" strokeWidth={2} />
            </View>
            <Text style={styles.elecTitle}>{title || 'HIGH ELECTRICITY SPIKE DETECTED'}</Text>
          </View>
          {monthName ? <Text style={styles.elecStatement}>{monthName}</Text> : null}
        </View>

        <Text style={styles.elecBody}>
          {message ||
            `High electricity spike detected${
              momText ? ` (${momText} vs previous month)` : ''
            }. Please check if high-drain appliances or lights were accidentally left on.`}
        </Text>

        <View style={styles.promptActionBox}>
          <ShieldAlert size={15} color="#92400e" strokeWidth={1.5} />
          <Text style={styles.promptActionText}>
            {promptAction || 'Please check your household and verify the anomaly.'}
          </Text>
        </View>
      </View>
    );
  }

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
            <Text style={styles.majorTitle}>{title || 'MAJOR PIPE BURST ALERT'}</Text>
          </View>
          {monthName ? <Text style={styles.majorStatement}>{monthName}</Text> : null}
        </View>
        <Text style={styles.majorBody}>
          {message ||
            `Water use doubled${
              momText ? ` (${momText})` : ''
            }. Check for a burst pipe and consider closing the main valve immediately.`}
        </Text>
        <View style={styles.promptActionBoxBurst}>
          <ShieldAlert size={15} color="#a8442f" strokeWidth={1.5} />
          <Text style={styles.promptActionTextBurst}>
            {promptAction || 'Please check your household and verify the anomaly.'}
          </Text>
        </View>
      </View>
    );
  }

  // Water Anomaly: leak_detected
  return (
    <View style={styles.leakBanner}>
      <View style={styles.headerRow}>
        <View style={styles.badgeLeft}>
          <View style={styles.leakIconCircle}>
            <AlertTriangle size={18} color="#8F5B14" strokeWidth={1.5} />
          </View>
          <Text style={styles.leakTitle}>{title || 'UNUSUAL WATER USAGE DETECTED'}</Text>
        </View>
        {monthName ? <Text style={styles.leakStatement}>{monthName}</Text> : null}
      </View>

      <Text style={styles.leakBody}>
        {message ||
          `Unusual water usage detected${
            momText ? ` (${momText} vs previous month)` : ''
          }. Please check for potential pipe leakages.`}
      </Text>

      <View style={styles.promptActionBoxWater}>
        <ShieldAlert size={15} color="#8F5B14" strokeWidth={1.5} />
        <Text style={styles.promptActionTextWater}>
          {promptAction || 'Please check your household and verify the anomaly.'}
        </Text>
      </View>
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

  elecSpikeBanner: {
    backgroundColor: '#fffbeb', // amber-50
    borderColor: '#fde68a', // amber-200
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  elecIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  elecTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#92400e',
    letterSpacing: 0.5,
  },
  elecStatement: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#92400e',
  },
  elecBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },

  promptActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#fde68a',
  },
  promptActionText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },

  promptActionBoxWater: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5E4B8',
  },
  promptActionTextWater: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#8F5B14',
    flex: 1,
  },

  promptActionBoxBurst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2C8BE',
  },
  promptActionTextBurst: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#A8442F',
    flex: 1,
  },
});
