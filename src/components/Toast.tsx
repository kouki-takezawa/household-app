"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastItem = { id: number; message: string };

const ToastContext = createContext<((message: string) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
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
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-medium text-background shadow-lg animate-[toast-in_0.25s_ease-out]"
          >
            <svg
              className="h-4 w-4 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 10.5 8 14.5 16 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.message}
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
