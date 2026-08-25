// Base Backend URLs
const FALLBACK_DEPLOY_URL = 'https://board-mates-boardgame-project-v45x.vercel.app';
const LOCAL_URL = process.env.NEXT_PUBLIC_LOCAL_URL || process.env.LOCAL_URL || 'http://localhost:8080';
const DEPLOY_URL = process.env.NEXT_PUBLIC_DEPLOY_URL || process.env.DEPLOY_URL || FALLBACK_DEPLOY_URL;

let backendUrl = LOCAL_URL || DEPLOY_URL;

// Normalize trailing slash
if (backendUrl && backendUrl.endsWith('/')) {
  backendUrl = backendUrl.slice(0, -1);
}

if (typeof window !== 'undefined') {
  const isHttps = window.location.protocol === 'https:';
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isHttps) {
    // Khi chạy trên domain HTTPS (Vercel Production)
    backendUrl = DEPLOY_URL;
  } else if (isLocalHost) {
    // Khi chạy trên máy local, luôn ưu tiên kết nối Backend Node.js localhost:8080
    backendUrl = LOCAL_URL;
    window.localStorage.setItem('bm_backend_local_running', 'true');
  } else {
    backendUrl = LOCAL_URL || DEPLOY_URL;
  }
}

export function getBackendUrl() {
  return backendUrl || DEPLOY_URL;
}
