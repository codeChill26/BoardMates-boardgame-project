'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';
import { getBackendUrl } from '@/lib/apiConfig';
import { INITIAL_MOCK_EVENTS } from '@/data/mockEvents';
import EventCard from '@/components/events/EventCard';
import CreateEventModal from '@/components/events/CreateEventModal';
import EventDetailsModal from '@/components/events/EventDetailsModal';
import QuickJoinModal from '@/components/events/QuickJoinModal';

// Công thức Haversine tính khoảng cách giữa 2 toạ độ GPS (km)
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function EventsPage() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const isEn = language === 'en';
  const t = translations[language]?.events || translations.vi.events;

  // State sự kiện
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | HOSTED | JOINED
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isHeroExpanded, setIsHeroExpanded] = useState(true);

  // State Vị trí GPS & Bán kính tìm kiếm gần đây
  const [userLocation, setUserLocation] = useState({
    lat: null,
    lng: null,
    isEnabled: false,
    isLocating: false,
    error: null,
  });
  const [selectedRadius, setSelectedRadius] = useState('ALL'); // ALL | 5 | 10 | 25 | 50 (km)

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [eventForQuickJoin, setEventForQuickJoin] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Chỉ cho phép thành viên thường tạo kèo (Admin chỉ quản lý & kiểm duyệt)
  const handleOpenCreateEvent = () => {
    if (!user?.token && !user?.id) {
      setIsLoginPromptOpen(true);
      return;
    }
    if (user?.role === 'ADMIN') {
      showToast(
        isEn
          ? 'Admin accounts are reserved for system monitoring & moderation only.'
          : 'Tài khoản Quản Trị Viên (Admin) chỉ dùng để quản lý hệ thống và kiểm duyệt, không dùng để đăng kèo.',
        'error'
      );
      return;
    }
    setIsCreateOpen(true);
  };

  // Khởi tạo và đồng bộ dữ liệu sự kiện
  const fetchEvents = useCallback(async (lat = null, lng = null) => {
    try {
      setIsLoading(true);
      const backendUrl = getBackendUrl();
      let queryUrl = `${backendUrl}/api/events`;
      if (lat != null && lng != null) {
        queryUrl += `?userLat=${lat}&userLng=${lng}`;
      }

      const res = await fetch(queryUrl, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setEvents(json.data);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API /api/events offline or unreachable, using local storage/mock fallback.');
    }

    // Fallback: Đọc từ localStorage nếu có, nếu chưa thì nạp INITIAL_MOCK_EVENTS
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bm_events_cache');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEvents(parsed);
            setIsLoading(false);
            return;
          }
        } catch (e) {}
      }
      setEvents(INITIAL_MOCK_EVENTS);
      localStorage.setItem('bm_events_cache', JSON.stringify(INITIAL_MOCK_EVENTS));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  // Kích hoạt / Tắt định vị GPS
  const handleToggleGPS = () => {
    if (userLocation.isEnabled) {
      // Tắt GPS
      setUserLocation({
        lat: null,
        lng: null,
        isEnabled: false,
        isLocating: false,
        error: null,
      });
      setSelectedRadius('ALL');
      showToast(isEn ? 'GPS location disabled' : 'Đã tắt chế độ định vị GPS');
      fetchEvents();
      return;
    }

    if (!navigator.geolocation) {
      showToast(
        isEn ? 'Geolocation is not supported by your browser' : 'Trình duyệt không hỗ trợ Geolocation',
        'error'
      );
      return;
    }

    setUserLocation((prev) => ({ ...prev, isLocating: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({
          lat: latitude,
          lng: longitude,
          isEnabled: true,
          isLocating: false,
          error: null,
        });

        fetchEvents(latitude, longitude);
        showToast(
          isEn
            ? '📍 GPS enabled! Showing nearest boardgame sessions.'
            : '📍 Đã bật GPS! Đang ưu tiên các kèo boardgame gần bạn nhất.'
        );
      },
      (error) => {
        console.warn('GPS Error:', error);
        setUserLocation((prev) => ({
          ...prev,
          isLocating: false,
          isEnabled: false,
          error: error.message,
        }));
        showToast(
          isEn
            ? 'Could not get location. Please allow location permissions in browser.'
            : 'Không thể lấy vị trí. Vui lòng cho phép quyền định vị trong trình duyệt.',
          'error'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Lưu cache khi events thay đổi
  const saveEventsCache = (newEventsList) => {
    setEvents(newEventsList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bm_events_cache', JSON.stringify(newEventsList));
    }
  };

  // Xử lý tạo sự kiện mới
  const handleCreateEvent = async (formData) => {
    try {
      const backendUrl = getBackendUrl();
      let createdOnline = false;

      if (user?.token) {
        try {
          const res = await fetch(`${backendUrl}/api/events`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify(formData),
          });

          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              const updated = [json.data, ...events];
              saveEventsCache(updated);
              createdOnline = true;
            }
          }
        } catch (e) {}
      }

      if (!createdOnline) {
        // Tạo local fallback event
        const hostName = user?.username || (typeof window !== 'undefined' ? localStorage.getItem('bm_guest_display_name') : '') || (isEn ? 'Host Player' : 'Chủ Kèo');
        const localNewEvent = {
          ...formData,
          id: Date.now(),
          hostId: user?.id || Date.now(),
          host: {
            id: user?.id || Date.now(),
            username: hostName,
            avatarUrl: user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(hostName)}`,
            email: user?.email || '',
          },
          status: 'OPEN',
          joinedCount: 1,
          availableSlots: Math.max(0, formData.maxParticipants - 1),
          isFull: false,
          isHost: true,
          isUserJoined: true,
          participants: [
            {
              id: Date.now(),
              userId: user?.id || Date.now(),
              role: 'HOST',
              status: 'JOINED',
              joinedAt: new Date().toISOString(),
              user: {
                id: user?.id || Date.now(),
                username: hostName,
                avatarUrl: user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(hostName)}`,
              },
            },
          ],
        };

        const updated = [localNewEvent, ...events];
        saveEventsCache(updated);
      }

      showToast(isEn ? 'Event created successfully!' : 'Đã lên kèo sự kiện thành công!');
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Mở popup tham gia nhanh (nhập tên hiển thị)
  const handleOpenQuickJoin = (event) => {
    setEventForQuickJoin(event);
  };

  // Xác nhận tham gia kèo với tên hiển thị & thông tin liên hệ
  const handleConfirmJoinEvent = async (eventId, { displayName, contact, notes }) => {
    try {
      const backendUrl = getBackendUrl();
      if (user?.token) {
        try {
          await fetch(`${backendUrl}/api/events/${eventId}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({ displayName, contact, notes }),
          });
        } catch (e) {}
      }

      // Optimistic update
      const participantName = displayName || user?.username || (isEn ? 'Player' : 'Người chơi');
      const avatarUrl = user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(participantName)}`;

      const updated = events.map((ev) => {
        if (ev.id === eventId) {
          const currentParts = ev.participants || [];
          const currentCount = currentParts.length;
          if (currentCount >= ev.maxParticipants) return ev;

          const newParticipant = {
            id: Date.now(),
            userId: user?.id || Date.now(),
            role: 'PLAYER',
            status: 'JOINED',
            notes: notes || null,
            contact: contact || null,
            joinedAt: new Date().toISOString(),
            user: {
              id: user?.id || Date.now(),
              username: participantName,
              avatarUrl: avatarUrl,
            },
          };

          const newParticipantsList = [...currentParts, newParticipant];
          const newCount = newParticipantsList.length;
          const isFullNow = newCount >= ev.maxParticipants;

          const updatedEvent = {
            ...ev,
            participants: newParticipantsList,
            joinedCount: newCount,
            availableSlots: Math.max(0, ev.maxParticipants - newCount),
            isFull: isFullNow,
            status: isFullNow ? 'FULL' : ev.status,
            isUserJoined: true,
          };

          if (selectedEventForDetails?.id === eventId) {
            setSelectedEventForDetails(updatedEvent);
          }

          return updatedEvent;
        }
        return ev;
      });

      saveEventsCache(updated);
      showToast(isEn ? `Welcome ${participantName}, you joined the match!` : `Chào ${participantName}, bạn đã tham gia kèo thành công!`);
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  // Xử lý rút khỏi kèo
  const handleLeaveEvent = async (eventId) => {
    try {
      const backendUrl = getBackendUrl();
      if (user?.token) {
        try {
          await fetch(`${backendUrl}/api/events/${eventId}/leave`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });
        } catch (e) {}
      }

      // Optimistic update
      const currentUserId = user?.id;
      const guestSavedName = typeof window !== 'undefined' ? localStorage.getItem('bm_guest_display_name') : null;

      const updated = events.map((ev) => {
        if (ev.id === eventId) {
          const newParts = (ev.participants || []).filter((p) => {
            if (currentUserId && (p.userId === currentUserId || p.user?.id === currentUserId)) {
              return false;
            }
            if (guestSavedName && p.user?.username === guestSavedName) {
              return false;
            }
            return true;
          });
          const newCount = newParts.length;

          const updatedEvent = {
            ...ev,
            participants: newParts,
            joinedCount: newCount,
            availableSlots: Math.max(0, ev.maxParticipants - newCount),
            isFull: false,
            status: ev.status === 'FULL' ? 'OPEN' : ev.status,
            isUserJoined: false,
          };

          if (selectedEventForDetails?.id === eventId) {
            setSelectedEventForDetails(updatedEvent);
          }

          return updatedEvent;
        }
        return ev;
      });

      saveEventsCache(updated);
      showToast(isEn ? 'Left the match' : 'Đã rút khỏi kèo thành công');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  // Xử lý hủy kèo (dành cho host)
  const handleCancelEvent = async (eventId) => {
    if (!window.confirm(isEn ? 'Are you sure you want to cancel this event?' : 'Bạn có chắc chắn muốn hủy kèo sự kiện này?')) {
      return;
    }

    try {
      const updated = events.filter((ev) => ev.id !== eventId);
      saveEventsCache(updated);
      setSelectedEventForDetails(null);
      showToast(isEn ? 'Event cancelled' : 'Đã hủy kèo sự kiện thành công');
    } catch (err) {
      console.error(err);
    }
  };

  // Đếm số lượng kèo theo từng Tab
  const tabCounts = useMemo(() => {
    const currentUserId = user?.id;
    const guestSavedName = typeof window !== 'undefined' ? localStorage.getItem('bm_guest_display_name') : null;

    const allCount = events.length;
    const hostedCount = events.filter((ev) => {
      if (currentUserId && (ev.hostId === currentUserId || ev.host?.id === currentUserId)) return true;
      if (ev.isHost) return true;
      if (guestSavedName && ev.host?.username === guestSavedName) return true;
      return false;
    }).length;

    const joinedCount = events.filter((ev) => {
      if (ev.isUserJoined) return true;
      if (currentUserId && ev.participants?.some((p) => p.userId === currentUserId || p.user?.id === currentUserId)) return true;
      if (guestSavedName && ev.participants?.some((p) => p.user?.username === guestSavedName)) return true;
      return false;
    }).length;

    return { all: allCount, hosted: hostedCount, joined: joinedCount };
  }, [events, user?.id]);

  // Lọc và sắp xếp danh sách sự kiện
  const filteredEvents = useMemo(() => {
    const currentUserId = user?.id;
    const guestSavedName = typeof window !== 'undefined' ? localStorage.getItem('bm_guest_display_name') : null;
    const uLat = userLocation.lat;
    const uLng = userLocation.lng;

    let list = events.map((ev) => {
      let distanceKm = ev.distanceKm;
      if (distanceKm == null && uLat != null && uLng != null && ev.lat != null && ev.lng != null) {
        distanceKm = calculateDistanceKm(uLat, uLng, ev.lat, ev.lng);
      }
      return { ...ev, distanceKm };
    });

    // Lọc theo Tab
    list = list.filter((ev) => {
      if (activeTab === 'HOSTED') {
        const isHost = (currentUserId && (ev.hostId === currentUserId || ev.host?.id === currentUserId)) ||
          ev.isHost ||
          (guestSavedName && ev.host?.username === guestSavedName);
        if (!isHost) return false;
      } else if (activeTab === 'JOINED') {
        const isJoined = ev.isUserJoined ||
          (currentUserId && ev.participants?.some((p) => p.userId === currentUserId || p.user?.id === currentUserId)) ||
          (guestSavedName && ev.participants?.some((p) => p.user?.username === guestSavedName));
        if (!isJoined) return false;
      }

      // Lọc theo Loại sự kiện
      if (selectedType !== 'ALL' && ev.eventType !== selectedType) {
        return false;
      }

      // Lọc theo Khu vực
      if (selectedCity !== 'ALL') {
        if (selectedCity === 'Online' && ev.city !== 'Online') return false;
        if (selectedCity !== 'Online' && !ev.city?.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }

      // Lọc theo Trạng thái
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'OPEN' && (ev.isFull || ev.status === 'FULL')) return false;
        if (selectedStatus === 'FULL' && !ev.isFull && ev.status !== 'FULL') return false;
      }

      // Lọc theo Bán kính GPS
      if (userLocation.isEnabled && selectedRadius !== 'ALL') {
        const radiusNum = parseFloat(selectedRadius);
        if (ev.distanceKm == null || ev.distanceKm > radiusNum) {
          return false;
        }
      }

      // Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = ev.title?.toLowerCase().includes(q);
        const matchGame = (ev.customGameName || ev.game?.name || '').toLowerCase().includes(q);
        const matchLocation = ev.location?.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchGame && !matchLocation && !matchDesc) {
          return false;
        }
      }

      return true;
    });

    // Nếu đã bật GPS, sắp xếp sự kiện gần nhất lên đầu
    if (userLocation.isEnabled) {
      list.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return list;
  }, [events, activeTab, selectedType, selectedCity, selectedStatus, selectedRadius, searchQuery, userLocation, user?.id]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const openCount = events.filter((e) => !e.isFull && e.status !== 'FULL').length;
    const totalParticipants = events.reduce((sum, e) => sum + (e.participants?.length || e.joinedCount || 0), 0);
    const uniqueVenues = new Set(events.map((e) => e.location)).size;

    return {
      openCount,
      totalParticipants,
      uniqueVenues: Math.max(uniqueVenues, 5),
    };
  }, [events]);

  const activeTabTitle = activeTab === 'ALL'
    ? (isEn ? 'All Events' : 'Tất cả kèo')
    : activeTab === 'HOSTED'
      ? (isEn ? 'Hosted by Me' : 'Kèo tôi tạo')
      : (isEn ? 'Events I Joined' : 'Kèo tôi tham gia');

  return (
    <div className="min-h-screen bg-surface text-on-surface pt-24 pb-20 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-sm window-border window-shadow text-xs font-bold flex items-center gap-2 ${
              toastMessage.type === 'error'
                ? 'bg-rose-500 text-white'
                : 'bg-tertiary text-on-tertiary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {toastMessage.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toastMessage.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Integrated Retro Window (Cố định kích thước, không co giãn nhảy layout) */}
      <div className="window-border window-shadow bg-surface-bright rounded-sm overflow-hidden mb-8">
        {/* Retro Title Bar với Title cố định cấu trúc */}
        <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex items-center justify-between text-xs font-mono select-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-primary text-[17px] shrink-0">
              casino
            </span>
            <span className="font-bold tracking-wider uppercase text-on-surface truncate">
              events.exe :: [{activeTabTitle}] {userLocation.isEnabled ? '📍 [GPS ON]' : ''} — {filteredEvents.length} {isEn ? 'items' : 'kèo'}
            </span>
          </div>

          {/* Retro Window Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsHeroExpanded(!isHeroExpanded)}
              title={isHeroExpanded ? 'Thu gọn banner' : 'Mở rộng banner'}
              className="w-5 h-5 flex items-center justify-center border border-on-surface hover:bg-surface-container-highest rounded-xs font-bold text-[10px] cursor-pointer"
            >
              {isHeroExpanded ? '—' : '▢'}
            </button>
            <div className="w-2.5 h-2.5 rounded-full border border-on-surface bg-primary"></div>
          </div>
        </div>

        {/* Hero Banner Section (Cố định chiều cao và bố cục) */}
        {isHeroExpanded && (
          <div>
            <div className="p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-br from-surface-container-low via-surface-bright to-tertiary-container/30 min-h-[160px]">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-[15px]">campaign</span>
                  <span>{t.badge}</span>
                </div>

                <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-tight">
                  {t.title}
                </h1>

                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed line-clamp-2">
                  {t.subtitle}
                </p>
              </div>

              {/* Primary Action Button: Lên Kèo */}
              <div className="shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleOpenCreateEvent}
                  className="w-full md:w-auto px-6 py-3.5 text-sm sm:text-base font-bold rounded-sm border-2 border-on-surface bg-tertiary hover:bg-tertiary-dim text-on-tertiary hover:text-white window-shadow active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <span className="material-symbols-outlined text-xl">add_circle</span>
                  <span>{t.createBtn}</span>
                </button>
              </div>
            </div>

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-3 border-t-2 border-outline/20 bg-surface-container/50 divide-x-2 divide-outline/20 text-center py-2.5 text-xs sm:text-sm">
                <div>
                  <div className="text-base sm:text-lg font-bold font-headline text-primary">
                    {stats.openCount}
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-medium">
                    {t.stats.openMatches}
                  </div>
                </div>

                <div>
                  <div className="text-base sm:text-lg font-bold font-headline text-on-surface">
                    {stats.totalParticipants}+
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-medium">
                    {t.stats.playersJoining}
                  </div>
                </div>

                <div>
                  <div className="text-base sm:text-lg font-bold font-headline text-secondary">
                    {stats.uniqueVenues}+
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-medium">
                    {t.stats.popularPlaces}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Integrated Navigation Tabs Bar */}
        <div className="p-3 sm:p-4 bg-surface-container-low border-t-2 border-outline/20 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs: Tất cả | Kèo tôi tạo | Kèo tôi tham gia */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { key: 'ALL', label: t.tabs.all, count: tabCounts.all, icon: 'grid_view' },
              { key: 'HOSTED', label: t.tabs.myHosted, count: tabCounts.hosted, icon: 'shield_person' },
              { key: 'JOINED', label: t.tabs.myJoined, count: tabCounts.joined, icon: 'how_to_reg' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold rounded-sm border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-on-surface bg-tertiary text-on-tertiary window-shadow'
                    : 'border-outline/25 bg-surface text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-xs text-[11px] font-mono ${
                  activeTab === tab.key
                    ? 'bg-on-tertiary/15 text-on-tertiary font-bold'
                    : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[17px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface-bright text-on-surface outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-outline hover:text-on-surface"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters & GPS Toolbar */}
        <div className="px-3 sm:px-4 py-2.5 bg-surface-container/40 border-t border-outline/15 flex flex-wrap items-center gap-2 text-xs">
          {/* Nút Bật/Tắt Định Vị GPS Tìm Kèo Gần Đây */}
          <button
            type="button"
            onClick={handleToggleGPS}
            disabled={userLocation.isLocating}
            className={`px-3 py-1.5 rounded-sm border-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              userLocation.isEnabled
                ? 'border-emerald-600 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : userLocation.isLocating
                  ? 'border-outline/30 bg-surface text-outline'
                  : 'border-outline/40 bg-surface hover:bg-surface-container text-on-surface'
            }`}
          >
            {userLocation.isLocating ? (
              <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
            ) : (
              <span className={`material-symbols-outlined text-[15px] ${userLocation.isEnabled ? 'text-emerald-600' : 'text-primary'}`}>
                {userLocation.isEnabled ? 'my_location' : 'near_me'}
              </span>
            )}
            <span>
              {userLocation.isLocating
                ? t.gpsLocating
                : userLocation.isEnabled
                  ? t.gpsActive
                  : t.gpsNearMe}
            </span>
          </button>

          {/* Dropdown Bán Kính GPS (Chỉ hiện khi đã bật GPS) */}
          {userLocation.isEnabled && (
            <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-sm border border-emerald-500/40 animate-fadeIn">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">radar</span>
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(e.target.value)}
                aria-label={t.filterRadius}
                className="bg-transparent font-semibold text-on-surface outline-hidden cursor-pointer"
              >
                <option value="ALL">{t.radiusAll}</option>
                <option value="5">{t.radius5}</option>
                <option value="10">{t.radius10}</option>
                <option value="25">{t.radius25}</option>
                <option value="50">{t.radius50}</option>
              </select>
            </div>
          )}

          {/* Filter Type */}
          <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-sm border border-outline/30">
            <span className="material-symbols-outlined text-[15px] text-outline">category</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label={t.filterType}
              className="bg-transparent font-semibold text-on-surface outline-hidden cursor-pointer"
            >
              <option value="ALL">{t.allTypes}</option>
              <option value="CASUAL">{t.types.CASUAL}</option>
              <option value="TOURNAMENT">{t.types.TOURNAMENT}</option>
              <option value="WORKSHOP">{t.types.WORKSHOP}</option>
              <option value="NIGHT">{t.types.NIGHT}</option>
            </select>
          </div>

          {/* Filter City */}
          <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-sm border border-outline/30">
            <span className="material-symbols-outlined text-[15px] text-outline">location_city</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              aria-label={t.filterCity}
              className="bg-transparent font-semibold text-on-surface outline-hidden cursor-pointer"
            >
              <option value="ALL">{t.allCities}</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Online">Online / Discord</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-sm border border-outline/30">
            <span className="material-symbols-outlined text-[15px] text-outline">tune</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label={t.filterStatus}
              className="bg-transparent font-semibold text-on-surface outline-hidden cursor-pointer"
            >
              <option value="ALL">{t.allStatuses}</option>
              <option value="OPEN">{t.statuses.OPEN}</option>
              <option value="FULL">{t.statuses.FULL}</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedType !== 'ALL' || selectedCity !== 'ALL' || selectedStatus !== 'ALL' || selectedRadius !== 'ALL' || searchQuery || userLocation.isEnabled) && (
            <button
              type="button"
              onClick={() => {
                setSelectedType('ALL');
                setSelectedCity('ALL');
                setSelectedStatus('ALL');
                setSelectedRadius('ALL');
                setSearchQuery('');
                if (userLocation.isEnabled) {
                  setUserLocation({ lat: null, lng: null, isEnabled: false, isLocating: false, error: null });
                }
              }}
              className="px-2 py-1 text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              <span>{isEn ? 'Reset' : 'Xóa lọc'}</span>
            </button>
          )}

          <div className="ml-auto text-xs text-on-surface-variant font-medium">
            {isEn ? `Showing ${filteredEvents.length} events` : `Hiển thị ${filteredEvents.length} kèo`}
          </div>
        </div>
      </div>

      {/* Events Grid / Empty State Container (Cố định chiều rộng và layout ổn định) */}
      {isLoading ? (
        <div className="w-full min-h-[380px] py-20 flex flex-col items-center justify-center gap-3 window-border window-shadow bg-surface-bright rounded-sm">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
          <span className="text-sm font-semibold text-on-surface-variant font-mono">
            {isEn ? 'Loading events...' : 'Đang tải danh sách kèo...'}
          </span>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[380px] items-start">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={user?.id}
              language={language}
              onViewDetails={(ev) => setSelectedEventForDetails(ev)}
              onJoin={(ev) => handleOpenQuickJoin(ev)}
              onLeave={(id) => handleLeaveEvent(id)}
            />
          ))}
        </div>
      ) : (
        /* Empty State Full-Width Solid Window */
        <div className="w-full min-h-[380px] window-border window-shadow bg-surface-bright rounded-sm p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline text-3xl border border-outline/30">
            🎲
          </div>
          <div>
            <h3 className="font-headline font-bold text-xl text-on-surface">
              {activeTab === 'HOSTED'
                ? (isEn ? 'You haven\'t hosted any events yet' : 'Bạn chưa tạo kèo sự kiện nào')
                : activeTab === 'JOINED'
                  ? (isEn ? 'You haven\'t joined any events yet' : 'Bạn chưa tham gia kèo nào')
                  : userLocation.isEnabled && selectedRadius !== 'ALL'
                    ? (isEn ? `No events found within ${selectedRadius} km` : `Không có kèo nào trong bán kính ${selectedRadius} km`)
                    : t.empty.title}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed max-w-md mx-auto">
              {activeTab === 'HOSTED'
                ? (isEn ? 'Create your first session and invite fellow boardgamers!' : 'Hãy lên kèo đầu tiên để rủ bạn bè và cộng đồng cùng tham gia!')
                : activeTab === 'JOINED'
                  ? (isEn ? 'Browse the All Events tab and pick a fun match to join!' : 'Hãy chuyển sang tab Tất cả sự kiện và chọn một kèo hấp dẫn để tham gia ngay nhé!')
                  : userLocation.isEnabled
                    ? (isEn ? 'Try increasing your search radius or view all events.' : 'Hãy thử tăng bán kính tìm kiếm hoặc xem tất cả khu vực.')
                    : t.empty.desc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selectedRadius !== 'ALL') {
                setSelectedRadius('ALL');
              } else if (activeTab !== 'ALL') {
                setActiveTab('ALL');
              } else {
                handleOpenCreateEvent();
              }
            }}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-sm border-2 border-on-surface bg-tertiary hover:bg-tertiary-dim text-on-tertiary window-shadow active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
          >
            <span className="material-symbols-outlined text-[17px]">
              {selectedRadius !== 'ALL' ? 'radar' : activeTab !== 'ALL' ? 'grid_view' : 'add_circle'}
            </span>
            <span>
              {selectedRadius !== 'ALL'
                ? (isEn ? 'Expand Radius' : 'Mở rộng bán kính')
                : activeTab !== 'ALL'
                  ? (isEn ? 'View All Events' : 'Xem Tất Cả Kèo')
                  : t.empty.createFirst}
            </span>
          </button>
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateEvent}
        language={language}
        user={user}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEventForDetails}
        isOpen={!!selectedEventForDetails}
        onClose={() => setSelectedEventForDetails(null)}
        currentUserId={user?.id}
        language={language}
        onJoin={(ev) => {
          setSelectedEventForDetails(null);
          handleOpenQuickJoin(ev);
        }}
        onLeave={handleLeaveEvent}
        onCancelEvent={handleCancelEvent}
      />

      {/* Quick Join Modal (Nhập tên hiển thị & SĐT/Zalo) */}
      <QuickJoinModal
        isOpen={!!eventForQuickJoin}
        event={eventForQuickJoin}
        user={user}
        language={language}
        onClose={() => setEventForQuickJoin(null)}
        onConfirmJoin={handleConfirmJoinEvent}
      />

      {/* Login Required Prompt Modal */}
      <AnimatePresence>
        {isLoginPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="window-border window-shadow bg-surface-bright w-full max-w-md rounded-sm overflow-hidden flex flex-col font-sans"
            >
              <div className="retro-title-bar bg-surface-container-high px-4 py-2 flex items-center justify-between font-mono text-xs select-none">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[17px]">lock</span>
                  <span className="font-bold tracking-wider text-on-surface uppercase">
                    {isEn ? 'login_required.exe' : 'yeu_cau_dang_nhap.exe'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLoginPromptOpen(false)}
                  className="w-5 h-5 flex items-center justify-center border border-on-surface hover:bg-rose-500 hover:text-white font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary text-3xl mx-auto">
                  🔐
                </div>
                <div>
                  <h3 className="font-headline font-bold text-xl text-on-surface">
                    {isEn ? 'Login Required to Host an Event' : 'Vui Lòng Đăng Nhập Để Lên Kèo'}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                    {isEn
                      ? 'Only registered and logged-in members can host and manage game sessions. Please log in or create an account to get started!'
                      : 'Tính năng tạo và lên kèo sự kiện chỉ dành cho thành viên đã đăng nhập tài khoản BoardMates. Vui lòng đăng nhập để tiếp tục!'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLoginPromptOpen(false)}
                    className="px-4 py-2 text-xs font-bold border-2 border-on-surface rounded-sm bg-surface hover:bg-surface-container text-on-surface cursor-pointer"
                  >
                    {isEn ? 'Close' : 'Đóng'}
                  </button>
                  <a
                    href="/login"
                    className="px-5 py-2 text-xs font-bold border-2 border-on-surface rounded-sm bg-tertiary hover:bg-tertiary-dim text-on-tertiary shadow-xs flex items-center gap-1.5 cursor-pointer font-sans"
                  >
                    <span className="material-symbols-outlined text-[16px]">login</span>
                    <span>{isEn ? 'Log In Now' : 'Đăng Nhập Ngay'}</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
