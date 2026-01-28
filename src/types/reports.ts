// Report Types for Admin Reports

export type ReportType =
  | 'bookings'
  | 'users'
  | 'quotes'
  | 'contacts'
  | 'activity'
  | 'products'
  | 'reviews';

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last14days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ReportFilters {
  dateRange: DateRange;
  status?: string;
  category?: string;
  role?: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface ReportData {
  columns: ReportColumn[];
  rows: Record<string, any>[];
  summary?: {
    totalRecords: number;
    additionalMetrics?: Record<string, number | string>;
  };
}

export interface Report {
  _id: string;
  type: ReportType;
  title: string;
  dateRange: DateRange;
  filters: ReportFilters;
  data: ReportData;
  generatedAt: string;
  generatedBy: string;
}

// API Response Types
export interface GenerateReportRequest {
  type: ReportType;
  dateRange: DateRange;
  filters?: Partial<ReportFilters>;
}

export interface ReportResponse {
  success: boolean;
  data: Report;
}

export interface ReportListResponse {
  success: boolean;
  data: Report[];
}

// Report type configurations
export interface ReportTypeConfig {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
  defaultColumns: ReportColumn[];
}

export const REPORT_TYPE_CONFIGS: ReportTypeConfig[] = [
  {
    type: 'bookings',
    label: 'Bookings Report',
    description: 'All booking records with status and details',
    icon: 'calendar',
    defaultColumns: [
      { key: 'date', label: 'Date', width: 100 },
      { key: 'company', label: 'Company', width: 150 },
      { key: 'product', label: 'Product', width: 120 },
      { key: 'status', label: 'Status', width: 80 },
    ],
  },
  {
    type: 'users',
    label: 'Users Report',
    description: 'User registration and activity data',
    icon: 'users',
    defaultColumns: [
      { key: 'name', label: 'Name', width: 120 },
      { key: 'email', label: 'Email', width: 150 },
      { key: 'role', label: 'Role', width: 80 },
      { key: 'createdAt', label: 'Joined', width: 100 },
    ],
  },
  {
    type: 'quotes',
    label: 'Quotations Report',
    description: 'Quote requests and approval status',
    icon: 'file-text',
    defaultColumns: [
      { key: 'createdAt', label: 'Date', width: 100 },
      { key: 'company', label: 'Company', width: 150 },
      { key: 'totalAmount', label: 'Amount', width: 100, align: 'right' },
      { key: 'status', label: 'Status', width: 80 },
    ],
  },
  {
    type: 'contacts',
    label: 'Contacts Report',
    description: 'Contact form submissions',
    icon: 'mail',
    defaultColumns: [
      { key: 'createdAt', label: 'Date', width: 100 },
      { key: 'name', label: 'Name', width: 120 },
      { key: 'email', label: 'Email', width: 150 },
      { key: 'subject', label: 'Subject', width: 150 },
    ],
  },
  {
    type: 'activity',
    label: 'Activity Logs',
    description: 'System activity and audit logs',
    icon: 'activity',
    defaultColumns: [
      { key: 'timestamp', label: 'Time', width: 120 },
      { key: 'action', label: 'Action', width: 100 },
      { key: 'user', label: 'User', width: 120 },
      { key: 'description', label: 'Description', width: 200 },
    ],
  },
  {
    type: 'products',
    label: 'Products Report',
    description: 'Product inventory and status',
    icon: 'package',
    defaultColumns: [
      { key: 'name', label: 'Product', width: 150 },
      { key: 'category', label: 'Category', width: 100 },
      { key: 'stockQuantity', label: 'Stock', width: 80, align: 'right' },
      { key: 'status', label: 'Status', width: 80 },
    ],
  },
  {
    type: 'reviews',
    label: 'Reviews Report',
    description: 'Customer reviews and ratings',
    icon: 'star',
    defaultColumns: [
      { key: 'createdAt', label: 'Date', width: 100 },
      { key: 'userName', label: 'User', width: 120 },
      { key: 'productName', label: 'Product', width: 150 },
      { key: 'rating', label: 'Rating', width: 80, align: 'center' },
    ],
  },
];

// Date range preset configurations
export const DATE_RANGE_PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7days', label: 'Last 7 Days' },
  { key: 'last14days', label: 'Last 14 Days' },
  { key: 'last30days', label: 'Last 30 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'thisQuarter', label: 'This Quarter' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'custom', label: 'Custom Range' },
];
