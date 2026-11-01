const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function friendlyApiMessage(status: number, fallback: string): string {
  if (status === 409 && /active attempt/i.test(fallback)) {
    return 'You already have an active attempt. It will be opened for you instead of creating a new one.';
  }
  if (status === 401) return 'Your session has expired. Please log in again to continue.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested content is not found or no longer available.';
  if (status >= 500) return 'An error occurred on the server. Please try again later.';
  return fallback;
}

function getToken(): string | null {
  return localStorage.getItem('myinner_token');
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && options.auth !== false) {
      localStorage.removeItem('myinner_token');
      window.dispatchEvent(new Event('myinner:unauthorized'));
    }
    const serverMessage = data?.error?.message ?? 'Something went wrong.';
    throw new ApiError(friendlyApiMessage(res.status, serverMessage), res.status);
  }
  return data as T;
}
