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
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Package,
  X,
  Send,
  XCircle,
  Eye,
  User,
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react-native';
import { quotationService, Quotation } from '../../api';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';
import { FilterTabs, EmptyState } from '../../components/common';
import { QuotationStatusBadge } from '../../components/quotation';

type FilterKey = 'all' | 'pending' | 'quoted' | 'accepted' | 'declined' | 'rejected' | 'expired';

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'quoted',   label: 'Quoted' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'expired',  label: 'Expired' },
];

const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (amount?: number) => {
  if (amount == null) return null;
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

export const AdminQuotationsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Detail modal
  const [detailModal, setDetailModal] = useState<Quotation | null>(null);

  // Send Quote modal
  const [sendQuoteModal, setSendQuoteModal] = useState<Quotation | null>(null);
  const [quoteData, setQuoteData] = useState({ totalAmount: '', validDays: '30', terms: '', adminNotes: '' });

  // Reject modal
  const [rejectModal, setRejectModal] = useState<Quotation | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchQuotations = useCallback(async () => {
    try {
      const response = await quotationService.getAllQuotations();
      setQuotations(response.data || []);
    } catch (error: any) {
      const isNetworkIssue = !error.response && (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.code === 'ERR_NETWORK' || error.message === 'Aborted' || error.message === 'Network Error');
      if (!isNetworkIssue) console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  const onRefresh = () => { setRefreshing(true); fetchQuotations(); };

  // Send Quote (approve)
  const handleSendQuote = async () => {
    if (!sendQuoteModal) return;
    if (!quoteData.totalAmount || parseFloat(quoteData.totalAmount) <= 0) {
      Alert.alert('Required', 'Please enter a valid total amount.');
      return;
    }
    setActionLoading(sendQuoteModal._id);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(quoteData.validDays, 10));
      await quotationService.approveQuotation(sendQuoteModal._id, {
        totalAmount: parseFloat(quoteData.totalAmount),
        validUntil: validUntil.toISOString(),
        terms: quoteData.terms,
        adminNotes: quoteData.adminNotes,
      });
      setSendQuoteModal(null);
      fetchQuotations();
      Alert.alert('Success', 'Quote sent to customer successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send quote');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject
  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal._id);
    try {
      await quotationService.rejectQuotation(rejectModal._id, rejectReason || 'Rejected by admin');
      setRejectModal(null);
      setRejectReason('');
      fetchQuotations();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject quotation');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredQuotations = quotations
    .filter((q) => selectedFilter === 'all' || q.status === selectedFilter)
    .filter((q) =>
      !searchQuery ||
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.company || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getFilterOptions = () =>
    FILTER_OPTIONS.map((opt) => ({
      ...opt,
      count: opt.key === 'all' ? quotations.length : quotations.filter((q) => q.status === opt.key).length,
      highlight: opt.key === 'pending' && quotations.filter((q) => q.status === 'pending').length > 0,
    }));

  const renderQuotation = ({ item }: { item: Quotation }) => {
    const isPending = item.status === 'pending';
    const isQuoted = item.status === 'quoted';
    const isActioning = actionLoading === item._id;
    const itemCount = item.items.reduce((sum, i) => sum + i.quantity, 0);

    return (
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardIcon, { backgroundColor: colors.primary[50] }]}>
              <FileText size={18} color={colors.primary[600]} />
            </View>
            <View>
              <Text style={[styles.cardQNumber, { color: theme.text }]}>{item.quotationNumber}</Text>
              <Text style={[styles.cardDate, { color: theme.textSecondary }]}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          <QuotationStatusBadge status={item.status as any} size="sm" />
        </View>

        {/* Customer info */}
        {(item.customerName || item.company) ? (
          <View style={[styles.customerRow, { borderTopColor: theme.border }]}>
            {item.customerName ? (
              <View style={styles.customerItem}>
                <User size={13} color={colors.gray[400]} />
                <Text style={[styles.customerText, { color: theme.textSecondary }]} numberOfLines={1}>{item.customerName}</Text>
              </View>
            ) : null}
            {item.company ? (
              <View style={styles.customerItem}>
                <Building2 size={13} color={colors.gray[400]} />
                <Text style={[styles.customerText, { color: theme.textSecondary }]} numberOfLines={1}>{item.company}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Items preview */}
        <View style={[styles.itemsRow, { borderTopColor: theme.border }]}>
          <Package size={14} color={colors.gray[400]} />
          <Text style={[styles.itemsCount, { color: theme.textSecondary }]}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
          <Text style={[styles.itemsPreview, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.items.slice(0, 2).map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
            {item.items.length > 2 ? ` +${item.items.length - 2} more` : ''}
          </Text>
        </View>

        {/* Amount if quoted/accepted */}
        {item.totalAmount != null && (
          <View style={[styles.amountRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Quoted Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          {/* View Details — always shown */}
          <TouchableOpacity
            style={[styles.footerBtn, styles.viewBtn, { borderColor: theme.border }]}
            onPress={() => setDetailModal(item)}
          >
            <Eye size={14} color={colors.primary[600]} />
            <Text style={[styles.footerBtnText, { color: colors.primary[600] }]}>View Details</Text>
          </TouchableOpacity>

          {isPending && (
            <>
              <TouchableOpacity
                style={[styles.footerBtn, styles.sendBtn, isActioning && { opacity: 0.6 }]}
                onPress={() => { setQuoteData({ totalAmount: '', validDays: '30', terms: '', adminNotes: '' }); setSendQuoteModal(item); }}
                disabled={isActioning}
              >
                {isActioning ? <ActivityIndicator size="small" color="#fff" /> : <Send size={14} color="#fff" />}
                <Text style={styles.sendBtnText}>Send Quote</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerBtn, styles.rejectBtn, isActioning && { opacity: 0.6 }]}
                onPress={() => { setRejectReason(''); setRejectModal(item); }}
                disabled={isActioning}
              >
                <XCircle size={14} color="#dc2626" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? theme.background : colors.gray[100] }]}>
          <Search size={17} color={colors.gray[400]} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by number, name, or company..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={colors.gray[400]} />
            </TouchableOpacity>
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

      {/* List */}
      <FlatList
        data={filteredQuotations}
        renderItem={renderQuotation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          refreshing
            ? <View style={styles.centerLoader}><ActivityIndicator size="large" color={colors.primary[600]} /><Text style={styles.centerLoaderText}>Loading quotations...</Text></View>
            : <EmptyState icon="file" title="No Quotations Found" description="There are no quotations to display." />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ── Detail Modal ── */}
      <Modal visible={!!detailModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDetailModal(null)}>
        {detailModal && (
          <SafeAreaView style={[styles.modalSheet, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Quotation Details</Text>
              <TouchableOpacity onPress={() => setDetailModal(null)} style={styles.modalCloseBtn}>
                <X size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {/* Status */}
              <View style={styles.detailStatusRow}>
                <QuotationStatusBadge status={detailModal.status as any} size="md" />
                <Text style={[styles.detailQNumber, { color: theme.textSecondary }]}>{detailModal.quotationNumber}</Text>
              </View>

              {/* Info card */}
              <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <DetailRow label="Requested On" value={formatDate(detailModal.createdAt)} borderColor={theme.border} textColor={theme.text} />
                {detailModal.validUntil ? <DetailRow label="Valid Until" value={formatDate(detailModal.validUntil)} borderColor={theme.border} textColor={theme.text} /> : null}
                {detailModal.customerName ? <DetailRow label="Customer" value={detailModal.customerName} borderColor={theme.border} textColor={theme.text} /> : null}
                {detailModal.customerEmail ? <DetailRow label="Email" value={detailModal.customerEmail} borderColor={theme.border} textColor={theme.text} /> : null}
                {detailModal.company ? <DetailRow label="Company" value={detailModal.company} borderColor={theme.border} textColor={theme.text} /> : null}
                {detailModal.totalAmount != null ? (
                  <DetailRow label="Total Amount" value={formatCurrency(detailModal.totalAmount) || ''} highlight borderColor={theme.border} textColor={theme.text} />
                ) : null}
                {detailModal.paymentTerms ? <DetailRow label="Payment Terms" value={detailModal.paymentTerms} borderColor={theme.border} textColor={theme.text} /> : null}
                {detailModal.deliveryTerms ? <DetailRow label="Delivery Terms" value={detailModal.deliveryTerms} last borderColor={theme.border} textColor={theme.text} /> : null}
              </View>

              {/* Items */}
              <Text style={[styles.detailSectionLabel, { color: theme.textSecondary }]}>REQUESTED ITEMS</Text>
              <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {detailModal.items.map((item, idx) => (
                  <View key={idx} style={[styles.itemRow, idx < detailModal.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                    <View style={styles.itemDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemRowName, { color: theme.text }]}>{item.productName}</Text>
                      <Text style={[styles.itemRowQty, { color: theme.textSecondary }]}>Qty: {item.quantity}</Text>
                      {item.specifications ? <Text style={[styles.itemRowSpec, { color: theme.textSecondary }]}>{item.specifications}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>

              {/* Notes */}
              {detailModal.additionalRequirements ? (
                <>
                  <Text style={[styles.detailSectionLabel, { color: theme.textSecondary }]}>CUSTOMER NOTES</Text>
                  <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.notesText, { color: theme.text }]}>{detailModal.additionalRequirements}</Text>
                  </View>
                </>
              ) : null}

              {detailModal.adminNotes ? (
                <>
                  <Text style={[styles.detailSectionLabel, { color: theme.textSecondary }]}>ADMIN NOTES</Text>
                  <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.notesText, { color: theme.text }]}>{detailModal.adminNotes}</Text>
                  </View>
                </>
              ) : null}

              {/* Action buttons inside detail if pending */}
              {detailModal.status === 'pending' && (
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.detailSendBtn, actionLoading === detailModal._id && { opacity: 0.6 }]}
                    onPress={() => { setDetailModal(null); setQuoteData({ totalAmount: '', validDays: '30', terms: '', adminNotes: '' }); setSendQuoteModal(detailModal); }}
                  >
                    <Send size={16} color="#fff" />
                    <Text style={styles.detailSendText}>Send Quote</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailRejectBtn, actionLoading === detailModal._id && { opacity: 0.6 }]}
                    onPress={() => { setDetailModal(null); setRejectReason(''); setRejectModal(detailModal); }}
                  >
                    <XCircle size={16} color="#dc2626" />
                    <Text style={styles.detailRejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 24 }} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* ── Send Quote Modal ── */}
      <Modal visible={!!sendQuoteModal} animationType="none" transparent onRequestClose={() => setSendQuoteModal(null)}>
        <View style={styles.bottomSheetOverlay}>
          <View style={[styles.bottomSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.bottomSheetHeader}>
              <View>
                <Text style={[styles.bottomSheetTitle, { color: theme.text }]}>Send Quote</Text>
                <Text style={[styles.bottomSheetSubtitle, { color: theme.textSecondary }]}>{sendQuoteModal?.quotationNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setSendQuoteModal(null)}>
                <X size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <FieldLabel label="Total Amount (PHP) *" />
            <TextInput
              style={[styles.fieldInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={quoteData.totalAmount}
              onChangeText={(v) => setQuoteData({ ...quoteData, totalAmount: v })}
              placeholder="e.g. 25000"
              placeholderTextColor={colors.gray[400]}
              keyboardType="numeric"
            />

            <FieldLabel label="Valid for (days)" />
            <TextInput
              style={[styles.fieldInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={quoteData.validDays}
              onChangeText={(v) => setQuoteData({ ...quoteData, validDays: v })}
              keyboardType="numeric"
              placeholderTextColor={colors.gray[400]}
            />

            <FieldLabel label="Terms & Conditions (optional)" />
            <TextInput
              style={[styles.fieldInput, styles.fieldTextarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={quoteData.terms}
              onChangeText={(v) => setQuoteData({ ...quoteData, terms: v })}
              placeholder="Payment terms, delivery notes..."
              placeholderTextColor={colors.gray[400]}
              multiline
            />

            <FieldLabel label="Admin Notes (optional)" />
            <TextInput
              style={[styles.fieldInput, styles.fieldTextarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={quoteData.adminNotes}
              onChangeText={(v) => setQuoteData({ ...quoteData, adminNotes: v })}
              placeholder="Internal notes visible to customer..."
              placeholderTextColor={colors.gray[400]}
              multiline
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetCancelBtn, { borderColor: theme.border }]}
                onPress={() => setSendQuoteModal(null)}
              >
                <Text style={[styles.sheetCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetConfirmBtn, actionLoading === sendQuoteModal?._id && { opacity: 0.6 }]}
                onPress={handleSendQuote}
                disabled={!!actionLoading}
              >
                {actionLoading === sendQuoteModal?._id
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <Send size={16} color="#fff" />
                      <Text style={styles.sheetConfirmText}>Send Quote</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal visible={!!rejectModal} animationType="none" transparent onRequestClose={() => setRejectModal(null)}>
        <View style={styles.bottomSheetOverlay}>
          <View style={[styles.bottomSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.bottomSheetHeader}>
              <View>
                <Text style={[styles.bottomSheetTitle, { color: theme.text }]}>Reject Quotation</Text>
                <Text style={[styles.bottomSheetSubtitle, { color: theme.textSecondary }]}>{rejectModal?.quotationNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setRejectModal(null)}>
                <X size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <FieldLabel label="Reason for rejection (optional)" />
            <TextInput
              style={[styles.fieldInput, styles.fieldTextarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Let the customer know why..."
              placeholderTextColor={colors.gray[400]}
              multiline
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetCancelBtn, { borderColor: theme.border }]}
                onPress={() => setRejectModal(null)}
              >
                <Text style={[styles.sheetCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetRejectConfirmBtn, actionLoading === rejectModal?._id && { opacity: 0.6 }]}
                onPress={handleRejectConfirm}
                disabled={!!actionLoading}
              >
                {actionLoading === rejectModal?._id
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <XCircle size={16} color="#fff" />
                      <Text style={styles.sheetConfirmText}>Confirm Reject</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
            <View style={{ height: 24 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* ─── Small helper components (no hooks — safe to use inside Modals) ─── */
const DetailRow: React.FC<{ label: string; value: string; last?: boolean; highlight?: boolean; borderColor: string; textColor: string }> = ({ label, value, last, highlight, borderColor, textColor }) => (
  <View style={[detailRowStyles.row, !last && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
    <Text style={detailRowStyles.label}>{label}</Text>
    <Text style={[detailRowStyles.value, { color: highlight ? colors.primary[600] : textColor }, highlight && detailRowStyles.highlight]}>
      {value}
    </Text>
  </View>
);

const FieldLabel: React.FC<{ label: string }> = ({ label }) => (
  <Text style={fieldLabelStyles.label}>{label}</Text>
);

const detailRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 },
  label: { fontSize: 13, color: colors.gray[400], fontWeight: '500', flex: 1 },
  value: { fontSize: 14, fontWeight: '500', flex: 2, textAlign: 'right' },
  highlight: { fontWeight: '700', fontSize: 16, color: colors.primary[600] },
});

const fieldLabelStyles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.gray[500], marginBottom: 6, marginTop: 14, paddingHorizontal: 2 },
});

/* ─── Main styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Search
  searchContainer: { padding: 12, borderBottomWidth: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },

  // Filters
  filterContainer: { paddingVertical: 10, borderBottomWidth: 1 },

  // List
  listContent: { padding: 16, flexGrow: 1 },
  centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  centerLoaderText: { fontSize: 14, color: colors.gray[500] },

  // Card
  card: {
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardQNumber: { fontSize: 15, fontWeight: '700' },
  cardDate: { fontSize: 12, marginTop: 1 },

  // Customer row
  customerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 14, paddingBottom: 10, borderTopWidth: 1 },
  customerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  customerText: { fontSize: 13 },

  // Items row
  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  itemsCount: { fontSize: 13, fontWeight: '600', minWidth: 50 },
  itemsPreview: { fontSize: 13, flex: 1 },

  // Amount row
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  amountLabel: { fontSize: 13 },
  amountValue: { fontSize: 16, fontWeight: '700', color: colors.primary[600] },

  // Card footer
  cardFooter: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1 },
  footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 8 },
  footerBtnText: { fontSize: 13, fontWeight: '600' },
  viewBtn: { borderWidth: 1 },
  sendBtn: { backgroundColor: colors.primary[600] },
  sendBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  rejectBtn: { borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
  rejectBtnText: { fontSize: 13, fontWeight: '600', color: '#dc2626' },

  // Detail modal
  modalSheet: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalCloseBtn: { padding: 4 },
  modalBody: { padding: 16 },
  detailStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  detailQNumber: { fontSize: 14 },
  detailCard: { borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  detailSectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 10 },
  itemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary[400], marginTop: 6 },
  itemRowName: { fontSize: 14, fontWeight: '600' },
  itemRowQty: { fontSize: 13, marginTop: 2 },
  itemRowSpec: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  notesText: { fontSize: 14, lineHeight: 22, padding: 14 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 8 },
  detailSendBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 10, backgroundColor: colors.primary[600] },
  detailSendText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  detailRejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
  detailRejectText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },

  // Bottom sheets (Send Quote & Reject)
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  bottomSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  bottomSheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.gray[300], alignSelf: 'center', marginBottom: 16 },
  bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  bottomSheetTitle: { fontSize: 18, fontWeight: '700' },
  bottomSheetSubtitle: { fontSize: 13, marginTop: 2 },
  fieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 4 },
  fieldTextarea: { minHeight: 80, textAlignVertical: 'top' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  sheetCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  sheetCancelText: { fontSize: 14, fontWeight: '600' },
  sheetConfirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 10, backgroundColor: colors.primary[600] },
  sheetRejectConfirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 10, backgroundColor: '#dc2626' },
  sheetConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default AdminQuotationsScreen;
