import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Check, ExternalLink, UserRoundCheck, X } from 'lucide-react';
import { Avatar, Badge, EmptyState, PageHeader, Tabs, VettedBadge, useToast } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { cn, fmtDate } from '../../lib/utils';
import type { ProStatus } from '../../data/types';

export function Applications() {
  const { db, setProStatus } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<ProStatus>('pending');
  const list = db.photographers.filter((p) => p.status === tab);
  return (
    <>
      <PageHeader title="Photographer applications" sub="Vet new photographers and grant the Stamp of Approval." />
      <Tabs value={tab} onChange={setTab} tabs={(['pending', 'approved', 'rejected'] as const).map((s) => ({ id: s, label: s[0].toUpperCase() + s.slice(1), count: db.photographers.filter((p) => p.status === s).length }))} />
      <div className="mt-5 space-y-3">
        {list.length === 0 && <EmptyState icon={<UserRoundCheck />} title="Nothing here" text="No applications in this state." />}
        {list.map((p) => {
          const u = db.users.find((x) => x.id === p.userId);
          return (
            <div key={p.id} className="card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={p.name} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-extrabold">{p.business}</p>
                  <p className="text-sm text-slate-500">{p.name} · {p.city}, {p.state} · applied {fmtDate(p.joined)}</p>
                  <p className="mt-2 text-sm text-slate-600">{p.bio || 'No bio provided yet.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.niches.map((n) => <Badge key={n} tone="blue">{n}</Badge>)}
                    <Badge tone={u?.idStatus === 'verified' ? 'green' : 'amber'}>ID: {u?.idStatus}</Badge>
                    <Badge tone={p.portfolio.length >= 3 ? 'green' : 'amber'}>{p.portfolio.length} portfolio photos</Badge>
                    <Badge tone={p.services.length ? 'green' : 'amber'}>{p.services.length} services</Badge>
                  </div>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Link to={`/photographers/${p.id}`} className="btn btn-outline flex-1 sm:flex-none"><ExternalLink size={15} /> Preview</Link>
                  {p.status !== 'approved' && <button className="btn btn-primary flex-1 sm:flex-none" onClick={() => { setProStatus(p.id, 'approved'); toast(`${p.business} approved.`); }}><Check size={15} /> Approve</button>}
                  {p.status === 'pending' && <button className="btn btn-outline flex-1 text-rose-600 sm:flex-none" onClick={() => { setProStatus(p.id, 'rejected'); toast('Application rejected.', 'info'); }}><X size={15} /> Reject</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function AdminPhotographers() {
  const { db, toggleVetted, setProStatus } = useStore();
  const toast = useToast();
  return (
    <>
      <PageHeader title="Photographers" sub="Manage badges and visibility." />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Photographer</th><th>City</th><th>Status</th><th>Badge</th><th className="px-5 text-right">Actions</th></tr></thead>
          <tbody>
            {db.photographers.map((p) => (
              <tr key={p.id} className="border-t border-slate-50">
                <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar name={p.name} size={34} /><div><p className="font-bold">{p.business}</p><p className="text-xs text-slate-500">{p.name}</p></div></div></td>
                <td>{p.city}</td>
                <td><Badge tone={p.status === 'approved' ? 'green' : p.status === 'pending' ? 'amber' : 'red'} className="capitalize">{p.status}</Badge></td>
                <td>{p.vetted ? <VettedBadge /> : <span className="text-slate-400">None</span>}</td>
                <td className="px-5 text-right">
                  <button className={cn('btn btn-ghost !py-1.5')} onClick={() => { toggleVetted(p.id); toast(p.vetted ? 'Badge removed.' : 'Badge granted.', 'info'); }}><BadgeCheck size={15} /> {p.vetted ? 'Revoke badge' : 'Grant badge'}</button>
                  {p.status === 'approved' && <button className="btn btn-ghost !py-1.5 text-rose-600" onClick={() => { setProStatus(p.id, 'rejected'); toast('Photographer suspended.', 'info'); }}>Suspend</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
