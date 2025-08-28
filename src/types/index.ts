export interface User {
  id?: number;
  name: string;
  surname: string;
  phone_number: string;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  name: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  phone_number: string;
  password: string;
  confirm_password: string;
  is_admin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlipperImage {
  id: number;
  image_path: string;
  alt_text?: string;
  is_primary: boolean;
  created_at: string;
}

export interface Slipper {
  id: number;
  name: string;
  size: string;
  price: number;
  quantity: number;
  category_id: number;
  category?: Category;
  category_name?: string;
  image?: string; // Single image URL from API
  images?: SlipperImage[]; // Array format (for compatibility)
  is_available?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id?: number;
  slipper_id: number;
  slipper?: Slipper;
  quantity: number;
  unit_price: number;
  total_price?: number;
  notes?: string;
  order_id?: number;
  created_at?: string;
}

export interface Order {
  id: number;
  user_id: number;
  user?: User;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  user_id?: number;
  items: {
    slipper_id: number;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: Order["status"];
  total_amount?: number;
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiError {
  detail: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}

export interface SearchParams {
  skip?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  is_admin?: boolean;
  status?: string;
}
