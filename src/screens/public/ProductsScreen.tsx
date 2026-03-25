import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, X, Plus, Check, ChevronRight } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { products, productCategories } from '../../data/products';
import { useCart, useTheme } from '../../contexts';
import { colors } from '../../theme';
import { Product } from '../../types';

const CategoryPill: React.FC<{
  category: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ category, isSelected, onPress }) => {
  const { theme, isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        { backgroundColor: isDark ? theme.surface : colors.gray[100] },
        isSelected && styles.categoryPillSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.categoryPillText,
          { color: isDark ? theme.textSecondary : colors.gray[700] },
          isSelected && styles.categoryPillTextSelected,
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );
};

const ProductCard: React.FC<{
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
  isInCart: boolean;
  currency: 'PHP' | 'USD';
}> = ({ product, onPress, onAddToCart, isInCart, currency }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();

  const handleCartPress = (e: any) => {
    e.stopPropagation?.();
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    onAddToCart();
  };

  const displayPrice = currency === 'USD' ? product.priceRangeUSD : product.priceRange;

  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: product.image }}
        style={[styles.productImage, { backgroundColor: theme.background }]}
        resizeMode="contain"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productCategory}>{product.category}</Text>
        <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{product.name}</Text>
        {displayPrice && (
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{displayPrice}</Text>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Est. price range</Text>
          </View>
        )}
        <Text style={[styles.productDescription, { color: theme.textSecondary }]} numberOfLines={3}>{product.description}</Text>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <View style={styles.featuresList}>
            {product.features.slice(0, 3).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: theme.textSecondary }]} numberOfLines={1}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.productFooter}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.addToCartButton, isInCart && styles.addToCartButtonActive]}
              onPress={handleCartPress}
            >
              {isInCart
                ? <Check size={16} color={colors.white} />
                : <Plus size={16} color={colors.primary[600]} />
              }
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity
            style={[styles.viewDetailsButton, { borderColor: theme.border }]}
            onPress={onPress}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <ChevronRight size={14} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { addToCart, isInCart } = useCart();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [currency, setCurrency] = useState<'PHP' | 'USD'>('PHP');

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.status === 'active');

    if (selectedCategory !== 'All Products') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    Toast.show({
      type: 'success',
      text1: 'Added to Quote List',
      text2: product.name,
      visibilityTime: 2000,
      position: 'bottom',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: isDark ? theme.border : colors.gray[100] }]}>
          <Search size={20} color={colors.gray[400]} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View style={[styles.categoriesContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {productCategories.map((category) => (
            <CategoryPill
              key={category}
              category={category}
              isSelected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Currency Toggle + Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </Text>
        <View style={[styles.currencyToggle, { borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.currencyButton,
              { backgroundColor: theme.surface },
              currency === 'PHP' && styles.currencyButtonActive,
            ]}
            onPress={() => setCurrency('PHP')}
          >
            <Text style={[
              styles.currencyButtonText,
              { color: theme.text },
              currency === 'PHP' && styles.currencyButtonTextActive,
            ]}>
              PHP (₱)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.currencyButton,
              { backgroundColor: theme.surface },
              currency === 'USD' && styles.currencyButtonActive,
            ]}
            onPress={() => setCurrency('USD')}
          >
            <Text style={[
              styles.currencyButtonText,
              { color: theme.text },
              currency === 'USD' && styles.currencyButtonTextActive,
            ]}>
              USD ($)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
            onAddToCart={() => handleAddToCart(item)}
            isInCart={isInCart(item._id)}
            currency={currency}
          />
        )}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text }]}>No products found</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Try adjusting your search or filter</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.white,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[900],
    marginLeft: 8,
  },
  categoriesContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  categoryPillSelected: {
    backgroundColor: colors.primary[600],
  },
  categoryPillText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500',
  },
  categoryPillTextSelected: {
    color: colors.white,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultsText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  currencyToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 6,
    overflow: 'hidden',
  },
  currencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  currencyButtonActive: {
    backgroundColor: colors.primary[600],
  },
  currencyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[700],
  },
  currencyButtonTextActive: {
    color: colors.white,
  },
  productsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.gray[50],
  },
  productInfo: {
    padding: 16,
  },
  productCategory: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 8,
  },
  priceRow: {
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 20,
    marginBottom: 10,
  },
  featuresList: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  featureCheck: {
    color: colors.primary[600],
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  featureText: {
    fontSize: 12,
    color: colors.gray[600],
    flex: 1,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[600],
  },
  priceLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 1,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 6,
  },
  viewDetailsText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '600',
    marginRight: 2,
  },
  addToCartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButtonActive: {
    backgroundColor: colors.primary[600],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[400],
  },
});

export default ProductsScreen;
