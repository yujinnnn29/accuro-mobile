import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';

interface DashboardStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  onPress?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  onPress,
  trend,
  subtitle,
}) => {
  const { theme } = useTheme();
  const content = (
    <>
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{(value ?? 0).toLocaleString()}</Text>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      {trend && (
        <View style={styles.trendContainer}>
          <Text
            style={[
              styles.trendText,
              { color: trend.isPositive ? colors.success : colors.error },
            ]}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Text>
          <Text style={styles.trendLabel}>vs last month</Text>
        </View>
      )}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, { backgroundColor: theme.surface }]}>{content}</View>;
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  title: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendLabel: {
    fontSize: 12,
    color: colors.gray[400],
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
});

export default DashboardStatCard;
