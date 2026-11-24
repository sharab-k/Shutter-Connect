import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CreditCard, MapPin } from 'lucide-react';
import { Avatar, EmptyState, PageHeader, StatusBadge, Tabs } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { amountDue } from '../../lib/booking';
import { fmtDate, fmtTime, money } from '../../lib/utils';

type Tab = 'all' | 'requested' | 'confirmed' | 'completed' | 'closed';

export default function Bookings() {
  const { db, user, pro } = useStore();
  const isPro = user!.role === 'photographer';
  const [tab, setTab] = useState<Tab>('all');
  const list = db.bookings
    .filter((b) => (isPro ? b.photographerId === pro?.id : b.clientId === user!.id))
    .sort((a, b) => b.createdAt - a.createdAt);
  const filtered = list.filter((b) => (tab === 'all' ? true : tab === 'closed' ? b.status === 'declined' || b.status === 'cancelled' : b.status === tab));
  const count = (t: Tab) => list.filter((b) => (t === 'all' ? true : t === 'closed' ? b.status === 'declined' || b.status === 'cancelled' : b.status === t)).length;
  const name = (id: string) => db.photographers.find((p) => p.id === id)?.business ?? '';

  return (
    <>
      <PageHeader title={isPro ? 'Bookings' : 'My bookings'} sub={isPro ? 'Confirm or decline requests and track your shoots.' : 'Requests, confirmed shoots and past sessions.'} action={!isPro && <Link to="/app/explore" className="btn btn-primary">New booking</Link>} />
      {!isPro && list.some((b) => amountDue(b) || (b.status === 'completed' && !b.clientReviewed)) && (
        <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4" aria-label="Needs your action">
          <h2 className="mb-2 text-sm font-bold text-amber-900">Needs your action</h2>
          <ul className="space-y-1.5">
            {list.filter((b) => amountDue(b) || (b.status === 'completed' && !b.clientReviewed)).map((b) => {
              const due = amountDue(b);
              return <li key={b.id}><Link to={`/app/bookings/${b.id}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 text-sm hover:bg-amber-100/50"><span className="min-w-0 truncate font-semibold">{b.serviceName}</span><span className="shrink-0 text-amber-800">{due ? `${due.label}: ${money(due.amount)}` : 'Leave a review'}</span></Link></li>;
            })}
          </ul>
        </section>
      )}
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'all', label: 'All', count: count('all') },
        { id: 'requested', label: 'Requests', count: count('requested') },
        { id: 'confirmed', label: 'Confirmed', count: count('confirmed') },
        { id: 'completed', label: 'Completed', count: count('completed') },
        { id: 'closed', label: 'Declined / cancelled', count: count('closed') },
      ]} />
      <div className="mt-5 space-y-3">
        {filtered.length === 0 && <EmptyState icon={<CalendarCheck />} title="Nothing here yet" text="Bookings will show up in this list." />}
        {filtered.map((b) => {
          const who = isPro ? b.clientName : name(b.photographerId);
          const due = !isPro ? amountDue(b) : null;
          return (
            <Link key={b.id} to={`/app/bookings/${b.id}`} className="card flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:items-center sm:p-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <Avatar name={who} size={48} />
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold">{b.serviceName}</p>
                  <p className="truncate text-sm text-slate-500">{who}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs font-semibold text-slate-500">
                    <span>{fmtDate(b.date)} · {fmtTime(b.time)}</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={12} /> {b.location}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
                <StatusBadge status={b.status} />
                <p className="text-lg font-extrabold">{money(b.total)}</p>
                {due && <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600"><CreditCard size={13} /> Payment due</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
