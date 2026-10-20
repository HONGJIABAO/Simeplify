/**
 * SIM-07
 * Bottom sheet for editing an existing routine block in My Day.
 * Matches docs/screenshot/simulator/simulator_edit_routine.png
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Clock,
  Armchair,
  Utensils,
  Bed,
  ShowerHead,
  Lock,
  Minus,
  Plus,
  TrendingDown,
  Trash2,
} from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Switch } from '@/components/Switch';
import { StoredRoom } from '../logic/storage';
import { RoutineBlock } from '../logic/myDayLogic';
import { Appliance } from '@/lib/mockData';
import { Sprite } from './Sprite';

interface EditBlockSheetProps {
  visible: boolean;
  onClose: () => void;
  block: RoutineBlock | null;
  rooms?: StoredRoom[];
  appliances?: Appliance[];
  existingBlocks?: RoutineBlock[];
  onUpdateBlock: (updated: RoutineBlock) => void;
  onRemoveBlock: (id: string) => void;
}

function roomIcon(type: StoredRoom['type'] | 'away') {
  const props = { size: 16, color: '#57534E', strokeWidth: 1.5 };
  if (type === 'kitchen') return <Utensils {...props} />;
  if (type === 'bedroom') return <Bed {...props} />;
  if (type === 'bathroom') return <ShowerHead {...props} />;
  if (type === 'away') return <Lock {...props} />;
  return <Armchair {...props} />;
}

function EditBlockInner({
  block,
  rooms = [],
  appliances = [],
  onUpdateBlock,
  onRemoveBlock,
  onClose,
}: {
  block: RoutineBlock;
  rooms?: StoredRoom[];
  appliances?: Appliance[];
  onUpdateBlock: (updated: RoutineBlock) => void;
  onRemoveBlock: (id: string) => void;
  onClose: () => void;
}) {
  const [startTime, setStartTime] = useState(block.startTime || '20:00');
  const [endTime, setEndTime] = useState(block.endTime || '23:00');
  const [selectedRoom, setSelectedRoom] = useState(block.roomId || 'living');

  const [applianceSwitches, setApplianceSwitches] = useState<Record<string, boolean>>(
    () => Object.fromEntries(appliances.map((appliance) => [
      appliance.id,
      block.applianceIds.includes(appliance.id),
    ]))
  );

  // Steppers & Controls
  const [temperature, setTemperature] = useState(block.temperature ?? 23);
  const [timerHours, setTimerHours] = useState(block.timerHours ?? 1);
  const [fanSpeed, setFanSpeed] = useState<'Low' | 'Med' | 'High'>(block.fanSpeed ?? 'Med');

  const isSleepBlock = block.iconType === 'sleep';

  const roomOptions = [
    ...rooms.map((room) => ({
      id: room.id,
      type: room.type,
      label: room.name?.trim() || `${room.type.charAt(0).toUpperCase()}${room.type.slice(1)}`,
    })),
    { id: 'away', type: 'away' as const, label: 'Away' },
  ];

  const availableAppliances = appliances;

  const getRoomLabel = () => {
    const found = roomOptions.find((r) => r.id === selectedRoom);
    if (found) return found.label;
    return selectedRoom.charAt(0).toUpperCase() + selectedRoom.slice(1);
  };

  const activeCount = availableAppliances.filter((appliance) => applianceSwitches[appliance.id]).length;

  const handleApply = () => {
    onUpdateBlock({
      ...block,
      startTime,
      endTime,
      roomId: selectedRoom,
      applianceIds: availableAppliances
        .filter((appliance) => applianceSwitches[appliance.id])
        .map((appliance) => appliance.id),
      temperature,
      timerHours,
      fanSpeed,
    });
    onClose();
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* ── Routine Summary Card ── */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summarySub}>ROUTINE NAME</Text>
          <Text style={styles.summaryTitle}>{block.name}</Text>
        </View>
        <View style={styles.roomBadge}>
          <Text style={styles.roomBadgeText}>{getRoomLabel()}</Text>
        </View>
      </View>

      {/* ── When? Time Cards ── */}
      <View style={styles.timeCardsRow}>
        <Pressable
          style={styles.timeCard}
          onPress={() => setStartTime(startTime === '20:00' ? '19:00' : '20:00')}
          accessibilityRole="button"
          accessibilityLabel={`Starts at ${startTime}`}
        >
          <Text style={styles.timeCardLabel}>STARTS</Text>
          <View style={styles.timeCardValueRow}>
            <Clock size={16} color="#292524" strokeWidth={1.5} />
            <Text style={styles.timeCardValue}>{startTime}</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.timeCard}
          onPress={() => setEndTime(endTime === '23:00' ? '22:00' : '23:00')}
          accessibilityRole="button"
          accessibilityLabel={`Ends at ${endTime}`}
        >
          <Text style={styles.timeCardLabel}>ENDS</Text>
          <View style={styles.timeCardValueRow}>
            <Clock size={16} color="#292524" strokeWidth={1.5} />
            <Text style={styles.timeCardValue}>{endTime}</Text>
          </View>
        </Pressable>
      </View>

      {/* ── Where? Room Grid (2 columns matching screenshot) ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Where?</Text>
        <View style={styles.roomGrid}>
          {roomOptions.map((rm) => {
            const isSelected = selectedRoom === rm.id;
            return (
              <Pressable
                key={rm.id}
                style={[styles.roomGridBtn, isSelected && styles.roomGridBtnActive]}
                onPress={() => setSelectedRoom(rm.id)}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${rm.label}`}
              >
                <View style={styles.roomBtnLeft}>
                  {roomIcon(rm.type)}
                  <Text
                    style={[
                      styles.roomGridText,
                      isSelected && styles.roomGridTextActive,
                    ]}
                  >
                    {rm.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Room Appliances In Use ── */}
      <View style={styles.section}>
        <View style={styles.appliancesHeaderRow}>
          <Text style={styles.sectionLabel}>APPLIANCES FOR THIS BLOCK</Text>
          <Text style={styles.appliancesCountText}>
            {activeCount} Active · {availableAppliances.length - activeCount} Standby
          </Text>
        </View>

        {availableAppliances.length === 0 ? (
          <View style={styles.emptyAppliancesCard}>
            <Text style={styles.emptyAppliancesText}>No appliances in this room yet.</Text>
          </View>
        ) : availableAppliances.map((appliance) => {
          const isActive = Boolean(applianceSwitches[appliance.id]);
          const isAirConditioner = appliance.type === 'air_conditioner';
          const isFan = appliance.type === 'fan';
          const applianceRoom = rooms.find((room) => room.id === appliance.roomId);

          return (
            <View key={appliance.id} style={styles.applianceDetailCard}>
              <View style={styles.applianceDetailTop}>
                <View style={styles.applianceDetailLeft}>
                  <View style={styles.applianceIconBox}>
                    <Sprite type={appliance.spriteKey || appliance.type} size={34} />
                  </View>
                  <View style={styles.applianceTextGroup}>
                    <Text style={styles.applianceTitle} numberOfLines={1}>{appliance.name}</Text>
                    <Text style={styles.applianceSubtitle}>
                      {appliance.wattage} W · {applianceRoom?.name || applianceRoom?.type || 'Room'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={(value) => setApplianceSwitches((current) => ({
                    ...current,
                    [appliance.id]: value,
                  }))}
                />
              </View>

              {isAirConditioner && isActive && (
                <View style={styles.stepperSubSection}>
                  <View style={styles.stepperRow}>
                    <Text style={styles.stepperLabel}>Temperature</Text>
                    <View style={styles.stepperPill}>
                      <Pressable style={styles.stepperBtn} onPress={() => setTemperature((value) => Math.max(16, value - 1))} accessibilityRole="button" accessibilityLabel="Decrease temperature">
                        <Minus size={15} color="#292524" strokeWidth={1.8} />
                      </Pressable>
                      <Text style={styles.stepperValue}>{temperature}°C</Text>
                      <Pressable style={styles.stepperBtn} onPress={() => setTemperature((value) => Math.min(30, value + 1))} accessibilityRole="button" accessibilityLabel="Increase temperature">
                        <Plus size={15} color="#292524" strokeWidth={1.8} />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.stepperRow}>
                    <Text style={styles.stepperLabel}>Running time</Text>
                    <View style={styles.stepperPill}>
                      <Pressable style={styles.stepperBtn} onPress={() => setTimerHours((value) => Math.max(1, value - 1))} accessibilityRole="button" accessibilityLabel="Decrease air conditioner running time">
                        <Minus size={15} color="#292524" strokeWidth={1.8} />
                      </Pressable>
                      <Text style={styles.stepperValue}>{timerHours}h</Text>
                      <Pressable style={styles.stepperBtn} onPress={() => setTimerHours((value) => Math.min(24, value + 1))} accessibilityRole="button" accessibilityLabel="Increase air conditioner running time">
                        <Plus size={15} color="#292524" strokeWidth={1.8} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              {isFan && isActive && (
                <View style={styles.fanSpeedRow}>
                  <Text style={styles.stepperLabel}>Fan Speed</Text>
                  <View style={styles.fanSpeedSegmented}>
                    {(['Low', 'Med', 'High'] as const).map((speed) => {
                      const isCurrent = fanSpeed === speed;
                      return (
                        <Pressable key={speed} style={[styles.fanSpeedBtn, isCurrent && styles.fanSpeedBtnActive]} onPress={() => setFanSpeed(speed)} accessibilityRole="button" accessibilityLabel={`Set fan speed ${speed}`}>
                          <Text style={[styles.fanSpeedText, isCurrent && styles.fanSpeedTextActive]}>{speed === 'Med' ? 'Medium' : speed}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* ── Est. Cost Card ── */}
      <View style={styles.estCostCard}>
        <View>
          <Text style={styles.estCostLabel}>Est. cost</Text>
          <Text style={styles.estCostValue}>RM 1.45</Text>
        </View>
        <View style={styles.savingPill}>
          <TrendingDown size={14} color="#4A633F" strokeWidth={1.8} />
          <Text style={styles.savingPillText}>~ RM 0.35 less than standard</Text>
        </View>
      </View>

      {/* ── Footer Actions ── */}
      <View style={styles.actions}>
        <Button
          variant="secondary"
          onPress={onClose}
          style={styles.cancelBtn}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={handleApply}
          style={styles.applyBtn}
        >
          Apply changes
        </Button>
      </View>

      {/* ── Remove Time Block Button (Not for Sleep) ── */}
      {!isSleepBlock && (
        <Pressable
          style={styles.removeBtn}
          onPress={() => {
            onRemoveBlock(block.id);
            onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel="Remove time block"
        >
          <Trash2 size={16} color="#DC2626" strokeWidth={1.5} />
          <Text style={styles.removeBtnText}>Remove time block</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

export function EditBlockSheet({
  visible,
  onClose,
  block,
  rooms = [],
  appliances = [],
  onUpdateBlock,
  onRemoveBlock,
}: EditBlockSheetProps) {
  if (!block) return null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit Block"
      height="88%"
    >
      <EditBlockInner
        block={block}
        rooms={rooms}
        appliances={appliances}
        onUpdateBlock={onUpdateBlock}
        onRemoveBlock={onRemoveBlock}
        onClose={onClose}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  summaryLeft: {
    gap: 3,
  },
  summarySub: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: '#78716C',
  },
  summaryTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  roomBadge: {
    backgroundColor: '#EAE5D9',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  roomBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    color: '#57534E',
  },
  timeCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    gap: 6,
  },
  timeCardLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#78716C',
  },
  timeCardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeCardValue: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 22,
    color: '#292524',
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    letterSpacing: 0.6,
    color: '#78716C',
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roomGridBtn: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  roomGridBtnActive: {
    backgroundColor: '#DCE6D5',
    borderColor: '#8B9D77',
  },
  roomBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roomGridText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13.5,
    color: '#57534E',
  },
  roomGridTextActive: {
    color: '#292524',
  },
  appliancesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliancesCountText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#78716C',
  },
  applianceDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 14,
    gap: 12,
  },
  applianceDetailTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applianceDetailLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  applianceTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  applianceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applianceTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  applianceSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
  emptyAppliancesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 18,
  },
  emptyAppliancesText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
  },
  stepperSubSection: {
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stepperLabel: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 13,
    color: '#57534E',
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    gap: 8,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
    minWidth: 32,
    textAlign: 'center',
  },
  fanSpeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
  },
  fanSpeedSegmented: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F4',
    borderRadius: 9999,
    padding: 2,
    gap: 2,
  },
  fanSpeedBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  fanSpeedBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fanSpeedText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#78716C',
  },
  fanSpeedTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  estCostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  estCostLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
  },
  estCostValue: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    color: '#292524',
    marginTop: 2,
  },
  savingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E0E8D7',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  savingPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#4A633F',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  applyBtn: {
    flex: 1,
    borderRadius: 9999,
    backgroundColor: '#566549',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  removeBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13.5,
    color: '#DC2626',
  },
});
