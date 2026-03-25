import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  ArrowLeft,
  FileText,
  Package,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { quotationService, Quotation } from '../../api';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';
import { Card, Button, LoadingSpinner, Badge } from '../../components/common';
import { QuotationStatusBadge } from '../../components/quotation';
import { MoreStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<MoreStackParamList, 'QuotationDetail'>;

export const QuotationDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { quotationId } = route.params;
  const { theme } = useTheme();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuotation = useCallback(async () => {
    try {
      const response = await quotationService.getQuotation(quotationId);
      setQuotation(response.data);
    } catch (error) {
      console.error('Error fetching quotation:', error);
      Alert.alert('Error', 'Failed to load quotation details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [quotationId]);

  useEffect(() => {
    fetchQuotation();
  }, [fetchQuotation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuotation();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
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

  const getStatusIcon = () => {
    switch (quotation?.status) {
      case 'approved':
        return <CheckCircle size={24} color={colors.success} />;
      case 'rejected':
        return <XCircle size={24} color={colors.error} />;
      case 'pending':
        return <Clock size={24} color={colors.warning} />;
      default:
        return <FileText size={24} color={colors.gray[400]} />;
    }
  };

  const getStatusMessage = () => {
    switch (quotation?.status) {
      case 'approved':
        return 'Your quotation has been approved. Please review the pricing details below.';
      case 'rejected':
        return 'Unfortunately, this quotation could not be approved. Please contact us for more information.';
      case 'pending':
        return 'Your quotation is being reviewed by our team. We\'ll get back to you soon.';
      case 'expired':
        return 'This quotation has expired. Please submit a new request if you\'re still interested.';
      default:
        return '';
    }
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Quotation Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <Card style={styles.statusCard} padding="lg">
          <View style={styles.statusHeader}>
            <View style={styles.quotationInfo}>
              <Text style={[styles.quotationNumber, { color: theme.text }]}>{quotation.quotationNumber}</Text>
              <Text style={[styles.quotationDate, { color: theme.textSecondary }]}>
                Submitted on {formatDate(quotation.createdAt)}
              </Text>
            </View>
            <QuotationStatusBadge status={quotation.status} size="lg" />
          </View>

          <View style={[styles.statusMessage, { backgroundColor: theme.background }]}>
            {getStatusIcon()}
            <Text style={[styles.statusMessageText, { color: theme.textSecondary }]}>{getStatusMessage()}</Text>
          </View>
        </Card>

        {/* Pricing (if approved) */}
        {quotation.status === 'approved' && quotation.totalAmount && (
          <Card style={styles.pricingCard} padding="lg">
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Pricing Details</Text>

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Total Amount</Text>
              <Text style={styles.priceValue}>
                {formatCurrency(quotation.totalAmount, quotation.currency)}
              </Text>
            </View>

            {quotation.validUntil && (
              <View style={styles.validityRow}>
                <Calendar size={16} color={theme.textSecondary} />
                <Text style={[styles.validityText, { color: theme.textSecondary }]}>
                  Valid until {formatDate(quotation.validUntil)}
                </Text>
              </View>
            )}

            {(quotation.paymentTerms || quotation.deliveryTerms) && (
              <View style={styles.termsSection}>
                {quotation.paymentTerms && (
                  <>
                    <Text style={[styles.termsLabel, { color: theme.text }]}>Payment Terms</Text>
                    <Text style={[styles.termsText, { color: theme.textSecondary }]}>{quotation.paymentTerms}</Text>
                  </>
                )}
                {quotation.deliveryTerms && (
                  <>
                    <Text style={[styles.termsLabel, { marginTop: quotation.paymentTerms ? 12 : 0, color: theme.text }]}>Delivery Terms</Text>
                    <Text style={[styles.termsText, { color: theme.textSecondary }]}>{quotation.deliveryTerms}</Text>
                  </>
                )}
              </View>
            )}

            {(quotation.terms || quotation.termsAndConditions) && (
              <View style={styles.termsSection}>
                <Text style={[styles.termsLabel, { color: theme.text }]}>Terms & Conditions</Text>
                <Text style={[styles.termsText, { color: theme.textSecondary }]}>{quotation.termsAndConditions || quotation.terms}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Items */}
        <Card style={styles.itemsCard} padding="lg">
          <View style={styles.itemsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Items</Text>
            <Badge
              label={`${quotation.items.length} ${quotation.items.length === 1 ? 'item' : 'items'}`}
              variant="gray"
            />
          </View>

          {quotation.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemRow,
                index < quotation.items.length - 1 && [styles.itemRowBorder, { borderBottomColor: theme.border }],
              ]}
            >
              <View style={styles.itemIcon}>
                <Package size={20} color={colors.primary[600]} />
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, { color: theme.text }]}>{item.productName}</Text>
                <Text style={[styles.itemQuantity, { color: theme.textSecondary }]}>Quantity: {item.quantity}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Additional Requirements */}
        {quotation.additionalRequirements && (
          <Card style={styles.notesCard} padding="lg">
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Additional Requirements</Text>
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>{quotation.additionalRequirements}</Text>
          </Card>
        )}

        {/* Notes */}
        {quotation.notes && (
          <Card style={styles.notesCard} padding="lg">
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Notes</Text>
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>{quotation.notes}</Text>
          </Card>
        )}

        {/* Admin Notes (if any) */}
        {quotation.adminNotes && (
          <Card style={styles.notesCard} padding="lg">
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Response from Accuro</Text>
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>{quotation.adminNotes}</Text>
          </Card>
        )}

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: 16,
  },
  statusCard: {
    margin: 16,
    marginBottom: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  quotationInfo: {
    flex: 1,
  },
  quotationNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  quotationDate: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  statusMessageText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  pricingCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.success + '10',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.success + '30',
  },
  validityText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  termsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.success + '30',
  },
  termsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 8,
  },
  termsText: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 20,
  },
  itemsCard: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[900],
  },
  itemQuantity: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  notesCard: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 22,
  },
  bottomPadding: {
    height: 24,
  },
});

export default QuotationDetailScreen;
