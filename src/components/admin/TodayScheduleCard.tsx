import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Clock, Building2, ChevronRight, Calendar } from 'lucide-react-native';
import { colors } from '../../theme';
import { TodayScheduleItem } from '../../types';
import { Card, Badge } from '../common';
import { useTheme } from '../../contexts';

interface TodayScheduleCardProps {
  items: TodayScheduleItem[];
  onItemPress?: (item: TodayScheduleItem) => void;
  onViewAll?: () => void;
  loading?: boolean;
}

export const TodayScheduleCard: React.FC<TodayScheduleCardProps> = ({
  items,
  onItemPress,
  onViewAll,
  loading,
}) => {
  const { theme } = useTheme();
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const renderItem = ({ item }: { item: TodayScheduleItem }) => (
    <TouchableOpacity
      style={[styles.scheduleItem, { borderBottomColor: theme.border }]}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.timeContainer}>
        <Clock size={14} color={colors.gray[400]} />
        <Text style={[styles.timeText, { color: theme.textSecondary }]}>{formatTime(item.time)}</Text>
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.companyName, { color: theme.text }]} numberOfLines={1}>
            {item.company}
          </Text>
          <Badge
            label={item.status}
            variant={item.status === 'confirmed' ? 'success' : 'warning'}
            size="sm"
          />
        </View>
        <View style={styles.itemDetails}>
          <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.contactName} - {item.product}
          </Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.gray[400]} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Calendar size={32} color={colors.gray[300]} />
      <Text style={styles.emptyText}>No bookings scheduled for today</Text>
    </View>
  );

  return (
    <Card style={styles.card} padding="none">
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Today's Schedule</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {items.length} booking{items.length !== 1 ? 's' : ''} today
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
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 85,
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[700],
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
  companyName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[900],
    flex: 1,
  },
  itemDetails: {
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.gray[500],
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

export default TodayScheduleCard;
