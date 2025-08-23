"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { TableSkeleton } from "@/components/ui/skeleton";
import { User, SearchParams } from "@/types";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS, PAGINATION } from "@/lib/constants";
import { toast } from "react-toastify";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDate, debounce } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
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
  const [searchTerm, setSearchTerm] = useState("");
  const [adminFilter, setAdminFilter] = useState<boolean | undefined>();

  // Memoize the debounced search function to prevent recreation on every render
  const debouncedSearch = useMemo(
    () =>
      debounce((search: string) => {
        setFilters((prev) => ({
          ...prev,
          search: search || undefined,
          skip: 0, // Reset pagination on search
        }));
      }, 300),
    []
  );

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        ...filters,
        is_admin: adminFilter,
      };

      const response = await modernApiClient.get(API_ENDPOINTS.USERS, params);

      // modernApiClient returns direct data, not axios-wrapped response
      const data = response.data || response;

      // Handle both response structures: {data: [...]} and {items: [...]}
      const usersData = data.items || data.data || data || [];

      setUsers(Array.isArray(usersData) ? usersData : []);
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
      console.error("Error fetching users:", error);
      toast.error("Ошибка загрузки пользователей");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, adminFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handlePageChange = useCallback(
    (page: number) => {
      const skip = (page - 1) * pagination.limit;
      setFilters((prev) => ({ ...prev, skip }));
    },
    [pagination.limit]
  );

  const handleAdminFilterChange = useCallback(
    (isAdmin: boolean | undefined) => {
      setAdminFilter(isAdmin);
      setFilters((prev) => ({
        ...prev,
        is_admin: isAdmin,
        skip: 0, // Reset pagination on filter change
      }));
    },
    []
  );

  const handleDeleteUser = useCallback(
    async (userId: number) => {
      if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) {
        return;
      }

      try {
        await modernApiClient.delete(API_ENDPOINTS.USER_BY_ID(userId));
        toast.success("Пользователь успешно удален");
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Ошибка удаления пользователя");
      }
    },
    [fetchUsers]
  );

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
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
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
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 hover:bg-gray-50"
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
              className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              {pagination.totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Управление пользователями
          </h1>
          <p className="text-gray-600 mt-2">
            Просмотр и управление пользователями системы
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10 pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск по имени, фамилии, телефону..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                disabled={isLoading}
              />
            </div>

            {/* Admin Filter */}
            <select
              value={adminFilter === undefined ? "" : adminFilter.toString()}
              onChange={(e) =>
                handleAdminFilterChange(
                  e.target.value === "" ? undefined : e.target.value === "true"
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={isLoading}
            >
              <option value="">Все пользователи</option>
              <option value="true">Только администраторы</option>
              <option value="false">Только обычные пользователи</option>
            </select>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Найдено пользователей: {pagination.total}</span>
            {pagination.total > 0 && (
              <span>
                Страница {pagination.page} из {pagination.totalPages}
              </span>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={10} cols={6} />
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Пользователь
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Телефон
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Роль
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата регистрации
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(users) &&
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.name} {user.surname}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.phone_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_admin
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {user.is_admin ? "Администратор" : "Пользователь"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.created_at
                              ? formatDate(user.created_at)
                              : "Н/Д"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() =>
                                  alert(`Просмотр пользователя ${user.id}`)
                                }
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Просмотреть"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(
                                    `Редактирование пользователя ${user.id}`
                                  )
                                }
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Редактировать"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id!)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Удалить"
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
              {renderPagination()}
            </>
          ) : (
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Пользователи не найдены
              </h3>
              <p className="text-gray-600">
                Попробуйте изменить параметры поиска или фильтры
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
