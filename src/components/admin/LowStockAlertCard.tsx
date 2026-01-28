import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Package, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme';
import { LowStockItem } from '../../types';
import { Card, Badge } from '../common';

interface LowStockAlertCardProps {
  items: LowStockItem[];
  onItemPress?: (item: LowStockItem) => void;
  onViewAll?: () => void;
  loading?: boolean;
}

export const LowStockAlertCard: React.FC<LowStockAlertCardProps> = ({
  items,
  onItemPress,
  onViewAll,
  loading,
}) => {
  const getStockStatus = (item: LowStockItem) => {
    if (item.stockQuantity === 0) {
      return { label: 'Out of Stock', variant: 'error' as const };
    }
    if (item.stockQuantity <= item.lowStockThreshold / 2) {
      return { label: 'Critical', variant: 'error' as const };
    }
    return { label: 'Low Stock', variant: 'warning' as const };
  };

  const renderItem = ({ item }: { item: LowStockItem }) => {
    const stockStatus = getStockStatus(item);

    return (
      <TouchableOpacity
        style={styles.stockItem}
        onPress={() => onItemPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Package size={20} color={colors.gray[400]} />
            </View>
          )}
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.categoryText}>{item.category}</Text>
          <View style={styles.stockInfo}>
            <Badge
              label={stockStatus.label}
              variant={stockStatus.variant}
              size="sm"
            />
            <Text style={styles.stockText}>
              {item.stockQuantity} / {item.lowStockThreshold}
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color={colors.gray[400]} />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Package size={32} color={colors.gray[300]} />
      <Text style={styles.emptyText}>All products well stocked</Text>
      <Text style={styles.emptySubtext}>No low stock alerts</Text>
    </View>
  );

  const criticalCount = items.filter(
    (i) => i.stockQuantity === 0 || i.stockQuantity <= i.lowStockThreshold / 2
  ).length;

  return (
    <Card style={styles.card} padding="none">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <AlertTriangle size={18} color={colors.warning} />
            <Text style={styles.title}>Low Stock Alerts</Text>
          </View>
          <Text style={styles.subtitle}>
            {items.length} item{items.length !== 1 ? 's' : ''} need attention
            {criticalCount > 0 && ` (${criticalCount} critical)`}
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
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  imageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  placeholderImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[900],
  },
  categoryText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  stockText: {
    fontSize: 12,
    color: colors.gray[500],
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

export default LowStockAlertCard;
