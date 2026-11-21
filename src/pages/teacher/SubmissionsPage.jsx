import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Badge, Button, Card, EmptyState, ErrorState, Spinner, useToast } from '../../components/ui.jsx';

export default function SubmissionsPage() {
  const [state, setState] = useState('loading');
  const [results, setResults] = useState([]);
  const [err, setErr] = useState('');
  const { success, error: toastError } = useToast();
  function load() {
    setState('loading');
    api.get('/results').then((d) => { setResults(d.results || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }
  useEffect(load, []);
  async function publish(r) {
    try { await api.post(`/results/${r.id}/publish`, {}); success('Result published — the student can now see it.'); load(); }
    catch (e) { toastError(e.message); }
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Student Submissions</h1>
      <p className="mt-1 text-sm text-slate-600">Every submission on your exams. Publish a result only when marking is finished.</p></div>
      {state === 'loading' && <Spinner label="Loading submissions…" />}
      {state === 'error' && <ErrorState title="Could not load submissions" body={err} onRetry={load} />}
      {state === 'ok' && results.length === 0 && <EmptyState title="No submissions yet" body="Students have not submitted any of your exams yet." />}
      {state === 'ok' && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">{r.exam_title} — {r.student_name}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {r.published ? `Score: ${r.score} / ${r.total_marks} · Correct ${r.correct} · Wrong ${r.wrong} · Blank ${r.blank}` : 'Score hidden until published'}
                    {r.cq_pending ? ' · CQ answers waiting for marking' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.published ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Unpublished</Badge>}
                  {r.cq_pending && <Link to={`/teacher/evaluate/${r.id}`}><Button variant="outline">Mark CQ</Button></Link>}
                  {!r.published && <Button onClick={() => publish(r)}>Publish result</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
