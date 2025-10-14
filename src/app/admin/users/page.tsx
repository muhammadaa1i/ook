"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { TableSkeleton } from "@/components/ui/skeleton";
import { User, SearchParams } from "@/types";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n";

export default function AdminUsersPage() {
  const { t, locale } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const PAGE_SIZE = 10;
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<SearchParams>({ skip: 0, limit: PAGE_SIZE });

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await modernApiClient.get(
        API_ENDPOINTS.USERS,
        filters as unknown as Record<string, unknown>
      );
      const data = (response as { data?: User[] })?.data || (response as User[]);
      const usersData = Array.isArray(data)
        ? data
        : (data as { items?: User[]; data?: User[] })?.items ||
          (data as { items?: User[]; data?: User[] })?.data ||
          [];
      setUsers(Array.isArray(usersData) ? usersData : []);

      // meta extraction
      const rawResp: unknown = response;
      const get = (obj: unknown, path: string[]): unknown => {
        return path.reduce<unknown>((acc, key) => {
          if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
            return (acc as Record<string, unknown>)[key];
          }
          return undefined;
        }, obj);
      };
      const candidatePaths: string[][] = [
        ['data','total'], ['total'], ['data','pages_total'], ['data','count'], ['count'], ['data','meta','total'], ['meta','total']
      ];
      let metaTotal: number | undefined = undefined;
      for (const p of candidatePaths) {
        const v = get(rawResp, p);
        if (typeof v === 'number') { metaTotal = v; break; }
      }
      let derivedTotal: number;
      if (typeof metaTotal === 'number') {
        derivedTotal = metaTotal;
      } else if (usersData.length < PAGE_SIZE) {
        derivedTotal = (filters.skip || 0) + usersData.length;
      } else {
        derivedTotal = (filters.skip || 0) + usersData.length + 1;
      }
      const currentPage = Math.floor((filters.skip || 0) / PAGE_SIZE) + 1;
      const totalPages = Math.max(1, Math.ceil(derivedTotal / PAGE_SIZE));
      setPagination({ total: derivedTotal, page: currentPage, limit: PAGE_SIZE, totalPages });
    } catch (e) {
      console.error("Error fetching users:", e);
      toast.error(t('admin.users.toasts.loadError'));
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, t]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handlePageChange = useCallback((page: number) => {
    if (page < 1) return;
    const skip = (page - 1) * PAGE_SIZE;
    setFilters(prev => ({ ...prev, skip }));
  }, [PAGE_SIZE]);

  const renderPagination = () => {
    if (pagination.total === 0) return null;
    const startItem = (pagination.page - 1) * pagination.limit + 1;
    const endItem = Math.min(pagination.page * pagination.limit, pagination.total);
    return (
      <div className="border-t border-gray-200 bg-white">
        <div className="px-4 lg:px-6 py-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-gray-600">
            <span className="font-medium">{startItem}-{endItem} / {pagination.total}</span>
            <span className="hidden md:inline text-gray-400">· {t('admin.users.pagination.page') || 'Sahifa'} {pagination.page}/{pagination.totalPages}</span>
          </div>
          <div className="flex items-center justify-between xl:justify-end gap-3">
            <div className="flex xl:hidden gap-2">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1 || isLoading} className="flex items-center gap-1 px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={t('common.previous') || 'Previous'}>
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('common.previous') || 'Oldingi'}</span>
              </button>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages || isLoading} className="flex items-center gap-1 px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={t('common.next') || 'Next'}>
                <span className="hidden sm:inline">{t('common.next') || 'Keyingi'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="hidden xl:flex items-center gap-2">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1 || isLoading} className="h-10 w-10 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={t('common.previous') || 'Previous'}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              {(() => {
                const total = pagination.totalPages;
                const current = pagination.page;
                const items: (number | 'ellipsis')[] = [];
                if (total <= 7) { for (let p = 1; p <= total; p++) items.push(p); } else {
                  items.push(1);
                  const start = Math.max(2, current - 1);
                  const end = Math.min(total - 1, current + 1);
                  if (start > 2) items.push('ellipsis');
                  for (let p = start; p <= end; p++) items.push(p);
                  if (end < total - 1) items.push('ellipsis');
                  items.push(total);
                }
                return items.map((val, idx) => {
                  if (val === 'ellipsis') return <span key={`e-${idx}`} className="px-2 text-gray-400 select-none">…</span>;
                  const page = val as number; const active = page === current;
                  return <button key={page} onClick={() => handlePageChange(page)} disabled={isLoading} aria-current={active ? 'page' : undefined} className={`h-10 min-w-[2.5rem] px-3 flex items-center justify-center rounded-md border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${active ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>{page}</button>;
                });
              })()}
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages || isLoading} className="h-10 w-10 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={t('common.next') || 'Next'}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.users.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('admin.users.subtitle')}
          </p>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={PAGE_SIZE} cols={4} />
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.table.user')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.table.phone')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.table.role')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.table.registeredAt')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(users) &&
                      users
                        .filter((user) => {
                          // If logged in as admin, hide only your own row
                          if (currentUser?.is_admin && user.id === currentUser.id) {
                            return false;
                          }
                          return true;
                        })
                        .map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.name} {user.surname}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.phone_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.is_admin
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {user.is_admin ? t('admin.users.role.admin') : t('admin.users.role.user')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.created_at
                              ? formatDate(user.created_at, locale)
                              : t('admin.users.dateNA')}
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
                {t('admin.users.empty.title')}
              </h3>
              <p className="text-gray-600">
                {t('admin.users.empty.subtitle')}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
