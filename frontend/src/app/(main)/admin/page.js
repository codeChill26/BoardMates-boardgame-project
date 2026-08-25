'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getBackendUrl } from '@/lib/apiConfig';
import TailAdminDashboard from '@/components/admin/TailAdminDashboard';
import UsersManager from '@/components/admin/UsersManager';
import EventsManager from '@/components/admin/EventsManager';
import MarketplaceManager from '@/components/admin/MarketplaceManager';
import CommunityManager from '@/components/admin/CommunityManager';

import logoMark from '@/assets/logo-mark.png';
import wordmark from '@/assets/wordmark.png';

export default function SecretAdminCockpitPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState('vi');
  const [overviewData, setOverviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('Month'); // 'Day' | 'Week' | 'Month'
  const [isMounted, setIsMounted] = useState(false);

  // Master Key Security State
  const defaultEnvKey = process.env.NEXT_PUBLIC_ADMIN_MASTER_KEY;
  const [masterKey, setMasterKey] = useState(defaultEnvKey);
  const [isKeyUnlocked, setIsKeyUnlocked] = useState(!!defaultEnvKey);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const isEn = language === 'en';

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedKey = window.sessionStorage.getItem('bm_admin_master_key') || defaultEnvKey;
      if (savedKey) {
        setMasterKey(savedKey);
        setIsKeyUnlocked(true);
      }
    }
  }, [defaultEnvKey]);

  const handleUnlockWithKey = (e) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setKeyError(isEn ? 'Please enter master key' : 'Vui lòng nhập mã khóa bảo mật');
      return;
    }
    const entered = keyInput.trim();
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('bm_admin_master_key', entered);
    }
    setMasterKey(entered);
    setIsKeyUnlocked(true);
    setKeyError('');
  };

  const fetchOverview = useCallback(async () => {
    if (!user?.token || !isKeyUnlocked) return;
    try {
      setIsLoading(true);
      setError(null);

      const headers = {
        Authorization: `Bearer ${user.token}`,
      };
      if (masterKey) {
        headers['x-admin-key'] = masterKey;
      }

      const res = await fetch(`${getBackendUrl()}/api/admin/overview?timeframe=${timeframe}`, { headers });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        setOverviewData(json.data);
      } else {
        if (res.status === 403) {
          setError(
            json?.message ||
            (isEn
              ? 'Access Denied: Invalid Master Key or lack of ADMIN privileges.'
              : 'Truy cập bị từ chối: Mã Master Key không đúng hoặc bạn chưa đăng nhập tài khoản ADMIN.')
          );
        } else {
          setError(json?.message || 'Không thể kết nối đến máy chủ quản trị.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ quản trị viên');
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, isKeyUnlocked, masterKey, timeframe, isEn]);

  useEffect(() => {
    if (user?.token && isKeyUnlocked) {
      fetchOverview();
    } else {
      setIsLoading(false);
    }
  }, [user?.token, isKeyUnlocked, timeframe, fetchOverview]);

  const handleAdminLogout = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('bm_admin_master_key');
    }
    logout();
    router.push('/login');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  // Auth Check 1: Chưa đăng nhập
  if (!user?.token) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-sans">
        <div className="window-border window-shadow bg-surface-bright max-w-md w-full p-8 rounded-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary text-3xl mx-auto">
            🛡️
          </div>
          <h2 className="text-xl font-bold text-on-surface font-headline">
            Yêu Cầu Đăng Nhập Quản Trị Viên
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Khu vực này chỉ dành riêng cho Quản trị viên BoardMates. Vui lòng đăng nhập tài khoản ADMIN để tiếp tục.
          </p>
          <div className="pt-2">
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-sm border-2 border-on-surface bg-primary hover:bg-primary-dim text-white shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Đăng Nhập Ngay</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Auth Check 2: Nhập Master Passkey nếu chưa mở khóa
  if (!isKeyUnlocked) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-sans">
        <div className="window-border window-shadow bg-surface-bright max-w-md w-full p-8 rounded-sm">
          <form onSubmit={handleUnlockWithKey} className="space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-2xl mx-auto mb-2">
                🔑
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface">
                Xác Thực Khóa Chủ Admin (Master Key)
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Nhập mã Master Key bí mật đã cấu hình trong .env để mở khóa bảng điều khiển trung tâm.
              </p>
            </div>

            {keyError && (
              <div className="p-2 rounded text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                {keyError}
              </div>
            )}

            <div>
              <input
                type="password"
                placeholder="Nhập Master Key..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-mono bg-surface-container border border-outline/30 rounded-xs focus:outline-none focus:border-primary text-on-surface"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold rounded-sm border-2 border-on-surface bg-tertiary hover:bg-tertiary-dim text-on-tertiary shadow-xs cursor-pointer uppercase tracking-wider"
            >
              Mở Khóa Bảng Điều Khiển
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-surface flex overflow-hidden">
      {/* 1. BOARDMATES BRANDED SIDEBAR (#1E1A15 Deep Espresso Ink) */}
      <aside
        className={`w-64 bg-[#1E1A15] text-[#A69B8D] flex flex-col justify-between shrink-0 transition-all duration-300 z-30 border-r-2 border-[#382F24] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
          }`}
      >
        {/* Brand Logo Header */}
        <div>
          <div className="h-20 flex items-center gap-3 px-5 border-b border-[#382F24] bg-[#17130F]">
            <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
              <Image src={logoMark} alt="BoardMates Mark" width={36} height={36} className="object-contain" priority />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col min-w-0">
                <Image src={wordmark} alt="BoardMates" width={110} height={20} className="object-contain" priority />
                <span className="text-[9px] font-mono tracking-widest text-tertiary font-bold uppercase mt-0.5">
                  ADMIN COCKPIT
                </span>
              </div>
            )}
          </div>

          {/* Navigation Menu Links */}
          <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* Group 1: MENU */}
            <div>
              {isSidebarOpen && (
                <div className="text-[10px] font-bold text-[#776B5B] uppercase tracking-wider px-3 mb-2 font-mono">
                  QUẢN TRỊ TRUNG TÂM
                </div>
              )}

              <nav className="space-y-1">
                {/* Dashboard Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xs text-xs font-bold transition-all cursor-pointer ${activeTab === 'dashboard'
                    ? 'bg-primary text-white shadow-xs border border-primary-dim'
                    : 'hover:bg-[#2D261E] hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[19px]">dashboard</span>
                    {isSidebarOpen && <span>Meta Analytics Suite</span>}
                  </div>
                  {isSidebarOpen && (
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  )}
                </button>

                {/* Events / Calendar Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('events')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xs text-xs font-bold transition-all cursor-pointer ${activeTab === 'events'
                    ? 'bg-primary text-white shadow-xs border border-primary-dim'
                    : 'hover:bg-[#2D261E] hover:text-white'
                    }`}
                >
                  <span className="material-symbols-outlined text-[19px]">event</span>
                  {isSidebarOpen && <span>Quản Lý Kèo Sự Kiện</span>}
                </button>

                {/* Users Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xs text-xs font-bold transition-all cursor-pointer ${activeTab === 'users'
                    ? 'bg-primary text-white shadow-xs border border-primary-dim'
                    : 'hover:bg-[#2D261E] hover:text-white'
                    }`}
                >
                  <span className="material-symbols-outlined text-[19px]">group</span>
                  {isSidebarOpen && <span>Quản Lý Thành Viên</span>}
                </button>

                {/* Marketplace Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('marketplace')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xs text-xs font-bold transition-all cursor-pointer ${activeTab === 'marketplace'
                    ? 'bg-primary text-white shadow-xs border border-primary-dim'
                    : 'hover:bg-[#2D261E] hover:text-white'
                    }`}
                >
                  <span className="material-symbols-outlined text-[19px]">storefront</span>
                  {isSidebarOpen && <span>Marketplace</span>}
                </button>

                {/* Community Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('community')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xs text-xs font-bold transition-all cursor-pointer ${activeTab === 'community'
                    ? 'bg-primary text-white shadow-xs border border-primary-dim'
                    : 'hover:bg-[#2D261E] hover:text-white'
                    }`}
                >
                  <span className="material-symbols-outlined text-[19px]">forum</span>
                  {isSidebarOpen && <span>Kiểm Duyệt Cộng Đồng</span>}
                </button>
              </nav>
            </div>

            {/* Group 2: SUPPORT / PRO MODULES */}
            {isSidebarOpen && (
              <div>
                <div className="text-[10px] font-bold text-[#776B5B] uppercase tracking-wider px-3 mb-2 font-mono">
                  HỆ THỐNG MỞ RỘNG
                </div>
                <nav className="space-y-1 text-xs font-semibold">
                  <div className="flex items-center justify-between px-3 py-2 text-[#A69B8D] hover:text-white cursor-pointer rounded-xs hover:bg-[#2D261E]">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-tertiary">chat</span>
                      <span>Tin Nhắn Trực Tiếp</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-tertiary text-on-tertiary font-mono">
                      5 Mới
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 text-[#A69B8D] hover:text-white cursor-pointer rounded-xs hover:bg-[#2D261E]">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      <span>Nhật Ký Giao Dịch</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#382F24] text-tertiary font-mono">
                      v2.0
                    </span>
                  </div>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Logout */}
        <div className="p-3 border-t border-[#382F24] bg-[#17130F]">
          <button
            type="button"
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xs text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border border-rose-500/30"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {isSidebarOpen && <span>Đăng Xuất Admin</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN COCKPIT BODY & TOP HEADER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-surface">
        {/* TOP HEADER BAR (BoardMates Retro Style) */}
        <header className="h-20 bg-surface-bright border-b-2 border-outline/20 px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
          {/* Left: Search Bar */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-on-surface hover:text-primary cursor-pointer p-1 rounded-xs hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm thành viên, kèo, tin đăng..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-surface-container border border-outline/20 rounded-xs focus:outline-none focus:border-primary text-on-surface placeholder-outline font-sans"
              />
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="px-2.5 py-1 text-xs font-bold border border-outline/30 rounded-xs bg-surface hover:bg-surface-container text-on-surface font-mono cursor-pointer"
            >
              {language.toUpperCase()}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={fetchOverview}
              title="Làm mới dữ liệu & Thông báo"
              className="relative p-2 rounded-xs hover:bg-surface-container text-on-surface cursor-pointer border border-outline/20"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            </button>

            {/* Admin User Profile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 cursor-pointer select-none p-1 rounded-xs hover:bg-surface-container"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-on-surface font-headline">
                    {user.username || 'System Owner'}
                  </div>
                  <div className="text-[10px] text-primary font-bold font-mono">
                    ● ROOT ADMIN
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xs border-2 border-on-surface overflow-hidden shadow-2xs">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt="Admin"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="material-symbols-outlined text-outline text-sm">
                  expand_more
                </span>
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 window-border window-shadow bg-surface-bright rounded-xs py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2 border-b border-outline/20 text-xs font-mono text-on-surface-variant truncate">
                    {user.email}
                  </div>
                  <button
                    type="button"
                    onClick={handleAdminLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Đăng Xuất Khỏi Hệ Thống</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* COCKPIT MAIN CONTENT */}
        <main className="p-4 sm:p-7 flex-1 space-y-6">
          {error && (
            <div className="p-4 rounded-xs bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-32 text-center text-outline flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-3">
                progress_activity
              </span>
              <p className="text-xs font-mono">Đang đồng bộ dữ liệu BoardMates Engine...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <TailAdminDashboard
                  data={overviewData}
                  timeframe={timeframe}
                  setTimeframe={setTimeframe}
                  language={language}
                />
              )}
              {activeTab === 'events' && (
                <div className="window-border window-shadow bg-surface-bright p-5 sm:p-6 rounded-xs">
                  <h2 className="text-lg font-bold text-on-surface font-headline mb-4">Quản Lý Kèo Sự Kiện</h2>
                  <EventsManager token={user.token} masterKey={masterKey} language={language} />
                </div>
              )}
              {activeTab === 'users' && (
                <div className="window-border window-shadow bg-surface-bright p-5 sm:p-6 rounded-xs">
                  <h2 className="text-lg font-bold text-on-surface font-headline mb-4">Quản Lý Thành Viên Hệ Thống</h2>
                  <UsersManager token={user.token} masterKey={masterKey} language={language} currentUserId={user.id} />
                </div>
              )}
              {activeTab === 'marketplace' && (
                <div className="window-border window-shadow bg-surface-bright p-5 sm:p-6 rounded-xs">
                  <h2 className="text-lg font-bold text-on-surface font-headline mb-4">Quản Lý Sàn Rao Vặt</h2>
                  <MarketplaceManager token={user.token} masterKey={masterKey} language={language} />
                </div>
              )}
              {activeTab === 'community' && (
                <div className="window-border window-shadow bg-surface-bright p-5 sm:p-6 rounded-xs">
                  <h2 className="text-lg font-bold text-on-surface font-headline mb-4">Kiểm Duyệt Thảo Luận Cộng Đồng</h2>
                  <CommunityManager token={user.token} masterKey={masterKey} language={language} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
