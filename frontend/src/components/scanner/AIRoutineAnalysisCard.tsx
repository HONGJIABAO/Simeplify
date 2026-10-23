import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Sliders,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Droplets,
  HelpCircle,
} from 'lucide-react-native';

import { Card } from '../Card';
import { MiniCard } from '../MiniCard';
import { Badge } from '../Badge';
import { Button } from '../Button';
import type { AIRoutineAnalysisResult } from '@/features/scanner/logic/scannerCore';

export interface AIRoutineAnalysisCardProps {
  routineAnalysis?: AIRoutineAnalysisResult | null;
  utilityType?: 'electricity' | 'water';
  onNavigateToSimulator?: () => void;
  style?: any;
}

export function AIRoutineAnalysisCard({
  routineAnalysis,
  utilityType = 'electricity',
  onNavigateToSimulator,
  style,
}: AIRoutineAnalysisCardProps) {
  const router = useRouter();

  if (!routineAnalysis) {
    return null;
  }

  const {
    discrepancyRm,
    discrepancyType,
    conclusion,
    culpritAppliances,
    culpritHabits,
    actionRecommendation,
    severity,
    estimatedCostRm,
    actualCostRm,
  } = routineAnalysis;

  const isPositive = discrepancyRm > 0;
  const isMinor = severity === 'minor';
  const isMajor = severity === 'major';
  const isNormal = severity === 'normal';

  const badgeTone = isMajor ? 'rose' : isMinor ? 'amber' : 'sage';
  const badgeLabel = isMajor
    ? `+RM ${Math.abs(Math.round(discrepancyRm))} High Spike`
    : isMinor
    ? `+RM ${Math.abs(Math.round(discrepancyRm))} Minor Gap`
    : 'On Track';

  const handleGoToSimulator = () => {
    if (onNavigateToSimulator) {
      onNavigateToSimulator();
    } else {
      router.push('/(tabs)/simulator');
    }
  };

  const UtilityIcon = utilityType === 'water' ? Droplets : Zap;
  const StatusIcon = isMajor ? AlertTriangle : isMinor ? AlertCircle : CheckCircle2;
  const iconColor = isMajor ? '#9E3A24' : isMinor ? '#8F5B14' : '#566549';

  return (
    <Card style={[styles.card, style]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, isMajor ? styles.iconCircleMajor : isMinor ? styles.iconCircleMinor : styles.iconCircleNormal]}>
            <Sparkles size={19} color={iconColor} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={styles.title}>AI Routine Analysis</Text>
            <Text style={styles.subtitle}>Simulator Routine vs Actual Bill</Text>
          </View>
        </View>
        <Badge tone={badgeTone as any}>{badgeLabel}</Badge>
      </View>

      {/* Routine vs Bill Metrics Bar */}
      <View style={styles.metricsRow}>
        <MiniCard tone="subtle" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Routine estimate</Text>
          <Text style={styles.metricValue}>RM {Math.round(estimatedCostRm)}</Text>
          <Text style={styles.metricSub}>From Simulator</Text>
        </MiniCard>

        <View style={styles.metricDivider}>
          <Text style={styles.vsText}>vs</Text>
        </View>

        <MiniCard tone="subtle" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Actual bill</Text>
          <Text style={styles.metricValue}>RM {Math.round(actualCostRm)}</Text>
          <Text style={[styles.metricSub, isPositive ? styles.textOver : styles.textUnder]}>
            {isPositive ? `+RM ${Math.round(discrepancyRm)} diff` : `-RM ${Math.abs(Math.round(discrepancyRm))} saved`}
          </Text>
        </MiniCard>
      </View>

      {/* Gemini Personalized Conclusion Box */}
      <View
        style={[
          styles.conclusionBox,
          isMajor
            ? styles.conclusionBoxMajor
            : isMinor
            ? styles.conclusionBoxMinor
            : styles.conclusionBoxNormal,
        ]}
      >
        <View style={styles.conclusionHeader}>
          <StatusIcon size={17} color={iconColor} strokeWidth={2} />
          <Text style={[styles.conclusionTitle, { color: iconColor }]}>
            {isMajor ? 'Major Routine Discrepancy' : isMinor ? 'Minor Routine Variance' : 'Routine Calibrated'}
          </Text>
        </View>
        <Text style={styles.conclusionBody}>{conclusion}</Text>
      </View>

      {/* Profiled Culprits Pills (if any identified) */}
      {(culpritAppliances.length > 0 || culpritHabits.length > 0) && (
        <View style={styles.culpritsSection}>
          <Text style={styles.culpritsHeader}>DETECTED FROM YOUR PROFILE</Text>
          <View style={styles.pillsWrap}>
            {culpritAppliances.map((app, idx) => (
              <View key={`app-${idx}`} style={styles.pill}>
                <UtilityIcon size={13} color="#566549" strokeWidth={1.8} />
                <Text style={styles.pillText}>{app}</Text>
              </View>
            ))}
            {culpritHabits.map((habit, idx) => (
              <View key={`habit-${idx}`} style={[styles.pill, styles.pillHabit]}>
                <Sliders size={13} color="#8F5B14" strokeWidth={1.8} />
                <Text style={[styles.pillText, styles.pillHabitText]}>{habit}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Recommendation & Simulator Bridge */}
      {actionRecommendation ? (
        <View style={styles.recommendationBox}>
          <Text style={styles.recTitle}>RECOMMENDED ACTION</Text>
          <Text style={styles.recBody}>{actionRecommendation}</Text>
        </View>
      ) : null}

      {/* Button to navigate to Simulator */}
      <Pressable
        onPress={handleGoToSimulator}
        style={({ pressed }) => [styles.simulatorLinkButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Adjust routine in simulator"
      >
        <View style={styles.buttonInner}>
          <Sliders size={16} color="#FFFFFF" strokeWidth={1.8} />
          <Text style={styles.buttonText}>Adjust Routine in Simulator</Text>
        </View>
        <ChevronRight size={17} color="#FFFFFF" strokeWidth={2} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginBottom: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleNormal: {
    backgroundColor: '#E7EEE2',
  },
  iconCircleMinor: {
    backgroundColor: '#FDF1DF',
  },
  iconCircleMajor: {
    backgroundColor: '#FDECE8',
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
  },
  metricDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  vsText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#A8A29E',
  },
  metricLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11.5,
    color: '#78716C',
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: 'Lora_700Bold',
    fontSize: 20,
    color: '#292524',
  },
  metricSub: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
  },
  textOver: {
    color: '#8F5B14',
  },
  textUnder: {
    color: '#566549',
  },
  conclusionBox: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
  },
  conclusionBoxNormal: {
    backgroundColor: '#F1F5EE',
    borderLeftColor: '#566549',
  },
  conclusionBoxMinor: {
    backgroundColor: '#FAF3E7',
    borderLeftColor: '#8F5B14',
  },
  conclusionBoxMajor: {
    backgroundColor: '#FDF1EE',
    borderLeftColor: '#9E3A24',
  },
  conclusionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  conclusionTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12.5,
    letterSpacing: 0.3,
  },
  conclusionBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#292524',
  },
  culpritsSection: {
    marginBottom: 14,
  },
  culpritsHeader: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.6,
    color: '#78716C',
    marginBottom: 7,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF3EA',
    borderWidth: 1,
    borderColor: '#D4DEC9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillHabit: {
    backgroundColor: '#FAF3E7',
    borderColor: '#EBDCC3',
  },
  pillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#3B4832',
  },
  pillHabitText: {
    color: '#6E4815',
  },
  recommendationBox: {
    backgroundColor: '#FAF8F4',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFECE8',
  },
  recTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: '#78716C',
    marginBottom: 3,
  },
  recBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#44403C',
  },
  simulatorLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#566549',
    borderRadius: 999,
    minHeight: 46,
    paddingHorizontal: 16,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.82,
  },
});
