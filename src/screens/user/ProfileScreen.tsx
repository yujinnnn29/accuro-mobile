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
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
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
  LogOut,
} from 'lucide-react-native';
import { useAuth, useTheme } from '../../contexts';
import { authService } from '../../api';
import api from '../../api/api';
import { colors } from '../../theme';
import { Button, Input, Card, Badge } from '../../components/common';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isTabScreen = route.name === 'TechnicianProfileTab';
  const { user, updateUser, refreshUser, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    middleName: user?.middleName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    specialization: user?.specialization || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChangeAvatar = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      });

      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;

      setAvatarUploading(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('photo', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'avatar.jpg',
        } as any);

        const res = await api.put('/auth/updatedetails', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.success && res.data?.data?.profilePicture) {
          updateUser({ profilePicture: res.data.data.profilePicture });
        }
        await refreshUser();
        Alert.alert('Success', 'Profile picture updated');
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to update profile picture');
      } finally {
        setAvatarUploading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open image picker');
    }
  };

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
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
      const fullName = [formData.firstName.trim(), formData.middleName.trim(), formData.lastName.trim()]
        .filter(Boolean).join(' ');

      await authService.updateDetails({
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim(),
        name: fullName,
        phone: formData.phone,
        company: formData.company,
        specialization: formData.specialization || undefined,
      });

      updateUser({
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim(),
        name: fullName,
        phone: formData.phone,
        company: formData.company,
        specialization: formData.specialization || undefined,
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
      firstName: user?.firstName || '',
      middleName: user?.middleName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      specialization: user?.specialization || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          {!isTabScreen ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture */}
          <View style={[styles.avatarSection, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleChangeAvatar}
              disabled={avatarUploading}
              activeOpacity={0.7}
            >
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <User size={48} color={colors.white} />
                </View>
              )}
              <View style={[styles.cameraButton, avatarUploading && { opacity: 0.5 }]}>
                <Camera size={18} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.firstName && user?.lastName
                ? `${user.firstName}${user.middleName ? ' ' + user.middleName : ''} ${user.lastName}`
                : user?.name}
            </Text>
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
              label={user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : user?.role === 'technician' ? 'Technician' : 'User'}
              variant={user?.role === 'user' ? 'primary' : user?.role === 'technician' ? 'warning' : 'info'}
              style={{ alignSelf: 'center' }}
            />
            {user?.technicianNumber ? (
              <Text style={styles.technicianNumber}>Technician #{user.technicianNumber}</Text>
            ) : null}
          </View>

          {/* Profile Form */}
          <Card style={styles.formCard} padding="lg">
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: theme.text }]}>Personal Information</Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="First Name"
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              leftIcon={<User size={18} color={colors.gray[400]} />}
              error={errors.firstName}
              editable={isEditing}
              placeholder="Enter first name"
            />

            <Input
              label="Middle Name"
              value={formData.middleName}
              onChangeText={(value) => handleInputChange('middleName', value)}
              leftIcon={<User size={18} color={colors.gray[400]} />}
              editable={isEditing}
              containerStyle={styles.inputSpacing}
              placeholder="Enter middle name (optional)"
            />

            <Input
              label="Last Name"
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              leftIcon={<User size={18} color={colors.gray[400]} />}
              error={errors.lastName}
              editable={isEditing}
              containerStyle={styles.inputSpacing}
              placeholder="Enter last name"
            />

            <Input
              label="Email"
              value={formData.email}
              leftIcon={<Mail size={18} color={colors.gray[400]} />}
              editable={false}
              containerStyle={styles.inputSpacing}
            />

            <Input
              label="Phone Number"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              leftIcon={<Phone size={18} color={colors.gray[400]} />}
              keyboardType="phone-pad"
              editable={isEditing}
              containerStyle={styles.inputSpacing}
              placeholder="Enter phone number"
            />

            <Input
              label="Company"
              value={formData.company}
              onChangeText={(value) => handleInputChange('company', value)}
              leftIcon={<Building2 size={18} color={colors.gray[400]} />}
              editable={isEditing}
              containerStyle={styles.inputSpacing}
              placeholder="Enter company name"
            />

            {(user?.role === 'technician') && (
              <Input
                label="Specialization"
                value={formData.specialization}
                onChangeText={(value) => handleInputChange('specialization', value)}
                leftIcon={<CheckCircle size={18} color={colors.gray[400]} />}
                editable={isEditing}
                containerStyle={styles.inputSpacing}
                placeholder="e.g. HVAC, Electrical, Plumbing"
              />
            )}

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

          {/* Appearance */}
          <Card style={styles.formCard} padding="lg">
            <View style={[styles.formHeader, { marginBottom: 0 }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>Appearance</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16 }}>
              <Text style={{ color: theme.text, fontSize: 15 }}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
                thumbColor="#fff"
              />
            </View>
          </Card>

          {/* Change Password */}
          <Card style={styles.formCard} padding="lg">
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: theme.text }]}>Security</Text>
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

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.surface }]}
            onPress={logout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

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
    width: 100,
    height: 100,
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
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    zIndex: 10,
    elevation: 5,
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
  technicianNumber: {
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '500',
    marginTop: 6,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 24,
  },
});

export default ProfileScreen;
