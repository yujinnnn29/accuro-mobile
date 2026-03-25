import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, FileText, Package } from 'lucide-react-native';
import { quotationService, Quotation } from '../../api';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';
import { LoadingSpinner, FilterTabs, EmptyState, Card, Button, Input } from '../../components/common';
import { QuotationStatusBadge } from '../../components/quotation';

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected';

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export const AdminQuotationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Approve modal
  const [approveModal, setApproveModal] = useState<{visible: boolean; quotation: Quotation | null}>({
    visible: false,
    quotation: null,
  });
  const [approveData, setApproveData] = useState({
    totalAmount: '',
    validDays: '30',
    terms: '',
  });

  const fetchQuotations = useCallback(async () => {
    try {
      const response = await quotationService.getAllQuotations();
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

  const openApproveModal = (quotation: Quotation) => {
    setApproveData({ totalAmount: '', validDays: '30', terms: '' });
    setApproveModal({ visible: true, quotation });
  };

  const handleApprove = async () => {
    if (!approveModal.quotation) return;

    if (!approveData.totalAmount || parseFloat(approveData.totalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid total amount');
      return;
    }

    setActionLoading(approveModal.quotation._id);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(approveData.validDays, 10));

      await quotationService.approveQuotation(approveModal.quotation._id, {
        totalAmount: parseFloat(approveData.totalAmount),
        validUntil: validUntil.toISOString(),
        terms: approveData.terms,
      });

      setApproveModal({ visible: false, quotation: null });
      fetchQuotations();
      Alert.alert('Success', 'Quotation approved successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to approve quotation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (quotationId: string) => {
    Alert.alert(
      'Reject Quotation',
      'Are you sure you want to reject this quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(quotationId);
            try {
              await quotationService.rejectQuotation(quotationId, 'Rejected by admin');
              fetchQuotations();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject quotation');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const filteredQuotations = quotations
    .filter((q) => selectedFilter === 'all' || q.status === selectedFilter)
    .filter((q) => q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()));

  const getFilterCounts = () => {
    return filterOptions.map((option) => ({
      ...option,
      count: option.key === 'all'
        ? quotations.length
        : quotations.filter((q) => q.status === option.key).length,
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderQuotation = ({ item }: { item: Quotation }) => {
    const itemCount = item.items.reduce((sum, i) => sum + i.quantity, 0);

    return (
      <Card style={styles.quotationCard} padding="md">
        <View style={styles.quotationHeader}>
          <View style={styles.quotationInfo}>
            <Text style={[styles.quotationNumber, { color: theme.text }]}>{item.quotationNumber}</Text>
            <Text style={[styles.quotationDate, { color: theme.textSecondary }]}>{formatDate(item.createdAt)}</Text>
          </View>
          <QuotationStatusBadge status={item.status} size="sm" />
        </View>

        <View style={[styles.itemsSection, { borderTopColor: theme.border }]}>
          <View style={styles.itemsHeader}>
            <Package size={16} color={colors.gray[400]} />
            <Text style={[styles.itemsCount, { color: theme.textSecondary }]}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
          {item.items.slice(0, 2).map((i, index) => (
            <Text key={index} style={[styles.itemName, { color: theme.textSecondary }]} numberOfLines={1}>
              {i.quantity}x {i.productName}
            </Text>
          ))}
          {item.items.length > 2 && (
            <Text style={styles.moreItems}>+{item.items.length - 2} more</Text>
          )}
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Button
              title="Approve"
              onPress={() => openApproveModal(item)}
              size="sm"
              loading={actionLoading === item._id}
              style={styles.actionButton}
            />
            <Button
              title="Reject"
              onPress={() => handleReject(item._id)}
              variant="danger"
              size="sm"
              loading={actionLoading === item._id}
              style={styles.actionButton}
            />
          </View>
        )}

        {item.status === 'approved' && item.totalAmount && (
          <View style={[styles.approvedInfo, { borderTopColor: theme.border }]}>
            <Text style={[styles.approvedLabel, { color: theme.textSecondary }]}>Approved Amount:</Text>
            <Text style={styles.approvedAmount}>
              PHP {item.totalAmount.toLocaleString()}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="file"
      title="No Quotations Found"
      description="There are no quotations to display."
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading quotations..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.background }]}>
          <Search size={20} color={colors.gray[400]} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by quotation number..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <FilterTabs
          options={getFilterCounts()}
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

      {/* Approve Modal */}
      <Modal
        visible={approveModal.visible}
        animationType="slide"
        transparent
        onRequestClose={() => setApproveModal({ visible: false, quotation: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve Quotation</Text>
            <Text style={styles.modalSubtitle}>
              {approveModal.quotation?.quotationNumber}
            </Text>

            <Input
              label="Total Amount (PHP)"
              value={approveData.totalAmount}
              onChangeText={(value) => setApproveData({ ...approveData, totalAmount: value })}
              keyboardType="numeric"
              placeholder="Enter total amount"
            />

            <Input
              label="Valid for (days)"
              value={approveData.validDays}
              onChangeText={(value) => setApproveData({ ...approveData, validDays: value })}
              keyboardType="numeric"
              containerStyle={styles.inputSpacing}
            />

            <Input
              label="Terms & Conditions (Optional)"
              value={approveData.terms}
              onChangeText={(value) => setApproveData({ ...approveData, terms: value })}
              multiline
              numberOfLines={3}
              containerStyle={styles.inputSpacing}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setApproveModal({ visible: false, quotation: null })}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Approve"
                onPress={handleApprove}
                loading={actionLoading === approveModal.quotation?._id}
                style={styles.modalButton}
              />
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
    backgroundColor: colors.gray[50],
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: colors.gray[900],
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
  quotationCard: {
    marginBottom: 12,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quotationInfo: {},
  quotationNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  quotationDate: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  itemsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  itemsCount: {
    fontSize: 14,
    color: colors.gray[600],
  },
  itemName: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flex: 1,
  },
  approvedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    backgroundColor: colors.success + '10',
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  approvedLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  approvedAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 20,
  },
  inputSpacing: {
    marginTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
});

export default AdminQuotationsScreen;
