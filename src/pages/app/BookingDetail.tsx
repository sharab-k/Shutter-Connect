import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Bell, CalendarPlus, Check, CreditCard, Download, ExternalLink, FileImage, Lock, MapPin, MessageSquare, Star, X } from 'lucide-react';
import { Avatar, Badge, EmptyState, Field, Modal, StarInput, Stars, StatusBadge, useToast } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { amountDue, CANCELLATION_POLICY, cancellationRefund } from '../../lib/booking';
import { addHours, cn, fmtDate, fmtTime, money2 } from '../../lib/utils';
import { PLATFORM_FEE } from '../../data/types';
import { payLabel } from '../PhotographerProfile';

export default function BookingDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { db, user, respond, cancel, pay, complete, setDelivery, addReview, openDispute, pro, clientRating } = useStore();
  const b = db.bookings.find((x) => x.id === id);
  const [payOpen, setPayOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [link, setLink] = useState('');

  const isPro = user?.role === 'photographer';
  const p = b && db.photographers.find((x) => x.id === b.photographerId);
  const allowed = b && user && (user.role === 'admin' || b.clientId === user.id || p?.userId === user.id);
  if (!b || !p || !allowed) return <EmptyState icon={<X />} title="Booking not found" action={<Link to="/app/bookings" className="btn btn-primary">Back to bookings</Link>} />;

  const due = !isPro ? amountDue(b) : null;
  const remaining = Math.max(0, b.total - b.paid);
  const unlocked = b.status === 'completed' && remaining <= 0 && !!b.deliveryLink;
  const reviewed = isPro ? b.photographerReviewed : b.clientReviewed;
  const dispute = db.disputes.find((d) => d.bookingId === b.id);
  const otherName = isPro ? b.clientName : p.business;
  const thread = `${b.clientId}__${p.id}`;
  const fee = Math.round(b.paid * PLATFORM_FEE * 100) / 100;
  const clientUser = db.users.find((u) => u.id === b.clientId);
  const cRating = clientRating(b.clientId);

  const timeline = [
    { label: 'Requested', done: true },
    { label: b.status === 'declined' ? 'Declined' : 'Confirmed', done: b.status !== 'requested' },
    { label: 'Paid', done: b.paid >= b.total || (b.paymentMode === 'deposit' && b.paid > 0) },
    { label: 'Completed', done: b.status === 'completed' },
    { label: 'Delivered', done: !!b.deliveryLink },
  ];

  const ics = () => {
    const d = b.date.replace(/-/g, '');
    const t = (x: string) => x.replace(':', '') + '00';
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Shutter Connect//EN', 'BEGIN:VEVENT', `UID:${b.id}@shutterconnect`, `DTSTART:${d}T${t(b.time)}`, `DTEND:${d}T${t(addHours(b.time, b.durationHrs))}`, `SUMMARY:${b.serviceName} (${otherName})`, `LOCATION:${b.location}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
    a.download = 'shutter-connect-booking.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <Link to="/app/bookings" className="btn btn-ghost -ml-3 mb-2"><ArrowLeft size={16} /> All bookings</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{b.serviceName}</h1>
          <p className="mt-1 text-sm text-slate-500">Booking #{b.id.slice(0, 7).toUpperCase()}</p>
        </div>
        <StatusBadge status={b.status} />
      </div>

      {/* Timeline */}
      {b.status !== 'declined' && b.status !== 'cancelled' && (
        <ol className="card mb-6 flex items-center overflow-x-auto p-4 sm:p-5" aria-label="Booking progress">
          {timeline.map((s, i) => (
            <li key={s.label} className="flex min-w-fit flex-1 items-center gap-2 last:flex-none">
              <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold', s.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500')}>{s.done ? <Check size={14} /> : i + 1}</span>
              <span className={cn('text-xs font-bold sm:text-sm', s.done ? 'text-ink' : 'text-slate-400')}>{s.label}</span>
              {i < timeline.length - 1 && <span className={cn('mx-1 h-0.5 min-w-4 flex-1 rounded', s.done ? 'bg-emerald-300' : 'bg-slate-200')} />}
            </li>
          ))}
        </ol>
      )}
      {b.status === 'declined' && <div className="mb-6 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">This request was declined.{b.declineReason && <> Reason: “{b.declineReason}”</>}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* Action banner */}
          {!isPro && due && (
            <div className="card flex flex-col gap-3 border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
              <CreditCard className="text-amber-600" />
              <div className="flex-1"><p className="font-extrabold">{due.label}: {money2(due.amount)}</p><p className="text-sm text-amber-900/70">{b.status === 'confirmed' ? 'Pay to secure your date.' : 'Your files unlock once your balance is paid.'}</p></div>
              <button className="btn btn-cta" onClick={() => setPayOpen(true)}>Pay now</button>
            </div>
          )}
          {isPro && b.status === 'requested' && (
            <div className="card flex flex-col gap-3 border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center">
              <div className="flex-1"><p className="font-extrabold">New request from {b.clientName}</p><p className="text-sm text-slate-600">Confirming adds it to your calendar and blocks that time.</p></div>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={() => setDeclineOpen(true)}>Decline</button>
                <button className="btn btn-primary" onClick={() => { const err = respond(b.id, true); if (err) toast(err, 'error'); else toast('Booking confirmed and added to your calendar.'); }}>Confirm</button>
              </div>
            </div>
          )}

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-extrabold">Session details</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Date</dt><dd className="font-extrabold">{fmtDate(b.date)}</dd></div>
              <div><dt className="text-slate-500">Time</dt><dd className="font-extrabold">{fmtTime(b.time)} – {fmtTime(addHours(b.time, b.durationHrs))}</dd></div>
              <div className="sm:col-span-2"><dt className="text-slate-500">Location</dt><dd className="flex items-center gap-1.5 font-extrabold"><MapPin size={15} className="text-brand-600" /> {b.location}</dd></div>
              {b.notes && <div className="sm:col-span-2"><dt className="text-slate-500">Notes</dt><dd className="rounded-xl bg-slate-50 p-3">{b.notes}</dd></div>}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {b.status === 'confirmed' && <button className="btn btn-outline" onClick={ics}><CalendarPlus size={16} /> Add to calendar</button>}
              <Link to={`/app/messages/${thread}`} className="btn btn-outline"><MessageSquare size={16} /> Message {otherName}</Link>
              {(b.status === 'requested' || b.status === 'confirmed') && (user?.role !== 'admin') && (
                <button className="btn btn-ghost text-rose-600 hover:bg-rose-50" onClick={() => setCancelOpen(true)}>Cancel booking</button>
              )}
            </div>
            {b.status === 'confirmed' && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs font-semibold text-brand-800"><Bell size={14} /> Automatic email reminders will be sent 24 hours and 2 hours before this session.</p>
            )}
          </section>

          {/* Delivery */}
          {b.status === 'completed' && (
            <section className="card p-5 sm:p-6">
              <h2 className="mb-1 text-lg font-extrabold">Photos & files</h2>
              {isPro ? (
                b.deliveryLink ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm">
                    <Check className="text-emerald-600" size={18} /> <span className="flex-1 font-semibold">Gallery shared with {b.clientName}.</span>
                    <a href={b.deliveryLink} target="_blank" rel="noreferrer" className="btn btn-outline">Open <ExternalLink size={14} /></a>
                    <button className="btn btn-ghost" onClick={() => { setLink(b.deliveryLink ?? ''); setDeliverOpen(true); }}>Change</button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-sm text-slate-500">Share a Dropbox gallery link. The client can download once the job is paid in full.</p>
                    <button className="btn btn-primary mt-4" onClick={() => setDeliverOpen(true)}><FileImage size={16} /> Deliver files</button>
                  </div>
                )
              ) : unlocked ? (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-square overflow-hidden rounded-xl bg-brand-100"><img src={`https://picsum.photos/seed/${b.id}-${i}/200/200`} alt="" className="h-full w-full object-cover" loading="lazy" /></div>)}
                  </div>
                  <a href={b.deliveryLink} target="_blank" rel="noreferrer" className="btn btn-cta"><Download size={16} /> Download from Dropbox</a>
                </div>
              ) : (
                <div className="mt-3 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <Lock size={18} className="mt-0.5 shrink-0 text-slate-500" />
                  <p className="text-slate-600">{remaining > 0 ? `Your files unlock after the remaining ${money2(remaining)} is paid.` : 'Your photographer has not shared the files yet. You will be notified when they are ready.'}</p>
                </div>
              )}
            </section>
          )}

          {b.status === 'completed' && !reviewed && (
            <section className="card flex flex-col gap-3 border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center">
              <Star className="text-amber-500" />
              <div className="flex-1"><p className="font-extrabold">How was your experience with {otherName}?</p><p className="text-sm text-slate-600">Reviews help keep the community safe and reliable.</p></div>
              <button className="btn btn-primary" onClick={() => setReviewOpen(true)}>Leave a review</button>
            </section>
          )}
          {b.status === 'completed' && reviewed && <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><Check size={16} /> Thanks, your review has been submitted.</p>}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="card p-5">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">{isPro ? 'Client' : 'Photographer'}</p>
            <div className="flex items-center gap-3">
              <Avatar name={otherName} size={48} />
              <div className="min-w-0"><p className="truncate font-extrabold">{otherName}</p>{!isPro && <Link to={`/app/p/${p.id}`} className="text-sm font-bold text-brand-600">View profile</Link>}</div>
            </div>
            {isPro && clientUser && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-sm">
                <Badge tone={clientUser.idStatus === 'verified' ? 'green' : 'slate'}>{clientUser.idStatus === 'verified' ? 'ID verified' : 'ID not verified'}</Badge>
                {cRating.count > 0 ? <span className="inline-flex items-center gap-1.5"><Stars value={cRating.avg} /> <b>{cRating.avg.toFixed(1)}</b> <span className="text-slate-400">({cRating.count})</span></span> : <span className="text-slate-500">No reviews yet</span>}
              </div>
            )}
          </section>
          <section className="card p-5">
            <h3 className="mb-3 font-extrabold">Payment</h3>
            <Badge tone="purple" className="mb-4">{payLabel(b.paymentMode, b.depositPct)}</Badge>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Total</dt><dd className="font-bold">{money2(b.total)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Paid</dt><dd className="font-bold text-emerald-600">{money2(b.paid)}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="text-slate-500">Remaining</dt><dd className="font-extrabold">{money2(remaining)}</dd></div>
              {isPro && b.paid > 0 && <div className="flex justify-between text-xs"><dt className="text-slate-500">Platform fee (2.25%)</dt><dd>-{money2(fee)}</dd></div>}
              {isPro && b.paid > 0 && <div className="flex justify-between"><dt className="text-slate-500">Your payout</dt><dd className="font-extrabold">{money2(b.paid - fee)}</dd></div>}
            </dl>
          </section>
          {isPro && b.status === 'confirmed' && (
            <button className="btn btn-primary w-full" onClick={() => { complete(b.id); toast('Marked as completed.'); }}><Check size={16} /> Mark session completed</button>
          )}
          {!isPro && user?.role === 'client' && (b.status === 'completed' || b.status === 'confirmed') && (
            dispute ? <Badge tone="amber" className="w-full justify-center py-2"><AlertTriangle size={14} /> Dispute {dispute.status}</Badge> : <button className="btn btn-ghost w-full text-slate-500" onClick={() => setDisputeOpen(true)}><AlertTriangle size={16} /> Report a problem</button>
          )}
        </aside>
      </div>

      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} amount={due?.amount ?? 0} label={due?.label ?? ''} onPaid={() => { pay(b.id); setPayOpen(false); toast('Payment successful. Receipt sent to your email.'); }} />

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this booking?">
        <div className="space-y-4 text-sm">
          <p className="rounded-xl bg-slate-50 p-3 text-slate-600">{CANCELLATION_POLICY}</p>
          <p className="font-bold">{b.paid > 0 ? `If you cancel now, you will be refunded ${money2(cancellationRefund(b, !isPro))} of the ${money2(b.paid)} paid.` : 'Nothing has been paid, so there is nothing to refund.'}</p>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={() => setCancelOpen(false)}>Keep booking</button>
            <button className="btn btn-danger" onClick={() => { const r = cancel(b.id); setCancelOpen(false); toast(r > 0 ? `Booking cancelled. ${money2(r)} refunded.` : 'Booking cancelled.', 'info'); }}>Cancel booking</button>
          </div>
        </div>
      </Modal>

      <Modal open={declineOpen} onClose={() => setDeclineOpen(false)} title="Decline this request?">
        <Field label="Reason (optional, shared with the client)"><textarea className="input min-h-24" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Already booked that weekend" /></Field>
        <div className="mt-5 flex justify-end gap-2"><button className="btn btn-ghost" onClick={() => setDeclineOpen(false)}>Keep request</button><button className="btn btn-danger" onClick={() => { respond(b.id, false, text); setDeclineOpen(false); setText(''); toast('Request declined.', 'info'); }}>Decline</button></div>
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title={`Review ${otherName}`}>
        <div className="space-y-4">
          <StarInput value={rating} onChange={setRating} />
          <Field label="Your review"><textarea className="input min-h-28" value={text} onChange={(e) => setText(e.target.value)} placeholder="Share what went well…" /></Field>
          <div className="flex justify-end gap-2"><button className="btn btn-ghost" onClick={() => setReviewOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={text.trim().length < 5} onClick={() => { addReview(b.id, rating, text.trim()); setReviewOpen(false); setText(''); toast('Review submitted. Thank you!'); }}>Submit review</button></div>
        </div>
      </Modal>

      <Modal open={disputeOpen} onClose={() => setDisputeOpen(false)} title="Report a problem">
        <Field label="What went wrong?" hint="Our team will review and contact both parties."><textarea className="input min-h-28" value={text} onChange={(e) => setText(e.target.value)} /></Field>
        <div className="mt-5 flex justify-end gap-2"><button className="btn btn-ghost" onClick={() => setDisputeOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={text.trim().length < 10} onClick={() => { openDispute(b.id, text.trim()); setDisputeOpen(false); setText(''); toast('Dispute opened. We will be in touch.', 'info'); }}>Submit</button></div>
      </Modal>

      <Modal open={deliverOpen} onClose={() => setDeliverOpen(false)} title="Deliver files via Dropbox">
        <div className="space-y-4">
          {!pro?.dropboxConnected && <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">Connect Dropbox in Settings to browse folders. You can still paste a shared link below.</p>}
          <Field label="Dropbox shared link"><input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.dropbox.com/sh/…" /></Field>
          <div className="flex justify-end gap-2"><button className="btn btn-ghost" onClick={() => setDeliverOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={!/^https?:\/\/.+\..+/.test(link)} onClick={() => { setDelivery(b.id, link.trim()); setDeliverOpen(false); toast('Files delivered to the client.'); }}>Share with client</button></div>
        </div>
      </Modal>
    </>
  );
}

function PaymentModal({ open, onClose, amount, label, onPaid }: { open: boolean; onClose: () => void; amount: number; label: string; onPaid: () => void }) {
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [exp, setExp] = useState('12 / 34');
  const [cvc, setCvc] = useState('123');
  const ok = card.replace(/\s/g, '').length >= 15 && exp.length >= 4 && cvc.length >= 3;
  const go = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); onPaid(); }, 1300);
  };
  return (
    <Modal open={open} onClose={() => !busy && onClose()} title={label || 'Payment'}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-hero p-4 text-white"><p className="text-xs font-bold uppercase tracking-wider text-sun-300">Amount due</p><p className="text-3xl font-extrabold">{money2(amount)}</p></div>
        <Field label="Card number"><input className="input" inputMode="numeric" value={card} onChange={(e) => setCard(e.target.value)} autoComplete="cc-number" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry"><input className="input" value={exp} onChange={(e) => setExp(e.target.value)} autoComplete="cc-exp" /></Field>
          <Field label="CVC"><input className="input" inputMode="numeric" value={cvc} onChange={(e) => setCvc(e.target.value)} autoComplete="cc-csc" /></Field>
        </div>
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500"><Lock size={12} className="mr-1 inline" /> Demo mode: no real charge is made. In production this is Stripe's secure Payment Sheet (test card 4242 4242 4242 4242 shown).</p>
        <button className="btn btn-cta w-full !py-3" disabled={busy || !ok} onClick={go}>{busy ? 'Processing…' : `Pay ${money2(amount)}`}</button>
      </div>
    </Modal>
  );
}
