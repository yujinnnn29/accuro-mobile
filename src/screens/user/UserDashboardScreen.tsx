import React, { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  ArrowLeft,
} from 'lucide-react-native';
import { useAuth, useCart, useTheme } from '../../contexts';
import { bookingService, quotationService, recommendationService, purchaseHistoryService, activityLogService, quoteService, reviewService } from '../../api';
import { ActivityStats } from '../../api/activityService';
import { getProductById } from '../../data/products';
import { colors } from '../../theme';
import { Card, Badge, LoadingSpinner } from '../../components/common';
import { HomeStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList> & { getParent: () => any };
type TabType = 'bookings' | 'purchases' | 'quotes' | 'reviews' | 'activity';

const CACHE_KEY = 'user_dashboard_cache';

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

  // Track which tabs have been fetched this session
  const fetchedTabs = useRef<Set<TabType>>(new Set());

  const computeAndSetStats = (allBookings: any[], allQuotations: any[]) => {
    setStats({
      bookings: {
        total: allBookings.length,
        pending: allBookings.filter((b: any) => b.status === 'pending').length,
        confirmed: allBookings.filter((b: any) => b.status === 'confirmed').length,
        completed: allBookings.filter((b: any) => b.status === 'completed').length,
        cancelled: allBookings.filter((b: any) => b.status === 'cancelled').length,
      },
      quotations: {
        total: allQuotations.length,
        pending: allQuotations.filter((q: any) => q.status === 'pending').length,
        approved: allQuotations.filter((q: any) => q.status === 'approved' || q.status === 'accepted').length,
        rejected: allQuotations.filter((q: any) => q.status === 'rejected').length,
      },
      reviews: { total: 0, pending: 0 },
    });
  };

  const fetchAllData = useCallback(async () => {
    try {
      // Fetch bookings + quotations in parallel (stats + first tab in one shot)
      const [bookingsRes, quotationsRes, recRes] = await Promise.allSettled([
        bookingService.getMyBookings(),
        quotationService.getMyQuotations(),
        recommendationService.getRecommendations(5),
      ]);

      const allBookings = bookingsRes.status === 'fulfilled' ? (bookingsRes.value.data || []) : [];
      const allQuotations = quotationsRes.status === 'fulfilled' ? (quotationsRes.value.data || []) : [];

      computeAndSetStats(allBookings, allQuotations);
      setBookings(allBookings);
      fetchedTabs.current?.add('bookings');

      if (recRes.status === 'fulfilled') {
        setRecommendations(recRes.value.data || []);
      }

      // Cache for next open
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        stats: {
          bookings: {
            total: allBookings.length,
            pending: allBookings.filter((b: any) => b.status === 'pending').length,
            confirmed: allBookings.filter((b: any) => b.status === 'confirmed').length,
            completed: allBookings.filter((b: any) => b.status === 'completed').length,
            cancelled: allBookings.filter((b: any) => b.status === 'cancelled').length,
          },
          quotations: {
            total: allQuotations.length,
            pending: allQuotations.filter((q: any) => q.status === 'pending').length,
            approved: allQuotations.filter((q: any) => q.status === 'approved' || q.status === 'accepted').length,
            rejected: allQuotations.filter((q: any) => q.status === 'rejected').length,
          },
          reviews: { total: 0, pending: 0 },
        },
        bookings: allBookings,
      })).catch(() => {});
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
      setRecLoading(false);
      setTabLoading(false);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchTabData = useCallback(async (tab: TabType) => {
    if (tab === 'bookings') return; // already fetched in fetchAllData
    if (fetchedTabs.current?.has(tab) && !refreshing) return; // already loaded this session
    setTabLoading(true);
    try {
      switch (tab) {
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
      fetchedTabs.current?.add(tab);
    } catch {
      // silently fail
    } finally {
      setTabLoading(false);
    }
  }, [refreshing]);

  useEffect(() => {
    // Load cache instantly, then fetch fresh data in background
    AsyncStorage.getItem(CACHE_KEY).then(cached => {
      if (cached) {
        const data = JSON.parse(cached);
        if (data.stats) { setStats(data.stats); setStatsLoading(false); }
        if (data.bookings) { setBookings(data.bookings); setLoading(false); setTabLoading(false); }
      }
    }).catch(() => {});
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    if (fetchedTabs.current) fetchedTabs.current.clear();
    fetchAllData();
    if (activeTab !== 'bookings') fetchTabData(activeTab);
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
          <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.getParent()?.navigate('HomeTab', { screen: 'Booking', params: {} })}>
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
          <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.getParent()?.navigate('HomeTab', { screen: 'Products' })}>
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
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={22} color={colors.white} />
            </TouchableOpacity>
          )}
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
                onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'Products' }),
              },
              {
                icon: FileText,
                label: 'Request a Quote',
                desc: 'Get a customized quotation',
                borderColor: '#059669',
                iconBg: '#f0fdf4',
                iconColor: '#059669',
                onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'RequestQuote', params: {} }),
              },
              {
                icon: Calendar,
                label: 'Book a Consultation',
                desc: 'Schedule a meeting with our team',
                borderColor: '#7c3aed',
                iconBg: '#f5f3ff',
                iconColor: '#7c3aed',
                onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'Booking', params: {} }),
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
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.primary[600] }]}>
              <Text style={styles.statValue}>{statsLoading ? '—' : (stats?.bookings.total ?? 0)}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.success }]}>
              <Text style={styles.statValue}>{statsLoading ? '—' : (stats?.bookings.completed ?? 0)}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#059669' }]}>
              <Text style={styles.statValue}>{statsLoading ? '—' : (stats?.quotations.total ?? 0)}</Text>
              <Text style={styles.statLabel}>Quotations</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#16A34A' }]}>
              <Text style={styles.statValue}>{statsLoading ? '—' : (stats?.quotations.approved ?? 0)}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
          </View>
        </View>

        {/* Getting Started (new users) */}
        {!statsLoading && isNewUser && (
          <View style={styles.section}>
            <View style={[styles.gettingStartedCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.gettingStartedTitle, { color: theme.text }]}>Getting Started</Text>
              <Text style={[styles.gettingStartedSubtitle, { color: theme.textSecondary }]}>Complete these steps to get the most out of Accuro</Text>
              {[
                { label: 'Browse our product catalog', done: false, onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'Products' }) },
                { label: 'Book a meeting with our team', done: false, onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'Booking', params: {} }) },
                { label: 'Request a product quotation', done: false, onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'RequestQuote', params: {} }) },
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
                    onPress={() => navigation.getParent()?.navigate('HomeTab', { screen: 'ProductDetail', params: { productId: product!._id } })}
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
  backButton: {
    marginBottom: 8,
    alignSelf: 'flex-start',
    padding: 4,
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
