import { apiRequest } from './apiClient.js';

export const dashboardService = {
  async getSummary() {
    return apiRequest('/dashboard/summary');
  },

  async getProgress() {
    return apiRequest('/dashboard/progress');
  },
};
