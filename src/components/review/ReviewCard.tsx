import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { Review } from '../../types';
import { colors } from '../../theme';
import { Card } from '../common';
import StarRating from './StarRating';
import { useTheme } from '../../contexts';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { theme } = useTheme();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card style={styles.card} padding="md">
      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={20} color={colors.white} />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>{review.userName}</Text>
          {review.company && (
            <Text style={[styles.company, { color: theme.textSecondary }]}>{review.company}</Text>
          )}
        </View>
        <StarRating rating={review.rating} size={16} />
      </View>
      <Text style={[styles.comment, { color: theme.textSecondary }]}>{review.comment}</Text>
      <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  company: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  comment: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 22,
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: colors.gray[400],
  },
});

export default ReviewCard;
