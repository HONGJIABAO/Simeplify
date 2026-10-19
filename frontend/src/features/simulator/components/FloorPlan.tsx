import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Hand } from 'lucide-react-native';
import { Room } from './Room';
import { PlacedItem } from './PlacedItem';
import { Avatar } from './Avatar';
import { Sprite } from './Sprite';
import { StoredPlacedItem, StoredRoom } from '../logic/storage';
import { AvatarSimulationState } from '../logic/SimulationEngine';
import { SpriteItemDef } from '../logic/spriteMap';

interface FloorPlanProps {
  rooms: StoredRoom[];
  items: StoredPlacedItem[];
  avatarState: AvatarSimulationState;
  avatarVariant: 'avatar_girl' | 'avatar_boy';
  activeApplianceIds: string[];
  activeRoomLightIds: string[];
  isEditMode: boolean;
  selectedItemId: string | null;
  dragGhost: { item: SpriteItemDef; x: number; y: number } | null;
  hoveredRoomId: string | null;
  onRoomPress: (room: StoredRoom) => void;
  onSelectItem: (item: StoredPlacedItem) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveItemEnd: (itemId: string, newNormX: number, newNormY: number) => void;
  floorPlanRef: React.RefObject<View | null>;
  onLayout: (e: LayoutChangeEvent) => void;
}

export function FloorPlan({
  rooms,
  items,
  avatarState,
  avatarVariant,
  activeApplianceIds,
  activeRoomLightIds,
  isEditMode,
  selectedItemId,
  dragGhost,
  hoveredRoomId,
  onRoomPress,
  onSelectItem,
  onDeleteItem,
  onMoveItemEnd,
  floorPlanRef,
  onLayout,
}: FloorPlanProps) {
  const [containerSize, setContainerSize] = useState({ width: 330, height: 320 });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });
    }
    onLayout(e);
  };

  const appliancesCount = items.filter((i) => i.category === 'Appliances').length;
  const showEmptyPill = appliancesCount === 0;

  // Render rooms with 4-grid layout
  const w = containerSize.width;
  const h = containerSize.height;

  // Gap for central hallway
  const halfW = (w - 14) / 2;
  const halfH = (h - 14) / 2;
  const hallwayThickness = 14;

  const roomLayouts: Record<string, { left: number; top: number; width: number; height: number }> = {
    living: { left: 0, top: 0, width: halfW, height: halfH },
    kitchen: { left: halfW + hallwayThickness, top: 0, width: halfW, height: halfH },
    bedroom: { left: 0, top: halfH + hallwayThickness, width: halfW, height: halfH },
    bathroom: { left: halfW + hallwayThickness, top: halfH + hallwayThickness, width: halfW, height: halfH },
  };

  return (
    <View style={styles.cardContainer}>
      <View
        ref={floorPlanRef as any}
        collapsable={false}
        onLayout={handleLayout}
        style={[styles.floorCanvas, { width: '100%', height: 330 }]}
      >
        {/* Hallway background fill */}
        <View style={[styles.hallwayBg, { width: w, height: h }]} />

        {/* 4 Rooms */}
        {rooms.map((room) => {
          const layout = roomLayouts[room.type] || roomLayouts.living;
          const isLightOn = activeRoomLightIds.includes(room.id);
          const isHovered = hoveredRoomId === room.id;

          return (
            <Room
              key={room.id}
              room={room}
              width={layout.width}
              height={layout.height}
              left={layout.left}
              top={layout.top}
              isLightOn={isLightOn}
              isHovered={isHovered}
              onPress={onRoomPress}
            />
          );
        })}

        {/* Placed Items (Furniture & Appliances) */}
        {items.map((item) => {
          const isOn =
            item.category === 'Appliances' &&
            (activeApplianceIds.includes(item.id) || item.alwaysOn || item.isOn);
          const isSelected = selectedItemId === item.id;

          return (
            <PlacedItem
              key={item.id}
              item={item}
              canvasWidth={w}
              canvasHeight={h}
              isEditMode={isEditMode}
              isSelected={isSelected}
              isOn={!!isOn}
              onSelect={onSelectItem}
              onDelete={onDeleteItem}
              onMoveEnd={onMoveItemEnd}
            />
          );
        })}

        {/* Resident Avatar */}
        <Avatar
          variant={avatarVariant}
          normX={avatarState.currentX}
          normY={avatarState.currentY}
          canvasWidth={w}
          canvasHeight={h}
          facingLeft={avatarState.facingLeft}
          isWalking={avatarState.isWalking}
          isSleeping={avatarState.isSleeping}
          size={46}
        />

        {/* Empty State Pill at bottom */}
        {showEmptyPill && (
          <View pointerEvents="none" style={styles.emptyPill}>
            <Hand size={14} color="#78716C" strokeWidth={1.5} />
            <Text style={styles.emptyPillText}>
              {isEditMode
                ? 'Nothing here yet. Drag an appliance from below.'
                : 'Nothing here yet. Press edit to add appliances.'}
            </Text>
          </View>
        )}

        {/* Drag Ghost following pointer */}
        {dragGhost && (
          <View
            pointerEvents="none"
            style={[
              styles.dragGhost,
              {
                left: dragGhost.x - 26,
                top: dragGhost.y - 26,
              },
            ]}
          >
            <Sprite type={dragGhost.item.key} size={52} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 12,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    marginBottom: 12,
  },
  floorCanvas: {
    position: 'relative',
    borderWidth: 3,
    borderColor: '#80624E',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E8C8A2',
  },
  hallwayBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#E8C8A2',
  },
  emptyPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 60,
  },
  emptyPillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
  },
  dragGhost: {
    position: 'absolute',
    width: 52,
    height: 52,
    opacity: 0.85,
    zIndex: 100,
  },
});
