'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

// Vi sao co key={pathname} nhung KHONG co AnimatePresence/exit:
//
// - key={pathname} la BAT BUOC. Template nay nam o app/ (goc), con cac trang nam
//   trong nhom (main) tuc segment sau hon. Docs template.md:65 ghi: "Navigations
//   within deeper segments do not remount higher-level templates" -> Next KHONG
//   remount template nay khi chuyen trang. Da do bang MutationObserver: 0 su kien
//   mount/unmount. Bo key di thi initial->animate khong bao gio chay lai = mat hep
//   animation chuyen trang.
//
// - AnimatePresence + exit thi PHAI BO. Next thay children sang trang moi ngay lap
//   tuc, nen exit se fade-out nham NOI DUNG MOI, roi mode="wait" moi mount div moi
//   va fade vao lan nua. Do duoc: trang hien (1.0) -> mat han (0) -> hien lai (1.0),
//   ton ~740ms. Nguoi dung thay nhu trang load 2 lan.
export default function Template({ children }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
