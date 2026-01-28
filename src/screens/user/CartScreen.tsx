import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCart, useAuth } from '../../contexts';
import { quotationService } from '../../api';
import { CartItem as CartItemType } from '../../types';
import { colors } from '../../theme';
import { EmptyState } from '../../components/common';
import { CartItem, CartSummary } from '../../components/cart';

export const CartScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart, getItemCount } = useCart();
  const [loading, setLoading] = useState(false);

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
    } else {
      updateQuantity(productId, quantity);
    }
  };

  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromCart(productId),
        },
      ]
    );
  };

  const handleRequestQuotation = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to request a quotation.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: () => navigation.getParent()?.getParent()?.navigate('Auth'),
          },
        ]
      );
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before requesting a quotation.');
      return;
    }

    setLoading(true);
    try {
      const quotationData = {
        items: cart.map((item) => ({
          productId: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          specifications: item.product.specifications,
        })),
      };

      await quotationService.createQuotation(quotationData);

      Alert.alert(
        'Quotation Requested',
        'Your quotation request has been submitted successfully. Our team will review it and get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              clearCart();
              navigation.getParent()?.navigate('MoreTab', { screen: 'MyQuotations' });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit quotation request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItemType }) => (
    <CartItem
      item={item}
      onUpdateQuantity={(quantity) => handleUpdateQuantity(item.product._id, quantity)}
      onRemove={() => handleRemoveItem(item.product._id)}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon="cart"
      title="Your Cart is Empty"
      description="Browse our products and add items to your cart to request a quotation."
      actionLabel="Browse Products"
      onAction={() => navigation.getParent()?.navigate('HomeTab', { screen: 'Products' })}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        {cart.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'}
          </Text>
        )}
      </View>

      {/* Cart Items */}
      <FlatList
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.product._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* Cart Summary */}
      {cart.length > 0 && (
        <View style={styles.summaryContainer}>
          <CartSummary
            itemCount={getItemCount()}
            onRequestQuotation={handleRequestQuotation}
            loading={loading}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
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
    color: colors.gray[500],
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  summaryContainer: {
    padding: 16,
    paddingTop: 0,
  },
});

export default CartScreen;
