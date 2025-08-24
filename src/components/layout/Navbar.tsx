"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
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

const Navbar = React.memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const confirm = useConfirm();
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount, distinctCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  // Memoize admin status
  const isAdmin = useMemo(() => user?.is_admin || false, [user?.is_admin]);
  // Check if current path is admin
  const isAdminPage = pathname?.startsWith("/admin");

  // Memoize navigation items
  const navigation = useMemo(() => {
    const baseNavigation = [
      { name: "Главная", href: "/", icon: Home },
      { name: "Каталог", href: "/catalog", icon: Package },
    ];

  const userNavigation: { name: string; href: string; icon: React.ElementType }[] = [];

    const adminNavigation = isAdmin
      ? [{ name: "Админ панель", href: "/admin", icon: Settings }]
      : [];

    return [...baseNavigation, ...userNavigation, ...adminNavigation];
  }, [isAuthenticated, isAdmin]);

  // Optimize callbacks with useCallback
  const handleLogout = useCallback(async () => {
    const ok = await confirm({
      title: "Выйти из аккаунта?",
      message: "Вы уверены, что хотите завершить сессию?",
      confirmText: "Выйти",
      cancelText: "Отмена",
      variant: "danger",
    });
    if (ok) {
      logout();
      router.push("/");
      setIsMenuOpen(false);
    }
  }, [confirm, logout, router]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

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
      "relative group flex items-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
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
              "absolute -top-1.5 -right-1.5 min-w-[1.15rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[10px] font-semibold shadow-md ring-1 ring-white/70 select-none",
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900">Optom oyoq kiyim</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => {
              // Skip profile from main nav
              if (item.href === "/profile") return null;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu + Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Icon (only for non-admin users and not on admin pages) */}
            <CartIcon />

            {/* Profile dropdown with logout */}
            {isAuthenticated && !isAdmin ? (
              <div className="relative group">
                <button
                  aria-haspopup="menu"
                  aria-expanded="false"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors",
                    "bg-white border border-blue-200/60 text-gray-700 hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  )}
                >
                  <User className="h-4 w-4 text-blue-600" />
                  <span>{userGreeting || "Профиль"}</span>
                  <span className="ml-0.5 text-[10px] font-normal text-blue-600/70 group-hover:text-blue-700">▼</span>
                </button>
                <div
                  className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-blue-200/60 bg-white/95 backdrop-blur shadow-lg shadow-blue-100/40 ring-1 ring-black/5 opacity-0 scale-95 group-hover:scale-100 group-hover:opacity-100 group-focus-within:opacity-100 group-focus-within:scale-100 transition-all z-50 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
                  role="menu"
                  aria-label="Меню профиля"
                >
                  <div className="py-2 px-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:bg-blue-50 focus:text-blue-700 transition-colors"
                      role="menuitem"
                    >
                      <User className="h-4 w-4" />
                      <span>Профиль</span>
                    </Link>
                    <div className="my-2 h-px bg-gradient-to-r from-transparent via-blue-200/70 to-transparent" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:bg-red-50 focus:text-red-700 transition-colors"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Выйти</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : isAuthenticated && isAdmin ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Выйти</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Войти
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Регистрация
                </Link>
              </div>
            )}
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
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors",
                      pathname === item.href
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
              <CartIcon mobile onClick={closeMenu} />

              {isAuthenticated ? (
                <div className="border-t pt-3 mt-3">
                  <div className="px-3 py-2 text-sm text-gray-600">
                    Привет, {userGreeting}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Выйти</span>
                  </button>
                </div>
              ) : (
                <div className="border-t pt-3 mt-3 space-y-1">
                  <Link
                    href="/auth/login"
                    onClick={closeMenu}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={closeMenu}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
