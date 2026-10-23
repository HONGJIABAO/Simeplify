import React, { useState } from 'react';
import { LayoutChangeEvent, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Star, X } from 'lucide-react-native';
import { EditSheetSurface, EditSheetTileSurface } from './EditSheet';
import { Sprite } from './Sprite';
import { getTrayTileWidth } from '../logic/trayRules';
import { type SwapSuggestionCard } from '../logic/energyReport';

interface SwapSuggestionSheetProps {
  visible: boolean;
  suggestions: SwapSuggestionCard[];
  onApply: (suggestion: SwapSuggestionCard) => void;
  onClose: () => void;
}

export function SwapSuggestionSheet({ visible, suggestions, onApply, onClose }: SwapSuggestionSheetProps) {
  const [trayWidth, setTrayWidth] = useState(390);
  const tileWidth = getTrayTileWidth(trayWidth);
  const onLayout = (event: LayoutChangeEvent) => setTrayWidth(event.nativeEvent.layout.width);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.phoneFrame}>
          <EditSheetSurface height={272}>
            <View style={styles.header}>
              <Text style={styles.title}>Energy Optimization Suggestions</Text>
              <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close swap suggestions">
                <X size={18} color="#292524" strokeWidth={1.7} />
              </Pressable>
            </View>
            <View style={styles.viewport} onLayout={onLayout}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
                {suggestions.map((suggestion) => (
                  <View key={suggestion.source.item.id} style={[styles.tileWrapper, { width: tileWidth }]}>
                    <EditSheetTileSurface width={tileWidth} style={styles.tileSurface}>
                      <Text style={styles.typeName} numberOfLines={1}>{suggestion.source.typeName}</Text>
                      <Sprite type={suggestion.spriteKey} size={52} width={52} height={52} resizeMode="contain" />
                      <View style={styles.starRow}>
                        <Star size={13} color="#D6D3D1" fill="#D4A373" strokeWidth={1.5} />
                        <Text style={styles.starText}>{suggestion.replacement.stars}</Text>
                      </View>
                      <Text style={styles.brand} numberOfLines={1}>{suggestion.replacement.brand}</Text>
                      <Text style={styles.watts}>{suggestion.replacement.wattage} W</Text>
                      <Pressable onPress={() => onApply(suggestion)} style={styles.actionButton}
                        accessibilityRole="button" accessibilityLabel={`Apply ${suggestion.replacement.brand} ${suggestion.source.typeName} swap`}>
                        <Text style={styles.actionText}>Swap</Text>
                      </Pressable>
                    </EditSheetTileSurface>
                  </View>
                ))}
              </ScrollView>
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
  header: { minHeight: 52, paddingRight: 50, justifyContent: 'center' },
  title: { fontFamily: 'Lora_600SemiBold', fontSize: 17, lineHeight: 22, color: '#292524' },
  closeButton: { position: 'absolute', top: 4, right: 4, width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.86)' },
  viewport: { flex: 1, marginHorizontal: -16, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', paddingHorizontal: 16, alignItems: 'center' },
  tileWrapper: { alignItems: 'center' },
  tileSurface: { height: 176, paddingHorizontal: 4, paddingVertical: 7, justifyContent: 'flex-start' },
  typeName: { width: '100%', fontFamily: 'SourceSans3_400Regular', fontSize: 9, color: '#78716C', textAlign: 'center' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: -2 },
  starText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 11, color: '#57534E' },
  brand: { width: '100%', fontFamily: 'SourceSans3_600SemiBold', fontSize: 11, color: '#292524', textAlign: 'center' },
  watts: { fontFamily: 'SourceSans3_400Regular', fontSize: 10, color: '#57534E' },
  actionButton: { width: '90%', minHeight: 30, marginTop: 4, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D4A373' },
  actionText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 11, color: '#292524' },
});
