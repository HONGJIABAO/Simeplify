import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SunMedium, X } from 'lucide-react-native';
import { SOLAR_RECOMMENDATION_SOURCE } from '../logic/spriteMap';
import { EditSheetSurface } from './EditSheet';

interface ApplianceSuggestionSheetProps {
  visible: boolean;
  onApply: () => void;
  onClose: () => void;
}

export function ApplianceSuggestionSheet({ visible, onApply, onClose }: ApplianceSuggestionSheetProps) {
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.phoneFrame}>
        <EditSheetSurface>
          <View style={styles.recommendationImage}>
            <Image source={SOLAR_RECOMMENDATION_SOURCE} style={styles.image} contentFit="contain" />
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close solar suggestion">
              <X size={18} color="#292524" strokeWidth={1.7} />
            </Pressable>
          </View>
          <View style={styles.copyArea}>
            <View style={styles.recommendationTitleRow}>
              <SunMedium size={17} color="#A97A4A" strokeWidth={1.7} />
              <Text style={styles.title}>Add home solar</Text>
            </View>
            <Text style={styles.body} numberOfLines={2}>Offset daytime electricity use and rely less on the grid.</Text>
            <Pressable onPress={onApply} style={styles.applyButton} accessibilityRole="button" accessibilityLabel="Apply solar recommendation">
              <Text style={styles.applyText}>Apply</Text>
            </Pressable>
          </View>
        </EditSheetSurface>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 64 },
  phoneFrame: { width: '100%', maxWidth: 430 },
  recommendationImage: { height: 76, borderRadius: 22, backgroundColor: '#F6E8D8', borderWidth: 1, borderColor: '#E6C39B', alignItems: 'center', justifyContent: 'center' },
  image: { width: 94, height: 70 },
  closeButton: { position: 'absolute', top: 4, right: 4, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.86)' },
  copyArea: { flex: 1, paddingTop: 4 },
  recommendationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontFamily: 'Lora_600SemiBold', fontSize: 16, lineHeight: 20, color: '#292524' },
  body: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, lineHeight: 15, color: '#57534E' },
  applyButton: { minHeight: 48, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D4A373' },
  applyText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 15, color: '#292524' },
});
