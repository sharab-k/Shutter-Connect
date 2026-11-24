import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Heart, ImagePlus, Info, Search, Send, Smile, SquarePen, X } from 'lucide-react';
import { StoryAvatar } from '../../components/social';
import { Avatar, Modal, useToast } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { threadsFor } from '../../lib/social';
import { shrink } from '../../lib/image';
import { cn, timeAgo } from '../../lib/utils';
import type { Message } from '../../data/types';

const QUICK = ['❤️', '😂', '😮', '😢', '👍', '🔥'];
const EMOJI = ['😀', '😍', '🥹', '😂', '😉', '🙌', '👏', '🙏', '👍', '🔥', '✨', '📸', '🎉', '💙', '❤️', '😎'];

const stamp = (t: number) => {
  const d = new Date(t);
  const today = new Date();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Today ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
};

export default function Messages() {
  const { threadId } = useParams();
  const { db, user, pro, send, react, markThreadRead } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [emoji, setEmoji] = useState(false);
  const [picker, setPicker] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const isPro = user!.role === 'photographer';
  const mineId = isPro ? pro?.id : user!.id;
  const threads = useMemo(() => threadsFor(db, user, pro, threadId), [db, user, pro, threadId]);
  const active = threads.find((t) => t.id === threadId);
  const allowed = !!threadId && (isPro ? threadId.endsWith(`__${mineId}`) : threadId.startsWith(`${mineId}__`));
  const msgs = db.messages.filter((m) => m.threadId === threadId).sort((a, b) => a.at - b.at);
  const [clientId, proId] = (threadId ?? '').split('__');
  const booking = db.bookings.filter((b) => b.clientId === clientId && b.photographerId === proId).sort((a, b) => b.createdAt - a.createdAt)[0];
  const lastMine = [...msgs].reverse().find((m) => m.fromUserId === user!.id);
  const filtered = threads.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
  const unreadTotal = threads.filter((t) => t.unread).length;

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, threadId]);
  useEffect(() => { if (threadId && allowed) markThreadRead(threadId); }, [threadId, allowed, msgs.length, markThreadRead]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!threadId) return;
    if (!text.trim()) return send(threadId, '❤️');
    send(threadId, text);
    setText('');
    setEmoji(false);
  };
  const attach = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !threadId) return;
    if (!f.type.startsWith('image/')) return toast('Please choose an image.', 'error');
    try { send(threadId, '', await shrink(f, 900, 0.8)); } catch { toast('Could not read that image.', 'error'); }
  };

  const inChat = !!threadId;
  const nameOf = (m: Message) => (m.fromUserId === user!.id ? 'You' : db.users.find((u) => u.id === m.fromUserId)?.name ?? '');

  return (
    <div className={cn('flex w-full overflow-hidden bg-white md:border-l md:border-line', inChat ? 'h-dvh' : 'h-[calc(100dvh-7rem)] md:h-dvh')}>
      {/* Inbox */}
      <aside className={cn('w-full shrink-0 flex-col border-r border-line md:flex md:w-[340px] xl:w-[397px]', inChat ? 'hidden' : 'flex')} aria-label="Conversations">
        <header className="flex items-center justify-between px-5 pb-2 pt-5">
          <h1 className="text-xl font-bold">{user!.name.split(' ')[0].toLowerCase()}<span className="text-slate-400">{unreadTotal ? ` · ${unreadTotal} new` : ''}</span></h1>
          <button className="icon-btn" aria-label="New message" onClick={() => setNewMsg(true)}><SquarePen size={22} /></button>
        </header>
        <div className="px-4 pb-2"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search conversations" className="input !min-h-[40px] !bg-slate-100 !pl-9" /></div></div>
        <p className="px-5 pb-1 pt-2 text-sm font-bold">Messages</p>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <li className="px-6 py-14 text-center text-sm text-slate-500"><Send className="mx-auto mb-3 text-slate-300" size={40} strokeWidth={1.3} /><p className="font-semibold text-ink">Your messages</p><p className="mt-1">Send a message to a photographer to plan your shoot.</p><button className="btn btn-primary mt-4" onClick={() => setNewMsg(true)}>Send message</button></li>
          )}
          {filtered.map((t) => (
            <li key={t.id}>
              <Link to={`/app/messages/${t.id}`} className={cn('flex items-center gap-3 px-5 py-2.5 transition hover:bg-slate-50', t.id === threadId && 'bg-slate-100')}>
                <Avatar name={t.name} size={56} />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className={cn('truncate text-[15px]', t.unread ? 'font-bold' : 'font-medium')}>{t.name}</p>
                  <p className={cn('truncate text-sm', t.unread ? 'font-semibold text-ink' : 'text-slate-500')}>{t.last ? `${t.last.fromUserId === user!.id ? 'You: ' : ''}${t.last.image && !t.last.text ? 'Sent a photo' : t.last.text}` : 'Start the conversation'}{t.last ? ` · ${timeAgo(t.last.at)}` : ''}</p>
                </div>
                {t.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat */}
      <section className={cn('min-w-0 flex-1 flex-col md:flex', inChat ? 'flex' : 'hidden')}>
        {!threadId || !allowed || !active ? (
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div><span className="mx-auto grid h-24 w-24 place-items-center rounded-full border-2 border-ink"><Send size={44} strokeWidth={1.3} /></span><h2 className="mt-4 text-xl">Your messages</h2><p className="mt-1 text-sm text-slate-500">Send private messages to plan your shoot.</p><button className="btn btn-primary mt-4" onClick={() => setNewMsg(true)}>Send message</button></div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-line px-3 py-3 sm:px-5">
              <button className="icon-btn md:hidden" aria-label="Back to conversations" onClick={() => nav('/app/messages')}><ArrowLeft size={24} /></button>
              <Avatar name={active.name} size={44} />
              <div className="min-w-0 flex-1 leading-tight"><p className="truncate font-bold">{active.name}</p><p className="truncate text-xs text-slate-500">{isPro ? 'Client' : 'Photographer'}</p></div>
              {active.proId && <Link to={`/app/p/${active.proId}`} className="icon-btn" aria-label="View profile"><Info size={24} /></Link>}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
              <div className="mb-6 flex flex-col items-center text-center">
                <Avatar name={active.name} size={84} />
                <p className="mt-2 text-lg font-bold">{active.name}</p>
                {active.proId && <Link to={`/app/p/${active.proId}`} className="btn btn-outline mt-2 !min-h-[36px]">View profile</Link>}
              </div>
              {booking && (
                <Link to={`/app/bookings/${booking.id}`} className="mx-auto mb-5 flex max-w-sm items-center gap-3 rounded-xl border border-line p-3 text-sm hover:bg-slate-50">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><CalendarCheck size={20} /></span>
                  <span className="min-w-0 flex-1"><b className="block truncate">{booking.serviceName}</b><span className="text-xs capitalize text-slate-500">{booking.status} · {booking.date}</span></span>
                </Link>
              )}

              {msgs.map((m, i) => {
                const mine = m.fromUserId === user!.id;
                const prev = msgs[i - 1];
                const nextM = msgs[i + 1];
                const gap = !prev || m.at - prev.at > 3600000;
                const firstOfRun = !prev || prev.fromUserId !== m.fromUserId || gap;
                const lastOfRun = !nextM || nextM.fromUserId !== m.fromUserId || nextM.at - m.at > 3600000;
                const rs = Object.values(m.reactions ?? {});
                const big = !m.image && /^(\p{Extended_Pictographic}|‍|️){1,3}$/u.test(m.text);
                return (
                  <div key={m.id}>
                    {gap && <p className="my-4 text-center text-xs font-medium text-slate-400">{stamp(m.at)}</p>}
                    <div className={cn('group flex items-end gap-2', mine ? 'flex-row-reverse' : '', firstOfRun ? 'mt-3' : 'mt-0.5')}>
                      <span className="w-7 shrink-0">{!mine && lastOfRun && <Avatar name={active.name} size={28} />}</span>
                      <div className={cn('relative max-w-[72%]', rs.length > 0 && 'mb-3')}>
                        {m.image && <img src={m.image} alt={`Photo from ${nameOf(m)}`} className="max-h-72 w-auto rounded-2xl object-cover" onDoubleClick={() => react(m.id, '❤️')} />}
                        {m.text && (
                          <p
                            onDoubleClick={() => react(m.id, '❤️')}
                            className={cn('whitespace-pre-wrap break-words', big ? 'text-5xl leading-tight' : cn('rounded-[22px] px-4 py-2 text-[15px]', mine ? 'bg-bubble text-white' : 'bg-slate-100', m.image && 'mt-1'))}
                          >{m.text}</p>
                        )}
                        {rs.length > 0 && <span className={cn('absolute -bottom-3.5 flex rounded-full border border-white bg-slate-100 px-1.5 py-0.5 text-xs shadow-sm', mine ? 'right-2' : 'left-2')}>{[...new Set(rs)].join('')}{rs.length > 1 ? <span className="ml-0.5 text-slate-500">{rs.length}</span> : null}</span>}
                        <div className={cn('absolute top-1/2 hidden -translate-y-1/2 items-center group-hover:flex group-focus-within:flex', mine ? 'right-full mr-1' : 'left-full ml-1')}>
                          <button className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100" aria-label="React to message" onClick={() => setPicker(picker === m.id ? null : m.id)}><Smile size={18} /></button>
                        </div>
                        {picker === m.id && (
                          <div className={cn('pop absolute z-10 -top-11 flex gap-1 rounded-full border border-line bg-white px-2 py-1 shadow-lift', mine ? 'right-0' : 'left-0')}>
                            {QUICK.map((e) => <button key={e} className="grid h-8 w-8 place-items-center rounded-full text-lg transition hover:scale-125" aria-label={`React ${e}`} onClick={() => { react(m.id, e); setPicker(null); }}>{e}</button>)}
                          </div>
                        )}
                      </div>
                    </div>
                    {m.id === lastMine?.id && <p className="mt-1 pr-10 text-right text-xs text-slate-400">{active.seen ? 'Seen' : 'Sent'}</p>}
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="relative px-3 pb-3 pt-1 sm:px-5 sm:pb-5">
              {emoji && (
                <div className="pop absolute bottom-full left-4 z-10 mb-1 grid grid-cols-8 gap-1 rounded-2xl border border-line bg-white p-2 shadow-lift sm:left-6">
                  {EMOJI.map((e) => <button key={e} type="button" className="grid h-9 w-9 place-items-center rounded-lg text-xl hover:bg-slate-100" aria-label={`Insert ${e}`} onClick={() => setText((t) => t + e)}>{e}</button>)}
                </div>
              )}
              <form onSubmit={submit} className="flex items-center gap-1 rounded-full border border-line px-2 py-1">
                <button type="button" className="icon-btn !h-10 !w-10" aria-label="Emoji" aria-expanded={emoji} onClick={() => setEmoji(!emoji)}><Smile size={24} /></button>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" aria-label="Message" className="min-h-[40px] min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate-400" />
                {text.trim() ? (
                  <button className="px-3 text-sm font-bold text-brand-600">Send</button>
                ) : (
                  <>
                    <label className="icon-btn !h-10 !w-10 cursor-pointer" aria-label="Send a photo"><ImagePlus size={24} /><input type="file" accept="image/*" className="sr-only" onChange={attach} /></label>
                    <button className="icon-btn !h-10 !w-10" aria-label="Send a heart"><Heart size={24} /></button>
                  </>
                )}
              </form>
            </div>
          </>
        )}
      </section>

      <NewMessage open={newMsg} onClose={() => setNewMsg(false)} />
    </div>
  );
}

function NewMessage({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, user, pro } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  if (!user) return null;
  const isPro = user.role === 'photographer';
  const people = isPro
    ? [...new Map(db.bookings.filter((b) => b.photographerId === pro?.id).map((b) => [b.clientId, { id: b.clientId, name: b.clientName, thread: `${b.clientId}__${pro!.id}`, sub: 'Client' }])).values()]
    : db.photographers.filter((p) => p.status === 'approved' && p.subscriptionActive).map((p) => ({ id: p.id, name: p.business, thread: `${user.id}__${p.id}`, sub: `${p.name} · ${p.city}` }));
  const list = people.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title="New message">
      <div className="relative mb-3"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search people" className="input !pl-9" />{q && <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400" aria-label="Clear" onClick={() => setQ('')}><X size={16} /></button>}</div>
      <ul className="max-h-72 overflow-y-auto">
        {list.length === 0 && <li className="py-8 text-center text-sm text-slate-500">{isPro ? 'Clients who book you will appear here.' : 'No matches.'}</li>}
        {list.map((p) => (
          <li key={p.id}><button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50" onClick={() => { onClose(); nav(`/app/messages/${p.thread}`); }}><StoryAvatar name={p.name} size={44} /><span className="min-w-0"><b className="block truncate text-sm">{p.name}</b><span className="block truncate text-xs text-slate-500">{p.sub}</span></span></button></li>
        ))}
      </ul>
    </Modal>
  );
}
