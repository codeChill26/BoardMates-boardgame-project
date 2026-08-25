'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingNavButtons from '@/components/common/FloatingNavButtons';
import NavbarTour from '@/components/common/NavbarTour';
import YouthBadge from '@/components/common/YouthBadge';

function MainLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const adminSecretSlug = process.env.NEXT_PUBLIC_ADMIN_SECRET_SLUG || 'bm-control-8x92k';
  const isAdminRoute = pathname?.includes(adminSecretSlug);

  // KHI ĐĂNG NHẬP ADMIN: Khóa chặt vào Dashboard, tự động chuyển hướng và chặn vào các trang khác
  React.useEffect(() => {
    if (user?.role === 'ADMIN' && !isAdminRoute && pathname !== '/login' && pathname !== '/register') {
      router.replace(`/${adminSecretSlug}`);
    }
  }, [user?.role, isAdminRoute, pathname, router, adminSecretSlug]);

  // Nếu đang ở giao diện Admin Suite, render toàn màn hình không kèm Navbar/Footer người dùng
  if (isAdminRoute) {
    return <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#1A222C]">{children}</div>;
  }

  return (
    <div id="top" className="page">
      <Navbar />
      <main className="pt-20 flex-1 flex flex-col">
        {children}
      </main>
      <FloatingNavButtons />
      <YouthBadge />
      <Footer />
      <NavbarTour />
    </div>
  );
}

export default MainLayout;
