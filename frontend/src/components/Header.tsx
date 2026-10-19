import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';

export type HeaderVariant = 'bell-only' | 'page-title-block' | 'back-and-title' | 'none';

export interface HeaderProps {
  variant?: HeaderVariant;
  title?: string;
  subtitle?: string;
  hasUnread?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Header({
  variant = 'bell-only',
  title,
  subtitle,
  hasUnread = true,
  onBack,
  rightAction,
  style,
}: HeaderProps) {
  const router = useRouter();

  if (variant === 'none') {
    return null;
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const renderBellPill = () => (
    <Pressable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      style={({ pressed }) => [
        styles.bellPill,
        pressed && styles.bellPillPressed,
      ]}
    >
      <View style={styles.bellIconContainer}>
        <Bell size={20} color="#57534e" strokeWidth={1.5} />
        {hasUnread ? <View style={styles.unreadDot} /> : null}
      </View>
    </Pressable>
  );

  if (variant === 'bell-only') {
    return (
      <View style={[styles.headerContainer, styles.bellOnlyRow, style]}>
        <View style={styles.flexSpacer} />
        {renderBellPill()}
      </View>
    );
  }

  if (variant === 'page-title-block') {
    return (
      <View style={[styles.headerContainer, style]}>
        <View style={styles.topBellRow}>
          <View style={styles.flexSpacer} />
          {renderBellPill()}
        </View>
        <View style={styles.titleBlock}>
          {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
          {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    );
  }

  if (variant === 'back-and-title') {
    return (
      <View style={[styles.headerContainer, styles.backAndTitleRow, style]}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <ArrowLeft size={24} color="#292524" strokeWidth={1.5} />
        </Pressable>

        {title ? (
          <Text style={styles.backHeaderTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.flexSpacer} />
        )}

        {rightAction ? (
          <View style={styles.rightActionContainer}>{rightAction}</View>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24, // px-6
  },
  flexSpacer: {
    flex: 1,
  },
  bellOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 12,
  },
  topBellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleBlock: {
    paddingVertical: 8,
  },
  pageTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 28, // H1
    color: '#292524', // stone-800
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e', // stone-600
    lineHeight: 22,
  },
  backAndTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 56,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: '#f5f5f4',
  },
  backHeaderTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  backPlaceholder: {
    width: 48,
  },
  rightActionContainer: {
    minWidth: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bellPill: {
    width: 76,
    height: 48,
    borderRadius: 9999,
    backgroundColor: '#faf6f1', // cream
    borderWidth: 1,
    borderColor: '#e7e5e4', // stone-200
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bellPillPressed: {
    backgroundColor: '#f5f5f4',
    transform: [{ translateY: 2 }],
  },
  bellIconContainer: {
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
    backgroundColor: '#a97a4a', // tan-600 dot
  },
});
