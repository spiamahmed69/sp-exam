import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/api.js';
import BackendBanner from '../../components/BackendBanner.jsx';
import { Badge, Card, EmptyState, ErrorState, Spinner } from '../../components/ui.jsx';

export default function ResultsPage() {
  const [state, setState] = useState('loading');
  const [results, setResults] = useState([]);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);
  useEffect(() => {
    api.get('/results')
      .then((d) => { setResults(d.results || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">My Results</h1>
      <p className="mt-1 text-sm text-slate-600">Scores and correct answers appear only after your teacher publishes the result.</p></div>
      <BackendBanner />
      {state === 'loading' && <Spinner label="Loading results…" />}
      {state === 'error' && <ErrorState title="Could not load results" body={err} onRetry={() => window.location.reload()} />}
      {state === 'ok' && results.length === 0 && (
        <EmptyState title="No results yet" body="Complete an exam first. Your result will appear here once your teacher publishes it." action={<Link to="/exams" className="inline-flex min-h-[44px] items-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white">Browse exams</Link>} />
      )}
      {state === 'ok' && results.length > 0 && (
        <div className="space-y-4">
          {results.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900">{r.exam_title}</h2>
                {r.published ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Waiting for publication</Badge>}
              </div>
              {r.published ? (
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                  <div className="rounded-xl bg-blue-50 px-3 py-2"><p className="text-xl font-bold tabular-nums text-blue-800">{r.score} / {r.total_marks}</p><p className="text-slate-600">Score</p></div>
                  <div className="rounded-xl bg-green-50 px-3 py-2"><p className="text-xl font-bold text-green-800">{r.correct}</p><p className="text-slate-600">Correct</p></div>
                  <div className="rounded-xl bg-red-50 px-3 py-2"><p className="text-xl font-bold text-red-800">{r.wrong}</p><p className="text-slate-600">Wrong</p></div>
                  <div className="rounded-xl bg-slate-100 px-3 py-2"><p className="text-xl font-bold text-slate-800">{r.blank}</p><p className="text-slate-600">Blank</p></div>
                  <div className="rounded-xl bg-slate-100 px-3 py-2"><p className="text-xl font-bold text-slate-800">{r.cq_pending ? 'CQ pending' : (r.cq_score ?? '—')}</p><p className="text-slate-600">CQ marks</p></div>
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><EyeOff size={16} /> Your score is hidden until the teacher publishes this result.</p>
              )}
              {r.published && r.detail && (
                <div className="mt-3">
                  <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50">
                    <Eye size={16} /> {open === r.id ? 'Hide question review' : 'Show question review'}
                  </button>
                  {open === r.id && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {Object.entries(r.detail).map(([qid, d]) => (
                        <li key={qid} className="flex justify-between gap-2 border-b border-slate-100 pb-1">
                          <span className="text-slate-700">{qid}</span>
                          <span className={d.type === 'cq' ? 'font-semibold text-amber-700' : d.blank ? 'text-slate-500' : d.correct ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
                            {d.type === 'cq' ? `CQ — ${d.cq_marks ?? 'not marked yet'} / ${d.marks}` : d.blank ? 'Blank' : d.correct ? 'Correct' : 'Wrong'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <p className="mt-3 text-xs text-slate-500">Submitted {r.created_at ? new Date(r.created_at).toLocaleString() : ''}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
