"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { ChevronLeft, ChevronRight, Plus, X, ImagePlus, Images, Package, Trash2 } from "lucide-react";
import ProductRow from "@/components/admin/products/ProductRow";
import { getFullImageUrl } from "@/lib/utils";
import { useI18n } from "@/i18n";

export default function AdminProductsPage() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Slipper[]>([]);
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
  // Preview URLs for newly selected files
  const [singleImagePreview, setSingleImagePreview] = useState<string | null>(null);
  const [multiImagePreviews, setMultiImagePreviews] = useState<string[]>([]);
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

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (singleImagePreview) {
        URL.revokeObjectURL(singleImagePreview);
      }
      multiImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [singleImagePreview, multiImagePreviews]);

  // Debounced search removed

  const fetchProducts = useCallback(async (bypassCache = false) => {
    try {
      setIsLoading(true);
      const params = {
        ...filters,
        include_images: true,
      };

      const response = await modernApiClient.get(
        API_ENDPOINTS.SLIPPERS,
        params,
        { cache: !bypassCache, force: bypassCache } // Force fresh data when needed
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

          const list: Slipper[] = Array.isArray(productsData) ? (productsData as Slipper[]) : [];
          
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
  toast.error(t('admin.products.toasts.loadError'), { autoClose: 2000 });
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, t]);

  // Force complete refresh of product data
  const forceRefreshProducts = useCallback(async () => {
    console.log("Forcing complete product refresh...");
    
    // Clear all related cache entries to ensure all pages get fresh data
    modernApiClient.clearCache("/slippers"); // Clears all cache entries that contain "/slippers"
    modernApiClient.clearCache("/slipper"); // Individual product cache
    modernApiClient.clearCache("/images"); // Image cache
    
    // Wait for any pending operations
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Force fetch with cache bypass
    await fetchProducts(true);
    
    console.log("Product refresh completed");
  }, [fetchProducts]);


  useEffect(() => {
    fetchProducts(false); // Use cache for initial load
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
    
    // Store original product data for potential restoration
    const originalProduct = products.find(p => p.id === productId);
    const originalIndex = products.findIndex(p => p.id === productId);
    
    try {
      // Immediately remove from UI for instant feedback
      setProducts(prev => prev.filter(p => p.id !== productId));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      
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
      
      toast.success(t('admin.products.toasts.deleteSuccess'), { autoClose: 2000 });
      
      // Clear cache to ensure consistency across all pages and parameters
      modernApiClient.clearCache("/slippers"); // Clears all cache entries that contain "/slippers"
      modernApiClient.clearCache("/slipper"); // Individual product cache  
      
      // Adjust page if last item removed
      if (currentCount === 1 && pagination.page > 1) {
        handlePageChange(pagination.page - 1);
      }
      
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 404) {
        toast.warn(t('admin.products.toasts.deleteAlreadyRemoved'), { autoClose: 2000 });
        // Keep the product removed from UI since it's already gone from backend
        modernApiClient.clearCache("/slippers"); // Clears all cache entries that contain "/slippers"
        modernApiClient.clearCache("/slipper"); // Individual product cache
      } else {
        toast.error(t('admin.products.toasts.deleteError'), { autoClose: 2000 });
        // Restore the product in UI if delete failed
        if (originalProduct) {
          setProducts(prev => {
            const newList = [...prev];
            // Restore to original position
            if (originalIndex !== -1 && originalIndex < newList.length) {
              newList.splice(originalIndex, 0, originalProduct);
            } else {
              newList.unshift(originalProduct); // Add to beginning if position unknown
            }
            return newList;
          });
          setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        } else {
          // If we don't have the product data locally, refresh from server
          fetchProducts(true).catch(console.error);
        }
      }
    }
  }, [confirm, pagination.page, handlePageChange, products, t, fetchProducts]);

  const resetForm = () => {
    setFormData({
      name: "",
      size: "",
      price: "",
      quantity: "",
      is_available: true,
    });
    setEditingProduct(null);
    setSingleImageFile(null);
    setMultiImageFiles(null);
    setEditingImages([]);
    // Clean up preview URLs
    if (singleImagePreview) {
      URL.revokeObjectURL(singleImagePreview);
      setSingleImagePreview(null);
    }
    multiImagePreviews.forEach(url => URL.revokeObjectURL(url));
    setMultiImagePreviews([]);
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

  // Prevent stacked refresh loops; optional flag to skip forced fetch
  const refreshLockRef = useRef(false);

  const closeModal = (skipRefresh: boolean = false) => {
    try {
      setShowModal(false);
      resetForm();
      
      if (!skipRefresh) {
        modernApiClient.clearCache("/slippers");
        // Debounce / lock to avoid loops if multiple closeModal calls happen rapidly
        if (!refreshLockRef.current) {
          refreshLockRef.current = true;
          setTimeout(() => {
            fetchProducts(true).catch((error) => {
              console.error("Error refreshing products after modal close:", error);
            }).finally(() => {
              // release lock after a short delay
              setTimeout(() => { refreshLockRef.current = false; }, 300);
            });
          }, 80);
        }
      }
    } catch (error) {
      console.error("Error in closeModal:", error);
      // Ensure modal still closes even if there's an error
      setShowModal(false);
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
      const resp = await modernApiClient.get(API_ENDPOINTS.SLIPPER_IMAGES(slipperId), undefined, { cache: false });
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
  interface CreatedWrap { data?: Slipper; [k: string]: unknown }
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
      if (productId && (singleImageFile || (multiImageFiles && multiImageFiles.length))) {
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
                fetchProducts(true).finally(() => setTimeout(() => { refreshLockRef.current = false; }, 300));
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
          fetchProducts(true).finally(() => setTimeout(() => { refreshLockRef.current = false; }, 300));
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

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, part
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUploads = async (id: number) => {
    try {
      setUploading(true);
      setUploadProgress(null);
      let uploadSuccess = false;
      
      // Check file sizes and formats first
      const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024; // 10MB max original size
      
      // Supported image formats (very comprehensive list)
      const SUPPORTED_FORMATS = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'image/bmp', 'image/tiff', 'image/tif', 'image/svg+xml', 'image/avif',
        'image/heic', 'image/heif', 'image/ico', 'image/x-icon'
      ];
      
      const validateImageFile = (file: File, index?: number): boolean => {
        const fileLabel = index !== undefined ? `Image ${index + 1}` : 'Image';
        
        // Check file size
        if (file.size > MAX_ORIGINAL_SIZE) {
          console.warn(`${fileLabel} is too large (${Math.round(file.size / 1024 / 1024)}MB). Skipping this file.`);
          // Don't show toast error to admin - just log and skip
          return false;
        }
        
        // Check file format - be very permissive
        if (!SUPPORTED_FORMATS.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
          console.warn(`${fileLabel} has unsupported format: ${file.type}. Attempting upload anyway...`);
          // Don't block upload, just warn - let the backend decide
        }
        
        return true;
      };
      
      if (singleImageFile && !validateImageFile(singleImageFile)) {
        return;
      }
      
      if (multiImageFiles) {
        for (let i = 0; i < multiImageFiles.length; i++) {
          if (!validateImageFile(multiImageFiles[i], i)) {
            return;
          }
        }
      }
      
      // Adaptive single image upload with aggressive compression for large files
      if (singleImageFile) {
        console.log(`Attempting to upload single image for product ${id}:`, {
          fileName: singleImageFile.name,
          fileSize: singleImageFile.size,
          fileType: singleImageFile.type
        });
        
        // Compress image more aggressively if it's large
        const TARGET_SIZE = 500 * 1024; // 500KB target
        let processedFile = singleImageFile;
        
        if (singleImageFile.size > TARGET_SIZE) {
          console.log(`File is large (${Math.round(singleImageFile.size / 1024)}KB), compressing...`);
          try {
            processedFile = await prepareImageForUpload(singleImageFile, 0.6, 1200); // More aggressive compression
            console.log(`Compressed from ${Math.round(singleImageFile.size / 1024)}KB to ${Math.round(processedFile.size / 1024)}KB`);
          } catch (compressionError) {
            console.error('Compression failed:', compressionError);
            toast.error('Failed to compress image. Please try a smaller image.', { autoClose: 2000 });
            return;
          }
        }
        
        const singleFieldCandidates = [
          "file",        // Most common
          "image",       // Standard 
          "upload",      // Generic
          "media",       // Media upload
          "attachment",  // Attachment style
          "photo",       // Photo specific
          "image_file",  // Underscored
          "picture",     // Alternative
          "data"         // Generic data
        ]; // broaden accepted field names
        
        let singleSuccess = false;
        let lastError: Error | null = null;
        
        for (const field of singleFieldCandidates) {
          // Try with just the file first
          let fd = new FormData();
          fd.append(field, processedFile);
          
          // Debug: log what we're actually sending
          console.log(`Creating FormData with:`, {
            fieldName: field,
            fileName: processedFile.name,
            fileSize: processedFile.size,
            fileType: processedFile.type,
            lastModified: processedFile.lastModified
          });
          
          try {
            console.log(`Trying field name: "${field}" for single image upload (${Math.round(processedFile.size / 1024)}KB)`);
            await uploadWithStrategies(API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id), fd, t('admin.products.images.single'));
            console.log(`Successfully uploaded with field name: "${field}"`);
            singleSuccess = true;
            uploadSuccess = true;
            break;
          } catch (err) {
            console.log(`Failed with field name "${field}":`, err);
            const errorMsg = (err as Error).message;
            
            // If it's a parsing error, try converting to base64 approach
            if (errorMsg.includes('parsing the body') || errorMsg.includes('parsing') || errorMsg.includes('process the image')) {
              console.log(`Parsing error with "${field}", trying base64 approach...`);
              try {
                // Convert file to base64 and send as JSON
                const base64 = await fileToBase64(processedFile);
                const jsonData = {
                  [field]: base64,
                  filename: processedFile.name,
                  content_type: processedFile.type,
                  size: processedFile.size
                };
                
                await modernApiClient.post(API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id), jsonData);
                console.log(`Successfully uploaded with base64 using field: "${field}"`);
                singleSuccess = true;
                uploadSuccess = true;
                break;
              } catch (base64Err) {
                console.error(`Base64 approach also failed for "${field}":`, base64Err);
              }
              
              // Try with minimal FormData and different Content-Type handling
              try {
                console.log(`Trying with custom headers for "${field}"...`);
                fd = new FormData();
                fd.append(field, processedFile, processedFile.name);
                
                // Try direct fetch with different approach
                const response = await fetch(`/api/proxy?endpoint=${encodeURIComponent(API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id))}`, {
                  method: 'POST',
                  body: fd
                  // Let browser set Content-Type automatically
                });
                
                if (response.ok) {
                  console.log(`Successfully uploaded with direct fetch using field: "${field}"`);
                  singleSuccess = true;
                  uploadSuccess = true;
                  break;
                } else {
                  const errorText = await response.text();
                  console.error(`Direct fetch failed: ${response.status} - ${errorText}`);
                }
              } catch (directErr) {
                console.error(`Direct fetch approach also failed for "${field}":`, directErr);
              }
            }
            
            console.error(`Field "${field}" failed:`, errorMsg);
            
            // If still getting 413, try even more aggressive compression
            if (errorMsg.includes('413') || errorMsg.includes('Payload Too Large')) {
              console.log('Got 413 error, trying more aggressive compression...');
              try {
                const superCompressed = await prepareImageForUpload(singleImageFile, 0.4, 800);
                console.log(`Super compressed to ${Math.round(superCompressed.size / 1024)}KB`);
                
                const fd2 = new FormData();
                fd2.append(field, superCompressed);
                await uploadWithStrategies(API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id), fd2, t('admin.products.images.single'));
                console.log(`Successfully uploaded with super compression using field: "${field}"`);
                singleSuccess = true;
                uploadSuccess = true;
                break;
              } catch (superCompressionError) {
                console.error('Super compression also failed:', superCompressionError);
              }
            }
            
            // Show detailed error for the first field attempt to help debugging
            if (field === singleFieldCandidates[0]) {
              console.warn(`Upload failed with primary field "${field}": ${errorMsg}`);
              // Don't show toast errors to admin - just log them
            }
            
            lastError = err as Error;
          }
        }
        if (!singleSuccess && lastError) {
          console.error('All single image upload attempts failed:', lastError);
          // Don't throw error - just log it. Product creation should not fail because of image upload.
          console.warn('Image upload failed but continuing with product creation/update.');
        }
      }
      // Multiple images: Try bulk upload first, fallback to individual uploads if needed
      if (multiImageFiles && multiImageFiles.length) {
        const originals = Array.from(multiImageFiles);
        const total = originals.length;
        setUploadProgress({ current: 0, total });

        // Pre-compress all files in parallel
        const compressed: File[] = await Promise.all(
          originals.map((f) => prepareImageForUpload(f, 0.5, 1000))
        );

        console.log(`Attempting bulk upload of ${compressed.length} images for product ${id}`);
        
        // Try bulk upload first (all images in one request to /upload-images endpoint)
        const bulkFieldCandidates = ["images", "files", "photos", "uploads", "media"];
        let bulkSuccess = false;
        
        for (const field of bulkFieldCandidates) {
          try {
            const fd = new FormData();
            
            // Add all files with the same field name (backend expects array)
            compressed.forEach((file) => {
              fd.append(field, file);
            });
            
            console.log(`Trying bulk upload with field name: "${field}" (${compressed.length} files)`);
            await uploadWithStrategies(
              API_ENDPOINTS.SLIPPER_UPLOAD_IMAGES(id), // Use the multiple images endpoint
              fd,
              `${t('admin.products.images.multiple')} (${compressed.length} files)`
            );
            
            console.log(`Successfully uploaded ${compressed.length} images with bulk field: "${field}"`);
            bulkSuccess = true;
            uploadSuccess = true;
            setUploadProgress({ current: compressed.length, total });
            break;
            
          } catch (err) {
            console.log(`Bulk upload failed with field "${field}":`, err);
            
            // If it's a parsing error, try adding metadata
            const errorMsg = (err as Error).message;
            if (errorMsg.includes('parsing the body') || errorMsg.includes('parsing')) {
              console.log(`Parsing error with "${field}", trying bulk upload with metadata...`);
              try {
                const fd = new FormData();
                compressed.forEach((file, index) => {
                  fd.append(field, file);
                  // Add metadata for each file
                  fd.append(`is_primary_${index}`, index === 0 ? 'true' : 'false');
                  fd.append(`alt_text_${index}`, file.name.replace(/\.[^/.]+$/, ""));
                });
                
                await uploadWithStrategies(
                  API_ENDPOINTS.SLIPPER_UPLOAD_IMAGES(id),
                  fd,
                  `${t('admin.products.images.multiple')} (${compressed.length} files with metadata)`
                );
                console.log(`Successfully uploaded ${compressed.length} images with metadata using field: "${field}"`);
                bulkSuccess = true;
                uploadSuccess = true;
                setUploadProgress({ current: compressed.length, total });
                break;
              } catch (metadataErr) {
                console.error(`Metadata approach also failed for bulk field "${field}":`, metadataErr);
              }
            }
          }
        }
        
        // If bulk upload failed, fallback to individual uploads using single image endpoint
        if (!bulkSuccess) {
          console.log("Bulk upload failed, falling back to individual uploads...");
          
          const CONCURRENCY = 2;
          let index = 0;
          let completed = 0;
          let lastError: Error | null = null;
          const individualFieldCandidates = ["image", "file", "photo", "upload", "media"];

          const next = async (): Promise<void> => {
            const i = index++;
            if (i >= compressed.length) return;
            const original = originals[i];
            let file = compressed[i];
            let uploaded = false;
            let attemptErr: Error | null = null;
            
            for (const field of individualFieldCandidates) {
              const fd = new FormData();
              fd.append(field, file);
              try {
                await uploadWithStrategies(
                  API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id), // Use single image endpoint for individual uploads
                  fd,
                  `${t('admin.products.images.single')} ${i + 1}`
                );
                uploaded = true;
                uploadSuccess = true;
                break;
              } catch (e) {
                // If 413 try harder compression one time
                if ((e as Error).message && ((e as Error).message.includes("413") || (e as Error).message.includes("Payload Too Large"))) {
                  console.log(`Got 413 for image ${i + 1}, trying super compression...`);
                  try {
                    file = await prepareImageForUpload(original, 0.3, 800);
                    console.log(`Super compressed image ${i + 1} to ${Math.round(file.size / 1024)}KB`);
                    const fd2 = new FormData();
                    fd2.append(field, file);
                    await uploadWithStrategies(
                      API_ENDPOINTS.SLIPPER_UPLOAD_IMAGE(id),
                      fd2,
                      `${t('admin.products.images.single')} ${i + 1}`
                    );
                    uploaded = true;
                    uploadSuccess = true;
                    break;
                  } catch (superErr) {
                    console.error(`Super compression failed for image ${i + 1}:`, superErr);
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
          
  if (lastError && completed === 0) {
            console.error('All individual image uploads failed:', lastError);
            console.warn('Multiple image upload failed but continuing with product operation.');
            // Don't throw - just log the failure
          } else if (completed > 0) {
            console.log(`${completed} of ${total} images uploaded successfully`);
            // Don't show success toast to admin - just log it
          }
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
                image_url: img.image_url,
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
          // Fallback to the regular refresh
          await forceRefreshProducts();
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
        setSingleImageFile(null);
        setMultiImageFiles(null);
        setUploadProgress(null);
        
        // Clean up preview URLs safely
        if (singleImagePreview) {
          try {
            URL.revokeObjectURL(singleImagePreview);
          } catch (urlError) {
            console.error('Error revoking single image URL:', urlError);
          }
          setSingleImagePreview(null);
        }
        
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

  // Advanced helper: try various strategies (methods + toggle trailing slash)
  const uploadWithStrategies = async (endpoint: string, formData: FormData, label: string) => {
    console.log(`Starting upload with strategies for: ${label}`, {
      endpoint,
      formDataKeys: Array.from(formData.keys())
    });
    
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
    
    // Prioritize correct upload endpoints first, avoid wrong ones
    if (/upload-image/i.test(endpoint)) {
      // For single image uploads, try variations
      pushVariant(endpoint.replace(/upload-image/i, "upload-images"));
      // Skip the problematic /images/ endpoint that gives 405
      // pushVariant(endpoint.replace(/upload-image/i, "images")); // REMOVED - causes 405
      pushVariant(endpoint.replace(/\/upload-image\//i, "/upload/"));
      pushVariant(endpoint.replace(/\/upload-image\//i, "/image/"));
    }
    if (/upload-images/i.test(endpoint)) {
      // For multiple image uploads, try variations
      pushVariant(endpoint.replace(/upload-images/i, "upload-image"));
      // Skip the problematic /images/ endpoint that gives 405
      // pushVariant(endpoint.replace(/upload-images/i, "images")); // REMOVED - causes 405
      pushVariant(endpoint.replace(/\/upload-images\//i, "/upload/"));
      pushVariant(endpoint.replace(/\/upload-images\//i, "/image/"));
    }
    const variants = Array.from(variantSet.values());

    const token = Cookies.get("access_token");
    const headers: Record<string, string> = { 
      Accept: "application/json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    // IMPORTANT: Don't set Content-Type for FormData - let browser set it with proper boundary

  let firstError: Error | null = null;
    for (const ep of variants) {
      for (const method of baseMethods) {
        try {
          console.log(`Trying upload - Method: ${method}, Endpoint: ${ep}`);
          console.log(`Full URL will be: ${window.location.origin}/api/proxy?endpoint=${encodeURIComponent(ep)}`);
          const url = `/api/proxy?endpoint=${encodeURIComponent(ep)}`;
          
          // Rebuild form data each attempt - ensure clean FormData
          const fresh = new FormData();
          for (const [k, v] of (formData as FormData).entries()) {
            fresh.append(k, v as File | string | Blob);
            console.log(`Form data entry: ${k} = ${v instanceof File ? `File(${v.name}, ${v.size}b, ${v.type})` : v}`);
          }
          
          const res = await fetch(url, { 
            method, 
            body: fresh, 
            headers // No Content-Type header - let browser handle it
          });
          if (!res.ok) {
            let detail = "";
            try {
              const ct = res.headers.get("content-type") || "";
              if (ct.includes("application/json")) {
                const j = await res.json();
                detail = j.message || j.detail || j.error || JSON.stringify(j);
                console.log(`Upload failed with JSON response:`, j);
              } else {
                detail = (await res.text()) || "";
                console.log(`Upload failed with text response:`, detail);
              }
            } catch (parseErr) {
              console.log("Could not parse error response:", parseErr);
            }
            const msg = detail || `Ошибка загрузки ${label} (status ${res.status})`;
            console.error(`Upload failed - Method: ${method}, Endpoint: ${ep}, Status: ${res.status}, Detail: ${detail}`);
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

  // Adaptive compression pipeline: aim for <500KB per image with multiple passes
  const prepareImageForUpload = async (
    file: File,
    initialQuality = 0.6,
    initialMaxDim = 1200
  ): Promise<File> => {
    const TARGET_BYTES = 500 * 1024; // Reduced to 500KB
    const MIN_QUALITY = 0.2; // Lower minimum quality
    if (file.size <= TARGET_BYTES) return file;

    const steps: Array<{ q: number; max: number }> = [
      { q: initialQuality, max: initialMaxDim },
      { q: 0.5, max: 1100 },
      { q: 0.4, max: 1000 },
      { q: 0.35, max: 900 },
      { q: 0.3, max: 800 },
      { q: 0.25, max: 700 },
      { q: 0.2, max: 600 },
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
        
        // Determine output format - preserve original format when possible
        let outputMimeType = current.type;
        let outputExtension = "";
        const outputQuality = Math.max(MIN_QUALITY, q);
        
        // Map MIME types to file extensions and determine if quality is supported
        const formatMap: Record<string, { ext: string; supportsQuality: boolean }> = {
          "image/jpeg": { ext: ".jpg", supportsQuality: true },
          "image/jpg": { ext: ".jpg", supportsQuality: true },
          "image/png": { ext: ".png", supportsQuality: false },
          "image/webp": { ext: ".webp", supportsQuality: true },
          "image/gif": { ext: ".gif", supportsQuality: false },
          "image/bmp": { ext: ".bmp", supportsQuality: false },
          "image/tiff": { ext: ".tiff", supportsQuality: false },
          "image/svg+xml": { ext: ".svg", supportsQuality: false }
        };
        
        const format = formatMap[current.type.toLowerCase()];
        if (format) {
          outputExtension = format.ext;
          // For formats that don't support quality, use JPEG for compression
          if (!format.supportsQuality && current.size > TARGET_BYTES) {
            outputMimeType = "image/jpeg";
            outputExtension = ".jpg";
          }
        } else {
          // Unknown format, default to JPEG for compression
          outputMimeType = "image/jpeg";
          outputExtension = ".jpg";
        }
        
        const blob: Blob = await new Promise((res) =>
          canvas.toBlob(
            (b) => res(b || current),
            outputMimeType,
            format?.supportsQuality ? outputQuality : undefined
          )
        );
        
        if (blob.size < current.size) {
          // Update filename extension if format changed
          let newName = current.name;
          if (outputMimeType !== current.type) {
            newName = current.name.replace(/\.[^.]+$/i, outputExtension);
          }
          
          current = new File([blob], newName, { type: outputMimeType });
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
              className="bg-white rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => closeModal()}
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t('admin.products.images.single')}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSingleImageFile(file);
                          // Create preview URL
                          if (singleImagePreview) {
                            URL.revokeObjectURL(singleImagePreview);
                          }
                          if (file) {
                            setSingleImagePreview(URL.createObjectURL(file));
                          } else {
                            setSingleImagePreview(null);
                          }
                        }}
                        className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                      />
                      {singleImageFile && (
                        <div className="mt-2 space-y-2">
                          <div className="text-xs text-gray-500">
                            <p className="truncate">{singleImageFile.name}</p>
                            <p className={`${singleImageFile.size > 2 * 1024 * 1024 ? 'text-orange-600' : 'text-gray-500'}`}>
                              Size: {Math.round(singleImageFile.size / 1024)}KB
                              {singleImageFile.size > 2 * 1024 * 1024 && ' (will be compressed)'}
                            </p>
                          </div>
                          {singleImagePreview && (
                            <div className="relative w-20 h-20 border rounded overflow-hidden bg-gray-50">
                              <Image
                                src={singleImagePreview}
                                alt="Preview"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                        </div>
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
