'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getBackendUrl } from '@/lib/apiConfig';
import AnalyticsOverview from '@/components/admin/AnalyticsOverview';
import UsersManager from '@/components/admin/UsersManager';
import EventsManager from '@/components/admin/EventsManager';
import MarketplaceManager from '@/components/admin/MarketplaceManager';
import CommunityManager from '@/components/admin/CommunityManager';

const TABS = [
  { id: 'overview', labelVi: 'Meta Suite Analytics', labelEn: 'Meta Suite Analytics', icon: 'insights' },
  { id: 'users', labelVi: 'Quản Lý Thành Viên', labelEn: 'User Management', icon: 'manage_accounts' },
  { id: 'events', labelVi: 'Quản Lý Sự Kiện / Kèo', labelEn: 'Events Matchmaking', icon: 'event' },
  { id: 'marketplace', labelVi: 'Sàn Rao Vặt', labelEn: 'Marketplace', icon: 'storefront' },
  { id: 'community', labelVi: 'Kiểm Duyệt Cộng Đồng', labelEn: 'Community Moderation', icon: 'forum' },
];

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState('vi');
  const [overviewData, setOverviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isEn = language === 'en';

  const fetchOverview = useCallback(async () => {
    if (!user?.token) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${getBackendUrl()}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setOverviewData(json.data);
      } else {
        if (res.status === 403) {
          setError(isEn ? 'Access Denied: You need an ADMIN account to view this suite.' : 'Truy cập bị từ chối: Bạn cần đăng nhập bằng tài khoản ADMIN để sử dụng.');
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
  }, [user?.token, isEn]);

  useEffect(() => {
    if (user?.token) {
      fetchOverview();
    } else {
      setIsLoading(false);
    }
  }, [user?.token, fetchOverview]);

  // Auth Guard: Khách chưa đăng nhập hoặc không phải ADMIN
  if (!user?.token) {
    return (
      <div className="pt-24 pb-16 min-h-screen max-w-lg mx-auto px-4 flex items-center justify-center font-sans">
        <div className="window-border window-shadow bg-surface-bright w-full rounded-sm overflow-hidden text-center">
          <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex items-center justify-between font-mono text-xs select-none">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-[17px]">lock</span>
              <span className="font-bold tracking-wider text-on-surface uppercase">
                {isEn ? 'admin_access_denied.exe' : 'khoa_truy_cap_admin.exe'}
              </span>
            </div>
          </div>

          <div className="p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 text-3xl mx-auto">
              🛡️
            </div>
            <div>
              <h2 className="font-headline font-bold text-xl text-on-surface">
                {isEn ? 'Admin Authentication Required' : 'Yêu Cầu Quyền Quản Trị Viên'}
              </h2>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                {isEn
                  ? 'This administrative suite is restricted to authorized BoardMates staff and operators.'
                  : 'Khu vực quản trị chỉ dành cho tài khoản có quyền ADMIN. Vui lòng đăng nhập tài khoản admin (admin@bg.com) để tiếp tục.'}
              </p>
            </div>

            <div className="pt-2">
              <a
                href="/login?redirect=/admin"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-sm border-2 border-on-surface bg-primary hover:bg-primary-dim text-on-primary shadow-xs active:translate-y-0.5 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>{isEn ? 'Login with Admin Account' : 'Đăng Nhập Tài Khoản Admin'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 min-h-screen max-w-7xl mx-auto px-3 sm:px-6 space-y-6 font-sans">
      {/* Retro Window Master Wrapper */}
      <div className="window-border window-shadow bg-surface-bright rounded-sm overflow-hidden flex flex-col">
        {/* Retro Header Title Bar */}
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex items-center justify-between font-mono text-xs select-none border-b-2 border-on-surface">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[18px]">
              admin_panel_settings
            </span>
            <span className="font-bold tracking-wider text-on-surface uppercase">
              {isEn ? 'BOARDMATES_META_ADMIN_SUITE_V2.0.EXE' : 'BAN_QUAN_TRI_BOARDMATES_SUITE.EXE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
              ● ADMIN: {user.username || 'System Admin'}
            </span>
            <button
              type="button"
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="px-2 py-0.5 text-[10px] font-bold border border-on-surface bg-surface hover:bg-surface-container text-on-surface cursor-pointer"
            >
              {language.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={fetchOverview}
              title="Làm mới dữ liệu"
              className="w-5 h-5 flex items-center justify-center border border-on-surface hover:bg-primary hover:text-white font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">refresh</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="p-2 sm:p-3 bg-surface-container-low border-b border-outline/20 flex items-center gap-1.5 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-primary text-white border-on-surface shadow-xs'
                    : 'bg-surface-bright text-on-surface hover:bg-surface-container border-outline/20'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{isEn ? tab.labelEn : tab.labelVi}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 bg-surface-bright">
          {error && (
            <div className="p-4 mb-4 rounded-sm bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-outline">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
              <p className="mt-2 text-xs font-mono">{isEn ? 'Syncing admin telemetry...' : 'Đang đồng bộ dữ liệu quản trị...'}</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <AnalyticsOverview data={overviewData} language={language} />
              )}
              {activeTab === 'users' && (
                <UsersManager token={user.token} language={language} currentUserId={user.id} />
              )}
              {activeTab === 'events' && (
                <EventsManager token={user.token} language={language} />
              )}
              {activeTab === 'marketplace' && (
                <MarketplaceManager token={user.token} language={language} />
              )}
              {activeTab === 'community' && (
                <CommunityManager token={user.token} language={language} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
