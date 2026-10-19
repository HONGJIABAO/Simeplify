import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sprout, Leaf, Droplets, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Card } from '../Card';
import { MiniCard } from '../MiniCard';
import { Skeleton } from '../Skeleton';
import { Button } from '../Button';
import { MOCK_AI_ANALYSIS } from '@/lib/mockData';

export type AIAnalysisStatus = 'loaded' | 'loading' | 'error' | 'first_bill';

export interface AIAnalysisCardProps {
  status?: AIAnalysisStatus;
  data?: typeof MOCK_AI_ANALYSIS;
  onRetry?: () => void;
}

export function AIAnalysisCard({
  status = 'loaded',
  data = MOCK_AI_ANALYSIS,
  onRetry,
}: AIAnalysisCardProps) {
  if (status === 'loading') {
    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconSprout}>
            <Sprout size={20} color="#566549" strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>AI Analysis</Text>
        </View>
        <Text style={styles.loadingNote}>Analyzing your latest bill with EcoTwin AI...</Text>
        <View style={styles.skeletonGap}>
          <Skeleton height={20} width="90%" />
          <Skeleton height={20} width="70%" />
        </View>
        <View style={styles.metricRow}>
          <Skeleton height={80} style={{ flex: 1, borderRadius: 20 }} />
          <Skeleton height={80} style={{ flex: 1, borderRadius: 20 }} />
        </View>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconSprout}>
            <AlertTriangle size={20} color="#a8442f" strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>AI Analysis Unavailable</Text>
        </View>
        <Text style={styles.errorText}>
          We could not generate insights right now. Your bill is safely recorded in the archive.
        </Text>
        {onRetry && (
          <Button
            variant="secondary"
            leftIcon={<RefreshCw size={16} color="#292524" strokeWidth={1.5} />}
            onPress={onRetry}
            style={styles.retryButton}
          >
            Try again
          </Button>
        )}
      </Card>
    );
  }

  if (status === 'first_bill') {
    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconSprout}>
            <Sprout size={20} color="#566549" strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>AI Analysis</Text>
        </View>
        <Text style={styles.summaryCopy}>
          This is your first uploaded bill! A full comparative trend will appear once next month&apos;s statement is uploaded.
        </Text>
        <MiniCard tone="subtle" style={styles.firstBillCard}>
          <Text style={styles.firstBillText}>
            Electricity is currently calibrated against your Simulator baseline (525 kWh est.). Water volume is within standard thresholds.
          </Text>
        </MiniCard>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconSprout}>
            <Sprout size={20} color="#566549" strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>AI Analysis</Text>
        </View>

        <View style={styles.tariffPill}>
          <Text style={styles.tariffText}>Tariff Band A</Text>
        </View>
      </View>

      {/* Summary Copy */}
      <Text style={styles.summaryCopy}>{data.summary}</Text>

      {/* 2-Column Metric Nested Sub-Cards */}
      <View style={styles.metricRow}>
        {/* Left: Peak Electricity */}
        <MiniCard tone="subtle" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Peak electricity</Text>
          <View style={styles.valueRow}>
            <Text style={styles.metricValue}>{data.peakElectricityKwh}</Text>
            <Text style={styles.metricUnit}>kWh</Text>
          </View>
          <Text style={styles.elecChange}>↑ +{data.electricityChangePct}% vs last mo</Text>
        </MiniCard>

        {/* Right: Base Water */}
        <MiniCard tone="subtle" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Base water</Text>
          <View style={styles.valueRow}>
            <Text style={styles.metricValue}>{data.baseWaterM3}</Text>
            <Text style={styles.metricUnit}>m³</Text>
          </View>
          <Text style={styles.waterAnomaly}>↑ +{data.waterChangePct}% anomaly</Text>
        </MiniCard>
      </View>

      {/* TRY THIS NEXT Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsHeader}>TRY THIS NEXT</Text>

        {/* Tip 1 */}
        <MiniCard tone="subtle" style={styles.tipCard}>
          <View style={styles.tipIconCircleLeaf}>
            <Leaf size={16} color="#566549" strokeWidth={1.5} />
          </View>
          <Text style={styles.tipText}>
            Set master bedroom AC timer to 26°C with ceiling fan assistance (
            <Text style={styles.tipHighlight}>Save ~RM 35/mo</Text>).
          </Text>
        </MiniCard>

        {/* Tip 2 */}
        <MiniCard tone="subtle" style={styles.tipCard}>
          <View style={styles.tipIconCircleDrop}>
            <Droplets size={16} color="#b91c1c" strokeWidth={1.5} />
          </View>
          <Text style={styles.tipText}>
            Inspect toilet cistern seal in downstairs guest bath for silent leak.
          </Text>
        </MiniCard>
      </View>

      {/* Footer Disclaimer */}
      <Text style={styles.footerNote}>{data.footerDisclaimer}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconSprout: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#e0e6d9', // sage-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
  },
  tariffPill: {
    backgroundColor: '#f4f1ea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  tariffText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
  },
  summaryCopy: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#44403c',
    lineHeight: 20,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 14,
  },
  metricLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'Lora_700Bold',
    fontSize: 24,
    color: '#292524',
  },
  metricUnit: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716c',
  },
  elecChange: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#a46b2c', // warm amber
  },
  waterAnomaly: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#b91c1c', // alert red
  },
  tipsSection: {
    marginBottom: 16,
  },
  tipsHeader: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#78716c',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  tipIconCircleLeaf: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e6d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipIconCircleDrop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#292524',
    flex: 1,
    lineHeight: 18,
  },
  tipHighlight: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  footerNote: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#8c857b',
    lineHeight: 16,
  },
  loadingNote: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
    marginVertical: 10,
  },
  skeletonGap: {
    gap: 8,
    marginVertical: 10,
  },
  errorText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#a8442f',
    marginVertical: 12,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  firstBillCard: {
    padding: 14,
    marginTop: 10,
  },
  firstBillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    lineHeight: 18,
  },
});
