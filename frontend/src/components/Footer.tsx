import { useEffect, useState } from 'react';
import { PromotionApi } from '../api/endpoints';
import { useLocation } from 'react-router-dom';
import { AtSign, BriefcaseBusiness, CirclePlay, Ghost, Globe, Music2, Video } from 'lucide-react';

const socialLabels: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', snapchat: 'Snapchat', youtube: 'YouTube', linkedin: 'LinkedIn', x: 'X' };
const socialIcons: Record<string, typeof Globe> = { instagram: AtSign, facebook: Globe, tiktok: Music2, snapchat: Ghost, youtube: CirclePlay, linkedin: BriefcaseBusiness, x: Video };

export function Footer() {
  useLocation(); const [socialLinks, setSocialLinks] = useState<Record<string, string>>({}); const [footerMessage, setFooterMessage] = useState('Have questions? We are here to help.');
  useEffect(() => { PromotionApi.get().then((result) => { setSocialLinks(result.promotion.socialLinks ?? {}); setFooterMessage(result.promotion.footerMessage ?? 'Have questions? We are here to help.'); }).catch(() => undefined); }, []);
  // The home page has its own footer; keep the shared footer available there
  // so configured social links are visible site-wide.
  const visibleLinks = Object.entries(socialLinks).filter(([, url]) => Boolean(url));
  return <footer className="site-footer border-t border-[#eadfe8] bg-[#faf4f7] px-5 py-7"><div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-[#737080] sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 font-serif text-lg text-[#302447]"><img src="/my-inner-logo.webp" alt="" className="h-10 w-10 object-contain object-top" />My Inner</div><p>{footerMessage}</p>{visibleLinks.length > 0 && <nav aria-label="Social media" className="flex flex-wrap gap-2">{visibleLinks.map(([key, url]) => { const Icon = socialIcons[key] ?? Globe; return <a key={key} href={url} target="_blank" rel="noreferrer" aria-label={socialLabels[key] ?? key} title={socialLabels[key] ?? key} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ded2df] bg-white text-[#765c8d] transition hover:-translate-y-0.5 hover:bg-[#f3eaf5]"><Icon className="h-4 w-4" aria-hidden="true" /></a>; })}</nav>}<p className="text-xs">© 2026 My Inner. All rights reserved.</p></div></footer>;
}
