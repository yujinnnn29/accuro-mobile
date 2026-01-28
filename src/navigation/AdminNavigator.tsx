import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LayoutDashboard,
  Calendar,
  Package,
  FileText,
  Users,
  Star,
  Settings,
  LogOut,
  User,
  BarChart3,
  ClipboardList,
  Activity,
} from 'lucide-react-native';
import { useAuth } from '../contexts';
import { colors } from '../theme';
import { AdminDrawerParamList } from './types';

// Import Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminQuotationsScreen from '../screens/admin/AdminQuotationsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminReviewsScreen from '../screens/admin/AdminReviewsScreen';
import AnalyticsScreen from '../screens/admin/AnalyticsScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import CalendarBookingScreen from '../screens/admin/CalendarBookingScreen';
import ActivityLogsScreen from '../screens/admin/ActivityLogsScreen';

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

// Custom Drawer Content
const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, logout } = useAuth();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
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
        <DrawerItemList {...props} />
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

export const AdminNavigator: React.FC = () => {
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
        drawerActiveBackgroundColor: colors.primary[100],
        drawerActiveTintColor: colors.primary[700],
        drawerInactiveTintColor: colors.gray[600],
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
        name="AdminProducts"
        component={AdminProductsScreen}
        options={{
          title: 'Products',
          drawerIcon: ({ color, size }) => (
            <Package size={size} color={color} />
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
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{
          title: 'Users',
          drawerIcon: ({ color, size }) => (
            <Users size={size} color={color} />
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
        name="AdminCalendarBooking"
        component={CalendarBookingScreen}
        options={{
          title: 'Calendar',
          drawerIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AdminAnalytics"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
          drawerIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AdminReports"
        component={ReportsScreen}
        options={{
          title: 'Reports',
          drawerIcon: ({ color, size }) => (
            <ClipboardList size={size} color={color} />
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
  drawerItemsContainer: {
    flex: 1,
    paddingTop: 12,
  },
  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    padding: 16,
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
