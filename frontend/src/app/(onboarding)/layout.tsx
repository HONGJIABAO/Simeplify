import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LayoutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>House Layout</Text>
      <Text style={styles.subtitle}>Onboarding Step 2 — coming soon</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 28,
    color: '#292524',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
  },
});
