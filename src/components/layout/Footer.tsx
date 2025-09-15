"use client";
import React from "react";
import Image from "next/image";
import { useI18n } from "@/i18n";
import { Instagram, Phone, Send } from "lucide-react";

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
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
            <p className="text-gray-600 text-sm max-w-xs">
              {t('brand.description')}
            </p>
          </div>

          {/* Contact Information */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('footer.contactUs')}</h4>
            <div className="space-y-3">
              {/* Phone */}
              <a 
                href="tel:+998950210207" 
                className="flex items-center space-x-3 text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
                  <Phone size={16} className="text-gray-600 group-hover:text-blue-600" />
                </div>
                <span className="text-sm">+998 95 021 02 07</span>
              </a>

              {/* Telegram */}
              <a 
                href="https://t.me/elbek_s101" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-gray-600 hover:text-blue-500 transition-colors group"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
                  <Send size={16} className="text-gray-600 group-hover:text-blue-500" />
                </div>
                <span className="text-sm">@elbek_s101</span>
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('footer.followUs')}</h4>
            <div className="flex space-x-4">
              {/* Instagram */}
              <a 
                href="https://www.instagram.com/velora_shoes.uz?igsh=MW5tZ2RqajNwYTdiYg==" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-white hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
              >
                <Instagram size={20} />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              @velora_shoes.uz
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Velora Shoes. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
