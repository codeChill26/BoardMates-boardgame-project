'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getBackendUrl } from '@/lib/apiConfig';

export default function EventsManager({ token, language = 'vi' }) {
  const isEn = language === 'en';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const showFeedback = (msg, type = 'success') => {
    setFeedbackMsg({ text: msg, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: search.trim(),
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${getBackendUrl()}/api/admin/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setEvents(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
      showFeedback('Không thể tải danh sách sự kiện', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleUpdateStatus = async (eventId, newStatus) => {
    try {
      setBusyId(eventId);
      const res = await fetch(`${getBackendUrl()}/api/admin/events/${eventId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        showFeedback(json.message || 'Cập nhật trạng thái sự kiện thành công');
        setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus } : ev)));
      } else {
        showFeedback(json?.message || 'Thao tác thất bại', 'error');
      }
    } catch (err) {
      showFeedback(err.message || 'Lỗi kết nối máy chủ', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(isEn ? `Are you sure you want to delete event "${title}"?` : `Bạn có chắc muốn XÓA sự kiện "${title}"?`)) {
      return;
    }

    try {
      setBusyId(eventId);
      const res = await fetch(`${getBackendUrl()}/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        showFeedback(json.message || 'Đã xóa sự kiện thành công');
        setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      } else {
        showFeedback(json?.message || 'Thao tác xóa thất bại', 'error');
      }
    } catch (err) {
      showFeedback(err.message || 'Lỗi kết nối máy chủ', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className={`p-3 rounded-sm text-xs font-bold flex items-center gap-2 border ${
          feedbackMsg.type === 'error'
            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
        }`}>
          <span className="material-symbols-outlined text-[16px]">
            {feedbackMsg.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-sm bg-surface-container border border-outline/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder={isEn ? 'Search title, venue or game...' : 'Tìm tiêu đề, địa điểm hoặc game...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-bright border border-outline/30 rounded-xs focus:outline-none focus:border-primary text-on-surface"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-surface-bright border border-outline/30 rounded-xs text-on-surface font-semibold focus:outline-none"
          >
            <option value="">{isEn ? 'All Status' : 'Tất cả trạng thái'}</option>
            <option value="OPEN">{isEn ? 'Open' : 'Đang mở'}</option>
            <option value="FULL">{isEn ? 'Full' : 'Đã đủ'}</option>
            <option value="ONGOING">{isEn ? 'Ongoing' : 'Đang diễn ra'}</option>
            <option value="COMPLETED">{isEn ? 'Completed' : 'Đã xong'}</option>
            <option value="CANCELLED">{isEn ? 'Cancelled' : 'Đã hủy'}</option>
          </select>
        </div>
      </div>

      {/* Events Table Container */}
      <div className="overflow-x-auto rounded-sm border border-outline/20 bg-surface-bright">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-high border-b border-outline/20 font-mono text-[11px] uppercase tracking-wider text-outline select-none">
            <tr>
              <th className="p-3">Sự kiện & Game</th>
              <th className="p-3">Chủ Kèo (Host)</th>
              <th className="p-3">Địa điểm / Quán</th>
              <th className="p-3 text-center">Thành viên</th>
              <th className="p-3">Thời gian</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10 font-sans">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-outline">
                  <span className="material-symbols-outlined text-2xl animate-spin text-primary">progress_activity</span>
                  <p className="mt-1 text-xs">{isEn ? 'Loading events...' : 'Đang tải danh sách sự kiện...'}</p>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-outline">
                  {isEn ? 'No events found.' : 'Không tìm thấy sự kiện nào.'}
                </td>
              </tr>
            ) : (
              events.map((ev) => {
                const isBusy = busyId === ev.id;
                const joined = ev.participants?.length || 0;
                const max = ev.maxParticipants || 4;

                return (
                  <tr key={ev.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="p-3 max-w-[260px]">
                      <div className="font-bold text-on-surface line-clamp-1">{ev.title}</div>
                      <div className="text-[10px] text-primary font-semibold truncate mt-0.5">
                        🎲 {ev.customGameName || ev.game?.name || 'Board Game'}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={ev.host?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(ev.host?.username || 'Host')}`}
                          alt="Host"
                          className="w-6 h-6 rounded-full object-cover border border-outline/30"
                        />
                        <span className="font-medium text-on-surface truncate">{ev.host?.username || 'Ẩn danh'}</span>
                      </div>
                    </td>

                    <td className="p-3 text-on-surface-variant max-w-[180px] truncate">
                      <div>{ev.location}</div>
                      <div className="text-[10px] text-outline truncate">{ev.address || ev.city}</div>
                    </td>

                    <td className="p-3 text-center font-mono">
                      <span className="font-bold text-primary">{joined}</span>
                      <span className="text-outline"> / {max}</span>
                    </td>

                    <td className="p-3 text-[11px] text-outline font-mono whitespace-nowrap">
                      {new Date(ev.startDate).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="p-3">
                      <select
                        disabled={isBusy}
                        value={ev.status}
                        onChange={(e) => handleUpdateStatus(ev.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${
                          ev.status === 'OPEN'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                            : ev.status === 'FULL'
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                              : ev.status === 'CANCELLED'
                                ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40'
                                : 'bg-surface-container text-on-surface border-outline/30'
                        }`}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="FULL">FULL</option>
                        <option value="ONGOING">ONGOING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        className="px-2 py-1 rounded text-[11px] font-bold border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer disabled:opacity-30"
                      >
                        {isEn ? 'Delete' : 'Xóa'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-outline font-mono">
            {isEn ? `Page ${page} of ${totalPages}` : `Trang ${page} / ${totalPages}`}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 text-xs font-bold border border-outline/30 rounded-xs bg-surface-container hover:bg-surface-container-high disabled:opacity-40 cursor-pointer"
            >
              {isEn ? 'Previous' : 'Trang trước'}
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 text-xs font-bold border border-outline/30 rounded-xs bg-surface-container hover:bg-surface-container-high disabled:opacity-40 cursor-pointer"
            >
              {isEn ? 'Next' : 'Trang sau'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
