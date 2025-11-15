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
  image?: string; // Legacy single image URL (fallback)
  images?: SlipperImage[]; // Full image gallery array
  image_gallery?: SlipperImage[]; // Alternative name for images array
  primary_image?: string; // Direct URL to primary image (preferred for previews)
  is_available?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id?: number;
  slipper_id: number;
  slipper?: Slipper;
  name?: string;
  size?: string;
  image: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  notes?: string;
  order_id?: number;
  created_at?: string;
}

export interface Order {
  id: number;
  order_id?: string;
  user_id: number;
  user_name?: string;
  user?: User;
  status: "CREATED" | "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED" | "confirmed" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  notes?: string;
  order_number?: string;
  payment_method?: string;
  shipping_address?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  // Payment-related fields that might be present
  payment_uuid?: string;
  paymentUuid?: string;
  octo_payment_UUID?: string;
  payment_id?: string;
  paymentId?: string;
  transaction_id?: string;
  transactionId?: string;
  transaction_uuid?: string;
  transactionUuid?: string;
  reference_id?: string;
  referenceId?: string;
  external_id?: string;
  externalId?: string;
  payment?: Record<string, unknown>; // Nested payment object
}

export interface CreateOrderRequest {
  user_id?: number;
  items: {
    slipper_id: number;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
  total_amount?: number;
  notes?: string;
  payment_method?: string;
  status?: Order["status"];
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

export interface RefundRequest {
  id?: number;
  order_id: number;
  user_id: number;
  amount: number;
  payment_uuid: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
  order?: Order;
  user?: User;
}

export interface CreateRefundRequest {
  order_id: number;
  amount: number;
  payment_uuid: string;
  reason?: string;
}
