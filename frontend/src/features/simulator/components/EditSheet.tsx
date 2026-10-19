import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { APPLIANCE_SPRITES, FURNITURE_SPRITES, SpriteItemDef } from '../logic/spriteMap';
import { Sprite } from './Sprite';

interface EditSheetProps {
  visible: boolean;
  onItemPointerDown: (item: SpriteItemDef, clientX: number, clientY: number) => void;
  onItemTap: (item: SpriteItemDef) => void;
  selectedPendingKey?: string | null;
}

export function EditSheet({
  visible,
  onItemPointerDown,
  onItemTap,
  selectedPendingKey,
}: EditSheetProps) {
  const [activeTab, setActiveTab] = useState<'Appliances' | 'Furniture'>('Appliances');

  if (!visible) return null;

  const currentItems = activeTab === 'Appliances' ? APPLIANCE_SPRITES : FURNITURE_SPRITES;

  return (
    <View style={styles.sheetContainer}>
      {/* Drag Handle */}
      <View style={styles.handle} />

      {/* Segmented Tab Pill */}
      <View style={styles.segmentedContainer}>
        <Pressable
          onPress={() => setActiveTab('Appliances')}
          style={[styles.segmentBtn, activeTab === 'Appliances' && styles.segmentBtnActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Appliances' }}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'Appliances' && styles.segmentTextActive,
            ]}
          >
            Appliances
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('Furniture')}
          style={[styles.segmentBtn, activeTab === 'Furniture' && styles.segmentBtnActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Furniture' }}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'Furniture' && styles.segmentTextActive,
            ]}
          >
            Furniture
          </Text>
        </Pressable>
      </View>

      {/* Horizontal Scroll of Item Tiles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentItems.map((item) => {
          const isSelected = selectedPendingKey === item.key;
          return (
            <View key={item.key} style={styles.itemWrapper}>
              <View
                // Pointer down on Web & Native
                {...(Platform.OS === 'web'
                  ? {
                      onPointerDown: (e: any) => {
                        onItemPointerDown(item, e.clientX, e.clientY);
                      },
                    }
                  : {})}
              >
                <Pressable
                  onPress={() => onItemTap(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.label}`}
                  style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                >
                  <Sprite type={item.key} size={48} />
                </Pressable>
              </View>
              <Text style={styles.itemLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: 94, // Clears floating bottom tab bar
    paddingHorizontal: 16,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: '#ECE7DE',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D3D1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAE7E0',
    borderRadius: 9999,
    padding: 3,
    marginBottom: 14,
    alignSelf: 'center',
    width: 230,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#78716C',
  },
  segmentTextActive: {
    color: '#1C1917',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 8,
    paddingBottom: 2,
  },
  itemWrapper: {
    alignItems: 'center',
    width: 64,
  },
  itemCard: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#F6F4EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E4DC',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemCardSelected: {
    borderColor: '#566549',
    backgroundColor: '#E0E6D9',
  },
  itemLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#292524',
    marginTop: 5,
    textAlign: 'center',
  },
});
