"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Category, SearchParams } from "@/types";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS, PAGINATION } from "@/lib/constants";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Edit, Trash2, Plus, Tag, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/i18n";
import { formatDate } from "@/lib/utils";

export default function AdminCategoriesPage() {
  const { locale } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
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
  // Search removed
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const confirm = useConfirm();

  // Lock body scroll when any modal open
  useEffect(() => {
    if (showCreateModal || editingCategory) {
      const original = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = original;
      };
    }
  }, [showCreateModal, editingCategory]);

  // Debounced search removed

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await modernApiClient.get(
        API_ENDPOINTS.CATEGORIES,
        filters as Record<string, unknown>
      );

      // Handle response data structure
      const data =
        (response as { data?: Category[] })?.data || (response as Category[]);
      const categoriesData = Array.isArray(data)
        ? data
        : (data as { items?: Category[]; data?: Category[] })?.items ||
          (data as { items?: Category[]; data?: Category[] })?.data ||
          [];

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
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
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Ошибка загрузки категорий");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Search effect removed

  const handlePageChange = useCallback(
    (page: number) => {
      const skip = (page - 1) * pagination.limit;
      setFilters((prev) => ({ ...prev, skip }));
    },
    [pagination.limit]
  );

  const handleCreateCategory = useCallback(async () => {
    try {
      await modernApiClient.post(API_ENDPOINTS.CATEGORIES, formData);
      toast.success("Категория успешно создана");
      setShowCreateModal(false);
      setFormData({ name: "", description: "", is_active: true });
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Ошибка создания категории");
    }
  }, [formData, fetchCategories]);

  const handleUpdateCategory = useCallback(async () => {
    if (!editingCategory) return;

    try {
      await modernApiClient.put(
        API_ENDPOINTS.CATEGORY_BY_ID(editingCategory.id),
        formData
      );
      toast.success("Категория успешно обновлена");
      setEditingCategory(null);
      setFormData({ name: "", description: "", is_active: true });
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Ошибка обновления категории");
    }
  }, [editingCategory, formData, fetchCategories]);

  const handleDeleteCategory = useCallback(async (categoryId: number) => {
    const ok = await confirm({
      title: "Удалить категорию",
      message: "Вы уверены, что хотите удалить эту категорию? Это действие нельзя отменить.",
      confirmText: "Удалить",
      cancelText: "Отмена",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await modernApiClient.delete(API_ENDPOINTS.CATEGORY_BY_ID(categoryId));
      toast.success("Категория успешно удалена");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Ошибка удаления категории");
    }
  }, [confirm, fetchCategories]);

  const handleToggleActive = useCallback(
    async (category: Category) => {
      try {
        await modernApiClient.put(API_ENDPOINTS.CATEGORY_BY_ID(category.id), {
          ...category,
          is_active: !category.is_active,
        });
        toast.success("Статус категории обновлен");
        fetchCategories();
      } catch (error) {
        console.error("Error toggling category status:", error);
        toast.error("Ошибка обновления статуса категории");
      }
    },
    [fetchCategories]
  );

  const openEditModal = useCallback((category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      is_active: category.is_active,
    });
  }, []);

  const closeModal = useCallback(() => {
    setShowCreateModal(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "", is_active: true });
  }, []);

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-8">
        <div className="text-sm text-gray-600">
          Показано {categories.length} из {pagination.total} категорий
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

  const renderModal = () => {
    if (!showCreateModal && !editingCategory) return null;

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={closeModal}
      >
        <div
          className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingCategory ? "Редактировать категорию" : "Создать категорию"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите название категории"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Введите описание категории"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Активная категория
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Отмена
            </button>
            <button
              onClick={
                editingCategory ? handleUpdateCategory : handleCreateCategory
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {editingCategory ? "Обновить" : "Создать"}
            </button>
          </div>
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
              Управление категориями
            </h1>
            <p className="text-gray-600 mt-2">
              Просмотр и управление категориями товаров
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>Добавить категорию</span>
          </button>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <TableSkeleton />
          ) : categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Категория
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Tag className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {category.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {category.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {category.description || "Нет описания"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            category.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {category.is_active ? (
                            <Eye className="h-3 w-3 mr-1" />
                          ) : (
                            <EyeOff className="h-3 w-3 mr-1" />
                          )}
                          {category.is_active ? "Активная" : "Неактивная"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(category.created_at, locale)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleToggleActive(category)}
                            className={`${
                              category.is_active
                                ? "text-red-600 hover:text-red-900"
                                : "text-green-600 hover:text-green-900"
                            }`}
                            title={
                              category.is_active
                                ? "Деактивировать"
                                : "Активировать"
                            }
                          >
                            {category.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(category)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
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
              <Tag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Категории не найдены
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Попробуйте изменить параметры поиска или создайте новую
                категорию
              </p>
            </div>
          )}
        </div>

        {renderPagination()}
        {renderModal()}
      </div>
    </AdminLayout>
  );
}
