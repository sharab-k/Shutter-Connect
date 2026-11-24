import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight, BadgeCheck, CalendarCheck, Check, Circle, CreditCard, DollarSign, FolderDown, Inbox, Search, Star, UserCheck, Users, Clock } from 'lucide-react';
import { Avatar, Badge, EmptyState, PageHeader, Stat, StatusBadge } from '../../components/ui';
import { amountDue, useStore } from '../../store/AppStore';
import { cn, fmtDate, fmtTime, money, money2, todayISO } from '../../lib/utils';
import AdminDashboard from '../admin/Metrics';
import type { Booking } from '../../data/types';

export default function Dashboard() {
  const { user } = useStore();
  if (user?.role === 'admin') return <AdminDashboard />;
  return user?.role === 'photographer' ? <ProDashboard /> : <ClientDashboard />;
}

function BookingRow({ b, who }: { b: Booking; who: string }) {
  return (
    <Link to={`/app/bookings/${b.id}`} className="flex items-center gap-4 rounded-xl p-3 transition hover:bg-brand-50/60">
      <Avatar name={who} size={42} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold">{b.serviceName}</p>
        <p className="truncate text-sm text-slate-500">{who} · {fmtDate(b.date)}, {fmtTime(b.time)}</p>
      </div>
      <StatusBadge status={b.status} />
    </Link>
  );
}

function ClientDashboard() {
  const { db, user } = useStore();
  const mine = db.bookings.filter((b) => b.clientId === user!.id).sort((a, b) => a.date.localeCompare(b.date));
  const proName = (id: string) => db.photographers.find((p) => p.id === id)?.business ?? '';
  const upcoming = mine.filter((b) => (b.status === 'confirmed' || b.status === 'requested') && b.date >= todayISO());
  const actions = mine.filter((b) => amountDue(b) || (b.status === 'completed' && !b.clientReviewed));
  return (
    <>
      <PageHeader title={`Hi, ${user!.name.split(' ')[0]} 👋`} sub="Here's what's happening with your bookings." action={<Link to="/app/explore" className="btn btn-cta"><Search size={16} /> Find a photographer</Link>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Upcoming" value={upcoming.length} icon={<CalendarCheck size={20} />} />
        <Stat label="Needs your action" value={actions.length} icon={<Clock size={20} />} tone="amber" />
        <Stat label="Total spent" value={money(mine.reduce((s, b) => s + b.paid, 0))} icon={<CreditCard size={20} />} tone="green" />
      </div>

      {user!.idStatus !== 'verified' && (
        <div className="card mt-6 flex flex-col gap-3 border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center">
          <UserCheck className="text-brand-600" size={26} />
          <div className="flex-1"><p className="font-extrabold">Verify your identity</p><p className="text-sm text-slate-600">Optional, but verified clients get faster confirmations and a trust badge.</p></div>
          <Link to="/app/settings" className="btn btn-primary">Verify now</Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card min-w-0 p-5">
          <h2 className="mb-2 text-lg font-extrabold">Action needed</h2>
          {actions.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">You're all caught up.</p> : actions.map((b) => {
            const due = amountDue(b);
            return (
              <Link key={b.id} to={`/app/bookings/${b.id}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-brand-50/60">
                <span className={cn('grid h-10 w-10 place-items-center rounded-xl', due ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600')}>{due ? <CreditCard size={18} /> : <Star size={18} />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{b.serviceName}</span><span className="text-sm text-slate-500">{due ? `${due.label}: ${money2(due.amount)}` : 'Leave a review'}</span></span>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>
            );
          })}
        </section>
        <section className="card min-w-0 p-5">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-extrabold">Upcoming</h2><Link to="/app/bookings" className="text-sm font-bold text-brand-600">View all</Link></div>
          {upcoming.length === 0 ? <EmptyState icon={<CalendarCheck />} title="No upcoming bookings" action={<Link to="/app/explore" className="btn btn-primary">Find a photographer</Link>} /> : upcoming.slice(0, 4).map((b) => <BookingRow key={b.id} b={b} who={proName(b.photographerId)} />)}
        </section>
      </div>
    </>
  );
}

function ProDashboard() {
  const { db, pro, user, ratingOf } = useStore();
  if (!pro) return null;
  const mine = db.bookings.filter((b) => b.photographerId === pro.id);
  const requests = mine.filter((b) => b.status === 'requested');
  const upcoming = mine.filter((b) => b.status === 'confirmed' && b.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date));
  const pay = db.payments.filter((p) => p.photographerId === pro.id && !p.refunded);
  const net = pay.reduce((s, p) => s + p.amount - p.fee, 0);
  const r = ratingOf(pro.id);
  const checklist = [
    { done: pro.services.length > 0 && !!pro.bio, label: 'Complete your profile and services', to: '/app/profile' },
    { done: pro.portfolio.length >= 3, label: 'Add at least 3 portfolio photos', to: '/app/profile' },
    { done: pro.subscriptionActive, label: 'Activate your $199/yr membership', to: '/app/settings' },
    { done: pro.stripeConnected, label: 'Connect Stripe to get paid', to: '/app/settings' },
    { done: pro.dropboxConnected, label: 'Connect Dropbox for photo delivery', to: '/app/settings' },
    { done: user!.idStatus === 'verified', label: 'Verify your identity', to: '/app/settings' },
    { done: pro.status === 'approved', label: 'Get approved by our team', to: '/app' },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  return (
    <>
      <PageHeader title={`Welcome, ${pro.name.split(' ')[0]}`} sub={pro.business} action={pro.status === 'approved' ? <Link to={`/app/p/${pro.id}`} className="btn btn-outline">View public profile</Link> : <Badge tone="amber">Pending review</Badge>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New requests" value={requests.length} icon={<Inbox size={20} />} tone="amber" />
        <Stat label="Upcoming shoots" value={upcoming.length} icon={<CalendarCheck size={20} />} />
        <Stat label="Net earnings" value={money(net)} icon={<DollarSign size={20} />} tone="green" hint="After 2.25% platform fee" />
        <Stat label="Rating" value={r.count ? r.avg.toFixed(1) : '—'} icon={<Star size={20} />} tone="purple" hint={`${r.count} reviews`} />
      </div>

      <nav aria-label="Manage your business" className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[['Bookings','/app/bookings',CalendarCheck],['Calendar','/app/calendar',Clock],['Services','/app/services',Briefcase],['Profile','/app/profile',UserCheck],['Earnings','/app/earnings',DollarSign],['Reviews','/app/reviews',Star]].map(([l,to,Ic]) => {
          const Icon = Ic as typeof Star;
          return <Link key={l as string} to={to as string} className="card flex flex-col items-center gap-2 px-2 py-4 text-xs font-semibold transition hover:bg-slate-50"><Icon size={22} className="text-brand-600" />{l as string}</Link>;
        })}
      </nav>

      {doneCount < checklist.length && (
        <section className="card mt-6 p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Get your profile live</h2><span className="text-sm font-bold text-brand-600">{doneCount}/{checklist.length}</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cta transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} /></div>
          <ul className="mt-4 grid gap-1 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link to={c.to} className="flex items-center gap-3 rounded-xl p-2.5 text-sm font-semibold hover:bg-brand-50/60">
                  {c.done ? <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white"><Check size={14} /></span> : <Circle size={24} className="text-slate-300" />}
                  <span className={c.done ? 'text-slate-400 line-through' : ''}>{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card min-w-0 p-5">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-extrabold">Booking requests</h2><Link to="/app/bookings" className="text-sm font-bold text-brand-600">View all</Link></div>
          {requests.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No pending requests.</p> : requests.map((b) => <BookingRow key={b.id} b={b} who={b.clientName} />)}
        </section>
        <section className="card min-w-0 p-5">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-extrabold">Upcoming shoots</h2><Link to="/app/calendar" className="text-sm font-bold text-brand-600">Calendar</Link></div>
          {upcoming.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Nothing scheduled.</p> : upcoming.slice(0, 4).map((b) => <BookingRow key={b.id} b={b} who={b.clientName} />)}
        </section>
      </div>
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-hero p-5 text-white">
        <BadgeCheck className="shrink-0 text-sun-300" /> <p className="text-sm font-semibold">{pro.vetted ? 'You have the Stamp of Approval badge.' : 'Once approved, you will earn the Stamp of Approval badge.'}</p>
      </div>
    </>
  );
}

export { FolderDown, Users };
