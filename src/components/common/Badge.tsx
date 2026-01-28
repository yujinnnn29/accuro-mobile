import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gray';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  dot = false,
}) => {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: colors.gray[200] },
          text: { color: colors.gray[700] },
        };
      case 'success':
        return {
          container: { backgroundColor: '#dcfce7' },
          text: { color: '#15803d' },
        };
      case 'warning':
        return {
          container: { backgroundColor: '#fef9c3' },
          text: { color: '#a16207' },
        };
      case 'error':
        return {
          container: { backgroundColor: '#fee2e2' },
          text: { color: '#b91c1c' },
        };
      case 'info':
        return {
          container: { backgroundColor: colors.primary[100] },
          text: { color: colors.primary[700] },
        };
      case 'gray':
        return {
          container: { backgroundColor: colors.gray[100] },
          text: { color: colors.gray[600] },
        };
      default:
        return {
          container: { backgroundColor: colors.primary[100] },
          text: { color: colors.primary[700] },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingHorizontal: 6, paddingVertical: 2 },
          text: { fontSize: 10 },
        };
      case 'lg':
        return {
          container: { paddingHorizontal: 12, paddingVertical: 6 },
          text: { fontSize: 14 },
        };
      default:
        return {
          container: { paddingHorizontal: 8, paddingVertical: 4 },
          text: { fontSize: 12 },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        variantStyles.container,
        sizeStyles.container,
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: variantStyles.text.color },
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          variantStyles.text,
          sizeStyles.text,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
});

export default Badge;
