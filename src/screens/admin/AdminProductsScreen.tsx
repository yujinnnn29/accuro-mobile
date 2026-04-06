import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, Plus, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react-native';
import { productService } from '../../api';
import { Product, ProductStatus } from '../../types';
import { colors } from '../../theme';
import { LoadingSpinner, FilterTabs, EmptyState } from '../../components/common';
import { ProductCard, ProductFormModal, StockUpdateModal } from '../../components/admin';

type FilterKey = 'all' | ProductStatus;
type SortKey = 'name' | 'category' | 'stock' | 'date';
type SortOrder = 'asc' | 'desc';

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Draft' },
  { key: 'archived', label: 'Archived' },
];

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'stock', label: 'Stock Level' },
  { key: 'date', label: 'Date Added' },
];

export const AdminProductsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Sort state
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Modal state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const params = selectedFilter !== 'all' ? { status: selectedFilter } : undefined;
      const response = await productService.getProducts(params);
      setProducts(response.data || []);
    } catch (error: any) {
      const isNetworkIssue = !error.response && (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.code === 'ERR_NETWORK' || error.message === 'Aborted' || error.message === 'Network Error');
      if (!isNetworkIssue) console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(productId);
            try {
              await productService.deleteProduct(productId);
              fetchProducts();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete product');
            } finally {
              setDeleteLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Product`,
      `Are you sure you want to ${action} "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              await productService.updateProduct(product._id, { status: newStatus });
              fetchProducts();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to update product status');
            }
          },
        },
      ]
    );
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleManageStock = (product: Product) => {
    setStockProduct(product);
    setShowStockModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const sortProducts = (productsToSort: Product[]): Product[] => {
    return [...productsToSort].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'stock':
          comparison = a.stockQuantity - b.stockQuantity;
          break;
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredProducts = sortProducts(
    products.filter((product) => {
      return (
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
  );

  const getFilterCounts = () => {
    return filterOptions.map((option) => ({
      ...option,
      count: option.key === 'all'
        ? products.length
        : products.filter((p) => p.status === option.key).length,
    }));
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onEdit={() => handleEditProduct(item)}
      onDelete={() => handleDeleteProduct(item._id, item.name)}
      onToggleStatus={() => handleToggleStatus(item)}
      onManageStock={() => handleManageStock(item)}
      isDeleting={deleteLoading === item._id}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon="package"
      title="No Products Found"
      description={
        searchQuery
          ? 'No products match your search.'
          : 'There are no products to display. Add your first product!'
      }
      actionLabel={!searchQuery ? 'Add Product' : undefined}
      onAction={!searchQuery ? handleAddProduct : undefined}
    />
  );

  const renderSortOptions = () => {
    if (!showSortOptions) return null;

    return (
      <View style={styles.sortOptionsContainer}>
        <View style={styles.sortOptionsHeader}>
          <Text style={styles.sortOptionsTitle}>Sort By</Text>
          <TouchableOpacity onPress={() => setShowSortOptions(false)}>
            <X size={20} color={colors.gray[500]} />
          </TouchableOpacity>
        </View>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortOption,
              sortBy === option.key && styles.sortOptionSelected,
            ]}
            onPress={() => {
              if (sortBy === option.key) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(option.key);
                setSortOrder('asc');
              }
            }}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortBy === option.key && styles.sortOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
            {sortBy === option.key && (
              <Text style={styles.sortOrderText}>
                {sortOrder === 'asc' ? '(A-Z)' : '(Z-A)'}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading products..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
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
              <X size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <ArrowUpDown size={20} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Sort Options Dropdown */}
      {renderSortOptions()}

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FilterTabs
          options={getFilterCounts()}
          selectedKey={selectedFilter}
          onSelect={(key) => setSelectedFilter(key as FilterKey)}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Add Product */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddProduct}
        activeOpacity={0.8}
      >
        <Plus size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Product Form Modal */}
      <ProductFormModal
        visible={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setEditingProduct(null);
        }}
        onSuccess={fetchProducts}
        product={editingProduct}
      />

      {/* Stock Update Modal */}
      <StockUpdateModal
        visible={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setStockProduct(null);
        }}
        onSuccess={fetchProducts}
        product={stockProduct}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: colors.gray[900],
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  sortOptionsContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  sortOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sortOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sortOptionSelected: {
    backgroundColor: colors.primary[50],
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.gray[600],
    flex: 1,
  },
  sortOptionTextSelected: {
    color: colors.primary[700],
    fontWeight: '500',
  },
  sortOrderText: {
    fontSize: 12,
    color: colors.primary[600],
  },
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: colors.gray[500],
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default AdminProductsScreen;
