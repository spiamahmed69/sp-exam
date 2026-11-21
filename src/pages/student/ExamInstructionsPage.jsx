import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Clock, FileQuestion, Minus, Shuffle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button, Card, ErrorState, Spinner, useToast } from '../../components/ui.jsx';

export default function ExamInstructionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [exam, setExam] = useState(null);
  const [err, setErr] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.get(`/exams/${id}`).then((d) => setExam(d.exam)).catch((e) => setErr(e.message));
  }, [id]);

  async function start() {
    setStarting(true);
    try {
      const d = await api.post(`/exams/${id}/start`, {});
      navigate(`/exam/${d.attempt.id}`);
    } catch (e) {
      toastError(e.message);
      if (e.code === 'already_submitted') navigate('/results');
    } finally {
      setStarting(false);
    }
  }

  if (err) return <ErrorState title="Could not load this exam" body={err} onRetry={() => window.location.reload()} />;
  if (!exam) return <Spinner label="Loading exam instructions…" />;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{exam.description}</p></div>
      <Card>
        <h2 className="text-lg font-bold text-slate-900">Exam details</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2"><FileQuestion size={16} /> {exam.question_count} questions · {exam.total_marks} marks</li>
          <li className="flex items-center gap-2"><Clock size={16} /> Duration: {exam.duration_min} minutes (server-timed)</li>
          <li className="flex items-center gap-2"><Minus size={16} /> Negative marking: {exam.negative_marking} per wrong answer</li>
          {exam.randomize && <li className="flex items-center gap-2"><Shuffle size={16} /> Question order is shuffled for each student</li>}
          {exam.starts_at && <li>Starts: {new Date(exam.starts_at).toLocaleString()}</li>}
          {exam.ends_at && <li>Ends: {new Date(exam.ends_at).toLocaleString()}</li>}
        </ul>
      </Card>
      <Card>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><AlertTriangle size={18} className="text-amber-600" /> Instructions — read before you start</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li>The timer starts the moment you press Start and is controlled by the server. When it reaches zero, your exam is submitted automatically.</li>
          <li>Your answers are autosaved as you answer. You can move between questions and mark questions for review.</li>
          <li>Do not refresh or close the tab mid-exam if you can avoid it — you can resume an active attempt from your exam history.</li>
          <li>Each exam can be submitted only once. A second submission is blocked by the server.</li>
          <li>Your result appears only after your teacher publishes it.</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={start} disabled={starting}>{starting ? 'Starting…' : 'Start exam now'}</Button>
          <Button variant="outline" onClick={() => navigate('/exams')}>Back to exams</Button>
        </div>
      </Card>
    </div>
  );
}
