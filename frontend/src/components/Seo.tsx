import { useEffect } from 'react';

export const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://my-inner.com').replace(/\/$/, '');
const defaultTitle = 'My Inner | Self-Awareness & Personal Growth';
const defaultDescription = 'Explore My Inner for self-reflection, personal growth, and emotional wellness resources designed to support your journey toward greater self-awareness.';
const defaultImage = `${siteUrl}/hero-background.png`;

type SeoProps = { title?: string; description?: string; canonicalPath?: string; image?: string; imageAlt?: string; noIndex?: boolean; jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> };

function setMeta(name: string, content: string, property = false) {
  const attribute = property ? 'property' : 'name';
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, name); document.head.appendChild(element); }
  element.setAttribute('content', content);
}

function absoluteUrl(value: string) { return value.startsWith('http') ? value : `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`; }
function canonicalizePath(path: string) {
  const cleanPath = path.split(/[?#]/, 1)[0] || '/';
  return cleanPath === '/' ? '/' : `/${cleanPath.replace(/^\/+|\/+$/g, '')}`;
}

export function Seo({ title = defaultTitle, description = defaultDescription, canonicalPath, image = defaultImage, imageAlt = 'My Inner self-discovery assessments', noIndex = false, jsonLd }: SeoProps) {
  useEffect(() => {
    document.title = title;
    const canonicalUrl = `${siteUrl}${canonicalizePath(canonicalPath ?? window.location.pathname)}`;
    setMeta('description', description);
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMeta('og:type', 'website', true); setMeta('og:site_name', 'My Inner', true);
    setMeta('og:title', title, true); setMeta('og:description', description, true); setMeta('og:url', canonicalUrl, true);
    setMeta('og:image', absoluteUrl(image), true); setMeta('og:image:alt', imageAlt, true);
    setMeta('twitter:card', 'summary_large_image'); setMeta('twitter:title', title); setMeta('twitter:description', description); setMeta('twitter:image', absoluteUrl(image));
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;
    const existingJsonLd = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld]');
    if (jsonLd) { const script = existingJsonLd ?? document.createElement('script'); script.type = 'application/ld+json'; script.dataset.seoJsonld = 'true'; script.textContent = JSON.stringify(jsonLd); if (!existingJsonLd) document.head.appendChild(script); }
    else if (existingJsonLd) existingJsonLd.remove();
  }, [description, image, imageAlt, jsonLd, noIndex, title, canonicalPath]);
  return null;
}

export const seoSiteUrl = siteUrl;
