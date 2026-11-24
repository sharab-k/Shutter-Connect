import type { Booking, Payment, Photographer } from '../data/types';
import { iso, parseISO, todayISO } from './utils';

export const CANCEL_WINDOW_HOURS = 48;
export const CANCELLATION_POLICY =
  'Free cancellation up to 48 hours before the session. Inside 48 hours, payments already made are non-refundable. If the photographer cancels, you are always refunded in full.';

export const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export const overlaps = (aStart: string, aHrs: number, bStart: string, bHrs: number) => {
  const as = toMin(aStart);
  const bs = toMin(bStart);
  return as < bs + bHrs * 60 && as + aHrs * 60 > bs;
};

export interface AmountDue {
  label: string;
  amount: number;
  stage: Payment['stage'];
}

/** What the client owes right now for a booking, if anything. */
export const amountDue = (b: Booking): AmountDue | null => {
  if (b.status === 'requested' || b.status === 'declined' || b.status === 'cancelled') return null;
  const remaining = Math.round((b.total - b.paid) * 100) / 100;
  if (remaining <= 0) return null;
  if (b.status === 'confirmed') {
    if (b.paymentMode === 'upfront') return { label: 'Pay in full', amount: remaining, stage: 'full' };
    if (b.paymentMode === 'deposit' && b.paid === 0) {
      const dep = Math.round(b.total * (b.depositPct / 100));
      return { label: `Pay ${b.depositPct}% deposit`, amount: dep, stage: 'deposit' };
    }
    return null;
  }
  // completed
  return { label: b.paid > 0 ? 'Pay remaining balance' : 'Pay in full', amount: remaining, stage: b.paid > 0 ? 'balance' : 'full' };
};

/** Open start times (hourly) for a photographer on a given date. */
export const slotsFor = (pro: Photographer, date: string, durationHrs: number, bookings: Booking[]): string[] => {
  if (date <= todayISO()) return [];
  if (pro.blockedDates.includes(date)) return [];
  const hours = pro.availability[parseISO(date).getDay()];
  if (!hours) return [];
  const taken = bookings.filter((b) => b.photographerId === pro.id && b.date === date && b.status === 'confirmed');
  const out: string[] = [];
  for (let m = toMin(hours.start); m + durationHrs * 60 <= toMin(hours.end); m += 60) {
    const startT = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    if (!taken.some((b) => overlaps(startT, durationHrs, b.time, b.durationHrs))) out.push(startT);
  }
  return out;
};

export const nextAvailable = (pro: Photographer, durationHrs: number, bookings: Booking[], count = 3): string[] => {
  const found: string[] = [];
  const d = new Date();
  for (let i = 1; i < 90 && found.length < count; i++) {
    d.setDate(d.getDate() + 1);
    const s = iso(d);
    if (slotsFor(pro, s, durationHrs, bookings).length) found.push(s);
  }
  return found;
};

/** Hours from `now` until the session starts. */
export const hoursUntil = (b: Booking, now = Date.now()) =>
  (parseISO(b.date).getTime() + toMin(b.time) * 60000 - now) / 3600000;

/** Refund owed when a booking is cancelled. */
export const cancellationRefund = (b: Booking, byClient: boolean, now = Date.now()) => {
  if (b.paid <= 0) return 0;
  if (!byClient || b.status === 'requested') return b.paid;
  return hoursUntil(b, now) >= CANCEL_WINDOW_HOURS ? b.paid : 0;
};

/* Approximate city centres for radius search (Lehigh Valley, PA). */
export const CITY_COORDS: Record<string, [number, number]> = {
  Allentown: [40.6084, -75.4902],
  Bethlehem: [40.6259, -75.3705],
  Easton: [40.6884, -75.2207],
  Emmaus: [40.5395, -75.496],
  Whitehall: [40.6551, -75.4991],
  Macungie: [40.5173, -75.5557],
  Nazareth: [40.7406, -75.3099],
  'Center Valley': [40.5398, -75.4093],
};

export const milesBetween = (a: string, b: string) => {
  const p = CITY_COORDS[a];
  const q = CITY_COORDS[b];
  if (!p || !q) return Infinity;
  const R = 3958.8;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(q[0] - p[0]);
  const dLon = rad(q[1] - p[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(p[0])) * Math.cos(rad(q[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
