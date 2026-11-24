import { CreditCard, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { Badge, EmptyState, PageHeader, Stat } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { money2, timeAgo } from '../../lib/utils';
import { SUBSCRIPTION_PRICE } from '../../data/types';

export default function Earnings() {
  const { db, pro } = useStore();
  if (!pro) return null;
  const pays = db.payments.filter((p) => p.photographerId === pro.id).sort((a, b) => b.at - a.at);
  const live = pays.filter((p) => !p.refunded);
  const gross = live.reduce((s, p) => s + p.amount, 0);
  const fees = live.reduce((s, p) => s + p.fee, 0);
  const owed = db.bookings.filter((b) => b.photographerId === pro.id && (b.status === 'confirmed' || b.status === 'completed')).reduce((s, b) => s + (b.total - b.paid), 0);

  return (
    <>
      <PageHeader title="Earnings" sub="Payments collected through Stripe." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Gross revenue" value={money2(gross)} icon={<DollarSign size={20} />} />
        <Stat label="Platform fees (2.25%)" value={money2(fees)} icon={<Receipt size={20} />} tone="amber" />
        <Stat label="Net payout" value={money2(gross - fees)} icon={<TrendingUp size={20} />} tone="green" />
        <Stat label="Still to be paid" value={money2(owed)} icon={<CreditCard size={20} />} tone="purple" hint="On confirmed & completed jobs" />
      </div>
      <p className="mt-4 text-sm text-slate-500">Annual membership: ${SUBSCRIPTION_PRICE}/year · {pro.subscriptionActive ? 'Active' : 'Not active'}</p>

      <section className="card mt-6 overflow-hidden">
        <h2 className="border-b border-slate-100 p-5 text-lg font-extrabold">Transactions</h2>
        {pays.length === 0 ? <EmptyState icon={<Receipt />} title="No payments yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Booking</th><th>Type</th><th className="text-right">Amount</th><th className="text-right">Fee</th><th className="px-5 text-right">Net</th></tr></thead>
              <tbody>
                {pays.map((p) => {
                  const b = db.bookings.find((x) => x.id === p.bookingId);
                  return (
                    <tr key={p.id} className="border-t border-slate-50">
                      <td className="px-5 py-3"><p className="font-bold">{b?.serviceName}</p><p className="text-xs text-slate-500">{b?.clientName} · {timeAgo(p.at)}</p></td>
                      <td className="capitalize">{p.refunded ? <Badge tone="red">Refunded</Badge> : <Badge>{p.stage}</Badge>}</td>
                      <td className="text-right font-bold">{money2(p.amount)}</td>
                      <td className="text-right text-slate-500">-{money2(p.fee)}</td>
                      <td className="px-5 text-right font-extrabold">{money2(p.amount - p.fee)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
