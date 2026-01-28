import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  User,
  FileText,
  Star,
  Phone,
  Info,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react-native';
import { useAuth } from '../../contexts';
import { colors } from '../../theme';
import { Card, Badge } from '../../components/common';
import { MoreStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<MoreStackParamList>;

interface MenuItem {
  icon: React.FC<any>;
  label: string;
  description?: string;
  screen: keyof MoreStackParamList;
  badge?: string;
}

export const MoreMenuScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();

  const menuItems: MenuItem[] = [
    {
      icon: User,
      label: 'My Profile',
      description: 'Manage your account settings',
      screen: 'Profile',
    },
    {
      icon: FileText,
      label: 'My Quotations',
      description: 'View your quotation requests',
      screen: 'MyQuotations',
    },
    {
      icon: Star,
      label: 'Testimonials',
      description: 'Read and write reviews',
      screen: 'Testimonials',
    },
    {
      icon: Phone,
      label: 'Contact Us',
      description: 'Get in touch with our team',
      screen: 'Contact',
    },
    {
      icon: Info,
      label: 'About',
      description: 'Learn more about Accuro',
      screen: 'About',
    },
  ];

  const handleMenuPress = (screen: keyof MoreStackParamList) => {
    navigation.navigate(screen as any);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => handleMenuPress('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <User size={32} color={colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Badge
              label={user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'User'}
              variant="info"
              size="sm"
              style={styles.roleBadge}
            />
          </View>
          <ChevronRight size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card padding="none" style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => handleMenuPress(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <item.icon size={22} color={colors.primary[600]} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.description && (
                    <Text style={styles.menuDescription}>{item.description}</Text>
                  )}
                </View>
                {item.badge && (
                  <Badge label={item.badge} variant="error" size="sm" />
                )}
                <ChevronRight size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <Text style={styles.version}>Accuro Mobile v1.0.0</Text>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  profileEmail: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 8,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[900],
  },
  menuDescription: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  logoutSection: {
    padding: 16,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
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
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 16,
  },
  bottomPadding: {
    height: 24,
  },
});

export default MoreMenuScreen;
