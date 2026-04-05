import api from './api';
import {
  Booking,
  BookingData,
  BookingResponse,
  BookingsResponse,
  BookingFilters,
} from '../types';

// Helper to normalize API responses
function normalizeResponse<T>(data: any, defaultData: T): { success: boolean; data: T } {
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data;
  }
  if (Array.isArray(data)) {
    return { success: true, data: data as T };
  }
  return { success: true, data: data ?? defaultData };
}

class BookingService {
  async getAll(params?: BookingFilters): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings', { params });
    return normalizeResponse(response.data, []) as unknown as BookingsResponse;
  }

  async getUpcoming(): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings/upcoming');
    return response.data;
  }

  async getById(id: string): Promise<BookingResponse> {
    const response = await api.get<BookingResponse>(`/bookings/${id}`);
    return response.data;
  }

  async getMyBookings(): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings/my');
    return response.data;
  }

  async create(data: BookingData): Promise<BookingResponse> {
    const response = await api.post<BookingResponse>('/bookings', data, {
      timeout: 120000, // 120s - wait for full response including email sending
    });
    return response.data;
  }

  async update(id: string, data: Partial<Booking>, options?: object): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}`, data, options);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/bookings/${id}`);
    return response.data;
  }

  async cancel(id: string, cancellationReason: string): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}/cancel`, {
      cancellationReason,
    }, { adapter: 'xhr' });
    return response.data;
  }

  async reschedule(
    id: string,
    newDate: string,
    newTime: string,
    rescheduleReason: string
  ): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}/reschedule`, {
      newDate,
      newTime,
      rescheduleReason,
    }, { adapter: 'xhr' });
    return response.data;
  }

  async checkAvailability(date: string, time: string): Promise<{ isAvailable: boolean; slotsRemaining: number }> {
    const response = await api.get<{ success: boolean; data: { isAvailable: boolean; slotsRemaining: number } }>('/bookings/check-availability', {
      params: { date, time },
    });
    return response.data.data;
  }

  async complete(id: string, conclusion: string): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}`, {
      status: 'completed',
      conclusion,
      isCompleted: true,
    });
    return response.data;
  }

  async getMyAssignments(params?: { status?: string }): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings/my-assignments', { params, adapter: 'xhr' });
    return normalizeResponse(response.data, []) as unknown as BookingsResponse;
  }

  async startBooking(id: string): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}/start`, {}, { adapter: 'xhr' });
    return response.data;
  }
}

export const bookingService = new BookingService();
export default bookingService;
