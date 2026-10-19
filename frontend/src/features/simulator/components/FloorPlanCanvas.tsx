import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, AccessibilityInfo } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { Appliance, Room } from '@/lib/mockData';
import { AvatarState } from '../logic/avatarPlace';
import { Furniture, Placement, isApplianceOn } from '../logic/scene';
import { ResidentAvatar } from './ResidentAvatar';
import { DragSprite } from './DragSprite';

const FILLS = { living: '#e8c799', kitchen: '#f0ead8', bedroom: '#b7c5a6', bathroom: '#d8d5cf', corridor: '#e8c799' };
interface Props {
  rooms: Room[]; appliances: Appliance[]; canvasWidth: number; canvasHeight: number;
  viewOnly?: boolean; isEditMode?: boolean; selectedApplianceId?: string | null;
  onSelectAppliance?: (app: Appliance) => void; onRoomPress?: (room: Room) => void;
  simulatedDate?: string | null; avatarState?: AvatarState | null; backdropColor?: string;
  furniture?: Furniture[]; selectedRoomId?: string | null;
  onSpotPress?: (room: Room, pos: Placement) => void;
  onMoveItem?: (id: string, furniture: boolean, x: number, y: number) => void;
  onSelectFurniture?: (item: Furniture) => void;
  avatarVariant?: 'boy' | 'girl';
}
function MovingResident({ state, rooms, furniture, width, height, variant }: { state: AvatarState; rooms: Room[]; furniture: Furniture[]; width: number; height: number; variant: 'boy' | 'girl' }) {
  const room = rooms.find(r => r.id === state.roomId) ?? rooms[0];
  const bed = state.pose === 'lie' ? furniture.find(f => f.roomId === room?.id && f.type === 'bed') : undefined;
  const x = state.isAway ? width / 2 : room ? (room.gridCol + (bed?.posX ?? .5) * room.gridColSpan) * width / 4 : width / 2;
  const y = state.isAway ? height - 24 : room ? (room.gridRow + (bed?.posY ?? .5) * room.gridRowSpan) * height / 4 : height / 2;
  const [position] = useState(() => new Animated.ValueXY({ x: x - 22, y: y - 22 }));
  const previousRoom = useRef(state.roomId);
  const [walking, setWalking] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  useEffect(() => {
    const changedRoom = previousRoom.current !== state.roomId;
    previousRoom.current = state.roomId;
    const steps = changedRoom ? [{ x: width / 2 - 22, y: height / 2 - 22 }, { x: x - 22, y: y - 22 }] : [{ x: x - 22, y: y - 22 }];
    const frame = requestAnimationFrame(() => setWalking(!reduced));
    const animation = Animated.sequence(steps.map(toValue => Animated.timing(position, { toValue, duration: reduced ? 0 : 650, useNativeDriver: true })));
    animation.start(({ finished }) => { if (finished) setWalking(false); });
    return () => { cancelAnimationFrame(frame); animation.stop(); };
  }, [x, y, width, height, state.roomId, position, reduced]);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, zIndex: 25, transform: position.getTranslateTransform() }}>
    <ResidentAvatar variant={variant} pose={walking ? 'walk' : bed ? 'lie' : 'stand'} size={44} />
  </Animated.View>;
}
export function FloorPlanCanvas({ rooms, appliances, canvasWidth: w, canvasHeight: h, viewOnly = false, isEditMode = false, selectedApplianceId, onSelectAppliance, onRoomPress, simulatedDate, avatarState, furniture = [], selectedRoomId, onSpotPress, onMoveItem, onSelectFurniture, avatarVariant = 'girl' }: Props) {
  return <View style={{ width: w, height: h, position: 'relative', borderWidth: 2, borderColor: '#80624e', borderRadius: 5, overflow: 'hidden' }}>
    {rooms.map((room, index) => {
      const rw = room.gridColSpan * w / 4, rh = room.gridRowSpan * h / 4;
      return <Pressable key={room.id} accessibilityRole="button" accessibilityLabel={room.name || `Set room ${index + 1} name`} onPress={e => {
        const p = { roomId: room.id, posX: Math.max(.15, Math.min(.85, (Number.isFinite(e.nativeEvent.locationX) ? e.nativeEvent.locationX / rw : .5))), posY: Math.max(.18, Math.min(.82, (Number.isFinite(e.nativeEvent.locationY) ? e.nativeEvent.locationY / rh : .5))) };
        if (onSpotPress) onSpotPress(room, p); else onRoomPress?.(room);
      }} style={{ position: 'absolute', left: room.gridCol * w / 4, top: room.gridRow * h / 4, width: rw, height: rh, backgroundColor: FILLS[room.type] }}>
        <Svg width={rw} height={rh} pointerEvents="none">
          {Array.from({ length: Math.ceil(rh / 16) }, (_, i) => <Line key={i} x1={0} x2={rw} y1={i * 16} y2={i * 16} stroke="#80624e" strokeOpacity={.06} />)}
          <Rect width={rw} height={rh} fill="none" stroke="#80624e" strokeWidth={2} />
          <Line x1={rw * .42} x2={rw * .67} y1={rh} y2={rh} stroke={FILLS[room.type]} strokeWidth={5} />
          <Line x1={rw} x2={rw} y1={rh * .42} y2={rh * .67} stroke={FILLS[room.type]} strokeWidth={5} />
        </Svg>
        {selectedRoomId === room.id && !!room.name && <View pointerEvents="none" style={{ position: 'absolute', top: 8, left: 7, backgroundColor: '#fffdf8', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}><Text style={{ fontSize: 11, color: '#566549' }}>• {room.name}</Text></View>}
      </Pressable>;
    })}
    {[...furniture, ...appliances].map(item => {
      const room = rooms.find(r => r.id === item.roomId);
      if (!room) return null;
      const isFurniture = !('wattage' in item);
      const size = isFurniture ? 60 : 46;
      const on = !isFurniture && isApplianceOn(item as Appliance, avatarState?.activeApplianceIds ?? [], avatarState?.isAway ?? false);
      return <View key={item.id} style={{ position: 'absolute', left: (room.gridCol + item.posX * room.gridColSpan) * w / 4 - size / 2, top: (room.gridRow + item.posY * room.gridRowSpan) * h / 4 - size / 2, zIndex: isFurniture ? 5 : 10, borderRadius: 14, borderWidth: selectedApplianceId === item.id ? 2 : 0, borderColor: '#566549' }}>
        <DragSprite type={'spriteKey' in item && item.spriteKey ? item.spriteKey : item.type} label={item.name} size={size} enabled={isEditMode && !viewOnly} on={on} onPress={() => { if (!viewOnly) { if (isFurniture) onSelectFurniture?.(item as Furniture); else onSelectAppliance?.(item as Appliance); } }} onDrop={(x, y) => onMoveItem?.(item.id, isFurniture, x, y)} />
        {on && <Text pointerEvents="none" style={{ position: 'absolute', bottom: -3, right: -3, color: '#566549', backgroundColor: '#fffbe7', fontSize: 9, borderRadius: 4, paddingHorizontal: 3 }}>ON</Text>}
      </View>;
    })}
    {avatarState && <MovingResident state={avatarState} rooms={rooms} furniture={furniture} width={w} height={h} variant={avatarVariant} />}
    {simulatedDate && <Text pointerEvents="none" style={{ position: 'absolute', top: 4, alignSelf: 'center', backgroundColor: '#fffdf8', padding: 6, borderRadius: 12 }}>{simulatedDate}</Text>}
    {!appliances.length && !furniture.length && <Text pointerEvents="none" style={{ position: 'absolute', bottom: 8, left: 8, right: 8, backgroundColor: '#fffdf8', borderRadius: 20, padding: 8, fontSize: 11, textAlign: 'center', color: '#57534e' }}>{isEditMode ? 'Drag an item from below. Tap a room to name it.' : 'Nothing here yet. Tap Edit to add appliances.'}</Text>}
    {avatarState?.isAway && <Text pointerEvents="none" style={{ position: 'absolute', bottom: 6, left: 8, backgroundColor: '#e0e6d9', borderRadius: 12, padding: 6, fontSize: 11 }}>Away · Always-on appliances stay on</Text>}
  </View>;
}
