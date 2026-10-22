import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, AlertTriangle, Gift, Vote, FileText, CheckCheck, Moon, Power } from 'lucide-react-native';
import { useAuthSession } from '@/lib/authSession';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationRow,
} from '@/lib/services/notificationService';

export default function NotificationsScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const householdId = session.profile?.household_id;

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!householdId) {
      setIsLoading(false);
      return;
    }

    const data = await fetchNotifications(householdId);
    setNotifications(data);
    setIsLoading(false);
  }, [householdId]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      loadNotifications();
    });
  }, [loadNotifications]);

  const handleNotificationPress = async (item: NotificationRow) => {
    if (!item.is_read) {
      await markNotificationAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
    }
    if (item.linked_path) {
      router.push(item.linked_path as any);
    }
  };

  const handleMarkAllRead = async () => {
    if (!householdId) return;
    await markAllNotificationsAsRead(householdId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bill_alert':
        return <AlertTriangle size={18} color="#a8442f" strokeWidth={1.75} />;
      case 'voting_open':
        return <Vote size={18} color="#566549" strokeWidth={1.75} />;
      case 'month_result':
        return <FileText size={18} color="#566549" strokeWidth={1.75} />;
      case 'reward_ready':
        return <Gift size={18} color="#e6c39b" strokeWidth={1.75} />;
      case 'routine_reminder':
        return <Moon size={18} color="#a97a4a" strokeWidth={1.75} />;
      case 'appliance_reminder':
        return <Power size={18} color="#a97a4a" strokeWidth={1.75} />;
      default:
        return <Bell size={18} color="#78716c" strokeWidth={1.75} />;
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/simulator');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={24} color="#292524" strokeWidth={1.5} />
        </Pressable>

        <Text style={styles.headerTitle}>Notifications</Text>

        {hasUnread ? (
          <Pressable
            onPress={handleMarkAllRead}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            style={styles.markAllButton}
          >
            <CheckCheck size={18} color="#566549" strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#566549" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.content}>
          <View style={styles.emptyIconCircle}>
            <Bell size={28} color="#a8a29e" strokeWidth={1.5} />
          </View>
          <Text style={styles.placeholderText}>No notifications yet</Text>
          <Text style={styles.subtext}>You are all caught up.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((item) => {
            const dateStr = new Date(item.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Pressable
                key={item.id}
                onPress={() => handleNotificationPress(item)}
                style={[
                  styles.notificationCard,
                  !item.is_read && styles.notificationCardUnread,
                ]}
              >
                <View style={styles.iconCol}>{getNotificationIcon(item.type)}</View>

                <View style={styles.textCol}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.notifTitle,
                        !item.is_read && styles.notifTitleUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {!item.is_read && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.notifMessage}>{item.message}</Text>
                  <Text style={styles.notifDate}>{dateStr}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece6',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: '#f5f5f4',
  },
  headerTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
  },
  placeholder: {
    width: 44,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ede7df',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontFamily: 'Lora_500Medium',
    fontSize: 18,
    color: '#292524',
    marginBottom: 4,
  },
  subtext: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    gap: 12,
  },
  notificationCardUnread: {
    backgroundColor: '#fdfbf9',
    borderColor: '#d8e0c4',
    borderLeftWidth: 3.5,
    borderLeftColor: '#566549',
  },
  iconCol: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  notifTitleUnread: {
    fontFamily: 'SourceSans3_700Bold',
    color: '#1c1917',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e6c39b',
    marginLeft: 8,
  },
  notifMessage: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#57534e',
    marginBottom: 6,
  },
  notifDate: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
  },
});
