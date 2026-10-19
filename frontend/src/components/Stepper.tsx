import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  style?: StyleProp<ViewStyle>;
}

export function Stepper({
  value,
  min = 0,
  max = 99,
  step = 1,
  onChange,
  label,
  unit,
  style,
}: StepperProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  const handleDecrease = () => {
    if (canDecrease) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrease = () => {
    if (canIncrease) {
      onChange(Math.min(max, value + step));
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.controlRow}>
        <Pressable
          onPress={handleDecrease}
          disabled={!canDecrease}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label || 'value'}`}
          style={({ pressed }) => [
            styles.button,
            !canDecrease && styles.buttonDisabled,
            pressed && canDecrease && styles.buttonPressed,
          ]}
        >
          <Minus
            size={20}
            color={canDecrease ? '#292524' : '#a8a29e'}
            strokeWidth={1.75}
          />
        </Pressable>

        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>{value}</Text>
          {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
        </View>

        <Pressable
          onPress={handleIncrease}
          disabled={!canIncrease}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label || 'value'}`}
          style={({ pressed }) => [
            styles.button,
            !canIncrease && styles.buttonDisabled,
            pressed && canIncrease && styles.buttonPressed,
          ]}
        >
          <Plus
            size={20}
            color={canIncrease ? '#292524' : '#a8a29e'}
            strokeWidth={1.75}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#57534e', // stone-600
    marginBottom: 8,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 9999, // rounded-full 48x48
    backgroundColor: '#ffffff', // paper
    borderWidth: 1,
    borderColor: '#e7e5e4', // stone-200
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonDisabled: {
    backgroundColor: '#f5f5f4', // stone-100
    borderColor: '#e7e5e4',
    opacity: 0.6,
  },
  buttonPressed: {
    backgroundColor: '#e0e6d9', // sage-100
    transform: [{ translateY: 2 }],
  },
  valueContainer: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 24,
    color: '#292524', // stone-800
  },
  unitText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e', // stone-400
    marginTop: 2,
  },
});
