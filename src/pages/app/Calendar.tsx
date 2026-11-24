import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Clock, MapPin } from 'lucide-react';
import { MonthGrid } from '../../components/MonthGrid';
import { PageHeader, StatusBadge, Toggle, useToast } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { cn, fmtDate, fmtTime, addHours, todayISO } from '../../lib/utils';
import type { DayHours } from '../../data/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

export default function Calendar() {
  const { db, pro, updatePro } = useStore();
  const toast = useToast();
  const [sel, setSel] = useState<string | null>(todayISO());
  if (!pro) return null;

  const mine = db.bookings.filter((b) => b.photographerId === pro.id && (b.status === 'confirmed' || b.status === 'requested' || b.status === 'completed'));
  const onDay = (d: string) => mine.filter((b) => b.date === d);
  const blocked = (d: string) => pro.blockedDates.includes(d);

  const setDay = (i: number, v: DayHours | null) => updatePro({ availability: pro.availability.map((x, k) => (k === i ? v : x)) });
  const toggleBlock = (d: string) => {
    updatePro({ blockedDates: blocked(d) ? pro.blockedDates.filter((x) => x !== d) : [...pro.blockedDates, d] });
    toast(blocked(d) ? 'Date reopened.' : 'Date blocked. Clients cannot book it.', 'info');
  };

  return (
    <>
      <PageHeader title="Calendar & availability" sub="Confirmed bookings automatically block your time." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="card p-5 sm:p-6">
          <MonthGrid
            selected={sel}
            onSelect={setSel}
            info={(d) => ({
              muted: blocked(d),
              dots: [...onDay(d).map((b) => (b.status === 'confirmed' ? 'green' : b.status === 'requested' ? 'amber' : 'blue') as 'green' | 'amber' | 'blue'), ...(blocked(d) ? (['red'] as const) : [])],
            })}
          />
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmed</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-500" /> Request</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-brand-500" /> Completed</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-500" /> Blocked</span>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-extrabold">{sel ? fmtDate(sel) : 'Select a day'}</h2>
          {sel && (
            <>
              <div className="mt-3 space-y-2">
                {onDay(sel).length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">{blocked(sel) ? 'This day is blocked.' : 'No bookings.'}</p>}
                {onDay(sel).map((b) => (
                  <Link key={b.id} to={`/app/bookings/${b.id}`} className="block rounded-xl border border-slate-100 p-3 transition hover:border-brand-300">
                    <div className="flex items-center justify-between gap-2"><p className="truncate font-extrabold">{b.serviceName}</p><StatusBadge status={b.status} /></div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Clock size={12} /> {fmtTime(b.time)} – {fmtTime(addHours(b.time, b.durationHrs))} · {b.clientName}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={12} /> {b.location}</p>
                  </Link>
                ))}
              </div>
              {sel > todayISO() && (
                <button className={cn('btn mt-4 w-full', blocked(sel) ? 'btn-outline' : 'btn-ghost border border-slate-200')} onClick={() => toggleBlock(sel)}><Ban size={15} /> {blocked(sel) ? 'Unblock this day' : 'Block this day'}</button>
              )}
            </>
          )}
        </section>

        <section className="card p-5 sm:p-6 lg:col-span-2">
          <h2 className="text-lg font-extrabold">Weekly hours</h2>
          <p className="mb-4 text-sm text-slate-500">Clients can request any open hour inside these windows.</p>
          <div className="grid gap-2 md:grid-cols-2">
            {DAYS.map((name, i) => {
              const h = pro.availability[i];
              return (
                <div key={name} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <Toggle checked={!!h} onChange={(v) => setDay(i, v ? { start: '09:00', end: '17:00' } : null)} label={`${name} available`} />
                  <span className="w-24 font-extrabold">{name}</span>
                  {h ? (
                    <span className="flex items-center gap-2 text-sm">
                      <select className="input !w-auto !py-1.5" aria-label={`${name} start`} value={h.start} onChange={(e) => setDay(i, { ...h, start: e.target.value, end: e.target.value >= h.end ? addHours(e.target.value, 1) : h.end })}>{HOURS.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}</select>
                      to
                      <select className="input !w-auto !py-1.5" aria-label={`${name} end`} value={h.end} onChange={(e) => setDay(i, { ...h, end: e.target.value })}>{HOURS.filter((t) => t > h.start).map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}</select>
                    </span>
                  ) : <span className="text-sm text-slate-400">Unavailable</span>}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
