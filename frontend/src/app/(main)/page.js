'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';
import { usePWA } from '@/hooks/usePWA';
import HomeIntro from '@/components/home/HomeIntro';
import logoName from '@/assets/wordmark.png';
import logoMark from '@/assets/logo-mark.png';

// useLayoutEffect on client (runs before paint), useEffect on server (avoid SSR warning)
const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
import { MeepleArt, ChestArt, MedalArt } from '@/components/common/GameArt';

// dynamic load Three.js component
const ChessBoard3D = dynamic(() => import('@/components/common/ChessBoard3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-square window-border bg-surface-container-high" />
  ),
});

const HeroSection = () => {
  const { language } = useLanguageStore();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWA();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const t = translations[language].hero;
  const linkTexts = translations[language].home.links;
  const isVi = language === 'vi';

  const handleDownloadClick = async () => {
    if (isInstallable) {
      const installed = await promptInstall();
      if (!installed) {
        setShowInstallGuide(true);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-8 window-border window-shadow bg-surface-container-lowest overflow-hidden">
          <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center">
            <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">
              system_welcome.exe
            </span>
            <div className="flex gap-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full border border-on-surface"></div>
              <div className="w-2.5 h-2.5 rounded-full border border-on-surface bg-primary"></div>
            </div>
          </div>

          <div className="p-5 sm:p-6 md:p-10 lg:p-12 flex flex-col md:flex-row gap-6 md:gap-10 items-center">
            <div className="w-full md:w-1/2 space-y-4 sm:space-y-6 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="inline-block font-label text-primary font-bold uppercase tracking-tighter bg-primary/10 px-2.5 py-1 text-[10px] sm:text-xs">
                  v.2024.archive
                </span>
                {isInstalled && (
                  <span className="inline-block font-label text-secondary font-bold uppercase tracking-tighter bg-secondary-container px-2 py-0.5 text-[10px]">
                    ● PWA STANDALONE
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-headline font-bold leading-[0.95] tracking-tight text-on-surface">
                {t.welcome}
              </h1>
              <Image
                src={logoName}
                alt="BoardMates"
                className="h-10 sm:h-12 md:h-16 xl:h-20 w-auto max-w-full object-contain mx-auto md:mx-0"
                loading="eager"
              />
              <p className="text-sm sm:text-base md:text-lg text-on-surface-variant font-body max-w-md mx-auto md:mx-0 leading-relaxed">
                {t.subtitle}
              </p>

              {/* Action Buttons: Explore + Download / Install PWA */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 items-stretch sm:items-center justify-center md:justify-start">
                <button className="bg-tertiary text-on-tertiary px-6 sm:px-8 py-3.5 sm:py-4 rounded-md font-label font-bold uppercase tracking-widest window-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:scale-98 transition-all cursor-pointer text-xs sm:text-sm">
                  {t.explore}
                </button>

                <button
                  onClick={handleDownloadClick}
                  className="bg-surface-container-high text-on-surface border-2 border-on-surface px-5 sm:px-6 py-3.5 sm:py-4 rounded-md font-label font-bold uppercase tracking-widest window-shadow hover:bg-surface-container-highest hover:translate-x-0.5 hover:translate-y-0.5 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <span className="material-symbols-outlined text-primary text-lg sm:text-xl">
                    {isInstalled ? 'check_circle' : 'install_mobile'}
                  </span>
                  <span>
                    {isInstalled
                      ? (isVi ? 'Đã Cài Đặt' : 'App Installed')
                      : (isVi ? 'Tải App Về Máy' : 'Install App')}
                  </span>
                </button>
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <div className="w-full aspect-square window-border bg-surface-container-high overflow-hidden touch-pan-y">
                <ChessBoard3D className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="window-border window-shadow bg-surface-container-low p-5 sm:p-6 space-y-4 sm:space-y-6">
            <h3 className="font-label font-bold uppercase border-b-2 border-outline pb-2 text-xs sm:text-sm tracking-wider">
              {t.quickLinks}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <LinkButton icon="article" label={linkTexts.blog} />
              <LinkButton icon="folder_open" label={linkTexts.projects} />
              <LinkButton icon="info" label={linkTexts.info} />
              <LinkButton icon="mail" label={linkTexts.contact} />
            </div>
          </div>

          <div className="window-border window-shadow bg-secondary-container p-5 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 text-on-secondary-container">
              <span
                className="material-symbols-outlined text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
              <span className="font-label font-bold uppercase text-[10px] tracking-wider">
                {t.collector}
              </span>
            </div>
            <p className="font-headline italic text-lg sm:text-xl md:text-2xl text-on-secondary-container leading-tight">
              &quot;{t.featured}&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Retro Install / Download Guidance Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="w-full max-w-lg window-border window-shadow bg-surface-container-lowest overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Title */}
            <div className="retro-title-bar bg-tertiary px-4 py-2 flex justify-between items-center text-on-tertiary">
              <span className="font-label text-xs font-bold uppercase tracking-wider">
                {isVi ? 'HƯỚNG DẪN CÀI ĐẶT BOARDMATES APP' : 'INSTALL BOARDMATES APP GUIDE'}
              </span>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="font-bold text-sm hover:bg-black/10 px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 font-body">
              <div className="flex items-center gap-3 border-b-2 border-outline-variant pb-4">
                <div className="w-14 h-14 window-border bg-surface-container-high p-1.5 flex items-center justify-center shrink-0">
                  <Image
                    src={logoMark}
                    alt="BoardMates"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-xl text-on-surface">BoardMates PWA</h3>
                  <p className="text-xs text-on-surface-variant">
                    {isVi
                      ? 'Ứng dụng Progressive Web App mở nhanh 0ms, không tốn dung lượng'
                      : 'Progressive Web App with 0ms launch & offline capability'}
                  </p>
                </div>
              </div>

              {/* Instructions per OS */}
              <div className="space-y-3 text-sm text-on-surface">
                {isIOS ? (
                  // iOS Safari instructions
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 bg-surface-container-high window-border">
                      <span className="font-label font-bold text-primary text-base">01</span>
                      <div>
                        <p className="font-bold text-xs uppercase font-label">
                          {isVi ? 'Bấm biểu tượng Chia sẻ trên Safari' : 'Tap the Share icon on Safari'}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5 flex-wrap">
                          {isVi ? (
                            <>
                              Nhấn nút{' '}
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-white window-border text-primary font-bold">
                                ⎋
                              </span>{' '}
                              ở thanh công cụ đáy Safari.
                            </>
                          ) : (
                            <>
                              Tap the{' '}
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-white window-border text-primary font-bold">
                                ⎋
                              </span>{' '}
                              Share button at the bottom toolbar.
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-surface-container-high window-border">
                      <span className="font-label font-bold text-primary text-base">02</span>
                      <div>
                        <p className="font-bold text-xs uppercase font-label">
                          {isVi ? 'Thêm vào Màn hình chính' : 'Add to Home Screen'}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {isVi
                            ? 'Cuộn xuống và bấm "Thêm vào MH chính" (Add to Home Screen ⊞) rồi chọn "Thêm".'
                            : 'Scroll down, tap "Add to Home Screen ⊞" and click "Add".'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Android / Chrome PC instructions
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 bg-surface-container-high window-border">
                      <span className="font-label font-bold text-primary text-base">01</span>
                      <div>
                        <p className="font-bold text-xs uppercase font-label">
                          {isVi ? 'Trên Điện thoại Android (Chrome / Edge)' : 'On Android Phone (Chrome / Edge)'}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {isVi
                            ? 'Bấm nút Menu (⋮) ở góc trên bên phải trình duyệt ➔ Chọn "Cài đặt ứng dụng" (hoặc "Thêm vào Màn hình chính").'
                            : 'Tap the Menu button (⋮) at top right ➔ Select "Install app" (or "Add to Home screen").'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-surface-container-high window-border">
                      <span className="font-label font-bold text-primary text-base">02</span>
                      <div>
                        <p className="font-bold text-xs uppercase font-label">
                          {isVi ? 'Trên Máy tính (Chrome / Edge / Cốc Cốc)' : 'On Desktop Browser'}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {isVi
                            ? 'Bấm vào biểu tượng Cài đặt ⊕ ở góc phải thanh địa chỉ URL.'
                            : 'Click the Install icon ⊕ on the right side of your address bar.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="w-full bg-tertiary text-on-tertiary py-3 rounded-sm font-label font-bold text-xs uppercase tracking-widest window-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                >
                  {isVi ? 'Đã hiểu & Đóng' : 'Got it & Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const LinkButton = ({ icon, label }) => (
  <Link
    className="group p-3 sm:p-4 bg-surface-container-lowest window-border hover:bg-primary/10 active:bg-primary/20 transition-colors cursor-pointer flex flex-col items-center text-center"
    href="/marketplace"
  >
    <span className="material-symbols-outlined text-primary block mb-1.5 sm:mb-2 text-xl sm:text-2xl">
      {icon}
    </span>
    <span className="font-label text-[10px] sm:text-xs font-bold uppercase tracking-wider">
      {label}
    </span>
  </Link>
);

const GameCard = ({ id, title, description, category, players, isHighHeader, Art }) => {
  const { language } = useLanguageStore();
  return (
    <div className="window-border window-shadow bg-surface-container-lowest flex flex-col">
      <div
        className={`retro-title-bar px-3 py-1.5 flex justify-between items-center ${
          isHighHeader ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-high'
        }`}
      >
        <span className="font-label text-[10px] font-bold uppercase tracking-widest truncate pr-2">
          board_game_{id}.img
        </span>
        <span className="material-symbols-outlined text-xs cursor-pointer">close</span>
      </div>
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="w-full aspect-square window-border bg-surface-container-high mb-4 flex items-center justify-center p-6 overflow-hidden">
          <Art className="w-3/4 h-3/4" />
        </div>
        <h4 className="font-headline text-xl sm:text-2xl font-bold mb-2 text-on-surface">
          {title}
        </h4>
        <p className="font-body text-xs sm:text-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-wrap gap-2 mt-auto mb-4">
          <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-label font-bold uppercase">
            {category}
          </span>
          <span className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-[10px] font-label font-bold uppercase">
            {players} {language === 'vi' ? 'Người' : 'Players'}
          </span>
        </div>
      </div>
      <div className="p-3.5 sm:p-4 border-t-2 border-outline-variant bg-surface-container-low flex justify-between items-center mt-auto">
        <span className="font-label font-bold text-primary text-xs sm:text-sm">#{id}</span>
        <button
          aria-label="Xem chi tiết"
          className="material-symbols-outlined text-primary bg-surface-container-lowest p-2 rounded-md window-border cursor-pointer hover:bg-surface-container-high active:scale-95 transition-all text-base"
        >
          arrow_forward
        </button>
      </div>
    </div>
  );
};

const BlogSection = () => {
  const { language } = useLanguageStore();
  const t = translations[language].home.blog;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center py-6 md:py-10">
      {/* Desktop Overlapping Blog Windows */}
      <div className="relative min-h-[400px] md:min-h-[480px] hidden md:block">
        {/* Overlapping Blog Window 1 (Back) */}
        <div className="absolute top-10 left-10 w-full max-w-sm window-border bg-surface-container-high p-6 window-shadow z-10 rotate-[-2deg]">
          <div className="mb-4">
            <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant">
              Blog / 12.05.2024
            </span>
          </div>
          <h5 className="font-headline text-xl font-bold mb-3">
            {language === 'vi' ? 'Nghệ thuật thiết kế quân cờ' : 'Chess Piece Design Art'}
          </h5>
          <p className="text-sm font-body text-on-surface-variant mb-4">
            {language === 'vi'
              ? 'Khám phá quá trình chế tác những quân cờ từ gỗ mun tại các làng nghề truyền thống...'
              : 'Discover the crafting process of ebony chess pieces in traditional villages...'}
          </p>
          <Link
            className="text-xs font-label font-bold text-primary uppercase underline"
            href="/marketplace"
          >
            {t.readMore}
          </Link>
        </div>

        {/* Overlapping Blog Window 2 (Middle) */}
        <div className="absolute top-0 left-0 w-full max-w-sm window-border bg-surface-container-lowest p-6 window-shadow z-20 rotate-[1deg]">
          <div className="mb-4">
            <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant">
              News / 10.05.2024
            </span>
          </div>
          <h5 className="font-headline text-xl font-bold mb-3">
            {language === 'vi' ? 'Tương lai của Board Game Số' : 'Future of Digital Board Games'}
          </h5>
          <p className="text-sm font-body text-on-surface-variant mb-4">
            {language === 'vi'
              ? 'Khi công nghệ AR mang những bàn cờ cổ điển vào không gian phòng khách của bạn...'
              : 'When AR technology brings classic boards into your living room...'}
          </p>
          <Link
            className="text-xs font-label font-bold text-primary uppercase underline"
            href="/marketplace"
          >
            {t.readMore}
          </Link>
        </div>

        {/* Overlapping Blog Window 3 (Front) */}
        <div className="absolute top-32 left-28 w-full max-w-sm window-border bg-surface-container-low p-6 window-shadow z-30 rotate-[-1deg]">
          <div className="mb-4">
            <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant">
              Editor / 08.05.2024
            </span>
          </div>
          <h5 className="font-headline text-xl font-bold mb-3">
            {language === 'vi' ? 'Phỏng vấn Nghệ sĩ Minh Quân' : 'Interview with Artist Minh Quan'}
          </h5>
          <p className="text-sm font-body text-on-surface-variant mb-4">
            {language === 'vi'
              ? 'Về dự án BoardMates và mong muốn lưu giữ giá trị của những trò chơi dân gian...'
              : 'About the BoardMates project and the desire to preserve traditional game values...'}
          </p>
          <Link
            className="text-xs font-label font-bold text-primary uppercase underline"
            href="/marketplace"
          >
            {t.readMore}
          </Link>
        </div>
      </div>

      {/* Mobile Stacked Blog Card (Clean retro window for screens < md) */}
      <div className="block md:hidden space-y-4">
        <div className="window-border window-shadow bg-surface-container-lowest overflow-hidden">
          <div className="retro-title-bar bg-surface-container-high px-3 py-1.5 flex justify-between items-center">
            <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant">
              News / 10.05.2024
            </span>
            <span className="material-symbols-outlined text-xs">open_in_new</span>
          </div>
          <div className="p-5 space-y-3">
            <h5 className="font-headline text-xl font-bold text-on-surface">
              {language === 'vi' ? 'Tương lai của Board Game Số' : 'Future of Digital Board Games'}
            </h5>
            <p className="text-xs sm:text-sm font-body text-on-surface-variant leading-relaxed">
              {language === 'vi'
                ? 'Khi công nghệ AR mang những bàn cờ cổ điển vào không gian phòng khách của bạn cùng cộng đồng BoardMates...'
                : 'When AR technology brings classic boards into your living room with BoardMates community...'}
            </p>
            <Link
              className="inline-block text-xs font-label font-bold text-primary uppercase underline pt-1"
              href="/marketplace"
            >
              {t.readMore} →
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 lg:pl-12 text-center md:text-left">
        <div className="space-y-2">
          <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
            {t.latest}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-on-surface">
            {t.title}
          </h2>
        </div>
        <p className="text-sm sm:text-base md:text-lg text-on-surface-variant font-body leading-relaxed max-w-lg mx-auto md:mx-0">
          {t.desc}
        </p>
        <div className="pt-2 sm:pt-4">
          <button className="w-full sm:w-auto bg-on-surface text-surface px-6 sm:px-8 py-3.5 sm:py-4 rounded-md font-label font-bold uppercase tracking-widest window-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:scale-98 transition-all cursor-pointer">
            {t.viewAll}
          </button>
        </div>
      </div>
    </section>
  );
};

export default function HomePage() {
  const { language } = useLanguageStore();
  const t = translations[language].home.games;

  const [showIntro, setShowIntro] = React.useState(true);
  useIsoLayoutEffect(() => {
    if (sessionStorage.getItem('bm_intro_seen')) {
      setShowIntro(false);
    } else {
      sessionStorage.setItem('bm_intro_seen', '1');
    }
  }, []);

  return (
    <>
      {showIntro ? <HomeIntro /> : null}
      <main className="pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-16 md:space-y-24">
        <HeroSection />

        {/* Latest Games Section */}
        <section className="space-y-6 sm:space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-3 text-center md:text-left">
            <div className="space-y-1">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
                {t.newCollection}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-on-surface">
                {t.title}
              </h2>
            </div>
            <button className="font-label text-xs sm:text-sm font-bold uppercase border-b-2 border-primary pb-1 hover:text-primary transition-all cursor-pointer">
              {t.viewMore}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <GameCard
              id="01"
              title={language === 'vi' ? 'Cờ Thế Kỷ' : 'Century Chess'}
              description={
                language === 'vi'
                  ? 'Một bản phục dựng kỹ thuật số của trò chơi chiến thuật thế kỷ 19 với đồ họa pixel tinh tế.'
                  : 'A digital restoration of a 19th-century strategy game with exquisite pixel graphics.'
              }
              category={language === 'vi' ? 'Chiến thuật' : 'Strategy'}
              players="2"
              Art={MeepleArt}
            />
            <GameCard
              id="02"
              title={language === 'vi' ? 'Huyền Thoại Xưa' : 'Ancient Legends'}
              description={
                language === 'vi'
                  ? 'Khám phá những thẻ bài ma thuật được vẽ tay thủ công theo phong cách kiến trúc Đông Dương.'
                  : 'Explore hand-drawn magic cards in the style of Indochinese architecture.'
              }
              category={language === 'vi' ? 'Nhập vai' : 'RPG'}
              players="4-6"
              isHighHeader
              Art={ChestArt}
            />
            <GameCard
              id="03"
              title={language === 'vi' ? 'Mê Cung Số' : 'Number Maze'}
              description={
                language === 'vi'
                  ? 'Sự kết hợp giữa toán học và may mắn trong một thiết kế bàn cờ theo phong cách Bauhaus.'
                  : 'A combination of mathematics and luck in a Bauhaus-style board design.'
              }
              category={language === 'vi' ? 'Toán học' : 'Math'}
              players="2-4"
              Art={MedalArt}
            />
          </div>
        </section>

        <BlogSection />
      </main>
    </>
  );
}
