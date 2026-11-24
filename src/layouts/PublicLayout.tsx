import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { Logo, Avatar } from '../components/ui';
import { useStore } from '../store/AppStore';
import { cn } from '../lib/utils';

const YEAR = new Date().getFullYear();
const links = [
  { to: '/photographers', label: 'Explore' },
  { to: '/for-photographers', label: 'For photographers' },
];

export default function PublicLayout() {
  const { user } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <a href="#main" className="sr-only z-[70] rounded-lg bg-white px-4 py-2 font-bold text-brand-700 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
      <header className="sticky top-0 z-40 w-full border-b border-line bg-white/95 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/" aria-label="Shutter Connect home"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => cn('rounded-lg px-3.5 py-2 text-[15px] font-semibold transition hover:bg-slate-100', isActive ? 'text-ink' : 'text-slate-500')}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Link to="/app" className="btn btn-primary"><LayoutDashboard size={16} /> Open app <Avatar name={user.name} size={22} /></Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Log in</Link>
                <Link to="/signup" className="btn btn-primary">Sign up</Link>
              </>
            )}
          </div>
          <button className="icon-btn md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="fade-up container-x pb-4 md:hidden">
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              {links.map((l) => <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="flex min-h-[48px] items-center rounded-lg px-3 font-semibold hover:bg-slate-50">{l.label}</Link>)}
              <div className="mt-2 grid grid-cols-2 gap-2">
                {user ? <Link to="/app" onClick={() => setOpen(false)} className="btn btn-primary col-span-2">Open app</Link> : (
                  <><Link to="/login" onClick={() => setOpen(false)} className="btn btn-outline">Log in</Link><Link to="/signup" onClick={() => setOpen(false)} className="btn btn-primary">Sign up</Link></>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none"><Outlet /></main>

      <footer className="border-t border-line bg-white">
        <div className="container-x flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center">
          <div><Logo /><p className="mt-2 text-sm text-slate-500">A new way of doing business as a photographer.</p></div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-600" aria-label="Footer">
            <Link to="/photographers" className="hover:text-ink">Explore</Link>
            <Link to="/for-photographers" className="hover:text-ink">For photographers</Link>
            <Link to="/login" className="hover:text-ink">Log in</Link>
          </nav>
        </div>
        <div className="border-t border-line py-4 text-center text-xs text-slate-400">© {YEAR} Shutter Connect · Lehigh Valley beta · Demo build with sample data</div>
      </footer>
    </div>
  );
}
