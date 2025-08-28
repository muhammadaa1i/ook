"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Package, X, ChevronLeft, ChevronRight, Trash2, Images, ImagePlus, Edit } from "lucide-react";
import { useI18n } from "@/i18n";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { toast } from "react-toastify";
import { modernApiClient } from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { getFullImageUrl, formatPrice } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductRow from "@/components/admin/products/ProductRow";
import { Slipper } from "@/types";
import Cookies from "js-cookie";

// Simple placeholder skeleton while loading
const LoadingTable: React.FC = () => <div className="p-6 text-sm text-gray-500">Loading…</div>;

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AdminProductsPage() {
  const { t } = useI18n();
  const confirm = useConfirm();
  const router = useRouter();

  const [products, setProducts] = useState<Slipper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [filters] = useState<Record<string, unknown>>({});

  // Form / modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Slipper | null>(null);
  const [formData, setFormData] = useState({ name: "", size: "", price: "", quantity: "", is_available: true });
  const [isSaving, setIsSaving] = useState(false);

  // Image state (single image upload removed)
  const [multiImageFiles, setMultiImageFiles] = useState<FileList | null>(null);
  const [multiImagePreviews, setMultiImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [editingImages, setEditingImages] = useState<Array<{ id: number; image_url: string; is_primary?: boolean; alt_text?: string }>>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [deletingImageIds, setDeletingImageIds] = useState<number[]>([]);

  const [imageIndexMap, setImageIndexMap] = useState<Record<number, number>>({});

  const refreshLockRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        limit: pagination.pageSize,
        include_images: true,
        _nc: Date.now(),
      };
      const resp = await modernApiClient.get(API_ENDPOINTS.SLIPPERS, params, { cache: false, force: true });
      const rawResp: unknown = (resp as { data?: unknown })?.data || resp;

      interface ListLike { items?: unknown; data?: unknown; total?: number | string }
      const lr = rawResp as ListLike | Slipper[] | undefined;
      let list: Slipper[] = [];
      if (Array.isArray(lr)) list = lr as Slipper[];
      else if (lr) {
        if (Array.isArray(lr.items)) list = lr.items as Slipper[];
        else if (Array.isArray(lr.data)) list = lr.data as Slipper[];
      }
      const total = lr && !Array.isArray(lr) && lr.total != null ? Number(lr.total) : list.length;
      const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
      setProducts(list);
      setPagination(p => ({ ...p, total, totalPages }));
    } catch (e) {
      console.error("Fetch products failed", e);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handlePageChange = (page: number) => {
    setPagination(p => ({ ...p, page: Math.max(1, page) }));
  };

  const handleDeleteProduct = useCallback(async (productId: number) => {
    const prod = products.find(p => p.id === productId);
    const displayName = prod?.name || `#${productId}`;
    const ok = await confirm({
      title: displayName,
      message: t('common.deleteQuestion'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    });
    if (!ok) return;

    // Optimistic remove
    const originalIndex = products.findIndex(p => p.id === productId);
    const originalProduct = products[originalIndex];
    const wasLastItemOnPage = products.length === 1 && pagination.page > 1;
    setProducts(prev => prev.filter(p => p.id !== productId));
    setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    try {
      try {
        await modernApiClient.delete(API_ENDPOINTS.SLIPPER_BY_ID(productId));
      } catch (err) {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          const altEndpoint = API_ENDPOINTS.SLIPPER_BY_ID(productId).replace(/\/$/, "");
          await modernApiClient.delete(altEndpoint);
        } else throw err;
      }
      toast.success(t('admin.products.toasts.deleteSuccess'), { autoClose: 2000 });
      if (wasLastItemOnPage) handlePageChange(pagination.page - 1);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 404) {
        toast.warn(t('admin.products.toasts.deleteAlreadyRemoved'), { autoClose: 2000 });
      } else {
        toast.error(t('admin.products.toasts.deleteError'), { autoClose: 2000 });
        // revert
        if (originalProduct) {
          setProducts(prev => {
            const next = [...prev];
            if (originalIndex >= 0 && originalIndex <= next.length) next.splice(originalIndex, 0, originalProduct);
            else next.unshift(originalProduct);
            return next;
          });
          setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        } else {
          fetchProducts();
        }
      }
    }
  }, [confirm, products, pagination.page, t, fetchProducts]);

  const resetForm = () => {
    setFormData({ name: "", size: "", price: "", quantity: "", is_available: true });
    setEditingProduct(null);
    setMultiImageFiles(null);
    setEditingImages([]);
    multiImagePreviews.forEach(url => URL.revokeObjectURL(url));
    setMultiImagePreviews([]);
  };

  const openCreateModal = () => { resetForm(); setShowModal(true); };
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

  const closeModal = (skipRefresh = false) => {
    setShowModal(false);
    resetForm();
    if (!skipRefresh && !refreshLockRef.current) {
      refreshLockRef.current = true;
      setTimeout(() => { fetchProducts().finally(() => setTimeout(() => { refreshLockRef.current = false; }, 200)); }, 80);
    }
  };

  const fetchEditingImages = async (slipperId: number) => {
    setEditingImages([]);
    try {
      setLoadingImages(true);
      console.log("Fetching images for slipper:", slipperId);

      // Clear cache first for fresh data
      modernApiClient.clearCache(API_ENDPOINTS.SLIPPER_IMAGES(slipperId));

      interface ImageRecord { id: number; image_url: string; is_primary?: boolean; alt_text?: string }
      const resp = await modernApiClient.get(
        API_ENDPOINTS.SLIPPER_IMAGES(slipperId),
        undefined,
        { cache: false, force: true }
      );
      console.log("Images response:", resp);
      const data = ((resp as { data?: ImageRecord[] })?.data || resp) as ImageRecord[];
      if (Array.isArray(data)) {
        console.log("Setting editing images:", data);
        setEditingImages(data.map(d => ({
          id: d.id,
          image_url: d.image_url,
          is_primary: d.is_primary,
          alt_text: d.alt_text
        })));
      } else {
        console.log("Data is not an array:", data);
      }
    } catch (error) {
      console.error("Failed to load images:", error);
      toast.error("Не удалось загрузить изображения товара", { autoClose: 2000 });
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
      toast.success("Изображение удалено", { autoClose: 2000 });

      // Immediately update the products list to reflect the change
      modernApiClient.clearCache("/slippers");
      setProducts(currentProducts =>
        currentProducts.map(product => {
          if (product.id === editingProduct.id && product.images) {
            return {
              ...product,
              images: product.images.filter(img => img.id !== imageId)
            };
          }
          return product;
        })
      );
    } catch {
      toast.error("Ошибка удаления изображения", { autoClose: 2000 });
    } finally {
      setDeletingImageIds(ids => ids.filter(id => id !== imageId));
    }
  };

  const handleSetPrimaryImage = async (imageId: number) => {
    if (!editingProduct) return;
    try {
      await modernApiClient.put(API_ENDPOINTS.SLIPPER_UPDATE_IMAGE(editingProduct.id, imageId), {
        is_primary: true
      });
      // Update local state
      setEditingImages(imgs => imgs.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));
      toast.success("Изображение установлено как основное", { autoClose: 2000 });

      // Immediately update the products list to reflect the change
      modernApiClient.clearCache("/slippers");
      setProducts(currentProducts =>
        currentProducts.map(product => {
          if (product.id === editingProduct.id && product.images) {
            return {
              ...product,
              images: product.images.map(img => ({
                ...img,
                is_primary: img.id === imageId
              }))
            };
          }
          return product;
        })
      );
    } catch {
      toast.error("Ошибка установки основного изображения", { autoClose: 2000 });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Fast validation
      const payload = {
        name: formData.name.trim(),
        size: formData.size.trim(),
        price: Number(formData.price) || 0,
        quantity: Number(formData.quantity) || 0,
        is_available: formData.is_available,
      };

      if (!payload.name || !payload.price) {
        console.warn('Product validation failed: missing name or price');
        setIsSaving(false);
        return;
      }

      let productId = editingProduct?.id;
      if (editingProduct) {
        await modernApiClient.put(
          API_ENDPOINTS.SLIPPER_BY_ID(editingProduct.id),
          payload
        );
        productId = editingProduct.id;
        toast.success(t('admin.products.toasts.updateSuccess'), { autoClose: 2000 });
        // Update in-place optimistically
        setProducts((prev) => prev.map((p) => (p.id === productId ? ({ ...p, ...payload } as Slipper) : p)));
      } else {
        const created = await modernApiClient.post(
          API_ENDPOINTS.SLIPPERS,
          payload
        );
        // backend may return created object or {data: {...}}
        interface CreatedWrap { data?: Slipper;[k: string]: unknown }
        const cObj = created as CreatedWrap | Slipper;
        const createdData = ((cObj as CreatedWrap).data || (cObj as Slipper)) as Slipper;
        productId = createdData.id;
        // Prepend new product locally (basic shape) - no toast needed
        if (productId) {
          const newItem: Slipper = {
            ...createdData,
            ...payload,
            id: productId,
            images: [], // Will be updated when images upload
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Slipper;

          // Immediately add product to state for instant visibility
          setProducts((prev) => [newItem, ...prev]);

          // Update pagination immediately
          setPagination((prev) => ({ ...prev, total: prev.total + 1 }));

          // Simple immediate product list update - no setTimeout chains
          setProducts((prev) => {
            const filtered = prev.filter(p => p.id !== productId);
            return [newItem, ...filtered];
          });
        }

        // Ensure we are on first page to see new product
        if (pagination.page !== 1) {
          handlePageChange(1);
        }
        // Do NOT immediately clear + refetch here; defer to controlled refresh after modal close / uploads
        modernApiClient.clearCache("/slippers");
      }

      // If images picked during create or edit, handle them optimally
      if (productId && (multiImageFiles && multiImageFiles.length)) {
        if (editingProduct) {
          await handleImageUploads(productId); // sync for edit
          closeModal();
        } else {
          // New product: close modal without triggering immediate fetch (skipRefresh)
          closeModal(true);
          setIsSaving(false);
          // Background upload; perform ONE controlled refresh at the end
          handleImageUploads(productId)
            .catch((err) => console.error("Background image upload failed:", err))
            .finally(() => {
              modernApiClient.clearCache("/slippers");
              // Single refresh guarded by lock
              if (!refreshLockRef.current) {
                refreshLockRef.current = true;
                fetchProducts().finally(() => setTimeout(() => { refreshLockRef.current = false; }, 300));
              }
            });
          return;
        }
      } else {
        modernApiClient.clearCache("/slippers");
        if (!editingProduct && productId && pagination.page !== 1) {
          handlePageChange(1);
        }
        closeModal(true); // skip duplicate fetch; we already updated state
        // Trigger a single fetch (debounced by lock)
        if (!refreshLockRef.current) {
          refreshLockRef.current = true;
          fetchProducts().finally(() => setTimeout(() => { refreshLockRef.current = false; }, 300));
        }
        return;
      }
    } catch (e) {
      console.error('Product save failed:', e);
      // Don't show error toast to admin - just log it
      closeModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailable = async (product: Slipper) => {
    // Immediately update UI for instant feedback
    const newAvailability = !product.is_available;
    setProducts(prev => prev.map(p =>
      p.id === product.id
        ? { ...p, is_available: newAvailability }
        : p
    ));

    try {
      await modernApiClient.put(API_ENDPOINTS.SLIPPER_BY_ID(product.id), {
        ...product,
        is_available: newAvailability,
      });
      toast.success(t('admin.products.toasts.statusUpdateSuccess'), { autoClose: 2000 });
      modernApiClient.clearCache("/slippers");
    } catch {
      // Revert the change if API call failed
      setProducts(prev => prev.map(p =>
        p.id === product.id
          ? { ...p, is_available: product.is_available }
          : p
      ));
      toast.error(t('admin.products.toasts.statusUpdateError'), { autoClose: 2000 });
    }
  };

  // (Removed base64 + compression helpers)

  const handleImageUploads = async (id: number) => {
    try {
      setUploading(true);
      setUploadProgress(null);
      let uploadSuccess = false;

      // Check file sizes and formats first
      // const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024; // 10MB max original size

      // Supported image formats (very comprehensive list)
      const SUPPORTED_FORMATS = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'image/bmp', 'image/tiff', 'image/tif', 'image/svg+xml', 'image/avif',
        'image/heic', 'image/heif', 'image/ico', 'image/x-icon'
      ];

      const validateImageFile = (file: File, index?: number): boolean => {
        const fileLabel = index !== undefined ? `Image ${index + 1}` : 'Image';

        // // Check file size
        // if (file.size > MAX_ORIGINAL_SIZE) {
        //   console.warn(`${fileLabel} is too large (${Math.round(file.size / 1024 / 1024)}MB). Skipping this file.`);
        //   // Don't show toast error to admin - just log and skip
        //   return false;
        // }

        // Check file format - be very permissive
        if (!SUPPORTED_FORMATS.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
          console.warn(`${fileLabel} has unsupported format: ${file.type}. Attempting upload anyway...`);
          // Don't block upload, just warn - let the backend decide
        }

        return true;
      };

      if (multiImageFiles) {
        for (let i = 0; i < multiImageFiles.length; i++) {
          if (!validateImageFile(multiImageFiles[i], i)) {
            return;
          }
        }
      }
      // Simple multiple images upload (no compression, direct API)
      if (multiImageFiles && multiImageFiles.length) {
        const fd = new FormData();

        Array.from(multiImageFiles).forEach(f => fd.append('images', f));

        try {
          const directUrlMulti = `${process.env.NEXT_PUBLIC_API_DIRECT_URL || 'https://oyoqkiyim.duckdns.org'}${API_ENDPOINTS.SLIPPER_UPLOAD_IMAGES(id)}`;

          const resp = await fetch(directUrlMulti, {
            method: 'POST',
            body: fd,
            headers: {
              Authorization: Cookies.get('access_token') ? `Bearer ${Cookies.get('access_token')}` : ''
            }
          });

          if (!resp.ok) {
            const txt = await resp.text();
            console.error('Multi image upload failed:', resp.status, txt);
          } else {
            uploadSuccess = true;
          }

        } catch (e) {
          console.error('Multi image upload network error:', e);
        }
      }

      // Enhanced refresh logic - only if upload was successful
      if (uploadSuccess && editingProduct) { // Only run heavy refresh path while editing to avoid loops on creation
        console.log("Starting immediate image refresh process...");

        // Immediately clear all relevant cache to ensure fresh data
        modernApiClient.clearCache("/slippers");
        modernApiClient.clearCache(`/slippers/${id}`);
        modernApiClient.clearCache(`/slippers/${id}/images`);

        // For edit modal - refresh images immediately
        if (editingProduct) {
          console.log("Refreshing images in edit modal...");
          await fetchEditingImages(editingProduct.id);
        }

        // Immediately refresh the products list with fresh data
        console.log("Forcing immediate product list refresh...");
        try {
          const params = {
            ...filters,
            include_images: true,
          };

          // Force fresh fetch bypassing all cache
          const response = await modernApiClient.get(
            API_ENDPOINTS.SLIPPERS,
            params,
            { cache: false, force: true }
          );

          // Process the response exactly like fetchProducts does
          const data = (response as { data?: Slipper[] })?.data || (response as Slipper[]);
          const productsData = Array.isArray(data)
            ? data
            : (data as { items?: Slipper[]; data?: Slipper[] })?.items ||
            (data as { items?: Slipper[]; data?: Slipper[] })?.data ||
            [];

          const list: Slipper[] = Array.isArray(productsData) ? (productsData as Slipper[]) : [];

          // Update products immediately with safe error handling
          try {
            setProducts(list as Slipper[]);

            // Single controlled re-render to ensure visibility
            setTimeout(() => {
              try {
                setProducts([...list]);
              } catch (renderError) {
                console.error("Error in delayed render:", renderError);
              }
            }, 100);

            // Update pagination safely
            setPagination(prev => {
              try {
                return { ...prev, total: list.length };
              } catch (paginationError) {
                console.error("Error updating pagination:", paginationError);
                return prev;
              }
            });
          } catch (updateError) {
            console.error("Error updating products state:", updateError);
          }

          // Also ensure the current editing product reflects the new images
          if (editingProduct) {
            const updatedProduct = list.find(p => p.id === editingProduct.id);
            if (updatedProduct && updatedProduct.images) {
              setEditingImages(updatedProduct.images.map(img => ({
                id: img.id,
                image_url: img.image_path,
                is_primary: img.is_primary || false,
                alt_text: img.alt_text
              })));
            }
          }

          console.log("Products updated immediately after image upload", list.length);

          // Additional immediate UI refresh
          setTimeout(() => {
            setProducts([...list]);
          }, 100);

        } catch (error) {
          console.error("Error in immediate refresh:", error);
          // fallback: simply refetch
          await fetchProducts();
        }

        console.log("Images and products refreshed successfully after upload (edit mode)");
      }
    } catch (e) {
      console.error('Image upload failed:', e);
      console.warn('Product operation continues despite image upload failure.');
      // Don't show toast error to admin - product creation should continue
    } finally {
      // Always ensure cleanup happens with error handling
      try {
        setUploading(false);
        setMultiImageFiles(null);
        setUploadProgress(null);

        multiImagePreviews.forEach(url => {
          try {
            URL.revokeObjectURL(url);
          } catch (urlError) {
            console.error('Error revoking multi image URL:', urlError);
          }
        });
        setMultiImagePreviews([]);
      } catch (cleanupError) {
        console.error('Error in image upload cleanup:', cleanupError);
      }
    }
  };

  // (Removed legacy strategy + compression helpers)

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
                    className={`px-3 py-2 rounded-md border border-gray-300 ${pagination.page === pageNumber
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('admin.products.title')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('admin.products.subtitle')}
            </p>
          </div>
          <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>{t('admin.products.add')}</span>
          </button>
        </div>

        {/* Products Table / List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <LoadingTable />
          ) : products.length > 0 ? (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.products.table.product')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden xs:table-cell">
                        {t('admin.products.table.price')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        {t('admin.products.table.size')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        {t('admin.products.table.status')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.products.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        onEdit={openEditModal}
                        onDelete={handleDeleteProduct}
                        onToggleAvailability={handleToggleAvailable}
                        navigate={(id) => router.push(`/products/${id}`)}
                        imageIndex={imageIndexMap[product.id] ?? 0}
                        setImageIndex={(id, next) => setImageIndexMap(prev => ({ ...prev, [id]: next }))}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-100">
                {products.map(product => {
                  const image = product.images && product.images.length ? product.images[0] : undefined;
                  return (
                    <div
                      key={product.id}
                      className="flex gap-3 p-3 hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => router.push(`/products/${product.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex-shrink-0 h-14 w-14 relative rounded-md overflow-hidden bg-gray-100">
                        {image ? (
                          <Image
                            src={getFullImageUrl(image.image_path)}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg'; }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-gray-900 truncate text-sm leading-snug">{product.name}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleAvailable(product); }}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap ${product.is_available !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          >
                            {product.is_available !== false ? t('admin.products.status.active') : t('admin.products.status.inactive')}
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                          <span>ID: {product.id}</span>
                          <span>{formatPrice(product.price)}</span>
                          {product.size && <span>{product.size}</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-gray-500">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                            className="hover:text-green-600"
                            aria-label={t('admin.products.table.actions')}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                            className="hover:text-red-600"
                            aria-label={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!products || products.length === 0) && (
                  <div className="p-6 text-center text-sm text-gray-500">
                    {t('admin.products.empty.subtitle')}
                  </div>
                )}
              </div>
            </>
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
            onClick={() => closeModal()}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => closeModal()}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                aria-label={t('admin.common.close')}
              >
                <X className="h-5 w-5" />
              </button>
              <div className="p-4 sm:p-6 space-y-5">
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
                    onClick={() => closeModal()}
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
                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    📁 Рекомендуется: изображения до 2МБ. Большие файлы будут автоматически сжаты.
                  </div>
                  <div className="grid gap-4 md:grid-cols-1">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 flex items-center space-x-1">
                        <Images className="h-4 w-4 text-blue-600" />
                        <span>{t('admin.products.images.multiple')}</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          setMultiImageFiles(files);
                          // Clean up old previews
                          multiImagePreviews.forEach(url => URL.revokeObjectURL(url));
                          // Create new preview URLs
                          if (files && files.length > 0) {
                            const previews = Array.from(files).map(file => URL.createObjectURL(file));
                            setMultiImagePreviews(previews);
                          } else {
                            setMultiImagePreviews([]);
                          }
                        }}
                        className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                      />
                      {multiImageFiles && multiImageFiles.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <div className="text-xs text-gray-500">
                            <p>{t('admin.products.images.selectedFiles', { count: multiImageFiles.length.toString() })}</p>
                            <div className="space-y-1 max-h-16 overflow-y-auto">
                              {Array.from(multiImageFiles).map((file, index) => (
                                <p key={index} className={`text-xs ${file.size > 2 * 1024 * 1024 ? 'text-orange-600' : 'text-gray-500'}`}>
                                  {file.name} ({Math.round(file.size / 1024)}KB)
                                  {file.size > 2 * 1024 * 1024 && ' - will compress'}
                                </p>
                              ))}
                            </div>
                          </div>
                          {multiImagePreviews.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                              {multiImagePreviews.map((preview, index) => (
                                <div key={index} className="relative w-full h-16 border rounded overflow-hidden bg-gray-50">
                                  <Image
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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
                        <div className="text-[11px] text-gray-z500 border border-dashed rounded p-2">{t('admin.products.images.none')}</div>
                      )}
                      {editingImages.length > 0 && (
                        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {editingImages.map(img => {
                            const full = getFullImageUrl(img.image_url);
                            const deleting = deletingImageIds.includes(img.id);
                            return (
                              <li key={img.id} className="relative group rounded border overflow-hidden bg-gray-50">
                                <div className="relative w-full h-20">
                                  <Image
                                    src={full}
                                    alt={img.alt_text || 'product image'}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    onError={(e) => {
                                      console.error("Image failed to load:", full);
                                      const target = e.target as HTMLImageElement;
                                      target.src = "/placeholder-product.svg";
                                    }}
                                    onLoad={() => {
                                      console.log("Image loaded successfully:", full);
                                    }}
                                  />
                                </div>
                                {img.is_primary && (
                                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-1 py-0.5 rounded">{t('admin.products.images.primaryBadge')}</span>
                                )}
                                <div className="absolute top-1 right-1 flex gap-1">
                                  {!img.is_primary && (
                                    <button
                                      type="button"
                                      aria-label="Сделать основным"
                                      onClick={() => handleSetPrimaryImage(img.id)}
                                      className="bg-green-500 hover:bg-green-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition"
                                      title="Сделать основным изображением"
                                    >
                                      <span className="text-[10px]">★</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    aria-label={t('admin.products.images.removeImageAria')}
                                    disabled={deleting}
                                    onClick={() => handleDeleteExistingImage(img.id)}
                                    className="bg-black/50 hover:bg-black/70 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-60"
                                  >
                                    {deleting ? <span className="animate-pulse text-[10px]">…</span> : <Trash2 className="h-3 w-3" />}
                                  </button>
                                </div>
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
