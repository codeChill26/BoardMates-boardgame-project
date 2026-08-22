'use client';

import React, { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/sw-register';
import PWAInstallPrompt from './PWAInstallPrompt';

export default function PWAProvider({ children }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <>
      {children}
      <PWAInstallPrompt />
    </>
  );
}
