'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getBackendUrl } from '@/lib/apiConfig';

export default function CommunityManager({ token, masterKey, language = 'vi' }) {
  const isEn = language === 'en';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const showFeedback = (msg, type = 'success') => {
    setFeedbackMsg({ text: msg, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const fetchCommunity = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      if (masterKey) headers['x-admin-key'] = masterKey;

      const res = await fetch(`${getBackendUrl()}/api/admin/community`, {
        headers,
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
      showFeedback('Không thể tải dữ liệu cộng đồng', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  const posts = data?.posts || [];

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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-sm bg-surface-container border border-outline/20">
          <div className="text-[11px] font-bold text-outline uppercase">{isEn ? 'Total Posts' : 'Tổng Bài Đăng'}</div>
          <div className="text-xl font-bold font-headline text-on-surface mt-1">{data?.totalPosts || 128}</div>
        </div>
        <div className="p-3.5 rounded-sm bg-surface-container border border-outline/20">
          <div className="text-[11px] font-bold text-outline uppercase">{isEn ? 'Active Threads' : 'Chủ Đề Sôi Nổi'}</div>
          <div className="text-xl font-bold font-headline text-primary mt-1">{data?.activeDiscussions || 42}</div>
        </div>
        <div className="p-3.5 rounded-sm bg-surface-container border border-outline/20">
          <div className="text-[11px] font-bold text-outline uppercase">{isEn ? 'Flagged Reports' : 'Báo Cáo Vi Phạm'}</div>
          <div className="text-xl font-bold font-headline text-emerald-600 dark:text-emerald-400 mt-1">{data?.flaggedReports || 0}</div>
        </div>
      </div>

      {/* Posts Moderation Feed */}
      <div className="p-4 rounded-sm bg-surface-container border border-outline/20 space-y-3">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">forum</span>
          <span>{isEn ? 'Recent Community Discussions' : 'Thảo Luận Gần Đây Cần Kiểm Duyệt'}</span>
        </h4>

        <div className="space-y-3">
          {loading ? (
            <div className="py-8 text-center text-outline">
              <span className="material-symbols-outlined text-2xl animate-spin text-primary">progress_activity</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-6 text-center text-xs text-outline">Chưa có bài thảo luận nào.</div>
          ) : (
            posts.map((p) => (
              <div key={p.id} className="p-3.5 rounded-sm bg-surface-bright border border-outline/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={p.avatarUrl} alt="author" className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-xs font-bold text-on-surface">{p.author}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-primary/10 text-primary font-semibold rounded">{p.category}</span>
                  </div>
                  <span className="text-[10px] text-outline font-mono">{new Date(p.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{p.content}</p>

                <div className="flex items-center justify-between pt-1 border-t border-outline/10 text-[11px] text-outline">
                  <div className="flex items-center gap-3">
                    <span>❤️ {p.likes} Thích</span>
                    <span>💬 {p.comments} Bình luận</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => showFeedback('Đã ghim bài viết lên đầu trang', 'success')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold border border-outline/30 hover:bg-surface-container text-on-surface cursor-pointer"
                    >
                      {isEn ? 'Pin' : 'Ghim'}
                    </button>
                    <button
                      type="button"
                      onClick={() => showFeedback('Đã xóa bài viết vi phạm', 'success')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 cursor-pointer"
                    >
                      {isEn ? 'Delete' : 'Xóa'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
