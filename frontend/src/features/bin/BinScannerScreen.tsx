/**
 * BIN-01
 * AI Waste Scanner Screen — Direct Camera Access & Instant AI Analysis.
 * Source: docs/page_refined.md S5.2, docs/design.md Unit 12.3
 *
 * Straight access to device camera on open (no intermediate pick menu).
 * Supports:
 * 1. Web: Direct live camera viewfinder via getUserMedia + HTML5 video stream,
 *    with instant frame capture via canvas on shutter tap.
 * 2. Native (iOS/Android): Launches device camera directly via expo-image-picker.
 * 3. Instant AI analysis with Gemini Flash models.
 * 4. Results card with identified item, target bin, material, and disposal tip.
 * 5. One-tap "Scan Another Item" returning straight to camera.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  AccessibilityInfo,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  Camera,
  ImagePlus,
  Sparkles,
  Sprout,
  Recycle,
  Droplets,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Check,
} from 'lucide-react-native';

import { Button } from '@/components/Button';
import { MiniCard } from '@/components/MiniCard';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { useAuthSession } from '@/lib/authSession';
import { useEcoHabit } from '@/lib/ecoHabitContext';
import { classifyWasteWithGemini, type GeminiWasteResult } from '@/lib/services/geminiService';
import { uploadAndScanWaste } from '@/lib/services/binService';
import { type BinType, getBinInfo } from '@/lib/mockData';

type ScreenState = 'camera' | 'analyzing' | 'result' | 'error';

// ---------------------------------------------------------------------------
// LeafSpinner component
// ---------------------------------------------------------------------------
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
      <Sprout size={size} color="#566549" strokeWidth={1.5} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Bin color mapping helpers
// ---------------------------------------------------------------------------
function getBinColor(binType: BinType): string {
  const map: Record<BinType, string> = {
    paper: '#d4a373',
    plastic: '#a8b896',
    glass_metal: '#5c4033',
    general: '#566549',
  };
  return map[binType] || '#566549';
}

function getBinTextColor(binType: BinType): string {
  const map: Record<BinType, string> = {
    paper: '#292524',
    plastic: '#292524',
    glass_metal: '#fafaf9',
    general: '#fafaf9',
  };
  return map[binType] || '#fafaf9';
}

// ---------------------------------------------------------------------------
// Main Screen Component
// ---------------------------------------------------------------------------
export default function BinScannerScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const { sortRecycleItem, addDeed } = useEcoHabit();
  const householdId = session.profile?.household_id;

  // Screen state starts straight in camera mode!
  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [result, setResult] = useState<GeminiWasteResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Web camera refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle back navigation
  const handleBack = () => {
    stopWebCamera();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/bin' as any);
    }
  };

  // Stop web camera stream
  const stopWebCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start web camera stream
  const startWebCamera = async () => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('getUserMedia camera stream failed, fallback available:', err.message);
      setCameraError('Camera access unavailable. Use the photo capture button below.');
      setCameraActive(false);
    }
  };

  // On mount: Straight access camera!
  useEffect(() => {
    let mounted = true;

    if (Platform.OS === 'web') {
      void Promise.resolve().then(() => {
        if (mounted) startWebCamera();
      });
    } else {
      // Native iOS/Android: Launch native camera straight away
      (async () => {
        try {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status === 'granted' && mounted) {
            launchNativeCamera();
          }
        } catch (e) {
          console.warn('Camera permission check failed:', e);
        }
      })();
    }

    return () => {
      mounted = false;
      stopWebCamera();
    };
  }, []);

  // Launch Native Camera (iOS/Android)
  const launchNativeCamera = async () => {
    try {
      const pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
        allowsEditing: false,
      });

      if (!pickerResult.canceled && pickerResult.assets?.[0]) {
        const asset = pickerResult.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setImageMimeType(asset.mimeType || 'image/jpeg');

        // Automatically start AI analysis
        analyzeImage(asset.base64 || '', asset.mimeType || 'image/jpeg', asset.uri);
      }
    } catch (err) {
      console.error('Native camera launch failed:', err);
    }
  };

  // Capture frame from live Web Camera
  const handleCaptureWebFrame = () => {
    if (!videoRef.current || !cameraActive) {
      // Fallback: trigger file input / device photo picker
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];

      setImageUri(dataUrl);
      setImageBase64(base64);
      setImageMimeType('image/jpeg');

      // Stop camera while analyzing
      stopWebCamera();

      // Trigger Gemini AI analysis
      analyzeImage(base64, 'image/jpeg', dataUrl);
    } catch (err) {
      console.error('Frame capture failed:', err);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  // Fallback: Handle file input change (Web)
  const handleFileInputChange = (e: any) => {
    const file = e.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        const mime = file.type || 'image/jpeg';

        setImageUri(dataUrl);
        setImageBase64(base64);
        setImageMimeType(mime);

        stopWebCamera();
        analyzeImage(base64, mime, dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Gallery Pick fallback
  const handlePickFromGallery = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
        allowsEditing: false,
      });

      if (!pickerResult.canceled && pickerResult.assets?.[0]) {
        const asset = pickerResult.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setImageMimeType(asset.mimeType || 'image/jpeg');

        stopWebCamera();
        analyzeImage(asset.base64 || '', asset.mimeType || 'image/jpeg', asset.uri);
      }
    } catch (err) {
      console.error('Gallery picker failed:', err);
    }
  };

  // Perform Gemini AI Classification
  const analyzeImage = async (base64: string, mime: string, uri: string) => {
    setScreenState('analyzing');

    try {
      const geminiResult = await classifyWasteWithGemini(base64, mime);
      setResult(geminiResult);
      setScreenState('result');

      // Non-blocking background log to Supabase (never fails the UI)
      if (householdId && uri) {
        uploadAndScanWaste(householdId, uri, {
          fileName: `scan_${Date.now()}.jpg`,
          base64Data: base64,
        }).catch((err) => {
          console.warn('Background Supabase scan log ignored:', err?.message);
        });
      }
    } catch (err: any) {
      console.error('Gemini classification error:', err);
      setErrorMessage(
        err?.message || 'Could not classify item. Please ensure the item is clearly visible.'
      );
      setScreenState('error');
    }
  };

  // Reset straight back to camera
  const handleScanAnother = () => {
    setResult(null);
    setImageUri(null);
    setImageBase64(null);
    setErrorMessage('');
    setScreenState('camera');

    if (Platform.OS === 'web') {
      setTimeout(() => {
        startWebCamera();
      }, 100);
    } else {
      launchNativeCamera();
    }
  };

  // Handle "I threw it" disposal confirmation
  const handleConfirmDisposal = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Requirement 1 & 3: Global deed update and synchronized points
      if (result?.isRecyclable) {
        sortRecycleItem();
        addDeed('bin_scanner');
        showToast('+10 points & +1 Deed added to Community!', 'success');
      } else {
        addDeed('bin_scanner');
        showToast('Item sorted & +1 Deed added to Community!', 'success');
      }

      setTimeout(() => {
        router.replace('/(tabs)/bin' as any);
      }, 600);
    } catch {
      showToast('Could not record disposal. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // RENDER: Direct Camera Viewport
  // =========================================================================
  if (screenState === 'camera') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header variant="back-and-title" title="AI Waste Scanner" onBack={handleBack} />

        <View style={styles.cameraScreenBody}>
          {/* Main Camera Viewfinder */}
          <View style={styles.viewfinderContainer}>
            {/* Web live video element */}
            {Platform.OS === 'web' && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: cameraActive ? 'block' : 'none',
                }}
              />
            )}

            {/* Inactive / loading / error camera view */}
            {(!cameraActive || Platform.OS !== 'web') && (
              <View style={styles.cameraPlaceholder}>
                <Camera size={48} color="#a8a29e" strokeWidth={1.5} />
                <Text style={styles.cameraPlaceholderText}>
                  {cameraError || 'Device camera active'}
                </Text>
              </View>
            )}

            {/* Viewfinder overlay brackets */}
            <View style={styles.frameOverlay}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {/* Live scanning indicator badge */}
            <View style={styles.liveBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveBadgeText}>
                {cameraActive ? 'Camera active • Align waste item' : 'Point camera at item'}
              </Text>
            </View>

            {/* Hidden web file input for fallback */}
            {Platform.OS === 'web' && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
            )}
          </View>

          {/* Shutter controls section */}
          <View style={styles.shutterSection}>
            <View style={styles.shutterRow}>
              {/* Secondary: Pick from Gallery button */}
              <Pressable
                onPress={
                  Platform.OS === 'web'
                    ? () => fileInputRef.current?.click()
                    : handlePickFromGallery
                }
                accessibilityRole="button"
                accessibilityLabel="Choose from gallery"
                style={({ pressed }) => [
                  styles.galleryIconBtn,
                  pressed && styles.galleryIconBtnPressed,
                ]}
              >
                <ImagePlus size={24} color="#566549" strokeWidth={1.75} />
              </Pressable>

              {/* Primary: Camera Shutter Button */}
              <Pressable
                onPress={Platform.OS === 'web' ? handleCaptureWebFrame : launchNativeCamera}
                accessibilityRole="button"
                accessibilityLabel="Take photo to scan"
                style={({ pressed }) => [
                  styles.shutterOuterCircle,
                  pressed && styles.shutterOuterCirclePressed,
                ]}
              >
                <View style={styles.shutterInnerCircle}>
                  <Camera size={26} color="#ffffff" strokeWidth={2} />
                </View>
              </Pressable>

              {/* Refresh / Switch camera button */}
              <Pressable
                onPress={Platform.OS === 'web' ? startWebCamera : launchNativeCamera}
                accessibilityRole="button"
                accessibilityLabel="Restart camera"
                style={({ pressed }) => [
                  styles.galleryIconBtn,
                  pressed && styles.galleryIconBtnPressed,
                ]}
              >
                <RefreshCw size={22} color="#566549" strokeWidth={1.75} />
              </Pressable>
            </View>

            <Text style={styles.shutterHintText}>Tap the center shutter to scan instantly</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // RENDER: Analyzing state
  // =========================================================================
  if (screenState === 'analyzing') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header variant="back-and-title" title="Analyzing..." onBack={handleBack} />
        <View style={styles.centerContainer}>
          {imageUri && (
            <View style={styles.analyzingPreviewWrap}>
              <Image
                source={{ uri: imageUri }}
                style={styles.analyzingPreviewImage}
                resizeMode="cover"
              />
            </View>
          )}
          <LeafSpinner size={50} />
          <Text style={styles.loadingTitle}>Analyzing waste...</Text>
          <Text style={styles.loadingSubtitle}>
            Gemini AI is identifying the material and determining the proper recycling bin
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // RENDER: Error state
  // =========================================================================
  if (screenState === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header variant="back-and-title" title="Scan result" onBack={handleBack} />
        <View style={styles.centerContainer}>
          <View style={[styles.stateIconCircle, { backgroundColor: '#fbece8' }]}>
            <AlertCircle size={44} color="#a8442f" strokeWidth={1.5} />
          </View>
          <Text style={styles.errorTitle}>Classification failed</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>
          <View style={styles.errorActions}>
            <Button
              variant="primary"
              onPress={handleScanAnother}
              leftIcon={<Camera size={18} color="#fafaf9" strokeWidth={1.5} />}
              style={styles.fullWidthBtn}
            >
              Take a new photo
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // RENDER: Result state
  // =========================================================================
  if (screenState === 'result' && result) {
    const binColor = getBinColor(result.binType);
    const binTextColor = getBinTextColor(result.binType);

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header variant="back-and-title" title="Scan result" onBack={handleBack} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Photo preview with scan complete badge */}
          <View style={styles.resultPhotoContainer}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.resultPhotoImage}
                resizeMode="cover"
                accessibilityLabel={`Scanned ${result.identifiedItem} photo`}
              />
            )}
            <View style={styles.scanCompleteBadge}>
              <Sparkles size={14} color="#faf6f1" strokeWidth={2} />
              <Text style={styles.scanCompleteText}>AI scan complete</Text>
            </View>
            <View style={styles.itemOverlay}>
              <View style={styles.itemNamePill}>
                <Text style={styles.itemNameText}>{result.identifiedItem}</Text>
              </View>
            </View>
          </View>

          {/* Results Sheet */}
          <View style={styles.resultSheet}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* AI Confidence badge */}
            <View style={styles.aiConfirmedRow}>
              <View style={styles.aiConfirmedPill}>
                <Sparkles size={14} color="#566549" strokeWidth={1.5} />
                <Text style={styles.aiConfirmedText}>
                  AI confirmed • {Math.round(result.confidence * 100)}% match
                </Text>
              </View>
            </View>

            {/* Identified item card */}
            <MiniCard style={styles.resultMiniCard}>
              <Text style={styles.resultLabel}>Identified Item</Text>
              <Text style={styles.resultValue}>{result.identifiedItem}</Text>
            </MiniCard>

            {/* Target Bin card */}
            <MiniCard style={styles.binMiniCard}>
              <View style={styles.binCardRow}>
                <View style={[styles.binIconCircle, { backgroundColor: binColor }]}>
                  <Recycle size={28} color={binTextColor} strokeWidth={1.5} />
                </View>
                <View style={styles.binInfoCol}>
                  <Text style={styles.binNameTitle}>{result.targetBin}</Text>
                  <Text style={styles.binStatusLabel}>
                    {result.isRecyclable
                      ? 'Recyclable item (+10 points)'
                      : 'General waste (0 points)'}
                  </Text>
                </View>
              </View>
            </MiniCard>

            {/* Disposal Tip card */}
            <MiniCard style={styles.adviceMiniCard}>
              <View style={styles.adviceRow}>
                <View style={styles.adviceIconCircle}>
                  <Droplets size={20} color="#566549" strokeWidth={1.5} />
                </View>
                <View style={styles.adviceContent}>
                  <Text style={styles.adviceHeading}>Disposal Tip</Text>
                  <Text style={styles.adviceBody}>{result.disposalTip}</Text>
                </View>
              </View>
            </MiniCard>

            {/* Material info card */}
            <MiniCard style={styles.resultMiniCard}>
              <Text style={styles.resultLabel}>Material</Text>
              <Text style={styles.resultValue}>{result.material}</Text>
            </MiniCard>

            {/* Action buttons */}
            <View style={styles.resultActions}>
              <Button
                variant="accent"
                onPress={handleConfirmDisposal}
                loading={isSubmitting}
                leftIcon={<Check size={18} color="#292524" strokeWidth={2} />}
                style={styles.fullWidthBtn}
              >
                {result.isRecyclable ? 'I threw it (+10 pts)' : 'I threw it'}
              </Button>
              <Button
                variant="secondary"
                onPress={handleScanAnother}
                leftIcon={<Camera size={18} color="#292524" strokeWidth={1.5} />}
                style={styles.fullWidthBtn}
              >
                Scan Another Item
              </Button>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1',
  },
  cameraScreenBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  viewfinderContainer: {
    flex: 1,
    maxHeight: 460,
    borderRadius: 28,
    backgroundColor: '#1c1917',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1c1917',
    padding: 24,
  },
  cameraPlaceholderText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#a8a29e',
    textAlign: 'center',
  },
  frameOverlay: {
    ...StyleSheet.absoluteFill as object,
    margin: 18,
    pointerEvents: 'none',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#faf6f1',
    borderWidth: 3.5,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backdropFilter: 'blur(8px)',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  liveBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#fafaf9',
  },

  // Shutter Controls
  shutterSection: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  shutterOuterCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#566549',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf6f1',
    shadowColor: '#566549',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  shutterOuterCirclePressed: {
    transform: [{ scale: 0.94 }],
    borderColor: '#3e4a34',
  },
  shutterInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#566549',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e6d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIconBtnPressed: {
    backgroundColor: '#cdd7c3',
  },
  shutterHintText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716c',
  },

  // Analyzing state
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  analyzingPreviewWrap: {
    width: 140,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#566549',
    marginBottom: 8,
    shadowColor: '#566549',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  analyzingPreviewImage: {
    width: '100%',
    height: '100%',
  },
  loadingTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  // Error state
  stateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  errorActions: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },

  // Result state
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  resultPhotoContainer: {
    height: 280,
    borderRadius: 24,
    backgroundColor: '#292524',
    overflow: 'hidden',
    position: 'relative',
  },
  resultPhotoImage: {
    ...StyleSheet.absoluteFill as object,
    width: '100%',
    height: '100%',
  },
  scanCompleteBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#566549',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  scanCompleteText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#faf6f1',
  },
  itemOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
  },
  itemNamePill: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  itemNameText: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#fafaf9',
  },
  resultSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d6d3d1',
  },
  aiConfirmedRow: {
    alignItems: 'center',
  },
  aiConfirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0e6d9',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  aiConfirmedText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#566549',
  },
  resultMiniCard: {
    padding: 14,
    gap: 4,
  },
  resultLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
  },
  resultValue: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#292524',
  },
  binMiniCard: {
    padding: 14,
  },
  binCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  binIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binInfoCol: {
    flex: 1,
    gap: 2,
  },
  binNameTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#292524',
  },
  binStatusLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
  },
  adviceMiniCard: {
    padding: 14,
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  adviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e6d9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  adviceContent: {
    flex: 1,
    gap: 2,
  },
  adviceHeading: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  adviceBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    lineHeight: 18,
  },
  resultActions: {
    gap: 10,
    marginTop: 8,
  },
  fullWidthBtn: {
    width: '100%',
  },
});
