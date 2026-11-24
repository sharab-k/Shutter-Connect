import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { seedDB } from '../data/seed';
import {
  PLATFORM_FEE,
  type Booking,
  type DB,
  type IdStatus,
  type Notif,
  type Payment,
  type Photographer,
  type Post,
  type Role,
  type Service,
  type User,
} from '../data/types';
import { addHours, todayISO, uid } from '../lib/utils';
import { amountDue, cancellationRefund, overlaps } from '../lib/booking';

export { amountDue, slotsFor, nextAvailable } from '../lib/booking';

const KEY = 'shutter-connect-db-v1';
const SESSION_KEY = 'shutter-connect-session';

/** Shared data lives in localStorage; the logged-in user is per tab (sessionStorage), so two tabs can act as two people. */
const readShared = (): DB => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seedDB(), ...(JSON.parse(raw) as DB), sessionUserId: null };
  } catch {
    /* ignore */
  }
  return seedDB();
};
const load = (): DB => {
  let session: string | null = null;
  try {
    session = sessionStorage.getItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  return { ...readShared(), sessionUserId: session };
};


interface Store {
  db: DB;
  user: User | null;
  pro: Photographer | null;
  /* auth */
  loginAs: (userId: string) => void;
  login: (email: string) => string | null;
  signup: (p: { name: string; email: string; role: Exclude<Role, 'admin'>; business?: string; city?: string; niche?: string }) => string | null;
  logout: () => void;
  resetDemo: () => void;
  updateUser: (patch: Partial<User>) => void;
  verifyId: () => void;
  /* queries */
  ratingOf: (photographerId: string) => { avg: number; count: number };
  clientRating: (userId: string) => { avg: number; count: number };
  /* booking lifecycle */
  requestBooking: (i: { photographerId: string; serviceId: string; date: string; time: string; location: string; notes: string }) => Booking | null;
  /** Returns an error message when the action is not allowed, otherwise null. */
  respond: (bookingId: string, accept: boolean, reason?: string) => string | null;
  /** Cancels a booking and returns the refund issued (0 if none). */
  cancel: (bookingId: string) => number;
  pay: (bookingId: string) => void;
  complete: (bookingId: string) => void;
  setDelivery: (bookingId: string, link: string) => void;
  addReview: (bookingId: string, rating: number, text: string) => void;
  openDispute: (bookingId: string, reason: string) => void;
  resolveDispute: (id: string, refund: boolean) => void;
  /* messaging / notifications */
  send: (threadId: string, text: string, image?: string) => void;
  markThreadRead: (threadId: string) => void;
  react: (messageId: string, emoji: string) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  toggleFollow: (photographerId: string) => void;
  createPost: (p: { image: string; caption: string; tags: string[]; ratio: Post['ratio'] }) => void;
  deletePost: (id: string) => void;
  markStorySeen: (photographerId: string) => void;
  ensureThread: (photographerId: string) => string | null;
  markRead: () => void;
  /* photographer */
  updatePro: (patch: Partial<Photographer>) => void;
  saveService: (s: Service) => void;
  deleteService: (id: string) => void;
  setProStatus: (id: string, status: Photographer['status']) => void;
  toggleVetted: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...db, sessionUserId: null }));
      if (db.sessionUserId) sessionStorage.setItem(SESSION_KEY, db.sessionUserId);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore quota */
    }
  }, [db]);
  // Keep other open tabs in sync (e.g. a client tab and a photographer tab side by side).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) setDb((prev) => ({ ...(JSON.parse(e.newValue as string) as DB), sessionUserId: prev.sessionUserId }));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const user = useMemo(() => db.users.find((u) => u.id === db.sessionUserId) ?? null, [db]);
  const pro = useMemo(() => db.photographers.find((p) => p.userId === db.sessionUserId) ?? null, [db]);

  const mutate = useCallback((fn: (d: DB) => DB) => setDb((d) => fn(d)), []);
  const notify = (d: DB, userId: string, text: string, link?: string): Notif[] => [
    { id: uid('n'), userId, text, link, at: Date.now(), read: false },
    ...d.notifications,
  ];
  const proUser = (d: DB, pid: string) => d.photographers.find((p) => p.id === pid)?.userId ?? '';

  const value = useMemo<Store>(
    () => ({
      db,
      user,
      pro,
      loginAs: (id) => mutate((d) => ({ ...d, sessionUserId: id })),
      login: (email) => {
        const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u) return 'No account found with that email. Try a demo account or sign up.';
        mutate((d) => ({ ...d, sessionUserId: u.id }));
        return null;
      },
      signup: ({ name, email, role, business, city, niche }) => {
        if (db.users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase()))
          return 'An account with this email already exists. Please log in.';
        const id = uid('u');
        const u: User = { id, name: name.trim(), email: email.trim(), role, idStatus: 'unverified', emailReminders: true, joined: todayISO() };
        mutate((d) => {
          const next = { ...d, users: [...d.users, u], sessionUserId: id };
          if (role === 'photographer') {
            const p: Photographer = {
              id: uid('p'),
              userId: id,
              name: u.name,
              business: business?.trim() || `${u.name} Photography`,
              tagline: '',
              bio: '',
              niches: niche ? [niche] : [],
              city: city || 'Allentown',
              state: 'PA',
              status: 'pending',
              vetted: false,
              services: [],
              portfolio: [],
              availability: [null, { start: '09:00', end: '17:00' }, { start: '09:00', end: '17:00' }, { start: '09:00', end: '17:00' }, { start: '09:00', end: '17:00' }, { start: '09:00', end: '17:00' }, null],
              blockedDates: [],
              stripeConnected: false,
              dropboxConnected: false,
              subscriptionActive: false,
              joined: todayISO(),
            };
            next.photographers = [...d.photographers, p];
            const admin = d.users.find((x) => x.role === 'admin');
            if (admin) next.notifications = notify(d, admin.id, `New photographer application: ${u.name}`, '/app/applications');
          }
          return next;
        });
        return null;
      },
      logout: () => mutate((d) => ({ ...d, sessionUserId: null })),
      resetDemo: () => {
        localStorage.removeItem(KEY);
        setDb(seedDB());
      },
      updateUser: (patch) => mutate((d) => ({ ...d, users: d.users.map((u) => (u.id === d.sessionUserId ? { ...u, ...patch } : u)) })),
      verifyId: () => {
        const uidNow = db.sessionUserId;
        if (!uidNow) return;
        const set = (s: IdStatus) => setDb((d) => ({ ...d, users: d.users.map((u) => (u.id === uidNow ? { ...u, idStatus: s } : u)) }));
        set('pending');
        timers.current.push(window.setTimeout(() => set('verified'), 3500));
      },

      ratingOf: (pid) => {
        const r = db.reviews.filter((x) => x.toId === pid && x.fromRole === 'client');
        return { avg: r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0, count: r.length };
      },
      clientRating: (id) => {
        const r = db.reviews.filter((x) => x.toId === id && x.fromRole === 'photographer');
        return { avg: r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0, count: r.length };
      },

      requestBooking: ({ photographerId, serviceId, date, time, location, notes }) => {
        const p = db.photographers.find((x) => x.id === photographerId);
        const s = p?.services.find((x) => x.id === serviceId);
        const u = user;
        if (!p || !s || !u) return null;
        const b: Booking = {
          id: uid('b'),
          clientId: u.id,
          clientName: u.name,
          photographerId,
          serviceId,
          serviceName: s.name,
          date,
          time,
          durationHrs: s.durationHrs,
          location,
          notes,
          status: 'requested',
          total: s.price,
          paymentMode: s.paymentMode,
          depositPct: s.depositPct,
          paid: 0,
          clientReviewed: false,
          photographerReviewed: false,
          createdAt: Date.now(),
        };
        mutate((d) => ({
          ...d,
          bookings: [b, ...d.bookings],
          notifications: notify(d, p.userId, `New booking request from ${u.name}: ${s.name}`, `/app/bookings/${b.id}`),
        }));
        return b;
      },
      respond: (id, accept, reason) => {
        const target = db.bookings.find((x) => x.id === id);
        if (!target) return 'Booking not found.';
        if (accept) {
          const clash = db.bookings.some(
            (o) => o.id !== id && o.photographerId === target.photographerId && o.date === target.date && o.status === 'confirmed' && overlaps(target.time, target.durationHrs, o.time, o.durationHrs),
          );
          if (clash) return 'You already have a confirmed booking that overlaps this time. Decline this request or cancel the other one.';
        }
        mutate((d) => {
          const b = d.bookings.find((x) => x.id === id);
          if (!b) return d;
          const status = accept ? 'confirmed' : 'declined';
          const text = accept
            ? `${d.photographers.find((p) => p.id === b.photographerId)?.name} confirmed your ${b.serviceName}.${b.paymentMode !== 'after' ? ' Payment is due to secure the date.' : ''}`
            : `Your request for ${b.serviceName} was declined.`;
          return {
            ...d,
            bookings: d.bookings.map((x) => (x.id === id ? { ...x, status, declineReason: accept ? undefined : reason } : x)),
            notifications: notify(d, b.clientId, text, `/app/bookings/${id}`),
          };
        });
        return null;
      },
      cancel: (id) => {
        const target = db.bookings.find((x) => x.id === id);
        if (!target) return 0;
        const byClient = db.sessionUserId === target.clientId;
        const refund = cancellationRefund(target, byClient);
        mutate((d) => {
          const b = d.bookings.find((x) => x.id === id);
          if (!b) return d;
          const other = byClient ? proUser(d, b.photographerId) : b.clientId;
          const refundPay: Payment[] =
            refund > 0
              ? [{ id: uid('pay'), bookingId: id, photographerId: b.photographerId, amount: -refund, fee: -Math.round(refund * PLATFORM_FEE * 100) / 100, stage: 'refund', at: Date.now() }]
              : [];
          return {
            ...d,
            bookings: d.bookings.map((x) => (x.id === id ? { ...x, status: 'cancelled', paid: x.paid - refund } : x)),
            payments: [...refundPay, ...d.payments],
            notifications: notify(d, other, `A booking for ${b.serviceName} on ${b.date} was cancelled.${refund > 0 ? ` $${refund} was refunded.` : ''}`, `/app/bookings/${id}`),
          };
        });
        return refund;
      },
      pay: (id) =>
        mutate((d) => {
          const b = d.bookings.find((x) => x.id === id);
          if (!b) return d;
          const due = amountDue(b);
          if (!due) return d;
          const pay: Payment = {
            id: uid('pay'),
            bookingId: id,
            photographerId: b.photographerId,
            amount: due.amount,
            fee: Math.round(due.amount * PLATFORM_FEE * 100) / 100,
            stage: due.stage,
            at: Date.now(),
          };
          return {
            ...d,
            bookings: d.bookings.map((x) => (x.id === id ? { ...x, paid: x.paid + due.amount } : x)),
            payments: [pay, ...d.payments],
            notifications: notify(d, proUser(d, b.photographerId), `Payment received: $${due.amount} for ${b.serviceName}`, `/app/bookings/${id}`),
          };
        }),
      complete: (id) =>
        mutate((d) => {
          const b = d.bookings.find((x) => x.id === id);
          if (!b) return d;
          return {
            ...d,
            bookings: d.bookings.map((x) => (x.id === id ? { ...x, status: 'completed' } : x)),
            notifications: notify(d, b.clientId, `${b.serviceName} is marked complete. Your files will unlock once paid in full.`, `/app/bookings/${id}`),
          };
        }),
      setDelivery: (id, link) =>
        mutate((d) => {
          const b = d.bookings.find((x) => x.id === id);
          if (!b) return d;
          return {
            ...d,
            bookings: d.bookings.map((x) => (x.id === id ? { ...x, deliveryLink: link } : x)),
            notifications: notify(d, b.clientId, `Your photos for ${b.serviceName} are ready to download.`, `/app/bookings/${id}`),
          };
        }),
      addReview: (id, rating, text) =>
        mutate((d) => {
          const b = d.bookings.find((x) => x.id === id);
          const u = d.users.find((x) => x.id === d.sessionUserId);
          if (!b || !u) return d;
          const fromClient = u.role === 'client';
          const r = {
            id: uid('r'),
            bookingId: id,
            fromRole: fromClient ? ('client' as const) : ('photographer' as const),
            fromName: u.name,
            toId: fromClient ? b.photographerId : b.clientId,
            rating,
            text,
            at: Date.now(),
          };
          return {
            ...d,
            reviews: [r, ...d.reviews],
            bookings: d.bookings.map((x) => (x.id === id ? (fromClient ? { ...x, clientReviewed: true } : { ...x, photographerReviewed: true }) : x)),
          };
        }),
      openDispute: (id, reason) =>
        mutate((d) => {
          if (d.disputes.some((x) => x.bookingId === id && x.status === 'open')) return d;
          const admin = d.users.find((x) => x.role === 'admin');
          return {
            ...d,
            disputes: [{ id: uid('d'), bookingId: id, openedBy: d.sessionUserId ?? '', reason, status: 'open', at: Date.now() }, ...d.disputes],
            notifications: admin ? notify(d, admin.id, 'A new dispute was opened.', '/app/disputes') : d.notifications,
          };
        }),
      resolveDispute: (id, refund) =>
        mutate((d) => {
          const disp = d.disputes.find((x) => x.id === id);
          return {
            ...d,
            disputes: d.disputes.map((x) => (x.id === id ? { ...x, status: refund ? 'refunded' : 'resolved' } : x)),
            payments: refund && disp ? d.payments.map((p) => (p.bookingId === disp.bookingId ? { ...p, refunded: true } : p)) : d.payments,
          };
        }),

      send: (threadId, text, image) => {
        if ((!text.trim() && !image) || !user) return;
        mutate((d) => ({
          ...d,
          messages: [...d.messages, { id: uid('m'), threadId, fromUserId: user.id, text: text.trim(), image, at: Date.now() }],
          reads: { ...d.reads, [`${user.id}|${threadId}`]: Date.now() },
        }));
      },
      markThreadRead: (threadId) =>
        mutate((d) => {
          if (!d.sessionUserId) return d;
          const key = `${d.sessionUserId}|${threadId}`;
          const last = d.messages.filter((m) => m.threadId === threadId).reduce((s, m) => Math.max(s, m.at), 0);
          if ((d.reads[key] ?? 0) >= last) return d;
          return { ...d, reads: { ...d.reads, [key]: Date.now() } };
        }),
      react: (messageId, emoji) =>
        mutate((d) => ({
          ...d,
          messages: d.messages.map((m) => {
            if (m.id !== messageId || !d.sessionUserId) return m;
            const r = { ...(m.reactions ?? {}) };
            if (r[d.sessionUserId] === emoji) delete r[d.sessionUserId];
            else r[d.sessionUserId] = emoji;
            return { ...m, reactions: r };
          }),
        })),
      toggleLike: (postId) =>
        mutate((d) => {
          const me = d.sessionUserId;
          if (!me) return d;
          return { ...d, posts: d.posts.map((p) => (p.id === postId ? { ...p, likes: p.likes.includes(me) ? p.likes.filter((x) => x !== me) : [...p.likes, me] } : p)) };
        }),
      toggleSave: (postId) =>
        mutate((d) => {
          const me = d.sessionUserId;
          if (!me) return d;
          return { ...d, posts: d.posts.map((p) => (p.id === postId ? { ...p, saves: p.saves.includes(me) ? p.saves.filter((x) => x !== me) : [...p.saves, me] } : p)) };
        }),
      addComment: (postId, text) => {
        if (!text.trim() || !user) return;
        mutate((d) => {
          const post = d.posts.find((p) => p.id === postId);
          const owner = post && d.photographers.find((x) => x.id === post.photographerId)?.userId;
          return {
            ...d,
            posts: d.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, { id: uid('c'), userId: user.id, name: user.name, text: text.trim(), at: Date.now() }] } : p)),
            notifications: owner && owner !== user.id ? notify(d, owner, `${user.name} commented: "${text.trim().slice(0, 60)}"`, '/app') : d.notifications,
          };
        });
      },
      toggleFollow: (pid) =>
        mutate((d) => {
          const me = d.sessionUserId;
          if (!me) return d;
          const cur = d.follows[me] ?? [];
          return { ...d, follows: { ...d.follows, [me]: cur.includes(pid) ? cur.filter((x) => x !== pid) : [...cur, pid] } };
        }),
      createPost: ({ image, caption, tags, ratio }) => {
        if (!pro) return;
        mutate((d) => ({
          ...d,
          posts: [{ id: uid('post'), photographerId: pro.id, image, ratio, caption: caption.trim(), tags, location: `${pro.city}, PA`, at: Date.now(), baseLikes: 0, likes: [], saves: [], comments: [] }, ...d.posts],
        }));
      },
      deletePost: (id) => mutate((d) => ({ ...d, posts: d.posts.filter((p) => p.id !== id) })),
      markStorySeen: (pid) =>
        mutate((d) => {
          const me = d.sessionUserId;
          if (!me || (d.storySeen[me] ?? []).includes(pid)) return d;
          return { ...d, storySeen: { ...d.storySeen, [me]: [...(d.storySeen[me] ?? []), pid] } };
        }),
      ensureThread: (pid) => (user && user.role === 'client' ? `${user.id}__${pid}` : null),
      markRead: () =>
        mutate((d) => ({ ...d, notifications: d.notifications.map((n) => (n.userId === d.sessionUserId ? { ...n, read: true } : n)) })),

      updatePro: (patch) =>
        mutate((d) => ({ ...d, photographers: d.photographers.map((p) => (p.userId === d.sessionUserId ? { ...p, ...patch } : p)) })),
      saveService: (s) =>
        mutate((d) => ({
          ...d,
          photographers: d.photographers.map((p) =>
            p.userId === d.sessionUserId
              ? { ...p, services: p.services.some((x) => x.id === s.id) ? p.services.map((x) => (x.id === s.id ? s : x)) : [...p.services, s] }
              : p,
          ),
        })),
      deleteService: (id) =>
        mutate((d) => ({
          ...d,
          photographers: d.photographers.map((p) => (p.userId === d.sessionUserId ? { ...p, services: p.services.filter((x) => x.id !== id) } : p)),
        })),
      setProStatus: (id, status) =>
        mutate((d) => {
          const p = d.photographers.find((x) => x.id === id);
          return {
            ...d,
            photographers: d.photographers.map((x) => (x.id === id ? { ...x, status, vetted: status === 'approved' ? true : x.vetted } : x)),
            notifications: p
              ? notify(d, p.userId, status === 'approved' ? 'You have been approved and earned the Stamp of Approval badge. Your profile is live!' : 'Your application was not approved at this time.', '/app')
              : d.notifications,
          };
        }),
      toggleVetted: (id) => mutate((d) => ({ ...d, photographers: d.photographers.map((x) => (x.id === id ? { ...x, vetted: !x.vetted } : x)) })),
    }),
    [db, user, pro, mutate],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore must be used within AppStoreProvider');
  return c;
}

export { addHours };
