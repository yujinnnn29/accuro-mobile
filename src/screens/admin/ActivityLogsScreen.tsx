import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  Filter,
  X,
  Calendar,
  User,
  Package,
  FileText,
  Star,
  Mail,
  Settings,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Eye,
  Clock,
  ChevronDown,
} from 'lucide-react-native';
import { LucideIcon } from 'lucide-react-native';
import { analyticsService } from '../../api';
import { ActivityItem, ActivityType } from '../../types';
import { colors } from '../../theme';
import { LoadingSpinner, Card, Badge, Button } from '../../components/common';

interface FilterOptions {
  actionType: ActivityType | 'all';
  resourceType: string | 'all';
  user: string | 'all';
}

const ACTION_TYPE_OPTIONS: { value: ActivityType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
  { value: 'approve', label: 'Approved' },
  { value: 'reject', label: 'Rejected' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
];

const RESOURCE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Resources' },
  { value: 'booking', label: 'Bookings' },
  { value: 'product', label: 'Products' },
  { value: 'quotation', label: 'Quotations' },
  { value: 'user', label: 'Users' },
  { value: 'review', label: 'Reviews' },
  { value: 'contact', label: 'Contacts' },
];

const getActionIcon = (action: ActivityType): LucideIcon => {
  switch (action) {
    case 'create':
      return Plus;
    case 'update':
      return Edit;
    case 'delete':
      return Trash2;
    case 'approve':
      return CheckCircle;
    case 'reject':
      return XCircle;
    case 'login':
    case 'logout':
      return User;
    default:
      return Activity;
  }
};

const getActionColor = (action: ActivityType): string => {
  switch (action) {
    case 'create':
      return colors.success;
    case 'update':
      return colors.info;
    case 'delete':
      return colors.error;
    case 'approve':
      return colors.success;
    case 'reject':
      return colors.error;
    case 'login':
      return colors.primary[600];
    case 'logout':
      return colors.gray[500];
    default:
      return colors.gray[500];
  }
};

const getResourceIcon = (resource: string): LucideIcon => {
  switch (resource.toLowerCase()) {
    case 'booking':
      return Calendar;
    case 'product':
      return Package;
    case 'quotation':
      return FileText;
    case 'user':
      return User;
    case 'review':
      return Star;
    case 'contact':
      return Mail;
    case 'settings':
      return Settings;
    default:
      return Activity;
  }
};

const PAGE_SIZE = 20;

export const ActivityLogsScreen: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    actionType: 'all',
    resourceType: 'all',
    user: 'all',
  });
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  const fetchActivities = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }

      const response = await analyticsService.getRecentActivity(PAGE_SIZE * pageNum);
      let data = response.data || [];

      // Apply client-side filters
      if (filters.actionType !== 'all') {
        data = data.filter((item: ActivityItem) => item.action === filters.actionType);
      }
      if (filters.resourceType !== 'all') {
        data = data.filter((item: ActivityItem) =>
          item.resource.toLowerCase() === filters.resourceType.toLowerCase()
        );
      }

      // Paginate
      const startIndex = (pageNum - 1) * PAGE_SIZE;
      const endIndex = pageNum * PAGE_SIZE;
      const pageData = data.slice(startIndex, endIndex);

      if (pageNum === 1) {
        setActivities(pageData);
      } else {
        setActivities(prev => [...prev, ...pageData]);
      }

      setHasMore(data.length > endIndex);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Generate mock data on error
      if (pageNum === 1) {
        setActivities(generateMockActivities());
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filters]);

  const generateMockActivities = (): ActivityItem[] => {
    const actions: ActivityType[] = ['create', 'update', 'delete', 'approve', 'reject', 'login'];
    const resources = ['Booking', 'Product', 'Quotation', 'User', 'Review'];
    const resourceTypes: Array<'booking' | 'quotation' | 'review' | 'user' | 'product' | 'contact'> =
      ['booking', 'product', 'quotation', 'user', 'review'];
    const users = ['John Admin', 'Sarah Manager', 'Mike Admin', 'Lisa Super'];

    return Array.from({ length: 15 }, (_, i) => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resourceIndex = Math.floor(Math.random() * resources.length);
      const resource = resources[resourceIndex];
      const resourceType = resourceTypes[resourceIndex];
      const user = users[Math.floor(Math.random() * users.length)];
      const hoursAgo = Math.floor(Math.random() * 72);

      return {
        _id: `activity-${i}`,
        action,
        resource,
        resourceType,
        resourceId: `${resourceType}-${1000 + i}`,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)}d ${resource.toLowerCase()} #${1000 + i}`,
        user: { _id: `user-${i}`, name: user },
        timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
      };
    });
  };

  useEffect(() => {
    fetchActivities(1);
  }, [fetchActivities]);

  const onRefresh = () => {
    fetchActivities(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchActivities(page + 1);
    }
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      actionType: 'all',
      resourceType: 'all',
      user: 'all',
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setShowFilterModal(false);
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.actionType !== 'all') count++;
    if (filters.resourceType !== 'all') count++;
    if (filters.user !== 'all') count++;
    return count;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderActivityItem = ({ item, index }: { item: ActivityItem; index: number }) => {
    const ActionIcon = getActionIcon(item.action);
    const actionColor = getActionColor(item.action);
    const ResourceIcon = getResourceIcon(item.resource);
    const isLast = index === activities.length - 1;

    return (
      <View style={styles.timelineItem}>
        {/* Timeline Line */}
        <View style={styles.timelineLeft}>
          <View style={[styles.iconContainer, { backgroundColor: actionColor + '20' }]}>
            <ActionIcon size={16} color={actionColor} />
          </View>
          {!isLast && <View style={styles.timelineLine} />}
        </View>

        {/* Content */}
        <View style={styles.timelineContent}>
          <View style={styles.activityHeader}>
            <View style={styles.actionBadge}>
              <Text style={[styles.actionText, { color: actionColor }]}>
                {item.action.toUpperCase()}
              </Text>
            </View>
            <View style={styles.timestampContainer}>
              <Clock size={12} color={colors.gray[400]} />
              <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
            </View>
          </View>

          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.activityMeta}>
            <View style={styles.metaItem}>
              <ResourceIcon size={14} color={colors.gray[500]} />
              <Text style={styles.metaText}>{item.resource}</Text>
            </View>
            {item.user && (
              <View style={styles.metaItem}>
                <User size={14} color={colors.gray[500]} />
                <Text style={styles.metaText}>
                  {typeof item.user === 'string' ? item.user : item.user.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter Activity Logs</Text>
          <TouchableOpacity onPress={() => setShowFilterModal(false)}>
            <X size={24} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {/* Action Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Action Type</Text>
            <View style={styles.filterOptions}>
              {ACTION_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    tempFilters.actionType === option.value && styles.filterChipActive,
                  ]}
                  onPress={() => setTempFilters({ ...tempFilters, actionType: option.value })}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      tempFilters.actionType === option.value && styles.filterChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Resource Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Resource Type</Text>
            <View style={styles.filterOptions}>
              {RESOURCE_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    tempFilters.resourceType === option.value && styles.filterChipActive,
                  ]}
                  onPress={() => setTempFilters({ ...tempFilters, resourceType: option.value })}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      tempFilters.resourceType === option.value && styles.filterChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <LoadingSpinner size="small" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Activity size={48} color={colors.gray[300]} />
      <Text style={styles.emptyTitle}>No Activity Found</Text>
      <Text style={styles.emptySubtitle}>
        {getActiveFilterCount() > 0
          ? 'Try adjusting your filters'
          : 'Activity logs will appear here'}
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading activity logs..." />;
  }

  const filterCount = getActiveFilterCount();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header with Filter */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Activity Timeline</Text>
          <Text style={styles.headerSubtitle}>{activities.length} activities</Text>
        </View>
        <TouchableOpacity
          style={[styles.filterButton, filterCount > 0 && styles.filterButtonActive]}
          onPress={() => {
            setTempFilters(filters);
            setShowFilterModal(true);
          }}
        >
          <Filter size={18} color={filterCount > 0 ? colors.white : colors.gray[600]} />
          {filterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {filterCount > 0 && (
        <View style={styles.activeFiltersContainer}>
          {filters.actionType !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {ACTION_TYPE_OPTIONS.find(o => o.value === filters.actionType)?.label}
              </Text>
              <TouchableOpacity
                onPress={() => setFilters({ ...filters, actionType: 'all' })}
              >
                <X size={14} color={colors.primary[600]} />
              </TouchableOpacity>
            </View>
          )}
          {filters.resourceType !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {RESOURCE_TYPE_OPTIONS.find(o => o.value === filters.resourceType)?.label}
              </Text>
              <TouchableOpacity
                onPress={() => setFilters({ ...filters, resourceType: 'all' })}
              >
                <X size={14} color={colors.primary[600]} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Activity List */}
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {renderFilterModal()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.primary[600],
  },
  filterBadge: {
    backgroundColor: colors.white,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[600],
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingTop: 8,
    backgroundColor: colors.white,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.gray[100],
  },
  actionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: colors.gray[400],
  },
  description: {
    fontSize: 14,
    color: colors.gray[800],
    marginBottom: 10,
    lineHeight: 20,
  },
  activityMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});

export default ActivityLogsScreen;
