'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';
import HomeIntro from '@/components/home/HomeIntro';
import logoName from '@/assets/wordmark.png';

// useLayoutEffect tren client (chay truoc khi ve), useEffect tren server (tranh warning SSR)
const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
import { MeepleArt, ChestArt, MedalArt } from '@/components/common/GameArt';

// three.js chi tai o trinh duyet + la mieng nang nhat. Tai dong, tat SSR: khong
// nem WebGL vao bundle server, khong chan lan render dau. Dung chung chunk voi
// Dice3D nen khong cong don dung luong.
const ChessBoard3D = dynamic(() => import('@/components/common/ChessBoard3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-square window-border bg-surface-container-high" />
  ),
});

const HeroSection = () => {
  const { language } = useLanguageStore();
  const t = translations[language].hero;
  const linkTexts = translations[language].home.links;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8 window-border window-shadow bg-surface-container-lowest overflow-hidden">
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex justify-between items-center">
          <span className="font-label text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface truncate pr-2">system_welcome.exe</span>
          <div className="flex gap-2 shrink-0">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-on-surface bg-primary"></div>
          </div>
        </div>
        <div className="p-6 md:p-12 flex flex-col md:flex-row gap-8 md:gap-10 items-center">
          <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
            <span className="inline-block font-label text-primary font-bold uppercase tracking-tighter bg-primary/10 px-2 py-1 text-[10px]">v.2024.archive</span>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-headline font-bold leading-[0.9] tracking-tighter text-on-surface">
              {t.welcome}
            </h1>
            <Image
              src={logoName}
              alt="BoardMates"
              className="h-12 md:h-16 xl:h-20 w-auto max-w-full object-contain mx-auto md:mx-0"
              loading="eager"
            />
            <p className="text-base md:text-lg text-on-surface-variant font-body max-w-md mx-auto md:mx-0">
              {t.subtitle}
            </p>
            <button className="w-full md:w-auto bg-tertiary text-on-tertiary px-8 py-4 rounded-md font-label font-bold uppercase tracking-widest window-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
              {t.explore}
            </button>
          </div>
          <div className="w-full md:w-1/2">
            <div className="w-full aspect-square window-border bg-surface-container-high overflow-hidden">
              <ChessBoard3D className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="window-border window-shadow bg-surface-container-low p-6 space-y-6">
          <h3 className="font-label font-bold uppercase border-b-2 border-outline pb-2 text-sm">{t.quickLinks}</h3>
          <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <LinkButton icon="article" label={linkTexts.blog} />
            <LinkButton icon="folder_open" label={linkTexts.projects} />
            <LinkButton icon="info" label={linkTexts.info} />
            <LinkButton icon="mail" label={linkTexts.contact} />
          </div>
        </div>
        <div className="window-border window-shadow bg-secondary-container p-6">
          <div className="flex items-center gap-3 mb-2 text-on-secondary-container">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="font-label font-bold uppercase text-[10px]">{t.collector}</span>
          </div>
          <p className="font-headline italic text-xl md:text-2xl text-on-secondary-container leading-tight">
            "{t.featured}"
          </p>
        </div>
      </div>
    </section>
  );
};


const LinkButton = ({ icon, label }) => (
  <Link className="group p-4 bg-surface-container-lowest window-border hover:bg-primary/10 transition-colors cursor-pointer flex flex-col items-center text-center" href="/marketplace">
    <span className="material-symbols-outlined text-primary block mb-2">{icon}</span>
    <span className="font-label text-[10px] md:text-sm font-bold uppercase">{label}</span>
  </Link>
);

const GameCard = ({ id, title, description, category, players, isHighHeader, Art }) => {
  const { language } = useLanguageStore();
  return (
    <div className="window-border window-shadow bg-surface-container-lowest flex flex-col">
      <div className={`retro-title-bar px-3 py-1 flex justify-between items-center ${isHighHeader ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-high'}`}>
        <span className="font-label text-[10px] font-bold uppercase tracking-widest">board_game_{id}.img</span>
        <span className="material-symbols-outlined text-xs cursor-pointer">close</span>
      </div>
      <div className="p-4 flex-1">
        <div className="w-full aspect-square window-border bg-surface-container-high mb-4 flex items-center justify-center p-6 overflow-hidden">
          <Art className="w-3/4 h-3/4" />
        </div>
        <h4 className="font-headline text-2xl font-bold mb-2">{title}</h4>
        <p className="font-body text-sm text-on-surface-variant line-clamp-2 mb-4">
          {description}
        </p>
        <div className="flex gap-2 mb-6">
          <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-label font-bold uppercase">{category}</span>
          <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-[10px] font-label font-bold uppercase">{players} {language === 'vi' ? 'Người' : 'Players'}</span>
        </div>
      </div>
      <div className="p-4 border-t-2 border-outline-variant bg-surface-container-low flex justify-between items-center mt-auto">
        <span className="font-label font-bold text-primary">#{id}</span>
        <button className="material-symbols-outlined text-primary bg-surface-container-lowest p-2 rounded-md window-border cursor-pointer hover:bg-surface-container-high transition-colors">arrow_forward</button>
      </div>
    </div>
  );
};

const BlogSection = () => {
  const { language } = useLanguageStore();
  const t = translations[language].home.blog;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-10">
      <div className="relative min-h-[400px] md:min-h-[500px] hidden md:block">
        {/* Overlapping Blog Window 1 (Back) */}
        <div className="absolute top-10 left-10 w-full max-w-sm window-border bg-surface-container-high p-6 window-shadow z-10 rotate-[-2deg]">
          <div className="mb-4">
            <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant">Blog / 12.05.2024</span>
          </div>
          <h5 className="font-headline text-xl font-bold mb-3">{language === 'vi' ? 'Nghệ thuật thiết kế quân cờ' : 'Chess Piece Design Art'}</h5>
          <p className="text-sm font-body text-on-surface-variant mb-4">{language === 'vi' ? 'Khám phá quá trình chế tác những quân cờ từ gỗ mun tại các làng nghề truyền thống...' : 'Discover the crafting process of ebony chess pieces in traditional villages...'}</p>
          <Link className="text-xs font-label font-bold text-primary uppercase underline" href="/marketplace">{t.readMore}</Link>
        </div>
        {/* Overlapping Blog Window 2 (Middle) */}
        <div className="absolute top-0 left-0 w-full max-w-sm window-border bg-surface-container-lowest p-6 window-shadow z-20 rotate-[1deg]">
          <div className="mb-4">
            <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant">News / 10.05.2024</span>
          </div>
          <h5 className="font-headline text-xl font-bold mb-3">{language === 'vi' ? 'Tương lai của Board Game Số' : 'Future of Digital Board Games'}</h5>
          <p className="text-sm font-body text-on-surface-variant mb-4">{language === 'vi' ? 'Khi công nghệ AR mang những bàn cờ cổ điển vào không gian phòng khách của bạn...' : 'When AR technology brings classic boards into your living room...'}</p>
          <Link className="text-xs font-label font-bold text-primary uppercase underline" href="/marketplace">{t.readMore}</Link>
        </div>
        {/* Overlapping Blog Window 3 (Front) */}
        <div className="absolute top-32 left-32 w-full max-w-sm window-border bg-surface-container-low p-6 window-shadow z-30 rotate-[-1deg]">
          <div className="mb-4">
            <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant">Editor / 08.05.2024</span>
          </div>
          <h5 className="font-headline text-xl font-bold mb-3">{language === 'vi' ? 'Phỏng vấn Nghệ sĩ Minh Quân' : 'Interview with Artist Minh Quan'}</h5>
          <p className="text-sm font-body text-on-surface-variant mb-4">{language === 'vi' ? 'Về dự án BoardMates và mong muốn lưu giữ giá trị của những trò chơi dân gian...' : 'About the BoardMates project and the desire to preserve traditional game values...'}</p>
          <Link className="text-xs font-label font-bold text-primary uppercase underline" href="/marketplace">{t.readMore}</Link>
        </div>
      </div>
      <div className="space-y-6 lg:pl-12 text-center md:text-left">
        <div className="space-y-2">
          <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">{t.latest}</span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold">{t.title}</h2>
        </div>
        <p className="text-base md:text-lg text-on-surface-variant font-body">
          {t.desc}
        </p>
        <div className="pt-4">
          <button className="w-full md:w-auto bg-on-surface text-surface px-8 py-4 rounded-md font-label font-bold uppercase tracking-widest window-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
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

  // Man mo dau chi hien lan dau moi phien. Mac dinh true (SSR + lan dau thay ngay).
  // Dung layout-effect (chay TRUOC khi ve) de khi quay lai / trong cung phien thi
  // nap bi go truoc khi kip ve -> khong nhap nhay. useEffect se ve 1 frame roi moi tat.
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
      <main className="pt-28 md:pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto space-y-24">
        <HeroSection />

      {/* Latest Games Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 text-center md:text-left">
          <div className="space-y-1">
            <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">{t.newCollection}</span>
            <h2 className="text-3xl md:text-4xl font-headline font-bold">{t.title}</h2>
          </div>
          <button className="font-label text-sm font-bold uppercase border-b-2 border-primary pb-1 hover:text-primary transition-all cursor-pointer">{t.viewMore}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <GameCard 
            id="01" 
            title={language === 'vi' ? "Cờ Thế Kỷ" : "Century Chess"}
            description={language === 'vi' ? "Một bản phục dựng kỹ thuật số của trò chơi chiến thuật thế kỷ 19 với đồ họa pixel tinh tế." : "A digital restoration of a 19th-century strategy game with exquisite pixel graphics."}
            category={language === 'vi' ? "Chiến thuật" : "Strategy"}
            players="2"
            Art={MeepleArt}
          />
          <GameCard 
            id="02" 
            title={language === 'vi' ? "Huyền Thoại Xưa" : "Ancient Legends"} 
            description={language === 'vi' ? "Khám phá những thẻ bài ma thuật được vẽ tay thủ công theo phong cách kiến trúc Đông Dương." : "Explore hand-drawn magic cards in the style of Indochinese architecture."}
            category={language === 'vi' ? "Nhập vai" : "RPG"}
            players="4-6"
            isHighHeader
            Art={ChestArt}
          />
          <GameCard 
            id="03" 
            title={language === 'vi' ? "Mê Cung Số" : "Number Maze"} 
            description={language === 'vi' ? "Sự kết hợp giữa toán học và may mắn trong một thiết kế bàn cờ theo phong cách Bauhaus." : "A combination of mathematics and luck in a Bauhaus-style board design."}
            category={language === 'vi' ? "Toán học" : "Math"}
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
