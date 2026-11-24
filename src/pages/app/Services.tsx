import { useState } from 'react';
import { Briefcase, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, EmptyState, Field, Modal, PageHeader, useToast } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { money, uid } from '../../lib/utils';
import type { PaymentMode, Service } from '../../data/types';
import { payLabel } from '../PhotographerProfile';

const blank = (): Service => ({ id: uid('s'), name: '', description: '', price: 250, durationHrs: 1, paymentMode: 'upfront', depositPct: 30 });

export default function Services() {
  const { pro, saveService, deleteService } = useStore();
  const toast = useToast();
  const [edit, setEdit] = useState<Service | null>(null);
  if (!pro) return null;

  const valid = edit && edit.name.trim().length > 2 && edit.price > 0 && edit.durationHrs > 0;

  return (
    <>
      <PageHeader title="Services & pricing" sub="Set your prices and choose when clients pay." action={<button className="btn btn-primary" onClick={() => setEdit(blank())}><Plus size={16} /> Add service</button>} />
      {pro.services.length === 0 ? (
        <EmptyState icon={<Briefcase />} title="No services yet" text="Add your first service so clients can book you." action={<button className="btn btn-primary" onClick={() => setEdit(blank())}>Add a service</button>} />
      ) : (
        <div className="space-y-3">
          {pro.services.map((s) => (
            <div key={s.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-extrabold">{s.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.description}</p>
                <div className="mt-3 flex flex-wrap gap-2"><Badge><Clock size={12} /> {s.durationHrs} hr</Badge><Badge tone="purple">{payLabel(s.paymentMode, s.depositPct)}</Badge></div>
              </div>
              <p className="text-2xl font-extrabold">{money(s.price)}</p>
              <div className="flex gap-1">
                <button className="btn btn-outline !p-2.5" aria-label={`Edit ${s.name}`} onClick={() => setEdit(s)}><Pencil size={16} /></button>
                <button className="btn btn-ghost !p-2.5 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${s.name}`} onClick={() => { if (confirm(`Delete "${s.name}"?`)) { deleteService(s.id); toast('Service deleted.', 'info'); } }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit && pro.services.some((s) => s.id === edit.id) ? 'Edit service' : 'New service'}>
        {edit && (
          <div className="space-y-4">
            <Field label="Name"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Family Portrait Session" /></Field>
            <Field label="Description"><textarea className="input min-h-20" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} placeholder="What's included?" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (USD)"><input type="number" min={1} className="input" value={edit.price} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></Field>
              <Field label="Duration (hours)"><input type="number" min={1} max={12} className="input" value={edit.durationHrs} onChange={(e) => setEdit({ ...edit, durationHrs: Math.max(1, Math.round(Number(e.target.value))) })} /></Field>
            </div>
            <Field label="When does the client pay?">
              <select className="input" value={edit.paymentMode} onChange={(e) => setEdit({ ...edit, paymentMode: e.target.value as PaymentMode })}>
                <option value="upfront">Before the shoot (in full)</option>
                <option value="after">After the shoot</option>
                <option value="deposit">Deposit now, rest after</option>
              </select>
            </Field>
            {edit.paymentMode === 'deposit' && (
              <Field label={`Deposit: ${edit.depositPct}% (${money(Math.round(edit.price * edit.depositPct / 100))})`}>
                <input type="range" min={10} max={90} step={5} className="w-full accent-brand-600" value={edit.depositPct} onChange={(e) => setEdit({ ...edit, depositPct: Number(e.target.value) })} />
              </Field>
            )}
            <div className="flex justify-end gap-2"><button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" disabled={!valid} onClick={() => { saveService(edit); setEdit(null); toast('Service saved.'); }}>Save service</button></div>
          </div>
        )}
      </Modal>
    </>
  );
}
