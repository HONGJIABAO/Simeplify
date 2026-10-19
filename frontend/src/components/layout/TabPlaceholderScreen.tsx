import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BellPill } from './BellPill';

interface TabPlaceholderScreenProps {
  title: string;
}

export function TabPlaceholderScreen({ title }: TabPlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <View style={styles.spacer} />
        <BellPill hasUnread={true} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1',
    paddingHorizontal: 24, // px-6
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
    paddingBottom: 16,
  },
  spacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 96, // keep space above floating tab bar
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 28,
    color: '#292524', // stone-800
    letterSpacing: -0.5,
  },
});
