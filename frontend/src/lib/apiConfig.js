const LOCAL_URL = 'http://localhost:8080';
const DEPLOY_URL = 'https://boardmates-boardgame-project.onrender.com';

// 1. Get base url from env variable if available (exposed via next.config.mjs env)
const ENV_BACKEND_URL = process.env.BACKEND_URL;

let backendUrl = ENV_BACKEND_URL || LOCAL_URL;

// Normalize trailing slash
if (backendUrl.endsWith('/')) {
  backendUrl = backendUrl.slice(0, -1);
}

if (typeof window !== 'undefined') {
  const isHttps = window.location.protocol === 'https:';
  const isLocalConfig = backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1');

  if (isHttps) {
    // Over HTTPS, mixed content blocking prevents http requests to localhost.
    // Must use the HTTPS deployed production URL.
    backendUrl = DEPLOY_URL;
  } else if (isLocalConfig) {
    // Read cached check from localStorage to prevent latency on initial requests
    const cachedStatus = window.localStorage.getItem('bm_backend_local_running');
    if (cachedStatus === 'false') {
      backendUrl = DEPLOY_URL;
    } else {
      backendUrl = LOCAL_URL;
    }

    // Ping the backend in the background to update the cache for subsequent interactions
    fetch(LOCAL_URL, { method: 'GET', mode: 'cors' })
      .then(() => {
        window.localStorage.setItem('bm_backend_local_running', 'true');
        backendUrl = LOCAL_URL;
      })
      .catch(() => {
        window.localStorage.setItem('bm_backend_local_running', 'false');
        backendUrl = DEPLOY_URL;
      });
  }
}

export function getBackendUrl() {
  return backendUrl;
}
