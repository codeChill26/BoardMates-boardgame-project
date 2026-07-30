'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuthStore';
import { FacebookIcon, InstagramIcon, TikTokIcon } from '@/components/common/Icons';
import { getBackendUrl } from '@/lib/apiConfig';

// Tạo component Client chứa logic gọi searchParams để bọc trong Suspense (Next.js yêu cầu)
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

  // Xử lý login từ Google redirect
  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    const errorParam = searchParams.get('error');

    if (handledRedirectRef.current) {
      return;
    }

    if (!errorParam && !(token && emailParam)) {
      return;
    }

    handledRedirectRef.current = true;

    if (errorParam) {
      setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
      // Xoá param error khỏi url
      router.replace('/login');
    } else if (token && emailParam) {
      // Đăng nhập thành công từ Google
      setUser({ email: emailParam, token: token });
      
      // Xoá param khỏi URL và chuyển hướng về trang chủ
      router.replace('/');
    }
  }, [searchParams, router, setUser]);

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

      router.push('/');
    } catch (loginError) {
      setError(loginError?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container relative">
      <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Nút quay lại homepage */}
        <Link 
          href="/" 
          className="absolute top-8 left-8 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label font-bold text-sm uppercase tracking-wider z-20"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Về trang chủ
        </Link>
        
        {/* Ambient Decorative Elements */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-surface-container-low rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="w-full max-w-5xl bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-sm border border-outline-variant/10 z-10 flex flex-col md:flex-row gap-12">
          
          {/* NỬA TRÁI: ĐĂNG NHẬP BÌNH THƯỜNG */}
          <div className="flex-1 border-r border-outline-variant/20 pr-0 md:pr-12">
            {/* Brand Anchor */}
            <div className="text-center mb-10">
              <span className="font-label text-primary text-xs uppercase tracking-[0.2em] mb-3 block">Chào mừng bạn trở lại</span>
              <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-on-surface uppercase">BoardMates</h1>
              <div className="w-12 h-1 bg-primary mx-auto mt-6 rounded-full"></div>
            </div>

            {/* Hiển thị lỗi */}
            {error && (
              <div className="mb-6 p-4 bg-error-container/10 border-l-4 border-error text-error text-sm font-body rounded-r-md">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Input Group: Email */}
              <div className="group">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1" htmlFor="email">Email</label>
                <input 
                  className="w-full bg-surface-container-high border-b-2 border-transparent border-b-outline-variant py-3 px-1 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-b-primary transition-all duration-300 font-body" 
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
                    className="w-full bg-surface-container-high border-b-2 border-transparent border-b-outline-variant py-3 px-1 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-b-primary transition-all duration-300 font-body" 
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

              {/* Forgot Password Link (Tùy chọn) */}
              <div className="text-right">
                <a href="#" className="text-xs font-label text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">
                  Quên mật khẩu?
                </a>
              </div>

              {/* Action Button */}
              <button 
                className="w-full bg-tertiary hover:bg-tertiary-fixed-dim disabled:bg-tertiary/50 text-on-tertiary font-label font-bold py-4 rounded-lg shadow-sm transform active:scale-[0.98] transition-all duration-200 tracking-widest text-sm mt-4 uppercase"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
              </button>

              {/* Redirect Link */}
              <div className="text-center pt-6">
                <p className="text-sm text-on-surface-variant font-body">
                  Chưa có tài khoản? 
                  <Link href="/register" className="font-label font-bold text-primary hover:text-primary-dim transition-colors ml-1 uppercase text-xs tracking-wider">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* NỬA PHẢI: ĐĂNG NHẬP BẰNG GOOGLE */}
          <div className="flex-1 flex flex-col justify-center items-center pl-0 md:pl-12 mt-10 md:mt-0">
            <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface mb-8 uppercase text-center w-full">Đăng nhập nhanh</h2>
            <div className="w-full">
              <button 
                className="w-full flex items-center justify-center gap-3 bg-surface border border-outline-variant py-4 px-6 rounded-lg hover:bg-surface-variant/50 transition-colors shadow-sm font-label font-bold text-on-surface uppercase tracking-wider text-sm"
                type="button"
                onClick={() => {
                  window.location.href = `${getBackendUrl()}/api/auth/google`;
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Tiếp tục với Google
              </button>
            </div>
            <p className="mt-6 text-xs text-on-surface-variant/60 font-body text-center max-w-sm">
              Bằng cách tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Segment */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant py-8 px-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-xl font-headline italic font-bold text-on-surface uppercase">BoardMates</div>
        <div className="text-xs font-body text-on-surface-variant tracking-normal">
          © 2026 BoardMates. Tất cả quyền được bảo lưu.
        </div>
        <div className="flex gap-6 items-center">
          <a
            className="text-on-surface-variant hover:text-primary transition-opacity"
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
          <a className="text-on-surface-variant hover:text-primary transition-opacity" href="#" aria-label="Instagram">
            <span className="sr-only">Instagram</span>
            <div className="h-5 w-5">
              <InstagramIcon />
            </div>
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-opacity" href="#" aria-label="TikTok">
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
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <LoginContent />
    </React.Suspense>
  );
}
