export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/proxy";

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
  SLIPPER_BY_ID: (id: number) => `/slippers/${id}`,
  SLIPPER_UPLOAD_IMAGE: (id: number) => `/slippers/${id}/upload-image`,
  SLIPPER_UPLOAD_IMAGES: (id: number) => `/slippers/${id}/upload-images`,
  SLIPPER_IMAGES: (id: number) => `/slippers/${id}/images`,
  SLIPPER_DELETE_IMAGE: (slipperId: number, imageId: number) =>
    `/slippers/${slipperId}/images/${imageId}`,

  // Orders
  ORDERS: "/orders/",
  ORDER_BY_ID: (id: number) => `/orders/${id}`,

  // Categories
  CATEGORIES: "/categories/",
  CATEGORY_BY_ID: (id: number) => `/categories/${id}`,
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
