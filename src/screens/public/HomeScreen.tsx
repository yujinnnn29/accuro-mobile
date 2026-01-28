import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Shield, Users, Award, ChevronRight } from 'lucide-react-native';
import { getFeaturedProducts } from '../../data/products';
import { colors } from '../../theme';
import { Product } from '../../types';

const { width } = Dimensions.get('window');

const ValueCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <View style={styles.valueCard}>
    <View style={styles.valueIcon}>{icon}</View>
    <Text style={styles.valueTitle}>{title}</Text>
    <Text style={styles.valueDescription}>{description}</Text>
  </View>
);

const ProductCard: React.FC<{ product: Product; onPress: () => void }> = ({ product, onPress }) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.7}>
    <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
    <View style={styles.productInfo}>
      <Text style={styles.productCategory}>{product.category}</Text>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productPrice}>{product.priceRange}</Text>
    </View>
  </TouchableOpacity>
);

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const featuredProducts = getFeaturedProducts(4);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Precision Calibration Solutions</Text>
        <Text style={styles.heroSubtitle}>
          Your trusted partner for Beamex calibration equipment in the Philippines
        </Text>
        <TouchableOpacity
          style={styles.heroButton}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.heroButtonText}>Explore Products</Text>
          <ChevronRight size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Value Propositions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Accuro</Text>
        <View style={styles.valueGrid}>
          <ValueCard
            icon={<Shield size={28} color={colors.primary[600]} />}
            title="Certified Quality"
            description="ISO-certified calibration equipment from Beamex"
          />
          <ValueCard
            icon={<Users size={28} color={colors.primary[600]} />}
            title="Expert Support"
            description="Dedicated technical team for your needs"
          />
          <ValueCard
            icon={<Award size={28} color={colors.primary[600]} />}
            title="Industry Leader"
            description="30+ years of calibration excellence"
          />
        </View>
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsScroll}
        >
          {featuredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
            />
          ))}
        </ScrollView>
      </View>

      {/* About Section */}
      <View style={[styles.section, styles.aboutSection]}>
        <Text style={styles.sectionTitle}>About Accuro</Text>
        <Text style={styles.aboutText}>
          Accuro is the official distributor of Beamex calibration solutions in the Philippines.
          We provide world-class calibration equipment, software, and services to industries
          including oil & gas, pharmaceutical, power generation, and manufacturing.
        </Text>
        <TouchableOpacity
          style={styles.learnMoreButton}
          onPress={() => navigation.navigate('About')}
        >
          <Text style={styles.learnMoreText}>Learn More About Us</Text>
        </TouchableOpacity>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
        <Text style={styles.ctaSubtitle}>
          Schedule a consultation or product demonstration with our experts
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Booking')}
        >
          <Text style={styles.ctaButtonText}>Book a Meeting</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Accuro. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.primary[100],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
    marginRight: 4,
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
  valueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valueCard: {
    width: (width - 64) / 3,
    alignItems: 'center',
    paddingVertical: 16,
  },
  valueIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
  },
  productsScroll: {
    paddingRight: 24,
  },
  productCard: {
    width: 200,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: colors.gray[50],
  },
  productInfo: {
    padding: 12,
  },
  productCategory: {
    fontSize: 11,
    color: colors.primary[600],
    fontWeight: '600',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 13,
    color: colors.gray[600],
  },
  aboutSection: {
    backgroundColor: colors.gray[50],
  },
  aboutText: {
    fontSize: 15,
    color: colors.gray[600],
    lineHeight: 24,
    marginBottom: 16,
  },
  learnMoreButton: {
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
  ctaSection: {
    backgroundColor: colors.navy[800],
    padding: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 15,
    color: colors.gray[300],
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.gray[400],
  },
});

export default HomeScreen;
