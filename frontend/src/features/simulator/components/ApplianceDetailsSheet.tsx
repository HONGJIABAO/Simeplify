import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Star } from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Switch } from '@/components/Switch';
import { Sprite } from './Sprite';
import { SPRITE_MAP } from '../logic/spriteMap';
import { StoredPlacedItem, StoredRoom } from '../logic/storage';

export interface ApplianceDetailsSheetProps {
  visible: boolean;
  item?: StoredPlacedItem | null;
  rooms?: StoredRoom[];
  applianceType?: string;
  defaultWattage?: number;
  initialAppliance?: any;
  onSave: (updatedItem: any) => void;
  onCancel?: () => void;
  onClose?: () => void;
  onDelete?: (itemId: string) => void;
}

function ApplianceDetailsFormInner({
  activeItem,
  rooms,
  onSave,
  onCancel,
  onDelete,
}: {
  activeItem: StoredPlacedItem;
  rooms: StoredRoom[];
  onSave: (updatedItem: any) => void;
  onCancel: () => void;
  onDelete?: (itemId: string) => void;
}) {
  const itemDef = SPRITE_MAP[activeItem.spriteKey] || SPRITE_MAP[activeItem.type];
  const isEditing = !activeItem.id.startsWith('pending_');
  const title = isEditing
    ? `Edit ${itemDef?.fullName || activeItem.name}`
    : `Add ${itemDef?.fullName || activeItem.name}`;

  const [brand, setBrand] = useState(activeItem.brand || '');
  const [wattage, setWattage] = useState(
    activeItem.wattage ? String(activeItem.wattage) : String(itemDef?.defaultWattage || 100)
  );
  const [stars, setStars] = useState(activeItem.stars || 3);
  const [isNotSure, setIsNotSure] = useState(activeItem.stars === undefined || activeItem.stars === 3);
  const [hoursPerDay, setHoursPerDay] = useState(
    activeItem.hoursPerDay ? String(activeItem.hoursPerDay) : String(itemDef?.defaultHours || 6)
  );
  const [alwaysOn, setAlwaysOn] = useState(
    activeItem.alwaysOn ?? itemDef?.alwaysOn ?? false
  );
  const [isOn, setIsOn] = useState(activeItem.isOn ?? false);
  const [selectedRoomId, setSelectedRoomId] = useState(activeItem.roomId);
  const [error, setError] = useState('');

  const handleStarPress = (rating: number) => {
    setStars(rating);
    setIsNotSure(false);
  };

  const handleNotSurePress = () => {
    setIsNotSure(true);
    setStars(3); // Default efficiency assumption
  };

  const handleSave = () => {
    const numWattage = Number(wattage);
    if (!Number.isFinite(numWattage) || numWattage <= 0) {
      setError('Please enter a valid approximate wattage greater than 0 W.');
      return;
    }

    const numHours = Number(hoursPerDay);
    const validHours = Number.isFinite(numHours) && numHours >= 0 && numHours <= 24 ? numHours : 6;

    const brandPrefix = brand.trim() ? `${brand.trim()} ` : '';
    const finalName = `${brandPrefix}${itemDef?.fullName || activeItem.name}`;

    onSave({
      ...activeItem,
      id: activeItem.id.startsWith('pending_') ? `app_${activeItem.type}_${activeItem.roomId}` : activeItem.id,
      name: finalName,
      brand: brand.trim(),
      wattage: numWattage,
      stars,
      hoursPerDay: validHours,
      alwaysOn,
      isOn,
      roomId: selectedRoomId,
    });
  };

  return (
    <BottomSheet
      visible
      onClose={onCancel}
      title={title}
      height="88%"
      contentStyle={{ flex: 1, paddingHorizontal: 0 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header sprite view */}
        <View style={styles.spriteHeader}>
          <View style={styles.spriteWrapper}>
            <Sprite type={activeItem.spriteKey || activeItem.type} size={64} />
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Brand Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Brand</Text>
          <Input
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. Panasonic, Sharp, Daikin"
            maxLength={40}
          />
        </View>

        {/* Approximate Wattage */}
        <View style={styles.section}>
          <Text style={styles.label}>Approximate wattage (W)</Text>
          <Input
            value={wattage}
            onChangeText={(txt) => {
              setWattage(txt);
              setError('');
            }}
            placeholder={String(itemDef?.defaultWattage || 100)}
            keyboardType="numeric"
          />
        </View>

        {/* Energy Star Rating */}
        <View style={styles.section}>
          <View style={styles.starsHeader}>
            <Text style={styles.label}>Energy star rating</Text>
            <Pressable
              onPress={handleNotSurePress}
              style={[styles.notSureChip, isNotSure && styles.notSureChipActive]}
              accessibilityRole="button"
              accessibilityLabel="Not sure star rating"
            >
              <Text style={[styles.notSureText, isNotSure && styles.notSureTextActive]}>
                Not sure
              </Text>
            </Pressable>
          </View>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable
                key={s}
                onPress={() => handleStarPress(s)}
                style={styles.starBtn}
                accessibilityRole="button"
                accessibilityLabel={`${s} stars`}
              >
                <Star
                  size={30}
                  color={s <= stars ? '#D4A373' : '#D6D3D1'}
                  fill={s <= stars ? '#D4A373' : 'none'}
                  strokeWidth={1.5}
                />
              </Pressable>
            ))}
            <Text style={styles.starsCountText}>
              {stars} {stars === 1 ? 'Star' : 'Stars'}
            </Text>
          </View>
        </View>

        {/* Hours of use per day */}
        <View style={styles.section}>
          <Text style={styles.label}>Hours of use per day</Text>
          <Input
            value={hoursPerDay}
            onChangeText={setHoursPerDay}
            placeholder="e.g. 8"
            keyboardType="numeric"
          />
        </View>

        {/* Always on toggle */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.label}>Always on</Text>
            <Text style={styles.subtext}>
              Runs continuously, including when away (e.g. Refrigerator)
            </Text>
          </View>
          <Switch value={alwaysOn} onValueChange={setAlwaysOn} />
        </View>

        {/* Keep switched on toggle */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.label}>Keep switched on</Text>
            <Text style={styles.subtext}>
              Leave on manually regardless of schedule
            </Text>
          </View>
          <Switch value={isOn} onValueChange={setIsOn} />
        </View>

        {/* Room selection */}
        {rooms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Room location</Text>
            <View style={styles.roomsRow}>
              {rooms.map((r) => {
                const isSelected = r.id === selectedRoomId;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setSelectedRoomId(r.id)}
                    style={[styles.roomPill, isSelected && styles.roomPillSelected]}
                    accessibilityRole="button"
                    accessibilityLabel={`Place in ${r.name || 'Unnamed room'}`}
                  >
                    <Text style={[styles.roomPillText, isSelected && styles.roomPillTextSelected]}>
                      {r.name || 'Unnamed room'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonStack}>
          <Button variant="primary" onPress={handleSave} style={styles.fullWidthBtn}>
            Save
          </Button>
          {isEditing && onDelete && (
            <Button
              variant="secondary"
              onPress={() => onDelete(activeItem.id)}
              style={styles.fullWidthBtn}
            >
              Remove appliance
            </Button>
          )}
          <Button variant="secondary" onPress={onCancel} style={styles.fullWidthBtn}>
            Cancel
          </Button>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

export function ApplianceDetailsSheet({
  visible,
  item,
  rooms = [],
  applianceType,
  defaultWattage,
  initialAppliance,
  onSave,
  onCancel,
  onClose,
  onDelete,
}: ApplianceDetailsSheetProps) {
  if (!visible) return null;

  const closeHandler = onCancel || onClose || (() => {});

  const activeItem: StoredPlacedItem = item || {
    id: initialAppliance?.id || 'app_new',
    category: 'Appliances',
    type: applianceType || initialAppliance?.type || 'air_conditioner',
    spriteKey: applianceType || initialAppliance?.type || 'air_conditioner',
    name: initialAppliance?.name || 'Air Conditioner',
    roomId: initialAppliance?.roomId || (rooms[0]?.id ?? 'living'),
    posX: initialAppliance?.posX ?? 0.5,
    posY: initialAppliance?.posY ?? 0.5,
    brand: initialAppliance?.brand || '',
    wattage: defaultWattage || initialAppliance?.wattage || 1200,
    stars: initialAppliance?.stars || 3,
    hoursPerDay: initialAppliance?.hoursPerDay || 8,
    alwaysOn: initialAppliance?.alwaysOn ?? false,
    isOn: initialAppliance?.isOn ?? false,
  };

  return (
    <ApplianceDetailsFormInner
      key={`${activeItem.id}-${activeItem.roomId}`}
      activeItem={activeItem}
      rooms={rooms}
      onSave={onSave}
      onCancel={closeHandler}
      onDelete={onDelete}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 16,
  },
  spriteHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  spriteWrapper: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FAF6F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#991B1B',
  },
  section: {
    gap: 6,
  },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  subtext: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  starsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notSureChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  notSureChipActive: {
    backgroundColor: '#EAE5D9',
    borderColor: '#C8BBA8',
  },
  notSureText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#78716C',
  },
  notSureTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  starBtn: {
    padding: 4,
  },
  starsCountText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
    marginLeft: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  roomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FAF6F1',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  roomPillSelected: {
    backgroundColor: '#E0E6D9',
    borderColor: '#8B9D77',
  },
  roomPillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534E',
  },
  roomPillTextSelected: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  buttonStack: {
    gap: 10,
    marginTop: 10,
  },
  fullWidthBtn: {
    width: '100%',
  },
});
