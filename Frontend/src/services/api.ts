

const envApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const BASE_URL = envApiUrl.replace(/\/api\/?$/, ''); 
const API_URL = `${BASE_URL}/api`;

const TOKEN_KEY    = 'rfp_access_token';
const REFRESH_KEY  = 'rfp_refresh_token';



function getAccessToken()  { return localStorage.getItem(TOKEN_KEY);   }
function getRefreshToken() { return localStorage.getItem(REFRESH_KEY); }

function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY,   accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.message ?? body?.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}



let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    const data: { accessToken: string; refreshToken: string } = await response.json();
    saveTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}



interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  _retry?: boolean; 
}

export async function fetcher<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth = false, _retry = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, { headers, ...rest });

  
  if (response.status === 401 && !skipAuth && !_retry) {
    try {
      const newToken = await refreshAccessToken();
      return fetcher<T>(endpoint, {
        ...options,
        _retry: true,
        headers: { ...(customHeaders as Record<string, string>), Authorization: `Bearer ${newToken}` },
      });
    } catch {
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}



export async function uploadFetcher<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
  }

  return response.json();
}
