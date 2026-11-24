import { useLocation } from 'react-router-dom';
import type { DB, Message, Photographer, User } from '../data/types';

export const followersOf = (db: DB, pid: string) => {
  const seed = [...pid].reduce((s, c) => s + c.charCodeAt(0), 0);
  const base = 140 + ((seed * 53) % 880);
  return base + Object.values(db.follows).filter((l) => l.includes(pid)).length;
};

export const postsOf = (db: DB, pid: string) => db.posts.filter((p) => p.photographerId === pid);

export const likeCount = (p: { baseLikes: number; likes: string[] }) => p.baseLikes + p.likes.length;

export interface Thread {
  id: string;
  name: string;
  /** photographer id to link a profile (when the other party is a photographer) */
  proId?: string;
  other: string;
  last?: Message;
  unread: boolean;
  seen: boolean;
}

/** All conversations for the logged-in person, newest first. */
export const threadsFor = (db: DB, user: User | null, pro: Photographer | null, extraId?: string): Thread[] => {
  if (!user || user.role === 'admin') return [];
  const isPro = user.role === 'photographer';
  const mine = isPro ? pro?.id : user.id;
  if (!mine) return [];
  const ids = new Set<string>();
  db.messages.forEach((m) => ids.add(m.threadId));
  if (extraId) ids.add(extraId);
  return [...ids]
    .filter((t) => {
      const [c, p] = t.split('__');
      return isPro ? p === mine : c === mine;
    })
    .map((t) => {
      const [c, p] = t.split('__');
      const msgs = db.messages.filter((m) => m.threadId === t);
      const last = msgs.reduce<Message | undefined>((a, m) => (!a || m.at > a.at ? m : a), undefined);
      const readAt = db.reads[`${user.id}|${t}`] ?? 0;
      const otherUserId = isPro ? c : db.photographers.find((x) => x.id === p)?.userId ?? '';
      const otherReadAt = db.reads[`${otherUserId}|${t}`] ?? 0;
      return {
        id: t,
        name: isPro ? db.users.find((u) => u.id === c)?.name ?? 'Client' : db.photographers.find((x) => x.id === p)?.business ?? 'Photographer',
        proId: isPro ? undefined : p,
        other: otherUserId,
        last,
        unread: !!last && last.fromUserId !== user.id && last.at > readAt,
        seen: !!last && last.fromUserId === user.id && otherReadAt >= last.at,
      };
    })
    .filter((t) => t.last || t.id === extraId)
    .sort((a, b) => (b.last?.at ?? Infinity) - (a.last?.at ?? Infinity));
};

/** Link helpers: inside the logged-in app, explore/profile pages live under /app so the sidebar stays visible. */
export function useBase() {
  const inApp = useLocation().pathname.startsWith('/app');
  return {
    inApp,
    explore: inApp ? '/app/explore' : '/photographers',
    pro: (id: string) => (inApp ? `/app/p/${id}` : `/photographers/${id}`),
    book: (id: string, qs = '') => (inApp ? `/app/p/${id}/book${qs}` : `/photographers/${id}/book${qs}`),
  };
}
