import { ArrowLeft, Home, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="not-found-page min-h-[calc(100vh-74px)] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="not-found-card relative overflow-hidden rounded-[2rem] border border-[#eadff2] bg-white/90 px-6 py-10 shadow-[0_24px_70px_rgba(92,69,110,0.12)] backdrop-blur-sm sm:px-10 sm:py-14">
          <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-[#f0e8fb]" />
          <div className="absolute -bottom-16 right-[-2rem] h-52 w-52 rounded-full bg-[#eef7f2]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e7dff0] bg-[#f9f3ff] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#765c8d]">
              <Sparkles className="h-3.5 w-3.5" />
              404 error
            </div>

            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-[#2d1f3e] sm:text-7xl">Page not found</h1>
            <p className="mt-3 text-lg text-[#685d74]">هذه الصفحة غير موجودة</p>

            <p className="mt-6 max-w-xl text-sm leading-7 text-[#5f5b66] sm:text-base">
              The page you tried to open doesn’t exist, or it may have moved. Let’s take you back to a safe place and keep going.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-[#765c8d] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#765c8d]/20 transition hover:-translate-y-0.5 hover:bg-[#634a78]"
              >
                <Home className="h-4 w-4" />
                Back home
              </Link>

              <Link
                to="/tests"
                className="inline-flex items-center gap-2 rounded-full border border-[#e7dff0] bg-white px-5 py-3 text-sm font-semibold text-[#4a3d5d] transition hover:bg-[#f7f3fb]"
              >
                <ArrowLeft className="h-4 w-4" />
                Explore tests
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
