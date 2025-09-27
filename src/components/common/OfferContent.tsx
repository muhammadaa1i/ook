"use client";
import React from "react";
import { useI18n } from "@/i18n";

export default function OfferContent() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-10">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 mb-4 sm:mb-6 leading-tight">
            {t('offerPage.title')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">{t('offerPage.updated')}</p>

          <p className="text-sm sm:text-base text-gray-700 leading-6 sm:leading-7 mb-4 sm:mb-6">{t('offerPage.intro1')}</p>
          <p className="text-sm sm:text-base text-gray-700 leading-6 sm:leading-7 mb-8 sm:mb-10">{t('offerPage.intro2')}</p>

          <section className="mb-8 sm:mb-10">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              {t('offerPage.sections.orderPayment.title')}
            </h2>
            <ol className="list-decimal ml-4 sm:ml-6 space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li>
                {t('offerPage.sections.orderPayment.li1').replace(
                  'https://www.optomoyoqkiyim.uz/',
                  ''
                )}
                {" "}
                <a
                  className="text-blue-600 hover:text-blue-700 underline break-all"
                  href="https://www.optomoyoqkiyim.uz/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.optomoyoqkiyim.uz/
                </a>
              </li>
              <li>{t('offerPage.sections.orderPayment.li2')}</li>
              <li>{t('offerPage.sections.orderPayment.li3')}</li>
            </ol>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              {t('offerPage.sections.returns.title')}
            </h2>
            <ol className="list-decimal ml-4 sm:ml-6 space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li>{t('offerPage.sections.returns.li1')}</li>
              <li>{t('offerPage.sections.returns.li2')}</li>
              <li>{t('offerPage.sections.returns.li3')}</li>
              <li>{t('offerPage.sections.returns.li4')}</li>
            </ol>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              {t('offerPage.sections.delivery.title')}
            </h2>
            <ol className="list-decimal ml-4 sm:ml-6 space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li>{t('offerPage.sections.delivery.li1')}</li>
              <li>{t('offerPage.sections.delivery.li2')}</li>
              <li>{t('offerPage.sections.delivery.li3')}</li>
            </ol>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              {t('offerPage.sections.security.title')}
            </h2>
            <ol className="list-decimal ml-4 sm:ml-6 space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li>{t('offerPage.sections.security.li1')}</li>
              <li>{t('offerPage.sections.security.li2')}</li>
              <li>{t('offerPage.sections.security.li3')}</li>
            </ol>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              {t('offerPage.sections.privacy.title')}
            </h2>
            <ol className="list-decimal ml-4 sm:ml-6 space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li>{t('offerPage.sections.privacy.li1')}</li>
              <li>{t('offerPage.sections.privacy.li2')}</li>
              <li>{t('offerPage.sections.privacy.li3')}</li>
              <li>{t('offerPage.sections.privacy.li4')}</li>
            </ol>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              {t('offerPage.sections.seller.title')}
            </h2>
            <div className="text-sm sm:text-base text-gray-700 leading-6 sm:leading-7 space-y-1 sm:space-y-2">
              <p>{t('offerPage.sections.seller.name')}</p>
              <p>{t('offerPage.sections.seller.inn')}</p>
              <p className="break-words">{t('offerPage.sections.seller.legalAddress')}</p>
              <p className="break-words">{t('offerPage.sections.seller.actualAddress')}</p>
              <p>{t('offerPage.sections.seller.phone')}</p>
              <p className="break-all">{t('offerPage.sections.seller.email')}</p>
            </div>
          </section>

          <div className="mt-8 sm:mt-12 rounded-lg bg-blue-50 border border-blue-200 p-3 sm:p-4 text-sm sm:text-base text-blue-800 leading-6">
            {t('offerPage.notice')}
          </div>
        </div>
      </div>
    </div>
  );
}
