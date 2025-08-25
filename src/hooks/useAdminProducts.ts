import { useState, useRef, useEffect, useCallback } from 'react';
import { Slipper, SearchParams } from '@/types';
import modernApiClient from '@/lib/modernApiClient';
import { API_ENDPOINTS, PAGINATION } from '@/lib/constants';

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseAdminProductsOptions {
  initialFilters?: SearchParams;
  includeImages?: boolean;
  debounceMs?: number;
}

interface UseAdminProductsReturn {
  products: Slipper[];
  isLoading: boolean;
  error: Error | null;
  pagination: PaginationState;
  filters: SearchParams;
  setPage: (page: number) => void;
  setFilters: (updater: (prev: SearchParams) => SearchParams) => void;
  refresh: (force?: boolean) => Promise<void>;
  mutateProducts: (updater: (prev: Slipper[]) => Slipper[]) => void;
}

// Lightweight in-hook memory cache (request-level) to avoid refetch storms in rapid succession
const inMemoryCache = new Map<string, { ts: number; data: Slipper[]; meta: { total?: number; pages?: number; total_pages?: number } }>();

export function useAdminProducts(options: UseAdminProductsOptions = {}): UseAdminProductsReturn {
  const { initialFilters = { skip: 0, limit: PAGINATION.DEFAULT_LIMIT }, includeImages = true, debounceMs = 120 } = options;
  const [products, setProducts] = useState<Slipper[]>([]);
  const [filters, setFiltersState] = useState<SearchParams>(initialFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ total: 0, page: 1, limit: Number(initialFilters.limit) || PAGINATION.DEFAULT_LIMIT, totalPages: 1 });
  const mountedRef = useRef(true);
  const lastFetchKeyRef = useRef<string>('');
  const debounceTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => () => { // unmount cleanup
    mountedRef.current = false;
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
  }, []);

  const buildKey = useCallback((f: SearchParams) => JSON.stringify({ f, includeImages }), [includeImages]);

  const fetchInternal = useCallback(async (force = false) => {
    const key = buildKey(filters);
    if (!force && key === lastFetchKeyRef.current && !products.length) {
      // initial duplicate guard
      return;
    }
    // Cache hit (fresh within TTL 5s) to avoid burst refetch (esp. pagination spamming)
    const cached = inMemoryCache.get(key);
    if (!force && cached && Date.now() - cached.ts < 5000) {
      setProducts(cached.data);
      const total = cached.meta.total || 0;
      setPagination(prev => ({ ...prev, total, totalPages: cached.meta.pages || cached.meta.total_pages || Math.ceil(total / prev.limit) }));
      lastFetchKeyRef.current = key;
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = { ...filters, include_images: includeImages };
      const response = await modernApiClient.get(API_ENDPOINTS.SLIPPERS, params, { cache: !force, force });
      const data = (response as { data?: Slipper[] })?.data || (response as Slipper[]);
      const productsData = Array.isArray(data) ? data : (data as { items?: Slipper[]; data?: Slipper[] }).items || (data as { items?: Slipper[]; data?: Slipper[] }).data || [];
      const list: Slipper[] = Array.isArray(productsData) ? productsData as Slipper[] : [];
      if (!mountedRef.current) return;
      setProducts(list);
      const responseData = response as { data?: { total?: number; pages?: number; total_pages?: number } };
      const total = responseData.data?.total || list.length;
      setPagination(prev => ({ ...prev, total, totalPages: responseData.data?.pages || responseData.data?.total_pages || Math.ceil(total / prev.limit) }));
      lastFetchKeyRef.current = key;
      inMemoryCache.set(key, { ts: Date.now(), data: list, meta: responseData.data || {} });
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e as Error);
      setProducts([]);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [filters, includeImages, products.length, buildKey]);

  const scheduleFetch = useCallback((force = false) => {
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      // Make sure we don't stack parallel fetches
      if (!inFlightRef.current) {
        const p = fetchInternal(force).finally(() => { inFlightRef.current = null; });
        inFlightRef.current = p;
      }
    }, debounceMs);
  }, [fetchInternal, debounceMs]);

  // Kick initial load & react to filter changes
  useEffect(() => {
    scheduleFetch();
  }, [filters, scheduleFetch]);

  const setPage = useCallback((page: number) => {
    setFiltersState(prev => {
      const limit = prev.limit || PAGINATION.DEFAULT_LIMIT;
      return { ...prev, skip: (page - 1) * limit };
    });
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const refresh = useCallback(async (force = true) => {
    await fetchInternal(force);
  }, [fetchInternal]);

  const mutateProducts = useCallback((updater: (prev: Slipper[]) => Slipper[]) => {
    setProducts(prev => {
      const next = updater(prev);
      // Update cache entry for current key to keep consistency
      const key = lastFetchKeyRef.current;
      if (key) {
        const cached = inMemoryCache.get(key);
        if (cached) inMemoryCache.set(key, { ...cached, data: next });
      }
      return next;
    });
  }, []);

  return {
    products,
    isLoading,
    error,
    pagination,
    filters,
    setPage,
    setFilters: (updater) => setFiltersState(prev => updater(prev)),
    refresh,
    mutateProducts,
  };
}

export default useAdminProducts;
