import api from './api';

export interface QuoteItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  estimatedPrice: number;
}

export interface Quote {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string;
  items: QuoteItem[];
  totalEstimatedPrice: number;
  message?: string;
  status: 'pending' | 'sent' | 'accepted' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotesResponse {
  success: boolean;
  count: number;
  data: Quote[];
}

class QuoteService {
  async getMyQuotes(): Promise<QuotesResponse> {
    const response = await api.get<QuotesResponse>('/quotes/my');
    return response.data;
  }
}

export const quoteService = new QuoteService();
export default quoteService;
