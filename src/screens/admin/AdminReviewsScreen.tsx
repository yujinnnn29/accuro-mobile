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
import { Star, CheckCircle, XCircle, Trash2, User } from 'lucide-react-native';
import { reviewService } from '../../api';
import { Review } from '../../types';
import { colors } from '../../theme';
import { LoadingSpinner, FilterTabs, EmptyState, Card, Badge, Button } from '../../components/common';
import { StarRating } from '../../components/review';

type FilterKey = 'all' | 'pending' | 'approved';

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
];

export const AdminReviewsScreen: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const params = selectedFilter === 'pending'
        ? { isApproved: false }
        : selectedFilter === 'approved'
        ? { isApproved: true }
        : undefined;
      const response = await reviewService.getAllReviews(params);
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await reviewService.approveReview(reviewId);
      fetchReviews();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to approve review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reviewId: string) => {
    Alert.alert(
      'Reject Review',
      'Are you sure you want to reject this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(reviewId);
            try {
              await reviewService.deleteReview(reviewId);
              fetchReviews();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject review');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (reviewId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(reviewId);
            try {
              await reviewService.deleteReview(reviewId);
              fetchReviews();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete review');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const getFilterCounts = () => {
    return filterOptions.map((option) => ({
      ...option,
      count: option.key === 'all'
        ? reviews.length
        : option.key === 'pending'
        ? reviews.filter((r) => !r.isApproved).length
        : reviews.filter((r) => r.isApproved).length,
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderReview = ({ item }: { item: Review }) => (
    <Card style={styles.reviewCard} padding="md">
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <User size={18} color={colors.white} />
          </View>
          <View>
            <Text style={styles.userName}>{item.userName}</Text>
            {item.company && (
              <Text style={styles.userCompany}>{item.company}</Text>
            )}
          </View>
        </View>
        <View style={styles.statusContainer}>
          {item.isApproved ? (
            <Badge label="Approved" variant="success" size="sm" />
          ) : (
            <Badge label="Pending" variant="warning" size="sm" />
          )}
        </View>
      </View>

      <View style={styles.ratingRow}>
        <StarRating rating={item.rating} size={18} />
        <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.reviewComment}>{item.comment}</Text>

      <View style={styles.reviewActions}>
        {!item.isApproved && (
          <>
            <Button
              title="Approve"
              onPress={() => handleApprove(item._id)}
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
          </>
        )}
        {item.isApproved && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item._id)}
            disabled={actionLoading === item._id}
          >
            <Trash2 size={18} color={colors.error} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="default"
      title="No Reviews Found"
      description="There are no reviews to display."
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading reviews..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filters */}
      <View style={styles.filterContainer}>
        <FilterTabs
          options={getFilterCounts()}
          selectedKey={selectedFilter}
          onSelect={(key) => setSelectedFilter(key as FilterKey)}
        />
      </View>

      {/* Reviews List */}
      <FlatList
        data={reviews}
        renderItem={renderReview}
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
  reviewCard: {
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  userCompany: {
    fontSize: 13,
    color: colors.gray[500],
  },
  statusContainer: {
    marginLeft: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.gray[400],
  },
  reviewComment: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 22,
  },
  reviewActions: {
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.error,
  },
});

export default AdminReviewsScreen;
