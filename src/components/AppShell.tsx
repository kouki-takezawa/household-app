"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ToastProvider } from "./Toast";
import { ConfirmProvider } from "./ConfirmDialog";

const NAV_ITEMS = [
  {
    href: "/",
    label: "ホーム",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M6 10v9h12v-9" />
        <path d="M10 19v-5h4v5" />
      </svg>
    ),
  },
  {
    href: "/budget",
    label: "家計簿",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
        <path d="M3.5 10h17" />
        <circle cx="16.5" cy="14" r="1.3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/schedule",
    label: "日程表",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
        <path d="M3.5 9.5h17" />
        <path d="M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    href: "/assets",
    label: "資産管理",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19V10M10 19V5M16 19v-7M21 19H3" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "設定",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.4-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.4a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4 2 1.4a7.6 7.6 0 0 0 0 3l-2 1.4 2 3.4 2.3-.7c.75.66 1.63 1.17 2.6 1.5l.5 2.4h4l.5-2.4a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4-2-1.4Z" />
      </svg>
    ),
  },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div
          className="flex min-h-screen flex-col bg-background text-foreground md:flex-row"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-line-soft px-4 py-6 md:flex">
            <div className="mb-8 flex items-center gap-2.5 px-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg text-white">
                🏡
              </span>
              <span className="text-[15px] font-bold leading-tight text-foreground">
                わが家の
                <br />
                家計・資産管理
              </span>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors",
                      active ? "bg-brand/10 text-brand" : "text-subtle hover:bg-track"
                    )}
                  >
                    <span className="h-5 w-5 flex-shrink-0">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-8 md:px-10 md:pb-12">
            {children}
          </main>

          <nav
            className="fixed inset-x-0 bottom-0 z-30 px-4 md:hidden"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.875rem)" }}
          >
            <ul className="mx-auto flex w-full max-w-3xl items-center rounded-[28px] border border-line-soft/70 bg-surface/80 shadow-nav backdrop-blur-2xl">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href} className="flex-1">
                    <Link
                      href={item.href}
                      className={clsx(
                        "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                        active ? "text-brand" : "text-muted"
                      )}
                    >
                      <span className="h-6 w-6">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
