import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Lock,
  Camera,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '../../contexts';
import { authService } from '../../api';
import { colors } from '../../theme';
import { Button, Input, Card, Badge } from '../../components/common';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUser, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.updateDetails({
        name: formData.name,
        phone: formData.phone,
        company: formData.company,
      });

      updateUser({
        name: formData.name,
        phone: formData.phone,
        company: formData.company,
      });

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await authService.updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={48} color={colors.white} />
              </View>
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.verificationBadge}>
              {user?.isEmailVerified ? (
                <>
                  <CheckCircle size={14} color={colors.success} />
                  <Text style={styles.verifiedText}>Email Verified</Text>
                </>
              ) : (
                <>
                  <AlertCircle size={14} color={colors.warning} />
                  <Text style={styles.unverifiedText}>Email Not Verified</Text>
                </>
              )}
            </View>
            <Badge
              label={user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'User'}
              variant={user?.role === 'user' ? 'primary' : 'info'}
            />
          </View>

          {/* Profile Form */}
          <Card style={styles.formCard} padding="lg">
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Personal Information</Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              leftIcon={<User size={18} color={colors.gray[400]} />}
              error={errors.name}
              editable={isEditing}
            />

            <Input
              label="Email"
              value={formData.email}
              leftIcon={<Mail size={18} color={colors.gray[400]} />}
              editable={false}
              containerStyle={styles.inputSpacing}
            />

            <Input
              label="Phone"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              leftIcon={<Phone size={18} color={colors.gray[400]} />}
              keyboardType="phone-pad"
              editable={isEditing}
              containerStyle={styles.inputSpacing}
            />

            <Input
              label="Company"
              value={formData.company}
              onChangeText={(value) => handleInputChange('company', value)}
              leftIcon={<Building2 size={18} color={colors.gray[400]} />}
              editable={isEditing}
              containerStyle={styles.inputSpacing}
            />

            {isEditing && (
              <View style={styles.buttonRow}>
                <Button
                  title="Cancel"
                  onPress={handleCancel}
                  variant="outline"
                  style={styles.buttonHalf}
                />
                <Button
                  title="Save"
                  onPress={handleSaveProfile}
                  loading={loading}
                  style={styles.buttonHalf}
                />
              </View>
            )}
          </Card>

          {/* Change Password */}
          <Card style={styles.formCard} padding="lg">
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Security</Text>
            </View>

            {!showPasswordForm ? (
              <Button
                title="Change Password"
                onPress={() => setShowPasswordForm(true)}
                variant="outline"
                fullWidth
              />
            ) : (
              <>
                <Input
                  label="Current Password"
                  value={passwordData.currentPassword}
                  onChangeText={(value) => handlePasswordChange('currentPassword', value)}
                  leftIcon={<Lock size={18} color={colors.gray[400]} />}
                  isPassword
                  error={errors.currentPassword}
                />

                <Input
                  label="New Password"
                  value={passwordData.newPassword}
                  onChangeText={(value) => handlePasswordChange('newPassword', value)}
                  leftIcon={<Lock size={18} color={colors.gray[400]} />}
                  isPassword
                  error={errors.newPassword}
                  containerStyle={styles.inputSpacing}
                />

                <Input
                  label="Confirm New Password"
                  value={passwordData.confirmPassword}
                  onChangeText={(value) => handlePasswordChange('confirmPassword', value)}
                  leftIcon={<Lock size={18} color={colors.gray[400]} />}
                  isPassword
                  error={errors.confirmPassword}
                  containerStyle={styles.inputSpacing}
                />

                <View style={styles.buttonRow}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setErrors({});
                    }}
                    variant="outline"
                    style={styles.buttonHalf}
                  />
                  <Button
                    title="Update"
                    onPress={handleChangePassword}
                    loading={loading}
                    style={styles.buttonHalf}
                  />
                </View>
              </>
            )}
          </Card>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.white,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
  },
  unverifiedText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '500',
  },
  formCard: {
    margin: 16,
    marginTop: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  inputSpacing: {
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  buttonHalf: {
    flex: 1,
  },
  bottomPadding: {
    height: 24,
  },
});

export default ProfileScreen;
