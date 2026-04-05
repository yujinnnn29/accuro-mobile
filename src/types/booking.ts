export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'pending_review';

export interface AssignedTechnician {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  technicianNumber?: number;
  specialization?: string;
}

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
  assignedTechnician?: AssignedTechnician | string;
  assignedAt?: string;
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
