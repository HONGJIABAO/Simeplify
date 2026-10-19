import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ApplianceType } from '@/lib/mockData';
import { CATALOG, CatalogItem } from '../logic/scene';
import { DragSprite } from './DragSprite';
export function EditTray({ visible, onSelectApplianceType, onPick, onDrop, onDrag }: {
  onDrag?: (item: CatalogItem, point: { x: number; y: number } | null) => void;
  visible: boolean; onSelectApplianceType?: (type: ApplianceType, watts: number) => void;
  onPick?: (item: CatalogItem) => void; onDrop?: (item: CatalogItem, x: number, y: number) => void;
}) {
  const [tab, setTab] = useState('Appliances');
  if (!visible) return null;
  return <View style={{ backgroundColor: '#faf6f1', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 12, gap: 10 }}>
    <View style={{ width: 36, height: 4, backgroundColor: '#d6d3d1', borderRadius: 4, alignSelf: 'center' }} />
    <SegmentedControl options={['Appliances', 'Furniture'].map(value => ({ value, label: value }))} selectedValue={tab} onChange={setTab} />
    <Text style={{ textAlign: 'center', color: '#57534e', fontSize: 12 }}>Drag into a room, or tap an item then a spot.</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingVertical: 6 }}>
      {CATALOG.filter(item => item.category === tab).map(item => <View key={item.key} style={{ alignItems: 'center', width: 64 }}>
        <DragSprite type={item.key} label={`Place ${item.label}`} size={56} catalog onDrag={point => onDrag?.(item, point)} onDrop={(x, y) => onDrop?.(item, x, y)} onPress={() => onPick ? onPick(item) : item.category === 'Appliances' && onSelectApplianceType?.(item.type as ApplianceType, item.wattage)} />
        <Text style={{ fontSize: 11, color: '#292524', marginTop: 4 }}>{item.label}</Text>
      </View>)}
    </ScrollView>
  </View>;
}
