// Server component wrapper for Catalog
import { API_BASE_URL, API_ENDPOINTS, PAGINATION } from "@/lib/constants";
import CatalogClient from "./CatalogClient";

export const revalidate = 120; // ISR every 2 minutes

async function getInitialProducts() {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.SLIPPERS}?limit=${PAGINATION.DEFAULT_LIMIT}&include_images=true`;
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function CatalogPage() {
  const initial = await getInitialProducts();
  return <CatalogClient initial={initial} />;
}
