import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, MessageCircle, Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import ProCard from '../components/ProCard';
import { PostModal } from '../components/social';
import { EmptyState, Modal, Photo } from '../components/ui';
import { useStore } from '../store/AppStore';
import { slotsFor } from '../lib/booking';
import { CITIES, NICHES } from '../data/types';
import { cn, todayISO } from '../lib/utils';
import { milesBetween } from '../lib/booking';
import { likeCount } from '../lib/social';

export default function SearchPage() {
  const { db, ratingOf } = useStore();
  const [sp, setSp] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const tab = sp.get('tab') === 'posts' ? 'posts' : 'pros';
  const q = sp.get('q') ?? '';
  const niche = sp.get('niche') ?? '';
  const city = sp.get('city') ?? '';
  const maxPrice = Number(sp.get('max') ?? 0);
  const minRating = Number(sp.get('rating') ?? 0);
  const radius = Number(sp.get('radius') ?? 0);
  const vettedOnly = sp.get('vetted') === '1';
  const date = sp.get('date') ?? '';
  const sort = sp.get('sort') ?? 'rating';

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    setSp(n, { replace: true });
  };
  const clear = () => setSp(tab === 'posts' ? { tab: 'posts' } : {}, { replace: true });

  const results = useMemo(() => {
    const list = db.photographers.filter((p) => {
      if (p.status !== 'approved' || !p.subscriptionActive || p.services.length === 0) return false;
      if (niche && !p.niches.includes(niche)) return false;
      if (city && (radius > 0 ? milesBetween(city, p.city) > radius : p.city !== city)) return false;
      if (vettedOnly && !p.vetted) return false;
      const from = Math.min(...p.services.map((s) => s.price));
      if (maxPrice && from > maxPrice) return false;
      if (minRating && ratingOf(p.id).avg < minRating) return false;
      if (q) {
        const hay = `${p.name} ${p.business} ${p.niches.join(' ')} ${p.city} ${p.tagline}`.toLowerCase();
        if (!q.toLowerCase().replace('#', '').split(' ').every((w) => hay.includes(w))) return false;
      }
      if (date) {
        const shortest = Math.min(...p.services.map((s) => s.durationHrs));
        if (!slotsFor(p, date, shortest, db.bookings).length) return false;
      }
      return true;
    });
    const price = (p: (typeof list)[number]) => Math.min(...p.services.map((s) => s.price));
    return list.sort((a, b) => (sort === 'price' ? price(a) - price(b) : sort === 'reviews' ? ratingOf(b.id).count - ratingOf(a.id).count : ratingOf(b.id).avg - ratingOf(a.id).avg));
  }, [db, q, niche, city, radius, maxPrice, minRating, vettedOnly, date, sort, ratingOf]);

  const liveIds = useMemo(() => new Set(db.photographers.filter((p) => p.status === 'approved' && p.subscriptionActive).map((p) => p.id)), [db.photographers]);
  const posts = useMemo(() => {
    const needle = q.toLowerCase().replace('#', '');
    return db.posts
      .filter((p) => liveIds.has(p.photographerId))
      .filter((p) => {
        const pro = db.photographers.find((x) => x.id === p.photographerId);
        if (niche && !pro?.niches.includes(niche) && !p.tags.includes(niche.toLowerCase())) return false;
        if (city && pro?.city !== city) return false;
        if (!needle) return true;
        return `${p.caption} ${p.tags.join(' ')} ${pro?.business} ${pro?.city}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => likeCount(b) - likeCount(a));
  }, [db.posts, db.photographers, liveIds, q, niche, city]);

  const active = [city, maxPrice, minRating, vettedOnly, date, radius].filter(Boolean).length;

  const Filters = (
    <div className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">City</span>
        <select className="input" value={city} onChange={(e) => set('city', e.target.value)}>
          <option value="">All of Lehigh Valley</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      {city && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Distance from {city}</span>
          <select className="input" value={radius} onChange={(e) => set('radius', e.target.value === '0' ? '' : e.target.value)}>
            <option value={0}>This city only</option>
            <option value={5}>Within 5 miles</option>
            <option value={10}>Within 10 miles</option>
            <option value={15}>Within 15 miles</option>
            <option value={25}>Within 25 miles</option>
          </select>
        </label>
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Available on</span>
        <input type="date" className="input" min={todayISO()} value={date} onChange={(e) => set('date', e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1.5 flex justify-between text-sm font-bold">Starting price <span className="text-brand-600">{maxPrice ? `up to $${maxPrice}` : 'Any'}</span></span>
        <input type="range" min={0} max={1000} step={50} value={maxPrice} onChange={(e) => set('max', e.target.value === '0' ? '' : e.target.value)} className="w-full accent-brand-600" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Minimum rating</span>
        <select className="input" value={minRating} onChange={(e) => set('rating', e.target.value === '0' ? '' : e.target.value)}>
          <option value={0}>Any rating</option>
          <option value={4}>4.0 and up</option>
          <option value={4.5}>4.5 and up</option>
        </select>
      </label>
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" checked={vettedOnly} onChange={(e) => set('vetted', e.target.checked ? '1' : '')} className="h-5 w-5 rounded accent-brand-600" />
        <span className="text-sm font-semibold">Vetted photographers only</span>
      </label>
      <div className="flex gap-2 pt-1">
        {active > 0 && <button onClick={clear} className="btn btn-outline flex-1">Reset</button>}
        <button onClick={() => setShowFilters(false)} className="btn btn-primary flex-1">Show {results.length} result{results.length !== 1 && 's'}</button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[935px]">
      <div className="sticky top-0 z-20 -mx-4 bg-surface/95 px-4 pb-1 pt-3 backdrop-blur sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input !min-h-[44px] !bg-slate-100 !pl-10 focus:!bg-white" placeholder="Search photographers, styles, #tags" value={q} onChange={(e) => set('q', e.target.value)} aria-label="Search" />
            {q && <button className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-200" aria-label="Clear search" onClick={() => set('q', '')}><X size={16} /></button>}
          </div>
          <button className="btn btn-outline !min-h-[44px] !px-3.5" onClick={() => setShowFilters(true)} aria-label="Filters"><SlidersHorizontal size={18} /><span className="hidden sm:inline">Filters</span>{active > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{active}</span>}</button>
        </div>
        <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="list" aria-label="Categories">
          {['', ...NICHES].map((n) => (
            <button key={n || 'all'} role="listitem" aria-pressed={niche === n} onClick={() => set('niche', n)} className={cn('shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold transition', niche === n ? 'bg-ink text-white' : 'bg-slate-100 hover:bg-slate-200')}>{n || 'All'}</button>
          ))}
        </div>
        <div className="mt-3 flex border-b border-line" role="tablist">
          {([['pros', 'Photographers'], ['posts', 'Posts']] as const).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => set('tab', id === 'pros' ? '' : id)} className={cn('-mb-px flex-1 border-b-2 py-3 text-sm font-bold transition sm:flex-none sm:px-10', tab === id ? 'border-ink' : 'border-transparent text-slate-400')}>{label}</button>
          ))}
        </div>
      </div>

      <div className="mt-4" aria-live="polite">
        {tab === 'pros' ? (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
              <span>{results.length} photographer{results.length !== 1 && 's'}</span>
              <select className="rounded-lg bg-transparent py-1 pr-1 text-sm font-semibold outline-none" value={sort} onChange={(e) => set('sort', e.target.value)} aria-label="Sort"><option value="rating">Top rated</option><option value="reviews">Most reviewed</option><option value="price">Lowest price</option></select>
            </div>
            {results.length === 0 ? <EmptyState icon={<SearchIcon />} title="No photographers match" text="Try removing a filter or searching a nearby city." action={<button className="btn btn-primary" onClick={clear}>Reset filters</button>} /> : (
              <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">{results.map((p) => <ProCard key={p.id} p={p} />)}</div>
            )}
          </>
        ) : posts.length === 0 ? (
          <EmptyState icon={<SearchIcon />} title="No posts found" text="Try a different tag or category." action={<button className="btn btn-primary" onClick={clear}>Reset</button>} />
        ) : (
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1.5">
            {posts.map((p, i) => (
              <button key={p.id} onClick={() => setOpen(p.id)} aria-label={`Open post: ${p.caption.slice(0, 60)}`} className={cn('group relative overflow-hidden bg-slate-100', i % 9 === 0 ? 'col-span-2 row-span-2' : 'aspect-square')}>
                <Photo seed={p.image} w={i % 9 === 0 ? 800 : 400} h={i % 9 === 0 ? 800 : 400} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
                <span className="absolute inset-0 hidden items-center justify-center gap-5 bg-black/35 text-sm font-bold text-white group-hover:flex group-focus-visible:flex">
                  <span className="flex items-center gap-1.5"><Heart size={18} className="fill-white" />{likeCount(p).toLocaleString()}</span>
                  <span className="flex items-center gap-1.5"><MessageCircle size={18} className="fill-white" />{p.comments.length}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal open={showFilters} onClose={() => setShowFilters(false)} title="Filters">{Filters}</Modal>
      {open && <PostModal postId={open} onClose={() => setOpen(null)} list={posts.map((p) => p.id)} onNav={setOpen} />}
    </div>
  );
}
