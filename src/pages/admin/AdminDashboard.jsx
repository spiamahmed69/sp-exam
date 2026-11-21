import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, FileText, GraduationCap, Users } from 'lucide-react';
import { api } from '../../lib/api.js';
import BackendBanner from '../../components/BackendBanner.jsx';
import { Card, ErrorState, Skeleton, StatCard } from '../../components/ui.jsx';

export default function AdminDashboard() {
  const [state, setState] = useState('loading');
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get('/admin/stats').then((d) => { setStats(d.stats); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Platform-wide statistics, calculated from stored data.</p></div>
      <BackendBanner />
      {state === 'loading' && <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><Skeleton /><Skeleton /><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>}
      {state === 'error' && <ErrorState title="Could not load admin statistics" body={err} onRetry={() => window.location.reload()} />}
      {state === 'ok' && stats && (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="Total users" value={stats.total_users} icon={<Users size={20} />} />
            <StatCard label="Active students" value={stats.active_students} icon={<GraduationCap size={20} />} />
            <StatCard label="Total teachers" value={stats.total_teachers} sub={`${stats.pending_teachers} waiting for approval`} icon={<Users size={20} />} />
            <StatCard label="Total examinations" value={stats.total_exams} icon={<BookOpen size={20} />} />
            <StatCard label="Total attempts" value={stats.total_attempts} icon={<ClipboardList size={20} />} />
            <StatCard label="Published results" value={stats.published_results} sub={`${stats.total_results} results in total`} icon={<FileText size={20} />} />
          </section>
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Recent platform activity</h2>
              <Link to="/admin/audit-logs" className="text-sm font-bold text-blue-700 underline">View all audit logs</Link>
            </div>
            {stats.recent_activity.length === 0 ? <p className="mt-2 text-sm text-slate-600">No activity logged yet.</p> : (
              <ul className="mt-3 space-y-2 text-sm">
                {stats.recent_activity.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                    <span className="font-semibold text-slate-800">{l.action}</span>
                    <span className="text-slate-500">{l.created_at ? new Date(l.created_at).toLocaleString() : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/users" className="inline-flex min-h-[44px] items-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800">Manage users</Link>
            <Link to="/admin/backup" className="inline-flex min-h-[44px] items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">Backup & restore</Link>
          </div>
        </>
      )}
    </div>
  );
}
