import { useLocation } from 'react-router-dom';

export function Footer() {
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  return <footer className="site-footer border-t border-[#eadfe8] bg-[#faf4f7] px-5 py-7"><div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm text-[#737080] sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 font-serif text-lg text-[#302447]"><img src="/my-inner-logo.png" alt="" className="h-10 w-10 object-contain object-top" />My Inner</div><p>Self-discovery. Understanding. Growth.</p><p className="text-xs">© 2026 My Inner. All rights reserved.</p></div></footer>;
}
