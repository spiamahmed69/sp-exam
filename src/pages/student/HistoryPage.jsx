import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { loadHistory } from '../../lib/store.js';
import BackendBanner from '../../components/BackendBanner.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../../components/ui.jsx';

export default function HistoryPage() {
  const [state, setState] = useState('loading');
  const [results, setResults] = useState([]);
  const [err, setErr] = useState('');
  const local = loadHistory();
  useEffect(() => {
    api.get('/results')
      .then((d) => { setResults(d.results || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Exam History</h1>
      <p className="mt-1 text-sm text-slate-600">Online attempts from the server, plus your offline Chemistry exams from this browser.</p></div>
      <BackendBanner />
      {state === 'loading' && <Spinner label="Loading history…" />}
      {state === 'error' && <ErrorState title="Could not load online history" body={err} onRetry={() => window.location.reload()} />}
      {state === 'ok' && (
        <>
          <Card>
            <h2 className="text-lg font-bold text-slate-900">Online exams</h2>
            {results.length === 0 ? <p className="mt-2 text-sm text-slate-600">No online attempts yet.</p> : (
              <ul className="mt-3 space-y-2 text-sm">
                {results.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                    <span>{r.exam_title}</span>
                    <span className="font-bold tabular-nums">{r.published ? `${r.score} / ${r.total_marks}` : 'Not published yet'}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-slate-900">Offline Chemistry exams (this browser)</h2>
            {local.length === 0 ? <p className="mt-2 text-sm text-slate-600">No offline exams yet. <Link to="/exam-portal" className="font-bold text-blue-700 underline">Take one</Link>.</p> : (
              <ul className="mt-3 space-y-2 text-sm">
                {local.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                    <span>{h.paperTitle} · {h.date ? new Date(h.date).toLocaleDateString() : ''}</span>
                    <span className="font-bold tabular-nums">{h.score} / {h.totalMarks}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
