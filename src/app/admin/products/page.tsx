"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Slipper, SearchParams } from "@/types";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS, PAGINATION } from "@/lib/constants";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Edit, Trash2, Plus, Package, X, ImagePlus, Images } from "lucide-react";
import { formatPrice, getFullImageUrl } from "@/lib/utils";
import { useI18n } from "@/i18n";

export default function AdminProductsPage() {
  const { t } = useI18n();
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
  // Existing images (when editing)
  const [editingImages, setEditingImages] = useState<{
    id: number; image_url: string; is_primary?: boolean; alt_text?: string
  }[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [deletingImageIds, setDeletingImageIds] = useState<number[]>([]);
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

  const fetchProducts = useCallback(async () => {
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
      const data =
        (response as { data?: Slipper[] })?.data || (response as Slipper[]);

      // Handle both response structures: {data: [...]} and {items: [...]}
      const productsData = Array.isArray(data)
        ? data
        : (data as { items?: Slipper[]; data?: Slipper[] })?.items ||
          (data as { items?: Slipper[]; data?: Slipper[] })?.data ||
          [];

  let list: Slipper[] = Array.isArray(productsData) ? (productsData as Slipper[]) : [];
      // Filter out any items pending deletion to keep UI consistent even if backend hasn't finished yet
      if (pendingDeletions.size) {
  list = list.filter((p: Slipper) => !pendingDeletions.has(p.id));
        // Clean up pending deletions that no longer exist in backend response
        const stillPending = new Set<number>();
        pendingDeletions.forEach((id) => {
          if (list.find((p: Slipper) => p.id === id)) stillPending.add(id);
        });
        if (stillPending.size !== pendingDeletions.size) {
          setPendingDeletions(stillPending);
        }
      }
      setProducts(list as Slipper[]);
      const responseData = response as {
        data?: { total?: number; pages?: number; total_pages?: number };
      };
      setPagination({
        total: responseData.data?.total || 0,
        page:
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
  } catch {
  toast.error(t('admin.products.toasts.loadError'));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pendingDeletions, t]);


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
      title: t('admin.products.deleteConfirm.title'),
      message: (
        <div>
          {t('admin.products.deleteConfirm.message')}
        </div>
      ),
      confirmText: t('admin.products.deleteConfirm.confirm'),
      cancelText: t('common.cancel'),
      variant: "danger",
    });
    if (!ok) return;
    try {
  // mark deleting (state removed)
      // Capture current count for page adjustment logic
      const currentCount = products.length;
      try {
        await modernApiClient.delete(API_ENDPOINTS.SLIPPER_BY_ID(productId));
      } catch (err) {
        // Fallback: if constant change not yet deployed or backend expects opposite trailing slash variant
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          const altEndpoint = API_ENDPOINTS.SLIPPER_BY_ID(productId).replace(/\/$/, "");
          await modernApiClient.delete(altEndpoint); // retry without slash
        } else {
          throw err;
        }
      }
  toast.success(t('admin.products.toasts.deleteSuccess'));
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
  // background refresh trigger removed
  } catch (error) {
  const status = (error as { status?: number })?.status;
    if (status === 404) {
  toast.warn(t('admin.products.toasts.deleteAlreadyRemoved'));
        // Remove optimistically if still present
        setPendingDeletions((prev) => new Set(prev).add(productId));
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        modernApiClient.clearCache("/slippers");
  // background refresh trigger removed
      } else {
  toast.error(t('admin.products.toasts.deleteError'));
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
  // clear deleting marker
    }
  }, [confirm, pagination.page, handlePageChange, products, t]);

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
  fetchEditingImages(product.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const fetchEditingImages = async (slipperId: number) => {
    setEditingImages([]);
    try {
      setLoadingImages(true);
      interface ImageRecord { id: number; image_url: string; is_primary?: boolean; alt_text?: string }
      const resp = await modernApiClient.get(API_ENDPOINTS.SLIPPER_IMAGES(slipperId), undefined, { cache: false });
      const data = ((resp as { data?: ImageRecord[] })?.data || resp) as ImageRecord[];
      if (Array.isArray(data)) {
        setEditingImages(data.map(d => ({
          id: d.id,
          image_url: d.image_url,
          is_primary: d.is_primary,
          alt_text: d.alt_text
        })));
      }
    } catch {
      // Failed to load images
    } finally {
      setLoadingImages(false);
    }
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!editingProduct) return;
    const ok = await confirm({
      title: "Удалить изображение",
      message: "Удалить это изображение?",
      confirmText: "Удалить",
      cancelText: "Отмена",
      variant: "danger"
    });
    if (!ok) return;    
    try {
      setDeletingImageIds(ids => [...ids, imageId]);
      await modernApiClient.delete(API_ENDPOINTS.SLIPPER_DELETE_IMAGE(editingProduct.id, imageId));
      setEditingImages(imgs => imgs.filter(i => i.id !== imageId));
      toast.success("Изображение удалено");
  } catch {
      toast.error("Ошибка удаления изображения");
    } finally {
      setDeletingImageIds(ids => ids.filter(id => id !== imageId));
    }
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
  toast.error(t('admin.products.toasts.saveError'));
        return;
      }

  let productId = editingProduct?.id;
      if (editingProduct) {
        await modernApiClient.put(
          API_ENDPOINTS.SLIPPER_BY_ID(editingProduct.id),
          payload
        );
        productId = editingProduct.id;
  toast.success(t('admin.products.toasts.updateSuccess'));
        // Update in-place optimistically
  setProducts((prev) => prev.map((p) => (p.id === productId ? ({ ...p, ...payload } as Slipper) : p)));
      } else {
        const created = await modernApiClient.post(
          API_ENDPOINTS.SLIPPERS,
          payload
        );
        // backend may return created object or {data: {...}}
  interface CreatedWrap { data?: Slipper; [k: string]: unknown }
  const cObj = created as CreatedWrap | Slipper;
  const createdData = ((cObj as CreatedWrap).data || (cObj as Slipper)) as Slipper;
        productId = createdData.id;
  toast.success(t('admin.products.toasts.createSuccess'));
        // Prepend new product locally (basic shape)
        if (productId) {
          const newItem: Slipper = { ...createdData, ...payload, id: productId } as Slipper;
          setProducts((prev) => [newItem, ...prev]);
        }
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
  // trigger background refetch removed
      closeModal();
    } catch (e) {
      const msg = (e as Error)?.message || t('admin.products.toasts.saveError');
      toast.error(msg);
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
  toast.success(t('admin.products.toasts.statusUpdateSuccess'));
  // Optimistic toggle
  setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_available: !product.is_available } : p));
  modernApiClient.clearCache("/slippers");
  // trigger background refetch removed
  } catch {
      toast.error(t('admin.products.toasts.statusUpdateError'));
    }
  };

  const handleImageUploads = async (id: number) => {
    try {
      setUploading(true);
      setUploadProgress(null);
      // Adaptive single image upload
      if (singleImageFile) {
  const singleFieldCandidates = ["image", "file", "photo", "image_file"]; // broaden accepted field names
        let singleSuccess = false;
  let lastError: Error | null = null;
        for (const field of singleFieldCandidates) {
          const fd = new FormData();
            fd.append(field, singleImageFile);
          try {
            await uploadWithStrategies(API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id), fd, t('admin.products.images.single'));
            toast.success(t('admin.products.images.uploadSingleSuccess', { field }));
            singleSuccess = true;
            break;
          } catch (err) {
            lastError = err as Error;
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
  // removed inFlight variable (was unused)
        let index = 0;
        let completed = 0;
  let lastError: Error | null = null;

  const fieldCandidates = ["image", "file", "photo", "files", "images"]; // include plural forms for backend flexibility

        const next = async (): Promise<void> => {
          const i = index++;
          if (i >= compressed.length) return;
          const original = originals[i];
          let file = compressed[i];
          let uploaded = false;
          let attemptErr: Error | null = null;
          for (const field of fieldCandidates) {
            const fd = new FormData();
            fd.append(field, file);
            try {
              await uploadWithStrategies(
                API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id),
                fd,
                `${t('admin.products.images.single')} ${i + 1}`
              );
              uploaded = true;
              break;
            } catch (e) {
              // If 413 try harder compression one time
              if ((e as Error).message && (e as Error).message.includes("413")) {
                try {
                  // Aggressive recompress attempt (lower quality & dimension)
                  file = await prepareImageForUpload(original, 0.55, 1300);
                  const fd2 = new FormData();
                  fd2.append(field, file);
                  await uploadWithStrategies(
                    API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id),
                    fd2,
                    `${t('admin.products.images.single')} ${i + 1}`
                  );
                  uploaded = true;
                  break;
              } catch {
                }
              }
              attemptErr = e as Error;
            }
          }
          if (!uploaded) {
            lastError = attemptErr;
          }
          completed++;
          setUploadProgress({ current: completed, total });
          if (index < compressed.length) await next();
        };

        const starters = Array.from({ length: Math.min(CONCURRENCY, compressed.length) }, () => next());
        await Promise.all(starters);
  if (lastError) throw lastError;
  toast.success(t('admin.products.images.uploadAllSuccess'));
      }
    } catch (e) {
      const msg = (e as Error)?.message || t('admin.products.images.uploadError');
      toast.error(msg);
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

  let firstError: Error | null = null;
    for (const ep of variants) {
      for (const method of baseMethods) {
        try {
          const url = `/api/proxy?endpoint=${encodeURIComponent(ep)}`;
          // Rebuild form data each attempt (some runtimes may lock previous FormData streams)
          const fresh = new FormData();
            for (const [k, v] of (formData as FormData).entries()) {
              fresh.append(k, v as File | string | Blob);
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
            // Upload attempt failed
            // 405 means wrong method; if we tried PUT on non-image endpoint continue; for POST 400 we keep error
            if (!firstError) firstError = new Error(msg);
            continue;
          }
          return res.json().catch(() => ({}));
        } catch (err) {
          // Upload network/error
          if (!firstError) firstError = err as Error;
        }
      }
    }
  throw firstError || new Error(`${t('admin.products.images.uploadError')}: ${label}`);
  };

  // Adaptive compression pipeline: aim for <900KB per image with multiple passes
  const prepareImageForUpload = async (
    file: File,
    initialQuality = 0.75,
    initialMaxDim = 1600
  ): Promise<File> => {
    const TARGET_BYTES = 900 * 1024;
    const MIN_QUALITY = 0.25;
    if (file.size <= TARGET_BYTES) return file;

    const steps: Array<{ q: number; max: number }> = [
      { q: initialQuality, max: initialMaxDim },
      { q: 0.65, max: 1500 },
      { q: 0.55, max: 1400 },
      { q: 0.5, max: 1280 },
      { q: 0.42, max: 1150 },
      { q: 0.35, max: 1000 },
      { q: 0.3, max: 900 },
    ];

    const load = (f: File) =>
      new Promise<HTMLImageElement>((res, rej) => {
        const url = URL.createObjectURL(f);
        const img = document.createElement("img");
        img.onload = () => {
          URL.revokeObjectURL(url);
          res(img);
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          rej(e);
        };
        img.src = url;
      });

    let current = file;
    try {
      for (const { q, max } of steps) {
        const img = await load(current);
        let { width, height } = img;
        if (width > height && width > max) {
          height = Math.round((height * max) / width);
          width = max;
        } else if (height >= width && height > max) {
          width = Math.round((width * max) / height);
          height = max;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) break;
        ctx.drawImage(img, 0, 0, width, height);
        const blob: Blob = await new Promise((res) =>
          canvas.toBlob(
            (b) => res(b || current),
            "image/jpeg",
            Math.max(MIN_QUALITY, q)
          )
        );
        if (blob.size < current.size) {
          current = new File(
            [blob],
            current.name.replace(/\.(png|webp|gif)$/i, ".jpg"),
            { type: "image/jpeg" }
          );
        }
        if (current.size <= TARGET_BYTES) break;
      }
    } catch {
      // swallow errors
    }
    return current;
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-8">
        <div className="text-sm text-gray-600">
          {t('admin.products.pagination.shown', { count: products.length.toString(), total: pagination.total.toString() })}
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
              {t('admin.products.title')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('admin.products.subtitle')}
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span onClick={openCreateModal}>{t('admin.products.add')}</span>
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
                      {t('admin.products.table.product')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.products.table.price')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.products.table.size')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.products.table.status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.products.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => router.push(`/products/${product.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                      title={t('admin.products.table.product')}
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
                                    <Image
                                      className="h-12 w-12 rounded-lg object-cover transition-opacity duration-200"
                                      src={getFullImageUrl(img.image_url)}
                                      alt={product.name}
                                      width={48}
                                      height={48}
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
                                          {list.slice(0, 4).map((_, dotIdx) => (
                                            <span
                                              key={dotIdx}
                                              className={`h-1.5 w-1.5 rounded-full ${dotIdx === safeIdx ? 'bg-white' : 'bg-white/50'}`}
                                            />
                                          ))}
                                          {list.length > 4 && safeIdx >= 4 && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </>
                                );
                              })()
                            ) : product.image ? (
                              <Image
                                className="h-12 w-12 rounded-lg object-cover"
                                src={getFullImageUrl(product.image)}
                                alt={product.name}
                                width={48}
                                height={48}
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
                          {product.size || t('admin.common.unspecified')}
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
                          title={t('admin.common.toggleAvailability')}
                        >
                          {product.is_available !== false
                            ? t('admin.products.status.active')
                            : t('admin.products.status.inactive')}
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
                {t('admin.products.empty.title')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('admin.products.empty.subtitle')}
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
                aria-label={t('admin.common.close')}
              >
                <X className="h-5 w-5" />
              </button>
              <div className="p-6 space-y-5">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? t('admin.products.form.editTitle') : t('admin.products.form.createTitle')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.products.form.fields.name')}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('admin.products.form.fields.namePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.products.form.fields.price')}
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
                      {t('admin.products.form.fields.quantity')}
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
                      {t('admin.products.form.fields.size')}
                    </label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => setFormData((f) => ({ ...f, size: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('admin.products.form.fields.sizePlaceholder')}
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
                      {t('admin.products.form.fields.active')}
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    disabled={isSaving}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    disabled={isSaving}
                  >
                    {isSaving ? t('admin.products.form.buttons.saving') : editingProduct ? t('admin.products.form.buttons.update') : t('admin.products.form.buttons.create')}
                  </button>
                </div>
                {/* Image upload section (available once product is being created or edited; will upload after save) */}
                <div className="pt-4 space-y-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center space-x-2">
                    <ImagePlus className="h-4 w-4 text-blue-600" />
                    <span>{t('admin.products.images.section')}</span>
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t('admin.products.images.single')}
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
                        <span>{t('admin.products.images.multiple')}</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setMultiImageFiles(e.target.files)}
                        className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                      />
                      {multiImageFiles && multiImageFiles.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">{t('admin.products.images.selectedFiles', { count: multiImageFiles.length.toString() })}</p>
                      )}
                    </div>
                  </div>
                  {uploading && (
                    <div className="text-xs text-blue-600 flex flex-col space-y-1">
                      <span>{t('admin.products.images.uploading')}</span>
                      {uploadProgress && (
                        <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 transition-all"
                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                          />
                        </div>
                      )}
                      {uploadProgress && (
                        <span className="text-[10px] text-gray-500">{t('admin.products.images.progress', { current: uploadProgress.current.toString(), total: uploadProgress.total.toString() })}</span>
                      )}
                    </div>
                  )}
                  {!editingProduct && (
                    <p className="text-xs text-gray-500">
                      {t('admin.products.images.willUploadAfterCreate')}
                    </p>
                  )}
                  {editingProduct && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-700">{t('admin.products.images.current')}</h4>
                        {loadingImages && <span className="text-[10px] text-gray-500">{t('admin.products.images.loading')}</span>}
                      </div>
                      {!loadingImages && editingImages.length === 0 && (
                        <div className="text-[11px] text-gray-500 border border-dashed rounded p-2">{t('admin.products.images.none')}</div>
                      )}
                      {editingImages.length > 0 && (
                        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {editingImages.map(img => {
                            const full = getFullImageUrl(img.image_url);
                            const deleting = deletingImageIds.includes(img.id);
                            return (
                              <li key={img.id} className="relative group rounded border overflow-hidden bg-gray-50">
                                <Image src={full} alt={img.alt_text || 'image'} width={150} height={150} className="object-cover w-full h-20" />
                                {img.is_primary && (
                                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-1 py-0.5 rounded">{t('admin.products.images.primaryBadge')}</span>
                                )}
                                <button
                                  type="button"
                                  aria-label={t('admin.products.images.removeImageAria')}
                                  disabled={deleting}
                                  onClick={() => handleDeleteExistingImage(img.id)}
                                  className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-60"
                                >
                                  {deleting ? <span className="animate-pulse text-[10px]">…</span> : <Trash2 className="h-3 w-3" />}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <p className="text-[10px] text-gray-500">{t('admin.products.images.addingHint')}</p>
                    </div>
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
