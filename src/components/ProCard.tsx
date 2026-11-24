import { Link } from 'react-router-dom';
import { BadgeCheck, Star } from 'lucide-react';
import { Photo } from './ui';
import { useStore } from '../store/AppStore';
import { useBase } from '../lib/social';
import { money } from '../lib/utils';
import type { Photographer } from '../data/types';

export default function ProCard({ p }: { p: Photographer }) {
  const { ratingOf } = useStore();
  const base = useBase();
  const r = ratingOf(p.id);
  const from = p.services.length ? Math.min(...p.services.map((s) => s.price)) : 0;
  return (
    <Link to={base.pro(p.id)} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-100">
        <Photo seed={p.portfolio[0] ?? p.id} w={640} h={800} alt={`${p.business} portfolio`} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
        {from > 0 && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white px-3 py-1 text-[13px] font-bold shadow-sm">from {money(from)}</span>}
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1 truncate text-[15px] font-bold">{p.business}{p.vetted && <BadgeCheck size={15} className="shrink-0 fill-brand-600 text-white" aria-label="Vetted" />}</h3>
          <p className="truncate text-sm text-slate-500">{p.niches.slice(0, 2).join(' · ')} · {p.city}</p>
        </div>
        <p className="flex shrink-0 items-center gap-1 text-sm font-semibold">{r.count ? <><Star size={14} className="fill-ink" />{r.avg.toFixed(1)}</> : <span className="text-xs text-slate-400">New</span>}</p>
      </div>
    </Link>
  );
}
