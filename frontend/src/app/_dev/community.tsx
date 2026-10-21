import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CommunityDashboard,
  CommunityLoading,
  CommunityStatus,
} from '@/features/community/components/CommunityDashboard';
import {
  COMMUNITY_DEV_FIXTURES,
  type CommunityDevFixtureName,
} from '@/features/community/devFixtures';

type GalleryState = CommunityDevFixtureName | 'loading' | 'error' | 'offline';

const STATES: GalleryState[] = [
  'ready-unvoted',
  'ready-voted',
  'empty',
  'last-month-unlocked',
  'loading',
  'error',
  'offline',
];

export default function CommunityDevGallery() {
  const [selected, setSelected] = useState<GalleryState>('ready-unvoted');

  if (!__DEV__) {
    return <SafeAreaView style={styles.safe}><Text>Dev Gallery is only available in development.</Text></SafeAreaView>;
  }

  const fixture = selected in COMMUNITY_DEV_FIXTURES
    ? COMMUNITY_DEV_FIXTURES[selected as CommunityDevFixtureName]
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Community states</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcher}>
        {STATES.map((name) => (
          <Pressable key={name} onPress={() => setSelected(name)} style={[styles.pill, selected === name && styles.pillActive]}>
            <Text style={[styles.pillText, selected === name && styles.pillTextActive]}>{name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {selected === 'loading' && <CommunityLoading />}
      {selected === 'error' && <CommunityStatus message="The local database did not respond." onRetry={() => setSelected('ready-unvoted')} />}
      {selected === 'offline' && <CommunityStatus offline message="Reconnect to load your household’s Community data." onRetry={() => setSelected('ready-unvoted')} />}
      {fixture && (
        <ScrollView contentContainerStyle={styles.content}>
          <CommunityDashboard state={fixture} onVote={() => undefined} onAction={() => undefined} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF6F1' },
  title: { fontFamily: 'Lora_600SemiBold', fontSize: 22, color: '#292524', paddingHorizontal: 20, paddingTop: 10 },
  switcher: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  pill: { minHeight: 42, borderRadius: 999, borderWidth: 1, borderColor: '#D6D3D1', backgroundColor: '#FFFFFF', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: '#566549', borderColor: '#566549' },
  pillText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#57534E' },
  pillTextActive: { color: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
});

