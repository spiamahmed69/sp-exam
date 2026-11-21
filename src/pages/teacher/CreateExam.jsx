import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Button, Card, Input, Textarea, useToast } from '../../components/ui.jsx';

export default function CreateExam() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ title: '', subject_id: '', description: '', type: 'mcq', duration_min: 25, negative_marking: 0.25, randomize: true, starts_at: '', ends_at: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get('/subjects').then((d) => setSubjects(d.subjects || [])).catch(() => {}); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.post('/exams', { ...form, duration_min: Number(form.duration_min), negative_marking: Number(form.negative_marking), starts_at: form.starts_at || null, ends_at: form.ends_at || null });
      success('Exam created. Now add questions.');
      navigate(`/teacher/exams/${d.exam.id}/questions`);
    } catch (ex) { toastError(ex.message); } finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Create Exam</h1>
      <p className="mt-1 text-sm text-slate-600">The exam starts as a draft — publish it only when its questions are ready.</p></div>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Exam title" id="ex-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div>
            <label htmlFor="ex-subject" className="block text-sm font-semibold text-slate-700">Subject</label>
            <select id="ex-subject" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <option value="">— Select a subject —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Textarea label="Description" id="ex-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ex-type" className="block text-sm font-semibold text-slate-700">Type</label>
              <select id="ex-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base">
                <option value="mcq">MCQ only</option><option value="cq">CQ only</option><option value="mixed">Mixed MCQ + CQ</option>
              </select>
            </div>
            <Input label="Duration (minutes)" id="ex-dur" type="number" min={1} max={300} value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Negative marking per wrong answer" id="ex-neg" type="number" step="0.05" min={0} max={1} value={form.negative_marking} onChange={(e) => setForm({ ...form, negative_marking: e.target.value })} />
            <div className="flex items-end pb-1">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.randomize} onChange={(e) => setForm({ ...form, randomize: e.target.checked })} className="h-5 w-5 accent-blue-700" /> Shuffle question order
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Starts at (optional)" id="ex-start" type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            <Input label="Ends at (optional)" id="ex-end" type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Creating…' : 'Create exam'}</Button>
        </form>
      </Card>
    </div>
  );
}
