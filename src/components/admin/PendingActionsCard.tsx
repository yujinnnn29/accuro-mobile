import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { AlertCircle, FileText, Star, Calendar, ChevronRight } from 'lucide-react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme';
import { PendingAction } from '../../types';
import { Card, Badge } from '../common';

interface PendingActionsCardProps {
  items: PendingAction[];
  onItemPress?: (item: PendingAction) => void;
  onViewAll?: () => void;
  loading?: boolean;
}

const getIconForType = (type: PendingAction['type']): LucideIcon => {
  switch (type) {
    case 'quotation':
      return FileText;
    case 'review':
      return Star;
    case 'booking':
      return Calendar;
    default:
      return AlertCircle;
  }
};

const getColorForPriority = (priority: PendingAction['priority']) => {
  switch (priority) {
    case 'high':
      return colors.error;
    case 'medium':
      return colors.warning;
    default:
      return colors.info;
  }
};

export const PendingActionsCard: React.FC<PendingActionsCardProps> = ({
  items,
  onItemPress,
  onViewAll,
  loading,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const renderItem = ({ item }: { item: PendingAction }) => {
    const Icon = getIconForType(item.type);
    const priorityColor = getColorForPriority(item.priority);

    return (
      <TouchableOpacity
        style={styles.actionItem}
        onPress={() => onItemPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: priorityColor + '20' }]}>
          <Icon size={18} color={priorityColor} />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Badge
              label={item.type}
              variant="gray"
              size="sm"
            />
          </View>
          <Text style={styles.itemDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.itemTime}>{formatDate(item.createdAt)}</Text>
        </View>
        <ChevronRight size={18} color={colors.gray[400]} />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <AlertCircle size={32} color={colors.gray[300]} />
      <Text style={styles.emptyText}>No pending actions</Text>
      <Text style={styles.emptySubtext}>You're all caught up!</Text>
    </View>
  );

  return (
    <Card style={styles.card} padding="none">
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Needs Approval</Text>
          <Text style={styles.subtitle}>
            {items.length} item{items.length !== 1 ? 's' : ''} pending
          </Text>
        </View>
        {onViewAll && items.length > 0 && (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      {items.length > 0 ? (
        <FlatList
          data={items.slice(0, 5)}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          scrollEnabled={false}
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[900],
    flex: 1,
  },
  itemDescription: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  itemTime: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.gray[400],
    marginTop: 2,
  },
});

export default PendingActionsCard;
