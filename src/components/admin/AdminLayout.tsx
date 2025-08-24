"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { BarChart3, Users, Package, ShoppingCart, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

interface AdminLayoutProps {
  children: React.ReactNode;
}

type TFunc = (k: string, vars?: Record<string, string | number>) => string;
const adminNavigation = (t: TFunc) => [
  { name: t('admin.nav.home'), href: "/admin", icon: BarChart3 },
  { name: t('admin.nav.users'), href: "/admin/users", icon: Users },
  { name: t('admin.nav.products'), href: "/admin/products", icon: Package },
  { name: t('admin.nav.orders'), href: "/admin/orders", icon: ShoppingCart },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium">{t('admin.header.backToSite')}</span>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                {t('admin.header.title')}
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              {t('admin.header.welcome', { name: user.name })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="py-8">
              <nav className="space-y-1">
                {adminNavigation(t).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 py-8 pl-8">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
