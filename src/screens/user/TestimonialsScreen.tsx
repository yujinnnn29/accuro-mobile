import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Star } from 'lucide-react-native';
import { reviewService } from '../../api';
import { useAuth, useTheme } from '../../contexts';
import { Review } from '../../types';
import { colors } from '../../theme';
import { LoadingSpinner, FilterTabs, EmptyState } from '../../components/common';
import { ReviewCard, ReviewForm, StarRating } from '../../components/review';

type FilterKey = 'all' | '5' | '4' | '3' | '2' | '1';

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '5', label: '5 Stars' },
  { key: '4', label: '4 Stars' },
  { key: '3', label: '3 Stars' },
];

export const TestimonialsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await reviewService.getApprovedReviews();
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const calculateAverageRating = (): string => {
    if (reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const filteredReviews = reviews.filter((review) => {
    if (selectedFilter === 'all') return true;
    return review.rating === parseInt(selectedFilter, 10);
  });

  const handleSubmitReview = async (rating: number, comment: string) => {
    try {
      await reviewService.createReview({
        rating,
        comment,
        reviewType: 'general',
      });
      Alert.alert(
        'Review Submitted',
        'Thank you for your review! It will be visible after approval.'
      );
      setShowForm(false);
    } catch (error: any) {
      throw error;
    }
  };

  const renderHeader = () => (
    <View>
      {/* Stats Card */}
      <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
        <View style={styles.ratingContainer}>
          <Text style={[styles.averageRating, { color: theme.text }]}>{calculateAverageRating()}</Text>
          <StarRating rating={parseFloat(calculateAverageRating())} size={24} />
          <Text style={[styles.reviewCount, { color: theme.textSecondary }]}>
            Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
      </View>

      {/* Write Review Button / Form */}
      {isAuthenticated && !showForm && (
        <TouchableOpacity
          style={[styles.writeReviewButton, { backgroundColor: theme.surface }]}
          onPress={() => setShowForm(true)}
          activeOpacity={0.7}
        >
          <Star size={20} color={colors.primary[600]} />
          <Text style={styles.writeReviewText}>Write a Review</Text>
        </TouchableOpacity>
      )}

      {showForm && (
        <ReviewForm
          onSubmit={handleSubmitReview}
          userName={user?.name}
        />
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Customer Reviews</Text>
    </View>
  );

  const renderReview = ({ item }: { item: Review }) => (
    <ReviewCard review={item} />
  );

  const renderEmpty = () => (
    <EmptyState
      icon="default"
      title={selectedFilter === 'all' ? 'No Reviews Yet' : `No ${selectedFilter}-Star Reviews`}
      description={
        selectedFilter === 'all'
          ? 'Be the first to share your experience with Accuro.'
          : `There are no ${selectedFilter}-star reviews yet.`
      }
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading reviews..." />;
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Testimonials</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filters */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <FilterTabs
          options={filterOptions}
          selectedKey={selectedFilter}
          onSelect={(key) => setSelectedFilter(key as FilterKey)}
        />
      </View>

      {/* Reviews List */}
      <FlatList
        data={filteredReviews}
        renderItem={renderReview}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderHeader}
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
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    gap: 8,
  },
  writeReviewText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary[600],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
  },
});

export default TestimonialsScreen;
