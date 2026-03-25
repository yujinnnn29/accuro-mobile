import api from './api';

export interface Recommendation {
  productId: string;
  score: number;
  reasons: string[];
}

export interface RecommendationsResponse {
  success: boolean;
  count: number;
  data: Recommendation[];
}

class RecommendationService {
  async getRecommendations(limit: number = 5): Promise<RecommendationsResponse> {
    const response = await api.get<RecommendationsResponse>('/recommendations', {
      params: { limit },
    });
    return response.data;
  }

  async recordInteraction(
    interactionType: 'view' | 'booking' | 'inquiry' | 'purchase',
    productId: string,
    productCategory: string,
    metadata?: any,
  ): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/recommendations/interaction', {
      productId,
      interactionType,
      productCategory,
      metadata,
    });
    return response.data;
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
