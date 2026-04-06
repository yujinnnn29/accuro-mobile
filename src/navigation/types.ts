import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<RootMainParamList>;
};

// Root Main Stack (contains User Tabs, Technician Panel and Admin Panel)
export type RootMainParamList = {
  UserTabs: NavigatorScreenParams<MainTabParamList>;
  TechnicianPanel: NavigatorScreenParams<TechnicianStackParamList>;
  AdminPanel: undefined;
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
  RequestQuote: { fromCart?: boolean } | undefined;
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
  UserDashboard: undefined;
  Profile: undefined;
  MyQuotations: undefined;
  QuotationDetail: { quotationId: string; quotation?: any };
  Testimonials: undefined;
  Contact: undefined;
  About: undefined;
  Settings: undefined;
  AccountHistory: undefined;
  RequestQuote: { fromCart?: boolean } | undefined;
};

// Technician Tab Navigator
export type TechnicianTabParamList = {
  TechnicianDashboardTab: undefined;
  TechnicianAssignmentsTab: { submitBookingId?: string } | undefined;
  TechnicianProfileTab: undefined;
};

// Technician Stack (kept for type compat with RootMainParamList)
export type TechnicianStackParamList = {
  TechnicianDashboard: undefined;
  TechnicianAssignments: { submitBookingId?: string } | undefined;
  TechnicianProfile: undefined;
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
  AdminRecommendations: undefined;
  AdminNotifications: undefined;
};

// Utility type for navigation prop
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
