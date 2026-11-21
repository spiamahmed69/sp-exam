import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button, Card, EmptyState, ErrorState, Input, Modal, Spinner, Textarea, useToast } from '../../components/ui.jsx';

const EMPTY = { type: 'mcq', q: '', o: ['', '', '', ''], a: 0, marks: 1, chapter: '', topic: '', stimulus: '' };

export default function QuestionManager() {
  const { id } = useParams();
  const { success, error: toastError } = useToast();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [state, setState] = useState('loading');
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | question object
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  function load() {
    Promise.allSettled([api.get(`/exams/${id}`), api.get(`/exams/${id}/questions`)]).then(([e, q]) => {
      if (e.status === 'rejected') { setErr(e.reason.message); setState('error'); return; }
      setExam(e.value.exam);
      setQuestions(q.status === 'fulfilled' ? q.value.questions || [] : []);
      setState('ok');
    });
  }
  useEffect(load, [id]);

  function openNew() { setForm(EMPTY); setEditing('new'); }
  function openEdit(q) {
    setForm({ type: q.type || 'mcq', q: q.q, o: q.type === 'cq' ? ['', '', '', ''] : [...(q.o || []), '', '', '', ''].slice(0, 4), a: q.a ?? 0, marks: q.marks || 1, chapter: q.chapter || '', topic: q.topic || '', stimulus: q.stimulus || '' });
    setEditing(q);
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, o: form.type === 'mcq' ? form.o.filter((x) => x.trim() !== '') : [], a: form.type === 'mcq' ? Number(form.a) : null };
    try {
      if (editing === 'new') await api.post(`/exams/${id}/questions`, payload);
      else await api.put(`/exams/${id}/questions/${editing.id}`, payload);
      success(editing === 'new' ? 'Question added.' : 'Question updated.');
      setEditing(null);
      load();
    } catch (ex) { toastError(ex.message); } finally { setBusy(false); }
  }
  async function remove(q) {
    if (!window.confirm(`Delete this question? This cannot be undone.`)) return;
    try { await api.del(`/exams/${id}/questions/${q.id}`); success('Question deleted.'); load(); }
    catch (ex) { toastError(ex.message); }
  }

  if (state === 'error') return <ErrorState title="Could not load questions" body={err} onRetry={load} />;
  if (state === 'loading') return <Spinner label="Loading questions…" />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Questions — {exam?.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{questions.length} questions · {exam?.total_marks} marks total · {exam?.duration_min} min</p></div>
        <div className="flex gap-2">
          <Link to="/teacher/exams" className="inline-flex min-h-[44px] items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">Back to exams</Link>
          <Button onClick={openNew}><Plus size={16} /> Add question</Button>
        </div>
      </div>
      {questions.length === 0 && <EmptyState title="No questions yet" body="Add MCQ or CQ questions. Students only see a question once the exam is published and started — never the correct answer." action={<Button onClick={openNew}>Add first question</Button>} />}
      <div className="space-y-3">
        {questions.map((q, i) => (
          <Card key={q.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{i + 1}. <span dangerouslySetInnerHTML={{ __html: q.q }} /></p>
                <p className="mt-1 text-xs text-slate-500">{q.type === 'cq' ? 'CQ' : 'MCQ'} · {q.marks} mark(s){q.chapter ? ` · ${q.chapter}` : ''}{q.topic ? ` — ${q.topic}` : ''}</p>
                {q.type === 'mcq' && <ul className="mt-2 space-y-1 text-sm text-slate-700">{(q.o || []).map((o, oi) => (<li key={oi} className={oi === q.a ? 'font-bold text-green-700' : ''}>{String.fromCharCode(65 + oi)}. <span dangerouslySetInnerHTML={{ __html: o }} />{oi === q.a ? ' — correct' : ''}</li>))}</ul>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => openEdit(q)} aria-label="Edit question" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"><Pencil size={16} /></button>
                <button type="button" onClick={() => remove(q)} aria-label="Delete question" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-red-700 ring-1 ring-red-300 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {editing && (
        <Modal title={editing === 'new' ? 'Add question' : 'Edit question'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label htmlFor="q-type" className="block text-sm font-semibold text-slate-700">Type</label>
              <select id="q-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base">
                <option value="mcq">MCQ (options + correct answer)</option>
                <option value="cq">CQ (written answer, marked by hand)</option>
              </select>
            </div>
            <Textarea label="Question" id="q-text" value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} required />
            <Textarea label="Stimulus / passage (optional)" id="q-stim" value={form.stimulus} onChange={(e) => setForm({ ...form, stimulus: e.target.value })} />
            {form.type === 'mcq' && (
              <div className="space-y-2">
                <span className="block text-sm font-semibold text-slate-700">Options (tick the correct one)</span>
                {form.o.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={Number(form.a) === i} onChange={() => setForm({ ...form, a: i })} aria-label={`Option ${i + 1} is correct`} className="h-5 w-5 shrink-0 accent-blue-700" />
                    <input value={o} onChange={(e) => setForm({ ...form, o: form.o.map((x, xi) => (xi === i ? e.target.value : x)) })} placeholder={`Option ${i + 1}`} className="min-h-[44px] flex-1 rounded-xl border border-slate-300 px-3 py-2 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <Input label="Marks" id="q-marks" type="number" min={1} max={100} value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
              <Input label="Chapter" id="q-ch" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} />
              <Input label="Topic" id="q-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={busy}>{busy ? 'Saving…' : 'Save question'}</Button>
              <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
