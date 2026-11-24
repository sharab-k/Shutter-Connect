import { Link } from 'react-router-dom';
import { Gavel, Receipt } from 'lucide-react';
import { Badge, EmptyState, PageHeader, useToast } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { money2, timeAgo } from '../../lib/utils';

export function Transactions() {
  const { db } = useStore();
  const list = [...db.payments].sort((a, b) => b.at - a.at);
  const total = list.filter((p) => !p.refunded).reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <PageHeader title="Transactions" sub={`${list.length} payments · ${money2(total)} processed`} />
      {list.length === 0 ? <EmptyState icon={<Receipt />} title="No transactions" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Booking</th><th>Photographer</th><th>Type</th><th className="text-right">Amount</th><th className="px-5 text-right">Fee</th></tr></thead>
            <tbody>
              {list.map((p) => {
                const b = db.bookings.find((x) => x.id === p.bookingId);
                const pr = db.photographers.find((x) => x.id === p.photographerId);
                return (
                  <tr key={p.id} className="border-t border-slate-50">
                    <td className="px-5 py-3"><Link to={`/app/bookings/${p.bookingId}`} className="font-bold text-brand-700">{b?.serviceName}</Link><p className="text-xs text-slate-500">{b?.clientName} · {timeAgo(p.at)}</p></td>
                    <td>{pr?.business}</td>
                    <td>{p.refunded ? <Badge tone="red">Refunded</Badge> : <Badge className="capitalize">{p.stage}</Badge>}</td>
                    <td className="text-right font-bold">{money2(p.amount)}</td>
                    <td className="px-5 text-right text-slate-500">{money2(p.fee)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function Disputes() {
  const { db, resolveDispute } = useStore();
  const toast = useToast();
  const list = [...db.disputes].sort((a, b) => b.at - a.at);
  return (
    <>
      <PageHeader title="Disputes" sub="Review reported problems and resolve them." />
      {list.length === 0 && <EmptyState icon={<Gavel />} title="No disputes" />}
      <div className="space-y-3">
        {list.map((d) => {
          const b = db.bookings.find((x) => x.id === d.bookingId);
          const opener = db.users.find((u) => u.id === d.openedBy)?.name ?? 'User';
          return (
            <div key={d.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><Link to={`/app/bookings/${d.bookingId}`} className="font-extrabold text-brand-700">{b?.serviceName}</Link><p className="text-sm text-slate-500">Opened by {opener} · {timeAgo(d.at)}</p></div>
                <Badge tone={d.status === 'open' ? 'amber' : d.status === 'refunded' ? 'red' : 'green'} className="capitalize">{d.status}</Badge>
              </div>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">{d.reason}</p>
              {d.status === 'open' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn btn-primary" onClick={() => { resolveDispute(d.id, false); toast('Dispute resolved.'); }}>Resolve, no refund</button>
                  <button className="btn btn-outline text-rose-600" onClick={() => { resolveDispute(d.id, true); toast('Payment refunded and dispute closed.', 'info'); }}>Refund client</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
