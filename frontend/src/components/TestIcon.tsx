import type { SVGProps } from 'react';
import { Baby, BrainCircuit, Briefcase, Feather, FingerprintPattern, HeartHandshake, Mountain, Shapes, Sparkles } from 'lucide-react';

type IconProps = SVGProps<SVGSVGElement> & { slug: string };

const icons = {
  'mbti-style': FingerprintPattern,
  'inner-child': Baby,
  'five-love-languages': HeartHandshake,
  'hidden-animal': Feather,
  'cube-personality': Mountain,
  yourenergy: Sparkles,
  employee: Briefcase,
  'genius-adhd-profile': BrainCircuit
};

export function TestIcon({ slug, className, ...props }: IconProps) {
  const Icon = icons[slug as keyof typeof icons] ?? Shapes;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.8} {...props} />;
}

export function testIconTone(slug: string) {
  const tones: Record<string, string> = {
    'mbti-style': 'bg-[#f0edfb] text-[#8d82c2]',
    'inner-child': 'bg-[#edf3ef] text-[#789b91]',
    'five-love-languages': 'bg-[#fff0f2] text-[#c88ca0]',
    'hidden-animal': 'bg-[#fff4e9] text-[#c99a6b]',
    'cube-personality': 'bg-[#f1edfb] text-[#8a80bd]',
    'relationship-compatibility': 'bg-[#edf6f4] text-[#78a49b]',
    'cognitive-reasoning': 'bg-[#eef2fb] text-[#7d8fbe]',
    yourenergy: 'bg-[#fff8e6] text-[#c9a24a]',
    employee: 'bg-[#eef2fb] text-[#7d8fbe]',
    'genius-adhd-profile': 'bg-[#edf6f4] text-[#5f9c8f]'
  };
  return tones[slug] ?? 'bg-[#f1edfb] text-[#8a80bd]';
}
