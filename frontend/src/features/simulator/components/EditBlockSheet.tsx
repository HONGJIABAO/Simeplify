/**
 * SIM-07
 * Bottom sheet for editing an existing routine block in My Day.
 * Source: docs/screenshot/simulator/simulator_edit_routine.png,
 *         docs/page_refined.md S4.6.
 *
 * Rules:
 * - Summary row: routine name + room badge.
 * - Starts / Ends cards and room grid.
 * - Room appliances in use with on/off switches.
 * - Shower block: "Minutes per shower" stepper (5–30 min).
 * - Flags: ENABLE_EDIT_BLOCK_EXTRA_CONTROLS = false (no temp, timer, fan speed, or cost preview).
 * - Remove button: not allowed for Sleep block.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Switch } from '@/components/Switch';
import { Stepper } from '@/components/Stepper';
import { RoutineBlock } from '../logic/myDayLogic';
import { MOCK_APPLIANCES } from '@/lib/mockData';

interface EditBlockSheetProps {
  visible: boolean;
  onClose: () => void;
  block: RoutineBlock | null;
  onUpdateBlock: (updated: RoutineBlock) => void;
  onRemoveBlock: (id: string) => void;
}

const ROOM_OPTIONS = [
  { id: 'living', label: 'Living room' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bedroom', label: 'Bedroom 1' },
  { id: 'bedroom2', label: 'Bedroom 2' },
  { id: 'bathroom', label: 'Bathroom' },
];

function EditBlockForm({
  block,
  onUpdateBlock,
  onRemoveBlock,
  onClose,
}: {
  block: RoutineBlock;
  onUpdateBlock: (updated: RoutineBlock) => void;
  onRemoveBlock: (id: string) => void;
  onClose: () => void;
}) {
  const [startTime] = useState(block.startTime);
  const [endTime] = useState(block.endTime);
  const [selectedRoom, setSelectedRoom] = useState(block.roomId);
  const [minutesPerShower, setMinutesPerShower] = useState(block.minutesPerShower ?? 10);
  const [applianceSwitches, setApplianceSwitches] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const a of MOCK_APPLIANCES) {
      map[a.id] = block.applianceIds.includes(a.id);
    }
    return map;
  });

  const handleToggleAppliance = (id: string) => {
    setApplianceSwitches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApply = () => {
    onUpdateBlock({
      ...block,
      startTime,
      endTime,
      roomId: selectedRoom,
      minutesPerShower: block.iconType === 'shower' ? minutesPerShower : undefined,
      applianceIds: Object.keys(applianceSwitches).filter((id) => applianceSwitches[id]),
    });
    onClose();
  };

  const isSleepBlock = block.iconType === 'sleep';

  return (
    <ScrollView contentContainerStyle={styles.container}>
        {/* Routine Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summarySub}>ROUTINE NAME</Text>
            <Text style={styles.summaryTitle}>{block.name}</Text>
          </View>
          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeText}>{selectedRoom}</Text>
          </View>
        </View>

        {/* Time cards */}
        <View style={styles.timeCardsRow}>
          <View style={styles.timeCard}>
            <Text style={styles.timeCardLabel}>STARTS</Text>
            <Text style={styles.timeCardVal}>{startTime}</Text>
          </View>
          <View style={styles.timeCard}>
            <Text style={styles.timeCardLabel}>ENDS</Text>
            <Text style={styles.timeCardVal}>{endTime}</Text>
          </View>
        </View>

        {/* Where? Room grid */}
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
                >
                  <Text style={[styles.roomGridText, isSelected && styles.roomGridTextActive]}>
                    {isSelected ? `✓ ${rm.label}` : rm.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Shower duration stepper (only for shower block) */}
        {block.iconType === 'shower' && (
          <View style={styles.showerStepperCard}>
            <Text style={styles.sectionLabel}>Minutes per shower</Text>
            <Stepper
              value={minutesPerShower}
              min={5}
              max={30}
              step={5}
              onChange={setMinutesPerShower}
            />
          </View>
        )}

        {/* Room Appliances in Use */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Room appliances in use</Text>
          <View style={styles.applianceCardList}>
            {MOCK_APPLIANCES.map((app) => (
              <View key={app.id} style={styles.applianceSwitchRow}>
                <View style={styles.applianceInfo}>
                  <Text style={styles.applianceName}>{app.name}</Text>
                  <Text style={styles.applianceWatts}>
                    {app.wattage} W • {app.roomId}
                  </Text>
                </View>
                <Switch
                  value={Boolean(applianceSwitches[app.id])}
                  onValueChange={() => handleToggleAppliance(app.id)}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <View style={styles.mainButtonsRow}>
            <Button
              variant="secondary"
              onPress={onClose}
              style={styles.actionBtn}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              onPress={handleApply}
              style={styles.actionBtn}
            >
              Apply changes
            </Button>
          </View>

          {/* Remove time block button (not allowed for Sleep) */}
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
              <Trash2 size={16} color="#a8442f" strokeWidth={1.5} />
              <Text style={styles.removeBtnText}>Remove time block</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
  );
}

export function EditBlockSheet({
  visible,
  onClose,
  block,
  onUpdateBlock,
  onRemoveBlock,
}: EditBlockSheetProps) {
  return (
    <BottomSheet
      visible={visible && !!block}
      onClose={onClose}
      title="Edit Block"
      height="88%"
    >
      {block ? (
        <EditBlockForm
          key={block.id}
          block={block}
          onUpdateBlock={onUpdateBlock}
          onRemoveBlock={onRemoveBlock}
          onClose={onClose}
        />
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLeft: {
    gap: 2,
  },
  summarySub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#a8a29e',
  },
  summaryTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#292524',
  },
  roomBadge: {
    backgroundColor: '#f5f5f4',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roomBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#57534e',
  },
  timeCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 12,
    alignItems: 'center',
  },
  timeCardLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#a8a29e',
    marginBottom: 4,
  },
  timeCardVal: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomGridBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  roomGridBtnActive: {
    backgroundColor: '#e0e6d9',
    borderColor: '#8b9d77',
  },
  roomGridText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
  },
  roomGridTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  showerStepperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applianceCardList: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingHorizontal: 16,
  },
  applianceSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  applianceInfo: {
    flex: 1,
  },
  applianceName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  applianceWatts: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
    marginTop: 2,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  mainButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  removeBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#a8442f',
  },
});
