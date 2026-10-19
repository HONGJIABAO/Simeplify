import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';

interface BellPillProps {
  hasUnread?: boolean;
}

export function BellPill({ hasUnread = true }: BellPillProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      style={({ pressed }) => [
        styles.bellPill,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconContainer}>
        <Bell size={20} color="#57534e" strokeWidth={1.5} />
        {hasUnread && <View style={styles.unreadDot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bellPill: {
    width: 76,
    height: 48,
    borderRadius: 9999,
    backgroundColor: '#faf6f1',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: '#f5f5f4',
    transform: [{ translateY: 2 }],
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#a97a4a', // tan-600
  },
});
