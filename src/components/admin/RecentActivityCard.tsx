import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import {
  Activity,
  Calendar,
  FileText,
  Star,
  User,
  Package,
  Mail,
  ChevronRight,
} from 'lucide-react-native';
import { LucideIcon } from 'lucide-react-native';
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

const getIconForResourceType = (type: ActivityItem['resourceType']): LucideIcon => {
  switch (type) {
    case 'booking':
      return Calendar;
    case 'quotation':
      return FileText;
    case 'review':
      return Star;
    case 'user':
      return User;
    case 'product':
      return Package;
    case 'contact':
      return Mail;
    default:
      return Activity;
  }
};

const getColorForAction = (action: string | undefined): string => {
  if (!action) return colors.gray[500];
  const actionStr = action.toLowerCase();
  if (actionStr.includes('create') || actionStr.includes('add')) {
    return colors.success;
  }
  if (actionStr.includes('update') || actionStr.includes('edit')) {
    return colors.info;
  }
  if (actionStr.includes('delete') || actionStr.includes('remove')) {
    return colors.error;
  }
  if (actionStr.includes('approve')) {
    return colors.success;
  }
  if (actionStr.includes('reject')) {
    return colors.error;
  }
  return colors.gray[500];
};

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  items,
  onItemPress,
  onViewAll,
  loading,
}) => {
  const { theme } = useTheme();
  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item, index }: { item: ActivityItem; index: number }) => {
    const Icon = getIconForResourceType(item.resourceType);
    const actionColor = getColorForAction(item.action);
    const isLast = index === Math.min(items.length - 1, 9);

    return (
      <TouchableOpacity
        style={styles.activityItem}
        onPress={() => onItemPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.timelineContainer}>
          <View style={[styles.iconContainer, { backgroundColor: actionColor + '20' }]}>
            <Icon size={16} color={actionColor} />
          </View>
          {!isLast && <View style={styles.timelineLine} />}
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemAction, { color: theme.text }]}>{item.action || 'Activity'}</Text>
          <Text style={[styles.itemDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.itemFooter}>
            {item.user && (
              <Text style={styles.userName}>
                by {typeof item.user === 'string' ? item.user : item.user.name}
              </Text>
            )}
            <Text style={styles.itemTime}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Activity size={32} color={colors.gray[300]} />
      <Text style={styles.emptyText}>No recent activity</Text>
    </View>
  );

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
      {items.length > 0 ? (
        <FlatList
          data={items.slice(0, 10)}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        renderEmpty()
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
    borderBottomColor: colors.gray[100],
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  listContainer: {
    paddingVertical: 8,
  },
  activityItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timelineContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray[200],
    marginTop: 4,
  },
  itemContent: {
    flex: 1,
    paddingBottom: 16,
  },
  itemAction: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[900],
    textTransform: 'capitalize',
  },
  itemDescription: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  userName: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
  itemTime: {
    fontSize: 12,
    color: colors.gray[400],
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 8,
  },
});

export default RecentActivityCard;
