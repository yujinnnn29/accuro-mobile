import api from './api';
import {
  Booking,
  BookingData,
  BookingResponse,
  BookingsResponse,
  BookingFilters,
} from '../types';

class BookingService {
  async getAll(params?: BookingFilters): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings', { params });
    return response.data;
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
    const response = await api.post<BookingResponse>('/bookings', data);
    return response.data;
  }

  async update(id: string, data: Partial<Booking>): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/bookings/${id}`);
    return response.data;
  }

  async cancel(id: string, cancellationReason: string): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}/cancel`, {
      cancellationReason,
    });
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
    });
    return response.data;
  }

  async checkAvailability(date: string, time: string): Promise<{ success: boolean; available: boolean }> {
    const response = await api.get<{ success: boolean; available: boolean }>('/bookings/check-availability', {
      params: { date, time },
    });
    return response.data;
  }

  async complete(id: string, conclusion: string): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}`, {
      status: 'completed',
      conclusion,
      isCompleted: true,
    });
    return response.data;
  }
}

export const bookingService = new BookingService();
export default bookingService;
