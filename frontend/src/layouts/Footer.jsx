'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';
import { FacebookIcon, InstagramIcon, TikTokIcon } from '@/components/common/Icons';
import footerLogo from '@/assets/footer_logo.png';

function Footer() {
  const { language } = useLanguageStore();
  const t = translations[language].footer;

  return (
    <footer className="w-full border-t-2 border-outline mt-auto bg-surface-container-low flex flex-col-reverse md:flex-row justify-between items-center px-6 md:px-12 py-10 font-body text-sm gap-8">
      <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left">
        {/* Logo BoardMates day du, da xoa nen trong suot nen khong can mix-blend. */}
        <Image
          src={footerLogo}
          alt="BoardMates"
          width={340}
          height={161}
          className="w-auto h-24 md:h-32 select-none"
        />
        <div className="text-on-surface">© 2026 BoardMates. {t.rights}</div>
      </div>
      <div className="flex gap-8 justify-center items-center">
        <a
          className="text-on-surface hover:text-primary transition-all duration-300"
          href="https://www.facebook.com/profile.php?id=61591971322796"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <span className="sr-only">Facebook</span>
          <div className="h-5 w-5">
            <FacebookIcon />
          </div>
        </a>
        <a className="text-on-surface hover:text-primary transition-all duration-300" href="#" aria-label="Instagram">
          <span className="sr-only">Instagram</span>
          <div className="h-5 w-5">
            <InstagramIcon />
          </div>
        </a>
        <a className="text-on-surface hover:text-primary transition-all duration-300" href="#" aria-label="TikTok">
          <span className="sr-only">TikTok</span>
          <div className="h-5 w-5">
            <TikTokIcon />
          </div>
        </a>
      </div>
    </footer>
  );
}

export default Footer;

