/**
 * SIM-05, ONB-03
 * Bottom sheet form for adding or editing appliance details.
 * Source: docs/page_refined.md S4.5, docs/Feature_Requirements.md ONB-03.
 *
 * Fields:
 * - Appliance type
 * - Brand (Input)
 * - Model or wattage (Input)
 * - 5-star rating picker with "Not sure" button (sets 3 stars)
 * - Quantity (Stepper)
 * - Room picker
 * - Buttons: Save (Primary) and Cancel (Secondary).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Star } from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Sprite } from './Sprite';
import { Switch } from '@/components/Switch';
import { Placement } from '../logic/scene';
import { Appliance, ApplianceType, MOCK_ROOMS, Room } from '@/lib/mockData';

interface ApplianceDetailsSheetProps {
  rooms?: Room[];
  placement?: Placement | null;
  spriteKey?: string;
  onDelete?: () => void;
  visible: boolean;
  onClose: () => void;
  applianceType: ApplianceType;
  defaultWattage?: number;
  initialAppliance?: Appliance | null;
  onSave: (appliance: Omit<Appliance, 'id'>) => void;
}

const TYPE_NAMES: Record<ApplianceType, string> = {
  air_conditioner: 'Air Conditioner',
  refrigerator: 'Refrigerator',
  water_heater: 'Water Heater',
  tv: 'Television',
  fan: 'Fan',
  lights: 'Lights',
};

function ApplianceDetailsForm({
  applianceType,
  defaultWattage,
  initialAppliance,
  rooms = MOCK_ROOMS, placement, spriteKey, onDelete,
  onSave,
  onClose,
}: {
  rooms?: Room[]; placement?: Placement | null; spriteKey?: string; onDelete?: () => void;
  applianceType: ApplianceType;
  defaultWattage: number;
  initialAppliance?: Appliance | null;
  onSave: (appliance: Omit<Appliance, 'id'>) => void;
  onClose: () => void;
}) {
  const [brand, setBrand] = useState(initialAppliance?.brand ?? '');
  const [wattage, setWattage] = useState(
    initialAppliance ? String(initialAppliance.wattage) : String(defaultWattage)
  );
  const [stars, setStars] = useState(initialAppliance?.stars ?? 3);
  const [alwaysOn, setAlwaysOn] = useState(initialAppliance?.alwaysOn ?? applianceType === 'refrigerator');
  const [isOn, setIsOn] = useState(initialAppliance?.isOn ?? false);
  const [error, setError] = useState('');
  const [roomId, setRoomId] = useState(
    initialAppliance?.roomId ?? placement?.roomId ?? rooms[0]?.id ?? 'living'
  );

  const handleSave = () => {
    const numWattage = Number(wattage);
    if (!Number.isFinite(numWattage) || numWattage <= 0 || numWattage > 100000) { setError('Enter a wattage greater than 0 and at most 100,000 W.'); return; }
    const typeName = TYPE_NAMES[applianceType];
    const name = brand ? `${brand} ${typeName}` : typeName;

    onSave({
      name,
      type: applianceType,
      brand: brand || 'Standard',
      wattage: numWattage,
      stars,
      roomId,
      posX: roomId === (initialAppliance?.roomId ?? placement?.roomId) ? (initialAppliance?.posX ?? placement?.posX ?? .5) : .5,
      posY: roomId === (initialAppliance?.roomId ?? placement?.roomId) ? (initialAppliance?.posY ?? placement?.posY ?? .5) : .5,
      alwaysOn, isOn, spriteKey: initialAppliance?.spriteKey ?? spriteKey,
      color: '#d4a373', // tan-400
    });
    onClose();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: 'center' }}><Sprite type={initialAppliance?.spriteKey ?? spriteKey ?? applianceType} size={72} /></View>
      {!!error && <Text accessibilityRole="alert" style={{ color: '#a8442f' }}>{error}</Text>}
      {/* Brand input */}
      <View style={styles.section}>
        <Text style={styles.label}>Brand</Text>
        <Input
          value={brand}
          onChangeText={setBrand}
          placeholder="e.g. Panasonic, Sharp, Daikin"
        />
      </View>

      {/* Wattage input */}
      <View style={styles.section}>
        <Text style={styles.label}>Approximate wattage (W)</Text>
        <Input
          value={wattage}
          onChangeText={setWattage}
          placeholder={String(defaultWattage)}
          keyboardType="numeric"
        />
      </View>

      {/* Star rating picker */}
      <View style={styles.section}>
        <View style={styles.starsHeader}>
          <Text style={styles.label}>Energy star rating</Text>
          <Pressable
            onPress={() => setStars(3)}
            style={styles.notSureBtn}
            accessibilityRole="button"
            accessibilityLabel="Not sure star rating"
          >
            <Text style={styles.notSureText}>Not sure</Text>
          </Pressable>
        </View>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable
              key={s}
              onPress={() => setStars(s)}
              style={styles.starBtn}
              accessibilityRole="button"
              accessibilityLabel={`${s} stars`}
            >
              <Star
                size={32}
                color={s <= stars ? '#d4a373' : '#d6d3d1'}
                fill={s <= stars ? '#d4a373' : 'none'}
                strokeWidth={1.5}
              />
            </Pressable>
          ))}
          <Text style={styles.starsDisplay}>
            {stars} {stars === 1 ? 'Star' : 'Stars'}
          </Text>
        </View>
      </View>

      <View style={styles.starsHeader}><Text style={styles.label}>Always on (including when away)</Text><Switch value={alwaysOn} onValueChange={setAlwaysOn} /></View>
      <View style={styles.starsHeader}><Text style={styles.label}>Keep switched on</Text><Switch value={isOn} onValueChange={setIsOn} /></View>

      {/* Room selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Room location</Text>
        <View style={styles.roomsRow}>
          {rooms.map((room) => {
            const isSelected = room.id === roomId;
            return (
              <Pressable
                key={room.id}
                onPress={() => setRoomId(room.id)}
                style={[
                  styles.roomPill,
                  isSelected && styles.roomPillSelected,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${room.name || 'Unnamed room'}`}
              >
                <Text
                  style={[
                    styles.roomPillText,
                    isSelected && styles.roomPillTextSelected,
                  ]}
                >
                  {room.name || 'Unnamed room'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button variant="primary" onPress={handleSave} style={styles.saveBtn}>
          Save appliance
        </Button>
        {onDelete && <Button variant="secondary" onPress={onDelete}>Remove appliance</Button>}
        <Button variant="secondary" onPress={onClose} style={styles.cancelBtn}>
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
}

export function ApplianceDetailsSheet({
  visible,
  onClose,
  applianceType,
  defaultWattage = 100,
  initialAppliance,
  rooms = MOCK_ROOMS, placement, spriteKey, onDelete,
  onSave,
}: ApplianceDetailsSheetProps) {
  const formKey = initialAppliance
    ? initialAppliance.id
    : `${applianceType}-${defaultWattage}`;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={initialAppliance ? 'Edit Appliance' : `Add ${TYPE_NAMES[applianceType]}`}
      height="88%"
    >
      <ApplianceDetailsForm
        key={`${formKey}-${visible}-${placement?.roomId}-${placement?.posX}-${placement?.posY}`}
        rooms={rooms} placement={placement} spriteKey={spriteKey} onDelete={onDelete}
        applianceType={applianceType}
        defaultWattage={defaultWattage}
        initialAppliance={initialAppliance}
        onSave={onSave}
        onClose={onClose}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  section: {
    gap: 6,
  },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  starsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notSureBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#f5f5f4', // stone-100
  },
  notSureText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e', // stone-600
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  starBtn: {
    padding: 4,
  },
  starsDisplay: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
    marginLeft: 8,
  },
  roomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#faf6f1', // cream
    borderWidth: 1,
    borderColor: '#e7e5e4', // stone-200
  },
  roomPillSelected: {
    backgroundColor: '#e0e6d9', // sage-100
    borderColor: '#8b9d77', // sage-400
  },
  roomPillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
  },
  roomPillTextSelected: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  saveBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
  },
});
