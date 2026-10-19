import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Button, type ButtonVariant } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

function LeafIllustration() {
  return (
    <View style={styles.illustrationContainer}>
      <Svg width={96} height={96} viewBox="0 0 96 96" fill="none">
        {/* Soft Organic Blob Background */}
        <Path
          d="M24 48C20 28 40 16 60 22C80 28 88 48 76 68C64 88 32 84 22 72C14 62 26 56 24 48Z"
          fill="#e0e6d9" // sage-100
        />
        {/* Secondary Warm Petal */}
        <Path
          d="M34 60C30 42 48 30 64 36C80 42 82 58 72 70C62 82 38 74 34 60Z"
          fill="#f6e8d8" // tan-100
        />
        {/* Sprout Stem and Leaves */}
        <Path
          d="M48 70C48 54 48 40 48 32M48 46C56 42 62 46 64 48M48 40C40 34 34 38 32 40"
          stroke="#566549" // sage-600
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={48} cy={30} r={3} fill="#566549" />
      </Svg>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'accent',
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <LeafIllustration />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <View style={styles.actionContainer}>
          <Button variant={actionVariant} onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524', // stone-800
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e', // stone-600
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  actionContainer: {
    marginTop: 20,
  },
});
