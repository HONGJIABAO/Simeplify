import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Leaf, Lightbulb, Star } from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Sprite } from './Sprite';
import { buildEnergyReport, type EnergyReportItem, type EnergySuggestion } from '../logic/energyReport';

interface AIAnalysisReportModalProps {
  visible: boolean;
  appliances: EnergyReportItem[];
  monthlyBillRm?: number;
  comparisonBaseBillRm?: number | null;
  suggestionOverride?: EnergySuggestion | null;
  onClose: () => void;
}

function metric(value: number) {
  return value.toLocaleString('en-MY', { maximumFractionDigits: 1 });
}

export function AIAnalysisReportModal({
  visible,
  appliances,
  monthlyBillRm = 0,
  comparisonBaseBillRm = null,
  suggestionOverride,
  onClose,
}: AIAnalysisReportModalProps) {
  const report = useMemo(() => buildEnergyReport(appliances, monthlyBillRm), [appliances, monthlyBillRm]);
  const comparisonSavingsRm = comparisonBaseBillRm === null || comparisonBaseBillRm === undefined
    ? null
    : Math.max(0, Math.round(comparisonBaseBillRm - report.totalBillRm));
  const suggestion = suggestionOverride === undefined ? report.suggestion : suggestionOverride;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="AI energy report" height="auto" instantOnReducedMotion>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.insightCard}>
          <View style={styles.iconCircle}><Leaf size={20} color="#566549" strokeWidth={1.7} /></View>
          <View style={styles.insightCopy}>
            <Text style={styles.sectionEyebrow}>INSIGHT</Text>
            <Text style={styles.insightText}>{report.insightText}</Text>
            {report.insight && (
              <Text style={styles.insightMetrics}>
                {metric(report.insight.monthlyKwh)} kWh/month · RM {metric(report.insight.monthlyCostRm)}/month · {report.insight.sharePct}% of bill
              </Text>
            )}
            {comparisonSavingsRm !== null && (
              <Text style={styles.comparisonText}>
                Compared with your last report, this swap saves RM {comparisonSavingsRm}/month.
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Usage details</Text>
        <View style={styles.list}>
          {report.topRows.map((row, index) => (
            <View key={row.item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
              <View style={styles.spriteBox}>
                <Sprite type={row.item.spriteKey || row.item.type} size={46} width={46} height={46} resizeMode="contain" />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.name} numberOfLines={1}>{row.brand} - {row.typeName}</Text>
                <View style={styles.starLine}>
                  <Star size={13} color="#D4A373" fill="#D4A373" strokeWidth={1.5} />
                  <Text style={styles.smallMetric}>{row.stars} stars · {metric(row.hoursPerDay)} h/day · {row.watts} W</Text>
                </View>
                <Text style={styles.energyMetric}>{metric(row.monthlyKwh)} kWh/month · RM {metric(row.monthlyCostRm)}/month</Text>
                <View style={styles.shareTrack}>
                  <View style={[styles.shareFill, { width: `${Math.max(3, Math.min(100, row.sharePct))}%` }]} />
                </View>
              </View>
            </View>
          ))}
          {report.topRows.length === 0 && <Text style={styles.empty}>No appliance usage was recorded in this simulation.</Text>}
        </View>

        {suggestion && (
          <View style={styles.suggestionBox}>
            <View style={styles.suggestionTitleRow}>
              <Lightbulb size={17} color="#566549" strokeWidth={1.7} />
              <Text style={styles.suggestionTitle}>Suggestion</Text>
            </View>
            <Text style={styles.suggestionText}>{suggestion.text}</Text>
          </View>
        )}
      </ScrollView>
      <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close energy report">
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 2 },
  insightCard: { flexDirection: 'row', gap: 12, marginBottom: 16, padding: 14, borderRadius: 18,
    backgroundColor: '#F6F4EF', borderWidth: 1, borderColor: '#E7E5E4' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0E6D9' },
  insightCopy: { flex: 1, minWidth: 0 },
  sectionEyebrow: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 10, letterSpacing: 0.8, color: '#566549', marginBottom: 3 },
  insightText: { fontFamily: 'SourceSans3_400Regular', fontSize: 14, lineHeight: 19, color: '#57534E' },
  insightMetrics: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, lineHeight: 17, color: '#3D5236', marginTop: 5 },
  comparisonText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, lineHeight: 17, color: '#A65A43', marginTop: 5 },
  sectionTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 16, color: '#292524', marginBottom: 8 },
  list: { borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 20, paddingHorizontal: 12, marginBottom: 14, backgroundColor: '#FFFFFF' },
  row: { minHeight: 98, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#E7E5E4' },
  spriteBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#F6F4EE', alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  name: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 13, color: '#292524' },
  starLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  smallMetric: { flexShrink: 1, fontFamily: 'SourceSans3_400Regular', fontSize: 11, color: '#78716C' },
  energyMetric: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 11, color: '#A97A4A', marginTop: 2 },
  shareTrack: { height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: '#E7E5E4', marginTop: 5 },
  shareFill: { height: 3, borderRadius: 2, backgroundColor: '#8B9D77' },
  suggestionBox: { borderRadius: 18, padding: 14, marginBottom: 14, backgroundColor: '#EAF0E4', borderWidth: 1, borderColor: '#C5D0B9' },
  suggestionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  suggestionTitle: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 14, color: '#3D5236' },
  suggestionText: { fontFamily: 'SourceSans3_400Regular', fontSize: 13, lineHeight: 18, color: '#485344' },
  empty: { paddingVertical: 18, fontFamily: 'SourceSans3_400Regular', fontSize: 14, color: '#57534E' },
  closeButton: { minHeight: 48, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#292524', marginBottom: 8 },
  closeText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 15, color: '#F5F5F4' },
});
