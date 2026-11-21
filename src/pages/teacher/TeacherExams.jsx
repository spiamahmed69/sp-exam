import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { Badge, Button, Card, EmptyState, ErrorState, Modal, Spinner, useToast } from '../../components/ui.jsx';

export default function TeacherExams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [exams, setExams] = useState([]);
  const [state, setState] = useState('loading');
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState(null);

  function load() {
    setState('loading');
    api.get('/exams').then((d) => { setExams((d.exams || []).filter((x) => x.created_by === user?.id)); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }
  useEffect(load, [user?.id]);

  async function togglePublish(e) {
    try {
      await api.post(`/exams/${e.id}/${e.published ? 'unpublish' : 'publish'}`, {});
      success(e.published ? 'Exam unpublished.' : 'Exam published — students can now join it.');
      load();
    } catch (ex) { toastError(ex.message); }
  }
  async function doDelete() {
    try {
      await api.del(`/exams/${deleting.id}`);
      success('Exam deleted.');
      setDeleting(null);
      load();
    } catch (ex) { toastError(ex.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">My Exams</h1>
        <p className="mt-1 text-sm text-slate-600">Create, edit, publish and delete your own exams.</p></div>
        <Button onClick={() => navigate('/teacher/exams/new')}><Plus size={16} /> New exam</Button>
      </div>
      {state === 'loading' && <Spinner label="Loading your exams…" />}
      {state === 'error' && <ErrorState title="Could not load exams" body={err} onRetry={load} />}
      {state === 'ok' && exams.length === 0 && <EmptyState title="You have not created any exams yet" body="Create your first exam — add questions after saving it." action={<Button onClick={() => navigate('/teacher/exams/new')}>Create exam</Button>} />}
      {state === 'ok' && exams.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((e) => (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900">{e.title}</h2>
                {e.published ? <Badge tone="green">Published</Badge> : <Badge tone="slate">Draft</Badge>}
              </div>
              <p className="mt-2 text-sm text-slate-600">{e.question_count} questions · {e.total_marks} marks · {e.duration_min} min · Negative {e.negative_marking}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => togglePublish(e)}>{e.published ? 'Unpublish' : 'Publish'}</Button>
                <Button variant="outline" onClick={() => navigate(`/teacher/exams/${e.id}/questions`)}><Pencil size={16} /> Questions</Button>
                <Button variant="danger" onClick={() => setDeleting(e)}><Trash2 size={16} /> Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {deleting && (
        <Modal title="Delete this exam?" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-700">“{deleting.title}” will be deleted. Its questions stay in the bank but are no longer attached to an exam. This cannot be undone.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="danger" onClick={doDelete} className="flex-1">Yes, delete</Button>
            <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1">Cancel</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
