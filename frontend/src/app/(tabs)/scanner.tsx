/**
 * SCN-01 / SCN-02 / SCN-03 / SCN-04
 * Scanner Screen (Bill Analyzer)
 *
 * Visual Reference: docs/screenshot/Scanner/Scanner.png
 * Spec Reference: docs/page_refined.md § S7.1 to S7.4
 * Design Reference: docs/design.md
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, ChevronRight, Sliders, RotateCcw } from 'lucide-react-native';

// Shared Design System Components
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { MiniCard } from '@/components/MiniCard';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';

// Scanner Components
import { UploadCard } from '@/components/scanner/UploadCard';
import { WaterAlert } from '@/components/scanner/WaterAlert';
import { UsageChart } from '@/components/scanner/UsageChart';
import { AIAnalysisCard, type AIAnalysisStatus } from '@/components/scanner/AIAnalysisCard';
import { CheckAndCorrectSheet } from '@/components/scanner/CheckAndCorrectSheet';
import { BillDetailSheet } from '@/components/scanner/BillDetailSheet';

// Data & Logic
import {
  MOCK_BILL_ARCHIVE,
  MONTHLY_USAGE_DATA,
  type BillRecord,
  type MonthlyUsageItem,
} from '@/lib/mockData';
import { type WaterAlertLevel, calculateWaterAlertLevel } from '@/lib/waterLevel';
import { formatMoney, formatUsage } from '@/lib/formatters';
import { readBill, awardEnergyPoints } from '@/lib/services/scannerService';

export default function ScannerScreen() {
  const { showToast } = useToast();

  // Screen States
  const [bills, setBills] = useState<BillRecord[]>(MOCK_BILL_ARCHIVE);
  const [usageData, setUsageData] = useState<MonthlyUsageItem[]>(MONTHLY_USAGE_DATA);
  const [waterLevel, setWaterLevel] = useState<WaterAlertLevel>('leak_detected');
  const [aiStatus, setAiStatus] = useState<AIAnalysisStatus>('loaded');
  const [isEmptyView, setIsEmptyView] = useState(false);

  // Modal / Sheet States
  const [isCheckSheetOpen, setIsCheckSheetOpen] = useState(false);
  const [isReadingBill, setIsReadingBill] = useState(false);
  const [readingFailed, setReadingFailed] = useState(false);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<BillRecord | null>(null);

  // Dev state control panel toggle
  const [showDevControls, setShowDevControls] = useState(false);

  // Handlers
  const handleStartScan = async () => {
    setIsCheckSheetOpen(true);
    setIsReadingBill(true);
    setReadingFailed(false);

    try {
      await readBill('file://mock_bill.pdf');
      setIsReadingBill(false);
    } catch {
      setIsReadingBill(false);
      setReadingFailed(true);
    }
  };

  const handleConfirmBill = async (data: {
    billType: 'electricity' | 'water';
    billingMonth: string;
    usageValue: number;
    amount: number;
  }) => {
    setIsCheckSheetOpen(false);

    // If electricity bill, check for energy points
    if (data.billType === 'electricity') {
      const pointsResult = await awardEnergyPoints(data.billingMonth, data.usageValue, 525);
      if (pointsResult.awarded) {
        showToast(pointsResult.message, 'success');
      } else {
        showToast('Electricity statement saved successfully.', 'info');
      }
    } else {
      // Calculate water alert level
      const newLevel = calculateWaterAlertLevel({
        volumeM3: data.usageValue,
        momPercent: 48, // +48% MoM
        residents: 3,
      });
      setWaterLevel(newLevel);
      if (newLevel === 'leak_detected' || newLevel === 'major_pipe_burst') {
        showToast('Water statement saved. Anomaly detected!', 'warning');
      } else {
        showToast('Water statement saved to archive.', 'success');
      }
    }

    // Add new bill to archive
    const newRecord: BillRecord = {
      id: `bill-${Date.now()}`,
      type: data.billType,
      provider: data.billType === 'electricity' ? 'TNB' : 'Air Selangor',
      month: data.billingMonth,
      usageValue: data.usageValue,
      usageUnit: data.billType === 'electricity' ? 'kWh' : 'm³',
      amount: data.amount,
      status: data.billType === 'water' && data.usageValue >= 18 ? 'anomaly' : 'normal',
      alertLevel: data.billType === 'water' ? waterLevel : 'normal',
      dateUploaded: new Date().toISOString().split('T')[0],
      aiAnalysis:
        data.billType === 'water'
          ? 'Water consumption surge detected. Recommend inspecting plumbing.'
          : 'Consumption matches normal seasonal pattern.',
    };

    setBills((prev) => [newRecord, ...prev]);
    setIsEmptyView(false);
  };

  const handleDeleteBill = (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
    showToast('Statement removed from archive.', 'info');
  };

  const handleReanalyze = (billId: string) => {
    setSelectedBillForDetail(null);
    setAiStatus('loading');
    setTimeout(() => {
      setAiStatus('loaded');
      showToast('AI analysis updated.', 'success');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header matching S7 spec (page-title-block with Bell top right) */}
      <Header
        variant="page-title-block"
        title="Bill Analyzer"
        subtitle="Track monthly utility trends, detect leaks, and get AI tips."
        hasUnread={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEmptyView ? (
          <EmptyState
            title="No bills uploaded yet"
            description="Upload your TNB electricity or Air Selangor water bill to track trends and detect leaks."
            actionLabel="Upload first bill"
            onAction={handleStartScan}
            style={styles.emptyStateCard}
          />
        ) : (
          <>
            {/* 1. Upload Card (Take photo / Upload PDF) */}
            <UploadCard
              onTakePhoto={handleStartScan}
              onUploadPdf={handleStartScan}
              isReading={isReadingBill}
            />

            {/* 2. Water Anomaly Alert Area (Governed by Appendix B) */}
            <WaterAlert
              level={waterLevel}
              momPercent={48}
              monthName="Oct Statement"
            />

            {/* 3. Monthly Usage Chart Card (Jun - Oct 5-Month Grouped Bars) */}
            <UsageChart
              data={usageData}
              onSelectMonth={(item) => {
                if (item.waterAlertLevel) {
                  setWaterLevel(item.waterAlertLevel);
                }
              }}
            />

            {/* 4. AI Analysis Card (Sprout icon, Metrics, Tips) */}
            <AIAnalysisCard
              status={aiStatus}
              onRetry={() => {
                setAiStatus('loading');
                setTimeout(() => setAiStatus('loaded'), 800);
              }}
            />

            {/* 5. Bill Archive List Card (S7.1 & S7.4) */}
            <Card style={styles.archiveCard}>
              <View style={styles.archiveHeaderRow}>
                <Text style={styles.archiveTitle}>Bill Archive</Text>
                <Text style={styles.archiveCount}>{bills.length} statements</Text>
              </View>

              <View style={styles.archiveList}>
                {bills.map((bill, index) => (
                  <Pressable
                    key={bill.id}
                    onPress={() => setSelectedBillForDetail(bill)}
                    accessibilityRole="button"
                    accessibilityLabel={`${bill.provider} ${bill.month} bill`}
                    style={({ pressed }) => [
                      styles.archiveItem,
                      index < bills.length - 1 && styles.archiveItemBorder,
                      pressed && styles.archiveItemPressed,
                    ]}
                  >
                    <View style={styles.archiveItemLeft}>
                      <View style={styles.archiveIconCircle}>
                        <FileText size={18} color="#566549" strokeWidth={1.5} />
                      </View>
                      <View>
                        <Text style={styles.archiveItemMonth}>{bill.month}</Text>
                        <Text style={styles.archiveItemUsage}>
                          {bill.provider} · {formatUsage(bill.usageValue, bill.type)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.archiveItemRight}>
                      <Text style={styles.archiveItemAmount}>
                        {formatMoney(bill.amount, true)}
                      </Text>
                      <Badge
                        tone={bill.status === 'anomaly' ? 'amber' : 'sage'}
                        style={styles.archiveBadge}
                      >
                        {bill.status === 'anomaly' ? 'Anomaly' : 'Normal'}
                      </Badge>
                      <ChevronRight size={16} color="#a8a29e" strokeWidth={1.5} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Dev State Controls Bar (Enables rapid verification of all S7 states) */}
        <View style={styles.devControlsWrapper}>
          <Pressable
            onPress={() => setShowDevControls(!showDevControls)}
            style={styles.devToggleBtn}
          >
            <Sliders size={14} color="#78716c" strokeWidth={1.5} />
            <Text style={styles.devToggleText}>
              {showDevControls ? 'Hide State Preview Controls' : 'Quick State Switcher (SCN-01 to SCN-04)'}
            </Text>
          </Pressable>

          {showDevControls && (
            <MiniCard tone="subtle" style={styles.devControlsPanel}>
              <Text style={styles.devSectionHeader}>Water Alert Level (Appendix B)</Text>
              <View style={styles.devPillRow}>
                {(['normal', 'minor_drip', 'leak_detected', 'major_pipe_burst'] as WaterAlertLevel[]).map(
                  (lvl) => (
                    <Pressable
                      key={lvl}
                      onPress={() => setWaterLevel(lvl)}
                      style={[
                        styles.devPill,
                        waterLevel === lvl && styles.devPillSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.devPillText,
                          waterLevel === lvl && styles.devPillTextSelected,
                        ]}
                      >
                        {lvl.replace('_', ' ')}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              <Text style={styles.devSectionHeader}>AI Analysis State</Text>
              <View style={styles.devPillRow}>
                {(['loaded', 'loading', 'error', 'first_bill'] as AIAnalysisStatus[]).map((st) => (
                  <Pressable
                    key={st}
                    onPress={() => setAiStatus(st)}
                    style={[
                      styles.devPill,
                      aiStatus === st && styles.devPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.devPillText,
                        aiStatus === st && styles.devPillTextSelected,
                      ]}
                    >
                      {st}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.devSectionHeader}>Interactive Sheets & Views</Text>
              <View style={styles.devPillRow}>
                <Pressable
                  onPress={() => setIsEmptyView(!isEmptyView)}
                  style={[styles.devPill, isEmptyView && styles.devPillSelected]}
                >
                  <Text style={[styles.devPillText, isEmptyView && styles.devPillTextSelected]}>
                    Toggle Empty State
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setIsCheckSheetOpen(true);
                    setReadingFailed(true);
                  }}
                  style={styles.devPill}
                >
                  <Text style={styles.devPillText}>OCR Failed State</Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    const res = await awardEnergyPoints('October 2026', 340, 525);
                    showToast(res.message, 'success');
                  }}
                  style={styles.devPill}
                >
                  <Text style={styles.devPillText}>Test +50 Pts Toast</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setBills(MOCK_BILL_ARCHIVE);
                    setUsageData(MONTHLY_USAGE_DATA);
                    setWaterLevel('leak_detected');
                    setAiStatus('loaded');
                    setIsEmptyView(false);
                    showToast('Reset to default mock state.', 'info');
                  }}
                  style={[styles.devPill, { backgroundColor: '#e7e5e4' }]}
                >
                  <RotateCcw size={12} color="#292524" />
                  <Text style={[styles.devPillText, { color: '#292524' }]}>Reset</Text>
                </Pressable>
              </View>
            </MiniCard>
          )}
        </View>
      </ScrollView>

      {/* S7.2 Check & Correct Sheet */}
      <CheckAndCorrectSheet
        visible={isCheckSheetOpen}
        onClose={() => setIsCheckSheetOpen(false)}
        onConfirm={handleConfirmBill}
        isReading={isReadingBill}
        readingFailed={readingFailed}
        alreadySavedMonth={false}
      />

      {/* S7.4 Bill Detail Sheet */}
      <BillDetailSheet
        bill={selectedBillForDetail}
        visible={Boolean(selectedBillForDetail)}
        onClose={() => setSelectedBillForDetail(null)}
        onDelete={handleDeleteBill}
        onAnalyzeAgain={handleReanalyze}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf6f1', // cream
  },
  scrollContent: {
    paddingHorizontal: 24, // px-6
    paddingBottom: 112, // pb-28
    gap: 0,
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 32,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  archiveCard: {
    padding: 20,
    marginBottom: 20,
  },
  archiveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  archiveTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  archiveCount: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
  },
  archiveList: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    overflow: 'hidden',
  },
  archiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  archiveItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  archiveItemPressed: {
    backgroundColor: '#faf6f1',
  },
  archiveItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  archiveIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveItemMonth: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  archiveItemUsage: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
    marginTop: 1,
  },
  archiveItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archiveItemAmount: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
  },
  archiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  devControlsWrapper: {
    marginTop: 8,
    marginBottom: 24,
  },
  devToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  devToggleText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
  },
  devControlsPanel: {
    padding: 14,
    marginTop: 6,
    gap: 8,
  },
  devSectionHeader: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#78716c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  devPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  devPillSelected: {
    backgroundColor: '#e0e6d9', // sage-100
    borderColor: '#8b9d77',
  },
  devPillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#57534e',
  },
  devPillTextSelected: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#566549',
  },
});
