import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Briefcase, CalendarCheck, CalendarDays, Compass, DollarSign, Gavel, Heart, Home, LayoutDashboard, LogOut, MessageCircle, PlusSquare, Settings, ShieldCheck, Star, UserRound, UserRoundCheck, Users, Wallet, X,
} from 'lucide-react';
import { Avatar, Logo } from '../components/ui';
import { NewPostModal } from '../components/social';
import { useStore } from '../store/AppStore';
import { threadsFor } from '../lib/social';
import { cn, timeAgo } from '../lib/utils';

interface Item { to: string; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; end?: boolean; badge?: number }

export default function AppShell() {
  const { user, db, logout, markRead, pro } = useStore();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [newPost, setNewPost] = useState(false);

  useEffect(() => setNotifOpen(false), [pathname]);
  const unreadMsgs = useMemo(() => threadsFor(db, user, pro).filter((t) => t.unread).length, [db, user, pro]);

  if (!user) return <Navigate to="/login" state={{ next: pathname }} replace />;

  const role = user.role;
  const notes = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.at - a.at);
  const unreadNotes = notes.filter((n) => !n.read).length;
  const inChat = pathname.startsWith('/app/messages/');
  const bleed = (pathname === '/app' && role !== 'admin') || pathname.startsWith('/app/messages');
  const pending = role === 'photographer' && pro?.status === 'pending';

  const side: Item[] =
    role === 'admin'
      ? [
          { to: '/app', label: 'Metrics', icon: BarChart3, end: true },
          { to: '/app/applications', label: 'Applications', icon: UserRoundCheck },
          { to: '/app/photographers', label: 'Photographers', icon: Users },
          { to: '/app/transactions', label: 'Transactions', icon: DollarSign },
          { to: '/app/disputes', label: 'Disputes', icon: Gavel },
        ]
      : [
          { to: '/app', label: 'Home', icon: Home, end: true },
          { to: '/app/explore', label: 'Explore', icon: Compass },
          { to: '/app/messages', label: 'Messages', icon: MessageCircle, badge: unreadMsgs },
          { to: '/app/bookings', label: 'Bookings', icon: CalendarCheck },
          ...(role === 'photographer'
            ? [
                { to: '/app/studio', label: 'Studio', icon: LayoutDashboard },
                { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
                { to: '/app/services', label: 'Services', icon: Briefcase },
                { to: '/app/earnings', label: 'Earnings', icon: Wallet },
                { to: '/app/reviews', label: 'Reviews', icon: Star },
                { to: pro ? `/app/p/${pro.id}` : '/app/profile', label: 'Profile', icon: UserRound },
              ]
            : [{ to: '/app/settings', label: 'Profile', icon: UserRound }]),
        ];
  if (role !== 'admin') side.push({ to: '/app/settings', label: 'Settings', icon: Settings });
  const sideUnique = side.filter((x, i, a) => a.findIndex((y) => y.label === x.label) === i);

  const bottom: Item[] =
    role === 'admin'
      ? sideUnique.slice(0, 5)
      : role === 'photographer'
        ? [side[0], side[1], { to: '#new', label: 'Create', icon: PlusSquare }, side[2], { to: '/app/studio', label: 'Studio', icon: LayoutDashboard }]
        : [side[0], side[1], side[2], side[3], { to: '/app/settings', label: 'Profile', icon: UserRound }];

  const linkCls = (active: boolean) => cn('relative flex min-h-[48px] items-center gap-4 rounded-lg px-3 text-[15px] transition hover:bg-slate-100', active ? 'font-bold' : 'font-medium');

  return (
    <div className="min-h-dvh bg-white md:bg-surface">
      <a href="#main" className="sr-only z-[70] rounded-lg bg-white px-4 py-2 font-bold text-brand-700 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-line bg-white px-3 pb-5 pt-7 md:flex xl:w-[244px]" aria-label="Primary">
        <Link to="/" className="mb-6 px-3" aria-label="Shutter Connect home"><span className="xl:hidden"><Logo mark /></span><span className="hidden xl:block"><Logo /></span></Link>
        <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-none" aria-label="App">
          {sideUnique.slice(0, role === 'admin' ? 5 : 3).map((i) => <SideLink key={i.label} i={i} cls={linkCls} />)}
          {role !== 'admin' && (
            <>
              <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) setTimeout(markRead, 1500); }} aria-expanded={notifOpen} className={cn(linkCls(notifOpen), 'w-full')}>
                <span className="relative"><Heart size={26} strokeWidth={notifOpen ? 2.8 : 2} />{unreadNotes > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}</span>
                <span className="hidden xl:inline">Notifications</span>{unreadNotes > 0 && <span className="sr-only">{unreadNotes} unread</span>}
              </button>
              {role === 'photographer' && (
                <button onClick={() => setNewPost(true)} className={cn(linkCls(false), 'w-full')}><PlusSquare size={26} /><span className="hidden xl:inline">Create</span></button>
              )}
              {sideUnique.slice(3).map((i) => <SideLink key={i.label} i={i} cls={linkCls} />)}
            </>
          )}
        </nav>
        <div className="mt-2 border-t border-line pt-3">
          <button onClick={() => { logout(); nav('/'); }} className={cn(linkCls(false), 'w-full text-slate-600')}><LogOut size={24} /><span className="hidden xl:inline">Log out</span></button>
          <div className="mt-1 hidden items-center gap-3 px-3 py-2 xl:flex"><Avatar name={user.name} size={32} /><span className="min-w-0 leading-tight"><b className="block truncate text-sm">{user.name}</b><span className="text-xs capitalize text-slate-500">{role}</span></span></div>
        </div>
      </aside>

      <div className="md:pl-[72px] xl:pl-[244px]">
        {/* Mobile top bar */}
        {!inChat && (
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
            <Link to="/app" aria-label="Home"><Logo /></Link>
            <div className="flex items-center">
              {role === 'photographer' && <button className="icon-btn" aria-label="Create post" onClick={() => setNewPost(true)}><PlusSquare size={25} /></button>}
              {role !== 'admin' && (
                <>
                  <button className="icon-btn relative" aria-label={`Notifications${unreadNotes ? `, ${unreadNotes} unread` : ''}`} onClick={() => { setNotifOpen(true); setTimeout(markRead, 1500); }}><Heart size={25} />{unreadNotes > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}</button>
                  <Link to="/app/messages" className="icon-btn relative" aria-label={`Messages${unreadMsgs ? `, ${unreadMsgs} unread` : ''}`}><MessageCircle size={25} />{unreadMsgs > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unreadMsgs}</span>}</Link>
                </>
              )}
              {role === 'admin' && <button className="icon-btn" aria-label="Log out" onClick={() => { logout(); nav('/'); }}><LogOut size={22} /></button>}
            </div>
          </header>
        )}

        {pending && (
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-center text-sm font-semibold text-amber-800"><ShieldCheck size={15} className="mr-1.5 inline" /> Your application is under review. Your profile goes live once our team approves it.</div>
        )}
        {role === 'photographer' && pro?.status === 'approved' && !pro.subscriptionActive && (
          <div className="border-b border-brand-100 bg-brand-50 px-4 py-2.5 text-center text-sm font-semibold text-brand-800">You're approved! <Link to="/app/settings" className="underline">Activate your $199/yr membership</Link> to appear in search and receive bookings.</div>
        )}

        <main id="main" tabIndex={-1} className={cn('outline-none', inChat || pathname.startsWith('/app/messages') ? '' : 'pb-16 md:pb-0')}>
          {bleed ? (
            pathname === '/app' ? <div className="sm:px-6 sm:py-6"><Outlet context={{ openNewPost: () => setNewPost(true) }} /></div> : <Outlet />
          ) : (
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 md:py-8"><Outlet context={{ openNewPost: () => setNewPost(true) }} /></div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {!inChat && (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="App">
          {bottom.map((i) =>
            i.to === '#new' ? (
              <button key="new" onClick={() => setNewPost(true)} className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-slate-500" aria-label="Create post"><span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-white"><PlusSquare size={19} /></span></button>
            ) : (
              <NavLink key={i.label} to={i.to} end={i.end} className={({ isActive }) => cn('relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold', isActive ? 'text-ink' : 'text-slate-500')}>
                {({ isActive }) => (
                  <>
                    <span className="relative"><i.icon size={25} strokeWidth={isActive ? 2.6 : 1.8} />{!!i.badge && <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{i.badge}</span>}</span>
                    {i.label}
                  </>
                )}
              </NavLink>
            ),
          )}
        </nav>
      )}

      {/* Notifications panel */}
      {notifOpen && (
        <div className="fixed inset-0 z-40" role="dialog" aria-label="Notifications" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setNotifOpen(false)} />
          <div className="animate-sheet absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl md:left-[72px] md:right-auto md:w-[397px] md:rounded-r-2xl xl:left-[244px]">
            <header className="flex items-center justify-between px-5 py-4"><h2 className="text-xl font-bold">Notifications</h2><button className="icon-btn" aria-label="Close notifications" onClick={() => setNotifOpen(false)}><X size={22} /></button></header>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {notes.length === 0 && <li className="p-10 text-center text-sm text-slate-500">You're all caught up.</li>}
              {notes.map((n) => (
                <li key={n.id}>
                  <Link to={n.link ?? '/app'} className="flex items-start gap-3 px-5 py-3 text-sm hover:bg-slate-50">
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-brand-600')} />
                    <span className="min-w-0 flex-1"><span className="block leading-snug">{n.text}</span><span className="text-xs text-slate-400">{timeAgo(n.at)}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {newPost && <NewPostModal onClose={() => setNewPost(false)} />}
    </div>
  );
}

function SideLink({ i, cls }: { i: Item; cls: (a: boolean) => string }) {
  return (
    <NavLink to={i.to} end={i.end} className={({ isActive }) => cls(isActive)} aria-label={i.label}>
      {({ isActive }) => (
        <>
          <span className="relative"><i.icon size={26} strokeWidth={isActive ? 2.8 : 2} />{!!i.badge && <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{i.badge}</span>}</span>
          <span className="hidden xl:inline">{i.label}</span>
        </>
      )}
    </NavLink>
  );
}
