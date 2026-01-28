import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { colors } from '../../theme';
import { Button, Card } from '../common';
import StarRating from './StarRating';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => Promise<void>;
  userName?: string;
  loading?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  userName,
  loading = false,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }
    if (comment.trim().length < 10) {
      Alert.alert('Comment Required', 'Please write a comment of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(rating, comment);
      setRating(0);
      setComment('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={styles.card} padding="lg">
      <Text style={styles.title}>Write a Review</Text>
      {userName && (
        <Text style={styles.subtitle}>Posting as {userName}</Text>
      )}

      <View style={styles.ratingSection}>
        <Text style={styles.label}>Your Rating</Text>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          readonly={false}
          size={32}
        />
      </View>

      <View style={styles.commentSection}>
        <Text style={styles.label}>Your Review</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Share your experience with Accuro..."
          placeholderTextColor={colors.gray[400]}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Button
        title="Submit Review"
        onPress={handleSubmit}
        fullWidth
        loading={submitting || loading}
        disabled={rating === 0 || comment.trim().length < 10}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 16,
  },
  ratingSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 8,
  },
  commentSection: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray[900],
    minHeight: 100,
  },
});

export default ReviewForm;
