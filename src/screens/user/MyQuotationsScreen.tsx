import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, ThumbsUp, ThumbsDown, CalendarCheck } from 'lucide-react-native';
import { quotationService, Quotation } from '../../api';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';
import { LoadingSpinner, FilterTabs, EmptyState } from '../../components/common';
import { QuotationCard } from '../../components/quotation';
import { MoreStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<MoreStackParamList>;

type FilterKey = 'all' | 'pending' | 'quoted' | 'accepted' | 'declined' | 'rejected' | 'expired';

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'expired', label: 'Expired' },
];

const MyQuotationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');

  // Inline accept/decline state
  const [actionLoading, setActionLoading] = useState<string | null>(null); // quotationId being actioned
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineTarget, setDeclineTarget] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const fetchQuotations = useCallback(async () => {
    try {
      const response = await quotationService.getMyQuotations();
      setQuotations(response.data || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuotations();
  };

  const filteredQuotations = quotations.filter((q) => {
    if (selectedFilter === 'all') return true;
    // treat 'approved' as 'accepted' for display
    if (selectedFilter === 'accepted') return q.status === 'accepted' || q.status === 'approved';
    return q.status === selectedFilter;
  });

  const getFilterOptions = () => {
    const quotedCount = quotations.filter((q) => q.status === 'quoted').length;
    return FILTER_OPTIONS.map((option) => {
      let count: number;
      if (option.key === 'all') count = quotations.length;
      else if (option.key === 'accepted') count = quotations.filter((q) => q.status === 'accepted' || q.status === 'approved').length;
      else count = quotations.filter((q) => q.status === option.key).length;
      return {
        ...option,
        count,
        highlight: option.key === 'quoted' && quotedCount > 0,
      };
    });
  };

  const handleQuotationPress = (quotation: Quotation) => {
    navigation.navigate('QuotationDetail', { quotationId: quotation._id, quotation });
  };

  const handleAccept = (quotationId: string) => {
    Alert.alert(
      'Accept Quotation',
      'Are you sure you want to accept this quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setActionLoading(quotationId);
              const response = await quotationService.acceptQuotation(quotationId);
              if (response.data) {
                setQuotations((prev) =>
                  prev.map((q) => (q._id === quotationId ? { ...q, ...response.data } : q))
                );
              } else {
                fetchQuotations();
              }
              Alert.alert('Success', 'Quotation accepted! The team will be in touch shortly.');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to accept quotation');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const openDeclineModal = (quotationId: string) => {
    setDeclineTarget(quotationId);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const handleDeclineConfirm = async () => {
    if (!declineTarget) return;
    try {
      setActionLoading(declineTarget);
      const response = await quotationService.declineQuotation(declineTarget, declineReason || undefined);
      if (response.data) {
        setQuotations((prev) =>
          prev.map((q) => (q._id === declineTarget ? { ...q, ...response.data } : q))
        );
      } else {
        fetchQuotations();
      }
      setShowDeclineModal(false);
      setDeclineTarget(null);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to decline quotation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookMeeting = (quotation: Quotation) => {
    // Navigate cross-stack to the Booking screen inside HomeTab
    navigation.getParent()?.navigate('HomeTab' as any, {
      screen: 'Booking',
      params: { productId: undefined },
    });
  };

  const renderQuotation = ({ item }: { item: Quotation }) => {
    const isQuoted = item.status === 'quoted';
    const isAccepted = item.status === 'accepted' || item.status === 'approved';
    const isActioning = actionLoading === item._id;

    return (
      <View>
        <QuotationCard
          quotation={item}
          onPress={() => handleQuotationPress(item)}
        />
        {/* Inline actions for quoted status */}
        {isQuoted && (
          <View style={styles.inlineActions}>
            <TouchableOpacity
              style={[styles.declineBtn, isActioning && { opacity: 0.6 }]}
              onPress={() => openDeclineModal(item._id)}
              disabled={!!actionLoading}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <ThumbsDown size={14} color="#dc2626" />
              )}
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, isActioning && { opacity: 0.6 }]}
              onPress={() => handleAccept(item._id)}
              disabled={!!actionLoading}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThumbsUp size={14} color="#fff" />
              )}
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Book a Meeting for accepted quotations */}
        {isAccepted && (
          <TouchableOpacity
            style={styles.bookMeetingBtn}
            onPress={() => handleBookMeeting(item)}
          >
            <CalendarCheck size={15} color={colors.primary[700]} />
            <Text style={styles.bookMeetingText}>Book a Meeting</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="file"
      title={selectedFilter === 'all' ? 'No Quotations Yet' : `No ${selectedFilter} quotations`}
      description={
        selectedFilter === 'all'
          ? 'Add items to your quote list and request a quotation to get started.'
          : `You don't have any ${selectedFilter} quotations.`
      }
      actionLabel={selectedFilter === 'all' ? 'Browse Products' : undefined}
      onAction={
        selectedFilter === 'all'
          ? () => navigation.getParent()?.navigate('HomeTab' as any, { screen: 'Products' })
          : undefined
      }
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading quotations..." />;
  }

  const quotedCount = quotations.filter((q) => q.status === 'quoted').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Quotations</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {quotations.length} {quotations.length === 1 ? 'quotation' : 'quotations'} total
          </Text>
          {quotedCount > 0 && (
            <View style={styles.actionNeededBadge}>
              <Text style={styles.actionNeededText}>{quotedCount} awaiting your action</Text>
            </View>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <FilterTabs
          options={getFilterOptions()}
          selectedKey={selectedFilter}
          onSelect={(key) => setSelectedFilter(key as FilterKey)}
        />
      </View>

      {/* Quotations List */}
      <FlatList
        data={filteredQuotations}
        renderItem={renderQuotation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* Decline Modal */}
      <Modal visible={showDeclineModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Decline Quotation</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason (optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={declineReason}
              onChangeText={setDeclineReason}
              placeholder="Reason for declining..."
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowDeclineModal(false); setDeclineTarget(null); }}
                disabled={!!actionLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !!actionLoading && { opacity: 0.6 }]}
                onPress={handleDeclineConfirm}
                disabled={!!actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Decline</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
  },
  actionNeededBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  actionNeededText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  // Inline actions
  inlineActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff',
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  // Book a meeting
  bookMeetingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -4,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
    marginHorizontal: 4,
  },
  bookMeetingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[700],
  },
  // Decline modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray[900],
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MyQuotationsScreen;
