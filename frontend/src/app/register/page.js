'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FacebookIcon, InstagramIcon, TikTokIcon } from '@/components/common/Icons';

export default function RegisterPage() {
  const router = useRouter();
  
  // State quản lý form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Giả lập thời gian đăng ký
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg('Đăng ký giả lập thành công! Đang chuyển hướng...');
      setTimeout(() => router.push('/login'), 1000);
    }, 1000);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container relative">
      <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Ambient Decorative Elements */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-surface-container-low rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="w-full max-w-lg bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-sm border border-outline-variant/10 z-10">
          {/* Brand Anchor */}
          <div className="text-center mb-10">
            <span className="font-label text-primary text-xs uppercase tracking-[0.2em] mb-3 block">Bắt đầu hành trình của bạn</span>
            <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-on-surface uppercase">BoardMates</h1>
            <div className="w-12 h-1 bg-primary mx-auto mt-6 rounded-full"></div>
          </div>

          {/* Hiển thị lỗi/thành công */}
          {error && (
            <div className="mb-6 p-4 bg-error-container/10 border-l-4 border-error text-error text-sm font-body rounded-r-md">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-secondary-container/10 border-l-4 border-secondary text-secondary text-sm font-body rounded-r-md">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Input Group: Họ và tên */}
            <div className="group">
              <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1" htmlFor="fullName">Họ và tên</label>
              <input 
                className="w-full bg-surface-container-high border-b-2 border-transparent border-b-outline-variant py-3 px-1 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-b-primary transition-all duration-300 font-body" 
                id="fullName" 
                placeholder="Nguyễn Văn A" 
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Input Group: Email */}
            <div className="group">
              <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1" htmlFor="email">Email</label>
              <input 
                className="w-full bg-surface-container-high border-b-2 border-transparent border-b-outline-variant py-3 px-1 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-b-primary transition-all duration-300 font-body" 
                id="email" 
                placeholder="example@email.com" 
                type="email"
                value={formData.email}
                onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
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

            {/* Input Group: Nhập lại mật khẩu */}
            <div className="group">
              <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1" htmlFor="confirmPassword">Nhập lại mật khẩu</label>
              <input 
                className="w-full bg-surface-container-high border-b-2 border-transparent border-b-outline-variant py-3 px-1 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-b-primary transition-all duration-300 font-body" 
                id="confirmPassword" 
                placeholder="••••••••" 
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {/* Checkbox Section */}
            <div className="flex items-start gap-3 pt-2">
              <div className="flex items-center h-5">
                <input 
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-background cursor-pointer" 
                  id="terms" 
                  type="checkbox" 
                  required
                />
              </div>
              <label className="text-sm text-on-surface-variant font-body leading-tight" htmlFor="terms">
                Tôi đồng ý với <a className="text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all font-bold" href="#">điều khoản</a> và chính sách bảo mật của BoardMates.
              </label>
            </div>

            {/* Action Button */}
            <button 
              className="w-full bg-primary hover:bg-primary-dim disabled:bg-primary/50 text-on-primary font-label font-bold py-4 rounded-lg shadow-sm transform active:scale-[0.98] transition-all duration-200 tracking-widest text-sm mt-4 uppercase" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : 'ĐĂNG KÝ'}
            </button>

            {/* Redirect Link */}
            <div className="text-center pt-6">
              <p className="text-sm text-on-surface-variant font-body">
                Đã có tài khoản? 
                <Link href="/login" className="font-label font-bold text-primary hover:text-primary-dim transition-colors ml-1 uppercase text-xs tracking-wider">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Footer Segment */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant py-8 px-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-xl font-headline italic font-bold text-on-surface uppercase">BoardMates</div>
        <div className="text-xs font-body text-on-surface-variant tracking-normal">
          © 2026 BoardMates. Tất cả quyền được bảo lưu.
        </div>
        <div className="flex gap-6 items-center">
          <a className="text-on-surface-variant hover:text-primary transition-opacity" href="#" aria-label="Facebook">
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
