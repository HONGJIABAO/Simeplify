/**
 * SIM-02, SIM-03
 * Suggestion area docked at the bottom of the simulator (above the tab bar, no scrim).
 * Source: docs/screenshot/simulator/simulator_suggestion.png, docs/page_refined.md S4.4, docs/design.md Unit 12 §4.
 *
 * States:
 * 1. idle: slim row with Secondary "My day" button.
 * 2. first-time: prompt to set up routine ("Start" / "Later").
 * 3. swap-and-compare: "Energy optimization suggestions" with horizontal scrolling mini cards,
 *    each with Try / Undo button.
 * 4. solar: automatic rooftop solar suggestion when bill >= RM 500.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Sun,
  CalendarCheck,
} from 'lucide-react-native';
import { Sprite } from './Sprite';
import { Button } from '@/components/Button';
import { SwapSuggestion } from '../logic/swapLogic';

export type SuggestionMode = 'idle' | 'first-time' | 'swap' | 'solar';

interface SuggestionAreaProps {
  mode: SuggestionMode;
  suggestions: SwapSuggestion[];
  activeSwapIds: Set<string>;
  onToggleSwap: (suggestion: SwapSuggestion) => void;
  onOpenMyDay: () => void;
  onFirstTimeStart: () => void;
  onFirstTimeDismiss: () => void;
  onSolarDismiss: () => void;
  onSolarSeeHow: () => void;
}

function getApplianceIcon(label: string) {
  const type = /AC|Air/i.test(label) ? 'air_conditioner' : /Fridge/i.test(label) ? 'refrigerator' : /LED|Light/i.test(label) ? 'lights' : /Heater/i.test(label) ? 'water_heater' : 'tv';
  return <Sprite type={type} size={40} />;
}

export function SuggestionArea({
  mode,
  suggestions,
  activeSwapIds,
  onToggleSwap,
  onOpenMyDay,
  onFirstTimeStart,
  onFirstTimeDismiss,
  onSolarDismiss,
  onSolarSeeHow,
}: SuggestionAreaProps) {
  // ── 1. Idle mode ──────────────────────────────────────────────────────────
  if (mode === 'idle') {
    return (
      <View style={styles.idleRow}>
        <Button
          variant="secondary"
          onPress={onOpenMyDay}
          leftIcon={<CalendarCheck size={18} color="#57534e" strokeWidth={1.5} />}
          style={styles.idleMyDayBtn}
        >
          My day
        </Button>
      </View>
    );
  }

  // ── 2. First-time prompt ─────────────────────────────────────────────────
  if (mode === 'first-time') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personalize your routine</Text>
        <Text style={styles.cardBody}>
          Answer a few quick questions to make your bill more accurate.
        </Text>
        <View style={styles.buttonRow}>
          <Button
            variant="accent"
            onPress={onFirstTimeStart}
            style={styles.flexBtn}
          >
            Start
          </Button>
          <Button
            variant="secondary"
            onPress={onFirstTimeDismiss}
            style={styles.flexBtn}
          >
            Later
          </Button>
        </View>
      </View>
    );
  }

  // ── 3. Solar panel suggestion ────────────────────────────────────────────
  if (mode === 'solar') {
    return (
      <View style={styles.card}>
        <View style={styles.solarHeader}>
          <View style={styles.sunIconCircle}>
            <Sun size={24} color="#d4a373" strokeWidth={1.5} />
          </View>
          <View style={styles.solarHeaderText}>
            <Text style={styles.cardTitle}>Rooftop solar suggestion</Text>
            <Text style={styles.solarSavingsText}>Save up to 40% on your bill</Text>
          </View>
        </View>
        <Text style={styles.cardBody}>
          Homes with bills over RM 500 can save significantly with residential solar.
        </Text>
        <View style={styles.buttonRow}>
          <Button
            variant="accent"
            onPress={onSolarSeeHow}
            style={styles.flexBtn}
          >
            See how
          </Button>
          <Button
            variant="secondary"
            onPress={onSolarDismiss}
            style={styles.flexBtn}
          >
            Later
          </Button>
        </View>
      </View>
    );
  }

  // ── 4. Swap & Compare ────────────────────────────────────────────────────
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Energy optimization suggestions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionList}
      >
        {suggestions.map((item) => {
          const isApplied = activeSwapIds.has(item.id);
          return (
            <View key={item.id} style={styles.miniCard}>
              <View style={styles.applianceIconBox}>
                {getApplianceIcon(item.label)}
              </View>
              <Text style={styles.applianceLabel} numberOfLines={2}>
                {item.label}
              </Text>
              <Text style={styles.savingText}>
                Save RM {item.monthlySavingRm}/mo
              </Text>
              <Button
                variant={isApplied ? 'secondary' : 'accent'}
                onPress={() => onToggleSwap(item)}
                style={styles.tryButton}
              >
                {isApplied ? 'Undo' : 'Try'}
              </Button>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Idle row
  idleRow: {
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleMyDayBtn: {
    minHeight: 44,
    paddingHorizontal: 20,
  },

  // Docked Card
  card: {
    backgroundColor: '#f6e8d8', // tan-100
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e6c39b', // tan-300
    padding: 16,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
    marginBottom: 6,
  },
  cardBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
    marginBottom: 12,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexBtn: {
    flex: 1,
  },

  // Solar header
  solarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sunIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  solarHeaderText: {
    flex: 1,
  },
  solarSavingsText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#566549', // sage-600
  },

  // Swap horizontal scroll
  suggestionList: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  miniCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 12,
    alignItems: 'center',
  },
  applianceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f6e8d8', // tan-100
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  applianceLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
    textAlign: 'center',
    minHeight: 36,
  },
  savingText: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 12,
    color: '#566549', // sage-600
    marginBottom: 8,
  },
  tryButton: {
    width: '100%',
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
