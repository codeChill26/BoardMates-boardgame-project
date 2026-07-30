'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { ChessPawnIcon } from '@/components/common/Icons';
// logo-mark.png = Logo.png da tach nen kem thanh trong suot. Ban goc co nen kem
// bake san, dat len nen sang moi cua bang mau se lo ra mot o kem quanh logo.
import logo from '@/assets/logo-mark.png';
import logoName from '@/assets/wordmark.png';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';
import LanguageSwitcher from './LanguageSwitcher';
import { disconnectSocket, getSocket } from '@/lib/socketClient';

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { language } = useLanguageStore();
  const reducedMotion = useReducedMotion();
  const t = translations[language].navbar;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);
  const notifyRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }

      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setIsNotifyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user?.token) {
      disconnectSocket();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const socket = getSocket(user.token);

    const handleNotify = (payload) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };

    socket.on('notify:new', handleNotify);
    return () => {
      socket.off('notify:new', handleNotify);
    };
  }, [user?.token]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    // Ve trang chu chu khong ve /login: trang do dang la cua hau, dang xuat ma
    // van thay man hinh dang nhap thi nguoc voi y do giau no.
    router.push('/');
  };

  const toggleNotifications = () => {
    setIsNotifyOpen((v) => !v);
    setUnreadCount(0);
  };

  const handleNavClick = (event, to, options = {}) => {
    if (pathname === to) {
      event.preventDefault();
      return;
    }

    if (options.closeMenu) {
      setIsMenuOpen(false);
    }

    if (options.closeProfile) {
      setIsProfileOpen(false);
    }

    // Chuyen sang tab khac -> bat dau o dau trang. Cac Link deu co scroll={false}
    // (tat cuon-len-dau mac dinh cua Next), nen phai cuon tay o day.
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0 });
    }
  };

  // tourId: moc cho NavbarTour bam vao (document.querySelector('[data-tour=...]')).
  // CHI gan o ban desktop ben duoi — menu mobile de trong de querySelector khong
  // nham lan giua hai ban sao cua cung mot link.
  const navLinks = [
    { to: '/', label: t.home, tourId: 'nav-home' },
    { to: '/community', label: t.community, comingSoon: true, tourId: 'nav-community' },
    { to: '/events', label: t.events, comingSoon: true, tourId: 'nav-events' },
    { to: '/join-us', label: t.joinUs, tourId: 'nav-join-us' },
    { to: '/about', label: t.about, tourId: 'nav-about' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 border-b-2 border-outline/30 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 md:px-8 py-4 font-headline tracking-tight">
      <div className="flex items-center gap-3">
        {/* Hamburger CHI hien tren mobile. Boc trong div md:hidden vi class
            material-symbols-outlined tu dat display:inline-block, de bep md:hidden
            neu dat truc tiep tren <button> -> hamburger van hien tren desktop. */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            data-tour="nav-menu"
            className="material-symbols-outlined text-on-surface cursor-pointer p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? 'close' : 'menu'}
          </button>
        </div>

        <Link
          href="/"
          onClick={(event) => handleNavClick(event, '/')}
          scroll={false}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <Image
            src={logo}
            alt=""
            width={48}
            height={48}
            loading="eager"
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
          <Image
            src={logoName}
            alt="BoardMates"
            height={28}
            loading="eager"
            className="h-6 md:h-7 w-auto object-contain"
          />
        </Link>
      </div>
      
      {/* Desktop Links */}
      <div className="hidden md:flex gap-6 lg:gap-8 items-center">
        {navLinks.map((link) => {
          const isActive = pathname === link.to;

          return (
            <Link
              key={link.to}
              href={link.to}
              data-tour={link.tourId}
              onClick={(event) => handleNavClick(event, link.to)}
              scroll={false}
              className={`relative pb-3 font-label uppercase text-[10px] tracking-widest transition-colors duration-200 cursor-pointer active:opacity-70 flex items-center gap-1.5 ${isActive ? 'text-primary' : 'text-on-surface hover:text-primary'}`}
            >
              {link.label}
              {link.comingSoon ? (
                <span className="bg-tertiary text-on-tertiary text-[8px] font-bold px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                  {t.comingSoon}
                </span>
              ) : null}

              {/* Quan co danh dau muc dang mo: layoutId cho framer tu truot no sang
                  muc moi, nhu di quan tren ban co. CHI gan o desktop — menu mobile
                  luon nam trong DOM (chi an bang CSS md:hidden), neu render them mot
                  layoutId trung ten thi framer se nham lan giua hai cai. */}
              {isActive ? (
                <motion.span
                  layoutId="navToken"
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none"
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 500, damping: 34 }
                  }
                >
                  <span className="block w-3.5 h-3.5 text-primary">
                    <ChessPawnIcon />
                  </span>
                </motion.span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden sm:block" data-tour="nav-language">
          <LanguageSwitcher />
        </div>

        {user ? (
          <div className="relative" ref={notifyRef}>
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-on-surface">notifications</span>
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {isNotifyOpen ? (
              <div className="absolute right-0 mt-3 w-80 bg-surface-container-high border border-outline/30 rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-xl z-60">
                <div className="px-4 py-3 border-b border-outline/10">
                  <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Notifications</p>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-4">
                    <p className="font-body text-sm text-on-surface-variant">Chưa có thông báo.</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-auto">
                    {notifications.map((n, idx) => (
                      <div key={n?.id ?? idx} className="px-4 py-3 border-b border-outline/10">
                        <p className="font-body text-sm text-on-surface">
                          {n?.kind === 'ORDER'
                            ? `${n?.type === 'SELL' ? 'Listing được mua' : 'Listing được thuê'}: ${n?.title || ''}`
                            : 'Thông báo mới'}
                        </p>
                        <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                          {n?.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Giai doan tuyen core team: CHI hien khu tai khoan khi DA dang nhap.
            Nhanh else (nut "Dang nhap") da bi go — khach vang lai khong thay loi
            vao, admin tu go /login. Bat lai: khoi phuc <Link href="/login"> o day
            va o menu mobile ben duoi; key t.login van con trong translations.js. */}
        {user ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-primary shadow-lg shadow-primary/10">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-primary text-xl">person</span>
                )}
              </div>
              <span className="hidden lg:block font-label text-[10px] font-bold text-on-surface uppercase tracking-widest">
                {user.username || user.email?.split('@')[0] || 'User'}
              </span>
              <span className={`material-symbols-outlined text-on-surface-variant text-sm transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-surface-container-high border border-outline/30 rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-xl z-60 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-outline/10 mb-1">
                  <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Signed in as</p>
                  <p className="text-xs font-bold text-on-surface truncate">{user.email}</p>
                </div>
                
                <Link 
                  href="/profile"
                  onClick={(event) => handleNavClick(event, '/profile', { closeProfile: true })}
                  scroll={false}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors text-on-surface group"
                >
                  <span className="material-symbols-outlined text-xl text-on-surface-variant group-hover:text-primary">account_circle</span>
                  <span className="font-label text-xs uppercase tracking-wider">{t.profile}</span>
                </Link>

                <Link 
                  href="/chat"
                  onClick={(event) => handleNavClick(event, '/chat', { closeProfile: true })}
                  scroll={false}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors text-on-surface group"
                >
                  <span className="material-symbols-outlined text-xl text-on-surface-variant group-hover:text-primary">chat</span>
                  <span className="font-label text-xs uppercase tracking-wider">Chat</span>
                </Link>

                {user?.role === 'ADMIN' ? (
                  <Link 
                    href="/admin"
                    onClick={(event) => handleNavClick(event, '/admin', { closeProfile: true })}
                    scroll={false}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors text-on-surface group"
                  >
                    <span className="material-symbols-outlined text-xl text-on-surface-variant group-hover:text-primary">admin_panel_settings</span>
                    <span className="font-label text-xs uppercase tracking-wider">Admin</span>
                  </Link>
                ) : null}
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-error/10 transition-colors text-on-surface group"
                >
                  <span className="material-symbols-outlined text-xl text-on-surface-variant group-hover:text-error">logout</span>
                  <span className="font-label text-xs uppercase tracking-wider group-hover:text-error">{t.logout}</span>
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-surface-container-high border-b-2 border-outline shadow-xl md:hidden overflow-hidden transition-all duration-300">
          <div className="flex flex-col p-6 gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                href={link.to}
                onClick={(event) => handleNavClick(event, link.to, { closeMenu: true })}
                scroll={false}
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
            <div className="pt-4 border-t border-outline/20 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-label text-xs uppercase text-on-surface-variant">Ngôn ngữ / Language</span>
                <LanguageSwitcher />
              </div>
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={(event) => handleNavClick(event, '/profile', { closeMenu: true })}
                    scroll={false}
                    className="flex items-center gap-2 text-on-surface font-label uppercase text-sm tracking-widest"
                  >
                    <span className="material-symbols-outlined">account_circle</span>
                    {t.profile}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-primary font-label uppercase text-sm tracking-widest"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    {t.logout}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}


export default Navbar;
