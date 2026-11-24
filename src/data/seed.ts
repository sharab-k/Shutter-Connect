import type { Booking, DB, DayHours, Dispute, Message, Payment, Photographer, Post, Review, Service, User } from './types';
import { addDays, iso, parseISO } from '../lib/utils';

/** Future date that never lands on a Sunday (most seed photographers are closed). */
const wd = (n: number) => {
  const d = parseISO(addDays(n));
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return iso(d);
};

const wk = (s = '09:00', e = '17:00', sat: DayHours | null = { start: '10:00', end: '15:00' }): (DayHours | null)[] => [
  null,
  { start: s, end: e },
  { start: s, end: e },
  { start: s, end: e },
  { start: s, end: e },
  { start: s, end: e },
  sat,
];

const svc = (
  id: string,
  name: string,
  description: string,
  price: number,
  durationHrs: number,
  paymentMode: Service['paymentMode'],
  depositPct = 30,
): Service => ({ id, name, description, price, durationHrs, paymentMode, depositPct });

interface Seed {
  n: string;
  biz: string;
  tag: string;
  bio: string;
  niches: string[];
  city: string;
  services: Service[];
  avail?: (DayHours | null)[];
}

const seeds: Seed[] = [
  {
    n: 'Maya Reyes',
    biz: 'Reyes Light Studio',
    tag: 'Warm, natural-light stories for families and couples.',
    bio: 'I am a Lehigh Valley photographer with 9 years behind the lens. I specialise in relaxed, natural-light portraits that feel like you on your best day. Every session includes an online gallery, light retouching and print rights.',
    niches: ['Family', 'Portrait', 'Wedding'],
    city: 'Bethlehem',
    services: [
      svc('s1a', 'Family Portrait Session', '60-minute outdoor session, 25+ edited images, online gallery.', 350, 1, 'upfront'),
      svc('s1b', 'Engagement Session', 'Golden-hour session at a location of your choice, 40+ edited images.', 500, 2, 'deposit', 30),
      svc('s1c', 'Wedding Day Coverage (6 hr)', 'Full coverage, second shooter on request, 400+ images.', 2400, 6, 'deposit', 40),
    ],
  },
  {
    n: 'Jordan Blake',
    biz: 'Blake Portraits',
    tag: 'Clean headshots and personal branding for professionals.',
    bio: 'Corporate headshots, LinkedIn portraits and brand shoots for teams across Allentown and Bethlehem. Fast turnaround, same-week delivery.',
    niches: ['Headshots', 'Portrait'],
    city: 'Allentown',
    services: [
      svc('s2a', 'Headshot Express', '30 minutes, 3 retouched images.', 150, 1, 'upfront'),
      svc('s2b', 'Personal Branding Shoot', '2 hours, 2 outfits, 15 retouched images.', 480, 2, 'upfront'),
      svc('s2c', 'Team Headshots (up to 10)', 'On-site at your office.', 900, 3, 'after'),
    ],
  },
  {
    n: 'Chris Amato',
    biz: 'Amato Weddings',
    tag: 'Timeless wedding photography with a documentary feel.',
    bio: 'Documentary-style wedding photographer. I blend into the day so you can be present. Featured in local wedding guides, over 150 weddings shot across eastern Pennsylvania.',
    niches: ['Wedding', 'Events'],
    city: 'Easton',
    services: [
      svc('s3a', 'Wedding - Essential (6 hr)', 'Ceremony and reception coverage, 450+ images.', 2800, 6, 'deposit', 35),
      svc('s3b', 'Wedding - Full Day (10 hr)', 'Getting-ready through send-off, second shooter included.', 4200, 10, 'deposit', 35),
      svc('s3c', 'Elopement', '2 hours of intimate ceremony coverage.', 950, 2, 'upfront'),
    ],
  },
  {
    n: 'Priya Nair',
    biz: 'Little Moments by Priya',
    tag: 'Gentle newborn and maternity sessions in your home.',
    bio: 'Certified newborn safety-trained photographer. In-home lifestyle sessions focused on comfort, patience and gorgeous detail shots.',
    niches: ['Newborn', 'Family'],
    city: 'Emmaus',
    services: [
      svc('s4a', 'Newborn Lifestyle Session', 'In-home, up to 2 hours, 30 images.', 420, 2, 'deposit', 25),
      svc('s4b', 'Maternity Session', '90 minutes, studio or outdoor.', 320, 2, 'upfront'),
    ],
  },
  {
    n: 'Marcus Webb',
    biz: 'Webb Sports Imagery',
    tag: 'Action-packed sports and event coverage.',
    bio: 'Former high-school athlete turned photographer. Game-day coverage, team media days and senior athlete portraits.',
    niches: ['Sports', 'Senior', 'Events'],
    city: 'Whitehall',
    services: [
      svc('s5a', 'Game Day Coverage', 'Up to 3 hours, 150+ images.', 380, 3, 'after'),
      svc('s5b', 'Senior Athlete Session', '90 minutes with uniform and casual looks.', 260, 2, 'upfront'),
    ],
  },
  {
    n: 'Elena Fischer',
    biz: 'Fischer Property Media',
    tag: 'Bright, crisp real-estate photography that sells homes.',
    bio: 'Real estate and short-term-rental photography with 24-hour delivery. HDR blending, twilight and drone add-ons.',
    niches: ['Real Estate', 'Product'],
    city: 'Macungie',
    services: [
      svc('s6a', 'Listing Photos (up to 2,000 sq ft)', '25+ HDR images, 24-hour delivery.', 220, 1, 'after'),
      svc('s6b', 'Listing + Twilight', 'Daytime plus twilight exterior set.', 340, 2, 'after'),
    ],
  },
  {
    n: 'Devon Carter',
    biz: 'Carter & Co. Photo',
    tag: 'Senior portraits that feel like you, not a template.',
    bio: 'Senior portraits across the Lehigh Valley. Downtown, nature and studio looks with an easy, fun pace.',
    niches: ['Senior', 'Portrait'],
    city: 'Nazareth',
    services: [
      svc('s7a', 'Senior Session', '90 minutes, 2 locations, 35 images.', 290, 2, 'deposit', 30),
      svc('s7b', 'Senior Mini', '45 minutes, 1 location, 15 images.', 160, 1, 'upfront'),
    ],
  },
  {
    n: 'Sofia Alvarez',
    biz: 'Alvarez Events & Co.',
    tag: 'Parties, quinceaneras and corporate events, captured.',
    bio: 'Event photographer for birthdays, quinceaneras, fundraisers and corporate mixers. Candid, energetic and always on time.',
    niches: ['Events', 'Family'],
    city: 'Center Valley',
    services: [
      svc('s8a', 'Event Coverage (2 hr)', 'Candid coverage, 100+ images.', 450, 2, 'deposit', 30),
      svc('s8b', 'Event Coverage (4 hr)', 'Extended coverage, 200+ images.', 800, 4, 'deposit', 30),
    ],
  },
  {
    n: 'Tom Hanley',
    biz: 'Hanley Product Studio',
    tag: 'Product photography for local makers and shops.',
    bio: 'Clean white-background and lifestyle product photography for Etsy, Shopify and print catalogues.',
    niches: ['Product', 'Headshots'],
    city: 'Allentown',
    services: [
      svc('s9a', 'Product Pack (10 items)', 'White-background plus 1 lifestyle shot each.', 390, 3, 'upfront'),
      svc('s9b', 'Lifestyle Brand Shoot', 'Half-day shoot with props and styling.', 780, 4, 'deposit', 40),
    ],
  },
  {
    n: 'Aisha Thompson',
    biz: 'Thompson Family Photography',
    tag: 'Joyful, unposed family sessions for every season.',
    bio: 'Seasonal mini-sessions and full family shoots in parks across Bethlehem and Allentown. Kids and pets welcome.',
    niches: ['Family', 'Newborn', 'Portrait'],
    city: 'Bethlehem',
    services: [
      svc('s10a', 'Seasonal Mini Session', '20 minutes, 10 images.', 175, 1, 'upfront'),
      svc('s10b', 'Full Family Session', '75 minutes, 35 images.', 395, 2, 'upfront'),
    ],
  },
];

const users: User[] = [
  { id: 'u-c1', name: 'Alex Morgan', email: 'alex@example.com', role: 'client', idStatus: 'verified', emailReminders: true, joined: '2026-02-11' },
  { id: 'u-c2', name: 'Sam Patel', email: 'sam@example.com', role: 'client', idStatus: 'unverified', emailReminders: true, joined: '2026-03-02' },
  { id: 'u-c3', name: 'Chris Lee', email: 'chris@example.com', role: 'client', idStatus: 'verified', emailReminders: true, joined: '2026-01-20' },
  { id: 'u-admin', name: 'Devin Ford', email: 'admin@shutterconnect.com', role: 'admin', idStatus: 'verified', emailReminders: true, joined: '2026-01-01' },
];

const photographers: Photographer[] = seeds.map((s, i) => {
  const id = `p${i + 1}`;
  users.push({
    id: `u-${id}`,
    name: s.n,
    email: s.n.split(' ')[0].toLowerCase() + '@example.com',
    role: 'photographer',
    idStatus: i % 4 === 3 ? 'unverified' : 'verified',
    emailReminders: true,
    joined: '2026-02-01',
  });
  return {
    id,
    userId: `u-${id}`,
    name: s.n,
    business: s.biz,
    tagline: s.tag,
    bio: s.bio,
    niches: s.niches,
    city: s.city,
    state: 'PA',
    status: 'approved',
    vetted: i !== 8,
    services: s.services,
    portfolio: Array.from({ length: 9 }, (_, k) => `${id}-work-${k + 1}`),
    availability: s.avail ?? wk(i % 3 === 0 ? '08:00' : '09:00', i % 2 ? '18:00' : '17:00', i === 5 ? null : { start: '10:00', end: '16:00' }),
    blockedDates: [addDays(9), addDays(10)],
    stripeConnected: true,
    dropboxConnected: i < 7,
    subscriptionActive: true,
    joined: '2026-02-01',
  };
});

// A pending application so the admin queue has something in it
users.push({ id: 'u-pending1', name: 'Nate Kowalski', email: 'nate@example.com', role: 'photographer', idStatus: 'pending', emailReminders: true, joined: addDays(-2) });
photographers.push({
  id: 'p11',
  userId: 'u-pending1',
  name: 'Nate Kowalski',
  business: 'Kowalski Frames',
  tagline: 'Concert and event photographer, new to the platform.',
  bio: 'Five years shooting live music and local events. Looking to expand into portraits and corporate work.',
  niches: ['Events', 'Portrait'],
  city: 'Allentown',
  state: 'PA',
  status: 'pending',
  vetted: false,
  services: [svc('s11a', 'Event Coverage (2 hr)', 'Candid coverage, 80+ images.', 300, 2, 'after')],
  portfolio: Array.from({ length: 6 }, (_, k) => `p11-work-${k + 1}`),
  availability: wk(),
  blockedDates: [],
  stripeConnected: false,
  dropboxConnected: false,
  subscriptionActive: false,
  joined: addDays(-2),
});

const day = 86400000;
const now = Date.now();

const mk = (b: Partial<Booking> & Pick<Booking, 'id' | 'clientId' | 'clientName' | 'photographerId' | 'serviceId' | 'status' | 'date'>): Booking => {
  const p = photographers.find((x) => x.id === b.photographerId)!;
  const s = p.services.find((x) => x.id === b.serviceId)!;
  return {
    time: '10:00',
    durationHrs: s.durationHrs,
    location: 'Lehigh Valley, PA',
    notes: '',
    serviceName: s.name,
    total: s.price,
    paymentMode: s.paymentMode,
    depositPct: s.depositPct,
    paid: 0,
    clientReviewed: false,
    photographerReviewed: false,
    createdAt: now - 3 * day,
    ...b,
  };
};

const bookings: Booking[] = [
  mk({ id: 'b1', clientId: 'u-c1', clientName: 'Alex Morgan', photographerId: 'p1', serviceId: 's1a', status: 'requested', date: wd(5), time: '16:00', location: 'Lehigh Canal Park, Bethlehem', notes: 'Family of four, two kids under 6.', createdAt: now - 4 * 3600000 }),
  mk({ id: 'b2', clientId: 'u-c1', clientName: 'Alex Morgan', photographerId: 'p1', serviceId: 's1b', status: 'confirmed', date: wd(12), time: '17:00', location: 'Sand Island, Bethlehem', notes: 'Proposal planned. Please be discreet!' }),
  mk({ id: 'b3', clientId: 'u-c1', clientName: 'Alex Morgan', photographerId: 'p2', serviceId: 's2a', status: 'completed', date: addDays(-20), time: '11:00', paid: 150, deliveryLink: 'https://www.dropbox.com/sh/demo-headshots', createdAt: now - 30 * day }),
  mk({ id: 'b4', clientId: 'u-c2', clientName: 'Sam Patel', photographerId: 'p1', serviceId: 's1c', status: 'requested', date: wd(40), time: '12:00', location: 'Saucon Valley Country Club', notes: '120 guests, outdoor ceremony.' }),
  mk({ id: 'b5', clientId: 'u-c3', clientName: 'Chris Lee', photographerId: 'p1', serviceId: 's1a', status: 'completed', date: addDays(-30), time: '15:00', paid: 350, deliveryLink: 'https://www.dropbox.com/sh/demo-family', photographerReviewed: true, clientReviewed: true, createdAt: now - 40 * day }),
  mk({ id: 'b6', clientId: 'u-c3', clientName: 'Chris Lee', photographerId: 'p1', serviceId: 's1a', status: 'confirmed', date: wd(3), time: '10:00', paid: 350, location: 'Rose Garden, Allentown', createdAt: now - 6 * day }),
  mk({ id: 'b7', clientId: 'u-c2', clientName: 'Sam Patel', photographerId: 'p3', serviceId: 's3c', status: 'confirmed', date: wd(20), time: '14:00', paid: 0, createdAt: now - 2 * day }),
  mk({ id: 'b8', clientId: 'u-c3', clientName: 'Chris Lee', photographerId: 'p4', serviceId: 's4a', status: 'completed', date: addDays(-45), time: '10:00', paid: 420, deliveryLink: 'https://www.dropbox.com/sh/demo-newborn', createdAt: now - 60 * day, clientReviewed: true, photographerReviewed: true }),
  mk({ id: 'b9', clientId: 'u-c2', clientName: 'Sam Patel', photographerId: 'p6', serviceId: 's6a', status: 'completed', date: addDays(-8), time: '09:00', paid: 0, deliveryLink: 'https://www.dropbox.com/sh/demo-listing', createdAt: now - 14 * day }),
];

const payments: Payment[] = bookings
  .filter((b) => b.paid > 0)
  .map((b, i) => ({
    id: `pay${i + 1}`,
    bookingId: b.id,
    photographerId: b.photographerId,
    amount: b.paid,
    fee: Math.round(b.paid * 0.0225 * 100) / 100,
    stage: 'full' as const,
    at: now - (i + 2) * 5 * day,
  }));

const reviewTexts: [string, number, string, string][] = [
  ['p1', 5, 'Alex M.', 'Maya made our kids totally comfortable. The photos are stunning and arrived early.'],
  ['p1', 5, 'Chris L.', 'Professional, warm and fast. We have already booked her again.'],
  ['p1', 4, 'Jamie R.', 'Beautiful work. Just wish the session was a little longer.'],
  ['p2', 5, 'Alex M.', 'Best headshot I have ever had, and it took 20 minutes.'],
  ['p2', 5, 'Dana K.', 'Great for our whole team. Clean, consistent and quick.'],
  ['p3', 5, 'Morgan & Lee', 'Chris captured moments we did not even know happened. Worth every dollar.'],
  ['p3', 5, 'The Hendersons', 'Our wedding gallery made everyone cry, in a good way.'],
  ['p3', 4, 'Pat S.', 'Excellent coverage and great communication.'],
  ['p4', 5, 'Chris L.', 'So gentle and patient with our newborn. Unbelievably good photos.'],
  ['p4', 5, 'Rosa M.', 'Priya made the whole thing effortless.'],
  ['p5', 5, 'Coach Bell', 'Our team loved the action shots.'],
  ['p5', 4, 'Dena W.', 'Great senior athlete photos.'],
  ['p6', 5, 'Keller Realty', 'Consistent quality and 24-hour delivery every time.'],
  ['p6', 4, 'Joe T.', 'Great listing photos. Fast and easy to book.'],
  ['p7', 5, 'Mia S.', 'Devon made me feel like a model. Photos are my favourites ever.'],
  ['p8', 5, 'Lucia P.', 'Sofia captured every moment of my quince perfectly.'],
  ['p8', 4, 'Greg D.', 'Lovely, candid, never in the way.'],
  ['p9', 5, 'Bloom Candle Co.', 'Our shop photos have never looked better.'],
  ['p10', 5, 'Jen & Ty', 'Our dog even behaved. Thank you Aisha!'],
  ['p10', 5, 'The Nguyens', 'Quick, fun and fairly priced.'],
];

const reviews: Review[] = reviewTexts.map(([toId, rating, fromName, text], i) => ({
  id: `r${i + 1}`,
  bookingId: 'seed',
  fromRole: 'client',
  fromName,
  toId,
  rating,
  text,
  at: now - (i + 3) * 4 * day,
}));
reviews.push({
  id: 'r-c1',
  bookingId: 'b5',
  fromRole: 'photographer',
  fromName: 'Maya Reyes',
  toId: 'u-c3',
  rating: 5,
  text: 'Chris was on time, easy to work with and paid promptly. A pleasure.',
  at: now - 25 * day,
});

const messages: Message[] = [
  { id: 'm1', threadId: 'u-c1__p1', fromUserId: 'u-c1', text: 'Hi Maya! We are looking at the 16th for our family session. Would 4pm work for light?', at: now - 5 * 3600000 },
  { id: 'm2', threadId: 'u-c1__p1', fromUserId: 'u-p1', text: 'Hi Alex! 4pm is perfect this time of year. The canal path glows around then. I will review your request now.', at: now - 4.5 * 3600000 },
  { id: 'm3', threadId: 'u-c1__p1', fromUserId: 'u-c1', text: 'Wonderful, thank you!', at: now - 4.4 * 3600000 },
  { id: 'm4', threadId: 'u-c1__p2', fromUserId: 'u-p2', text: 'Thanks again for coming in, Alex. Your headshots are delivered. Enjoy!', at: now - 19 * day },
  { id: 'm5', threadId: 'u-c2__p1', fromUserId: 'u-c2', text: 'Hi, are you available for a wedding at Saucon Valley this fall?', at: now - 2 * day },
];

const disputes: Dispute[] = [
  { id: 'd1', bookingId: 'b9', openedBy: 'u-c2', reason: 'Gallery link delivered but several images are missing from the agreed shot list.', status: 'open', at: now - 2 * day },
  { id: 'd2', bookingId: 'b8', openedBy: 'u-c3', reason: 'Late arrival by 25 minutes. Requesting a partial refund.', status: 'resolved', at: now - 30 * day },
];


/* ---------- Feed ---------- */
const CAPTIONS: Record<string, string[]> = {
  p1: ['Golden hour at the canal never misses. Booked out through December, a few Sundays left.', 'The way she looked at him right before the first dance. That is the whole job.', 'Mini sessions sell out fast. DM me to grab a spot.', 'Rain plan became the best plan. Umbrellas, laughs, zero regrets.'],
  p2: ['Headshots do not have to feel awkward. 20 minutes, 3 retouched frames, done.', 'New team headshots for a local law firm. Same backdrop, consistent look.', 'Before and after: soft light, clean retouch, still looks like you.', 'Personal brand shoot day with a ceramics studio owner.'],
  p3: ['Ceremony light through the barn doors. I am still thinking about this one.', 'Elopement season is here. Two hours, two people, one perfect cliffside.', 'The best candids happen between the posed ones.', 'Getting-ready details from Saturday. The rings, the letter, the shoes.'],
  p4: ['Seven days old and already camera ready. In-home newborn sessions, always.', 'Maternity at sunset. Linen, light and a very patient golden retriever.', 'Tiny toes, big love. Safety-trained and gentle with every session.', 'Sibling shots are chaos and I would not trade them.'],
  p5: ['Friday night lights. Game day coverage delivered by Saturday morning.', 'Senior athlete session: uniform looks plus a few lifestyle frames.', 'Freeze the moment. 1/2000 and a lot of patience.', 'Media day for the Bethlehem Bears.'],
  p6: ['Twilight exteriors sell homes. This one went under contract in 48 hours.', 'Bright, straight lines, true colors. Listing photos delivered next day.', 'Kitchen details that make buyers stop scrolling.', 'Short-term rental refresh: 25 frames, same-day edit.'],
  p7: ['Senior sessions that feel like you, not a template.', 'Downtown brick, golden light and a very cool letterman jacket.', 'Class of 2026, you are going places.', 'Nature session in Nazareth. Windy, wild and perfect.'],
  p8: ['Quince night! Four hours of dancing, hugging and pure joy.', 'Fundraiser gala coverage for the Valley Arts Council.', 'Candid over posed, always. Event photography that feels alive.', 'Birthday party details your guests will want to see.'],
  p9: ['Product photography for a local candle maker. Clean white plus a lifestyle set.', 'Behind the scenes on a half-day brand shoot.', 'Shop owners: your product deserves better than a phone on a desk.', 'Flat lays that actually sell.'],
  p10: ['Seasonal mini sessions are open. Fall color is at its peak.', 'Kids, pets and one very long blanket. Chaos, captured.', 'Full family session in the park. Yes, the dog is invited.', 'Little moments, big memories.'],
};
const TAGS: Record<string, string[]> = {
  Wedding: ['wedding', 'lehighvalley'], Portrait: ['portrait', 'naturallight'], Family: ['family', 'familyphotos'], Newborn: ['newborn', 'maternity'],
  Events: ['events', 'candid'], 'Real Estate': ['realestate', 'listing'], Headshots: ['headshots', 'branding'], Sports: ['sports', 'gameday'], Product: ['product', 'smallbusiness'], Senior: ['senior', 'classof2026'],
};
const COMMENTERS = ['Jamie R.', 'Dana K.', 'Pat S.', 'Morgan L.', 'Rosa M.', 'Greg D.', 'Mia S.', 'Lucia P.'];
const COMMENT_TEXT = ['This is gorgeous! 😍', 'The light!! Booking you next.', 'Obsessed with this one', 'Wow. Just wow.', 'Saving this for inspo', 'Do you have availability in November?', 'Perfect shot 👏', 'Love the colors'];
const RATIOS: ('square' | 'portrait' | 'landscape')[] = ['portrait', 'square', 'portrait', 'landscape'];

const posts: Post[] = [];
photographers.forEach((p, pi) => {
  if (p.status !== 'approved') return;
  const caps = CAPTIONS[p.id] ?? [];
  caps.forEach((caption, k) => {
    const n = pi * 4 + k;
    posts.push({
      id: `post-${p.id}-${k}`,
      photographerId: p.id,
      image: p.portfolio[k] ?? `${p.id}-work-${k + 1}`,
      ratio: RATIOS[(pi + k) % 4],
      caption,
      tags: TAGS[p.niches[k % p.niches.length]] ?? ['photography'],
      location: `${p.city}, PA`,
      at: Date.now() - (k * 2 + pi * 0.37 + 0.2) * 86400000 - (n % 7) * 3600000,
      baseLikes: 38 + ((n * 97) % 760),
      likes: [],
      saves: [],
      comments: Array.from({ length: (n % 4) + 1 }, (_, c) => ({
        id: `c-${n}-${c}`,
        userId: `x-${c}`,
        name: COMMENTERS[(n + c * 3) % COMMENTERS.length],
        text: COMMENT_TEXT[(n * 2 + c) % COMMENT_TEXT.length],
        at: Date.now() - (k * 2 + c * 0.2 + 0.1) * 86400000,
      })),
    });
  });
});
posts.sort((a, b) => b.at - a.at);

const notifications = [
  { id: 'n1', userId: 'u-p1', text: 'New booking request from Alex Morgan: Family Portrait Session', link: '/app/bookings/b1', at: now - 4 * 3600000, read: false },
  { id: 'n2', userId: 'u-p1', text: 'New booking request from Sam Patel: Wedding Day Coverage', link: '/app/bookings/b4', at: now - 3 * day, read: false },
  { id: 'n3', userId: 'u-c1', text: 'Maya confirmed your Engagement Session. A deposit is due to secure the date.', link: '/app/bookings/b2', at: now - 2 * day, read: false },
  { id: 'n4', userId: 'u-c1', text: 'Your headshots from Jordan Blake are ready. Leave a review?', link: '/app/bookings/b3', at: now - 18 * day, read: true },
  { id: 'n5', userId: 'u-admin', text: 'New photographer application: Nate Kowalski', link: '/app/applications', at: now - 2 * day, read: false },
];

export const seedDB = (): DB => ({
  users,
  photographers,
  bookings,
  messages,
  reviews,
  payments,
  notifications,
  disputes,
  posts,
  follows: { 'u-c1': ['p1', 'p2', 'p3'] },
  storySeen: {},
  reads: {},
  sessionUserId: null,
});

export const DEMO_ACCOUNTS = [
  { label: 'Client', name: 'Alex Morgan', id: 'u-c1', desc: 'Book and pay photographers' },
  { label: 'Photographer', name: 'Maya Reyes', id: 'u-p1', desc: 'Manage requests, calendar, earnings' },
  { label: 'Admin', name: 'Devin Ford', id: 'u-admin', desc: 'Vet applications, disputes, metrics' },
];
