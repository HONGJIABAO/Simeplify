import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sprout, Leaf, Droplets, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Card } from '../Card';
import { MiniCard } from '../MiniCard';
import { Skeleton } from '../Skeleton';
import { Button } from '../Button';
import { type BillAnalysis } from '@/lib/services/scannerService';

export type AIAnalysisStatus = 'loaded' | 'loading' | 'error' | 'first_bill';

export interface AIAnalysisCardProps {
  status?: AIAnalysisStatus;
  analysis?: BillAnalysis | null;
  billType?: 'electricity' | 'water';
  billUsage?: number;
  onRetry?: () => void;
}

export function AIAnalysisCard({
  status = 'loaded',
  analysis,
  billType,
  billUsage,
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
        <Text style={styles.loadingNote}>Analyzing your bill with EcoTwin AI...</Text>
        <View style={styles.skeletonGap}>
          <Skeleton height={20} width="90%" />
          <Skeleton height={20} width="70%" />
        </View>
        <View style={styles.metricRow}>
          <Skeleton height={70} style={{ flex: 1, borderRadius: 20 }} />
          <Skeleton height={70} style={{ flex: 1, borderRadius: 20 }} />
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
        {analysis?.estimate_kwh != null && (
          <MiniCard tone="subtle" style={styles.firstBillCard}>
            <Text style={styles.firstBillText}>
              Calibrated against your Simulator baseline ({analysis.estimate_kwh} kWh est.).
            </Text>
          </MiniCard>
        )}
      </Card>
    );
  }

  const comparison = analysis?.comparison;
  const hasEstimate = analysis?.estimate_kwh != null;
  const momPct = comparison?.mom_change_pct;
  const tips = analysis?.tips || [];

  return (
    <Card style={styles.card}>
      {/* Header Row — NO Tariff Band A chip per Rule 8 & page_refined.md S7.1 */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconSprout}>
            <Sprout size={20} color="#566549" strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>AI Analysis</Text>
        </View>
      </View>

      {/* Summary Copy */}
      {analysis?.summary ? (
        <Text style={styles.summaryCopy}>{analysis.summary}</Text>
      ) : null}

      {/* Comparison & Estimate Metrics */}
      {(hasEstimate || typeof momPct === 'number' || comparison?.avg_3m_diff != null) && (
        <View style={styles.metricRow}>
          {/* Show server estimate ONLY from analysis.estimate_kwh (Rule 7) */}
          {hasEstimate ? (
            <MiniCard tone="subtle" style={styles.metricCard}>
              <Text style={styles.metricLabel}>Simulator estimate</Text>
              <View style={styles.valueRow}>
                <Text style={styles.metricValue}>{analysis.estimate_kwh}</Text>
                <Text style={styles.metricUnit}>kWh</Text>
              </View>
              {typeof billUsage === 'number' ? (
                <Text style={billUsage < (analysis.estimate_kwh ?? 0) ? styles.metricPositive : styles.metricMuted}>
                  {billUsage < (analysis.estimate_kwh ?? 0)
                    ? `Actual is ${analysis.estimate_kwh! - billUsage} kWh lower`
                    : `Actual is ${billUsage - analysis.estimate_kwh!} kWh higher`}
                </Text>
              ) : null}
            </MiniCard>
          ) : null}

          {/* MoM / History comparison */}
          {typeof momPct === 'number' ? (
            <MiniCard tone="subtle" style={styles.metricCard}>
              <Text style={styles.metricLabel}>vs Previous month</Text>
              <View style={styles.valueRow}>
                <Text style={styles.metricValue}>{momPct > 0 ? `+${momPct}` : momPct}</Text>
                <Text style={styles.metricUnit}>%</Text>
              </View>
              <Text style={momPct > 20 ? styles.metricAlert : styles.metricMuted}>
                {momPct > 20 ? 'Elevated usage' : 'Normal seasonal range'}
              </Text>
            </MiniCard>
          ) : null}
        </View>
      )}

      {/* Try this next section (up to 3 tips from server analysis) */}
      {tips.length > 0 && (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsHeader}>TRY THIS NEXT</Text>
          {tips.slice(0, 3).map((tipText, idx) => (
            <MiniCard key={`tip-${idx}`} tone="subtle" style={styles.tipCard}>
              <View style={billType === 'water' ? styles.tipIconCircleDrop : styles.tipIconCircleLeaf}>
                {billType === 'water' ? (
                  <Droplets size={16} color="#6f8260" strokeWidth={1.5} />
                ) : (
                  <Leaf size={16} color="#566549" strokeWidth={1.5} />
                )}
              </View>
              <Text style={styles.tipText}>{tipText}</Text>
            </MiniCard>
          ))}
        </View>
      )}

      {/* Footer Disclaimer */}
      <Text style={styles.footerNote}>
        {analysis?.footer_disclaimer || 'Based on your bills only. Your real usage may differ.'}
      </Text>
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
    marginBottom: 16,
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
  metricPositive: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#566549',
  },
  metricAlert: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#8F5B14',
  },
  metricMuted: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
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
    backgroundColor: '#f1f4ee',
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
