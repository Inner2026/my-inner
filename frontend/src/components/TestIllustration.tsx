type Props = { slug: string };

const styles: Record<string, { accent: string; wash: string; number: string; label: string }> = {
  'mbti-style': { accent: '#76649e', wash: '#f3effb', number: '01', label: 'Understand your inner patterns' },
  'inner-child': { accent: '#6c9188', wash: '#eef6f1', number: '02', label: 'Reconnect with the parts of you within' },
  'five-love-languages': { accent: '#b77791', wash: '#fff2f4', number: '03', label: 'Discover how you give and receive love' },
  'hidden-animal': { accent: '#a87952', wash: '#fff6eb', number: '04', label: 'Explore what your instincts reveal' },
  'cube-personality': { accent: '#75659e', wash: '#f3f0fb', number: '05', label: 'See yourself from a different angle' }
};

const assets: Record<string, string> = {
  'mbti-style': '/test-illustrations/mbti.svg',
  'inner-child': '/test-illustrations/inner-child.svg',
  'five-love-languages': '/test-illustrations/love-languages.svg',
  'hidden-animal': '/test-illustrations/hidden-animal.svg',
  'cube-personality': '/test-illustrations/cube-personality.svg'
};

export function TestIllustration({ slug }: Props) {
  const style = styles[slug] ?? styles['mbti-style'];
  return <div className="relative isolate overflow-hidden rounded-[2rem] border border-[#ebe3e8] p-2 shadow-[0_18px_50px_rgba(73,57,88,0.07)]" style={{ backgroundColor: style.wash }}>
    <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/60" />
    <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-white/40" />
    <div className="relative grid min-h-[300px] items-center gap-6 rounded-[1.6rem] border border-white/80 bg-white/35 p-6 sm:grid-cols-[.8fr_1.2fr] sm:p-9">
      <div className="relative z-10 max-w-xs">
        <span className="font-serif text-5xl leading-none" style={{ color: `${style.accent}55` }}>{style.number}</span>
        <span className="mt-4 block text-[10px] font-semibold uppercase tracking-[.2em]" style={{ color: style.accent }}>A guided reflection</span>
        <p className="mt-3 font-serif text-2xl leading-tight text-[#302447] sm:text-[1.7rem]">{style.label}</p>
      </div>
      <div className="relative flex h-56 items-center justify-center rounded-[1.35rem] bg-white/70 p-3 shadow-[0_12px_30px_rgba(66,52,76,0.08)] sm:h-64">
        <img src={assets[slug] ?? assets['mbti-style']} alt="" className="h-full w-full object-contain mix-blend-multiply drop-shadow-[0_14px_18px_rgba(66,52,76,0.1)]" />
      </div>
    </div>
  </div>;
}
