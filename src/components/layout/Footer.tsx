"use client";
import React from "react";
import Image from "next/image";
import { useI18n } from "@/i18n";
import { Instagram, Phone, Send } from "lucide-react";
import i1 from '../../../public/payments/i1.png'
import i2 from '../../../public/payments/i2.png'
import i3 from '../../../public/payments/i3.png'

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
            <div className="flex flex-col items-center md:items-start space-y-4">
              {/* Instagram */}
              <div className="flex items-center space-x-3">
                <a
                  href="https://www.instagram.com/velora_shoes.uz?igsh=MW5tZ2RqajNwYTdiYg=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-br from-pink-500 via-red-500 to-yellow-500 text-white hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
                  title="Instagram"
                >
                  <Instagram size={20} />
                </a>
                <p className="text-sm text-gray-500">
                  @velora_shoes.uz
                </p>
              </div>

              {/* Telegram Channel */}
              <div className="flex items-center space-x-3">
                <a
                  href="https://t.me/ElbekoptomEshonguzar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-white hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
                  title="Telegram Channel"
                >
                  <Send size={20} />
                </a>
                <p className="text-sm text-gray-500">
                  @ElbekoptomEshonguzar
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('footer.paymentMethods')}</h4>
            <div className="grid grid-cols-2 gap-2 w-full max-w-44">
              {/* Visa */}
              <div className="flex items-center justify-center hover:shadow-md transition-shadow">
                <Image src="/payments/visa.svg" alt="Visa" width={90} height={50} className="object-contain" />
              </div>
              {/* Mastercard */}
              <div className="flex items-center justify-center hover:shadow-md transition-shadow">
                <Image src="/payments/mastercard.svg" alt="Mastercard" width={90} height={45} className="object-contain" />
              </div>
              {/* UnionPay */}
              <div className="flex items-center justify-center bg-white rounded border border-gray-200 hover:shadow-md transition-shadow">
                <Image src={i3} alt="UnionPay" width={56} height={30} className="object-contain" />
              </div>
              {/* HUMO */}
              <div className="flex items-center justify-center bg-white rounded border border-gray-200 hover:shadow-md transition-shadow">
                <Image src={i1} alt="Humo" width={56} height={30} className="object-contain" />
              </div>
              {/* UZCARD - Centered */}
              <div className="col-span-2 flex items-center justify-center">
                <div className="flex items-center justify-center px-3 bg-white rounded border border-gray-200 hover:shadow-md transition-shadow w-fit">
                  <Image src={i2} alt="Uzcard" width={56} height={30} className="object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            <p className="text-sm text-gray-500">© 2025 Velora Shoes. {t('footer.rights')}</p>
            <span className="hidden md:inline text-gray-300">|</span>
            <a href="/offer" target="_blank" className="text-sm text-blue-600 hover:text-blue-700 underline">
              {t('offer.title')}
            </a>
          </div>
          {/* Developer Credit */}
          <p className="text-xs text-gray-400 mt-3">
            {t('footer.developedByPrefix')}{' '}
            <a
              href="https://t.me/saydullaev_i"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-500"
            >
              Iskandar
            </a>{' '}
            {t('footer.developedBySuffix')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
