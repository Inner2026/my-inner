import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export function AnnouncementBar() {
  const [promotion, setPromotion] = useState<any>(null); const [closed, setClosed] = useState(false);
  useEffect(() => { fetch(`${API}/promotion`).then((r) => r.ok ? r.json() : null).then((d) => setPromotion(d?.promotion ?? null)).catch(() => undefined); }, []);
  if (!promotion?.announcementEnabled || closed || (promotion.announcementEndsAt && new Date(promotion.announcementEndsAt).getTime() <= Date.now())) return null;
  const tagline = promotion.announcementTagline?.trim();
  return <div className="announcement-bar relative z-30 overflow-hidden border-b border-[#e4d7e7] bg-[#f8f1f4] py-2.5 text-[#302447] shadow-sm"><div className="announcement-track flex min-w-max items-center gap-14 whitespace-nowrap text-xs font-semibold tracking-wide sm:text-sm"><span className="flex items-center gap-2"><span className="text-base text-[#bd7891]">✦</span>{promotion.announcementText}<span className="text-base text-[#719b8d]">✦</span></span>{tagline && <span className="flex items-center gap-2 text-[#765c8d]"><span>💜</span>{tagline}</span>}<span className="flex items-center gap-2"><span className="text-base text-[#bd7891]">✦</span>{promotion.announcementText}<span className="text-base text-[#719b8d]">✦</span></span>{tagline && <span className="flex items-center gap-2 text-[#765c8d]"><span>💜</span>{tagline}</span>}</div><button type="button" aria-label="Close announcement" onClick={() => setClosed(true)} className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#f8f1f4] text-lg text-[#765c8d] shadow-sm hover:bg-white">×</button></div>;
}
