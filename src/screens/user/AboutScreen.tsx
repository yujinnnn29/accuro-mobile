import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Award,
  Users,
  Target,
  Globe,
  ExternalLink,
  CheckCircle,
} from 'lucide-react-native';
import { colors } from '../../theme';
import { Card } from '../../components/common';
import { useTheme } from '../../contexts';

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const services = [
    'Calibration Equipment Sales',
    'Software Training & Support',
    'Technical Consultation',
    'Maintenance Services',
    'Calibration Solutions',
  ];

  const handleOpenWebsite = () => {
    Linking.openURL('https://accuro.ph');
  };

  const handleOpenBeamex = () => {
    Linking.openURL('https://www.beamex.com');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>About Accuro</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ACCURO</Text>
          </View>
          <Text style={styles.heroTitle}>Your Partner in Calibration Excellence</Text>
          <Text style={styles.heroSubtitle}>
            Authorized Beamex Partner in the Philippines
          </Text>
        </View>

        {/* Mission Card */}
        <Card style={styles.card} padding="lg">
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
              <Target size={24} color={colors.primary[600]} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Our Mission</Text>
          </View>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            To provide world-class calibration solutions and exceptional service to
            industries across the Philippines, helping our clients maintain the highest
            standards of measurement accuracy and regulatory compliance.
          </Text>
        </Card>

        {/* About Card */}
        <Card style={styles.card} padding="lg">
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.info + '20' }]}>
              <Users size={24} color={colors.info} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Who We Are</Text>
          </View>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            Accuro is the authorized partner and distributor of Beamex calibration
            products and solutions in the Philippines. With years of experience in
            the calibration industry, we serve a wide range of sectors including
            pharmaceutical, food & beverage, oil & gas, power generation, and manufacturing.
          </Text>
        </Card>

        {/* Partnership Card */}
        <Card style={styles.card} padding="lg">
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
              <Award size={24} color={colors.success} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Beamex Partnership</Text>
          </View>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            As an authorized Beamex partner, we offer the complete range of Beamex
            calibration equipment, software solutions, and professional services.
            Beamex is a leading global provider of calibration solutions, known for
            innovative technology and exceptional quality.
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleOpenBeamex}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Visit Beamex Website</Text>
            <ExternalLink size={16} color={colors.primary[600]} />
          </TouchableOpacity>
        </Card>

        {/* Services Card */}
        <Card style={styles.card} padding="lg">
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
              <Globe size={24} color={colors.warning} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Our Services</Text>
          </View>
          <View style={styles.servicesList}>
            {services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <CheckCircle size={18} color={colors.success} />
                <Text style={[styles.serviceText, { color: theme.text }]}>{service}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Contact CTA */}
        <Card style={styles.ctaCard} padding="lg">
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaText}>
            Contact us today to learn how we can help with your calibration needs.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleOpenWebsite}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaButtonText}>Visit Our Website</Text>
            <ExternalLink size={18} color={colors.white} />
          </TouchableOpacity>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.text }]}>Accuro Mobile</Text>
          <Text style={[styles.appVersion, { color: theme.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.copyright, { color: theme.textSecondary }]}>
            © {new Date().getFullYear()} Accuro Philippines. All rights reserved.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerRight: {
    width: 32,
  },
  heroSection: {
    backgroundColor: colors.primary[600],
    padding: 32,
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[600],
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.primary[200],
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  cardText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 22,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  ctaCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[900],
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: colors.primary[700],
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  appVersion: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  copyright: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 24,
  },
});

export default AboutScreen;
