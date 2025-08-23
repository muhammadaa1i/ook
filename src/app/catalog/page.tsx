"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import ErrorPage from "@/components/common/ErrorPage";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { Slipper, Category, SearchParams as FilterParams } from "@/types";
import { useCart } from "@/contexts/CartContext";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS, PAGINATION } from "@/lib/constants";
import { performanceMonitor, checkMemoryUsage } from "@/lib/performanceUtils";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight } from "lucide-react";

function CatalogContent() {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Slipper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | undefined>(undefined);
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

  // Add refs for request cancellation, debouncing, and optimization
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestParamsRef = useRef<string>("");
  const categoriesCachedRef = useRef<boolean>(false);
  const isRequestInProgressRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true); // Track if component is mounted

  const fetchCategories = async () => {
    // Only fetch categories once per session
    if (categoriesCachedRef.current || !mountedRef.current) {
      return;
    }

    try {
      performanceMonitor.start("fetchCategories");
      const response = await modernApiClient.get(
        API_ENDPOINTS.CATEGORIES,
        undefined,
        {
          cache: true,
          ttl: 30 * 60 * 1000, // 30 minutes
          timeout: 6000,
        }
      );
      performanceMonitor.end("fetchCategories");

      // modernApiClient returns direct data, not axios-wrapped response
      const categoriesData =
        (response as { data?: Category[] })?.data ||
        (response as Category[]) ||
        [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setHasError(false);
      categoriesCachedRef.current = true; // Mark as cached
    } catch (error: unknown) {
      performanceMonitor.end("fetchCategories");
      console.error("Error fetching categories:", error);
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 503) {
        setHasError(true);
        setErrorMessage("Сервер временно недоступен");
        toast.error("Сервер временно недоступен. Попробуйте позже.");
      } else {
        toast.error("Ошибка загрузки категорий");
      }
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    // Prevent duplicate requests and check if component is mounted
    if (isRequestInProgressRef.current || !mountedRef.current) {
      console.log(
        "Request blocked - already in progress or component unmounted"
      );
      return;
    }

    try {
      // Check if this request is a duplicate
      const currentParams = JSON.stringify(filters);
      if (lastRequestParamsRef.current === currentParams) {
        console.log("Identical request detected, skipping...");
        return;
      }

      isRequestInProgressRef.current = true;
      lastRequestParamsRef.current = currentParams;

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Only show loading spinner for subsequent loads, not initial load
      if (!isInitialLoading && mountedRef.current) {
        setIsLoading(true);
      }

      performanceMonitor.start("fetchProducts");

      const params = {
        ...filters,
        include_images: true,
      };

      const response = await modernApiClient.get(
        API_ENDPOINTS.SLIPPERS,
        params,
        {
          cache: true,
          ttl: 2 * 60 * 1000, // 2 minutes cache for products
          timeout: 8000, // Reduce timeout to 8 seconds
        }
      );

      performanceMonitor.end("fetchProducts");

      // Check memory usage periodically in development
      if (process.env.NODE_ENV === "development") {
        checkMemoryUsage();
      }

      // Check if component is still mounted before updating state
      if (!mountedRef.current) {
        return;
      }

      // modernApiClient returns direct data, not axios-wrapped response
      const data =
        (response as { data?: Slipper[] })?.data || (response as Slipper[]);

      // Handle both response structures: {data: [...]} and {items: [...]}
      const productsData = Array.isArray(data)
        ? data
        : (data as { items?: Slipper[]; data?: Slipper[] })?.items ||
          (data as { items?: Slipper[]; data?: Slipper[] })?.data ||
          [];

      setProducts(
        Array.isArray(productsData) ? (productsData as Slipper[]) : []
      );
      setHasError(false);
      setHasLoaded(true);

      if (mountedRef.current) {
        setIsLoading(false);
        setIsInitialLoading(false);
      }

      const responseData = response as {
        data?: {
          total?: number;
          page?: number;
          pages?: number;
          total_pages?: number;
        };
      };
      setPagination({
        total: responseData.data?.total || 0,
        page:
          responseData.data?.page ||
          Math.floor(
            (filters.skip || 0) / (filters.limit || PAGINATION.DEFAULT_LIMIT)
          ) + 1,
        limit: Number(filters.limit || PAGINATION.DEFAULT_LIMIT),
        totalPages:
          responseData.data?.pages ||
          responseData.data?.total_pages ||
          Math.ceil(
            (responseData.data?.total || 0) /
              (filters.limit || PAGINATION.DEFAULT_LIMIT)
          ),
      });
    } catch (error: unknown) {
      const abortError = error as { name?: string };
      if (abortError.name === "AbortError") {
        console.log("Request was cancelled");
        return;
      }
      console.error("Error fetching products:", error);

      // Handle the new error format from modernApiClient
      const apiError = error as { status?: number; message?: string };

      setErrorStatus(apiError.status);

      if (apiError.status === 503) {
        setHasError(true);
        setErrorMessage("Сервер временно недоступен");
        toast.error(
          "Сервер временно недоступен. Попробуйте обновить страницу через несколько минут."
        );
      } else if (apiError.status === 502) {
        setHasError(true);
        setErrorMessage("Ошибка шлюза сервера");
        toast.error("Ошибка подключения к серверу. Попробуйте позже.");
      } else if (apiError.status && apiError.status >= 500) {
        setHasError(true);
        setErrorMessage("Ошибка сервера");
        toast.error("Ошибка сервера. Попробуйте позже.");
      } else if (apiError.status === 429) {
        setHasError(true);
        setErrorMessage("Слишком много запросов");
        toast.error(
          "Слишком много запросов. Подождите немного и попробуйте снова."
        );
      } else {
        setHasError(true);
        setErrorMessage("Ошибка загрузки товаров");
        toast.error(apiError.message || "Ошибка загрузки товаров");
      }
      setProducts([]);
      setIsLoading(false);
      setIsInitialLoading(false);
    } finally {
      isRequestInProgressRef.current = false;
      abortControllerRef.current = null;
    }
  };

  // Single optimized effect for initial load
  useEffect(() => {
    mountedRef.current = true;

    // Fetch categories and products in parallel for faster loading
    Promise.all([fetchCategories(), fetchProducts()]).catch((error) => {
      console.error("Error in initial load:", error);
    });

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      // Clean up cache if component unmounts
      isRequestInProgressRef.current = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // Initialize filters from URL params (only when searchParams change)
  useEffect(() => {
    const categoryId = searchParams.get("category");
    const search = searchParams.get("search");

    const newCategoryId = categoryId ? Number(categoryId) : undefined;
    const newSearch = search || undefined;

    setFilters((prev) => {
      // Only update if values have actually changed
      if (prev.category_id === newCategoryId && prev.search === newSearch) {
        return prev;
      }

      return {
        ...prev,
        category_id: newCategoryId,
        search: newSearch,
        skip: 0, // Reset pagination when filters change
      };
    });
  }, [searchParams]);

  // Optimized effect for filter changes with proper debouncing
  useEffect(() => {
    // Skip initial render and if component is unmounted
    if (isInitialLoading || !mountedRef.current) return;

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce the fetchProducts call by 300ms (optimized for better performance)
    fetchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        fetchProducts();
      }
    }, 300);

    // Cleanup timeout
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [filters]); // Only trigger when filters actually change

  const handleFiltersChange = (newFilters: FilterParams) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handlePageChange = (page: number) => {
    const skip = (page - 1) * pagination.limit;
    setFilters((prev) => ({ ...prev, skip }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewProduct = (slipper: Slipper) => {
    window.location.href = `/products/${slipper.id}`;
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage("");
    setErrorStatus(undefined);
    setHasLoaded(false);
    setIsInitialLoading(true);

    // Reset caches on retry
    categoriesCachedRef.current = false;
    lastRequestParamsRef.current = "";

    fetchCategories();
    fetchProducts();
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      pagination.page - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(
      pagination.totalPages,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="p-2 rounded-md border border-gray-300 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 rounded-md border border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-700"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-md border ${
              page === pagination.page
                ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                : "border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-700"
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < pagination.totalPages && (
          <>
            {endPage < pagination.totalPages - 1 && (
              <span className="px-2">...</span>
            )}
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              className="px-3 py-2 rounded-md border border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-700"
            >
              {pagination.totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="p-2 rounded-md border border-gray-300 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50">
      <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Каталог товаров
        </h1>
        <p className="text-gray-600">
          Найдите идеальные тапочки из нашей коллекции качественной домашней
          обуви
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Найдено товаров: {pagination.total}
          </p>
          {pagination.total > 0 && (
            <p className="text-sm text-gray-600">
              Страница {pagination.page} из {pagination.totalPages}
            </p>
          )}
        </div>

        {isInitialLoading || isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : hasError ? (
          <ErrorPage
            error={{
              status: errorStatus,
              message: errorMessage,
            }}
            onRetry={handleRetry}
          />
        ) : Array.isArray(products) && products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  slipper={product}
                  onViewDetails={handleViewProduct}
                  onAddToCart={(slipper) => addToCart(slipper, 1)}
                />
              ))}
            </div>
            {renderPagination()}
          </>
        ) : hasLoaded ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m-6 0l-4-4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Товары не найдены
            </h3>
            <p className="text-gray-600">
              Попробуйте изменить параметры поиска или фильтры
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function CatalogLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-6 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <CatalogContent />
    </Suspense>
  );
}
