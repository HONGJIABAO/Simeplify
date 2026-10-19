import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';

export type BadgeTone = 'sage' | 'tan' | 'stone' | 'amber' | 'error';

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export function Badge({
  tone = 'sage',
  icon,
  children,
  style,
  textStyle,
  accessibilityLabel,
}: BadgeProps) {
  const toneStyle = styles[tone] || styles.sage;
  const toneTextStyle = textStyles[tone] || textStyles.sage;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.badge, toneStyle, style]}
    >
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      {typeof children === 'string' ? (
        <Text style={[styles.text, toneTextStyle, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    alignSelf: 'flex-start',
    gap: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sage: {
    backgroundColor: '#e0e6d9', // sage-100
  },
  tan: {
    backgroundColor: '#f6e8d8', // tan-100
  },
  stone: {
    backgroundColor: '#f5f5f4', // stone-100
  },
  amber: {
    backgroundColor: '#fffbeb', // amber-50
  },
  error: {
    backgroundColor: '#fbece8', // error bg
  },
  text: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
  },
});

const textStyles = StyleSheet.create({
  sage: {
    color: '#566549', // sage-600
  },
  tan: {
    color: '#a97a4a', // tan-600
  },
  stone: {
    color: '#57534e', // stone-600
  },
  amber: {
    color: '#92600e', // amber warning text
  },
  error: {
    color: '#a8442f', // terracotta error text
  },
});
