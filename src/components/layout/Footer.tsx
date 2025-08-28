"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/i18n";

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand / Intro */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12">
                <Image src="/logo.svg" alt={t('brand.name')} width={48} height={48} className="object-contain" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 tracking-wide">{t('brand.name')}</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 max-w-xs" />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('common.home')}
                </Link>
              </li>
              <li>
                <a
                  href="/catalog"
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('common.catalog')}
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {t('footer.support')}
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a
                  href="/help"
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('footer.help')}
                </a>
              </li>
              <li>
                <a
                  href="/shipping"
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('footer.shipping')}
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('footer.privacy')}
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <div className="text-sm text-gray-500">
              <p>© 2025 Velora Shoes. {t('footer.rights')}</p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
