import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock3, Leaf, Lightbulb, WalletCards, Zap } from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';

interface EnergyReportAppliance {
  id: string;
  name: string;
  brand?: string;
  wattage?: number;
  hoursPerDay?: number;
  alwaysOn?: boolean;
  category?: 'Appliances' | 'Furniture';
}

interface AIAnalysisReportModalProps {
  visible: boolean;
  appliances: EnergyReportAppliance[];
  onClose: () => void;
}

export function AIAnalysisReportModal({ visible, appliances, onClose }: AIAnalysisReportModalProps) {
  const highConsumers = useMemo(
    () => [...appliances]
      .filter((item) => item.category !== 'Furniture' && (item.wattage ?? 0) > 0)
      .map((item) => {
        const hours = item.alwaysOn ? 24 : Math.max(0.25, item.hoursPerDay ?? 4);
        const monthlyKwh = ((item.wattage ?? 0) * hours * 30) / 1000;
        return { item, hours, monthlyKwh, monthlyCost: monthlyKwh * 0.445 };
      })
      .sort((a, b) => b.monthlyKwh - a.monthlyKwh)
      .slice(0, 3),
    [appliances]
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="AI energy report" height="auto">
      <View style={styles.summaryRow}>
        <View style={styles.iconCircle}><Leaf size={20} color="#566549" strokeWidth={1.7} /></View>
        <Text style={styles.summary}>Your simulation is complete. These are the appliances you run longest that use the most electricity.</Text>
      </View>
      <View style={styles.list}>
        {highConsumers.length > 0 ? highConsumers.map(({ item, hours, monthlyKwh, monthlyCost }, index) => (
          <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
            <Zap size={17} color="#A97A4A" strokeWidth={1.7} />
            <View style={styles.applianceCopy}>
              <Text style={styles.name} numberOfLines={1}>{item.brand || item.name}</Text>
              <View style={styles.metricRow}>
                <Clock3 size={13} color="#78716C" strokeWidth={1.6} />
                <Text style={styles.metric}>{hours.toFixed(hours % 1 ? 1 : 0)} h/day</Text>
                <Text style={styles.metric}>·</Text>
                <Text style={styles.metric}>{Math.round(monthlyKwh)} kWh/month</Text>
              </View>
            </View>
            <View style={styles.costColumn}>
              <WalletCards size={14} color="#A97A4A" strokeWidth={1.6} />
              <Text style={styles.cost}>RM {Math.round(monthlyCost)}/mo</Text>
            </View>
          </View>
        )) : (
          <Text style={styles.empty}>No appliance usage was recorded in this simulation.</Text>
        )}
      </View>
      {highConsumers[0] && (
        <View style={styles.suggestionBox}>
          <View style={styles.suggestionTitleRow}><Lightbulb size={17} color="#566549" strokeWidth={1.7} /><Text style={styles.suggestionTitle}>Suggestion</Text></View>
          <Text style={styles.suggestionText}>Replace {highConsumers[0].item.brand || highConsumers[0].item.name} with a high-efficiency or inverter model, and use a timer to shorten daily runtime.</Text>
        </View>
      )}
      <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close energy report">
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, padding: 14,
    borderRadius: 18, backgroundColor: '#F6F4EF', borderWidth: 1, borderColor: '#E7E5E4' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0E6D9' },
  summary: { flex: 1, fontFamily: 'SourceSans3_400Regular', fontSize: 15, lineHeight: 22, color: '#57534E' },
  list: { borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 20, paddingHorizontal: 16, marginBottom: 20, backgroundColor: '#FFFFFF' },
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#E7E5E4' },
  applianceCopy: { flex: 1, minWidth: 0 },
  name: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 14, color: '#292524' },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metric: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, color: '#78716C' },
  costColumn: { alignItems: 'flex-end', gap: 3 },
  cost: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#A97A4A' },
  suggestionBox: { borderRadius: 18, padding: 14, marginBottom: 18, backgroundColor: '#EAF0E4', borderWidth: 1, borderColor: '#C5D0B9' },
  suggestionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  suggestionTitle: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 14, color: '#3D5236' },
  suggestionText: { fontFamily: 'SourceSans3_400Regular', fontSize: 13, lineHeight: 18, color: '#485344' },
  empty: { paddingVertical: 18, fontFamily: 'SourceSans3_400Regular', fontSize: 14, color: '#57534E' },
  closeButton: { minHeight: 48, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#292524', marginBottom: 8 },
  closeText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 15, color: '#F5F5F4' },
});
