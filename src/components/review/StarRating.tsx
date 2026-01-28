import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../../theme';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  showEmpty?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  onRatingChange,
  readonly = true,
  showEmpty = true,
}) => {
  const handlePress = (index: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const renderStar = (index: number) => {
    const isFilled = index < rating;
    const StarComponent = readonly ? View : TouchableOpacity;

    return (
      <StarComponent
        key={index}
        onPress={readonly ? undefined : () => handlePress(index)}
        style={styles.starContainer}
      >
        <Star
          size={size}
          color={isFilled ? '#fbbf24' : colors.gray[300]}
          fill={isFilled ? '#fbbf24' : 'transparent'}
        />
      </StarComponent>
    );
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: 2,
  },
});

export default StarRating;
