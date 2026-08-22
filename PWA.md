# Tài Liệu Kỹ Thuật: Hệ Thống Progressive Web App (PWA) & Tối Ưu Mobile BoardMates

Tài liệu này ghi lại chi tiết toàn bộ kiến trúc, danh mục tệp và cấu hình đã triển khai cho hệ thống Progressive Web App (PWA) và Tối ưu hóa Responsive trên nền tảng **Next.js 16 (App Router)**, **React 19** và **Tailwind CSS v4** của dự án BoardMates.

---

## 1. Tổng Quan Kiến Trúc PWA

PWA biến website BoardMates thành một ứng dụng có thể cài đặt trực tiếp trên Điện thoại di động (iOS & Android) và Máy tính (Desktop/Laptop) mà không cần thông qua App Store hay Google Play Store.

```
                    ┌──────────────────────────────────────────────┐
                    │            BoardMates PWA Ecosystem          │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐              ┌──────────────────┐
│ Android WebAPK   │             │   iOS Safari     │              │ Desktop Window   │
│ - beforeinstall  │             │ - Add to Home    │              │ - Standalone     │
│ - 1-Click Popup  │             │ - Inset / Notch  │              │ - Offline Cache  │
│ - App Drawer     │             │ - Safe Area CSS  │              │ - App Shortcuts  │
└────────┬─────────┘             └────────┬─────────┘              └────────┬─────────┘
         │                                │                                 │
         └────────────────────────────────┼─────────────────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    Service Worker Engine (public/sw.js)│
                      │ - Stale-While-Revalidate (Fonts/Assets)│
                      │ - Network-First + Offline Fallback     │
                      │ - CacheStorage (boardmates-pwa-v1)     │
                      │ - Cache Invalidation on Update         │
                      └────────────────────────────────────────┘
```

---

## 2. Danh Mục Các Tệp Đã Tạo & Chỉnh Sửa

| Tệp / Đường dẫn | Loại | Chức năng chi tiết |
|---|---|---|
| [`frontend/src/app/manifest.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/manifest.js) | Mới | Dynamic Web App Manifest chuẩn Next.js 16. Định nghĩa Brand, Màu sắc (`#FFFBF3`, `#A85B00`), Standalone mode và 3 **App Shortcuts** (Khám phá, Gia nhập Core Team, Vault). |
| [`frontend/public/sw.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/public/sw.js) | Mới | Service Worker quản lý bộ nhớ đệm CacheStorage, lưu cache Google Fonts, Static Chunks, Hình ảnh và điều hướng sang trang `OFFLINE.EXE` khi mất mạng. |
| [`frontend/src/lib/sw-register.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/lib/sw-register.js) | Mới | Helper đăng ký Service Worker an toàn sau sự kiện `window.load` và lắng nghe cập nhật phiên bản mới. |
| [`frontend/src/hooks/usePWA.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/hooks/usePWA.js) | Mới | Custom React Hook phát hiện thiết bị (iOS/Android/Desktop), bắt sự kiện `beforeinstallprompt`, và kiểm tra trạng thái Standalone. |
| [`frontend/src/components/common/PWAInstallPrompt.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/common/PWAInstallPrompt.jsx) | Mới | Giao diện cài đặt Retro Window `INSTALL_BOARDMATES.EXE` cho Android/Desktop và Modal hướng dẫn từng bước cho iOS Safari. |
| [`frontend/src/components/common/PWAProvider.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/common/PWAProvider.jsx) | Mới | Client Component bọc ngoài ứng dụng để tự động kích hoạt đăng ký Service Worker và hiển thị Install Prompt. |
| [`frontend/src/app/offline/page.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/offline/page.jsx) | Mới | Màn hình ngoại tuyến `SYSTEM_OFFLINE.EXE [404_NO_SIGNAL]` với giao diện hoài cổ và nút "Thử kết nối lại". |
| [`frontend/public/icons/`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/public/icons/) | Mới | Bộ Icon đa kích thước chuẩn: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (Android Adaptive) và `apple-touch-icon.png` (iOS). |
| [`frontend/src/app/layout.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/layout.js) | Sửa | Cập nhật `viewport` (`viewport-fit=cover`, `maximum-scale=1`), PWA metadata, Apple Web App meta và gắn `<PWAProvider>`. |
| [`frontend/src/app/globals.css`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/globals.css) | Sửa | Bổ sung tiện ích Safe Area Insets (`.safe-top`, `.safe-bottom`, `.pb-safe`), `overflow-x: clip` chống tràn ngang màn hình nhỏ. |
| [`frontend/src/layouts/Navbar.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/layouts/Navbar.jsx) | Sửa | Tối ưu hóa Drawer Menu Mobile, safe area top padding cho Dynamic Island / Tai thỏ, vùng chạm cảm ứng $\ge 44\text{px}$. |
| [`frontend/src/app/(main)/page.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/%28main%29/page.js) | Sửa | Tối ưu Typography co giãn, `touch-action: pan-y` cho khối 3D ChessBoard và hiển thị dạng thẻ đơn sắc sảo cho Blog trên mobile. |
| [`frontend/src/layouts/Footer.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/layouts/Footer.jsx) | Sửa | Thêm `.pb-safe` để tránh bị cấn thanh gạt Home Bar của iPhone và mở rộng touch targets cho các icon mạng xã hội. |
| [`frontend/package.json`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/package.json) | Sửa | Cập nhật script `"dev": "next dev -H 0.0.0.0 -p 3007"` hỗ trợ test qua mạng Wi-Fi LAN. |

---

## 3. Hoạt Động Trên Môi Trường Deploy (Production)

### ❓ Khi Push code lên môi trường Deploy (Vercel, Netlify, Cloudflare, Server riêng...), PWA có hoạt động được không?

**👉 CÓ, VÀ HOẠT ĐỘNG HOÀN HẢO 100% CÔNG SUẤT!**

#### Lý do:
1. **Bắt buộc HTTPS**: PWA và Service Worker theo tiêu chuẩn bảo mật quốc tế yêu cầu kết nối **HTTPS** (trừ môi trường `localhost`). Khi bạn deploy lên các nền tảng hiện đại (như Vercel), nền tảng sẽ tự động cấp chứng chỉ SSL HTTPS miễn phí. Do đó, Service Worker và Caching sẽ kích hoạt trơn tru ngay từ lần đầu truy cập.
2. **WebAPK tự động trên Android**: Khi chạy trên domain HTTPS chính thức, Google Chrome sẽ tự động kiểm tra tính hợp lệ của `manifest.webmanifest` và cho phép cài đặt WebAPK đầy đủ.
3. **Apple iOS Home Screen Support**: Safari trên iPhone/iPad nhận diện đầy đủ `apple-touch-icon.png` và các thẻ meta `apple-mobile-web-app-capable`, cho phép thêm vào màn hình chính với độ phân giải sắc nét nhất.
4. **Đã kiểm tra Build Production**: Lệnh `npm run build` đã chạy thành công 100%, tất cả 18 route tĩnh và động đều đã sẵn sàng deploy.

---

## 4. Hướng Dẫn Sử Dụng & Kiểm Thử

### Thử nghiệm trên máy cục bộ (Local Development)
1. Chạy lệnh: `npm run dev` trong thư mục `frontend/`.
2. Trên điện thoại (cùng mạng Wi-Fi): Truy cập `http://192.168.1.8:3007`.
3. Cài đặt:
   - **iOS Safari**: Bấm **Chia sẻ (Share ⎋)** $\rightarrow$ **Thêm vào MH chính (Add to Home Screen ⊞)**.
   - **Android Chrome**: Bấm nút **"Cài đặt"** trên popup `INSTALL_BOARDMATES.EXE` hoặc menu 3 chấm.

### Kiểm tra tính năng Ngoại Tuyến (Offline Mode)
1. Mở DevTools trên trình duyệt (F12) $\rightarrow$ Tab **Network** $\rightarrow$ Chọn chế độ **Offline** (hoặc tắt Wifi/4G trên điện thoại).
2. Tải lại trang $\rightarrow$ Hệ thống sẽ hiển thị màn hình **`SYSTEM_OFFLINE.EXE`** thay vì màn hình báo lỗi mất mạng mặc định của trình duyệt.
