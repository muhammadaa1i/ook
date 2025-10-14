"use client";
import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import ErrorPage from "@/components/common/ErrorPage";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { Slipper, SearchParams as FilterParams } from "@/types";
import { useCart } from "@/contexts/CartContext";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS, PAGINATION } from "@/lib/constants";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n";

interface ApiEnvelope<T> { data?: T; items?: T; total?: number; page?: number; pages?: number; total_pages?: number }
interface Props { initial: unknown | null }

function extractArray(data: unknown): Slipper[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Slipper[];
  const obj = data as ApiEnvelope<Slipper[]>;
  if (Array.isArray(obj.data)) return obj.data as Slipper[];
  if (Array.isArray(obj.items)) return obj.items as Slipper[];
  return [];
}

function CatalogClientInner({ initial }: Props) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const initialProducts = extractArray(initial);
  const [products, setProducts] = useState<Slipper[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(initialProducts.length === 0);
  const [hasLoaded, setHasLoaded] = useState(initialProducts.length > 0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGINATION.DEFAULT_LIMIT as number,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<FilterParams>({
    skip: 0,
    limit: PAGINATION.DEFAULT_LIMIT,
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestParamsRef = useRef<string>("");
  const isRequestInProgressRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  const fetchProducts = useCallback(async () => {
    if (isRequestInProgressRef.current || !mountedRef.current) return;
    try {
      const currentParams = JSON.stringify(filters);
      if (lastRequestParamsRef.current === currentParams) return;
      isRequestInProgressRef.current = true;
      lastRequestParamsRef.current = currentParams;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      if (!isInitialLoading) setIsLoading(true);
      const params = { ...filters, include_images: true };
      const response = await modernApiClient.get(API_ENDPOINTS.SLIPPERS, params, { cache: true, ttl: 120000, timeout: 8000 });
      if (!mountedRef.current) return;
      const arrayData = extractArray(response);
      setProducts(arrayData);
      setHasError(false);
      setHasLoaded(true);
      setIsLoading(false);
      setIsInitialLoading(false);
      const meta = (response as ApiEnvelope<Slipper[]>);
      setPagination({
        total: meta.total || arrayData.length || 0,
        page: meta.page || Math.floor((filters.skip || 0) / (filters.limit || PAGINATION.DEFAULT_LIMIT)) + 1,
        limit: Number(filters.limit || PAGINATION.DEFAULT_LIMIT),
        totalPages: meta.pages || meta.total_pages || Math.max(1, Math.ceil((meta.total || arrayData.length || 0) / (filters.limit || PAGINATION.DEFAULT_LIMIT))),
      });
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "AbortError") return;
      const apiErr = err as { status?: number; message?: string };
      console.error("Error fetching products:", err);
      setErrorStatus(apiErr.status);
      setHasError(true);
      setErrorMessage(apiErr.message || t('errors.productsLoad'));
      toast.error(apiErr.message || t('errors.productsLoad'));
      setProducts([]);
      setIsLoading(false);
      setIsInitialLoading(false);
    } finally {
      isRequestInProgressRef.current = false;
      abortControllerRef.current = null;
    }
  }, [filters, isInitialLoading, t]);

  useEffect(() => {
    mountedRef.current = true;
    if (products.length === 0) fetchProducts();
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      isRequestInProgressRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const categoryId = searchParams.get("category");
    const search = searchParams.get("search");
    setFilters(prev => {
      const newCategory = categoryId ? Number(categoryId) : undefined;
      const newSearch = search || undefined;
      if (prev.category_id === newCategory && prev.search === newSearch) return prev;
      return { ...prev, category_id: newCategory, search: newSearch, skip: 0 };
    });
  }, [searchParams]);

  useEffect(() => {
    if (isInitialLoading || !mountedRef.current) return;
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => { if (mountedRef.current) fetchProducts(); }, 300);
    return () => { if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current); };
  }, [filters, fetchProducts, isInitialLoading]);

  const handlePageChange = (page: number) => {
    const skip = (page - 1) * pagination.limit;
    setFilters(prev => ({ ...prev, skip }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage("");
    setErrorStatus(undefined);
    setHasLoaded(false);
    setIsInitialLoading(true);
    lastRequestParamsRef.current = "";
    fetchProducts();
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="p-2 rounded-md border border-gray-300 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {startPage > 1 && (
          <>
            <button onClick={() => handlePageChange(1)} className="px-3 py-2 rounded-md border border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-700">1</button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        {pages.map(page => (
          <button key={page} onClick={() => handlePageChange(page)} className={`px-3 py-2 rounded-md border ${page === pagination.page ? "bg-blue-500 text-white border-blue-500 shadow-sm" : "border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-700"}`}>{page}</button>
        ))}
        {endPage < pagination.totalPages && (
          <>
            {endPage < pagination.totalPages - 1 && <span className="px-2">...</span>}
            <button onClick={() => handlePageChange(pagination.totalPages)} className="px-3 py-2 rounded-md border border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-700">{pagination.totalPages}</button>
          </>
        )}
        <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="p-2 rounded-md border border-gray-300 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50">
      <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('catalog.title')}</h1>
        <p className="text-gray-600">{t('catalog.subtitle')}</p>
      </div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          {pagination.total > 0 && (<p className="text-sm text-gray-600">{t('catalog.pageStatus', { page: String(pagination.page), totalPages: String(pagination.totalPages) })}</p>)}
        </div>
        {isInitialLoading || isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (<ProductCardSkeleton key={i} />))}
          </div>
        ) : hasError ? (
          <ErrorPage error={{ status: errorStatus, message: errorMessage }} onRetry={handleRetry} />
        ) : Array.isArray(products) && products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  slipper={product} 
                  onAddToCart={addToCart} 
                />
              ))}
            </div>
            {renderPagination()}
          </>
        ) : hasLoaded ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m-6 0l-4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('catalog.notFoundTitle')}</h3>
            <p className="text-gray-600">{t('catalog.notFoundSubtitle')}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CatalogClient(props: { initial: unknown | null }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <CatalogClientInner {...props} />
    </Suspense>
  );
}
