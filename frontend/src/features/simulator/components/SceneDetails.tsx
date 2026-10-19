import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Room } from '@/lib/mockData';
import { BottomSheet } from '@/components/BottomSheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Furniture } from '../logic/scene';
import { Sprite } from './Sprite';
export function RoomForm({ room, onSave, onClose }: { room: Room; onSave: (room: Room) => void; onClose: () => void }) {
  const [name, setName] = useState(room.name);
  const [type, setType] = useState(room.type);
  return <BottomSheet visible onClose={onClose} title="Set up room">
    <View style={{ padding: 20, gap: 18 }}>
      <Text>Room name</Text><Input value={name} onChangeText={setName} placeholder="e.g. My bedroom" maxLength={30} />
      <Text>Room type</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['living', 'kitchen', 'bedroom', 'bathroom'] as const).map(t => <Pressable key={t} accessibilityRole="button" accessibilityState={{ selected: t === type }} onPress={() => setType(t)} style={{ padding: 12, borderRadius: 16, backgroundColor: t === type ? '#e0e6d9' : '#faf6f1' }}><Text>{t}</Text></Pressable>)}
      </View><Button disabled={!name.trim()} onPress={() => { onSave({ ...room, name: name.trim(), type }); onClose(); }}>Save room</Button>
    </View>
  </BottomSheet>;
}
export function FurnitureForm({ item, rooms, onSave, onClose, onDelete }: { item: Furniture; rooms: Room[]; onSave: (item: Furniture) => void; onClose: () => void; onDelete?: () => void }) {
  const [name, setName] = useState(item.name);
  const [roomId, setRoomId] = useState(item.roomId);
  return <BottomSheet visible onClose={onClose} title="Furniture details">
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View style={{ alignItems: 'center' }}><Sprite type={item.type} size={80} /></View>
      <Text>Name</Text><Input value={name} onChangeText={setName} maxLength={40} />
      <Text>Room</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{rooms.map((r, i) => <Pressable key={r.id} accessibilityRole="button" onPress={() => setRoomId(r.id)} style={{ padding: 12, backgroundColor: roomId === r.id ? '#e0e6d9' : '#faf6f1', borderRadius: 16 }}><Text>{r.name || `Room ${i + 1}`}</Text></Pressable>)}</View>
      <Button disabled={!name.trim()} onPress={() => { onSave({ ...item, name: name.trim(), roomId, posX: roomId === item.roomId ? item.posX : .5, posY: roomId === item.roomId ? item.posY : .5 }); onClose(); }}>Save furniture</Button>
      {onDelete && <Button variant="secondary" onPress={onDelete}>Remove furniture</Button>}
      <Button variant="secondary" onPress={onClose}>Cancel</Button>
    </ScrollView>
  </BottomSheet>;
}
