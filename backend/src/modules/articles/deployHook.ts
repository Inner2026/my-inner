import { env } from '../../config/env';

/**
 * Asks Vercel to rebuild the frontend so the published article gets its own
 * prerendered HTML page and appears in sitemap.xml. Optional: when
 * VERCEL_DEPLOY_HOOK_URL is not set the article is still live immediately
 * (rendered by the SPA); only the prerendered shell waits for the next deploy.
 *
 * Never throws: a failed rebuild must not fail the admin's save.
 */
export async function triggerFrontendRebuild(reason: string): Promise<boolean> {
  if (!env.vercelDeployHookUrl) return false;
  try {
    const response = await fetch(env.vercelDeployHookUrl, { method: 'POST', signal: AbortSignal.timeout(5000) });
    if (!response.ok) console.warn(`[deploy-hook] ${reason}: Vercel returned HTTP ${response.status}`);
    return response.ok;
  } catch (error) {
    console.warn(`[deploy-hook] ${reason}: ${(error as Error).message}`);
    return false;
  }
}
