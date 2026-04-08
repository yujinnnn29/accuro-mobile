import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { quotationService, Quotation } from '../../api';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';
import { LoadingSpinner, Button } from '../../components/common';
import { MoreStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MoreStackParamList, 'QuotationDetail'>;

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  approved:  { bg: '#D1FAE5', text: '#065F46', label: 'APPROVED' },
  quoted:    { bg: '#DBEAFE', text: '#1e40af', label: 'QUOTE SENT' },
  accepted:  { bg: '#D1FAE5', text: '#065F46', label: 'ACCEPTED' },
  declined:  { bg: '#FEE2E2', text: '#991B1B', label: 'DECLINED' },
  pending:   { bg: '#FEF3C7', text: '#92400E', label: 'PENDING' },
  rejected:  { bg: '#FEE2E2', text: '#991B1B', label: 'REJECTED' },
  expired:   { bg: '#F3F4F6', text: '#6B7280', label: 'EXPIRED' },
};

export const QuotationDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { quotationId, quotation: passedQuotation } = route.params;
  const { theme } = useTheme();

  const [quotation, setQuotation] = useState<Quotation | null>(passedQuotation || null);
  const [loading, setLoading] = useState(!passedQuotation);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<'accept' | 'decline' | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const fetchQuotation = useCallback(async () => {
    try {
      const response = await quotationService.getQuotation(quotationId);
      if (response.data) {
        setQuotation(response.data);
      }
    } catch (error) {
      console.error('Error fetching quotation:', error);
      if (!passedQuotation) {
        Alert.alert('Error', 'Failed to load quotation details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [quotationId]);

  useEffect(() => {
    if (!passedQuotation) {
      fetchQuotation();
    }
  }, [fetchQuotation, passedQuotation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuotation();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency || 'PHP',
    }).format(amount);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading quotation details..." />;
  }

  if (!quotation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>Quotation not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleAccept = async () => {
    Alert.alert(
      'Accept Quotation',
      'Are you sure you want to accept this quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setActionLoading('accept');
              await quotationService.acceptQuotation(quotationId);
              Alert.alert('Success', 'Quotation accepted successfully!');
              fetchQuotation();
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

  const handleDecline = async () => {
    try {
      setActionLoading('decline');
      await quotationService.declineQuotation(quotationId, declineReason || undefined);
      Alert.alert('Done', 'Quotation declined.');
      setShowDeclineModal(false);
      fetchQuotation();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to decline quotation');
    } finally {
      setActionLoading(null);
    }
  };

  const isQuotationExpired = (q: Quotation) => {
    if (q.status === 'expired') return true;
    if (q.status === 'quoted' && (q as any).validUntil && new Date((q as any).validUntil) < new Date()) return true;
    return false;
  };

  const statusStyle = STATUS_STYLES[quotation.status] || STATUS_STYLES.pending;
  const isAccepted = quotation.status === 'accepted' || quotation.status === 'approved';
  const isQuoted = quotation.status === 'quoted';
  const isExpired = isQuotationExpired(quotation);
  const canAccept = isQuoted && !isExpired;
  const isDeclined = quotation.status === 'declined';
  const isRejected = quotation.status === 'rejected';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Quotation Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Info Section */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Quotation Number */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Quotation Number</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{quotation.quotationNumber}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Status */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Requested On */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Requested On</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{formatDate(quotation.createdAt)}</Text>
          </View>
        </View>

        {/* Requested Items */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Requested Items</Text>
          {quotation.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemCard,
                { borderColor: theme.border },
                index < quotation.items.length - 1 && styles.itemMargin,
              ]}
            >
              <Text style={[styles.itemName, { color: theme.text }]}>{item.productName}</Text>
              <Text style={[styles.itemQty, { color: theme.textSecondary }]}>Quantity: {item.quantity}</Text>
              {item.specifications && (
                <Text style={[styles.itemSpec, { color: theme.textSecondary }]}>{item.specifications}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Expired notice */}
        {isQuoted && isExpired && (
          <View style={styles.expiredCard}>
            <Text style={styles.expiredTitle}>Quotation Expired</Text>
            <Text style={styles.expiredText}>This quotation has expired and can no longer be accepted. Please request a new quotation if you're still interested.</Text>
          </View>
        )}

        {/* Quote Sent — Accept/Decline Actions */}
        {isQuoted && (
          <View style={styles.quotedCard}>
            <Text style={styles.quotedTitle}>{canAccept ? 'Quote Prepared — Your Action Needed' : 'Quote Details'}</Text>

            {quotation.totalAmount != null && (
              <>
                <Text style={styles.quotedTotalLabel}>Total Amount:</Text>
                <Text style={styles.quotedTotalAmount}>
                  {formatCurrency(quotation.totalAmount, quotation.currency)}
                </Text>
              </>
            )}

            {quotation.validUntil && (
              <Text style={styles.quotedValidUntil}>Valid until: {formatDate(quotation.validUntil)}</Text>
            )}

            {quotation.paymentTerms && (
              <View style={styles.termRow}>
                <Text style={styles.quotedTermLabel}>Payment Terms:</Text>
                <Text style={styles.quotedTermValue}>{quotation.paymentTerms}</Text>
              </View>
            )}

            {quotation.deliveryTerms && (
              <View style={styles.termRow}>
                <Text style={styles.quotedTermLabel}>Delivery Terms:</Text>
                <Text style={styles.quotedTermValue}>{quotation.deliveryTerms}</Text>
              </View>
            )}

            {(quotation.termsAndConditions || quotation.terms) && (
              <View style={styles.termRow}>
                <Text style={styles.quotedTermLabel}>Terms & Conditions:</Text>
                <Text style={styles.quotedTermValue}>{quotation.termsAndConditions || quotation.terms}</Text>
              </View>
            )}

            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={[styles.declineBtn, actionLoading === 'decline' && { opacity: 0.6 }]}
                onPress={() => setShowDeclineModal(true)}
                disabled={!!actionLoading}
              >
                <ThumbsDown size={16} color="#dc2626" />
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
              {canAccept && (
                <TouchableOpacity
                  style={[styles.acceptBtn, actionLoading === 'accept' && { opacity: 0.6 }]}
                  onPress={handleAccept}
                  disabled={!!actionLoading}
                >
                  <ThumbsUp size={16} color="#fff" />
                  <Text style={styles.acceptBtnText}>
                    {actionLoading === 'accept' ? 'Accepting...' : 'Accept Quotation'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Accepted Quotation Details */}
        {isAccepted && (
          <View style={styles.approvedCard}>
            <Text style={styles.approvedTitle}>Quotation Accepted</Text>

            {quotation.totalAmount != null && (
              <>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalAmount}>
                  {formatCurrency(quotation.totalAmount, quotation.currency)}
                </Text>
              </>
            )}

            {quotation.validUntil && (
              <Text style={styles.validUntil}>Valid until: {formatDate(quotation.validUntil)}</Text>
            )}

            {quotation.paymentTerms && (
              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Payment Terms:</Text>
                <Text style={styles.termValue}>{quotation.paymentTerms}</Text>
              </View>
            )}

            {quotation.deliveryTerms && (
              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Delivery Terms:</Text>
                <Text style={styles.termValue}>{quotation.deliveryTerms}</Text>
              </View>
            )}

            {(quotation.termsAndConditions || quotation.terms) && (
              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Terms & Conditions:</Text>
                <Text style={styles.termValue}>{quotation.termsAndConditions || quotation.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Declined by user */}
        {isDeclined && (
          <View style={styles.declinedCard}>
            <Text style={styles.declinedTitle}>You Declined This Quotation</Text>
            {quotation.totalAmount != null && (
              <Text style={styles.declinedAmount}>
                {formatCurrency(quotation.totalAmount, quotation.currency)}
              </Text>
            )}
            {(quotation as any).declinedAt && (
              <Text style={styles.declinedDate}>
                Declined on: {formatDate((quotation as any).declinedAt)}
              </Text>
            )}
            {(quotation as any).declineReason && (
              <View style={styles.termRow}>
                <Text style={styles.declinedLabel}>Reason:</Text>
                <Text style={styles.declinedValue}>{(quotation as any).declineReason}</Text>
              </View>
            )}
          </View>
        )}

        {/* Rejected by admin */}
        {isRejected && quotation.adminNotes && (
          <View style={styles.rejectedCard}>
            <Text style={styles.rejectedTitle}>Quotation Rejected by Admin</Text>
            <Text style={styles.rejectedNote}>{quotation.adminNotes}</Text>
          </View>
        )}

        {/* Additional Requirements */}
        {quotation.additionalRequirements ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Additional Requirements</Text>
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>{quotation.additionalRequirements}</Text>
          </View>
        ) : null}

        {/* Admin Notes (for non-rejected statuses) */}
        {quotation.adminNotes && !isRejected ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Response from Accuro</Text>
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>{quotation.adminNotes}</Text>
          </View>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>

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
                onPress={() => setShowDeclineModal(false)}
                disabled={!!actionLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, actionLoading === 'decline' && { opacity: 0.6 }]}
                onPress={handleDecline}
                disabled={!!actionLoading}
              >
                <Text style={styles.modalConfirmText}>
                  {actionLoading === 'decline' ? 'Declining...' : 'Confirm Decline'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerRight: { width: 32 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, marginBottom: 16 },
  content: { padding: 16, gap: 12 },

  // Info card
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  divider: { height: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // Items
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  itemCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  itemMargin: { marginBottom: 8 },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  itemQty: { fontSize: 13 },
  itemSpec: { fontSize: 13, marginTop: 4, fontStyle: 'italic' },

  // Expired card (gray)
  expiredCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  expiredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  expiredText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Quoted card (blue — action needed)
  quotedCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
    padding: 16,
  },
  quotedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 12,
  },
  quotedTotalLabel: { fontSize: 13, color: '#1e40af' },
  quotedTotalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 8,
  },
  quotedValidUntil: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 12,
  },
  quotedTermLabel: { fontSize: 13, fontWeight: '600', color: '#1e40af', marginBottom: 2 },
  quotedTermValue: { fontSize: 13, color: '#1d4ed8' },

  // Accepted card (green)
  approvedCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
    padding: 16,
  },
  approvedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 13, color: '#065F46' },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  validUntil: {
    fontSize: 13,
    color: '#065F46',
    marginBottom: 12,
  },
  termRow: { marginTop: 10 },
  termLabel: { fontSize: 13, fontWeight: '600', color: '#065F46', marginBottom: 2 },
  termValue: { fontSize: 13, color: '#047857' },

  // Declined card (orange)
  declinedCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
    padding: 16,
  },
  declinedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 8,
  },
  declinedAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EA580C',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  declinedDate: {
    fontSize: 13,
    color: '#C2410C',
    marginBottom: 4,
  },
  declinedLabel: { fontSize: 13, fontWeight: '600', color: '#9A3412', marginBottom: 2 },
  declinedValue: { fontSize: 13, color: '#C2410C' },

  // Rejected card (red)
  rejectedCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    padding: 16,
  },
  rejectedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 8,
  },
  rejectedNote: {
    fontSize: 14,
    color: '#B91C1C',
    lineHeight: 22,
  },

  // Notes
  noteText: { fontSize: 14, lineHeight: 22 },

  // Accept/Decline actions
  actionBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff',
  },
  declineBtnText: { fontSize: 14, fontWeight: '600', color: '#dc2626' },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  acceptBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Decline modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: colors.gray[500], marginBottom: 12 },
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
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

export default QuotationDetailScreen;
