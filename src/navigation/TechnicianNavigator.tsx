import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  LogOut,
  User,
  Home,
  Wrench,
  Moon,
} from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
import { useAuth, useTheme, useNotifications } from '../contexts';
import { colors } from '../theme';
import { TechnicianDrawerParamList } from './types';

import TechnicianDashboardScreen from '../screens/technician/TechnicianDashboardScreen';
import TechnicianAssignmentsScreen from '../screens/technician/TechnicianAssignmentsScreen';
import { NotificationsScreen } from '../screens/user/NotificationsScreen';

const Drawer = createDrawerNavigator<TechnicianDrawerParamList>();

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, theme } = useTheme();
  const { navigation } = props;
  const insets = useSafeAreaInsets();

  const handleBackToWebsite = () => {
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

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.name || 'Technician';

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[styles.drawerContainer, { backgroundColor: theme.background }]}
    >
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <User size={32} color={colors.white} />
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Technician</Text>
          {user?.technicianNumber && (
            <Text style={styles.techNumber}> #{user.technicianNumber}</Text>
          )}
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

      {/* Info Row */}
      <View style={[styles.infoRow, { backgroundColor: isDark ? theme.surface : colors.primary[50], borderColor: isDark ? theme.border : colors.primary[100] }]}>
        <View style={[styles.infoRowIcon, { backgroundColor: isDark ? theme.border : colors.primary[100] }]}>
          <Wrench size={14} color={colors.primary[600]} />
        </View>
        <Text style={[styles.infoRowText, { color: isDark ? colors.primary[300] : colors.primary[700] }]}>Accuro Technician Panel</Text>
        <Text style={[styles.infoRowVersion, { color: isDark ? colors.primary[400] : colors.primary[500] }]}>v1.0</Text>
      </View>

      {/* Spacer to push bottom section down */}
      <View style={{ flex: 1 }} />

      {/* Back to Website + Logout */}
      <View style={[styles.backSection, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? theme.border : colors.primary[50] }]}
          onPress={handleBackToWebsite}
        >
          <Home size={20} color={colors.primary[600]} />
          <Text style={styles.backText}>Back to Website</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

export const TechnicianNavigator: React.FC = () => {
  const { isDark, theme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#001F3F' },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        drawerStyle: { backgroundColor: theme.background },
        drawerActiveBackgroundColor: isDark ? colors.primary[900] : colors.primary[100],
        drawerActiveTintColor: isDark ? colors.primary[200] : colors.primary[700],
        drawerInactiveTintColor: theme.textSecondary,
        drawerLabelStyle: { fontSize: 15, fontWeight: '500', marginLeft: -10 },
        drawerItemStyle: { borderRadius: 8, marginHorizontal: 8, marginVertical: 2 },
      }}
    >
      <Drawer.Screen
        name="TechnicianDashboard"
        component={TechnicianDashboardScreen}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="TechnicianAssignments"
        component={TechnicianAssignmentsScreen}
        options={{
          title: 'My Assignments',
          drawerIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="TechnicianNotifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <View>
              <Bell size={size} color={color} />
              {unreadCount > 0 && (
                <View style={notifBadgeStyle}>
                  <Text style={notifBadgeTextStyle}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const notifBadgeStyle: any = {
  position: 'absolute', top: -4, right: -8,
  backgroundColor: colors.error, borderRadius: 7,
  minWidth: 14, height: 14,
  alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
};
const notifBadgeTextStyle: any = { color: '#fff', fontSize: 8, fontWeight: 'bold' };

const styles = StyleSheet.create({
  drawerContainer: { flexGrow: 1 },
  profileSection: {
    padding: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary[700],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.white,
    marginBottom: 12,
  },
  userName: { fontSize: 18, fontWeight: '600', color: colors.white, marginBottom: 4 },
  userEmail: { fontSize: 13, color: colors.primary[200], marginBottom: 12 },
  roleBadge: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: colors.primary[600] },
  techNumber: { fontSize: 12, fontWeight: '600', color: colors.primary[400] },
  menuLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    marginLeft: 20, marginTop: 16, marginBottom: 4,
  },
  drawerItemsContainer: { paddingTop: 4 },
  darkModeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, gap: 10,
  },
  darkModeLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  darkModeSwitch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, gap: 8,
  },
  infoRowIcon: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  infoRowText: { flex: 1, fontSize: 12, fontWeight: '600' },
  infoRowVersion: { fontSize: 11, fontWeight: '500' },
  backSection: {
    borderTopWidth: 1, padding: 16,
  },
  backButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 8,
  },
  backText: { marginLeft: 12, fontSize: 15, fontWeight: '500', color: colors.primary[600] },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16,
    marginTop: 8, borderTopWidth: 1, borderTopColor: colors.gray[100],
  },
  logoutText: { marginLeft: 12, fontSize: 15, fontWeight: '500', color: colors.error },
});

export default TechnicianNavigator;
