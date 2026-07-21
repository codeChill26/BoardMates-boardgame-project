# Navbar, Logo & BoardMates Retheme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi website Dicero thành BoardMates: palette kem/navy/amber lấy từ logo, navbar 5 mục + logo, ẩn Cửa hàng/Đăng nhập, thêm 4 trang giới thiệu & tuyển Core team.

**Architecture:** Toàn bộ thay đổi nằm trong `frontend/`. Palette đổi tập trung ở `@theme` của `globals.css` nên mọi component dùng token tự đổi theo. Trang mới là App Router route dưới `(main)/` để kế thừa `MainLayout` (Navbar + Footer). Nội dung song ngữ tách hai nguồn: chữ giao diện ở `translations.js`, dữ liệu 7 ban ở `teams.js`.

**Tech Stack:** Next.js 16.2.3 (App Router), React 19, JavaScript (không TypeScript), Tailwind v4 (`@tailwindcss/postcss`, không có `tailwind.config`), zustand.

**Spec:** `docs/superpowers/specs/2026-07-16-navbar-logo-retheme-design.md`

## Global Constraints

- **KHÔNG redesign.** Chỉ đổi màu, logo, tên. Bố cục và design language giữ nguyên.
- **Design language bắt buộc dùng lại** (đã có sẵn, xem `app/(main)/page.js`): `.window-border`, `.window-shadow`, `.retro-title-bar`, thanh tiêu đề kiểu cửa sổ với nhãn `.exe` + 2 chấm tròn, `font-headline` (tiêu đề), `font-label` (nhãn uppercase tracking-widest), `font-body` (nội dung).
- **KHÔNG tạo class CSS mới**, không thêm animation mới (không Pixel Cursor / Window Open-Close / Typing Effect / Loading Screen).
- **KHÔNG dùng lại `components/sections/*`** — code chết, class semantic (`section`, `shell`, `step-card`, `ghost-btn`) không được định nghĩa ở đâu. Cũng không xoá.
- **KHÔNG đụng:** `app/(main)/page.js` bố cục (chỉ đổi chữ Dicero), `package.json`, backend, `footer.png`, dark mode.
- **KHÔNG gỡ** `/marketplace`, `/chat`, `/profile`, `/admin`, `/login`, `/register` — chỉ ẩn lối vào từ navbar.
- **Màu (chính xác, lấy từ Logo.png):** kem `#F9F2EA`, navy `#182D45`, amber `#CD8A30`, ochre `#8F5D1E`.
- **Amber `#CD8A30` TUYỆT ĐỐI không dùng làm chữ trên nền kem** — chỉ đạt 2.6:1, dưới WCAG AA. Chữ dùng ochre `#8F5D1E` (5.0:1) hoặc navy `#182D45` (12.6:1).
- **Song ngữ:** mọi chữ mới phải có ở **cả** nhánh `vi` và `en` của `translations.js`.
- **Next 16:** `priority` đã deprecated. Dùng `loading="eager"`, không dùng `priority`, không dùng `preload`.
- **Path alias:** `@/*` → `./src/*` (xem `jsconfig.json`).
- Mọi file frontend là **JavaScript**, dùng `'use client'` khi có hook/event handler.
- **Trang mới dùng `<div>` làm khung ngoài, KHÔNG dùng `<main>`.** `MainLayout` (`layouts/MainLayout.jsx:12`) đã bọc children trong `<main className="pt-20 flex-1 flex flex-col">`. Trang chủ (`(main)/page.js:164`) mở thêm một `<main>` nữa bên trong → `<main>` lồng `<main>`, HTML không hợp lệ (mỗi document chỉ được một `<main>`). Đây là lỗi **có sẵn**, plan này **không sửa** (ngoài scope), nhưng cũng **không nhân bản** ra 4 trang mới. Class giữ y hệt nên nhìn không khác gì.

## Về kiểm thử: repo KHÔNG có test runner, VÀ build đang hỏng sẵn

Không có Jest/Vitest/Playwright, không có file test nào, `package.json` không có script `test`. **Không dựng test framework trong plan này** — ngoài scope.

**Hai thực tế đã đo được (không phải giả định):**

1. **`npm run lint` chưa bao giờ sạch.** Baseline đo bằng `git stash` trước mọi thay đổi: **15 problems (5 errors, 10 warnings)**, nằm ở `chat/page.js`, `(main)/page.js`, `profile/page.js`, `marketplace/`, `layout.js`, `Navbar.jsx`, `AddBoardgameModal.jsx`, `ProductCard.jsx`. Tiêu chí đúng là **không tăng so với 15**, không phải "sạch".

2. **`npm run build` fail sẵn**, xác nhận bằng `git stash`:
   ```
   ⨯ useSearchParams() should be wrapped in a suspense boundary at page "/chat"
   Error occurred prerendering page "/chat"
   ⨯ Next.js build worker exited with code: 1
   ```
   Nghĩa là project **hiện không deploy được**, và `frontend/Dockerfile` (chạy `npm run build`) cũng không build nổi. Lỗi này **có sẵn, không do plan này**.

   User đã chốt: **không sửa `/chat`** lần này. Nên **plan này không chạy `npm run build`**.

**Hệ quả phải chấp nhận:** `npm run build` là thứ duy nhất bắt được lỗi prerender/import. Bỏ nó đi thì 4 trang mới **không có kiểm tra tự động nào** — chỉ còn lint và xem tận mắt. Đây là rủi ro thật, ghi ra đây để không ai tưởng là đã kiểm kỹ.

Mỗi task verify bằng:
1. `npm run lint` — số problems **phải bằng đúng 15**, không tăng
2. Xem tận mắt trên `npm run dev`, có bước cụ thể từng task

## Việc nên làm sau plan này

`/chat` cần bọc `<Suspense>` để build chạy lại (docs: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md:179`). Chừng nào chưa sửa, project không deploy được. Tách task riêng.

## File Structure

| File | Trạng thái | Trách nhiệm |
|---|---|---|
| `src/app/globals.css` | Sửa | Token palette (`@theme`) + 3 utility hardcode màu |
| `src/data/translations.js` | Sửa | Chữ giao diện vi/en: navbar, footer, comingSoon, about, joinUs |
| `src/data/teams.js` | Tạo | Dữ liệu 7 ban (song ngữ), tách khỏi translations vì là mảng lồng nhau |
| `src/components/common/ComingSoon.jsx` | Tạo | Cửa sổ "Sắp ra mắt" dùng chung Community + Events |
| `src/app/(main)/community/page.js` | Tạo | Route → ComingSoon |
| `src/app/(main)/events/page.js` | Tạo | Route → ComingSoon |
| `src/app/(main)/about/page.js` | Tạo | Nội dung từ Refactor.md |
| `src/app/(main)/join-us/page.js` | Tạo | 7 ban expand/collapse + CTA Apply |
| `src/layouts/Navbar.jsx` | Sửa | Logo, 5 link, ẩn Cửa hàng + Đăng nhập, wordmark |
| `src/layouts/Footer.jsx` | Sửa | Đổi tên |
| `src/app/layout.js` | Sửa | metadata title |
| `src/app/(main)/page.js` | Sửa | Chỉ đổi chữ Dicero (dòng 27, 137) |
| `src/app/login/page.js` | Sửa | Đổi tên + bỏ `text-zinc-900` hardcode |
| `src/app/register/page.js` | Sửa | Đổi tên + bỏ `text-zinc-900` hardcode |
| `src/hooks/useAuthStore.js` | Sửa | storage key |

**Thứ tự task:** trang mới làm trước, Navbar làm cuối — để khi navbar trỏ tới `/community`, `/events`, `/join-us`, `/about` thì các route đó đã tồn tại, không có 404 tạm.

---

### Task 1: Palette kem/navy/amber

**Files:**
- Modify: `frontend/src/app/globals.css:3-63` (khối `@theme`), `:65-81` (khối `@layer utilities`)

**Interfaces:**
- Consumes: không
- Produces: các token Tailwind `bg-surface`, `text-on-surface`, `text-primary`, `bg-tertiary`, `text-on-tertiary`, `border-outline`, `bg-surface-container-*`... cho mọi task sau. Tên token **giữ nguyên như cũ**, chỉ đổi giá trị — nên component hiện có không cần sửa.

- [ ] **Step 1: Thay toàn bộ khối `@theme`**

Mở `frontend/src/app/globals.css`, thay từ `@theme {` tới `}` (dòng 3–63) bằng:

```css
@theme {
  /* Surface — kem #F9F2EA lấy từ nền Logo.png */
  --color-surface: #f9f2ea;
  --color-background: #f9f2ea;
  --color-surface-bright: #fffcf7;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #fcf7f0;
  --color-surface-container: #f5ede2;
  --color-surface-container-high: #efe6d8;
  --color-surface-container-highest: #e8ddcc;
  --color-surface-variant: #e8ddcc;
  --color-surface-dim: #e4d9c7;

  /* Chữ — navy #182D45, 12.6:1 trên kem */
  --color-on-surface: #182d45;
  --color-on-background: #182d45;
  --color-on-surface-variant: #4a5a70;

  /* Viền — xám của logo */
  --color-outline: #7c8698;
  --color-outline-variant: #c7cdd6;

  /* Primary — ochre #8F5D1E, 5.0:1 trên kem (an toàn cho chữ) */
  --color-primary: #8f5d1e;
  --color-primary-dim: #6f4715;
  --color-on-primary: #ffffff;
  --color-primary-container: #cd8a30;
  --color-on-primary-container: #182d45;
  --color-primary-fixed: #cd8a30;
  --color-primary-fixed-dim: #b87a28;
  --color-on-primary-fixed: #182d45;
  --color-on-primary-fixed-variant: #4a3208;
  --color-surface-tint: #8f5d1e;
  --color-inverse-primary: #e0a64f;

  /* Tertiary — amber #CD8A30 gốc từ logo. CHỈ dùng làm nền/mảng đặc, KHÔNG làm chữ trên kem (2.6:1) */
  --color-tertiary: #cd8a30;
  --color-tertiary-dim: #a96d22;
  --color-on-tertiary: #182d45;
  --color-tertiary-container: #f0d6a8;
  --color-on-tertiary-container: #4a3208;
  --color-tertiary-fixed: #f0d6a8;
  --color-tertiary-fixed-dim: #e0a64f;
  --color-on-tertiary-fixed: #4a3208;
  --color-on-tertiary-fixed-variant: #664700;

  /* Secondary — navy nhạt (thay palette xanh lá cũ; logo không có xanh lá) */
  --color-secondary: #2e4a6b;
  --color-secondary-dim: #22384f;
  --color-on-secondary: #ffffff;
  --color-secondary-container: #d6dee9;
  --color-on-secondary-container: #182d45;
  --color-secondary-fixed: #d6dee9;
  --color-secondary-fixed-dim: #b4c2d4;
  --color-on-secondary-fixed: #182d45;
  --color-on-secondary-fixed-variant: #2e4a6b;

  /* Inverse */
  --color-inverse-surface: #182d45;
  --color-inverse-on-surface: #f9f2ea;

  /* Error — giữ đỏ quy ước */
  --color-error: #c0262d;
  --color-error-dim: #9f0519;
  --color-error-container: #fb5151;
  --color-on-error: #ffffff;
  --color-on-error-container: #570008;

  --font-headline: "Newsreader", serif;
  --font-body: "Manrope", sans-serif;
  --font-label: "Space Grotesk", sans-serif;

  --radius-default: 0.25rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}
```

- [ ] **Step 2: Đổi 3 utility hardcode `#39382e` sang navy**

Trong `@layer utilities`, đổi đúng 3 chỗ:

```css
  .window-shadow {
    box-shadow: 4px 4px 0px 0px #182d45;
  }

  .window-border {
    border: 2px solid #182d45;
  }

  .retro-title-bar {
    border-bottom: 2px solid #182d45;
  }
```

Giữ nguyên `.material-symbols-outlined` và các khối `:root`, `body`, `#root`, `.page`.

- [ ] **Step 3: Verify build + lint**

```bash
cd frontend
npm run lint 2>&1 | tail -2
```
Expected: `✖ 15 problems (5 errors, 10 warnings)` — bằng đúng baseline, không tăng.

- [ ] **Step 4: Verify bằng mắt**

```bash
cd frontend && npm run dev
```
Mở `http://localhost:3000`:
- Nền trang là kem, không còn trắng ngả tím
- Chữ là navy, không còn nâu ô-liu
- Viền cửa sổ + đổ bóng là navy
- Nút "Khám phá ngay" nền ochre, chữ trắng, đọc rõ

Mở thêm `/marketplace` và `/profile` (ngoài scope nhưng ăn màu theo): kiểm không có chữ nào tàng hình.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/globals.css
git commit -m "Retone theme to logo palette (cream/navy/amber)

Amber #CD8A30 is fills-only: it hits 2.6:1 on the cream background, below
WCAG AA, so text uses ochre #8F5D1E (5.0:1) or navy #182D45 (12.6:1)."
```

---

### Task 2: Đổi tên Dicero → BoardMates

**Files:**
- Modify: `frontend/src/data/translations.js:13-14` (vi footer), `:139-140` (en footer)
- Modify: `frontend/src/layouts/Footer.jsx:15`
- Modify: `frontend/src/app/layout.js:4-5`
- Modify: `frontend/src/app/(main)/page.js:27`, `:137`
- Modify: `frontend/src/app/login/page.js:96`, `:201`, `:203`
- Modify: `frontend/src/app/register/page.js:50`, `:142`, `:170`, `:172`
- Modify: `frontend/src/hooks/useAuthStore.js:23`
- Modify: `frontend/src/layouts/Navbar.jsx:95`

**Interfaces:**
- Consumes: token từ Task 1
- Produces: `translations[lang].footer.brand === 'BoardMates'`; storage key `boardmates-auth-storage`

Wordmark Navbar (`Navbar.jsx:95`) đổi **ngay ở task này**, dù Task 8 sẽ viết lại cả khối đó để thêm logo. Nếu để lại tới Task 8 thì bước verify `grep "Dicero"` của task này chắc chắn fail.

- [ ] **Step 1: `translations.js` — nhánh vi (dòng 13-14)**

```js
    footer: {
      brand: 'BoardMates',
      copyright: '© 2026 BoardMates. Tất cả quyền được bảo lưu.',
      rights: 'Bảo lưu mọi quyền.',
    },
```

- [ ] **Step 2: `translations.js` — nhánh en (dòng 139-140)**

```js
    footer: {
      brand: 'BoardMates',
      copyright: '© 2026 BoardMates. All rights reserved.',
      rights: 'All rights reserved.',
    },
```

- [ ] **Step 3: `Footer.jsx:15`**

```jsx
        <div className="text-on-surface">© 2026 BoardMates. {t.rights}</div>
```

- [ ] **Step 4: `app/layout.js:4-5`**

```js
export const metadata = {
  title: "BoardMates — Kết nối và sáng tạo qua board game",
  description: "BoardMates là nền tảng kết nối và sáng tạo thông qua board game. Cộng đồng, sự kiện, và không gian để cùng nhau phát triển.",
};
```

- [ ] **Step 5: `app/(main)/page.js` — dòng 27 và 137**

Dòng 27:
```jsx
              {t.welcome} <span className="italic text-primary">BoardMates</span>
```

Dòng 137:
```jsx
          <p className="text-sm font-body text-on-surface-variant mb-4">{language === 'vi' ? 'Về dự án BoardMates và mong muốn lưu giữ giá trị của những trò chơi dân gian...' : 'About the BoardMates project and the desire to preserve traditional game values...'}</p>
```

Không đụng gì khác trong file này.

- [ ] **Step 6: `app/login/page.js` — dòng 96, 201, 203**

Dòng 96:
```jsx
              <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-on-surface uppercase">BoardMates</h1>
```

Dòng 201 — đổi tên **và** bỏ `text-zinc-900` hardcode (màu cứng không ăn theo palette mới):
```jsx
        <div className="text-xl font-headline italic font-bold text-on-surface uppercase">BoardMates</div>
```

Dòng 203:
```jsx
          © 2026 BoardMates. Tất cả quyền được bảo lưu.
```

- [ ] **Step 7: `app/register/page.js` — dòng 50, 142, 170, 172**

Dòng 50:
```jsx
            <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-on-surface uppercase">BoardMates</h1>
```

Dòng 142:
```jsx
                Tôi đồng ý với <a className="text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all font-bold" href="#">điều khoản</a> và chính sách bảo mật của BoardMates.
```

Dòng 170 — đổi tên **và** bỏ `text-zinc-900`:
```jsx
        <div className="text-xl font-headline italic font-bold text-on-surface uppercase">BoardMates</div>
```

Dòng 172:
```jsx
          © 2026 BoardMates. Tất cả quyền được bảo lưu.
```

- [ ] **Step 8: `useAuthStore.js:23` — storage key**

```js
            name: 'boardmates-auth-storage',
```

- [ ] **Step 8b: `Navbar.jsx:95` — wordmark**

Đổi đúng một chữ, giữ nguyên mọi thứ khác (Task 8 sẽ viết lại cả khối này để thêm logo):

```jsx
          BoardMates
```

- [ ] **Step 9: Verify không còn chữ Dicero nào**

```bash
cd frontend
grep -rn "Dicero\|dicero" src/
```
Expected: **không kết quả nào**. (`package.json` giữ `dicero-project-next` là cố ý, ngoài phạm vi grep này.)

```bash
npm run lint 2>&1 | tail -2
```
Expected: `✖ 15 problems (5 errors, 10 warnings)` — bằng đúng baseline, không tăng.

- [ ] **Step 10: Verify bằng mắt**

`npm run dev`, mở `/`, `/login`, `/register`:
- Không còn chữ "Dicero" ở đâu
- Footer ghi "© 2026 BoardMates"
- Tab trình duyệt ghi "BoardMates — Kết nối và sáng tạo qua board game"
- Wordmark ở login/register là navy (không còn `text-zinc-900` xám lạc quẻ)
- Đổi ngôn ngữ vi/en: footer đổi đúng

Đăng nhập lại nếu bị đăng xuất — **đây là hệ quả đã biết và đã được duyệt** của việc đổi storage key.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/data/translations.js frontend/src/layouts/Footer.jsx frontend/src/layouts/Navbar.jsx frontend/src/app/layout.js "frontend/src/app/(main)/page.js" frontend/src/app/login/page.js frontend/src/app/register/page.js frontend/src/hooks/useAuthStore.js
git commit -m "Rename Dicero to BoardMates across display strings and storage key

Changing the persist key logs out existing sessions, which was accepted:
the login entry point is being hidden anyway. Also drops two hardcoded
text-zinc-900 wordmarks that would not follow the new palette."
```

---

### Task 3: Thêm chữ giao diện cho navbar + trang mới

**Files:**
- Modify: `frontend/src/data/translations.js` — thêm key vào **cả** `vi` và `en`

**Interfaces:**
- Consumes: không
- Produces: `translations[lang].navbar.{community,events,joinUs,about,comingSoon}`, `translations[lang].comingSoon`, `translations[lang].about`, `translations[lang].joinUs` — Task 4, 6, 7, 8 đều đọc từ đây.

Giữ nguyên `navbar.shop/news/games/login` dù không còn dùng (để dành khi bật lại Cửa hàng/Đăng nhập). `navbar.logout` và `navbar.profile` vẫn đang dùng ở dropdown profile.

- [ ] **Step 1: Mở rộng `navbar` nhánh vi (dòng 3-11)**

```js
    navbar: {
      home: 'Trang chủ',
      community: 'Cộng đồng',
      events: 'Sự kiện',
      joinUs: 'Tham gia',
      about: 'Giới thiệu',
      comingSoon: 'Sắp ra mắt',
      games: 'Trò chơi',
      news: 'Tin tức',
      shop: 'Cửa hàng',
      logout: 'Đăng xuất',
      login: 'Đăng nhập',
      profile: 'Hồ sơ người dùng',
    },
```

- [ ] **Step 2: Mở rộng `navbar` nhánh en (dòng 129-137)**

```js
    navbar: {
      home: 'Home',
      community: 'Community',
      events: 'Events',
      joinUs: 'Join Us',
      about: 'About',
      comingSoon: 'Coming soon',
      games: 'Games',
      news: 'News',
      shop: 'Market',
      logout: 'Logout',
      login: 'Login',
      profile: 'Profile',
    },
```

- [ ] **Step 3: Thêm `comingSoon`, `about`, `joinUs` vào nhánh vi**

Thêm ngay sau khối `footer` của nhánh `vi`:

```js
    comingSoon: {
      badge: 'Sắp ra mắt',
      community: {
        title: 'Cộng đồng',
        desc: 'Nơi bạn tìm thấy những người cùng sở thích, chia sẻ và cùng nhau phát triển qua board game. Chúng mình đang xây dựng phần này.',
      },
      events: {
        title: 'Sự kiện',
        desc: 'Board Game Night, Workshop, Networking, Tournament. Lịch sự kiện và đăng ký tham gia sẽ có ở đây.',
      },
      cta: 'Muốn cùng xây dựng? Tham gia Core Team',
    },
    about: {
      title: 'Giới thiệu',
      visionTitle: 'Chúng mình là ai',
      vision: 'BoardMates là nền tảng kết nối và sáng tạo thông qua board game. Board game chỉ là điểm khởi đầu. Điều BoardMates muốn xây dựng là một hệ sinh thái nơi mọi người có thể gặp gỡ, chia sẻ, học hỏi, hợp tác và cùng nhau phát triển.',
      philosophyTitle: 'Điều chúng mình tin',
      philosophy: [
        'Board game là công cụ.',
        'Con người là trung tâm.',
        'Kết nối là giá trị.',
        'Sáng tạo là mục tiêu.',
      ],
      philosophyClosing: 'BoardMates tồn tại để tạo nên những kết nối có ý nghĩa thông qua board game.',
      ecosystemTitle: 'Hệ sinh thái',
      ecosystemDesc: 'BoardMates không chỉ là một cộng đồng. Chúng mình đang xây dựng một hệ sinh thái.',
      ecosystem: [
        'Câu lạc bộ Đại học',
        'Board Game Café',
        'Cửa hàng',
        'Nhà xuất bản',
        'Nhà sáng tạo',
        'Người chơi',
      ],
      roadmapTitle: 'Lộ trình',
      roadmap: [
        { phase: 'Phase 1', name: 'Cộng đồng', percent: 100 },
        { phase: 'Phase 2', name: 'Sự kiện', percent: 60 },
        { phase: 'Phase 3', name: 'Marketplace', percent: 20 },
        { phase: 'Phase 4', name: 'Nền tảng', percent: 0 },
      ],
    },
    joinUs: {
      title: 'Tham gia cùng chúng mình',
      intro: 'BoardMates vẫn đang trong giai đoạn đầu. Chúng mình đang tìm kiếm những người muốn xây dựng cộng đồng từ con số 0.',
      openPositions: 'Vị trí đang mở',
      mission: 'Sứ mệnh',
      responsibilities: 'Công việc',
      requirements: 'Yêu cầu',
      benefits: 'Quyền lợi',
      growthPath: 'Lộ trình phát triển',
      applyTitle: 'Thấy mình phù hợp?',
      applyDesc: 'Chúng mình quan tâm tới tinh thần xây dựng hơn là kinh nghiệm. Nếu bạn muốn cùng làm từ con số 0, hãy nói chuyện với chúng mình.',
      applyCta: 'Ứng tuyển',
      applyPending: 'Kênh ứng tuyển sẽ sớm được mở',
    },
```

- [ ] **Step 4: Thêm bản `en` tương ứng**

Thêm ngay sau khối `footer` của nhánh `en`:

```js
    comingSoon: {
      badge: 'Coming soon',
      community: {
        title: 'Community',
        desc: 'Where you find people who share your interests, exchange ideas, and grow together through board games. We are building this part.',
      },
      events: {
        title: 'Events',
        desc: 'Board Game Nights, Workshops, Networking, Tournaments. The event calendar and registration will live here.',
      },
      cta: 'Want to help build it? Join the Core Team',
    },
    about: {
      title: 'About',
      visionTitle: 'Who we are',
      vision: 'BoardMates is a platform for connection and creativity through board games. Board games are only the starting point. What BoardMates wants to build is an ecosystem where people meet, share, learn, collaborate, and grow together.',
      philosophyTitle: 'What we believe',
      philosophy: [
        'Board games are the tool.',
        'People are the center.',
        'Connection is the value.',
        'Creativity is the goal.',
      ],
      philosophyClosing: 'BoardMates exists to create meaningful connections through board games.',
      ecosystemTitle: 'Ecosystem',
      ecosystemDesc: 'BoardMates is more than a community. We are building an ecosystem.',
      ecosystem: [
        'University Clubs',
        'Board Game Cafés',
        'Stores',
        'Publishers',
        'Creators',
        'Players',
      ],
      roadmapTitle: 'Roadmap',
      roadmap: [
        { phase: 'Phase 1', name: 'Community', percent: 100 },
        { phase: 'Phase 2', name: 'Events', percent: 60 },
        { phase: 'Phase 3', name: 'Marketplace', percent: 20 },
        { phase: 'Phase 4', name: 'Platform', percent: 0 },
      ],
    },
    joinUs: {
      title: 'Join us',
      intro: 'BoardMates is still in its early days. We are looking for people who want to build a community from zero.',
      openPositions: 'Open positions',
      mission: 'Mission',
      responsibilities: 'Responsibilities',
      requirements: 'Requirements',
      benefits: 'Benefits',
      growthPath: 'Growth path',
      applyTitle: 'Sounds like you?',
      applyDesc: 'We care more about the will to build than about experience. If you want to start from zero with us, come talk to us.',
      applyCta: 'Apply',
      applyPending: 'The application channel is opening soon',
    },
```

- [ ] **Step 5: Verify hai nhánh khớp key**

`translations.js` dùng `export const` (ESM) nhưng `package.json` **không** có `"type": "module"`, nên node coi `.js` là CommonJS — `import()` sẽ chết với `Unexpected token 'export'`. Cách chạy được: đọc file, bỏ `export`, bọc IIFE.

```bash
cd frontend
node -e "
const fs=require('fs');
const src=fs.readFileSync('src/data/translations.js','utf8').replace('export const translations','const translations');
const { translations: t } = eval('(function(){' + src + '; return { translations };})()');
const keys=o=>Object.keys(o).sort().join(',');
let bad=0;
for (const k of ['navbar','comingSoon','about','joinUs']) {
  const vi=keys(t.vi[k]), en=keys(t.en[k]);
  if (vi===en) { console.log(k, 'OK'); }
  else { console.log(k, 'LECH:'); console.log('  chi co o vi:', Object.keys(t.vi[k]).filter(x=>!(x in t.en[k]))); console.log('  chi co o en:', Object.keys(t.en[k]).filter(x=>!(x in t.vi[k]))); bad++; }
}
const arrs=[['philosophy',4],['ecosystem',6],['roadmap',4]];
for (const [name,expected] of arrs) {
  const vi=t.vi.about[name].length, en=t.en.about[name].length;
  if (vi===expected && en===expected) { console.log(name, 'OK ('+vi+')'); }
  else { console.log(name, 'SAI SO DONG: vi='+vi+' en='+en+' mong doi='+expected); bad++; }
}
console.log(bad===0 ? 'TAT CA OK' : 'CO '+bad+' LOI');
"
```
Expected: mọi dòng `OK` và dòng cuối `TAT CA OK`.

```bash
npm run lint 2>&1 | tail -2
```
Expected: `✖ 15 problems (5 errors, 10 warnings)` — bằng đúng baseline, không tăng.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/data/translations.js
git commit -m "Add vi/en strings for new nav items and pages"
```

---

### Task 4: Component ComingSoon + trang /community, /events

**Files:**
- Create: `frontend/src/components/common/ComingSoon.jsx`
- Create: `frontend/src/app/(main)/community/page.js`
- Create: `frontend/src/app/(main)/events/page.js`

**Interfaces:**
- Consumes: `translations[lang].comingSoon.{badge,cta}` và `translations[lang].comingSoon[section].{title,desc}` từ Task 3; token màu từ Task 1
- Produces: `<ComingSoon section="community" />` — prop `section` là string `'community' | 'events'`, dùng để tra `translations[lang].comingSoon[section]` và sinh nhãn `.exe`

- [ ] **Step 1: Tạo `components/common/ComingSoon.jsx`**

Dùng lại đúng vocabulary cửa sổ của `HeroSection` (`page.js:15-22`). Không tạo class mới.

```jsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';

function ComingSoon({ section }) {
  const { language } = useLanguageStore();
  const t = translations[language].comingSoon;
  const content = t[section];

  return (
    <div className="pt-28 md:pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full">
      <section className="window-border window-shadow bg-surface-container-lowest overflow-hidden">
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center">
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
            {section}.exe
          </span>
          <div className="flex gap-2 shrink-0">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface bg-primary"></div>
          </div>
        </div>

        <div className="p-6 md:p-16 flex flex-col items-center text-center gap-6">
          <span className="inline-block font-label text-on-tertiary font-bold uppercase tracking-widest bg-tertiary px-3 py-1 text-[10px]">
            {t.badge}
          </span>

          <h1 className="text-4xl md:text-6xl font-headline font-bold leading-[0.9] tracking-tighter text-on-surface">
            {content.title}
          </h1>

          <p className="text-base md:text-lg text-on-surface-variant font-body max-w-xl">
            {content.desc}
          </p>

          <div className="w-full max-w-md aspect-video window-border bg-surface-container-high flex flex-col items-center justify-center font-label font-bold text-on-surface-variant uppercase tracking-widest text-center p-4 mt-2">
            <span className="material-symbols-outlined text-5xl md:text-6xl mb-4">hourglass_empty</span>
            <span className="text-[10px] md:text-xs tracking-[0.2em]">{section.toUpperCase()}_MODULE.IMG</span>
          </div>

          <Link
            href="/join-us"
            className="mt-2 bg-primary text-on-primary px-8 py-4 rounded-md font-label font-bold uppercase tracking-widest window-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
          >
            {t.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ComingSoon;
```

- [ ] **Step 2: Tạo `app/(main)/community/page.js`**

```jsx
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = {
  title: 'Cộng đồng — BoardMates',
};

export default function CommunityPage() {
  return <ComingSoon section="community" />;
}
```

- [ ] **Step 3: Tạo `app/(main)/events/page.js`**

```jsx
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = {
  title: 'Sự kiện — BoardMates',
};

export default function EventsPage() {
  return <ComingSoon section="events" />;
}
```

Lưu ý: hai `page.js` này là Server Component (không có `'use client'`) nên **export được `metadata`**; `ComingSoon` mới là Client Component vì dùng `useLanguageStore`. Đây là lý do tách đôi thay vì nhét hết vào page.

- [ ] **Step 4: Verify**

```bash
cd frontend
npm run lint 2>&1 | tail -2
```
Expected: `✖ 15 problems (5 errors, 10 warnings)` — bằng đúng baseline, không tăng.

`npm run dev`, mở `http://localhost:3000/community` và `/events`:
- Trang hiện trong khung cửa sổ, thanh tiêu đề ghi `community.exe` / `events.exe`
- Navbar và Footer vẫn có (kế thừa `MainLayout`)
- Badge "Sắp ra mắt" nền amber chữ navy, **đọc rõ**
- Đổi vi/en: tiêu đề và mô tả đổi theo
- Nút CTA dẫn tới `/join-us` (chưa có ở task này → 404 là **đúng dự kiến**, Task 6 sẽ tạo)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/common/ComingSoon.jsx "frontend/src/app/(main)/community/page.js" "frontend/src/app/(main)/events/page.js"
git commit -m "Add ComingSoon component with community and events routes"
```

---

### Task 5: Dữ liệu 7 ban (`teams.js`)

**Files:**
- Create: `frontend/src/data/teams.js`

**Interfaces:**
- Consumes: không
- Produces: `export const teams` — mảng 7 object. Mỗi object:
  - `slug`: string (`'marketing' | 'design' | 'community' | 'event' | 'business-development' | 'product' | 'technology'`)
  - `icon`: string — tên Material Symbols
  - `name`, `mission`, `growthPath`: `{ vi: string, en: string }`
  - `responsibilities`, `requirements`, `benefits`: `{ vi: string[], en: string[] }`

  Task 6 đọc bằng `team.name[language]`, `team.responsibilities[language].map(...)`.

**Nội dung do Claude soạn theo khung JD của Refactor.md. User đã đồng ý và sẽ rà lại. Chưa phải nội dung chính thức.**

- [ ] **Step 1: Tạo `src/data/teams.js`**

```js
// Dữ liệu 7 ban cho trang /join-us.
// Khung field theo Refactor.md: Mission, Responsibilities, Requirements, Benefits, Growth Path.
// Tách khỏi translations.js vì đây là mảng lồng nhau, không phải dictionary phẳng.
//
// NOTE: nội dung dưới đây là bản nháp, cần rà lại trước khi công bố.

export const teams = [
  {
    slug: 'marketing',
    icon: 'campaign',
    name: { vi: 'Marketing', en: 'Marketing' },
    mission: {
      vi: 'Đưa BoardMates đến đúng người: những ai đang tìm một cộng đồng board game tử tế.',
      en: 'Bring BoardMates to the right people: those looking for a community built around board games.',
    },
    responsibilities: {
      vi: [
        'Lên kế hoạch và triển khai nội dung trên các kênh social của BoardMates',
        'Xây dựng câu chuyện thương hiệu, giữ giọng nói nhất quán',
        'Phối hợp với ban Design để sản xuất hình ảnh, video',
        'Theo dõi số liệu và điều chỉnh nội dung theo phản hồi thật',
      ],
      en: [
        'Plan and run content across BoardMates social channels',
        'Build the brand story and keep the voice consistent',
        'Work with Design to produce visuals and video',
        'Track metrics and adjust content based on real feedback',
      ],
    },
    requirements: {
      vi: [
        'Viết được tiếng Việt tự nhiên, rõ ràng',
        'Hiểu cách hoạt động của ít nhất một nền tảng social',
        'Chủ động đề xuất ý tưởng, không chờ giao việc',
      ],
      en: [
        'Write clear, natural Vietnamese',
        'Understand how at least one social platform works',
        'Propose ideas proactively rather than waiting for assignments',
      ],
    },
    benefits: {
      vi: [
        'Toàn quyền quyết định hướng nội dung ngay từ đầu',
        'Được thử nghiệm và sai, không bị bó bởi quy trình có sẵn',
        'Portfolio thật từ một dự án thật',
      ],
      en: [
        'Full ownership of content direction from day one',
        'Room to experiment and fail, unconstrained by legacy process',
        'A real portfolio from a real project',
      ],
    },
    growthPath: {
      vi: 'Content Contributor → Marketing Lead → định hình toàn bộ chiến lược thương hiệu.',
      en: 'Content Contributor → Marketing Lead → shaping the whole brand strategy.',
    },
  },
  {
    slug: 'design',
    icon: 'palette',
    name: { vi: 'Design', en: 'Design' },
    mission: {
      vi: 'Định hình ngôn ngữ hình ảnh của BoardMates, để nhìn là nhận ra.',
      en: 'Shape the BoardMates visual language so it is recognizable at a glance.',
    },
    responsibilities: {
      vi: [
        'Thiết kế ấn phẩm cho social, sự kiện và website',
        'Giữ và phát triển hệ thống nhận diện đã có',
        'Phối hợp với Product/Technology để thiết kế giao diện',
        'Xây dựng bộ template để cả team dùng lại được',
      ],
      en: [
        'Design assets for social, events, and the website',
        'Maintain and extend the existing identity system',
        'Work with Product/Technology on interface design',
        'Build templates the whole team can reuse',
      ],
    },
    requirements: {
      vi: [
        'Thành thạo ít nhất một công cụ thiết kế (Figma, Illustrator, Photoshop...)',
        'Có portfolio hoặc sản phẩm từng làm, không cần chuyên nghiệp',
        'Sẵn sàng nhận góp ý và chỉnh sửa nhiều lần',
      ],
      en: [
        'Comfortable with at least one design tool (Figma, Illustrator, Photoshop...)',
        'A portfolio or past work, however informal',
        'Willing to take feedback and iterate',
      ],
    },
    benefits: {
      vi: [
        'Được định hình nhận diện của một thương hiệu từ giai đoạn đầu',
        'Sản phẩm được dùng thật, không nằm trong ngăn kéo',
        'Làm việc trực tiếp với người quyết định, không qua nhiều tầng duyệt',
      ],
      en: [
        'Shape a brand identity from its earliest stage',
        'Work that actually ships instead of sitting in a drawer',
        'Direct access to decision-makers, no approval layers',
      ],
    },
    growthPath: {
      vi: 'Designer → Design Lead → sở hữu toàn bộ design system của BoardMates.',
      en: 'Designer → Design Lead → owning the entire BoardMates design system.',
    },
  },
  {
    slug: 'community',
    icon: 'groups',
    name: { vi: 'Community', en: 'Community' },
    mission: {
      vi: 'Biến một nhóm người lạ thành một cộng đồng thật sự muốn quay lại.',
      en: 'Turn a group of strangers into a community that genuinely wants to come back.',
    },
    responsibilities: {
      vi: [
        'Vận hành và giữ nhịp các kênh cộng đồng (Discord, Facebook Group)',
        'Chào đón thành viên mới, tạo không khí để người mới dám lên tiếng',
        'Lắng nghe phản hồi và chuyển lại cho các ban liên quan',
        'Kết nối với câu lạc bộ board game ở các trường đại học',
      ],
      en: [
        'Run and keep momentum in community channels (Discord, Facebook Group)',
        'Welcome new members and make it safe for them to speak up',
        'Listen for feedback and route it to the right team',
        'Connect with university board game clubs',
      ],
    },
    requirements: {
      vi: [
        'Thích nói chuyện với người lạ và kiên nhẫn với người mới',
        'Có mặt đều đặn, cộng đồng chết khi không ai ở đó',
        'Xử lý được mâu thuẫn nhỏ mà không làm to chuyện',
      ],
      en: [
        'Enjoy talking to strangers and have patience with newcomers',
        'Show up consistently — communities die when nobody is there',
        'Defuse small conflicts without escalating them',
      ],
    },
    benefits: {
      vi: [
        'Xây dựng cộng đồng từ thành viên số 0',
        'Hiểu sâu về vận hành cộng đồng, thứ không học được qua sách',
        'Quan hệ với mạng lưới câu lạc bộ và người chơi',
      ],
      en: [
        'Build a community from member zero',
        'Deep, hands-on understanding of community operations',
        'A network across clubs and players',
      ],
    },
    growthPath: {
      vi: 'Moderator → Community Lead → định hướng văn hoá của toàn cộng đồng.',
      en: 'Moderator → Community Lead → steering the culture of the whole community.',
    },
  },
  {
    slug: 'event',
    icon: 'event',
    name: { vi: 'Event', en: 'Event' },
    mission: {
      vi: 'Tổ chức những buổi gặp mà người tham gia muốn kể lại cho bạn bè.',
      en: 'Run gatherings that attendees want to tell their friends about.',
    },
    responsibilities: {
      vi: [
        'Lên ý tưởng và tổ chức Board Game Night, Workshop, Tournament',
        'Làm việc với board game café và các địa điểm đối tác',
        'Quản lý đăng ký, hậu cần và điều phối trong ngày diễn ra',
        'Tổng kết sau mỗi sự kiện để lần sau tốt hơn',
      ],
      en: [
        'Design and run Board Game Nights, Workshops, Tournaments',
        'Work with board game cafés and partner venues',
        'Handle registration, logistics, and day-of coordination',
        'Run a retro after each event so the next one is better',
      ],
    },
    requirements: {
      vi: [
        'Có tổ chức, nhớ được chi tiết nhỏ',
        'Bình tĩnh khi mọi thứ không diễn ra như kế hoạch',
        'Có thể có mặt vào cuối tuần, khi sự kiện thường diễn ra',
      ],
      en: [
        'Organized, and good with small details',
        'Calm when things do not go to plan',
        'Available on weekends, when events usually happen',
      ],
    },
    benefits: {
      vi: [
        'Kinh nghiệm tổ chức sự kiện thật, từ đầu tới cuối',
        'Quan hệ với chuỗi café và địa điểm ở địa phương',
        'Thấy ngay kết quả công việc của mình trên gương mặt người tham gia',
      ],
      en: [
        'Real end-to-end event experience',
        'Relationships with local cafés and venues',
        'Immediate, visible results on attendees’ faces',
      ],
    },
    growthPath: {
      vi: 'Event Crew → Event Lead → xây dựng chuỗi sự kiện thường niên của BoardMates.',
      en: 'Event Crew → Event Lead → building the BoardMates recurring event series.',
    },
  },
  {
    slug: 'business-development',
    icon: 'handshake',
    name: { vi: 'Business Development', en: 'Business Development' },
    mission: {
      vi: 'Xây mạng lưới đối tác để BoardMates đi được đường dài.',
      en: 'Build the partner network that lets BoardMates last.',
    },
    responsibilities: {
      vi: [
        'Tìm và tiếp cận đối tác: café, cửa hàng, nhà xuất bản, nhà sáng tạo',
        'Đàm phán hợp tác đôi bên cùng có lợi',
        'Duy trì quan hệ với đối tác đã có',
        'Tìm hướng để dự án tự nuôi được mình',
      ],
      en: [
        'Find and approach partners: cafés, stores, publishers, creators',
        'Negotiate partnerships that work for both sides',
        'Maintain relationships with existing partners',
        'Find paths for the project to sustain itself',
      ],
    },
    requirements: {
      vi: [
        'Tự tin bắt chuyện với người chưa quen',
        'Nghĩ được từ góc nhìn của đối phương, không chỉ của mình',
        'Kiên trì, phần lớn lời mời hợp tác sẽ bị từ chối',
      ],
      en: [
        'Comfortable starting conversations with strangers',
        'Able to think from the other side’s perspective',
        'Persistent — most partnership pitches get turned down',
      ],
    },
    benefits: {
      vi: [
        'Mạng lưới quan hệ trong ngành board game Việt Nam',
        'Kinh nghiệm đàm phán thật với đối tác thật',
        'Ảnh hưởng trực tiếp tới việc dự án có sống được hay không',
      ],
      en: [
        'A network inside the Vietnamese board game scene',
        'Real negotiation experience with real partners',
        'Direct influence on whether the project survives',
      ],
    },
    growthPath: {
      vi: 'BD Executive → BD Lead → định hình mô hình phát triển của BoardMates.',
      en: 'BD Executive → BD Lead → shaping the BoardMates growth model.',
    },
  },
  {
    slug: 'product',
    icon: 'lightbulb',
    name: { vi: 'Product', en: 'Product' },
    mission: {
      vi: 'Quyết định BoardMates nên làm gì tiếp theo, và quan trọng hơn là không nên làm gì.',
      en: 'Decide what BoardMates builds next — and more importantly, what it does not.',
    },
    responsibilities: {
      vi: [
        'Thu thập nhu cầu từ cộng đồng và chuyển thành yêu cầu cụ thể',
        'Sắp thứ tự ưu tiên, quyết định làm gì trước',
        'Phối hợp với Design và Technology từ ý tưởng tới khi ra mắt',
        'Đo lường xem thứ vừa làm có thật sự hữu ích không',
      ],
      en: [
        'Gather community needs and turn them into concrete requirements',
        'Prioritize — decide what gets built first',
        'Work with Design and Technology from idea to launch',
        'Measure whether what shipped is actually useful',
      ],
    },
    requirements: {
      vi: [
        'Suy nghĩ có cấu trúc, biết đặt câu hỏi đúng',
        'Dám nói không với ý tưởng hay nhưng chưa cần thiết',
        'Viết được yêu cầu rõ ràng để người khác hiểu và làm theo',
      ],
      en: [
        'Structured thinking, asks the right questions',
        'Willing to say no to good-but-not-yet ideas',
        'Writes requirements clearly enough for others to act on',
      ],
    },
    benefits: {
      vi: [
        'Quyền quyết định hướng sản phẩm từ giai đoạn sớm nhất',
        'Làm việc xuyên suốt với mọi ban',
        'Thấy toàn cảnh cách một sản phẩm hình thành',
      ],
      en: [
        'Product direction ownership from the earliest stage',
        'Work across every team',
        'See the full picture of how a product comes together',
      ],
    },
    growthPath: {
      vi: 'Product Contributor → Product Lead → định hình lộ trình toàn nền tảng.',
      en: 'Product Contributor → Product Lead → owning the whole platform roadmap.',
    },
  },
  {
    slug: 'technology',
    icon: 'code',
    name: { vi: 'Technology', en: 'Technology' },
    mission: {
      vi: 'Xây và giữ nền tảng kỹ thuật để mọi thứ còn lại chạy được.',
      en: 'Build and keep the technical foundation everything else runs on.',
    },
    responsibilities: {
      vi: [
        'Phát triển website và các tính năng của nền tảng',
        'Giữ hệ thống chạy ổn định, sửa lỗi khi phát sinh',
        'Phối hợp với Product và Design để hiện thực hoá ý tưởng',
        'Ghi lại tài liệu để người sau tiếp nhận được',
      ],
      en: [
        'Build the website and platform features',
        'Keep the system running and fix issues as they surface',
        'Work with Product and Design to realize ideas',
        'Document things so the next person can pick them up',
      ],
    },
    requirements: {
      vi: [
        'Biết ít nhất một ngôn ngữ lập trình và Git',
        'Tự tìm hiểu được thứ chưa biết',
        'Không cần kinh nghiệm đi làm, cần sự chủ động',
      ],
      en: [
        'Know at least one programming language and Git',
        'Able to learn what you do not yet know',
        'Work experience not required; initiative is',
      ],
    },
    benefits: {
      vi: [
        'Làm trên codebase thật với người dùng thật',
        'Được chọn công nghệ và cách làm, không bị áp đặt',
        'Kinh nghiệm full-stack từ dựng tới vận hành',
      ],
      en: [
        'Work on a real codebase with real users',
        'Choose the technology and approach yourself',
        'Full-stack experience from building to operating',
      ],
    },
    growthPath: {
      vi: 'Developer → Tech Lead → quyết định kiến trúc của toàn nền tảng.',
      en: 'Developer → Tech Lead → owning the architecture of the whole platform.',
    },
  },
];
```

- [ ] **Step 2: Verify cấu trúc dữ liệu đủ và cân**

Cùng lý do như Task 3: `.js` là CommonJS trong package này, nên `import()` sẽ chết. Đọc file, bỏ `export`, bọc IIFE.

```bash
cd frontend
node -e "
const fs=require('fs');
const src=fs.readFileSync('src/data/teams.js','utf8').replace('export const teams','const teams');
const { teams } = eval('(function(){' + src + '; return { teams };})()');
const strFields=['name','mission','growthPath'];
const listFields=['responsibilities','requirements','benefits'];
let bad=0;
console.log('so ban:', teams.length);
if (teams.length !== 7) { console.log('SAI SO BAN, mong doi 7'); bad++; }
for (const t of teams) {
  for (const f of strFields) {
    if (!t[f] || !t[f].vi || !t[f].en) { console.log('THIEU', t.slug, f); bad++; }
  }
  for (const f of listFields) {
    const vi=t[f] && t[f].vi, en=t[f] && t[f].en;
    if (!Array.isArray(vi) || !Array.isArray(en)) { console.log('KHONG PHAI MANG', t.slug, f); bad++; continue; }
    if (vi.length !== en.length) { console.log('LECH SO DONG', t.slug, f, vi.length, en.length); bad++; }
    if (vi.length === 0) { console.log('RONG', t.slug, f); bad++; }
  }
  if (!t.slug || !t.icon) { console.log('THIEU slug/icon', t.slug); bad++; }
}
const slugs=teams.map(t=>t.slug);
if (new Set(slugs).size !== slugs.length) { console.log('SLUG TRUNG'); bad++; }
console.log(bad===0 ? 'TAT CA OK' : 'CO '+bad+' LOI');
"
```
Expected: `so ban: 7` và `TAT CA OK`.

```bash
npm run lint 2>&1 | tail -2
```
Expected: `✖ 15 problems (5 errors, 10 warnings)` — bằng đúng baseline, không tăng.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/data/teams.js
git commit -m "Add bilingual team data for the join-us page

Draft copy written from the Refactor.md JD skeleton; needs owner review
before it goes public."
```

---

### Task 6: Trang /join-us

**Files:**
- Create: `frontend/src/app/(main)/join-us/page.js`

**Interfaces:**
- Consumes: `teams` từ Task 5; `translations[lang].joinUs.*` từ Task 3; token từ Task 1
- Produces: route `/join-us` (ComingSoon ở Task 4 trỏ tới đây)

- [ ] **Step 1: Tạo `app/(main)/join-us/page.js`**

Mỗi ban là một cửa sổ expand/collapse. Pattern `expand_more` xoay lấy từ dropdown profile của Navbar (`Navbar.jsx:185-187`). Không thêm animation mới.

```jsx
'use client';

import React, { useState } from 'react';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';
import { teams } from '@/data/teams';

// TODO: điền email hoặc link form tuyển dụng, ví dụ:
//   'mailto:hello@boardmates.vn'  hoặc  'https://forms.gle/...'
// Còn để rỗng thì nút Ứng tuyển hiện ở trạng thái disabled.
const APPLY_URL = '';

function FieldList({ label, items }) {
  return (
    <div className="space-y-2">
      <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </h4>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="font-body text-sm text-on-surface flex gap-2">
            <span className="text-primary shrink-0">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamWindow({ team, t, language, isOpen, onToggle }) {
  return (
    <article className="window-border window-shadow bg-surface-container-lowest overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-surface-container-highest transition-colors"
      >
        <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
          {team.slug.replace(/-/g, '_')}.exe
        </span>
        <span
          className={`material-symbols-outlined text-on-surface-variant text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">{team.icon}</span>
          <h3 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            {team.name[language]}
          </h3>
        </div>

        <div className="space-y-2">
          <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {t.mission}
          </h4>
          <p className="font-body text-sm md:text-base text-on-surface">{team.mission[language]}</p>
        </div>

        {isOpen ? (
          <div className="pt-4 border-t-2 border-outline-variant space-y-6">
            <FieldList label={t.responsibilities} items={team.responsibilities[language]} />
            <FieldList label={t.requirements} items={team.requirements[language]} />
            <FieldList label={t.benefits} items={team.benefits[language]} />

            <div className="space-y-2">
              <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {t.growthPath}
              </h4>
              <p className="font-body text-sm text-on-surface">{team.growthPath[language]}</p>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function JoinUsPage() {
  const { language } = useLanguageStore();
  const t = translations[language].joinUs;
  const [openSlug, setOpenSlug] = useState(null);

  return (
    <div className="pt-28 md:pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full space-y-16">
      {/* Intro */}
      <section className="window-border window-shadow bg-surface-container-lowest overflow-hidden">
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center">
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
            join_us.exe
          </span>
          <div className="flex gap-2 shrink-0">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface bg-primary"></div>
          </div>
        </div>
        <div className="p-6 md:p-12 space-y-6">
          <h1 className="text-4xl md:text-6xl font-headline font-bold leading-[0.9] tracking-tighter text-on-surface">
            {t.title}
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant font-body max-w-2xl">
            {t.intro}
          </p>
        </div>
      </section>

      {/* 7 ban */}
      <section className="space-y-8">
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface">
          {t.openPositions}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {teams.map((team) => (
            <TeamWindow
              key={team.slug}
              team={team}
              t={t}
              language={language}
              isOpen={openSlug === team.slug}
              onToggle={() => setOpenSlug(openSlug === team.slug ? null : team.slug)}
            />
          ))}
        </div>
      </section>

      {/* Apply */}
      <section className="window-border window-shadow bg-secondary-container p-6 md:p-12 flex flex-col items-center text-center gap-4">
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-secondary-container">
          {t.applyTitle}
        </h2>
        <p className="font-body text-base text-on-secondary-container max-w-xl">{t.applyDesc}</p>

        {APPLY_URL ? (
          <a
            href={APPLY_URL}
            className="mt-2 bg-primary text-on-primary px-8 py-4 rounded-md font-label font-bold uppercase tracking-widest window-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
          >
            {t.applyCta}
          </a>
        ) : (
          <>
            <button
              type="button"
              disabled
              className="mt-2 bg-primary text-on-primary px-8 py-4 rounded-md font-label font-bold uppercase tracking-widest opacity-50 cursor-not-allowed"
            >
              {t.applyCta}
            </button>
            <p className="font-label text-[10px] uppercase tracking-widest text-on-secondary-container">
              {t.applyPending}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd frontend
npm run lint 2>&1 | tail -2
```
Expected: `✖ 15 problems (5 errors, 10 warnings)` — bằng đúng baseline, không tăng.

`npm run dev`, mở `http://localhost:3000/join-us`:
- 7 cửa sổ ban, mỗi cửa sổ hiện icon + tên + Sứ mệnh khi đóng
- Bấm thanh tiêu đề → mở ra Công việc / Yêu cầu / Quyền lợi / Lộ trình; mũi tên `expand_more` xoay 180°
- Mở ban khác → ban đang mở tự đóng (chỉ một ban mở tại một thời điểm)
- Nút "Ứng tuyển" **mờ và không bấm được** (vì `APPLY_URL = ''`), kèm dòng "Kênh ứng tuyển sẽ sớm được mở"
- Đổi vi/en: toàn bộ nội dung 7 ban đổi theo
- Từ `/community` bấm CTA → tới được `/join-us`, không còn 404

- [ ] **Step 3: Verify nút Apply bật được**

Tạm sửa `const APPLY_URL = 'mailto:test@example.com';`, reload:
- Nút thành link bấm được, dòng "sắp được mở" biến mất

**Trả lại `const APPLY_URL = '';`** trước khi commit.

- [ ] **Step 4: Commit**

```bash
git add "frontend/src/app/(main)/join-us/page.js"
git commit -m "Add join-us page with 7 team windows

Apply CTA renders disabled until APPLY_URL is set, rather than looking
clickable and going nowhere."
```

---

### Task 7: Trang /about

**Files:**
- Create: `frontend/src/app/(main)/about/page.js`

**Interfaces:**
- Consumes: `translations[lang].about.*` từ Task 3; token từ Task 1
- Produces: route `/about`

Nội dung lấy từ Refactor.md (Product Vision, Core Philosophy, Ecosystem, Roadmap). Bỏ Partners và Founding Team — Refactor.md không có nội dung thật.

- [ ] **Step 1: Tạo `app/(main)/about/page.js`**

```jsx
'use client';

import React from 'react';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';

export default function AboutPage() {
  const { language } = useLanguageStore();
  const t = translations[language].about;

  return (
    <div className="pt-28 md:pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full space-y-16">
      {/* Vision */}
      <section className="window-border window-shadow bg-surface-container-lowest overflow-hidden">
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center">
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
            about.exe
          </span>
          <div className="flex gap-2 shrink-0">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface bg-primary"></div>
          </div>
        </div>
        <div className="p-6 md:p-12 space-y-6">
          <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
            {t.visionTitle}
          </span>
          <h1 className="text-4xl md:text-6xl font-headline font-bold leading-[0.9] tracking-tighter text-on-surface">
            {t.title}
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant font-body max-w-2xl">
            {t.vision}
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-2">
          <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
            {t.philosophyTitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface">
            {t.philosophyClosing}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {t.philosophy.map((line, idx) => (
            <div key={idx} className="window-border bg-surface-container-low p-6">
              <p className="font-headline italic text-xl text-on-surface leading-tight">{line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem */}
      <section className="window-border window-shadow bg-surface-container-low p-6 md:p-12 space-y-8">
        <div className="space-y-2">
          <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
            {t.ecosystemTitle}
          </span>
          <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface max-w-2xl">
            {t.ecosystemDesc}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {t.ecosystem.map((node, idx) => (
            <React.Fragment key={node}>
              <span className="window-border bg-surface-container-lowest px-4 py-2 font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface">
                {node}
              </span>
              {idx < t.ecosystem.length - 1 ? (
                <span className="material-symbols-outlined text-on-surface-variant self-center">
                  arrow_forward
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="space-y-8">
        <div className="space-y-1">
          <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
            {t.roadmapTitle}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.roadmap.map((item) => (
            <article key={item.phase} className="window-border window-shadow bg-surface-container-lowest p-6 space-y-4">
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {item.phase}
              </span>
              <h3 className="font-headline text-2xl font-bold text-on-surface">{item.name}</h3>
              <div className="space-y-2">
                <div className="w-full h-3 window-border bg-surface-container-high">
                  <div className="h-full bg-tertiary" style={{ width: `${item.percent}%` }}></div>
                </div>
                <span className="font-label text-[10px] font-bold text-on-surface-variant">
                  {item.percent}%
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
```

Thanh tiến độ dùng `bg-tertiary` (amber gốc) làm **mảng đặc** trên nền `surface-container-high` — đúng vai trò amber, không phải chữ.

- [ ] **Step 2: Verify**

```bash
cd frontend
npm run lint 2>&1 | tail -2
```
Expected: `✖ 15 problems (5 errors, 10 warnings)` — bằng đúng baseline, không tăng.

`npm run dev`, mở `http://localhost:3000/about`:
- Cửa sổ `about.exe` với tiêu đề "Giới thiệu"
- 4 ô triết lý
- Hệ sinh thái: 6 nhãn nối bằng mũi tên, xuống dòng gọn trên mobile
- Lộ trình: 4 thẻ, thanh amber lần lượt đầy 100% / 60% / 20% / 0%
- Đổi vi/en: mọi phần đổi theo

- [ ] **Step 3: Commit**

```bash
git add "frontend/src/app/(main)/about/page.js"
git commit -m "Add about page built from Refactor.md content

Drops the Partners and Founding Team sections: Refactor.md names them but
carries no actual content, and both describe real people and companies."
```

---

### Task 8: Navbar — logo, 5 mục, ẩn Cửa hàng + Đăng nhập

**Files:**
- Modify: `frontend/src/layouts/Navbar.jsx:73-78` (navLinks), `:91-96` (wordmark), `:99-116` (desktop links), `:237-244` (nút login), `:248-260` (mobile menu)

**Interfaces:**
- Consumes: `translations[lang].navbar.{home,community,events,joinUs,about,comingSoon}` từ Task 3; các route từ Task 4, 6, 7; token từ Task 1
- Produces: không

Làm cuối cùng để mọi route đã tồn tại, không có 404 tạm.

- [ ] **Step 1: Thêm import ở đầu file**

Thêm vào cụm import (sau dòng `import Link from 'next/link';`):

```jsx
import Image from 'next/image';
import logo from '@/assets/Logo.png';
```

**Next 16:** `priority` đã deprecated, và `preload` chỉ dành cho ảnh hero/LCP. Logo 32px dùng `loading="eager"`.

- [ ] **Step 2: Thay `navLinks` (dòng 73-78)**

```jsx
  const navLinks = [
    { to: '/', label: t.home },
    { to: '/community', label: t.community, comingSoon: true },
    { to: '/events', label: t.events, comingSoon: true },
    { to: '/join-us', label: t.joinUs },
    { to: '/about', label: t.about },
  ];
```

Bỏ hẳn mục `/marketplace` và hai mục `'#'`.

- [ ] **Step 3: Thay khối wordmark (dòng 91-96) bằng logo + chữ**

```jsx
        <Link
          href="/"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Image
            src={logo}
            alt="BoardMates"
            width={32}
            height={32}
            loading="eager"
            className="w-8 h-8 object-contain"
          />
          <span className="font-label text-xl font-bold uppercase tracking-widest text-on-surface">
            BoardMates
          </span>
        </Link>
```

- [ ] **Step 4: Thay khối desktop links (dòng 99-116)**

Mọi mục giờ đều là route thật nên bỏ nhánh `link.to === '#'` render `<button>`.

```jsx
      {/* Desktop Links */}
      <div className="hidden md:flex gap-6 lg:gap-8 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            href={link.to}
            className={`font-label uppercase text-[10px] tracking-widest transition-colors duration-200 cursor-pointer active:opacity-70 flex items-center gap-1.5 ${pathname === link.to ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface hover:text-primary'}`}
          >
            {link.label}
            {link.comingSoon ? (
              <span className="bg-tertiary text-on-tertiary text-[8px] font-bold px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                {t.comingSoon}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
```

- [ ] **Step 5: Ẩn nút đăng nhập (dòng 237-244)**

Tìm khối `) : (` ... `)}` chứa `<Link href="/login">` với icon `account_circle`, thay toàn bộ nhánh `else` thành `null`:

```jsx
        ) : null}
```

Kết quả: `{user ? ( <div className="relative" ref={profileRef}> ... </div> ) : null}`. Chuông thông báo và dropdown profile **giữ nguyên** — vẫn hiện khi đã đăng nhập.

- [ ] **Step 6: Cập nhật mobile menu (dòng 251-260)**

Thêm badge "Sắp ra mắt" cho khớp desktop:

```jsx
            {navLinks.map((link) => (
              <Link
                key={link.to}
                href={link.to}
                onClick={() => setIsMenuOpen(false)}
                className={`font-label uppercase text-sm tracking-widest flex items-center gap-2 ${pathname === link.to ? 'text-primary font-bold' : 'text-on-surface'}`}
              >
                {link.label}
                {link.comingSoon ? (
                  <span className="bg-tertiary text-on-tertiary text-[8px] font-bold px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                    {t.comingSoon}
                  </span>
                ) : null}
              </Link>
            ))}
```

- [ ] **Step 7: Verify**

```bash
cd frontend
npm run lint 2>&1 | tail -2
```
Expected: `✖ 15 problems (5 errors, 10 warnings)` — bằng đúng baseline, không tăng.

`npm run dev`, mở `http://localhost:3000`:
- Logo hiện bên trái chữ BOARDMATES, **nền logo hoà liền vào navbar** (không thấy ô vuông trắng/kem lệch tông)
- Navbar đúng 5 mục: Trang chủ, Cộng đồng, Sự kiện, Tham gia, Giới thiệu
- Cộng đồng + Sự kiện có badge amber "Sắp ra mắt", chữ navy đọc rõ
- **Không còn** mục "Cửa hàng"
- **Không còn** icon đăng nhập bên phải khi chưa đăng nhập — chỉ còn VI/EN
- Bấm từng mục: điều hướng đúng, mục đang mở có gạch chân ochre
- Đổi vi/en: nhãn menu và badge đổi theo

- [ ] **Step 8: Verify logo đã được tối ưu (không ship 994KB)**

Mở DevTools → Network → lọc `Img`, reload trang:
- Request logo trả về từ `/_next/image?...`
- Kích thước **vài KB**, không phải ~994KB

- [ ] **Step 9: Verify mobile**

Thu cửa sổ dưới 768px:
- Hamburger hiện, mở ra đủ 5 mục + badge
- Logo + chữ không tràn

- [ ] **Step 10: Verify không gỡ nhầm tính năng**

- Vào thẳng `http://localhost:3000/login` → trang đăng nhập vẫn chạy
- Đăng nhập → chuông thông báo + dropdown profile hiện lại bình thường
- Vào thẳng `http://localhost:3000/marketplace` → vẫn chạy

- [ ] **Step 11: Commit**

```bash
git add frontend/src/layouts/Navbar.jsx
git commit -m "Restructure navbar: logo, 5 items, hide shop and login

Uses loading=eager rather than priority, which Next 16 deprecated, and
rather than preload, which the docs reserve for hero/LCP images. next/image
matters here: Logo.png is 994KB at 1254px square but renders at 32px.

Login and marketplace routes still work when reached directly; only the
navbar entry points are hidden."
```

---

## Kiểm chứng cuối

- [ ] `cd frontend && npm run lint` — đúng 15 problems, không tăng so với baseline
- [ ] `npm run build` **KHÔNG chạy** — fail sẵn ở `/chat`, user đã chốt không sửa lần này
- [ ] `grep -rn "Dicero\|dicero" frontend/src/` — không kết quả
- [ ] Duyệt cả 5 route ở **cả** `vi` và `en`
- [ ] Duyệt lại các trang ngoài scope ăn màu theo: `/marketplace`, `/profile`, `/login`, `/register` — không có chữ tàng hình
- [ ] Mobile < 768px: navbar, `/join-us`, `/about` không vỡ
- [ ] Logo tải về vài KB, không phải 994KB

## Việc còn lại cho chủ dự án

1. **Rà nội dung 7 ban** trong `src/data/teams.js` — bản nháp Claude soạn, chưa phải nội dung chính thức.
2. **Điền `APPLY_URL`** trong `app/(main)/join-us/page.js` — chưa có thì nút Ứng tuyển vẫn mờ.
3. Đăng nhập lại — storage key đã đổi.
