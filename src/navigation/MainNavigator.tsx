import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { Home, Calendar, ClipboardList, Bell, Menu } from 'lucide-react-native';
import { colors } from '../theme';
import { useNotifications } from '../contexts';
import {
  MainTabParamList,
  HomeStackParamList,
  BookingsStackParamList,
  CartStackParamList,
  MoreStackParamList,
  RootMainParamList,
} from './types';

// Import screens
import { HomeScreen, ProductsScreen, ProductDetailScreen, BookingScreen, RequestQuoteScreen } from '../screens/public';
import UserDashboardScreen from '../screens/user/UserDashboardScreen';
import MyBookingsScreen from '../screens/user/MyBookingsScreen';
import BookingDetailScreen from '../screens/user/BookingDetailScreen';
import CartScreen from '../screens/user/CartScreen';
import NotificationsScreen from '../screens/user/NotificationsScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import MyQuotationsScreen from '../screens/user/MyQuotationsScreen';
import QuotationDetailScreen from '../screens/user/QuotationDetailScreen';
import TestimonialsScreen from '../screens/user/TestimonialsScreen';
import ContactScreen from '../screens/user/ContactScreen';
import AboutScreen from '../screens/user/AboutScreen';
import MoreMenuScreen from '../screens/user/MoreMenuScreen';
import AccountHistoryScreen from '../screens/user/AccountHistoryScreen';

// Admin Navigator
import AdminNavigator from './AdminNavigator';

const RootStack = createNativeStackNavigator<RootMainParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const BookingsStack = createNativeStackNavigator<BookingsStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

// Home Stack Navigator
const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="UserDashboard" component={UserDashboardScreen} />
      <HomeStack.Screen name="Products" component={ProductsScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HomeStack.Screen name="Booking" component={BookingScreen} />
      <HomeStack.Screen name="RequestQuote" component={RequestQuoteScreen} />
    </HomeStack.Navigator>
  );
};

// Bookings Stack Navigator
const BookingsStackNavigator: React.FC = () => {
  return (
    <BookingsStack.Navigator screenOptions={{ headerShown: false }}>
      <BookingsStack.Screen name="MyBookings" component={MyBookingsScreen} />
      <BookingsStack.Screen name="BookingDetail" component={BookingDetailScreen} />
    </BookingsStack.Navigator>
  );
};

// Cart Stack Navigator
const CartStackNavigator: React.FC = () => {
  return (
    <CartStack.Navigator screenOptions={{ headerShown: false }}>
      <CartStack.Screen name="Cart" component={CartScreen} />
    </CartStack.Navigator>
  );
};

// More Stack Navigator
const MoreStackNavigator: React.FC = () => {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} />
      <MoreStack.Screen name="MyQuotations" component={MyQuotationsScreen} />
      <MoreStack.Screen name="QuotationDetail" component={QuotationDetailScreen} />
      <MoreStack.Screen name="Testimonials" component={TestimonialsScreen} />
      <MoreStack.Screen name="Contact" component={ContactScreen} />
      <MoreStack.Screen name="About" component={AboutScreen} />
      <MoreStack.Screen name="AccountHistory" component={AccountHistoryScreen} />
      <MoreStack.Screen name="RequestQuote" component={RequestQuoteScreen} />
    </MoreStack.Navigator>
  );
};

// User Tab Navigator
const UserTabNavigator: React.FC = () => {
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = size || 24;
          switch (route.name) {
            case 'HomeTab':
              return <Home size={iconSize} color={color} />;
            case 'BookingsTab':
              return <Calendar size={iconSize} color={color} />;
            case 'CartTab':
              return <ClipboardList size={iconSize} color={color} />;
            case 'NotificationsTab':
              return (
                <View>
                  <Bell size={iconSize} color={color} />
                  {unreadCount > 0 && (
                    <View style={tabStyles.badge}>
                      <Text style={tabStyles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              );
            case 'MoreTab':
              return <Menu size={iconSize} color={color} />;
            default:
              return <Home size={iconSize} color={color} />;
          }
        },
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[200],
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsStackNavigator}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStackNavigator}
        options={{ tabBarLabel: 'Quotes' }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ tabBarLabel: 'Notifications' }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{ tabBarLabel: 'More' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.navigate({ name: 'MoreTab', params: { screen: 'MoreMenu' } })
            );
          },
        })}
      />
    </Tab.Navigator>
  );
};

// Main Navigator - Always shows User interface first, Admin can access admin panel via menu
export const MainNavigator: React.FC = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="UserTabs" component={UserTabNavigator} />
      <RootStack.Screen
        name="AdminPanel"
        component={AdminNavigator}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </RootStack.Navigator>
  );
};

const tabStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default MainNavigator;
