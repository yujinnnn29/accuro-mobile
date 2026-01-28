import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { quotationService } from '../../api';
import { colors } from '../../theme';
import { LoadingSpinner, FilterTabs, EmptyState } from '../../components/common';
import { QuotationCard, Quotation } from '../../components/quotation';
import { MoreStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<MoreStackParamList>;

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected' | 'expired';

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export const MyQuotationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');

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

  const filteredQuotations = quotations.filter((quotation) => {
    if (selectedFilter === 'all') return true;
    return quotation.status === selectedFilter;
  });

  const handleQuotationPress = (quotation: Quotation) => {
    navigation.navigate('QuotationDetail', { quotationId: quotation._id });
  };

  const getFilterCounts = () => {
    return filterOptions.map((option) => ({
      ...option,
      count: option.key === 'all'
        ? quotations.length
        : quotations.filter((q) => q.status === option.key).length,
    }));
  };

  const renderQuotation = ({ item }: { item: Quotation }) => (
    <QuotationCard
      quotation={item}
      onPress={() => handleQuotationPress(item)}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon="file"
      title={selectedFilter === 'all' ? 'No Quotations Yet' : `No ${selectedFilter} Quotations`}
      description={
        selectedFilter === 'all'
          ? 'Add items to your cart and request a quotation to get started.'
          : `You don't have any ${selectedFilter} quotations.`
      }
      actionLabel={selectedFilter === 'all' ? 'Browse Products' : undefined}
      onAction={
        selectedFilter === 'all'
          ? () => navigation.getParent()?.getParent()?.navigate('HomeTab', { screen: 'Products' })
          : undefined
      }
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading quotations..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Quotations</Text>
        <Text style={styles.headerSubtitle}>
          {quotations.length} {quotations.length === 1 ? 'quotation' : 'quotations'} total
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
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
});

export default MyQuotationsScreen;
