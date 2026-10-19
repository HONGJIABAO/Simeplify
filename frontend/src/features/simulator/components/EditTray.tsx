/**
 * SIM-05
 * Edit mode bottom tray containing appliance catalog.
 * Source: docs/screenshot/simulator/simulator_appliances.png, docs/page_refined.md S4.3.
 *
 * Rules:
 * - Slides up above tab bar (no scrim; floor plan stays tappable).
 * - Segmented control: "Appliances | Furniture" (ENABLE_FURNITURE_TAB = false).
 * - Grid / horizontal scroll of 72 × 72 px tiles (radius 20, line illustration, 13 px label).
 * - Tapping or dragging an item onto a room triggers appliance details entry.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  AirVent,
  Refrigerator,
  Lightbulb,
  Tv,
  Fan,
  ShowerHead,
} from 'lucide-react-native';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ApplianceType } from '@/lib/mockData';
import { ENABLE_FURNITURE_TAB } from '@/lib/flags';

interface CatalogItem {
  type: ApplianceType;
  label: string;
  defaultWattage: number;
  icon: React.ReactNode;
}

const CATALOG_ITEMS: CatalogItem[] = [
  {
    type: 'air_conditioner',
    label: 'Air cond.',
    defaultWattage: 1200,
    icon: <AirVent size={28} color="#292524" strokeWidth={1.5} />,
  },
  {
    type: 'refrigerator',
    label: 'Fridge',
    defaultWattage: 120,
    icon: <Refrigerator size={28} color="#292524" strokeWidth={1.5} />,
  },
  {
    type: 'lights',
    label: 'Lights',
    defaultWattage: 20,
    icon: <Lightbulb size={28} color="#292524" strokeWidth={1.5} />,
  },
  {
    type: 'tv',
    label: 'TV',
    defaultWattage: 90,
    icon: <Tv size={28} color="#292524" strokeWidth={1.5} />,
  },
  {
    type: 'fan',
    label: 'Fan',
    defaultWattage: 60,
    icon: <Fan size={28} color="#292524" strokeWidth={1.5} />,
  },
  {
    type: 'water_heater',
    label: 'Water heater',
    defaultWattage: 3500,
    icon: <ShowerHead size={28} color="#292524" strokeWidth={1.5} />,
  },
];

interface EditTrayProps {
  visible: boolean;
  onSelectApplianceType: (type: ApplianceType, defaultWattage: number) => void;
}

export function EditTray({ visible, onSelectApplianceType }: EditTrayProps) {
  const [activeTab, setActiveTab] = useState<'Appliances' | 'Furniture'>('Appliances');

  if (!visible) return null;

  return (
    <View style={styles.tray}>
      {/* Drag handle */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <SegmentedControl
          options={[
            { label: 'Appliances', value: 'Appliances' },
            { label: 'Furniture', value: 'Furniture' },
          ]}
          selectedValue={activeTab}
          onChange={(val) => {
            if (val === 'Furniture' && !ENABLE_FURNITURE_TAB) {
              // TODO(open-item 5): Furniture tab is not implemented in v1
              setActiveTab('Furniture');
            } else {
              setActiveTab(val as 'Appliances' | 'Furniture');
            }
          }}
        />
      </View>

      {/* Catalog Items */}
      {activeTab === 'Appliances' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {CATALOG_ITEMS.map((item) => (
            <Pressable
              key={item.type}
              style={({ pressed }) => [
                styles.itemCard,
                pressed && styles.itemCardPressed,
              ]}
              onPress={() => onSelectApplianceType(item.type, item.defaultWattage)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.label}`}
            >
              <View style={styles.iconBox}>{item.icon}</View>
              <Text style={styles.itemLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.furnitureEmpty}>
          <Text style={styles.furnitureEmptyText}>
            Furniture catalog coming in a future update.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#e7e5e4',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 9999,
    backgroundColor: '#d6d3d1', // stone-300
  },
  segmentContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  scrollList: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  itemCard: {
    alignItems: 'center',
    width: 76,
  },
  itemCardPressed: {
    transform: [{ scale: 0.96 }],
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#faf6f1', // cream
    borderWidth: 1,
    borderColor: '#e7e5e4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  itemLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
    textAlign: 'center',
  },
  furnitureEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  furnitureEmptyText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#a8a29e',
  },
});
