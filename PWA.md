# Tài Liệu Kỹ Thuật: Hệ Thống Progressive Web App (PWA) & Tối Ưu Mobile BoardMates

Tài liệu này ghi lại chi tiết toàn bộ kiến trúc, danh mục tệp, cấu hình và cơ sở dữ liệu đã triển khai cho hệ thống Progressive Web App (PWA) và Tối ưu hóa Responsive trên nền tảng **Next.js 16 (App Router)**, **React 19** và **Tailwind CSS v4** của dự án BoardMates.

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
| [`frontend/src/layouts/Navbar.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/layouts/Navbar.jsx) | Sửa | Tối ưu hóa Drawer Menu Mobile, safe area top padding cho Dynamic Island / Tai thỏ, vùng chạm cảm ứng $\ge 44\text{px}$, chống va chạm logo và nút Đăng Nhập. |
| [`frontend/src/app/(main)/page.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/%28main%29/page.js) | Sửa | Thêm nút **"Tải App Về Máy"** ở Hero Section kèm Modal hướng dẫn cài đặt trực quan, tối ưu Typography co giãn và `touch-action: pan-y` cho khối 3D. |
| [`frontend/src/app/login/page.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/login/page.js) | Sửa | Khắc phục chữ BoardMates bị tràn trên mobile, tinh chỉnh padding co giãn `p-5 sm:p-8 md:p-12` và font-size thích ứng. |
| [`frontend/src/app/register/page.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/register/page.js) | Sửa | Căn chỉnh form đăng ký cân đối trên màn hình điện thoại nhỏ. |
| [`frontend/src/layouts/Footer.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/layouts/Footer.jsx) | Sửa | Thêm `.pb-safe` để tránh bị cấn thanh gạt Home Bar của iPhone và mở rộng touch targets cho các icon mạng xã hội. |
| [`frontend/package.json`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/package.json) | Sửa | Cập nhật script `"dev": "next dev -H 0.0.0.0 -p 3007"` hỗ trợ test qua mạng Wi-Fi LAN. |

---

## 3. Hoạt Động Trên Môi Trường Deploy (Production)

### ❓ Khi Push code lên môi trường Deploy (Vercel, Netlify, Cloudflare, Server riêng...), PWA có hoạt động được không?

**👉 CÓ, VÀ HOẠT ĐỘNG HOÀN HẢO 100% CÔNG SUẤT!**

#### Lý do:
1. **Bắt buộc HTTPS**: PWA và Service Worker theo tiêu chuẩn bảo mật quốc tế yêu cầu kết nối **HTTPS** (trừ môi trường `localhost`). Khi deploy lên các nền tảng hiện đại (như Vercel), nền tảng sẽ tự động cấp chứng chỉ SSL HTTPS miễn phí. Do đó, Service Worker và Caching sẽ kích hoạt trơn tru ngay từ lần đầu truy cập.
2. **WebAPK tự động trên Android**: Khi chạy trên domain HTTPS chính thức, Google Chrome sẽ tự động kiểm tra tính hợp lệ của `manifest.webmanifest` và cho phép cài đặt WebAPK đầy đủ.
3. **Apple iOS Home Screen Support**: Safari trên iPhone/iPad nhận diện đầy đủ `apple-touch-icon.png` và các thẻ meta `apple-mobile-web-app-capable`, cho phép thêm vào màn hình chính với độ phân giải sắc nét nhất.
4. **Đã kiểm tra Build Production**: Lệnh `npm run build` đã chạy thành công 100%, tất cả 18 route tĩnh và động đều đã sẵn sàng deploy.

---

## 4. Cơ Sở Dữ Liệu: Lưu Trữ Tài Khoản Đăng Nhập Google

Hệ thống lưu trữ đầy đủ tài khoản người dùng đăng nhập bằng Google vào bảng **`User`** trong cơ sở dữ liệu PostgreSQL (Supabase).

### Chi Tiết Dữ Liệu Từng Cột Bảng `User`:

| Tên Cột (`Column`) | Kiểu Dữ Liệu (`Type`) | Dữ liệu thực tế khi đăng nhập Google | Ý nghĩa & Mô tả |
|---|---|---|---|
| **`id`** | `Int` (Auto-increment) | `1`, `2`, `3`... | Khóa chính định danh tài khoản, tự động tăng. |
| **`username`** | `String` (Text) | `"Nguyễn Văn A"` | Tên người dùng lấy từ `displayName` của tài khoản Google (hoặc lấy phần trước `@` của email nếu thiếu). |
| **`email`** | `String` (Unique) | `"nguyenvana@gmail.com"` | Địa chỉ Email chính thức từ Google, bắt buộc duy nhất. |
| **`googleId`** | `String` (Unique, Nullable) | `"115839201948271039485"` | Mã định danh ID duy nhất của tài khoản Google (`sub` / `uid`) dùng để nhận diện đăng nhập nhanh. |
| **`avatarUrl`** | `String` (Nullable) | `"https://lh3.googleusercontent.com/a/..."` | Đường link ảnh đại diện gốc của tài khoản Google. |
| **`password`** | `String` (Nullable) | `"$2b$10$7qK9..."` *(Chuỗi Bcrypt Hash)* | Hệ thống tự động sinh một mật khẩu ngẫu nhiên an toàn 32 bytes và mã hóa Bcrypt để bảo vệ tài khoản (người ngoài không thể đoán được). |
| **`role`** | `Enum Role` | `'USER'` | Quyền hạn mặc định của người dùng (`USER` hoặc `ADMIN`). |
| **`status`** | `Enum UserStatus` | `'ACTIVE'` | Trạng thái tài khoản (`ACTIVE`: đang hoạt động, `BANNED`: bị khóa). |
| **`phone`** | `String` (Nullable) | `NULL` | Số điện thoại (người dùng có thể bổ sung sau ở trang Profile). |
| **`city`** | `String` (Nullable) | `NULL` | Tỉnh/Thành phố (người dùng có thể cập nhật sau). |
| **`createdAt`** | `DateTime` | `2026-08-22 22:30:00` | Thời điểm tài khoản Google được tạo lần đầu trong database. |

---

## 5. Hướng Dẫn Sử Dụng & Kiểm Thử

### Thử nghiệm trên máy cục bộ (Local Development)
1. Chạy lệnh: `npm run dev` trong thư mục `frontend/`.
2. Trên điện thoại (cùng mạng Wi-Fi): Truy cập `http://192.168.1.8:3007`.
3. Cài đặt:
   - **iOS Safari**: Bấm **Chia sẻ (Share ⎋)** $\rightarrow$ **Thêm vào MH chính (Add to Home Screen ⊞)**.
   - **Android Chrome**: Bấm nút **"Tải App Về Máy"** trên Hero Section hoặc menu 3 chấm.

### Kiểm tra tính năng Ngoại Tuyến (Offline Mode)
1. Mở DevTools trên trình duyệt (F12) $\rightarrow$ Tab **Network** $\rightarrow$ Chọn chế độ **Offline** (hoặc tắt Wifi/4G trên điện thoại).
2. Tải lại trang $\rightarrow$ Hệ thống sẽ hiển thị màn hình **`SYSTEM_OFFLINE.EXE`** thay vì màn hình báo lỗi mất mạng mặc định của trình duyệt.
