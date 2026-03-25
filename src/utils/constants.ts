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

// Booking Purposes (matches website)
export const BOOKING_PURPOSES = [
  'Product Demonstration',
  'Technical Consultation',
  'Calibration Services',
  'Software Training',
  'Maintenance Support',
  'General Inquiry',
  'Other',
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

// Product/Service of Interest for Quotations (matches website)
export const QUOTATION_SERVICES = [
  'Beamex Calibrators',
  'Beamex Calibration Benches',
  'Beamex Calibration Software',
  'Beamex Calibration Accessories',
  'Beamex Pressure Measurement',
  'Beamex Temperature Measurement',
  'Beamex Electrical Measurement',
  'Beamex Integrated Solutions',
  'Not sure / Need recommendation',
] as const;

// Status Colors
export const STATUS_COLORS = {
  pending: '#EAB308',
  confirmed: '#3B82F6',
  completed: '#22C55E',
  cancelled: '#EF4444',
  rescheduled: '#A855F7',
  pending_review: '#0891B2',
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;
