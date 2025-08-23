import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
  }).format(price);
};

export const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const debounce = <F extends (...args: never[]) => void>(
  func: F,
  delay: number
): F => {
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: Parameters<F>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  }) as F;
};

export const getFullImageUrl = (imageUrl: string): string => {
  if (!imageUrl) {
    return "/placeholder-product.svg";
  }

  // If the URL already starts with http/https, return as is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // Otherwise, prepend the backend URL
  return `https://oyoqkiyim.duckdns.org${imageUrl}`;
};
