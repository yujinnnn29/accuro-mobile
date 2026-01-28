import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  EmailVerification: { token?: string };
};

// Main Tab Navigator (Bottom Tabs for Users)
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  BookingsTab: NavigatorScreenParams<BookingsStackParamList>;
  CartTab: NavigatorScreenParams<CartStackParamList>;
  NotificationsTab: undefined;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};

// Home Stack (within Home Tab)
export type HomeStackParamList = {
  UserDashboard: undefined;
  Home: undefined;
  Products: undefined;
  ProductDetail: { productId: string };
  Booking: { productId?: string };
};

// Bookings Stack
export type BookingsStackParamList = {
  MyBookings: undefined;
  BookingDetail: { bookingId: string };
};

// Cart Stack
export type CartStackParamList = {
  Cart: undefined;
  QuotationSuccess: { quotationId: string };
};

// More Stack (Profile, Settings, etc.)
export type MoreStackParamList = {
  MoreMenu: undefined;
  Profile: undefined;
  MyQuotations: undefined;
  QuotationDetail: { quotationId: string };
  Testimonials: undefined;
  Contact: undefined;
  About: undefined;
  Settings: undefined;
};

// Admin Navigator
export type AdminDrawerParamList = {
  AdminDashboard: undefined;
  AdminBookings: undefined;
  AdminBookingDetail: { bookingId: string };
  AdminCalendarBooking: undefined;
  AdminProducts: undefined;
  AdminProductForm: { productId?: string };
  AdminQuotations: undefined;
  AdminQuotationDetail: { quotationId: string };
  AdminUsers: undefined;
  AdminUserDetail: { userId: string };
  AdminReviews: undefined;
  AdminAnalytics: undefined;
  AdminReports: undefined;
  AdminActivityLogs: undefined;
  AdminSettings: undefined;
};

// Utility type for navigation prop
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
