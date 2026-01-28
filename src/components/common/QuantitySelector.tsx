import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { colors } from '../../theme';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  size = 'md',
}) => {
  const canDecrease = quantity > min;
  const canIncrease = quantity < max;

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: { height: 32 },
          button: { width: 28, height: 28 },
          iconSize: 14,
          text: { fontSize: 14, minWidth: 28 },
        };
      case 'lg':
        return {
          container: { height: 48 },
          button: { width: 40, height: 40 },
          iconSize: 20,
          text: { fontSize: 18, minWidth: 44 },
        };
      default:
        return {
          container: { height: 40 },
          button: { width: 36, height: 36 },
          iconSize: 18,
          text: { fontSize: 16, minWidth: 36 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <TouchableOpacity
        style={[
          styles.button,
          sizeStyles.button,
          !canDecrease && styles.buttonDisabled,
        ]}
        onPress={onDecrease}
        disabled={!canDecrease}
        activeOpacity={0.7}
      >
        <Minus
          size={sizeStyles.iconSize}
          color={canDecrease ? colors.gray[700] : colors.gray[300]}
        />
      </TouchableOpacity>
      <Text style={[styles.quantity, sizeStyles.text]}>{quantity}</Text>
      <TouchableOpacity
        style={[
          styles.button,
          sizeStyles.button,
          !canIncrease && styles.buttonDisabled,
        ]}
        onPress={onIncrease}
        disabled={!canIncrease}
        activeOpacity={0.7}
      >
        <Plus
          size={sizeStyles.iconSize}
          color={canIncrease ? colors.gray[700] : colors.gray[300]}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  buttonDisabled: {
    backgroundColor: colors.gray[50],
  },
  quantity: {
    fontWeight: '600',
    color: colors.gray[900],
    textAlign: 'center',
  },
});

export default QuantitySelector;
