import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { Button } from '../common';

interface CartSummaryProps {
  itemCount: number;
  onRequestQuotation: () => void;
  loading?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  itemCount,
  onRequestQuotation,
  loading = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Items in quote list</Text>
        <Text style={styles.value}>{itemCount}</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.note}>
        Submit your quote list items to receive a customized quotation from our team.
      </Text>
      <Text style={styles.priceNote}>
        Prices shown are estimated. Final pricing will be confirmed in your personalized quote.
      </Text>
      <Button
        title="Request Official Quote"
        onPress={onRequestQuotation}
        fullWidth
        loading={loading}
        disabled={itemCount === 0}
        style={{ backgroundColor: '#16a34a' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.gray[600],
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 12,
  },
  note: {
    fontSize: 13,
    color: colors.gray[500],
    lineHeight: 18,
    marginBottom: 8,
  },
  priceNote: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 10,
  },
});

export default CartSummary;
