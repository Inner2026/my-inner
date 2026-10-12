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
    return 'لديك محاولة مفتوحة بالفعل. سيتم فتحها لك بدل إنشاء محاولة جديدة.';
  }
  if (status === 401) return 'انتهت الجلسة. سجّل الدخول مرة أخرى للمتابعة.';
  if (status === 403) return 'ليس لديك صلاحية لتنفيذ هذا الإجراء.';
  if (status === 404) return 'المحتوى المطلوب غير موجود أو لم يعد متاحًا.';
  if (status >= 500) return 'حدث خطأ في الخادم. حاول مرة أخرى بعد قليل.';
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
