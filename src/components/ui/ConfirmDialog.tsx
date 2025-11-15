"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type ConfirmOptions = {
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
};

interface InternalState extends ConfirmOptions {
  resolve?: (value: boolean) => void;
  open: boolean;
}

const ConfirmDialogContext = createContext<
  (options: ConfirmOptions) => Promise<boolean>
>(() => Promise.resolve(false));

export const useConfirm = () => useContext(ConfirmDialogContext);

export const ConfirmDialogProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<InternalState>({ open: false });
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setState({
        open: true,
        title: options.title || "Подтверждение",
  // Preserve intentionally empty string/null by only defaulting when undefined
  message: options.message === undefined ? "Вы уверены?" : options.message,
        confirmText: options.confirmText || "Да",
        cancelText: options.cancelText || "Отмена",
        variant: options.variant || "default",
        resolve,
      });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      setState((s) => {
        s.resolve?.(value);
        return { open: false } as InternalState;
      });
    },
    []
  );

  // Close on escape
  useEffect(() => {
    if (!state.open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.open, close]);

  // Scroll lock while open
  useEffect(() => {
    if (state.open) {
      const original = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = original;
      };
    }
  }, [state.open]);

  // Restore focus
  useEffect(() => {
    if (!state.open && previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [state.open]);

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
            onClick={() => close(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative w-full max-w-sm mx-auto bg-white shadow-xl rounded-xl border border-gray-200 p-5 animate-scaleIn max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => close(false)}
              className="absolute top-2 right-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
            <h2
              id="confirm-title"
              className="text-lg font-semibold text-gray-900 pr-6"
            >
              {state.title}
            </h2>
            {state.message && (
              <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                {state.message}
              </div>
            )}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              >
                {state.cancelText}
              </button>
              <button
                onClick={() => close(true)}
                className={
                  state.variant === "danger"
                    ? "px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    : "px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                }
                autoFocus
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity:0; transform: scale(.95) } to { opacity:1; transform: scale(1) } }
        .animate-fadeIn { animation: fadeIn .15s ease-out; }
        .animate-scaleIn { animation: scaleIn .18s cubic-bezier(.22,.75,.35,1); }
      `}</style>
    </ConfirmDialogContext.Provider>
  );
};
