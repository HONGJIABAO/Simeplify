import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Receipt, Camera, UploadCloud } from 'lucide-react-native';
import { Card } from '../Card';
import { Button } from '../Button';

export interface UploadCardProps {
  onTakePhoto: () => void;
  onUploadPdf: () => void;
  isReading?: boolean;
}

export function UploadCard({ onTakePhoto, onUploadPdf, isReading = false }: UploadCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.centerContainer}>
        {/* Receipt Icon in tinted rounded square */}
        <View style={styles.iconBadge}>
          <Receipt size={26} color="#422A1D" strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>Upload utility bill</Text>
        <Text style={styles.subtitle}>
          Supports TNB electric bills, Air Selangor water statements (PDF or Photo)
        </Text>
      </View>

      {/* Dual Button Row */}
      <View style={styles.buttonRow}>
        <Button
          variant="primary"
          leftIcon={<Camera size={18} color="#fafaf9" strokeWidth={1.5} />}
          onPress={onTakePhoto}
          loading={isReading}
          style={styles.actionButton}
        >
          Take photo
        </Button>

        <Button
          variant="secondary"
          leftIcon={<UploadCloud size={18} color="#292524" strokeWidth={1.5} />}
          onPress={onUploadPdf}
          disabled={isReading}
          style={styles.actionButton}
        >
          Upload PDF
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  centerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#eae5dc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: 12,
  },
});
