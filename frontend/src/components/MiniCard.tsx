import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

export type MiniCardTone = 'default' | 'warm' | 'subtle';

export interface MiniCardProps {
  tone?: MiniCardTone;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function MiniCard({
  tone = 'default',
  children,
  style,
}: MiniCardProps) {
  return (
    <View
      style={[
        styles.miniCard,
        tone === 'warm'
          ? styles.warm
          : tone === 'subtle'
          ? styles.subtle
          : styles.default,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  miniCard: {
    borderRadius: 20, // rounded-[1.25rem]
    padding: 16, // p-4
    borderWidth: 1,
    // Note: MiniCards explicitly have NO shadow per design.md Unit 11
  },
  default: {
    backgroundColor: '#ffffff', // paper
    borderColor: '#e7e5e4', // stone-200
  },
  warm: {
    backgroundColor: '#f6e8d8', // tan-100
    borderColor: '#e6c39b', // tan-300
  },
  subtle: {
    backgroundColor: '#f5f5f4', // stone-100
    borderColor: '#e7e5e4', // stone-200
  },
});
