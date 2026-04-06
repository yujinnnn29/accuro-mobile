import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  CheckCircle,
  Users,
  TrendingUp,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Bell,
  Award,
  Building2,
  UserCheck,
  Search,
  FileText,
  ClipboardList,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react-native';
import { useAuth, useNotifications, useTheme } from '../../contexts';
import { productService } from '../../api';
import { colors } from '../../theme';
import { Product } from '../../types';

const { width } = Dimensions.get('window');

// Feature Badge Component
const FeatureBadge: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isLast?: boolean;
}> = ({ icon, title, subtitle, isLast }) => (
  <View style={[styles.featureBadge, isLast && { borderBottomWidth: 0 }]}>
    <View style={styles.featureBadgeIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.featureBadgeTitle}>{title}</Text>
      <Text style={styles.featureBadgeSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

// Partner Card Component
const PartnerCard: React.FC<{
  image: any;
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ image, icon, title, description }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.partnerCard, { backgroundColor: theme.surface }]}>
      <Image source={image} style={styles.partnerImage} resizeMode="cover" />
      <View style={styles.partnerContent}>
        <View style={styles.partnerTitleRow}>
          {icon}
          <Text style={[styles.partnerTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <Text style={[styles.partnerDescription, { color: theme.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );
};

// Product Card Component
const ProductCard: React.FC<{
  product: Product;
  onPress: () => void;
}> = ({ product, onPress }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity style={[styles.productCard, { backgroundColor: theme.surface }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.productImageContainer, { backgroundColor: theme.background }]}>
        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.productDescription, { color: theme.textSecondary }]} numberOfLines={1}>
          {product.description}
        </Text>
        <TouchableOpacity style={styles.viewDetailsLink} onPress={onPress}>
          <Text style={styles.viewDetailsText}>View details</Text>
          <ChevronRight size={16} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, isAdmin } = useAuth();
  const { unreadCount: notificationCount, refreshUnreadCount } = useNotifications();
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
    refreshUnreadCount();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts({ limit: 4 });
      setProducts(response.data || []);
    } catch (error: any) {
      const isNetworkIssue = !error.response && (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.code === 'ERR_NETWORK' || error.message === 'Aborted' || error.message === 'Network Error');
      if (!isNetworkIssue) console.error('Error loading products:', error);
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const handleUserPress = () => {
    if (isAdmin) {
      navigation.getParent()?.navigate('AdminPanel');
    } else {
      navigation.getParent()?.navigate('MoreTab', { screen: 'Profile' });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy[900]} />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>accuro</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.getParent()?.navigate('NotificationsTab')}
            >
              <Bell size={22} color={colors.white} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.userAvatar} onPress={handleUserPress}>
              <Text style={styles.userAvatarText}>{getUserInitials()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Industry-Leading Calibration Solutions</Text>
          </View>
          <Text style={styles.heroTitle}>
            Instrumentation & Calibration Solutions
          </Text>
          <Text style={styles.heroSubtitle}>
            Providing high-quality measurement and calibration equipment for industrial applications with precision and reliability
          </Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Products')}
            >
              <Text style={styles.primaryButtonText}>Explore Products</Text>
              <ChevronRight size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroBookButton}
              onPress={() => navigation.navigate('Booking', {})}
            >
              <Text style={styles.heroBookButtonText}>Book Meeting</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.heroQuoteButton}
            onPress={() => navigation.navigate('RequestQuote')}
          >
            <FileText size={16} color={colors.white} />
            <Text style={styles.heroQuoteButtonText}>Request a Quote</Text>
          </TouchableOpacity>

          {/* Feature Badges */}
          <View style={styles.featureBadges}>
            <FeatureBadge
              icon={<CheckCircle size={18} color={colors.primary[400]} />}
              title="Certified Quality"
              subtitle="ISO-compliant solutions"
            />
            <FeatureBadge
              icon={<Users size={18} color={colors.primary[400]} />}
              title="Expert Support"
              subtitle="Dedicated technical team"
            />
            <FeatureBadge
              icon={<TrendingUp size={18} color={colors.primary[400]} />}
              title="Industry Leader"
              subtitle="Trusted by top companies"
              isLast
            />
          </View>
        </View>

        {/* How It Works Section */}
        <View style={[styles.howItWorksSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.howItWorksTitle, { color: theme.text }]}>How It Works</Text>
          <Text style={[styles.howItWorksSubtitle, { color: theme.textSecondary }]}>
            From browsing to service completion — here's your journey with Accuro
          </Text>
          <View style={styles.stepsContainer}>
            {[
              {
                icon: <Search size={28} color={colors.primary[600]} />,
                title: 'Browse Products',
                desc: 'Explore our range of Beamex calibration equipment and find the right solution.',
              },
              {
                icon: <FileText size={28} color={colors.primary[600]} />,
                title: 'Request a Quote or Book a Meeting',
                desc: 'Submit a quotation request or schedule a consultation with our team.',
              },
              {
                icon: <ClipboardList size={28} color={colors.primary[600]} />,
                title: 'Review & Accept Your Quote',
                desc: 'Receive a detailed quotation, review it, and accept or request revisions.',
              },
              {
                icon: <UserCheck size={28} color={colors.primary[600]} />,
                title: 'Technician Dispatched',
                desc: 'A certified technician is assigned to your booking and dispatched to your location.',
              },
              {
                icon: <CalendarCheck size={28} color={colors.primary[600]} />,
                title: 'Service Completed',
                desc: 'Your technician completes the service and submits a verified completion report.',
              },
            ].map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumber}>{i + 1}</Text>
                </View>
                {i < 4 && <View style={styles.stepConnector} />}
                <View style={styles.stepIconCircle}>{step.icon}</View>
                <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{step.desc}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
            <ArrowRight size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <View style={styles.aboutBadge}>
            <Text style={styles.aboutBadgeText}>About Accuro</Text>
          </View>
          <Text style={styles.aboutTitle}>Who We Are</Text>
          <Text style={styles.aboutText}>
            Accuro is a leading provider of high-quality instrumentation and calibration solutions for various industries. We specialize in Beamex products, offering the best measurement and calibration equipment to ensure accuracy and reliability in your operations.
          </Text>
          <Text style={styles.aboutText}>
            With years of experience and expertise, we help our clients optimize their processes, improve efficiency, and maintain compliance with industry standards.
          </Text>
          <TouchableOpacity
            style={styles.learnMoreLink}
            onPress={() => navigation.getParent()?.navigate('MoreTab', { screen: 'About' })}
          >
            <Text style={styles.learnMoreText}>Learn more about us</Text>
            <ChevronRight size={16} color={colors.primary[600]} />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800' }}
            style={styles.aboutImage}
            resizeMode="cover"
          />
        </View>

        {/* Partners Section */}
        <View style={[styles.partnersSection, { backgroundColor: theme.surface }]}>
          <View style={styles.partnersBadge}>
            <Text style={styles.partnersBadgeText}>Our Partners</Text>
          </View>
          <Text style={[styles.partnersTitle, { color: theme.text }]}>Backed by Industry Leaders</Text>
          <Text style={[styles.partnersSubtitle, { color: theme.textSecondary }]}>
            Partnering with the best to deliver exceptional calibration solutions
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.partnersScroll}
          >
            <PartnerCard
              image={{ uri: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400' }}
              icon={<Award size={16} color={colors.primary[600]} />}
              title="Official Distributor"
              description="Official distributor of Beamex calibration equipment and software solutions"
            />
            <PartnerCard
              image={{ uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400' }}
              icon={<Building2 size={16} color={colors.primary[600]} />}
              title="Strategic Partners"
              description="Partnered with leading industrial automation companies"
            />
            <PartnerCard
              image={{ uri: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400' }}
              icon={<UserCheck size={16} color={colors.primary[600]} />}
              title="Certified Experts"
              description="Certified experts in measurement and calibration technologies"
            />
          </ScrollView>
        </View>

        {/* Products Section */}
        <View style={[styles.productsSection, { backgroundColor: theme.surface }]}>
          <View style={styles.productsBadge}>
            <Text style={styles.productsBadgeText}>Product Catalog</Text>
          </View>
          <Text style={[styles.productsTitle, { color: theme.text }]}>Our Products</Text>
          <Text style={[styles.productsSubtitle, { color: theme.textSecondary }]}>
            We offer a comprehensive range of Beamex calibration equipment and accessories for various industrial applications
          </Text>
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.viewAllButtonText}>View All Products</Text>
            <ChevronRight size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaSubtitle}>
            Know what you need? Request a quote. Not sure yet? Book a free consultation with our experts.
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.ctaBrowseButton}
              onPress={() => navigation.navigate('Products')}
            >
              <Text style={styles.ctaBrowseButtonText}>Browse Products</Text>
              <ArrowRight size={16} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaQuoteButton}
              onPress={() => navigation.navigate('RequestQuote')}
            >
              <Text style={styles.ctaQuoteButtonText}>Request a Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaBookButton}
              onPress={() => navigation.navigate('Booking', {})}
            >
              <Text style={styles.ctaBookButtonText}>Book a Consultation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <View style={styles.footerBrand}>
              <Text style={styles.footerLogo}>accuro</Text>
              <Text style={styles.footerBrandText}>
                Providing high-quality instrumentation and calibration solutions for your industrial needs.
              </Text>
            </View>
            <View style={styles.footerLinks}>
              <Text style={styles.footerLinksTitle}>Quick Links</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Text style={styles.footerLink}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={styles.footerLink}>Products</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('MoreTab', { screen: 'About' })}>
                <Text style={styles.footerLink}>About Us</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('MoreTab', { screen: 'Contact' })}>
                <Text style={styles.footerLink}>Contact Us</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footerContact}>
              <Text style={styles.footerContactTitle}>Contact Information</Text>
              <View style={styles.footerContactItem}>
                <Phone size={14} color={colors.gray[400]} />
                <Text style={styles.footerContactText}>+63 9171507737</Text>
              </View>
              <View style={styles.footerContactItem}>
                <Mail size={14} color={colors.gray[400]} />
                <Text style={styles.footerContactText}>info@accuro.com.ph</Text>
              </View>
              <View style={styles.footerContactItem}>
                <MapPin size={14} color={colors.gray[400]} />
                <Text style={styles.footerContactText}>
                  Unit 2229, Viera Residences, Scout Tuason Avenue, Barangay Obrero, Quezon City
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.footerBottom}>
            <Text style={styles.footerCopyright}>© 2026 Accuro. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy[900],
  },
  headerSafeArea: {
    backgroundColor: colors.navy[900],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.navy[900],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary[500],
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[300],
  },
  userAvatarText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    backgroundColor: colors.navy[900],
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  heroBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  heroBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.gray[300],
    lineHeight: 24,
    marginBottom: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 6,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  heroBookButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.gray[400],
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBookButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  heroQuoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
    marginBottom: 28,
  },
  heroQuoteButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  featureBadges: {
    flexDirection: 'column',
    backgroundColor: colors.navy[800],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.navy[700],
    gap: 12,
  },
  featureBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navy[700],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureBadgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  featureBadgeSubtitle: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  aboutSection: {
    backgroundColor: colors.navy[900],
    padding: 24,
  },
  aboutBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  aboutBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 15,
    color: colors.gray[300],
    lineHeight: 24,
    marginBottom: 12,
  },
  learnMoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  learnMoreText: {
    color: colors.primary[400],
    fontSize: 14,
    fontWeight: '600',
  },
  aboutImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  partnersSection: {
    backgroundColor: colors.white,
    paddingVertical: 40,
  },
  partnersBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  partnersBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  partnersTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  partnersSubtitle: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  partnersScroll: {
    paddingHorizontal: 24,
    gap: 16,
  },
  partnerCard: {
    width: width * 0.7,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  partnerImage: {
    width: '100%',
    height: 160,
  },
  partnerContent: {
    padding: 16,
  },
  partnerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  partnerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  partnerDescription: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 20,
  },
  productsSection: {
    backgroundColor: colors.white,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  productsBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  productsBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  productsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  productsSubtitle: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  productCard: {
    width: (width - 64) / 2,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 140,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 8,
  },
  viewDetailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 24,
    gap: 8,
  },
  viewAllButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: colors.navy[900],
    paddingTop: 40,
  },
  footerTop: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  footerBrand: {
    marginBottom: 24,
  },
  footerLogo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary[500],
    fontStyle: 'italic',
    marginBottom: 12,
  },
  footerBrandText: {
    fontSize: 14,
    color: colors.gray[400],
    lineHeight: 22,
  },
  footerLinks: {
    marginBottom: 24,
  },
  footerLinksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 14,
    color: colors.gray[400],
    marginBottom: 8,
  },
  footerContact: {
    marginBottom: 24,
  },
  footerContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 12,
  },
  footerContactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  footerContactText: {
    fontSize: 14,
    color: colors.gray[400],
    flex: 1,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: colors.navy[700],
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: 13,
    color: colors.gray[500],
  },
  // How It Works
  howItWorksSection: {
    backgroundColor: colors.white,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  howItWorksTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  howItWorksSubtitle: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 32,
  },
  stepsContainer: {
    gap: 24,
    marginBottom: 32,
  },
  step: {
    alignItems: 'center',
  },
  stepNumberBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  stepNumber: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: colors.primary[200],
    marginBottom: 12,
  },
  stepIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 6,
    gap: 8,
    alignSelf: 'center',
  },
  getStartedButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  // CTA Section
  ctaSection: {
    backgroundColor: colors.navy[900],
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 15,
    color: colors.gray[300],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 320,
  },
  ctaButtons: {
    width: '100%',
    gap: 12,
  },
  ctaBrowseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 6,
    gap: 8,
  },
  ctaBrowseButtonText: {
    color: colors.navy[900],
    fontSize: 15,
    fontWeight: '600',
  },
  ctaQuoteButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  ctaQuoteButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  ctaBookButton: {
    borderWidth: 2,
    borderColor: colors.white,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  ctaBookButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default HomeScreen;
