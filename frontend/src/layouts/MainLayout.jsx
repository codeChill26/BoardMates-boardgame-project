'use client';

import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingNavButtons from '@/components/common/FloatingNavButtons';
import NavbarTour from '@/components/common/NavbarTour';
import YouthBadge from '@/components/common/YouthBadge';

function MainLayout({ children }) {
  return (
    <div id="top" className="page">
      <Navbar />
      <main className="pt-20 flex-1 flex flex-col">
        {children}
      </main>
      <FloatingNavButtons />
      {/* Tu an o /about — trang do da co the youth_plus.exe rieng. */}
      <YouthBadge />
      <Footer />
      {/* Tu no khoa lai o trang chu + chi hien cho khach lan dau. */}
      <NavbarTour />
    </div>
  );
}

export default MainLayout;
