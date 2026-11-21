import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Badge, Button, Card, EmptyState, ErrorState, Spinner, useToast } from '../../components/ui.jsx';

export default function TeacherResults() {
  const [state, setState] = useState('loading');
  const [results, setResults] = useState([]);
  const [err, setErr] = useState('');
  const { success, error: toastError } = useToast();
  function load() {
    api.get('/results').then((d) => { setResults(d.results || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }
  useEffect(load, []);
  async function toggle(r) {
    try { await api.post(`/results/${r.id}/${r.published ? 'unpublish' : 'publish'}`, {}); success(r.published ? 'Result unpublished.' : 'Result published.'); load(); }
    catch (e) { toastError(e.message); }
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Results Management</h1>
      <p className="mt-1 text-sm text-slate-600">Publish or unpublish results on your exams.</p></div>
      {state === 'loading' && <Spinner label="Loading results…" />}
      {state === 'error' && <ErrorState title="Could not load results" body={err} onRetry={load} />}
      {state === 'ok' && results.length === 0 && <EmptyState title="No results yet" body="Results appear here once students submit your exams." />}
      {state === 'ok' && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">{r.exam_title} — {r.student_name}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{r.published ? `Score: ${r.score} / ${r.total_marks} · Correct ${r.correct} · Wrong ${r.wrong} · Blank ${r.blank}` : 'Score hidden until published'}{r.cq_pending ? ' · CQ pending' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.published ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Unpublished</Badge>}
                  <Button variant="outline" onClick={() => toggle(r)}>{r.published ? 'Unpublish' : 'Publish'}</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
