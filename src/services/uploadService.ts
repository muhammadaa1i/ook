import { API_ENDPOINTS, API_BASE_URL } from "@/lib/constants";

// Multiple image upload only (single image path removed)
export async function uploadProductImages(productId: number, files: File[], token?: string) {
  if (!files.length) return [];
  try {
    const bulk = new FormData();
    files.forEach(f => bulk.append("images", f));
    const endpoint = API_ENDPOINTS.SLIPPER_UPLOAD_IMAGES(productId);
    const url = API_BASE_URL + endpoint.replace(/^(?!\/)/, '/');
    const res = await fetch(url, { method: "POST", body: bulk, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (res.ok) {
      try { return await res.json(); } catch { return []; }
    }
  } catch (e) {
    console.warn('Bulk image upload failed', e);
  }
  return [];
}
