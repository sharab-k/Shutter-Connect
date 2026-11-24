import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock, ShieldCheck } from 'lucide-react';
import { MonthGrid } from '../components/MonthGrid';
import { Avatar, Field, useToast } from '../components/ui';
import { useStore } from '../store/AppStore';
import { CANCELLATION_POLICY, slotsFor } from '../lib/booking';
import { addHours, cn, fmtDate, fmtTime, money, money2, todayISO } from '../lib/utils';
import { payLabel } from './PhotographerProfile';
import { useBase } from '../lib/social';

const STEPS = ['Service', 'Date & time', 'Details'];

export default function BookingRequest() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const { db, user, requestBooking } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const base = useBase();
  const p = db.photographers.find((x) => x.id === id);

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(sp.get('service') ?? '');
  const [date, setDate] = useState<string | null>(sp.get('date'));
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { if (serviceId && step === 0 && sp.get('service')) setStep(1); /* deep link */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return <Navigate to="/login" state={{ next: base.book(id ?? '') }} replace />;
  if (user.role !== 'client') return <Navigate to={base.pro(id ?? '')} replace />;
  if (!p) return <Navigate to={base.explore} replace />;

  const service = p.services.find((s) => s.id === serviceId);
  const slots = service && date ? slotsFor(p, date, service.durationHrs, db.bookings) : [];
  const dueNow = service ? (service.paymentMode === 'deposit' ? Math.round(service.price * service.depositPct / 100) : service.paymentMode === 'upfront' ? service.price : 0) : 0;

  const canNext = step === 0 ? !!service : step === 1 ? !!date && !!time : location.trim().length > 2;

  const submit = () => {
    if (!service || !date) return;
    const b = requestBooking({ photographerId: p.id, serviceId: service.id, date, time, location: location.trim(), notes: notes.trim() });
    if (b) {
      toast('Request sent! You will be notified when the photographer responds.');
      nav(`/app/bookings/${b.id}`);
    }
  };

  return (
    <div className="container-x max-w-5xl py-8 sm:py-10">
      <Link to={base.pro(p.id)} className="btn btn-ghost -ml-3 mb-2"><ArrowLeft size={16} /> Back to profile</Link>
      <h1 className="text-2xl font-extrabold sm:text-3xl">Request a booking</h1>

      <ol className="mt-6 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold', i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500')}>{i < step ? <Check size={16} /> : i + 1}</span>
            <span className={cn('hidden text-sm font-bold sm:block', i === step ? 'text-ink' : 'text-slate-400')}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-0.5 flex-1 rounded bg-slate-200" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="card p-5 sm:p-7">
          {step === 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-extrabold">Choose a service</h2>
              {p.services.map((s) => (
                <button key={s.id} onClick={() => { setServiceId(s.id); setTime(''); }} aria-pressed={serviceId === s.id} className={cn('flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition', serviceId === s.id ? 'border-brand-600 bg-brand-50' : 'border-slate-100 hover:border-brand-200')}>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{s.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{s.description}</p>
                    <p className="mt-1.5 text-xs font-bold text-plum-500">{payLabel(s.paymentMode, s.depositPct)} · {s.durationHrs} hr</p>
                  </div>
                  <p className="text-xl font-extrabold">{money(s.price)}</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && service && (
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="mb-4 text-lg font-extrabold">Pick a date</h2>
                <MonthGrid
                  selected={date}
                  onSelect={(d) => { setDate(d); setTime(''); }}
                  info={(d) => {
                    const free = slotsFor(p, d, service.durationHrs, db.bookings).length > 0;
                    return { disabled: !free || d <= todayISO(), dots: free ? ['green'] : [] };
                  }}
                />
                <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Available</p>
              </div>
              <div>
                <h2 className="mb-4 text-lg font-extrabold">Pick a start time</h2>
                {!date ? <p className="text-sm text-slate-500">Select a date to see open times.</p> : slots.length === 0 ? <p className="text-sm text-slate-500">No times left on this day.</p> : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slots.map((t) => (
                      <button key={t} onClick={() => setTime(t)} aria-pressed={time === t} className={cn('rounded-xl border-2 px-2 py-2.5 text-sm font-bold transition', time === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-100 hover:border-brand-300')}>{fmtTime(t)}</button>
                    ))}
                  </div>
                )}
                {date && time && <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm font-semibold text-brand-800"><Clock size={14} className="mr-1.5 inline" />{fmtDate(date)}, {fmtTime(time)} – {fmtTime(addHours(time, service.durationHrs))}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-extrabold">Shoot details</h2>
              <Field label="Location" hint="Address, venue or general area">
                <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lehigh Canal Park, Bethlehem" />
              </Field>
              <Field label="Notes for the photographer" hint="Group size, style, must-have shots, special requests">
                <textarea className="input min-h-28" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tell them about your shoot…" />
              </Field>
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><b>Cancellation policy:</b> {CANCELLATION_POLICY}</p>
              <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">
                <p className="flex gap-2 font-extrabold"><ShieldCheck size={18} className="shrink-0" /> You won't be charged yet</p>
                <p className="mt-1 text-brand-800/80">{p.name.split(' ')[0]} will confirm or decline your request.{service && service.paymentMode !== 'after' ? ` After confirmation you'll pay ${service.paymentMode === 'upfront' ? 'in full' : `a ${service.depositPct}% deposit`} to lock in the date.` : ' Payment is due after your session.'} Confirmed bookings are added to both calendars and you'll get automatic email reminders.</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button>
            {step < 2 ? (
              <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={16} /></button>
            ) : (
              <button className="btn btn-cta" disabled={!canNext} onClick={submit}>Send request</button>
            )}
          </div>
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <Avatar name={p.name} size={44} />
            <div className="min-w-0"><p className="truncate font-extrabold">{p.business}</p><p className="text-xs text-slate-500">{p.city}, {p.state}</p></div>
          </div>
          <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Service</dt><dd className="text-right font-bold">{service?.name ?? '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Date</dt><dd className="text-right font-bold">{date ? fmtDate(date) : '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Time</dt><dd className="text-right font-bold">{time ? fmtTime(time) : '—'}</dd></div>
          </dl>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total</span><b className="text-lg">{service ? money2(service.price) : '—'}</b></div>
            {service && <div className="flex justify-between"><span className="text-slate-500">Due after confirmation</span><b>{money2(dueNow)}</b></div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
