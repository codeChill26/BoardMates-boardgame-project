# 📜 NHẬT KÝ THAY ĐỔI TOÀN BỘ HỆ THỐNG (CHANGELOG)
### Dự Án: BoardMates — Vault, BGG Sync, Inactivity Timeout, Vercel Backend, Firebase Google Auth, PWA & Responsive

Tài liệu này ghi lại chi tiết toàn bộ các hạng mục công việc, cải tiến kỹ thuật, cập nhật giao diện, cơ sở dữ liệu và triển khai hệ thống đã hoàn thành.

---

## 🎲 1. Tính Năng Kho Boardgame Cá Nhân (Personal Game Vault)

1. **Kiến Trúc Database (Prisma & Supabase):**
   - Tạo mới bảng `ShelfGame` kết nối quan hệ Master-Detail với `BoardGame` và `User`.
   - Mỗi game trên kệ lưu trữ metadata cá nhân: `condition` (Tình trạng hộp), `status` (Trạng thái: `ON_SHELF`, `LENT_OUT`, `FOR_SALE`, `WISHLIST`), `borrower` & `expectedReturnDate` (Thông tin cho mượn), `personalRating` (1 - 5 sao), `personalNotes` (Ghi chú riêng tư).
   - Ràng buộc `@@unique([userId, gameId])` chống trùng lặp.
2. **Backend API Endpoints (`/api/shelf`):**
   - `GET /api/shelf`: Lấy danh sách game trên kệ (tìm kiếm, lọc theo `status`, `category`, `players`, sắp xếp và phân trang chuẩn).
   - `GET /api/shelf/stats`: Thống kê tổng số game, đang trên kệ, đang cho mượn, muốn bán/thuê, danh sách muốn sưu tầm.
   - `POST /api/shelf`: Thêm game vào kệ (từ game có sẵn hoặc tự tạo game mới).
   - `PUT /api/shelf/:id`: Cập nhật trạng thái, tình trạng, thông tin mượn và ghi chú.
   - `DELETE /api/shelf/:id`: Xóa game khỏi kệ.
   - `POST /api/shelf/import-csv` & `POST /api/shelf/export-csv`: Nhập/xuất file CSV.
3. **Giao Diện Frontend (`/vault`):**
   - Giao diện **List View Nằm Ngang (Horizontal Rows)** thay thế card to, hiển thị trực quan thông tin game, badge trạng thái, người mượn và nút thao tác nhanh.
   - Bộ thẻ KPI Thống kê nhanh ở đầu trang.
   - Bộ lọc đa năng (Trạng thái, Thể loại, Số lượng người chơi, Ô tìm kiếm tức thì).
   - Thanh phân trang `[‹] [1] [2] [3] [›]` mượt mà.

---

## ⚡ 2. Cải Tiến Tìm Kiếm & Hiển Thị Thumbnail BGG

1. **Tìm Kiếm Thủ Công An Toàn:**
   - Gỡ bỏ `useEffect` debounce tự động khi gõ phím để tránh spam request.
   - Chuyển sang kích hoạt tìm kiếm khi nhấn **phím `Enter ↵`** hoặc bấm nút **"Tìm kiếm"**.
2. **Xử Lý Thumbnail & Ảnh Bìa Game Chuẩn Xác 100%:**
   - Tự động trích xuất file ảnh gốc nếu người dùng copy link Google Images (`sanitizeImageUrl`).
   - Lấy ảnh bìa `square200` chính thức từ BGG CDN và lưu vào cache bộ nhớ (`BGG_DETAILS_CACHE`).
   - Thêm thuộc tính `referrerPolicy="no-referrer"` và fallback placeholder `onError` chống chặn Hotlink CDN.

---

## 🔒 3. Cơ Chế Tự Động Đăng Xuất Sau 2 Tiếng Không Hoạt Động (Inactivity Timeout)

1. **Quy Tắc Sliding Window 2 Tiếng:**
   - Thời hạn không tương tác: Đúng **2 tiếng** (`7.200.000 ms`).
   - Lắng nghe các tương tác: `mousedown`, `mousemove`, `keydown`, `scroll`, `touchstart`, `click` (điều tiết throttle 15s) để tự động gia hạn phiên.
2. **Component Toàn Cục `SessionTimeoutManager`:**
   - Xử lý treo tab, chuyển tab hoặc đóng trình duyệt quay lại sau 2 tiếng (`visibilitychange` / `window focus`).
   - Tự động đăng xuất và chuyển hướng an toàn về `/login?session=expired`.
   - Hiển thị Toast thông báo lịch sự giải thích lý do tài khoản tự động đăng xuất để bảo mật.
3. **Đồng Bộ JWT Token:**
   - Cập nhật thời hạn của JWT Token trong backend thành `{ expiresIn: '2h' }`.

---

## 📥 4. Nâng Cấp Import File Excel (.xlsx) & Tự Động Kéo Dữ Liệu BGG

1. **Hỗ Trợ Trực Tiếp Định Dạng Excel (.xlsx / .xls):**
   - Tích hợp thư viện **`xlsx` (SheetJS)**, khắc phục hoàn toàn lỗi font tiếng Việt khi lưu file CSV từ Excel.
   - Nút **"Tải File Excel Mẫu (.xlsx)"** xuất file mẫu 3 cột được định dạng sẵn độ rộng cột chuẩn mực.
2. **Cấu Trúc File Mẫu 3 Cột Tối Giản:**
   - Cột 1: `Link BGG / BGG ID`
   - Cột 2: `Tên BoardGame`
   - Cột 3: `Ghi chú cá nhân`
3. **Cơ Chế Tự Động Kéo Dữ Liệu BGG khi Import:**
   - Backend tự động bóc tách mã số `bggId` từ đường link hoặc ID số.
   - Tự động gọi API BGG để tải ảnh HD (`square200`), số người chơi, độ tuổi, thời gian chơi, thể loại và mô tả chi tiết.
   - Khởi tạo Master Record chuẩn hóa trong database và gắn vào kệ của User.
4. **Tiện Ích 1-Chạm trên Giao Diện Vault:**
   - Nút **`🔍 Tìm trên BGG ↗`**: Mở tab Google tìm kiếm chính xác game trên BGG để copy link trong 1 click.
   - Nút **`📋 Dán link & Tải Game`**: Tự động đọc clipboard, dán link BGG và nạp game ngay lập tức.
   - Bảng xem trước Excel/CSV hiển thị rõ trạng thái `⚡ Tự tải từ BGG` trước khi nạp.

---

## 🚀 5. Deploy Backend Lên Vercel & Cơ Chế Tự Động Chuyển Đổi URL (Smart Failover)

1. **Deploy Thành Công Backend Lên Vercel:**
   - URL Backend Production chính thức (vĩnh viễn): **`https://board-mates-boardgame-project-v45x.vercel.app`**
   - Loại bỏ hoàn toàn `jade` và các dependencies cũ để tương thích 100% với Vercel Serverless Function.
   - Cấu hình file `backend/api/index.js` và `backend/vercel.json` phục vụ điều hướng Serverless.
2. **Swagger UI Interactive API Documentation:**
   - Đường dẫn trực tiếp: **`https://board-mates-boardgame-project-v45x.vercel.app/api-docs`**
   - Hỗ trợ test trực tiếp toàn bộ API nhóm Auth, Shelf, Listings, Orders, Positions...
3. **Cơ Chế Tự Động Chuyển Đổi Thông Minh (Smart Failover in `frontend/src/lib/apiConfig.js`):**
   - Khi chạy Local: Tự động ping `http://localhost:8080/api`. Nếu local tắt, tự động chuyển request sang Backend Vercel mà không làm gián đoạn trải nghiệm người dùng.
   - Khi chạy HTTPS (Production): Tự động dùng Backend Vercel HTTPS để tránh lỗi Mixed-Content.
   - Sử dụng tiền tố **`NEXT_PUBLIC_DEPLOY_URL`** và **`NEXT_PUBLIC_LOCAL_URL`** để client bundle trong Next.js luôn đọc đúng cấu hình môi trường.

---

## 🔥 6. Tích Hợp Firebase Authentication Cho Google Sign-In & Dọn Sạch Passport

1. **Frontend Firebase Popup Authentication:**
   - Cài đặt thư viện `firebase` SDK ở Client.
   - Tạo [firebase.js](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/lib/firebase.js) với `GoogleAuthProvider` và `signInWithPopup`.
   - Đăng nhập bằng cửa sổ Popup hiện đại, không load lại trang, không bị lỗi cấu hình redirect URL.
2. **Backend Verify ID Token API (`POST /api/auth/google`):**
   - Tiếp nhận `idToken` từ Frontend, xác thực với `google-auth-library` và `jsonwebtoken`.
   - Tự động tra cứu hoặc khởi tạo User trong cơ sở dữ liệu Supabase/Prisma.
   - Ký và trả về session JWT Token 2 giờ chuẩn mực.
3. **Chuyển Hướng Sau Đăng Nhập:**
   - Sau khi đăng nhập thành công, tự động lưu session vào `localStorage` (`boardmates-auth-storage`) và chuyển hướng về **Trang Chủ (`/`)**.
   - Thanh điều hướng (Navbar) tự động hiển thị Avatar, tên tài khoản và menu cá nhân thay vì nút Đăng nhập.
4. **Dọn Sạch Toàn Bộ Passport OAuth Cũ:**
   - Gỡ bỏ hoàn toàn thư viện `passport` và `passport-google-oauth20`.
   - Xóa bỏ file `backend/src/config/passport.js` và middleware `passport.initialize()`.
   - Xóa bỏ các route redirect cũ `GET /api/auth/google` và `GET /api/auth/google/callback`.

---

## 📱 7. Hệ Thống Progressive Web App (PWA) & Tối Ưu Hóa Responsive Mobile Toàn Diện

1. **Web App Manifest (`src/app/manifest.js`):**
   - Định nghĩa App Name, Theme Color (`#A85B00`), Background Color (`#FFFBF3`), Display `standalone`, Orientation `portrait-primary`.
   - Tích hợp 3 **App Shortcuts** (Khám phá, Gia nhập Core Team, Vault) khi ấn giữ icon trên màn hình điện thoại.
2. **Bộ Icon Chuẩn Đa Nền Tảng (`public/icons/`):**
   - Tạo trọn bộ `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (Android Adaptive Safe Margin), và `apple-touch-icon.png` (iOS Safari).
3. **Service Worker Engine (`public/sw.js` & `src/lib/sw-register.js`):**
   - Caching Stale-While-Revalidate cho Google Fonts (*Newsreader, Manrope, Space Grotesk*) và static assets giúp mở app 0ms.
   - Tự động fallback sang màn hình ngoại tuyến **`SYSTEM_OFFLINE.EXE`** (`src/app/offline/page.jsx`) khi mất kết nối mạng 4G/Wifi.
4. **Trải Nghiệm Cài Đặt (PWA Installation):**
   - Thêm nút **`[ 📲 Tải App Về Máy ]`** ngay tại Hero Section trên trang chủ.
   - Popup retro **`INSTALL_BOARDMATES.EXE`** tự động kích hoạt trên Android / Chromium.
   - Modal hướng dẫn trực quan 2 bước dành riêng cho iOS Safari (Bấm Share `⎋` $\rightarrow$ Add to Home Screen `⊞`).
   - Tự động nhận diện chế độ Standalone và hiển thị huy hiệu `● PWA STANDALONE`.
5. **Khắc Phục Lỗi Responsive Mobile:**
   - Xử lý **Safe Area Insets** (`.safe-top`, `.safe-bottom`, `.pb-safe`, `viewport-fit=cover`) chống tràn viền Tai thỏ / Dynamic Island và thanh gạt Home Bar.
   - Khắc phục va chạm giữa logo BoardMates và nút Đăng Nhập trên Navbar bằng `min-w-0 shrink` và logo co giãn linh hoạt.
   - Khắc phục chữ tiêu đề BoardMates bị tràn khỏi khung đăng nhập / đăng ký trên màn hình nhỏ ($< 380\text{px}$).
   - Đảm bảo toàn bộ touch targets $\ge 44\text{px}$ và thêm `touch-action: pan-y` cho khối 3D WebGL.

---

## 🗄️ 8. Cơ Chế Lưu Trữ Dữ Liệu Tài Khoản Google Trong Database (PostgreSQL)

Tất cả tài khoản đăng nhập bằng Google đều được lưu trữ trực tiếp vào bảng **`User`** với cấu trúc dữ liệu chuẩn:

| Tên Cột | Kiểu Dữ Liệu | Giá trị khi Đăng nhập Google | Mô tả |
|---|---|---|---|
| `id` | `Int` (Autoincrement) | `1, 2, 3...` | Khóa chính tự tăng |
| `username` | `String` | Lấy từ `displayName` | Tên người dùng |
| `email` | `String` (Unique) | Email Google | Địa chỉ Email duy nhất |
| `googleId` | `String` (Unique) | Google `sub` / UID | ID định danh từ Google |
| `avatarUrl` | `String` | Link ảnh đại diện | Avatar Google CDN |
| `password` | `String` | Hash Bcrypt ngẫu nhiên | Mật khẩu bảo mật ngẫu nhiên |
| `role` | `Enum Role` | `'USER'` | Quyền hạn mặc định |
| `status` | `Enum UserStatus` | `'ACTIVE'` | Trạng thái hoạt động |
| `createdAt` | `DateTime` | Timestamp | Thời điểm tạo tài khoản |

---

## 📄 9. Tính Năng Xem Trước & Xuất Catalog Kho Game Ra File PDF (A4 Magazine & Table)

1. **Giao Diện Modal Xem Trước (Live A4 Print Preview):**
   - Tạo component [`frontend/src/components/vault/ExportPdfModal.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/vault/ExportPdfModal.jsx) chuẩn thiết kế Retro / Editorial.
   - Hỗ trợ 2 phong cách bố cục: **Tạp chí 2 cột (Magazine Grid)** với ảnh bìa nổi bật và **Bảng Danh Mục (Compact Table)** cô đọng.
   - Bộ lọc phạm vi xuất linh hoạt: *Tất cả game*, *Đang trên kệ (`ON_SHELF`)*, *Muốn bán/thuê (`FOR_SALE`)*, *Đang cho mượn (`LENT_OUT`)*, hoặc *Wishlist*.
   - Cho phép tùy chỉnh: Tiêu đề bộ sưu tập, Thông tin liên hệ (SĐT, Zalo, địa chỉ giao lưu), Bật/tắt hiển thị ghi chú cá nhân, đánh giá sao và người mượn.
2. **Nhúng Mã QR Code Trực Tiếp:**
   - Tích hợp thư viện `qrcode.react` tạo mã QR SVG chuẩn xác, hỗ trợ quét camera điện thoại để truy cập trực tiếp vào kho game hoặc liên hệ chủ kho.
3. **Bộ Sinh PDF Chuẩn A4 Chất Lượng Cao:**
   - Kết hợp `html2canvas` (độ phân giải 2x Retina, hỗ trợ CORS ảnh CDN BGG) và `jspdf` để xuất file `.pdf` sắc nét, tự động phân trang A4 thông minh và không bị lỗi font tiếng Việt.
   - Nút **"In Ngay"** hỗ trợ gửi lệnh in ấn trực tiếp tới máy in qua `window.print()`.
4. **Nâng Cấp Backend Tải Toàn Bộ Danh Mục:**
   - Cập nhật [`backend/src/controller/shelf.controller.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/src/controller/shelf.controller.js) hỗ trợ `limit=500` game/request giúp xuất trọn vẹn toàn bộ kho game trong 1 lần bấm.

---

## ⚡ 10. Tích Hợp Chỉ Số Độ Khó BGG (Weight / Complexity) & Tự Động Đồng Bộ Toàn Bộ Kho Game

1. **Bổ Sung Dữ Liệu BGG Dynamic Stats Vào Cơ Sở Dữ Liệu (`BoardGame` Model):**
   - Đã thêm các trường `weight` (Float: 1.00 - 5.00), `bggRating` (Float: 1.0 - 10.0), `bggRank` (Int), `bggId` (Int) vào Prisma Schema và đồng bộ lên PostgreSQL Supabase.
2. **Khai Thác BGG API Tự Động:**
   - Cập nhật [`backend/src/services/bgg.service.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/src/services/bgg.service.js) tự động lấy độ khó, điểm rating, thứ hạng thế giới và số người chơi hay nhất (`bestPlayers`) từ `api.geekdo.com/api/dynamicinfo`.
3. **Hiển Thị Trực Quan Trên Giao Diện Kho Game (`/vault`):**
   - Danh sách game nằm ngang: Cột Thông số hiển thị huy hiệu `⚡ X.XX/5` phân màu 4 cấp bậc:
     * 🟢 **< 2.0**: Nhập môn
     * 🟡 **2.0 - 3.0**: Vừa phải
     * 🟠 **3.0 - 4.0**: Chiến thuật
     * 🔴 **>= 4.0**: Chuyên gia
   - Modal Thêm Game: Thẻ xem trước (Preview) hiển thị đầy đủ bộ 3 chỉ số Độ khó BGG, Score và Rank.
   - Catalog PDF Modal: Hiển thị độ khó chi tiết trên cả Magazine Card và Table Layout.
4. **Tự Động Đồng Bộ (Backfill) Cho Toàn Bộ Game Đã Có Trên Kệ:**
   - Chạy script [`backend/scripts/sync_bgg_weights.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/scripts/sync_bgg_weights.js) kết hợp 72k records và từ điển Top BGG để đồng bộ tự động cho toàn bộ các game đã nạp trong kho (Gloomhaven, Cascadia, Dune: Imperium, Wingspan, Twilight Imperium, Gaia Project, v.v.).
5. **Bộ Lọc & Sắp Xếp Theo Độ Khó & Điểm BGG Score (Filter & Sort by Weight & BGG Score):**
   - **Backend API:** Cập nhật [`backend/src/controller/shelf.controller.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/src/controller/shelf.controller.js) hỗ trợ:
     * `difficulty=LIGHT|MEDIUM|MEDIUM_HEAVY|HEAVY`
     * `bggScore=8_PLUS|7_8|6_7|UNDER_6`
     * `sortBy=bggRating|bggRank|weight|name|rating|createdAt` với `sortOrder=asc|desc`.
   - **Frontend Vault Toolbar Đa Tầng:** 
     * **Tầng 1 (Bộ lọc tiêu chí):** Tìm kiếm + Trạng thái + Thể loại + Độ khó BGG + Điểm BGG.
     * **Tầng 2 (Thanh Sắp Xếp Thứ Tự Chuyên Biệt):** Các nút bấm nhanh (*⭐ Điểm BGG*, *⚡ Độ khó BGG*, *🏆 Top BXH BGG*, *🔤 Tên game*, *🕒 Mới cập nhật*, *🆕 Mới thêm*, *💖 Đánh giá*).
     * **Nút Đảo Chiều Thứ Tự Trực Quan:** Bấm nút `[ ↕️ Thứ tự: Tăng dần (▲) / Giảm dần (▼) ]` hoặc bấm lại vào chip đang chọn để đổi chiều tức thì.
     * **Nút Đặt Lại (Reset Filters):** Xóa toàn bộ bộ lọc và hoàn nguyên thứ tự sắp xếp về mặc định chỉ với 1 click.
   - **PDF Catalog Export Modal:** Hỗ trợ lọc đồng thời theo trạng thái, độ khó và mức điểm BGG Score để xuất tài liệu chuyên biệt.
6. **Đồng Bộ Thứ Tự Sắp Xếp Khi Xuất PDF (PDF Sort Order Sync):**
   - Khi bấm **[ 📄 Xuất Catalog PDF ]**, hệ thống tự động kế thừa đúng tiêu chí sắp xếp và chiều thứ tự (tăng dần/giảm dần) mà bạn đang chọn trên trang kho game.
   - Cho phép tinh chỉnh hoặc đổi thứ tự sắp xếp trực tiếp ngay bên trong Modal Xem trước PDF (*⭐ Điểm BGG*, *⚡ Độ khó BGG*, *🏆 BXH BGG*, *🔤 Tên A-Z*...).
   - Đánh số thứ tự `#01, #02, #03...` và dàn trang trong file PDF sẽ tự động sắp xếp 100% khớp theo tiêu chí bạn đã chọn.




