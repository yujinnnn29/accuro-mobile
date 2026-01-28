import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Package, Calendar, FileText, Bell, ShoppingCart } from 'lucide-react-native';
import { colors } from '../../theme';
import Button from './Button';

type IconType = 'package' | 'calendar' | 'file' | 'bell' | 'cart' | 'default';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconType;
  customIcon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'default',
  customIcon,
  actionLabel,
  onAction,
  style,
}) => {
  const getIcon = () => {
    if (customIcon) return customIcon;

    const iconProps = { size: 64, color: colors.gray[300] };

    switch (icon) {
      case 'package':
        return <Package {...iconProps} />;
      case 'calendar':
        return <Calendar {...iconProps} />;
      case 'file':
        return <FileText {...iconProps} />;
      case 'bell':
        return <Bell {...iconProps} />;
      case 'cart':
        return <ShoppingCart {...iconProps} />;
      default:
        return <Package {...iconProps} />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>{getIcon()}</View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 16,
    opacity: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  button: {
    marginTop: 24,
  },
});

export default EmptyState;
