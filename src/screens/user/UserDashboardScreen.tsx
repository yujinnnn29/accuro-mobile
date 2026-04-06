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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
  ChevronLeft,
  Star,
  Activity,
  History,
  TrendingUp,
  Sparkles,
  XCircle,
  AlertCircle,
  MapPin,
  MessageSquare,
  ArrowLeft,
  Eye,
  ThumbsDown,
  Building,
  User,
  Phone,
  Mail,
  Info,
  X,
} from 'lucide-react-native';
import { useAuth, useCart, useTheme } from '../../contexts';
import { bookingService, quotationService, recommendationService, activityLogService, reviewService } from '../../api';
import { ActivityStats } from '../../api/activityService';
import { getProductById } from '../../data/products';
import { colors } from '../../theme';
import { Card } from '../../components/common';
import { HomeStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList> & { getParent: () => any };
type TabType = 'bookings' | 'quotes' | 'reviews' | 'activity';

const CACHE_KEY = 'user_dashboard_cache';
const ITEMS_PER_PAGE = 5;

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
  const [quotes, setQuotes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Booking detail modal
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Quotation detail modal
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Track which tabs have been fetched this session
  const fetchedTabs = useRef<Set<TabType>>(new Set());

  // ─── Stats & Data Helpers ───────────────────────────────────────────────────

  const computeStats = (allBookings: any[], allQuotations: any[]): ActivityStats => ({
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
      approved: allQuotations.filter((q: any) => q.status === 'accepted').length,
      rejected: allQuotations.filter((q: any) => q.status === 'rejected').length,
    },
    reviews: { total: 0, pending: 0 },
  });

  const fetchAllData = useCallback(async () => {
    try {
      const [bookingsRes, quotationsRes, recRes] = await Promise.allSettled([
        bookingService.getMyBookings(),
        quotationService.getMyQuotations(),
        recommendationService.getRecommendations(5),
      ]);
      const allBookings = bookingsRes.status === 'fulfilled' ? (bookingsRes.value.data || []) : [];
      const allQuotations = quotationsRes.status === 'fulfilled' ? (quotationsRes.value.data || []) : [];

      const newStats = computeStats(allBookings, allQuotations);
      setStats(newStats);
      setBookings(allBookings);
      setQuotes(allQuotations);
      fetchedTabs.current?.add('bookings');
      fetchedTabs.current?.add('quotes');

      if (recRes.status === 'fulfilled') setRecommendations(recRes.value.data || []);

      // Only cache when we have real data — never cache zeros
      if (allBookings.length > 0 || allQuotations.length > 0) {
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ stats: newStats, bookings: allBookings, quotes: allQuotations })).catch(() => {});
      }
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
    if (tab === 'bookings' || tab === 'quotes') return;
    if (fetchedTabs.current?.has(tab) && !refreshing) return;
    setTabLoading(true);
    try {
      switch (tab) {
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
    AsyncStorage.getItem(CACHE_KEY).then(cached => {
      if (cached) {
        const data = JSON.parse(cached);
        const hasData = data.stats && (data.stats.bookings?.total > 0 || data.stats.quotations?.total > 0);
        if (hasData) {
          setStats(data.stats); setStatsLoading(false);
          if (data.bookings?.length > 0) { setBookings(data.bookings); setLoading(false); setTabLoading(false); }
          if (data.quotes?.length > 0) setQuotes(data.quotes);
        } else {
          // Wipe stale zero cache so it doesn't interfere
          AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
        }
      }
    }).catch(() => {});
    fetchAllData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchTabData(activeTab);
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    if (fetchedTabs.current) fetchedTabs.current.clear();
    fetchAllData();
    if (activeTab !== 'bookings' && activeTab !== 'quotes') fetchTabData(activeTab);
  };

  // ─── Quotation Actions ──────────────────────────────────────────────────────

  const handleAcceptQuotation = async (id: string) => {
    try {
      setActionLoading(true);
      const response = await quotationService.acceptQuotation(id);
      if (response.data) setSelectedQuotation(response.data);
      const updated = await quotationService.getMyQuotations();
      setQuotes(updated.data || []);
    } catch {
      // silently fail
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineQuotation = async () => {
    if (!selectedQuotation) return;
    try {
      setActionLoading(true);
      const response = await quotationService.declineQuotation(selectedQuotation._id, declineReason || undefined);
      setShowDeclineModal(false);
      setDeclineReason('');
      if (response.data) setSelectedQuotation(response.data);
      const updated = await quotationService.getMyQuotations();
      setQuotes(updated.data || []);
    } catch {
      // silently fail
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const isNewUser = stats ? stats.bookings.total === 0 && stats.quotations.total === 0 : false;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const paginate = (items: any[]) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const totalPages = (items: any[]) => Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const currentTabItems = () => {
    switch (activeTab) {
      case 'bookings': return bookings;
      case 'quotes': return quotes;
      case 'reviews': return reviews;
      case 'activity': return activityLogs;
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'confirmed': return colors.primary[600];
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'rescheduled': return '#7c3aed';
      default: return colors.gray[500];
    }
  };

  const getQuotationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'quoted': return colors.primary[600];
      case 'accepted': return colors.success;
      case 'declined': return '#ea580c';
      case 'rejected': return colors.error;
      case 'expired': return colors.gray[500];
      default: return colors.gray[500];
    }
  };

  const getQuotationStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Your quotation is being reviewed by our team...';
      case 'quoted': return 'A quote has been provided for your review';
      case 'accepted': return 'You have accepted this quotation';
      case 'declined': return 'You have declined this quotation';
      case 'rejected': return 'This quotation has been rejected';
      case 'expired': return 'This quotation has expired';
      default: return '';
    }
  };

  const getActivityIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'booking': return Calendar;
      case 'review': return Star;
      case 'quote': return FileText;
      case 'purchase': return ShoppingCart;
      default: return Activity;
    }
  };

  const getActivityColor = (resourceType: string) => {
    switch (resourceType) {
      case 'booking': return { bg: colors.primary[50], icon: colors.primary[600] };
      case 'review': return { bg: '#fef9c3', icon: '#ca8a04' };
      case 'quote': return { bg: '#f5f3ff', icon: '#7c3aed' };
      case 'purchase': return { bg: '#f0fdf4', icon: '#059669' };
      default: return { bg: colors.gray[100], icon: colors.gray[500] };
    }
  };

  const tabs: { id: TabType; label: string; icon: any; count: number }[] = [
    { id: 'bookings', label: 'My Bookings', icon: Calendar, count: bookings.length },
    { id: 'quotes', label: 'Quote Requests', icon: FileText, count: quotes.length },
    { id: 'reviews', label: 'My Reviews', icon: Star, count: reviews.length },
    { id: 'activity', label: 'Activity Log', icon: Activity, count: activityLogs.length },
  ];

  // ─── Render: Bookings Tab ───────────────────────────────────────────────────

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
    return (
      <>
        {paginate(bookings).map((b: any) => (
          <View key={b._id} style={[styles.historyCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.historyCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyCardTitle, { color: theme.text }]}>{b.company || 'Booking'}</Text>
                <Text style={[styles.historyCardSub, { color: theme.textSecondary }]}>{b.product}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getBookingStatusColor(b.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getBookingStatusColor(b.status) }]}>{b.status}</Text>
              </View>
            </View>
            <View style={styles.historyRows}>
              <View style={styles.historyRow}>
                <Calendar size={13} color={colors.primary[600]} />
                <Text style={[styles.historyRowText, { color: theme.textSecondary }]}>
                  {new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.historyRow}>
                <Clock size={13} color={colors.primary[600]} />
                <Text style={[styles.historyRowText, { color: theme.textSecondary }]}>{b.time}</Text>
              </View>
              {b.location ? (
                <View style={styles.historyRow}>
                  <MapPin size={13} color={colors.primary[600]} />
                  <Text style={[styles.historyRowText, { color: theme.textSecondary }]}>{b.location}</Text>
                </View>
              ) : null}
              <View style={styles.historyRow}>
                <Package size={13} color={colors.primary[600]} />
                <Text style={[styles.historyRowText, { color: theme.textSecondary }]}>ID: {b._id?.slice(-8)}</Text>
              </View>
            </View>
            {b.message ? (
              <View style={styles.messageRow}>
                <MessageSquare size={12} color={colors.gray[400]} />
                <Text style={[styles.messageText, { color: theme.textSecondary }]} numberOfLines={2}>{b.message}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => { setSelectedBooking(b); setIsBookingModalOpen(true); }}
              activeOpacity={0.7}
            >
              <Eye size={14} color={colors.primary[600]} />
              <Text style={styles.viewDetailsBtnText}>View Details</Text>
            </TouchableOpacity>
          </View>
        ))}
        {renderPagination(bookings)}
      </>
    );
  };

  // ─── Render: Quotes Tab ─────────────────────────────────────────────────────

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
    return (
      <>
        {paginate(quotes).map((q: any) => (
          <View key={q._id} style={[styles.historyCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.quoteCardHeader}>
              <View style={styles.quoteCardLeft}>
                <Clock size={18} color={colors.gray[400]} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.historyCardTitle, { color: theme.text, marginBottom: 0 }]}>{q.quotationNumber || `#${q._id?.slice(-8)}`}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getQuotationStatusColor(q.status) + '20', marginLeft: 8 }]}>
                  <Text style={[styles.statusText, { color: getQuotationStatusColor(q.status) }]}>{q.status?.toUpperCase()}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewDetailsBtnPrimary}
                onPress={() => { setSelectedQuotation(q); setIsQuotationModalOpen(true); }}
                activeOpacity={0.7}
              >
                <Eye size={14} color={colors.white} />
                <Text style={styles.viewDetailsBtnPrimaryText}>View</Text>
              </TouchableOpacity>
            </View>
            {getQuotationStatusMessage(q.status) ? (
              <Text style={[styles.quoteStatusMsg, { color: theme.textSecondary }]}>{getQuotationStatusMessage(q.status)}</Text>
            ) : null}
            <View style={styles.historyRow}>
              <Calendar size={13} color={colors.gray[400]} />
              <Text style={[styles.historyRowText, { color: theme.textSecondary }]}>
                Requested: {new Date(q.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={[styles.historyCardSub, { color: theme.textSecondary, marginTop: 4 }]}>{q.items?.length || 0} item(s) requested</Text>
            {q.totalAmount != null && (
              <Text style={styles.quoteTotalText}>
                Total: {q.currency === 'PHP' ? '₱' : '$'}{q.totalAmount.toLocaleString()}
              </Text>
            )}
            {q.validUntil && (
              <Text style={[styles.quoteValidText, { color: theme.textSecondary }]}>
                Valid until: {new Date(q.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </Text>
            )}
          </View>
        ))}
        {renderPagination(quotes)}
      </>
    );
  };

  // ─── Render: Reviews Tab ────────────────────────────────────────────────────

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
    return (
      <>
        {paginate(reviews).map((r: any) => (
          <View key={r._id} style={[styles.historyCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.historyCardHeader}>
              <View>
                <View style={styles.starsRow}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} color={i <= r.rating ? '#FBBF24' : colors.gray[300]} fill={i <= r.rating ? '#FBBF24' : 'transparent'} />
                  ))}
                  <Text style={[styles.ratingText, { color: theme.textSecondary }]}>{r.rating} stars</Text>
                </View>
                {r.company ? <Text style={[styles.historyCardSub, { color: theme.textSecondary, marginTop: 4 }]}>Company: {r.company}</Text> : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={[styles.statusBadge, { backgroundColor: r.isApproved ? colors.success + '20' : colors.warning + '20' }]}>
                  <Text style={[styles.statusText, { color: r.isApproved ? colors.success : colors.warning }]}>
                    {r.isApproved ? 'Approved' : 'Pending'}
                  </Text>
                </View>
                {r.isPublic && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.primary[100] }]}>
                    <Text style={[styles.statusText, { color: colors.primary[600] }]}>Public</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={[styles.reviewComment, { color: theme.text }]}>{r.comment}</Text>
            <View style={[styles.reviewFooter, { borderTopColor: theme.border }]}>
              <View style={styles.historyRow}>
                <Calendar size={12} color={colors.gray[400]} />
                <Text style={[styles.historyRowText, { color: theme.textSecondary, fontSize: 12 }]}>
                  {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </View>
              {r.reviewType && <Text style={[styles.historyCardSub, { color: theme.textSecondary, fontSize: 12, marginBottom: 0 }]}>{r.reviewType} Review</Text>}
            </View>
          </View>
        ))}
        {renderPagination(reviews)}
      </>
    );
  };

  // ─── Render: Activity Tab ───────────────────────────────────────────────────

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
    return (
      <>
        {paginate(activityLogs).map((log: any) => {
          const Icon = getActivityIcon(log.resourceType);
          const { bg, icon } = getActivityColor(log.resourceType);
          return (
            <View key={log._id} style={[styles.historyCard, { backgroundColor: theme.background, borderColor: theme.border, flexDirection: 'row', gap: 12 }]}>
              <View style={[styles.activityDot, { backgroundColor: bg }]}>
                <Icon size={16} color={icon} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.activityHeader}>
                  <Text style={[styles.activityAction, { color: theme.text, flex: 1 }]}>{log.action}</Text>
                  <View style={[styles.activityTypeBadge, { backgroundColor: colors.gray[100] }]}>
                    <Text style={[styles.activityTypeText, { color: colors.gray[600] }]}>{log.resourceType}</Text>
                  </View>
                </View>
                {log.details ? <Text style={[styles.activityDetails, { color: theme.textSecondary }]}>{log.details}</Text> : null}
                <View style={[styles.historyRow, { marginTop: 6 }]}>
                  <Clock size={12} color={colors.gray[400]} />
                  <Text style={[styles.historyRowText, { color: theme.textSecondary, fontSize: 12 }]}>
                    {new Date(log.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
        {renderPagination(activityLogs)}
      </>
    );
  };

  // ─── Pagination ─────────────────────────────────────────────────────────────

  const renderPagination = (items: any[]) => {
    const total = totalPages(items);
    if (total <= 1) return null;
    return (
      <View style={styles.pagination}>
        <Text style={[styles.paginationInfo, { color: theme.textSecondary }]}>
          {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, items.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, items.length)} of {items.length}
        </Text>
        <View style={styles.paginationButtons}>
          <TouchableOpacity
            style={[styles.pageBtn, { borderColor: theme.border, backgroundColor: theme.surface, opacity: currentPage === 1 ? 0.4 : 1 }]}
            onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} color={theme.text} />
            <Text style={[styles.pageBtnText, { color: theme.text }]}>Prev</Text>
          </TouchableOpacity>
          <Text style={[styles.paginationInfo, { color: theme.textSecondary }]}>{currentPage} / {total}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, { borderColor: theme.border, backgroundColor: theme.surface, opacity: currentPage === total ? 0.4 : 1 }]}
            onPress={() => setCurrentPage(p => Math.min(total, p + 1))}
            disabled={currentPage === total}
          >
            <Text style={[styles.pageBtnText, { color: theme.text }]}>Next</Text>
            <ChevronRight size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Booking Detail Modal ───────────────────────────────────────────────────

  const renderBookingModal = () => {
    if (!selectedBooking) return null;
    return (
      <Modal visible={isBookingModalOpen} animationType="slide" transparent onRequestClose={() => setIsBookingModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Calendar size={20} color={colors.white} />
                <Text style={styles.modalHeaderTitle}>Booking Details</Text>
              </View>
              <TouchableOpacity onPress={() => { setIsBookingModalOpen(false); setSelectedBooking(null); }}>
                <X size={22} color={colors.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* ID & Status */}
              <View style={styles.modalRow}>
                <View>
                  <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Booking ID</Text>
                  <Text style={[styles.modalMono, { color: theme.text }]}>{selectedBooking._id}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getBookingStatusColor(selectedBooking.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getBookingStatusColor(selectedBooking.status) }]}>{selectedBooking.status}</Text>
                </View>
              </View>

              {/* Company & Contact */}
              <View style={styles.modalGrid}>
                <View style={[styles.modalSection, { backgroundColor: theme.surface }]}>
                  <View style={styles.modalSectionHeader}>
                    <Building size={14} color={colors.primary[600]} />
                    <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Company</Text>
                  </View>
                  <Text style={[styles.modalValue, { color: theme.text }]}>{selectedBooking.company}</Text>
                </View>
                <View style={[styles.modalSection, { backgroundColor: theme.surface }]}>
                  <View style={styles.modalSectionHeader}>
                    <User size={14} color={colors.primary[600]} />
                    <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Contact</Text>
                  </View>
                  {selectedBooking.contactName ? <View style={styles.contactRow}><User size={12} color={colors.gray[400]} /><Text style={[styles.contactText, { color: theme.text }]}>{selectedBooking.contactName}</Text></View> : null}
                  {selectedBooking.contactEmail ? <View style={styles.contactRow}><Mail size={12} color={colors.gray[400]} /><Text style={[styles.contactText, { color: theme.text }]}>{selectedBooking.contactEmail}</Text></View> : null}
                  {selectedBooking.contactPhone ? <View style={styles.contactRow}><Phone size={12} color={colors.gray[400]} /><Text style={[styles.contactText, { color: theme.text }]}>{selectedBooking.contactPhone}</Text></View> : null}
                </View>
              </View>

              {/* Meeting Details */}
              <View style={[styles.meetingDetails, { backgroundColor: colors.primary[50] }]}>
                <Text style={[styles.modalSectionTitle, { color: theme.text, marginBottom: 12 }]}>Meeting Details</Text>
                <View style={styles.meetingGrid}>
                  {[
                    { icon: Calendar, label: 'Date', value: selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '' },
                    { icon: Clock, label: 'Time', value: selectedBooking.time },
                    { icon: MapPin, label: 'Location', value: selectedBooking.location },
                    { icon: Package, label: 'Product/Service', value: selectedBooking.product },
                  ].map(({ icon: Icon, label, value }) => value ? (
                    <View key={label} style={styles.meetingItem}>
                      <View style={styles.meetingItemIcon}><Icon size={18} color={colors.primary[600]} /></View>
                      <View>
                        <Text style={styles.meetingItemLabel}>{label}</Text>
                        <Text style={[styles.meetingItemValue, { color: theme.text }]}>{value}</Text>
                      </View>
                    </View>
                  ) : null)}
                </View>
              </View>

              {/* Purpose */}
              {selectedBooking.purpose ? (
                <View style={{ marginTop: 16 }}>
                  <View style={styles.modalSectionHeader}><Info size={14} color={colors.primary[600]} /><Text style={[styles.modalSectionTitle, { color: theme.text }]}>Purpose</Text></View>
                  <View style={[styles.infoBox, { backgroundColor: theme.surface }]}><Text style={[styles.modalValue, { color: theme.text }]}>{selectedBooking.purpose}</Text></View>
                </View>
              ) : null}

              {/* Additional Info */}
              {selectedBooking.additionalInfo ? (
                <View style={{ marginTop: 16 }}>
                  <View style={styles.modalSectionHeader}><MessageSquare size={14} color={colors.primary[600]} /><Text style={[styles.modalSectionTitle, { color: theme.text }]}>Additional Information</Text></View>
                  <View style={[styles.infoBox, { backgroundColor: theme.surface }]}><Text style={[styles.modalValue, { color: theme.text }]}>{selectedBooking.additionalInfo}</Text></View>
                </View>
              ) : null}

              {/* Conclusion */}
              {selectedBooking.conclusion ? (
                <View style={{ marginTop: 16 }}>
                  <View style={styles.modalSectionHeader}><CheckCircle size={14} color={colors.success} /><Text style={[styles.modalSectionTitle, { color: theme.text }]}>Meeting Conclusion</Text></View>
                  <View style={[styles.infoBox, { backgroundColor: '#f0fdf4' }]}><Text style={[styles.modalValue, { color: theme.text }]}>{selectedBooking.conclusion}</Text></View>
                </View>
              ) : null}

              {/* Cancellation Reason */}
              {selectedBooking.status === 'cancelled' && selectedBooking.cancellationReason ? (
                <View style={{ marginTop: 16 }}>
                  <View style={styles.modalSectionHeader}><XCircle size={14} color={colors.error} /><Text style={[styles.modalSectionTitle, { color: theme.text }]}>Cancellation Reason</Text></View>
                  <View style={[styles.infoBox, { backgroundColor: '#fef2f2' }]}><Text style={[styles.modalValue, { color: theme.text }]}>{selectedBooking.cancellationReason}</Text></View>
                </View>
              ) : null}

              {/* Created At */}
              {selectedBooking.createdAt ? (
                <Text style={[styles.modalFooterText, { color: theme.textSecondary }]}>
                  Created on {new Date(selectedBooking.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              ) : null}
            </ScrollView>
            <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => { setIsBookingModalOpen(false); setSelectedBooking(null); }}>
                <Text style={[styles.closeBtnText, { color: theme.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Quotation Detail Modal ─────────────────────────────────────────────────

  const renderQuotationModal = () => {
    if (!selectedQuotation) return null;
    return (
      <Modal visible={isQuotationModalOpen} animationType="slide" transparent onRequestClose={() => setIsQuotationModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FileText size={20} color={colors.white} />
                <Text style={styles.modalHeaderTitle}>Quotation Details</Text>
              </View>
              <TouchableOpacity onPress={() => { setIsQuotationModalOpen(false); setSelectedQuotation(null); }}>
                <X size={22} color={colors.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Number & Status */}
              <View style={styles.modalRow}>
                <View>
                  <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Quotation Number</Text>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedQuotation.quotationNumber || `#${selectedQuotation._id?.slice(-8)}`}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getQuotationStatusColor(selectedQuotation.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getQuotationStatusColor(selectedQuotation.status) }]}>{selectedQuotation.status?.toUpperCase()}</Text>
                </View>
              </View>

              {/* Company & Contact */}
              <View style={styles.modalGrid}>
                <View style={[styles.modalSection, { backgroundColor: theme.surface }]}>
                  <View style={styles.modalSectionHeader}><Building size={14} color={colors.primary[600]} /><Text style={[styles.modalSectionTitle, { color: theme.text }]}>Company</Text></View>
                  <Text style={[styles.modalValue, { color: theme.text }]}>{selectedQuotation.company}</Text>
                </View>
                <View style={[styles.modalSection, { backgroundColor: theme.surface }]}>
                  <View style={styles.modalSectionHeader}><User size={14} color={colors.primary[600]} /><Text style={[styles.modalSectionTitle, { color: theme.text }]}>Contact</Text></View>
                  {selectedQuotation.customerName ? <View style={styles.contactRow}><User size={12} color={colors.gray[400]} /><Text style={[styles.contactText, { color: theme.text }]}>{selectedQuotation.customerName}</Text></View> : null}
                  {selectedQuotation.customerEmail ? <View style={styles.contactRow}><Mail size={12} color={colors.gray[400]} /><Text style={[styles.contactText, { color: theme.text }]}>{selectedQuotation.customerEmail}</Text></View> : null}
                  {selectedQuotation.customerPhone ? <View style={styles.contactRow}><Phone size={12} color={colors.gray[400]} /><Text style={[styles.contactText, { color: theme.text }]}>{selectedQuotation.customerPhone}</Text></View> : null}
                </View>
              </View>

              {/* Items */}
              <View style={{ marginTop: 16 }}>
                <View style={styles.modalSectionHeader}><Package size={14} color={colors.primary[600]} /><Text style={[styles.modalSectionTitle, { color: theme.text }]}>Requested Items</Text></View>
                {selectedQuotation.items?.map((item: any, i: number) => (
                  <View key={i} style={[styles.itemRow, { backgroundColor: theme.surface }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: theme.text }]}>{item.productName}</Text>
                      {item.specifications ? <Text style={[styles.itemSpec, { color: theme.textSecondary }]}>{item.specifications}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.itemQty, { color: theme.text }]}>Qty: {item.quantity}</Text>
                      {item.unitPrice != null ? (
                        <Text style={[styles.itemPrice, { color: theme.textSecondary }]}>
                          {selectedQuotation.currency === 'PHP' ? '₱' : '$'}{item.unitPrice.toFixed(2)} each
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>

              {/* Pricing */}
              {selectedQuotation.totalAmount != null && (
                <View style={styles.pricingBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.pricingLabel, { color: theme.text }]}>Total Amount</Text>
                    <Text style={styles.pricingValue}>{selectedQuotation.currency === 'PHP' ? '₱' : '$'}{selectedQuotation.totalAmount.toFixed(2)}</Text>
                  </View>
                  {selectedQuotation.validUntil ? <Text style={[styles.pricingSub, { color: theme.textSecondary }]}>Valid until: {new Date(selectedQuotation.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text> : null}
                  {selectedQuotation.paymentTerms ? <Text style={[styles.pricingSub, { color: theme.textSecondary }]}>Payment Terms: {selectedQuotation.paymentTerms}</Text> : null}
                  {selectedQuotation.deliveryTerms ? <Text style={[styles.pricingSub, { color: theme.textSecondary }]}>Delivery Terms: {selectedQuotation.deliveryTerms}</Text> : null}
                </View>
              )}

              {/* Additional Requirements */}
              {selectedQuotation.additionalRequirements ? (
                <View style={{ marginTop: 16 }}>
                  <View style={styles.modalSectionHeader}><MessageSquare size={14} color={colors.primary[600]} /><Text style={[styles.modalSectionTitle, { color: theme.text }]}>Additional Requirements</Text></View>
                  <View style={[styles.infoBox, { backgroundColor: theme.surface }]}><Text style={[styles.modalValue, { color: theme.text }]}>{selectedQuotation.additionalRequirements}</Text></View>
                </View>
              ) : null}

              {/* Admin Notes */}
              {selectedQuotation.adminNotes ? (
                <View style={{ marginTop: 16 }}>
                  <View style={styles.modalSectionHeader}><Info size={14} color={colors.primary[600]} /><Text style={[styles.modalSectionTitle, { color: theme.text }]}>Admin Notes</Text></View>
                  <View style={[styles.infoBox, { backgroundColor: colors.primary[50], borderColor: colors.primary[200], borderWidth: 1 }]}><Text style={[styles.modalValue, { color: theme.text }]}>{selectedQuotation.adminNotes}</Text></View>
                </View>
              ) : null}

              {/* Decline Reason */}
              {selectedQuotation.declineReason ? (
                <View style={{ marginTop: 16 }}>
                  <View style={styles.modalSectionHeader}><XCircle size={14} color={colors.error} /><Text style={[styles.modalSectionTitle, { color: theme.text }]}>Decline Reason</Text></View>
                  <View style={[styles.infoBox, { backgroundColor: '#fef2f2' }]}><Text style={[styles.modalValue, { color: theme.text }]}>{selectedQuotation.declineReason}</Text></View>
                </View>
              ) : null}

              {/* Dates */}
              <View style={[styles.datesSection, { borderTopColor: theme.border }]}>
                <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                  Requested on {new Date(selectedQuotation.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
                {selectedQuotation.quotedAt ? <Text style={[styles.dateText, { color: theme.textSecondary }]}>Quoted on {new Date(selectedQuotation.quotedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text> : null}
                {selectedQuotation.acceptedAt ? <Text style={[styles.dateText, { color: colors.success }]}>Accepted on {new Date(selectedQuotation.acceptedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text> : null}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
              {selectedQuotation.status === 'quoted' && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.acceptBtn, { opacity: actionLoading ? 0.5 : 1 }]}
                    onPress={() => handleAcceptQuotation(selectedQuotation._id)}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={14} color={colors.white} />
                    <Text style={styles.acceptBtnText}>{actionLoading ? 'Processing...' : 'Accept'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.declineBtn, { opacity: actionLoading ? 0.5 : 1 }]}
                    onPress={() => setShowDeclineModal(true)}
                    disabled={actionLoading}
                  >
                    <ThumbsDown size={14} color={colors.white} />
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => { setIsQuotationModalOpen(false); setSelectedQuotation(null); }}>
                <Text style={[styles.closeBtnText, { color: theme.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Decline Modal ──────────────────────────────────────────────────────────

  const renderDeclineModal = () => (
    <Modal visible={showDeclineModal} animationType="fade" transparent onRequestClose={() => setShowDeclineModal(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.declineModalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.declineModalHeader, { borderBottomColor: theme.border }]}>
            <ThumbsDown size={18} color="#ea580c" />
            <Text style={[styles.declineModalTitle, { color: theme.text }]}>Decline Quotation</Text>
          </View>
          <View style={styles.declineModalBody}>
            <Text style={[styles.declineModalDesc, { color: theme.textSecondary }]}>
              Please provide a reason for declining this quotation (optional). The admin may send a revised quote.
            </Text>
            <TextInput
              value={declineReason}
              onChangeText={setDeclineReason}
              placeholder="Reason for declining (optional)..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
              style={[styles.declineInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            />
          </View>
          <View style={[styles.declineModalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => { setShowDeclineModal(false); setDeclineReason(''); }}>
              <Text style={[styles.closeBtnText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.declineBtn, { opacity: actionLoading ? 0.5 : 1 }]}
              onPress={handleDeclineQuotation}
              disabled={actionLoading}
            >
              <Text style={styles.declineBtnText}>{actionLoading ? 'Declining...' : 'Confirm Decline'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const recommendedProducts = recommendations
    .map(r => ({ rec: r, product: getProductById(r.productId) }))
    .filter(({ product }) => !!product);

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* Welcome Header */}
        <View style={styles.header}>
          {/* Decorative circles */}
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />

          {/* Back button */}
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={20} color={colors.white} />
            </TouchableOpacity>
          )}

          <View style={styles.headerContent}>
            {/* Avatar */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user?.name || 'U').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>

            {/* Text */}
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerDashboardLabel}>MY DASHBOARD</Text>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName} numberOfLines={1}>{user?.name || 'User'}</Text>
              {user?.company ? (
                <View style={styles.companyRow}>
                  <Building size={12} color={colors.primary[200]} />
                  <Text style={styles.company} numberOfLines={1}>{user.company}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Date strip */}
          <View style={styles.headerDateStrip}>
            <Calendar size={12} color={colors.primary[200]} />
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsColumn}>
            {[
              { icon: Package, label: 'Browse Products', desc: 'Explore our product catalog', borderColor: colors.primary[600], iconBg: colors.primary[50], iconColor: colors.primary[600], onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'Products' }) },
              { icon: FileText, label: 'Request a Quote', desc: 'Get a customized quotation', borderColor: '#059669', iconBg: '#f0fdf4', iconColor: '#059669', onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'RequestQuote', params: {} }) },
              { icon: Calendar, label: 'Book a Consultation', desc: 'Schedule a meeting with our team', borderColor: '#7c3aed', iconBg: '#f5f3ff', iconColor: '#7c3aed', onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'Booking', params: {} }) },
            ].map((action, index) => (
              <TouchableOpacity key={index} style={[styles.quickActionCard, { borderLeftColor: action.borderColor, backgroundColor: theme.surface }]} onPress={action.onPress} activeOpacity={0.7}>
                <View style={[styles.quickActionCardIcon, { backgroundColor: action.iconBg }]}><action.icon size={22} color={action.iconColor} /></View>
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
              <Text style={styles.statLabel}>Accepted</Text>
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
                { label: 'Browse our product catalog', onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'Products' }) },
                { label: 'Book a meeting with our team', onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'Booking', params: {} }) },
                { label: 'Request a product quotation', onPress: () => navigation.getParent()?.navigate('HomeTab', { screen: 'RequestQuote', params: {} }) },
              ].map((step, i) => (
                <TouchableOpacity key={i} style={[styles.gettingStartedStep, { borderBottomColor: theme.border }]} onPress={step.onPress}>
                  <View style={styles.gettingStartedDot}><Text style={styles.gettingStartedNum}>{i + 1}</Text></View>
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
                {recommendedProducts.map(({ rec, product }) => (
                  <TouchableOpacity key={product!._id} style={[styles.recCard, { backgroundColor: theme.surface }]} onPress={() => navigation.getParent()?.navigate('HomeTab', { screen: 'ProductDetail', params: { productId: product!._id } })} activeOpacity={0.8}>
                    <Image source={{ uri: product!.image }} style={styles.recImage} />
                    <View style={styles.recMatchBadge}><Star size={10} color={colors.white} fill={colors.white} /><Text style={styles.recMatchText}>Match</Text></View>
                    <View style={styles.recInfo}>
                      <Text style={[styles.recName, { color: theme.text }]} numberOfLines={2}>{product!.name}</Text>
                      <Text style={[styles.recCategory, { color: theme.textSecondary }]}>{product!.category}</Text>
                      {rec.reasons?.length > 0 && <Text style={[styles.recReason, { color: theme.textSecondary }]} numberOfLines={2}>{rec.reasons[0]}</Text>}
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
                <View style={[styles.cartIcon, { backgroundColor: colors.warning + '20' }]}><ShoppingCart size={24} color={colors.warning} /></View>
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
              <TouchableOpacity key={tab.id} style={[styles.tab, activeTab === tab.id && styles.activeTab, activeTab === tab.id && { backgroundColor: theme.surface }]} onPress={() => setActiveTab(tab.id)} activeOpacity={0.7}>
                <tab.icon size={14} color={activeTab === tab.id ? colors.primary[600] : colors.gray[500]} />
                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
                {tab.count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.id ? colors.primary[100] : colors.gray[200] }]}>
                    <Text style={[styles.tabBadgeText, { color: activeTab === tab.id ? colors.primary[600] : colors.gray[600] }]}>{tab.count}</Text>
                  </View>
                )}
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
                {activeTab === 'quotes' && renderQuotes()}
                {activeTab === 'reviews' && renderReviews()}
                {activeTab === 'activity' && renderActivity()}
              </>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderBookingModal()}
      {renderQuotationModal()}
      {renderDeclineModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: colors.primary[700],
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40,
  },
  headerCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, left: 20,
  },
  backButton: { alignSelf: 'flex-start', padding: 6, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: colors.white },
  headerTextBlock: { flex: 1 },
  headerDashboardLabel: { fontSize: 10, color: colors.primary[300], fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  greeting: { fontSize: 13, color: colors.primary[200] },
  userName: { fontSize: 22, fontWeight: 'bold', color: colors.white, marginTop: 1 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  company: { fontSize: 12, color: colors.primary[200] },
  headerDateStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
  },
  headerDate: { fontSize: 12, color: colors.primary[300] },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  sectionSubtitle: { fontSize: 13, marginBottom: 12, marginTop: -8 },
  quickActionsColumn: { gap: 10 },
  quickActionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  quickActionCardIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickActionCardText: { flex: 1 },
  quickActionCardLabel: { fontSize: 15, fontWeight: '600' },
  quickActionCardDesc: { fontSize: 13, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.white },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  gettingStartedCard: { borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  gettingStartedTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  gettingStartedSubtitle: { fontSize: 13, marginBottom: 14 },
  gettingStartedStep: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  gettingStartedDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary[600], alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  gettingStartedNum: { fontSize: 13, fontWeight: 'bold', color: colors.white },
  gettingStartedStepText: { flex: 1, fontSize: 14 },
  recScroll: { marginTop: 4 },
  recCard: { width: 160, borderRadius: 12, marginRight: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  recImage: { width: '100%', height: 100 },
  recMatchBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: colors.primary[600], flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  recMatchText: { fontSize: 10, color: colors.white, fontWeight: '600' },
  recInfo: { padding: 10 },
  recName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  recCategory: { fontSize: 11, marginBottom: 4 },
  recReason: { fontSize: 11, fontStyle: 'italic', marginBottom: 6 },
  recLearnMore: { fontSize: 12, color: colors.primary[600], fontWeight: '600' },
  cartCard: { backgroundColor: colors.white },
  cartContent: { flexDirection: 'row', alignItems: 'center' },
  cartIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cartInfo: { flex: 1, marginLeft: 12 },
  cartTitle: { fontSize: 16, fontWeight: '600' },
  cartSubtitle: { fontSize: 13, marginTop: 2 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary[600], paddingHorizontal: 16, paddingVertical: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  historyHeaderText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  tabsScroll: {},
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: colors.primary[600] },
  tabText: { fontSize: 12, fontWeight: '500', color: colors.gray[500] },
  activeTabText: { color: colors.primary[600] },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  tabBadgeText: { fontSize: 11, fontWeight: '600' },
  tabContent: { padding: 16, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, minHeight: 120 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  emptyText: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  emptyAction: { backgroundColor: colors.primary[600], paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  emptyActionText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  historyCard: { borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1 },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  historyCardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  historyCardSub: { fontSize: 13, marginBottom: 4 },
  historyRows: { gap: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyRowText: { fontSize: 13, flex: 1 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  messageText: { fontSize: 12, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.gray[100], alignSelf: 'flex-end' },
  viewDetailsBtnText: { fontSize: 13, color: colors.primary[600], fontWeight: '500' },
  // Quote card
  quoteCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  quoteCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  viewDetailsBtnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary[600], paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  viewDetailsBtnPrimaryText: { fontSize: 12, color: colors.white, fontWeight: '500' },
  quoteStatusMsg: { fontSize: 13, fontStyle: 'italic', marginBottom: 6 },
  quoteTotalText: { fontSize: 13, fontWeight: '600', color: colors.success, marginTop: 4 },
  quoteValidText: { fontSize: 12, marginTop: 2 },
  // Reviews
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 13, marginLeft: 4 },
  reviewComment: { fontSize: 14, marginVertical: 8 },
  reviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1 },
  // Activity
  activityDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  activityAction: { fontSize: 14, fontWeight: '500' },
  activityDetails: { fontSize: 13, marginBottom: 4 },
  activityTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  activityTypeText: { fontSize: 11, fontWeight: '500' },
  // Pagination
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  paginationInfo: { fontSize: 12 },
  paginationButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  pageBtnText: { fontSize: 13, fontWeight: '500' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primary[600], paddingHorizontal: 20, paddingVertical: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white },
  modalBody: { padding: 20 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalLabel: { fontSize: 12, marginBottom: 4 },
  modalMono: { fontSize: 12, fontFamily: 'monospace' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  modalSection: { flex: 1, borderRadius: 10, padding: 12 },
  modalSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  modalSectionTitle: { fontSize: 14, fontWeight: '600' },
  modalValue: { fontSize: 14 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  contactText: { fontSize: 13, flex: 1 },
  meetingDetails: { borderRadius: 10, padding: 14, marginTop: 4 },
  meetingGrid: { gap: 12 },
  meetingItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  meetingItemIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center' },
  meetingItemLabel: { fontSize: 11, color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  meetingItemValue: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  infoBox: { borderRadius: 8, padding: 12, marginTop: 4 },
  datesSection: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, gap: 4 },
  dateText: { fontSize: 12 },
  modalFooterText: { fontSize: 12, marginTop: 16 },
  modalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1 },
  closeBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.gray[200], borderRadius: 10 },
  closeBtnText: { fontSize: 14, fontWeight: '500' },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.success, borderRadius: 10 },
  acceptBtnText: { fontSize: 14, color: colors.white, fontWeight: '500' },
  declineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#ea580c', borderRadius: 10 },
  declineBtnText: { fontSize: 14, color: colors.white, fontWeight: '500' },
  // Quotation modal extras
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderRadius: 8, padding: 10, marginBottom: 6 },
  itemName: { fontSize: 14, fontWeight: '500' },
  itemSpec: { fontSize: 12, marginTop: 2 },
  itemQty: { fontSize: 13, fontWeight: '500' },
  itemPrice: { fontSize: 12, marginTop: 2 },
  pricingBox: { backgroundColor: colors.primary[50], borderRadius: 10, padding: 14, marginTop: 16, borderWidth: 1, borderColor: colors.primary[200] },
  pricingLabel: { fontSize: 15, fontWeight: '600' },
  pricingValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary[600] },
  pricingSub: { fontSize: 13, marginTop: 6 },
  // Decline modal
  declineModalContainer: { borderRadius: 16, marginHorizontal: 20, marginVertical: 'auto' },
  declineModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1 },
  declineModalTitle: { fontSize: 16, fontWeight: '600' },
  declineModalBody: { padding: 16 },
  declineModalDesc: { fontSize: 14, marginBottom: 12 },
  declineInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, textAlignVertical: 'top', minHeight: 100 },
  declineModalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderRadius: 16 },
  bottomPadding: { height: 24 },
});
