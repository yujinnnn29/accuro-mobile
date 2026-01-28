import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { colors } from '../../theme';
import { ReportColumn, ReportData } from '../../types';
import { Badge } from '../common';

interface ReportTableProps {
  data: ReportData;
  maxRows?: number;
}

const getStatusBadge = (value: string) => {
  const status = value.toLowerCase();
  switch (status) {
    case 'completed':
    case 'approved':
    case 'active':
      return <Badge label={value} variant="success" size="sm" />;
    case 'pending':
    case 'draft':
      return <Badge label={value} variant="warning" size="sm" />;
    case 'cancelled':
    case 'rejected':
    case 'inactive':
      return <Badge label={value} variant="error" size="sm" />;
    case 'confirmed':
    case 'rescheduled':
      return <Badge label={value} variant="info" size="sm" />;
    default:
      return <Badge label={value} variant="gray" size="sm" />;
  }
};

const formatCellValue = (value: any, key: string): React.ReactNode => {
  if (value === null || value === undefined) {
    return <Text style={styles.emptyCell}>-</Text>;
  }

  // Handle status columns
  if (key === 'status' || key.includes('Status')) {
    return getStatusBadge(String(value));
  }

  // Handle date columns
  if (key.includes('date') || key.includes('Date') || key.includes('At') || key === 'timestamp') {
    try {
      const date = new Date(value);
      return (
        <Text style={styles.cellText}>
          {date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      );
    } catch {
      return <Text style={styles.cellText}>{String(value)}</Text>;
    }
  }

  // Handle amount/price columns
  if (key.includes('amount') || key.includes('Amount') || key.includes('price') || key.includes('Price')) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (!isNaN(num)) {
      return (
        <Text style={[styles.cellText, styles.amountCell]}>
          ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      );
    }
  }

  // Handle rating columns
  if (key === 'rating') {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (!isNaN(num)) {
      return (
        <Text style={[styles.cellText, styles.ratingCell]}>
          {'★'.repeat(Math.round(num))}{'☆'.repeat(5 - Math.round(num))}
        </Text>
      );
    }
  }

  // Handle role columns
  if (key === 'role') {
    return getStatusBadge(String(value));
  }

  return <Text style={styles.cellText} numberOfLines={2}>{String(value)}</Text>;
};

export const ReportTable: React.FC<ReportTableProps> = ({
  data,
  maxRows,
}) => {
  const displayRows = maxRows ? data.rows.slice(0, maxRows) : data.rows;
  const totalWidth = data.columns.reduce((sum, col) => sum + (col.width || 100), 0);

  const renderHeader = () => (
    <View style={[styles.headerRow, { width: totalWidth }]}>
      {data.columns.map((column) => (
        <View
          key={column.key}
          style={[
            styles.headerCell,
            { width: column.width || 100 },
            column.align === 'right' && styles.alignRight,
            column.align === 'center' && styles.alignCenter,
          ]}
        >
          <Text style={styles.headerText}>{column.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderRow = ({ item, index }: { item: Record<string, any>; index: number }) => (
    <View
      style={[
        styles.row,
        { width: totalWidth },
        index % 2 === 1 && styles.rowAlternate,
      ]}
    >
      {data.columns.map((column) => (
        <View
          key={column.key}
          style={[
            styles.cell,
            { width: column.width || 100 },
            column.align === 'right' && styles.alignRight,
            column.align === 'center' && styles.alignCenter,
          ]}
        >
          {formatCellValue(item[column.key], column.key)}
        </View>
      ))}
    </View>
  );

  if (data.rows.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {renderHeader()}
          <FlatList
            data={displayRows}
            renderItem={renderRow}
            keyExtractor={(_, index) => String(index)}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Summary */}
      {data.summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            Showing {displayRows.length} of {data.summary.totalRecords} records
          </Text>
          {data.summary.additionalMetrics && (
            <View style={styles.metricsRow}>
              {Object.entries(data.summary.additionalMetrics).map(([key, value]) => (
                <View key={key} style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{key}:</Text>
                  <Text style={styles.metricValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {maxRows && data.rows.length > maxRows && (
        <View style={styles.moreRows}>
          <Text style={styles.moreRowsText}>
            +{data.rows.length - maxRows} more rows
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerCell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  rowAlternate: {
    backgroundColor: colors.gray[50],
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 13,
    color: colors.gray[700],
  },
  emptyCell: {
    fontSize: 13,
    color: colors.gray[400],
  },
  amountCell: {
    fontWeight: '500',
  },
  ratingCell: {
    color: colors.warning,
    fontSize: 12,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  alignCenter: {
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  summaryContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  summaryText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.gray[500],
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  },
  moreRows: {
    padding: 8,
    alignItems: 'center',
    backgroundColor: colors.primary[50],
  },
  moreRowsText: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
});

export default ReportTable;
