export type ProductStatus = 'active' | 'inactive' | 'archived';

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  image?: string;
  beamexUrl?: string;
  features?: string[];
  priceRange?: string;
  priceRangeUSD?: string;
  estimatedPrice?: number;
  estimatedPriceUSD?: number;
  specifications?: Record<string, any>;
  status: ProductStatus;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

export interface ProductsResponse {
  success: boolean;
  count: number;
  data: Product[];
}

export interface ProductFilters {
  category?: string;
  status?: ProductStatus | 'All';
  search?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
