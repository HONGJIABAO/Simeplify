import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { StoredRoom } from '../logic/storage';
import { getRoomSuggestedName, ROOM_TYPE_SETTINGS } from '../logic/roomData';

interface RoomNamingModalProps {
  visible: boolean;
  room: StoredRoom | null;
  onSave: (roomId: string, name: string, type: StoredRoom['type']) => void;
  onClose: () => void;
}

function RoomNamingModalInner({
  room,
  onSave,
  onClose,
}: {
  room: StoredRoom;
  onSave: (roomId: string, name: string, type: StoredRoom['type']) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(room.name || getRoomSuggestedName(room));
  const [selectedType, setSelectedType] = useState<StoredRoom['type']>(room.type || 'living');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(room.id, name.trim(), selectedType);
    onClose();
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Set up this room"
      contentStyle={{ paddingHorizontal: 0 }}
    >
      <View style={styles.content}>
        {/* Custom Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Room name</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Master Bedroom, Living room"
            maxLength={30}
          />
        </View>

        {/* Room Type Selector for Avatar Routine */}
        <View style={styles.typeSection}>
          <Text style={styles.sectionLabel}>Room type</Text>
          <Text style={styles.helpText}>
            The room type sets its floor colour and routine role.
          </Text>
          <View style={styles.typesRow}>
            {(['living', 'kitchen', 'bedroom', 'bathroom'] as const).map((t) => {
              const isCurrent = selectedType === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setSelectedType(t)}
                  style={[styles.typePill, isCurrent && styles.typePillSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`Assign routine role as ${t}`}
                >
                  <Text style={[styles.typeText, isCurrent && styles.typeTextSelected]}>
                    {ROOM_TYPE_SETTINGS[t].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={!name.trim()}
            style={styles.saveBtn}
          >
            Save
          </Button>
          <Button variant="secondary" onPress={onClose} style={styles.cancelBtn}>
            Cancel
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}

export function RoomNamingModal({
  visible,
  room,
  onSave,
  onClose,
}: RoomNamingModalProps) {
  if (!visible || !room) return null;

  return (
    <RoomNamingModalInner
      key={`${room.id}-${room.name}-${room.type}`}
      room={room}
      onSave={onSave}
      onClose={onClose}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 16,
  },
  sectionLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13.5,
    color: '#292524',
    marginBottom: 4,
  },
  helpText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
    marginTop: -4,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  chipSelected: {
    backgroundColor: '#E0E6D9',
    borderColor: '#8B9D77',
  },
  chipText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534E',
  },
  chipTextSelected: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  inputSection: {
    gap: 6,
  },
  typeSection: {
    gap: 6,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FAF6F1',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    alignItems: 'center',
  },
  typePillSelected: {
    backgroundColor: '#E0E6D9',
    borderColor: '#8B9D77',
  },
  typeText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534E',
  },
  typeTextSelected: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  buttonRow: {
    gap: 8,
    marginTop: 8,
  },
  saveBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
  },
});
