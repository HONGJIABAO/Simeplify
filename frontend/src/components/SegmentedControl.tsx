import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

export interface SegmentOption<T extends string = string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string = string>({
  options,
  selectedValue,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.track, style]}>
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            style={[
              styles.segment,
              isSelected ? styles.segmentSelected : styles.segmentUnselected,
            ]}
          >
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelSelected : styles.labelUnselected,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f4', // stone-100 track
    borderRadius: 9999, // rounded-full
    padding: 4,
    borderWidth: 1,
    borderColor: '#e7e5e4', // stone-200
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999,
    minHeight: 36,
  },
  segmentSelected: {
    backgroundColor: '#ffffff', // paper white selected pill
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentUnselected: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 13,
  },
  labelSelected: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524', // stone-800
  },
  labelUnselected: {
    fontFamily: 'SourceSans3_400Regular',
    color: '#57534e', // stone-600
  },
});
