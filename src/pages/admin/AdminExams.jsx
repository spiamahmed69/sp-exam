import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Badge, Button, Card, EmptyState, ErrorState, Modal, Spinner, useToast } from '../../components/ui.jsx';

export default function AdminExams() {
  const [state, setState] = useState('loading');
  const [exams, setExams] = useState([]);
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState(null);
  const { success, error: toastError } = useToast();
  function load() {
    api.get('/exams').then((d) => { setExams(d.exams || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }
  useEffect(load, []);
  async function toggle(e) {
    try { await api.post(`/exams/${e.id}/${e.published ? 'unpublish' : 'publish'}`, {}); success(e.published ? 'Exam unpublished.' : 'Exam published.'); load(); }
    catch (ex) { toastError(ex.message); }
  }
  async function doDelete() {
    try { await api.del(`/exams/${deleting.id}`); success('Exam deleted.'); setDeleting(null); load(); }
    catch (ex) { toastError(ex.message); }
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Exam Management</h1>
      <p className="mt-1 text-sm text-slate-600">Every exam on the platform — publish, unpublish or delete any of them.</p></div>
      {state === 'loading' && <Spinner label="Loading exams…" />}
      {state === 'error' && <ErrorState title="Could not load exams" body={err} onRetry={load} />}
      {state === 'ok' && exams.length === 0 && <EmptyState title="No exams yet" body="Teachers have not created any exams yet." />}
      {state === 'ok' && exams.length > 0 && (
        <div className="space-y-3">
          {exams.map((e) => (
            <Card key={e.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{e.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{e.question_count} questions · {e.total_marks} marks · {e.duration_min} min · {e.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  {e.published ? <Badge tone="green">Published</Badge> : <Badge tone="slate">Draft</Badge>}
                  <Button variant="outline" onClick={() => toggle(e)}>{e.published ? 'Unpublish' : 'Publish'}</Button>
                  <Link to={`/teacher/exams/${e.id}/questions`} className="inline-flex min-h-[44px] items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">Questions</Link>
                  <Button variant="danger" onClick={() => setDeleting(e)}><Trash2 size={16} /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {deleting && (
        <Modal title="Delete this exam?" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-700">“{deleting.title}” will be deleted. This cannot be undone.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="danger" onClick={doDelete} className="flex-1">Yes, delete</Button>
            <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1">Cancel</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
