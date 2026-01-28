export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';

export interface BookingData {
  date: string;
  time: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  purpose: string;
  location: string;
  product: string;
  additionalInfo?: string;
}

export interface Booking extends BookingData {
  _id: string;
  userId?: string;
  status: BookingStatus;
  conclusion?: string;
  rescheduleReason?: string;
  originalDate?: string;
  originalTime?: string;
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingResponse {
  success: boolean;
  data: Booking;
}

export interface BookingsResponse {
  success: boolean;
  count: number;
  data: Booking[];
}

export interface BookingFilters {
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
}
