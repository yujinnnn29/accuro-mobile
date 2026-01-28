import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Calendar, ShoppingCart, Bell, Menu } from 'lucide-react-native';
import { useAuth } from '../contexts';
import { colors } from '../theme';
import {
  MainTabParamList,
  HomeStackParamList,
  BookingsStackParamList,
  CartStackParamList,
  MoreStackParamList,
} from './types';

// Import screens
import { HomeScreen, ProductsScreen, ProductDetailScreen, BookingScreen } from '../screens/public';
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

// Admin Navigator
import AdminNavigator from './AdminNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const BookingsStack = createNativeStackNavigator<BookingsStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

// Home Stack Navigator
const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="UserDashboard" component={UserDashboardScreen} />
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Products" component={ProductsScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HomeStack.Screen name="Booking" component={BookingScreen} />
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
    </MoreStack.Navigator>
  );
};

// User Tab Navigator
const UserTabNavigator: React.FC = () => {
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
              return <ShoppingCart size={iconSize} color={color} />;
            case 'NotificationsTab':
              return <Bell size={iconSize} color={color} />;
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
        options={{ tabBarLabel: 'Cart' }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ tabBarLabel: 'Alerts' }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{ tabBarLabel: 'More' }}
      />
    </Tab.Navigator>
  );
};

// Main Navigator - Routes to Admin or User based on role
export const MainNavigator: React.FC = () => {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return <AdminNavigator />;
  }

  return <UserTabNavigator />;
};

export default MainNavigator;
