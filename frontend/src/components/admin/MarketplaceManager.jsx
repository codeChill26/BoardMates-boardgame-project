'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getBackendUrl } from '@/lib/apiConfig';

export default function MarketplaceManager({ token, masterKey, language = 'vi' }) {
  const isEn = language === 'en';
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const showFeedback = (msg, type = 'success') => {
    setFeedbackMsg({ text: msg, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const getHeaders = useCallback(() => {
    const headers = { Authorization: `Bearer ${token}` };
    if (masterKey) headers['x-admin-key'] = masterKey;
    return headers;
  }, [token, masterKey]);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: search.trim(),
      });
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${getBackendUrl()}/api/admin/marketplace?${params.toString()}`, {
        headers: getHeaders(),
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setListings(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
      showFeedback('Không thể tải danh sách tin rao vặt', 'error');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, search, typeFilter, statusFilter, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleUpdateStatus = async (listingId, newStatus) => {
    try {
      setBusyId(listingId);
      const res = await fetch(`${getBackendUrl()}/api/admin/marketplace/${listingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        showFeedback(json.message || 'Cập nhật tin đăng thành công');
        setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l)));
      } else {
        showFeedback(json?.message || 'Thao tác thất bại', 'error');
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

      {/* Filter Bar */}
      <div className="p-3.5 rounded-sm bg-surface-container border border-outline/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder={isEn ? 'Search game or description...' : 'Tìm tựa game hoặc mô tả...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-bright border border-outline/30 rounded-xs focus:outline-none focus:border-primary text-on-surface"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-surface-bright border border-outline/30 rounded-xs text-on-surface font-semibold focus:outline-none"
          >
            <option value="">{isEn ? 'All Types' : 'Tất cả loại tin'}</option>
            <option value="SELL">{isEn ? 'Sell' : 'Bán lại'}</option>
            <option value="RENT">{isEn ? 'Rent' : 'Cho thuê'}</option>
            <option value="EXCHANGE">{isEn ? 'Exchange' : 'Trao đổi'}</option>
          </select>

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
            <option value="ACTIVE">{isEn ? 'Active' : 'Đang bán'}</option>
            <option value="SOLD">{isEn ? 'Sold' : 'Đã bán'}</option>
            <option value="HIDDEN">{isEn ? 'Hidden' : 'Đã ẩn'}</option>
          </select>
        </div>
      </div>

      {/* Listings Table */}
      <div className="overflow-x-auto rounded-sm border border-outline/20 bg-surface-bright">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-high border-b border-outline/20 font-mono text-[11px] uppercase tracking-wider text-outline select-none">
            <tr>
              <th className="p-3">Board Game</th>
              <th className="p-3">Người bán</th>
              <th className="p-3">Loại tin</th>
              <th className="p-3">Giá tiền</th>
              <th className="p-3">Tình trạng</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10 font-sans">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-outline">
                  <span className="material-symbols-outlined text-2xl animate-spin text-primary">progress_activity</span>
                  <p className="mt-1 text-xs">{isEn ? 'Loading listings...' : 'Đang tải danh sách tin...'}</p>
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-outline">
                  {isEn ? 'No marketplace listings found.' : 'Chưa có tin rao vặt nào phù hợp.'}
                </td>
              </tr>
            ) : (
              listings.map((l) => {
                const isBusy = busyId === l.id;

                return (
                  <tr key={l.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={l.game?.imageUrl || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=150&q=80'}
                          alt={l.game?.name}
                          className="w-9 h-9 rounded-xs object-cover border border-outline/20 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-on-surface line-clamp-1">{l.game?.name || 'Board Game'}</div>
                          <div className="text-[10px] text-outline font-mono">ID: #{l.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-on-surface-variant font-medium">
                      {l.user?.username || 'Thành viên'}
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        l.type === 'SELL'
                          ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/40'
                          : l.type === 'RENT'
                            ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/40'
                            : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                      }`}>
                        {l.type}
                      </span>
                    </td>

                    <td className="p-3 font-mono font-bold text-primary">
                      {l.price ? `${Number(l.price).toLocaleString('vi-VN')} đ` : l.rentPrice ? `${Number(l.rentPrice).toLocaleString('vi-VN')} đ/ngày` : 'Thương lượng'}
                    </td>

                    <td className="p-3 text-on-surface-variant text-[11px]">
                      {l.condition || '95% Like New'}
                    </td>

                    <td className="p-3">
                      <select
                        disabled={isBusy}
                        value={l.status}
                        onChange={(e) => handleUpdateStatus(l.id, e.target.value)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded border border-outline/30 bg-surface-container text-on-surface focus:outline-none cursor-pointer"
                      >
                        <option value="ACTIVE">{isEn ? 'ACTIVE' : 'ĐANG BÁN'}</option>
                        <option value="SOLD">{isEn ? 'SOLD' : 'ĐÃ BÁN'}</option>
                        <option value="HIDDEN">{isEn ? 'HIDDEN' : 'ẨN TIN'}</option>
                      </select>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleUpdateStatus(l.id, l.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN')}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                          l.status === 'HIDDEN'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
                            : 'border-rose-500/40 bg-rose-500/10 text-rose-700'
                        }`}
                      >
                        {l.status === 'HIDDEN' ? (isEn ? 'Show' : 'Hiện') : (isEn ? 'Hide' : 'Ẩn')}
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
