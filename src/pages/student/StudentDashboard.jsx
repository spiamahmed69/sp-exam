import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, ClipboardList, Trophy } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import BackendBanner from '../../components/BackendBanner.jsx';
import { Card, EmptyState, ErrorState, Skeleton, StatCard } from '../../components/ui.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.allSettled([api.get('/exams'), api.get('/results'), api.get('/announcements')]).then(([e, r, a]) => {
      if (e.status === 'rejected') { setErr(e.reason.message); setState('error'); return; }
      const exams = e.value.exams || [];
      const results = r.status === 'fulfilled' ? r.value.results || [] : [];
      const published = results.filter((x) => x.score !== null && x.score !== undefined);
      const avg = published.length ? (published.reduce((s, x) => s + Number(x.score || 0), 0) / published.length) : null;
      setData({
        exams, results,
        totalExams: exams.length,
        completed: results.length,
        avg: avg === null ? null : avg.toFixed(2),
        recent: results.slice(0, 5),
        announcements: a.status === 'fulfilled' ? a.value.announcements || [] : [],
      });
      setState('ok');
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name || 'Student'}</h1>
        <p className="mt-1 text-sm text-slate-600">Your exams, results and announcements — all live from the server.</p>
      </div>
      <BackendBanner />
      {state === 'loading' && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>}
      {state === 'error' && <ErrorState title="Could not load your dashboard" body={err} onRetry={() => window.location.reload()} />}
      {state === 'ok' && (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Your statistics">
            <StatCard label="Available exams" value={data.totalExams} icon={<BookOpen size={20} />} />
            <StatCard label="Exams completed" value={data.completed} icon={<CheckCircle2 size={20} />} />
            <StatCard label="Average marks" value={data.avg ?? '—'} sub={data.avg === null ? 'No published results yet' : 'Across published results'} icon={<Trophy size={20} />} />
            <StatCard label="Announcements" value={data.announcements.length} icon={<ClipboardList size={20} />} />
          </section>
          {data.announcements.length > 0 && (
            <Card>
              <h2 className="text-lg font-bold text-slate-900">Announcements</h2>
              <ul className="mt-3 space-y-3">
                {data.announcements.slice(0, 3).map((a) => (
                  <li key={a.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{a.body}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Recent results</h2>
              <Link to="/results" className="text-sm font-bold text-blue-700 underline">View all</Link>
            </div>
            {data.recent.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">You have not completed any exams yet. <Link to="/exams" className="font-bold text-blue-700 underline">Browse available exams</Link>.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0">
                    <span className="text-slate-800">{r.exam_title}</span>
                    <span className="font-bold tabular-nums text-slate-900">{r.score === null || r.score === undefined ? 'Not published yet' : `${r.score} / ${r.total_marks}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="flex flex-wrap gap-2">
            <Link to="/exams" className="inline-flex min-h-[44px] items-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800">Browse exams</Link>
            <Link to="/exam-portal" className="inline-flex min-h-[44px] items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">Offline Chemistry exam</Link>
          </div>
        </>
      )}
    </div>
  );
}
