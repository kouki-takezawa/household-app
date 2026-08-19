"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
};

type ConfirmState = ConfirmOptions & { resolve: (value: boolean) => void };

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(
  null
);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirmFn = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  function respond(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirmFn}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-6"
          role="alertdialog"
          aria-modal="true"
          onClick={() => respond(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-bold text-foreground">{state.title}</h3>
            {state.description && (
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{state.description}</p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => respond(false)}
                className="flex-1 rounded-full border border-line py-2.5 text-[14px] font-semibold text-subtle active:opacity-70"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => respond(true)}
                autoFocus
                className={`flex-1 rounded-full py-2.5 text-[14px] font-semibold text-white shadow-sm transition-transform active:scale-[0.98] ${
                  state.danger
                    ? "bg-rose-500 shadow-rose-500/30"
                    : "bg-amber-600 shadow-amber-600/30"
                }`}
              >
                {state.confirmLabel ?? "削除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
