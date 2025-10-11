"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ruDict from './locales/ru';
import uzDict from './locales/uz';

export type Locale = 'ru' | 'uz';

interface TranslationDict { [key: string]: string | TranslationDict }

interface I18nContextValue {
  locale: Locale;
  t: (key: string, vars?: Record<string,string|number>) => string;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function flatten(prefix: string, obj: TranslationDict, map: Record<string,string>) {
  Object.entries(obj).forEach(([k,v]) => {
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') map[newKey] = v; else flatten(newKey, v as TranslationDict, map);
  });
  return map;
}

const dictionaries: Record<Locale, Record<string,string>> = {
  ru: flatten('', ruDict as unknown as TranslationDict, {}),
  uz: flatten('', uzDict as unknown as TranslationDict, {})
};

export const I18nProvider: React.FC<React.PropsWithChildren<{initialLocale?: Locale}>> = ({initialLocale='ru', children}) => {
  // On the server we must render with a deterministic default (ru). After mount, we
  // hydrate the saved locale from localStorage and then persist changes.
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [initialized, setInitialized] = useState(false);

  // Load saved locale on first client mount, without overwriting it beforehand
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('locale') as Locale | null;
      if (saved && (saved === 'ru' || saved === 'uz')) {
        setLocale(saved);
      }
    } catch {
      // ignore
    } finally {
      setInitialized(true);
    }
  }, []);

  // Persist locale and reflect it in <html lang> only after initialization
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;
    try { localStorage.setItem('locale', locale); } catch { /* ignore */ }
    try { document.documentElement.lang = locale; } catch { /* ignore */ }
  }, [locale, initialized]);

  useEffect(() => { /* dictionaries already loaded statically */ }, []);
  const t = useCallback((key: string, vars?: Record<string,string|number>) => {
    const dict = dictionaries[locale] || {};
    // Respect intentionally empty strings in translations by checking key existence
    let template = Object.prototype.hasOwnProperty.call(dict, key)
      ? dict[key]
      : key;
    if (vars) {
      Object.entries(vars).forEach(([k,v]) => {
        template = template.replace(new RegExp(`{${k}}`,'g'), String(v));
      });
    }
    return template;
  }, [locale]);
  return <I18nContext.Provider value={{locale,setLocale,t}}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if(!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
