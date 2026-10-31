import { apiRequest, setStoredAuthToken } from './apiClient.js';

export const authService = {
  async register({ name, email, password }) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    if (data.token) {
      setStoredAuthToken(data.token);
    }
    return data.user;
  },

  async login({ email, password }) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.token) {
      setStoredAuthToken(data.token);
    }
    return data.user;
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setStoredAuthToken(null);
    }
  },

  async getCurrentUser() {
    const data = await apiRequest('/auth/me');
    return data.user;
  },
};
