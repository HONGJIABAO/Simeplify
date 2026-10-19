/**
 * PRO-01 – Profile Screen
 *
 * Requirements:
 *   1. Full-body standing avatar matching the user-provided reference (Snapchat/Bitmoji style).
 *   2. Displays either avatar_boy.png or avatar_girl.png based on the selected gender.
 *   3. Below the avatar: ONLY Name and Address.
 *   4. Logout button: clears mock session and routes back to login.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, LogOut } from 'lucide-react-native';

import { Header } from '@/components/Header';
import { useAuthSession, UserGender } from '@/lib/authSession';

const BOY_AVATAR = require('../../../assets/sprites/avatar_boy.png');
const GIRL_AVATAR = require('../../../assets/sprites/avatar_girl.png');

export interface ProfileScreenProps {
  /** Optional gender override for Dev Gallery previews */
  initialGender?: UserGender;
}

export default function ProfileScreen({ initialGender }: ProfileScreenProps) {
  const router = useRouter();
  const { session, logout } = useAuthSession();

  // Determine active gender: prop override (for dev gallery) or session state
  const activeGender: UserGender = initialGender || session.gender || 'girl';
  const avatarSource = activeGender === 'boy' ? BOY_AVATAR : GIRL_AVATAR;

  const handleLogOut = () => {
    // Clear the mock session and route to login
    logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Bell-only header at top right */}
      <Header variant="bell-only" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-Body Avatar Showcase Card */}
        <View style={styles.showcaseCard}>
          {/* Full-body standing character */}
          <View style={styles.characterContainer}>
            <Image
              source={avatarSource}
              style={styles.fullBodyAvatar}
              resizeMode="contain"
              accessibilityLabel={`${activeGender} full body avatar`}
            />
          </View>

          {/* Below avatar: ONLY Name and Address */}
          <Text style={styles.nameText}>{session.name || 'Mei Ling Tan'}</Text>

          <View style={styles.addressContainer}>
            <MapPin size={18} color="#566549" strokeWidth={1.8} style={styles.pinIcon} />
            <Text style={styles.addressText}>
              {session.addressDisplay || '18, Jalan SS 2/6, Petaling Jaya, Selangor'}
            </Text>
          </View>
        </View>

        {/* Full-width Logout Button */}
        <Pressable
          onPress={handleLogOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={({ pressed }) => [
            styles.logOutButton,
            pressed && styles.logOutButtonPressed,
          ]}
        >
          <LogOut size={18} color="#292524" strokeWidth={1.5} />
          <Text style={styles.logOutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf6f1', // cream background
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 112, // clear floating tab bar
    alignItems: 'center',
    gap: 16,
  },

  // Showcase Card
  showcaseCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },

  // Full Body Character Display
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 330,
    marginBottom: 16,
  },
  fullBodyAvatar: {
    width: 200,
    height: 330,
  },

  // Name
  nameText: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 28,
    color: '#292524',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },

  // Address
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f4ee',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    maxWidth: '100%',
    gap: 8,
  },
  pinIcon: {
    flexShrink: 0,
  },
  addressText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 14,
    color: '#57534e',
    textAlign: 'center',
    flexShrink: 1,
  },

  // Logout Button
  logOutButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#f7f4ee',
    borderWidth: 1,
    borderColor: '#eae5dc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logOutButtonPressed: {
    backgroundColor: '#ebe5db',
  },
  logOutText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
});
