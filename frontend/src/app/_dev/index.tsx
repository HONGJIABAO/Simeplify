import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';

const SCREENS = [
  { id: 'S1', title: 'Login', route: '/(auth)/login', status: 'Ready' },
  { id: 'S2', title: 'Sign Up', route: '/(auth)/sign-up', status: 'coming soon' },
  { id: 'S3.1', title: 'Onboarding: Schedule', route: '/(onboarding)/schedule', status: 'coming soon' },
  { id: 'S3.2', title: 'Onboarding: Layout', route: '/(onboarding)/layout', status: 'coming soon' },
  { id: 'S3.3', title: 'Onboarding: Appliances', route: '/(onboarding)/appliances', status: 'coming soon' },
  { id: 'S4', title: 'Simulator', route: '/(tabs)/simulator', status: 'Tab placeholder' },
  { id: 'S5.1', title: 'Bin: Home', route: '/(tabs)/bin', status: 'Ready' },
  { id: 'S5.2a', title: 'Bin: Camera Scanner (Ready)', route: '/bin/scanner', status: 'Ready' },
  { id: 'S5.2b', title: 'Bin: Camera (Permission Denied)', route: '/bin/scanner?state=permission-denied', status: 'Ready' },
  { id: 'S5.2c', title: 'Bin: Camera (Scanning Spinner)', route: '/bin/scanner?state=scanning', status: 'Ready' },
  { id: 'S5.2d', title: 'Bin: Gallery Upload', route: '/bin/upload', status: 'Ready' },
  { id: 'S5.3a', title: 'Bin: Result - Paper (+10 pts)', route: '/bin/result?binType=paper', status: 'Ready' },
  { id: 'S5.3b', title: 'Bin: Result - Plastic (+10 pts)', route: '/bin/result?binType=plastic', status: 'Ready' },
  { id: 'S5.3c', title: 'Bin: Result - Glass & Metal (+10 pts)', route: '/bin/result?binType=glass_metal', status: 'Ready' },
  { id: 'S5.3d', title: 'Bin: Result - General Waste (0 pts)', route: '/bin/result?binType=general', status: 'Ready' },
  { id: 'S5.3e', title: 'Bin: Result - Daily Limit Reached', route: '/bin/result?binType=paper&state=daily-limit', status: 'Ready' },
  { id: 'S5.3f', title: 'Bin: Result - Low Confidence', route: '/bin/result?state=low-confidence', status: 'Ready' },
  { id: 'S5.3g', title: 'Bin: Result - AI Error', route: '/bin/result?state=error', status: 'Ready' },
  { id: 'S5.3h', title: 'Bin: Result - Loading Spinner', route: '/bin/result?state=loading', status: 'Ready' },
  { id: 'S6', title: 'Community', route: '/(tabs)/community', status: 'Tab placeholder' },
  { id: 'S7', title: 'Scanner', route: '/(tabs)/scanner', status: 'Tab placeholder' },
  { id: 'S8', title: 'Profile: Home', route: '/(tabs)/profile', status: 'Ready' },
  { id: 'S8a', title: 'Profile: Resident Sheet (At home)', route: '/(tabs)/profile?sheet=at-home', status: 'Ready' },
  { id: 'S8b', title: 'Profile: Resident Sheet (Out)', route: '/(tabs)/profile?sheet=out', status: 'Ready' },
  { id: 'S9', title: 'Notifications', route: '/notifications', status: 'Placeholder' },
];

export default function DevGalleryScreen() {
  const router = useRouter();

  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Dev Gallery is only available in development.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#292524" strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.title}>Dev Screen Gallery</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollList}>
        <Pressable
          onPress={() => router.push('/_dev/components')}
          style={({ pressed }) => [
            styles.componentGalleryBanner,
            pressed && styles.screenRowPressed,
          ]}
        >
          <View>
            <Text style={styles.componentGalleryTitle}>🎨 UI Component Gallery</Text>
            <Text style={styles.componentGallerySubtitle}>
              Interactive showcase of all Stage 1 shared design system components
            </Text>
          </View>
          <ChevronRight size={20} color="#566549" strokeWidth={1.5} />
        </Pressable>

        <Text style={styles.subtitle}>Direct links to screens and states</Text>

        {SCREENS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => [
              styles.screenRow,
              pressed && styles.screenRowPressed,
            ]}
          >
            <View style={styles.screenInfo}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.id}</Text>
              </View>
              <View>
                <Text style={styles.screenTitle}>{item.title}</Text>
                <Text style={styles.screenRoute}>{item.route}</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text
                style={[
                  styles.statusText,
                  item.status === 'coming soon' && styles.statusComingSoon,
                ]}
              >
                {item.status}
              </Text>
              <ChevronRight size={18} color="#a8a29e" strokeWidth={1.5} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
  },
  placeholder: {
    width: 48,
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
    marginBottom: 16,
  },
  componentGalleryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0e6d9', // sage-100
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c5d0b9',
    padding: 16,
    marginBottom: 20,
  },
  componentGalleryTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#292524',
    marginBottom: 2,
  },
  componentGallerySubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#566549',
    maxWidth: 280,
  },
  scrollList: {
    paddingBottom: 40,
  },
  screenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 16,
    marginBottom: 10,
  },
  screenRowPressed: {
    backgroundColor: '#f5f5f4',
    transform: [{ translateY: 2 }],
  },
  screenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: '#e0e6d9',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#566549',
  },
  screenTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  screenRoute: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#566549',
  },
  statusComingSoon: {
    color: '#a8a29e',
  },
});
