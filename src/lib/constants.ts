// Base API URL (direct backend). Provide layered fallbacks.
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_DIRECT_URL ||
  "https://oyoqkiyim.duckdns.org"
).replace(/\/$/, "");

export const API_ENDPOINTS = {
  // Auth
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  FORGOT_PASSWORD: "/auth/forgot-password",

  // Users
  USERS: "/users/",
  USER_PROFILE: "/users/me",
  USER_BY_ID: (id: number) => `/users/${id}`,

  // Slippers
  SLIPPERS: "/slippers/",
  // Detail endpoints updated to include trailing slash for frameworks (e.g. Django/FastAPI) that distinguish it
  SLIPPER_BY_ID: (id: number) => `/slippers/${id}/`,
  SLIPPER_UPLOAD_IMAGES: (id: number) => `/slippers/${id}/upload-images/`,
  SLIPPER_IMAGES: (id: number) => `/slippers/${id}/images`,
  SLIPPER_UPDATE_IMAGE: (slipperId: number, imageId: number) => `/slippers/${slipperId}/images/${imageId}`,
  SLIPPER_DELETE_IMAGE: (slipperId: number, imageId: number) =>
    `/slippers/${slipperId}/images/${imageId}`,

  // Orders
  ORDERS: "/orders/",
  ORDER_BY_ID: (id: number) => `/orders/${id}`,

  // Categories
  CATEGORIES: "/categories/",
  CATEGORY_BY_ID: (id: number) => `/categories/${id}`,

  // Payments (OCTO)
  PAYMENT_CREATE: "/payments/octo/create",
  PAYMENT_REFUND: "/payments/octo/refund", 
  PAYMENT_NOTIFY: "/payments/octo/notify",

  // Refund requests
  REFUND_REQUESTS: "/refunds/",
  REFUND_REQUEST_BY_ID: (id: number) => `/refunds/${id}`,
  REFUND_APPROVE: (id: number) => `/refunds/${id}/approve`,
  REFUND_REJECT: (id: number) => `/refunds/${id}/reject`,
} as const;

export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
