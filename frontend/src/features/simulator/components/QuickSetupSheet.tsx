/**
 * SIM-07
 * Quick Setup 4-card onboarding flow for My Day.
 * Source: docs/page_refined.md S4.6, docs/design.md Unit 12 §5.
 *
 * Cards:
 * 1. Sleep & wake time
 * 2. Sleeping aircon (No, All night, ~3 hours, ~5 hours)
 * 3. Evening in the living room (TV, AC, fan)
 * 4. Showers per person per day (with water heater)
 *
 * Rules:
 * - Each card shows bill change line: "Bill: RM 260 → RM 235".
 * - Buttons: "Skip" (Secondary) and "Next" (Primary); last card has "Done" (Accent).
 * - Full-height BottomSheet.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ArrowRight, Moon, Wind, Tv, ShowerHead } from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Stepper } from '@/components/Stepper';

interface QuickSetupSheetProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function QuickSetupSheet({
  visible,
  onClose,
  onComplete,
}: QuickSetupSheetProps) {
  const [step, setStep] = useState(0);

  // Card answers
  const [sleepAircon, setSleepAircon] = useState<'no' | 'all_night' | '3_hours' | '5_hours'>('all_night');
  const [eveningTv, setEveningTv] = useState(true);
  const [eveningAc, setEveningAc] = useState(true);
  const [showersPerDay, setShowersPerDay] = useState(2);

  const CARDS = [
    {
      title: 'When do you sleep and wake?',
      icon: <Moon size={28} color="#5c4033" strokeWidth={1.5} />,
      billBefore: 'RM 260',
      billAfter: 'RM 245',
      content: (
        <View style={styles.cardBody}>
          <Text style={styles.subtext}>
            Standard schedule: 23:00 – 06:30. Setting this turns off daytime appliances automatically while resting.
          </Text>
          <View style={styles.timePillRow}>
            <View style={styles.timePill}>
              <Text style={styles.timePillLabel}>Sleep</Text>
              <Text style={styles.timePillVal}>23:00</Text>
            </View>
            <View style={styles.timePill}>
              <Text style={styles.timePillLabel}>Wake</Text>
              <Text style={styles.timePillVal}>06:30</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: 'Do you run bedroom AC while sleeping?',
      icon: <Wind size={28} color="#5c4033" strokeWidth={1.5} />,
      billBefore: 'RM 245',
      billAfter: sleepAircon === 'no' ? 'RM 195' : sleepAircon === '3_hours' ? 'RM 215' : 'RM 235',
      content: (
        <View style={styles.cardBody}>
          <Text style={styles.subtext}>
            Air conditioning is the biggest electricity cost in most homes.
          </Text>
          <View style={styles.optionsCol}>
            {[
              { id: 'no' as const, label: 'No, fan only' },
              { id: '3_hours' as const, label: 'About 3 hours (timer)' },
              { id: '5_hours' as const, label: 'About 5 hours' },
              { id: 'all_night' as const, label: 'All night' },
            ].map((opt) => (
              <Pressable
                key={opt.id}
                style={[
                  styles.optionPill,
                  sleepAircon === opt.id && styles.optionPillActive,
                ]}
                onPress={() => setSleepAircon(opt.id)}
              >
                <Text
                  style={[
                    styles.optionPillText,
                    sleepAircon === opt.id && styles.optionPillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ),
    },
    {
      title: 'Evening routine in the living room?',
      icon: <Tv size={28} color="#5c4033" strokeWidth={1.5} />,
      billBefore: 'RM 235',
      billAfter: 'RM 228',
      content: (
        <View style={styles.cardBody}>
          <Text style={styles.subtext}>
            Choose typical habits between 20:00 and 23:00.
          </Text>
          <View style={styles.optionsCol}>
            <Pressable
              style={[styles.optionPill, eveningTv && styles.optionPillActive]}
              onPress={() => setEveningTv((v) => !v)}
            >
              <Text style={[styles.optionPillText, eveningTv && styles.optionPillTextActive]}>
                {eveningTv ? '✓ Watching TV (active)' : 'Watching TV (off)'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.optionPill, eveningAc && styles.optionPillActive]}
              onPress={() => setEveningAc((v) => !v)}
            >
              <Text style={[styles.optionPillText, eveningAc && styles.optionPillTextActive]}>
                {eveningAc ? '✓ Living room AC (active)' : 'Living room AC (off)'}
              </Text>
            </Pressable>
          </View>
        </View>
      ),
    },
    {
      title: 'Showers per person per day?',
      icon: <ShowerHead size={28} color="#5c4033" strokeWidth={1.5} />,
      billBefore: 'RM 228',
      billAfter: 'RM 218',
      content: (
        <View style={styles.cardBody}>
          <Text style={styles.subtext}>
            Water heaters consume substantial wattage during shower duration.
          </Text>
          <View style={styles.stepperContainer}>
            <Text style={styles.stepperLabel}>Showers per resident:</Text>
            <Stepper
              value={showersPerDay}
              min={1}
              max={4}
              step={1}
              onChange={setShowersPerDay}
            />
          </View>
        </View>
      ),
    },
  ];

  const current = CARDS[step];
  const isLast = step === CARDS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      onComplete();
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Quick Setup"
      height="88%"
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {CARDS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step ? styles.dotActive : i < step ? styles.dotDone : null,
              ]}
            />
          ))}
        </View>

        {/* Card header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>{current.icon}</View>
          <Text style={styles.questionTitle}>{current.title}</Text>
        </View>

        {/* Dynamic bill change line */}
        <View style={styles.billChangeRow}>
          <Text style={styles.billChangeLabel}>Bill impact: </Text>
          <Text style={styles.billBefore}>{current.billBefore}</Text>
          <ArrowRight size={14} color="#566549" strokeWidth={1.5} style={{ marginHorizontal: 4 }} />
          <Text style={styles.billAfter}>{current.billAfter}</Text>
        </View>

        {/* Card interactive content */}
        {current.content}

        {/* Bottom Actions */}
        <View style={styles.footerActions}>
          <Button
            variant="secondary"
            onPress={handleSkip}
            style={styles.actionBtn}
          >
            Skip
          </Button>
          <Button
            variant={isLast ? 'accent' : 'primary'}
            onPress={handleNext}
            style={styles.actionBtn}
          >
            {isLast ? 'Done' : 'Next'}
          </Button>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e7e5e4', // stone-200
  },
  dotActive: {
    width: 24,
    backgroundColor: '#8b9d77', // sage-400
  },
  dotDone: {
    backgroundColor: '#566549', // sage-600
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f6e8d8', // tan-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
    textAlign: 'center',
  },
  billChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e6d9', // sage-100
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  billChangeLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
  },
  billBefore: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 14,
    color: '#57534e',
  },
  billAfter: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 14,
    color: '#566549', // sage-600
  },
  cardBody: {
    gap: 12,
  },
  subtext: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 20,
  },
  timePillRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  timePill: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  timePillLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
  },
  timePillVal: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
    marginTop: 2,
  },
  optionsCol: {
    gap: 10,
  },
  optionPill: {
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  optionPillActive: {
    backgroundColor: '#e0e6d9', // sage-100
    borderColor: '#8b9d77', // sage-400
  },
  optionPillText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
  },
  optionPillTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  stepperContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
  },
});
