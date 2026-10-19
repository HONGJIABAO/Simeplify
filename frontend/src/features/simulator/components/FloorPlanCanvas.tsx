/**
 * SIM-05, SIM-06
 * Flat top-down floor plan drawn with react-native-svg, featuring Resident Avatar and Home Looks.
 * Source: docs/page_refined.md S4.3, docs/design.md Unit 12 §3a & §3b.
 *
 * Rules:
 * - Avatar walks to the room of the active block, pose matches activity.
 * - Away time: avatar walks to front door, soft energy-saving overlay, "Energy saving" pill.
 * - Appliances in active block light up with an active indicator dot.
 * - Backdrop color adjusts with the time of day.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, {
  Rect,
  G,
  Circle,
} from 'react-native-svg';
import { Hand, Leaf, Clock } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { Room, Appliance } from '@/lib/mockData';
import { ResidentAvatar } from './ResidentAvatar';
import { AvatarState } from '../logic/avatarPlace';

// Room surface colors from design.md Unit 12 §3b and theme.ts
const ROOM_FILLS: Record<Room['type'], string> = {
  living: '#E6C08E',   // warm wood planks
  kitchen: '#EFEAD8',  // cream tile
  bedroom: '#B6C4A6',  // sage carpet
  bathroom: '#D6D3CD', // warm grey
  corridor: '#E6C08E', // wood
};

// Room dot colors (accent dots in the label pill)
const ROOM_DOTS: Record<Room['type'], string> = {
  living: '#d4a373',   // tan-400
  kitchen: '#8b9d77',  // sage-400
  bedroom: '#8b9d77',  // sage-400
  bathroom: '#a8a29e', // stone-400
  corridor: '#d4a373',
};

const GRID_COLS = 4;
const GRID_ROWS = 4;
const WALL_THICKNESS = 3;
const WALL_COLOR = '#5c4033'; // brown

interface FloorPlanCanvasProps {
  rooms: Room[];
  appliances: Appliance[];
  /** Width of the available canvas area in px */
  canvasWidth: number;
  /** Height of the available canvas area in px */
  canvasHeight: number;
  /** View-only mode (Stage 6) */
  viewOnly?: boolean;
  /** Edit mode (Stage 7) */
  isEditMode?: boolean;
  /** Currently selected appliance ID */
  selectedApplianceId?: string | null;
  /** Called when user taps an appliance */
  onSelectAppliance?: (appliance: Appliance) => void;
  /** Called when user taps a room in edit mode to place an appliance */
  onRoomPress?: (room: Room) => void;
  /** Date string for fast-forward animation pill */
  simulatedDate?: string | null;
  /** Avatar state (pose, position, home look) */
  avatarState?: AvatarState | null;
  /** Dynamic backdrop color based on time of day */
  backdropColor?: string;
}

export function FloorPlanCanvas({
  rooms,
  appliances,
  canvasWidth,
  canvasHeight,
  viewOnly = false,
  isEditMode = false,
  selectedApplianceId,
  onSelectAppliance,
  onRoomPress,
  simulatedDate,
  avatarState,
  backdropColor = '#faf6f1',
}: FloorPlanCanvasProps) {
  const CELL_W = canvasWidth / GRID_COLS;
  const CELL_H = canvasHeight / GRID_ROWS;

  const isAway = avatarState?.isAway ?? false;
  const activeApplianceIds = avatarState?.activeApplianceIds ?? [];

  return (
    <View style={[styles.wrapper, { backgroundColor: backdropColor }]}>
      {/* SVG floor plan */}
      <Svg width={canvasWidth} height={canvasHeight}>
        {rooms.map((room) => {
          const x = room.gridCol * CELL_W;
          const y = room.gridRow * CELL_H;
          const w = room.gridColSpan * CELL_W;
          const h = room.gridRowSpan * CELL_H;

          // Appliances in this room
          const roomApps = appliances.filter((a) => a.roomId === room.id);

          return (
            <G key={room.id}>
              {/* Room fill */}
              <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={ROOM_FILLS[room.type]}
                stroke={WALL_COLOR}
                strokeWidth={WALL_THICKNESS}
                onPress={() => {
                  if (isEditMode) onRoomPress?.(room);
                }}
              />

              {/* Appliance icons (as colored circles) */}
              {roomApps.map((app) => {
                const appX = x + app.posX * w;
                const appY = y + app.posY * h;
                const isSelected = selectedApplianceId === app.id;
                const isActive = activeApplianceIds.includes(app.id);

                return (
                  <G
                    key={app.id}
                    onPress={() => {
                      if (!viewOnly) onSelectAppliance?.(app);
                    }}
                  >
                    {/* Active appliance indicator ring */}
                    {isActive && !isAway && (
                      <Circle
                        cx={appX}
                        cy={appY}
                        r={20}
                        fill="none"
                        stroke="#8b9d77" // sage-400
                        strokeWidth={1.5}
                        strokeDasharray="4,2"
                      />
                    )}

                    {/* Selection ring if active */}
                    {isSelected && (
                      <Circle
                        cx={appX}
                        cy={appY}
                        r={18}
                        fill="none"
                        stroke="#8b9d77" // sage-400
                        strokeWidth={2.5}
                      />
                    )}

                    {/* Soft circle tile */}
                    <Circle
                      cx={appX}
                      cy={appY}
                      r={14}
                      fill={app.color}
                      opacity={isSelected ? 0.75 : 0.45}
                    />

                    {/* Center anchor dot */}
                    <Circle
                      cx={appX}
                      cy={appY}
                      r={4}
                      fill="#292524" // stone-800
                    />

                    {/* Small active dot when appliance is on */}
                    {isActive && !isAway && (
                      <Circle
                        cx={appX + 8}
                        cy={appY - 8}
                        r={3}
                        fill="#566549" // sage-600
                      />
                    )}
                  </G>
                );
              })}
            </G>
          );
        })}

        {/* Outer boundary */}
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fill="none"
          stroke={WALL_COLOR}
          strokeWidth={WALL_THICKNESS}
        />
      </Svg>

      {/* Energy saving overlay when nobody is home (Unit 12 §3b) */}
      {isAway && (
        <View style={styles.energySavingOverlay} pointerEvents="none" />
      )}

      {/* Room label pills — overlaid as React Native Views for crisp text */}
      {rooms.map((room) => {
        const x = room.gridCol * CELL_W;
        const y = room.gridRow * CELL_H;

        return (
          <View
            key={`label-${room.id}`}
            pointerEvents="none"
            style={[
              styles.labelPill,
              {
                left: x + 8,
                top: y + 8,
              },
            ]}
          >
            <View
              style={[
                styles.labelDot,
                { backgroundColor: ROOM_DOTS[room.type] },
              ]}
            />
            <Text style={styles.labelText}>{room.name}</Text>
          </View>
        );
      })}

      {/* Resident Avatar (SIM-06) */}
      {avatarState && (
        <View
          style={[
            styles.avatarWrapper,
            {
              left: Math.max(10, Math.min(canvasWidth - 40, avatarState.normalizedPos.x * canvasWidth - 14)),
              top: Math.max(10, Math.min(canvasHeight - 45, avatarState.normalizedPos.y * canvasHeight - 18)),
            },
          ]}
          pointerEvents="none"
        >
          <ResidentAvatar pose={avatarState.pose} size={36} />
        </View>
      )}

      {/* Away status pills near front door (Unit 12 §3a & §3b) */}
      {isAway && (
        <View style={styles.awayPillsContainer} pointerEvents="none">
          <View style={styles.outPill}>
            <Clock size={12} color="#57534e" strokeWidth={1.5} />
            <Text style={styles.outPillText}>Out • back at 17:30</Text>
          </View>
          <View style={styles.energySavingPill}>
            <Leaf size={12} color="#566549" strokeWidth={1.5} />
            <Text style={styles.energySavingText}>Energy saving</Text>
          </View>
        </View>
      )}

      {/* Fast-forward date pill at top center (Lora 14, cream) */}
      {simulatedDate && (
        <View style={styles.datePill} pointerEvents="none">
          <Text style={styles.datePillText}>{simulatedDate}</Text>
        </View>
      )}

      {/* Empty-state pill — shows when no appliances */}
      {appliances.length === 0 && (
        <View style={styles.emptyPill} pointerEvents="none">
          <Hand size={16} color={colors['stone-600']} strokeWidth={1.5} />
          <Text style={styles.emptyPillText}>
            {isEditMode
              ? 'Nothing here yet. Drag an appliance from below.'
              : 'Nothing here yet. Tap Edit to add appliances.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
  },
  labelPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#292524',
  },
  avatarWrapper: {
    position: 'absolute',
    zIndex: 10,
  },
  energySavingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(245, 245, 244, 0.45)', // stone-100 at 45%
    zIndex: 2,
  },
  awayPillsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 12,
  },
  outPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f6e8d8', // tan-100
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  outPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#57534e',
  },
  energySavingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0e6d9', // sage-100
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  energySavingText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#566549',
  },
  datePill: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: '#faf6f1', // cream
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 20,
  },
  datePillText: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  emptyPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 15,
  },
  emptyPillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    flex: 1,
  },
});
