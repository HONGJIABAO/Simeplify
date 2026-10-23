/**
 * AUTH-01 – Login Screen
 * Source: docs/screenshot/login/Login.png, Login_Error.png, page_refined.md §S1, design.md Unit 12.
 *
 * States:
 *   - Default (clean inputs, masked password)
 *   - Error (alert icon, "Email or password is wrong.", password field highlighted)
 *   - Loading (spinner/loading state in primary button)
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';

import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { signIn, getAuthSession } from '@/lib/authSession';


export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: string }>();
  const { showToast } = useToast();

  const isInitialError = params.state === 'error';
  const isInitialLoading = params.state === 'loading';

  const [email, setEmail] = useState(isInitialError ? 'sarah.tan@example.com' : '');
  const [password, setPassword] = useState(isInitialError ? 'supers3cret!' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(isInitialError);
  const [errorMessage, setErrorMessage] = useState('Email or password is wrong.');
  const [isLoading, setIsLoading] = useState(isInitialLoading);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    setHasError(false);
    setErrorMessage('Email or password is wrong.');

    if (!email.trim() || !password.trim()) {
      setHasError(true);
      return;
    }

    setIsLoading(true);
    try {
      const { user, error } = await signIn(email.trim(), password.trim());
      if (error || !user) {
        setHasError(true);
        const rawMsg = error?.message || 'Email or password is wrong.';
        const displayMsg = rawMsg.toLowerCase().includes('failed to fetch')
          ? 'Cannot connect to server. Please use the Demo Account or check your connection.'
          : rawMsg;
        setErrorMessage(displayMsg);
        setIsLoading(false);
        return;
      }

      const session = getAuthSession();
      if (session.profile?.household_id && session.profile?.onboarding_done) {
        router.replace('/(tabs)/simulator' as any);
      } else {
        router.replace('/(onboarding)/layout' as any);
      }
    } catch (err: any) {
      setHasError(true);
      const rawMsg = err?.message || 'Email or password is wrong.';
      const displayMsg = rawMsg.toLowerCase().includes('failed to fetch')
        ? 'Cannot connect to server. Please use the Demo Account or check your connection.'
        : rawMsg;
      setErrorMessage(displayMsg);
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

          {/* Segmented Switcher (Log in | Sign up) */}
          <View style={styles.segmentedContainer}>
            <Pressable
              style={[styles.segmentTab, styles.segmentTabActive]}
              accessibilityRole="button"
              accessibilityLabel="Log in tab"
            >
              <Text style={styles.segmentTextActive}>Log in</Text>
            </Pressable>
            <Pressable
              style={styles.segmentTab}
              onPress={() => router.replace('/(auth)/sign-up' as any)}
              accessibilityRole="button"
              accessibilityLabel="Sign up tab"
            >
              <Text style={styles.segmentTextInactive}>Sign up</Text>
            </Pressable>
          </View>

          {/* Email input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'email' && styles.inputFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (hasError) setHasError(false);
                }}
                placeholder="you@example.com"
                placeholderTextColor="#a8a29e"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputFocused,
                hasError && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (hasError) setHasError(false);
                }}
                placeholder="••••••••"
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

            {/* Error Message banner */}
            {hasError && (
              <View style={styles.errorBanner}>
                <AlertCircle size={15} color="#a8442f" strokeWidth={2} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
          </View>

          {/* Quick Demo Credentials Card */}
          <View style={styles.demoBox}>
            <View style={styles.demoHeaderRow}>
              <View style={styles.demoDot} />
              <Text style={styles.demoHeading}>Demo Account (Mei Ling Tan)</Text>
            </View>
            <Text style={styles.demoText}>
              Email: <Text style={styles.demoCode}>meiling.tan@example.com</Text>
              {'\n'}Password: <Text style={styles.demoCode}>password123</Text>
            </Text>
            <Pressable
              onPress={() => {
                setEmail('meiling.tan@example.com');
                setPassword('password123');
                setHasError(false);
              }}
              style={({ pressed }) => [
                styles.fillButton,
                pressed && styles.fillButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Fill Mei Ling's credentials"
            >
              <Text style={styles.fillButtonText}>⚡ Tap to auto-fill Mei Ling&apos;s login</Text>
            </Pressable>
          </View>

          {/* Primary Log In Button */}
          <Button
            variant="primary"
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginButton}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fafaf9" />
            ) : (
              'Log in'
            )}
          </Button>


        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1', // cream
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
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
    marginBottom: 28,
    paddingHorizontal: 12,
  },

  // Switcher
  segmentedContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#f0eee9',
    borderRadius: 9999,
    padding: 4,
    marginBottom: 24,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: '#ffffff',
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

  // Fields
  fieldContainer: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 13,
    color: '#57534e',
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 6,
  },
  errorText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 13,
    color: '#a8442f',
  },

  // Demo Box
  demoBox: {
    width: '100%',
    backgroundColor: '#f6f3eb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2ddcf',
    padding: 14,
    marginBottom: 14,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  demoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#566549',
  },
  demoHeading: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    lineHeight: 20,
    marginBottom: 10,
  },
  demoCode: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  fillButton: {
    backgroundColor: '#e7ede0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cddbc2',
  },
  fillButtonPressed: {
    backgroundColor: '#dae5d0',
  },
  fillButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#3d4d33',
  },

  // Buttons
  loginButton: {
    width: '100%',
    height: 52,
    marginTop: 4,
  },

  // Divider

});
