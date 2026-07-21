import React from 'react';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';

function ShopSidebar({ categories }) {
  const { language } = useLanguageStore();
  const t = translations[language].marketplace;

  return (
    <aside className="w-full lg:w-64 space-y-8 md:space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-8 md:gap-10">
        {/* Categories Section */}
        <section>
          <h3 className="font-label text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6 pb-2 border-b border-outline-variant/30">{t.categories}</h3>
          <ul className="space-y-4">
            {categories && categories.length > 0 ? (
              categories.map((cat, idx) => (
                <li key={idx}>
                  <button 
                    disabled
                    className="group flex items-center justify-between w-full text-left cursor-not-allowed opacity-60"
                  >
                    <span className="font-body text-on-surface-variant text-sm">{cat.name}</span>
                    <span className="font-label text-xs font-bold text-outline-variant">{cat.count}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="text-xs font-body text-outline-variant italic">{t.updating}...</li>
            )}
          </ul>
        </section>

        {/* Price Range Section */}
        <section>
          <h3 className="font-label text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6 pb-2 border-b border-outline-variant/30">{t.price}</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5 cursor-pointer" type="checkbox"/>
              <span className="text-sm font-body">{language === 'vi' ? 'Dưới 500.000đ' : 'Under 500,000 VND'}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input defaultChecked className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5 cursor-pointer" type="checkbox"/>
              <span className="text-sm font-body">{language === 'vi' ? '500.000đ - 1.500.000đ' : '500,000 - 1,500,000 VND'}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5 cursor-pointer" type="checkbox"/>
              <span className="text-sm font-body">{language === 'vi' ? 'Trên 1.500.000đ' : 'Over 1,500,000 VND'}</span>
            </label>
          </div>
        </section>
      </div>

      {/* Member Offer Promo Card */}
      <div className="bg-primary-container/10 p-6 rounded-2xl relative overflow-hidden group border border-primary/10">
        <div className="relative z-10 text-center sm:text-left">
          <p className="font-headline text-xl text-on-primary-container italic mb-2">{t.memberOffer}</p>
          <p className="text-xs font-body text-on-primary-container/80 mb-4">{t.memberDesc}</p>
          <button className="w-full sm:w-auto bg-primary text-on-primary font-label text-[10px] uppercase tracking-widest py-2 px-6 rounded-full font-bold hover:bg-primary/90 transition-colors">{t.joinNow}</button>
        </div>
        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-7xl md:text-8xl text-primary/10 rotate-12 pointer-events-none">redeem</span>
      </div>
    </aside>
  );
}

export default ShopSidebar;

