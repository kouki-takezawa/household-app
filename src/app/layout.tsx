import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// 和文を明朝的な字形の揺れなく揃えるため Noto Sans JP を明示的に読み込む。
// 以前はシステムフォントスタック任せで、環境によっては欧文フォント
// （SF Pro Text 等）が和文より先に解決され、和欧混植時にウェイトや
// x-height がちぐはぐになっていた。
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "家計・資産管理アプリ",
  description: "家計簿・日程表・資産管理を統合したアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`h-full antialiased ${notoSansJP.variable}`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
