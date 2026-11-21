import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button, Card, EmptyState, ErrorState, Input, Spinner, Textarea, useToast } from '../../components/ui.jsx';

export default function AdminAnnouncements() {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState('loading');
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ title: '', body: '' });
  const { success, error: toastError } = useToast();
  function load() {
    api.get('/announcements').then((d) => { setRows(d.announcements || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }
  useEffect(load, []);
  async function add(e) {
    e.preventDefault();
    try { await api.post('/announcements', form); setForm({ title: '', body: '' }); success('Announcement published.'); load(); }
    catch (ex) { toastError(ex.message); }
  }
  async function remove(a) {
    if (!window.confirm('Delete this announcement?')) return;
    try { await api.del(`/announcements/${a.id}`); success('Announcement deleted.'); load(); }
    catch (ex) { toastError(ex.message); }
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
      <p className="mt-1 text-sm text-slate-600">Shown on student dashboards and the home page.</p></div>
      <Card>
        <form onSubmit={add} className="space-y-4">
          <Input label="Title" id="ann-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea label="Message" id="ann-body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          <Button type="submit"><Plus size={16} /> Publish announcement</Button>
        </form>
      </Card>
      {state === 'loading' && <Spinner label="Loading announcements…" />}
      {state === 'error' && <ErrorState title="Could not load announcements" body={err} onRetry={load} />}
      {state === 'ok' && rows.length === 0 && <EmptyState title="No announcements yet" body="Publish the first one above." />}
      {state === 'ok' && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-bold text-slate-900">{a.title}</p><p className="mt-1 text-sm text-slate-600">{a.body}</p>
                <p className="mt-2 text-xs text-slate-500">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</p></div>
                <button type="button" onClick={() => remove(a)} aria-label="Delete announcement" className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-red-700 ring-1 ring-red-300 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
