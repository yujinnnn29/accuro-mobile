import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ArrowLeft, ExternalLink, ClipboardPlus, Check } from 'lucide-react-native';
import { getProductById } from '../../data/products';
import { useCart, useAuth } from '../../contexts';
import { recommendationService } from '../../api';
import { colors } from '../../theme';
import { Button } from '../../components/common';

type ProductDetailRouteParams = {
  ProductDetail: { productId: string };
};

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ProductDetailRouteParams, 'ProductDetail'>>();
  const { productId } = route.params;
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();

  const product = getProductById(productId);

  // Track product view for recommendations engine (mirrors website behavior)
  React.useEffect(() => {
    if (product && user) {
      recommendationService.recordInteraction('view', product._id, product.category).catch(() => {});
    }
  }, [product?._id, user]);

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const inCart = isInCart(product._id);

  const handleAddToCart = () => {
    addToCart(product, 1);
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: product.name,
      visibilityTime: 2000,
      position: 'bottom',
    });
  };

  const handleOpenBeamex = () => {
    if (product.beamexUrl) {
      Linking.openURL(product.beamexUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Product Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price Range</Text>
            <Text style={styles.price}>{product.priceRange}</Text>
            {product.priceRangeUSD && (
              <Text style={styles.priceUSD}>{product.priceRangeUSD}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {product.features && product.features.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Features</Text>
              {product.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Check size={16} color={colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </>
          )}

          {product.beamexUrl && (
            <TouchableOpacity style={styles.beamexLink} onPress={handleOpenBeamex}>
              <ExternalLink size={18} color={colors.primary[600]} />
              <Text style={styles.beamexLinkText}>View on Beamex Website</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.addToCartButton, inCart && styles.addToCartButtonActive]}
          onPress={handleAddToCart}
        >
          <ClipboardPlus size={20} color={inCart ? colors.white : colors.primary[600]} />
          <Text style={[styles.addToCartText, inCart && styles.addToCartTextActive]}>
            {inCart ? 'In Quote' : 'Add to Quote'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quoteButton}
          onPress={() => navigation.navigate('Booking' as never)}
        >
          <Text style={styles.quoteButtonText}>Request Quote</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  imageContainer: {
    backgroundColor: colors.gray[50],
    padding: 20,
  },
  productImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  category: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '600',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  priceContainer: {
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  priceUSD: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    color: colors.gray[600],
    lineHeight: 24,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: colors.gray[700],
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  beamexLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  beamexLinkText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
    marginRight: 12,
  },
  addToCartButtonActive: {
    backgroundColor: colors.primary[600],
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
    marginLeft: 8,
  },
  addToCartTextActive: {
    color: colors.white,
  },
  quoteButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary[600],
  },
  quoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.gray[600],
    marginBottom: 16,
  },
});

export default ProductDetailScreen;
