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
  Snowflake,
  Tv,
  Fan,
  Lightbulb,
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

interface EditBlockSheetProps {
  visible: boolean;
  onClose: () => void;
  block: RoutineBlock | null;
  rooms?: StoredRoom[];
  appliances?: any[];
  existingBlocks?: RoutineBlock[];
  onUpdateBlock: (updated: RoutineBlock) => void;
  onRemoveBlock: (id: string) => void;
}

const ROOM_OPTIONS = [
  { id: 'living', label: 'Living room', icon: <Armchair size={16} color="#57534E" strokeWidth={1.5} /> },
  { id: 'kitchen', label: 'Kitchen', icon: <Utensils size={16} color="#57534E" strokeWidth={1.5} /> },
  { id: 'bedroom', label: 'Bedroom 1', icon: <Bed size={16} color="#57534E" strokeWidth={1.5} /> },
  { id: 'bedroom_2', label: 'Bedroom 2', icon: <Bed size={16} color="#57534E" strokeWidth={1.5} /> },
  { id: 'bathroom', label: 'Bathroom', icon: <ShowerHead size={16} color="#57534E" strokeWidth={1.5} /> },
  { id: 'away', label: 'Away', icon: <Lock size={16} color="#57534E" strokeWidth={1.5} /> },
];

function EditBlockInner({
  block,
  rooms = [],
  existingBlocks = [],
  onUpdateBlock,
  onRemoveBlock,
  onClose,
}: {
  block: RoutineBlock;
  rooms?: StoredRoom[];
  existingBlocks?: RoutineBlock[];
  onUpdateBlock: (updated: RoutineBlock) => void;
  onRemoveBlock: (id: string) => void;
  onClose: () => void;
}) {
  const [startTime, setStartTime] = useState(block.startTime || '20:00');
  const [endTime, setEndTime] = useState(block.endTime || '23:00');
  const [selectedRoom, setSelectedRoom] = useState(block.roomId || 'living');

  // Appliance states
  const [acOn, setAcOn] = useState(true);
  const [tvOn, setTvOn] = useState(true);
  const [fanOn, setFanOn] = useState(true);
  const [lightOn, setLightOn] = useState(true);

  // Steppers & Controls
  const [temperature, setTemperature] = useState(block.temperature ?? 23);
  const [timerHours, setTimerHours] = useState(block.timerHours ?? 1);
  const [fanSpeed, setFanSpeed] = useState<'Low' | 'Med' | 'High'>(block.fanSpeed ?? 'Med');

  const isSleepBlock = block.iconType === 'sleep';

  const getRoomLabel = () => {
    const found = ROOM_OPTIONS.find((r) => r.id === selectedRoom);
    if (found) return found.label;
    return selectedRoom.charAt(0).toUpperCase() + selectedRoom.slice(1);
  };

  const activeCount = Number(acOn) + Number(tvOn) + Number(fanOn) + Number(lightOn);

  const handleApply = () => {
    onUpdateBlock({
      ...block,
      startTime,
      endTime,
      roomId: selectedRoom,
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
          {ROOM_OPTIONS.map((rm) => {
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
                  {rm.icon}
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
          <Text style={styles.sectionLabel}>ROOM APPLIANCES IN USE</Text>
          <Text style={styles.appliancesCountText}>
            {activeCount} Active · {4 - activeCount} Standby
          </Text>
        </View>

        {/* 1. AC Card with Steppers */}
        <View style={styles.applianceDetailCard}>
          <View style={styles.applianceDetailTop}>
            <View style={styles.applianceDetailLeft}>
              <View style={[styles.applianceIconBox, { backgroundColor: '#E0E8D7' }]}>
                <Snowflake size={18} color="#4A633F" strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.applianceTitle}>Living Room Inverter AC</Text>
                <Text style={styles.applianceSubtitle}>Eco Inverter Mode · ~0.80 kWh</Text>
              </View>
            </View>
            <Switch value={acOn} onValueChange={setAcOn} />
          </View>

          {acOn && (
            <View style={styles.stepperSubSection}>
              {/* Temperature Stepper */}
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Temperature</Text>
                <View style={styles.stepperPill}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setTemperature((t) => Math.max(16, t - 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease temperature"
                  >
                    <Minus size={15} color="#292524" strokeWidth={1.8} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{temperature}°C</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setTemperature((t) => Math.min(30, t + 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Increase temperature"
                  >
                    <Plus size={15} color="#292524" strokeWidth={1.8} />
                  </Pressable>
                </View>
              </View>

              {/* Timer Stepper */}
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Timer</Text>
                <View style={styles.stepperPill}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setTimerHours((h) => Math.max(0, h - 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease timer"
                  >
                    <Minus size={15} color="#292524" strokeWidth={1.8} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{timerHours}h</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setTimerHours((h) => Math.min(12, h + 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Increase timer"
                  >
                    <Plus size={15} color="#292524" strokeWidth={1.8} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 2. TV Card */}
        <View style={styles.applianceDetailCard}>
          <View style={styles.applianceDetailTop}>
            <View style={styles.applianceDetailLeft}>
              <View style={[styles.applianceIconBox, { backgroundColor: '#F5EBE1' }]}>
                <Tv size={18} color="#8C6541" strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.applianceTitle}>4K TV & Soundbar System</Text>
                <Text style={styles.applianceSubtitle}>Cinema Preset · ~0.15 kWh</Text>
              </View>
            </View>
            <Switch value={tvOn} onValueChange={setTvOn} />
          </View>
        </View>

        {/* 3. Ceiling Fan Card with Speed Controls */}
        <View style={styles.applianceDetailCard}>
          <View style={styles.applianceDetailTop}>
            <View style={styles.applianceDetailLeft}>
              <View style={[styles.applianceIconBox, { backgroundColor: '#E0E8D7' }]}>
                <Fan size={18} color="#4A633F" strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.applianceTitle}>Ceiling Fan</Text>
                <Text style={styles.applianceSubtitle}>Circulation · ~0.04 kWh</Text>
              </View>
            </View>
            <Switch value={fanOn} onValueChange={setFanOn} />
          </View>

          {fanOn && (
            <View style={styles.fanSpeedRow}>
              <Text style={styles.stepperLabel}>Fan Speed</Text>
              <View style={styles.fanSpeedSegmented}>
                {(['Low', 'Med', 'High'] as const).map((speed) => {
                  const isCurrent = fanSpeed === speed;
                  return (
                    <Pressable
                      key={speed}
                      style={[
                        styles.fanSpeedBtn,
                        isCurrent && styles.fanSpeedBtnActive,
                      ]}
                      onPress={() => setFanSpeed(speed)}
                      accessibilityRole="button"
                      accessibilityLabel={`Set fan speed ${speed}`}
                    >
                      <Text
                        style={[
                          styles.fanSpeedText,
                          isCurrent && styles.fanSpeedTextActive,
                        ]}
                      >
                        {speed}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* 4. Ambient Light Card */}
        <View style={styles.applianceDetailCard}>
          <View style={styles.applianceDetailTop}>
            <View style={styles.applianceDetailLeft}>
              <View style={[styles.applianceIconBox, { backgroundColor: '#FCEEE5' }]}>
                <Lightbulb size={18} color="#D97706" strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.applianceTitle}>Ambient Warm Accent Light</Text>
                <Text style={styles.applianceSubtitle}>
                  Warm LED Strip (40% dim) · ~0.01 kWh
                </Text>
              </View>
            </View>
            <Switch value={lightOn} onValueChange={setLightOn} />
          </View>
        </View>
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
  existingBlocks = [],
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
        existingBlocks={existingBlocks}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
