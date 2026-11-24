import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { BadgeCheck, CheckCircle2, ImageOff, Star, X, AlertCircle, Info } from 'lucide-react';
import { cn, img, initials } from '../lib/utils';
import ArtPhoto from './ArtPhoto';
import type { BookingStatus } from '../data/types';

export function Logo({ light = false, mark = false, className }: { light?: boolean; mark?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden className="shrink-0">
        <rect width="32" height="32" rx="9" fill={light ? '#fff' : '#0A3CFF'} />
        <circle cx="16" cy="16" r="7.5" fill="none" stroke={light ? '#0A3CFF' : '#fff'} strokeWidth="2.6" />
        <circle cx="16" cy="16" r="2.6" fill="#F2E76A" />
      </svg>
      {!mark && <span className={cn('font-display text-[26px] italic leading-none tracking-tight', light ? 'text-white' : 'text-ink')}>Shutter Connect</span>}
      {mark && <span className="sr-only">Shutter Connect</span>}
    </span>
  );
}

const palette = ['from-brand-600 to-plum-500', 'from-teal-500 to-brand-600', 'from-plum-500 to-plum-300', 'from-brand-800 to-brand-500', 'from-teal-600 to-plum-500'];

export function Avatar({ name, size = 40, className }: { name: string; size?: number; className?: string }) {
  const hue = palette[(name.charCodeAt(0) + name.length) % palette.length];
  return (
    <span
      aria-hidden
      className={cn('inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-extrabold text-white', hue, className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

export function Photo({ seed, w = 800, h = 600, alt = '', className, priority }: { seed: string; w?: number; h?: number; alt?: string; className?: string; priority?: boolean }) {
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const remote = !seed.startsWith('data:');
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!remote || !ref.current) return;
    // Once the photo is on screen: if the image host is slow or unreachable, show generated artwork instead of an empty box.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !timer) timer = setTimeout(() => setState((s) => (s === 'loading' ? 'fallback' : s)), 4500);
    });
    io.observe(ref.current);
    return () => { io.disconnect(); if (timer) clearTimeout(timer); };
  }, [remote, seed]);
  if (state === 'fallback') return <ArtPhoto seed={seed} alt={alt} className={className} />;
  return (
    <img
      ref={ref}
      src={remote ? img(seed, w, h) : seed}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setState('ready')}
      onError={() => setState('fallback')}
      className={cn('object-cover transition-opacity duration-300', state === 'ready' ? 'opacity-100' : 'skeleton opacity-90', className)}
    />
  );
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} star${i > 1 ? 's' : ''}`} onClick={() => onChange(i)} className="rounded p-1">
          <Star size={30} className={i <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'} />
        </button>
      ))}
    </div>
  );
}

export function Badge({ children, tone = 'slate', className }: { children: ReactNode; tone?: 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'yellow'; className?: string }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-sun-300/40 text-yellow-900',
  };
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold', tones[tone], className)}>{children}</span>;
}

export const VettedBadge = () => (
  <Badge tone="yellow">
    <BadgeCheck size={13} /> Stamp of Approval
  </Badge>
);

const statusTone: Record<BookingStatus, 'amber' | 'green' | 'red' | 'slate' | 'blue'> = {
  requested: 'amber',
  confirmed: 'green',
  declined: 'red',
  cancelled: 'slate',
  completed: 'blue',
};
export const StatusBadge = ({ status }: { status: BookingStatus }) => <Badge tone={statusTone[status]} className="capitalize">{status}</Badge>;

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={cn('pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-brand-600' : 'bg-slate-300')}>
      <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked && 'translate-x-5')} />
    </button>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card grid place-items-center gap-3 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icon}</div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      {text && <p className="max-w-sm text-sm text-slate-500">{text}</p>}
      {action}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn('whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition', value === t.id ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}
        >
          {t.label}
          {t.count !== undefined && <span className={cn('ml-1.5 rounded-full px-1.5 text-xs', value === t.id ? 'bg-white/25' : 'bg-slate-100')}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, icon, hint, tone = 'blue' }: { label: string; value: ReactNode; icon: ReactNode; hint?: string; tone?: 'blue' | 'purple' | 'green' | 'amber' }) {
  const t = { blue: 'bg-brand-50 text-brand-600', purple: 'bg-purple-50 text-plum-500', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600' }[tone];
  return (
    <div className="card flex items-start gap-4 p-5">
      <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', t)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-extrabold leading-tight">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* Toasts */
type ToastKind = 'success' | 'error' | 'info';
const ToastCtx = createContext<(msg: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; kind: ToastKind }[]>([]);
  const push = useCallback((msg: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, msg, kind }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="pop pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl bg-brand-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl">
            {t.kind === 'success' ? <CheckCircle2 size={18} className="shrink-0 text-emerald-400" /> : t.kind === 'error' ? <AlertCircle size={18} className="shrink-0 text-rose-400" /> : <Info size={18} className="shrink-0 text-sky-300" />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
