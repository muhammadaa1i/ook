import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Optom oyoq kiyim
            </h3>
            <p className="text-gray-600 mb-4">
              Качественные тапочки для дома и отдыха. Комфорт и стиль в каждом
              шаге.
            </p>
            <div className="text-sm text-gray-500">
              <p>© 2025 Optom oyoq kiyim. Все права защищены.</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Быстрые ссылки
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600 transition-colors"
                >
                  Главная
                </Link>
              </li>
              <li>
                <a
                  href="/catalog"
                  className="hover:text-blue-600 transition-colors"
                >
                  Каталог
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="hover:text-blue-600 transition-colors"
                >
                  О нас
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="hover:text-blue-600 transition-colors"
                >
                  Контакты
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Поддержка
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a
                  href="/help"
                  className="hover:text-blue-600 transition-colors"
                >
                  Помощь
                </a>
              </li>
              <li>
                <a
                  href="/shipping"
                  className="hover:text-blue-600 transition-colors"
                >
                  Доставка
                </a>
              </li>
              <li>
                <a
                  href="/returns"
                  className="hover:text-blue-600 transition-colors"
                >
                  Возврат
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="hover:text-blue-600 transition-colors"
                >
                  Конфиденциальность
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
