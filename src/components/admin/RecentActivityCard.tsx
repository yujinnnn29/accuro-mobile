import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
import { colors } from '../../theme';
import { ActivityItem } from '../../types';
import { Card } from '../common';
import { useTheme } from '../../contexts';

interface RecentActivityCardProps {
  items: ActivityItem[];
  onItemPress?: (item: ActivityItem) => void;
  onViewAll?: () => void;
  loading?: boolean;
}

const RESOURCE_CONFIG: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  booking:   { icon: Calendar, color: colors.primary[600], bg: colors.primary[50] },
  quote:     { icon: FileText, color: '#7c3aed', bg: '#f5f3ff' },
  quotation: { icon: FileText, color: '#7c3aed', bg: '#f5f3ff' },
  review:    { icon: Star,     color: '#d97706', bg: '#fffbeb' },
  product:   { icon: Package,  color: colors.success, bg: '#f0fdf4' },
  user:      { icon: User,     color: '#0891b2', bg: '#ecfeff' },
  auth:      { icon: LogIn,    color: colors.gray[600], bg: colors.gray[100] },
  contact:   { icon: Mail,     color: colors.info, bg: '#eff6ff' },
  system:    { icon: Settings, color: colors.gray[500], bg: colors.gray[50] },
};

const getConfig = (resourceType?: string) =>
  RESOURCE_CONFIG[(resourceType || '').toLowerCase()] ?? RESOURCE_CONFIG.system;

const formatTimeAgo = (dateString: string | undefined): string => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getUserName = (user?: ActivityItem['user']): string | null => {
  if (!user) return null;
  if (typeof user === 'string') return user;
  return (user as any).name || (user as any).email || null;
};

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  items,
  onItemPress,
  onViewAll,
}) => {
  const { theme } = useTheme();

  return (
    <Card style={styles.card} padding="none">
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Recent Activity</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Latest system updates</Text>
        </View>
        {onViewAll && items.length > 0 && (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Activity size={32} color={colors.gray[300]} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recent activity</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {items.slice(0, 8).map((item) => {
            const config = getConfig(item.resourceType);
            const IconComponent = config.icon;
            const userName = getUserName(item.user);
            const detail = item.description || (item as any).details || '';

            return (
              <TouchableOpacity
                key={item._id}
                style={[styles.logCard, { backgroundColor: theme.surface }]}
                onPress={() => onItemPress?.(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.logIcon, { backgroundColor: config.bg }]}>
                  <IconComponent size={18} color={config.color} />
                </View>
                <View style={styles.logContent}>
                  <Text style={[styles.logAction, { color: theme.text }]}>{item.action || 'Activity'}</Text>
                  {detail ? (
                    <Text style={[styles.logDetails, { color: theme.textSecondary }]} numberOfLines={2}>
                      {detail}
                    </Text>
                  ) : null}
                  {userName ? (
                    <Text style={[styles.logUser, { color: colors.primary[600] }]}>{userName}</Text>
                  ) : null}
                  <Text style={[styles.logTime, { color: theme.textSecondary }]}>
                    {formatTimeAgo(item.timestamp)}
                  </Text>
                </View>
                {item.resourceType ? (
                  <View style={[styles.typePill, { backgroundColor: config.bg }]}>
                    <Text style={[styles.typeText, { color: config.color }]}>
                      {item.resourceType}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  listContainer: {
    padding: 12,
    gap: 8,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    padding: 12,
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
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
});

export default RecentActivityCard;
