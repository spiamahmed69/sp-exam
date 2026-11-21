import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { api } from '../../lib/api.js';
import BackendBanner from '../../components/BackendBanner.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../../components/ui.jsx';

export default function LeaderboardPage() {
  const [state, setState] = useState('loading');
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get('/leaderboard')
      .then((d) => { setRows(d.leaderboard || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
      <p className="mt-1 text-sm text-slate-600">Only published results are ranked. Names are shown as first name + initial to protect privacy.</p></div>
      <BackendBanner />
      {state === 'loading' && <Spinner label="Loading leaderboard…" />}
      {state === 'error' && <ErrorState title="Could not load the leaderboard" body={err} onRetry={() => window.location.reload()} />}
      {state === 'ok' && rows.length === 0 && <EmptyState title="No published results yet" body="The leaderboard fills up once teachers publish exam results." />}
      {state === 'ok' && rows.length > 0 && (
        <Card>
          <ol className="space-y-2">
            {rows.map((r, i) => (
              <li key={`${r.student}-${r.exam_title}-${i}`} className="flex items-center gap-3 border-b border-slate-100 pb-2 text-sm last:border-0">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${i < 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{i === 0 ? <Trophy size={16} /> : i + 1}</span>
                <span className="flex-1 font-semibold text-slate-900">{r.student}</span>
                <span className="hidden text-slate-600 sm:block">{r.exam_title}</span>
                <span className="font-bold tabular-nums text-slate-900">{r.score} / {r.total_marks}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
