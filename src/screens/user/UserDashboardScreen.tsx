import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Calendar,
  FileText,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth, useCart } from '../../contexts';
import { activityService, bookingService, quotationService } from '../../api';
import { colors } from '../../theme';
import { Card, Badge, LoadingSpinner } from '../../components/common';
import { HomeStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface Stats {
  bookings: {
    total: number;
    pending: number;
    completed: number;
  };
  quotations: {
    total: number;
    pending: number;
    approved: number;
  };
}

export const UserDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { getItemCount } = useCart();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch stats from multiple endpoints
      const [bookingsRes, quotationsRes] = await Promise.all([
        bookingService.getMyBookings().catch(() => ({ data: [] })),
        quotationService.getMyQuotations().catch(() => ({ data: [] })),
      ]);

      const bookings = bookingsRes.data || [];
      const quotations = quotationsRes.data || [];

      setStats({
        bookings: {
          total: bookings.length,
          pending: bookings.filter((b: any) => b.status === 'pending' || b.status === 'confirmed').length,
          completed: bookings.filter((b: any) => b.status === 'completed').length,
        },
        quotations: {
          total: quotations.length,
          pending: quotations.filter((q: any) => q.status === 'pending').length,
          approved: quotations.filter((q: any) => q.status === 'approved').length,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    {
      icon: Calendar,
      label: 'New Booking',
      color: colors.primary[600],
      onPress: () => navigation.navigate('Booking', {}),
    },
    {
      icon: Package,
      label: 'Products',
      color: colors.success,
      onPress: () => navigation.navigate('Products'),
    },
    {
      icon: FileText,
      label: 'Quotations',
      color: colors.info,
      onPress: () => navigation.getParent()?.navigate('MoreTab', { screen: 'MyQuotations' }),
    },
    {
      icon: ShoppingCart,
      label: 'Cart',
      color: colors.warning,
      onPress: () => navigation.getParent()?.navigate('CartTab'),
    },
  ];

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          {user?.company && (
            <Text style={styles.company}>{user.company}</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAction}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {/* Bookings Card */}
            <Card style={styles.statCard} padding="md">
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: colors.primary[100] }]}>
                  <Calendar size={20} color={colors.primary[600]} />
                </View>
                <Text style={styles.statTitle}>Bookings</Text>
              </View>
              <Text style={styles.statValue}>{stats?.bookings.total || 0}</Text>
              <View style={styles.statDetails}>
                <View style={styles.statDetail}>
                  <Clock size={12} color={colors.warning} />
                  <Text style={styles.statDetailText}>
                    {stats?.bookings.pending || 0} pending
                  </Text>
                </View>
                <View style={styles.statDetail}>
                  <CheckCircle size={12} color={colors.success} />
                  <Text style={styles.statDetailText}>
                    {stats?.bookings.completed || 0} completed
                  </Text>
                </View>
              </View>
            </Card>

            {/* Quotations Card */}
            <Card style={styles.statCard} padding="md">
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: colors.info + '20' }]}>
                  <FileText size={20} color={colors.info} />
                </View>
                <Text style={styles.statTitle}>Quotations</Text>
              </View>
              <Text style={styles.statValue}>{stats?.quotations.total || 0}</Text>
              <View style={styles.statDetails}>
                <View style={styles.statDetail}>
                  <Clock size={12} color={colors.warning} />
                  <Text style={styles.statDetailText}>
                    {stats?.quotations.pending || 0} pending
                  </Text>
                </View>
                <View style={styles.statDetail}>
                  <CheckCircle size={12} color={colors.success} />
                  <Text style={styles.statDetailText}>
                    {stats?.quotations.approved || 0} approved
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        </View>

        {/* Cart Summary */}
        {getItemCount() > 0 && (
          <View style={styles.section}>
            <Card
              onPress={() => navigation.getParent()?.navigate('CartTab')}
              style={styles.cartCard}
              padding="md"
            >
              <View style={styles.cartContent}>
                <View style={[styles.cartIcon, { backgroundColor: colors.warning + '20' }]}>
                  <ShoppingCart size={24} color={colors.warning} />
                </View>
                <View style={styles.cartInfo}>
                  <Text style={styles.cartTitle}>Shopping Cart</Text>
                  <Text style={styles.cartSubtitle}>
                    {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'} ready for quotation
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.gray[400]} />
              </View>
            </Card>
          </View>
        )}

        {/* Explore Products */}
        <View style={styles.section}>
          <Card
            onPress={() => navigation.navigate('Products')}
            style={styles.exploreCard}
            padding="lg"
          >
            <Text style={styles.exploreTitle}>Explore Our Products</Text>
            <Text style={styles.exploreSubtitle}>
              Browse our range of Beamex calibration equipment and solutions
            </Text>
            <View style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>View Products</Text>
              <ChevronRight size={16} color={colors.primary[600]} />
            </View>
          </Card>
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
    padding: 20,
    backgroundColor: colors.primary[600],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.primary[200],
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  company: {
    fontSize: 14,
    color: colors.primary[200],
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  statDetails: {
    gap: 4,
  },
  statDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDetailText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  cartCard: {
    backgroundColor: colors.white,
  },
  cartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  cartSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  exploreCard: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  exploreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[900],
    marginBottom: 8,
  },
  exploreSubtitle: {
    fontSize: 14,
    color: colors.primary[700],
    lineHeight: 20,
    marginBottom: 16,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
    marginRight: 4,
  },
  bottomPadding: {
    height: 24,
  },
});

export default UserDashboardScreen;
