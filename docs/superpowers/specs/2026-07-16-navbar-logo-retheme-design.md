# Navbar restructure, logo, and BoardMates retheme

Date: 2026-07-16
Status: approved (design), pending spec review

## Goal

Chuyển website từ marketplace "Dicero" sang trang giới thiệu dự án + tuyển Core team "BoardMates", theo IA rút gọn từ `frontend/Refactor.md`. Navbar mới, gắn logo, và đổi tone màu toàn site theo nền logo.

Marketplace và đăng nhập bị ẩn khỏi navbar (tạm thời) — không gỡ code, không gỡ auth.

## Ràng buộc: KHÔNG redesign

User đã chốt: *"bố cục vẫn giữ nguyên, design cũng vậy, chỉ là màu sắc và tên logo"*.

Thay đổi thị giác **chỉ gồm**: palette màu, logo, và tên BoardMates. Bố cục và design language hiện tại **giữ nguyên tuyệt đối**.

### Design language đang sống

Trang chủ (`app/(main)/page.js`) đã cài sẵn phong cách **retro desktop / cửa sổ**, dùng Tailwind + token:

- `.window-border` (viền 2px), `.window-shadow` (đổ bóng cứng 4px), `.retro-title-bar`
- Thanh tiêu đề kiểu cửa sổ với nhãn `.exe` / `.img` (`system_welcome.exe`, `board_game_01.img`) và 2 chấm tròn góc phải
- Nút: `window-shadow` + `hover:translate-x-1 hover:translate-y-1 hover:shadow-none`
- Font: `font-headline` (Newsreader) cho tiêu đề, `font-label` (Space Grotesk) uppercase tracking-widest cho nhãn, `font-body` (Manrope) cho nội dung

**Mục Design Language trong Refactor.md mô tả đúng thứ đang chạy, không phải thứ mới.** Trang mới (`/community`, `/events`, `/join-us`, `/about`) **bám theo đúng vocabulary này** — dùng lại `window-border`, `window-shadow`, `retro-title-bar`, nhãn `.exe`. Đó là giữ nguyên design, không phải redesign.

### Không làm

- Pixel Cursor, Window Open/Close animation, Typing Effect, Loading Screen — Refactor.md có liệt kê nhưng **chưa hề tồn tại** trong code. Thêm vào = redesign = ngoài scope.
- Không đổi bố cục Navbar (chỉ thay link, thêm logo, đổi màu).
- Không đụng bố cục trang chủ.
- Không tạo component/class style mới ngoài những gì đã có.

### `components/sections/` là code chết — không dùng lại

`HowItWorksSection`, `CategoriesSection`, `CtaSection`, `TestimonialsSection`, `GameGridSection`, `SectionHeader`, `TrustFeaturesSection` dùng class semantic (`section`, `shell`, `step-card`, `center-header`, `ghost-btn`, `section-header`) — **không class nào được định nghĩa** trong `globals.css`, và trang chủ không import file nào trong đó. Tàn dư từ bản Vite cũ (xem `assets/react.svg`, `assets/vite.svg`).

Trang mới **không dùng lại** những component này. Cũng **không xoá** chúng — dọn dẹp nằm ngoài scope, cần task riêng.

## Bảng màu

Lấy trực tiếp từ `frontend/src/assets/Logo.png` (sample bằng System.Drawing):

- Nền kem `#F9F2EA` — 53k/93k pixel mẫu, là nền logo
- Navy `#182D45` — viền lục giác, quân cờ phải
- Amber `#CD8A30` — xúc xắc, quân cờ trái
- Xám `#808080` — một ô tile

### Ràng buộc: amber không dùng làm chữ được

Amber `#CD8A30` trên nền kem `#F9F2EA` chỉ đạt **2.6:1**, dưới WCAG AA (4.5:1 cho chữ thường). Navbar dùng `text-primary` cho link active/hover ở cỡ chữ 10px, nên map thẳng amber vào `--color-primary` sẽ làm menu khó đọc.

Giải pháp: **amber 2 tầng**.

- `--color-primary` = ochre đậm `#8F5D1E` → **5.0:1** trên kem ✓ (chữ, link, border nhỏ)
- `--color-tertiary` / `--color-primary-container` = amber gốc `#CD8A30` → chỉ dùng làm mảng đặc, badge, icon, không bao giờ làm chữ trên kem

Các số tương phản đã kiểm:

| Cặp màu | Tỉ lệ | Kết luận |
|---|---|---|
| navy `#182D45` trên kem `#F9F2EA` | 12.6:1 | ✓ AAA |
| ochre `#8F5D1E` trên kem | 5.0:1 | ✓ AA |
| trắng trên ochre `#8F5D1E` | 5.6:1 | ✓ AA |
| navy trên amber `#CD8A30` | 4.8:1 | ✓ AA |
| `#4A5A70` trên kem | 6.3:1 | ✓ AA |
| `#7C8698` trên kem | 3.3:1 | ✓ AA cho UI/border |
| ~~amber `#CD8A30` trên kem~~ | ~~2.6:1~~ | ✗ cấm dùng làm chữ |

### Token mapping (`frontend/src/app/globals.css`)

Trong `@theme`:

```
/* Surface — kem */
--color-surface:                   #F9F2EA
--color-background:                #F9F2EA
--color-surface-bright:            #FFFCF7
--color-surface-container-lowest:  #FFFFFF
--color-surface-container-low:     #FCF7F0
--color-surface-container:         #F5EDE2
--color-surface-container-high:    #EFE6D8
--color-surface-container-highest: #E8DDCC
--color-surface-variant:           #E8DDCC
--color-surface-dim:               #E4D9C7

/* Chữ — navy */
--color-on-surface:                #182D45
--color-on-background:             #182D45
--color-on-surface-variant:        #4A5A70

/* Đường viền — xám của logo */
--color-outline:                   #7C8698
--color-outline-variant:           #C7CDD6

/* Primary — ochre (an toàn cho chữ) */
--color-primary:                   #8F5D1E
--color-primary-dim:               #6F4715
--color-on-primary:                #FFFFFF
--color-primary-container:         #CD8A30
--color-on-primary-container:      #182D45
--color-primary-fixed:             #CD8A30
--color-primary-fixed-dim:         #B87A28
--color-on-primary-fixed:          #182D45
--color-on-primary-fixed-variant:  #4A3208
--color-surface-tint:              #8F5D1E
--color-inverse-primary:           #E0A64F

/* Tertiary — amber gốc, accent fill */
--color-tertiary:                  #CD8A30
--color-tertiary-dim:              #A96D22
--color-on-tertiary:               #182D45
--color-tertiary-container:        #F0D6A8
--color-on-tertiary-container:     #4A3208
--color-tertiary-fixed:            #F0D6A8
--color-tertiary-fixed-dim:        #E0A64F
--color-on-tertiary-fixed:         #4A3208
--color-on-tertiary-fixed-variant: #664700

/* Secondary — navy nhạt (thay palette xanh lá cũ; logo không có xanh lá) */
--color-secondary:                 #2E4A6B
--color-secondary-dim:             #22384F
--color-on-secondary:              #FFFFFF
--color-secondary-container:       #D6DEE9
--color-on-secondary-container:    #182D45
--color-secondary-fixed:           #D6DEE9
--color-secondary-fixed-dim:       #B4C2D4
--color-on-secondary-fixed:        #182D45
--color-on-secondary-fixed-variant:#2E4A6B

/* Inverse */
--color-inverse-surface:           #182D45
--color-inverse-on-surface:        #F9F2EA

/* Error — giữ đỏ quy ước, chỉ chỉnh cho hợp nền kem */
--color-error:                     #C0262D   (giữ)
--color-on-error:                  #FFFFFF   (giữ)
```

Trong `@layer utilities`, `#39382e` hardcode ở 3 chỗ → `#182D45`:

- `.window-shadow` → `box-shadow: 4px 4px 0px 0px #182D45`
- `.window-border` → `border: 2px solid #182D45`
- `.retro-title-bar` → `border-bottom: 2px solid #182D45`

Font và radius giữ nguyên.

## Navbar (`frontend/src/layouts/Navbar.jsx`)

### Logo

`next/image` với static import từ `@/assets/Logo.png`, đặt trái chữ **BOARDMATES**, cả hai bọc trong `<Link href="/">` sẵn có. Nền logo `#F9F2EA` trùng `--color-surface` nên hoà liền vào navbar — **không cần tách nền, không cần xử lý ảnh**.

```jsx
import Image from 'next/image';
import logo from '@/assets/Logo.png';

<Image src={logo} alt="BoardMates" width={32} height={32} loading="eager" />
```

**Vì sao `next/image` mà không phải `<img>`:** `Logo.png` nặng **994KB, 1254×1254px**, hiển thị ở 32px. `<img>` thường sẽ bắt mọi lượt tải trang gánh gần 1MB; `next/image` resize + xuất WebP còn ~1–2KB. Codebase chưa dùng `next/image` ở đâu, nhưng các `<img>` hiện có đều là **avatar từ xa** — dùng next/image cho chúng sẽ phải cấu hình `remotePatterns`, nên né là hợp lý. Logo là **asset tĩnh cục bộ**, static import chạy thẳng, không cần config.

**Cảnh báo phiên bản (đã kiểm trong `node_modules/next/dist/docs/`, Next 16.2.3):**

- `priority` **đã deprecated từ Next 16**, thay bằng `preload` — không dùng `priority`.
- Nhưng cũng **không dùng `preload`**: docs (`01-app/03-api-reference/02-components/image.md:289`) ghi rõ *"In most cases, you should use `loading="eager"` or `fetchPriority="high"` instead of `preload`"*, và `preload` dành cho ảnh hero/LCP. Logo 32px không phải LCP.
- → Dùng **`loading="eager"`**.
- Static import tự suy ra `width`/`height` (1254×1254), nên truyền `width={32} height={32}` tường minh để ép kích thước hiển thị và chặn layout shift.

### Menu

5 mục, thay `navLinks` hiện tại:

| Label (vi / en) | Route | Ghi chú |
|---|---|---|
| Trang chủ / Home | `/` | |
| Cộng đồng / Community | `/community` | badge "Sắp ra mắt" |
| Sự kiện / Events | `/events` | badge "Sắp ra mắt" |
| Tham gia / Join Us | `/join-us` | |
| Giới thiệu / About | `/about` | |

Cấu trúc mới: `{ to, label, comingSoon }`. Bỏ nhánh `to === '#'` render `<button>` — giờ mọi mục đều là route thật, nên chỉ còn `<Link>`. Mục `comingSoon` vẫn điều hướng tới trang stub (trang đó tự nói "sắp ra mắt"), kèm badge nhỏ dùng `bg-tertiary` + `text-on-tertiary`.

Active state giữ pattern hiện tại: `text-primary border-b-2 border-primary pb-1`.

Áp dụng cho **cả** desktop nav và mobile overlay (hiện dùng chung mảng `navLinks`).

### Ẩn

- Bỏ mục "Cửa hàng" → `/marketplace` khỏi `navLinks`
- Bỏ nhánh `else` render `<Link href="/login">` icon `account_circle`

Khi chưa đăng nhập, phía phải navbar chỉ còn `LanguageSwitcher`.

### Giữ nguyên (không đụng)

- Chuông thông báo + `notify:new` socket listener — vẫn render khi `user` tồn tại
- Dropdown profile (Profile / Chat / Admin / Logout)
- `/login`, `/register`, `/marketplace`, `/chat`, `/profile`, `/admin` vẫn chạy khi vào thẳng URL

Chỉ ẩn **lối vào từ navbar**, không gỡ tính năng.

## Trang mới

Bốn route dưới `frontend/src/app/(main)/` để kế thừa `MainLayout` (Navbar + Footer):

```
(main)/community/page.js   -> <ComingSoon section="community" />
(main)/events/page.js      -> <ComingSoon section="events" />
(main)/join-us/page.js     -> danh sách 7 ban
(main)/about/page.js       -> nội dung từ Refactor.md
```

Cả bốn trang dùng khung ngoài giống trang chủ để bố cục nhất quán, nhưng bằng `<div>` chứ không phải `<main>`:

```jsx
<div className="pt-28 md:pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full space-y-16">
```

**Vì sao `<div>`:** `MainLayout` (`layouts/MainLayout.jsx:12`) đã bọc children trong `<main className="pt-20 flex-1 flex flex-col">`. Trang chủ (`(main)/page.js:164`) lại mở thêm `<main>` bên trong → **`<main>` lồng `<main>`**, HTML không hợp lệ (mỗi document chỉ được một `<main>`). Đây là lỗi có sẵn; lần này **không sửa** (ngoài scope) nhưng cũng **không nhân bản** ra 4 trang mới. Class giữ y hệt nên hiển thị không đổi.

### `components/common/ComingSoon.jsx`

Component dùng chung cho Community + Events. Nhận `section` để tra chữ trong `translations`. Nội dung: tiêu đề, mô tả ngắn, nhãn "Sắp ra mắt", link về `/join-us`.

Dựng bằng đúng vocabulary cửa sổ đang có — không tạo style mới:

```jsx
<section className="window-border window-shadow bg-surface-container-lowest">
  <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center">
    <span className="font-label text-[10px] font-bold uppercase tracking-widest">
      community.exe
    </span>
    <div className="flex gap-2 shrink-0">{/* 2 chấm, copy từ HeroSection */}</div>
  </div>
  <div className="p-6 md:p-12">{/* tiêu đề font-headline + mô tả font-body */}</div>
</section>
```

Nhãn `.exe` theo `section`: `community.exe`, `events.exe`, `join_us.exe`, `about.exe`.

### `/about`

Dựng từ nội dung **có thật** trong `Refactor.md`, không bịa:

- Product Vision (đoạn "BoardMates là nền tảng kết nối và sáng tạo thông qua board game...")
- Core Philosophy ("Board game là công cụ. Con người là trung tâm...")
- Ecosystem (University Clubs → Cafés → Stores → Publishers → Creators → Players)
- Roadmap (Phase 1 Community 100%, Phase 2 Events 60%, Phase 3 Marketplace 20%, Phase 4 Platform 0%)

Bỏ Partners và Founding Team — Refactor.md không có nội dung, và không có dữ liệu thật để điền.

### `/join-us`

Mở đầu bằng đoạn từ Refactor.md ("BoardMates vẫn đang trong giai đoạn đầu. Chúng mình đang tìm kiếm những người muốn xây dựng cộng đồng từ con số 0."), rồi 7 ban dạng JD, mỗi ban expand/collapse để trang không quá dài.

Mỗi ban là một "cửa sổ" `window-border window-shadow`, thanh tiêu đề `retro-title-bar` mang nhãn `marketing.exe` / `design.exe` / ..., dấu `expand_more` xoay khi mở (pattern y hệt dropdown profile ở Navbar). Không thêm animation mới.

### `src/data/teams.js`

Data 7 ban tách riêng, **không** nhét vào `translations.js`: team data là mảng lồng nhau (mỗi ban 6 field, nhiều field là list), khác kiểu dictionary phẳng của `translations.js`, và file đó đã 200+ dòng.

```js
export const teams = [{
  slug: 'marketing',
  name:             { vi: '...', en: '...' },
  mission:          { vi: '...', en: '...' },
  responsibilities: { vi: [...], en: [...] },
  requirements:     { vi: [...], en: [...] },
  benefits:         { vi: [...], en: [...] },
  growthPath:       { vi: '...', en: '...' },
}, ...]
```

7 ban theo Refactor.md: `marketing`, `design`, `community`, `event`, `business-development`, `product`, `technology`. Field theo khung Refactor.md: Mission, Responsibilities, Requirements, Benefits, Growth Path, Apply.

### Nút Apply — chỉ giao diện

"Apply" **không** là field per-team — Refactor.md liệt kê nó như một bước chung, và dự án **không có form hay endpoint tuyển dụng nào**. User đã chốt: lần này **chỉ làm giao diện**, chưa nối.

Một CTA chung ở cuối `/join-us`, điều khiển bằng đúng một hằng số ở đầu file:

```jsx
// TODO: điền email hoặc link form tuyển dụng, ví dụ:
//   'mailto:hello@boardmates.vn' hoặc 'https://forms.gle/...'
const APPLY_URL = '';
```

- `APPLY_URL` rỗng → render `<button type="button" disabled>` (nút hiện diện, rõ ràng chưa dùng được)
- `APPLY_URL` có giá trị → render `<a href={APPLY_URL}>`

Không render nút trông bấm được nhưng bấm không ra gì. Khi có link, sửa một dòng là chạy.

**Nội dung 7 ban do Claude soạn theo khung JD — user đã đồng ý và sẽ rà lại. Không được coi là nội dung chính thức cho tới khi user duyệt.**

## Đổi tên Dicero → BoardMates

Phạm vi đã chốt: **chữ hiển thị + storage key**. Không đụng `package.json` (`dicero-project-next`, `dicero-be`) và `debug` namespace (`dicero-be:server`).

| File | Dòng | Đổi |
|---|---|---|
| `layouts/Navbar.jsx` | 95 | wordmark `Dicero` → `BoardMates` |
| `layouts/Footer.jsx` | 15 | `© 2024 Dicero.` → `© 2026 BoardMates.` |
| `data/translations.js` | 13, 14 | `footer.brand`, `footer.copyright` (vi) |
| `data/translations.js` | 139, 140 | `footer.brand`, `footer.copyright` (en) |
| `app/layout.js` | 4 | metadata title → `BoardMates — Kết nối và sáng tạo qua board game` |
| `app/(main)/page.js` | 27 | `<span>Dicero</span>` → `BoardMates` |
| `app/(main)/page.js` | 137 | "Về dự án Dicero..." / "About the Dicero project..." |
| `app/login/page.js` | 96, 201, 203 | heading + footer wordmark + copyright |
| `app/register/page.js` | 50, 142, 170, 172 | heading + điều khoản + footer wordmark + copyright |
| `hooks/useAuthStore.js` | 23 | `dicero-auth-storage` → `boardmates-auth-storage` |

Copyright đổi 2024 → 2026 luôn (hiện đã lỗi thời).

**Đổi storage key sẽ đăng xuất mọi user đang đăng nhập.** User đã chốt chấp nhận. Không viết migration đọc key cũ — đăng nhập lại là được, và lối vào login đang bị ẩn nên số user ảnh hưởng gần như bằng 0.

## Song ngữ

Mọi chữ mới vào `translations.js` ở **cả** nhánh `vi` và `en`, theo pattern `translations[language].<section>` hiện có.

Key mới:

```
navbar:    home (có sẵn), community, events, joinUs, about, comingSoon
comingSoon: { community: { title, desc }, events: { title, desc }, cta }
about:     { title, vision, philosophy, ecosystem: {...}, roadmap: {...} }
joinUs:    { title, intro, mission, responsibilities, requirements,
             benefits, growthPath, applyCta }
```

Nhãn field JD (Mission/Responsibilities/...) nằm ở `translations.joinUs`; nội dung per-team nằm ở `teams.js`. Trang `/join-us` ghép hai nguồn: nhãn từ translations, nội dung từ `teams[i].<field>[language]`.

`navbar.shop`, `navbar.news`, `navbar.games`, `navbar.login` để lại trong `translations.js` — sau thay đổi này không key nào còn được dùng (`navbar.login` thực ra đã chết sẵn từ trước: nút đăng nhập là icon `account_circle`, không có chữ). Giữ lại vì vô hại và để dành khi bật lại Cửa hàng/Đăng nhập. `navbar.logout` và `navbar.profile` vẫn dùng trong dropdown profile.

## Ngoài scope

- **Trang chủ `(main)/page.js`** vẫn là nội dung marketplace/archive (HeroSection, CategoriesSection, GameGridSection, TestimonialsSection). Lệch với mục tiêu "giới thiệu dự án + tuyển Core team" nhưng **không đụng lần này** — cần task riêng.
- Không gỡ `/marketplace`, `/chat`, `/profile`, `/admin`, `/login`, `/register`.
- Không đổi `package.json`, không đụng backend.
- Không đụng `footer.png` (asset chưa dùng).
- Không thêm dark mode.
- **Không dọn code chết** `components/sections/*` và `assets/react.svg` / `assets/vite.svg` — cần task riêng.
- **Không redesign** — xem mục "Ràng buộc: KHÔNG redesign" ở trên.

## Rủi ro

1. **Đổi storage key → logout toàn bộ.** Đã chốt, chấp nhận.
2. **Nội dung Join Us do Claude soạn.** User phải rà trước khi cho người thật đọc. Nội dung About lấy từ Refactor.md nên an toàn hơn.
3. **Retheme động tới toàn site.** Đổi `@theme` ảnh hưởng mọi trang, kể cả trang không nằm trong scope (marketplace, profile, admin). Các trang đó sẽ đổi màu theo — mong đợi, nhưng cần xem qua để chắc không có chữ nào tàng hình. Rủi ro cụ thể: chỗ nào hardcode màu thay vì dùng token (ví dụ `text-zinc-900` ở `login/page.js:201`) sẽ không đổi theo.
4. **Next.js version có breaking changes** so với training data — theo `frontend/AGENTS.md`, phải đọc `frontend/node_modules/next/dist/docs/` trước khi viết code, đặc biệt phần `next/image` (static import, `priority`) và App Router.

## Kiểm chứng

Repo không có test suite. Verify bằng cách chạy thật:

1. `cd frontend && npm run dev`
2. Xem `/`, `/community`, `/events`, `/join-us`, `/about` — cả `vi` và `en` qua LanguageSwitcher
3. Navbar: không còn Cửa hàng và nút đăng nhập; logo hiện và hoà nền; active state đúng trên từng route
4. Mobile: thu nhỏ cửa sổ, mở hamburger, kiểm 5 mục + LanguageSwitcher
5. Vào thẳng `/marketplace` và `/login` — vẫn phải chạy
6. `npm run lint`
