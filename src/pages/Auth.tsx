import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, ShieldCheck, User } from 'lucide-react';
import { Field, Logo, Photo } from '../components/ui';
import { useStore } from '../store/AppStore';
import { DEMO_ACCOUNTS } from '../data/seed';
import { CITIES, NICHES } from '../data/types';
import { cn } from '../lib/utils';

function Shell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-2 opacity-35" aria-hidden>{['p3-work-2','p1-work-1','p4-work-3','p7-work-2','p2-work-1','p10-work-2','p5-work-1','p8-work-3','p6-work-2'].map((s) => <Photo key={s} seed={s} w={400} h={500} className="h-full w-full" />)}</div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        <Link to="/" className="relative"><Logo light /></Link>
        <div className="relative">
          <h2 className="font-display text-6xl leading-[.95]">Find a photographer. <em className="text-sun-300">Book. Pay. Done.</em></h2>
          <p className="mt-4 max-w-md text-white/80">A new way of doing business as a photographer. Join the Lehigh Valley beta.</p>
          <ul className="mt-8 space-y-3 text-sm font-semibold">
            <li className="flex items-center gap-2"><ShieldCheck size={18} className="text-sun-300" /> Vetted photographers & verified identities</li>
            <li className="flex items-center gap-2"><ShieldCheck size={18} className="text-sun-300" /> Flexible, secure payments with Stripe</li>
            <li className="flex items-center gap-2"><ShieldCheck size={18} className="text-sun-300" /> Photos delivered right inside your booking</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/60">© Shutter Connect</p>
      </div>
      <div className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-block lg:hidden"><Logo /></Link>
          <h1 className="font-display text-5xl leading-none">{title}</h1>
          <p className="mt-1.5 text-slate-500">{sub}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const { login, loginAs, user } = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const next = (loc.state as { next?: string } | null)?.next ?? '/app';
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  if (user) return <Navigate to={next} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!pw) return setErr('Please enter your password.');
    const r = login(email);
    if (r) setErr(r);
    else nav(next, { replace: true });
  };

  return (
    <Shell title="Welcome back" sub="Log in to manage your bookings.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email"><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></Field>
        <Field label="Password"><input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" required /></Field>
        {err && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{err}</p>}
        <button className="btn btn-primary w-full !py-3">Log in</button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" /> Try a demo account <span className="h-px flex-1 bg-slate-200" /></div>
      <div className="space-y-2.5">
        {DEMO_ACCOUNTS.map((a) => (
          <button key={a.id} onClick={() => { loginAs(a.id); nav(next, { replace: true }); }} className="card flex w-full items-center gap-3 p-3.5 text-left transition hover:border-brand-300 hover:shadow-lift">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{a.label === 'Client' ? <User size={18} /> : a.label === 'Photographer' ? <Camera size={18} /> : <ShieldCheck size={18} />}</span>
            <span className="flex-1"><span className="block font-extrabold">{a.label} · {a.name}</span><span className="text-xs text-slate-500">{a.desc}</span></span>
          </button>
        ))}
      </div>
      <p className="mt-7 text-center text-sm text-slate-500">New here? <Link to="/signup" className="font-extrabold text-brand-600">Create an account</Link></p>
    </Shell>
  );
}

export function Signup() {
  const { signup, user } = useStore();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [role, setRole] = useState<'client' | 'photographer'>(sp.get('role') === 'photographer' ? 'photographer' : 'client');
  const [f, setF] = useState({ name: '', email: '', pw: '', business: '', city: 'Allentown', niche: 'Portrait' });
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  if (user) return <Navigate to="/app" replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Please enter a valid email.');
    if (f.pw.length < 8) return setErr('Password must be at least 8 characters.');
    const r = signup({ name: f.name, email: f.email, role, business: f.business, city: f.city, niche: f.niche });
    if (r) setErr(r);
    else nav('/app', { replace: true });
  };

  return (
    <Shell title="Create your account" sub="It takes less than a minute.">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Account type">
        {(['client', 'photographer'] as const).map((r) => (
          <button key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)} className={cn('rounded-xl py-2.5 text-sm font-extrabold capitalize transition', role === r ? 'bg-white text-brand-700 shadow' : 'text-slate-500')}>{r === 'client' ? "I'm hiring" : "I'm a photographer"}</button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name"><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /></Field>
        <Field label="Email"><input type="email" className="input" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" /></Field>
        <Field label="Password" hint="At least 8 characters"><input type="password" className="input" value={f.pw} onChange={(e) => set('pw', e.target.value)} autoComplete="new-password" /></Field>
        {role === 'photographer' && (
          <>
            <Field label="Business name"><input className="input" value={f.business} onChange={(e) => set('business', e.target.value)} placeholder="e.g. Reyes Light Studio" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City"><select className="input" value={f.city} onChange={(e) => set('city', e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Main niche"><select className="input" value={f.niche} onChange={(e) => set('niche', e.target.value)}>{NICHES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            </div>
            <p className="rounded-xl bg-brand-50 p-3 text-xs font-semibold text-brand-800">Photographer accounts are reviewed before going live. Annual membership is $199 plus a 2.25% booking fee.</p>
          </>
        )}
        {err && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{err}</p>}
        <button className="btn btn-cta w-full !py-3">Create account</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-extrabold text-brand-600">Log in</Link></p>
    </Shell>
  );
}
