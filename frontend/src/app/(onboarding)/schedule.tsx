/**
 * ONB-01 / ONB-02 – Onboarding Step 2: Schedule & Shower Habits Setup
 * Saves not-at-home ranges to `public.schedules` and shower habits to `public.households`.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, Plus, Trash2, Droplets, Copy, AlertCircle } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Stepper } from '@/components/Stepper';
import { useToast } from '@/components/Toast';
import { useAuthSession } from '@/lib/authSession';
import { supabase } from '@/lib/supabase';
import type { DayType } from '@/types/database';

interface TimeRange {
  id: string;
  start: string; // HH:MM
  end: string;   // HH:MM
}

export default function OnboardingScheduleScreen() {
  const router = useRouter();
  const { session, refresh } = useAuthSession();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<DayType>('weekday');
  const [weekdayRanges, setWeekdayRanges] = useState<TimeRange[]>([
    { id: 'wd-1', start: '09:00', end: '18:00' },
  ]);
  const [weekendRanges, setWeekendRanges] = useState<TimeRange[]>([
    { id: 'we-1', start: '12:00', end: '16:00' },
  ]);

  const [showersPerPerson, setShowersPerPerson] = useState(
    session.household?.showers_per_person ?? 2
  );
  const [minutesPerShower, setMinutesPerShower] = useState(
    session.household?.minutes_per_shower ?? 10
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load existing schedules from database if resuming
  useEffect(() => {
    async function loadExistingSchedules() {
      if (!session.profile?.household_id) return;

      const { data: rows } = await supabase
        .from('schedules')
        .select('*')
        .eq('household_id', session.profile.household_id);

      if (rows && rows.length > 0) {
        const wd: TimeRange[] = [];
        const we: TimeRange[] = [];

        rows.forEach((r) => {
          const item: TimeRange = {
            id: r.id,
            start: r.start_time.substring(0, 5),
            end: r.end_time.substring(0, 5),
          };
          if (r.day_type === 'weekday') wd.push(item);
          else we.push(item);
        });

        if (wd.length > 0) setWeekdayRanges(wd);
        if (we.length > 0) setWeekendRanges(we);
      }
    }

    loadExistingSchedules();
  }, [session.profile?.household_id]);

  const currentRanges = activeTab === 'weekday' ? weekdayRanges : weekendRanges;
  const setCurrentRanges = (newRanges: TimeRange[]) => {
    if (activeTab === 'weekday') {
      setWeekdayRanges(newRanges);
    } else {
      setWeekendRanges(newRanges);
    }
  };

  const handleAddRange = () => {
    const newId = `${activeTab}-${Date.now()}`;
    setCurrentRanges([...currentRanges, { id: newId, start: '19:00', end: '21:00' }]);
  };

  const handleRemoveRange = (id: string) => {
    setCurrentRanges(currentRanges.filter((r) => r.id !== id));
  };

  const handleUpdateRange = (id: string, field: 'start' | 'end', val: string) => {
    setValidationError(null);
    setCurrentRanges(
      currentRanges.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleCopyOther = () => {
    if (activeTab === 'weekday') {
      setWeekendRanges([...weekdayRanges.map((r, i) => ({ ...r, id: `we-${i}-${Date.now()}` }))]);
      showToast('Weekday schedule copied to Weekend.', 'info');
    } else {
      setWeekdayRanges([...weekendRanges.map((r, i) => ({ ...r, id: `wd-${i}-${Date.now()}` }))]);
      showToast('Weekend schedule copied to Weekday.', 'info');
    }
  };

  const validateRanges = (ranges: TimeRange[], name: string): boolean => {
    for (const r of ranges) {
      if (!r.start || !r.end) {
        setValidationError(`All time fields in ${name} must be filled.`);
        return false;
      }
      if (r.end <= r.start) {
        setValidationError(`In ${name}, end time (${r.end}) must be after start time (${r.start}).`);
        return false;
      }
    }

    // Check overlaps
    const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].end > sorted[i + 1].start) {
        setValidationError(`Time ranges in ${name} overlap (${sorted[i].start}-${sorted[i].end} and ${sorted[i + 1].start}-${sorted[i + 1].end}).`);
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    setValidationError(null);

    if (!validateRanges(weekdayRanges, 'Weekdays') || !validateRanges(weekendRanges, 'Weekends')) {
      return;
    }

    const householdId = session.profile?.household_id;
    if (!householdId) {
      showToast('Household not found. Please complete Step 1 first.', 'error');
      router.replace('/(onboarding)/layout');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Delete previous schedules for this household
      await supabase.from('schedules').delete().eq('household_id', householdId);

      // 2. Prepare schedule rows
      const rowsToInsert = [
        ...weekdayRanges.map((r) => ({
          household_id: householdId,
          day_type: 'weekday' as DayType,
          start_time: `${r.start}:00`,
          end_time: `${r.end}:00`,
        })),
        ...weekendRanges.map((r) => ({
          household_id: householdId,
          day_type: 'weekend' as DayType,
          start_time: `${r.start}:00`,
          end_time: `${r.end}:00`,
        })),
      ];

      if (rowsToInsert.length > 0) {
        const { error: schedError } = await supabase.from('schedules').insert(rowsToInsert);
        if (schedError) throw schedError;
      }

      // 3. Update shower habits on households
      const { error: habitError } = await supabase
        .from('households')
        .update({
          showers_per_person: Math.min(6, Math.max(0, showersPerPerson)),
          minutes_per_shower: Math.min(30, Math.max(5, minutesPerShower)),
        })
        .eq('id', householdId);

      if (habitError) throw habitError;

      // 4. Update profile step to 3
      if (session.user) {
        await supabase
          .from('profiles')
          .update({ onboarding_step: 3 })
          .eq('id', session.user.id);
      }

      await refresh();
      showToast('Schedule and habits saved! Next, set up your rooms.', 'success');
      router.push('/(onboarding)/appliances');
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      showToast(err?.message || 'Failed to save schedule.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress dots at top */}
          <View style={styles.progressRow}>
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
          </View>

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.stepBadge}>Step 2 of 3</Text>
            <Text style={styles.title}>Daily Schedule & Habits</Text>
            <Text style={styles.subtitle}>
              When is your household usually not at home? Unmarked time is treated as active home hours.
            </Text>
          </View>

          {/* Segmented Control for Weekdays / Weekends */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab('weekday')}
              style={[styles.tabButton, activeTab === 'weekday' && styles.tabButtonActive]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'weekday' && styles.tabButtonTextActive,
                ]}
              >
                Weekdays (Mon – Fri)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('weekend')}
              style={[styles.tabButton, activeTab === 'weekend' && styles.tabButtonActive]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'weekend' && styles.tabButtonTextActive,
                ]}
              >
                Weekends (Sat – Sun)
              </Text>
            </Pressable>
          </View>

          {/* Schedule Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleRow}>
                <Clock size={18} color="#566549" strokeWidth={1.75} />
                <Text style={styles.cardTitle}>Away From Home Periods</Text>
              </View>

              <Pressable
                onPress={handleCopyOther}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
                accessibilityRole="button"
              >
                <Copy size={14} color="#566549" strokeWidth={1.75} />
                <Text style={styles.copyButtonText}>
                  {activeTab === 'weekday' ? 'Copy to weekend' : 'Copy to weekday'}
                </Text>
              </Pressable>
            </View>

            {/* List of Time Ranges */}
            {currentRanges.length === 0 ? (
              <View style={styles.emptyRanges}>
                <Text style={styles.emptyText}>No away hours set. Household is at home all day.</Text>
              </View>
            ) : (
              currentRanges.map((range, index) => (
                <View key={range.id} style={styles.rangeRow}>
                  <Text style={styles.rangeIndex}>#{index + 1}</Text>
                  <View style={styles.timeInputBox}>
                    <Text style={styles.timeLabel}>From</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={range.start}
                      onChangeText={(val) => handleUpdateRange(range.id, 'start', val)}
                      placeholder="09:00"
                      placeholderTextColor="#a8a29e"
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>

                  <Text style={styles.toSeparator}>–</Text>

                  <View style={styles.timeInputBox}>
                    <Text style={styles.timeLabel}>To</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={range.end}
                      onChangeText={(val) => handleUpdateRange(range.id, 'end', val)}
                      placeholder="18:00"
                      placeholderTextColor="#a8a29e"
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>

                  <Pressable
                    onPress={() => handleRemoveRange(range.id)}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.deleteButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Delete range"
                  >
                    <Trash2 size={16} color="#a8442f" strokeWidth={1.75} />
                  </Pressable>
                </View>
              ))
            )}

            {/* Add Range Button */}
            <Pressable
              onPress={handleAddRange}
              style={({ pressed }) => [
                styles.addRangeButton,
                pressed && styles.addRangeButtonPressed,
              ]}
              accessibilityRole="button"
            >
              <Plus size={16} color="#566549" strokeWidth={2} />
              <Text style={styles.addRangeText}>+ Add another away range</Text>
            </Pressable>

            {/* Range Validation Error banner */}
            {validationError && (
              <View style={styles.errorBanner}>
                <AlertCircle size={15} color="#a8442f" strokeWidth={2} />
                <Text style={styles.errorText}>{validationError}</Text>
              </View>
            )}
          </View>

          {/* Shower Habits Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Droplets size={18} color="#566549" strokeWidth={1.75} />
              <Text style={styles.cardTitle}>Water Heater & Shower Habits</Text>
            </View>
            <Text style={styles.stepperDesc}>
              Water heating accounts for significant electricity and water consumption.
            </Text>

            <View style={styles.habitRow}>
              <View style={styles.habitTextCol}>
                <Text style={styles.habitLabel}>Showers per person</Text>
                <Text style={styles.habitSub}>Average daily showers</Text>
              </View>
              <Stepper
                value={showersPerPerson}
                min={0}
                max={6}
                onChange={setShowersPerPerson}
                unit="times"
              />
            </View>

            <View style={[styles.habitRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.habitTextCol}>
                <Text style={styles.habitLabel}>Minutes per shower</Text>
                <Text style={styles.habitSub}>Typical shower duration</Text>
              </View>
              <Stepper
                value={minutesPerShower}
                min={5}
                max={30}
                step={5}
                onChange={setMinutesPerShower}
                unit="min"
              />
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>

            <Button
              variant="primary"
              onPress={handleNext}
              disabled={isSubmitting}
              style={styles.nextButton}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fafaf9" />
              ) : (
                'Next: Rooms & Appliances →'
              )}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d6d3d1',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#566549',
  },
  headerBlock: {
    marginBottom: 20,
  },
  stepBadge: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#566549',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 28,
    color: '#292524',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#57534e',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ede7df',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#78716c',
  },
  tabButtonTextActive: {
    color: '#292524',
  },
  card: {
    backgroundColor: '#faf6f1',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#292524',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#e7ecd8',
  },
  copyButtonPressed: {
    backgroundColor: '#d8e0c4',
  },
  copyButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#34402b',
  },
  emptyRanges: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#78716c',
    fontStyle: 'italic',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  rangeIndex: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#78716c',
    width: 24,
  },
  timeInputBox: {
    flex: 1,
  },
  timeLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#78716c',
    marginBottom: 2,
  },
  timeInput: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#292524',
    paddingVertical: 2,
  },
  toSeparator: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 18,
    color: '#a8a29e',
    marginHorizontal: 4,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  deleteButtonPressed: {
    backgroundColor: '#fbeae5',
  },
  addRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#a8a29e',
    borderRadius: 14,
    marginTop: 8,
  },
  addRangeButtonPressed: {
    backgroundColor: '#ede7df',
  },
  addRangeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#566549',
  },
  stepperDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716c',
    marginBottom: 16,
    marginTop: 4,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece6',
  },
  habitTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  habitLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  habitSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fbeae5',
    borderWidth: 1,
    borderColor: '#e8a598',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#a8442f',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#78716c',
  },
  nextButton: {
    flex: 1,
  },
});
