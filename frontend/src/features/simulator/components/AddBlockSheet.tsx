/**
 * SIM-07
 * Bottom sheet for adding a new routine block to My Day.
 * Matches docs/screenshot/simulator/simulator_add_routine.png and
 *         docs/screenshot/simulator/simulator_add_routine_error.png
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
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
  Clock,
  Armchair,
  ShowerHead,
  Bed,
  X,
  Minus,
  Plus,
  Smartphone,
} from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Switch } from '@/components/Switch';
import { Sprite } from './Sprite';
import { StoredRoom } from '../logic/storage';
import { getRoomDisplayName } from '../logic/roomData';
import { RoutineBlock, validateBlock } from '../logic/myDayLogic';
import { Appliance } from '@/lib/mockData';

interface AddBlockSheetProps {
  visible: boolean;
  onClose: () => void;
  existingBlocks: RoutineBlock[];
  rooms?: StoredRoom[];
  appliances?: Appliance[];
  onSaveBlock: (block: Omit<RoutineBlock, 'id'>) => void;
  initialSimulateError?: boolean;
}

const QUICK_ROUTINES = [
  { name: 'Watching TV', icon: <Tv size={16} color="#57534E" strokeWidth={1.5} />, room: 'living', avatarWalks: true },
  { name: 'Working', icon: <Briefcase size={16} color="#57534E" strokeWidth={1.5} />, room: 'bedroom', avatarWalks: true },
  { name: 'Studying', icon: <BookOpen size={16} color="#57534E" strokeWidth={1.5} />, room: 'bedroom', avatarWalks: true },
  { name: 'Charging phone', icon: <Smartphone size={16} color="#57534E" strokeWidth={1.5} />, room: 'bedroom', avatarWalks: false },
  { name: 'Cooking', icon: <Utensils size={16} color="#57534E" strokeWidth={1.5} />, room: 'kitchen', avatarWalks: true },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function roomIcon(type: StoredRoom['type'] | 'away') {
  const props = { size: 16, color: '#57534E', strokeWidth: 1.5 };
  if (type === 'kitchen') return <Utensils {...props} />;
  if (type === 'bedroom') return <Bed {...props} />;
  if (type === 'bathroom') return <ShowerHead {...props} />;
  if (type === 'away') return <Lock {...props} />;
  return <Armchair {...props} />;
}

export function AddBlockSheet({
  visible,
  onClose,
  existingBlocks,
  rooms = [],
  appliances = [],
  onSaveBlock,
  initialSimulateError = false,
}: AddBlockSheetProps) {
  const [name, setName] = useState(initialSimulateError ? '' : 'Watching TV');
  const [selectedRoom, setSelectedRoom] = useState('living');
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('20:00');
  const [activeDays, setActiveDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [repeatMode, setRepeatMode] = useState<'weekdays' | 'weekends' | 'all'>('weekdays');
  const [avatarWalks, setAvatarWalks] = useState(true);

  // Room appliances switch state
  const [applianceSwitches, setApplianceSwitches] = useState<Record<string, boolean>>({});

  const roomOptions = useMemo(
    () => [
      ...rooms.filter((room) => room.isSetUp).map((room) => {
        return {
          id: room.id,
          type: room.type,
          label: getRoomDisplayName(room, rooms),
        };
      }),
      { id: 'away', type: 'away' as const, label: 'Away' },
    ],
    [rooms]
  );

  const allAppliances = useMemo(() => appliances, [appliances]);
  const [temperature, setTemperature] = useState(23);
  const [timerHours, setTimerHours] = useState(1);
  const [fanSpeed, setFanSpeed] = useState<'Low' | 'Med' | 'High'>('Med');

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      const initialRoom = rooms.find((room) => room.type === 'living') || rooms[0];
      setName(initialSimulateError ? '' : 'Watching TV');
      setSelectedRoom(initialRoom?.id || 'away');
      setStartTime(initialSimulateError ? '19:15' : '17:30');
      setEndTime(initialSimulateError ? '20:30' : '20:00');
      setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      setRepeatMode('weekdays');
      setApplianceSwitches({});
      setTemperature(23);
      setTimerHours(1);
      setFanSpeed('Med');
      setAvatarWalks(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [visible, rooms, initialSimulateError]);

  const isAwaySelected = selectedRoom === 'away';

  // Validation
  const validation = validateBlock(
    {
      name,
      startTime,
      endTime,
      roomId: selectedRoom,
      applianceIds: [],
      iconType: name.toLowerCase().includes('sleep')
        ? 'sleep'
        : isAwaySelected
        ? 'away'
        : 'custom',
      isAway: isAwaySelected,
    },
    existingBlocks
  );

  const hasNameError = name.trim() === '';
  const hasTimeError = !validation.isValid;
  const isFormInvalid = hasNameError || hasTimeError;

  const handleSelectQuickRoutine = (q: (typeof QUICK_ROUTINES)[0]) => {
    setName(q.name);
    setAvatarWalks(q.avatarWalks);
    const workplace = appliances.find((item) => item.type === 'workplace');
    const suggestedRoom = (q.name === 'Working' || q.name === 'Studying' || q.name === 'Charging phone')
      ? rooms.find((room) => room.id === workplace?.roomId)
      : rooms.find((room) => room.type === q.room);
    const nextRoom = suggestedRoom?.id || selectedRoom;
    setSelectedRoom(nextRoom);
    if (workplace && workplace.roomId === nextRoom) {
      setApplianceSwitches((previous) => ({ ...previous, [workplace.id]: true }));
    }
  };

  const handleToggleDay = (day: string) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSetRepeatMode = (mode: 'weekdays' | 'weekends' | 'all') => {
    setRepeatMode(mode);
    if (mode === 'weekdays') setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    else if (mode === 'weekends') setActiveDays(['Sat', 'Sun']);
    else setActiveDays(DAYS);
  };

  const handleSave = () => {
    if (isFormInvalid) return;

    onSaveBlock({
      name,
      startTime,
      endTime,
      roomId: selectedRoom,
      applianceIds: Object.keys(applianceSwitches).filter((k) => applianceSwitches[k]),
      iconType: name.toLowerCase().includes('sleep')
        ? 'sleep'
        : isAwaySelected
        ? 'away'
        : ['working', 'studying', 'charging phone'].includes(name.toLowerCase())
        ? 'work'
        : 'custom',
      isAway: isAwaySelected,
      avatarWalks,
      repeatDays: activeDays,
      temperature,
      timerHours,
      fanSpeed,
      description: `${name} in ${selectedRoom}`,
    });
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add to My Day"
      height="88%"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Top Error Summary Banner (when invalid) */}
        {isFormInvalid && (
          <View style={styles.errorSummaryBanner} accessibilityRole="alert">
            <AlertCircle size={20} color="#C53030" strokeWidth={1.5} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorSummaryTitle}>
                Please resolve {hasNameError && hasTimeError ? '2 issues' : '1 issue'} to continue
              </Text>
              <Text style={styles.errorSummaryText}>
                {hasNameError && hasTimeError
                  ? 'Missing required title and a scheduling overlap.'
                  : hasNameError
                  ? 'Missing required title.'
                  : validation.overlapError || validation.timeError}
              </Text>
            </View>
          </View>
        )}

        {/* ── Routine Name Section ── */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>ROUTINE NAME</Text>
            {hasNameError && <Text style={styles.requiredText}>Required</Text>}
          </View>

          <View style={[styles.inputPill, hasNameError && styles.inputPillError]}>
            <Tv size={18} color={hasNameError ? '#C53030' : '#57534E'} strokeWidth={1.5} />
            <TextInput
              style={[
                styles.inputText,
                !name && styles.inputPlaceholder,
                hasNameError && styles.inputTextError,
              ]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Watching TV"
              placeholderTextColor="#A8A29E"
              accessibilityLabel="Routine name"
              returnKeyType="done"
            />
            {name ? (
              <Pressable
                onPress={() => setName('')}
                accessibilityRole="button"
                accessibilityLabel="Clear routine name"
                style={styles.clearBtn}
              >
                <X size={16} color="#78716C" strokeWidth={1.5} />
              </Pressable>
            ) : null}
          </View>

          {hasNameError && (
            <View style={styles.fieldErrorRow}>
              <AlertCircle size={14} color="#C53030" strokeWidth={1.5} />
              <Text style={styles.fieldErrorText}>Enter a title.</Text>
            </View>
          )}

          {/* Quick routine selection pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
            {QUICK_ROUTINES.map((q) => {
              const isSelected = name === q.name;
              return (
                <Pressable
                  key={q.name}
                  style={[styles.quickPill, isSelected && styles.quickPillActive]}
                  onPress={() => handleSelectQuickRoutine(q)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${q.name}`}
                >
                  <Text
                    style={[
                      styles.quickPillText,
                      isSelected && styles.quickPillTextActive,
                    ]}
                  >
                    {q.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
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

        {/* ── When? Time Range ── */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>When?</Text>
            {hasTimeError && <Text style={styles.requiredText}>Time conflict</Text>}
          </View>

          <View style={styles.timeCardsRow}>
            {/* Starts Card */}
            <View
              style={[styles.timeCard, hasTimeError && styles.timeCardError]}
            >
              <Text style={styles.timeCardLabel}>STARTS</Text>
              <View style={styles.timeCardValueRow}>
                <Clock
                  size={16}
                  color={hasTimeError ? '#C53030' : '#292524'}
                  strokeWidth={1.5}
                />
                <TextInput
                  style={[
                    styles.timeCardValue,
                    hasTimeError && styles.timeCardValueError,
                  ]}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:MM"
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="Start time in 24 hour format"
                />
              </View>
            </View>

            {/* Ends Card */}
            <View
              style={[styles.timeCard, hasTimeError && styles.timeCardError]}
            >
              <Text style={styles.timeCardLabel}>ENDS</Text>
              <View style={styles.timeCardValueRow}>
                <Clock
                  size={16}
                  color={hasTimeError ? '#C53030' : '#292524'}
                  strokeWidth={1.5}
                />
                <TextInput
                  style={[
                    styles.timeCardValue,
                    hasTimeError && styles.timeCardValueError,
                  ]}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:MM"
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="End time in 24 hour format"
                />
              </View>
            </View>
          </View>

          {/* Schedule overlap banner (when conflict) */}
          {hasTimeError && (
            <View style={styles.overlapBanner}>
              <AlertTriangle size={18} color="#C53030" strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.overlapBannerTitle}>Schedule Overlap</Text>
                <Text style={styles.overlapBannerText}>
                  {validation.overlapError ||
                    'This overlaps with Dinner (19:00 – 19:30) on Mon.'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Repeat on Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Repeat on</Text>
          <View style={styles.daysRow}>
            {DAYS.map((d) => {
              const isSelected = activeDays.includes(d);
              return (
                <Pressable
                  key={d}
                  style={[styles.dayPill, isSelected && styles.dayPillActive]}
                  onPress={() => handleToggleDay(d)}
                  accessibilityRole="button"
                  accessibilityLabel={`Repeat on ${d}`}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      isSelected && styles.dayPillTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Quick Repeat Filters */}
          <View style={styles.repeatFiltersRow}>
            <Pressable
              style={[
                styles.repeatFilterPill,
                repeatMode === 'weekdays' && styles.repeatFilterPillActive,
              ]}
              onPress={() => handleSetRepeatMode('weekdays')}
            >
              <Text style={styles.repeatFilterText}>✓ Weekdays</Text>
            </Pressable>
            <Pressable
              style={[
                styles.repeatFilterPill,
                repeatMode === 'weekends' && styles.repeatFilterPillActive,
              ]}
              onPress={() => handleSetRepeatMode('weekends')}
            >
              <Text style={styles.repeatFilterText}>Weekends</Text>
            </Pressable>
            <Pressable
              style={[
                styles.repeatFilterPill,
                repeatMode === 'all' && styles.repeatFilterPillActive,
              ]}
              onPress={() => handleSetRepeatMode('all')}
            >
              <Text style={styles.repeatFilterText}>Every day</Text>
            </Pressable>
          </View>

          {/* Away notice banner */}
          <View style={styles.awayNoticeBanner}>
            <Info size={16} color="#92600E" strokeWidth={1.5} />
            <Text style={styles.awayNoticeText}>
              You are away at this time on Mon and Tue. It will not be counted on those days.
            </Text>
          </View>
        </View>

        {/* ── Appliances on during this ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appliances on during this</Text>
          <ScrollView
            style={styles.applianceScroller}
            contentContainerStyle={styles.applianceCardList}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {allAppliances.length === 0 ? (
              <Text style={styles.emptyAppliancesText}>
                No appliances have been placed yet.
              </Text>
            ) : allAppliances.map((appliance) => {
              const isActive = Boolean(applianceSwitches[appliance.id]);
              const isAirConditioner = appliance.type === 'air_conditioner';
              const isFan = appliance.type === 'fan';
              const applianceRoom = rooms.find((room) => room.id === appliance.roomId);

              return (
                <View key={appliance.id} style={styles.applianceSwitchRow}>
                  <View style={styles.applianceSwitchTop}>
                    <View style={styles.applianceLeft}>
                      <View style={styles.applianceIconBox}>
                        <Sprite type={appliance.spriteKey || appliance.type} size={32} />
                      </View>
                      <View style={styles.applianceTextGroup}>
                        <Text style={styles.applianceName} numberOfLines={1}>{appliance.name}</Text>
                        <Text style={styles.applianceWatts}>
                          {appliance.wattage || 0} W · {applianceRoom?.name || applianceRoom?.type || 'Room'}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={isActive}
                      onValueChange={(value) =>
                        setApplianceSwitches((previous) => ({ ...previous, [appliance.id]: value }))
                      }
                    />
                  </View>

                  {isAirConditioner && isActive && (
                    <View style={styles.applianceControls}>
                      <View style={styles.controlRow}>
                        <Text style={styles.controlLabel}>Temperature</Text>
                        <View style={styles.stepperPill}>
                          <Pressable style={styles.stepperButton} onPress={() => setTemperature((value) => Math.max(16, value - 1))} accessibilityRole="button" accessibilityLabel="Decrease temperature">
                            <Minus size={15} color="#292524" strokeWidth={1.8} />
                          </Pressable>
                          <Text style={styles.stepperValue}>{temperature}°C</Text>
                          <Pressable style={styles.stepperButton} onPress={() => setTemperature((value) => Math.min(30, value + 1))} accessibilityRole="button" accessibilityLabel="Increase temperature">
                            <Plus size={15} color="#292524" strokeWidth={1.8} />
                          </Pressable>
                        </View>
                      </View>
                      <View style={styles.controlRow}>
                        <Text style={styles.controlLabel}>Running time</Text>
                        <View style={styles.stepperPill}>
                          <Pressable style={styles.stepperButton} onPress={() => setTimerHours((value) => Math.max(1, value - 1))} accessibilityRole="button" accessibilityLabel="Decrease air conditioner running time">
                            <Minus size={15} color="#292524" strokeWidth={1.8} />
                          </Pressable>
                          <Text style={styles.stepperValue}>{timerHours}h</Text>
                          <Pressable style={styles.stepperButton} onPress={() => setTimerHours((value) => Math.min(24, value + 1))} accessibilityRole="button" accessibilityLabel="Increase air conditioner running time">
                            <Plus size={15} color="#292524" strokeWidth={1.8} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  )}

                  {isFan && isActive && (
                    <View style={styles.fanControlRow}>
                      <Text style={styles.controlLabel}>Fan speed</Text>
                      <View style={styles.fanSpeedControl}>
                        {(['Low', 'Med', 'High'] as const).map((speed) => {
                          const isSelected = fanSpeed === speed;
                          return (
                            <Pressable key={speed} style={[styles.fanSpeedButton, isSelected && styles.fanSpeedButtonActive]} onPress={() => setFanSpeed(speed)} accessibilityRole="button" accessibilityLabel={`Set fan speed ${speed}`}>
                              <Text style={[styles.fanSpeedText, isSelected && styles.fanSpeedTextActive]}>{speed === 'Med' ? 'Medium' : speed}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Action Buttons ── */}
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
            leftIcon={isFormInvalid ? <Lock size={16} color="#A8A29E" /> : undefined}
            style={[styles.saveBtn, isFormInvalid && styles.saveBtnDisabled]}
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
    paddingBottom: 36,
    gap: 18,
  },
  errorSummaryBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FDECE8',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorSummaryTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#C53030',
    marginBottom: 2,
  },
  errorSummaryText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#C53030',
    lineHeight: 18,
  },
  section: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    letterSpacing: 0.6,
    color: '#78716C',
  },
  requiredText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#C53030',
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    gap: 10,
  },
  inputPillError: {
    backgroundColor: '#FDECE8',
    borderColor: '#F87171',
  },
  inputText: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  inputTextError: {
    color: '#C53030',
  },
  inputPlaceholder: {
    color: '#A8A29E',
  },
  clearBtn: {
    padding: 2,
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  },
  fieldErrorText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#C53030',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  quickPillActive: {
    backgroundColor: '#DCE6D5',
    borderColor: '#8B9D77',
  },
  quickPillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534E',
  },
  quickPillTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
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
  timeCardError: {
    backgroundColor: '#FDECE8',
    borderColor: '#F87171',
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
  timeCardValueError: {
    color: '#C53030',
  },
  overlapBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FDECE8',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 4,
  },
  overlapBannerTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#C53030',
  },
  overlapBannerText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#C53030',
    marginTop: 2,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F5F5F4',
  },
  dayPillActive: {
    backgroundColor: '#DCE6D5',
  },
  dayPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    color: '#78716C',
  },
  dayPillTextActive: {
    color: '#292524',
  },
  repeatFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  repeatFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  repeatFilterPillActive: {
    backgroundColor: '#DCE6D5',
    borderColor: '#8B9D77',
  },
  repeatFilterText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#292524',
  },
  awayNoticeBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 4,
  },
  awayNoticeText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#92600E',
    flex: 1,
    lineHeight: 16,
  },
  applianceScroller: {
    maxHeight: 360,
  },
  applianceCardList: {
    gap: 10,
    paddingBottom: 4,
  },
  applianceSwitchRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 14,
    gap: 12,
  },
  applianceSwitchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applianceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  applianceTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  applianceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applianceName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13.5,
    color: '#292524',
  },
  applianceWatts: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  emptyAppliancesText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    paddingVertical: 16,
  },
  applianceControls: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  controlLabel: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12.5,
    color: '#57534E',
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 38,
    textAlign: 'center',
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
  },
  fanControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
  },
  fanSpeedControl: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F4',
    borderRadius: 9999,
    padding: 2,
    gap: 2,
  },
  fanSpeedButton: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 9,
    borderRadius: 9999,
  },
  fanSpeedButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  fanSpeedText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 11,
    color: '#78716C',
  },
  fanSpeedTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 9999,
    backgroundColor: '#566549',
  },
  saveBtnDisabled: {
    backgroundColor: '#E7E5E4',
  },
});
