import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { CartItem as CartItemType } from '../../types';
import { colors } from '../../theme';
import { QuantitySelector } from '../common';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const { product, quantity } = item;

  return (
    <View style={styles.container}>
      {product.image && (
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.category}>{product.category}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>
            {product.priceRange && (
              <Text style={styles.price}>{product.priceRange}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
        <View style={styles.footer}>
          <QuantitySelector
            quantity={quantity}
            onIncrease={() => onUpdateQuantity(quantity + 1)}
            onDecrease={() => onUpdateQuantity(quantity - 1)}
            min={1}
            max={10}
            size="sm"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    paddingRight: 8,
  },
  category: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primary[600],
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  price: {
    fontSize: 13,
    color: colors.gray[600],
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});

export default CartItem;
