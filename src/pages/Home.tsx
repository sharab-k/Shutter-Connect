import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Bookmark, CalendarCheck, Heart, MessageCircle, Send, Star } from 'lucide-react';
import ProCard from '../components/ProCard';
import { Avatar, Photo } from '../components/ui';
import { useStore } from '../store/AppStore';
import { NICHES } from '../data/types';
import type { ReactNode } from 'react';

const faqs = [
  ['How does booking work?', 'Pick a photographer and a service, choose an open date, and send a request. They confirm or decline. Once confirmed, the time is blocked on their calendar and any payment secures your date.'],
  ['When do I pay?', 'Every photographer chooses: in full up front, after the shoot, or a deposit followed by the balance. You always see the terms before you request.'],
  ['How do I get my photos?', 'Photographers share a Dropbox gallery inside your booking. It unlocks when the session is completed and paid.'],
  ['Is it safe?', 'Photographers are vetted by our team and can verify their ID. Payments run through Stripe, and both sides can leave reviews after every job.'],
  ['Where is it available?', 'The beta is live in the Lehigh Valley, Pennsylvania, with more regions after launch.'],
];

function Phone({ children, tilt = '' }: { children: ReactNode; tilt?: string }) {
  return (
    <div className={`relative mx-auto w-[270px] shrink-0 rounded-[2.4rem] border-[9px] border-ink bg-white shadow-2xl ${tilt}`} aria-hidden>
      <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-ink" />
      <div className="h-[520px] overflow-hidden rounded-[1.75rem] bg-white pt-6">{children}</div>
    </div>
  );
}

export default function Home() {
  const { db } = useStore();
  const featured = db.photographers.filter((p) => p.status === 'approved' && p.subscriptionActive && p.vetted).slice(0, 3);
  const mosaic = ['p3-work-2', 'p1-work-1', 'p4-work-3', 'p7-work-2'];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className="container-x grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div>
            <p className="eyebrow">Lehigh Valley, PA · now in beta</p>
            <h1 className="mt-4 font-display text-[3.25rem] leading-[.95] sm:text-7xl lg:text-[5.5rem]">
              Hire a photographer like you'd <em className="text-brand-600">hail a ride.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-600">Scroll real work from vetted local photographers, message them directly, book a date and pay. Your photos land inside the booking.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/photographers" className="btn !min-h-[48px] bg-ink !px-6 text-base text-white hover:bg-slate-800">Explore photographers <ArrowRight size={18} /></Link>
              <Link to="/signup?role=photographer" className="btn btn-ghost !min-h-[48px] text-base font-bold">I'm a photographer</Link>
            </div>
            <dl className="mt-10 flex gap-8 border-t border-line pt-6 text-sm">
              <div><dt className="text-slate-500">Vetted pros</dt><dd className="font-display text-3xl">{db.photographers.filter((p) => p.status === 'approved').length}</dd></div>
              <div><dt className="text-slate-500">Avg. rating</dt><dd className="font-display text-3xl">4.8</dd></div>
              <div><dt className="text-slate-500">Payments</dt><dd className="font-display text-3xl">Stripe</dd></div>
            </dl>
          </div>

          <div className="relative mx-auto grid w-full max-w-lg grid-cols-2 gap-3 sm:gap-4" aria-hidden>
            <div className="space-y-3 pt-10 sm:space-y-4 sm:pt-14">
              <Photo seed={mosaic[0]} w={600} h={780} className="aspect-[4/5] w-full rounded-xl" priority />
              <Photo seed={mosaic[1]} w={600} h={600} className="aspect-square w-full rounded-xl" priority />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <Photo seed={mosaic[2]} w={600} h={600} className="aspect-square w-full rounded-xl" priority />
              <Photo seed={mosaic[3]} w={600} h={780} className="aspect-[4/5] w-full rounded-xl" priority />
            </div>
            <div className="absolute -left-2 top-4 flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 shadow-lift sm:-left-8"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CalendarCheck size={17} /></span><span className="text-xs leading-tight"><b className="block">Booking confirmed</b><span className="text-slate-500">Sat · 4:00 PM</span></span></div>
            <div className="absolute -right-2 bottom-8 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-lift sm:-right-6"><Star size={16} className="fill-amber-400 text-amber-400" /><span className="text-xs leading-tight"><b className="block">4.9 · Vetted</b><span className="text-slate-500">Reyes Light Studio</span></span></div>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section id="how" className="container-x grid scroll-mt-20 items-center gap-12 py-20 lg:grid-cols-2 lg:gap-24">
        <div className="order-2 lg:order-1">
          <Phone tilt="lg:-rotate-2">
            <div className="flex items-center gap-2 px-3 py-2"><Avatar name="Maya Reyes" size={28} /><div className="text-[11px] leading-tight"><b className="flex items-center gap-1">Reyes Light Studio <BadgeCheck size={11} className="fill-brand-600 text-white" /></b><span className="text-slate-500">Bethlehem, PA</span></div></div>
            <Photo seed="p1-work-2" w={540} h={675} className="aspect-[4/5] w-full" />
            <div className="flex items-center gap-3 px-3 pt-2.5"><Heart size={20} className="fill-rose-500 text-rose-500" /><MessageCircle size={19} /><Send size={18} /><Bookmark size={19} className="ml-auto" /></div>
            <p className="px-3 pt-1.5 text-[11px] font-bold">1,204 likes</p>
            <p className="px-3 text-[11px] leading-snug"><b>reyeslight</b> Golden hour at the canal never misses. A few Sundays left.</p>
            <div className="mx-3 mt-2.5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold">Book Maya · from $350 <ArrowRight size={13} /></div>
          </Phone>
        </div>
        <div className="order-1 lg:order-2">
          <p className="eyebrow">01 · Scroll</p>
          <h2 className="mt-3 font-display text-5xl leading-none sm:text-6xl">A feed of real work, <em>not stock photos.</em></h2>
          <p className="mt-5 max-w-md text-lg text-slate-600">Follow the photographers you like. Double-tap to love a shot, save inspiration, and book the person behind it in one tap.</p>
          <ul className="mt-6 space-y-2 text-slate-700">
            <li className="flex gap-3"><span className="mt-2.5 h-1 w-6 shrink-0 bg-brand-600" /> Stories, likes, comments and saves</li>
            <li className="flex gap-3"><span className="mt-2.5 h-1 w-6 shrink-0 bg-brand-600" /> Every post links to a bookable photographer</li>
            <li className="flex gap-3"><span className="mt-2.5 h-1 w-6 shrink-0 bg-brand-600" /> Discover by style, tag and distance</li>
          </ul>
        </div>
      </section>

      {/* DM */}
      <section className="border-y border-line bg-white">
        <div className="container-x grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="eyebrow">02 · Message</p>
            <h2 className="mt-3 font-display text-5xl leading-none sm:text-6xl">DMs that turn into <em>bookings.</em></h2>
            <p className="mt-5 max-w-md text-lg text-slate-600">Ask about availability, share a mood board, then request the date. Reminders, receipts and galleries stay attached to the same conversation.</p>
          </div>
          <Phone tilt="lg:rotate-2">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2"><Avatar name="Jordan Blake" size={26} /><b className="text-[11px]">Blake Portraits</b></div>
            <div className="space-y-1.5 p-3 text-[11px]">
              <p className="w-fit max-w-[75%] rounded-2xl bg-slate-100 px-3 py-1.5">Hi Alex! Thursday 11am works for headshots.</p>
              <p className="ml-auto w-fit max-w-[75%] rounded-2xl bg-bubble px-3 py-1.5 text-white">Perfect. Requesting it now 🙌</p>
              <div className="mx-auto my-3 flex items-center gap-2 rounded-lg border border-line px-3 py-2"><CalendarCheck size={16} className="text-brand-600" /><span><b className="block">Headshot Express</b><span className="text-slate-500">Confirmed · Thu, 11:00 AM</span></span></div>
              <p className="w-fit max-w-[75%] rounded-2xl bg-slate-100 px-3 py-1.5">Your photos are ready! 📸</p>
              <p className="ml-auto text-right text-[10px] text-slate-400">Seen</p>
            </div>
          </Phone>
        </div>
      </section>

      {/* Styles */}
      <section className="container-x py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="eyebrow">03 · Book</p><h2 className="mt-3 font-display text-5xl leading-none sm:text-6xl">Every kind of shoot</h2></div>
          <Link to="/photographers" className="hidden text-sm font-bold underline-offset-4 hover:underline sm:inline">See all</Link>
        </div>
        <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
          {NICHES.map((n) => (
            <Link key={n} to={`/photographers?niche=${n}`} className="group relative aspect-[3/4] w-40 shrink-0 overflow-hidden rounded-xl sm:w-auto">
              <Photo seed={`niche-${n}`} w={400} h={540} alt={n} className="h-full w-full transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
              <span className="absolute bottom-3 left-3 font-display text-2xl text-white">{n}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-x">
          <div className="mb-8 flex items-end justify-between"><h2 className="font-display text-5xl leading-none sm:text-6xl">Local favourites</h2><Link to="/photographers" className="text-sm font-bold underline-offset-4 hover:underline">View all</Link></div>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">{featured.map((p) => <ProCard key={p.id} p={p} />)}</div>
        </div>
      </section>

      {/* Photographers */}
      <section className="bg-ink text-white">
        <div className="container-x grid items-center gap-10 py-20 md:grid-cols-[1.3fr_.7fr]">
          <div>
            <p className="eyebrow !text-sun-300">For photographers</p>
            <h2 className="mt-3 font-display text-5xl leading-[.95] sm:text-7xl">Your whole business, <em>in one app.</em></h2>
            <p className="mt-5 max-w-lg text-lg text-white/70">Post your work, take bookings, get paid and deliver galleries. One membership, no per-lead fees.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link to="/signup?role=photographer" className="btn btn-light !min-h-[48px] !px-6 text-base">Apply to join</Link><Link to="/for-photographers" className="btn !min-h-[48px] border border-white/30 text-base text-white hover:bg-white/10">See how it works</Link></div>
          </div>
          <div className="border-t border-white/20 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0"><p className="font-display text-7xl text-sun-300">$199<span className="text-2xl text-white/60"> / year</span></p><p className="mt-1 text-white/70">+ 2.25% per booking. Stripe fees apply.</p></div>
        </div>
      </section>

      <section className="container-x py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-5xl leading-none">Questions</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-lg font-semibold">{q}<span className="ml-4 text-2xl font-light text-brand-600 transition group-open:rotate-45" aria-hidden>+</span></summary>
                <p className="pb-2 pt-1 text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
