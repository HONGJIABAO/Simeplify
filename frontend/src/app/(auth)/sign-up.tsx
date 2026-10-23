/**
 * AUTH-01 – Sign Up Screen
 * Source: docs/screenshot/sign_up/Sign_up.png, Sign_up_filled.png, sign_up_error.png.
 *
 * Custom Requirement:
 *   - Gender selection field (Boy/Girl) stored in mock user session to drive dynamic avatar on Profile.
 *
 * States:
 *   - Empty: disabled "Create account" button
 *   - Filled: active "Create account" button, green checkmark on valid email
 *   - Error: field error outlines and alert messages on State, City, Password, etc.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Leaf,
  Home,
  Navigation,
  ChevronDown,
  Building2,
  MapPin,
  ArrowRight,
  Info,
  Check,
  Mail,
} from 'lucide-react-native';
import { useToast } from '@/components/Toast';
import { signUp, UserGender } from '@/lib/authSession';


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

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: string }>();
  const { showToast } = useToast();

  const isFilledState = params.state === 'filled';
  const isErrorState = params.state === 'error';

  const [gender, setGender] = useState<UserGender>('girl');
  const [email, setEmail] = useState(
    isFilledState ? 'mei@example.com' : isErrorState ? 'you@example.com' : ''
  );
  const [password, setPassword] = useState(
    isFilledState ? 'supersecretpwd123' : isErrorState ? 'short' : ''
  );
  const [showPassword, setShowPassword] = useState(false);
  const [stateName, setStateName] = useState(isFilledState ? 'Selangor' : '');
  const [city, setCity] = useState(isFilledState ? 'Petaling Jaya' : '');
  const [street, setStreet] = useState(
    isFilledState
      ? '18, Jalan SS 2/6, SS 2'
      : isErrorState
      ? 'Jalan, neighborhood, or postal code'
      : ''
  );

  const [touched, setTouched] = useState(isErrorState);
  const [isLoading, setIsLoading] = useState(false);
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 8;
  const isStateValid = stateName.trim().length > 0;
  const isCityValid = city.trim().length > 0;

  const isFormComplete = isEmailValid && isPasswordValid && isStateValid && isCityValid;

  const handleUseLocation = () => {
    setStateName('Selangor');
    setCity('Petaling Jaya');
    setStreet('18, Jalan SS 2/6, SS 2');
    showToast('Location set to Petaling Jaya, Selangor', 'success');
  };

  const handleCreateAccount = async () => {
    setTouched(true);

    if (!isFormComplete) {
      return;
    }

    setIsLoading(true);
    try {
      const { user, error } = await signUp(email.trim(), password.trim(), {
        name: email.trim().split('@')[0],
        gender,
        state: stateName.trim(),
        city: city.trim(),
        street: street.trim(),
      });

      if (error || !user) {
        showToast(error?.message || 'Failed to create account.', 'error');
        setIsLoading(false);
        return;
      }

      showToast('Account created! Welcome to Simeplify.', 'success');
      router.replace('/(onboarding)/layout' as any);
    } catch (err: any) {
      showToast(err?.message || 'Error creating account.', 'error');
    } finally {
      setIsLoading(false);
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
          {/* Brand logo */}
          <Image
            source={require('../../../assets/sprites/logo/app_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Heading */}
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Save energy, sort waste, grow your community.
          </Text>

          {/* Switcher (Log in | Sign up) */}
          <View style={styles.segmentedContainer}>
            <Pressable
              style={styles.segmentTab}
              onPress={() => router.replace('/(auth)/login' as any)}
              accessibilityRole="button"
              accessibilityLabel="Log in tab"
            >
              <Text style={styles.segmentTextInactive}>Log in</Text>
            </Pressable>
            <Pressable
              style={[styles.segmentTab, styles.segmentTabActive]}
              accessibilityRole="button"
              accessibilityLabel="Sign up tab"
            >
              <Text style={styles.segmentTextActive}>Sign up</Text>
            </Pressable>
          </View>

          {/* SECTION 1: Your Account */}
          <View style={styles.sectionHeaderRow}>
            <Leaf size={18} color="#566549" strokeWidth={1.5} />
            <Text style={styles.sectionHeading}>Your account</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Start with your preferred personal sign-in details.
          </Text>

          {/* CUSTOM REQUIREMENT: Gender Selection (Boy / Girl) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Select Avatar Gender</Text>
            <View style={styles.genderOptionsRow}>
              {/* Boy option */}
              <Pressable
                onPress={() => setGender('boy')}
                accessibilityRole="button"
                accessibilityLabel="Select Boy Avatar"
                style={[
                  styles.genderCard,
                  gender === 'boy' && styles.genderCardSelected,
                ]}
              >
                <View style={styles.genderImageContainer}>
                  <Image
                    source={require('../../../assets/sprites/avatar/avatar_boy_face.png')}
                    style={styles.genderThumbnail}
                    resizeMode="cover"
                  />
                  {gender === 'boy' && (
                    <View style={styles.genderCheckBadge}>
                      <Check size={12} color="#ffffff" strokeWidth={2.5} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.genderText,
                    gender === 'boy' && styles.genderTextSelected,
                  ]}
                >
                  Boy
                </Text>
              </Pressable>

              {/* Girl option */}
              <Pressable
                onPress={() => setGender('girl')}
                accessibilityRole="button"
                accessibilityLabel="Select Girl Avatar"
                style={[
                  styles.genderCard,
                  gender === 'girl' && styles.genderCardSelected,
                ]}
              >
                <View style={styles.genderImageContainer}>
                  <Image
                    source={require('../../../assets/sprites/avatar/avatar_girl_face.png')}
                    style={styles.genderThumbnail}
                    resizeMode="cover"
                  />
                  {gender === 'girl' && (
                    <View style={styles.genderCheckBadge}>
                      <Check size={12} color="#ffffff" strokeWidth={2.5} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.genderText,
                    gender === 'girl' && styles.genderTextSelected,
                  ]}
                >
                  Girl
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Email input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'email' && styles.inputFocused,
                touched && !isEmailValid && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#a8a29e"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
              {isEmailValid ? (
                <CheckCircle2 size={18} color="#566549" strokeWidth={2} />
              ) : (
                <Mail size={18} color="#a8a29e" strokeWidth={1.5} />
              )}
            </View>
            {touched && !isEmailValid && (
              <View style={styles.errorBanner}>
                <AlertCircle size={14} color="#a8442f" strokeWidth={2} />
                <Text style={styles.errorText}>Enter a valid email address.</Text>
              </View>
            )}
          </View>

          {/* Password input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputFocused,
                touched && !isPasswordValid && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor="#a8a29e"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#78716c" strokeWidth={1.5} />
                ) : (
                  <Eye size={20} color="#78716c" strokeWidth={1.5} />
                )}
              </Pressable>
            </View>

            {touched && !isPasswordValid ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={14} color="#a8442f" strokeWidth={2} />
                <Text style={styles.errorText}>At least 8 characters.</Text>
              </View>
            ) : (
              <View style={styles.helperRow}>
                <Info size={13} color="#78716c" strokeWidth={1.5} />
                <Text style={styles.helperText}>At least 8 characters.</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.sectionDivider} />

          {/* SECTION 2: Where do you live? */}
          <View style={styles.sectionHeaderRow}>
            <Home size={18} color="#566549" strokeWidth={1.5} />
            <Text style={styles.sectionHeading}>Where do you live?</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            We use this to set your electricity tariff and to show your address.
          </Text>

          {/* "Use my location" button */}
          <Pressable
            onPress={handleUseLocation}
            accessibilityRole="button"
            accessibilityLabel="Use my location"
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.locationButtonPressed,
            ]}
          >
            <Navigation size={16} color="#292524" strokeWidth={1.5} />
            <Text style={styles.locationButtonText}>Use my location</Text>
          </Pressable>

          {/* State picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>State</Text>
            <Pressable
              onPress={() => setStatePickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Select state"
              style={[
                styles.inputWrapper,
                touched && !isStateValid && styles.inputError,
              ]}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !stateName && styles.dropdownPlaceholder,
                ]}
              >
                {stateName || 'Choose your state'}
              </Text>
              <ChevronDown size={18} color="#78716c" strokeWidth={1.5} />
            </Pressable>
            {touched && !isStateValid && (
              <View style={styles.errorBanner}>
                <AlertCircle size={14} color="#a8442f" strokeWidth={2} />
                <Text style={styles.errorText}>Choose your state.</Text>
              </View>
            )}
          </View>

          {/* City or area */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>City or area</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'city' && styles.inputFocused,
                touched && !isCityValid && styles.inputError,
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
              <Building2 size={18} color={touched && !isCityValid ? '#a8442f' : '#a8a29e'} strokeWidth={1.5} />
            </View>
            {touched && !isCityValid && (
              <View style={styles.errorBanner}>
                <AlertCircle size={14} color="#a8442f" strokeWidth={2} />
                <Text style={styles.errorText}>Enter your city or area.</Text>
              </View>
            )}
          </View>

          {/* Street address (optional) */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Street address</Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>
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
                placeholder="Jalan, neighborhood, or postal code"
                placeholderTextColor="#a8a29e"
                onFocus={() => setFocusedField('street')}
                onBlur={() => setFocusedField(null)}
              />
              <MapPin size={18} color="#a8a29e" strokeWidth={1.5} />
            </View>
          </View>

          {/* "Create account" button */}
          <Pressable
            onPress={handleCreateAccount}
            accessibilityRole="button"
            accessibilityLabel="Create account"
            disabled={isLoading}
            style={[
              styles.createButton,
              isFormComplete ? styles.createButtonActive : styles.createButtonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fafaf9" />
            ) : (
              <View style={styles.createButtonInner}>
                <Text
                  style={[
                    styles.createButtonText,
                    isFormComplete
                      ? styles.createButtonTextActive
                      : styles.createButtonTextDisabled,
                  ]}
                >
                  Create account
                </Text>
                <ArrowRight
                  size={18}
                  color={isFormComplete ? '#fafaf9' : '#a8a29e'}
                  strokeWidth={2}
                />
              </View>
            )}
          </Pressable>



          {/* Footer quote */}
          <View style={styles.footerRow}>
            <Leaf size={14} color="#8b9d77" strokeWidth={1.5} />
            <Text style={styles.footerText}>
              Mindful living begins with quiet steps.
            </Text>
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
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setStatePickerVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close state picker backdrop"
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose your state</Text>
            <ScrollView style={styles.modalList}>
              {MALAYSIAN_STATES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setStateName(item);
                    setStatePickerVisible(false);
                  }}
                  style={styles.modalOption}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      stateName === item && styles.modalOptionSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {stateName === item && (
                    <Check size={18} color="#566549" strokeWidth={2} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
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
    paddingTop: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },

  // Brand logo
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 16,
    alignSelf: 'center',
  },

  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 28,
    color: '#292524',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },

  // Switcher
  segmentedContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#f0eee9',
    borderRadius: 9999,
    padding: 4,
    marginBottom: 28,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: '#e0e6d9', // sage-100 on sign up
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  segmentTextInactive: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 14,
    color: '#78716c',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 4,
  },
  sectionHeading: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
  },
  sectionSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#78716c',
    width: '100%',
    marginBottom: 20,
  },
  sectionDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e7e5e4',
    marginVertical: 24,
  },

  // Gender selection
  genderOptionsRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
  },
  genderCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e7e5e4',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  genderCardSelected: {
    backgroundColor: '#e0e6d9', // sage-100
    borderColor: '#566549', // sage-600
  },
  genderImageContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f6e8d8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  genderCheckBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#566549',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#57534e',
  },
  genderTextSelected: {
    color: '#292524',
  },

  // Form Fields
  fieldContainer: {
    width: '100%',
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 13,
    color: '#57534e',
    marginBottom: 8,
  },
  optionalBadge: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingHorizontal: 18,
    height: 52,
  },
  inputFocused: {
    borderColor: '#78716c',
  },
  inputError: {
    backgroundColor: '#fbece8',
    borderColor: '#a8442f',
  },
  input: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#292524',
    height: '100%',
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#292524',
  },
  dropdownPlaceholder: {
    color: '#a8a29e',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  helperText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#a8442f',
  },

  // Location button
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    borderRadius: 9999,
    backgroundColor: '#f5f4f0',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    marginBottom: 20,
  },
  locationButtonPressed: {
    backgroundColor: '#ebe9e3',
  },
  locationButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },

  // Create account button
  createButton: {
    width: '100%',
    height: 54,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  createButtonActive: {
    backgroundColor: '#292524',
  },
  createButtonDisabled: {
    backgroundColor: '#e7e5e4',
  },
  createButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
  },
  createButtonTextActive: {
    color: '#fafaf9',
  },
  createButtonTextDisabled: {
    color: '#a8a29e',
  },

  // Footer quote
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    paddingBottom: 16,
  },
  footerText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716c',
    fontStyle: 'italic',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(41, 37, 36, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
    marginBottom: 12,
  },
  modalList: {
    width: '100%',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  modalOptionText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#292524',
  },
  modalOptionSelected: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#566549',
  },
});
