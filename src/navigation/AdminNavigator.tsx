import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Star,
  LogOut,
  User,
  Home,
  Shield,
  Moon,
  Activity,
} from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
import { useAuth, useTheme } from '../contexts';
import { colors } from '../theme';
import { AdminDrawerParamList } from './types';

// Import Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import AdminQuotationsScreen from '../screens/admin/AdminQuotationsScreen';
import AdminReviewsScreen from '../screens/admin/AdminReviewsScreen';
import ActivityLogsScreen from '../screens/admin/ActivityLogsScreen';

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

// Custom Drawer Content
const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, theme } = useTheme();
  const { navigation } = props;

  const handleBackToWebsite = () => {
    // Navigate back to user tabs using the parent navigator (RootStack)
    const parent = navigation.getParent();
    if (parent) {
      parent.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'UserTabs' }],
        })
      );
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[styles.drawerContainer, { backgroundColor: theme.background }]}
    >
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {user?.profilePicture ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <User size={32} color={colors.white} />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
          </Text>
        </View>
      </View>

      {/* Drawer Items */}
      <View style={styles.drawerItemsContainer}>
        <Text style={[styles.menuLabel, { color: theme.textSecondary }]}>MENU</Text>
        <DrawerItemList {...props} />
      </View>

      {/* Dark Mode Toggle */}
      <View style={[styles.darkModeRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Moon size={16} color={colors.primary[600]} />
        <Text style={[styles.darkModeLabel, { color: theme.text }]}>Dark Mode</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
          thumbColor={colors.white}
          style={styles.darkModeSwitch}
        />
      </View>

      {/* Admin Info Card */}
      <View style={[
        styles.infoCard,
        {
          backgroundColor: isDark ? theme.surface : colors.primary[50],
          borderColor: isDark ? theme.border : colors.primary[100],
        },
      ]}>
        <View style={[styles.infoCardIcon, { backgroundColor: isDark ? theme.border : colors.primary[100] }]}>
          <Shield size={18} color={colors.primary[600]} />
        </View>
        <View style={styles.infoCardContent}>
          <Text style={[styles.infoCardTitle, { color: isDark ? colors.primary[300] : colors.primary[700] }]}>Admin Panel</Text>
          <Text style={[styles.infoCardSub, { color: isDark ? colors.primary[400] : colors.primary[500] }]}>Accuro Mobile v1.0</Text>
          <Text style={[styles.infoCardDate, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Back to Website Button */}
      <View style={[styles.backSection, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? theme.border : colors.primary[50] }]} onPress={handleBackToWebsite}>
          <Home size={20} color={colors.primary[600]} />
          <Text style={styles.backText}>Back to Website</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={[styles.logoutSection, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

export const AdminNavigator: React.FC = () => {
  const { isDark, theme } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary[600],
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        drawerStyle: {
          backgroundColor: theme.background,
        },
        drawerActiveBackgroundColor: isDark ? colors.primary[900] : colors.primary[100],
        drawerActiveTintColor: isDark ? colors.primary[200] : colors.primary[700],
        drawerInactiveTintColor: theme.textSecondary,
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
          marginLeft: -10,
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginHorizontal: 8,
          marginVertical: 2,
        },
      }}
    >
      <Drawer.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AdminBookings"
        component={AdminBookingsScreen}
        options={{
          title: 'Bookings',
          drawerIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AdminQuotations"
        component={AdminQuotationsScreen}
        options={{
          title: 'Quotations',
          drawerIcon: ({ color, size }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AdminReviews"
        component={AdminReviewsScreen}
        options={{
          title: 'Reviews',
          drawerIcon: ({ color, size }) => (
            <Star size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AdminActivityLogs"
        component={ActivityLogsScreen}
        options={{
          title: 'Activity Logs',
          drawerIcon: ({ color, size }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[700],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: colors.primary[200],
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray[400],
    letterSpacing: 1,
    marginLeft: 20,
    marginTop: 16,
    marginBottom: 4,
  },
  drawerItemsContainer: {
    paddingTop: 4,
  },
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.gray[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 10,
  },
  darkModeLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[700],
  },
  darkModeSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
    gap: 12,
  },
  infoCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardContent: { flex: 1 },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary[700],
  },
  infoCardSub: {
    fontSize: 11,
    color: colors.primary[500],
    marginTop: 1,
  },
  infoCardDate: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 2,
  },
  backSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    padding: 16,
    backgroundColor: colors.white,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  backText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary[600],
  },
  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    padding: 16,
    backgroundColor: colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: colors.error,
  },
});

export default AdminNavigator;
