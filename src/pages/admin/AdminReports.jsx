import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Card, ErrorState, Spinner } from '../../components/ui.jsx';

export default function AdminReports() {
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    Promise.allSettled([api.get('/admin/stats'), api.get('/results'), api.get('/exams')]).then(([s, r, e]) => {
      if (s.status === 'rejected') { setErr(s.reason.message); setState('error'); return; }
      const results = r.status === 'fulfilled' ? r.value.results || [] : [];
      const exams = e.status === 'fulfilled' ? e.value.exams || [] : [];
      const published = results.filter((x) => x.published && x.score !== null && x.score !== undefined);
      const byExam = {};
      for (const x of published) {
        byExam[x.exam_id] = byExam[x.exam_id] || { title: x.exam_title, scores: [] };
        byExam[x.exam_id].scores.push(Number(x.score));
      }
      setData({ stats: s.value.stats, exams, byExam, totalPublished: published.length });
      setState('ok');
    });
  }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      <p className="mt-1 text-sm text-slate-600">Average scores per exam, from published results only. No charts are shown where there is no data.</p></div>
      {state === 'loading' && <Spinner label="Loading reports…" />}
      {state === 'error' && <ErrorState title="Could not load reports" body={err} onRetry={() => window.location.reload()} />}
      {state === 'ok' && data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[['Total attempts', data.stats.total_attempts], ['Published results', data.stats.published_results], ['Total exams', data.stats.total_exams], ['Total users', data.stats.total_users]].map(([l, v]) => (
              <Card key={l}><p className="text-2xl font-bold tabular-nums text-slate-900">{v}</p><p className="mt-1 text-sm text-slate-600">{l}</p></Card>
            ))}
          </div>
          <Card>
            <h2 className="text-lg font-bold text-slate-900">Average score per exam</h2>
            {Object.keys(data.byExam).length === 0 ? <p className="mt-2 text-sm text-slate-600">No published results yet — averages appear once teachers publish results.</p> : (
              <ul className="mt-3 space-y-3">
                {Object.entries(data.byExam).map(([id, g]) => {
                  const avg = (g.scores.reduce((a, b) => a + b, 0) / g.scores.length).toFixed(2);
                  const max = Math.max(...g.scores);
                  return (
                    <li key={id}>
                      <div className="flex justify-between gap-2 text-sm"><span className="font-semibold text-slate-900">{g.title}</span><span className="tabular-nums">avg {avg} · best {max} · {g.scores.length} result(s)</span></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{ width: `${Math.min(100, (Number(avg) / 25) * 100)}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
