import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  User,
  Shield,
  ShieldCheck,
  Mail,
  CheckCircle,
  MoreVertical,
  Trash2,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../contexts';
import { userService } from '../../api';
import { User as UserType, UserRole } from '../../types';
import { colors } from '../../theme';
import { LoadingSpinner, FilterTabs, EmptyState, Card, Badge, Button } from '../../components/common';
import { UserRoleModal } from '../../components/admin';

type FilterKey = 'all' | UserRole;

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'user', label: 'Users' },
  { key: 'admin', label: 'Admins' },
  { key: 'superadmin', label: 'Super Admins' },
];

const ITEMS_PER_PAGE = 10;

export const AdminUsersScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // Action menu
  const [actionMenuUser, setActionMenuUser] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const params = selectedFilter !== 'all' ? { role: selectedFilter } : undefined;
      const response = await userService.getUsers(params);
      setUsers(response.data || []);
      setCurrentPage(1);
    } catch (error: any) {
      const isNetworkIssue = !error.response && (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.code === 'ERR_NETWORK' || error.message === 'Aborted' || error.message === 'Network Error');
      if (!isNetworkIssue) console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleManageRole = (user: UserType) => {
    setSelectedUser(user);
    setShowRoleModal(true);
    setActionMenuUser(null);
  };

  const handleDeleteUser = (user: UserType) => {
    setActionMenuUser(null);

    // Check restrictions
    if (user._id === currentUser?._id) {
      Alert.alert('Error', 'You cannot delete your own account');
      return;
    }

    if (user.role === 'superadmin' && currentUser?.role !== 'superadmin') {
      Alert.alert('Error', 'Only super admins can delete super admin accounts');
      return;
    }

    if (user.role === 'admin' && currentUser?.role === 'admin') {
      Alert.alert('Error', 'You cannot delete other admin accounts');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(user._id);
            try {
              await userService.deleteUser(user._id);
              Alert.alert('Success', 'User has been deleted');
              fetchUsers();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.company && user.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getFilterCounts = () => {
    return filterOptions.map((option) => ({
      ...option,
      count: option.key === 'all'
        ? users.length
        : users.filter((u) => u.role === option.key).length,
    }));
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return <Badge label="Super Admin" variant="error" size="sm" />;
      case 'admin':
        return <Badge label="Admin" variant="info" size="sm" />;
      default:
        return <Badge label="User" variant="gray" size="sm" />;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return <ShieldCheck size={20} color={colors.error} />;
      case 'admin':
        return <Shield size={20} color={colors.info} />;
      default:
        return <User size={20} color={colors.gray[500]} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canManageUser = (user: UserType): boolean => {
    if (!currentUser) return false;
    if (user._id === currentUser._id) return false;
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'admin' && user.role === 'user') return true;
    return false;
  };

  const renderUser = ({ item }: { item: UserType }) => {
    const showActionMenu = actionMenuUser === item._id;
    const canManage = canManageUser(item);

    return (
      <Card style={styles.userCard} padding="md">
        <View style={styles.userRow}>
          <View style={styles.avatarContainer}>
            {getRoleIcon(item.role)}
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userHeader}>
              <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
              {getRoleBadge(item.role)}
            </View>
            <View style={styles.emailRow}>
              <Mail size={14} color={colors.gray[400]} />
              <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
              {item.isEmailVerified && (
                <CheckCircle size={14} color={colors.success} />
              )}
            </View>
            {item.company && (
              <Text style={styles.userCompany}>{item.company}</Text>
            )}
            <View style={styles.statsRow}>
              <Text style={styles.userDate}>
                Joined {formatDate(item.createdAt)}
              </Text>
              {item.loginCount !== undefined && (
                <Text style={styles.loginCount}>
                  {item.loginCount} login{item.loginCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>

          {canManage && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setActionMenuUser(showActionMenu ? null : item._id)}
            >
              <MoreVertical size={20} color={colors.gray[500]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Menu */}
        {showActionMenu && (
          <View style={styles.actionMenu}>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => handleManageRole(item)}
            >
              <Settings size={18} color={colors.primary[600]} />
              <Text style={styles.actionMenuText}>Manage Role</Text>
            </TouchableOpacity>

            {currentUser?.role === 'superadmin' && (
              <TouchableOpacity
                style={[styles.actionMenuItem, styles.deleteMenuItem]}
                onPress={() => handleDeleteUser(item)}
                disabled={actionLoading === item._id}
              >
                <Trash2 size={18} color={colors.error} />
                <Text style={[styles.actionMenuText, styles.deleteMenuText]}>
                  Delete User
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="default"
      title="No Users Found"
      description={
        searchQuery
          ? 'No users match your search.'
          : 'There are no users to display.'
      }
    />
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={20} color={currentPage === 1 ? colors.gray[300] : colors.gray[600]} />
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={styles.pageText}>
            Page {currentPage} of {totalPages}
          </Text>
          <Text style={styles.totalText}>
            ({filteredUsers.length} users)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={20} color={currentPage === totalPages ? colors.gray[300] : colors.gray[600]} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading users..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or company..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FilterTabs
          options={getFilterCounts()}
          selectedKey={selectedFilter}
          onSelect={(key) => {
            setSelectedFilter(key as FilterKey);
            setCurrentPage(1);
          }}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Users List */}
      <FlatList
        data={paginatedUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderPagination}
        showsVerticalScrollIndicator={false}
        onScroll={() => setActionMenuUser(null)}
      />

      {/* User Role Modal */}
      <UserRoleModal
        visible={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
        user={selectedUser}
        currentUserRole={currentUser?.role || 'user'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: colors.gray[900],
  },
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: colors.gray[500],
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  userCard: {
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
    marginRight: 8,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray[600],
    flex: 1,
  },
  userCompany: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userDate: {
    fontSize: 12,
    color: colors.gray[400],
  },
  loginCount: {
    fontSize: 12,
    color: colors.gray[400],
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionMenu: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 10,
  },
  deleteMenuItem: {
    backgroundColor: colors.error + '10',
    marginTop: 4,
  },
  actionMenuText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[600],
  },
  deleteMenuText: {
    color: colors.error,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  pageButtonDisabled: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[100],
  },
  pageInfo: {
    alignItems: 'center',
  },
  pageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  totalText: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
});

export default AdminUsersScreen;
