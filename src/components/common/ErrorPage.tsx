"use client";

import React from "react";
import { RefreshCw, Server, AlertTriangle, Home, Clock } from "lucide-react";
import { useI18n } from "@/i18n";

interface ErrorPageProps {
  error: {
    status?: number;
    message?: string;
  };
  onRetry?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error, onRetry }) => {
  const { t } = useI18n();

  // Helper: avoid showing low-level messages like "Failed to fetch"
  const isNoisyNetworkMessage = (msg?: string) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes("failed to fetch") ||
      lower.includes("network error") ||
      lower.includes("load failed")
    );
  };
  const getErrorContent = () => {
    switch (error.status) {
      case 503:
        return {
          icon: <Server className="h-16 w-16 text-orange-500" />,
          title: t("errors.serverUnavailable"),
          description: t("errors.serverUnavailableLong"),
          suggestions: [
            t("errorPage.suggestions.waitFewMinutes"),
            t("errorPage.suggestions.checkConnection"),
            t("errorPage.suggestions.refresh"),
          ],
          showRetry: true,
          retryDelay: 60, // seconds
        };

      case 502:
        return {
          icon: <Server className="h-16 w-16 text-red-500" />,
          title: t("errors.badGateway"),
          description: t("errors.badGatewayLong"),
          suggestions: [
            t("errorPage.suggestions.refresh"),
            t("errorPage.suggestions.checkConnection"),
            t("errorPage.suggestions.tryLater"),
          ],
          showRetry: true,
          retryDelay: 30,
        };

      case 500:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-red-500" />,
          title: t("errors.serverError"),
          description: t("errors.serverErrorLong"),
          suggestions: [
            t("errorPage.suggestions.refresh"),
            t("errorPage.suggestions.tryLater"),
            t("errorPage.suggestions.contactSupport"),
          ],
          showRetry: true,
          retryDelay: 30,
        };

      case 429:
        return {
          icon: <Clock className="h-16 w-16 text-yellow-500" />,
          title: t("errors.tooManyRequests"),
          description: t("errors.tooManyRequestsLong"),
          suggestions: [
            t("errorPage.suggestions.waitFewMinutes"),
            t("errorPage.suggestions.slower"),
            t("errorPage.suggestions.refreshInMinute"),
          ],
          showRetry: true,
          retryDelay: 60,
        };

      default:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-gray-500" />,
          title: t("errorPage.default.title"),
          description: isNoisyNetworkMessage(error.message)
            ? t("errors.serverUnavailableRetry")
            : (error.message && !isNoisyNetworkMessage(error.message)
                ? error.message
                : t("errorPage.default.description")),
          suggestions: [
            t("errorPage.suggestions.refresh"),
            t("errorPage.suggestions.checkConnection"),
            t("errorPage.suggestions.contactSupport"),
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
            {t("errorPage.suggestions.title")}
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {content.suggestions
              .filter((s) => typeof s === 'string' && s.trim().length > 0)
              .map((suggestion, index) => (
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
              <span>{t("errorPage.retry")}</span>
            </button>
          )}

          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>{t("errorPage.goHome")}</span>
          </button>
        </div>

        {error.status && (
          <div className="mt-6 text-xs text-gray-400">
            {t("errorPage.statusCode")}: {error.status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
