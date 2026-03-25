import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  Calendar,
  FileText,
  Star,
  User,
  Package,
  LogIn,
  Settings,
  Mail,
} from 'lucide-react-native';
import api from '../../api/api';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';
import { LoadingSpinner, EmptyState } from '../../components/common';

interface ActivityLog {
  _id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  createdAt: string;
  user?: { _id: string; name: string; email?: string } | string;
}

const RESOURCE_CONFIG: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  booking:  { icon: Calendar, color: colors.primary[600], bg: colors.primary[50] },
  quote:    { icon: FileText, color: '#7c3aed', bg: '#f5f3ff' },
  quotation:{ icon: FileText, color: '#7c3aed', bg: '#f5f3ff' },
  review:   { icon: Star,     color: '#d97706', bg: '#fffbeb' },
  product:  { icon: Package,  color: colors.success, bg: '#f0fdf4' },
  user:     { icon: User,     color: '#0891b2', bg: '#ecfeff' },
  auth:     { icon: LogIn,    color: colors.gray[600], bg: colors.gray[100] },
  contact:  { icon: Mail,     color: colors.info, bg: '#eff6ff' },
  system:   { icon: Settings, color: colors.gray[500], bg: colors.gray[50] },
};

const getConfig = (resourceType: string) =>
  RESOURCE_CONFIG[resourceType?.toLowerCase()] ?? RESOURCE_CONFIG.system;

const getUserName = (user?: ActivityLog['user']): string | null => {
  if (!user) return null;
  if (typeof user === 'string') return user;
  return user.name || user.email || null;
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
  const { theme } = useTheme();
  const config = getConfig(log.resourceType);
  const IconComponent = config.icon;
  const userName = getUserName(log.user);

  return (
    <View style={[styles.logCard, { backgroundColor: theme.surface }]}>
      <View style={[styles.logIcon, { backgroundColor: config.bg }]}>
        <IconComponent size={18} color={config.color} />
      </View>
      <View style={styles.logContent}>
        <Text style={[styles.logAction, { color: theme.text }]}>{log.action}</Text>
        {log.details ? (
          <Text style={[styles.logDetails, { color: theme.textSecondary }]} numberOfLines={2}>
            {log.details}
          </Text>
        ) : null}
        {userName ? (
          <Text style={[styles.logUser, { color: colors.primary[600] }]}>{userName}</Text>
        ) : null}
        <Text style={[styles.logTime, { color: theme.textSecondary }]}>
          {formatTimeAgo(log.createdAt)}
        </Text>
      </View>
      <View style={[styles.logTypePill, { backgroundColor: config.bg }]}>
        <Text style={[styles.logTypeText, { color: config.color }]}>
          {log.resourceType}
        </Text>
      </View>
    </View>
  );
};

export const ActivityLogsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get('/activity-logs', {
        params: { limit: 100 },
        adapter: 'xhr',
      });
      const raw = res.data?.data ?? res.data ?? [];
      const data: ActivityLog[] = Array.isArray(raw) ? raw : [];
      setLogs(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError('You do not have permission to view activity logs.');
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
    return <LoadingSpinner fullScreen text="Loading activity logs..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      {/* Summary pill */}
      {logs.length > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
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
              description="System activity will appear here as users interact with the app."
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
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
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
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
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
    marginBottom: 2,
  },
  logDetails: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  logUser: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  logTime: {
    fontSize: 12,
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
    lineHeight: 22,
  },
});

export default ActivityLogsScreen;
