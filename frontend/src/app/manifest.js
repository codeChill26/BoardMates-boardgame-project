export default function manifest() {
  return {
    name: 'BoardMates — Kết nối & Sáng tạo qua Board Game',
    short_name: 'BoardMates',
    description:
      'Nền tảng kết nối và sáng tạo thông qua board game. Cộng đồng, sự kiện và không gian để cùng nhau phát triển.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFBF3',
    theme_color: '#A85B00',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Khám phá Board Game',
        short_name: 'Khám phá',
        description: 'Khám phá các tựa game và tính năng trên BoardMates',
        url: '/',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Gia nhập Core Team',
        short_name: 'Tuyển dụng',
        description: 'Trở thành một phần của đội ngũ phát triển BoardMates',
        url: '/join-us',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Kho Lưu trữ / Vault',
        short_name: 'Vault',
        description: 'Tài liệu, danh mục và luật chơi board game',
        url: '/vault',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
    categories: ['games', 'entertainment', 'social'],
    lang: 'vi',
    dir: 'ltr',
    id: '/',
    scope: '/',
  };
}
