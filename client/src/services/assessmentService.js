import { apiRequest } from './apiClient.js';

export const assessmentService = {
  async getCatalogMeta() {
    return apiRequest('/assessments/meta');
  },

  async generateAssessment(configuration, signal) {
    const data = await apiRequest('/assessments/generate', {
      method: 'POST',
      body: configuration,
      signal,
    });
    return data.assessment;
  },

  async getAssessmentById(assessmentId) {
    return apiRequest(`/assessments/${encodeURIComponent(assessmentId)}`);
  },

  async runCode(assessmentId, { questionId, code, language }) {
    return apiRequest(`/assessments/${encodeURIComponent(assessmentId)}/run-code`, {
      method: 'POST',
      body: { questionId, code, language },
    });
  },

  async submitAssessment(assessmentId, payload) {
    const data = await apiRequest(
      `/assessments/${encodeURIComponent(assessmentId)}/submit`,
      {
        method: 'POST',
        body: payload,
      }
    );
    return data.result;
  },

  async getAssessmentResult(assessmentId, attemptId = null) {
    const query = attemptId ? `?attemptId=${encodeURIComponent(attemptId)}` : '';
    const data = await apiRequest(
      `/assessments/${encodeURIComponent(assessmentId)}/result${query}`
    );
    return data.result;
  },

  async getHistory({ subject = '', skillLevel = '' } = {}) {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (skillLevel) params.set('skillLevel', skillLevel);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/assessments/history${qs}`);
  },
};
