import "./globals.css";
import CursorFollower from "@/components/common/CursorFollower";

export const metadata = {
  title: "BoardMates — Kết nối và sáng tạo qua board game",
  description: "BoardMates là nền tảng kết nối và sáng tạo thông qua board game. Cộng đồng, sự kiện, và không gian để cùng nhau phát triển.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&family=Space_Grotesk:wght@300..700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {/* Decor board game da chuyen vao MainLayout <main> de khong phu Footer.
            CursorFollower o day de bao trum toan site. */}
        <div id="root">
          {children}
        </div>
        <CursorFollower />
      </body>
    </html>
  );
}
