import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { X, User, Shield, ShieldCheck, AlertTriangle, Activity } from 'lucide-react-native';
import { colors } from '../../theme';
import { User as UserType, UserRole } from '../../types';
import { userService } from '../../api';
import { Button, Badge } from '../common';

interface UserRoleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserType | null;
  currentUserRole: UserRole;
}

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'user',
    label: 'User',
    description: 'Regular user with standard access. Can browse products, make bookings, and submit quotes.',
    icon: <User size={24} color={colors.gray[600]} />,
    color: colors.gray[600],
    bgColor: colors.gray[100],
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Administrator with management access. Can manage bookings, products, reviews, and quotations.',
    icon: <Shield size={24} color={colors.info} />,
    color: colors.info,
    bgColor: colors.info + '20',
  },
  {
    role: 'superadmin',
    label: 'Super Admin',
    description: 'Full system access. Can manage users, assign roles, and access all administrative functions.',
    icon: <ShieldCheck size={24} color={colors.error} />,
    color: colors.error,
    bgColor: colors.error + '20',
  },
];

export const UserRoleModal: React.FC<UserRoleModalProps> = ({
  visible,
  onClose,
  onSuccess,
  user,
  currentUserRole,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [showActivity, setShowActivity] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  React.useEffect(() => {
    if (user && visible) {
      setSelectedRole(null);
      setShowActivity(false);
      setActivityData([]);
    }
  }, [user, visible]);

  const canChangeToRole = (targetRole: UserRole): boolean => {
    // Only superadmins can promote to superadmin
    if (targetRole === 'superadmin' && currentUserRole !== 'superadmin') {
      return false;
    }
    // Admins can only promote to admin or demote to user
    if (currentUserRole === 'admin') {
      return targetRole === 'user' || targetRole === 'admin';
    }
    return true;
  };

  const handleConfirmRoleChange = async () => {
    if (!user || !selectedRole) return;

    if (selectedRole === user.role) {
      Alert.alert('Info', 'User already has this role');
      return;
    }

    Alert.alert(
      'Confirm Role Change',
      `Are you sure you want to change ${user.name}'s role to ${selectedRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              await userService.updateUserRole(user._id, selectedRole);
              Alert.alert('Success', `${user.name}'s role has been updated to ${selectedRole}`);
              onSuccess();
              onClose();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to update role');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLoadActivity = async () => {
    if (!user) return;

    setActivityLoading(true);
    try {
      const response = await userService.getUserActivity(user._id);
      setActivityData(response.data || []);
      setShowActivity(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load activity history');
    } finally {
      setActivityLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.title}>Manage User</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.currentRoleRow}>
                <Text style={styles.currentRoleLabel}>Current role: </Text>
                <Badge
                  label={user.role}
                  variant={
                    user.role === 'superadmin' ? 'error' :
                    user.role === 'admin' ? 'info' : 'gray'
                  }
                  size="sm"
                />
              </View>
            </View>
          </View>

          {/* Role Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Role</Text>
            {roleOptions.map((option) => {
              const isCurrentRole = option.role === user.role;
              const canSelect = canChangeToRole(option.role);
              const isSelected = selectedRole === option.role;

              return (
                <TouchableOpacity
                  key={option.role}
                  style={[
                    styles.roleOption,
                    isSelected && styles.roleOptionSelected,
                    !canSelect && styles.roleOptionDisabled,
                  ]}
                  onPress={() => canSelect && setSelectedRole(option.role)}
                  disabled={!canSelect}
                  activeOpacity={0.7}
                >
                  <View style={[styles.roleIcon, { backgroundColor: option.bgColor }]}>
                    {option.icon}
                  </View>
                  <View style={styles.roleContent}>
                    <View style={styles.roleHeader}>
                      <Text style={[styles.roleLabel, !canSelect && styles.roleTextDisabled]}>
                        {option.label}
                      </Text>
                      {isCurrentRole && (
                        <Badge label="Current" variant="success" size="sm" />
                      )}
                      {!canSelect && !isCurrentRole && (
                        <Badge label="Restricted" variant="gray" size="sm" />
                      )}
                    </View>
                    <Text style={[styles.roleDescription, !canSelect && styles.roleTextDisabled]}>
                      {option.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Activity History */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.activityToggle}
              onPress={showActivity ? () => setShowActivity(false) : handleLoadActivity}
            >
              <Activity size={20} color={colors.primary[600]} />
              <Text style={styles.activityToggleText}>
                {showActivity ? 'Hide Activity History' : 'View Activity History'}
              </Text>
            </TouchableOpacity>

            {activityLoading && (
              <Text style={styles.loadingText}>Loading activity...</Text>
            )}

            {showActivity && activityData.length > 0 && (
              <View style={styles.activityList}>
                {activityData.slice(0, 10).map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        {activity.description || activity.action || 'Activity'}
                      </Text>
                      <Text style={styles.activityTime}>
                        {formatDate(activity.timestamp || activity.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {showActivity && activityData.length === 0 && (
              <Text style={styles.noActivityText}>No activity history available</Text>
            )}
          </View>

          {/* Warning for superadmin */}
          {selectedRole === 'superadmin' && (
            <View style={styles.warningBox}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.warningText}>
                Super Admin role grants full system access including user management.
                This action should be carefully considered.
              </Text>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={onClose}
            style={styles.footerButton}
          />
          <Button
            title="Update Role"
            onPress={handleConfirmRoleChange}
            loading={loading}
            disabled={!selectedRole || selectedRole === user.role}
            style={styles.footerButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.white,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  currentRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  currentRoleLabel: {
    fontSize: 13,
    color: colors.gray[500],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
  },
  roleOption: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    marginBottom: 8,
  },
  roleOptionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  roleOptionDisabled: {
    opacity: 0.5,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleContent: {
    flex: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  roleDescription: {
    fontSize: 13,
    color: colors.gray[500],
    lineHeight: 18,
  },
  roleTextDisabled: {
    color: colors.gray[400],
  },
  activityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    gap: 8,
  },
  activityToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[600],
  },
  loadingText: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 12,
    textAlign: 'center',
  },
  activityList: {
    marginTop: 12,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[400],
    marginTop: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    color: colors.gray[700],
  },
  activityTime: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  noActivityText: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 12,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.warning + '15',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[700],
    lineHeight: 18,
  },
  bottomPadding: {
    height: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});

export default UserRoleModal;
