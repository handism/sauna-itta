import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
import { BASE_PATH } from "../../dataSource";
import "./globals.css";

// base.css の --font-main が参照するフォント。
// next/font でセルフホストし、外部リクエスト（PWA オフライン時に失敗する）を無くす
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  // Turbopack Google Font resolving error fallback: omit exact weights to fetch variable font or adjust fallback
  display: "swap",
});

export const metadata: Metadata = {
  title: "サウナイッタ",
  description: "マイととのいマップ - サウナ訪問記録・マップ可視化アプリ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "サウナイッタ",
  },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icon.svg`, type: "image/svg+xml" },
      { url: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: `${BASE_PATH}/icons/apple-icon.png`, sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f6fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

/**
 * 初期描画前に html へ light-theme クラスを付けてダーク→ライトのちらつきを防ぐ。
 * 判定は utils/theme.ts の getInitialTheme() と揃えること。
 */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("sauna-itta_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}if(t==="light"){document.documentElement.classList.add("light-theme");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // --font-outfit は html に定義すること。base.css の --font-main は :root で
    // var(--font-outfit) を参照するため、body に付けると :root では未定義になり、
    // --font-main ごと無効値になってブラウザ既定の書体へ落ちる（Outfit も日本語の指定も効かない）
    <html lang="ja" className={outfit.variable} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{THEME_INIT_SCRIPT}</Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
