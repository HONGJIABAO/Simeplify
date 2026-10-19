/**
 * SIM-07
 * Bottom sheet for adding a new routine block to My Day.
 * Source: docs/screenshot/simulator/simulator_add_routine.png,
 *         docs/screenshot/simulator/simulator_add_routine_error.png,
 *         docs/page_refined.md S4.6.
 *
 * Rules:
 * - Routine name with quick pills: Watching TV, Working, Studying, Cooking.
 * - Where? Room grid (Living room, Kitchen, Bedroom 1, Bedroom 2, Bathroom).
 * - When? Starts & Ends time cards with overlap validation.
 * - Away overlap shows amber note (not an error).
 * - Conflict error state shows summary error banner and locks Save button.
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
  AlertCircle,
  AlertTriangle,
  Info,
  Tv,
  Utensils,
  BookOpen,
  Briefcase,
  Lock,
} from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Switch } from '@/components/Switch';
import { RoutineBlock, validateBlock } from '../logic/myDayLogic';
import { MOCK_APPLIANCES } from '@/lib/mockData';

interface AddBlockSheetProps {
  visible: boolean;
  onClose: () => void;
  existingBlocks: RoutineBlock[];
  onSaveBlock: (block: Omit<RoutineBlock, 'id'>) => void;
  /** Force demonstration of validation error state */
  initialSimulateError?: boolean;
}

const QUICK_ROUTINES = [
  { name: 'Watching TV', icon: <Tv size={16} color="#57534e" strokeWidth={1.5} />, roomId: 'living' },
  { name: 'Working', icon: <Briefcase size={16} color="#57534e" strokeWidth={1.5} />, roomId: 'living' },
  { name: 'Studying', icon: <BookOpen size={16} color="#57534e" strokeWidth={1.5} />, roomId: 'bedroom' },
  { name: 'Cooking', icon: <Utensils size={16} color="#57534e" strokeWidth={1.5} />, roomId: 'kitchen' },
];

const ROOM_OPTIONS = [
  { id: 'living', label: 'Living room' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bedroom', label: 'Bedroom 1' },
  { id: 'bedroom2', label: 'Bedroom 2' },
  { id: 'bathroom', label: 'Bathroom' },
];

export function AddBlockSheet({
  visible,
  onClose,
  existingBlocks,
  onSaveBlock,
  initialSimulateError = false,
}: AddBlockSheetProps) {
  const [simulateError, setSimulateError] = useState(initialSimulateError);
  const [name, setName] = useState(initialSimulateError ? '' : 'Watching TV');
  const [selectedRoom, setSelectedRoom] = useState('living');
  const [startTime, setStartTime] = useState(initialSimulateError ? '19:15' : '20:00');
  const [endTime, setEndTime] = useState(initialSimulateError ? '20:30' : '23:00');
  const [applianceSwitches, setApplianceSwitches] = useState<Record<string, boolean>>({
    ac1: false,
    fan1: false,
    lights1: true,
  });

  const validation = validateBlock(
    {
      name,
      startTime,
      endTime,
      roomId: selectedRoom,
      applianceIds: Object.keys(applianceSwitches).filter((id) => applianceSwitches[id]),
      iconType: 'custom',
    },
    existingBlocks
  );

  const hasNameError = simulateError || name.trim() === '';
  const hasTimeError = simulateError || !validation.isValid;
  const isFormInvalid = hasNameError || hasTimeError;

  const handleSave = () => {
    if (isFormInvalid) return;

    onSaveBlock({
      name,
      startTime,
      endTime,
      roomId: selectedRoom,
      applianceIds: Object.keys(applianceSwitches).filter((id) => applianceSwitches[id]),
      iconType: 'custom',
      description: `${selectedRoom} routine`,
    });
    onClose();
  };

  const handleToggleAppliance = (id: string) => {
    setApplianceSwitches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add to My Day"
      height="88%"
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Error simulation toggle for testing */}
        <View style={styles.errorToggleRow}>
          <Text style={styles.demoLabel}>Demo mode:</Text>
          <Pressable
            style={[styles.demoTogglePill, simulateError && styles.demoTogglePillActive]}
            onPress={() => {
              setSimulateError((v) => !v);
              if (!simulateError) {
                setName('');
                setStartTime('19:15');
                setEndTime('20:30');
              } else {
                setName('Watching TV');
                setStartTime('20:00');
                setEndTime('23:00');
              }
            }}
          >
            <Text style={styles.demoToggleText}>
              {simulateError ? 'Showing Error State' : 'Showing Valid State'}
            </Text>
          </Pressable>
        </View>

        {/* Top Error Summary Banner (simulator_add_routine_error.png) */}
        {isFormInvalid && (
          <View style={styles.errorSummaryBanner}>
            <AlertCircle size={20} color="#a8442f" strokeWidth={1.5} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorSummaryTitle}>
                Please resolve {hasNameError && hasTimeError ? '2 issues' : '1 issue'} to continue
              </Text>
              <Text style={styles.errorSummaryText}>
                {hasNameError && hasTimeError
                  ? 'Missing required title and a scheduling overlap.'
                  : hasNameError
                  ? 'Missing required routine title.'
                  : validation.overlapError || validation.timeError}
              </Text>
            </View>
          </View>
        )}

        {/* ── Routine Name Section ── */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>Routine name</Text>
            {hasNameError && <Text style={styles.requiredText}>Required</Text>}
          </View>

          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Watching TV"
            error={hasNameError ? 'Enter a title.' : undefined}
          />

          {/* Quick routine selection pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            {QUICK_ROUTINES.map((q) => {
              const isSelected = name === q.name;
              return (
                <Pressable
                  key={q.name}
                  style={[styles.quickPill, isSelected && styles.quickPillActive]}
                  onPress={() => {
                    setName(q.name);
                    setSelectedRoom(q.roomId);
                    setSimulateError(false);
                  }}
                >
                  {q.icon}
                  <Text style={[styles.quickPillText, isSelected && styles.quickPillTextActive]}>
                    {q.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Where? Room Grid ── */}
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

        {/* ── When? Time Range ── */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>When?</Text>
            {hasTimeError && <Text style={styles.requiredText}>Time conflict</Text>}
          </View>

          <View style={styles.timeCardsRow}>
            <View style={[styles.timeCard, hasTimeError && styles.timeCardError]}>
              <Text style={styles.timeCardLabel}>STARTS</Text>
              <Text style={styles.timeCardVal}>{startTime}</Text>
            </View>
            <View style={[styles.timeCard, hasTimeError && styles.timeCardError]}>
              <Text style={styles.timeCardLabel}>ENDS</Text>
              <Text style={styles.timeCardVal}>{endTime}</Text>
            </View>
          </View>

          {/* Schedule overlap banner */}
          {hasTimeError && (
            <View style={styles.overlapBanner}>
              <AlertTriangle size={16} color="#92600e" strokeWidth={1.5} />
              <Text style={styles.overlapBannerText}>
                Schedule Overlap — This overlaps with Dinner (19:00 – 19:30).
              </Text>
            </View>
          )}

          {/* Away time notice (note, not error) */}
          {validation.isInsideAway && (
            <View style={styles.awayNoticeBanner}>
              <Info size={16} color="#92600e" strokeWidth={1.5} />
              <Text style={styles.awayNoticeText}>
                You are away at this time. This block will not be counted.
              </Text>
            </View>
          )}
        </View>

        {/* ── Appliances on during this ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appliances on during this</Text>
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

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <Button
            variant="secondary"
            onPress={onClose}
            style={styles.cancelBtn}
          >
            Cancel
          </Button>
          <Button
            variant={isFormInvalid ? 'disabled' : 'primary'}
            onPress={handleSave}
            disabled={isFormInvalid}
            leftIcon={isFormInvalid ? <Lock size={16} color="#a8a29e" /> : undefined}
            style={styles.saveBtn}
          >
            Save
          </Button>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  errorToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#faf6f1',
    padding: 8,
    borderRadius: 12,
  },
  demoLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534e',
  },
  demoTogglePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#e7e5e4',
  },
  demoTogglePillActive: {
    backgroundColor: '#fbece8',
  },
  demoToggleText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#292524',
  },
  errorSummaryBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fbece8', // error bg
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#a8442f',
  },
  errorSummaryTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#a8442f',
    marginBottom: 2,
  },
  errorSummaryText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#a8442f',
  },
  section: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  requiredText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#a8442f',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  quickPillActive: {
    backgroundColor: '#e0e6d9', // sage-100
    borderColor: '#8b9d77',
  },
  quickPillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
  },
  quickPillTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
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
  timeCardError: {
    backgroundColor: '#fbece8',
    borderColor: '#a8442f',
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
  overlapBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fcd34d',
    marginTop: 4,
  },
  overlapBannerText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#92600e',
    flex: 1,
  },
  awayNoticeBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  awayNoticeText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#92600e',
    flex: 1,
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
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 1,
  },
});
