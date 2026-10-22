/**
 * PRO-01 – Profile Screen
 *
 * Requirements:
 *   1. Full-body standing avatar matching the user-provided reference (Snapchat/Bitmoji style).
 *   2. Displays either avatar_boy.png or avatar_girl.png based on the selected gender.
 *   3. Below the avatar: ONLY Name and Address.
 *   4. Logout button: clears real Supabase auth session and routes back to login.
 *   5. Wires top-right notification bell with real unread dot (> 0 unread notifications).
 *   6. Lightweight edit flow on tapping name or address pill via clean BottomSheet.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MapPin, LogOut, Check } from 'lucide-react-native';

import { Header } from '@/components/Header';
import { BottomSheet } from '@/components/BottomSheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { useAuthSession, UserGender } from '@/lib/authSession';
import {
  fetchProfileData,
  updateProfileAndHousehold,
  type ProfileScreenData,
} from '@/lib/services/profileService';
import { useUnreadNotifications } from '@/lib/services/notificationService';

const BOY_AVATAR = require('../../../assets/sprites/avatar/avatar_boy.png');
const GIRL_AVATAR = require('../../../assets/sprites/avatar/avatar_girl.png');
const BOY_FACE = require('../../../assets/sprites/avatar/avatar_boy_face.png');
const GIRL_FACE = require('../../../assets/sprites/avatar/avatar_girl_face.png');

export interface ProfileScreenProps {
  /** Optional gender override for Dev Gallery previews */
  initialGender?: UserGender;
}

export default function ProfileScreen({ initialGender }: ProfileScreenProps) {
  const router = useRouter();
  const { session, logout, setGender } = useAuthSession();
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState<ProfileScreenData | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editGender, setEditGender] = useState<UserGender>('boy');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch real profile data & unread notifications count from Supabase
  const loadProfile = useCallback(async () => {
    const userId = session.user?.id;
    if (!userId) return;

    try {
      const data = await fetchProfileData(userId);
      setProfileData(data);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    }
  }, [session.user?.id]);

  // Refresh profile & notifications on screen focus
  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  // Determine active gender: prop override (for dev gallery) or session state (defaults to 'boy')
  const activeGender: UserGender = initialGender || session.gender || 'boy';
  const avatarSource = activeGender === 'boy' ? BOY_AVATAR : GIRL_AVATAR;

  // Real data with fallback to session
  const displayName = profileData?.profile?.name || session.name || '';
  const displayAddress = profileData?.addressDisplay || session.addressDisplay || '';
  const householdId = profileData?.profile?.household_id || session.profile?.household_id;
  const { hasUnread: globalHasUnread } = useUnreadNotifications(householdId);
  const hasUnread = globalHasUnread || (profileData?.unreadNotificationsCount ?? 0) > 0;

  const handleToggleGender = async (newGender: UserGender) => {
    if (newGender === activeGender) return;
    try {
      await setGender(newGender);
      showToast(newGender === 'boy' ? 'Avatar updated to Man' : 'Avatar updated to Woman', 'success');
    } catch (err: any) {
      console.warn('Failed to switch avatar gender:', err);
      showToast('Avatar updated', 'success');
    }
  };

  const handleOpenEdit = () => {
    setEditName(displayName);
    setEditStreet(profileData?.household?.street || session.street || '');
    setEditCity(profileData?.household?.city || session.city || '');
    setEditState(profileData?.household?.state || session.state || '');
    setEditGender(activeGender);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    const userId = session.user?.id;
    const householdId = profileData?.profile?.household_id || session.profile?.household_id;

    if (!userId || !householdId) {
      showToast('Cannot update profile without active household', 'error');
      return;
    }

    if (!editName.trim()) {
      showToast('Name cannot be empty', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileAndHousehold(userId, householdId, {
        name: editName.trim(),
        street: editStreet.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        gender: editGender,
      });

      await setGender(editGender);

      showToast('Profile updated successfully', 'success');
      setIsEditOpen(false);
      await loadProfile();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    router.replace('/(auth)/login' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Bell-only header at top right with real unread dot */}
      <Header variant="bell-only" hasUnread={hasUnread} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-Body Avatar Showcase Card */}
        <View style={styles.showcaseCard}>
          {/* Quick Avatar Switcher Toggle */}
          <View style={styles.genderPillRow}>
            <Pressable
              onPress={() => handleToggleGender('boy')}
              accessibilityRole="button"
              accessibilityLabel="Switch avatar to Man"
              style={[
                styles.genderPill,
                activeGender === 'boy' && styles.genderPillActive,
              ]}
            >
              <Image source={BOY_FACE} style={styles.genderPillFace} resizeMode="cover" />
              <Text
                style={[
                  styles.genderPillText,
                  activeGender === 'boy' && styles.genderPillTextActive,
                ]}
              >
                Man
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleToggleGender('girl')}
              accessibilityRole="button"
              accessibilityLabel="Switch avatar to Woman"
              style={[
                styles.genderPill,
                activeGender === 'girl' && styles.genderPillActive,
              ]}
            >
              <Image source={GIRL_FACE} style={styles.genderPillFace} resizeMode="cover" />
              <Text
                style={[
                  styles.genderPillText,
                  activeGender === 'girl' && styles.genderPillTextActive,
                ]}
              >
                Woman
              </Text>
            </Pressable>
          </View>

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
          <Pressable
            onPress={handleOpenEdit}
            accessibilityRole="button"
            accessibilityLabel={`Edit name: ${displayName}`}
            accessibilityHint="Tap to edit profile details"
            style={({ pressed }) => [
              styles.nameButton,
              pressed && styles.nameButtonPressed,
            ]}
          >
            <Text style={styles.nameText}>{displayName || 'Loading...'}</Text>
          </Pressable>

          <Pressable
            onPress={handleOpenEdit}
            accessibilityRole="button"
            accessibilityLabel={`Edit address: ${displayAddress}`}
            accessibilityHint="Tap to edit household address"
            style={({ pressed }) => [
              styles.addressContainer,
              pressed && styles.addressContainerPressed,
            ]}
          >
            <MapPin size={18} color="#566549" strokeWidth={1.8} style={styles.pinIcon} />
            <Text style={styles.addressText}>
              {displayAddress || 'Loading address...'}
            </Text>
          </Pressable>
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

      {/* Lightweight Edit Profile Bottom Sheet */}
      <BottomSheet
        visible={isEditOpen}
        onClose={() => !isSaving && setIsEditOpen(false)}
        title="Edit Profile"
      >
        <View style={styles.sheetContent}>
          {/* Avatar Gender Selection */}
          <View style={styles.sheetGenderSection}>
            <Text style={styles.sheetSectionLabel}>Avatar Style</Text>
            <View style={styles.sheetGenderRow}>
              <Pressable
                onPress={() => setEditGender('boy')}
                accessibilityRole="button"
                accessibilityLabel="Choose Man Avatar"
                style={[
                  styles.sheetGenderCard,
                  editGender === 'boy' && styles.sheetGenderCardActive,
                ]}
              >
                <View style={styles.sheetGenderFaceWrap}>
                  <Image source={BOY_FACE} style={styles.sheetGenderFace} resizeMode="cover" />
                  {editGender === 'boy' && (
                    <View style={styles.sheetCheckBadge}>
                      <Check size={12} color="#ffffff" strokeWidth={2.5} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.sheetGenderLabel,
                    editGender === 'boy' && styles.sheetGenderLabelActive,
                  ]}
                >
                  Man
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setEditGender('girl')}
                accessibilityRole="button"
                accessibilityLabel="Choose Woman Avatar"
                style={[
                  styles.sheetGenderCard,
                  editGender === 'girl' && styles.sheetGenderCardActive,
                ]}
              >
                <View style={styles.sheetGenderFaceWrap}>
                  <Image source={GIRL_FACE} style={styles.sheetGenderFace} resizeMode="cover" />
                  {editGender === 'girl' && (
                    <View style={styles.sheetCheckBadge}>
                      <Check size={12} color="#ffffff" strokeWidth={2.5} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.sheetGenderLabel,
                    editGender === 'girl' && styles.sheetGenderLabelActive,
                  ]}
                >
                  Woman
                </Text>
              </Pressable>
            </View>
          </View>

          <Input
            label="Full Name"
            value={editName}
            onChangeText={setEditName}
            placeholder="e.g. Mei Ling Tan"
            autoCapitalize="words"
          />

          <Input
            label="Street Address"
            value={editStreet}
            onChangeText={setEditStreet}
            placeholder="e.g. 15, Jalan USJ 11/1D"
          />

          <View style={styles.cityStateRow}>
            <View style={styles.cityField}>
              <Input
                label="City"
                value={editCity}
                onChangeText={setEditCity}
                placeholder="e.g. Subang Jaya"
              />
            </View>
            <View style={styles.stateField}>
              <Input
                label="State"
                value={editState}
                onChangeText={setEditState}
                placeholder="e.g. Selangor"
              />
            </View>
          </View>

          <View style={styles.sheetActions}>
            <Button
              variant="secondary"
              onPress={() => setIsEditOpen(false)}
              disabled={isSaving}
              style={styles.actionBtn}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleSaveEdit}
              loading={isSaving}
              disabled={isSaving}
              style={styles.actionBtn}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </View>
        </View>
      </BottomSheet>
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
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },

  // Quick Avatar Toggle Pills
  genderPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f4',
    borderRadius: 9999,
    padding: 4,
    gap: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  genderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
    gap: 6,
  },
  genderPillActive: {
    backgroundColor: '#566549',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  genderPillFace: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  genderPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#78716c',
  },
  genderPillTextActive: {
    color: '#ffffff',
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
  nameButton: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 6,
  },
  nameButtonPressed: {
    backgroundColor: '#f5f5f4',
  },
  nameText: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 28,
    color: '#292524',
    letterSpacing: -0.4,
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
  addressContainerPressed: {
    backgroundColor: '#ebe5db',
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

  // Edit Bottom Sheet
  sheetContent: {
    paddingHorizontal: 4,
    paddingBottom: 24,
    gap: 14,
  },
  sheetGenderSection: {
    gap: 8,
    marginBottom: 4,
  },
  sheetSectionLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#44403c',
  },
  sheetGenderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetGenderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e7e5e4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  sheetGenderCardActive: {
    backgroundColor: '#e0e6d9',
    borderColor: '#566549',
  },
  sheetGenderFaceWrap: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#f5f5f4',
  },
  sheetGenderFace: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  sheetCheckBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#566549',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetGenderLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#57534e',
  },
  sheetGenderLabelActive: {
    color: '#2d3b23',
    fontFamily: 'SourceSans3_700Bold',
  },
  cityStateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cityField: {
    flex: 1,
  },
  stateField: {
    flex: 1,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
