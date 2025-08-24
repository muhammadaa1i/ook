"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n";


export default function HomePage() {
  const { t } = useI18n();
  return (
    <>
      {/* Modern Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
              {t('home.heroLine1')}
              <br />
              <span className="text-gradient bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                {t('home.heroLine2')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/catalog"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {t('home.viewCatalog')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:!text-blue-600 transition-all duration-200"
              >
                {t('home.myOrders')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
