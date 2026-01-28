export type ReviewType = 'booking' | 'general';

export interface Review {
  _id: string;
  user: string;
  booking?: string;
  userName: string;
  userEmail: string;
  company?: string;
  rating: number;
  comment: string;
  reviewType: ReviewType;
  isApproved: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  success: boolean;
  data: Review;
}

export interface ReviewsResponse {
  success: boolean;
  count: number;
  data: Review[];
}

export interface ReviewFilters {
  isApproved?: boolean;
  rating?: number;
}
