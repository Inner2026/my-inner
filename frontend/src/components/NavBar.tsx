import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  return (
    <header className="site-nav sticky top-0 z-20 border-b border-[#e7dce8]/80 bg-[#fffdfb]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[#302447]">
          <span className="relative h-10 w-10 overflow-hidden rounded-xl border border-[#e5d9e7] bg-white shadow-sm">
            <img src="/my-inner-logo.png" alt="" className="absolute left-0 top-0 h-auto w-full" />
          </span>
          <span>My Inner</span>
        </Link>
        <nav className="hidden items-center gap-2 text-sm sm:flex">
          <Link to="/tests" className="rounded-full px-3 py-2 text-[#62596c] transition hover:bg-[#f1eaf2] hover:text-[#302447]">
            Tests
          </Link>
          <Link to="/about" className="rounded-full px-3 py-2 text-[#62596c] transition hover:bg-[#f1eaf2] hover:text-[#302447]">
            About
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="rounded-full px-3 py-2 text-[#62596c] transition hover:bg-[#f1eaf2] hover:text-[#302447]">
                My Results
              </Link>
              <Link to="/profile" className="hidden rounded-full px-3 py-2 text-[#62596c] transition hover:bg-[#f1eaf2] hover:text-[#302447] sm:inline-flex">
                My Account
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="rounded-full px-3 py-2 text-[#62596c] transition hover:bg-[#f1eaf2] hover:text-[#302447]">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-full border border-[#ded2df] bg-white px-4 py-2 text-[#62596c] shadow-sm transition hover:border-[#bda8c6] hover:bg-[#f8f2f8]"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-3 py-2 text-[#62596c] transition hover:bg-[#f1eaf2] hover:text-[#302447]">
                Log in
              </Link>
              <Link to="/register" className="rounded-full bg-[#765c8d] px-4 py-2 text-white shadow-lg shadow-[#765c8d]/20 transition hover:-translate-y-0.5 hover:bg-[#634a78]">
                Sign up
              </Link>
            </>
          )}
        </nav>
        <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="mobile-menu-button rounded-xl border border-[#e5d9e7] bg-white p-2 text-[#302447] shadow-sm sm:hidden">
          <span className="sr-only">Menu</span>
          {menuOpen ? <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
        </button>
      </div>
      {menuOpen && <div className="mobile-menu border-t border-[#eee5ed] bg-[#fffdfb] px-4 pb-4 pt-2 shadow-lg sm:hidden">
        <Link onClick={closeMenu} to="/tests" className="mobile-menu-link">Tests</Link>
        <Link onClick={closeMenu} to="/about" className="mobile-menu-link">About</Link>
        {user ? <>
          <Link onClick={closeMenu} to="/dashboard" className="mobile-menu-link">My Results</Link>
          <Link onClick={closeMenu} to="/profile" className="mobile-menu-link">My Account</Link>
          {user.role === 'admin' && <Link onClick={closeMenu} to="/admin" className="mobile-menu-link">Admin</Link>}
          <button onClick={handleLogout} className="mobile-menu-link w-full text-left">Log out</button>
        </> : <>
          <Link onClick={closeMenu} to="/login" className="mobile-menu-link">Log in</Link>
          <Link onClick={closeMenu} to="/register" className="mobile-menu-link mobile-menu-cta">Sign up</Link>
        </>}
      </div>}
    </header>
  );
}
