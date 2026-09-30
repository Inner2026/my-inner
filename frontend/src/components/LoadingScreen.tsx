import { Sparkles } from 'lucide-react';

export function LoadingScreen({ message = 'Preparing your reflection...', detail = 'Give us a moment while everything comes together.' }: { message?: string; detail?: string }) {
  return <div className="flex min-h-[calc(100vh-74px)] items-center justify-center overflow-hidden bg-[#fbf8f5] px-5 py-16">
    <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 px-7 py-10 text-center shadow-[0_22px_70px_rgba(73,57,88,0.1)] backdrop-blur-sm sm:px-10">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#eee5f4]" />
      <div className="absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-[#e8f1ec]" />
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-[#f0e7f5] to-[#e7f1ec] shadow-inner">
        <img src="/my-inner-logo.png" alt="My Inner" className="h-12 w-12 rounded-2xl object-cover" />
        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#765c8d] shadow-sm"><Sparkles className="h-4 w-4 animate-pulse" /></span>
      </div>
      <div className="relative mx-auto mt-7 h-1.5 w-40 overflow-hidden rounded-full bg-[#eee8f0]"><span className="loading-progress absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-[#765c8d] to-[#9bbca8]" /></div>
      <p className="relative mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#765c8d]">My Inner</p>
      <h1 className="relative mt-3 text-2xl font-semibold tracking-tight text-[#302447] sm:text-3xl">{message}</h1>
      <p className="relative mt-3 text-sm leading-6 text-[#797181]">{detail}</p>
    </div>
  </div>;
}
