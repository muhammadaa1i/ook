"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { BarChart3, Users, Package, ShoppingCart, Home, Menu, X } from "lucide-react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push("/");
    }
  }, [isLoading, user, router]);

  // Lock scroll & ESC close when mobile nav open (must be before returns)
  useEffect(() => {
    const root = document.documentElement;
    if (mobileNavOpen) root.classList.add('overflow-hidden'); else root.classList.remove('overflow-hidden');
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileNavOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); root.classList.remove('overflow-hidden'); };
  }, [mobileNavOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user || !user.is_admin) return null;


  const NavItems = () => (
    <nav className="space-y-1">
      {adminNavigation(t).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileNavOpen(false)}
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Toggle navigation"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(o => !o)}
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <Link
                href="/"
                className="hidden sm:flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium truncate">{t('admin.header.backToSite')}</span>
              </Link>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {t('admin.header.title')}
              </h1>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 truncate max-w-[50%] sm:max-w-none">
              {t('admin.header.welcome', { name: user.name })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile slide-over (always mounted for animation) */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${mobileNavOpen ? '' : 'pointer-events-none'}`}
        aria-modal={mobileNavOpen || undefined}
        role={mobileNavOpen ? 'dialog' : undefined}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${mobileNavOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileNavOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-64 bg-white shadow-lg p-4 overflow-y-auto transform transition-transform duration-300 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-800 text-sm">{t('admin.header.title')}</span>
            <button
              className="p-2 rounded-md hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <NavItems />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row">
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="py-8 sticky top-16">
              <NavItems />
            </div>
          </aside>
          <div className="flex-1 py-6 md:py-8 md:pl-8">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
