'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import { toJpeg, toPng } from 'html-to-image';

const STATUS_MAP = {
  ON_SHELF: {
    label: 'Đang trên kệ',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  LENT_OUT: {
    label: 'Đang cho mượn',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  FOR_SALE: {
    label: 'Muốn bán / thuê',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  WISHLIST: {
    label: 'Muốn sưu tầm',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
};

// Fallback placeholder data URL cho ảnh lỗi hoặc bị chặn CORS
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="%23d97706"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>';

export default function ExportPdfModal({
  isOpen,
  onClose,
  allGames = [],
  user = {},
  stats = {},
  initialSortBy = 'updatedAt',
  initialSortOrder = 'desc',
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [filterBggScore, setFilterBggScore] = useState('ALL');
  const [pdfSortBy, setPdfSortBy] = useState(initialSortBy);
  const [pdfSortOrder, setPdfSortOrder] = useState(initialSortOrder);
  const [layoutStyle, setLayoutStyle] = useState('magazine'); // 'magazine' | 'table'
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeRatings, setIncludeRatings] = useState(true);
  const [includeBorrower, setIncludeBorrower] = useState(true);
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [includeImages, setIncludeImages] = useState(false);
  const [contactInfo, setContactInfo] = useState('');
  const [customCatalogTitle, setCustomCatalogTitle] = useState('');
  const [customQrUrl, setCustomQrUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Đồng bộ tiêu chí sort từ trang kho game khi mở modal
  useEffect(() => {
    if (isOpen) {
      setPdfSortBy(initialSortBy || 'updatedAt');
      setPdfSortOrder(initialSortOrder || 'desc');
    }
  }, [isOpen, initialSortBy, initialSortOrder]);

  const printAreaRef = useRef(null);

  // Lọc game theo trạng thái, độ khó và điểm BGG người dùng chọn xuất
  const filteredGames = useMemo(() => {
    if (!allGames || allGames.length === 0) return [];
    let list = allGames;

    if (filterStatus !== 'ALL') {
      list = list.filter((item) => item.status === filterStatus);
    }

    if (filterDifficulty !== 'ALL') {
      list = list.filter((item) => {
        const w = item.game?.weight;
        if (!w) return false;
        if (filterDifficulty === 'LIGHT') return w < 2.0;
        if (filterDifficulty === 'MEDIUM') return w >= 2.0 && w < 3.0;
        if (filterDifficulty === 'MEDIUM_HEAVY') return w >= 3.0 && w < 4.0;
        if (filterDifficulty === 'HEAVY') return w >= 4.0;
        return true;
      });
    }

    if (filterBggScore !== 'ALL') {
      list = list.filter((item) => {
        const r = item.game?.bggRating;
        if (!r) return false;
        if (filterBggScore === '8_PLUS') return r >= 8.0;
        if (filterBggScore === '7_8') return r >= 7.0 && r < 8.0;
        if (filterBggScore === '6_7') return r >= 6.0 && r < 7.0;
        if (filterBggScore === 'UNDER_6') return r < 6.0;
        return true;
      });
    }

    // Sắp xếp danh mục xuất theo đúng lựa chọn
    const sortedList = [...list];
    sortedList.sort((a, b) => {
      const gameA = a.game || {};
      const gameB = b.game || {};
      let comparison = 0;

      if (pdfSortBy === 'name') {
        comparison = (gameA.name || '').localeCompare(gameB.name || '', 'vi');
      } else if (pdfSortBy === 'weight') {
        const wA = gameA.weight ?? (pdfSortOrder === 'asc' ? 999 : -999);
        const wB = gameB.weight ?? (pdfSortOrder === 'asc' ? 999 : -999);
        comparison = wA - wB;
      } else if (pdfSortBy === 'bggRating') {
        const rA = gameA.bggRating ?? (pdfSortOrder === 'asc' ? 999 : -999);
        const rB = gameB.bggRating ?? (pdfSortOrder === 'asc' ? 999 : -999);
        comparison = rA - rB;
      } else if (pdfSortBy === 'bggRank') {
        const rkA = gameA.bggRank ?? 999999;
        const rkB = gameB.bggRank ?? 999999;
        comparison = rkA - rkB;
      } else if (pdfSortBy === 'rating') {
        comparison = (a.personalRating || 0) - (b.personalRating || 0);
      } else if (pdfSortBy === 'createdAt') {
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      } else {
        // updatedAt
        comparison = new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
      }

      return pdfSortOrder === 'asc' ? comparison : -comparison;
    });

    return sortedList;
  }, [allGames, filterStatus, filterDifficulty, filterBggScore, pdfSortBy, pdfSortOrder]);

  // Thống kê nhanh cho bộ sưu tập được xuất
  const exportStats = useMemo(() => {
    const total = filteredGames.length;
    const onShelf = filteredGames.filter((g) => g.status === 'ON_SHELF').length;
    const forSale = filteredGames.filter((g) => g.status === 'FOR_SALE').length;
    const lentOut = filteredGames.filter((g) => g.status === 'LENT_OUT').length;
    const wishlist = filteredGames.filter((g) => g.status === 'WISHLIST').length;
    return { total, onShelf, forSale, lentOut, wishlist };
  }, [filteredGames]);

  // QR Code Value
  const qrValue = useMemo(() => {
    if (customQrUrl && customQrUrl.trim()) {
      return customQrUrl.trim();
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/vault?user=${encodeURIComponent(user?.username || 'member')}`;
    }
    return 'https://boardmates.vn';
  }, [user, customQrUrl]);

  // Tên file xuất PDF
  const pdfFilename = useMemo(() => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const username = (user?.username || 'user').replace(/\s+/g, '_');
    return `BoardMates_Vault_${username}_${dateStr}.pdf`;
  }, [user]);

  // Hàm tạo PDF trực tiếp qua jsPDF (Phương án dự phòng 100% không thể lỗi)
  const generateDirectPdfFallback = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;

      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(168, 91, 0); // Primary Amber
      pdf.text(customCatalogTitle || `DANH MUC KHO GAME - ${user?.username?.toUpperCase() || 'MEMBER'}`, 15, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')} | Tong so: ${filteredGames.length} game`, 15, y);
      if (contactInfo) {
        y += 6;
        pdf.text(`Lien he: ${contactInfo}`, 15, y);
      }
      y += 10;

      // Đường kẻ
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, y, pageWidth - 15, y);
      y += 8;

      // Danh sách game
      filteredGames.forEach((item, index) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }

        const game = item.game || {};
        const st = STATUS_MAP[item.status]?.label || 'On Shelf';

        pdf.setFontSize(11);
        pdf.setTextColor(20, 20, 20);
        pdf.text(`${index + 1}. ${game.name || 'Unnamed Game'}`, 15, y);

        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`[${st}] - ${item.condition || 'Good'} | ${game.minPlayers || 2}-${game.maxPlayers || 4} nguoi | ${game.playTime || 45}p`, 15, y + 5);

        if (includeNotes && item.personalNotes) {
          pdf.setTextColor(140, 90, 20);
          pdf.text(`Ghi chu: "${item.personalNotes}"`, 15, y + 9);
          y += 14;
        } else {
          y += 10;
        }
      });

      pdf.save(pdfFilename);
      setProgressMsg('');
      setIsGenerating(false);
    } catch (e) {
      console.error('Fallback PDF error:', e);
      alert('Không thể tạo file PDF. Vui lòng sử dụng tính năng "In Ngay" để lưu PDF qua trình duyệt.');
      setIsGenerating(false);
    }
  };

  // Hàm xuất PDF chất lượng cao chính
  const handleExportPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGenerating(true);
    setErrorMsg('');
    setProgressMsg('Đang chuẩn bị trang in chất lượng cao...');

    try {
      const element = printAreaRef.current;

      // Đợi render hoàn tất
      await new Promise((r) => setTimeout(r, 200));

      setProgressMsg('Đang tạo ảnh tài liệu A4...');

      // Sử dụng html-to-image (Render qua browser SVG foreignObject, tương thích 100% Tailwind v4)
      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2, // Đảm bảo độ nét cao khi in ấn
        cacheBust: true,
        filter: (node) => {
          // Bỏ qua các phần tử lỗi nếu có
          return true;
        },
      });

      setProgressMsg('Đang phân trang A4 và đóng gói PDF...');

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const imgWidth = pdfWidth;
      const imgHeight = (img.height * pdfWidth) / img.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Trang 1
      pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Các trang sau nếu dài
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(pdfFilename);
      setProgressMsg('');
    } catch (err) {
      console.warn('html-to-image render gặp trục trặc, tự động chuyển sang chế độ xuất trực tiếp:', err);
      setProgressMsg('Đang xuất sang bản PDF trực tiếp...');
      generateDirectPdfFallback();
    } finally {
      setIsGenerating(false);
    }
  };

  // In trực tiếp bằng trình duyệt (Native Browser Print to PDF)
  const handlePrint = () => {
    if (!printAreaRef.current) return;
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border-2 border-primary/30 w-full max-w-6xl max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-on-surface">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-label font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                  EXPORT CATALOG
                </span>
                <span className="text-xs text-on-surface-variant font-mono">PDF_A4_v1.0</span>
              </div>
              <h2 className="font-headline text-lg sm:text-xl font-bold uppercase tracking-tight text-on-surface">
                Xem Trước & Xuất Catalog Kho Game (PDF)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            className="w-9 h-9 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* MODAL BODY (2 CỘT: CỘT TRÁI ĐIỀU KHIỂN - CỘT PHẢI LIVE PREVIEW) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* CỘT ĐIỀU KHIỂN (SETTINGS PANEL) */}
          <div className="lg:col-span-4 p-5 bg-surface-container-low border-r border-outline-variant/30 overflow-y-auto space-y-5 text-sm">
            {/* 1. Lọc Trạng Thái & Độ Khó */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-label uppercase tracking-wider font-bold text-on-surface-variant mb-2">
                  1. Trạng thái ({filteredGames.length} game)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'ALL', label: 'Tất cả trạng thái', icon: 'all_inclusive' },
                    { id: 'ON_SHELF', label: 'Đang trên kệ', icon: 'shelves' },
                    { id: 'FOR_SALE', label: 'Muốn bán / thuê', icon: 'sell' },
                    { id: 'LENT_OUT', label: 'Đang cho mượn', icon: 'handshake' },
                    { id: 'WISHLIST', label: 'Wishlist', icon: 'favorite' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFilterStatus(st.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-label font-bold transition-all text-left cursor-pointer ${
                        filterStatus === st.id
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{st.icon}</span>
                      <span className="truncate">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lọc Độ Khó BGG */}
              <div>
                <label className="block text-xs font-label uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">
                  Lọc theo Độ khó (Weight)
                </label>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-body text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="ALL">Tất cả mức độ khó</option>
                  <option value="LIGHT">🟢 Nhập môn (&lt; 2.0)</option>
                  <option value="MEDIUM">🟡 Vừa phải (2.0 - 3.0)</option>
                  <option value="MEDIUM_HEAVY">🟠 Chiến thuật (3.0 - 4.0)</option>
                  <option value="HEAVY">🔴 Chuyên gia (≥ 4.0)</option>
                </select>
              </div>

              {/* Lọc Điểm BGG Score */}
              <div>
                <label className="block text-xs font-label uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">
                  Lọc theo Điểm BGG (Rating)
                </label>
                <select
                  value={filterBggScore}
                  onChange={(e) => setFilterBggScore(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-body text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="ALL">Tất cả điểm BGG</option>
                  <option value="8_PLUS">⭐ Xuất sắc (≥ 8.0/10)</option>
                  <option value="7_8">⭐ Tốt (7.0 - 8.0/10)</option>
                  <option value="6_7">⭐ Khá (6.0 - 7.0/10)</option>
                  <option value="UNDER_6">⭐ Dưới 6.0/10</option>
                </select>
              </div>

              {/* Sắp xếp thứ tự danh mục trong PDF */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-label uppercase tracking-wider font-bold text-on-surface-variant">
                    Sắp xếp thứ tự xuất
                  </label>
                  <button
                    type="button"
                    onClick={() => setPdfSortOrder(pdfSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                    title="Đảo chiều thứ tự xuất PDF"
                  >
                    <span className="material-symbols-outlined text-xs">swap_vert</span>
                    <span>{pdfSortOrder === 'asc' ? 'Tăng dần (▲)' : 'Giảm dần (▼)'}</span>
                  </button>
                </div>
                <select
                  value={pdfSortBy}
                  onChange={(e) => setPdfSortBy(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-body text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="bggRating">⭐ Điểm BGG Score</option>
                  <option value="weight">⚡ Độ khó BGG (Weight)</option>
                  <option value="bggRank">🏆 Thứ hạng BGG (Rank #1...)</option>
                  <option value="name">🔤 Tên game (A - Z)</option>
                  <option value="updatedAt">🕒 Mới cập nhật</option>
                  <option value="createdAt">🆕 Mới thêm</option>
                  <option value="rating">💖 Đánh giá sở thích</option>
                </select>
              </div>
            </div>

            {/* 2. Bố Cục Trang In */}
            <div>
              <label className="block text-xs font-label uppercase tracking-wider font-bold text-on-surface-variant mb-2">
                2. Phong cách bố cục (Layout)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLayoutStyle('magazine')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    layoutStyle === 'magazine'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">auto_stories</span>
                  <span className="text-xs font-label uppercase">Tạp chí 2 cột</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutStyle('table')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    layoutStyle === 'table'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">table_chart</span>
                  <span className="text-xs font-label uppercase">Bảng danh mục</span>
                </button>
              </div>
            </div>

            {/* 3. Tùy Chọn Chi Tiết */}
            <div>
              <label className="block text-xs font-label uppercase tracking-wider font-bold text-on-surface-variant mb-2">
                3. Tùy chọn thông tin hiển thị
              </label>
              <div className="space-y-2 bg-surface-container p-3 rounded-xl border border-outline-variant/20">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-body">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline"
                  />
                  <span>Hiển thị ảnh bìa BoardGame</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-body">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline"
                  />
                  <span>Hiển thị ghi chú cá nhân (Notes)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-body">
                  <input
                    type="checkbox"
                    checked={includeRatings}
                    onChange={(e) => setIncludeRatings(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline"
                  />
                  <span>Hiển thị đánh giá sao cá nhân (Rating)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-body">
                  <input
                    type="checkbox"
                    checked={includeBorrower}
                    onChange={(e) => setIncludeBorrower(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline"
                  />
                  <span>Hiển thị thông tin người mượn (nếu có)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-body">
                  <input
                    type="checkbox"
                    checked={includeQrCode}
                    onChange={(e) => setIncludeQrCode(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline"
                  />
                  <span>Nhúng mã QR Code liên hệ / kho game</span>
                </label>
              </div>
            </div>

            {/* 4. Thông Tin Liên Hệ / Ghi Chú Trang Bìa */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-label uppercase tracking-wider font-bold text-on-surface-variant mb-1">
                  Tiêu đề bộ sưu tập (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder={`Kho Game Của ${user?.username || 'Tôi'}`}
                  value={customCatalogTitle}
                  onChange={(e) => setCustomCatalogTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container border border-outline-variant/40 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-label uppercase tracking-wider font-bold text-on-surface-variant mb-1">
                  Thông tin liên hệ / Ghi chú trang bìa
                </label>
                <input
                  type="text"
                  placeholder="VD: SĐT: 0912.345.678 - Giao lưu boardgame tại Hà Nội"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container border border-outline-variant/40 focus:border-primary focus:outline-none"
                />
              </div>

              {includeQrCode && (
                <div>
                  <label className="block text-xs font-label uppercase tracking-wider font-bold text-on-surface-variant mb-1">
                    Đường link mã QR (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Mặc định: Link kho game hoặc nhập link Facebook/Zalo của bạn"
                    value={customQrUrl}
                    onChange={(e) => setCustomQrUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container border border-outline-variant/40 focus:border-primary focus:outline-none"
                  />
                  <span className="text-[10px] text-on-surface-variant/70 mt-0.5 block">
                    Đang nhúng: <code className="text-primary font-mono">{qrValue}</code>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: KHUNG XEM TRƯỚC BẢN IN A4 (LIVE PREVIEW CONTAINER) */}
          <div className="lg:col-span-8 p-4 sm:p-6 bg-neutral-900/40 overflow-y-auto flex flex-col items-center">
            {/* THANH THÔNG TIN PREVIEW NHỎ */}
            <div className="w-full max-w-[800px] flex items-center justify-between mb-3 text-xs text-on-surface-variant px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Khung xem trước A4 (Tỷ lệ thực tế khi in)</span>
              </span>
              <span>Khổ chuẩn: 210mm x 297mm</span>
            </div>

            {/* TRANG IN CHÍNH XÁC (PRINT TARGET ELEMENT) */}
            <div
              ref={printAreaRef}
              id="printable-vault-catalog"
              className="w-full max-w-[800px] bg-white text-neutral-900 shadow-2xl p-8 sm:p-10 rounded-sm font-sans"
              style={{
                minHeight: '1120px',
                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              {/* HEADER BANNER SANG TRỌNG */}
              <div className="border-b-4 border-amber-800 pb-5 mb-6 flex flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 bg-amber-800 text-white font-mono text-[10px] font-bold tracking-widest uppercase rounded-xs">
                      BOARDMATES VAULT
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500 uppercase">
                      CATALOGUE • {new Date().toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight uppercase leading-tight font-serif">
                    {customCatalogTitle.trim() || `BỘ SƯU TẬP BOARDGAME — ${user?.username || 'MEMBER'}`}
                  </h1>

                  <p className="text-xs text-neutral-600 mt-1 max-w-xl">
                    Danh mục các tựa game được quản lý trên nền tảng BoardMates.
                    {contactInfo.trim() && (
                      <span className="block mt-1 font-semibold text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200">
                        📞 {contactInfo.trim()}
                      </span>
                    )}
                  </p>
                </div>

                {/* QR CODE BANNER */}
                {includeQrCode && (
                  <div className="shrink-0 flex flex-col items-center p-2 bg-neutral-50 border border-neutral-200 rounded text-center">
                    <QRCodeSVG value={qrValue} size={68} level="M" />
                    <span className="text-[8px] font-mono font-bold text-neutral-500 mt-1 uppercase tracking-tighter">
                      QUÉT XEM KHO GAME
                    </span>
                  </div>
                )}
              </div>

              {/* STATS STRIP TRANG BÌA */}
              <div className="grid grid-cols-4 gap-2.5 bg-neutral-100 p-3 rounded-lg border border-neutral-200 mb-6 text-center">
                <div className="p-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Tổng số game
                  </span>
                  <span className="text-lg font-extrabold text-neutral-900">{exportStats.total}</span>
                </div>

                <div className="p-1 border-l border-neutral-200">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Đang trên kệ
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700">{exportStats.onShelf}</span>
                </div>

                <div className="p-1 border-l border-neutral-200">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    Muốn bán / thuê
                  </span>
                  <span className="text-lg font-extrabold text-blue-700">{exportStats.forSale}</span>
                </div>

                <div className="p-1 border-l border-neutral-200">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Đang cho mượn
                  </span>
                  <span className="text-lg font-extrabold text-amber-700">{exportStats.lentOut}</span>
                </div>
              </div>

              {/* EMPTY STATE IF NO GAMES */}
              {filteredGames.length === 0 && (
                <div className="py-16 text-center border-2 border-dashed border-neutral-300 rounded-xl my-6">
                  <span className="material-symbols-outlined text-4xl text-neutral-400">shelves</span>
                  <p className="text-sm font-semibold text-neutral-600 mt-2">
                    Không có boardgame nào thuộc bộ lọc này.
                  </p>
                </div>
              )}

              {/* DANH SÁCH GAME: LAYOUT TẠP CHÍ (MAGAZINE GRID) */}
              {layoutStyle === 'magazine' && filteredGames.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredGames.map((item, index) => {
                    const game = item.game || {};
                    const st = STATUS_MAP[item.status] || STATUS_MAP.ON_SHELF;

                    return (
                      <div
                        key={item.id || index}
                        className="flex flex-col bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-xs"
                      >
                        <div className="p-3 flex gap-3">
                          {/* ẢNH BÌA GAME HOẶC HUY HIỆU SỐ THỨ TỰ */}
                          {includeImages ? (
                            <div className="w-20 h-20 shrink-0 bg-neutral-100 rounded border border-neutral-200 overflow-hidden relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={game.imageUrl || FALLBACK_IMAGE}
                                alt={game.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = FALLBACK_IMAGE;
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              className="w-10 h-10 shrink-0 rounded-lg flex flex-col items-center justify-center font-mono font-bold text-xs"
                              style={{
                                backgroundColor: st.bg,
                                color: st.color,
                                border: `1px solid ${st.border}`,
                              }}
                            >
                              <span className="text-[10px] uppercase tracking-tighter">#{String(index + 1).padStart(2, '0')}</span>
                            </div>
                          )}

                          {/* THÔNG TIN GAME */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1 mb-0.5">
                              <h3 className="font-bold text-sm text-neutral-900 truncate leading-snug font-serif">
                                {index + 1}. {game.name}
                              </h3>
                            </div>

                            {/* BADGE TRẠNG THÁI & CONDITION */}
                            <div className="flex flex-wrap items-center gap-1 mb-1.5">
                              <span
                                className="px-1.5 py-0.2 text-[9px] font-bold rounded uppercase tracking-tighter"
                                style={{
                                  backgroundColor: st.bg,
                                  color: st.color,
                                  border: `1px solid ${st.border}`,
                                }}
                              >
                                {st.label}
                              </span>

                              {item.condition && (
                                <span className="px-1.5 py-0.2 bg-neutral-100 text-neutral-700 text-[9px] font-medium rounded border border-neutral-200">
                                  {item.condition}
                                </span>
                              )}
                            </div>

                            {/* THÔNG SỐ: SỐ NGƯỜI / THỜI GIAN / ĐỘ KHÓ */}
                            <div className="text-[10px] text-neutral-600 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              {game.minPlayers && (
                                <span>
                                  👥 {game.minPlayers} - {game.maxPlayers || game.minPlayers} người
                                </span>
                              )}
                              {game.playTime && <span>⏱️ {game.playTime}p</span>}
                              {game.minAge && <span>🎂 {game.minAge}+</span>}
                              {game.weight && (
                                <span className="font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                  ⚡ {typeof game.weight === 'number' ? game.weight.toFixed(2) : game.weight}/5
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* PHẦN ĐÁNH GIÁ VÀ GHI CHÚ */}
                        {(includeRatings || includeNotes || (includeBorrower && item.borrower)) && (
                          <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-100 text-[10px] space-y-1">
                            {includeRatings && (
                              <div className="flex items-center justify-between">
                                <span className="text-neutral-500 font-medium">Đánh giá sở thích:</span>
                                <span className="text-amber-600 font-bold tracking-wider">
                                  {'★'.repeat(Math.round(item.personalRating || 5))}
                                  {'☆'.repeat(5 - Math.round(item.personalRating || 5))}
                                </span>
                              </div>
                            )}

                            {includeBorrower && item.status === 'LENT_OUT' && item.borrower && (
                              <div className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                                🤝 Đang cho mượn: <strong>{item.borrower}</strong>
                                {item.expectedReturnDate && (
                                  <span> (Hẹn trả: {new Date(item.expectedReturnDate).toLocaleDateString('vi-VN')})</span>
                                )}
                              </div>
                            )}

                            {includeNotes && item.personalNotes && (
                              <p className="text-neutral-700 italic bg-white p-1.5 rounded border border-neutral-200/60 leading-tight">
                                💬 &ldquo;{item.personalNotes}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DANH SÁCH GAME: LAYOUT BẢNG (COMPACT TABLE) */}
              {layoutStyle === 'table' && filteredGames.length > 0 && (
                <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3">Tên BoardGame</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 px-3">Tình trạng</th>
                        <th className="py-2.5 px-3">Số người / Thời gian</th>
                        {includeRatings && <th className="py-2.5 px-3 text-center">Đánh giá</th>}
                        {includeNotes && <th className="py-2.5 px-3">Ghi chú</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredGames.map((item, idx) => {
                        const game = item.game || {};
                        const st = STATUS_MAP[item.status] || STATUS_MAP.ON_SHELF;

                        return (
                          <tr key={item.id || idx} className="hover:bg-neutral-50">
                            <td className="py-2 px-3 font-mono text-[10px] text-neutral-400">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <div className="font-bold text-neutral-900">{game.name}</div>
                              {game.categories && Array.isArray(game.categories) && (
                                <div className="text-[9px] text-neutral-500">{game.categories.slice(0, 2).join(', ')}</div>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className="px-1.5 py-0.5 text-[9px] font-bold rounded uppercase whitespace-nowrap"
                                style={{
                                  backgroundColor: st.bg,
                                  color: st.color,
                                  border: `1px solid ${st.border}`,
                                }}
                              >
                                {st.label}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[10px] text-neutral-700">{item.condition || '—'}</td>
                            <td className="py-2 px-3 text-[10px] text-neutral-600 whitespace-nowrap">
                              <div>
                                {game.minPlayers ? `${game.minPlayers}-${game.maxPlayers || game.minPlayers}p` : '—'} •{' '}
                                {game.playTime ? `${game.playTime}m` : '—'}
                              </div>
                              {game.weight && (
                                <span className="inline-block text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 mt-0.5">
                                  ⚡ {typeof game.weight === 'number' ? game.weight.toFixed(2) : game.weight}/5
                                </span>
                              )}
                            </td>
                            {includeRatings && (
                              <td className="py-2 px-3 text-center text-amber-600 font-bold text-[10px] whitespace-nowrap">
                                {'★'.repeat(Math.round(item.personalRating || 5))}
                              </td>
                            )}
                            {includeNotes && (
                              <td className="py-2 px-3 text-[10px] text-neutral-600 italic max-w-xs truncate">
                                {item.personalNotes || (item.borrower ? `Mượn: ${item.borrower}` : '—')}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* FOOTER TRANG IN */}
              <div className="mt-8 pt-4 border-t border-neutral-200 flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                <div>BoardMates Ecosystem • https://boardmates.vn</div>
                <div>Generated for @{user?.username || 'member'} • Page 1</div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-surface-container-high border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">verified</span>
            <span>
              Sẵn sàng xuất <strong>{filteredGames.length}</strong> tựa game sang file PDF chuẩn A4.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating || filteredGames.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-highest font-label text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>In Ngay</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isGenerating || filteredGames.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-dim font-label text-xs uppercase font-bold tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>{progressMsg || 'Đang tạo PDF...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Tải File PDF (.pdf)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
