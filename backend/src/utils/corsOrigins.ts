/**
 * Browser origins allowed to call the API.
 *
 * CLIENT_ORIGIN may hold one origin or a comma-separated list. For every
 * origin the matching www / bare-domain twin is allowed too, so the site keeps
 * working whichever of the two addresses is the primary one in Vercel (the
 * other one redirects to it).
 */
export function buildCorsOrigins(clientOrigin: string): string[] {
  const origins = new Set<string>();
  for (const raw of clientOrigin.split(',')) {
    const origin = raw.trim().replace(/\/+$/, '');
    if (!origin) continue;
    origins.add(origin);
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) continue;
      const twin = url.hostname.startsWith('www.') ? url.hostname.slice(4) : `www.${url.hostname}`;
      origins.add(`${url.protocol}//${twin}${url.port ? `:${url.port}` : ''}`);
    } catch {
      // Not a URL: keep it as given.
    }
  }
  return [...origins];
}
