import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCheck, Trash2 } from 'lucide-react-native';
import { notificationService } from '../../api';
import { useSocket, useNotifications, useTheme } from '../../contexts';
import { colors } from '../../theme';
import { LoadingSpinner, FilterTabs, EmptyState } from '../../components/common';
import { NotificationCard, Notification } from '../../components/notification';

type FilterKey = 'all' | 'unread' | 'read';

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

export const NotificationsScreen: React.FC = () => {
  const { onNotification } = useSocket();
  const { refreshUnreadCount } = useNotifications();
  const { isDark, theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.data || []);
      refreshUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    const unsubscribe = onNotification((newNotification: Notification) => {
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return unsubscribe;
  }, [onNotification]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      refreshUnreadCount();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteNotification(id);
              setNotifications((prev) => prev.filter((n) => n._id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.clearAllNotifications();
              setNotifications([]);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return !notification.isRead;
    if (selectedFilter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getFilterCounts = () => {
    return filterOptions.map((option) => ({
      ...option,
      count:
        option.key === 'all'
          ? notifications.length
          : option.key === 'unread'
          ? unreadCount
          : notifications.length - unreadCount,
    }));
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationCard
      notification={item}
      onMarkAsRead={() => handleMarkAsRead(item._id)}
      onDelete={() => handleDeleteNotification(item._id)}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon="bell"
      title={selectedFilter === 'all' ? 'No Notifications' : `No ${selectedFilter} Notifications`}
      description={
        selectedFilter === 'all'
          ? 'You\'re all caught up! New notifications will appear here.'
          : `You don't have any ${selectedFilter} notifications.`
      }
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading notifications..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: isDark ? theme.primaryLight : colors.gray[100] }]}
                onPress={handleMarkAllAsRead}
              >
                <CheckCheck size={20} color={colors.primary[600]} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: isDark ? theme.primaryLight : colors.gray[100] }]}
              onPress={handleClearAll}
            >
              <Trash2 size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filters */}
      {notifications.length > 0 && (
        <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <FilterTabs
            options={getFilterCounts()}
            selectedKey={selectedFilter}
            onSelect={(key) => setSelectedFilter(key as FilterKey)}
          />
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primary[600],
    marginTop: 4,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  listContent: {
    flexGrow: 1,
  },
});

export default NotificationsScreen;
