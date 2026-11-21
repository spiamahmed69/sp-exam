import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Button, Card, ErrorState, Input, Spinner, useToast } from '../../components/ui.jsx';

export default function EvaluatePage() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [marks, setMarks] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/results/${resultId}`).then((d) => {
      setResult(d.result);
      return api.get(`/attempts/${d.result.attempt_id || ''}`).catch(() => null);
    }).then((a) => {
      if (a) { setAttempt(a.attempt); setQuestions(a.questions || []); }
    }).catch((e) => setErr(e.message));
  }, [resultId]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/results/${resultId}/evaluate`, { cq_marks: marks });
      success('CQ marks saved. Publish the result when ready.');
      navigate('/teacher/submissions');
    } catch (ex) { toastError(ex.message); } finally { setBusy(false); }
  }

  if (err) return <ErrorState title="Could not load this submission" body={err} />;
  if (!result) return <Spinner label="Loading submission…" />;
  const cqQuestions = questions.filter((q) => q.type === 'cq');
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">CQ Evaluation</h1>
      <p className="mt-1 text-sm text-slate-600">{result.exam_title} — {result.student_name} · MCQ score so far: {result.score} / {result.total_marks}</p></div>
      {cqQuestions.length === 0 && (
        <Card><p className="text-sm text-slate-700">This attempt has no CQ questions to mark (or the attempt details could not be loaded). Use the Submissions page to publish the MCQ result.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/teacher/submissions')}>Back to submissions</Button></Card>
      )}
      {cqQuestions.length > 0 && (
        <form onSubmit={submit} className="space-y-4">
          {cqQuestions.map((q, i) => (
            <Card key={q.id}>
              <p className="font-bold text-slate-900">{i + 1}. <span dangerouslySetInnerHTML={{ __html: q.q }} /></p>
              <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
                {attempt?.answers?.[q.id] ? attempt.answers[q.id] : '— No answer written —'}
              </p>
              <div className="mt-3 max-w-[200px]">
                <Input label={`Marks (out of ${q.marks})`} id={`cq-${q.id}`} type="number" min={0} max={q.marks} step="0.5" value={marks[q.id] ?? ''} onChange={(e) => setMarks({ ...marks, [q.id]: e.target.value })} />
              </div>
            </Card>
          ))}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Saving…' : 'Save CQ marks'}</Button>
        </form>
      )}
    </div>
  );
}
