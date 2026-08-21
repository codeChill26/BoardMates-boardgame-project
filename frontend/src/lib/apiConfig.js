// Base Backend URLs
const FALLBACK_DEPLOY_URL = 'https://board-mates-boardgame-project-v45x-ax6pwse1m.vercel.app';
const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:8080';
const DEPLOY_URL = process.env.DEPLOY_URL || FALLBACK_DEPLOY_URL;

let backendUrl = LOCAL_URL || DEPLOY_URL;

// Normalize trailing slash
if (backendUrl && backendUrl.endsWith('/')) {
  backendUrl = backendUrl.slice(0, -1);
}

if (typeof window !== 'undefined') {
  const isHttps = window.location.protocol === 'https:';
  const isLocalConfig = backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1');

  if (isHttps) {
    // Khi chạy trên domain HTTPS (Vercel Production), trình duyệt chặn HTTP mixed-content sang localhost.
    // Bắt buộc dùng backend HTTPS đã deploy trên Vercel.
    backendUrl = DEPLOY_URL;
  } else if (isLocalConfig) {
    // Đọc trạng thái cache từ localStorage để tránh độ trễ ở request đầu
    const cachedStatus = window.localStorage.getItem('bm_backend_local_running');
    if (cachedStatus === 'false') {
      backendUrl = DEPLOY_URL;
    } else {
      backendUrl = LOCAL_URL;
    }

    // Ping thử backend local (endpoint /api) để tự động chuyển sang Vercel nếu backend local tắt
    fetch(`${LOCAL_URL}/api`, { method: 'GET', mode: 'cors' })
      .then((res) => {
        if (res.ok) {
          window.localStorage.setItem('bm_backend_local_running', 'true');
          backendUrl = LOCAL_URL;
        } else {
          window.localStorage.setItem('bm_backend_local_running', 'false');
          backendUrl = DEPLOY_URL;
        }
      })
      .catch(() => {
        // Backend local không bật -> Tự động chuyển sang Vercel
        window.localStorage.setItem('bm_backend_local_running', 'false');
        backendUrl = DEPLOY_URL;
      });
  }
}

export function getBackendUrl() {
  return backendUrl || DEPLOY_URL;
}
