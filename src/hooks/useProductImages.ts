import { useState, useCallback } from 'react';
import modernApiClient from '@/lib/modernApiClient';
import { API_ENDPOINTS } from '@/lib/constants';
import { Slipper } from '@/types';
import { toast } from 'react-toastify';
import { getFullImageUrl } from '@/lib/utils';

interface ImageRecord { id: number; image_url: string; is_primary?: boolean; alt_text?: string }

export function useProductImages(
  editingProduct: Slipper | null,
  setProducts: React.Dispatch<React.SetStateAction<Slipper[]>>,
  t: (k: string, vars?: Record<string,string>) => string
) {
  const [editingImages, setEditingImages] = useState<ImageRecord[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [deletingImageIds, setDeletingImageIds] = useState<number[]>([]);

  const fetchEditingImages = useCallback(async (slipperId: number) => {
    setEditingImages([]);
    try {
      setLoadingImages(true);
      modernApiClient.clearCache(API_ENDPOINTS.SLIPPER_IMAGES(slipperId));
      const resp = await modernApiClient.get(API_ENDPOINTS.SLIPPER_IMAGES(slipperId), undefined, { cache: false });
      const data = ((resp as { data?: ImageRecord[] })?.data || resp) as ImageRecord[];
      if (Array.isArray(data)) {
        setEditingImages(data.map(d => ({ id: d.id, image_url: d.image_url, is_primary: d.is_primary, alt_text: d.alt_text })));
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      toast.error(t('admin.products.images.loadError'), { autoClose: 2000 });
    } finally {
      setLoadingImages(false);
    }
  }, [t]);

  const handleDeleteExistingImage = useCallback(async (imageId: number) => {
    if (!editingProduct) return;
    try {
      setDeletingImageIds(ids => [...ids, imageId]);
      await modernApiClient.delete(API_ENDPOINTS.SLIPPER_DELETE_IMAGE(editingProduct.id, imageId));
      setEditingImages(imgs => imgs.filter(i => i.id !== imageId));
      toast.success(t('admin.products.images.deleteSuccess'), { autoClose: 2000 });
      modernApiClient.clearCache('/slippers');
      setProducts(current => current.map(p => p.id === editingProduct.id ? { ...p, images: (p.images||[]).filter(i => i.id !== imageId) } : p));
    } catch {
      toast.error(t('admin.products.images.deleteError'), { autoClose: 2000 });
    } finally {
      setDeletingImageIds(ids => ids.filter(id => id !== imageId));
    }
  }, [editingProduct, setProducts, t]);

  const handleSetPrimaryImage = useCallback(async (imageId: number) => {
    if (!editingProduct) return;
    try {
      await modernApiClient.put(API_ENDPOINTS.SLIPPER_UPDATE_IMAGE(editingProduct.id, imageId), { is_primary: true });
      setEditingImages(imgs => imgs.map(img => ({ ...img, is_primary: img.id === imageId })));
      toast.success(t('admin.products.images.primarySuccess'), { autoClose: 2000 });
      modernApiClient.clearCache('/slippers');
      setProducts(current => current.map(p => p.id === editingProduct.id ? { ...p, images: (p.images||[]).map(i => ({ ...i, is_primary: i.id === imageId })) } : p));
    } catch {
      toast.error(t('admin.products.images.primaryError'), { autoClose: 2000 });
    }
  }, [editingProduct, setProducts, t]);

  return { editingImages, loadingImages, deletingImageIds, fetchEditingImages, handleDeleteExistingImage, handleSetPrimaryImage, getFullImageUrl };
}

export default useProductImages;
