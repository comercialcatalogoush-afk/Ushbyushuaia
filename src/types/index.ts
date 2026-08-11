export interface ProductOption {
  id: string;
  key: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  reference: string;
  slug: string;
  suggested_price: number;
  price: number;
  compare_price?: number;
  ribbon?: string;
  fit?: 'Wide Leg' | 'Mom' | 'Cargo' | 'Bermuda' | 'Straight' | string;
  status?: 'draft' | 'published';
  stock_by_size?: Record<string, number>;
  is_best_seller?: boolean;
  description?: string;
  full_description?: string;
  video_url?: string;
  in_stock: boolean;
  hidden?: boolean; // Admin-only: hidden products not shown to regular users
  options: ProductOption[];
  images: string[];
  category_id?: string;
}

export interface PriceHistoryRecord {
  id: string;
  product_id: string;
  product_name: string;
  old_wholesale_price: number;
  new_wholesale_price: number;
  old_suggested_price: number;
  new_suggested_price: number;
  changed_at: string;
  changed_by: string;
}

export interface CartItem {
  product: Product;
  selectedSize?: string;
  selectedColor?: string;
  quantity: number;
}

export interface WholesaleLead {
  doc_type: string;
  doc_number: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  message: string;
}
