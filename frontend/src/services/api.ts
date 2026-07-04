const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocalhost ? 'http://localhost:5000' : 'https://rent-flatmate-finder-f4ec.onrender.com';
};

const API_BASE_URL = getApiUrl();

interface RequestOptions extends RequestInit {
  body?: any;
}

export const tokenService = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  getUser: () => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  },
  setUser: (user: any) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

async function request(url: string, options: RequestOptions = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  
  const token = tokenService.getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);

  if (response.status === 401 && tokenService.getRefreshToken()) {
    // Attempt token refresh
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokenService.getRefreshToken() }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          tokenService.setTokens(data.accessToken, data.refreshToken);
          isRefreshing = false;
          onRefreshed(data.accessToken);
        } else {
          // Refresh failed
          isRefreshing = false;
          tokenService.clear();
          window.location.reload();
          throw new Error('Session expired');
        }
      } catch (err) {
        isRefreshing = false;
        tokenService.clear();
        window.location.reload();
        throw err;
      }
    }

    // Queue requests while refreshing
    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        headers.set('Authorization', `Bearer ${newToken}`);
        resolve(
          fetch(`${API_BASE_URL}${url}`, { ...options, headers }).then((res) => {
            if (!res.ok) {
              return res.json().then((data) => Promise.reject(data));
            }
            return res.json();
          })
        );
      });
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = typeof errorData.error === 'string' ? errorData.error : (errorData.message || JSON.stringify(errorData.error) || 'Something went wrong');
    return Promise.reject(errorMessage);
  }

  // Handle empty or 204 responses
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (url: string, options?: RequestOptions) => request(url, { ...options, method: 'GET' }),
  post: (url: string, body: any, options?: RequestOptions) => request(url, { ...options, method: 'POST', body }),
  put: (url: string, body: any, options?: RequestOptions) => request(url, { ...options, method: 'PUT', body }),
  patch: (url: string, body?: any, options?: RequestOptions) => request(url, { ...options, method: 'PATCH', body }),
  delete: (url: string, options?: RequestOptions) => request(url, { ...options, method: 'DELETE' }),
};

export async function googleLogin(accessToken: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Google login failed');
  return data;
}

export default api;
