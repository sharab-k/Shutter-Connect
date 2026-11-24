import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarDays, Check, CreditCard, FolderDown, MessageSquare, Star, UserCheck } from 'lucide-react';

const perks = [
  { icon: BadgeCheck, title: 'Stamp of Approval', text: 'Get vetted and stand out with a badge clients trust.' },
  { icon: CalendarDays, title: 'Smart calendar', text: 'Set your hours. Confirmed bookings automatically block your time.' },
  { icon: CreditCard, title: 'Get paid your way', text: 'Choose up front, after the shoot, or deposit + balance per service. Powered by Stripe.' },
  { icon: FolderDown, title: 'Deliver with Dropbox', text: 'Share galleries through your own Dropbox, with no storage costs.' },
  { icon: MessageSquare, title: 'Client messaging', text: 'Keep every conversation tied to the booking.' },
  { icon: Star, title: 'Reviews & reputation', text: 'Build a public track record, and review your clients too.' },
  { icon: UserCheck, title: 'Verified clients', text: 'Optional ID verification protects you on every job.' },
];

export default function ForPhotographers() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink pb-20 pt-16 text-white sm:pt-24">
        <div className="container-x relative max-w-4xl text-center">
          <p className="eyebrow !text-sun-300">For photographers</p>
          <h1 className="mt-3 font-display text-5xl leading-[.95] sm:text-7xl">Run your whole business <em className="text-sun-300">from anywhere.</em></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85">List your services, take bookings, get paid and deliver photos, all through one platform.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup?role=photographer" className="btn btn-light !px-6 !py-3">Apply to join</Link>
            <Link to="/login" className="btn border border-white/30 !px-6 !py-3 text-white hover:bg-white/10">Log in</Link>
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {perks.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><f.icon size={22} /></span>
              <h3 className="mt-4 text-lg font-extrabold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-x max-w-4xl">
          <h2 className="text-center font-display text-5xl">Simple, honest pricing</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="card p-8 text-center"><p className="eyebrow">Annual membership</p><p className="mt-3 text-5xl font-extrabold">$199<span className="text-lg text-slate-500">/year</span></p><p className="mt-2 text-sm text-slate-500">Profile, calendar, messaging, delivery and admin tools.</p></div>
            <div className="card p-8 text-center"><p className="eyebrow">Per booking</p><p className="mt-3 text-5xl font-extrabold">2.25%</p><p className="mt-2 text-sm text-slate-500">Platform fee on payments made through the app. Stripe fees apply separately.</p></div>
          </div>
          <ul className="mx-auto mt-8 grid max-w-xl gap-2 text-sm font-semibold sm:grid-cols-2">
            {['No setup fees', 'Keep your own client list', 'Choose your payment terms', 'Cancel any time'].map((t) => <li key={t} className="flex items-center gap-2"><Check size={16} className="text-emerald-600" /> {t}</li>)}
          </ul>
        </div>
      </section>

      <section className="container-x py-20">
        <h2 className="text-center font-display text-5xl">How onboarding works</h2>
        <ol className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-4">
          {['Apply', 'Get vetted', 'Connect Stripe & Dropbox', 'Go live'].map((s, i) => (
            <li key={s} className="card p-5 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand-600 font-extrabold text-white">{i + 1}</span><p className="mt-3 font-extrabold">{s}</p></li>
          ))}
        </ol>
        <div className="mt-10 text-center"><Link to="/signup?role=photographer" className="btn btn-cta !px-8 !py-3">Start your application</Link></div>
      </section>
    </>
  );
}
