'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const DICE_OUTCOMES = [
  { roll: 1, title: '🎲 Critical Fail (Độ khó 1/20)', desc: 'Thảm họa! Trộm Catan cướp sạch tài nguyên và trang web này đã bốc hơi.', color: 'text-rose-500' },
  { roll: 6, title: '🎲 Lăn vào Ô Mất Lượt', desc: 'Ma Sói đã cắn đứt dây cáp truyền dữ liệu đến URL này trong đêm.', color: 'text-amber-500' },
  { roll: 12, title: '🎲 Rút lá bài Cơ Hội', desc: 'Bạn rút được lá bài "Trở về ô Bắt Đầu" và nhận thêm 200 điểm kinh nghiệm!', color: 'text-blue-500' },
  { roll: 18, title: '🎲 Kích hoạt Cổng Dịch Chuyển', desc: 'Tàu không gian Terraforming Mars đã đưa bạn an toàn đến gần căn cứ.', color: 'text-purple-500' },
  { roll: 20, title: '🎲 Natural 20 (Đại Thành Công!)', desc: 'Chí Mạng! Bạn nhận được bùa phép thần thánh để quay về Trang Chủ ngay lập tức!', color: 'text-emerald-500' },
];

export default function NotFound() {
  const [currentDice, setCurrentDice] = useState(20);
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState(DICE_OUTCOMES[4]);

  const handleRollDice = () => {
    if (isRolling) return;
    setIsRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      const randomVal = Math.floor(Math.random() * 20) + 1;
      setCurrentDice(randomVal);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const outcome = DICE_OUTCOMES[Math.floor(Math.random() * DICE_OUTCOMES.length)];
        setCurrentDice(outcome.roll);
        setDiceResult(outcome);
        setIsRolling(false);
      }
    }, 80);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Retro Grid Background Pattern */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Main Retro Window Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="window-border window-shadow bg-surface-bright w-full max-w-2xl rounded-sm overflow-hidden flex flex-col z-10 my-auto"
      >
        {/* Retro Title Bar */}
        <div className="retro-title-bar bg-surface-container-high px-4 py-2.5 flex items-center justify-between font-mono text-xs select-none border-b-2 border-on-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-[17px] animate-pulse">
              warning
            </span>
            <span className="font-bold tracking-wider text-on-surface uppercase truncate">
              ERROR_404_TILE_NOT_FOUND.EXE
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px] text-outline">
            <span className="w-2.5 h-2.5 bg-amber-500/80 rounded-xs inline-block" />
            <span>DUNGEON_LVL: 404</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 text-center">
          {/* Big Glitch 404 Title */}
          <div className="relative inline-block select-none">
            <span className="font-headline text-7xl sm:text-9xl font-black tracking-tighter text-on-surface/90 drop-shadow-sm font-mono">
              4<span className="text-primary inline-block animate-bounce">0</span>4
            </span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-mono whitespace-nowrap">
              ⚠️ Ô BÀN CỜ NÀY CHƯA ĐƯỢC KHAI PHÁ
            </div>
          </div>

          {/* Subtitle Message */}
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-headline font-bold text-lg sm:text-xl text-on-surface">
              Bạn Đã Đi Lạc Khỏi Vùng Đất BoardMates!
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-sans">
              Đường dẫn này không tồn tại, đã bị Quái Vật Dungeon cắn đứt hoặc Host đã dọn bàn cờ sang địa điểm mới.
            </p>
          </div>

          {/* Interactive D20 Mini-Game Section */}
          <div className="p-4 rounded-sm bg-surface-container border border-outline/20 max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-outline">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">casino</span>
                <span>MINIGAME: TUNG XÚC XẮC D20 CỨU NGUY</span>
              </span>
              <span className="text-primary font-bold">DC: 15</span>
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              {/* Interactive Rolling Dice */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRollDice}
                disabled={isRolling}
                className={`w-16 h-16 rounded-lg border-2 border-on-surface bg-surface-bright window-shadow flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isRolling ? 'animate-spin border-primary text-primary' : 'hover:border-primary'
                }`}
                title="Bấm để tung xúc xắc!"
              >
                <span className="text-2xl font-black font-mono text-primary">
                  {currentDice}
                </span>
                <span className="text-[9px] font-bold text-outline uppercase font-mono">
                  {isRolling ? 'Rolling' : 'D20'}
                </span>
              </motion.button>

              {/* Outcome Box */}
              <div className="text-left flex-1 min-w-0 pl-2">
                <div className={`text-xs font-bold font-mono ${diceResult.color}`}>
                  {diceResult.title}
                </div>
                <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 font-sans leading-relaxed">
                  {diceResult.desc}
                </p>
              </div>
            </div>

            <div className="text-[10px] text-outline font-mono text-center">
              💡 Bấm vào viên xúc xắc D20 để thử vận may tìm đường tắt!
            </div>
          </div>

          {/* Quick Teleport Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-sm border-2 border-on-surface bg-tertiary hover:bg-tertiary-dim text-on-tertiary shadow-xs active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer font-sans uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Về Trang Chủ</span>
            </Link>

            <Link
              href="/events"
              className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-sm border-2 border-on-surface bg-surface hover:bg-surface-container text-on-surface shadow-xs active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">event</span>
              <span>Tìm Kèo Chơi</span>
            </Link>

            <Link
              href="/vault"
              className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-sm border-2 border-on-surface bg-surface hover:bg-surface-container text-on-surface shadow-xs active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <span className="material-symbols-outlined text-[18px] text-purple-500">casino</span>
              <span>Kho Game BGG</span>
            </Link>

            <Link
              href="/marketplace"
              className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-sm border-2 border-on-surface bg-surface hover:bg-surface-container text-on-surface shadow-xs active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-500">storefront</span>
              <span>Sàn Rao Vặt</span>
            </Link>
          </div>
        </div>

        {/* Retro Terminal Footer Status */}
        <div className="bg-surface-container-high px-4 py-2 border-t border-outline/20 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-outline gap-1 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>BOARDMATES ENGINE v2.0 • ALL PLAYERS READY</span>
          </div>
          <div>STATUS: HTTP_404_PAGE_NOT_FOUND</div>
        </div>
      </motion.div>
    </div>
  );
}
