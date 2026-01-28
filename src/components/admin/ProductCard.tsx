import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Package, Edit2, Trash2, MoreVertical, Box } from 'lucide-react-native';
import { colors } from '../../theme';
import { Product, ProductStatus } from '../../types';
import { Card, Badge, Button } from '../common';

interface ProductCardProps {
  product: Product;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  onManageStock?: () => void;
  onPress?: () => void;
  isDeleting?: boolean;
}

const getStatusBadge = (status: ProductStatus) => {
  switch (status) {
    case 'active':
      return <Badge label="Active" variant="success" size="sm" />;
    case 'inactive':
      return <Badge label="Draft" variant="warning" size="sm" />;
    case 'archived':
      return <Badge label="Archived" variant="gray" size="sm" />;
    default:
      return null;
  }
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onToggleStatus,
  onManageStock,
  onPress,
  isDeleting,
}) => {
  const isLowStock = product.trackInventory && product.stockQuantity <= product.lowStockThreshold;
  const isOutOfStock = product.trackInventory && product.stockQuantity === 0;

  return (
    <Card style={styles.card} padding="none" onPress={onPress}>
      <View style={styles.content}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Package size={28} color={colors.gray[400]} />
            </View>
          )}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {product.name}
            </Text>
            {getStatusBadge(product.status)}
          </View>

          <Text style={styles.category}>{product.category}</Text>

          {product.priceRange && (
            <Text style={styles.price}>{product.priceRange}</Text>
          )}

          {/* Inventory Row */}
          {product.trackInventory && (
            <View style={styles.inventoryRow}>
              <View style={styles.stockInfo}>
                <Box size={14} color={isLowStock ? colors.error : colors.gray[500]} />
                <Text style={[styles.stockText, isLowStock && styles.lowStockText]}>
                  {product.stockQuantity} in stock
                </Text>
              </View>
              {isLowStock && !isOutOfStock && (
                <Badge label="Low Stock" variant="error" size="sm" />
              )}
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {onManageStock && product.trackInventory && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onManageStock}
            activeOpacity={0.7}
          >
            <Box size={16} color={colors.primary[600]} />
            <Text style={styles.actionText}>Stock</Text>
          </TouchableOpacity>
        )}

        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Edit2 size={16} color={colors.primary[600]} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        )}

        {onToggleStatus && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onToggleStatus}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {product.status === 'active' ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        )}

        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={onDelete}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
    marginRight: 8,
  },
  category: {
    fontSize: 13,
    color: colors.primary[600],
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 6,
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  lowStockText: {
    color: colors.error,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.gray[50],
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
  },
  toggleText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: colors.error + '10',
    paddingHorizontal: 8,
  },
});

export default ProductCard;
