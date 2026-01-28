import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, X, ShoppingCart } from 'lucide-react-native';
import { products, productCategories } from '../../data/products';
import { useCart } from '../../contexts';
import { colors } from '../../theme';
import { Product } from '../../types';

const CategoryPill: React.FC<{
  category: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ category, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextSelected]}>
      {category}
    </Text>
  </TouchableOpacity>
);

const ProductCard: React.FC<{
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
  isInCart: boolean;
}> = ({ product, onPress, onAddToCart, isInCart }) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.7}>
    <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
    <View style={styles.productInfo}>
      <Text style={styles.productCategory}>{product.category}</Text>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
      <View style={styles.productFooter}>
        <Text style={styles.productPrice}>{product.priceRange}</Text>
        <TouchableOpacity
          style={[styles.addToCartButton, isInCart && styles.addToCartButtonActive]}
          onPress={(e) => {
            e.stopPropagation?.();
            onAddToCart();
          }}
        >
          <ShoppingCart size={16} color={isInCart ? colors.white : colors.primary[600]} />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

export const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { addToCart, isInCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');

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
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
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
      <View style={styles.categoriesContainer}>
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

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </Text>
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
          />
        )}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filter</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: colors.gray[500],
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
  productDescription: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 20,
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
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
