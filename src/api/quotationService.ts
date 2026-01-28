import api from './api';

export interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  specifications?: Record<string, any>;
}

export interface CreateQuotationData {
  items: QuotationItem[];
  notes?: string;
}

export interface Quotation {
  _id: string;
  userId: string;
  quotationNumber: string;
  items: QuotationItem[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  totalAmount?: number;
  validUntil?: string;
  terms?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationResponse {
  success: boolean;
  data: Quotation;
}

export interface QuotationsResponse {
  success: boolean;
  data: Quotation[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface QuotationFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'expired';
  page?: number;
  limit?: number;
}

export const quotationService = {
  // Create a new quotation request
  createQuotation: async (data: CreateQuotationData): Promise<QuotationResponse> => {
    const response = await api.post('/quotations', data);
    return response.data;
  },

  // Get all quotations (admin)
  getAllQuotations: async (filters?: QuotationFilters): Promise<QuotationsResponse> => {
    const response = await api.get('/quotations', { params: filters });
    return response.data;
  },

  // Get user's quotations
  getMyQuotations: async (filters?: QuotationFilters): Promise<QuotationsResponse> => {
    const response = await api.get('/quotations/my', { params: filters });
    return response.data;
  },

  // Get single quotation
  getQuotation: async (id: string): Promise<QuotationResponse> => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },

  // Approve quotation (admin)
  approveQuotation: async (
    id: string,
    data: { totalAmount: number; validUntil: string; terms?: string; adminNotes?: string }
  ): Promise<QuotationResponse> => {
    const response = await api.put(`/quotations/${id}/approve`, data);
    return response.data;
  },

  // Reject quotation (admin)
  rejectQuotation: async (id: string, reason?: string): Promise<QuotationResponse> => {
    const response = await api.put(`/quotations/${id}/reject`, { reason });
    return response.data;
  },

  // Delete quotation
  deleteQuotation: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  },
};

export default quotationService;
