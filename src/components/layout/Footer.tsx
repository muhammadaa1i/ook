"use client";
import React from "react";
import Image from "next/image";
import { useI18n } from "@/i18n";

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Brand / Intro */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12">
              <Image src="/logo.svg" alt={t('brand.name')} width={48} height={48} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-2xl font-serif font-semibold text-gray-900 tracking-wide">{t('brand.name')}</h3>
              <span className="text-xs md:text-sm font-serif tracking-widest text-gray-500 mb-0.5 md:mb-1" style={{ letterSpacing: '0.15em', fontFamily: 'Playfair Display, serif' }}>
                {t('brand.tagline')}
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-6 max-w-xs" />
          <div className="text-sm text-gray-500">
            <p>© 2025 Velora Shoes. {t('footer.rights')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
