import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCart, useAuth, useTheme } from '../../contexts';
import { CartItem as CartItemType } from '../../types';
import { colors } from '../../theme';
import { EmptyState } from '../../components/common';
import { CartItem, CartSummary } from '../../components/cart';

export const CartScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { cart, updateQuantity, removeFromCart, getItemCount } = useCart();
  const { theme } = useTheme();

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
      'Are you sure you want to remove this item from your quote list?',
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

  const handleRequestQuotation = () => {
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
      Alert.alert('Empty Quote List', 'Please add items to your quote list before requesting a quotation.');
      return;
    }

    // Navigate to RequestQuote screen with cart items pre-populated
    navigation.getParent()?.navigate('HomeTab', {
      screen: 'RequestQuote',
      params: { fromCart: true },
    });
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
      title="Your Quote List is Empty"
      description="Browse our products and add items to your quote list to request a quotation."
      actionLabel="Browse Products"
      onAction={() => navigation.getParent()?.navigate('HomeTab', { screen: 'Products' })}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Quote List</Text>
        {cart.length > 0 && (
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
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
