import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fmtDate, fmtTime, todayISO } from '../../lib/utils';
import { Bell, BadgeCheck, CheckCircle2, CreditCard, FolderDown, Loader2, LogOut, RotateCcw, ShieldCheck, UserCheck } from 'lucide-react';
import { Badge, Field, Modal, PageHeader, Stars, Toggle, useToast } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { SUBSCRIPTION_PRICE } from '../../data/types';

export default function Settings() {
  const { user, pro, updateUser, updatePro, verifyId, logout, resetDemo, clientRating, db } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(user!.name);
  const [email, setEmail] = useState(user!.email);
  const [stripeOpen, setStripeOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [idOpen, setIdOpen] = useState(false);
  const cr = clientRating(user!.id);
  const reminders = db.bookings
    .filter((b) => b.status === 'confirmed' && b.date > todayISO() && (user!.role === 'client' ? b.clientId === user!.id : b.photographerId === pro?.id))
    .sort((a, b) => a.date.localeCompare(b.date));
  const myReviews = db.reviews.filter((r) => r.toId === user!.id && r.fromRole === 'photographer');

  const save = () => {
    if (name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return toast('Please enter a valid name and email.', 'error');
    updateUser({ name: name.trim(), email: email.trim() });
    toast('Settings saved.');
  };

  return (
    <>
      <PageHeader title="Settings" sub="Account, verification and integrations." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Profile</h2>
          <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email"><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3.5">
            <div><p className="text-sm font-extrabold">Email reminders</p><p className="text-xs text-slate-500">Get automatic reminders before upcoming bookings.</p></div>
            <Toggle checked={user!.emailReminders} onChange={(v) => updateUser({ emailReminders: v })} label="Email reminders" />
          </div>
          <button className="btn btn-primary" onClick={save}>Save changes</button>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Identity verification</h2>
          <p className="mt-1 text-sm text-slate-500">Powered by Didit. Verified accounts build trust on both sides of every booking.</p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            {user!.idStatus === 'verified' ? <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-600"><CheckCircle2 /></span> : user!.idStatus === 'pending' ? <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-600"><Loader2 className="animate-spin" /></span> : <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-600"><UserCheck /></span>}
            <div className="flex-1"><p className="font-extrabold capitalize">{user!.idStatus === 'unverified' ? 'Not verified' : user!.idStatus === 'pending' ? 'Verification in progress' : 'ID verified'}</p><p className="text-xs text-slate-500">Government ID + selfie check, takes about 2 minutes.</p></div>
            {user!.idStatus === 'unverified' && <button className="btn btn-primary" onClick={() => setIdOpen(true)}>Verify</button>}
            {user!.idStatus === 'verified' && <Badge tone="green"><BadgeCheck size={13} /> Verified</Badge>}
          </div>
          {user!.role === 'client' && (
            <div className="mt-5">
              <p className="text-sm font-extrabold">Your reputation</p>
              {cr.count ? <p className="mt-1 flex items-center gap-2 text-sm"><Stars value={cr.avg} /> <b>{cr.avg.toFixed(1)}</b> from {cr.count} photographer review{cr.count > 1 && 's'}</p> : <p className="mt-1 text-sm text-slate-500">Photographers can review you after completed bookings.</p>}
              {myReviews.map((r) => <p key={r.id} className="mt-2 rounded-xl bg-slate-50 p-3 text-sm">“{r.text}” <span className="text-xs text-slate-500">— {r.fromName}</span></p>)}
            </div>
          )}
        </section>

        <section className="card p-5 sm:p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><Bell size={18} /> Scheduled email reminders</h2>
          <p className="mt-1 text-sm text-slate-500">{user!.emailReminders ? `Reminders go to ${user!.email} 24 hours and 2 hours before each confirmed session.` : 'Email reminders are turned off.'}</p>
          {user!.emailReminders && (reminders.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">No upcoming confirmed bookings.</p> : (
            <ul className="mt-4 divide-y divide-slate-100 text-sm">
              {reminders.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <Link to={`/app/bookings/${b.id}`} className="font-bold text-brand-700">{b.serviceName}</Link>
                  <span className="text-slate-500">Session {fmtDate(b.date)}, {fmtTime(b.time)} · reminders queued</span>
                </li>
              ))}
            </ul>
          ))}
        </section>

        {pro && (
          <section className="card p-5 sm:p-6 lg:col-span-2">
            <h2 className="text-lg font-extrabold">Integrations & membership</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Integration icon={<CreditCard />} title="Stripe Connect" text="Receive payments and payouts. 2.25% platform fee applies." on={pro.stripeConnected} onConnect={() => setStripeOpen(true)} onDisconnect={() => updatePro({ stripeConnected: false })} />
              <Integration icon={<FolderDown />} title="Dropbox" text="Deliver photo galleries to clients without paying for storage." on={pro.dropboxConnected} onConnect={() => setDropOpen(true)} onDisconnect={() => updatePro({ dropboxConnected: false })} />
              <div className="rounded-2xl border border-slate-100 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-plum-500"><ShieldCheck size={20} /></span>
                <p className="mt-3 font-extrabold">Annual membership</p>
                <p className="mt-1 text-sm text-slate-500">${SUBSCRIPTION_PRICE}/year via Stripe Billing.</p>
                {pro.subscriptionActive ? <Badge tone="green" className="mt-3">Active</Badge> : <button className="btn btn-cta mt-3 w-full" onClick={() => { updatePro({ subscriptionActive: true }); toast('Membership activated (demo).'); }}>Subscribe ${SUBSCRIPTION_PRICE}/yr</button>}
              </div>
            </div>
          </section>
        )}

        <section className="card flex flex-wrap items-center gap-3 p-5 sm:p-6 lg:col-span-2">
          <button className="btn btn-outline" onClick={() => { logout(); nav('/'); }}><LogOut size={16} /> Log out</button>
          <button className="btn btn-ghost" onClick={() => { if (confirm('Reset all demo data?')) { resetDemo(); nav('/login'); } }}><RotateCcw size={16} /> Reset demo data</button>
          <Link to="/" className="ml-auto text-sm font-bold text-brand-600">Back to website</Link>
        </section>
      </div>

      <Modal open={stripeOpen} onClose={() => setStripeOpen(false)} title="Connect Stripe">
        <p className="text-sm text-slate-600">You will be redirected to Stripe to verify your business details and add a bank account for payouts. (Simulated in this demo.)</p>
        <button className="btn btn-primary mt-5 w-full" onClick={() => { updatePro({ stripeConnected: true }); setStripeOpen(false); toast('Stripe connected.'); }}>Continue to Stripe</button>
      </Modal>
      <Modal open={dropOpen} onClose={() => setDropOpen(false)} title="Connect Dropbox">
        <p className="text-sm text-slate-600">Allow Shutter Connect to create shared links for folders you choose. We never copy or store your files. (Simulated in this demo.)</p>
        <button className="btn btn-primary mt-5 w-full" onClick={() => { updatePro({ dropboxConnected: true }); setDropOpen(false); toast('Dropbox connected.'); }}>Authorize Dropbox</button>
      </Modal>
      <Modal open={idOpen} onClose={() => setIdOpen(false)} title="Verify your identity">
        <ol className="space-y-3 text-sm">
          {['Photograph your government ID', 'Take a quick selfie to confirm it is you', 'Results arrive in a couple of minutes'].map((s, i) => <li key={s} className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-xs font-extrabold text-white">{i + 1}</span>{s}</li>)}
        </ol>
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Demo mode: this simulates the hosted Didit flow and webhook result.</p>
        <button className="btn btn-primary mt-5 w-full" onClick={() => { verifyId(); setIdOpen(false); toast('Verification started…', 'info'); }}>Start verification</button>
      </Modal>
    </>
  );
}

function Integration({ icon, title, text, on, onConnect, onDisconnect }: { icon: ReactNode; title: string; text: string; on: boolean; onConnect: () => void; onDisconnect: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
      <p className="mt-3 font-extrabold">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
      {on ? <div className="mt-3 flex items-center justify-between"><Badge tone="green">Connected</Badge><button className="text-xs font-bold text-slate-500 hover:text-rose-600" onClick={onDisconnect}>Disconnect</button></div> : <button className="btn btn-primary mt-3 w-full" onClick={onConnect}>Connect</button>}
    </div>
  );
}
