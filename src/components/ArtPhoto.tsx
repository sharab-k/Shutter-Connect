import { useId } from 'react';

/** Small seeded PRNG so every seed always renders the same picture. */
const rng = (seed: string) => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hills = (r: () => number, base: number, amp: number) => {
  const pts = 7;
  const ph = r() * 6;
  let d = `M0 500 L0 ${base}`;
  for (let i = 0; i <= pts; i++) {
    const x = (i / pts) * 400;
    const y = base + Math.sin(ph + i * 0.9) * amp + (r() - 0.5) * amp * 0.8;
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + ' L400 500 Z';
};

/** A soft, stylised dusk/dawn landscape generated from a seed. Used when remote photos are unavailable. */
export default function ArtPhoto({ seed, alt, className }: { seed: string; alt: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  const r = rng(seed);
  const hue = Math.floor(r() * 360);
  const warm = r() > 0.45;
  const top = `hsl(${hue} 55% 22%)`;
  const mid = `hsl(${(hue + 30) % 360} 65% 52%)`;
  const bot = warm ? `hsl(${20 + r() * 25} 90% 70%)` : `hsl(${(hue + 60) % 360} 70% 75%)`;
  const sunX = 60 + r() * 280;
  const sunY = 180 + r() * 120;
  const layers = [
    { d: hills(r, 330 + r() * 30, 22), c: `hsl(${(hue + 10) % 360} 35% 32%)` },
    { d: hills(r, 380 + r() * 20, 18), c: `hsl(${(hue + 5) % 360} 40% 22%)` },
    { d: hills(r, 430 + r() * 15, 12), c: `hsl(${hue} 45% 12%)` },
  ];
  return (
    <svg role="img" aria-label={alt} viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className={className}>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset=".55" stopColor={mid} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
        <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <rect width="400" height="500" fill={`url(#${id}s)`} />
      <circle cx={sunX} cy={sunY} r="70" fill={warm ? '#FFE9A8' : '#F6F0FF'} opacity=".55" filter={`url(#${id}b)`} />
      <circle cx={sunX} cy={sunY} r="24" fill={warm ? '#FFF4CF' : '#FFFFFF'} opacity=".9" />
      {layers.map((l, i) => <path key={i} d={l.d} fill={l.c} />)}
    </svg>
  );
}
