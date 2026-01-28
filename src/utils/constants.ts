// API Configuration
export const API_BASE_URL = 'https://accuro-backend.onrender.com/api';
export const SOCKET_URL = 'https://accuro-backend.onrender.com';

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  CART: 'cart',
  THEME: 'theme',
} as const;

// Booking Purposes
export const BOOKING_PURPOSES = [
  'Product Demonstration',
  'Software Training',
  'General Inquiry',
  'Calibration Services',
  'Maintenance Support',
  'Technical Consultation',
] as const;

// Booking Locations
export const BOOKING_LOCATIONS = [
  'Accuro Office',
  'Client Site',
  'Virtual Meeting',
  'Other',
] as const;

// Product Categories
export const PRODUCT_CATEGORIES = [
  'Calibration Software',
  'Field Calibrators',
  'Temperature Calibration',
  'Pressure Generation',
  'Workshop Calibrators',
  'Accessories',
] as const;

// Status Colors
export const STATUS_COLORS = {
  pending: '#EAB308',
  confirmed: '#3B82F6',
  completed: '#22C55E',
  cancelled: '#EF4444',
  rescheduled: '#A855F7',
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;
