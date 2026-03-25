import api from './api';

export interface PurchaseItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseHistory {
  _id: string;
  user: string;
  userName: string;
  userEmail: string;
  orderNumber: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseHistoriesResponse {
  success: boolean;
  count: number;
  data: PurchaseHistory[];
}

class PurchaseHistoryService {
  async getMyPurchases(): Promise<PurchaseHistoriesResponse> {
    const response = await api.get<PurchaseHistoriesResponse>('/purchases/my-purchases');
    return response.data;
  }
}

export const purchaseHistoryService = new PurchaseHistoryService();
export default purchaseHistoryService;
