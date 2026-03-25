import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Star,
  ShoppingBag,
  LogIn,
  Activity,
  User,
  Settings,
} from 'lucide-react-native';
import { activityLogService, ActivityLog } from '../../api/activityLogService';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';
import { LoadingSpinner, EmptyState } from '../../components/common';

const RESOURCE_CONFIG: Record<
  ActivityLog['resourceType'],
  { icon: React.FC<any>; color: string; bg: string }
> = {
  booking: { icon: Calendar, color: colors.primary[600], bg: colors.primary[50] },
  review: { icon: Star, color: '#d97706', bg: '#fffbeb' },
  quote: { icon: FileText, color: '#7c3aed', bg: '#f5f3ff' },
  purchase: { icon: ShoppingBag, color: colors.success, bg: '#f0fdf4' },
  auth: { icon: LogIn, color: colors.gray[600], bg: colors.gray[100] },
  user: { icon: User, color: '#0891b2', bg: '#ecfeff' },
  system: { icon: Settings, color: colors.gray[500], bg: colors.gray[50] },
};

const formatTimeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ActivityLogCard: React.FC<{ log: ActivityLog }> = ({ log }) => {
  const config = RESOURCE_CONFIG[log.resourceType] ?? RESOURCE_CONFIG.system;
  const IconComponent = config.icon;
  const { theme } = useTheme();

  return (
    <View style={[styles.logCard, { backgroundColor: theme.surface }]}>
      <View style={[styles.logIcon, { backgroundColor: config.bg }]}>
        <IconComponent size={18} color={config.color} />
      </View>
      <View style={styles.logContent}>
        <Text style={[styles.logAction, { color: theme.text }]}>{log.action}</Text>
        {log.details ? (
          <Text style={[styles.logDetails, { color: theme.textSecondary }]} numberOfLines={2}>{log.details}</Text>
        ) : null}
        <Text style={[styles.logTime, { color: theme.textSecondary }]}>{formatTimeAgo(log.createdAt)}</Text>
      </View>
      <View style={[styles.logTypePill, { backgroundColor: config.bg }]}>
        <Text style={[styles.logTypeText, { color: config.color }]}>
          {log.resourceType}
        </Text>
      </View>
    </View>
  );
};

export const AccountHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setError(null);
    try {
      const response = await activityLogService.getMyActivityLogs();
      setLogs(response.data || []);
    } catch (err: any) {
      console.error('Error fetching activity logs:', err);
      const status = err?.response?.status;
      if (status === 404) {
        setError('Activity log feature is not available yet.');
      } else if (status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Could not load activity logs. Pull down to retry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading activity..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Activity Log</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Summary pill */}
      {logs.length > 0 && (
        <View style={styles.summaryBar}>
          <Activity size={14} color={colors.primary[600]} />
          <Text style={styles.summaryText}>{logs.length} activities recorded</Text>
        </View>
      )}

      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ActivityLogCard log={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            </View>
          ) : (
            <EmptyState
              icon="default"
              title="No Activity Yet"
              description="Your account activity will appear here as you use the app."
            />
          )
        }
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerRight: {
    width: 32,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  summaryText: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  logIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  logContent: {
    flex: 1,
  },
  logAction: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  logDetails: {
    fontSize: 13,
    color: colors.gray[500],
    lineHeight: 18,
    marginBottom: 4,
  },
  logTime: {
    fontSize: 12,
    color: colors.gray[400],
  },
  logTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  logTypeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    color: colors.gray[600],
    lineHeight: 22,
  },
});

export default AccountHistoryScreen;
