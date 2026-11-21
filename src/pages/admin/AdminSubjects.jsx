import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button, Card, EmptyState, ErrorState, Input, Spinner, useToast } from '../../components/ui.jsx';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [state, setState] = useState('loading');
  const [err, setErr] = useState('');
  const [name, setName] = useState('');
  const { success, error: toastError } = useToast();
  function load() {
    api.get('/subjects').then((d) => { setSubjects(d.subjects || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }
  useEffect(load, []);
  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try { await api.post('/subjects', { name: name.trim() }); setName(''); success('Subject added.'); load(); }
    catch (ex) { toastError(ex.message); }
  }
  async function remove(s) {
    if (!window.confirm(`Delete subject “${s.name}”?`)) return;
    try { await api.del(`/subjects/${s.id}`); success('Subject deleted.'); load(); }
    catch (ex) { toastError(ex.message); }
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Subject Management</h1>
      <p className="mt-1 text-sm text-slate-600">Subjects teachers can attach exams to.</p></div>
      <Card>
        <form onSubmit={add} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1"><Input label="New subject name" id="sub-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chemistry" /></div>
          <Button type="submit"><Plus size={16} /> Add subject</Button>
        </form>
      </Card>
      {state === 'loading' && <Spinner label="Loading subjects…" />}
      {state === 'error' && <ErrorState title="Could not load subjects" body={err} onRetry={load} />}
      {state === 'ok' && subjects.length === 0 && <EmptyState title="No subjects yet" body="Add the first subject above." />}
      {state === 'ok' && subjects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-slate-900">{s.name}</p>
                <button type="button" onClick={() => remove(s)} aria-label={`Delete ${s.name}`} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-red-700 ring-1 ring-red-300 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
              {s.description && <p className="mt-1 text-sm text-slate-600">{s.description}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
