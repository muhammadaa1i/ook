import { API_ENDPOINTS, API_BASE_URL } from "@/lib/constants";

// Single image upload
export async function uploadProductImage(productId: number, file: File, token?: string) {
  const fd = new FormData();
  fd.append("file", file); // backend expected primary field
  const endpoint = API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(productId);
  const url = API_BASE_URL + endpoint.replace(/^(?!\/)/, '/');
  const res = await fetch(url, {
    method: "POST",
    body: fd,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch {}
    throw new Error(detail || `Image upload failed (${res.status})`);
  }
  try { return await res.json(); } catch { return {}; }
}

// Multiple image upload (bulk if supported, fallback sequential)
export async function uploadProductImages(productId: number, files: File[], token?: string) {
  if (!files.length) return [];
  // Try bulk first
  try {
    const bulk = new FormData();
    files.forEach(f => bulk.append("images", f)); // conventional plural field
  const endpoint = API_ENDPOINTS.SLIPPER_UPLOAD_IMAGES(productId);
  const url = API_BASE_URL + endpoint.replace(/^(?!\/)/, '/');
  const res = await fetch(url, { method: "POST", body: bulk, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (res.ok) {
      try { return await res.json(); } catch { return []; }
    }
    // fall through to sequential if bulk failed
  } catch {}
  const results: unknown[] = [];
  for (const file of files) {
    try {
      const r = await uploadProductImage(productId, file, token);
      results.push(r);
    } catch {
      // continue with others
    }
  }
  return results;
}
