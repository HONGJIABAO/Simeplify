import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Leaf, Zap } from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import type { Appliance } from '@/lib/mockData';

interface AIAnalysisReportModalProps {
  visible: boolean;
  appliances: Appliance[];
  onClose: () => void;
}

export function AIAnalysisReportModal({ visible, appliances, onClose }: AIAnalysisReportModalProps) {
  const highConsumers = useMemo(
    () => [...appliances]
      .filter((item) => item.wattage > 0)
      .sort((a, b) => b.wattage - a.wattage)
      .slice(0, 3),
    [appliances]
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="AI energy report" height="auto">
      <View style={styles.summaryRow}>
        <View style={styles.iconCircle}><Leaf size={20} color="#566549" strokeWidth={1.7} /></View>
        <Text style={styles.summary}>Your simulation is complete. These appliances have the highest rated power.</Text>
      </View>
      <View style={styles.list}>
        {highConsumers.length > 0 ? highConsumers.map((item, index) => (
          <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
            <Zap size={17} color="#A97A4A" strokeWidth={1.7} />
            <Text style={styles.name} numberOfLines={1}>{item.brand || item.name}</Text>
            <Text style={styles.watts}>{item.wattage.toLocaleString()} W</Text>
          </View>
        )) : (
          <Text style={styles.empty}>No appliance usage was recorded in this simulation.</Text>
        )}
      </View>
      <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close energy report">
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0E6D9' },
  summary: { flex: 1, fontFamily: 'SourceSans3_400Regular', fontSize: 15, lineHeight: 22, color: '#57534E' },
  list: { borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 20, paddingHorizontal: 16, marginBottom: 20, backgroundColor: '#FFFFFF' },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#E7E5E4' },
  name: { flex: 1, fontFamily: 'SourceSans3_600SemiBold', fontSize: 14, color: '#292524' },
  watts: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 13, color: '#A97A4A' },
  empty: { paddingVertical: 18, fontFamily: 'SourceSans3_400Regular', fontSize: 14, color: '#57534E' },
  closeButton: { minHeight: 48, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#292524', marginBottom: 8 },
  closeText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 15, color: '#F5F5F4' },
});
