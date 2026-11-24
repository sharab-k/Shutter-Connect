import { describe, expect, it } from 'vitest';
import { seedDB } from '../data/seed';
import type { Booking, Photographer } from '../data/types';
import { amountDue, cancellationRefund, milesBetween, overlaps, slotsFor } from './booking';
import { addDays, iso, parseISO } from './utils';

const db = seedDB();
const pro = (): Photographer => structuredClone(db.photographers.find((p) => p.id === 'p1')!);

const nextDow = (dow: number, minDays = 14) => {
  const d = parseISO(addDays(minDays));
  while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
  return iso(d);
};

const booking = (over: Partial<Booking> = {}): Booking => ({
  id: 'b-test',
  clientId: 'u-c1',
  clientName: 'Alex',
  photographerId: 'p1',
  serviceId: 's1a',
  serviceName: 'Test',
  date: nextDow(1),
  time: '10:00',
  durationHrs: 1,
  location: 'x',
  notes: '',
  status: 'confirmed',
  total: 400,
  paymentMode: 'upfront',
  depositPct: 25,
  paid: 0,
  clientReviewed: false,
  photographerReviewed: false,
  createdAt: 0,
  ...over,
});

describe('amountDue', () => {
  it('asks for full payment on confirmed up-front bookings', () => {
    expect(amountDue(booking())).toMatchObject({ amount: 400, stage: 'full' });
  });
  it('asks for the deposit first on deposit bookings', () => {
    expect(amountDue(booking({ paymentMode: 'deposit' }))).toMatchObject({ amount: 100, stage: 'deposit' });
  });
  it('asks nothing after the deposit until the job is completed, then the balance', () => {
    const b = booking({ paymentMode: 'deposit', paid: 100 });
    expect(amountDue(b)).toBeNull();
    expect(amountDue({ ...b, status: 'completed' })).toMatchObject({ amount: 300, stage: 'balance' });
  });
  it('asks for payment only after completion in pay-after mode', () => {
    expect(amountDue(booking({ paymentMode: 'after' }))).toBeNull();
    expect(amountDue(booking({ paymentMode: 'after', status: 'completed' }))).toMatchObject({ amount: 400, stage: 'full' });
  });
  it('asks nothing for requests, declined, cancelled or fully paid bookings', () => {
    expect(amountDue(booking({ status: 'requested' }))).toBeNull();
    expect(amountDue(booking({ status: 'declined' }))).toBeNull();
    expect(amountDue(booking({ status: 'cancelled' }))).toBeNull();
    expect(amountDue(booking({ paid: 400, status: 'completed' }))).toBeNull();
  });
});

describe('slotsFor', () => {
  it('returns hourly slots inside working hours', () => {
    const slots = slotsFor(pro(), nextDow(1), 1, []);
    expect(slots[0]).toBe('08:00');
    expect(slots.at(-1)).toBe('16:00');
  });
  it('returns nothing on closed days, blocked dates and past dates', () => {
    expect(slotsFor(pro(), nextDow(0), 1, [])).toEqual([]);
    const p = pro();
    const d = nextDow(2);
    p.blockedDates.push(d);
    expect(slotsFor(p, d, 1, [])).toEqual([]);
    expect(slotsFor(pro(), addDays(-3), 1, [])).toEqual([]);
  });
  it('removes slots overlapped by a confirmed booking, but not by a pending request', () => {
    const date = nextDow(3);
    const confirmed = booking({ date, time: '10:00', durationHrs: 2 });
    const open = slotsFor(pro(), date, 1, [confirmed]);
    expect(open).not.toContain('10:00');
    expect(open).not.toContain('11:00');
    expect(open).toContain('09:00');
    expect(open).toContain('12:00');
    expect(slotsFor(pro(), date, 1, [{ ...confirmed, status: 'requested' }])).toContain('10:00');
  });
  it('does not offer a slot whose duration would overrun the end of the day', () => {
    expect(slotsFor(pro(), nextDow(4), 3, []).at(-1)).toBe('14:00');
  });
});

describe('overlaps', () => {
  it('detects overlap and allows back-to-back sessions', () => {
    expect(overlaps('10:00', 2, '11:00', 1)).toBe(true);
    expect(overlaps('10:00', 1, '11:00', 1)).toBe(false);
    expect(overlaps('09:00', 1, '10:00', 2)).toBe(false);
  });
});

describe('cancellationRefund', () => {
  const now = Date.now();
  it('refunds nothing when nothing was paid', () => {
    expect(cancellationRefund(booking({ paid: 0 }), true, now)).toBe(0);
  });
  it('refunds in full when the client cancels 48+ hours ahead', () => {
    expect(cancellationRefund(booking({ paid: 400, date: addDays(10) }), true, now)).toBe(400);
  });
  it('keeps payments when the client cancels inside 48 hours', () => {
    expect(cancellationRefund(booking({ paid: 400, date: addDays(1), time: '09:00' }), true, now)).toBe(0);
  });
  it('always refunds in full when the photographer cancels', () => {
    expect(cancellationRefund(booking({ paid: 400, date: addDays(1) }), false, now)).toBe(400);
  });
});

describe('milesBetween', () => {
  it('is zero for the same city and plausible for neighbours', () => {
    expect(milesBetween('Allentown', 'Allentown')).toBe(0);
    const d = milesBetween('Allentown', 'Bethlehem');
    expect(d).toBeGreaterThan(5);
    expect(d).toBeLessThan(10);
  });
  it('is infinite for unknown cities', () => {
    expect(milesBetween('Allentown', 'Nowhere')).toBe(Infinity);
  });
});
