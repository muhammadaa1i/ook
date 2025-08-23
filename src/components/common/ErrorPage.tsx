"use client";

import React from "react";
import { RefreshCw, Server, AlertTriangle, Home, Clock } from "lucide-react";

interface ErrorPageProps {
  error: {
    status?: number;
    message?: string;
  };
  onRetry?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error, onRetry }) => {
  const getErrorContent = () => {
    switch (error.status) {
      case 503:
        return {
          icon: <Server className="h-16 w-16 text-orange-500" />,
          title: "Сервер временно недоступен",
          description:
            "Наш сервер сейчас перегружен или проходит техническое обслуживание. Пожалуйста, попробуйте через несколько минут.",
          suggestions: [
            "Подождите 2-3 минуты и попробуйте снова",
            "Проверьте соединение с интернетом",
            "Попробуйте обновить страницу",
          ],
          showRetry: true,
          retryDelay: 60, // seconds
        };

      case 502:
        return {
          icon: <Server className="h-16 w-16 text-red-500" />,
          title: "Ошибка подключения к серверу",
          description:
            "Произошла ошибка при подключении к нашему серверу. Мы уже работаем над устранением проблемы.",
          suggestions: [
            "Попробуйте обновить страницу",
            "Проверьте соединение с интернетом",
            "Попробуйте позже",
          ],
          showRetry: true,
          retryDelay: 30,
        };

      case 500:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-red-500" />,
          title: "Внутренняя ошибка сервера",
          description:
            "На сервере произошла непредвиденная ошибка. Наша команда уже уведомлена и работает над исправлением.",
          suggestions: [
            "Попробуйте обновить страницу",
            "Попробуйте позже",
            "Обратитесь в поддержку, если проблема повторяется",
          ],
          showRetry: true,
          retryDelay: 30,
        };

      case 429:
        return {
          icon: <Clock className="h-16 w-16 text-yellow-500" />,
          title: "Слишком много запросов",
          description:
            "Вы отправили слишком много запросов за короткое время. Пожалуйста, подождите немного.",
          suggestions: [
            "Подождите 1-2 минуты",
            "Попробуйте медленнее взаимодействовать с сайтом",
            "Обновите страницу через минуту",
          ],
          showRetry: true,
          retryDelay: 60,
        };

      default:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-gray-500" />,
          title: "Что-то пошло не так",
          description:
            error.message ||
            "Произошла неизвестная ошибка. Попробуйте позже или обратитесь в поддержку.",
          suggestions: [
            "Попробуйте обновить страницу",
            "Проверьте соединение с интернетом",
            "Обратитесь в поддержку",
          ],
          showRetry: true,
          retryDelay: 30,
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-4 rounded-full">{content.icon}</div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {content.title}
        </h1>

        <p className="text-gray-600 mb-6">{content.description}</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Что можно попробовать:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {content.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          {content.showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Попробовать снова</span>
            </button>
          )}

          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Вернуться на главную</span>
          </button>
        </div>

        {error.status && (
          <div className="mt-6 text-xs text-gray-400">
            Код ошибки: {error.status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
