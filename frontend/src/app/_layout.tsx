import { useEffect } from 'react';
import { View, Platform, StyleSheet, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3';
import { ToastProvider } from '@/components/Toast';
import '../global.css';

// Silence React 19 / react-native-web responder event warnings on web
if (typeof window !== 'undefined') {
  try {
    // Register with @expo/log-box directly on web if available
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const expoLogBox = require('@expo/log-box');
    if (expoLogBox?.default?.ignoreLogs) {
      expoLogBox.default.ignoreLogs([
        'Unknown event handler property `onResponderTerminate`',
        'Unknown event handler property',
        /onResponderTerminate/,
        /onResponder/,
        /Unknown event handler property/,
      ]);
    }
  } catch {
    // ignore
  }

  const shouldSuppress = (args: unknown[]) => {
    const text = args
      .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a ?? '')))
      .join(' ');
    return (
      text.includes('onResponder') ||
      text.includes('onResponderTerminate') ||
      text.includes('Unknown event handler property') ||
      text.includes('onStartShouldSetResponder') ||
      text.includes('Failed to fetch') ||
      text.includes('Network request failed') ||
      text.includes('Error syncing routine notifications') ||
      text.includes('Error fetching unread notifications count')
    );
  };

  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    origError.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    origWarn.apply(console, args);
  };
}

LogBox.ignoreLogs([
  'Unknown event handler property `onResponderTerminate`',
  'Unknown event handler property',
  'onResponder',
  /onResponderTerminate/,
  /onResponder/,
  /Unknown event handler property/,
]);

if (Platform.OS === 'web') {
  LogBox.ignoreAllLogs();
}
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const content = (
    <ToastProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#faf6f1' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="_dev" options={{ headerShown: false }} />
      </Stack>
    </ToastProvider>
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {Platform.OS === 'web' ? (
          <View style={styles.webOuter}>
            <View style={styles.webPhoneContainer}>
              {content}
            </View>
          </View>
        ) : (
          content
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#faf6f1',
  },
  webOuter: {
    flex: 1,
    backgroundColor: '#ede7df',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '100%',
  },
  webPhoneContainer: {
    width: '100%',
    maxWidth: 430,
    height: '100%',
    minHeight: '100vh' as any,
    backgroundColor: '#faf6f1',
    overflow: 'hidden',
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
});
