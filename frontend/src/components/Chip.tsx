import React from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Check } from 'lucide-react-native';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: ChipProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipDefault,
        disabled && styles.chipDisabled,
        pressed && !disabled && styles.chipPressed,
        style,
      ]}
    >
      {selected ? (
        <View style={styles.iconContainer}>
          <Check size={14} color="#566549" strokeWidth={2} />
        </View>
      ) : icon ? (
        <View style={styles.iconContainer}>{icon}</View>
      ) : null}

      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : styles.labelDefault,
          disabled && styles.labelDisabled,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  chipDefault: {
    backgroundColor: '#ffffff', // paper
    borderColor: '#e7e5e4', // stone-200
  },
  chipSelected: {
    backgroundColor: '#e0e6d9', // sage-100
    borderColor: '#8b9d77', // sage-400
  },
  chipDisabled: {
    backgroundColor: '#f5f5f4', // stone-100
    borderColor: '#e7e5e4',
    opacity: 0.6,
  },
  chipPressed: {
    backgroundColor: '#f5f5f4',
    transform: [{ translateY: 2 }],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
  },
  labelDefault: {
    color: '#57534e', // stone-600
  },
  labelSelected: {
    color: '#566549', // sage-600
  },
  labelDisabled: {
    color: '#a8a29e', // stone-400
  },
});
