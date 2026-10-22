/**
 * SCN-01 / SCN-02
 * Bill Camera Scanner Modal with AI Viewfinder & Sample Bill Testing Fixtures.
 *
 * Provides a camera viewfinder interface styled after BinScannerScreen,
 * featuring interactive example bills (TNB Electricity, Air Selangor Normal,
 * and Air Selangor Abnormal Leak) so users can test bill scanning and OCR input
 * seamlessly without needing a printed physical bill.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { X, Sprout, Zap, Droplets, AlertTriangle, Upload, Sparkles } from 'lucide-react-native';

export interface ExampleBillData {
  id: string;
  name: string;
  provider: 'TNB' | 'Air Selangor';
  billType: 'electricity' | 'water';
  billingMonth: string;
  usage: number;
  amount: number;
  accountNo: string;
  isAbnormal?: boolean;
  anomalyMessage?: string;
}

export const EXAMPLE_BILLS: ExampleBillData[] = [
  {
    id: 'sample-tnb-oct',
    name: 'TNB Electricity (Oct 2026)',
    provider: 'TNB',
    billType: 'electricity',
    billingMonth: '2026-10-01',
    usage: 350,
    amount: 89.20,
    accountNo: '2204 8910 2341',
    isAbnormal: false,
  },
  {
    id: 'sample-water-sep',
    name: 'Air Selangor Water (Sep 2026 - Normal)',
    provider: 'Air Selangor',
    billType: 'water',
    billingMonth: '2026-09-01',
    usage: 16,
    amount: 13.50,
    accountNo: '8839 1042 5591',
    isAbnormal: false,
  },
  {
    id: 'sample-water-oct-leak',
    name: 'Air Selangor Water (Oct 2026 - Leak Surge)',
    provider: 'Air Selangor',
    billType: 'water',
    billingMonth: '2026-10-01',
    usage: 34,
    amount: 68.50,
    accountNo: '8839 1042 5591',
    isAbnormal: true,
    anomalyMessage: '+112% surge (34 m³ vs 16 m³). Potential leak detected!',
  },
];

interface BillCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onScanComplete: (data: {
    billType: 'electricity' | 'water';
    provider: string;
    billingMonth: string;
    usage: number;
    amount: number;
    isAbnormal?: boolean;
    anomalyMessage?: string;
  }) => void;
  onUploadFile?: () => void;
  onManualInput?: () => void;
}

function LeafSpinner({ size = 36 }: { size?: number }) {
  const rotation = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(rotation);
  }, [rotation, reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Sprout size={size} color="#a4c28d" strokeWidth={1.8} />
    </Animated.View>
  );
}

export function BillCameraModal({
  visible,
  onClose,
  onScanComplete,
  onUploadFile,
  onManualInput,
}: BillCameraModalProps) {
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const selectedBill = EXAMPLE_BILLS[selectedExampleIndex];

  const handleCapture = () => {
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      onScanComplete({
        billType: selectedBill.billType,
        provider: selectedBill.provider,
        billingMonth: selectedBill.billingMonth,
        usage: selectedBill.usage,
        amount: selectedBill.amount,
        isAbnormal: selectedBill.isAbnormal,
        anomalyMessage: selectedBill.anomalyMessage,
      });
    }, 1200);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            disabled={isScanning}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <X size={22} color="#fafaf9" />
          </Pressable>

          <View style={styles.topTitleBox}>
            <Text style={styles.topTitle}>AI Bill Scanner</Text>
            <Text style={styles.topSubtitle}>Align statement inside frame</Text>
          </View>

          {onUploadFile ? (
            <Pressable
              onPress={() => {
                onClose();
                onUploadFile();
              }}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Upload file"
            >
              <Upload size={20} color="#fafaf9" />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Viewfinder area */}
        <View style={styles.viewfinderWrapper}>
          {/* Framed Area */}
          <View style={styles.frame}>
            {/* 4 Corner Markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Virtual Malaysian Utility Bill Document in Viewfinder */}
            <View style={styles.virtualDoc}>
              {/* Document Header */}
              <View style={styles.docHeader}>
                <View style={styles.providerBadgeRow}>
                  {selectedBill.billType === 'electricity' ? (
                    <View style={styles.providerBadgeTnb}>
                      <Zap size={14} color="#dc2626" />
                      <Text style={styles.providerTnbText}>Tenaga Nasional Berhad</Text>
                    </View>
                  ) : (
                    <View style={styles.providerBadgeWater}>
                      <Droplets size={14} color="#0284c7" />
                      <Text style={styles.providerWaterText}>Air Selangor</Text>
                    </View>
                  )}
                  {selectedBill.isAbnormal && (
                    <View style={styles.alertTag}>
                      <AlertTriangle size={12} color="#b45309" />
                      <Text style={styles.alertTagText}>High Usage</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.docDate}>Month: {selectedBill.billingMonth}</Text>
              </View>

              {/* Account info line */}
              <View style={styles.docRow}>
                <Text style={styles.docLabel}>Account No:</Text>
                <Text style={styles.docValue}>{selectedBill.accountNo}</Text>
              </View>
              <View style={styles.docRow}>
                <Text style={styles.docLabel}>Billing Period:</Text>
                <Text style={styles.docValue}>01/10/2026 - 31/10/2026</Text>
              </View>

              {/* Consumption Details */}
              <View style={styles.docDivider} />
              <View style={styles.docMetricsRow}>
                <View style={styles.docMetric}>
                  <Text style={styles.metricLabel}>
                    {selectedBill.billType === 'electricity' ? 'Total Energy (kWh)' : 'Volume (m³)'}
                  </Text>
                  <Text style={[styles.metricValue, selectedBill.isAbnormal && styles.metricAlert]}>
                    {selectedBill.usage}{' '}
                    <Text style={styles.metricUnit}>
                      {selectedBill.billType === 'electricity' ? 'kWh' : 'm³'}
                    </Text>
                  </Text>
                </View>

                <View style={styles.docMetricRight}>
                  <Text style={styles.metricLabel}>Total Amount (RM)</Text>
                  <Text style={[styles.amountValue, selectedBill.isAbnormal && styles.amountAlert]}>
                    RM {selectedBill.amount.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Water Anomaly Note if leak sample */}
              {selectedBill.isAbnormal && (
                <View style={styles.leakBanner}>
                  <Text style={styles.leakBannerText}>⚠️ {selectedBill.anomalyMessage}</Text>
                </View>
              )}
            </View>

            {/* Scanning Overlay */}
            {isScanning && (
              <View style={styles.scanOverlay}>
                <LeafSpinner size={50} />
                <Text style={styles.scanOverlayText}>Reading bill with AI OCR...</Text>
                <Text style={styles.scanOverlaySub}>Extracting tariff usage & figures</Text>
              </View>
            )}
          </View>

          {/* Hint badge */}
          <View style={styles.hintPill}>
            <Sparkles size={14} color="#d4e3cb" />
            <Text style={styles.hintText}>
              {isScanning
                ? 'Extracting consumption & tariff data...'
                : 'Tap an example bill below or hit Shutter to scan'}
            </Text>
          </View>
        </View>

        {/* Example Bill Selector Carousel */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorTitle}>Select sample bill for testing:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorList}
          >
            {EXAMPLE_BILLS.map((bill, index) => {
              const isSelected = selectedExampleIndex === index;
              return (
                <Pressable
                  key={bill.id}
                  onPress={() => setSelectedExampleIndex(index)}
                  style={[
                    styles.selectorCard,
                    isSelected && styles.selectorCardSelected,
                    bill.isAbnormal && styles.selectorCardAbnormal,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${bill.name}`}
                >
                  <View style={styles.cardHeader}>
                    {bill.billType === 'electricity' ? (
                      <Zap size={14} color={isSelected ? '#e06d53' : '#a8a29e'} />
                    ) : (
                      <Droplets size={14} color={isSelected ? '#38bdf8' : '#a8a29e'} />
                    )}
                    <Text
                      style={[
                        styles.cardProviderText,
                        isSelected && styles.cardProviderTextActive,
                      ]}
                    >
                      {bill.provider}
                    </Text>
                  </View>

                  <Text
                    style={[styles.cardTitle, isSelected && styles.cardTitleActive]}
                    numberOfLines={1}
                  >
                    {bill.billingMonth}
                  </Text>

                  <View style={styles.cardValuesRow}>
                    <Text style={styles.cardUsage}>
                      {bill.usage} {bill.billType === 'electricity' ? 'kWh' : 'm³'}
                    </Text>
                    <Text style={styles.cardAmount}>RM {bill.amount.toFixed(2)}</Text>
                  </View>

                  {bill.isAbnormal && (
                    <View style={styles.abnormalBadge}>
                      <Text style={styles.abnormalBadgeText}>Abnormal Leak</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Bottom controls / Shutter button */}
        <View style={styles.bottomControls}>
          <Pressable
            onPress={handleCapture}
            disabled={isScanning}
            accessibilityRole="button"
            accessibilityLabel="Capture and extract bill numbers"
            style={({ pressed }) => [
              styles.shutterBtn,
              pressed && styles.shutterBtnPressed,
              isScanning && styles.shutterBtnDisabled,
            ]}
          >
            <View style={styles.shutterInner}>
              <Sparkles size={24} color="#292524" />
            </View>
          </Pressable>
          <Text style={styles.shutterLabel}>Tap to Scan & Read</Text>

          {onManualInput && (
            <Pressable
              onPress={() => {
                onClose();
                onManualInput();
              }}
              style={styles.manualEntryLink}
              accessibilityRole="button"
              accessibilityLabel="Enter numbers manually"
            >
              <Text style={styles.manualEntryLinkText}>✏️ Or tap to type bill numbers manually</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1917', // stone-900 dark camera view
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  topTitleBox: {
    alignItems: 'center',
  },
  topTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#fafaf9',
  },
  topSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
    marginTop: 2,
  },

  // Viewfinder
  viewfinderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  frame: {
    width: '100%',
    maxWidth: 340,
    height: 290,
    borderRadius: 16,
    position: 'relative',
    backgroundColor: '#292524',
    padding: 16,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#a4c28d',
    borderWidth: 3.5,
  },
  cornerTL: {
    top: 6,
    left: 6,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 6,
    right: 6,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 6,
    left: 6,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 6,
    right: 6,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },

  // Virtual Bill inside viewfinder
  virtualDoc: {
    backgroundColor: '#faf6f1',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  providerBadgeTnb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  providerTnbText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#991b1b',
  },
  providerBadgeWater: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  providerWaterText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#0369a1',
  },
  alertTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  alertTagText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10,
    color: '#b45309',
  },
  docDate: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#78716c',
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  docLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
  },
  docValue: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#292524',
  },
  docDivider: {
    height: 1,
    backgroundColor: '#e7e5e4',
    marginVertical: 8,
  },
  docMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docMetric: {
    flex: 1,
  },
  docMetricRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#78716c',
  },
  metricValue: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  metricAlert: {
    color: '#c2410c',
  },
  metricUnit: {
    fontSize: 13,
    fontFamily: 'SourceSans3_400Regular',
    color: '#57534e',
  },
  amountValue: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 19,
    color: '#3d4d33',
  },
  amountAlert: {
    color: '#b91c1c',
  },
  leakBanner: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  leakBannerText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 11,
    color: '#c2410c',
  },

  // Overlay
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 25, 23, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
  },
  scanOverlayText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#fafaf9',
    marginTop: 6,
  },
  scanOverlaySub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
  },

  // Hint
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    marginTop: 14,
  },
  hintText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#fafaf9',
  },

  // Selector
  selectorSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  selectorTitle: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#a8a29e',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  selectorList: {
    gap: 10,
    paddingHorizontal: 4,
  },
  selectorCard: {
    backgroundColor: '#292524',
    borderWidth: 1.5,
    borderColor: '#44403c',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: 175,
  },
  selectorCardSelected: {
    borderColor: '#a4c28d',
    backgroundColor: '#34302c',
  },
  selectorCardAbnormal: {
    borderStyle: 'dashed',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardProviderText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 11,
    color: '#a8a29e',
  },
  cardProviderTextActive: {
    color: '#fafaf9',
    fontFamily: 'SourceSans3_600SemiBold',
  },
  cardTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 13,
    color: '#d6d3d1',
    marginBottom: 4,
  },
  cardTitleActive: {
    color: '#fafaf9',
  },
  cardValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardUsage: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
  },
  cardAmount: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#a4c28d',
  },
  abnormalBadge: {
    backgroundColor: '#7c2d12',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  abnormalBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 9,
    color: '#fed7aa',
    textTransform: 'uppercase',
  },

  // Bottom shutter
  bottomControls: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  shutterBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fafaf9',
  },
  shutterBtnPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  shutterBtnDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e7ede0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterLabel: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#a8a29e',
  },
  manualEntryLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  manualEntryLinkText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 13,
    color: '#d4e3cb',
    textDecorationLine: 'underline',
  },
});
