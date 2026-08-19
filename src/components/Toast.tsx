"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastOptions = {
  variant?: "success" | "error";
  actionLabel?: string;
  onAction?: () => void;
  /** ミリ秒。Undoアクション付きは長めに取るのが基本。 */
  duration?: number;
};

type ToastItem = ToastOptions & { id: number; message: string };

type ShowToast = (message: string, options?: ToastOptions) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback<ShowToast>((message, options) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, ...options }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, options?.duration ?? (options?.actionLabel ? 4000 : 2200));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 6.5rem)" }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-medium shadow-lg animate-[toast-in_0.25s_ease-out] ${
              t.variant === "error" ? "bg-rose-600 text-white" : "bg-foreground text-background"
            }`}
          >
            {t.variant === "error" ? (
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7.5" />
                <path d="M10 6.5v4M10 13.5h.01" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 10.5 8 14.5 16 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span>{t.message}</span>
            {t.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
                className="ml-1 flex-shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold active:bg-white/25"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
