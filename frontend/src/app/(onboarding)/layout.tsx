/**
 * ONB-01 / ONB-02 – Onboarding Step 1: Household & Address Setup
 * Calls database RPC `create_household` (or updates existing household if resuming).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronDown, MapPin, Users, Check } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Stepper } from '@/components/Stepper';
import { useToast } from '@/components/Toast';
import { useAuthSession } from '@/lib/authSession';
import { supabase } from '@/lib/supabase';

const MALAYSIAN_STATES = [
  'Selangor',
  'Kuala Lumpur',
  'Penang',
  'Johor',
  'Perak',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Kedah',
  'Kelantan',
  'Terengganu',
  'Perlis',
  'Sabah',
  'Sarawak',
];

export default function OnboardingHouseholdScreen() {
  const router = useRouter();
  const { session, refresh, logout } = useAuthSession();
  const { showToast } = useToast();

  const [stateName, setStateName] = useState(session.household?.address_state || session.state || 'Selangor');
  const [city, setCity] = useState(session.household?.address_city || session.city || 'Petaling Jaya');
  const [street, setStreet] = useState(session.household?.address_street || session.street || '18, Jalan SS 2/6');
  const [residentsCount, setResidentsCount] = useState(session.household?.residents_count || 3);

  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (session.household) {
      if (session.household.address_state) setStateName(session.household.address_state);
      if (session.household.address_city) setCity(session.household.address_city);
      if (session.household.address_street) setStreet(session.household.address_street);
      if (session.household.residents_count) setResidentsCount(session.household.residents_count);
    }
  }, [session.household]);

  const handleNext = async () => {
    if (!stateName.trim() || !city.trim()) {
      showToast('Please provide your State and City.', 'error');
      return;
    }

    if (!session.user) {
      showToast('You must be signed in to complete setup.', 'error');
      router.replace('/(auth)/login');
      return;
    }

    setIsSubmitting(true);
    try {
      let householdId = session.profile?.household_id;

      if (!householdId) {
        // Step 1: Call RPC create_household
        const { data: newHouseholdId, error: rpcError } = await supabase.rpc('create_household', {
          p_state: stateName.trim(),
          p_city: city.trim(),
          p_street: street.trim() || null,
        });

        if (rpcError) {
          // If RPC reports user already has household, query it
          if (rpcError.message?.includes('User already has a household')) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('household_id')
              .eq('id', session.user.id)
              .single();
            householdId = prof?.household_id || null;
          } else {
            throw rpcError;
          }
        } else {
          householdId = newHouseholdId;
        }
      }

      // Update residents_count and address details on household
      if (householdId) {
        const { error: updateError } = await supabase
          .from('households')
          .update({
            address_state: stateName.trim(),
            address_city: city.trim(),
            address_street: street.trim() || null,
            residents_count: Math.max(1, residentsCount),
          })
          .eq('id', householdId);

        if (updateError) throw updateError;
      }

      // Update profile onboarding step to 2
      await supabase
        .from('profiles')
        .update({ onboarding_step: 2 })
        .eq('id', session.user.id);

      await refresh();
      showToast('Household saved! Next, set your schedule.', 'success');
      router.push('/(onboarding)/schedule');
    } catch (err: any) {
      console.error('Error saving household:', err);
      showToast(err?.message || 'Failed to save household.', 'error');
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
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.stepBadge}>Step 1 of 3</Text>
            <Text style={styles.title}>Household & Address</Text>
            <Text style={styles.subtitle}>
              Set up your home location and residents count to calculate local tariffs and accurate utility baselines.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* State selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>State / Territory</Text>
              <Pressable
                onPress={() => setStatePickerVisible(true)}
                style={({ pressed }) => [
                  styles.pickerButton,
                  pressed && styles.pickerButtonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Select state"
              >
                <MapPin size={18} color="#566549" strokeWidth={1.75} />
                <Text style={styles.pickerButtonText}>{stateName || 'Select state'}</Text>
                <ChevronDown size={18} color="#78716c" strokeWidth={1.75} />
              </Pressable>
            </View>

            {/* City input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>City / Area</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'city' && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Petaling Jaya"
                  placeholderTextColor="#a8a29e"
                  onFocus={() => setFocusedField('city')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Street input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Street Address / Neighborhood</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'street' && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="e.g. 18, Jalan SS 2/6, SS 2"
                  placeholderTextColor="#a8a29e"
                  onFocus={() => setFocusedField('street')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Residents Stepper */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepperHeader}>
                <Users size={18} color="#566549" strokeWidth={1.75} />
                <Text style={styles.stepperTitle}>Number of Residents</Text>
              </View>
              <Text style={styles.stepperDesc}>
                Total people living in this household. Drives water shower calculations and per-capita energy targets.
              </Text>
              <Stepper
                value={residentsCount}
                min={1}
                max={15}
                onChange={setResidentsCount}
                unit="people"
                style={styles.stepper}
              />
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={async () => {
                await logout();
                router.replace('/(auth)/login');
              }}
              style={styles.backButton}
              accessibilityRole="button"
            >
              <Text style={styles.backButtonText}>Log out</Text>
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
                'Next: Set Schedule →'
              )}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* State Picker Modal */}
      <Modal
        visible={statePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatePickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setStatePickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select State</Text>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {MALAYSIAN_STATES.map((state) => {
                const isSelected = state === stateName;
                return (
                  <Pressable
                    key={state}
                    onPress={() => {
                      setStateName(state);
                      setStatePickerVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                      pressed && styles.modalOptionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {state}
                    </Text>
                    {isSelected && <Check size={18} color="#566549" strokeWidth={2} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
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
  card: {
    backgroundColor: '#faf6f1',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  pickerButtonPressed: {
    backgroundColor: '#f5f5f4',
  },
  pickerButtonText: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#292524',
  },
  inputWrapper: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: '#566549',
    borderWidth: 1.5,
  },
  input: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#292524',
  },
  stepperContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0ece6',
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepperTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  stepperDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716c',
    marginBottom: 12,
  },
  stepper: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    padding: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '75%',
    backgroundColor: '#faf6f1',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  modalTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalList: {
    maxHeight: 360,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionPressed: {
    backgroundColor: '#ede7df',
  },
  modalOptionSelected: {
    backgroundColor: '#e7ecd8',
  },
  modalOptionText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 16,
    color: '#292524',
  },
  modalOptionTextSelected: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#34402b',
  },
});
