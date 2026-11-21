import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardCheck, FileCheck, Users } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import BackendBanner from '../../components/BackendBanner.jsx';
import { Card, ErrorState, Skeleton, StatCard } from '../../components/ui.jsx';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    Promise.allSettled([api.get('/exams'), api.get('/results')]).then(([e, r]) => {
      if (e.status === 'rejected') { setErr(e.reason.message); setState('error'); return; }
      const exams = (e.value.exams || []).filter((x) => x.created_by === user?.id);
      const results = r.status === 'fulfilled' ? r.value.results || [] : [];
      setData({
        exams,
        participants: new Set(results.map((x) => x.user_id)).size,
        pendingCq: results.filter((x) => x.cq_pending).length,
        published: results.filter((x) => x.published).length,
        unpublished: results.filter((x) => !x.published),
      });
      setState('ok');
    });
  }, [user?.id]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Welcome, {user?.name}. Your exams, participants and marking queue.</p></div>
      <BackendBanner />
      {state === 'loading' && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>}
      {state === 'error' && <ErrorState title="Could not load your dashboard" body={err} onRetry={() => window.location.reload()} />}
      {state === 'ok' && (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="My exams" value={data.exams.length} icon={<BookOpen size={20} />} />
            <StatCard label="Participants" value={data.participants} sub="Unique students with results" icon={<Users size={20} />} />
            <StatCard label="Pending CQ evaluations" value={data.pendingCq} icon={<ClipboardCheck size={20} />} />
            <StatCard label="Published results" value={data.published} icon={<FileCheck size={20} />} />
          </section>
          <div className="flex flex-wrap gap-2">
            <Link to="/teacher/exams/new" className="inline-flex min-h-[44px] items-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800">Create new exam</Link>
            <Link to="/teacher/submissions" className="inline-flex min-h-[44px] items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">Review submissions</Link>
          </div>
          <Card>
            <h2 className="text-lg font-bold text-slate-900">Results waiting to be published</h2>
            {data.unpublished.length === 0 ? <p className="mt-2 text-sm text-slate-600">Nothing waiting — every result is published.</p> : (
              <ul className="mt-3 space-y-2 text-sm">
                {data.unpublished.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                    <span>{r.exam_title} · {r.student_name}</span>
                    <Link to="/teacher/results" className="font-bold text-blue-700 underline">Review</Link>
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
