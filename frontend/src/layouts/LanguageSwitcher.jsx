'use client';

import React from 'react';
import { useLanguageStore } from '@/hooks/useLanguageStore';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="flex bg-surface-container border-2 border-outline rounded-md overflow-hidden window-shadow">
      <button
        onClick={() => setLanguage('vi')}
        className={`px-3 py-1 font-label text-[10px] font-bold uppercase transition-colors cursor-pointer ${
          language === 'vi' ? 'bg-tertiary text-on-tertiary' : 'bg-surface hover:bg-surface-container-high text-on-surface'
        }`}
      >
        VI
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 font-label text-[10px] font-bold uppercase transition-colors cursor-pointer ${
          language === 'en' ? 'bg-tertiary text-on-tertiary' : 'bg-surface hover:bg-surface-container-high text-on-surface'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
