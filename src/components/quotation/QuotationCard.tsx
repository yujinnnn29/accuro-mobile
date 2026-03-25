import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileText, Package, Calendar, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme';
import { Card } from '../common';
import QuotationStatusBadge from './QuotationStatusBadge';
import { useTheme } from '../../contexts';

interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface Quotation {
  _id: string;
  quotationNumber: string;
  items: QuotationItem[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  totalAmount?: number;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

interface QuotationCardProps {
  quotation: Quotation;
  onPress?: () => void;
}

export const QuotationCard: React.FC<QuotationCardProps> = ({
  quotation,
  onPress,
}) => {
  const { theme } = useTheme();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const itemCount = quotation.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card
      onPress={onPress}
      style={styles.card}
      padding="md"
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <FileText size={20} color={colors.primary[600]} />
          </View>
          <View>
            <Text style={[styles.quotationNumber, { color: theme.text }]}>
              {quotation.quotationNumber}
            </Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {formatDate(quotation.createdAt)}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <QuotationStatusBadge status={quotation.status} size="sm" />
          {onPress && (
            <ChevronRight size={20} color={colors.gray[400]} style={styles.chevron} />
          )}
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Package size={16} color={colors.gray[400]} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {quotation.status === 'approved' && quotation.totalAmount && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount:</Text>
            <Text style={styles.amount}>
              {formatCurrency(quotation.totalAmount)}
            </Text>
          </View>
        )}

        {quotation.validUntil && quotation.status === 'approved' && (
          <View style={styles.detailRow}>
            <Calendar size={16} color={colors.gray[400]} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              Valid until {formatDate(quotation.validUntil)}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.itemsPreview, { borderTopColor: theme.border }]}>
        {quotation.items.slice(0, 2).map((item, index) => (
          <Text key={index} style={[styles.itemText, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.quantity}x {item.productName}
          </Text>
        ))}
        {quotation.items.length > 2 && (
          <Text style={styles.moreItems}>
            +{quotation.items.length - 2} more
          </Text>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotationNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  date: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 8,
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[700],
  },
  itemsPreview: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  itemText: {
    fontSize: 13,
    color: colors.gray[600],
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
});

export default QuotationCard;
