import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, AlertTriangle, Trash2, RefreshCw, ExternalLink } from 'lucide-react-native';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { MiniCard } from '../MiniCard';
import { Badge } from '../Badge';
import { AIRoutineAnalysisCard } from './AIRoutineAnalysisCard';
import { type Bill, getBillFileUrl, formatBillingMonthDisplay } from '@/lib/services/scannerService';
import { getSimulatorRoutineProfile } from '@/features/simulator/logic/simulatorBridge';
import { generateLocalRoutineAnalysis } from '@/lib/services/geminiService';
import { formatMoney, formatUsage } from '@/lib/formatters';

export interface BillDetailProps {
  bill: Bill | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (billId: string, filePath?: string) => void;
  onAnalyzeAgain?: (billId: string) => void;
  isReanalyzing?: boolean;
}

export function BillDetailSheet({
  bill,
  visible,
  onClose,
  onDelete,
  onAnalyzeAgain,
  isReanalyzing = false,
}: BillDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (bill && visible) {
      getBillFileUrl(bill.file_path).then((url) => {
        if (isMounted) setFileUrl(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [bill, visible]);

  if (!bill) return null;

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(bill.id, bill.file_path);
    setConfirmDelete(false);
    onClose();
  };

  const handleOpenFile = () => {
    if (fileUrl) {
      Linking.openURL(fileUrl).catch(() => {
        // ignore
      });
    }
  };

  const router = useRouter();
  const comparison = bill.analysis?.comparison;
  const isAnomaly = bill.alertLevel && bill.alertLevel !== 'normal';
  const displayTitle = bill.type === 'electricity' ? 'Electricity' : 'Water';
  const displayMonth = formatBillingMonthDisplay(bill.billing_month);

  const routineAnalysis = useMemo(() => {
    if (bill.analysis?.routine_analysis) {
      return bill.analysis.routine_analysis;
    }
    const routineProfile = getSimulatorRoutineProfile(bill.type);
    return generateLocalRoutineAnalysis(
      {
        type: bill.type,
        amount: bill.amount,
        usage: bill.usage,
        billingMonth: bill.billing_month,
        provider: bill.provider || undefined,
      },
      routineProfile
    );
  }, [bill]);

  return (
    <BottomSheet
      visible={visible}
      onClose={() => {
        setConfirmDelete(false);
        onClose();
      }}
      title={`${displayTitle} Statement`}
      height="88%"
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Preview & Status */}
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <FileText size={28} color="#422A1D" strokeWidth={1.5} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.providerTitle}>
              {displayTitle}
              {bill.provider ? ` · ${bill.provider}` : ''}
            </Text>
            <Text style={styles.monthText}>{displayMonth}</Text>
          </View>
          <Badge tone={isAnomaly ? 'amber' : 'sage'}>
            {isAnomaly ? 'Anomaly' : 'Normal'}
          </Badge>
        </View>

        {/* View Original Document Button (signed URL, 1hr expiry) */}
        {fileUrl && (
          <Button
            variant="secondary"
            leftIcon={<ExternalLink size={16} color="#292524" strokeWidth={1.5} />}
            onPress={handleOpenFile}
            style={styles.fileButton}
          >
            View original document
          </Button>
        )}

        {/* Key Values */}
        <View style={styles.valuesGrid}>
          <MiniCard tone="subtle" style={styles.valueCard}>
            <Text style={styles.valueLabel}>Total amount</Text>
            <Text style={styles.valueBig}>{formatMoney(bill.amount, true)}</Text>
          </MiniCard>
          <MiniCard tone="subtle" style={styles.valueCard}>
            <Text style={styles.valueLabel}>Usage volume</Text>
            <Text style={styles.valueBig}>{formatUsage(bill.usage, bill.type)}</Text>
          </MiniCard>
        </View>

        {/* History Comparison (from server analysis only) */}
        {comparison && (
          <MiniCard tone="default" style={styles.historyCard}>
            <Text style={styles.sectionTitle}>History comparison</Text>
            {comparison.mom_change_pct != null && (
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>vs Previous month</Text>
                <Text style={[styles.historyVal, (comparison.mom_change_pct || 0) > 20 && styles.historyAnomaly]}>
                  {comparison.mom_change_pct > 0 ? `+${comparison.mom_change_pct}%` : `${comparison.mom_change_pct}%`}
                </Text>
              </View>
            )}
            {comparison.avg_3m_diff != null && (
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>vs 3-month average</Text>
                <Text style={styles.historyVal}>
                  {comparison.avg_3m_diff > 0 ? `+${comparison.avg_3m_diff}` : String(comparison.avg_3m_diff)}
                </Text>
              </View>
            )}
            {comparison.streak && (
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>Trend</Text>
                <Text style={styles.historyVal}>{comparison.streak}</Text>
              </View>
            )}
          </MiniCard>
        )}

        {/* AI Routine Analysis (Bridge between Simulator & Scanner) */}
        {routineAnalysis && (
          <AIRoutineAnalysisCard
            routineAnalysis={routineAnalysis}
            utilityType={bill.type}
            onNavigateToSimulator={() => {
              onClose();
              router.push('/(tabs)/simulator');
            }}
          />
        )}

        {/* Saved AI Analysis (read from bills.analysis, no direct AI calls) */}
        {bill.analysis?.summary && (
          <MiniCard tone="warm" style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Saved AI analysis</Text>
            <Text style={styles.analysisBody}>{bill.analysis.summary}</Text>
            {bill.analysis.tips && bill.analysis.tips.length > 0 && (
              <View style={styles.tipsList}>
                {bill.analysis.tips.map((t, idx) => (
                  <Text key={idx} style={styles.tipItemText}>• {t}</Text>
                ))}
              </View>
            )}
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
              loading={isReanalyzing}
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
            {confirmDelete ? 'Confirm delete' : 'Delete bill'}
          </Button>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
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
  fileButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
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
    color: '#8F5B14',
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
  tipsList: {
    marginTop: 8,
    gap: 4,
  },
  tipItemText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534e',
    lineHeight: 16,
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
