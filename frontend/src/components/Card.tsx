import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

export type CardVariant = 'default' | 'highlight';

export interface CardProps {
  variant?: CardVariant;
  hasShadow?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  variant = 'default',
  hasShadow = false,
  children,
  style,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'highlight' ? styles.highlight : styles.default,
        hasShadow && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 32, // rounded-[2rem]
    padding: 24, // p-6
    borderWidth: 1,
  },
  default: {
    backgroundColor: '#faf6f1', // cream
    borderColor: '#e7e5e4', // stone-200
  },
  highlight: {
    backgroundColor: '#f6e8d8', // tan-100
    borderColor: '#e6c39b', // tan-300
  },
  shadow: {
    shadowColor: '#5c4033', // brown shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
});
