'use client';

import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingNavButtons from '@/components/common/FloatingNavButtons';

function MainLayout({ children }) {
  return (
    <div id="top" className="page">
      <Navbar />
      <main className="pt-20 flex-1 flex flex-col">
        {children}
      </main>
      <FloatingNavButtons />
      <Footer />
    </div>
  );
}

export default MainLayout;
