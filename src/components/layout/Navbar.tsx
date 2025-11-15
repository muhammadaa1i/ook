"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  Menu,
  X,
  User,
  ShoppingCart,
  Settings,
  LogOut,
  Home,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/i18n";

const Navbar = React.memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { t, locale, setLocale } = useI18n();
  const confirm = useConfirm();
  const { user, logout, isAuthenticated } = useAuth();
  const { distinctCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  // Memoize admin status
  const isAdmin = useMemo(() => user?.is_admin || false, [user?.is_admin]);
  // Check if current path is admin
  const isAdminPage = pathname?.startsWith("/admin");

  // Memoize navigation items
  const navigation = useMemo(() => {
    const baseNavigation = [
      { name: t('common.home'), href: "/", icon: Home },
      { name: t('common.catalog'), href: "/catalog", icon: Package },
    ];

    const userNavigation: { name: string; href: string; icon: React.ElementType }[] = [];
    // Show "My Orders" for authenticated non-admin users
    if (isAuthenticated && !isAdmin) {
      userNavigation.push({ name: t('home.myOrders'), href: '/orders', icon: Package });
    }

    const adminNavigation = isAdmin
      ? [{ name: t('common.adminPanel'), href: "/admin", icon: Settings }]
      : [];

    return [...baseNavigation, ...userNavigation, ...adminNavigation];
  }, [isAdmin, isAuthenticated, t]);

  // Optimize callbacks with useCallback
  const handleLogout = useCallback(async () => {
    const ok = await confirm({
      title: t('auth.logoutConfirmTitle'),
      message: t('auth.logoutConfirmMessage'),
      confirmText: t('auth.logoutConfirmButton'),
      cancelText: t('common.cancel'),
      variant: "danger",
    });
    if (ok) {
      logout();
      router.push("/");
      setIsMenuOpen(false);
    }
  }, [confirm, logout, router, t]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (isMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [isMenuOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isProfileDropdownOpen && !target.closest('[data-profile-dropdown]')) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileDropdownOpen]);

  // Memoize user greeting
  const userGreeting = useMemo(() => user?.name, [user?.name]);

  // Helper to format cart count (cap at 999+ for layout safety)
  const formatCartCount = useCallback((count: number) => {
    if (count > 999) return "999+";
    if (count > 99) return "99+";
    return String(count);
  }, []);

  // Cart Icon component (desktop & mobile reuse)
  const CartIcon: React.FC<{ mobile?: boolean; onClick?: () => void }> = ({ mobile = false, onClick }) => {
    if (isAdmin || isAdminPage) return null;
    const isActive = pathname === "/cart";
    const baseClasses = cn(
      "relative group flex items-center rounded-md transition-colors focus:border-none",
      mobile
        ? "px-3 py-2 text-base font-medium"
        : "p-2",
      isActive
        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-400/60"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    );
    const iconClasses = cn(
      mobile ? "h-5 w-5" : "h-6 w-6",
      "transition-transform group-hover:scale-105",
      isActive && "scale-105"
    );

    return (
      <Link
        href="/cart"
        aria-label={distinctCount > 0 ? `Корзина: ${distinctCount} позиций` : "Корзина"}
        onClick={onClick}
        className={baseClasses}
      >
        <ShoppingCart className={iconClasses} />
        {distinctCount > 0 && (
          <span
            className={cn(
              "absolute -top-1.5 -right-1.5 min-w-[1.15rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-white text-[10px] font-semibold shadow-md ring-1 ring-white/70 select-none",
              "animate-[fadeIn_120ms_ease-out]"
            )}
          >
            {formatCartCount(distinctCount)}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">  
        <div className="flex justify-between items-center h-16 relative">
          {/* Logo + Tagline */}
          <div className="flex flex-col justify-around items-start min-w-0 flex-1 max-w-[200px]">
            <Link href="/" className="flex items-center space-x-1 sm:space-x-2 min-w-0" suppressHydrationWarning>
              <div className="flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 shrink-0">
                <Image src="/logo.svg" alt={t('brand.name')} width={40} height={40} priority className="object-contain" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold text-gray-900 truncate">{t('brand.name')}</span>
                <span className="text-[10px] sm:text-xs md:text-sm font-serif tracking-widest text-gray-500 mb-0.5 md:mb-1 truncate" style={{ letterSpacing: '0.1em', fontFamily: 'Playfair Display, serif' }}>
                  {t('brand.tagline')}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation (centered) */}
          <div className="hidden md:flex items-center ">
            {navigation.map((item) => {
              // Skip profile from main nav
              if (item.href === "/profile") return null;
              const Icon = item.icon;
              // Check if current path matches (exact match or starts with for admin sections)
              const isActive = item.href === "/admin" 
                ? pathname?.startsWith("/admin") 
                : pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Cart Icon (only for non-admin users and not on admin pages) */}
          </div>

          {/* User Menu + Profile + Language Switcher (desktop) */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 min-w-0">
            <CartIcon />
            {/* Profile dropdown with logout */}
            {isAuthenticated && !isAdmin ? (
              <div className="relative" data-profile-dropdown>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  aria-haspopup="menu"
                  aria-expanded={isProfileDropdownOpen}
                  className={cn(
                    "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-sm font-semibold transition-colors min-w-0",
                    "bg-white border border-blue-200/60 text-gray-700 hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:border-blue-200/60"
                  )}
                >
                  <User className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate max-w-20 sm:max-w-none">{userGreeting || t('common.profile')}</span>
                  <span className={cn("ml-0.5 text-[10px] font-normal text-blue-600/70 transition-transform shrink-0", isProfileDropdownOpen ? "rotate-180" : "")}>▼</span>
                </button>
                {isProfileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 min-w-[180px] max-w-[calc(100vw-2rem)] origin-top-right rounded-xl border border-blue-200/60 bg-white/95 backdrop-blur shadow-lg shadow-blue-100/40 ring-1 ring-black/5 z-50"
                    role="menu"
                    aria-label="Меню профиля"
                  >
                    <div className="py-2 px-2">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:bg-blue-50 focus:text-blue-700 transition-colors"
                        role="menuitem"
                      >
                        <User className="h-4 w-4" />
                        <span>{t('common.profile')}</span>
                      </Link>
                      <div className="my-2 h-px bg-linear-to-r from-transparent via-blue-200/70 to-transparent" />
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:bg-red-50 focus:text-red-700 transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('common.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : isAuthenticated && isAdmin ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="text-gray-600 focus:border-none px-3 py-2 rounded-md text-sm font-medium transition-colors border-2 border-gray-500"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {t('auth.register')}
                </Link>
              </div>
            )}

            {/* Language Switcher (desktop) */}
            <div className="flex items-center space-x-1 ml-1 lg:ml-2">
              {(['ru', 'uz'] as const).map(code => (
                <button
                  key={code}
                  onClick={() => setLocale(code)}
                  className={cn('px-1.5 lg:px-2 py-1 text-xs rounded border transition', locale === code ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100')}
                  aria-pressed={locale === code}
                  aria-label={`Switch language to ${code.toUpperCase()}`}
                >{code.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition duration-150 ease-in-out"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="fixed inset-x-0 top-16 bottom-0 md:hidden z-40" role="dialog" aria-modal="true">
            {/* Overlay (navbar remains visible above) */}
            <div className="absolute inset-0 bg-opacity-10" onClick={closeMenu} />
            {/* Slide-down panel */}
            <div className="relative z-50 max-h-full overflow-y-auto bg-white shadow-xl animate-[fadeIn_120ms_ease-out] px-2 pt-2 pb-4 space-y-1 sm:px-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                // Check if current path matches (exact match or starts with for admin sections)
                const isActive = item.href === "/admin" 
                  ? pathname?.startsWith("/admin") 
                  : pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Cart in Mobile Menu (only for non-admin users and not on admin pages) */}
              {!isAdmin && !isAdminPage && (
                <Link
                  href="/cart"
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors relative",
                    pathname === "/cart"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <span className="relative inline-flex">
                    <ShoppingCart className="h-5 w-5" />
                    {distinctCount > 0 && (
                      <span
                        className={cn(
                          "absolute -top-1.5 -right-1.5 min-w-[1.15rem] h-5 px-1.5 flex items-center justify-center rounded-full",
                          "bg-linear-to-br from-blue-500 to-blue-600 text-white text-[10px] font-semibold shadow-md ring-1 ring-white/70 select-none",
                          "animate-[fadeIn_120ms_ease-out]"
                        )}
                      >
                        {formatCartCount(distinctCount)}
                      </span>
                    )}
                  </span>
                  <span className="select-none">{t('common.cart')}</span>
                </Link>
              )}

              {isAuthenticated ? (
                <div className="border-t pt-3 mt-3">
                  {/* Profile link for mobile */}
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>{t('common.profile')}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              ) : (
                <div className="border-t pt-3 mt-3 space-y-1">
                  <Link
                    href="/auth/login"
                    onClick={closeMenu}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-gray-500"
                  >
                    {t('auth.login')}
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={closeMenu}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {t('auth.register')}
                  </Link>
                </div>
              )}

              {/* Language Switcher (mobile) */}
              <div className="border-t pt-3 mt-3">
                <div className="px-3 flex items-center space-x-2">
                  {(['ru', 'uz'] as const).map(code => (
                    <button
                      key={code}
                      onClick={() => { setLocale(code); }}
                      className={cn('px-3 py-1.5 text-sm rounded-md border font-medium transition w-full text-center', locale === code ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100')}
                      aria-pressed={locale === code}
                      aria-label={`Switch language to ${code.toUpperCase()}`}
                    >{code.toUpperCase()}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
