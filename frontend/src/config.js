export const getApiUrl = () => {
  const customUrl = localStorage.getItem('custom_api_url');
  if (customUrl && customUrl.trim()) {
    let cleaned = customUrl.trim();
    return cleaned.endsWith('/') ? cleaned.slice(0, -1) : cleaned;
  }
  if (import.meta.env.VITE_API_URL) {
    let envUrl = import.meta.env.VITE_API_URL;
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${host}:8000`;
};

export const API_URL = getApiUrl();

export const setCustomApiUrl = (url) => {
  if (!url || !url.trim()) {
    localStorage.removeItem('custom_api_url');
  } else {
    let cleaned = url.trim();
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `http://${cleaned}`;
    }
    localStorage.setItem('custom_api_url', cleaned);
  }
  window.location.reload();
};

export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
  };
  
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const currentApiUrl = getApiUrl();
    const response = await fetch(`${currentApiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  } catch (error) {
    if (error.name === 'TypeError') {
      throw new Error('Network error: Unable to reach the server. Please check your connection.');
    }
    throw error;
  }
}

