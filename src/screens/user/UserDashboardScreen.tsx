import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
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
  Star,
  Activity,
  History,
  TrendingUp,
  Sparkles,
  XCircle,
  AlertCircle,
  MapPin,
  Truck,
  MessageSquare,
} from 'lucide-react-native';
import { useAuth, useCart, useTheme } from '../../contexts';
import { bookingService, quotationService, recommendationService, purchaseHistoryService, activityLogService, quoteService, reviewService } from '../../api';
import activityService, { ActivityStats } from '../../api/activityService';
import { getProductById } from '../../data/products';
import { colors } from '../../theme';
import { Card, Badge, LoadingSpinner } from '../../components/common';
import { HomeStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type TabType = 'bookings' | 'purchases' | 'quotes' | 'reviews' | 'activity';

export const UserDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { getItemCount } = useCart();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Activity stats
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Service & Quotation progress
  const [progressBookings, setProgressBookings] = useState<any[]>([]);
  const [progressQuotations, setProgressQuotations] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);

  // Recommendations
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(true);

  // Account History tabs
  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [tabLoading, setTabLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await activityService.getActivityStats();
      setStats(res.data);
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      setProgressLoading(true);
      const [bookingsRes, quotationsRes] = await Promise.allSettled([
        bookingService.getMyBookings(),
        quotationService.getMyQuotations(),
      ]);
      if (bookingsRes.status === 'fulfilled') {
        setProgressBookings((bookingsRes.value.data || []).slice(0, 5));
      }
      if (quotationsRes.status === 'fulfilled') {
        setProgressQuotations((quotationsRes.value.data || []).slice(0, 5));
      }
    } catch {
      // silently fail
    } finally {
      setProgressLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      setRecLoading(true);
      const res = await recommendationService.getRecommendations(5);
      setRecommendations(res.data || []);
    } catch {
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  }, []);

  const fetchTabData = useCallback(async (tab: TabType) => {
    setTabLoading(true);
    try {
      switch (tab) {
        case 'bookings':
          const bRes = await bookingService.getMyBookings().catch(() => ({ data: [] }));
          setBookings(bRes.data || []);
          break;
        case 'purchases':
          const pRes = await purchaseHistoryService.getMyPurchases().catch(() => ({ data: [] }));
          setPurchases(pRes.data || []);
          break;
        case 'quotes':
          const qRes = await quoteService.getMyQuotes().catch(() => ({ data: [] }));
          setQuotes(qRes.data || []);
          break;
        case 'reviews':
          const rRes = await reviewService.getMyReviews().catch(() => ({ data: [] }));
          setReviews(rRes.data || []);
          break;
        case 'activity':
          const aRes = await activityLogService.getMyActivityLogs().catch(() => ({ data: [] }));
          setActivityLogs(aRes.data || []);
          break;
      }
    } catch {
      // silently fail - show empty state
    } finally {
      setTabLoading(false);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchProgress();
    fetchRecommendations();
    fetchTabData('bookings');
  }, []);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchProgress();
    fetchRecommendations();
    fetchTabData(activeTab);
  };

  const getBookingProgressColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'confirmed': return colors.primary[600];
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      default: return colors.gray[400];
    }
  };

  const getBookingProgressWidth = (status: string) => {
    switch (status) {
      case 'completed': return '100%';
      case 'confirmed': return '66%';
      case 'pending': return '33%';
      default: return '0%';
    }
  };

  const getQuotationProgressColor = (status: string) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'pending': return colors.warning;
      case 'rejected': return colors.error;
      default: return colors.gray[400];
    }
  };

  const getQuotationProgressWidth = (status: string) => {
    switch (status) {
      case 'approved': return '100%';
      case 'pending': return '50%';
      default: return '25%';
    }
  };

  const isNewUser = stats ? stats.bookings.total === 0 && stats.quotations.total === 0 : false;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'confirmed': case 'sent': return colors.primary[600];
      case 'completed': case 'accepted': case 'delivered': return colors.success;
      case 'cancelled': case 'rejected': return colors.error;
      default: return colors.gray[500];
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { id: 'quotes', label: 'Quotes', icon: FileText },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  const renderBookings = () => {
    if (bookings.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Calendar size={40} color={colors.gray[300]} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Bookings Yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>You haven't created any bookings yet</Text>
          <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('Booking', {})}>
            <Text style={styles.emptyActionText}>Create Booking</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return bookings.map((b: any) => (
      <View key={b._id} style={[styles.historyCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <View style={styles.historyCardHeader}>
          <Text style={[styles.historyCardTitle, { color: theme.text }]}>{b.company || 'Booking'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(b.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusBadgeColor(b.status) }]}>{b.status}</Text>
          </View>
        </View>
        <Text style={[styles.historyCardSub, { color: theme.textSecondary }]}>{b.product}</Text>
        <View style={styles.historyRow}>
          <Calendar size={13} color={colors.primary[600]} />
          <Text style={[styles.historyRowText, { color: theme.textSecondary }]}>{new Date(b.date).toLocaleDateString()}</Text>
          <Clock size={13} color={colors.primary[600]} style={{ marginLeft: 12 }} />
          <Text style={[styles.historyRowText, { color: theme.textSecondary }]}>{b.time}</Text>
        </View>
      </View>
    ));
  };

  const renderPurchases = () => {
    if (purchases.length === 0) {
      return (
        <View style={styles.emptyState}>
          <ShoppingCart size={40} color={colors.gray[300]} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Purchase History</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Your purchase history will appear here</Text>
        </View>
      );
    }
    return purchases.map((p: any) => (
      <View key={p._id} style={[styles.historyCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <View style={styles.historyCardHeader}>
          <Text style={[styles.historyCardTitle, { color: theme.text }]}>Order #{p.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(p.orderStatus) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusBadgeColor(p.orderStatus) }]}>{p.orderStatus}</Text>
          </View>
        </View>
        <Text style={[styles.historyCardSub, { color: theme.textSecondary }]}>{new Date(p.createdAt).toLocaleDateString()}</Text>
        {p.items?.map((item: any, i: number) => (
          <View key={i} style={styles.purchaseItem}>
            <Text style={[styles.purchaseItemName, { color: theme.textSecondary }]}>{item.productName}</Text>
            <Text style={[styles.purchaseItemPrice, { color: theme.text }]}>${item.totalPrice?.toFixed(2)}</Text>
          </View>
        ))}
        <View style={[styles.purchaseTotal, { borderTopColor: theme.border }]}>
          <Text style={[styles.purchaseTotalLabel, { color: theme.text }]}>Total</Text>
          <Text style={styles.purchaseTotalValue}>${p.totalAmount?.toFixed(2)}</Text>
        </View>
      </View>
    ));
  };

  const renderQuotes = () => {
    if (quotes.length === 0) {
      return (
        <View style={styles.emptyState}>
          <FileText size={40} color={colors.gray[300]} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Quote Requests</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>You haven't requested any quotes yet</Text>
          <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('Products')}>
            <Text style={styles.emptyActionText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return quotes.map((q: any) => (
      <View key={q._id} style={[styles.historyCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <View style={styles.historyCardHeader}>
          <Text style={[styles.historyCardTitle, { color: theme.text }]}>{q.company}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(q.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusBadgeColor(q.status) }]}>{q.status}</Text>
          </View>
        </View>
        <Text style={[styles.historyCardSub, { color: theme.textSecondary }]}>{q.customerName} • {q.customerEmail}</Text>
        {q.items?.map((item: any, i: number) => (
          <View key={i} style={styles.purchaseItem}>
            <Text style={[styles.purchaseItemName, { color: theme.textSecondary }]}>{item.productName}</Text>
            <Text style={[styles.purchaseItemPrice, { color: theme.text }]}>Qty: {item.quantity}</Text>
          </View>
        ))}
        <View style={[styles.purchaseTotal, { borderTopColor: theme.border }]}>
          <Text style={[styles.purchaseTotalLabel, { color: theme.text }]}>Total Estimated</Text>
          <Text style={styles.purchaseTotalValue}>${q.totalEstimatedPrice?.toFixed(2)}</Text>
        </View>
      </View>
    ));
  };

  const renderReviews = () => {
    if (reviews.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Star size={40} color={colors.gray[300]} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Reviews Yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Complete a booking to leave your first review</Text>
        </View>
      );
    }
    return reviews.map((r: any) => (
      <View key={r._id} style={[styles.historyCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <View style={styles.historyCardHeader}>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={14} color={i <= r.rating ? '#FBBF24' : colors.gray[300]} fill={i <= r.rating ? '#FBBF24' : 'transparent'} />
            ))}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: r.isApproved ? colors.success + '20' : colors.warning + '20' }]}>
            <Text style={[styles.statusText, { color: r.isApproved ? colors.success : colors.warning }]}>
              {r.isApproved ? 'Approved' : 'Pending'}
            </Text>
          </View>
        </View>
        <Text style={[styles.reviewComment, { color: theme.text }]}>{r.comment}</Text>
        <Text style={[styles.historyCardSub, { color: theme.textSecondary }]}>{new Date(r.createdAt).toLocaleDateString()}</Text>
      </View>
    ));
  };

  const renderActivity = () => {
    if (activityLogs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Activity size={40} color={colors.gray[300]} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Activity Yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Your account activity will appear here</Text>
        </View>
      );
    }
    return activityLogs.map((log: any) => (
      <View key={log._id} style={styles.activityItem}>
        <View style={[styles.activityDot, { backgroundColor: colors.primary[100] }]}>
          <Activity size={14} color={colors.primary[600]} />
        </View>
        <View style={styles.activityContent}>
          <Text style={[styles.activityAction, { color: theme.text }]}>{log.action}</Text>
          {log.details && <Text style={[styles.activityDetails, { color: theme.textSecondary }]}>{log.details}</Text>}
          <Text style={[styles.activityTime, { color: theme.textSecondary }]}>{new Date(log.createdAt).toLocaleString()}</Text>
        </View>
      </View>
    ));
  };

  const recommendedProducts = recommendations
    .map(r => ({ rec: r, product: getProductById(r.productId) }))
    .filter(({ product }) => !!product);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          {user?.company && <Text style={styles.company}>{user.company}</Text>}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsColumn}>
            {[
              {
                icon: Package,
                label: 'Browse Products',
                desc: 'Explore our product catalog',
                borderColor: colors.primary[600],
                iconBg: colors.primary[50],
                iconColor: colors.primary[600],
                onPress: () => navigation.navigate('Products'),
              },
              {
                icon: FileText,
                label: 'Request a Quote',
                desc: 'Get a customized quotation',
                borderColor: '#059669',
                iconBg: '#f0fdf4',
                iconColor: '#059669',
                onPress: () => navigation.navigate('RequestQuote', {}),
              },
              {
                icon: Calendar,
                label: 'Book a Consultation',
                desc: 'Schedule a meeting with our team',
                borderColor: '#7c3aed',
                iconBg: '#f5f3ff',
                iconColor: '#7c3aed',
                onPress: () => navigation.navigate('Booking', {}),
              },
            ].map((action, index) => (
              <TouchableOpacity key={index} style={[styles.quickActionCard, { borderLeftColor: action.borderColor, backgroundColor: theme.surface }]} onPress={action.onPress} activeOpacity={0.7}>
                <View style={[styles.quickActionCardIcon, { backgroundColor: action.iconBg }]}>
                  <action.icon size={22} color={action.iconColor} />
                </View>
                <View style={styles.quickActionCardText}>
                  <Text style={[styles.quickActionCardLabel, { color: theme.text }]}>{action.label}</Text>
                  <Text style={[styles.quickActionCardDesc, { color: theme.textSecondary }]}>{action.desc}</Text>
                </View>
                <ChevronRight size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Stats */}
        {!statsLoading && stats && !isNewUser && (
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.primary[600] }]}>
                <Text style={styles.statValue}>{stats.bookings.total}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.success }]}>
                <Text style={styles.statValue}>{stats.bookings.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#059669' }]}>
                <Text style={styles.statValue}>{stats.quotations.total}</Text>
                <Text style={styles.statLabel}>Quotations</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#16A34A' }]}>
                <Text style={styles.statValue}>{stats.quotations.approved}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>
            </View>
          </View>
        )}

        {/* Getting Started (new users) */}
        {!statsLoading && isNewUser && (
          <View style={styles.section}>
            <View style={[styles.gettingStartedCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.gettingStartedTitle, { color: theme.text }]}>Getting Started</Text>
              <Text style={[styles.gettingStartedSubtitle, { color: theme.textSecondary }]}>Complete these steps to get the most out of Accuro</Text>
              {[
                { label: 'Browse our product catalog', done: false, onPress: () => navigation.navigate('Products') },
                { label: 'Book a meeting with our team', done: false, onPress: () => navigation.navigate('Booking', {}) },
                { label: 'Request a product quotation', done: false, onPress: () => navigation.navigate('RequestQuote', {}) },
              ].map((step, i) => (
                <TouchableOpacity key={i} style={[styles.gettingStartedStep, { borderBottomColor: theme.border }]} onPress={step.onPress}>
                  <View style={[styles.gettingStartedDot, step.done && { backgroundColor: colors.success }]}>
                    {step.done ? <CheckCircle size={14} color={colors.white} /> : <Text style={styles.gettingStartedNum}>{i + 1}</Text>}
                  </View>
                  <Text style={[styles.gettingStartedStepText, { color: theme.text }]}>{step.label}</Text>
                  <ChevronRight size={16} color={colors.gray[400]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Service & Quotation Progress */}
        {!progressLoading && (progressBookings.length > 0 || progressQuotations.length > 0) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Progress</Text>
            {progressBookings.map((booking: any) => (
              <View key={booking._id} style={[styles.progressCard, { backgroundColor: theme.surface }]}>
                <View style={styles.progressCardHeader}>
                  <Calendar size={16} color={colors.primary[600]} />
                  <Text style={[styles.progressCardTitle, { color: theme.text }]} numberOfLines={1}>{booking.company || 'Booking'}</Text>
                  <View style={[styles.progressBadge, { backgroundColor: getBookingProgressColor(booking.status) + '20' }]}>
                    <Text style={[styles.progressBadgeText, { color: getBookingProgressColor(booking.status) }]}>{booking.status}</Text>
                  </View>
                </View>
                <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
                  <View style={[styles.progressBarFill, { width: getBookingProgressWidth(booking.status) as any, backgroundColor: getBookingProgressColor(booking.status) }]} />
                </View>
              </View>
            ))}
            {progressQuotations.map((q: any) => (
              <View key={q._id} style={[styles.progressCard, { backgroundColor: theme.surface }]}>
                <View style={styles.progressCardHeader}>
                  <FileText size={16} color={colors.success} />
                  <Text style={[styles.progressCardTitle, { color: theme.text }]} numberOfLines={1}>Quotation #{q._id?.slice(-6)}</Text>
                  <View style={[styles.progressBadge, { backgroundColor: getQuotationProgressColor(q.status) + '20' }]}>
                    <Text style={[styles.progressBadgeText, { color: getQuotationProgressColor(q.status) }]}>{q.status}</Text>
                  </View>
                </View>
                <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
                  <View style={[styles.progressBarFill, { width: getQuotationProgressWidth(q.status) as any, backgroundColor: getQuotationProgressColor(q.status) }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Product Recommendations */}
        {(recLoading || recommendedProducts.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={18} color={colors.primary[600]} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recommended for You</Text>
              <Sparkles size={16} color={colors.primary[400]} style={{ marginLeft: 'auto' }} />
            </View>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Based on your interests and activity</Text>
            {recLoading ? (
              <ActivityIndicator color={colors.primary[600]} style={{ marginTop: 12 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recScroll}>
                {recommendedProducts.map(({ rec, product }, index) => (
                  <TouchableOpacity
                    key={product!._id}
                    style={[styles.recCard, { backgroundColor: theme.surface }]}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product!._id })}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: product!.image }} style={styles.recImage} />
                    <View style={styles.recMatchBadge}>
                      <Star size={10} color={colors.white} fill={colors.white} />
                      <Text style={styles.recMatchText}>Match</Text>
                    </View>
                    <View style={styles.recInfo}>
                      <Text style={[styles.recName, { color: theme.text }]} numberOfLines={2}>{product!.name}</Text>
                      <Text style={[styles.recCategory, { color: theme.textSecondary }]}>{product!.category}</Text>
                      {rec.reasons?.length > 0 && (
                        <Text style={[styles.recReason, { color: theme.textSecondary }]} numberOfLines={2}>{rec.reasons[0]}</Text>
                      )}
                      <Text style={styles.recLearnMore}>Learn more →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Cart Banner */}
        {getItemCount() > 0 && (
          <View style={styles.section}>
            <Card onPress={() => navigation.getParent()?.navigate('CartTab')} style={styles.cartCard} padding="md">
              <View style={styles.cartContent}>
                <View style={[styles.cartIcon, { backgroundColor: colors.warning + '20' }]}>
                  <ShoppingCart size={24} color={colors.warning} />
                </View>
                <View style={styles.cartInfo}>
                  <Text style={[styles.cartTitle, { color: theme.text }]}>Quote List</Text>
                  <Text style={[styles.cartSubtitle, { color: theme.textSecondary }]}>{getItemCount()} {getItemCount() === 1 ? 'item' : 'items'} ready for quotation</Text>
                </View>
                <ChevronRight size={20} color={colors.gray[400]} />
              </View>
            </Card>
          </View>
        )}

        {/* Account History */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <History size={18} color={colors.white} />
            <Text style={styles.historyHeaderText}>Account History</Text>
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsScroll, { backgroundColor: theme.border }]}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab, activeTab === tab.id && { backgroundColor: theme.surface }]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <tab.icon size={14} color={activeTab === tab.id ? colors.primary[600] : colors.gray[500]} />
                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tab Content */}
          <View style={[styles.tabContent, { backgroundColor: theme.surface }]}>
            {tabLoading ? (
              <ActivityIndicator color={colors.primary[600]} style={{ margin: 24 }} />
            ) : (
              <>
                {activeTab === 'bookings' && renderBookings()}
                {activeTab === 'purchases' && renderPurchases()}
                {activeTab === 'quotes' && renderQuotes()}
                {activeTab === 'reviews' && renderReviews()}
                {activeTab === 'activity' && renderActivity()}
              </>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    padding: 20,
    backgroundColor: colors.primary[600],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: { fontSize: 16, color: colors.primary[200] },
  userName: { fontSize: 28, fontWeight: 'bold', color: colors.white, marginTop: 4 },
  company: { fontSize: 14, color: colors.primary[200], marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.gray[900], marginBottom: 12 },
  sectionSubtitle: { fontSize: 13, color: colors.gray[500], marginBottom: 12, marginTop: -8 },
  quickActionsColumn: { gap: 10 },
  quickActionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 12, padding: 14,
    borderLeftWidth: 4,
    shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  quickActionCardIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickActionCardText: { flex: 1 },
  quickActionCardLabel: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  quickActionCardDesc: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  // Recommendations
  recScroll: { marginTop: 4 },
  recCard: {
    width: 160, backgroundColor: colors.white, borderRadius: 12, marginRight: 12, overflow: 'hidden',
    shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  recImage: { width: '100%', height: 100 },
  recMatchBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: colors.primary[600],
    flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
  },
  recMatchText: { fontSize: 10, color: colors.white, fontWeight: '600' },
  recInfo: { padding: 10 },
  recName: { fontSize: 13, fontWeight: '600', color: colors.gray[900], marginBottom: 2 },
  recCategory: { fontSize: 11, color: colors.gray[500], marginBottom: 4 },
  recReason: { fontSize: 11, color: colors.gray[600], fontStyle: 'italic', marginBottom: 6 },
  recLearnMore: { fontSize: 12, color: colors.primary[600], fontWeight: '600' },
  // Cart
  cartCard: { backgroundColor: colors.white },
  cartContent: { flexDirection: 'row', alignItems: 'center' },
  cartIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cartInfo: { flex: 1, marginLeft: 12 },
  cartTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  cartSubtitle: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  // History
  historyHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary[600], paddingHorizontal: 16, paddingVertical: 12,
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },
  historyHeaderText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  tabsScroll: { backgroundColor: colors.gray[100] },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: colors.primary[600], backgroundColor: colors.white },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.gray[500] },
  activeTabText: { color: colors.primary[600] },
  tabContent: { backgroundColor: colors.white, padding: 16, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, minHeight: 120 },
  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900], marginTop: 12, marginBottom: 4 },
  emptyText: { fontSize: 14, color: colors.gray[500], textAlign: 'center', marginBottom: 16 },
  emptyAction: { backgroundColor: colors.primary[600], paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  emptyActionText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  // History cards
  historyCard: {
    backgroundColor: colors.gray[50], borderRadius: 10, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: colors.gray[200],
  },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  historyCardTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[900], flex: 1, marginRight: 8 },
  historyCardSub: { fontSize: 13, color: colors.gray[500], marginBottom: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  historyRowText: { fontSize: 13, color: colors.gray[600] },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  purchaseItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  purchaseItemName: { fontSize: 13, color: colors.gray[700], flex: 1 },
  purchaseItemPrice: { fontSize: 13, color: colors.gray[900], fontWeight: '500' },
  purchaseTotal: {
    flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8,
    borderTopWidth: 1, borderTopColor: colors.gray[200], marginTop: 4,
  },
  purchaseTotalLabel: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  purchaseTotalValue: { fontSize: 14, fontWeight: 'bold', color: colors.primary[600] },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 14, color: colors.gray[700], marginVertical: 6 },
  activityItem: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  activityDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activityContent: { flex: 1 },
  activityAction: { fontSize: 14, fontWeight: '500', color: colors.gray[900] },
  activityDetails: { fontSize: 13, color: colors.gray[600], marginTop: 2 },
  activityTime: { fontSize: 12, color: colors.gray[400], marginTop: 4 },
  bottomPadding: { height: 24 },
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1, minWidth: '45%', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.white },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  // Getting Started
  gettingStartedCard: {
    backgroundColor: colors.white, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  gettingStartedTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  gettingStartedSubtitle: { fontSize: 13, color: colors.gray[500], marginBottom: 14 },
  gettingStartedStep: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  gettingStartedDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary[600],
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  gettingStartedNum: { fontSize: 13, fontWeight: 'bold', color: colors.white },
  gettingStartedStepText: { flex: 1, fontSize: 14, color: colors.gray[700] },
  // Progress
  progressCard: {
    backgroundColor: colors.white, borderRadius: 10, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  progressCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressCardTitle: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.gray[900] },
  progressBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  progressBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  progressBarTrack: { height: 6, backgroundColor: colors.gray[100], borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
});

export default UserDashboardScreen;
