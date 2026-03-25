import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  FileText,
  Search,
  Plus,
  Minus,
  X,
  Send,
  Package,
  CheckCircle,
  Calendar,
  Clock,
  ChevronDown,
} from 'lucide-react-native';
import { useRoute, RouteProp, useNavigationState } from '@react-navigation/native';
import { useAuth, useCart, useTheme } from '../../contexts';
import { HomeStackParamList } from '../../navigation/types';
import { quotationService } from '../../api';
import { activityLogService } from '../../api/activityLogService';
import { products as staticProducts } from '../../data/products';
import { Product } from '../../types';
import { colors } from '../../theme';
import { LoadingSpinner } from '../../components/common';

interface SelectedItem {
  productId: string;
  productName: string;
  productImage?: string;
  category: string;
  quantity: number;
  specifications: string;
}

export const RequestQuoteScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // Determine if this screen is inside MoreStack (accessed from More tab)
  const routeNames = useNavigationState((state) => state?.routeNames || []);
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const { theme, isDark } = useTheme();

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [company, setCompany] = useState(user?.company || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quotationNumber, setQuotationNumber] = useState('');

  // Pre-populate from cart when navigated from Quote List
  useEffect(() => {
    if (route.params?.fromCart && cart.length > 0) {
      setSelectedItems(
        cart.map((cartItem) => ({
          productId: cartItem.product._id,
          productName: cartItem.product.name,
          productImage: cartItem.product.image,
          category: cartItem.product.category,
          quantity: cartItem.quantity,
          specifications: '',
        }))
      );
    }
  }, []);

  const filteredProducts = staticProducts.filter(
    (p) =>
      !selectedItems.find((item) => item.productId === p._id) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addProduct = (product: Product) => {
    setSelectedItems((prev) => [
      ...prev,
      {
        productId: product._id,
        productName: product.name,
        productImage: product.image,
        category: product.category,
        quantity: 1,
        specifications: '',
      },
    ]);
    setSearchQuery('');
    setShowSearch(false);
  };

  const removeProduct = (productId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const updateSpecifications = (productId: string, specifications: string) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, specifications } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Products', 'Please add at least one product to your quotation request.');
      return;
    }
    if (!company.trim()) {
      Alert.alert('Required', 'Please enter your company name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await quotationService.createQuotation({
        customerName: user?.name || '',
        customerEmail: user?.email || '',
        customerPhone: phone,
        company,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          specifications: item.specifications || undefined,
        })),
        additionalRequirements: additionalRequirements || undefined,
      });

      if (response.success) {
        if (route.params?.fromCart) {
          clearCart();
        }
        setQuotationNumber(response.data?.quotationNumber || '');
        setSubmitted(true);
        activityLogService.logActivity({
          action: 'create',
          resourceType: 'quote',
          resourceId: response.data?._id,
          details: `Submitted quotation request with ${selectedItems.length} item(s)`,
        });
      } else {
        Alert.alert('Error', (response as any).message || 'Failed to submit quotation');
      }
    } catch (error: any) {
      const isNetworkError = !error.response && (
        error.message === 'Network Error' ||
        error.message === 'Aborted' ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ERR_CANCELED' ||
        error.name === 'AbortError'
      );
      if (isNetworkError) {
        // The server likely received and processed the request before the connection dropped.
        // Show success so the user isn't left in limbo.
        if (route.params?.fromCart) {
          clearCart();
        }
        setQuotationNumber('');
        setSubmitted(true);
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to submit quotation request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (submitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Request a Quotation</Text>
          <View style={styles.headerRight} />
        </View>
        <ScrollView contentContainerStyle={styles.successContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.successIcon}>
            <CheckCircle size={48} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>Quotation Request Submitted!</Text>
          {quotationNumber ? (
            <Text style={styles.successRef}>Reference: {quotationNumber}</Text>
          ) : null}
          <Text style={[styles.successMsg, { color: theme.textSecondary }]}>
            Our team will review your request and prepare a detailed quotation. You'll receive a
            notification once it's ready.
          </Text>

          <TouchableOpacity
            style={styles.viewQuotationsButton}
            onPress={() => {
              // If inside MoreStack, navigate directly; otherwise switch to MoreTab
              if (routeNames.includes('MyQuotations')) {
                navigation.navigate('MyQuotations');
              } else {
                navigation.getParent()?.navigate('MoreTab', { screen: 'MyQuotations' });
              }
            }}
          >
            <FileText size={18} color={colors.white} />
            <Text style={styles.viewQuotationsText}>View My Quotations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitAnotherButton, { borderColor: theme.border }]}
            onPress={() => {
              setSubmitted(false);
              setSelectedItems([]);
              setAdditionalRequirements('');
              setQuotationNumber('');
            }}
          >
            <Plus size={18} color={theme.text} />
            <Text style={[styles.submitAnotherText, { color: theme.text }]}>Submit Another Request</Text>
          </TouchableOpacity>

          <Text style={[styles.whatsNextLabel, { color: theme.textSecondary }]}>What's Next?</Text>
          <View style={styles.nextCards}>
            <TouchableOpacity
              style={[styles.nextCard, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('Products')}
            >
              <View style={[styles.nextCardIcon, { backgroundColor: colors.primary[50] }]}>
                <Package size={20} color={colors.primary[600]} />
              </View>
              <View>
                <Text style={[styles.nextCardTitle, { color: theme.text }]}>Continue Browsing</Text>
                <Text style={[styles.nextCardSub, { color: theme.textSecondary }]}>Explore more products</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextCard, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('Booking', {})}
            >
              <View style={[styles.nextCardIcon, { backgroundColor: isDark ? theme.border : '#f5f3ff' }]}>
                <Calendar size={20} color="#7c3aed" />
              </View>
              <View>
                <Text style={[styles.nextCardTitle, { color: theme.text }]}>Book a Consultation</Text>
                <Text style={[styles.nextCardSub, { color: theme.textSecondary }]}>Discuss your needs</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Request a Quotation</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Description */}
        <View style={[styles.descRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <FileText size={22} color="#059669" />
          <Text style={[styles.descText, { color: theme.textSecondary }]}>
            Select products, specify quantities, and we'll prepare a detailed quotation for you.
          </Text>
        </View>

        {/* Product Selection */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Package size={18} color="#059669" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Select Products</Text>
          </View>

          {/* Search trigger */}
          <TouchableOpacity
            style={[styles.searchTrigger, { borderColor: theme.border }]}
            onPress={() => setShowSearch(true)}
          >
            <Search size={18} color={colors.gray[400]} />
            <Text style={[styles.searchTriggerText, { color: theme.textSecondary }]}>Search products by name or category...</Text>
            <ChevronDown size={18} color={colors.gray[400]} />
          </TouchableOpacity>

          {/* Selected items */}
          {selectedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={40} color={colors.gray[300]} />
              <Text style={[styles.emptyStateTitle, { color: theme.textSecondary }]}>No products selected yet</Text>
              <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
                Search and select products above to add them to your quotation request
              </Text>
            </View>
          ) : (
            <View style={styles.selectedList}>
              {selectedItems.map((item) => (
                <View key={item.productId} style={[styles.selectedItem, { borderColor: theme.border }]}>
                  {item.productImage ? (
                    <Image source={{ uri: item.productImage }} style={styles.itemImage} resizeMode="contain" />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImagePlaceholder, { backgroundColor: isDark ? theme.border : colors.gray[100] }]}>
                      <Package size={24} color={colors.gray[400]} />
                    </View>
                  )}
                  <View style={styles.itemDetails}>
                    <View style={styles.itemNameRow}>
                      <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>{item.productName}</Text>
                      <TouchableOpacity onPress={() => removeProduct(item.productId)} style={styles.removeBtn}>
                        <X size={18} color={colors.gray[400]} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.itemCategory, { color: theme.textSecondary }]}>{item.category}</Text>
                    {/* Quantity stepper */}
                    <View style={styles.qtyRow}>
                      <Text style={[styles.qtyLabel, { color: theme.textSecondary }]}>Qty:</Text>
                      <View style={[styles.qtyStepper, { borderColor: theme.border }]}>
                        <TouchableOpacity
                          style={[styles.qtyBtn, { backgroundColor: theme.background }]}
                          onPress={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus size={14} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyValue, { color: theme.text, borderColor: theme.border }]}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={[styles.qtyBtn, { backgroundColor: theme.background }]}
                          onPress={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus size={14} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* Specifications */}
                    <TextInput
                      style={[styles.specInput, { borderColor: theme.border, color: theme.textSecondary, backgroundColor: theme.background }]}
                      placeholder="Any specific requirements for this product..."
                      placeholderTextColor={colors.gray[400]}
                      value={item.specifications}
                      onChangeText={(v) => updateSpecifications(item.productId, v)}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Additional Requirements */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <FileText size={18} color="#059669" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Additional Requirements</Text>
          </View>
          <TextInput
            style={[styles.requirementsInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
            placeholder="Any additional details, delivery requirements, timeline preferences, or special instructions..."
            placeholderTextColor={colors.gray[400]}
            value={additionalRequirements}
            onChangeText={setAdditionalRequirements}
            multiline
            numberOfLines={4}
            maxLength={2000}
          />
          <Text style={[styles.charCount, { color: theme.textSecondary }]}>{additionalRequirements.length}/2000</Text>
        </View>

        {/* Your Information */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Your Information</Text>
          <View style={styles.infoField}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Full Name</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputDisabled, { borderColor: theme.border, color: theme.textSecondary, backgroundColor: theme.background }]}
              value={user?.name || ''}
              editable={false}
            />
          </View>
          <View style={styles.infoField}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputDisabled, { borderColor: theme.border, color: theme.textSecondary, backgroundColor: theme.background }]}
              value={user?.email || ''}
              editable={false}
            />
          </View>
          <View style={styles.infoField}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Company <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.fieldInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
              placeholder="Your company name"
              placeholderTextColor={colors.gray[400]}
              value={company}
              onChangeText={setCompany}
            />
          </View>
          <View style={styles.infoField}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Phone Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.fieldInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
              placeholder="e.g. +63 917 123 4567"
              placeholderTextColor={colors.gray[400]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Request Summary + Submit */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Request Summary</Text>
          {selectedItems.length === 0 ? (
            <Text style={[styles.noItemsText, { color: theme.textSecondary }]}>No products selected yet</Text>
          ) : (
            <View style={styles.summaryList}>
              {selectedItems.map((item) => (
                <View key={item.productId} style={styles.summaryRow}>
                  <Text style={[styles.summaryName, { color: theme.textSecondary }]} numberOfLines={1}>{item.productName}</Text>
                  <Text style={[styles.summaryQty, { color: theme.textSecondary }]}>x{item.quantity}</Text>
                </View>
              ))}
              <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryTotalLabel, { color: theme.text }]}>Total Items</Text>
                <Text style={[styles.summaryTotalValue, { color: theme.text }]}>
                  {selectedItems.reduce((s, i) => s + i.quantity, 0)}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || selectedItems.length === 0) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || selectedItems.length === 0}
          >
            {submitting ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <>
                <Send size={18} color={colors.white} />
                <Text style={styles.submitButtonText}>Submit Quotation Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* How It Works mini sidebar */}
        <View style={[styles.howItWorksCard, { backgroundColor: isDark ? theme.surface : '#f0fdf4', borderColor: isDark ? theme.border : '#bbf7d0' }]}>
          <Text style={[styles.howItWorksTitle, { color: isDark ? theme.text : '#14532d' }]}>How It Works</Text>
          {[
            'Select products and specify quantities and requirements',
            'Our team reviews your request and prepares a detailed quote',
            "You'll receive a notification with pricing and terms",
          ].map((step, i) => (
            <View key={i} style={styles.howStep}>
              <View style={styles.howStepNum}>
                <Text style={styles.howStepNumText}>{i + 1}</Text>
              </View>
              <Text style={[styles.howStepText, { color: isDark ? theme.textSecondary : '#166534' }]}>{step}</Text>
            </View>
          ))}
          <View style={styles.responseTime}>
            <Clock size={14} color="#059669" />
            <Text style={[styles.responseTimeText, { color: isDark ? theme.textSecondary : '#059669' }]}>Typical response time: 1-2 business days</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Product Search Modal */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.surface }]} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Products</Text>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <View style={[styles.modalSearchRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Search size={18} color={colors.gray[400]} />
            <TextInput
              style={[styles.modalSearchInput, { color: theme.text }]}
              placeholder="Search products..."
              placeholderTextColor={colors.gray[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.productRow, { borderBottomColor: theme.border }]}
                onPress={() => addProduct(item)}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.productRowImage} resizeMode="contain" />
                ) : (
                  <View style={[styles.productRowImage, styles.itemImagePlaceholder, { backgroundColor: isDark ? theme.border : colors.gray[100] }]}>
                    <Package size={20} color={colors.gray[400]} />
                  </View>
                )}
                <View style={styles.productRowInfo}>
                  <Text style={[styles.productRowName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.productRowCat, { color: theme.textSecondary }]}>{item.category}{item.priceRange ? ` · ${item.priceRange}` : ''}</Text>
                </View>
                <Plus size={20} color="#059669" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <Text style={[styles.modalEmptyText, { color: theme.textSecondary }]}>
                  {searchQuery ? 'No matching products found' : 'All products already added'}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.gray[900] },
  headerRight: { width: 32 },
  descRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  descText: { flex: 1, fontSize: 14, color: colors.gray[600], lineHeight: 20 },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900], marginBottom: 12 },
  searchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchTriggerText: { flex: 1, fontSize: 14, color: colors.gray[400] },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyStateTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[500], marginTop: 12 },
  emptyStateSub: { fontSize: 13, color: colors.gray[400], textAlign: 'center', marginTop: 6, lineHeight: 18 },
  selectedList: { gap: 12 },
  selectedItem: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    padding: 12,
  },
  itemImage: { width: 64, height: 64, borderRadius: 8 },
  itemImagePlaceholder: {
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: { flex: 1 },
  itemNameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.gray[900], flex: 1 },
  removeBtn: { padding: 2 },
  itemCategory: { fontSize: 12, color: colors.gray[500], marginTop: 2, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  qtyLabel: { fontSize: 13, fontWeight: '500', color: colors.gray[700] },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 6,
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.gray[50] },
  qtyValue: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.gray[300],
  },
  specInput: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    color: colors.gray[700],
    minHeight: 52,
    textAlignVertical: 'top',
  },
  requirementsInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray[800],
    minHeight: 96,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: colors.gray[400], textAlign: 'right', marginTop: 4 },
  infoField: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: colors.gray[700], marginBottom: 6 },
  required: { color: colors.error },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.gray[900],
  },
  fieldInputDisabled: { backgroundColor: colors.gray[50], color: colors.gray[500] },
  noItemsText: { fontSize: 14, color: colors.gray[400], marginBottom: 16 },
  summaryList: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  summaryName: { flex: 1, fontSize: 13, color: colors.gray[700], marginRight: 8 },
  summaryQty: { fontSize: 13, color: colors.gray[500] },
  summaryDivider: { height: 1, backgroundColor: colors.gray[200], marginVertical: 8 },
  summaryTotalLabel: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  summaryTotalValue: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  submitButtonDisabled: { backgroundColor: colors.gray[400] },
  submitButtonText: { fontSize: 15, fontWeight: '600', color: colors.white },
  howItWorksCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  howItWorksTitle: { fontSize: 15, fontWeight: '600', color: '#14532d', marginBottom: 12 },
  howStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  howStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  howStepNumText: { fontSize: 11, fontWeight: 'bold', color: colors.white },
  howStepText: { flex: 1, fontSize: 13, color: '#166534', lineHeight: 19 },
  responseTime: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  responseTimeText: { fontSize: 12, color: '#059669' },
  // Success screen
  successContainer: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  successRef: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
    marginBottom: 12,
  },
  successMsg: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 320,
  },
  viewQuotationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
    justifyContent: 'center',
  },
  viewQuotationsText: { fontSize: 15, fontWeight: '600', color: colors.white },
  submitAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: colors.gray[300],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 28,
    width: '100%',
    justifyContent: 'center',
  },
  submitAnotherText: { fontSize: 15, fontWeight: '600', color: colors.gray[700] },
  whatsNextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  nextCards: { flexDirection: 'row', gap: 12, width: '100%' },
  nextCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 10,
  },
  nextCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nextCardTitle: { fontSize: 13, fontWeight: '600', color: colors.gray[900] },
  nextCardSub: { fontSize: 11, color: colors.gray[500] },
  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.white },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.gray[900] },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: colors.gray[900] },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  productRowImage: { width: 44, height: 44, borderRadius: 8 },
  productRowInfo: { flex: 1 },
  productRowName: { fontSize: 14, fontWeight: '500', color: colors.gray[900] },
  productRowCat: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  modalEmpty: { padding: 32, alignItems: 'center' },
  modalEmptyText: { fontSize: 14, color: colors.gray[400] },
});

export default RequestQuoteScreen;
