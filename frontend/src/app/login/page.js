'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuthStore';
import { FacebookIcon, InstagramIcon, TikTokIcon } from '@/components/common/Icons';
import { getBackendUrl } from '@/lib/apiConfig';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const handledRedirectRef = useRef(false);

  // Xử lý login từ Google redirect callback (legacy fallback)
  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    const errorParam = searchParams.get('error');
    const sessionParam = searchParams.get('session');

    if (sessionParam === 'expired' && !error) {
      setError('Phiên đăng nhập của bạn đã hết hạn do không tương tác trong 2 tiếng. Vui lòng đăng nhập lại.');
    }

    if (handledRedirectRef.current) {
      return;
    }

    if (!errorParam && !(token && emailParam)) {
      return;
    }

    handledRedirectRef.current = true;

    if (errorParam) {
      setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
      router.replace('/login');
    } else if (token && emailParam) {
      setUser({ email: emailParam, token: token });
      router.replace('/');
    }
  }, [searchParams, router, setUser, error]);

  // Đăng nhập thường bằng Email/Mật khẩu
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }

      setUser({
        ...(result.data || {}),
        email: result.data?.email ?? email,
        token: result.token,
      });

      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    } catch (loginError) {
      setError(loginError?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng nhập Google qua Firebase Popup SDK
  const handleFirebaseGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Mở popup đăng nhập Google từ Firebase
      const { auth, googleProvider, signInWithPopup } = await import('@/lib/firebase');
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const idToken = await fbUser.getIdToken();

      // 2. Gửi ID Token về Backend để nhận JWT Token
      const targetUrl = `${getBackendUrl()}/api/auth/google`;
      console.log('Sending Google ID Token to backend:', targetUrl);

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          user: {
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            uid: fbUser.uid,
          },
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Lỗi phản hồi từ máy chủ (${res.status}: ${res.statusText})`);
      }

      // 3. Lưu phiên đăng nhập
      setUser({
        id: data.data?.id,
        email: data.data?.email || fbUser.email,
        username: data.data?.username || fbUser.displayName,
        avatarUrl: data.data?.avatarUrl || fbUser.photoURL,
        token: data.token,
        role: data.data?.role || 'USER',
      });

      const redirectUrl = searchParams.get('redirect') || '/';
      router.replace(redirectUrl);
    } catch (err) {
      console.warn('Firebase Google Login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Bạn đã đóng cửa sổ đăng nhập Google.');
      } else if (
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/invalid-api-key' ||
        err.code === 'auth/internal-error'
      ) {
        // Fallback sang Google OAuth redirect nếu Firebase chưa config apiKey
        window.location.href = `${getBackendUrl()}/api/auth/google`;
      } else {
        setError(err.message || 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container relative">
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 pt-16 pb-12 sm:py-12 relative overflow-hidden">
        {/* Nút quay lại homepage */}
        <Link 
          href="/" 
          className="absolute top-4 sm:top-8 left-4 sm:left-8 flex items-center gap-1.5 sm:gap-2 text-on-surface-variant hover:text-primary transition-colors font-label font-bold text-xs sm:text-sm uppercase tracking-wider z-20"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">arrow_back</span>
          <span>Về trang chủ</span>
        </Link>
        
        {/* Ambient Decorative Elements */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-surface-container-low rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="w-full max-w-5xl bg-surface-container-lowest p-5 sm:p-8 md:p-12 rounded-xl shadow-sm border border-outline-variant/10 z-10 flex flex-col md:flex-row gap-8 md:gap-12">
          
          {/* NỬA TRÁI: ĐĂNG NHẬP BÌNH THƯỜNG */}
          <div className="flex-1 border-b md:border-b-0 md:border-r border-outline-variant/20 pb-8 md:pb-0 pr-0 md:pr-12">
            {/* Brand Anchor */}
            <div className="text-center mb-8 sm:mb-10">
              <span className="font-label text-primary text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-2 sm:mb-3 block">
                Chào mừng bạn trở lại
              </span>
              <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface uppercase break-words">
                BoardMates
              </h1>
              <div className="w-12 h-1 bg-primary mx-auto mt-4 sm:mt-6 rounded-full"></div>
            </div>

            {/* Hiển thị lỗi */}
            {error && (
              <div className="mb-6 p-4 bg-error-container/10 border-l-4 border-error text-error text-sm font-body rounded-r-md">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
              {/* Input Group: Email */}
              <div className="group">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1" htmlFor="email">Email</label>
                <input 
                  className="w-full bg-surface-container-high border-b-2 border-transparent border-b-outline-variant py-3 px-1 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-b-primary transition-all duration-300 font-body text-sm" 
                  id="email" 
                  placeholder="example@email.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Input Group: Mật khẩu */}
              <div className="group">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1" htmlFor="password">Mật khẩu</label>
                <div className="relative">
                  <input 
                    className="w-full bg-surface-container-high border-b-2 border-transparent border-b-outline-variant py-3 px-1 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-b-primary transition-all duration-300 font-body text-sm" 
                    id="password" 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span 
                    className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/60 cursor-pointer text-sm select-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs font-label text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Action Button */}
              <button 
                className="w-full bg-tertiary hover:bg-tertiary-fixed-dim disabled:bg-tertiary/50 text-on-tertiary font-label font-bold py-3.5 sm:py-4 rounded-lg shadow-sm transform active:scale-[0.98] transition-all duration-200 tracking-widest text-xs sm:text-sm mt-4 uppercase cursor-pointer"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
              </button>

              {/* Redirect Link */}
              <div className="text-center pt-4 sm:pt-6">
                <span className="font-body text-xs text-on-surface-variant">Chưa có tài khoản? </span>
                <Link href="/register" className="font-label text-xs uppercase tracking-wider text-primary font-bold hover:underline">
                  Tạo tài khoản mới
                </Link>
              </div>
            </form>
          </div>

          {/* NỬA PHẢI: ĐĂNG NHẬP BẰNG GOOGLE (FIREBASE POPUP) */}
          <div className="flex-1 flex flex-col justify-center items-center pt-2 md:pt-0 pl-0 md:pl-12">
            <span className="font-label text-[10px] sm:text-xs uppercase tracking-[0.2em] text-on-surface-variant/70 mb-3 sm:mb-4">Phương thức khác</span>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface mb-6 sm:mb-8 text-center uppercase">
              Đăng nhập bằng Google
            </h2>

            <button 
              className="w-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface font-label font-bold py-3.5 sm:py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transform active:scale-[0.98] transition-all duration-200 uppercase tracking-wider text-xs cursor-pointer disabled:opacity-50"
              type="button"
              disabled={isLoading}
              onClick={handleFirebaseGoogleLogin}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Tiếp tục với Google</span>
            </button>

            <p className="font-body text-[11px] text-on-surface-variant/50 text-center mt-6 sm:mt-8 leading-relaxed max-w-xs">
              Bằng cách tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của BoardMates.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Segment */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant py-6 sm:py-8 px-6 sm:px-12 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
        <div className="text-lg sm:text-xl font-headline italic font-bold text-on-surface uppercase">BoardMates</div>
        <div className="text-xs font-body text-on-surface-variant tracking-normal text-center">
          © 2026 BoardMates. Tất cả quyền được bảo lưu.
        </div>
        <div className="flex gap-6 items-center">
          <a
            className="text-on-surface-variant hover:text-primary transition-opacity p-1"
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
          <a className="text-on-surface-variant hover:text-primary transition-opacity p-1" href="#" aria-label="Instagram">
            <span className="sr-only">Instagram</span>
            <div className="h-5 w-5">
              <InstagramIcon />
            </div>
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-opacity p-1" href="#" aria-label="TikTok">
            <span className="sr-only">TikTok</span>
            <div className="h-5 w-5">
              <TikTokIcon />
            </div>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center font-label text-sm uppercase tracking-widest text-on-surface-variant">Đang tải...</div>}>
      <LoginContent />
    </React.Suspense>
  );
}
