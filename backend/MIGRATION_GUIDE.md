# Hướng dẫn kết nối và Migration với Prisma (PostgreSQL)

Tài liệu này hướng dẫn cách kết nối Prisma với cơ sở dữ liệu PostgreSQL và cách quản lý database schema trong dự án `Dicero_Project_BE2`.

## 1. Cấu hình biến môi trường

Đầu tiên, bạn cần cấu hình đường dẫn kết nối đến CSDL PostgreSQL local của bạn.

1. Copy file `.env.example` thành file `.env` ở thư mục gốc của project:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` và chỉnh sửa lại chuỗi `DATABASE_URL` với các thông số CSDL chuẩn của bạn:
   ```env
   DATABASE_URL="postgres://<username>:<password>@<host>:<port>/<database>"
   ```
   *Ví dụ:* `DATABASE_URL="postgres://postgres:123456@localhost:5432/DiceroBG"`

## 2. Các lệnh Prisma cơ bản

Mở terminal và di chuyển vào thư mục `Dicero_Project_BE2` trước khi chạy các lệnh sau.

### Thao tác trong môi trường Development

- **Đồng bộ hóa schema (Không tạo file migration):**
  Lệnh này sẽ ép cấu trúc trong `prisma/schema.prisma` lên thẳng CSDL. Dùng lệnh này khi bạn đang thiết kế bảng và không cần lưu lại lịch sử di chuyển (migrate).
  ```bash
  npx prisma db push
  ```

- **Tạo Migration mới (Có lưu lịch sử):**
  Khi database design đã ổn định, mỗi lần có thay đổi, bạn nên tạo ra một bản migration để cập nhật CSDL.
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```
  *Ví dụ:* `npx prisma migrate dev --name init_database`

- **Khởi tạo Prisma Client:**
  Sau khi cập nhật schema, cập nhật Prisma Client cho Node.js. Chạy lệnh:
  ```bash
  npx prisma generate
  ```

### Khôi phục lại Database (Khi gặp lỗi cấu trúc)

Nếu schema và DB lệch nhau hoặc gặp lỗi xung đột, bạn có thể xóa sạch và tạo lại:
```bash
npx prisma migrate reset
```
Hoặc dùng lệnh push xóa ép buộc:
```bash
npx prisma db push --force-reset
```

## 3. Xem dữ liệu

Prisma cung cấp một giao diện web trực quan để bạn kiểm tra trực tiếp dữ liệu (như PhpMyAdmin gốc Nodejs):
```bash
npx prisma studio
```
Lệnh này sẽ mở trình duyệt tại địa chỉ `http://localhost:5555`.

---
**Lưu ý cho Team:** Project này sử dụng Prisma version 7.x, vì vậy một số cấu hình migration được đặt thẳng ở `prisma.config.ts`, và `DATABASE_URL` sẽ được Prisma nạp qua config đó thay vì định nghĩa cứng bên trong khối `datasource` của `schema.prisma`.
