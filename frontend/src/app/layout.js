import "./globals.css";
import { Agentation } from "agentation";
import CursorFollower from "@/components/common/CursorFollower";
import SessionTimeoutManager from "@/components/common/SessionTimeoutManager";
import PWAProvider from "@/components/common/PWAProvider";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFBF3" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1A15" },
  ],
};

export const metadata = {
  title: "BoardMates — Kết nối và sáng tạo qua board game",
  description:
    "BoardMates là nền tảng kết nối và sáng tạo thông qua board game. Cộng đồng, sự kiện, và không gian để cùng nhau phát triển.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BoardMates",
  },
  icons: {
    icon: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&family=Space_Grotesk:wght@300..700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <PWAProvider>
          <div id="root">{children}</div>
          <CursorFollower />
          <SessionTimeoutManager />
          {process.env.NODE_ENV === "development" && <Agentation />}
        </PWAProvider>
      </body>
    </html>
  );
}
