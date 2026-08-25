# BÁO CÁO TỔNG HỢP TIẾN ĐỘ & GIẢI PHÁP KỸ THUẬT (BOARDMATES)

> **Dự án:** BoardMates — Nền tảng Cộng đồng Board Game, Kho Game, Sự Kiện & Sàn Giao Dịch  
> **Thời gian cập nhật:** 25/08/2026

---

## 📌 MỤC LỤC TỔNG QUAN

1. [Hệ Thống Sự Kiện & Lên Kèo Board Game Toàn Diện (Events Hub)](#1-hệ-thống-sự-kiện--lên-kèo-board-game-toàn-diện)
2. [Đăng Ký Nhanh & Tùy Biến Tên Hiển Thị (Guest Quick RSVP)](#2-đăng-ký-nhanh--tùy-biến-tên-hiển-thị-guest-quick-rsvp)
3. [Tìm Kèo Gần Đây Theo Vị Trí GPS & Bán Kính (Geolocation & Haversine Distance)](#3-tìm-kèo-gần-đây-theo-vị-trí-gps--bán-kính)
4. [Khắc Phục Triệt Để Lỗi Co Giãn Khung & Giật Layout Khi Chuyển Tab](#4-khắc-phục-triệt-để-lỗi-co-giãn-khung--giật-layout)
5. [Bảo Vệ Quyền Tạo Kèo (Auth Guard & Login Prompt Modal)](#5-bảo-vệ-quyền-tạo-kèo-auth-guard)
6. [Gắn Nhiều Board Game Cho 1 Sự Kiện & Liên Kết Kho Game BGG](#6-gắn-nhiều-board-game-cho-1-sự-kiện--liên-kết-kho-game)
7. [Tích Hợp Bản Đồ Google Maps Tương Tác & Định Vị Quán Cafe Board Game](#7-tích-hợp-bản-đồ-google-maps-tương-tác--định-vị-quán-cafe)
8. [Khắc Phục Lỗi 404 Đăng Nhập Google & Cung Cấp Thông Tin Tài Khoản Admin](#8-khắc-phục-lỗi-404-đăng-nhập-google--tài-khoản-admin)

---

## 1. Hệ Thống Sự Kiện & Lên Kèo Board Game Toàn Diện

### 🎯 Vấn đề & Mục tiêu:
Trước đây tab Sự kiện (`/events`) chưa có tính năng hoạt động thực tế. Cần xây dựng một hệ thống full-stack cho phép người dùng xem danh sách kèo, tạo kèo mới, lọc theo khu vực, thời gian, hình thức và thể loại.

### 🛠️ Cách Thực Hiện:
- **Cơ sở dữ liệu (Database Schema)**:
  - Cập nhật file [`backend/prisma/schema.prisma`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/prisma/schema.prisma) với các Model: `Event`, `EventParticipant`, cùng các Enum: `EventType` (`CASUAL`, `TOURNAMENT`, `WORKSHOP`, `NIGHT`) và `EventStatus` (`OPEN`, `FULL`, `ONGOING`, `COMPLETED`, `CANCELLED`).
  - Đồng bộ cơ sở dữ liệu lên PostgreSQL Supabase bằng lệnh `npx prisma db push` và sinh Prisma Client `npx prisma generate`.
- **Backend Controller & Router**:
  - Viết controller [`backend/src/controller/event.controller.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/src/controller/event.controller.js) và router [`backend/src/routes/events.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/src/routes/events.js).
  - Hỗ trợ đầy đủ các API: Lấy danh sách kèm phân trang & lọc, xem chi tiết, tạo sự kiện, cập nhật, hủy kèo và tham gia/rút khỏi kèo (RSVP).
- **Giao diện Frontend**:
  - Xây dựng trang trung tâm [`frontend/src/app/(main)/events/page.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/%28main%29/events/page.js) và thẻ sự kiện [`frontend/src/components/events/EventCard.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/EventCard.jsx) theo phong cách Retro Window (`window-border`, `window-shadow`, `retro-title-bar`).

---

## 2. Đăng Ký Nhanh & Tùy Biến Tên Hiển Thị (Guest Quick RSVP)

### 🎯 Vấn đề & Mục tiêu:
Người chơi mới hoặc khách chưa đăng nhập vẫn có thể tham gia giao lưu nhanh mà không bị rào cản tài khoản làm gián đoạn trải nghiệm.

### 🛠️ Cách Thực Hiện:
- Xây dựng component modal [`frontend/src/components/events/QuickJoinModal.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/QuickJoinModal.jsx).
- Khi bấm **"Tham gia"**, hiển thị popup cho phép nhập:
  1. **Tên hiển thị (Nickname)**: Tự động lưu nhớ vào `localStorage.getItem('bm_guest_display_name')`.
  2. **Số điện thoại / Zalo (Tùy chọn)**: Để Host tiện liên hệ chốt bàn.
  3. **Ghi chú cho Chủ kèo**: Nhắn nhủ kinh nghiệm chơi hoặc yêu cầu hướng dẫn.
- Tự động sinh avatar Pixel Art ngẫu nhiên theo Nickname thông qua DiceBear API.

---

## 3. Tìm Kèo Gần Đây Theo Vị Trí GPS & Bán Kính

### 🎯 Vấn đề & Mục tiêu:
Người chơi muốn tìm các quán cafe hoặc các buổi tụ tập board game ở gần vị trí thực tế của mình nhất.

### 🛠️ Cách Thực Hiện:
- **Tích hợp Geolocation API**:
  - Sử dụng API trình duyệt `navigator.geolocation.getCurrentPosition` với độ chính xác cao (`enableHighAccuracy: true`).
- **Thuật toán Khoảng cách Haversine**:
  - Triển khai hàm tính khoảng cách địa lý giữa 2 toạ độ GPS:
  ```javascript
  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
  ```
- **Bộ lọc Bán kính & Sắp xếp**:
  - Tự động sắp xếp các kèo gần người dùng nhất lên đầu danh sách.
  - Hỗ trợ dropdown chọn bán kính: `< 5 km`, `< 10 km`, `< 25 km`, `< 50 km`, `Tất cả`.
  - Hiển thị badge khoảng cách trực quan trên từng thẻ: `📍 Cách bạn X km`.

---

## 4. Khắc Phục Triệt Để Lỗi Co Giãn Khung & Giật Layout

### 🎯 Vấn đề & Mục tiêu:
Khi bấm chuyển qua lại giữa các tab ("Tất cả sự kiện", "Kèo tôi tạo", "Kèo tôi tham gia"), khung bảng bị thay đổi kích thước, giật và co rúm layout.

### 🛠️ Cách Thực Hiện:
1. **Loại bỏ hiệu ứng co giãn tự động (`layout` prop)**:
   - Gỡ bỏ thuộc tính `layout` trên `<motion.div>` của khung chính và grid sự kiện để ngăn Framer Motion tự động tính toán lại kích thước khung khi số lượng thẻ thay đổi.
2. **Cố định kích thước Khung Trạng Thái Trống (Empty State)**:
   - Thay đổi cấu trúc Empty state từ dạng hộp hẹp `max-w-lg` (512px) sang khung toàn phần `w-full min-h-[380px]` đồng nhất tuyệt đối với khung danh sách thẻ.
3. **Triệt tiêu hiện tượng giật do thanh cuộn trình duyệt (Scrollbar Layout Shift)**:
   - Thêm quy tắc CSS `scrollbar-gutter: stable;` vào thẻ `html` trong file [`frontend/src/app/globals.css`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/globals.css). Nhờ đó, trình duyệt luôn dự trữ sẵn độ rộng cho thanh cuộn, giúp toàn bộ trang web không bị co giãn 17px khi chuyển giữa trang dài và trang ngắn.

---

## 5. Bảo Vệ Quyền Tạo Kèo (Auth Guard)

### 🎯 Vấn đề & Mục tiêu:
Chỉ cho phép thành viên đã đăng nhập tài khoản BoardMates mới được tạo kèo (Host); khách chưa đăng nhập sẽ được hướng dẫn đăng nhập.

### 🛠️ Cách Thực Hiện:
- Viết hàm kiểm tra xác thực `handleOpenCreateEvent()`:
  - Nếu `!user?.token && !user?.id` $\rightarrow$ Mở popup `yeu_cau_dang_nhap.exe` (`isLoginPromptOpen: true`).
  - Popup hiển thị thông điệp giải thích cùng nút **"Đăng Nhập Ngay"** dẫn thẳng tới `/login`.
  - Nếu đã đăng nhập $\rightarrow$ Mở ngay form tạo kèo `CreateEventModal`.

---

## 6. Gắn Nhiều Board Game Cho 1 Sự Kiện & Liên Kết Kho Game

### 🎯 Vấn đề & Mục tiêu:
Một buổi chơi có thể chơi nhiều game (ví dụ vừa chơi *Catan*, vừa chơi *Root* và *Splendor*). Cần cho phép đính kèm nhiều board game và liên kết thông tin chi tiết từng game.

### 🛠️ Cách Thực Hiện:
- **Database Schema**: Thêm trường `games Json?` vào model `Event` trong Prisma schema để lưu trữ mảng các board game `[{ id, name, imageUrl, bggId, playTime, weight }]`.
- **Multi-Game Selector ([`CreateEventModal.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/CreateEventModal.jsx))**:
  - Cho phép chọn nhanh các game phổ biến hoặc tìm kiếm real-time kết nối với API BGG (72.000+ tựa game).
  - Danh sách game được chọn hiển thị dạng chip có ảnh thumbnail, tên game và nút xóa `✕`.
- **Hiển Thị Đa Game Trong Thẻ & Chi Tiết ([`EventCard.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/EventCard.jsx), [`EventDetailsModal.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/EventDetailsModal.jsx))**:
  - Thẻ sự kiện hiển thị tên game chính kèm badge `+X game khác`.
  - Popup chi tiết hiển thị danh sách từng game kèm thời lượng, độ khó và nút **"Xem Game"** mở trang thông tin luật chơi BGG.

---

## 7. Tích Hợp Bản Đồ Google Maps Tương Tác & Định Vị Quán Cafe

### 🎯 Vấn đề & Mục tiêu:
Giúp người tạo và người tham gia dễ dàng xác định vị trí quán cafe, kiểm tra địa chỉ trên bản đồ và lấy đường đi.

### 🛠️ Cách Thực Hiện:
- Xây dựng component [`frontend/src/components/events/EventMapPicker.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/EventMapPicker.jsx):
  - Nhúng trực tiếp iframe Google Maps Embed tương tác.
  - Cung cấp ô nhập và nút **"Kiểm tra trên bản đồ"** để ghim thử vị trí quán.
  - Danh sách các quán Board Game Cafe nổi tiếng có sẵn tọa độ chính xác:
    - *The Mind Cafe & Boardgame (Q10, TP.HCM)*
    - *Cube Cafe & Board Game Hub (Q1, TP.HCM)*
    - *Board Game Station (Q3, TP.HCM)*
    - *Say Boardgame Pub & Cafe (Phú Nhuận, TP.HCM)*
    - *Cashflow Cafe (Q10, TP.HCM)*
    - *The Guild Board Game Hub (Đống Đa, Hà Nội)*
    - *Nona Board Game Cafe (Đống Đa, Hà Nội)*
  - Tích hợp nút **"Mở chỉ đường Google Maps"** mở Google Maps ngoài để điều hướng tức thì.

---

## 8. Khắc Phục Lỗi 404 Đăng Nhập Google & Tài Khoản Admin

### 🎯 Vấn đề & Mục tiêu:
1. Giải đáp thông tin tài khoản Admin trong hệ thống.
2. Xử lý lỗi 404 khi bấm đăng nhập bằng Google.

### 🛠️ Cách Thực Hiện:
- **Tài khoản Admin**:
  - Đã kiểm tra và seed trong cơ sở dữ liệu qua [`backend/prisma/seed.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/prisma/seed.js):
    - **Email:** `admin@bg.com`
    - **Mật khẩu:** `admin123`
    - **Quyền hạn (Role):** `ADMIN`
- **Khắc phục lỗi 404 Google Auth**:
  - *Nguyên nhân:* File cấu hình URL [`frontend/src/lib/apiConfig.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/lib/apiConfig.js) trước đó tự động fallback chuyển sang link Vercel cũ khi backend local chưa phản hồi kịp, dẫn đến gọi vào serverless route không tồn tại (404).
  - *Giải pháp:* Sửa lại `apiConfig.js` để khi chạy ở môi trường localhost (`http://localhost:3007`), hệ thống luôn luôn kết nối trực tiếp 100% vào Backend Node.js `http://localhost:8080`.
  - Đã test trực tiếp API `POST /api/auth/google` và trả về kết quả **200 OK Thành Công**.

---

## 📊 BẢNG TỔNG KẾT CÁC FILE ĐÃ CHỈNH SỬA & TẠO MỚI

| File | Loại thay đổi | Chức năng chính |
|---|---|---|
| [`backend/prisma/schema.prisma`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/prisma/schema.prisma) | MODIFY | Thêm model `Event`, `EventParticipant`, toạ độ GPS `lat`/`lng`, mảng `games Json?` |
| [`backend/src/controller/event.controller.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/src/controller/event.controller.js) | MODIFY | Logic CRUD sự kiện, tính khoảng cách GPS Haversine, hỗ trợ nhiều board game |
| [`backend/src/routes/events.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/src/routes/events.js) | NEW | Các endpoint REST API `/api/events` |
| [`frontend/src/app/(main)/events/page.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/%28main%29/events/page.js) | MODIFY | Trung tâm sự kiện, cố định layout, tích hợp Auth Guard và GPS Near Me |
| [`frontend/src/components/events/EventCard.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/EventCard.jsx) | MODIFY | Thẻ sự kiện retro, hiển thị khoảng cách GPS, hiển thị badge đa game |
| [`frontend/src/components/events/CreateEventModal.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/CreateEventModal.jsx) | MODIFY | Form tạo kèo với bộ chọn nhiều game và bản đồ Google Maps |
| [`frontend/src/components/events/EventDetailsModal.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/EventDetailsModal.jsx) | MODIFY | Chi tiết sự kiện với danh sách game BGG và Google Maps chỉ đường |
| [`frontend/src/components/events/EventMapPicker.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/EventMapPicker.jsx) | NEW | Component nhúng Google Maps iframe tương tác và ghim quán cafe |
| [`frontend/src/components/events/QuickJoinModal.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/events/QuickJoinModal.jsx) | NEW | Modal tham gia nhanh với Tên hiển thị (Nickname) và liên hệ |
| [`frontend/src/lib/apiConfig.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/lib/apiConfig.js) | MODIFY | Sửa lỗi kết nối localhost:8080, khắc phục triệt để lỗi 404 Google Auth |
| [`frontend/src/app/globals.css`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/globals.css) | MODIFY | Thêm `scrollbar-gutter: stable;` triệt tiêu hiện tượng lệch layout 17px |
| [`frontend/src/data/translations.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/data/translations.js) | MODIFY | Bổ sung từ điển song ngữ Tiếng Việt & Tiếng Anh cho toàn bộ tính năng |
