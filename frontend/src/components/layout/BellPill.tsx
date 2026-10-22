import React from 'react';
import { Pressable, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';

interface BellPillProps {
  hasUnread?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function BellPill({ hasUnread = true, onPress, style }: BellPillProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/notifications');
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      style={({ pressed }) => [
        styles.bellPill,
        pressed && styles.pressed,
        style,
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
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
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
