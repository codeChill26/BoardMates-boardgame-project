'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorker } from 'tesseract.js';
import { getBackendUrl } from '@/lib/apiConfig';

export default function GameCameraScannerModal({ isOpen, onClose, token, onGameAdded, language = 'vi' }) {
  const isEn = language === 'en';
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [detectedGamesList, setDetectedGamesList] = useState([]);
  const [selectedGameIds, setSelectedGameIds] = useState(new Set());
  const [selectedGameDetail, setSelectedGameDetail] = useState(null);
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [feedback, setFeedback] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'

  // Bật camera khi mở modal
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError(
        isEn
          ? 'Cannot access live camera stream. You can still take or select photos.'
          : 'Không thể mở trực tiếp luồng camera. Bạn hãy bấm nút "Chụp / Chọn Ảnh" bên dưới.'
      );
    }
  }, [facingMode, isEn]);

  // Tắt camera khi đóng modal
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setDetectedGamesList([]);
      setSelectedGameIds(new Set());
      setSelectedGameDetail(null);
      setFeedback(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Trích xuất các cụm từ tiềm năng từ văn bản OCR (Multi-Line / Multi-Box)
  const extractCandidatePhrases = (ocrLines) => {
    const candidates = new Set();

    ocrLines.forEach((line) => {
      const cleanLine = line
        .replace(/[^a-zA-Z0-9\s:!'-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanLine.length >= 3) {
        candidates.add(cleanLine);

        // Tách các từ riêng nếu dòng quá dài
        const words = cleanLine.split(' ');
        if (words.length > 2) {
          candidates.add(words.slice(0, 2).join(' '));
          candidates.add(words.slice(1, 3).join(' '));
        }
        words.forEach((w) => {
          if (w.length >= 4) candidates.add(w);
        });
      }
    });

    return Array.from(candidates).slice(0, 15);
  };

  // Quét và tìm kiếm nhiều game cùng lúc trên BGG
  const searchBGGForMultiGames = async (candidates) => {
    setScanStatus(
      isEn
        ? `Matching ${candidates.length} detected labels with BGG database...`
        : `Đang đối chiếu ${candidates.length} cụm từ với cơ sở dữ liệu 72.000+ BGG...`
    );

    const foundGamesMap = new Map();

    // Thực thi các truy vấn BGG song song
    const searchPromises = candidates.map(async (query) => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/shelf/bgg/search?query=${encodeURIComponent(query)}`);
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success && Array.isArray(json.data) && json.data.length > 0) {
          // Lấy top 1-2 game tốt nhất của mỗi cụm từ
          json.data.slice(0, 2).forEach((g) => {
            if (g.bggId && !foundGamesMap.has(g.bggId)) {
              foundGamesMap.set(g.bggId, g);
            }
          });
        }
      } catch (e) {
        // ignore
      }
    });

    await Promise.all(searchPromises);

    const foundList = Array.from(foundGamesMap.values());
    setDetectedGamesList(foundList);

    // Mặc định chọn tất cả các game đã nhận diện được
    const allIds = new Set(foundList.map((g) => g.bggId));
    setSelectedGameIds(allIds);

    if (foundList.length > 0) {
      setSelectedGameDetail(foundList[0]);
      setScanStatus(
        isEn
          ? `🎉 Successfully detected ${foundList.length} board games on your shelf/table!`
          : `🎉 Đã nhận diện thành công ${foundList.length} tựa board game cùng lúc!`
      );
    } else {
      setScanStatus(
        isEn
          ? 'Could not match game titles. Try taking a closer, sharper photo of the boxes.'
          : 'Chưa đối chiếu được game nào. Hãy chụp cận cảnh hơn vào chữ trên hộp nhé.'
      );
    }
  };

  // Tiến trình OCR AI nhận diện chữ toàn khung hình
  const processImageWithOCR = async (imageSrc) => {
    try {
      setIsScanning(true);
      setScanStatus(
        isEn
          ? 'Scanning entire image with AI Multi-Object OCR...'
          : 'Trí tuệ nhân tạo đang quét toàn bộ kệ/hộp game trong ảnh...'
      );

      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageSrc);
      await worker.terminate();

      const fullText = ret.data.text || '';
      const lines = fullText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length >= 3);

      if (lines.length === 0) {
        setScanStatus(
          isEn
            ? 'No readable text found. Please take a clearer photo of the game boxes.'
            : 'Ảnh chưa rõ chữ trên hộp game. Hãy chụp góc thẳng và sáng hơn nhé!'
        );
        setIsScanning(false);
        return;
      }

      const candidateQueries = extractCandidatePhrases(lines);
      await searchBGGForMultiGames(candidateQueries);
    } catch (err) {
      console.error(err);
      setScanStatus(isEn ? 'OCR error during multi-scan.' : 'Lỗi trong quá trình quét ảnh.');
    } finally {
      setIsScanning(false);
    }
  };

  // Chụp ảnh từ Live Camera
  const handleCaptureFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
    processImageWithOCR(dataUrl);
  };

  // Tải ảnh chụp từ điện thoại
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setCapturedImage(dataUrl);
      stopCamera();
      processImageWithOCR(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Chọn / Bỏ chọn từng game
  const toggleSelectGame = (bggId) => {
    setSelectedGameIds((prev) => {
      const next = new Set(prev);
      if (next.has(bggId)) {
        next.delete(bggId);
      } else {
        next.add(bggId);
      }
      return next;
    });
  };

  // Chọn tất cả / Bỏ chọn tất cả
  const toggleSelectAll = () => {
    if (selectedGameIds.size === detectedGamesList.length) {
      setSelectedGameIds(new Set());
    } else {
      setSelectedGameIds(new Set(detectedGamesList.map((g) => g.bggId)));
    }
  };

  // Nhập hàng loạt game đã chọn vào Kho (Vault)
  const handleBatchImportToVault = async () => {
    if (selectedGameIds.size === 0 || !token) {
      setFeedback({
        text: isEn ? 'Please select at least 1 game and log in' : 'Vui lòng chọn ít nhất 1 game và đăng nhập',
        type: 'error',
      });
      return;
    }

    const gamesToImport = detectedGamesList.filter((g) => selectedGameIds.has(g.bggId));
    setIsBatchImporting(true);
    setImportProgress({ current: 0, total: gamesToImport.length });

    let successCount = 0;

    for (let i = 0; i < gamesToImport.length; i++) {
      const game = gamesToImport[i];
      setImportProgress({ current: i + 1, total: gamesToImport.length });

      try {
        const res = await fetch(`${getBackendUrl()}/api/shelf/bgg/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bggId: game.bggId,
            status: 'ON_SHELF',
          }),
        });

        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          successCount++;
        }
      } catch (err) {
        console.warn(`Error importing game ${game.name}:`, err);
      }
    }

    setIsBatchImporting(false);
    setFeedback({
      text: `🎉 Đã thêm thành công ${successCount}/${gamesToImport.length} board game vào Kho Game của bạn!`,
      type: 'success',
    });

    if (onGameAdded) onGameAdded(gamesToImport);
    setTimeout(() => {
      onClose();
    }, 2200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs font-sans">
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Input with Camera Capture Support */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="window-border window-shadow bg-surface-bright w-full max-w-3xl rounded-sm overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Retro Header Title Bar */}
        <div className="retro-title-bar bg-surface-container-high px-4 py-2.5 flex items-center justify-between font-mono text-xs select-none border-b-2 border-on-surface shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">document_scanner</span>
            <span className="font-bold tracking-wider text-on-surface uppercase truncate">
              {isEn ? 'BGG_MULTI_GAME_AI_DETECTOR.EXE' : 'QUET_HANG_LOAT_NHIEU_GAME_BGG.EXE'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center border border-on-surface hover:bg-rose-500 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-xs text-xs font-bold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {feedback.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{feedback.text}</span>
            </div>
          )}

          {/* VIEWPORT AREA: Camera Stream vs Captured Photo */}
          <div className="relative aspect-video sm:aspect-[21/9] bg-black rounded-xs overflow-hidden border-2 border-on-surface flex items-center justify-center">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured Shelf" className="w-full h-full object-contain" />
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                {/* Laser Scan Animation Line */}
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_10px_#f59e0b] pointer-events-none"
                />

                {/* Multi-Target Grid Framing Box */}
                <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-amber-400/50 rounded-xs pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between text-[10px] font-mono text-amber-400">
                    <span>[MULTI_SHELF_DETECTION_MODE]</span>
                    <span>AI_BATCH_BGG</span>
                  </div>
                  <div className="text-center text-[11px] font-mono text-amber-300 bg-black/60 py-0.5 px-3 rounded-xs self-center">
                    {isEn
                      ? '📸 Point at shelf or multiple game boxes — system will detect all!'
                      : '📸 Chụp cả kệ hoặc nhiều hộp game xếp cạnh nhau — hệ thống sẽ nhận diện hết!'}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-amber-400">
                    <span>WIDE_SCAN: ACTIVE</span>
                    <span>72K_DB</span>
                  </div>
                </div>
              </>
            )}

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-2 text-white font-mono z-20">
                <span className="material-symbols-outlined text-4xl text-amber-400 animate-spin">
                  progress_activity
                </span>
                <span className="text-xs text-amber-300 font-bold animate-pulse text-center px-4">
                  {scanStatus}
                </span>
              </div>
            )}
          </div>

          {/* Camera Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {!capturedImage ? (
              <>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="px-3 py-2 text-xs font-bold border border-on-surface rounded-xs bg-surface-bright hover:bg-surface-container flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Đổi camera trước / sau"
                  >
                    <span className="material-symbols-outlined text-[17px]">flip_camera_ios</span>
                    <span>{isEn ? 'Flip' : 'Đổi Camera'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 text-xs font-bold border border-on-surface rounded-xs bg-surface-bright hover:bg-surface-container flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[17px]">photo_library</span>
                    <span>{isEn ? 'Upload Photo' : 'Chọn Ảnh Kệ Game'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCaptureFromVideo}
                  className="px-5 py-2.5 text-xs font-bold rounded-sm border-2 border-on-surface bg-primary hover:bg-primary-dim text-white shadow-xs flex items-center gap-2 cursor-pointer uppercase tracking-wider font-mono"
                >
                  <span className="material-symbols-outlined text-[18px]">camera</span>
                  <span>{isEn ? 'Scan All Games' : 'Chụp & Quét Nhiều Game'}</span>
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null);
                    setDetectedGamesList([]);
                    setSelectedGameIds(new Set());
                    setSelectedGameDetail(null);
                    startCamera();
                  }}
                  className="px-4 py-2 text-xs font-bold border border-on-surface rounded-xs bg-surface-bright hover:bg-surface-container flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[17px]">replay</span>
                  <span>{isEn ? 'Scan Another Photo' : 'Chụp Lại Ảnh Khác'}</span>
                </button>

                <div className="text-xs font-mono text-on-surface-variant truncate max-w-sm">
                  {scanStatus}
                </div>
              </div>
            )}
          </div>

          {/* MULTI-GAME DETECTED CHECKLIST SECTION */}
          {detectedGamesList.length > 0 && (
            <div className="p-4 rounded-xs window-border bg-surface-bright space-y-4 shadow-xs">
              {/* Header with Selection Stats & Master Select */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-xs border border-emerald-500/30 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">checklist</span>
                    <span>
                      {isEn
                        ? `DETECTED ${detectedGamesList.length} GAMES`
                        : `NHẬN DIỆN THÀNH CÔNG ${detectedGamesList.length} GAME`}
                    </span>
                  </span>
                  <span className="text-xs font-bold text-primary font-mono">
                    (Đã chọn {selectedGameIds.size}/{detectedGamesList.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-on-surface hover:text-primary underline cursor-pointer font-mono"
                >
                  {selectedGameIds.size === detectedGamesList.length
                    ? isEn ? 'Deselect All' : 'Bỏ chọn tất cả'
                    : isEn ? 'Select All' : 'Chọn tất cả'}
                </button>
              </div>

              {/* Grid of Detected Games with Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {detectedGamesList.map((game) => {
                  const isChecked = selectedGameIds.has(game.bggId);

                  return (
                    <div
                      key={game.bggId}
                      className={`p-3 rounded-xs border-2 transition-all flex items-center gap-3 ${
                        isChecked
                          ? 'border-primary bg-primary/5 shadow-2xs'
                          : 'border-outline/20 bg-surface-bright opacity-60'
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectGame(game.bggId)}
                        className="w-4 h-4 text-primary rounded-xs border-on-surface focus:ring-primary cursor-pointer shrink-0"
                      />

                      {/* Game Box Art */}
                      <img
                        src={game.imageUrl || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=150&q=80'}
                        alt={game.name}
                        className="w-12 h-14 object-cover rounded-xs border border-on-surface shrink-0"
                      />

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-on-surface font-headline truncate">
                          {game.name} {game.yearPublished ? `(${game.yearPublished})` : ''}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono mt-1">
                          <span className="bg-amber-500/15 text-amber-900 font-bold px-1.5 py-0.2 rounded-xs">
                            ⭐ {game.bggRating || '8.0'}
                          </span>
                          <span className="bg-rose-500/15 text-rose-900 font-bold px-1.5 py-0.2 rounded-xs">
                            ⚡ {game.weight ? `${Number(game.weight).toFixed(1)}/5` : '2.5'}
                          </span>
                          <span className="text-outline">
                            👥 {game.minPlayers}-{game.maxPlayers}p
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Batch Action Toolbar */}
              <div className="pt-2 border-t border-outline/20 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-mono text-on-surface-variant">
                  {isBatchImporting
                    ? `Đang nạp game (${importProgress.current}/${importProgress.total})...`
                    : `Sẵn sàng nạp ${selectedGameIds.size} game vào kho của bạn.`}
                </div>

                <button
                  type="button"
                  onClick={handleBatchImportToVault}
                  disabled={selectedGameIds.size === 0 || isBatchImporting}
                  className="py-2.5 px-6 rounded-sm border-2 border-on-surface bg-tertiary hover:bg-tertiary-dim text-on-tertiary font-bold text-xs shadow-xs active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer uppercase font-sans tracking-wider disabled:opacity-40"
                >
                  {isBatchImporting ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                      <span>Đang Thêm ({importProgress.current}/{importProgress.total})...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">library_add</span>
                      <span>+ Thêm {selectedGameIds.size} Game Đã Chọn Vào Kho</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
