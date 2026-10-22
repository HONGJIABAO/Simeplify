/**
 * BIN-01
 * Scanner camera view (S5.2): full-screen camera, no tab bar.
 * Source: docs/page_refined.md S5.2, docs/design.md Unit 12.3
 *
 * States: permission denied (message and "Open settings"), scanning (slow leaf spinner).
 *
 * This is a mock camera screen. In production, it uses expo-camera.
 * The real camera integration will replace the simulated viewfinder.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, AccessibilityInfo, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { X, Sprout, Camera, Settings } from 'lucide-react-native';

import { Button } from '@/components/Button';
import { useAuthSession } from '@/lib/authSession';
import { uploadAndScanWaste } from '@/lib/services/binService';

const cartonImage = require('../../../assets/images/plain_carton_box.png');

type ScannerState = 'ready' | 'scanning' | 'permission-denied';

function LeafSpinner({ size = 32 }: { size?: number }) {
  const rotation = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(rotation);
  }, [rotation, reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Sprout size={size} color="#faf6f1" strokeWidth={1.5} />
    </Animated.View>
  );
}

export default function BinScannerScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const householdId = session.profile?.household_id;

  const params = useLocalSearchParams<{ state?: string }>();
  const [scanState, setScanState] = useState<ScannerState>(
    (params.state as ScannerState) ?? 'ready'
  );

  const handleCapture = async () => {
    if (!householdId) {
      setScanState('scanning');
      setTimeout(() => {
        router.replace({
          pathname: '/bin/result' as any,
          params: { binType: 'paper' },
        });
      }, 1000);
      return;
    }

    setScanState('scanning');
    try {
      const scanRes = await uploadAndScanWaste(householdId, cartonImage, {
        fileName: 'camera_scan_carton.jpg',
      });

      router.replace({
        pathname: '/bin/result' as any,
        params: {
          binType: scanRes.binType,
          itemName: scanRes.itemName,
          material: scanRes.material,
          confidence: scanRes.confidence.toString(),
          tips: scanRes.tips,
          isRecyclable: scanRes.isRecyclable ? 'true' : 'false',
          pointsAwarded: scanRes.pointsAwarded.toString(),
          dailyLimitReached: scanRes.dailyLimitReached ? 'true' : 'false',
          scanId: scanRes.scanId,
        },
      });
    } catch (err) {
      console.error('Camera scan failed:', err);
      setScanState('ready');
      router.replace({
        pathname: '/bin/result' as any,
        params: { binType: 'paper' },
      });
    }
  };

  const handleClose = () => {
    router.back();
  };

  // Permission denied state
  if (scanState === 'permission-denied') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Camera size={48} color="#57534e" strokeWidth={1.5} />
          </View>
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionBody}>
            Allow camera access to scan your waste items. You can change this in your device settings.
          </Text>
          <Button
            variant="primary"
            onPress={() => Linking.openSettings()}
            leftIcon={<Settings size={18} color="#fafaf9" strokeWidth={1.5} />}
            style={styles.permissionBtn}
          >
            Open settings
          </Button>
          <Button
            variant="secondary"
            onPress={handleClose}
            style={styles.permissionCloseBtn}
          >
            Go back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Simulated camera viewfinder */}
      <View style={styles.viewfinder}>
        {/* Mock camera background showing beverage carton box from Bin_Scan.png */}
        <Image
          source={cartonImage}
          style={styles.cameraBackground}
          resizeMode="cover"
          accessibilityLabel="Beverage carton in viewfinder"
        />

        {/* Viewfinder frame corners */}
        <View style={styles.frameContainer}>
          {/* Top-left corner */}
          <View style={[styles.corner, styles.cornerTL]} />
          {/* Top-right corner */}
          <View style={[styles.corner, styles.cornerTR]} />
          {/* Bottom-left corner */}
          <View style={[styles.corner, styles.cornerBL]} />
          {/* Bottom-right corner */}
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {/* Hint pill */}
        <View style={styles.hintPill}>
          <Text style={styles.hintText}>
            {scanState === 'scanning'
              ? 'Identifying your item...'
              : 'Point camera at your waste item'}
          </Text>
        </View>

        {/* Scanning spinner overlay */}
        {scanState === 'scanning' && (
          <View style={styles.scanningOverlay}>
            <LeafSpinner size={48} />
            <Text style={styles.scanningText}>Scanning...</Text>
          </View>
        )}
      </View>

      {/* Bottom controls */}
      <SafeAreaView edges={['bottom']} style={styles.controls}>
        {/* Close button */}
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close camera"
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}
        >
          <X size={24} color="#fafaf9" strokeWidth={1.5} />
        </Pressable>

        {/* Shutter button */}
        <Pressable
          onPress={handleCapture}
          disabled={scanState === 'scanning'}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          style={({ pressed }) => [
            styles.shutterButton,
            pressed && styles.shutterButtonPressed,
            scanState === 'scanning' && styles.shutterButtonDisabled,
          ]}
        >
          <View style={styles.shutterInner} />
        </Pressable>

        {/* Spacer for centering */}
        <View style={styles.controlSpacer} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#292524', // stone-800
  },

  // Camera view
  viewfinder: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  // Viewfinder frame
  frameContainer: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#faf6f1', // cream stroke
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },

  // Hint
  hintPill: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(41, 37, 36, 0.6)', // stone-800 60%
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  hintText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#faf6f1',
  },

  // Scanning
  scanningOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanningText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#faf6f1',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#292524',
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(250, 246, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(250, 246, 241, 0.25)',
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#faf6f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#a8a29e', // stone-400
  },
  shutterButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  shutterButtonDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#faf6f1',
    borderWidth: 2,
    borderColor: '#e7e5e4',
  },
  controlSpacer: {
    width: 48,
  },

  // Permission denied
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#faf6f1',
  },
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 300,
  },
  permissionBtn: {
    width: '100%',
    marginBottom: 12,
  },
  permissionCloseBtn: {
    width: '100%',
  },
});
