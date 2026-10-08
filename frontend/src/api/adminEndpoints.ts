import { apiRequest } from './client';

export const AdminApi = {
  uploadImage: async (file: File) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
    const token = localStorage.getItem('myinner_token');
    const body = new FormData();
    body.append('image', file);
    const response = await fetch(`${apiBase}/admin/uploads`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message ?? 'Image upload failed.');
    return data as { imageUrl: string };
  },
  overview: () => apiRequest<{ stats: any; recentUsers: any[]; recentOrders: any[]; recentAttempts: any[] }>('/admin/overview'),
  listTests: (params: { search?: string; active?: string; page?: number; pageSize?: number } = {}) => { const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); }); return apiRequest<{ tests: any[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>(`/admin/tests?${query.toString()}`); },
  listVersions: (testId: string) => apiRequest<{ versions: any[] }>(`/admin/tests/${testId}/versions`),
  getVersion: (versionId: string) => apiRequest<{ version: any }>(`/admin/versions/${versionId}`),
  syncMbtiVersion: (versionId: string) => apiRequest<{ version: any }>(`/admin/versions/${versionId}/sync-mbti`, { method: 'POST' }),
  createTest: (input: { slug: string; name: string; description: string; imageUrl?: string; priceCents: number }) =>
    apiRequest<{ test: any }>('/admin/tests', { method: 'POST', body: input }),
  updateTest: (testId: string, patch: Record<string, unknown>) =>
    apiRequest<{ test: any }>(`/admin/tests/${testId}`, { method: 'PATCH', body: patch }),
  archiveTest: (testId: string) => apiRequest<{ test: any }>(`/admin/tests/${testId}`, { method: 'DELETE' }),

  createVersion: (input: {
    testId: string;
    versionLabel: string;
    expectedQuestionCount: number;
    scoringMethod: string;
    scoringConfig?: Record<string, unknown>;
    categories?: { key: string; name: string }[];
  }) => apiRequest<{ version: any }>('/admin/versions', { method: 'POST', body: input }),
  updateVersion: (versionId: string, patch: Record<string, unknown>) =>
    apiRequest<{ version: any }>(`/admin/versions/${versionId}`, { method: 'PATCH', body: patch }),
  cloneVersion: (versionId: string, versionLabel: string) =>
    apiRequest<{ version: any }>(`/admin/versions/${versionId}/clone`, { method: 'POST', body: { versionLabel } }),
  validateVersion: (versionId: string) => apiRequest<{ valid: boolean; issues: any[] }>(`/admin/versions/${versionId}/validate`),
  previewVersion: (versionId: string, answers: { questionId: string; answerOptionId: string }[]) => apiRequest<{ result: any }>(`/admin/versions/${versionId}/preview`, { method: 'POST', body: { answers } }),
  publishVersion: (versionId: string) => apiRequest<{ version: any }>(`/admin/versions/${versionId}/publish`, { method: 'POST' }),

  listQuestions: (versionId: string) => apiRequest<{ questions: any[] }>(`/admin/versions/${versionId}/questions`),
  addQuestion: (input: Record<string, unknown>) => apiRequest<{ question: any }>('/admin/questions', { method: 'POST', body: input }),
  updateQuestion: (questionId: string, patch: Record<string, unknown>) => apiRequest<{ question: any }>(`/admin/questions/${questionId}`, { method: 'PATCH', body: patch }),
  bulkSetQuestions: (versionId: string, questions: unknown[]) =>
    apiRequest<{ questions: any[] }>(`/admin/versions/${versionId}/questions/bulk`, { method: 'PUT', body: { questions } }),
  deleteQuestion: (questionId: string) => apiRequest<void>(`/admin/questions/${questionId}`, { method: 'DELETE' }),

  listResults: (versionId: string) => apiRequest<{ results: any[] }>(`/admin/versions/${versionId}/results`),
  upsertResult: (input: Record<string, unknown>) => apiRequest<{ result: any }>('/admin/results', { method: 'POST', body: input }),
  deleteResult: (resultId: string) => apiRequest<void>(`/admin/results/${resultId}`, { method: 'DELETE' }),

  listUsers: (params: { search?: string; active?: string; marketingEmails?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
    return apiRequest<{ users: any[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>(`/admin/users?${query.toString()}`);
  },
  getUserActivity: (userId: string) => apiRequest<{ user: any; purchases: any[]; attempts: any[] }>(`/admin/users/${userId}`),
  updateUser: (userId: string, patch: { active?: boolean; marketingEmails?: boolean }) => apiRequest<{ user: any }>(`/admin/users/${userId}`, { method: 'PATCH', body: patch }),
  listPurchases: (params: { status?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
    return apiRequest<{ purchases: any[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>(`/admin/purchases?${query.toString()}`);
  },
  listAttempts: (params: { status?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
    return apiRequest<{ attempts: any[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>(`/admin/attempts?${query.toString()}`);
  },
  getAttempt: (attemptId: string) => apiRequest<{ attempt: any }>(`/admin/attempts/${attemptId}`),
  listAuditLogs: (params: { action?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
    return apiRequest<{ logs: any[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>(`/admin/audit-logs?${query.toString()}`);
  },
  analytics: (params: { from?: string; to?: string } = {}) => { const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value) query.set(key, value); }); return apiRequest<any>(`/admin/analytics?${query.toString()}`); },
  listMarketingDeliveries: (params: { status?: string; page?: number; pageSize?: number } = {}) => { const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); }); return apiRequest<{ deliveries: any[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>(`/admin/marketing/deliveries?${query.toString()}`); },
  settingsStatus: () => apiRequest<{ settings: Record<string, unknown> }>('/admin/settings/status'),
  sendNewTestNotification: (testId: string) => apiRequest<{ subscribers: number; sent: number; skipped: number; failed: number }>(`/admin/marketing/new-test/${testId}`, { method: 'POST' })
  ,listReviews: () => apiRequest<{ reviews: any[] }>('/admin/reviews')
  ,deleteReview: (reviewId: string) => apiRequest<void>(`/admin/reviews/${reviewId}`, { method: 'DELETE' })
};
