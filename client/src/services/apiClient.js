const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const GUEST_STORAGE_KEY = 'codeassess_guest_session_id';
const AUTH_TOKEN_KEY = 'codeassess_auth_token';

function getOrCreateGuestSessionId() {
  try {
    let existing = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{16,80}$/.test(existing)) {
      return existing;
    }
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    existing = `guest_${hex}`;
    window.localStorage.setItem(GUEST_STORAGE_KEY, existing);
    return existing;
  } catch {
    return '';
  }
}

export function setStoredAuthToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota / privacy mode restrictions
  }
}

export function getStoredAuthToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'API_ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, signal } = {}) {
  const guestSessionId = getOrCreateGuestSessionId();
  const authToken = getStoredAuthToken();

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (guestSessionId) {
    requestHeaders['X-Guest-Session-Id'] = guestSessionId;
  }
  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }
  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: requestHeaders,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ApiError('The request was cancelled.', {
        status: 0,
        code: 'REQUEST_ABORTED',
      });
    }
    throw new ApiError(
      'Unable to connect to the CodeAssess AI server. Check your internet connection and verify that the backend API is running.',
      { status: 0, code: 'NETWORK_ERROR' }
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const errObj = payload?.error || {};
    throw new ApiError(
      errObj.message || `Request failed with HTTP status ${response.status}.`,
      {
        status: response.status,
        code: errObj.code || 'HTTP_ERROR',
        details: errObj.details || null,
      }
    );
  }

  return payload.data;
}
