'use client';

import React from 'react';
import { teams } from '@/data/teams';
import { getBackendUrl } from '@/lib/apiConfig';

const getAPI = () => `${getBackendUrl()}/api/positions`;

// Trang quan tri AN — dat o duong dan kho doan, khong link tu dau, khong co navbar.
// Bat/tat tung vi tri tuyen dung. Can nhap khoa quan tri (khop ADMIN_SECRET o backend).
export default function ConsolePage() {
  const [status, setStatus] = React.useState(null); // { slug: { isOpen, headcount } }
  const [key, setKey] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState('');
  // So luong dang go, chua luu. Khong co key trong day = dang khop voi server.
  const [drafts, setDrafts] = React.useState({});

  // Nho khoa trong phien cho tien
  React.useEffect(() => {
    const saved = sessionStorage.getItem('bm_admin_key');
    if (saved) setKey(saved);
  }, []);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(getAPI());
      const json = await res.json();
      setStatus(json.data || {});
      setMsg('');
    } catch (e) {
      setMsg(`Không kết nối được backend (${getBackendUrl()}). Hãy chạy backend trước.`);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Gui mot phan trang thai. Truong khong gui thi backend giu nguyen gia tri cu.
  const patch = async (slug, body) => {
    setBusy(slug);
    setMsg('');
    try {
      const res = await fetch(`${getAPI()}/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setMsg(res.status === 401 ? 'Sai khoá quản trị.' : (json?.message || 'Lỗi cập nhật.'));
        return false;
      }
      sessionStorage.setItem('bm_admin_key', key);
      setStatus(json.data);
      return true;
    } catch (e) {
      setMsg('Không kết nối được backend.');
      return false;
    } finally {
      setBusy('');
    }
  };

  const toggle = (slug, nextOpen) => patch(slug, { isOpen: nextOpen });

  // Số hiện đang có hiệu lực: ghi đè từ server, không có thì lấy mặc định teams.js.
  const effectiveHeadcount = (team) => status?.[team.slug]?.headcount ?? team.headcount ?? 0;

  const saveHeadcount = async (team) => {
    const raw = drafts[team.slug];
    if (raw === undefined) return;

    // Để trống = xoá ghi đè, quay về số mặc định trong teams.js.
    const next = raw.trim() === '' ? null : Number(raw);
    if (next !== null && (!Number.isInteger(next) || next < 0)) {
      setMsg('Số lượng phải là số nguyên không âm.');
      return;
    }

    const ok = await patch(team.slug, { headcount: next });
    if (!ok) return;

    setDrafts((prev) => {
      const rest = { ...prev };
      delete rest[team.slug];
      return rest;
    });
  };

  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <span className="font-label text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
            console.exe
          </span>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface">
            Quản trị vị trí
          </h1>
          <p className="font-body text-sm text-on-surface-variant">
            Bật/tắt việc nhận ứng tuyển và chỉnh số lượng tuyển cho từng ban. Vị trí
            đã tắt sẽ bị tô xám, dồn xuống cuối và không mở được ở trang Tham gia.
          </p>
          <p className="font-body text-sm text-on-surface-variant">
            Ô <strong>Số lượng</strong> để trống rồi bấm Lưu sẽ xoá ghi đè, quay về số
            mặc định khai báo trong <code className="font-label text-xs">teams.js</code>.
          </p>
        </header>

        {/* Khoa quan tri */}
        <div className="window-border bg-surface-container-low p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant shrink-0">
            Khoá quản trị
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Nhập khoá để bật/tắt"
            className="flex-1 bg-surface-container-high border-b-2 border-outline-variant px-3 py-2 text-on-surface font-body focus:outline-none focus:border-b-primary"
          />
        </div>

        {msg ? (
          <p className="font-body text-sm text-error bg-error-container/10 border-l-4 border-error px-4 py-3 rounded-r-md">
            {msg}
          </p>
        ) : null}

        {loading ? (
          <p className="font-body text-on-surface-variant">Đang tải...</p>
        ) : (
          <ul className="space-y-3">
            {teams.map((team) => {
              const isOpen = status?.[team.slug]?.isOpen !== false;
              const saved = String(effectiveHeadcount(team));
              const draft = drafts[team.slug];
              const dirty = draft !== undefined && draft.trim() !== saved;
              const overridden = status?.[team.slug]?.headcount !== null
                && status?.[team.slug]?.headcount !== undefined;

              return (
                <li
                  key={team.slug}
                  // --team: icon dung dung mau quan cua ban, khop voi the o /join-us
                  // de doi chieu hai trang cho nhanh.
                  style={{ '--team': team.color }}
                  className="window-border bg-surface-container-lowest p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined token-ink text-2xl shrink-0">
                      {team.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-headline text-lg font-bold text-on-surface truncate">
                        {team.name.vi}
                      </p>
                      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {team.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-auto">
                    {/* So luong. De trong roi Luu = xoa ghi de, ve lai so trong teams.js. */}
                    <label className="flex items-center gap-2">
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Số lượng
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={draft !== undefined ? draft : saved}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [team.slug]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveHeadcount(team);
                        }}
                        className={`w-16 bg-surface-container-high border-b-2 px-2 py-1 text-on-surface font-body text-center focus:outline-none focus:border-b-primary ${
                          dirty ? 'border-b-primary' : 'border-b-outline-variant'
                        }`}
                      />
                    </label>

                    {dirty ? (
                      <button
                        type="button"
                        disabled={busy === team.slug}
                        onClick={() => saveHeadcount(team)}
                        className="bg-tertiary text-on-tertiary px-3 py-1.5 rounded-md font-label text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                      >
                        Lưu
                      </button>
                    ) : (
                      <span
                        title={overridden ? 'Đang ghi đè số trong teams.js' : 'Đang dùng số mặc định trong teams.js'}
                        className={`material-symbols-outlined text-base ${
                          overridden ? 'text-primary' : 'text-outline-variant'
                        }`}
                      >
                        {overridden ? 'edit_note' : 'code'}
                      </span>
                    )}

                    <span
                      className={`font-label text-[10px] font-bold uppercase tracking-widest ${
                        isOpen ? 'text-secondary' : 'text-on-surface-variant'
                      }`}
                    >
                      {isOpen ? 'Đang mở' : 'Đã đóng'}
                    </span>
                    <button
                      type="button"
                      disabled={busy === team.slug}
                      onClick={() => toggle(team.slug, !isOpen)}
                      className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
                        isOpen ? 'bg-secondary' : 'bg-outline/40'
                      }`}
                      aria-pressed={isOpen}
                      aria-label={`${isOpen ? 'Đóng' : 'Mở'} vị trí ${team.name.vi}`}
                    >
                      <span
                        className={`absolute top-1 w-6 h-6 rounded-full bg-surface-container-lowest shadow transition-all ${
                          isOpen ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
