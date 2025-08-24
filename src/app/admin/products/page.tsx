"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Slipper, SearchParams } from "@/types";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS, PAGINATION } from "@/lib/constants";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Edit, Trash2, Plus, Package, X, ImagePlus, Images } from "lucide-react";
import { formatPrice, getFullImageUrl } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Slipper[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGINATION.DEFAULT_LIMIT as number,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<SearchParams>({
    skip: 0,
    limit: PAGINATION.DEFAULT_LIMIT,
  });
  // Used to trigger manual refetches bypassing cache
  const [refreshVersion, setRefreshVersion] = useState(0);
  // Search removed
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Slipper | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    price: "",
    quantity: "",
    is_available: true,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current:number;total:number}|null>(null);
  const [singleImageFile, setSingleImageFile] = useState<File | null>(null);
  const [multiImageFiles, setMultiImageFiles] = useState<FileList | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Track current image index for mini carousel per product id
  const [imageIndexMap, setImageIndexMap] = useState<Record<number, number>>({});
  const confirm = useConfirm();
  const router = useRouter();

  // Lock body scroll when modal open
  useEffect(() => {
    if (showModal) {
      const original = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = original;
      };
    }
  }, [showModal]);

  // Debounced search removed

  const fetchProducts = useCallback(async (force = false) => {
    try {
      setIsLoading(true);
      const params = {
        ...filters,
        include_images: true,
      };

      const response = await modernApiClient.get(
        API_ENDPOINTS.SLIPPERS,
        params,
        { cache: false } // always fetch fresh to avoid stale rows after mutations
      );

      // modernApiClient returns direct data, not axios-wrapped response
      const data = response.data || response;

      // Handle both response structures: {data: [...]} and {items: [...]}
      const productsData = data.items || data.data || data || [];

      let list = Array.isArray(productsData) ? productsData : [];
      // Filter out any items pending deletion to keep UI consistent even if backend hasn't finished yet
      if (pendingDeletions.size) {
        list = list.filter((p: any) => !pendingDeletions.has(p.id));
        // Clean up pending deletions that no longer exist in backend response
        const stillPending = new Set<number>();
        pendingDeletions.forEach((id) => {
          if (list.find((p: any) => p.id === id)) stillPending.add(id);
        });
        if (stillPending.size !== pendingDeletions.size) {
          setPendingDeletions(stillPending);
        }
      }
      setProducts(list as Slipper[]);
      setPagination({
        total: data.total || 0,
        page:
          Math.floor(
            (filters.skip || 0) / (filters.limit || PAGINATION.DEFAULT_LIMIT)
          ) + 1,
        limit: Number(filters.limit || PAGINATION.DEFAULT_LIMIT),
        totalPages:
          data.pages ||
          data.total_pages ||
          Math.ceil(
            (data.total || 0) / (filters.limit || PAGINATION.DEFAULT_LIMIT)
          ),
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Ошибка загрузки товаров");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, refreshVersion, pendingDeletions]);


  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

    // Category fetching removed

  // Search effect removed

  const handlePageChange = useCallback(
    (page: number) => {
      const skip = (page - 1) * pagination.limit;
      setFilters((prev) => ({ ...prev, skip }));
    },
    [pagination.limit]
  );

  const handleDeleteProduct = useCallback(async (productId: number) => {
    const ok = await confirm({
      title: "Удалить товар",
      message: (
        <div>
          Вы уверены, что хотите удалить этот товар? <br /> Это действие
          нельзя отменить.
        </div>
      ),
      confirmText: "Удалить",
      cancelText: "Отмена",
      variant: "danger",
    });
    if (!ok) return;
    try {
      setDeletingId(productId);
      // Capture current count for page adjustment logic
      const currentCount = products.length;
      try {
        await modernApiClient.delete(API_ENDPOINTS.SLIPPER_BY_ID(productId));
      } catch (err: any) {
        // Fallback: if constant change not yet deployed or backend expects opposite trailing slash variant
        if (err?.status === 404) {
          const altEndpoint = API_ENDPOINTS.SLIPPER_BY_ID(productId).replace(/\/$/, "");
          await modernApiClient.delete(altEndpoint); // retry without slash
        } else {
          throw err;
        }
      }
      toast.success("Товар успешно удален");
  // Optimistically remove from UI
  setPendingDeletions((prev) => new Set(prev).add(productId));
  setProducts((prev) => prev.filter((p) => p.id !== productId));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      // Adjust page if last item removed
      if (currentCount === 1 && pagination.page > 1) {
        handlePageChange(pagination.page - 1);
      }
      // Clear cache and trigger background refresh
      modernApiClient.clearCache("/slippers");
      // Delay background refresh slightly to allow backend to finalize deletion
      setTimeout(() => setRefreshVersion((v) => v + 1), 400);
    } catch (error) {
      console.error("Error deleting product:", error);
    const status = (error as any)?.status;
    if (status === 404) {
        toast.warn("Товар уже был удален");
        // Remove optimistically if still present
        setPendingDeletions((prev) => new Set(prev).add(productId));
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        modernApiClient.clearCache("/slippers");
        setTimeout(() => setRefreshVersion((v) => v + 1), 400);
      } else {
        toast.error("Ошибка удаления товара");
        // If error other than 404, rollback optimistic removal
        setProducts((prev) => {
          // If product already removed, we can't restore its full data unless cached earlier; skip rollback
          return prev;
        });
        setPendingDeletions((prev) => {
          const clone = new Set(prev);
          clone.delete(productId);
          return clone;
        });
      }
    }
    finally {
      setDeletingId(null);
    }
  }, [confirm, pagination.page, handlePageChange, products]);

  const resetForm = () => {
    setFormData({
      name: "",
      size: "",
      price: "",
      quantity: "",
      is_available: true,
    });
    setEditingProduct(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: Slipper) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      size: product.size || "",
      price: String(product.price ?? ""),
      quantity: String(product.quantity ?? ""),
      is_available: product.is_available !== false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        name: formData.name.trim(),
        size: formData.size.trim(),
        price: Number(formData.price) || 0,
        quantity: Number(formData.quantity) || 0,
        is_available: formData.is_available,
      };

      if (!payload.name || !payload.price) {
        toast.error("Пожалуйста, заполните обязательные поля");
        return;
      }

  let productId = editingProduct?.id;
      if (editingProduct) {
        await modernApiClient.put(
          API_ENDPOINTS.SLIPPER_BY_ID(editingProduct.id),
          payload
        );
        productId = editingProduct.id;
        toast.success("Товар обновлен");
        // Update in-place optimistically
        setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...payload } as any : p)));
      } else {
        const created = await modernApiClient.post(
          API_ENDPOINTS.SLIPPERS,
          payload
        );
        // backend may return created object or {data: {...}}
        const createdData = created.data || created;
        productId = createdData.id;
        toast.success("Товар создан");
        // Prepend new product locally (basic shape)
        setProducts((prev) => [{ ...createdData, ...payload, id: productId }, ...prev]);
        // Update totals & ensure we are on first page to see new product
        setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
        if (pagination.page !== 1) {
          handlePageChange(1);
        }
      }

      // If images picked during create or edit, upload them sequentially
      if (productId && (singleImageFile || (multiImageFiles && multiImageFiles.length))) {
        await handleImageUploads(productId);
      }
  modernApiClient.clearCache("/slippers");
  setRefreshVersion((v) => v + 1); // trigger background refetch
      closeModal();
    } catch (e: any) {
      console.error("Save product error", e);
      toast.error(e?.message || "Ошибка сохранения товара");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailable = async (product: Slipper) => {
    try {
      await modernApiClient.put(API_ENDPOINTS.SLIPPER_BY_ID(product.id), {
        ...product,
        is_available: !product.is_available,
      });
      toast.success("Статус товара обновлен");
  // Optimistic toggle
  setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_available: !product.is_available } : p));
  modernApiClient.clearCache("/slippers");
  setRefreshVersion((v) => v + 1);
    } catch (e) {
      console.error("Toggle availability error", e);
      toast.error("Ошибка обновления статуса");
    }
  };

  const handleImageUploads = async (id: number) => {
    try {
      setUploading(true);
      setUploadProgress(null);
      // Adaptive single image upload
      if (singleImageFile) {
        const singleFieldCandidates = ["image", "file", "photo"];
        let singleSuccess = false;
        let lastError: any = null;
        for (const field of singleFieldCandidates) {
          const fd = new FormData();
            fd.append(field, singleImageFile);
          try {
            await uploadWithStrategies(API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id), fd, "изображения");
            toast.success(`Изображение загружено (${field})`);
            singleSuccess = true;
            break;
          } catch (err) {
            lastError = err;
          }
        }
        if (!singleSuccess && lastError) throw lastError;
      }
      // Multiple images: pre-compress all, then upload with limited concurrency (faster than strict sequence)
      if (multiImageFiles && multiImageFiles.length) {
        const originals = Array.from(multiImageFiles);
        const total = originals.length;
        setUploadProgress({ current: 0, total });

        // Pre-compress in parallel (promise all) with moderate quality to reduce payload & speed uploads
        const compressed: File[] = await Promise.all(
          originals.map((f) => prepareImageForUpload(f, 0.7, 1280))
        );

        // Upload pool with limited concurrency to avoid server overload / 413 spikes
        const CONCURRENCY = 2; // safe middle-ground
        let inFlight = 0;
        let index = 0;
        let completed = 0;
        let lastError: any = null;

        const fieldCandidates = ["image", "file", "photo"];

        const next = async (): Promise<void> => {
          const i = index++;
          if (i >= compressed.length) return;
          inFlight++;
          const original = originals[i];
          let file = compressed[i];
          let uploaded = false;
          let attemptErr: any = null;
          for (const field of fieldCandidates) {
            const fd = new FormData();
            fd.append(field, file);
            try {
              await uploadWithStrategies(
                API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id),
                fd,
                `изображения ${i + 1}`
              );
              uploaded = true;
              break;
            } catch (e: any) {
              // If 413 try harder compression one time
              if (e.message && e.message.includes("413")) {
                try {
                  file = await prepareImageForUpload(original, 0.5, 900);
                  const fd2 = new FormData();
                  fd2.append(field, file);
                  await uploadWithStrategies(
                    API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id),
                    fd2,
                    `изображения ${i + 1}`
                  );
                  uploaded = true;
                  break;
                } catch (e2: any) {
                  attemptErr = e2;
                }
              }
              attemptErr = e;
            }
          }
          if (!uploaded) {
            lastError = attemptErr;
          }
          completed++;
          setUploadProgress({ current: completed, total });
          inFlight--;
          if (index < compressed.length) await next();
        };

        const starters = Array.from({ length: Math.min(CONCURRENCY, compressed.length) }, () => next());
        await Promise.all(starters);
        if (lastError) throw lastError;
        toast.success("Все изображения загружены");
      }
    } catch (e: any) {
      console.error("Upload error", e);
      toast.error(e?.message || "Ошибка загрузки изображений");
    } finally {
      setUploading(false);
      setSingleImageFile(null);
      setMultiImageFiles(null);
      setUploadProgress(null);
    }
  };

  // Advanced helper: try various strategies (methods + toggle trailing slash)
  const uploadWithStrategies = async (endpoint: string, formData: FormData, label: string) => {
    // If this looks like an image upload endpoint, most APIs only allow POST
    const looksLikeImageEndpoint = /upload-image|upload-images|\/images\/?$/i.test(endpoint);
    const baseMethods: Array<"POST" | "PUT"> = looksLikeImageEndpoint ? ["POST"] : ["POST", "PUT"];

    // Build endpoint variants (toggle slash + common alternate patterns)
    const variantSet = new Set<string>();
    const pushVariant = (ep: string) => {
      if (!variantSet.has(ep)) variantSet.add(ep);
      if (ep.endsWith("/")) {
        const noSlash = ep.slice(0, -1);
        if (!variantSet.has(noSlash)) variantSet.add(noSlash);
      } else {
        const withSlash = ep + "/";
        if (!variantSet.has(withSlash)) variantSet.add(withSlash);
      }
    };
    pushVariant(endpoint);
    // Alternate patterns if endpoint contains upload-image(s)
    if (/upload-image/i.test(endpoint)) {
      pushVariant(endpoint.replace(/upload-image/i, "upload-images"));
      pushVariant(endpoint.replace(/upload-image/i, "images"));
    }
    if (/upload-images/i.test(endpoint)) {
      pushVariant(endpoint.replace(/upload-images/i, "upload-image"));
      pushVariant(endpoint.replace(/upload-images/i, "images"));
    }
    if (/\/images\/?$/i.test(endpoint)) {
      pushVariant(endpoint.replace(/\/images\/?$/i, "/upload-image/"));
      pushVariant(endpoint.replace(/\/images\/?$/i, "/upload-images/"));
    }
    const variants = Array.from(variantSet.values());

    const token = Cookies.get("access_token");
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let firstError: any = null;
    for (const ep of variants) {
      for (const method of baseMethods) {
        try {
          const url = `/api/proxy?endpoint=${encodeURIComponent(ep)}`;
          // Rebuild form data each attempt (some runtimes may lock previous FormData streams)
          const fresh = new FormData();
            for (const [k, v] of (formData as any).entries()) {
              fresh.append(k, v);
            }
          const res = await fetch(url, { method, body: fresh, headers });
          if (!res.ok) {
            let detail = "";
            try {
              const ct = res.headers.get("content-type") || "";
              if (ct.includes("application/json")) {
                const j = await res.json();
                detail = j.message || j.detail || j.error || JSON.stringify(j);
              } else {
                detail = (await res.text()) || "";
              }
            } catch {}
            const msg = detail || `Ошибка загрузки ${label} (status ${res.status})`;
            console.warn("Upload attempt failed", { endpoint: ep, method, status: res.status, msg });
            // 405 means wrong method; if we tried PUT on non-image endpoint continue; for POST 400 we keep error
            if (!firstError) firstError = new Error(msg);
            continue;
          }
          return res.json().catch(() => ({}));
        } catch (err: any) {
          console.warn("Upload network/error", { endpoint: ep, method, err });
          if (!firstError) firstError = err;
        }
      }
    }
    throw firstError || new Error(`Не удалось загрузить ${label}`);
  };

  // Compress & validate image before upload
  const prepareImageForUpload = async (file: File, quality = 0.75, maxDim = 1280): Promise<File> => {
    const MAX_SIZE_MB = 4; // client threshold before compress attempt
    if (file.size / (1024*1024) <= MAX_SIZE_MB) return file; // small enough
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => { URL.revokeObjectURL(url); res(image); };
        image.onerror = (e) => { URL.revokeObjectURL(url); rej(e); };
        image.src = url;
      });
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > height && width > maxDim) { height = Math.round(height * (maxDim/width)); width = maxDim; }
      else if (height >= width && height > maxDim) { width = Math.round(width * (maxDim/height)); height = maxDim; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(img,0,0,width,height);
      const blob: Blob = await new Promise((res) => canvas.toBlob(b => res(b || file), 'image/jpeg', quality));
      if ((blob.size || file.size) >= file.size) return file; // compression not better
      return new File([blob], file.name.replace(/\.(png|webp|gif)$/i,'.jpg'), { type: 'image/jpeg' });
    } catch { return file; }
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-8">
        <div className="text-sm text-gray-600">
          Показано {products.length} из {pagination.total} товаров
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || isLoading}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }).map(
              (_, i) => {
                const pageNumber = i + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 rounded-md border border-gray-300 ${
                      pagination.page === pageNumber
                        ? "bg-blue-500 text-white border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                    disabled={isLoading}
                  >
                    {pageNumber}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Управление товарами
            </h1>
            <p className="text-gray-600 mt-2">
              Просмотр и управление товарами в каталоге
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span onClick={openCreateModal}>Добавить товар</span>
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <TableSkeleton />
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Товар
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Размеры
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => router.push(`/products/${product.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                      title="Открыть страницу товара"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 relative group">
                            {product.images && product.images.length > 0 ? (
                              (() => {
                                const list = product.images;
                                const currentIdx = imageIndexMap[product.id] ?? 0;
                                const safeIdx = currentIdx % list.length;
                                const img = list[safeIdx];
                                return (
                                  <>
                                    <img
                                      loading="lazy"
                                      className="h-12 w-12 rounded-lg object-cover transition-opacity duration-200"
                                      src={getFullImageUrl(img.image_url)}
                                      alt={product.name}
                                    />
                                    {list.length > 1 && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setImageIndexMap((prev) => ({
                                              ...prev,
                                              [product.id]: (safeIdx - 1 + list.length) % list.length,
                                            }));
                                          }}
                                          className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100 transition text-[10px] leading-none"
                                          aria-label="Предыдущее изображение"
                                        >
                                          ‹
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setImageIndexMap((prev) => ({
                                              ...prev,
                                              [product.id]: (safeIdx + 1) % list.length,
                                            }));
                                          }}
                                          className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100 transition text-[10px] leading-none"
                                          aria-label="Следующее изображение"
                                        >
                                          ›
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5 pb-0.5 opacity-0 group-hover:opacity-100 transition">
                                          {list.slice(0,4).map((_, dotIdx) => (
                                            <span
                                              key={dotIdx}
                                              className={`h-1.5 w-1.5 rounded-full ${dotIdx === safeIdx ? 'bg-white' : 'bg-white/50'}`}
                                            />
                                          ))}
                                          {list.length > 4 && safeIdx >=4 && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </>
                                );
                              })()
                            ) : product.image ? (
                              <img
                                loading="lazy"
                                className="h-12 w-12 rounded-lg object-cover"
                                src={getFullImageUrl(product.image)}
                                alt={product.name}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {product.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.size || "Не указано"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAvailable(product);
                          }}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                            product.is_available !== false
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                          title="Переключить доступность"
                        >
                          {product.is_available !== false
                            ? "Активный"
                            : "Неактивный"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(product);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Товары не найдены
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Попробуйте изменить параметры поиска или добавьте новый товар
              </p>
            </div>
          )}
        </div>

        {renderPagination()}
        {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="p-6 space-y-5">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? "Редактировать товар" : "Создать товар"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Введите название"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Цена
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData((f) => ({ ...f, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Количество
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData((f) => ({ ...f, quantity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Размеры
                    </label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => setFormData((f) => ({ ...f, size: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Например 36-40"
                    />
                  </div>
                  {/* Category field removed */}
                  <div className="flex items-center space-x-2 md:col-span-2 mt-2">
                    <input
                      id="is_available"
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData((f) => ({ ...f, is_available: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_available" className="text-sm text-gray-700">
                      Активный товар
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    disabled={isSaving}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    disabled={isSaving}
                  >
                    {isSaving ? "Сохранение..." : editingProduct ? "Обновить" : "Создать"}
                  </button>
                </div>
                {/* Image upload section (available once product is being created or edited; will upload after save) */}
                <div className="pt-4 space-y-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center space-x-2">
                    <ImagePlus className="h-4 w-4 text-blue-600" />
                    <span>Изображения (опционально)</span>
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Одно изображение
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSingleImageFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                      />
                      {singleImageFile && (
                        <p className="mt-1 text-xs text-gray-500 truncate">{singleImageFile.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 flex items-center space-x-1">
                        <Images className="h-4 w-4 text-blue-600" />
                        <span>Несколько изображений</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setMultiImageFiles(e.target.files)}
                        className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                      />
                      {multiImageFiles && multiImageFiles.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">Выбрано файлов: {multiImageFiles.length}</p>
                      )}
                    </div>
                  </div>
                  {uploading && (
                    <div className="text-xs text-blue-600 flex flex-col space-y-1">
                      <span>Загрузка изображений...</span>
                      {uploadProgress && (
                        <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 transition-all"
                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                          />
                        </div>
                      )}
                      {uploadProgress && (
                        <span className="text-[10px] text-gray-500">{uploadProgress.current} / {uploadProgress.total}</span>
                      )}
                    </div>
                  )}
                  {!editingProduct && (
                    <p className="text-xs text-gray-500">
                      Изображения будут загружены после создания товара.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
