import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, Bell, Calendar, FileText, CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';

export type NotificationType = 'booking' | 'quotation' | 'general' | 'success' | 'warning' | 'info';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const { isDark, theme } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    if (isTruncated) {
      setExpanded((prev) => !prev);
    }
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead();
    }
  };
  const getIcon = () => {
    const iconProps = { size: 20, color: colors.white };
    switch (notification.type) {
      case 'booking':
        return <Calendar {...iconProps} />;
      case 'quotation':
        return <FileText {...iconProps} />;
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'warning':
        return <AlertCircle {...iconProps} />;
      case 'info':
        return <Info {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getIconBackground = () => {
    switch (notification.type) {
      case 'booking':
        return colors.primary[500];
      case 'quotation':
        return colors.info;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      default:
        return colors.gray[500];
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderBottomColor: theme.border },
        !notification.isRead && { backgroundColor: isDark ? colors.navy[800] : colors.primary[50] },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconBackground() }]}>
        {getIcon()}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {notification.title}
          </Text>
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
        {/* Invisible text to measure actual rendered line count */}
        <Text
          style={[styles.message, { opacity: 0, position: 'absolute', color: 'transparent' }]}
          onTextLayout={(e) => {
            if (e.nativeEvent.lines.length > 2) {
              setIsTruncated(true);
            }
          }}
        >
          {notification.message}
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary }]} numberOfLines={expanded ? undefined : 2}>
          {notification.message}
        </Text>
        {isTruncated && (
          <View style={styles.expandRow}>
            {expanded
              ? <ChevronUp size={14} color={colors.primary[600]} />
              : <ChevronDown size={14} color={colors.primary[600]} />}
            <Text style={styles.expandText}>
              {expanded ? 'Show less' : 'Show more'}
            </Text>
          </View>
        )}
        <View style={styles.footer}>
          <Text style={styles.time}>{formatTime(notification.createdAt)}</Text>
        </View>
      </View>
      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  unread: {
    backgroundColor: colors.primary[50],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
    marginRight: 8,
  },
  message: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: colors.gray[400],
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 3,
  },
  expandText: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
    position: 'absolute',
    top: 16,
    right: 16,
  },
});

export default NotificationCard;
