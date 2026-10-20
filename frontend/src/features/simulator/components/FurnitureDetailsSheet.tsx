import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Sprite } from './Sprite';
import { SPRITE_MAP } from '../logic/spriteMap';
import { StoredPlacedItem, StoredRoom } from '../logic/storage';
import { getRoomDisplayName } from '../logic/roomData';

interface FurnitureDetailsSheetProps {
  visible: boolean;
  item: StoredPlacedItem | null;
  rooms: StoredRoom[];
  onSave: (updatedItem: StoredPlacedItem) => void;
  onCancel: () => void;
  onDelete?: (itemId: string) => void;
}

function FurnitureDetailsFormInner({
  item,
  rooms,
  onSave,
  onCancel,
  onDelete,
}: {
  item: StoredPlacedItem;
  rooms: StoredRoom[];
  onSave: (updatedItem: StoredPlacedItem) => void;
  onCancel: () => void;
  onDelete?: (itemId: string) => void;
}) {
  const itemDef = SPRITE_MAP[item.spriteKey] || SPRITE_MAP[item.type];
  const [name, setName] = useState(item.name || itemDef?.fullName || 'Furniture');
  const [selectedRoomId, setSelectedRoomId] = useState(item.roomId);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      ...item,
      name: name.trim(),
      roomId: selectedRoomId,
    });
  };

  return (
    <BottomSheet
      visible
      onClose={onCancel}
      title="Furniture Details"
      contentStyle={{ paddingHorizontal: 0 }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.spriteHeader}>
          <View style={styles.spriteWrapper}>
            <Sprite type={item.spriteKey || item.type} size={64} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Living Sofa, Comfort Bed"
            maxLength={40}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Room location</Text>
          <View style={styles.roomsRow}>
            {rooms.filter((room) => room.isSetUp).map((r) => {
              const isSelected = r.id === selectedRoomId;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setSelectedRoomId(r.id)}
                  style={[styles.roomPill, isSelected && styles.roomPillSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`Place in ${getRoomDisplayName(r, rooms)}`}
                >
                  <Text style={[styles.roomPillText, isSelected && styles.roomPillTextSelected]}>
                    {getRoomDisplayName(r, rooms)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.buttonStack}>
          <Button variant="primary" onPress={handleSave} style={styles.fullWidthBtn}>
            Save
          </Button>
          {onDelete && (
            <Button
              variant="secondary"
              onPress={() => onDelete(item.id)}
              style={styles.fullWidthBtn}
            >
              Remove furniture
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

export function FurnitureDetailsSheet({
  visible,
  item,
  rooms,
  onSave,
  onCancel,
  onDelete,
}: FurnitureDetailsSheetProps) {
  if (!visible || !item) return null;

  return (
    <FurnitureDetailsFormInner
      key={`${item.id}-${item.roomId}`}
      item={item}
      rooms={rooms}
      onSave={onSave}
      onCancel={onCancel}
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
  section: {
    gap: 6,
  },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
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
