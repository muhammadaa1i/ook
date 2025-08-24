import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: number) => {
  if (isNaN(price)) return "0 сум";
  // Use ru-RU for grouping (space) then append currency label manually to control casing and spacing
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return `${formatted} сум`;
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

// Extract human-friendly validation / API error message from various backend shapes
export function extractErrorMessage(payload: any, fallback = "Произошла ошибка"): string {
  if (!payload || typeof payload !== "object") return fallback;
  // Fast path: plain detail string
  if (typeof payload.detail === "string") return payload.detail;
  // FastAPI / Pydantic style: detail is an array of objects with loc/msg
  if (Array.isArray(payload.detail)) {
    const friendlyField = (raw: string) => {
      const map: Record<string, string> = {
        name: "Имя",
        surname: "Фамилия",
        phone_number: "Номер телефона",
        password: "Пароль",
        confirm_password: "Подтверждение пароля",
        username: "Имя пользователя",
      };
      return map[raw] || raw;
    };

    const msgs: string[] = [];
    for (const item of payload.detail) {
      if (!item || typeof item !== "object") continue;
      const loc = Array.isArray(item.loc) ? item.loc : [];
      // Usually loc like ["body", "field_name"] or ["body", "field", 0, "subfield"]
      const field = loc.find((l: any) => typeof l === "string" && l !== "body" && l !== "query" && l !== "path");
      const msg = (item as any).msg || (item as any).message || (item as any).detail;
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
  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.error === "string") return payload.error;
  // FastAPI / DRF style: {field: ["msg1", "msg2"], ...}
  const parts: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      const first = value.find((v) => typeof v === "string");
      if (first) parts.push(`${key}: ${first}`);
    } else if (value && typeof value === "object" && Array.isArray((value as any).messages)) {
      const first = (value as any).messages.find((m: any) => typeof m === "string");
      if (first) parts.push(`${key}: ${first}`);
    }
    if (parts.length >= 3) break; // limit
  }
  if (parts.length) return parts.join("; ");
  return fallback;
}
