import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { Slipper } from "@/types";

export interface ProductListParams { skip?: number; limit?: number; include_images?: boolean; search?: string; category_id?: number }

interface ApiEnvelope<T> { data?: T; items?: T; total?: number; page?: number; pages?: number; total_pages?: number }

function unwrapArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  const env = value as ApiEnvelope<T[]> | undefined;
  if (Array.isArray(env?.data)) return env!.data as T[];
  if (Array.isArray(env?.items)) return env!.items as T[];
  return [];
}

export async function fetchProducts(params: ProductListParams = {}): Promise<Slipper[]> {
  const res = await modernApiClient.get(API_ENDPOINTS.SLIPPERS, params as Record<string, unknown>, { cache: true });
  const raw = (res as ApiEnvelope<Slipper[]> | Slipper[]);
  return unwrapArray<Slipper>(raw);
}

export async function fetchProduct(id: number): Promise<Slipper | null> {
  try {
    const res = await modernApiClient.get(API_ENDPOINTS.SLIPPER_BY_ID(id), undefined, { cache: true });
    const env = res as ApiEnvelope<Slipper> | Slipper;
    if ((env as ApiEnvelope<Slipper>).data) return (env as ApiEnvelope<Slipper>).data as Slipper;
    return (env as Slipper) || null;
  } catch {
    return null;
  }
}

export async function createProduct(payload: Partial<Slipper>): Promise<Slipper> {
  const created = await modernApiClient.post(API_ENDPOINTS.SLIPPERS, payload);
  const env = created as ApiEnvelope<Slipper> | Slipper;
  return (env as ApiEnvelope<Slipper>).data || (env as Slipper);
}

export async function updateProduct(id: number, payload: Partial<Slipper>): Promise<void> {
  await modernApiClient.put(API_ENDPOINTS.SLIPPER_BY_ID(id), payload);
}

export async function deleteProduct(id: number): Promise<void> {
  await modernApiClient.delete(API_ENDPOINTS.SLIPPER_BY_ID(id));
}

export function clearProductCaches() {
  modernApiClient.clearCache("/slippers");
  modernApiClient.clearCache("/slipper");
}
