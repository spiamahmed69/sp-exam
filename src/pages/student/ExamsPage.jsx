import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileQuestion, Minus } from 'lucide-react';
import { api } from '../../lib/api.js';
import BackendBanner from '../../components/BackendBanner.jsx';
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from '../../components/ui.jsx';

export default function ExamsPage() {
  const [state, setState] = useState('loading');
  const [exams, setExams] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get('/exams')
      .then((d) => { setExams(d.exams || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Available Exams</h1>
      <p className="mt-1 text-sm text-slate-600">Only published exams are listed. Read the instructions before you start — the server timer starts immediately.</p></div>
      <BackendBanner />
      {state === 'loading' && <div className="grid gap-4 md:grid-cols-2"><Skeleton /><Skeleton /></div>}
      {state === 'error' && <ErrorState title="Could not load exams" body={err} onRetry={() => window.location.reload()} />}
      {state === 'ok' && exams.length === 0 && (
        <EmptyState title="No exams available right now" body="No exam is published at the moment. Check back later, or try the offline Chemistry exam portal." action={<Link to="/exam-portal"><Button variant="outline">Offline Chemistry exam</Button></Link>} />
      )}
      {state === 'ok' && exams.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((e) => (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900">{e.title}</h2>
                <Badge tone="green">Published</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{e.description}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-1"><FileQuestion size={16} /> {e.question_count} questions · {e.total_marks} marks</span>
                <span className="inline-flex items-center gap-1"><Clock size={16} /> {e.duration_min} min</span>
                <span className="inline-flex items-center gap-1"><Minus size={16} /> Negative {e.negative_marking} / wrong</span>
              </div>
              {e.starts_at && <p className="mt-1 text-xs text-slate-500">Starts: {new Date(e.starts_at).toLocaleString()}</p>}
              {e.ends_at && <p className="mt-1 text-xs text-slate-500">Ends: {new Date(e.ends_at).toLocaleString()}</p>}
              <Link to={`/exams/${e.id}`} className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800">View instructions & start</Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
