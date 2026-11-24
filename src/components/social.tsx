import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Bookmark, ChevronLeft, ChevronRight, Heart, ImagePlus, Link2, MessageCircle, MoreHorizontal, Send, X } from 'lucide-react';
import { Avatar, Photo, useToast } from './ui';
import { useStore } from '../store/AppStore';
import { cn, money, timeAgo } from '../lib/utils';
import { likeCount, useBase } from '../lib/social';
import { ratioOf, shrink } from '../lib/image';
import { NICHES, type Photographer, type Post } from '../data/types';

const dims = { square: [720, 720], portrait: [720, 900], landscape: [720, 480] } as const;
const aspect = { square: 'aspect-square', portrait: 'aspect-[4/5]', landscape: 'aspect-[3/2]' } as const;

/* ---------- Avatar with Instagram-style story ring ---------- */
export function StoryAvatar({ name, size = 44, ring = 'none', onClick, label }: { name: string; size?: number; ring?: 'new' | 'seen' | 'none'; onClick?: () => void; label?: string }) {
  const inner = <Avatar name={name} size={ring === 'none' ? size : size - 8} className={ring === 'none' ? '' : 'ring-2 ring-white'} />;
  if (ring === 'none') return onClick ? <button onClick={onClick} aria-label={label ?? name}>{inner}</button> : inner;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag onClick={onClick} aria-label={label ?? `${name} story`} className={cn('grid shrink-0 place-items-center', ring === 'new' ? 'story-ring' : 'story-ring-seen')} style={{ width: size, height: size }}>
      <span className="grid place-items-center rounded-full bg-white p-[2px]">{inner}</span>
    </Tag>
  );
}

export function useRequireUser() {
  const { user } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  return () => {
    if (user) return true;
    toast('Log in to do that.', 'info');
    nav('/login');
    return false;
  };
}

/* ---------- Follow ---------- */
export function FollowButton({ pid, small }: { pid: string; small?: boolean }) {
  const { db, user, toggleFollow, pro } = useStore();
  const need = useRequireUser();
  if (pro?.id === pid) return null;
  const on = !!user && (db.follows[user.id] ?? []).includes(pid);
  return (
    <button onClick={() => need() && toggleFollow(pid)} aria-pressed={on} className={cn('btn', small ? '!min-h-0 !px-3 !py-1 text-[13px]' : '', on ? 'btn-outline' : 'btn-primary')}>
      {on ? 'Following' : 'Follow'}
    </button>
  );
}

/* ---------- Post card (feed) ---------- */
export function PostCard({ post, onOpen, priority }: { post: Post; onOpen: (id: string) => void; priority?: boolean }) {
  const { db, user, toggleLike, toggleSave, addComment, deletePost, toggleFollow } = useStore();
  const need = useRequireUser();
  const toast = useToast();
  const base = useBase();
  const pro = db.photographers.find((p) => p.id === post.photographerId);
  const [heart, setHeart] = useState(false);
  const [menu, setMenu] = useState(false);
  const [more, setMore] = useState(false);
  const [text, setText] = useState('');
  const lastTap = useRef(0);
  if (!pro) return null;

  const liked = !!user && post.likes.includes(user.id);
  const saved = !!user && post.saves.includes(user.id);
  const following = !!user && (db.follows[user.id] ?? []).includes(pro.id);
  const own = user?.id === pro.userId;
  const from = pro.services.length ? Math.min(...pro.services.map((s) => s.price)) : 0;
  const [w, h] = dims[post.ratio];

  const like = () => need() && toggleLike(post.id);
  const tap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      if (!need()) return;
      if (!liked) toggleLike(post.id);
      setHeart(true);
      setTimeout(() => setHeart(false), 900);
    }
    lastTap.current = now;
  };
  const share = async () => {
    const url = `${location.origin}${base.pro(pro.id)}`;
    try { await navigator.clipboard.writeText(url); toast('Link copied to clipboard.'); } catch { toast(url, 'info'); }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!need()) return;
    addComment(post.id, text);
    setText('');
  };
  const long = post.caption.length > 110;

  return (
    <article className="border-b border-line bg-white sm:rounded-xl sm:border" aria-label={`Post by ${pro.business}`}>
      <header className="flex items-center gap-3 px-3 py-2.5">
        <Link to={base.pro(pro.id)} aria-label={`${pro.business} profile`}><StoryAvatar name={pro.name} size={38} ring={following ? 'new' : 'none'} /></Link>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <Link to={base.pro(pro.id)} className="truncate text-sm font-bold hover:opacity-70">{pro.business}</Link>
            {pro.vetted && <BadgeCheck size={14} className="shrink-0 fill-brand-600 text-white" aria-label="Vetted" />}
            {!own && !following && <><span className="text-slate-400">·</span><button onClick={() => need() && toggleFollow(pro.id)} className="text-sm font-bold text-brand-600 hover:text-brand-800">Follow</button></>}
          </div>
          <p className="truncate text-xs text-slate-500">{post.location}</p>
        </div>
        <div className="relative">
          <button className="icon-btn !h-10 !w-10" aria-label="More options" aria-expanded={menu} onClick={() => setMenu(!menu)}><MoreHorizontal size={20} /></button>
          {menu && (
            <div className="pop absolute right-0 z-20 w-48 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lift" onMouseLeave={() => setMenu(false)}>
              <button className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50" onClick={() => { setMenu(false); share(); }}>Copy link</button>
              <Link className="block px-4 py-2.5 text-sm hover:bg-slate-50" to={base.pro(pro.id)}>Go to profile</Link>
              {own && <button className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50" onClick={() => { setMenu(false); deletePost(post.id); toast('Post deleted.', 'info'); }}>Delete post</button>}
            </div>
          )}
        </div>
      </header>

      <div className={cn('relative w-full select-none overflow-hidden bg-slate-100', aspect[post.ratio])} onClick={tap}>
        <Photo seed={post.image} w={w} h={h} alt={`Photo by ${pro.business}: ${post.caption.slice(0, 80)}`} className="h-full w-full" priority={priority} />
        {heart && <Heart aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -ml-14 -mt-14 h-28 w-28 animate-heart fill-white text-white drop-shadow-xl" />}
      </div>

      {from > 0 && (
        <Link to={base.book(pro.id)} className="flex items-center justify-between border-b border-line bg-slate-50 px-3 py-2.5 text-sm hover:bg-slate-100">
          <span className="font-semibold">Book {pro.name.split(' ')[0]} <span className="font-normal text-slate-500">· from {money(from)}</span></span>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>
      )}

      <div className="px-3 pb-3 pt-1">
        <div className="-ml-2.5 flex items-center">
          <button className="icon-btn" aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'} onClick={like}><Heart size={26} className={cn(liked ? 'animate-tap fill-rose-500 text-rose-500' : '')} /></button>
          <button className="icon-btn" aria-label="Comments" onClick={() => onOpen(post.id)}><MessageCircle size={25} /></button>
          <button className="icon-btn" aria-label="Share" onClick={share}><Send size={24} /></button>
          <button className="icon-btn ml-auto" aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save'} onClick={() => need() && toggleSave(post.id)}><Bookmark size={25} className={cn(saved && 'fill-ink')} /></button>
        </div>
        <p className="-mt-1 text-sm font-bold">{likeCount(post).toLocaleString()} likes</p>
        <p className="mt-1 text-sm leading-snug">
          <Link to={base.pro(pro.id)} className="mr-1.5 font-bold">{pro.business}</Link>
          {long && !more ? <>{post.caption.slice(0, 100)}… <button className="text-slate-500" onClick={() => setMore(true)}>more</button></> : post.caption}{' '}
          {post.tags.map((t) => <Link key={t} to={`${base.explore}?tab=posts&q=${t}`} className="text-brand-700">#{t} </Link>)}
        </p>
        {post.comments.length > 0 && <button className="mt-1.5 text-sm text-slate-500" onClick={() => onOpen(post.id)}>View all {post.comments.length} comment{post.comments.length > 1 && 's'}</button>}
        {post.comments.slice(-1).map((c) => <p key={c.id} className="mt-0.5 text-sm"><b className="mr-1.5">{c.name}</b>{c.text}</p>)}
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">{timeAgo(post.at)}</p>
        {user && (
          <form onSubmit={submit} className="mt-2 flex items-center gap-2 border-t border-line pt-2.5">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" aria-label="Add a comment" className="min-h-[40px] flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
            {text.trim() && <button className="text-sm font-bold text-brand-600">Post</button>}
          </form>
        )}
      </div>
    </article>
  );
}

/* ---------- Post modal (comments, used from explore / profile / feed) ---------- */
export function PostModal({ postId, onClose, list, onNav }: { postId: string; onClose: () => void; list?: string[]; onNav?: (id: string) => void }) {
  const { db, user, toggleLike, toggleSave, addComment } = useStore();
  const need = useRequireUser();
  const base = useBase();
  const [text, setText] = useState('');
  const post = db.posts.find((p) => p.id === postId);
  const pro = post && db.photographers.find((p) => p.id === post.photographerId);
  const idx = list ? list.indexOf(postId) : -1;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (list && onNav && e.key === 'ArrowRight' && idx < list.length - 1) onNav(list[idx + 1]);
      if (list && onNav && e.key === 'ArrowLeft' && idx > 0) onNav(list[idx - 1]);
    };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose, list, onNav, idx]);

  if (!post || !pro) return null;
  const liked = !!user && post.likes.includes(user.id);
  const saved = !!user && post.saves.includes(user.id);
  const from = pro.services.length ? Math.min(...pro.services.map((s) => s.price)) : 0;
  const [w, h] = dims[post.ratio];
  const submit = (e: FormEvent) => { e.preventDefault(); if (!need()) return; addComment(post.id, text); setText(''); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6" role="dialog" aria-modal="true" aria-label="Post">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <button className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white sm:bg-transparent" aria-label="Close" onClick={onClose}><X size={26} /></button>
      {list && onNav && idx > 0 && <button className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 sm:grid" aria-label="Previous post" onClick={() => onNav(list[idx - 1])}><ChevronLeft /></button>}
      {list && onNav && idx < list.length - 1 && <button className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 sm:grid" aria-label="Next post" onClick={() => onNav(list[idx + 1])}><ChevronRight /></button>}

      <div className="pop relative flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[90vh] sm:flex-row sm:rounded-xl">
        <div className="grid shrink-0 place-items-center bg-black sm:w-[58%]">
          <Photo seed={post.image} w={w * 1.4} h={h * 1.4} alt={post.caption.slice(0, 80)} className="max-h-[55vh] w-full object-contain sm:max-h-[90vh]" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Link to={base.pro(pro.id)} onClick={onClose}><StoryAvatar name={pro.name} size={34} /></Link>
            <div className="min-w-0 flex-1 leading-tight"><Link to={base.pro(pro.id)} onClick={onClose} className="text-sm font-bold">{pro.business}</Link><p className="truncate text-xs text-slate-500">{post.location}</p></div>
            {from > 0 && <Link to={base.book(pro.id)} onClick={onClose} className="btn btn-primary !min-h-0 !px-3 !py-1.5 text-[13px]">Book</Link>}
          </header>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div className="flex gap-3"><StoryAvatar name={pro.name} size={32} /><p className="text-sm"><b className="mr-1.5">{pro.business}</b>{post.caption} {post.tags.map((t) => <span key={t} className="text-brand-700">#{t} </span>)}<span className="mt-1 block text-xs text-slate-400">{timeAgo(post.at)}</span></p></div>
            {post.comments.map((c) => (
              <div key={c.id} className="flex gap-3"><StoryAvatar name={c.name} size={32} /><p className="text-sm"><b className="mr-1.5">{c.name}</b>{c.text}<span className="mt-1 block text-xs text-slate-400">{timeAgo(c.at)}</span></p></div>
            ))}
            {post.comments.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No comments yet. Start the conversation.</p>}
          </div>
          <div className="border-t border-line px-3 pb-3 pt-1">
            <div className="-ml-2.5 flex items-center">
              <button className="icon-btn" aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'} onClick={() => need() && toggleLike(post.id)}><Heart size={26} className={cn(liked && 'animate-tap fill-rose-500 text-rose-500')} /></button>
              <button className="icon-btn ml-auto" aria-pressed={saved} aria-label="Save" onClick={() => need() && toggleSave(post.id)}><Bookmark size={25} className={cn(saved && 'fill-ink')} /></button>
            </div>
            <p className="-mt-1 text-sm font-bold">{likeCount(post).toLocaleString()} likes</p>
            <form onSubmit={submit} className="mt-2 flex items-center gap-2 border-t border-line pt-2.5">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={user ? 'Add a comment…' : 'Log in to comment'} aria-label="Add a comment" className="min-h-[40px] flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
              {text.trim() && <button className="text-sm font-bold text-brand-600">Post</button>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Stories ---------- */
export const storyFor = (db: { posts: Post[] }, p: Photographer) => {
  const mine = db.posts.filter((x) => x.photographerId === p.id).slice(0, 3);
  const src = mine.length ? mine.map((x) => ({ image: x.image, caption: x.caption, at: x.at })) : p.portfolio.slice(0, 3).map((image) => ({ image, caption: 'New work', at: Date.now() }));
  return src;
};

export function StoriesBar({ onNew }: { onNew?: () => void }) {
  const { db, user, pro } = useStore();
  const [viewer, setViewer] = useState<{ ids: string[]; start: number } | null>(null);
  const seen = user ? db.storySeen[user.id] ?? [] : [];
  const follows = user ? db.follows[user.id] ?? [] : [];
  const list = useMemo(
    () =>
      db.photographers
        .filter((p) => p.status === 'approved' && p.subscriptionActive && p.id !== pro?.id)
        .sort((a, b) => Number(seen.includes(a.id)) - Number(seen.includes(b.id)) || Number(follows.includes(b.id)) - Number(follows.includes(a.id))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.photographers, db.storySeen, db.follows, user?.id, pro?.id],
  );
  return (
    <>
      <div className="scrollbar-none -mx-0 flex gap-4 overflow-x-auto px-3 py-3 sm:rounded-xl sm:border sm:border-line sm:bg-white" role="list" aria-label="Stories">
        {pro && onNew && (
          <div role="listitem" className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
            <button onClick={onNew} aria-label="Create a new post" className="relative">
              <Avatar name={pro.name} size={64} />
              <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-brand-600 text-white"><span className="text-sm font-bold leading-none">+</span></span>
            </button>
            <span className="w-full truncate text-center text-xs">Your post</span>
          </div>
        )}
        {list.map((p, i) => (
          <div key={p.id} role="listitem" className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
            <StoryAvatar name={p.name} size={68} ring={seen.includes(p.id) ? 'seen' : 'new'} onClick={() => setViewer({ ids: list.map((x) => x.id), start: i })} label={`View ${p.business} story`} />
            <span className={cn('w-full truncate text-center text-xs', seen.includes(p.id) ? 'text-slate-500' : 'font-semibold')}>{p.business.split(' ')[0]}</span>
          </div>
        ))}
      </div>
      {viewer && <StoryViewer ids={viewer.ids} start={viewer.start} onClose={() => setViewer(null)} />}
    </>
  );
}

const SEG_MS = 5000;

export function StoryViewer({ ids, start, onClose }: { ids: string[]; start: number; onClose: () => void }) {
  const { db, user, send, markStorySeen, pro: me } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const base = useBase();
  const [pi, setPi] = useState(start);
  const [si, setSi] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [msg, setMsg] = useState('');
  const pro = db.photographers.find((p) => p.id === ids[pi]);
  const segs = pro ? storyFor(db, pro) : [];

  const next = () => {
    setElapsed(0);
    if (si < segs.length - 1) setSi(si + 1);
    else if (pi < ids.length - 1) { setPi(pi + 1); setSi(0); }
    else onClose();
  };
  const prev = () => {
    setElapsed(0);
    if (si > 0) setSi(si - 1);
    else if (pi > 0) { setPi(pi - 1); setSi(0); }
  };

  useEffect(() => { if (pro) markStorySeen(pro.id); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pro?.id]);
  useEffect(() => {
    if (paused || !pro) return;
    const t = setInterval(() => setElapsed((e) => e + 50), 50);
    return () => clearInterval(t);
  }, [paused, pro]);
  useEffect(() => { if (elapsed >= SEG_MS) next(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [elapsed]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  });

  if (!pro) return null;
  const seg = segs[si];
  const isClient = user?.role === 'client';
  const reply = (e: FormEvent) => {
    e.preventDefault();
    if (!isClient || !msg.trim()) return;
    send(`${user!.id}__${pro.id}`, `Replied to your story: ${msg}`);
    setMsg('');
    toast(`Message sent to ${pro.business}.`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black" role="dialog" aria-modal="true" aria-label={`${pro.business} story`}>
      <div className="relative flex h-full w-full max-w-[460px] select-none flex-col overflow-hidden bg-black sm:h-[min(92vh,820px)] sm:rounded-2xl">
        <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-3 pb-8 pt-3">
          <div className="flex gap-1" aria-hidden>
            {segs.map((_, i) => (
              <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
                <span className="block h-full bg-white" style={{ width: i < si ? '100%' : i === si ? `${Math.min(100, (elapsed / SEG_MS) * 100)}%` : '0%' }} />
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5 text-white">
            <Link to={base.pro(pro.id)} onClick={onClose}><Avatar name={pro.name} size={34} /></Link>
            <Link to={base.pro(pro.id)} onClick={onClose} className="text-sm font-bold">{pro.business}</Link>
            <span className="text-xs text-white/70">{timeAgo(seg.at)}</span>
            <button className="icon-btn ml-auto !text-white hover:!bg-white/15" aria-label="Close story" onClick={onClose}><X size={24} /></button>
          </div>
        </div>

        <div
          className="relative min-h-0 flex-1"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
        >
          <Photo key={`${pi}-${si}`} seed={seg.image} w={900} h={1400} alt={seg.caption.slice(0, 80)} className="h-full w-full object-cover" priority />
          <button className="absolute inset-y-0 left-0 w-1/3" aria-label="Previous" onClick={prev} />
          <button className="absolute inset-y-0 right-0 w-2/3" aria-label="Next" onClick={next} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16 text-sm text-white">{seg.caption}</div>
        </div>

        <div className="flex items-center gap-2 bg-black px-3 py-3">
          {isClient ? (
            <form onSubmit={reply} className="flex-1"><input value={msg} onChange={(e) => setMsg(e.target.value)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} placeholder={`Message ${pro.business}…`} aria-label="Reply to story" className="min-h-[44px] w-full rounded-full border border-white/40 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/60 focus:border-white" /></form>
          ) : <span className="flex-1 text-sm text-white/60">{me ? 'Viewing as photographer' : 'Log in to message'}</span>}
          <button onClick={() => { onClose(); nav(base.book(pro.id)); }} className="btn btn-primary !min-h-[44px] !rounded-full !px-5">Book</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Create post ---------- */
export function NewPostModal({ onClose }: { onClose: () => void }) {
  const { pro, createPost } = useStore();
  const toast = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [ratio, setRatio] = useState<Post['ratio']>('square');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>(pro?.niches.slice(0, 1) ?? []);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Please choose an image.', 'error');
    if (f.size > 15 * 1024 * 1024) return toast('That image is over 15 MB.', 'error');
    setBusy(true);
    try {
      const data = await shrink(f, 1080, 0.82);
      setImage(data);
      setRatio(await ratioOf(data));
    } catch { toast('Could not read that image.', 'error'); }
    setBusy(false);
  };
  const toggle = (t: string) => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));
  const share = () => {
    if (!image) return;
    createPost({ image, caption, ratio, tags: tags.map((t) => t.toLowerCase().replace(/\s/g, '')) });
    toast('Post shared to your feed.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Create new post">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="animate-sheet relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white sm:max-w-3xl sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <button className="text-sm" onClick={onClose}>Cancel</button>
          <h2 className="font-bold">New post</h2>
          <button className="text-sm font-bold text-brand-600 disabled:opacity-40" disabled={!image} onClick={share}>Share</button>
        </header>
        <div className="grid min-h-0 flex-1 overflow-y-auto sm:grid-cols-[1.2fr_1fr]">
          <div className="grid min-h-[260px] place-items-center bg-slate-50">
            {image ? <img src={image} alt="Preview" className="max-h-[60vh] w-full object-contain" /> : (
              <label className="flex cursor-pointer flex-col items-center gap-3 p-10 text-center">
                <ImagePlus size={56} strokeWidth={1.2} className="text-slate-400" />
                <span className="text-lg">{busy ? 'Preparing…' : 'Choose a photo'}</span>
                <span className="btn btn-primary">Select from device</span>
                <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
              </label>
            )}
          </div>
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2.5"><Avatar name={pro?.name ?? ''} size={30} /><b className="text-sm">{pro?.business}</b></div>
            <textarea className="input min-h-28" maxLength={500} placeholder="Write a caption…" value={caption} onChange={(e) => setCaption(e.target.value)} aria-label="Caption" />
            <p className="-mt-3 text-right text-xs text-slate-400">{caption.length}/500</p>
            <div>
              <p className="mb-2 text-sm font-bold">Tags</p>
              <div className="flex flex-wrap gap-2">{NICHES.map((n) => <button key={n} type="button" aria-pressed={tags.includes(n)} onClick={() => toggle(n)} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold', tags.includes(n) ? 'bg-ink text-white' : 'bg-slate-100')}>#{n.toLowerCase()}</button>)}</div>
            </div>
            {image && <label className="btn btn-outline w-full cursor-pointer">Change photo<input type="file" accept="image/*" className="sr-only" onChange={onFile} /></label>}
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><Link2 size={13} /> Followers and people searching your niche will see this post.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
