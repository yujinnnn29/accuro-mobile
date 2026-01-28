import api from './api';
import { Review, ReviewResponse, ReviewsResponse, ReviewFilters } from '../types';

export interface CreateReviewData {
  rating: number;
  comment: string;
  company?: string;
  reviewType?: 'booking' | 'general';
  isPublic?: boolean;
}

class ReviewService {
  async getAllReviews(params?: ReviewFilters): Promise<ReviewsResponse> {
    const response = await api.get<ReviewsResponse>('/reviews', { params });
    return response.data;
  }

  async getPublicReviews(): Promise<ReviewsResponse> {
    const response = await api.get<ReviewsResponse>('/reviews/public');
    return response.data;
  }

  async getApprovedReviews(): Promise<ReviewsResponse> {
    const response = await api.get<ReviewsResponse>('/reviews', {
      params: { isApproved: true, isPublic: true }
    });
    return response.data;
  }

  async getMyReviews(): Promise<ReviewsResponse> {
    const response = await api.get<ReviewsResponse>('/reviews/my');
    return response.data;
  }

  async getReview(id: string): Promise<ReviewResponse> {
    const response = await api.get<ReviewResponse>(`/reviews/${id}`);
    return response.data;
  }

  async createReview(data: CreateReviewData): Promise<ReviewResponse> {
    const response = await api.post<ReviewResponse>('/reviews', data);
    return response.data;
  }

  async updateReview(id: string, data: Partial<CreateReviewData>): Promise<ReviewResponse> {
    const response = await api.put<ReviewResponse>(`/reviews/${id}`, data);
    return response.data;
  }

  async deleteReview(id: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/reviews/${id}`);
    return response.data;
  }

  async approveReview(id: string, isApproved: boolean = true): Promise<ReviewResponse> {
    const response = await api.put<ReviewResponse>(`/reviews/${id}/approve`, { isApproved });
    return response.data;
  }
}

export const reviewService = new ReviewService();
export default reviewService;
