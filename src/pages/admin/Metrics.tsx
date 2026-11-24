import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, DollarSign, Gavel, Percent, UserCheck, Users } from 'lucide-react';
import { PageHeader, Stat } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { money, money2, SUBSCRIPTION_PRICE_FMT } from './shared';

export default function AdminDashboard() {
  const { db } = useStore();
  const [now] = useState(() => Date.now());
  const pros = db.photographers;
  const approved = pros.filter((p) => p.status === 'approved');
  const pending = pros.filter((p) => p.status === 'pending');
  const gmv = db.payments.filter((p) => !p.refunded).reduce((s, p) => s + p.amount, 0);
  const fees = db.payments.filter((p) => !p.refunded).reduce((s, p) => s + p.fee, 0);
  const subs = pros.filter((p) => p.subscriptionActive).length * 199;
  const openDisputes = db.disputes.filter((d) => d.status === 'open').length;

  // last 6 weeks booking volume
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const end = now - (5 - i) * 7 * 86400000;
    const start = end - 7 * 86400000;
    return { label: `W${i + 1}`, n: db.bookings.filter((b) => b.createdAt > start && b.createdAt <= end).length };
  });
  const max = Math.max(1, ...weeks.map((w) => w.n));

  return (
    <>
      <PageHeader title="Platform metrics" sub="Lehigh Valley beta overview." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Approved photographers" value={approved.length} icon={<Users size={20} />} hint={`${pending.length} awaiting review`} />
        <Stat label="Total bookings" value={db.bookings.length} icon={<CalendarCheck size={20} />} tone="purple" />
        <Stat label="Gross volume (GMV)" value={money(gmv)} icon={<DollarSign size={20} />} tone="green" />
        <Stat label="Booking fees (2.25%)" value={money2(fees)} icon={<Percent size={20} />} tone="amber" />
        <Stat label="Subscription revenue" value={money(subs)} icon={<UserCheck size={20} />} hint={SUBSCRIPTION_PRICE_FMT} />
        <Stat label="Open disputes" value={openDisputes} icon={<Gavel size={20} />} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Bookings created per week</h2>
          <div className="mt-6 flex h-44 items-end gap-3" role="img" aria-label="Bar chart of bookings per week">
            {weeks.map((w) => (
              <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-extrabold">{w.n}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-plum-400" style={{ height: `${Math.max(6, (w.n / max) * 100)}%` }} />
                <span className="text-xs text-slate-500">{w.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Needs attention</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="flex items-center justify-between rounded-xl bg-amber-50 p-3 font-bold text-amber-900" to="/app/applications">Applications to review <span>{pending.length}</span></Link></li>
            <li><Link className="flex items-center justify-between rounded-xl bg-rose-50 p-3 font-bold text-rose-900" to="/app/disputes">Open disputes <span>{openDisputes}</span></Link></li>
          </ul>
        </section>
      </div>
    </>
  );
}
