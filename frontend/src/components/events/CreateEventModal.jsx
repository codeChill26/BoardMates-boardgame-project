'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBackendUrl } from '@/lib/apiConfig';
import EventMapPicker, { POPULAR_BOARDGAME_CAFES } from './EventMapPicker';
import GameCameraScannerModal from '../vault/GameCameraScannerModal';

const PRESET_GAMES = [
  { id: 1, name: 'Catan', image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80', bggId: 13, playTime: 90, weight: 2.3 },
  { id: 2, name: 'Root', image: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80', bggId: 237182, playTime: 90, weight: 3.8 },
  { id: 3, name: 'Dune: Imperium', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80', bggId: 316554, playTime: 120, weight: 3.0 },
  { id: 4, name: 'Wingspan', image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=800&q=80', bggId: 266192, playTime: 70, weight: 2.4 },
  { id: 5, name: 'Splendor', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', bggId: 148228, playTime: 30, weight: 1.8 },
  { id: 6, name: 'Scythe', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80', bggId: 169786, playTime: 115, weight: 3.4 },
  { id: 7, name: 'Ma Sói / Avalon', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', bggId: 128882, playTime: 30, weight: 1.7 },
  { id: 8, name: 'Ticket to Ride', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80', bggId: 9209, playTime: 60, weight: 1.9 },
  { id: 9, name: 'Brass: Birmingham', image: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80', bggId: 224517, playTime: 120, weight: 3.9 },
  { id: 10, name: 'Terraforming Mars', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80', bggId: 167791, playTime: 120, weight: 3.2 },
];

export default function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
  language = 'vi',
  user,
}) {
  const isEn = language === 'en';

  const [formData, setFormData] = useState({
    title: '',
    eventType: 'CASUAL',
    startDate: '',
    startTime: '14:00',
    endDate: '',
    endTime: '18:00',
    location: 'The Mind Cafe & Boardgame',
    address: '284/41 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7719,
    lng: 106.6575,
    maxParticipants: 4,
    entryFee: 0,
    skillLevel: 'ALL',
    description: '',
  });

  // Danh sách nhiều board game được chọn cho kèo
  const [selectedGames, setSelectedGames] = useState([
    PRESET_GAMES[0], // Mặc định chọn Catan
  ]);

  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [gameSearchResults, setGameSearchResults] = useState([]);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tìm kiếm game từ BGG / Kho game
  useEffect(() => {
    if (!gameSearchQuery.trim() || gameSearchQuery.trim().length < 2) {
      setGameSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingGames(true);
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/shelf/bgg-search?q=${encodeURIComponent(gameSearchQuery.trim())}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setGameSearchResults(json.data.slice(0, 6));
          }
        }
      } catch (err) {
        console.warn('Game search err:', err);
      } finally {
        setIsSearchingGames(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [gameSearchQuery]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleAddGame = (game) => {
    if (selectedGames.some((g) => g.name.toLowerCase() === game.name.toLowerCase())) {
      return; // Tránh thêm trùng
    }
    const updated = [
      ...selectedGames,
      {
        id: game.id || null,
        name: game.name,
        imageUrl: game.image || game.imageUrl || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
        bggId: game.bggId || null,
        playTime: game.playTime || null,
        weight: game.weight || null,
      },
    ];
    setSelectedGames(updated);
    setGameSearchQuery('');
    setGameSearchResults([]);

    // Tự động gợi ý tiêu đề nếu chưa có
    if (!formData.title.trim()) {
      const names = updated.map((g) => g.name).join(' & ');
      handleChange('title', isEn ? `Game Session: ${names}` : `Kèo giao lưu: ${names}`);
    }
  };

  const handleRemoveGame = (indexToRemove) => {
    if (selectedGames.length <= 1) {
      setErrorMsg(isEn ? 'Please keep at least 1 board game for this event' : 'Vui lòng chọn ít nhất 1 Board Game cho kèo này');
      return;
    }
    setSelectedGames((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleAddCustomGame = () => {
    if (!gameSearchQuery.trim()) return;
    handleAddGame({
      name: gameSearchQuery.trim(),
      image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
    });
  };

  const handleVenueChange = (venueData) => {
    setFormData((prev) => ({
      ...prev,
      location: venueData.location || prev.location,
      address: venueData.address || prev.address,
      city: venueData.city || prev.city,
      lat: venueData.lat ?? prev.lat,
      lng: venueData.lng ?? prev.lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrorMsg(isEn ? 'Please enter an event title' : 'Vui lòng nhập tiêu đề sự kiện');
      return;
    }

    if (selectedGames.length === 0) {
      setErrorMsg(isEn ? 'Please select at least 1 Board Game' : 'Vui lòng chọn ít nhất 1 trò chơi Board Game');
      return;
    }

    if (!formData.location.trim()) {
      setErrorMsg(isEn ? 'Please enter a location / venue' : 'Vui lòng nhập địa điểm');
      return;
    }

    if (!formData.startDate) {
      setErrorMsg(isEn ? 'Please choose start date' : 'Vui lòng chọn ngày diễn ra');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const startDateTimeStr = `${formData.startDate}T${formData.startTime || '14:00'}:00`;
      const endDateTimeStr = formData.endDate
        ? `${formData.endDate}T${formData.endTime || '18:00'}:00`
        : null;

      const payload = {
        title: formData.title.trim(),
        eventType: formData.eventType,
        games: selectedGames,
        customGameName: selectedGames.map((g) => g.name).join(', '),
        gameId: selectedGames[0]?.id || null,
        imageUrl: selectedGames[0]?.imageUrl || selectedGames[0]?.image || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
        startDate: new Date(startDateTimeStr).toISOString(),
        endDate: endDateTimeStr ? new Date(endDateTimeStr).toISOString() : null,
        location: formData.location.trim(),
        address: formData.address.trim() || null,
        city: formData.city,
        lat: formData.lat || null,
        lng: formData.lng || null,
        maxParticipants: parseInt(formData.maxParticipants) || 4,
        entryFee: parseFloat(formData.entryFee) || 0,
        skillLevel: formData.skillLevel,
        description: formData.description.trim() || null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
      setErrorMsg(err.message || (isEn ? 'Failed to create event' : 'Không thể tạo sự kiện'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="window-border window-shadow bg-surface-bright w-full max-w-3xl rounded-sm overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Retro Title Bar */}
        <div className="retro-title-bar bg-surface-container-high px-4 py-2.5 flex items-center justify-between font-mono text-xs select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[17px]">
              add_circle
            </span>
            <span className="font-bold tracking-wider text-on-surface uppercase">
              {isEn ? 'host_new_event.exe' : 'tao_keo_su_kien.exe'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center border border-on-surface hover:bg-rose-500 hover:text-white font-bold transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 font-sans">
          {errorMsg && (
            <div className="p-3 rounded bg-rose-500/10 border-2 border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Event Type selector */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1.5">
                {isEn ? 'Event Format *' : 'Hình thức sự kiện / Kèo *'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'CASUAL', labelVi: 'Giao lưu', labelEn: 'Casual', icon: 'sports_esports' },
                  { key: 'TOURNAMENT', labelVi: 'Giải đấu', labelEn: 'Tournament', icon: 'emoji_events' },
                  { key: 'WORKSHOP', labelVi: 'Workshop', labelEn: 'Workshop', icon: 'school' },
                  { key: 'NIGHT', labelVi: 'Game Night', labelEn: 'Game Night', icon: 'nightlife' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleChange('eventType', t.key)}
                    className={`py-2 px-2.5 rounded-sm border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.eventType === t.key
                        ? 'border-on-surface bg-tertiary text-on-tertiary shadow-xs'
                        : 'border-outline/30 bg-surface hover:bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                    <span>{isEn ? t.labelEn : t.labelVi}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Event Title */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1">
                {isEn ? 'Event Title *' : 'Tiêu đề sự kiện / Tên kèo *'}
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={isEn ? 'e.g. Weekend Catan & Root Strategy Match, Dune Championship...' : 'Vd: Kèo Catan & Root cuối tuần chill, Workshop Scythe cho newbie...'}
                className="w-full px-3 py-2 text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden transition-colors"
              />
            </div>

            {/* Multi-Game Selector from Vault / BGG */}
            <div className="p-3.5 bg-surface-container-low rounded-sm window-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">casino</span>
                  <span>{isEn ? 'Board Games to Play (Multiple)' : 'Các Board Game Sẽ Chơi (Có thể chọn nhiều game)'}</span>
                </label>
                <span className="text-[11px] font-mono text-primary font-bold">
                  {selectedGames.length} {isEn ? 'game(s) selected' : 'game đã chọn'}
                </span>
              </div>

              {/* Selected Games Badges List */}
              <div className="flex flex-wrap gap-2">
                {selectedGames.map((g, idx) => (
                  <div
                    key={`${g.name}-${idx}`}
                    className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-sm bg-surface-bright border-2 border-on-surface window-shadow text-xs font-bold text-on-surface"
                  >
                    <img
                      src={g.imageUrl || g.image || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=150&q=80'}
                      alt={g.name}
                      className="w-6 h-6 rounded-xs object-cover border border-outline/30"
                    />
                    <span>{g.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGame(idx)}
                      title="Xóa game này"
                      className="w-4 h-4 rounded-full flex items-center justify-center text-outline hover:text-rose-600 hover:bg-rose-100 cursor-pointer ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Search or Add Game Input */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[16px] pointer-events-none">
                      search
                    </span>
                    <input
                      type="text"
                      value={gameSearchQuery}
                      onChange={(e) => setGameSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomGame();
                        }
                      }}
                      placeholder={isEn ? 'Search Game Vault or BGG (e.g. Catan, Brass, Dune...)' : 'Tìm kiếm trong Kho Game hoặc BGG (Vd: Catan, Dune, Root...)'}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-sm border-2 border-primary bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    title="Chụp ảnh hộp game để nhận diện BGG tự động"
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    <span className="hidden sm:inline">{isEn ? 'Scan Box' : 'Quét Ảnh'}</span>
                  </button>
                  {gameSearchQuery && (
                    <button
                      type="button"
                      onClick={handleAddCustomGame}
                      className="px-3 py-1.5 text-xs font-bold rounded-sm border-2 border-on-surface bg-tertiary text-on-tertiary cursor-pointer shrink-0"
                    >
                      + {isEn ? 'Add' : 'Thêm'}
                    </button>
                  )}
                </div>

                {/* Search Autocomplete Dropdown */}
                {gameSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-bright border-2 border-on-surface rounded-sm window-shadow z-30 divide-y divide-outline/15 max-h-48 overflow-y-auto">
                    {gameSearchResults.map((game) => (
                      <div
                        key={game.id || game.bggId || game.name}
                        onClick={() => handleAddGame(game)}
                        className="p-2 flex items-center justify-between hover:bg-surface-container cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={game.imageUrl || game.image || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=150&q=80'}
                            alt={game.name}
                            className="w-7 h-7 rounded-xs object-cover border border-outline/20"
                          />
                          <div>
                            <div className="text-xs font-bold text-on-surface">{game.name}</div>
                            {game.year && <span className="text-[10px] text-outline">({game.year})</span>}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-primary">+ Chọn</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Pick Preset Games */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-outline mr-1">{isEn ? 'Quick pick:' : 'Gợi ý nhanh:'}</span>
                {PRESET_GAMES.map((g) => {
                  const isSelected = selectedGames.some((sg) => sg.name.toLowerCase() === g.name.toLowerCase());
                  return (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => handleAddGame(g)}
                      disabled={isSelected}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-outline/20 bg-surface-container/50 text-outline opacity-60 cursor-default'
                          : 'border-outline/30 bg-surface hover:bg-primary/20 hover:border-primary text-on-surface'
                      }`}
                    >
                      <span>+ {g.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1">
                  {isEn ? 'Start Date *' : 'Ngày diễn ra *'}
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1">
                  {isEn ? 'Start Time' : 'Giờ bắt đầu'}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden"
                />
              </div>
            </div>

            {/* Venue, Cafe Locator & Google Maps */}
            <div className="p-3.5 bg-surface-container-low rounded-sm window-border space-y-3">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">map</span>
                <span>{isEn ? 'Venue, Address & Google Maps' : 'Địa Điểm, Quán Cafe & Bản Đồ Google Maps *'}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                    {isEn ? 'Venue / Cafe Name *' : 'Tên Quán Cafe / Địa Điểm *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Vd: The Mind Cafe & Boardgame, Cube Cafe..."
                    className="w-full px-3 py-1.5 text-xs border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                    {isEn ? 'City / Area' : 'Khu vực / Thành phố'}
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden font-sans"
                  >
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Online">Online / Discord</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              {/* EventMapPicker Component: Google Maps Embed + Cafe Pins */}
              <EventMapPicker
                location={formData.location}
                address={formData.address}
                city={formData.city}
                lat={formData.lat}
                lng={formData.lng}
                onChangeVenue={handleVenueChange}
                language={language}
              />
            </div>

            {/* Max players, Fee, Skill */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1">
                  {isEn ? 'Max Players' : 'Số người tối đa'}
                </label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={formData.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1">
                  {isEn ? 'Entry Fee (VND)' : 'Chi phí (VNĐ)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={formData.entryFee}
                  onChange={(e) => handleChange('entryFee', e.target.value)}
                  placeholder="0 = Miễn phí"
                  className="w-full px-3 py-2 text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1">
                  {isEn ? 'Skill Level' : 'Yêu cầu trình độ'}
                </label>
                <select
                  value={formData.skillLevel}
                  onChange={(e) => handleChange('skillLevel', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden font-sans"
                >
                  <option value="ALL">{isEn ? 'All Levels' : 'Mọi trình độ'}</option>
                  <option value="BEGINNER">{isEn ? 'Beginner Friendly' : 'Nhập môn / Người mới'}</option>
                  <option value="INTERMEDIATE">{isEn ? 'Intermediate' : 'Có kinh nghiệm'}</option>
                  <option value="EXPERT">{isEn ? 'Expert / Hardcore' : 'Cao thủ / Chuyên sâu'}</option>
                </select>
              </div>
            </div>

            {/* Description & Rules */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wide mb-1">
                {isEn ? 'Description & Notes' : 'Mô tả & Ghi chú luật chơi'}
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={isEn ? 'Describe the game session, rules, who provides games, notes for newcomers...' : 'Mô tả buổi chơi, thể lệ, ai mang theo game, có hướng dẫn chơi cho tân thủ hay không...'}
                className="w-full px-3 py-2 text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface text-on-surface outline-hidden transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-outline/20 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold border-2 border-on-surface rounded-sm bg-surface hover:bg-surface-container active:translate-y-0.5 text-on-surface transition-all cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold border-2 border-on-surface rounded-sm bg-primary hover:bg-primary-dim text-on-primary shadow-xs active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
              >
                {isSubmitting && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                <span>
                  {isSubmitting
                    ? (isEn ? 'Publishing...' : 'Đang đăng kèo...')
                    : (isEn ? 'Publish Event' : 'Đăng Kèo Ngay')}
                </span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Modal Quét Ảnh Hộp Game BGG */}
      <GameCameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        token={user?.token}
        onGameAdded={(game) => {
          if (game) {
            handleAddGame(game);
          }
        }}
        language={language}
      />
    </div>
  );
}
