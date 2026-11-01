/**
 * Client-side handlers for the Realtime tools declared in
 * backend/src/modules/ai/ai.prompt.ts. They use My Inner's existing API, so
 * catalogue data and prices are always live — never hard-coded.
 */
import { apiRequest, ApiError } from '../api/client';
import { TestsApi } from '../api/endpoints';
import type { PublicTest } from '../types';

let navigateFn: (path: string) => void = (path) => window.location.assign(path);
export function setAiNavigate(fn: (path: string) => void) {
  navigateFn = fn;
}

let cache: { at: number; tests: PublicTest[] } | null = null;
async function catalogue(): Promise<PublicTest[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.tests;
  const { tests } = await TestsApi.list();
  cache = { at: Date.now(), tests };
  return tests;
}

function formatPrice(p: PublicTest['price']) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency.toUpperCase() }).format(p.amount / 100);
}

export async function runTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'list_tests': {
        const tests = await catalogue();
        return tests
          .filter((t) => t.available)
          .map((t) => ({
            slug: t.slug,
            name: t.name,
            description: t.description,
            price: formatPrice(t.price),
            pricing: 'one-time purchase per test',
            questionCount: t.questionCount,
            categories: t.categories.map((c) => c.name),
          }));
      }
      case 'open_test': {
        const tests = await catalogue();
        const t = tests.find((x) => x.slug === args.slug && x.available);
        if (!t) return { ok: false, reason: 'unknown_or_unavailable_test' };
        navigateFn(`/tests/${encodeURIComponent(t.slug)}`);
        return { ok: true, opened: t.name };
      }
      case 'get_my_result': {
        if (!localStorage.getItem('myinner_token')) return { status: 'not_signed_in' };
        const q = typeof args.slug === 'string' ? `?slug=${encodeURIComponent(args.slug)}` : '';
        try {
          return await apiRequest(`/ai/result${q}`);
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) return { status: 'not_signed_in' };
          return { status: 'not_ready' };
        }
      }
      default:
        return { error: 'unknown_tool' };
    }
  } catch {
    return { error: 'temporarily_unavailable' };
  }
}
