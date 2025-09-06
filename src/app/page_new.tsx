"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Star, Shield, Truck, Headphones } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { Slipper, Category } from "@/types";
import { apiClient } from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "react-toastify";
import { useI18n } from "@/i18n";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Slipper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsResponse, categoriesResponse] = await Promise.all([
          apiClient.get(API_ENDPOINTS.SLIPPERS, { limit: 8 }),
          apiClient.get(API_ENDPOINTS.CATEGORIES),
        ]);

        setFeaturedProducts(
          productsResponse.data.data || productsResponse.data
        );
        setCategories(categoriesResponse.data.data || categoriesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(t('errors.productsLoad'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const handleViewProduct = (slipper: Slipper) => {
    // Use client-side navigation to preserve app state (including language)
    router.push(`/products/${slipper.id}`);
  };

  const features = [
    { icon: Shield, tKey: 'home.features.quality' },
    { icon: Truck, tKey: 'home.features.delivery' },
    { icon: Headphones, tKey: 'home.features.support' },
    { icon: Star, tKey: 'home.features.customers' },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('home.heroLine1')} {t('home.heroLine2')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              {t('home.heroSubtitleAlt')}
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors"
            >
              {t('home.viewCatalog')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">{t('home.categories')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/catalog?category=${category.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center border border-gray-200 hover:border-blue-300"
            >
              <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
              <p className="text-gray-600">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('home.popularProducts')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('home.popularProductsSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
            : featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                slipper={product}
                onViewDetails={handleViewProduct}
              />
            ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/catalog"
            className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            {t('home.viewAllProducts')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('home.whyChooseUs')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {t(`${feature.tKey}.title`)}
                  </h3>
                  <p className="text-gray-600">{t(`${feature.tKey}.description`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            {t('home.ctaSubtitle')}
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors"
          >
            {t('home.ctaStartShopping')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
