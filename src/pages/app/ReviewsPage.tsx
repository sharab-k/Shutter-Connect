import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Avatar, EmptyState, PageHeader, Stars } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { timeAgo } from '../../lib/utils';

export default function ReviewsPage() {
  const { db, pro, ratingOf } = useStore();
  if (!pro) return null;
  const r = ratingOf(pro.id);
  const list = db.reviews.filter((x) => x.toId === pro.id && x.fromRole === 'client').sort((a, b) => b.at - a.at);
  const toLeave = db.bookings.filter((b) => b.photographerId === pro.id && b.status === 'completed' && !b.photographerReviewed);
  return (
    <>
      <PageHeader title="Reviews" sub="What clients say about you, and reviews you owe clients." />
      <div className="card mb-6 flex items-center gap-5 p-5">
        <p className="text-5xl font-extrabold">{r.count ? r.avg.toFixed(1) : '—'}</p>
        <div><Stars value={r.avg} size={20} /><p className="mt-1 text-sm text-slate-500">{r.count} review{r.count !== 1 && 's'}</p></div>
      </div>
      {toLeave.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-extrabold">Review your clients</h2>
          <div className="space-y-2">{toLeave.map((b) => (
            <Link key={b.id} to={`/app/bookings/${b.id}`} className="card flex items-center gap-3 p-4 hover:shadow-lift"><Avatar name={b.clientName} size={40} /><span className="flex-1"><b>{b.clientName}</b><span className="block text-xs text-slate-500">{b.serviceName}</span></span><span className="btn btn-primary">Review</span></Link>
          ))}</div>
        </section>
      )}
      <div className="space-y-3">
        {list.length === 0 && <EmptyState icon={<Star />} title="No reviews yet" />}
        {list.map((x) => (
          <div key={x.id} className="card p-5"><div className="flex items-center gap-3"><Avatar name={x.fromName} size={40} /><div className="flex-1"><p className="font-extrabold">{x.fromName}</p><p className="text-xs text-slate-500">{timeAgo(x.at)}</p></div><Stars value={x.rating} /></div><p className="mt-3 text-sm text-slate-600">{x.text}</p></div>
        ))}
      </div>
    </>
  );
}
