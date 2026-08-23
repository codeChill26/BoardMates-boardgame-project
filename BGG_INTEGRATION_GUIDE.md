# 🎲 Tài Liệu Hướng Dẫn Tích Hợp BoardGameGeek (BGG) & Quản Lý Kho Game (Vault)

Tài liệu này ghi lại toàn bộ kiến trúc, cơ chế hoạt động, cấu trúc dữ liệu và hướng dẫn sử dụng các tính năng kết nối trực tiếp đến **BoardGameGeek (BGG)** cùng hệ thống **Import CSV / Quản lý Kho Game (Vault) / Xuất Catalog PDF** đã được hoàn thiện trong dự án **BoardMates (Dicero)**.

---

## 📌 1. Tổng Quan Kiến Trúc & Nguồn Dữ Liệu BGG

Để mang lại trải nghiệm tra cứu và thêm game mượt mà nhất, hệ thống kết hợp 4 lớp dữ liệu:

1. **BGG Global Index (72,062 Games)**:
   - File dữ liệu: [`backend/data/bgg_72k_index.json`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/data/bgg_72k_index.json)
   - Chứa danh mục 72.062 boardgame được xếp hạng trên BGG toàn cầu, nạp trực tiếp vào RAM Backend khi khởi động giúp tra cứu bất kỳ tên game nào trên thế giới chỉ trong **< 5ms**.
2. **BGG Geekdo JSON API (Chi tiết & Ảnh HD)**:
   - Endpoint: `https://api.geekdo.com/api/geekitems?objectid={bggId}&objecttype=thing`
   - Trích xuất tự động: Tên game, năm phát hành, số người chơi (`minPlayers` - `maxPlayers`), thời lượng chơi (`playTime`), độ tuổi tối thiểu (`minAge`), thể loại (`categories`), nhà phát hành (`publisher`), mô tả đã làm sạch HTML, và link ảnh bìa gốc HD từ CDN `cf.geekdo-images.com`.
3. **BGG Dynamic Stats API (Độ Khó, Điểm Rating & Rank Thế Giới)**:
   - Endpoint: `https://api.geekdo.com/api/dynamicinfo?objectid={bggId}&objecttype=thing`
   - Trích xuất tức thì:
     * ⚡ **`weight` (Độ khó BGG)**: Điểm phức tạp từ `1.00` đến `5.00` do hàng trăm nghìn người chơi bình chọn.
     * ⭐ **`bggRating` (Điểm BGG Score)**: Điểm trung bình từ `1.0` đến `10.0`.
     * 🏆 **`bggRank` (Thứ hạng BGG)**: Thứ hạng game toàn cầu trên bảng xếp hạng BGG.
     * 👥 **`bestPlayers`**: Số lượng người chơi lý tưởng nhất do cộng đồng khuyến nghị.
4. **BGG Hotness API (Xu hướng thế giới)**:
   - Endpoint: `https://api.geekdo.com/api/hotness`
   - Cung cấp danh sách Top 50 boardgame đang được quan tâm nhất thế giới trong ngày.

---

## 🖥️ 2. Giao Diện Người Dùng (Frontend UI/UX)

Trang quản lý: **[Kho Game / Vault](http://localhost:3007/vault)** ([`frontend/src/app/(main)/vault/page.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/app/%28main%29/vault/page.js))

### 2.1. Thanh Tìm Kiếm & Bộ Lọc Nâng Cao Đa Tầng (Multi-tier Toolbar)
- **Tầng 1 - Bộ lọc tiêu chí**:
  * 🔍 **Tìm kiếm nhanh**: Theo tên game (hỗ trợ tiếng Việt có dấu/không dấu, debounce 300ms).
  * 🏠 **Trạng thái**: *Đang trên kệ, Đang cho mượn, Muốn bán / thuê, Muốn sưu tầm*.
  * 🎲 **Thể loại**: *Chiến thuật, Kinh tế, Gia đình, Party, Đấu trí, Giải đố...*
  * ⚡ **Độ khó BGG (Weight)**:
    * 🟢 **Nhập môn** (`< 2.0`)
    * 🟡 **Vừa phải** (`2.0 – 3.0`)
    * 🟠 **Chiến thuật** (`3.0 – 4.0`)
    * 🔴 **Chuyên gia** (`≥ 4.0`)
  * ⭐ **Điểm BGG Score**:
    * ⭐ **Xuất sắc** (`≥ 8.0/10`)
    * ⭐ **Tốt** (`7.0 – 8.0/10`)
    * ⭐ **Khá** (`6.0 – 7.0/10`)
    * ⭐ **Dưới 6.0/10**
- **Tầng 2 - Thanh Sắp Xếp Thứ Tự Chuyên Biệt (Quick Sort Chips)**:
  * Nút bấm nhanh 1 click: ⭐ **Điểm BGG** | ⚡ **Độ khó BGG** | 🏆 **Top BXH BGG** | 🔤 **Tên game** | 🕒 **Mới cập nhật** | 🆕 **Mới thêm** | 💖 **Đánh giá cá nhân**.
  * **Nút Đảo Chiều Thứ Tự**: `[ ↕️ Thứ tự: Tăng dần (▲) / Giảm dần (▼) ]`.
  * **Nút Đặt Lại (`Reset`)**: Tự động hiển thị khi có bộ lọc hoạt động để đưa về mặc định chỉ với 1 click.

---

### 2.2. Danh Sách Game Nằm Ngang (Horizontal Card List View)
- Mỗi thẻ game hiển thị huy hiệu độ khó `⚡ X.XX/5` phân màu rõ ràng:
  * 🟢 Nhập môn (vd: *Catan - 2.3/5*, *Cascadia - 1.8/5*)
  * 🟡 Vừa phải (vd: *Wingspan - 2.4/5*, *Pandemic - 2.4/5*)
  * 🟠 Chiến thuật (vd: *Dune: Imperium - 3.0/5*, *Scythe - 3.4/5*)
  * 🔴 Chuyên gia (vd: *Gloomhaven - 3.9/5*, *Twilight Imperium 4e - 4.3/5*)

---

### 2.3. Modal "Thêm Game Lên Kệ" (2 Tab Tinh Gọn)
Khi bấm **"+ Thêm Game Lên Kệ"**:
1. **🌐 Tab 1: Chọn game từ BoardGameGeek (BGG)**:
   - Tra cứu tức thì theo Tên hoặc BGG ID.
   - Thẻ xem trước hiển thị bộ 3 chỉ số vàng: **⚡ Độ khó BGG**, **⭐ BGG Score**, **🏆 Thứ hạng BXH**.
   - Tùy chỉnh tình trạng box, trạng thái kệ, ghi chú và lưu vào database.
2. **✏️ Tab 2: Tự tạo game mới**:
   - Cho phép nhập thủ công các tựa game nội bộ, game thiết kế riêng.

---

### 2.4. Modal Xuất Catalog PDF Tương Tác ([`ExportPdfModal.jsx`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/frontend/src/components/vault/ExportPdfModal.jsx))
- **Live Preview A4**: Xem trước catalog trước khi in.
- **2 Phong cách bố cục**: *Tạp chí 2 cột (Magazine Card)* hoặc *Bảng tổng hợp (Compact Table)*.
- **Tự động đồng bộ thứ tự**: Kế thừa và cho phép đổi thứ tự sắp xếp (*Điểm BGG, Độ khó, Top BXH, Tên A-Z...*) ngay trong modal.
- **Tích hợp mã QR cá nhân**: Khách quét mã QR để truy cập trực tiếp kệ game của bạn trên web.
- **Đóng gói PDF chất lượng cao**: Sử dụng `html-to-image` + `jsPDF` render siêu nét, kèm chế độ in trực tiếp bằng trình duyệt (`window.print`).

---

## 🔌 3. Danh Sách API Endpoints Backend

Mã nguồn: [`backend/src/routes/shelf.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/src/routes/shelf.js) & [`backend/src/controller/shelf.controller.js`](file:///d:/FPT%20MATERIALS/MyOwn/BG-Project/backend/src/controller/shelf.controller.js)

### 3.1. Tìm kiếm BoardGame BGG (Search)
- **Method**: `GET`
- **URL**: `/api/shelf/bgg/search?query={tên_game_hoặc_id}`

### 3.2. Lấy Chi Tiết Game & BGG Stats
- **Method**: `GET`
- **URL**: `/api/shelf/bgg/details/:bggId`
- **Response mẫu**:
```json
{
  "success": true,
  "data": {
    "bggId": 316554,
    "name": "Dune: Imperium",
    "yearPublished": 2020,
    "minPlayers": 1,
    "maxPlayers": 4,
    "playTime": 120,
    "minAge": 14,
    "weight": 3.05,
    "bggRating": 8.4,
    "bggRank": 6,
    "bestPlayers": "3-4",
    "imageUrl": "https://cf.geekdo-images.com/...",
    "categories": ["Sci-Fi", "Political", "Strategy"]
  }
}
```

### 3.3. Lấy Danh Sách Kệ Kèm Bộ Lọc & Sắp Xếp
- **Method**: `GET`
- **URL**: `/api/shelf?page=1&limit=10&status=ALL&category=ALL&difficulty=MEDIUM_HEAVY&bggScore=8_PLUS&sortBy=bggRating&sortOrder=desc`
### 3.4. Nhập Game BGG vào Kệ Cá Nhân
- **Method**: `POST`
- **URL**: `/api/shelf/bgg/import`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "bggId": 316554,
  "condition": "Like New 99%",
  "status": "ON_SHELF",
  "personalRating": 5.0,
  "personalNotes": "Đã bọc toàn bộ thẻ bài và mua thêm sleeve cao cấp"
}
```

---

### 3.5. Tải Template CSV & Batch Import CSV
- **Tải File Mẫu**: `GET /api/shelf/template/csv`
- **Nạp Hàng Loạt**: `POST /api/shelf/batch-import`
- **Headers**: `Authorization: Bearer {token}`

---

## 🛠️ 4. Script Tự Động Đồng Bộ Dữ Liệu BGG Stats (Backfill Script)

Để cập nhật tự động toàn bộ boardgame đã có trong cơ sở dữ liệu với các chỉ số BGG mới nhất:

```bash
cd backend
node scripts/sync_bgg_weights.js
```

Script thực hiện:
1. Quét toàn bộ các game trong bảng `BoardGame` trên PostgreSQL Supabase.
2. Khớp với cơ sở dữ liệu 72.062 games và từ điển BGG.
3. Tự động cập nhật `weight`, `bggRating`, `bggRank`, `bggId` cho tất cả các game.
4. Ngay lập tức mọi kệ game của người dùng đều tự động hiển thị đầy đủ thông số BGG mà không cần thao tác thủ công.

---

## 📋 5. Bảng Tham Chiếu Một Số Tựa Game Tiêu Biểu

| Tên Game | BGG ID | Độ Khó (Weight) | Điểm BGG | BXH Thế Giới | Link BGG |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Brass: Birmingham** | `224517` | 🔴 `3.88/5` | ⭐ `8.6` | 🏆 `#1` | [BGG #224517](https://boardgamegeek.com/boardgame/224517) |
| **Gloomhaven** | `174430` | 🔴 `3.90/5` | ⭐ `8.6` | 🏆 `#3` | [BGG #174430](https://boardgamegeek.com/boardgame/174430) |
| **Dune: Imperium** | `316554` | 🟠 `3.05/5` | ⭐ `8.4` | 🏆 `#6` | [BGG #316554](https://boardgamegeek.com/boardgame/316554) |
| **Scythe** | `169786` | 🟠 `3.45/5` | ⭐ `8.1` | 🏆 `#17` | [BGG #169786](https://boardgamegeek.com/boardgame/169786) |
| **Wingspan** | `266192` | 🟡 `2.47/5` | ⭐ `8.0` | 🏆 `#28` | [BGG #266192](https://boardgamegeek.com/boardgame/266192) |
| **Cascadia** | `295947` | 🟢 `1.84/5` | ⭐ `7.9` | 🏆 `#41` | [BGG #295947](https://boardgamegeek.com/boardgame/295947) |
| **Catan** | `13` | 🟡 `2.30/5` | ⭐ `7.1` | 🏆 `#512` | [BGG #13](https://boardgamegeek.com/boardgame/13) |
| **Cyclades** | `54998` | 🟠 `2.84/5` | ⭐ `7.5` | 🏆 `#232` | [BGG #54998](https://boardgamegeek.com/boardgame/54998) |

---

## 🧪 6. Cách Chạy Thử API Trực Tiếp (cURL / Terminal)

```bash
# 1. Tìm kiếm BoardGame theo tên (hỗ trợ tiếng Việt hoặc tiếng Anh)
curl "http://localhost:8080/api/shelf/bgg/search?query=Cyclades"
curl "http://localhost:8080/api/shelf/bgg/search?query=Quack"

# 2. Lấy Top 50 game hot trên thế giới từ BGG
curl "http://localhost:8080/api/shelf/bgg/hotness"

# 3. Xem chi tiết game Dune: Imperium (BGG ID: 316554)
curl "http://localhost:8080/api/shelf/bgg/details/316554"

# 4. Tải file mẫu CSV
curl "http://localhost:8080/api/shelf/template/csv" -o sample_shelf_games.csv
```
