/**
 * Privacy-conscious GA4 loader + first-touch attribution + funnel events.
 *
 * - Does NOTHING unless VITE_GA4_ID is set at build time (safe to merge before an ID exists).
 * - Consent Mode v2: analytics storage is denied by default for EU/EEA/UK/CH visitors
 *   (cookieless pings only) and granted elsewhere. Ads storage is always denied.
 * - Never sends names, emails, answers or results. Event params are limited to test slug/name,
 *   currency/value and an opaque purchase id.
 * - UTM / click-id parameters are captured once (first touch) and attached to funnel events.
 */

type Params = Record<string, string | number | boolean | undefined>;
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; }
}

const GA_ID = (import.meta.env.VITE_GA4_ID as string | undefined)?.trim();
const FIRST_TOUCH_KEY = 'myinner_first_touch';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const CONSENT_REGIONS = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];

let initialised = false;

export const analyticsEnabled = Boolean(GA_ID);

function safeStorage(kind: 'local' | 'session') {
  try { return kind === 'local' ? window.localStorage : window.sessionStorage; } catch { return null; }
}

/** Capture UTM params once per visitor (first touch). Runs even without a GA id so attribution is ready. */
export function captureFirstTouch(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const store = safeStorage('local');
  try {
    const existing = store?.getItem(FIRST_TOUCH_KEY);
    if (existing) return JSON.parse(existing) as Record<string, string>;
  } catch { /* fall through */ }
  const search = new URLSearchParams(window.location.search);
  const touch: Record<string, string> = {};
  for (const key of UTM_KEYS) { const value = search.get(key); if (value) touch[key] = value.slice(0, 100); }
  if (!touch.utm_source && document.referrer) {
    try { const host = new URL(document.referrer).hostname; if (host && host !== window.location.hostname) touch.referrer_host = host; } catch { /* ignore */ }
  }
  if (Object.keys(touch).length > 0) { try { store?.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch)); } catch { /* ignore */ } }
  return touch;
}

export function initAnalytics() {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;
  captureFirstTouch();
  if (!GA_ID) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { (window.dataLayer as unknown[]).push(arguments); };
  window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
  window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', region: CONSENT_REGIONS });
  window.gtag('js', new Date());
  // SPA: we send page_view ourselves on route changes.
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
  window.addEventListener('myinner:purchase-success', (event) => {
    const detail = (event as CustomEvent<{ purchaseId?: string; value?: number }>).detail;
    if (!detail?.purchaseId) return;
    const dedupeKey = `myinner_purchase_tracked_${detail.purchaseId}`;
    const session = safeStorage('local');
    try { if (session?.getItem(dedupeKey)) return; session?.setItem(dedupeKey, '1'); } catch { /* ignore */ }
    track('purchase', { transaction_id: detail.purchaseId, currency: 'USD', ...(typeof detail.value === 'number' ? { value: detail.value } : {}) });
  });
}

export function track(event: string, params: Params = {}) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  const touch = captureFirstTouch();
  window.gtag('event', event, { ...params, first_utm_source: touch.utm_source, first_utm_medium: touch.utm_medium, first_utm_campaign: touch.utm_campaign });
}

export function trackPageView(path: string, title?: string) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: title ?? document.title });
}
