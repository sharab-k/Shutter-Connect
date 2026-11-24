import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Bookmark, CalendarDays, ChevronLeft, ChevronRight, Clock, Grid3x3, Heart, Image as ImageIcon, MapPin, MessageCircle, Plus, ShieldCheck, Star, UserCheck, X } from 'lucide-react';
import { Avatar, Badge, EmptyState, Photo, Stars, useToast } from '../components/ui';
import { FollowButton, NewPostModal, PostModal, StoryAvatar } from '../components/social';
import { nextAvailable, useStore } from '../store/AppStore';
import { followersOf, likeCount, postsOf, useBase } from '../lib/social';
import { cn, fmtDateShort, money, timeAgo } from '../lib/utils';
import type { PaymentMode } from '../data/types';

export const payLabel = (m: PaymentMode, pct: number) => (m === 'upfront' ? 'Pay in full to confirm' : m === 'after' ? 'Pay after the shoot' : `${pct}% deposit, balance after`);

type Tab = 'posts' | 'portfolio' | 'services' | 'reviews';

export default function PhotographerProfile() {
  const { id } = useParams();
  const { db, ratingOf, user, pro: myPro } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const base = useBase();
  const [tab, setTab] = useState<Tab>('posts');
  const [light, setLight] = useState<number | null>(null);
  const [openPost, setOpenPost] = useState<string | null>(null);
  const [newPost, setNewPost] = useState(false);

  const p = db.photographers.find((x) => x.id === id);
  if (!p || ((p.status !== 'approved' || !p.subscriptionActive) && user?.role !== 'admin' && user?.id !== p.userId))
    return <div className="container-x py-16"><EmptyState icon={<X />} title="Photographer not found" action={<Link to={base.explore} className="btn btn-primary">Browse photographers</Link>} /></div>;

  const own = myPro?.id === p.id;
  const rating = ratingOf(p.id);
  const reviews = db.reviews.filter((r) => r.toId === p.id && r.fromRole === 'client');
  const posts = postsOf(db, p.id).sort((a, b) => b.at - a.at);
  const from = p.services.length ? Math.min(...p.services.map((s) => s.price)) : 0;
  const nextDates = p.services.length ? nextAvailable(p, Math.min(...p.services.map((s) => s.durationHrs)), db.bookings, 4) : [];
  const proUser = db.users.find((u) => u.id === p.userId);

  const book = (serviceId?: string, date?: string) => {
    if (user && user.role !== 'client') return toast('Switch to a client account to book a photographer.', 'info');
    const qs = [serviceId && `service=${serviceId}`, date && `date=${date}`].filter(Boolean).join('&');
    nav(base.book(p.id, qs ? `?${qs}` : ''));
  };
  const message = () => {
    if (!user) return nav('/login', { state: { next: base.pro(p.id) } });
    if (user.role !== 'client') return toast('Messaging from here is for client accounts.', 'info');
    nav(`/app/messages/${user.id}__${p.id}`);
  };

  const tabs: { id: Tab; label: string; icon: typeof Grid3x3 }[] = [
    { id: 'posts', label: 'Posts', icon: Grid3x3 },
    { id: 'portfolio', label: 'Portfolio', icon: ImageIcon },
    { id: 'services', label: 'Services', icon: Bookmark },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <div className={cn('mx-auto w-full max-w-[935px]', !base.inApp && 'px-4 py-6 sm:py-10')}>
      <header className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-4 sm:gap-x-14">
        <div className="row-span-1 sm:row-span-1">
          <span className="hidden sm:block"><StoryAvatar name={p.name} size={156} ring="new" /></span>
          <span className="sm:hidden"><StoryAvatar name={p.name} size={88} ring="new" /></span>
        </div>
        <div className="min-w-0 self-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="flex items-center gap-1.5 text-xl font-bold sm:text-2xl">{p.business}{p.vetted && <BadgeCheck size={20} className="fill-brand-600 text-white" aria-label="Stamp of Approval, vetted" />}</h1>
            <div className="hidden gap-2 sm:flex">
              {own ? (
                <><Link to="/app/profile" className="btn btn-outline">Edit profile</Link><button className="btn btn-primary" onClick={() => setNewPost(true)}><Plus size={16} /> New post</button></>
              ) : (
                <><FollowButton pid={p.id} /><button className="btn btn-primary" disabled={!p.services.length} onClick={() => book()}>Book{from ? ` from ${money(from)}` : ''}</button><button className="btn btn-outline" onClick={message}>Message</button></>
              )}
            </div>
          </div>
          <ul className="mt-4 hidden gap-9 text-[15px] sm:flex">
            <li><b>{posts.length}</b> posts</li>
            <li><b>{followersOf(db, p.id).toLocaleString()}</b> followers</li>
            <li><b>{rating.count ? rating.avg.toFixed(1) : '–'}</b> rating <span className="text-slate-400">({rating.count})</span></li>
          </ul>
          <div className="mt-4 hidden text-sm sm:block"><Bio p={p} verified={proUser?.idStatus === 'verified'} /></div>
        </div>
        <div className="col-span-2 text-sm sm:hidden"><Bio p={p} verified={proUser?.idStatus === 'verified'} /></div>
        <div className="col-span-2 flex gap-2 sm:hidden">
          {own ? (
            <><Link to="/app/profile" className="btn btn-outline flex-1">Edit profile</Link><button className="btn btn-primary flex-1" onClick={() => setNewPost(true)}><Plus size={16} /> New post</button></>
          ) : (
            <><FollowButton pid={p.id} /><button className="btn btn-primary flex-1" disabled={!p.services.length} onClick={() => book()}>Book{from ? ` · ${money(from)}+` : ''}</button><button className="btn btn-outline" aria-label="Message" onClick={message}><MessageCircle size={18} /></button></>
          )}
        </div>
      </header>

      <ul className="mt-6 grid grid-cols-3 border-y border-line py-3 text-center text-sm sm:hidden">
        <li><b className="block text-base">{posts.length}</b><span className="text-slate-500">posts</span></li>
        <li><b className="block text-base">{followersOf(db, p.id).toLocaleString()}</b><span className="text-slate-500">followers</span></li>
        <li><b className="block text-base">{rating.count ? rating.avg.toFixed(1) : '–'}</b><span className="text-slate-500">rating</span></li>
      </ul>

      {!own && nextDates.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm">
          <CalendarDays size={16} className="text-brand-600" /> <span className="font-semibold">Next available</span>
          {nextDates.map((d) => <button key={d} onClick={() => book(undefined, d)} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700 shadow-sm hover:bg-brand-100">{fmtDateShort(d)}</button>)}
        </div>
      )}

      <div className="mt-4 flex justify-center border-t border-line sm:mt-8" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn('-mt-px flex flex-1 items-center justify-center gap-1.5 border-t-2 py-3.5 text-xs font-bold uppercase tracking-widest transition sm:flex-none sm:px-8', tab === t.id ? 'border-ink text-ink' : 'border-transparent text-slate-400 hover:text-slate-600')}>
            <t.icon size={16} /> <span className="hidden sm:inline">{t.label}</span><span className="sr-only sm:hidden">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-1">
        {tab === 'posts' && (posts.length ? (
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1.5">
            {posts.map((x) => (
              <button key={x.id} onClick={() => setOpenPost(x.id)} aria-label={`Open post: ${x.caption.slice(0, 60)}`} className="group relative aspect-square overflow-hidden bg-slate-100">
                <Photo seed={x.image} w={400} h={400} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
                <span className="absolute inset-0 hidden items-center justify-center gap-5 bg-black/35 text-sm font-bold text-white group-hover:flex group-focus-visible:flex"><span className="flex items-center gap-1.5"><Heart size={18} className="fill-white" />{likeCount(x).toLocaleString()}</span><span className="flex items-center gap-1.5"><MessageCircle size={18} className="fill-white" />{x.comments.length}</span></span>
              </button>
            ))}
          </div>
        ) : <EmptyState icon={<Grid3x3 />} title="No posts yet" text={own ? 'Share your first photo to appear in the feed.' : 'Check back soon.'} action={own ? <button className="btn btn-primary" onClick={() => setNewPost(true)}>Share a photo</button> : undefined} />)}

        {tab === 'portfolio' && (p.portfolio.length ? (
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1.5">
            {p.portfolio.map((s, i) => (
              <button key={s} onClick={() => setLight(i)} className="group aspect-square overflow-hidden bg-slate-100" aria-label={`Open portfolio photo ${i + 1}`}><Photo seed={s} w={400} h={400} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" /></button>
            ))}
          </div>
        ) : <EmptyState icon={<ImageIcon />} title="Portfolio coming soon" />)}

        {tab === 'services' && (
          <div className="mx-auto mt-4 max-w-2xl space-y-3">
            {p.services.length === 0 && <EmptyState icon={<CalendarDays />} title="No services listed yet" />}
            {p.services.map((s) => (
              <div key={s.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold">{s.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{s.description}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs"><Badge><Clock size={12} /> {s.durationHrs} hr{s.durationHrs > 1 && 's'}</Badge><Badge tone="purple"><ShieldCheck size={12} /> {payLabel(s.paymentMode, s.depositPct)}</Badge></div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><p className="text-xl font-extrabold">{money(s.price)}</p>{!own && <button className="btn btn-primary" onClick={() => book(s.id)}>Book</button>}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="mx-auto mt-4 max-w-2xl space-y-3">
            {reviews.length > 0 && <div className="flex items-center gap-4 pb-2"><p className="text-4xl font-extrabold">{rating.avg.toFixed(1)}</p><div><Stars value={rating.avg} size={18} /><p className="text-sm text-slate-500">{rating.count} reviews</p></div></div>}
            {reviews.length === 0 && <EmptyState icon={<Star />} title="No reviews yet" text="Reviews appear after completed bookings." />}
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-3 border-b border-line pb-4">
                <Avatar name={r.fromName} size={40} />
                <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="font-bold">{r.fromName}</p><span className="text-xs text-slate-400">{timeAgo(r.at)}</span></div><Stars value={r.rating} size={13} /><p className="mt-1.5 text-sm text-slate-700">{r.text}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openPost && <PostModal postId={openPost} onClose={() => setOpenPost(null)} list={posts.map((x) => x.id)} onNav={setOpenPost} />}
      {newPost && <NewPostModal onClose={() => setNewPost(false)} />}
      {light !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLight(null)}>
          <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white" aria-label="Close" onClick={() => setLight(null)}><X /></button>
          <button className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setLight((light + p.portfolio.length - 1) % p.portfolio.length); }}><ChevronLeft /></button>
          <Photo seed={p.portfolio[light]} w={1400} h={1000} className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain" />
          <button className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white" aria-label="Next" onClick={(e) => { e.stopPropagation(); setLight((light + 1) % p.portfolio.length); }}><ChevronRight /></button>
        </div>
      )}
    </div>
  );
}

function Bio({ p, verified }: { p: { name: string; niches: string[]; tagline: string; bio: string; city: string; state: string }; verified: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="font-bold">{p.name}</p>
      <p className="text-slate-500">{p.niches.join(' · ')}</p>
      {p.tagline && <p>{p.tagline}</p>}
      {p.bio && <p className="max-w-lg text-slate-700">{p.bio}</p>}
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-slate-500"><span className="inline-flex items-center gap-1"><MapPin size={14} /> {p.city}, {p.state}</span>{verified && <span className="inline-flex items-center gap-1 text-emerald-700"><UserCheck size={14} /> ID verified</span>}</p>
    </div>
  );
}
