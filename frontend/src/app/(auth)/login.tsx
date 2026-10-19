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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { ENABLE_GOOGLE_AUTH } from '@/lib/flags';
import { updateAuthSession } from '@/lib/authSession';

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </Svg>
  );
}

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
  const [isLoading, setIsLoading] = useState(isInitialLoading);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleLogin = () => {
    setHasError(false);

    if (!email.trim() || !password.trim()) {
      setHasError(true);
      return;
    }

    if (password === 'wrong') {
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const isMeiLing =
        email.trim().toLowerCase() === 'meiling.tan@example.com' ||
        email.trim().toLowerCase().includes('meiling');

      updateAuthSession({
        isLoggedIn: true,
        email: email.trim(),
        name: isMeiLing ? 'Mei Ling Tan' : 'Mei Ling Tan',
        gender: 'girl',
        addressDisplay: '18, Jalan SS 2/6, Petaling Jaya, Selangor',
      });
      router.replace('/(tabs)/simulator' as any);
    }, 600);
  };

  const handleGoogleLogin = () => {
    if (!ENABLE_GOOGLE_AUTH) {
      showToast('Google Sign-In is disabled (ENABLE_GOOGLE_AUTH = false).', 'info');
      return;
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
          {/* Brand illustration */}
          <View style={styles.illustrationWrapper}>
            <View style={styles.blobTan} />
            <View style={styles.blobSage} />
            <View style={styles.sproutBadge}>
              <Svg width={36} height={36} viewBox="0 0 36 36">
                <Path
                  d="M18 28V15M18 15C18 9 26 8 26 8C26 14 20 15 18 15ZM18 19C18 15 12 14 12 14C12 19 16 20 18 19ZM14 28H22"
                  stroke="#566549"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </View>
          </View>

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
                <Text style={styles.errorText}>Email or password is wrong.</Text>
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

          {/* Divider with "or" */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In button */}
          <Pressable
            onPress={handleGoogleLogin}
            accessibilityRole="button"
            accessibilityLabel="Log in with Google"
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.googleButtonPressed,
            ]}
          >
            <GoogleIcon size={18} />
            <Text style={styles.googleText}>Log in with Google</Text>
          </Pressable>
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

  // Brand illustration
  illustrationWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  blobTan: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f6e8d8', // tan-100
    top: 10,
    left: 10,
  },
  blobSage: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e0e6d9', // sage-100
    bottom: 10,
    right: 10,
  },
  sproutBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e7e5e4',
  },
  dividerText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#a8a29e',
    paddingHorizontal: 16,
  },

  // Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    gap: 10,
  },
  googleButtonPressed: {
    backgroundColor: '#f5f5f4',
  },
  googleText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
});
