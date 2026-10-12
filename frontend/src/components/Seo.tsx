import { useEffect } from 'react';

const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://my-inner.com').replace(/\/$/, '');
const defaultTitle = 'My Inner — Discover more about yourself';
const defaultDescription = 'Explore thoughtfully designed assessments for personality, emotions, relationships, and self-discovery.';
const defaultImage = `${siteUrl}/hero-background.png`;

type SeoProps = { title?: string; description?: string; canonicalPath?: string; image?: string; noIndex?: boolean; jsonLd?: Record<string, unknown> };

function setMeta(name: string, content: string, property = false) {
  const attribute = property ? 'property' : 'name';
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, name); document.head.appendChild(element); }
  element.setAttribute('content', content);
}

export function Seo({ title = defaultTitle, description = defaultDescription, canonicalPath, image = defaultImage, noIndex = false, jsonLd }: SeoProps) {
  useEffect(() => {
    document.title = title;
    const canonicalUrl = `${siteUrl}${canonicalPath ?? window.location.pathname}`;
    setMeta('description', description);
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMeta('og:title', title, true); setMeta('og:description', description, true); setMeta('og:url', canonicalUrl, true);
    setMeta('og:image', image.startsWith('http') ? image : `${siteUrl}${image}`, true);
    setMeta('twitter:title', title); setMeta('twitter:description', description); setMeta('twitter:image', image.startsWith('http') ? image : `${siteUrl}${image}`);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;
    const existingJsonLd = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld]');
    if (jsonLd) { const script = existingJsonLd ?? document.createElement('script'); script.type = 'application/ld+json'; script.dataset.seoJsonld = 'true'; script.textContent = JSON.stringify(jsonLd); if (!existingJsonLd) document.head.appendChild(script); }
    else if (existingJsonLd) existingJsonLd.remove();
  }, [description, image, jsonLd, noIndex, title, canonicalPath]);
  return null;
}

export const seoSiteUrl = siteUrl;
