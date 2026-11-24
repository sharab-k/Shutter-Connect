import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, iso, todayISO } from '../lib/utils';

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface DayInfo {
  disabled?: boolean;
  dots?: ('blue' | 'green' | 'amber' | 'red')[];
  muted?: boolean;
}

export function MonthGrid({
  selected,
  onSelect,
  info,
  className,
}: {
  selected?: string | null;
  onSelect?: (date: string) => void;
  info: (date: string) => DayInfo;
  className?: string;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lead = first.getDay();
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => iso(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)))];
  const today = todayISO();
  const dot = { blue: 'bg-brand-500', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500' };

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-extrabold">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        <div className="flex gap-1">
          <button type="button" aria-label="Previous month" className="btn btn-ghost !p-2" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Next month" className="btn btn-ghost !p-2" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
        {DOW.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const inf = info(d);
          const sel = selected === d;
          return (
            <button
              key={d}
              type="button"
              disabled={inf.disabled}
              onClick={() => onSelect?.(d)}
              aria-pressed={sel}
              aria-label={d}
              className={cn(
                'relative aspect-square rounded-xl text-sm font-bold transition',
                sel ? 'bg-brand-600 text-white shadow-lift' : inf.disabled ? 'cursor-not-allowed text-slate-300' : 'text-ink hover:bg-brand-50',
                d === today && !sel && 'ring-1 ring-brand-300',
                inf.muted && !sel && 'bg-slate-50 text-slate-400',
              )}
            >
              {Number(d.slice(8))}
              {inf.dots && inf.dots.length > 0 && (
                <span className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5">
                  {inf.dots.slice(0, 3).map((c, k) => (
                    <span key={k} className={cn('h-1 w-1 rounded-full', sel ? 'bg-white' : dot[c])} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
