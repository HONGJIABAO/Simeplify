/**
 * PRO-01 – Profile Screen
 * Source: docs/screenshot/profile/Profile.png, page_refined.md S8, design.md Unit 12 §6, Feature_Requirements.md PRO-01.
 *
 * Strictly matching the UI layout, visual hierarchy, spacing, and typography
 * shown in docs/screenshot/profile/Profile.png:
 *   - Transparent bell header with unread tan dot
 *   - Hero card with warm top-right ambient wash, circular avatar with leaf sprout
 *   - Household title & subtitle: "Mei Ling Tan", "Petaling Jaya, Selangor · 3-person household"
 *   - Presence status pill under household line: "At home · Living room" / "Out · back at 18:00"
 *   - 3-card summary row: Savings ("RM 420"), Community ("1,840 Eco Points"), Eco Rating ("5.0★ Top Tier")
 *   - List card with 6 rows:
 *       1. Account & Security
 *       2. 18, Jalan SS 2/6, Petaling Jaya
 *       3. 3 Residents · Semi-D layout
 *       4. 14 Connected Appliances
 *       5. Daily Summary & Spike Alerts (links to /notifications)
 *       6. Weekday & Weekend Routine
 *   - Log out pill button linking to /login
 *   - Resident sheet opened by tapping avatar or status pill
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  MapPin,
  Users,
  Plug,
  Bell as BellIcon,
  Clock,
  LogOut,
  Leaf,
  ChevronRight,
} from 'lucide-react-native';

import { Header } from '@/components/Header';
import { BottomSheet } from '@/components/BottomSheet';
import { mockHousehold, mockProfileData } from '@/lib/mockData';

// ---------------------------------------------------------------------------
// Resident sheet status types
// ---------------------------------------------------------------------------
type ResidentStatus = 'at-home' | 'out';

interface ResidentSheetProps {
  visible: boolean;
  onClose: () => void;
  status: ResidentStatus;
  onToggleStatus?: () => void;
}

function ResidentSheet({ visible, onClose, status, onToggleStatus }: ResidentSheetProps) {
  const isHome = status === 'at-home';
  const pillText = isHome ? 'At home · Living room' : 'Out · back at 18:00';
  const pillBg = isHome ? '#dbe3d3' : '#f6e8d8'; // sage-100 or tan-100
  const pillDotColor = isHome ? '#566549' : '#a97a4a'; // sage-600 or tan-600

  return (
    <BottomSheet visible={visible} onClose={onClose} height="auto">
      <View style={sheetStyles.container}>
        {/* Avatar circle */}
        <View style={sheetStyles.avatarCircle}>
          <View style={sheetStyles.avatarInner}>
            {/* Hair contour */}
            <View style={sheetStyles.hairBack} />
            {/* Face */}
            <View style={sheetStyles.face}>
              {/* Eyes */}
              <View style={sheetStyles.eyeRow}>
                <View style={sheetStyles.eye} />
                <View style={sheetStyles.eye} />
              </View>
              {/* Smile */}
              <View style={sheetStyles.smile} />
            </View>
            {/* Leaf sprout badge */}
            <View style={sheetStyles.leafContainer}>
              <Leaf size={16} color="#566549" strokeWidth={1.5} />
            </View>
          </View>
        </View>

        {/* Status pill (tappable in sheet to toggle status) */}
        <Pressable
          onPress={onToggleStatus}
          accessibilityRole="button"
          accessibilityLabel={`Resident status is ${pillText}. Tap to toggle.`}
          style={[sheetStyles.statusPill, { backgroundColor: pillBg }]}
        >
          <View style={[sheetStyles.statusDot, { backgroundColor: pillDotColor }]} />
          <Text style={sheetStyles.statusText}>{pillText}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Profile screen
// ---------------------------------------------------------------------------
export interface ProfileScreenProps {
  /** Override the resident sheet initial status for dev gallery states */
  initialSheetStatus?: ResidentStatus;
  /** If true, open the resident sheet immediately */
  autoOpenSheet?: boolean;
}

export default function ProfileScreen({
  initialSheetStatus = 'at-home',
  autoOpenSheet = false,
}: ProfileScreenProps) {
  const router = useRouter();
  const [sheetVisible, setSheetVisible] = useState(autoOpenSheet);
  const [currentStatus, setCurrentStatus] = useState<ResidentStatus>(initialSheetStatus);

  const household = mockHousehold;
  const profile = mockProfileData;

  const openResidentSheet = (status: ResidentStatus) => {
    setCurrentStatus(status);
    setSheetVisible(true);
  };

  const toggleStatus = () => {
    setCurrentStatus((prev) => (prev === 'at-home' ? 'out' : 'at-home'));
  };

  const handleLogOut = () => {
    // Navigate to login screen and replace current navigation stack
    router.replace('/login' as any);
  };

  const isHome = currentStatus === 'at-home';
  const statusPillText = isHome ? 'At home · Living room' : 'Out · back at 18:00';
  const statusPillBg = isHome ? '#dbe3d3' : '#f6e8d8';
  const statusDotColor = isHome ? '#566549' : '#a97a4a';

  // 6 rows matching Profile.png reference
  const listRows = [
    {
      key: 'account',
      title: 'Account & Security',
      icon: <UserIcon size={20} color="#57534e" strokeWidth={1.5} />,
      onPress: () => {},
    },
    {
      key: 'address',
      title: profile.addressDisplay,
      icon: <MapPin size={20} color="#57534e" strokeWidth={1.5} />,
      onPress: () => {},
    },
    {
      key: 'household',
      title: `${household.residents} Residents · Semi-D layout`,
      icon: <Users size={20} color="#57534e" strokeWidth={1.5} />,
      onPress: () => {},
    },
    {
      key: 'appliances',
      title: `${profile.applianceCount} Connected Appliances`,
      icon: <Plug size={20} color="#57534e" strokeWidth={1.5} />,
      onPress: () => {},
    },
    {
      key: 'notifications',
      title: 'Daily Summary & Spike Alerts',
      icon: <BellIcon size={20} color="#57534e" strokeWidth={1.5} />,
      onPress: () => router.push('/notifications'),
    },
    {
      key: 'schedule',
      title: 'Weekday & Weekend Routine',
      icon: <Clock size={20} color="#57534e" strokeWidth={1.5} />,
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Bell-only header top right */}
      <Header variant="bell-only" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section Card with subtle warm background wash */}
        <View style={styles.heroContainer}>
          {/* Subtle peach warm accent glow in top right */}
          <View style={styles.warmGlow} pointerEvents="none" />

          {/* Avatar frame */}
          <Pressable
            onPress={() => openResidentSheet(currentStatus)}
            accessibilityRole="button"
            accessibilityLabel="View resident status avatar"
            style={styles.avatarPressable}
          >
            <View style={styles.heroAvatarRing}>
              <View style={styles.heroAvatarInner}>
                {/* Hair contour */}
                <View style={styles.heroHairBack} />
                {/* Face illustration */}
                <View style={styles.heroFace}>
                  <View style={styles.heroEyeRow}>
                    <View style={styles.heroEye} />
                    <View style={styles.heroEye} />
                  </View>
                  <View style={styles.heroSmile} />
                </View>
                {/* Leaf sprout badge */}
                <View style={styles.heroLeafContainer}>
                  <Leaf size={16} color="#566549" strokeWidth={1.5} />
                </View>
              </View>
            </View>
          </Pressable>

          {/* Name */}
          <Text style={styles.heroName}>{household.name}</Text>

          {/* Location and household size line */}
          <Text style={styles.heroSubtitle}>
            {household.city}, {household.state} · {household.residents}-person household
          </Text>

          {/* Live presence status pill directly on hero */}
          <Pressable
            onPress={toggleStatus}
            accessibilityRole="button"
            accessibilityLabel={`Resident status: ${statusPillText}. Tap to toggle.`}
            style={[styles.statusPill, { backgroundColor: statusPillBg }]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
            <Text style={styles.statusText}>{statusPillText}</Text>
          </Pressable>
        </View>

        {/* 3 Summary Mini Cards Row (Savings, Community, Eco Rating) */}
        <View style={styles.summaryRow}>
          {/* Card 1: Savings */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Savings</Text>
            <Text style={styles.summaryValue}>RM {profile.savingsYear}</Text>
            <Text style={styles.summarySubtext}>This year</Text>
          </View>

          {/* Card 2: Community */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Community</Text>
            <Text style={styles.summaryValue}>{profile.ecoPoints.toLocaleString()}</Text>
            <Text style={styles.summarySubtext}>Eco Points</Text>
          </View>

          {/* Card 3: Eco Rating */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Eco Rating</Text>
            <View style={styles.ratingValueRow}>
              <Text style={styles.summaryValue}>{profile.ecoRating}</Text>
              <Text style={styles.starIcon}>★</Text>
            </View>
            <Text style={styles.summarySubtext}>{profile.ecoTier}</Text>
          </View>
        </View>

        {/* List card matching Profile.png reference */}
        <View style={styles.listCard}>
          {listRows.map((row, index) => (
            <React.Fragment key={row.key}>
              <Pressable
                onPress={row.onPress}
                accessibilityRole="button"
                accessibilityLabel={row.title}
                style={({ pressed }) => [
                  styles.listRow,
                  pressed && styles.listRowPressed,
                ]}
              >
                <View style={styles.listLeftGroup}>
                  <View style={styles.iconCircle}>
                    {row.icon}
                  </View>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {row.title}
                  </Text>
                </View>
                <ChevronRight size={18} color="#a8a29e" strokeWidth={1.5} />
              </Pressable>

              {index < listRows.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Log out button */}
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

      {/* Resident sheet */}
      <ResidentSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        status={currentStatus}
        onToggleStatus={toggleStatus}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles matching docs/screenshot/profile/Profile.png
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf6f1', // warm cream background
  },
  scrollContent: {
    paddingHorizontal: 20, // px-5
    paddingBottom: 110, // clear floating tab bar
    gap: 16,
  },

  // Hero section container
  heroContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 16,
    position: 'relative',
  },
  warmGlow: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(246, 232, 216, 0.55)', // soft warm tan-peach wash
  },
  avatarPressable: {
    marginBottom: 16,
  },
  heroAvatarRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2.5,
    borderColor: '#c5d0b9', // sage-200 ring
    backgroundColor: '#e0e6d9', // sage-100 fill
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarInner: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#f6e8d8', // warm skin/tan tone
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroHairBack: {
    position: 'absolute',
    top: 6,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#523a28', // dark brown hair
  },
  heroFace: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f6e8d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    zIndex: 1,
  },
  heroEyeRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 6,
  },
  heroEye: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#382515',
  },
  heroSmile: {
    width: 16,
    height: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: '#382515',
    backgroundColor: 'transparent',
  },
  heroLeafContainer: {
    position: 'absolute',
    top: 8,
    right: 14,
    zIndex: 2,
  },
  heroName: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 26,
    color: '#292524', // stone-800
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e', // stone-600
    textAlign: 'center',
    marginBottom: 14,
  },

  // Status pill on hero
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
  },

  // 3-card summary row
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#57534e',
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 19,
    color: '#292524',
  },
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: 14,
    color: '#8b6f3c', // warm gold/brown star
    marginTop: -2,
  },
  summarySubtext: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#78716c',
    marginTop: 2,
  },

  // List card
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    minHeight: 64,
  },
  listRowPressed: {
    opacity: 0.7,
  },
  listLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f5f4f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524',
    flex: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#f5f5f4',
  },

  // Log out button
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
    marginTop: 4,
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

// ---------------------------------------------------------------------------
// Resident sheet styles
// ---------------------------------------------------------------------------
const sheetStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 20,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2.5,
    borderColor: '#c5d0b9',
    backgroundColor: '#e0e6d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f6e8d8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  hairBack: {
    position: 'absolute',
    top: 6,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#523a28',
  },
  face: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f6e8d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    zIndex: 1,
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  eye: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#382515',
  },
  smile: {
    width: 18,
    height: 9,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: '#382515',
    backgroundColor: 'transparent',
  },
  leafContainer: {
    position: 'absolute',
    top: 8,
    right: 14,
    zIndex: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
});
