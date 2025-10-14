"use client";
import React, { memo, useCallback } from "react";
import { Slipper } from "@/types";
import { Package, Edit, Trash2 } from "lucide-react";
import { formatPrice, getFullImageUrl } from "@/lib/utils";
import ProductImage from "@/components/admin/products/ProductImage";

interface ProductRowProps {
  product: Slipper;
  onEdit: (p: Slipper) => void;
  onDelete: (id: number) => void;
  onToggleAvailability: (p: Slipper) => void;
  navigate: (id: number) => void;
  imageIndex: number;
  setImageIndex: (productId: number, nextIndex: number) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const ProductRow: React.FC<ProductRowProps> = ({
  product,
  onEdit,
  onDelete,
  onToggleAvailability,
  navigate,
  imageIndex,
  setImageIndex,
  t,
}) => {
  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!product.images || product.images.length === 0) return;
      const list = product.images;
      const safeIdx = ((imageIndex % list.length) + list.length) % list.length;
      setImageIndex(product.id, (safeIdx - 1 + list.length) % list.length);
    },
    [imageIndex, product, setImageIndex]
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!product.images || product.images.length === 0) return;
      const list = product.images;
      const safeIdx = ((imageIndex % list.length) + list.length) % list.length;
      setImageIndex(product.id, (safeIdx + 1) % list.length);
    },
    [imageIndex, product, setImageIndex]
  );

  return (
    <>
      {/* Desktop / md+ table row */}
      <tr
        onClick={() => navigate(product.id)}
        className="hover:bg-gray-50 cursor-pointer hidden md:table-row"
        title={t("admin.products.table.product")}
      >
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 relative group">
            {product.images && product.images.length > 0 ? (
              (() => {
                const list = product.images;
                const safeIdx =
                  ((imageIndex % list.length) + list.length) % list.length;
                const img = list[safeIdx];
                return (
                  <>
                    <ProductImage
                      className="h-12 w-12 rounded-lg object-cover transition-opacity duration-200"
                      src={getFullImageUrl(img.image_path)}
                      alt={product.name}
                      width={48}
                      height={48}
                      productId={product.id}
                    />
                    {list.length > 1 && (
                      <>
                        <button
                          onClick={handlePrev}
                          className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100 transition text-[10px] leading-none"
                          aria-label="Prev image"
                        >
                          ‹
                        </button>
                        <button
                          onClick={handleNext}
                          className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100 transition text-[10px] leading-none"
                          aria-label="Next image"
                        >
                          ›
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5 pb-0.5 opacity-0 group-hover:opacity-100 transition">
                          {list.slice(0, 4).map((_, dotIdx) => (
                            <span
                              key={dotIdx}
                              className={`h-1.5 w-1.5 rounded-full ${
                                dotIdx === safeIdx ? "bg-white" : "bg-white/50"
                              }`}
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
              <ProductImage
                className="h-12 w-12 rounded-lg object-cover"
                src={getFullImageUrl(product.image)}
                alt={product.name}
                width={48}
                height={48}
                productId={product.id}
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
          </div>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden xs:table-cell">
        <div className="text-sm text-gray-900">
          {formatPrice(product.price)}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
        <div className="text-sm text-gray-900">
          {product.size || t("admin.common.unspecified")}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAvailability(product);
          }}
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
            product.is_available !== false
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : "bg-red-100 text-red-700 hover:bg-red-200"
          }`}
          title={t("admin.common.toggleAvailability")}
        >
          {product.is_available !== false
            ? t("admin.products.status.active")
            : t("admin.products.status.inactive")}
        </button>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
            className="text-green-600 hover:text-green-900"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product.id);
            }}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
      </tr>

      {/* Mobile / < md card-style row contained within table semantics */}
      <tr className="md:hidden">
        <td colSpan={5} className="px-3 py-3">
          <div
            className="flex gap-3 rounded-lg hover:bg-gray-50 transition cursor-pointer"
            onClick={() => navigate(product.id)}
            role="button"
            tabIndex={0}
            title={t("admin.products.table.product")}
          >
            <div className="flex-shrink-0 h-14 w-14 relative rounded-md overflow-hidden bg-gray-100">
              {product.images && product.images.length ? (
                (() => {
                  const list = product.images;
                  const safeIdx = ((imageIndex % list.length) + list.length) % list.length;
                  const image = list[safeIdx];
                  return (
                    <div className="relative w-full h-full">
                      <ProductImage
                        src={getFullImageUrl(image.image_path)}
                        alt={product.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                        productId={product.id}
                      />
                    </div>
                  );
                })()
              ) : product.image ? (
                <div className="relative w-full h-full">
                  <ProductImage
                    src={getFullImageUrl(product.image)}
                    alt={product.name}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                    productId={product.id}
                  />
                </div>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAvailability(product);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap ${
                    product.is_available !== false
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.is_available !== false
                    ? t("admin.products.status.active")
                    : t("admin.products.status.inactive")}
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                <span>{formatPrice(product.price)}</span>
                {product.size && <span>{product.size}</span>}
              </div>
              <div className="mt-2 flex items-center gap-3 text-gray-500">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(product);
                  }}
                  className="hover:text-green-600"
                  aria-label={t("admin.products.table.actions")}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(product.id);
                  }}
                  className="hover:text-red-600"
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
};

export default memo(ProductRow);
