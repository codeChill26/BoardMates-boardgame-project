'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getBackendUrl } from '@/lib/apiConfig';

export default function UsersManager({ token, language = 'vi', currentUserId }) {
  const isEn = language === 'en';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const showFeedback = (msg, type = 'success') => {
    setFeedbackMsg({ text: msg, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: search.trim(),
      });
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${getBackendUrl()}/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setUsers(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
      showFeedback('Không thể tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    if (!window.confirm(isEn ? `Are you sure you want to set status to ${newStatus} for ${user.username}?` : `Bạn có chắc muốn ${newStatus === 'BANNED' ? 'KHÓA' : 'MỞ KHÓA'} tài khoản ${user.username}?`)) {
      return;
    }

    try {
      setActionBusyId(user.id);
      const res = await fetch(`${getBackendUrl()}/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        showFeedback(json.message || 'Cập nhật trạng thái thành công');
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
      } else {
        showFeedback(json?.message || 'Thao tác thất bại', 'error');
      }
    } catch (err) {
      showFeedback(err.message || 'Lỗi kết nối máy chủ', 'error');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(isEn ? `Are you sure you want to change role to ${newRole} for ${user.username}?` : `Bạn có chắc muốn đổi quyền thành ${newRole} cho ${user.username}?`)) {
      return;
    }

    try {
      setActionBusyId(user.id);
      const res = await fetch(`${getBackendUrl()}/api/admin/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        showFeedback(json.message || 'Cập nhật role thành công');
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      } else {
        showFeedback(json?.message || 'Thao tác thất bại', 'error');
      }
    } catch (err) {
      showFeedback(err.message || 'Lỗi kết nối máy chủ', 'error');
    } finally {
      setActionBusyId(null);
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
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder={isEn ? 'Search by username or email...' : 'Tìm theo tên hoặc email...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-bright border border-outline/30 rounded-xs focus:outline-none focus:border-primary text-on-surface"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-surface-bright border border-outline/30 rounded-xs text-on-surface font-semibold focus:outline-none"
          >
            <option value="">{isEn ? 'All Roles' : 'Tất cả vai trò'}</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
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
            <option value="ACTIVE">{isEn ? 'Active' : 'Hoạt động'}</option>
            <option value="BANNED">{isEn ? 'Banned' : 'Đã khóa'}</option>
          </select>
        </div>
      </div>

      {/* Retro Table Container */}
      <div className="overflow-x-auto rounded-sm border border-outline/20 bg-surface-bright">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-high border-b border-outline/20 font-mono text-[11px] uppercase tracking-wider text-outline select-none">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-center">Kèo tạo / Tham gia</th>
              <th className="p-3">Ngày tham gia</th>
              <th className="p-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10 font-sans">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-outline">
                  <span className="material-symbols-outlined text-2xl animate-spin text-primary">progress_activity</span>
                  <p className="mt-1 text-xs">{isEn ? 'Loading users...' : 'Đang tải danh sách thành viên...'}</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-outline">
                  {isEn ? 'No users found matching criteria.' : 'Không tìm thấy người dùng nào phù hợp.'}
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUserId;
                const isBusy = actionBusyId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username)}`}
                          alt={u.username}
                          className="w-8 h-8 rounded-full object-cover border border-outline/30 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-on-surface flex items-center gap-1">
                            <span>{u.username}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-primary/15 text-primary font-bold px-1 rounded">Bạn</span>
                            )}
                          </div>
                          <div className="text-[10px] text-outline font-mono">ID: #{u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-on-surface-variant">{u.email}</td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/40'
                          : 'bg-surface-container text-on-surface-variant border-outline/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40'
                      }`}>
                        {u.status === 'ACTIVE' ? (isEn ? 'ACTIVE' : 'HOẠT ĐỘNG') : (isEn ? 'BANNED' : 'BỊ KHÓA')}
                      </span>
                    </td>

                    <td className="p-3 text-center font-mono">
                      <span className="text-primary font-bold">{u._count?.hostedEvents || 0}</span>
                      <span className="text-outline"> / </span>
                      <span className="text-tertiary font-bold">{u._count?.eventParticipations || 0}</span>
                    </td>

                    <td className="p-3 text-[11px] text-outline font-mono">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Toggle Ban Button */}
                        <button
                          type="button"
                          disabled={isSelf || isBusy}
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                            u.status === 'ACTIVE'
                              ? 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              : 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? (isEn ? 'Ban' : 'Khóa') : (isEn ? 'Unban' : 'Mở')}
                        </button>

                        {/* Toggle Role Button */}
                        <button
                          type="button"
                          disabled={isSelf || isBusy}
                          onClick={() => handleToggleRole(u)}
                          title={u.role === 'ADMIN' ? 'Hạ quyền xuống User' : 'Thăng cấp lên Admin'}
                          className="px-2 py-1 rounded text-[11px] font-bold border border-outline/30 bg-surface-container hover:bg-primary hover:text-white text-on-surface transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                        </button>
                      </div>
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
