import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Field, PageHeader, Photo, useToast } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { CITIES, NICHES } from '../../data/types';
import { cn, uid } from '../../lib/utils';
import { shrink } from '../../lib/image';

const MAX_PHOTOS = 12;

export default function ProfileEdit() {
  const { pro, updatePro } = useStore();
  const toast = useToast();
  const [f, setF] = useState(() => pro && { business: pro.business, tagline: pro.tagline, bio: pro.bio, city: pro.city, niches: pro.niches });
  if (!pro || !f) return null;

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    const room = MAX_PHOTOS - pro.portfolio.length;
    if (room <= 0) return toast(`You can have up to ${MAX_PHOTOS} photos.`, 'error');
    const added: string[] = [];
    for (const f of files.slice(0, room)) {
      if (!f.type.startsWith('image/')) continue;
      if (f.size > 15 * 1024 * 1024) { toast(`${f.name} is larger than 15 MB.`, 'error'); continue; }
      try { added.push(await shrink(f)); } catch { toast(`Could not read ${f.name}.`, 'error'); }
    }
    if (added.length) { updatePro({ portfolio: [...pro.portfolio, ...added] }); toast(`${added.length} photo${added.length > 1 ? 's' : ''} uploaded.`); }
  };
  const toggle = (n: string) => setF({ ...f, niches: f.niches.includes(n) ? f.niches.filter((x) => x !== n) : [...f.niches, n] });
  const save = () => {
    if (f.business.trim().length < 2) return toast('Please enter a business name.', 'error');
    if (f.niches.length === 0) return toast('Choose at least one niche.', 'error');
    updatePro({ ...f, business: f.business.trim() });
    toast('Profile saved.');
  };

  return (
    <>
      <PageHeader title="My profile" sub="This is what clients see on your public page." action={pro.status === 'approved' && <Link to={`/app/p/${pro.id}`} className="btn btn-outline">Preview</Link>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5 sm:p-6">
          <Field label="Business name"><input className="input" value={f.business} onChange={(e) => setF({ ...f, business: e.target.value })} /></Field>
          <Field label="Tagline"><input className="input" maxLength={90} value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} placeholder="One line that sells you" /></Field>
          <Field label="Business description"><textarea className="input min-h-36" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Tell clients about your style and experience…" /></Field>
          <Field label="City"><select className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <div>
            <p className="mb-2 text-sm font-bold text-slate-700">Niches</p>
            <div className="flex flex-wrap gap-2">{NICHES.map((n) => <button key={n} type="button" aria-pressed={f.niches.includes(n)} onClick={() => toggle(n)} className={cn('rounded-full border px-3 py-1.5 text-xs font-bold', f.niches.includes(n) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white')}>{n}</button>)}</div>
          </div>
          <button className="btn btn-primary" onClick={save}>Save profile</button>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Portfolio</h2><div className="flex gap-2"><label className="btn btn-primary cursor-pointer"><Upload size={16} /> Upload photos<input type="file" accept="image/*" multiple className="sr-only" onChange={onFiles} /></label><button className="btn btn-outline" onClick={() => { updatePro({ portfolio: [...pro.portfolio, `${pro.id}-new-${uid('')}`] }); toast('Sample photo added.', 'info'); }}><Plus size={16} /> Sample</button></div></div>
          <p className="-mt-2 mb-3 text-xs text-slate-500">{pro.portfolio.length}/{MAX_PHOTOS} photos. Images are resized in your browser. JPG, PNG or WebP.</p>
          {pro.portfolio.length === 0 ? <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Add at least 3 photos to show off your work.</p> : (
            <div className="grid grid-cols-3 gap-2">
              {pro.portfolio.map((s, i) => (
                <div key={s} className="group relative aspect-square overflow-hidden rounded-xl">
                  <Photo seed={s} w={300} h={300} className="h-full w-full" />
                  <button aria-label={`Remove photo ${i + 1}`} onClick={() => updatePro({ portfolio: pro.portfolio.filter((x) => x !== s) })} className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
