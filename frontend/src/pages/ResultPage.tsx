import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AttemptsApi, ResultsApi } from '../api/endpoints';
import { ResultDetail } from '../types';
import { ApiError } from '../api/client';
import { Box, Compass, Heart, Mountain, PawPrint, Sparkles, Star } from 'lucide-react';

const loveLanguageNames: Record<string, string> = { WA: 'Words of Affirmation', QT: 'Quality Time', AS: 'Acts of Service', TG: 'Gifts', PT: 'Physical Touch' };
const cubeReflectionNames = ['Self-Image', 'Relationships', 'Love Outlook', 'Resilience'];
const animalNames = ['Wolf', 'Eagle', 'Fox', 'Serpent', 'Lion', 'Panther', 'Dragon', 'Unicorn', 'Phoenix', 'Bear', 'Owl', 'Stag'];
const animalEmojis: Record<string, string> = {
  Wolf: '🐺', Eagle: '🦅', Fox: '🦊', Serpent: '🐍', Lion: '🦁', Panther: '🐆',
  Dragon: '🐉', Unicorn: '🦄', Phoenix: '🔥', Bear: '🐻', Owl: '🦉', Stag: '🦌'
};
const animalProfiles: Record<string, { why: string; energy: string[] }> = {
  Wolf: { why: 'Because somewhere inside you lives a creature that loves deeply, notices everything, and does not give its trust away for free. Your answers suggest that loyalty matters to you, while you still need your own space and freedom.', energy: ['Loyal', 'Instinctive', 'Independent', 'Protective', 'Deeply connected'] },
  Eagle: { why: 'Because you do not always look at life from ground level. Your answers reveal someone who steps back, sees the bigger picture, and wants the freedom to choose their own direction.', energy: ['Free', 'Visionary', 'Independent', 'Observant', 'Future-focused'] },
  Fox: { why: 'Because you do not always play the game the way people expect. Your answers suggest a mind that looks for patterns, possibilities, and another way forward before revealing everything.', energy: ['Clever', 'Strategic', 'Curious', 'Adaptable', 'Resourceful'] },
  Serpent: { why: 'Because you have a relationship with the parts of life that other people sometimes avoid. Your answers reveal curiosity about hidden emotions, uncomfortable truths, and transformation.', energy: ['Intuitive', 'Mysterious', 'Deep', 'Transformative', 'Perceptive'] },
  Lion: { why: 'Because there is a part of you that refuses to stay small. Your answers reveal courage, self-respect, and a willingness to take charge when something really matters.', energy: ['Courageous', 'Powerful', 'Confident', 'Protective', 'Decisive'] },
  Panther: { why: 'Because you do not reveal everything. Your answers suggest someone who watches, feels deeply, and chooses carefully who gets access to the real you.', energy: ['Independent', 'Intense', 'Mysterious', 'Observant', 'Self-protective'] },
  Dragon: { why: 'Because ordinary is not always enough for you. Your answers reveal a desire for growth, influence, transformation, imagination, and becoming something bigger than who you are today.', energy: ['Powerful', 'Imaginative', 'Ambitious', 'Transformative', 'Fearless'] },
  Unicorn: { why: 'Because fitting in is not necessarily your idea of success. Your answers reveal a strong need to be yourself, even when you do not fit neatly into other people’s expectations.', energy: ['Authentic', 'Individualistic', 'Idealistic', 'Free-spirited', 'Unique'] },
  Phoenix: { why: 'Because something inside you knows how to begin again. Your answers reveal a relationship with change, resilience, endings, and new beginnings.', energy: ['Resilient', 'Transformative', 'Strong', 'Renewing', 'Unbreakable'] },
  Bear: { why: 'Because beneath everything else, you have a powerful protective instinct. Your answers suggest that stability, loyalty, safety, and the people you care about matter deeply to you.', energy: ['Protective', 'Strong', 'Loyal', 'Stable', 'Dependable'] },
  Owl: { why: 'Because you notice things: the pause, the change in someone’s tone, and the detail everyone else missed. Your answers reveal someone who prefers to observe first and understand before reacting.', energy: ['Wise', 'Observant', 'Curious', 'Analytical', 'Discerning'] },
  Stag: { why: 'Because your sensitivity is not weakness; it is perception. Your answers reveal someone who feels emotional atmospheres and relationships deeply, while caring about being understood and emotionally safe.', energy: ['Sensitive', 'Dignified', 'Empathetic', 'Emotional', 'Deeply connected'] }
};

const mbtiImages: Record<string, string> = {
  ENFP: '/test-results/enfp.png', INTJ: '/test-results/intj.png', ISTP: '/test-results/istp.png',
  ISFP: '/test-results/isfp.png', ESTP: '/test-results/estp.png', ESFP: '/test-results/esfp.png',
  ISTJ: '/test-results/istj.png', ISFJ: '/test-results/isfj.png', ESTJ: '/test-results/estj.png',
  ESFJ: '/test-results/esfj.png', INTP: '/test-results/intp.png', ENTJ: '/test-results/entj.png',
  ENTP: '/test-results/entp.png', INFP: '/test-results/infp.png', INFJ: '/test-results/infj.png'
};

const mbtiGroups: Record<string, string> = { INTJ: 'Analyst', INTP: 'Analyst', ENTJ: 'Analyst', ENTP: 'Analyst', INFJ: 'Diplomat', INFP: 'Diplomat', ENFJ: 'Diplomat', ENFP: 'Diplomat', ISTJ: 'Sentinel', ISFJ: 'Sentinel', ESTJ: 'Sentinel', ESFJ: 'Sentinel', ISTP: 'Explorer', ISFP: 'Explorer', ESTP: 'Explorer', ESFP: 'Explorer' };

function mbtiImage(result: ResultDetail) {
  const item = result.snapshot.results[0];
  const type = (item?.resultKey || result.resultKey || '').toUpperCase();
  const image = item?.imageUrl || mbtiImages[type];
  return image?.startsWith('/test-results/') ? image.replace(/\.jpg$/i, '.png') : image;
}

function isMbtiResult(result: ResultDetail) {
  const type = (result.snapshot.results[0]?.resultKey || result.resultKey || '').toUpperCase();
  return result.testSlug === 'mbti-style' || Boolean(mbtiImages[type]);
}

function AnimalResultView({ result, retaking, onRetake }: { result: ResultDetail; retaking: boolean; onRetake: () => void }) {
  const isSpirit = result.testSlug === 'spirit-animal';
  const item = result.snapshot.results[0];
  const [primary = 'Unknown', secondary = 'Unknown'] = (result.resultKey || item?.resultKey || '').split('+');
  const description = item?.description || result.snapshot.description;
  const tally = Object.fromEntries(animalNames.map((animal) => [animal, typeof result.categoryScores[animal] === 'number' ? Number(result.categoryScores[animal]) : 0]));
  const totalPoints = Object.values(tally).reduce((sum, score) => sum + score, 0);
  const animalPercentages = animalNames.map((animal) => ({ animal, score: tally[animal], percentage: totalPoints ? Math.round((tally[animal] / totalPoints) * 100) : 0 })).sort((a, b) => b.score - a.score || animalNames.indexOf(a.animal) - animalNames.indexOf(b.animal));

  return <div className="result-page min-h-[calc(100vh-74px)] bg-[#fbfaf4] px-4 py-8 sm:px-8 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <section className="relative isolate overflow-hidden rounded-[2.25rem] border border-[#e8dfca] bg-[#f2ead7] shadow-[0_24px_70px_rgba(91,73,40,0.13)]">
        <img src="/test-backgrounds/hidden-animal.png" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25 mix-blend-multiply" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff9e9]/95 via-[#f4edda]/80 to-[#dbe8d9]/80" />
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#d6e4d0]/70" />
        <div className="relative grid items-center gap-8 p-7 sm:p-12 md:grid-cols-[1fr_250px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9b98f]/60 bg-white/65 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#806b3d]"><PawPrint className="h-4 w-4" /> Your {isSpirit ? 'spirit animal' : 'hidden animal'}</div>
            <p className="mt-6 text-sm font-medium text-[#7b705a]">A symbolic animal blend shaped by your choices</p>
            <h1 className="mt-2 font-serif text-5xl leading-[.95] tracking-tight text-[#3f4c36] sm:text-7xl">{primary}<span className="mx-3 text-[#b28d50]">+</span>{secondary}</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#665f50] sm:text-base">Your result is a reflection to explore, not a box to fit inside. Notice what feels familiar, and leave room for the parts that surprise you.</p>
            <div className="mt-7 flex flex-wrap gap-2"><span className="rounded-full bg-[#526b4b] px-4 py-2 text-xs font-bold text-white">Primary spirit · {primary}</span><span className="rounded-full bg-white/75 px-4 py-2 text-xs font-bold text-[#806b3d]">Secondary influence · {secondary}</span></div>
          </div>
          <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-[3rem] border border-white/70 bg-white/45 shadow-[0_18px_40px_rgba(83,71,42,0.15)] backdrop-blur-sm sm:h-60 sm:w-60"><img src="/test-illustrations/hidden-animal.svg" alt="Hidden animal illustration" className="h-36 w-36 sm:h-44 sm:w-44" /></div>
        </div>
      </section>

      <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-[#928b7c]">This is an entertainment and self-reflection result, not a clinical assessment or a fixed definition of who you are.</p>

      <section className="mt-8 rounded-[2rem] border border-[#e9e2d3] bg-white p-6 shadow-sm sm:p-9">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4e9] text-[#526b4b]"><Sparkles className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#806b3d]">Your animal blend</p><h2 className="mt-1 font-serif text-2xl text-[#3f4c36] sm:text-3xl">Two energies, one story</h2></div></div>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {([{ role: 'Primary', animal: primary, color: '#526b4b', icon: Star }, { role: 'Secondary', animal: secondary, color: '#b28d50', icon: PawPrint }] as Array<{ role: 'Primary' | 'Secondary'; animal: string; color: string; icon: typeof Star }>).map(({ role, animal, color, icon: AnimalIcon }) => { const profile = animalProfiles[animal]; return <article key={role} className="relative overflow-hidden rounded-3xl border border-[#eee8dc] bg-[#fcfbf7] p-6"><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full" style={{ backgroundColor: `${color}18` }} /><div className="relative"><span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}18`, color }}><AnimalIcon className="h-5 w-5" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[0.17em]" style={{ color }}>{role}</p><h3 className="mt-1 font-serif text-3xl text-[#3f4c36]">{animal}</h3><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#9b8a69]">Why did the {animal} find you?</p><p className="mt-2 text-sm leading-6 text-[#716b5d]">{profile?.why ?? `Your answers gave the ${animal} a meaningful place in your animal blend.`}</p><div className="mt-4 flex flex-wrap gap-1.5">{(profile?.energy ?? []).map((trait) => <span key={trait} className="rounded-full bg-[#f1f5eb] px-2.5 py-1 text-[11px] font-semibold text-[#526b4b]">{trait}</span>)}</div></div></article>; })}
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-[#e9e2d3] bg-white p-6 shadow-sm sm:p-9">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#806b3d]">Your animal spectrum</p><h2 className="mt-1 font-serif text-2xl text-[#3f4c36] sm:text-3xl">How the animals showed up</h2></div><span className="rounded-full bg-[#f1f5eb] px-3 py-1.5 text-xs font-semibold text-[#526b4b]">{totalPoints} total signals</span></div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#716b5d]">These percentages show the share of your animal signals across the full result. They complement your Primary and Secondary animals; they do not replace them.</p>
        <div className="mt-7 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">{animalPercentages.map(({ animal, percentage }) => <div key={`${animal}-image`} className={`rounded-2xl border p-3 text-center ${animal === primary ? 'border-[#8ca77e] bg-[#f1f6ed]' : animal === secondary ? 'border-[#d8bd86] bg-[#fff9ec]' : 'border-[#eee8dc] bg-[#fcfbf7]'}`}><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm" role="img" aria-label={animal}>{animalEmojis[animal] ?? '🐾'}</div><p className="mt-2 text-xs font-bold text-[#4f5b47]">{animal}</p><p className="mt-1 text-[11px] font-semibold text-[#9b8a69]">{percentage}%</p></div>)}</div>
        <div className="mt-7 space-y-4">{animalPercentages.map(({ animal, score, percentage }) => <div key={animal}><div className="flex items-center justify-between gap-3 text-sm"><span className={`font-semibold ${animal === primary ? 'text-[#526b4b]' : animal === secondary ? 'text-[#9b783d]' : 'text-[#6f6b61]'}`}>{animal}{animal === primary ? ' · Primary' : animal === secondary ? ' · Secondary' : ''}</span><span className="text-xs font-bold text-[#8d8779]">{percentage}% <span className="font-normal">({score})</span></span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#eeeade]"><span className="block h-full rounded-full bg-gradient-to-r from-[#526b4b] to-[#b28d50] transition-all" style={{ width: `${percentage}%` }} /></div></div>)}</div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-[#e9e2d3] bg-[#fffdf8] p-6 shadow-sm sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#806b3d]">The reading</p><h2 className="mt-2 font-serif text-2xl text-[#3f4c36]">What this combination invites you to notice</h2><p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-[#655f53]">{description}</p><div className="mt-6 rounded-2xl bg-[#f1f5eb] p-5"><p className="text-sm font-semibold text-[#526b4b]">A gentle prompt</p><p className="mt-2 text-sm leading-6 text-[#68715f]">Where do you see the {primary} in your everyday choices—and when does the {secondary} quietly guide you?</p></div></section>

      <div className="mt-8 flex flex-wrap gap-3"><button onClick={onRetake} disabled={retaking} className="rounded-full bg-[#526b4b] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#526b4b]/15 transition hover:-translate-y-0.5 hover:bg-[#40583b] disabled:opacity-50">{retaking ? 'Starting...' : 'Retake within 90 days'}</button><Link to="/dashboard" className="rounded-full border border-[#dcd4c3] bg-white px-6 py-3 text-sm font-semibold text-[#5d654f] transition hover:bg-[#f4f1e8]">View all my results</Link></div>
    </div>
  </div>;
}

function polishedLoveLanguageCopy(result: ResultDetail) {
  const [primary, secondary] = result.resultKey.split('+');
  if (result.testSlug !== 'five-love-languages' || !primary || !secondary) return null;
  const oldCopy = result.snapshot.description.includes('temporary') || result.snapshot.description.includes('final content');
  if (!oldCopy) return null;
  const primaryName = loveLanguageNames[primary] ?? primary;
  const secondaryName = loveLanguageNames[secondary] ?? secondary;
  return {
    title: `Primary: ${primaryName}, Secondary: ${secondaryName}`,
    description: `${primaryName} appears to be the clearest way you tend to notice care and feel emotionally connected. ${secondaryName} adds another meaningful layer to that pattern.\n\nYou may feel especially supported when people express care in these ways, and you may naturally offer the same kinds of signals to people close to you. Use this result as a conversation starter: share what makes you feel appreciated, and stay curious about the ways others receive care.\n\nThis is a self-reflection tool, not a clinical diagnosis or a fixed description of who you are.`
  };
}

const loveLanguageDetails: Record<string, { emoji: string; description: string; prompt: string }> = {
  WA: { emoji: '💬', description: 'You feel especially connected when appreciation is spoken clearly and sincerely.', prompt: 'Say the kind thing out loud.' },
  QT: { emoji: '⏳', description: 'Undivided attention and shared moments help you feel chosen and emotionally close.', prompt: 'Give someone your full presence.' },
  AS: { emoji: '🤝', description: 'Thoughtful help and reliable action can make care feel real and reassuring to you.', prompt: 'Turn care into one helpful action.' },
  TG: { emoji: '🎁', description: 'A meaningful gift can tell you that someone noticed, remembered, and thought of you.', prompt: 'Choose something personal, not expensive.' },
  PT: { emoji: '🫶', description: 'Warm, welcome physical affection can create comfort, safety, and closeness for you.', prompt: 'Offer affection with care and consent.' }
};

const innerChildDetails: Record<string, { emoji: string; subtitle: string; prompt: string }> = {
  SECURE_EMOTIONAL_FOUNDATION: { emoji: '🌱', subtitle: 'There is a steady, supported part of you that knows how to feel and reconnect.', prompt: 'Notice one thing that already helps you feel safe.' },
  MILD_EMOTIONAL_SENSITIVITY: { emoji: '🌿', subtitle: 'You may be becoming more aware of your emotional needs and the moments that shape them.', prompt: 'Give yourself permission to name what you need.' },
  UNRESOLVED_EMOTIONAL_PATTERNS: { emoji: '🪞', subtitle: 'Some older feelings or patterns may still be asking for patience, understanding, and care.', prompt: 'Respond to yourself with curiosity instead of criticism.' },
  STRONG_EMOTIONAL_SENSITIVITY: { emoji: '🌙', subtitle: 'You may experience feelings deeply and notice emotional signals that others miss.', prompt: 'Create a small ritual that helps you come back to calm.' },
  DEEP_EMOTIONAL_SENSITIVITY: { emoji: '🕯️', subtitle: 'Your inner world may carry powerful feelings, memories, and needs that deserve gentle attention.', prompt: 'Choose one supportive boundary for your emotional energy.' }
};

function InnerChildResultView({ result, retaking, onRetake }: { result: ResultDetail; retaking: boolean; onRetake: () => void }) {
  const detail = innerChildDetails[result.resultKey];
  const sections: Array<[string, string | null, string]> = [
    ['What this may reflect', result.snapshot.description, 'A gentle interpretation of your result'],
    ['Your strengths', result.snapshot.strengths, 'What you can lean on'],
    ['What may need care', result.snapshot.challenges, 'An invitation, not a judgment'],
    ['How to support yourself', result.snapshot.recommendations, 'Small steps to explore']
  ];
  const visibleSections = sections.filter(([, value]) => Boolean(value));
  const scoreEntries = Object.entries(result.categoryScores).filter(([, value]) => typeof value === 'number');

  return <div className="result-page min-h-[calc(100vh-74px)] bg-[#f5faf7] px-4 py-8 sm:px-8 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-[#d9e9e1] bg-gradient-to-br from-[#eaf6f0] via-[#fffdf8] to-[#edf4f8] p-7 shadow-[0_24px_70px_rgba(72,116,101,0.12)] sm:p-12">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#d0e9de]/60" /><div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#dae8f0]/55" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_230px]">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5e9180]">Inner child self-reflection</p><h1 className="mt-4 max-w-2xl font-serif text-5xl leading-[.98] tracking-tight text-[#31584e] sm:text-7xl">A gentler way<br />to understand you</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#60766f] sm:text-base">This result is a quiet invitation to notice your emotional needs with compassion. You do not have to fix everything at once.</p></div>
          <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-[3rem] border border-white/80 bg-white/65 text-8xl shadow-[0_18px_40px_rgba(72,116,101,0.14)]">{detail?.emoji ?? '🌱'}</div>
        </div>
      </section>

      <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-[#83958e]">This is a self-reflection exercise, not a clinical diagnosis or a fixed definition of your emotional life.</p>

      <section className="mt-8 rounded-[2rem] border border-[#dcebe3] bg-white p-6 shadow-sm sm:p-9"><div className="flex items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5e9180]">Your reflection profile</p><h2 className="mt-2 font-serif text-3xl text-[#31584e] sm:text-4xl">{result.snapshot.title}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#63776f]">{detail?.subtitle ?? 'A personal reflection on the emotional patterns and needs in your answers.'}</p></div><span className="hidden rounded-2xl bg-[#edf7f1] px-4 py-3 text-2xl sm:block">{detail?.emoji ?? '🌱'}</span></div>{scoreEntries.length > 0 && <div className="mt-7 grid gap-3 sm:grid-cols-2">{scoreEntries.map(([key, value]) => <div key={key} className="rounded-2xl bg-[#f6faf7] p-4"><div className="flex justify-between text-xs font-semibold text-[#66877b]"><span>{key.replaceAll('_', ' ')}</span><span>{String(value)}</span></div><div className="mt-3 h-2 rounded-full bg-[#e1eee7]"><span className="block h-2 rounded-full bg-[#79aa98]" style={{ width: `${Math.max(0, Math.min(100, Number(value)))}%` }} /></div></div>)}</div>}</section>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">{visibleSections.slice(1).map(([label, value, hint]) => <section key={label} className="rounded-[1.5rem] border border-[#dcebe3] bg-white p-6 shadow-sm sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5e9180]">{label}</p><p className="mt-2 text-xs text-[#9aaba4]">{hint}</p><p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#63776f]">{value}</p></section>)}</div>

      <section className="mt-5 rounded-[2rem] border border-[#dcebe3] bg-[#edf7f1] p-6 sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5e9180]">A gentle next step</p><p className="mt-4 text-lg font-semibold leading-8 text-[#3d6c5d]">{detail?.prompt ?? 'Ask yourself what would help you feel a little more supported today.'}</p></section>

      <div className="mt-8 flex flex-wrap gap-3"><button onClick={onRetake} disabled={retaking} className="rounded-full bg-[#5e9180] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5e9180]/15 transition hover:-translate-y-0.5 hover:bg-[#487666] disabled:opacity-50">{retaking ? 'Starting...' : 'Retake within 90 days'}</button><Link to="/dashboard" className="rounded-full border border-[#cfe1d8] bg-white px-6 py-3 text-sm font-semibold text-[#52796c] transition hover:bg-[#eef7f2]">View all my results</Link></div>
    </div>
  </div>;
}

function LoveLanguageResultView({ result, retaking, onRetake }: { result: ResultDetail; retaking: boolean; onRetake: () => void }) {
  const [primary = 'WA', secondary = 'QT'] = result.resultKey.split('+');
  const languages = Object.keys(loveLanguageNames);
  const scores = languages.map((code) => ({
    code,
    score: typeof result.categoryScores[code] === 'number' ? Number(result.categoryScores[code]) : 0
  })).sort((a, b) => b.score - a.score || languages.indexOf(a.code) - languages.indexOf(b.code));
  const primaryName = loveLanguageNames[primary] ?? primary;
  const secondaryName = loveLanguageNames[secondary] ?? secondary;

  return <div className="result-page min-h-[calc(100vh-74px)] bg-[#fff8f6] px-4 py-8 sm:px-8 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-[#f1d9d5] bg-gradient-to-br from-[#fff0ed] via-[#fffaf6] to-[#f9e8ef] p-7 shadow-[0_24px_70px_rgba(154,89,91,0.13)] sm:p-12">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#f4caca]/45" /><div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#ead7e6]/50" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_230px]">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a76568]">Your love language blend</p><h1 className="mt-4 font-serif text-5xl leading-[.95] tracking-tight text-[#5a3039] sm:text-7xl">How you feel<br />most loved</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#765f64] sm:text-base">Your result is a conversation starter about the kinds of care that tend to feel meaningful to you—not a rulebook for how love must look.</p><div className="mt-7 flex flex-wrap gap-2"><span className="rounded-full bg-[#a76568] px-4 py-2 text-xs font-bold text-white">Primary · {primaryName}</span><span className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-[#8b5c63]">Secondary · {secondaryName}</span></div></div>
          <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-[3rem] border border-white/80 bg-white/60 text-8xl shadow-[0_18px_40px_rgba(145,83,92,0.14)]">{loveLanguageDetails[primary]?.emoji ?? '💗'}</div>
        </div>
      </section>

      <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-[#a18a8e]">This is a self-reflection result, not a clinical diagnosis or a fixed definition of your relationships.</p>

      <section className="mt-8 rounded-[2rem] border border-[#f0e1df] bg-white p-6 shadow-sm sm:p-9"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0ed] text-2xl">💗</span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a76568]">Your top two signals</p><h2 className="mt-1 font-serif text-2xl text-[#5a3039] sm:text-3xl">The care that speaks to you</h2></div></div><div className="mt-7 grid gap-4 md:grid-cols-2">{[primary, secondary].map((code, index) => { const detail = loveLanguageDetails[code]; return <article key={`${code}-${index}`} className="rounded-3xl border border-[#f2e5e2] bg-[#fffaf8] p-6"><div className="flex items-center gap-4"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">{detail?.emoji ?? '💗'}</span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b17a7d]">{index === 0 ? 'Primary language' : 'Secondary language'}</p><h3 className="mt-1 font-serif text-2xl text-[#5a3039]">{loveLanguageNames[code] ?? code}</h3></div></div><p className="mt-5 text-sm leading-7 text-[#765f64]">{detail?.description}</p><div className="mt-4 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-semibold text-[#9b6068]">Try this: {detail?.prompt}</div></article>; })}</div></section>

      <section className="mt-5 rounded-[2rem] border border-[#f0e1df] bg-white p-6 shadow-sm sm:p-9"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a76568]">Your full profile</p><h2 className="mt-1 font-serif text-2xl text-[#5a3039] sm:text-3xl">All five ways love can land</h2></div><div className="mt-7 space-y-5">{scores.map(({ code, score }) => { const detail = loveLanguageDetails[code]; const isPrimary = code === primary; const isSecondary = code === secondary; return <div key={code}><div className="flex items-center justify-between gap-3"><span className={`flex items-center gap-3 text-sm font-semibold ${isPrimary ? 'text-[#9b5e66]' : isSecondary ? 'text-[#a87857]' : 'text-[#75666a]'}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4f1] text-2xl">{detail?.emoji}</span><span>{loveLanguageNames[code]}{isPrimary ? ' · Primary' : isSecondary ? ' · Secondary' : ''}</span></span><span className="text-sm font-bold text-[#92787e]">{score}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#f5e9e6]"><span className={`block h-full rounded-full ${isPrimary ? 'bg-[#b66c73]' : isSecondary ? 'bg-[#d29a78]' : 'bg-[#d9b5b2]'}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div></div>; })}</div></section>

      <section className="mt-5 rounded-[2rem] border border-[#f0e1df] bg-[#fffaf8] p-6 shadow-sm sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a76568]">Your reflection</p><p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-[#765f64]">{result.snapshot.description}</p></section>

      <div className="mt-8 flex flex-wrap gap-3"><button onClick={onRetake} disabled={retaking} className="rounded-full bg-[#a76568] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#a76568]/15 transition hover:-translate-y-0.5 hover:bg-[#8f555d] disabled:opacity-50">{retaking ? 'Starting...' : 'Retake within 90 days'}</button><Link to="/dashboard" className="rounded-full border border-[#e3cecf] bg-white px-6 py-3 text-sm font-semibold text-[#805b64] transition hover:bg-[#fff1ef]">View all my results</Link></div>
    </div>
  </div>;
}

function polishedCubeCopy(result: ResultDetail) {
  if (result.testSlug !== 'cube-personality') return null;
  return result.snapshot.results.map((item) => {
    const match = item.resultKey.match(/^cube_q(\d+)_/);
    const questionIndex = match ? Number(match[1]) - 1 : -1;
    const label = cubeReflectionNames[questionIndex];
    return label ? { ...item, title: `${label} reflection` } : item;
  });
}

function CubeResultView({ result, retaking, onRetake }: { result: ResultDetail; retaking: boolean; onRetake: () => void }) {
  const groups: Array<{ title: string; icon: typeof Box; color: string; keys: number[] }> = [
    { title: 'Self-Image', icon: Box, color: '#75639a', keys: [0] },
    { title: 'Relationships', icon: Compass, color: '#719b8d', keys: [1] },
    { title: 'Love Outlook', icon: Heart, color: '#bd7891', keys: [2] },
    { title: 'Resilience', icon: Mountain, color: '#c38b55', keys: [3] }
  ];
  const items = result.snapshot.results;
  function itemAt(index: number) {
    const item = items[index];
    if (!item) return null;
    return { ...item, title: cubeReflectionNames[index] ?? item.title, choice: item.description };
  }

  return <div className="result-page min-h-[calc(100vh-74px)] px-4 py-8 sm:px-8 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#e4e1f0] bg-gradient-to-br from-[#f0edfb] via-[#fffdfb] to-[#eef5f2] p-7 shadow-[0_20px_60px_rgba(73,57,88,0.08)] sm:p-11">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[#d9d2ed]/60" /><div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#dcebe4]/55" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_220px]">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#75639a]">Your reflection is ready</p><h1 className="mt-3 font-serif text-4xl leading-tight text-[#302447] sm:text-6xl">Your Cube<br />Reflection</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#626174]">A symbolic reading of the scene you imagined. Let each detail be a gentle prompt for curiosity, not a fixed definition of who you are.</p><div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-xs font-semibold text-[#75639a]"><Sparkles className="h-4 w-4" /> 15 moments of reflection</div></div>
          <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-[2.5rem] border border-white/80 bg-white/65 shadow-[0_18px_35px_rgba(73,57,88,0.12)]"><Box className="h-28 w-28 stroke-[1.1] text-[#75639a]" /></div>
        </div>
      </section>
      <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-slate-400">This is a symbolic self-reflection exercise, not a clinical diagnosis or a scientifically validated assessment.</p>
      <div className="mt-8 space-y-5">{groups.map((group) => { const Icon = group.icon; return <section key={group.title} className="rounded-[1.5rem] border border-[#eee5ed] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${group.color}18`, color: group.color }}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: group.color }}>A part of your scene</p><h2 className="mt-1 text-xl font-semibold text-[#302447]">{group.title}</h2></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{group.keys.map((index) => { const item = itemAt(index); if (!item) return null; return <article key={item.resultKey} className="rounded-2xl border border-[#f0ebf1] bg-[#fcfafc] p-5"><p className="text-xs font-semibold text-[#75639a]">{item.title}</p><p className="mt-2 font-serif text-lg leading-6 text-[#302447]">{item.choice}</p></article>; })}</div></section>; })}</div>
      <div className="mt-8 flex flex-wrap gap-3"><button onClick={onRetake} disabled={retaking} className="rounded-full bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:opacity-50">{retaking ? 'Starting...' : 'Retake within 90 days'}</button><button onClick={() => window.location.href = '/dashboard'} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">View all my results</button></div>
    </div>
  </div>;
}

function MbtiResultView({ result, retaking, onRetake }: { result: ResultDetail; retaking: boolean; onRetake: () => void }) {
  const item = result.snapshot.results[0];
  const type = item?.resultKey ?? result.resultKey;
  const image = mbtiImage(result);
  const sections: Array<[string, string | null, string]> = [
    ['Strengths', item?.strengths ?? result.snapshot.strengths ?? null, 'What comes naturally to you'],
    ['Challenges', item?.challenges ?? result.snapshot.challenges ?? null, 'A gentle area for growth'],
    ['Communication', item?.communication ?? result.snapshot.communication ?? null, 'How you tend to connect'],
    ['Relationships', item?.relationships ?? result.snapshot.relationships ?? null, 'Your way of relating'],
    ['Recommendations', item?.recommendations ?? result.snapshot.recommendations ?? null, 'Ideas to take with you']
  ];
  const visibleSections = sections.filter(([, value]) => Boolean(value));

  return <div className="result-page min-h-[calc(100vh-74px)] px-4 py-8 sm:px-8 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#dce7f1] bg-gradient-to-br from-[#edf5fb] via-white to-[#f6eff8] shadow-[0_22px_70px_rgba(61,82,112,0.12)]">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#cfe4f3]/60" /><div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#eadcf0]/60" />
        <div className="relative grid items-center gap-8 p-7 sm:p-11 md:grid-cols-[1fr_270px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#567da4]">Your personality profile</p>
            <p className="mt-5 inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-[#567da4] shadow-sm">{mbtiGroups[type] ?? 'Personality'} · MBTI-style reflection</p>
            <h1 className="mt-5 font-serif text-6xl leading-none tracking-tight text-[#283452] sm:text-8xl">{type}</h1>
            <h2 className="mt-4 max-w-xl text-xl font-semibold text-[#394d70] sm:text-2xl">Your unique way of seeing the world.</h2>
            <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-7 text-[#5f6c82] sm:text-base">{result.snapshot.description}</p>
          </div>
          <div className="mx-auto flex h-60 w-60 items-center justify-center sm:h-72 sm:w-72">
            {image ? <img src={image} alt={`${type} personality`} className="h-full w-full object-contain" /> : <Sparkles className="h-20 w-20 text-[#789bc0]" />}
          </div>
        </div>
      </section>

      <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-slate-400">This is a self-reflection profile, not a clinical diagnosis or a fixed definition of who you are.</p>

      {Object.keys(result.categoryScores).length > 0 && <section className="mt-8 rounded-[1.5rem] border border-[#e5eaf0] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#567da4]">Your preferences</p><h2 className="mt-2 font-serif text-2xl text-[#283452] sm:text-3xl">Dimension scores</h2></div><span className="hidden rounded-full bg-[#eef5fb] px-3 py-1.5 text-xs font-semibold text-[#567da4] sm:inline-flex">A snapshot, not a label</span></div><div className="mt-7 grid gap-5 sm:grid-cols-2">{Object.entries(result.categoryScores).map(([key, value], index) => { const score = typeof value === 'number' ? Math.max(0, Math.min(100, value)) : 0; return <div key={key} className="rounded-2xl bg-[#fafbfd] p-4"><div className="flex justify-between text-xs font-semibold text-[#66748a]"><span>{key}</span><span>{typeof value === 'number' ? `${value}%` : String(value)}</span></div><div className="mt-3 h-2 rounded-full bg-[#e8edf2]"><span className={`block h-2 rounded-full ${index % 2 ? 'bg-[#82b7b1]' : 'bg-[#7da8ce]'}`} style={{ width: `${score}%` }} /></div></div>; })}</div></section>}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">{visibleSections.map(([label, value, hint]) => <section key={label} className="rounded-[1.5rem] border border-[#e8e6eb] bg-white p-6 shadow-sm sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6a82a1]">{label}</p><p className="mt-2 text-xs text-[#a0a5b0]">{hint}</p><p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#5f6270]">{value}</p></section>)}</div>

      <div className="mt-8 flex flex-wrap gap-3"><button onClick={onRetake} disabled={retaking} className="rounded-full bg-[#354579] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#354579]/15 transition hover:-translate-y-0.5 hover:bg-[#283760] disabled:opacity-50">{retaking ? 'Starting...' : 'Retake within 90 days'}</button><Link to="/dashboard" className="rounded-full border border-[#d9dfe8] bg-white px-6 py-3 text-sm font-semibold text-[#44536d] transition hover:bg-[#f7f9fb]">View all my results</Link></div>
    </div>
  </div>;
}

export function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    if (!attemptId) return;
    ResultsApi.get(attemptId)
      .then((res) => setResult(res.result))
      .catch((err) => setError(err.message));
  }, [attemptId]);

  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!result) return (
    <div className="min-h-[calc(100vh-74px)] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-xl">
        <div className="rounded-[2rem] border border-[#eadff2] bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(92,69,110,0.12)] backdrop-blur-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f4edff] text-[#765c8d] shadow-inner shadow-[#e5d9f7]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e7dff0] border-t-[#765c8d]" aria-label="Loading" />
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-[#765c8d]">Processing</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#2d1f3e] sm:text-4xl">Loading your result...</h1>
          <p className="mt-3 text-sm leading-7 text-[#655d70]">جاري تجهيز نتيجتك... من فضلك انتظر قليلًا.</p>
        </div>
      </div>
    </div>
  );

  async function retakeTest() {
    setRetaking(true);
    try {
      const { attempt } = await AttemptsApi.create(result!.purchaseId);
      navigate(`/attempts/${attempt._id}/instructions`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && result?.testSlug) {
        navigate(`/tests/${result.testSlug}/checkout`);
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not start a new attempt.');
      setRetaking(false);
    }
  }

  if (result.testSlug === 'inner-child') return <InnerChildResultView result={result} retaking={retaking} onRetake={retakeTest} />;
  if (result.testSlug === 'five-love-languages') return <LoveLanguageResultView result={result} retaking={retaking} onRetake={retakeTest} />;
  if (result.testSlug === 'cube-personality') return <CubeResultView result={result} retaking={retaking} onRetake={retakeTest} />;
  if (result.testSlug === 'hidden-animal' || result.testSlug === 'spirit-animal') return <AnimalResultView result={result} retaking={retaking} onRetake={retakeTest} />;
  if (isMbtiResult(result)) return <MbtiResultView result={result} retaking={retaking} onRetake={retakeTest} />;

  const isMultiResult = result.snapshot.results.length > 1;
  const polishedCopy = polishedLoveLanguageCopy(result);
  const polishedCubeResults = polishedCubeCopy(result);
  const resultTitle = polishedCopy?.title ?? result.snapshot.title;
  const resultDescription = polishedCopy?.description ?? result.snapshot.description;

  const sections: Array<[string, string | null]> = [
    ['Strengths', result.snapshot.strengths],
    ['Challenges', result.snapshot.challenges],
    ['Communication', result.snapshot.communication],
    ['Relationships', result.snapshot.relationships],
    ['Recommendations', result.snapshot.recommendations]
  ];

  return (
    <div className="result-page min-h-[calc(100vh-74px)] px-4 py-8 sm:px-8 sm:py-12">
      <div className="result-shell mx-auto max-w-5xl">
        <main className="result-main">
        <div id="overview" className="result-summary rounded-2xl border border-[#eee5ed] bg-white px-6 py-8 shadow-sm sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#765c8d]">Your reflection is ready</p>
          <p className="mt-5 text-sm text-[#777080]">{result.testName}</p>
          {result.testSlug === 'mbti-style' && (result.snapshot.results[0]?.imageUrl || ['ENFP', 'INTJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'INTP', 'ENTJ', 'ENTP', 'INFP', 'INFJ'].includes(result.snapshot.results[0]?.resultKey ?? '')) && <img src={result.snapshot.results[0].imageUrl || (result.snapshot.results[0].resultKey === 'INTJ' ? '/test-results/intj.jpg' : result.snapshot.results[0].resultKey === 'ISTP' ? '/test-results/istp.jpg' : result.snapshot.results[0].resultKey === 'ISFP' ? '/test-results/isfp.jpg' : result.snapshot.results[0].resultKey === 'ESTP' ? '/test-results/estp.jpg' : result.snapshot.results[0].resultKey === 'ESFP' ? '/test-results/esfp.jpg' : result.snapshot.results[0].resultKey === 'ISTJ' ? '/test-results/istj.jpg' : result.snapshot.results[0].resultKey === 'ISFJ' ? '/test-results/isfj.jpg' : result.snapshot.results[0].resultKey === 'ESTJ' ? '/test-results/estj.jpg' : result.snapshot.results[0].resultKey === 'ESFJ' ? '/test-results/esfj.jpg' : result.snapshot.results[0].resultKey === 'INTP' ? '/test-results/intp.jpg' : result.snapshot.results[0].resultKey === 'ENTJ' ? '/test-results/entj.jpg' : result.snapshot.results[0].resultKey === 'ENTP' ? '/test-results/entp.jpg' : result.snapshot.results[0].resultKey === 'INFP' ? '/test-results/infp.jpg' : result.snapshot.results[0].resultKey === 'INFJ' ? '/test-results/infj.jpg' : '/test-results/enfp.jpg')} alt={result.snapshot.results[0].title} className="mt-5 h-56 w-full rounded-2xl object-contain object-right sm:h-72" />}
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#2d5680] sm:text-5xl">{resultTitle}</h1>
          {!isMultiResult && <p className="mt-4 max-w-2xl whitespace-pre-line leading-7 text-[#5f6270]">{resultDescription}</p>}
        </div>

        {Object.keys(result.categoryScores).length > 0 && <section id="dimension-scores" className="result-section mt-4 rounded-2xl border border-[#eee5ed] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-sm font-semibold text-[#302447]">Dimension Scores</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries(result.categoryScores).map(([key, value], index) => {
              const score = typeof value === 'number' ? Math.max(0, Math.min(100, value)) : 0;
              return <div key={key}><div className="flex justify-between text-xs font-semibold text-[#666879]"><span>{key}</span><span>{typeof value === 'number' ? `${value}%` : String(value)}</span></div><div className="mt-2 h-2 rounded-full bg-[#eeeaf1]"><span className={`block h-2 rounded-full ${index % 2 ? 'bg-[#71b7ad]' : 'bg-[#75a9d0]'}`} style={{ width: `${score}%` }} /></div></div>;
            })}
          </div>
        </section>}

      {isMultiResult ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(polishedCubeResults ?? result.snapshot.results).map((item) => (
            <div key={item.resultKey} className="rounded-3xl border border-white bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      ) : (
        sections
          .filter(([, value]) => Boolean(value))
          .map(([label, value]) => (
            <div id={label.toLowerCase()} key={label} className="result-section mt-4 rounded-2xl border border-[#eee5ed] bg-white p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">{label}</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{value}</p>
            </div>
          ))
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={retakeTest} disabled={retaking} className="rounded-full bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:opacity-50">
          {retaking ? 'Starting...' : 'Retake within 90 days'}
        </button>
        <Link to="/dashboard" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
          View all my results
        </Link>
      </div>
        </main>
      </div>
    </div>
  );
}
