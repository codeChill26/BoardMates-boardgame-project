# 📋 Chi Tiết Các Thay Đổi & Tính Năng Đã Thực Hiện (Changelog)

Tài liệu này ghi lại toàn bộ các tính năng, nâng cấp và tinh chỉnh đã thực hiện cho hệ thống **BoardMates**:

---

## 🎲 1. Tính Năng Kho BoardGame Cá Nhân (Personal Game Vault)

### 1.1. Chuẩn hóa Cơ Sở Dữ Liệu (Master-Detail Schema)
- **Model `BoardGame`:** Đóng vai trò là bảng tổng quản (Master Catalog) lưu thông tin gốc của game (`name`, `description`, `categories`, `minPlayers`, `maxPlayers`, `playTime`, `age`, `publisher`, `imageUrl`). Mỗi tựa game chỉ tồn tại 1 bản ghi duy nhất trong hệ thống.
- **Model `ShelfGame`:** Bảng trung gian liên kết giữa `User` và `BoardGame`, lưu thông tin cá nhân của người sở hữu:
  - `condition`: Tình trạng hộp game (Mới 100%, Like New 99%, Sleeved...).
  - `status`: Trạng thái trên kệ (`ON_SHELF`, `LENT_OUT`, `FOR_SALE`, `WISHLIST`).
  - `borrowerName`, `borrowedDate`, `expectedReturnDate`: Chi tiết người đang mượn game.
  - `personalRating`: Đánh giá cá nhân 1–5 sao.
  - `personalNotes`: Ghi chú riêng tư.
  - Ràng buộc duy nhất `@@unique([userId, gameId])`.

### 1.2. Backend APIs (`/api/shelf`)
- `GET /api/shelf`: Lấy danh sách game trên kệ (hỗ trợ phân trang, tìm kiếm, lọc theo `status`, `category`, `players`, sắp xếp).
- `GET /api/shelf/stats`: Thống kê số lượng game theo từng trạng thái.
- `POST /api/shelf`: Thêm game vào kệ (từ danh mục có sẵn hoặc tạo mới).
- `PUT /api/shelf/:id`: Chỉnh sửa thông tin cá nhân trên kệ.
- `DELETE /api/shelf/:id`: Xóa game khỏi kệ người dùng.
- `POST /api/shelf/bgg/import`: Import trực tiếp game từ BoardGameGeek vào hệ thống và gắn vào kệ.

### 1.3. Giao Diện Người Dùng (`/vault`)
- Thiết kế **Horizontal List View** (dạng hàng ngang) gọn gàng, thanh lịch, có phân trang rõ ràng thay thế card lớn.
- Bảng tổng hợp KPI thống kê nhanh ở đầu trang.
- Bộ lọc đa năng (Trạng thái, Thể loại, Số người chơi, Tìm kiếm tức thì).

---

## ⚡ 2. Cải Tiến Tìm Kiếm & Hiển Thị Thumbnail BGG

1. **Tìm kiếm chỉ khi nhấn Enter hoặc bấm nút:**
   - Đã gỡ bỏ tìm kiếm tự động theo từng phím gõ để tránh spam request.
   - Người dùng nhập tên/ID rồi nhấn **`Enter ↵`** hoặc bấm **"Tìm kiếm"** để thực thi.
2. **Xử lý Thumbnail & Link ảnh sắc nét 100%:**
   - Bổ sung hàm `sanitizeImageUrl` để tự động bóc tách link ảnh gốc từ đường dẫn Google Images (`https://www.google.com/imgres?q=...&imgurl=...`).
   - Tự động lấy ảnh `square200` chính thức từ BGG CDN và lưu cache bộ nhớ.
   - Thêm `referrerPolicy="no-referrer"` và fallback `onError` trên toàn bộ thẻ ảnh.
   - Đã quét và cập nhật lại toàn bộ ảnh bìa cho các game trong cơ sở dữ liệu.

---

## 🔒 3. Cơ Chế Tự Động Đăng Xuất Sau 2 Tiếng Không Hoạt Động (2-Hour Inactivity Timeout)

1. **Quy tắc 2 tiếng (`SESSION_INACTIVITY_LIMIT = 2 * 60 * 60 * 1000 ms`):**
   - Lắng nghe toàn bộ tương tác người dùng (`mousemove`, `mousedown`, `keydown`, `scroll`, `touchstart`, `click`).
   - Mỗi tương tác sẽ tự động gia hạn thêm 2 tiếng (áp dụng cơ chế throttle 15s để tiết kiệm tài nguyên).
2. **Quản lý phiên toàn cục (`SessionTimeoutManager`):**
   - Đặt tại `frontend/src/components/common/SessionTimeoutManager.jsx` và nhúng vào `RootLayout` (`frontend/src/app/layout.js`).
   - Tự động kiểm tra định kỳ mỗi 30s hoặc khi người dùng quay lại tab/focus trình duyệt (`visibilitychange` & `window focus`).
   - Khi hết hạn: Tự động kích hoạt `logout()`, điều hướng về `/login?session=expired` và hiển thị thông báo popup thông báo phiên đã hết hạn.
3. **Đồng bộ Token Backend:**
   - Cập nhật thời hạn JWT Token thành **2 giờ** (`{ expiresIn: '2h' }`) trong `auth.controller.js` và `auth.js`.

---

## 📥 4. Nâng Cấp Import Excel (.xlsx) / CSV Tối Giản & Tự Động Nạp Toàn Bộ Từ BGG (BGG Auto-Import)

1. **Hỗ trợ trực tiếp định dạng Excel (.xlsx / .xls):**
   - Người dùng có thể bấm **"Tải File Excel Mẫu (.xlsx)"** trực tiếp trên web để mở và chỉnh sửa trong Microsoft Excel mà **100% không bao giờ bị lỗi font Tiếng Việt hay dấu phân cách**.
   - Trình duyệt tích hợp thư viện `xlsx` (SheetJS) đọc trực tiếp định dạng nhị phân/XML của Excel và CSV một cách mượt mà.
2. **Cấu trúc File mẫu tối giản (Chỉ cần 3 cột):**
   - Cột 1: `Link BGG / BGG ID` (Ví dụ: `https://boardgamegeek.com/boardgame/218179/princess-jing` hoặc `218179`).
   - Cột 2: `Tên BoardGame` (Ví dụ: `Princess Jing`, `Catan`, `Tam Cúc`...).
   - Cột 3: `Ghi chú cá nhân` (Ví dụ: `Bản sưu tầm, đã bọc bài sleeves đầy đủ`...).
3. **Cơ chế Tự Động Kéo Dữ Liệu BGG khi Import:**
   - Backend tự động bóc tách mã số `bggId` từ đường link hoặc ID số.
   - Tự động gọi API BGG chính thức để tải về toàn bộ ảnh bìa HD (`square200`), số người chơi tối thiểu/tối đa, độ tuổi, thời gian chơi, thể loại và mô tả chi tiết của từng game.
   - Khởi tạo Master Record chuẩn hóa trong database và gắn vào kệ của User với ghi chú riêng tư.
4. **Tiện ích 1-Chạm trên Giao Diện Vault:**
   - Nút **`🔍 Tìm trên BGG ↗`**: Mở tab Google tìm kiếm chính xác game trên BGG để người dùng copy link trong 1 click.
   - Nút **`📋 Dán link & Tải Game`**: Tự động đọc clipboard, dán link BGG và nạp game ngay lập tức.
   - Bảng xem trước Excel/CSV hiển thị rõ trạng thái `⚡ Tự tải từ BGG` trước khi nạp.

---

## 🚀 5. Deploy Backend Lên Vercel & Cơ Chế Tự Động Chuyển Đổi URL (Smart Backend Failover)

1. **Deploy Thành Công Backend Lên Vercel:**
   - URL Backend Production: `https://board-mates-boardgame-project-v45x-ax6pwse1m.vercel.app`
   - Gỡ bỏ hoàn toàn `jade` và các phụ thuộc cũ để tương thích 100% với môi trường Vercel Serverless Function.
   - Thêm `api/index.js` và `vercel.json` phục vụ điều hướng Serverless.
2. **Loại Bỏ Hoàn Toàn Link Render Cũ & Đồng Bộ Môi Trường:**
   - Cập nhật `DEPLOY_URL` trong `frontend/.env` trỏ về Vercel.
   - Cập nhật danh sách Server trong `backend/src/config/swagger.js`.
3. **Cơ Chế Tự Động Chuyển Đổi Thông Minh (Smart Failover in `frontend/src/lib/apiConfig.js`):**
   - Khi chạy Local: Hệ thống kiểm tra (`ping /api`) xem Backend Local (`http://localhost:8080`) có đang mở hay không.
   - **Nếu Local đang tắt hoặc lỗi $\rightarrow$ Tự động chuyển toàn bộ request sang Backend Vercel** mà không làm gián đoạn trải nghiệm người dùng.
   - Khi chạy HTTPS (Production): Tự động dùng Backend Vercel HTTPS để tránh lỗi Mixed-Content.
