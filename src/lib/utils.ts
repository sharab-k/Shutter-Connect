export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
export const money = (n: number) => usd0.format(n);
export const money2 = (n: number) => usd2.format(n);

export const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 9);

export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayISO = () => iso(new Date());
export const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (n: number, from: Date = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const fmtDate = (s: string) =>
  parseISO(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
export const fmtDateShort = (s: string) =>
  parseISO(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const fmtTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
export const addHours = (t: string, hrs: number) => {
  const [h, m] = t.split(':').map(Number);
  const total = h * 60 + m + hrs * 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
export const timeAgo = (ts: number) => {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
export const img = (seed: string, w = 800, h = 600) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
