import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FileText, AlertTriangle, Trash2, RefreshCw } from 'lucide-react-native';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { MiniCard } from '../MiniCard';
import { Badge } from '../Badge';
import { type BillRecord } from '@/lib/mockData';
import { formatMoney, formatUsage } from '@/lib/formatters';

export interface BillDetailProps {
  bill: BillRecord | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (billId: string) => void;
  onAnalyzeAgain?: (billId: string) => void;
}

export function BillDetailSheet({
  bill,
  visible,
  onClose,
  onDelete,
  onAnalyzeAgain,
}: BillDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!bill) return null;

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(bill.id);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => {
        setConfirmDelete(false);
        onClose();
      }}
      title={`${bill.provider} Statement`}
      height="88%"
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Preview & Status */}
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <FileText size={28} color="#422A1D" strokeWidth={1.5} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.providerTitle}>{bill.provider} Bill</Text>
            <Text style={styles.monthText}>{bill.month}</Text>
          </View>
          <Badge tone={bill.status === 'anomaly' ? 'amber' : 'sage'}>
            {bill.status === 'anomaly' ? 'Anomaly' : 'Normal'}
          </Badge>
        </View>

        {/* Key Values */}
        <View style={styles.valuesGrid}>
          <MiniCard tone="subtle" style={styles.valueCard}>
            <Text style={styles.valueLabel}>Total Amount</Text>
            <Text style={styles.valueBig}>{formatMoney(bill.amount, true)}</Text>
          </MiniCard>
          <MiniCard tone="subtle" style={styles.valueCard}>
            <Text style={styles.valueLabel}>Usage Volume</Text>
            <Text style={styles.valueBig}>{formatUsage(bill.usageValue, bill.type)}</Text>
          </MiniCard>
        </View>

        {/* History Comparison */}
        <MiniCard tone="default" style={styles.historyCard}>
          <Text style={styles.sectionTitle}>History Comparison</Text>
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>vs Previous Month</Text>
            <Text style={[styles.historyVal, bill.status === 'anomaly' && styles.historyAnomaly]}>
              {bill.status === 'anomaly' ? '+48% spike' : '+3.0% normal'}
            </Text>
          </View>
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>3-Month Average</Text>
            <Text style={styles.historyVal}>
              {bill.type === 'electricity' ? '535 kWh' : '16.2 m³'}
            </Text>
          </View>
        </MiniCard>

        {/* Saved AI Analysis */}
        {bill.aiAnalysis && (
          <MiniCard tone="warm" style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Saved AI Analysis</Text>
            <Text style={styles.analysisBody}>{bill.aiAnalysis}</Text>
          </MiniCard>
        )}

        {/* Delete Confirmation Warning */}
        {confirmDelete && (
          <View style={styles.deleteWarning}>
            <AlertTriangle size={18} color="#a8442f" strokeWidth={1.5} />
            <Text style={styles.deleteWarningText}>
              Are you sure? This will remove this statement from your monthly trends and history.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionColumn}>
          {onAnalyzeAgain && (
            <Button
              variant="secondary"
              leftIcon={<RefreshCw size={16} color="#292524" strokeWidth={1.5} />}
              onPress={() => onAnalyzeAgain(bill.id)}
            >
              Analyze again
            </Button>
          )}

          <Button
            variant="secondary"
            leftIcon={<Trash2 size={16} color={confirmDelete ? '#ffffff' : '#a8442f'} strokeWidth={1.5} />}
            onPress={handleDelete}
            style={confirmDelete ? styles.confirmDeleteButton : undefined}
            textStyle={confirmDelete ? styles.confirmDeleteText : styles.deleteText}
          >
            {confirmDelete ? 'Confirm Delete' : 'Delete bill'}
          </Button>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f1ea',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eae5dc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  providerTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  monthText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716c',
    marginTop: 2,
  },
  valuesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  valueCard: {
    flex: 1,
    padding: 16,
  },
  valueLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534e',
    marginBottom: 6,
  },
  valueBig: {
    fontFamily: 'Lora_700Bold',
    fontSize: 20,
    color: '#292524',
  },
  historyCard: {
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 15,
    color: '#292524',
    marginBottom: 4,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
  },
  historyVal: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
  },
  historyAnomaly: {
    color: '#b91c1c',
  },
  analysisCard: {
    padding: 16,
  },
  analysisTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 15,
    color: '#5c4033',
    marginBottom: 6,
  },
  analysisBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#44403c',
    lineHeight: 18,
  },
  deleteWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbece8',
    borderColor: '#f2c8be',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  deleteWarningText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8442f',
    flex: 1,
    lineHeight: 16,
  },
  actionColumn: {
    gap: 12,
    marginTop: 8,
  },
  deleteText: {
    color: '#a8442f',
  },
  confirmDeleteButton: {
    backgroundColor: '#a8442f',
    borderColor: '#a8442f',
  },
  confirmDeleteText: {
    color: '#ffffff',
  },
});
