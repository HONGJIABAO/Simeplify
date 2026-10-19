import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FileText, AlertCircle, Camera, Check } from 'lucide-react-native';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Input } from '../Input';
import { Skeleton } from '../Skeleton';
import { SegmentedControl } from '../SegmentedControl';

export interface CheckAndCorrectProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: {
    billType: 'electricity' | 'water';
    billingMonth: string;
    usageValue: number;
    amount: number;
  }) => void;
  isReading?: boolean;
  readingFailed?: boolean;
  alreadySavedMonth?: boolean;
}

export function CheckAndCorrectSheet({
  visible,
  onClose,
  onConfirm,
  isReading = false,
  readingFailed = false,
  alreadySavedMonth = false,
}: CheckAndCorrectProps) {
  const [billType, setBillType] = useState<'electricity' | 'water'>('water');
  const [billingMonth, setBillingMonth] = useState('October 2026');
  const [usage, setUsage] = useState('18');
  const [amount, setAmount] = useState('80.00');
  const [confirmReplace, setConfirmReplace] = useState(false);

  const handleSave = () => {
    if (alreadySavedMonth && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    onConfirm({
      billType,
      billingMonth,
      usageValue: parseFloat(usage) || 0,
      amount: parseFloat(amount) || 0,
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Check and Correct"
      height="88%"
    >
      <ScrollView contentContainerStyle={styles.container}>
        {isReading ? (
          <View style={styles.loadingContainer}>
            <Skeleton height={140} style={{ width: '100%', borderRadius: 16, marginBottom: 16 }} />
            <Text style={styles.loadingText}>Reading your bill with EcoTwin OCR...</Text>
            <View style={{ gap: 12, width: '100%', marginTop: 12 }}>
              <Skeleton height={48} style={{ borderRadius: 9999 }} />
              <Skeleton height={48} style={{ borderRadius: 9999 }} />
              <Skeleton height={48} style={{ borderRadius: 9999 }} />
            </View>
          </View>
        ) : readingFailed ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconCircle}>
              <AlertCircle size={32} color="#a8442f" strokeWidth={1.5} />
            </View>
            <Text style={styles.errorTitle}>We could not read this bill</Text>
            <Text style={styles.errorBody}>
              The image was too blurry or the numbers were obscured. Please take a clearer photo or upload a PDF.
            </Text>
            <Button
              variant="primary"
              leftIcon={<Camera size={18} color="#fafaf9" strokeWidth={1.5} />}
              onPress={onClose}
              style={{ width: '100%', marginTop: 16 }}
            >
              Retake photo
            </Button>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Bill Thumbnail Preview Box */}
            <View style={styles.previewBox}>
              <FileText size={36} color="#566549" strokeWidth={1.5} />
              <View style={styles.previewMeta}>
                <Text style={styles.previewTitle}>Scanned statement preview</Text>
                <Text style={styles.previewHint}>Air_Selangor_Oct2026.pdf · 2.4 MB</Text>
              </View>
            </View>

            {confirmReplace ? (
              <View style={styles.replaceWarningBox}>
                <AlertCircle size={20} color="#92600e" strokeWidth={1.5} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.replaceWarningTitle}>Replace saved bill?</Text>
                  <Text style={styles.replaceWarningText}>
                    A statement for {billingMonth} is already recorded. Do you want to update it with these new values?
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Editable Form Fields */}
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Bill Type</Text>
              <SegmentedControl
                options={[
                  { label: 'Water (Air Selangor)', value: 'water' },
                  { label: 'Electricity (TNB)', value: 'electricity' },
                ]}
                selectedValue={billType}
                onChange={setBillType}
                style={{ marginBottom: 12 }}
              />

              <Input
                label="Billing Month"
                value={billingMonth}
                onChangeText={setBillingMonth}
                placeholder="e.g. October 2026"
              />

              <Input
                label={billType === 'electricity' ? 'Usage (kWh)' : 'Usage (m³)'}
                value={usage}
                onChangeText={setUsage}
                keyboardType="numeric"
                placeholder={billType === 'electricity' ? 'e.g. 340' : 'e.g. 18'}
              />

              <Input
                label="Total Amount (RM)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="e.g. 80.00"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <Button
                variant="accent"
                leftIcon={<Check size={18} color="#292524" strokeWidth={2} />}
                onPress={handleSave}
                style={{ flex: 1 }}
              >
                {confirmReplace ? 'Confirm Replace' : 'Confirm'}
              </Button>
              <Button
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1 }}
              >
                Retake
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#292524',
    marginBottom: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fbece8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    gap: 16,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f1ea',
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  previewMeta: {
    flex: 1,
  },
  previewTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  previewHint: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
    marginTop: 2,
  },
  replaceWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  replaceWarningTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#92600e',
  },
  replaceWarningText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#92600e',
    marginTop: 2,
    lineHeight: 16,
  },
  formSection: {
    gap: 12,
  },
  fieldLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#57534e',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
});
