import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Camera, Compass, Users } from 'lucide-react';
import { FollowButton, PostCard, PostModal, StoriesBar, StoryAvatar } from '../../components/social';
import { Avatar, EmptyState } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { followersOf, useBase } from '../../lib/social';
import { cn, money } from '../../lib/utils';

export interface ShellContext { openNewPost: () => void }
const PAGE = 5;

export default function Feed() {
  const { db, user, pro } = useStore();
  const { openNewPost } = useOutletContext<ShellContext>();
  const base = useBase();
  const [tab, setTab] = useState<'for-you' | 'following'>('for-you');
  const [count, setCount] = useState(PAGE);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const follows = useMemo(() => (user ? db.follows[user.id] ?? [] : []), [db.follows, user]);
  const live = useMemo(() => new Set(db.photographers.filter((p) => p.status === 'approved' && p.subscriptionActive).map((p) => p.id)), [db.photographers]);
  const all = useMemo(
    () => db.posts.filter((p) => live.has(p.photographerId) && (tab === 'for-you' || follows.includes(p.photographerId) || p.photographerId === pro?.id)).sort((a, b) => b.at - a.at),
    [db.posts, live, tab, follows, pro?.id],
  );
  const shown = all.slice(0, count);
  const done = count >= all.length;

  useEffect(() => setCount(PAGE), [tab]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || done) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setLoading(true);
          setTimeout(() => { setCount((c) => c + PAGE); setLoading(false); }, 450);
        }
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [done, loading, shown.length]);

  const suggestions = db.photographers.filter((p) => p.status === 'approved' && p.subscriptionActive && p.id !== pro?.id && !follows.includes(p.id)).slice(0, 5);

  return (
    <div className="mx-auto flex max-w-[935px] justify-center gap-10 xl:justify-between">
      <section className="w-full max-w-[470px] space-y-3 sm:space-y-4" aria-label="Feed">
        <StoriesBar onNew={pro ? openNewPost : undefined} />

        <div className="flex gap-6 border-b border-line px-3 text-sm sm:px-0" role="tablist">
          {(['for-you', 'following'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('-mb-px border-b-2 py-3 font-semibold capitalize transition', tab === t ? 'border-ink text-ink' : 'border-transparent text-slate-400 hover:text-slate-600')}>{t === 'for-you' ? 'For you' : 'Following'}</button>
          ))}
        </div>

        {all.length === 0 && (
          <EmptyState icon={<Users />} title={tab === 'following' ? 'Follow photographers to fill this feed' : 'No posts yet'} text="Posts from photographers you follow show up here." action={<Link to={base.explore} className="btn btn-primary">Explore photographers</Link>} />
        )}
        {shown.map((p, i) => <PostCard key={p.id} post={p} onOpen={setOpen} priority={i < 2} />)}

        {!done && (
          <div ref={sentinel} className="space-y-3 py-2" aria-hidden>
            <div className="skeleton h-14 rounded-lg" />
            <div className="skeleton aspect-[4/5] rounded-lg" />
          </div>
        )}
        {done && all.length > 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            <Camera className="mx-auto mb-2 text-slate-300" size={34} />
            <p className="font-semibold text-ink">You're all caught up</p>
            <p className="mt-1">You've seen the latest posts from local photographers.</p>
            <Link to={base.explore} className="mt-4 inline-flex btn btn-outline"><Compass size={16} /> Explore more</Link>
          </div>
        )}
      </section>

      <aside className="sticky top-6 hidden h-fit w-[300px] shrink-0 xl:block" aria-label="Suggestions">
        {user && (
          <div className="flex items-center gap-3 py-2">
            <Avatar name={user.name} size={52} />
            <div className="min-w-0"><p className="truncate text-sm font-bold">{user.name}</p><p className="truncate text-sm text-slate-500">{pro ? pro.business : user.email}</p></div>
          </div>
        )}
        <div className="mb-2 mt-4 flex items-center justify-between text-sm"><span className="font-semibold text-slate-500">Suggested photographers</span><Link to={base.explore} className="text-xs font-bold hover:opacity-60">See all</Link></div>
        <ul className="space-y-1">
          {suggestions.map((p) => {
            const from = p.services.length ? Math.min(...p.services.map((s) => s.price)) : 0;
            return (
              <li key={p.id} className="flex items-center gap-3 py-1.5">
                <Link to={base.pro(p.id)}><StoryAvatar name={p.name} size={44} /></Link>
                <div className="min-w-0 flex-1 leading-tight"><Link to={base.pro(p.id)} className="block truncate text-sm font-bold hover:opacity-70">{p.business}</Link><p className="truncate text-xs text-slate-500">{p.city} · {followersOf(db, p.id).toLocaleString()} followers{from ? ` · ${money(from)}+` : ''}</p></div>
                {user ? <FollowButton pid={p.id} small /> : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-8 text-xs text-slate-400">© {new Date().getFullYear()} Shutter Connect · Lehigh Valley beta</p>
      </aside>

      {open && <PostModal postId={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
