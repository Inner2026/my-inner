import { apiRequest } from './client';
import { PublicTest, AuthUser, AttemptQuestion, ResultSummary, ResultDetail, TestRatingSummary } from '../types';

export const AuthApi = {
  register: (input: { username: string; email?: string; phone?: string; password: string; marketingEmails?: boolean }) =>
    apiRequest<{ token: string; user: AuthUser }>('/auth/register', { method: 'POST', body: input, auth: false }),
  login: (input: { identifier: string; password: string }) =>
    apiRequest<{ token: string; user: AuthUser }>('/auth/login', { method: 'POST', body: input, auth: false }),
  me: () => apiRequest<AuthUser>('/auth/me'),
  updatePreferences: (input: { marketingEmails: boolean }) => apiRequest<{ user: AuthUser }>('/auth/preferences', { method: 'PATCH', body: input }),
  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' })
  ,forgotPassword: (email: string) => apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email }, auth: false })
  ,resetPassword: (token: string, password: string) => apiRequest<{ message: string }>('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false })
};

export const TestsApi = {
  list: () => apiRequest<{ tests: PublicTest[] }>('/tests', { auth: false }),
  getBySlug: (slug: string) => apiRequest<{ test: PublicTest }>(`/tests/${slug}`, { auth: false }),
  getRating: (slug: string) => apiRequest<{ rating: TestRatingSummary }>(`/tests/${slug}/ratings`),
  rate: (slug: string, rating: number, comment = '') => apiRequest<{ rating: TestRatingSummary }>(`/tests/${slug}/ratings`, { method: 'POST', body: { rating, comment } })
};

export const PaymentsApi = {
  mode: () => apiRequest<{ mode: 'paypal' | 'demo' }>('/config/payment-mode', { auth: false })
};

export const PurchasesApi = {
  create: (testSlug: string) =>
    apiRequest<{ purchaseId: string; paypalOrderId: string; approvalUrl: string | null; paymentProvider: 'paypal' | 'demo' }>('/purchases', { method: 'POST', body: { testSlug } }),
  get: (purchaseId: string) => apiRequest<{ purchase: any }>(`/purchases/${purchaseId}`),
  capture: (purchaseId: string, orderId?: string) => apiRequest<{ purchase: any }>(`/purchases/${purchaseId}/capture`, { method: 'POST', body: orderId ? { orderId } : undefined })
};

export const AttemptsApi = {
  list: () => apiRequest<{ attempts: import('../types').AttemptSummary[] }>('/attempts'),
  create: (purchaseId: string) => apiRequest<{ attempt: any }>('/attempts', { method: 'POST', body: { purchaseId } }),
  get: (attemptId: string) => apiRequest<{ attempt: any }>(`/attempts/${attemptId}`),
  questions: (attemptId: string) => apiRequest<{ questions: AttemptQuestion[] }>(`/attempts/${attemptId}/questions`),
  submit: (attemptId: string, answers: { questionId: string; answerOptionId: string }[]) =>
    apiRequest<{ attempt: any }>(`/attempts/${attemptId}/submit`, { method: 'POST', body: { answers } })
};

export const ResultsApi = {
  list: () => apiRequest<{ results: ResultSummary[] }>('/results'),
  get: (attemptId: string) => apiRequest<{ result: ResultDetail }>(`/results/${attemptId}`)
};
