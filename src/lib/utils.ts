import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: number, currencyLabel: string = 'сум', locale: string = 'ru-RU') => {
  if (isNaN(price)) return `0 ${currencyLabel}`;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return `${formatted} ${currencyLabel}`;
};

const uzbekMonths = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'
];

export const formatDate = (date: string, locale: string = "ru-RU") => {
  const dateObj = new Date(date);
  
  if (locale === 'uz-UZ' || locale === 'uz') {
    const day = dateObj.getDate();
    const month = uzbekMonths[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year} yil ${hours}:${minutes}`;
  }
  
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
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

export const getFullImageUrl = (imageUrl?: string): string => { 
  if (!imageUrl) return "/placeholder-product.svg";
  return imageUrl.startsWith("http")
    ? imageUrl
    : `https://oyoqkiyim.duckdns.org${imageUrl}`;
}

// Extract human-friendly validation / API error message from various backend shapes
export function extractErrorMessage(payload: unknown, fallback = "Error"): string {
  if (!payload || typeof payload !== "object") return fallback;
  // Fast path: plain detail string
  if (typeof (payload as { detail?: unknown }).detail === "string") return (payload as { detail: string }).detail;
  // FastAPI / Pydantic style: detail is an array of objects with loc/msg
  if (Array.isArray((payload as { detail?: unknown }).detail)) {
    const friendlyField = (raw: string) => {
      const map: Record<string, string> = {
        name: 'name',
        surname: 'surname',
        phone_number: 'phone number',
        password: 'password',
        confirm_password: 'confirm password',
        username: 'username',
      };
      return map[raw] || raw;
    };

    const msgs: string[] = [];
    interface DetailItem { loc?: unknown[]; msg?: unknown; message?: unknown; detail?: unknown }
    for (const rawItem of (payload as { detail: unknown[] }).detail) {
      const item = rawItem as DetailItem;
      if (!item || typeof item !== "object") continue;
      const loc = Array.isArray(item.loc) ? item.loc : [];
      // Usually loc like ["body", "field_name"] or ["body", "field", 0, "subfield"]
      const field = loc.find((l): l is string => typeof l === "string" && l !== "body" && l !== "query" && l !== "path");
      const msg = item.msg || item.message || item.detail;
      if (msg) {
        if (field) {
          msgs.push(`${friendlyField(String(field))}: ${msg}`);
        } else {
          msgs.push(String(msg));
        }
      }
      if (msgs.length >= 3) break; // limit noise
    }
    if (msgs.length) return msgs.join("; ");
  }
  if (typeof (payload as { message?: unknown }).message === "string") {
    const msg = (payload as { message: string }).message;
    if (/user with this phone number already exists/i.test(msg)) return 'User with this phone number already exists';
    return msg;
  }
  if (typeof (payload as { error?: unknown }).error === "string") {
    const err = (payload as { error: string }).error;
    if (/user with this phone number already exists/i.test(err)) return 'User with this phone number already exists';
    return err;
  }
  // FastAPI / DRF style: {field: ["msg1", "msg2"], ...}
  const parts: string[] = [];
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const first = value.find((v) => typeof v === "string");
      if (first) parts.push(`${key}: ${first}`);
    } else if (value && typeof value === "object" && Array.isArray((value as { messages?: unknown[] }).messages)) {
      const first = (value as { messages?: unknown[] }).messages?.find((m) => typeof m === "string");
      if (first) parts.push(`${key}: ${first}`);
    }
    if (parts.length >= 3) break; // limit
  }
  if (parts.length) return parts.join("; ");
  return fallback;
}
