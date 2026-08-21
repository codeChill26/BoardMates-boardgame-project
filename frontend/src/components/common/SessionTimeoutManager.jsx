'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore, SESSION_INACTIVITY_LIMIT } from '@/hooks/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';

export default function SessionTimeoutManager() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const lastActivity = useAuthStore((state) => state.lastActivity);
  const updateActivity = useAuthStore((state) => state.updateActivity);
  const logout = useAuthStore((state) => state.logout);

  const [showExpiredToast, setShowExpiredToast] = useState(false);
  const lastUpdateRef = useRef(0);

  // Xử lý tự động đăng xuất khi hết hạn 2 tiếng
  const handleSessionExpired = useCallback(() => {
    if (!user) return;
    
    logout();
    setShowExpiredToast(true);

    // Tự động ẩn thông báo sau 6 giây
    setTimeout(() => {
      setShowExpiredToast(false);
    }, 6000);

    // Nếu đang ở trang yêu cầu xác thực như /vault, chuyển hướng về login
    if (pathname && (pathname.startsWith('/vault') || pathname.startsWith('/profile') || pathname.startsWith('/admin'))) {
      router.push('/login?session=expired');
    }
  }, [user, logout, pathname, router]);

  // Kiểm tra thời gian không hoạt động
  const checkInactivity = useCallback(() => {
    if (!user || !user.token) return;

    const storedLastActivity = lastActivity || lastUpdateRef.current;
    const now = Date.now();
    const elapsed = now - storedLastActivity;

    if (elapsed >= SESSION_INACTIVITY_LIMIT) {
      handleSessionExpired();
    }
  }, [user, lastActivity, handleSessionExpired]);

  // Lắng nghe các tương tác của người dùng trên trang (mousemove, click, gõ phím, cuộn...)
  useEffect(() => {
    if (!user || !user.token) return;

    // Khởi tạo timestamp nếu chưa có
    if (!lastUpdateRef.current) {
      lastUpdateRef.current = Date.now();
    }

    // Kiểm tra sau khi mount
    const timer = setTimeout(() => {
      checkInactivity();
    }, 100);

    // Throttled handler: chỉ cập nhật activity tối đa 1 lần mỗi 15 giây để tối ưu hiệu năng
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current > 15000) {
        lastUpdateRef.current = now;
        updateActivity();
      }
    };

    // Khi người dùng quay lại tab trình duyệt (sau khi để máy chờ hoặc chuyển tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    // Khi cửa sổ trình duyệt được focus
    const handleWindowFocus = () => {
      checkInactivity();
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // Kiểm tra định kỳ mỗi 30 giây
    const intervalId = setInterval(() => {
      checkInactivity();
    }, 30000);

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(intervalId);
    };
  }, [user, checkInactivity, updateActivity]);

  if (!showExpiredToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-9999 max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-surface-container-lowest border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
          <span className="material-symbols-outlined text-2xl">timer_off</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-headline text-sm font-bold text-on-surface">
            Phiên đăng nhập đã hết hạn
          </h4>
          <p className="font-body text-xs text-on-surface-variant mt-1 leading-relaxed">
            Bạn đã không tương tác với trang web trong 2 tiếng. Hệ thống đã tự động đăng xuất để bảo mật tài khoản.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => {
                setShowExpiredToast(false);
                router.push('/login');
              }}
              className="font-label text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Đăng nhập lại →
            </button>
            <span className="text-on-surface-variant/40">•</span>
            <button
              onClick={() => setShowExpiredToast(false)}
              className="font-label text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowExpiredToast(false)}
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
