/**
 * BIN-01, BIN-02
 * Scan result screen (S5.3): captured photo preview, AI classification, separation advice, disposal confirmation.
 * Source: docs/page_refined.md S5.3, docs/design.md Unit 12.3
 *
 * States:
 * - Default result for each of the four bins (paper, plastic, glass_metal, general)
 * - Low confidence ("Not sure. Please retake the photo.")
 * - AI error / timeout ("Try again")
 * - Loading (leaf spinner)
 * - Daily limit reached toast & "+10 points" toast via confirmDisposal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  AccessibilityInfo,
  Image,
} from 'react-native';
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
import {
  Recycle,
  Camera,
  RotateCcw,
  Sparkles,
  Droplets,
  AlertTriangle,
  AlertCircle,
  Sprout,
  Check,
} from 'lucide-react-native';

import { Header } from '@/components/Header';
import { MiniCard } from '@/components/MiniCard';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { useAuthSession } from '@/lib/authSession';
import {
  type BinType,
  type ClassifyWasteResult,
  mockScanResults,
  mockDeedsToday,
  getBinInfo,
} from '@/lib/mockData';
import { confirmDisposal, fetchBinState } from '@/lib/services/binService';
import { LEAF_DAILY_DEED_CAP } from '@/lib/flags';

const cartonImage = require('../../../assets/images/plain_carton_box.png');
const bottleImage = require('../../../assets/images/pet_water_bottle.png');
const jarImage = require('../../../assets/images/glass_olive_jar.png');
const foodScrapImage = require('../../../assets/images/food_scrap.png');

function getWasteImage(binType: BinType) {
  switch (binType) {
    case 'paper':
      return cartonImage;
    case 'plastic':
      return bottleImage;
    case 'glass_metal':
      return jarImage;
    case 'general':
      return foodScrapImage;
    default:
      return cartonImage;
  }
}

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

export default function BinScanResultScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const householdId = session.profile?.household_id;

  const params = useLocalSearchParams<{
    binType?: string;
    state?: string;
    imageUri?: string;
    itemName?: string;
    material?: string;
    confidence?: string;
    tips?: string;
    tip?: string;
    isRecyclable?: string;
    pointsAwarded?: string;
    dailyLimitReached?: string;
    scanId?: string;
  }>();

  const { showToast } = useToast();

  const requestedBin = (params.binType as BinType) || 'paper';
  const baseResult = mockScanResults[requestedBin] || mockScanResults.paper;

  const initialConfidence = params.confidence ? parseFloat(params.confidence) : baseResult.confidence;
  const initialRecyclable = params.isRecyclable !== undefined
    ? params.isRecyclable === 'true'
    : (requestedBin !== 'general');
  const initialTip = params.tips || params.tip || baseResult.tip;

  const initialResult: ClassifyWasteResult = {
    ...baseResult,
    itemName: params.itemName || baseResult.itemName,
    binType: requestedBin,
    material: params.material || baseResult.material,
    confidence: initialConfidence,
    recyclable: initialRecyclable,
    tip: initialTip,
  };

  const initialUiState = (params.state as any) ||
    (initialConfidence < 0.6 ? 'low-confidence' : 'default');

  const [uiState, setUiState] = useState<'default' | 'low-confidence' | 'error' | 'loading'>(
    initialUiState
  );
  const [result, setResult] = useState<ClassifyWasteResult>(initialResult);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deeds count for daily cap (initial from params/mock, refreshed from fetchBinState)
  const [dailyLimitReached, setDailyLimitReached] = useState<boolean>(
    params.dailyLimitReached === 'true' ||
    params.state === 'daily-limit' ||
    mockDeedsToday.count >= LEAF_DAILY_DEED_CAP
  );

  useEffect(() => {
    let isMounted = true;
    if (householdId) {
      fetchBinState(householdId).then((st) => {
        if (isMounted) {
          setDailyLimitReached(st.dailyLimitReached);
        }
      }).catch(console.error);
    }
    return () => {
      isMounted = false;
    };
  }, [householdId]);

  const binInfo = getBinInfo(result.binType);

  const handleRetake = () => {
    router.replace('/bin/scanner' as any);
  };

  const handleTryAgain = () => {
    setUiState('loading');
    setTimeout(() => {
      setUiState('default');
      setResult(mockScanResults[requestedBin] || mockScanResults.paper);
    }, 1500);
  };

  const handleConfirmDisposal = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (params.scanId) {
        const confirmRes = await confirmDisposal(params.scanId, result.binType, householdId || undefined);
        if (confirmRes.pointsAwarded > 0) {
          showToast('+10 points', 'success');
        } else if (confirmRes.alreadyConfirmed) {
          showToast('Disposal already confirmed', 'info');
        } else if (confirmRes.dailyLimitReached && result.recyclable) {
          showToast('Daily limit reached. 0 points today.', 'warning');
        } else {
          showToast(confirmRes.message || 'Item sorted into General waste', 'info');
        }
      } else {
        // Fallback for mock demo runs without real scanId
        if (result.recyclable && !dailyLimitReached) {
          showToast('+10 points', 'success');
        } else if (result.recyclable && dailyLimitReached) {
          showToast('Daily limit reached. 0 points today.', 'warning');
        } else {
          showToast('Item sorted into General waste', 'info');
        }
      }

      // Navigate back to Bin home
      setTimeout(() => {
        router.replace('/(tabs)/bin' as any);
      }, 600);
    } catch {
      showToast('Could not record disposal. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (uiState === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header variant="back-and-title" title="Scan result" onBack={() => router.back()} />
        <View style={styles.centerStateContainer}>
          <LeafSpinner size={48} />
          <Text style={styles.loadingTitle}>Analyzing waste with Gemini...</Text>
          <Text style={styles.loadingSubtitle}>Identifying material and sorting stream</Text>
        </View>
      </SafeAreaView>
    );
  }

  // AI Error state
  if (uiState === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header variant="back-and-title" title="Scan result" onBack={() => router.back()} />
        <View style={styles.centerStateContainer}>
          <View style={[styles.stateIconCircle, { backgroundColor: '#fbece8' }]}>
            <AlertCircle size={44} color="#a8442f" strokeWidth={1.5} />
          </View>
          <Text style={styles.errorTitle}>Classification failed</Text>
          <Text style={styles.errorSubtitle}>
            AI classification failed. Please check your connection and try again.
          </Text>
          <View style={styles.actionRowVertical}>
            <Button
              variant="primary"
              onPress={handleTryAgain}
              leftIcon={<RotateCcw size={18} color="#fafaf9" strokeWidth={1.5} />}
              style={styles.fullWidthBtn}
            >
              Try again
            </Button>
            <Button
              variant="secondary"
              onPress={handleRetake}
              leftIcon={<Camera size={18} color="#292524" strokeWidth={1.5} />}
              style={styles.fullWidthBtn}
            >
              Retake photo
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Low confidence state
  if (uiState === 'low-confidence') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header variant="back-and-title" title="Scan result" onBack={() => router.back()} />
        <View style={styles.centerStateContainer}>
          <View style={[styles.stateIconCircle, { backgroundColor: '#fef3c7' }]}>
            <AlertTriangle size={44} color="#92600e" strokeWidth={1.5} />
          </View>
          <Text style={styles.errorTitle}>Not sure. Please retake the photo.</Text>
          <Text style={styles.errorSubtitle}>
            {"We couldn't clearly identify this item. Please ensure good lighting and center the packaging in the frame."}
          </Text>
          <View style={styles.actionRowVertical}>
            <Button
              variant="primary"
              onPress={handleRetake}
              leftIcon={<Camera size={18} color="#fafaf9" strokeWidth={1.5} />}
              style={styles.fullWidthBtn}
            >
              Retake photo
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                setUiState('default');
                setResult(mockScanResults.general);
              }}
              style={styles.fullWidthBtn}
            >
              Sort as General waste
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Determine button text and variant according to COM-03 / BIN-02 rules:
  // - If recyclable and not daily limit reached: "I threw it (+10 pts)", Accent variant
  // - If daily limit reached or general waste: "I threw it", Primary or Accent variant
  const showPointsOnButton = result.recyclable && !dailyLimitReached;
  const buttonText = showPointsOnButton ? 'I threw it (+10 pts)' : 'I threw it';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header with back arrow and title "Scan result" */}
      <Header
        variant="back-and-title"
        title="Scan result"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ----------------------------------------------------------------
            Top half: Captured Photo preview with reticle & AR tags
            Layout bug fix: sized properly so sheet never covers item name
            ---------------------------------------------------------------- */}
        <View style={styles.photoContainer}>
          {/* Captured photo preview */}
          <Image
            source={
              params.imageUri
                ? { uri: params.imageUri }
                : getWasteImage(result.binType)
            }
            style={styles.photoBackground}
            resizeMode="cover"
            accessibilityLabel={`Scanned ${result.itemName} photo`}
          />

          {/* Viewfinder reticle corners */}
          <View style={styles.photoFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          {/* Top pill: Scan complete */}
          <View style={styles.scanCompleteBadge}>
            <Check size={14} color="#faf6f1" strokeWidth={2} />
            <Text style={styles.scanCompleteText}>Scan complete</Text>
          </View>

          {/* AR tags overlay on photo */}
          <View style={styles.arOverlay}>
            <View style={styles.itemNamePill}>
              <Text style={styles.itemNameText} numberOfLines={1}>
                {result.itemName}
              </Text>
            </View>
            <View style={styles.arTagsRow}>
              <View style={styles.arTagPill}>
                <Text style={styles.arTagLabel}>Material: </Text>
                <Text style={styles.arTagValue}>{result.material}</Text>
              </View>
              <View style={styles.arTagPill}>
                <Text style={styles.arTagLabel}>Status: </Text>
                <Text style={styles.arTagValue}>
                  {result.recyclable ? 'Clean & Recyclable' : 'General Waste'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ----------------------------------------------------------------
            Bottom Sheet panel (white card, rounded 32 at top, drag handle)
            ---------------------------------------------------------------- */}
        <View style={styles.sheetPanel}>
          {/* Drag handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* AI Confirmed pill */}
          <View style={styles.aiConfirmedRow}>
            <View style={styles.aiConfirmedPill}>
              <Sparkles size={14} color="#566549" strokeWidth={1.5} />
              <Text style={styles.aiConfirmedText}>
                AI confirmed • {Math.round(result.confidence * 100)}% match
              </Text>
            </View>
          </View>

          {/* Bin recommendation mini card */}
          <MiniCard style={styles.binMiniCard}>
            <View style={styles.binCardRow}>
              <View style={[styles.binIconCircle, { backgroundColor: binInfo.color }]}>
                <Recycle size={28} color={binInfo.textColor} strokeWidth={1.5} />
              </View>
              <View style={styles.binInfoCol}>
                <Text style={styles.binNameTitle}>{binInfo.name}</Text>
                <Text style={styles.binStatusLabel}>
                  {result.recyclable
                    ? 'Recyclable item (+10 points)'
                    : 'General waste (0 points)'}
                </Text>
              </View>
            </View>
          </MiniCard>

          {/* Mindful separation advice mini card */}
          <MiniCard style={styles.adviceMiniCard}>
            <View style={styles.adviceRow}>
              <View style={styles.adviceIconCircle}>
                <Droplets size={20} color="#566549" strokeWidth={1.5} />
              </View>
              <View style={styles.adviceContent}>
                <Text style={styles.adviceHeading}>Mindful separation advice</Text>
                <Text style={styles.adviceBody}>{result.tip}</Text>
              </View>
            </View>
          </MiniCard>

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            <Button
              variant={showPointsOnButton ? 'accent' : 'primary'}
              onPress={handleConfirmDisposal}
              loading={isSubmitting}
              leftIcon={<Check size={18} color="#292524" strokeWidth={2} />}
              style={styles.fullWidthBtn}
            >
              {buttonText}
            </Button>
            <Button
              variant="secondary"
              onPress={handleRetake}
              leftIcon={<Camera size={18} color="#292524" strokeWidth={1.5} />}
              style={styles.fullWidthBtn}
            >
              Retake photo
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1', // cream
  },
  scrollContent: {
    paddingHorizontal: 24, // px-6
    paddingBottom: 40,
    gap: 20,
  },

  // ---------------------------------------------------------------------------
  // Top Photo Preview
  // ---------------------------------------------------------------------------
  photoContainer: {
    height: 250,
    borderRadius: 32,
    backgroundColor: '#292524', // stone-800
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  photoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  photoInnerArtwork: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(250, 246, 241, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Reticle corners
  photoFrame: {
    ...StyleSheet.absoluteFill,
    margin: 16,
    pointerEvents: 'none',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#faf6f1',
    borderWidth: 2.5,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 10,
  },

  // Scan complete pill
  scanCompleteBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(41, 37, 36, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  scanCompleteText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#faf6f1',
  },

  // AR tags overlay
  arOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    gap: 8,
  },
  itemNamePill: {
    backgroundColor: 'rgba(41, 37, 36, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  itemNameText: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 15,
    color: '#faf6f1',
  },
  arTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  arTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 246, 241, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  arTagLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534e',
  },
  arTagValue: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#292524',
  },

  // ---------------------------------------------------------------------------
  // Bottom Sheet Panel
  // ---------------------------------------------------------------------------
  sheetPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 20,
    gap: 16,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d6d3d1', // stone-300
  },

  // AI Confirmed pill
  aiConfirmedRow: {
    alignItems: 'flex-start',
  },
  aiConfirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0e6d9', // sage-100
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  aiConfirmedText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#566549', // sage-600
  },

  // Bin MiniCard
  binMiniCard: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  binCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  binIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binInfoCol: {
    flex: 1,
  },
  binNameTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
    marginBottom: 2,
  },
  binStatusLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#57534e',
  },

  // Mindful advice MiniCard
  adviceMiniCard: {
    padding: 16,
    backgroundColor: '#fafaf9',
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
  },
  adviceHeading: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
    marginBottom: 4,
  },
  adviceBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
    lineHeight: 20,
  },

  // Actions
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  fullWidthBtn: {
    width: '100%',
  },

  // ---------------------------------------------------------------------------
  // Status states (loading, error, low confidence)
  // ---------------------------------------------------------------------------
  centerStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  stateIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loadingTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
    textAlign: 'center',
  },
  errorTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  actionRowVertical: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
});
