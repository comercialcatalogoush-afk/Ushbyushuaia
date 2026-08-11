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
  price: number;
  compare_price?: number;
  ribbon?: string;
  description?: string;
  full_description?: string;
  video_url?: string;
  in_stock: boolean;
  options: ProductOption[];
  images: string[];
  category_id?: string;
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
