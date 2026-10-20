/**
 * SCN-01 / SCN-02 / SCN-03 / SCN-04
 * Scanner Screen (Bill Analyzer)
 *
 * Visual Reference: docs/screenshot/Scanner/Scanner.png
 * Spec Reference: docs/page_refined.md § S7.1 to S7.4
 * Design Reference: docs/design.md
 *
 * Connected to real Supabase tables: public.bills, public.alerts, public.ai_usage,
 * 'bills' storage bucket, and 'analyze-bill' Edge Function.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, ChevronRight, Sliders, RotateCcw } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';

// Shared Design System Components
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { MiniCard } from '@/components/MiniCard';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

// Scanner Components
import { UploadCard } from '@/components/scanner/UploadCard';
import { WaterAlert } from '@/components/scanner/WaterAlert';
import { UsageChart, type ChartFilter } from '@/components/scanner/UsageChart';
import { AIAnalysisCard, type AIAnalysisStatus } from '@/components/scanner/AIAnalysisCard';
import { CheckAndCorrectSheet, type CheckAndCorrectInitialValues } from '@/components/scanner/CheckAndCorrectSheet';
import { BillDetailSheet } from '@/components/scanner/BillDetailSheet';

// Data & Services
import { useAuthSession } from '@/lib/authSession';
import {
  type Bill,
  type BillAnalysis,
  type MonthlyChartDataPoint,
  uploadBill,
  readBill,
  saveAndAnalyzeBill,
  reanalyzeBill,
  fetchBills,
  fetchAlerts,
  deleteBill,
  checkBillExists,
  buildUsageChartData,
  formatBillingMonthDisplay,
  getPointsWithheldMessage,
} from '@/lib/services/scannerService';
import { type WaterAlertLevel } from '@/lib/waterLevel';
import { formatMoney, formatUsage } from '@/lib/formatters';

// Dev Gallery Fixtures
const FIXTURE_NORMAL_BILLS: Bill[] = [
  {
    id: 'fix-elec-oct',
    household_id: 'mock-hh',
    file_path: 'mock-hh/elec_oct.pdf',
    type: 'electricity',
    billing_month: '2026-10-01',
    usage: 340,
    amount: 151.05,
    analysis: {
      summary: 'Electricity consumption matches normal seasonal baseline (340 kWh vs 525 kWh estimate).',
      estimate_kwh: 525,
      comparison: { mom_change_pct: -3.0, avg_3m_diff: -15, streak: '2 months down' },
      tips: ['Maintain daytime AC setting at 25°C with ceiling fan.'],
      footer_disclaimer: 'Based on your bills only. Your real usage may differ.',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: 'TNB',
    alertLevel: 'normal',
  },
  {
    id: 'fix-water-oct',
    household_id: 'mock-hh',
    file_path: 'mock-hh/water_oct.pdf',
    type: 'water',
    billing_month: '2026-10-01',
    usage: 18,
    amount: 32.5,
    analysis: {
      summary: 'Water volume is within normal domestic limits for 3 residents.',
      comparison: { mom_change_pct: 0, avg_3m_diff: 0, streak: 'Steady' },
      tips: ['Continue practicing 5-minute showers.'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: 'Air Selangor',
    alertLevel: 'normal',
  },
];

const FIXTURE_LEAK_BILLS: Bill[] = [
  {
    ...FIXTURE_NORMAL_BILLS[0],
  },
  {
    id: 'fix-water-leak',
    household_id: 'mock-hh',
    file_path: 'mock-hh/water_leak.pdf',
    type: 'water',
    billing_month: '2026-10-01',
    usage: 18,
    amount: 80.0,
    analysis: {
      summary: 'Water consumption surged +48% vs previous month. Potential leak detected.',
      comparison: { mom_change_pct: 48, avg_3m_diff: 6, streak: 'Surge' },
      tips: ['Inspect downstairs toilet cistern seal for silent flapper leak.', 'Check outdoor garden hose bib for slow seepage.'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: 'Air Selangor',
    alertLevel: 'leak_detected',
  },
];

const FIXTURE_MAJOR_BILLS: Bill[] = [
  {
    ...FIXTURE_NORMAL_BILLS[0],
  },
  {
    id: 'fix-water-major',
    household_id: 'mock-hh',
    file_path: 'mock-hh/water_major.pdf',
    type: 'water',
    billing_month: '2026-10-01',
    usage: 40,
    amount: 195.0,
    analysis: {
      summary: 'Water consumption doubled (+122%). Potential major pipe burst or valve failure.',
      comparison: { mom_change_pct: 122, avg_3m_diff: 24, streak: 'Severe spike' },
      tips: ['Inspect main water meter for continuous movement while taps are off.', 'Consider closing the main stopcock valve.'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: 'Air Selangor',
    alertLevel: 'major_pipe_burst',
  },
];

export default function ScannerScreen() {
  const { showToast } = useToast();
  const { session } = useAuthSession();
  const householdId = session.profile?.household_id;

  // Real Data States
  const [bills, setBills] = useState<Bill[]>([]);
  const [chartData, setChartData] = useState<MonthlyChartDataPoint[]>([]);
  const [waterAlert, setWaterAlert] = useState<{
    level: WaterAlertLevel;
    momPercent?: number | null;
    monthName?: string;
  }>({ level: 'normal' });
  const [latestAnalysis, setLatestAnalysis] = useState<BillAnalysis | null>(null);
  const [latestBill, setLatestBill] = useState<Bill | null>(null);
  const [aiStatus, setAiStatus] = useState<AIAnalysisStatus>('loaded');
  const [isLoading, setIsLoading] = useState(true);
  const [archiveFilter, setArchiveFilter] = useState<ChartFilter>('All');

  // Sheet & Flow States
  const [isCheckSheetOpen, setIsCheckSheetOpen] = useState(false);
  const [isReadingBill, setIsReadingBill] = useState(false);
  const [readingFailed, setReadingFailed] = useState(false);
  const [readingFailedMsg, setReadingFailedMsg] = useState('We could not read this bill. Please type the numbers.');
  const [initialSheetValues, setInitialSheetValues] = useState<CheckAndCorrectInitialValues | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string>('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [alreadySavedMonth, setAlreadySavedMonth] = useState(false);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<Bill | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // In-memory read token ref (never written to DB or storage, per AGENT.md)
  const inMemoryReadTokenRef = useRef<string | undefined>(undefined);

  // Dev state gallery toggle
  const [showDevControls, setShowDevControls] = useState(false);
  const [isDevFixtureActive, setIsDevFixtureActive] = useState(false);

  // Load real data from Supabase
  const loadData = useCallback(async () => {
    if (!householdId || isDevFixtureActive) return;
    try {
      setIsLoading(true);
      const [fetchedBills, fetchedAlerts] = await Promise.all([
        fetchBills(householdId),
        fetchAlerts(householdId),
      ]);

      setBills(fetchedBills);
      const cData = buildUsageChartData(fetchedBills);
      setChartData(cData);

      // Identify latest bill and analysis
      if (fetchedBills.length > 0) {
        const top = fetchedBills[0];
        setLatestBill(top);
        setLatestAnalysis(top.analysis || null);
        setAiStatus(fetchedBills.length === 1 ? 'first_bill' : top.analysis ? 'loaded' : 'loading');

        // Resolve water alert area from alerts.level (FRONTEND 2: public.alerts)
        const latestAlert = fetchedAlerts && fetchedAlerts.length > 0 ? fetchedAlerts[0] : null;
        const waterBill = fetchedBills.find((b) => b.type === 'water');
        if (latestAlert && latestAlert.level !== 'normal') {
          setWaterAlert({
            level: latestAlert.level,
            momPercent: waterBill?.analysis?.comparison?.mom_change_pct ?? null,
            monthName: waterBill ? `${formatBillingMonthDisplay(waterBill.billing_month, true)} Statement` : undefined,
          });
        } else if (waterBill && waterBill.alertLevel && waterBill.alertLevel !== 'normal') {
          setWaterAlert({
            level: waterBill.alertLevel,
            momPercent: waterBill.analysis?.comparison?.mom_change_pct ?? null,
            monthName: `${formatBillingMonthDisplay(waterBill.billing_month, true)} Statement`,
          });
        } else {
          setWaterAlert({ level: 'normal' });
        }
      } else {
        setLatestBill(null);
        setLatestAnalysis(null);
        setWaterAlert({ level: 'normal' });
      }
    } catch (err: any) {
      console.error('Failed to load scanner data:', err);
      showToast(err.message || 'Could not load bills. Please check connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, isDevFixtureActive, showToast]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Add Bill Flow: 1. Pick/Upload -> 2. Read -> 3. Check & Correct Sheet
  const handleInitiateScan = (type: 'photo' | 'pdf') => {
    if (!householdId) {
      showToast('Please sign in and set up your household first.', 'error');
      return;
    }

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'pdf' ? 'application/pdf' : 'image/jpeg,image/png,image/webp,application/pdf';

      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;

        setIsCheckSheetOpen(true);
        setIsReadingBill(true);
        setReadingFailed(false);
        setInitialSheetValues(null);
        setCurrentFileName(file.name);
        inMemoryReadTokenRef.current = undefined;

        try {
          // 1. Upload to storage bucket bills/{household_id}/...
          const { filePath, fileName } = await uploadBill(householdId, file, {
            fileName: file.name,
            mimeType: file.type,
          });
          setCurrentFilePath(filePath);
          setCurrentFileName(fileName);

          // 2. Read mode invocation (OCR)
          const readResult = await readBill(filePath);
          inMemoryReadTokenRef.current = readResult.ai_read_token;

          setInitialSheetValues({
            billType: readResult.type,
            provider: readResult.provider,
            billingMonth: readResult.billing_month,
            usage: readResult.usage,
            amount: readResult.amount,
          });

          // Check if statement already recorded for this month
          const { exists } = await checkBillExists(householdId, readResult.type, readResult.billing_month);
          setAlreadySavedMonth(exists);
        } catch (err: any) {
          console.error('Read bill failed:', err);
          setReadingFailed(true);
          if (err.code === 'daily_limit_reached') {
            setReadingFailedMsg('You have reached today\'s limit. Try again tomorrow.');
            showToast('You have reached today\'s limit. Try again tomorrow.', 'info');
          } else {
            setReadingFailedMsg('We could not read this bill. Please type the numbers.');
            showToast('Could not automatically read bill values. Please type numbers manually.', 'info');
          }
        } finally {
          setIsReadingBill(false);
        }
      };

      input.click();
    } else {
      // In native environment without picker or simulator, show upload sheet directly
      setIsCheckSheetOpen(true);
      setReadingFailed(true);
      setReadingFailedMsg('Please enter statement values manually.');
    }
  };

  // Add Bill Flow: 4. Confirm -> 5. Save and Analyze
  const handleConfirmBill = async (data: {
    billType: 'electricity' | 'water';
    billingMonth: string;
    usageValue: number;
    amount: number;
  }) => {
    setIsCheckSheetOpen(false);

    if (!householdId) return;

    try {
      setAiStatus('loading');
      showToast('Saving and analyzing statement...', 'info');

      const result = await saveAndAnalyzeBill({
        filePath: currentFilePath || `${householdId}/manual_${Date.now()}.pdf`,
        type: data.billType,
        billingMonth: data.billingMonth,
        usage: data.usageValue,
        amount: data.amount,
        readToken: inMemoryReadTokenRef.current,
      });

      // Clear in-memory token immediately after use
      inMemoryReadTokenRef.current = undefined;

      // Energy Points Message Handling (Rule 4)
      if (result.points_awarded > 0) {
        showToast('+50 points earned for energy conservation!', 'success');
      } else if (result.points_withheld_reason) {
        const calmMessage = getPointsWithheldMessage(result.points_withheld_reason);
        if (calmMessage) {
          showToast(calmMessage, 'info');
        }
      }

      // Water Alert Message
      if (result.level === 'leak_detected') {
        showToast('Water statement saved. Anomaly detected!', 'warning');
      } else if (result.level === 'major_pipe_burst') {
        showToast('Major pipe burst alert recorded!', 'error');
      } else {
        showToast('Statement saved to archive.', 'success');
      }

      // Refresh database records
      await loadData();
    } catch (err: any) {
      console.error('Save and analyze failed:', err);
      setAiStatus('error');
      showToast(err.message || 'Failed to analyze bill. Please try again.', 'error');
    }
  };

  // Bill Detail: Re-analyze existing bill
  const handleReanalyze = async (billId: string) => {
    try {
      setIsReanalyzing(true);
      const res = await reanalyzeBill(billId);
      showToast('AI analysis updated.', 'success');

      setBills((prev) =>
        prev.map((b) => (b.id === billId ? { ...b, analysis: res.analysis } : b))
      );
      if (latestBill?.id === billId) {
        setLatestAnalysis(res.analysis);
      }
      if (selectedBillForDetail?.id === billId) {
        setSelectedBillForDetail((prev) => (prev ? { ...prev, analysis: res.analysis } : null));
      }
    } catch (err: any) {
      console.error('Reanalyze failed:', err);
      if (err.code === 'daily_limit_reached') {
        showToast('You have reached today\'s limit. Try again tomorrow.', 'info');
      } else {
        showToast(err.message || 'Failed to update analysis.', 'error');
      }
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Bill Detail: Delete existing bill
  const handleDeleteBill = async (billId: string, filePath?: string) => {
    try {
      await deleteBill(billId, filePath);
      showToast('Statement removed from archive.', 'info');
      setSelectedBillForDetail(null);
      await loadData();
    } catch (err: any) {
      console.error('Delete bill failed:', err);
      showToast(err.message || 'Failed to delete bill.', 'error');
    }
  };

  // Filtered Archive List
  const filteredBills = bills.filter((b) => {
    if (archiveFilter === 'All') return true;
    if (archiveFilter === 'Electricity') return b.type === 'electricity';
    if (archiveFilter === 'Water') return b.type === 'water';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header matching S7 spec (page-title-block with Bell top right) */}
      <Header
        variant="page-title-block"
        title="Bill analyzer"
        subtitle="Track monthly utility trends, detect leaks, and get AI tips."
        hasUnread={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !isDevFixtureActive ? (
          <View style={styles.loadingWrapper}>
            <Skeleton height={140} style={{ borderRadius: 24, marginBottom: 16 }} />
            <Skeleton height={200} style={{ borderRadius: 24, marginBottom: 16 }} />
            <Skeleton height={160} style={{ borderRadius: 24 }} />
          </View>
        ) : bills.length === 0 ? (
          <>
            {/* 1. Upload Card */}
            <UploadCard
              onTakePhoto={() => handleInitiateScan('photo')}
              onUploadPdf={() => handleInitiateScan('pdf')}
              isReading={isReadingBill}
            />

            {/* Empty State */}
            <EmptyState
              title="No bills uploaded yet"
              description="Upload your TNB electricity or Air Selangor water bill to track trends and detect leaks."
              actionLabel="Upload first bill"
              onAction={() => handleInitiateScan('pdf')}
              style={styles.emptyStateCard}
            />
          </>
        ) : (
          <>
            {/* 1. Upload Card (Take photo / Upload PDF) */}
            <UploadCard
              onTakePhoto={() => handleInitiateScan('photo')}
              onUploadPdf={() => handleInitiateScan('pdf')}
              isReading={isReadingBill}
            />

            {/* 2. Water Anomaly Alert Area (from alerts.level, Appendix B) */}
            <WaterAlert
              level={waterAlert.level}
              momPercent={waterAlert.momPercent}
              monthName={waterAlert.monthName}
            />

            {/* 3. Monthly Usage Chart Card (react-native-svg 5-month bars & trendline) */}
            <UsageChart
              data={chartData}
              onSelectMonth={(item) => {
                if (item.waterAlertLevel && item.waterAlertLevel !== 'normal') {
                  setWaterAlert({
                    level: item.waterAlertLevel,
                    monthName: `${item.label} Statement`,
                  });
                }
              }}
            />

            {/* 4. Latest Bill AI Analysis Card (from server analysis only) */}
            {latestBill && (
              <AIAnalysisCard
                status={aiStatus}
                analysis={latestAnalysis}
                billType={latestBill.type}
                billUsage={latestBill.usage}
                onRetry={() => handleReanalyze(latestBill.id)}
              />
            )}

            {/* 5. Bill Archive List Card (S7.1 & S7.4) */}
            <Card style={styles.archiveCard}>
              <View style={styles.archiveHeaderRow}>
                <View>
                  <Text style={styles.archiveTitle}>Bill archive</Text>
                  <Text style={styles.archiveCount}>{filteredBills.length} statements</Text>
                </View>

                {/* All / Electricity / Water filter pills */}
                <View style={styles.filterPillsRow}>
                  {(['All', 'Electricity', 'Water'] as ChartFilter[]).map((tab) => (
                    <Pressable
                      key={tab}
                      onPress={() => setArchiveFilter(tab)}
                      style={[styles.filterPill, archiveFilter === tab && styles.filterPillActive]}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          archiveFilter === tab && styles.filterPillTextActive,
                        ]}
                      >
                        {tab}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.archiveList}>
                {filteredBills.map((bill, index) => {
                  const isAnomaly = bill.alertLevel && bill.alertLevel !== 'normal';
                  const displayType = bill.provider ? `${bill.provider}` : bill.type === 'electricity' ? 'Electricity' : 'Water';

                  return (
                    <Pressable
                      key={bill.id}
                      onPress={() => setSelectedBillForDetail(bill)}
                      accessibilityRole="button"
                      accessibilityLabel={`${displayType} ${formatBillingMonthDisplay(bill.billing_month)} bill`}
                      style={({ pressed }) => [
                        styles.archiveItem,
                        index < filteredBills.length - 1 && styles.archiveItemBorder,
                        pressed && styles.archiveItemPressed,
                      ]}
                    >
                      <View style={styles.archiveItemLeft}>
                        <View style={styles.archiveIconCircle}>
                          <FileText size={18} color="#566549" strokeWidth={1.5} />
                        </View>
                        <View>
                          <Text style={styles.archiveItemMonth}>
                            {formatBillingMonthDisplay(bill.billing_month)}
                          </Text>
                          <Text style={styles.archiveItemUsage}>
                            {displayType} · {formatUsage(bill.usage, bill.type)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.archiveItemRight}>
                        <Text style={styles.archiveItemAmount}>
                          {formatMoney(bill.amount, true)}
                        </Text>
                        <Badge
                          tone={isAnomaly ? 'amber' : 'sage'}
                          style={styles.archiveBadge}
                        >
                          {isAnomaly ? 'Anomaly' : 'Normal'}
                        </Badge>
                        <ChevronRight size={16} color="#a8a29e" strokeWidth={1.5} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </>
        )}

        {/* Dev State Controls Bar (Dev Gallery Fixtures Switcher) */}
        <View style={styles.devControlsWrapper}>
          <Pressable
            onPress={() => setShowDevControls(!showDevControls)}
            style={styles.devToggleBtn}
          >
            <Sliders size={14} color="#78716c" strokeWidth={1.5} />
            <Text style={styles.devToggleText}>
              {showDevControls ? 'Hide dev preview fixtures' : 'Dev gallery & state fixtures (SCN-01 to SCN-04)'}
            </Text>
          </Pressable>

          {showDevControls && (
            <MiniCard tone="subtle" style={styles.devControlsPanel}>
              <Text style={styles.devSectionHeader}>Dev fixtures preview</Text>
              <View style={styles.devPillRow}>
                <Pressable
                  onPress={() => {
                    setIsDevFixtureActive(true);
                    setBills(FIXTURE_NORMAL_BILLS);
                    setChartData(buildUsageChartData(FIXTURE_NORMAL_BILLS));
                    setWaterAlert({ level: 'normal' });
                    setLatestBill(FIXTURE_NORMAL_BILLS[0]);
                    setLatestAnalysis(FIXTURE_NORMAL_BILLS[0].analysis || null);
                    setAiStatus('loaded');
                    showToast('Fixture: Normal state preview', 'info');
                  }}
                  style={styles.devPill}
                >
                  <Text style={styles.devPillText}>Normal state</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setIsDevFixtureActive(true);
                    setBills(FIXTURE_LEAK_BILLS);
                    setChartData(buildUsageChartData(FIXTURE_LEAK_BILLS));
                    setWaterAlert({
                      level: 'leak_detected',
                      momPercent: 48,
                      monthName: 'Oct Statement',
                    });
                    setLatestBill(FIXTURE_LEAK_BILLS[1]);
                    setLatestAnalysis(FIXTURE_LEAK_BILLS[1].analysis || null);
                    setAiStatus('loaded');
                    showToast('Fixture: Leak detected (+48% MoM)', 'warning');
                  }}
                  style={styles.devPill}
                >
                  <Text style={styles.devPillText}>Leak detected</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setIsDevFixtureActive(true);
                    setBills(FIXTURE_MAJOR_BILLS);
                    setChartData(buildUsageChartData(FIXTURE_MAJOR_BILLS));
                    setWaterAlert({
                      level: 'major_pipe_burst',
                      momPercent: 122,
                      monthName: 'Oct Statement',
                    });
                    setLatestBill(FIXTURE_MAJOR_BILLS[1]);
                    setLatestAnalysis(FIXTURE_MAJOR_BILLS[1].analysis || null);
                    setAiStatus('loaded');
                    showToast('Fixture: Major pipe burst', 'error');
                  }}
                  style={styles.devPill}
                >
                  <Text style={styles.devPillText}>Major burst</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setIsDevFixtureActive(true);
                    setBills([]);
                    setChartData([]);
                    setWaterAlert({ level: 'normal' });
                    setLatestBill(null);
                    setLatestAnalysis(null);
                    showToast('Fixture: Empty state', 'info');
                  }}
                  style={styles.devPill}
                >
                  <Text style={styles.devPillText}>Empty state</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setAiStatus('loading');
                    showToast('Previewing loading skeleton', 'info');
                  }}
                  style={styles.devPill}
                >
                  <Text style={styles.devPillText}>AI loading</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setAiStatus('error');
                    showToast('Previewing AI error state', 'error');
                  }}
                  style={styles.devPill}
                >
                  <Text style={styles.devPillText}>AI error</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setIsDevFixtureActive(false);
                    loadData();
                    showToast('Reconnected to live Supabase backend', 'success');
                  }}
                  style={[styles.devPill, { backgroundColor: '#e7e5e4' }]}
                >
                  <RotateCcw size={12} color="#292524" />
                  <Text style={[styles.devPillText, { color: '#292524', fontFamily: 'SourceSans3_600SemiBold' }]}>
                    Live Supabase
                  </Text>
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
        readingFailedMessage={readingFailedMsg}
        initialValues={initialSheetValues}
        fileName={currentFileName}
        alreadySavedMonth={alreadySavedMonth}
      />

      {/* S7.4 Bill Detail Sheet */}
      <BillDetailSheet
        bill={selectedBillForDetail}
        visible={Boolean(selectedBillForDetail)}
        onClose={() => setSelectedBillForDetail(null)}
        onDelete={(id, path) => handleDeleteBill(id, path)}
        onAnalyzeAgain={handleReanalyze}
        isReanalyzing={isReanalyzing}
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
  loadingWrapper: {
    paddingVertical: 16,
    gap: 16,
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 32,
    marginVertical: 16,
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
    flexWrap: 'wrap',
    gap: 8,
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
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#f5f5f4',
  },
  filterPillActive: {
    backgroundColor: '#e0e6d9', // sage-100
  },
  filterPillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
  },
  filterPillTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#566549',
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
  devPillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#57534e',
  },
});
