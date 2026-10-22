import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FileText, AlertCircle, AlertTriangle, Check } from 'lucide-react-native';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Input } from '../Input';
import { Skeleton } from '../Skeleton';
import { SegmentedControl } from '../SegmentedControl';

export interface CheckAndCorrectInitialValues {
  billType?: 'electricity' | 'water';
  provider?: string;
  billingMonth?: string;
  usage?: number;
  amount?: number;
}

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
  readingFailedMessage?: string;
  initialValues?: CheckAndCorrectInitialValues | null;
  fileName?: string;
  alreadySavedMonth?: boolean;
}

export function CheckAndCorrectSheet({
  visible,
  onClose,
  onConfirm,
  isReading = false,
  readingFailed = false,
  readingFailedMessage = 'We could not read this bill. Please type the numbers.',
  initialValues,
  fileName = 'statement.pdf',
  alreadySavedMonth = false,
}: CheckAndCorrectProps) {
  const [billType, setBillType] = useState<'electricity' | 'water'>('electricity');
  const [billingMonth, setBillingMonth] = useState('');
  const [usage, setUsage] = useState('');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [prevInitialValues, setPrevInitialValues] = useState<CheckAndCorrectInitialValues | null | undefined>(undefined);
  const [prevReadingFailed, setPrevReadingFailed] = useState<boolean>(false);

  // Sync initial values when sheet opens or read finishes
  if (initialValues !== prevInitialValues || readingFailed !== prevReadingFailed) {
    setPrevInitialValues(initialValues);
    setPrevReadingFailed(readingFailed);
    if (initialValues) {
      setBillType(initialValues.billType || 'electricity');
      setBillingMonth(initialValues.billingMonth || '');
      setUsage(initialValues.usage != null ? String(initialValues.usage) : '');
      setAmount(initialValues.amount != null ? String(initialValues.amount) : '');
      setProvider(initialValues.provider);
    } else if (readingFailed) {
      setBillType('electricity');
      setBillingMonth('');
      setUsage('');
      setAmount('');
      setProvider(undefined);
    }
  }

  const handleSave = () => {
    if (alreadySavedMonth && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    onConfirm({
      billType,
      billingMonth: billingMonth.trim(),
      usageValue: parseFloat(usage) || 0,
      amount: parseFloat(amount) || 0,
    });
    setConfirmReplace(false);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => {
        setConfirmReplace(false);
        onClose();
      }}
      title={isReading ? 'Analyzing...' : 'Check and correct'}
      height="88%"
    >
      <ScrollView contentContainerStyle={styles.container}>
        {isReading ? (
          <View style={styles.loadingContainer}>
            <Skeleton height={120} style={{ width: '100%', borderRadius: 16, marginBottom: 16 }} />
            <Text style={styles.loadingText}>Analyzing your bill...</Text>
            <View style={{ gap: 12, width: '100%', marginTop: 12 }}>
              <Skeleton height={48} style={{ borderRadius: 9999 }} />
              <Skeleton height={48} style={{ borderRadius: 9999 }} />
              <Skeleton height={48} style={{ borderRadius: 9999 }} />
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Scanned file box */}
            <View style={styles.previewBox}>
              <FileText size={32} color="#566549" strokeWidth={1.5} />
              <View style={styles.previewMeta}>
                <Text style={styles.previewTitle}>
                  {billType === 'electricity' ? 'Electricity bill' : 'Water bill'}
                  {provider ? ` · ${provider}` : ''}
                </Text>
                <Text style={styles.previewHint}>{fileName}</Text>
              </View>
            </View>

            {/* Reading failed note: fields empty, user types values */}
            {readingFailed && (
              <View style={styles.failedNoteBox}>
                <AlertCircle size={18} color="#a8442f" strokeWidth={1.5} />
                <Text style={styles.failedNoteText}>{readingFailedMessage}</Text>
              </View>
            )}

            {/* Small helper line: changing numbers can mean no energy points */}
            <View style={styles.helperRow}>
              <AlertTriangle size={14} color="#8c857b" strokeWidth={1.5} />
              <Text style={styles.helperText}>Changing the numbers can mean no energy points</Text>
            </View>

            {/* Replace confirmation banner */}
            {alreadySavedMonth && (
              <View style={styles.replaceWarningBox}>
                <AlertCircle size={20} color="#92600e" strokeWidth={1.5} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.replaceWarningTitle}>Replace the bill for this month?</Text>
                  <Text style={styles.replaceWarningText}>
                    A statement for {billingMonth || 'this month'} is already saved. Saving will update the existing bill and its analysis.
                  </Text>
                </View>
              </View>
            )}

            {/* Editable Form Fields */}
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Bill Type</Text>
              <SegmentedControl
                options={[
                  { label: provider && billType === 'electricity' ? `Electricity (${provider})` : 'Electricity', value: 'electricity' },
                  { label: provider && billType === 'water' ? `Water (${provider})` : 'Water', value: 'water' },
                ]}
                selectedValue={billType}
                onChange={setBillType}
                style={{ marginBottom: 12 }}
              />

              <Input
                label="Billing Month"
                value={billingMonth}
                onChangeText={setBillingMonth}
                placeholder="e.g. October 2026 or 2026-10"
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
                {alreadySavedMonth ? 'Replace bill' : 'Confirm'}
              </Button>
              <Button
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1 }}
              >
                Cancel
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
  content: {
    gap: 14,
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
  failedNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbece8',
    borderColor: '#f2c8be',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  failedNoteText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#a8442f',
    flex: 1,
    lineHeight: 18,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  helperText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
    fontStyle: 'italic',
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
    marginTop: 8,
  },
});
