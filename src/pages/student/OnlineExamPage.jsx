import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bookmark, ChevronLeft, ChevronRight, Clock, Maximize, Minimize, Save } from 'lucide-react';
import { api } from '../../lib/api.js';
import { LETTERS, formatTime } from '../../lib/exam.js';
import { Button, ErrorState, Modal, Spinner, useToast } from '../../components/ui.jsx';

/** Online exam interface, wired to the PHP API.
 *  Countdown is derived from the server's ends_at; autosave posts each
 *  answer; submit is confirmed and server-scored. */
export default function OnlineExamPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState([]);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [err, setErr] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    api.get(`/attempts/${attemptId}`)
      .then((d) => {
        setAttempt(d.attempt);
        setQuestions(d.questions || []);
        setAnswers(d.attempt.answers || {});
        setMarked(d.attempt.marked_review || []);
      })
      .catch((e) => setErr(e.message));
  }, [attemptId]);

  const submit = useCallback(async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const d = await api.post(`/attempts/${attemptId}/submit`, {});
      success(auto ? 'Time expired — your exam was submitted automatically.' : 'Exam submitted.');
      navigate('/results', { state: { justSubmitted: d.result?.id } });
    } catch (e) {
      submittedRef.current = false;
      toastError(e.message);
      if (e.code === 'already_submitted') navigate('/results');
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, navigate, success, toastError]);

  // Server-authoritative countdown: recompute from ends_at every second.
  useEffect(() => {
    if (!attempt?.ends_at) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(attempt.ends_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) submit(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [attempt?.ends_at, submit]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  }

  async function choose(qid, value) {
    setAnswers((a) => ({ ...a, [qid]: value }));
    setSaving(true);
    try {
      await api.post(`/attempts/${attemptId}/save-answer`, { question_id: qid, answer: value });
    } catch (e) {
      toastError(`Autosave failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleMark(qid) {
    const next = marked.includes(qid);
    setMarked((m) => (next ? m.filter((x) => x !== qid) : [...m, qid]));
    try {
      await api.post(`/attempts/${attemptId}/save-answer`, { question_id: qid, marked_review: !next });
    } catch { /* mark state is local-safe; server retry happens on next save */ }
  }

  if (err) return <ErrorState title="Could not load this exam attempt" body={err} onRetry={() => window.location.reload()} />;
  if (!attempt || questions.length === 0) return <Spinner label="Loading your exam…" />;
  const q = questions[index];
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== null && answers[k] !== undefined).length;
  const lowTime = secondsLeft !== null && secondsLeft <= 60;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-sm font-semibold text-slate-500">Question {index + 1} / {questions.length} · Answered {answeredCount} · Marked {marked.length}</p>
          <p className="text-xs text-slate-500">{attempt.exam_title} — server-timed</p>
        </div>
        <div className={`rounded-xl px-4 py-2 text-lg font-bold tabular-nums ${lowTime ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-900'}`} role="timer">
          <Clock className="mr-1 inline" size={18} /> {secondsLeft === null ? '—' : formatTime(secondsLeft)}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><Save size={14} /> {saving ? 'Saving…' : 'Autosaved'}</span>
          <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
            {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" aria-label="Question palette">
        {questions.map((item, i) => {
          const answered = answers[item.id] !== undefined && answers[item.id] !== null;
          const isMarked = marked.includes(item.id);
          return (
            <button key={item.id} type="button" onClick={() => setIndex(i)} aria-label={`Question ${i + 1}${answered ? ' (answered)' : ''}${isMarked ? ' (marked for review)' : ''}`} aria-current={i === index}
              className={`relative min-h-[44px] min-w-[44px] rounded-lg px-2 py-2 text-sm font-bold ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${i === index ? 'bg-blue-700 text-white ring-blue-700' : answered ? 'bg-blue-100 text-blue-900 ring-blue-300' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'}`}>
              {i + 1}
              {isMarked && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-500 ring-2 ring-white" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        {q.stimulus && <div className="mb-4 whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">{q.stimulus}</div>}
        <h2 className="whitespace-pre-line text-lg font-bold leading-relaxed text-slate-900">{index + 1}. <span dangerouslySetInnerHTML={{ __html: q.q }} /></h2>
        {q.type === 'cq' ? (
          <textarea aria-label="Your answer" value={typeof answers[q.id] === 'string' ? answers[q.id] : ''} onChange={(e) => choose(q.id, e.target.value)}
            placeholder="Write your answer here…" className="mt-5 min-h-[180px] w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
        ) : (
          <div className="mt-5 space-y-3" role="radiogroup" aria-label="Answer options">
            {q.o.map((opt, i) => {
              const selected = answers[q.id] === i;
              return (
                <button key={i} type="button" role="radio" aria-checked={selected} onClick={() => choose(q.id, i)}
                  className={`flex min-h-[48px] w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${selected ? 'border-blue-700 bg-blue-50 ring-1 ring-blue-700' : 'border-slate-300 bg-white hover:border-blue-600 hover:bg-blue-50/50'}`}>
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-800">{LETTERS[i]}</span>
                  <span className="text-slate-900" dangerouslySetInnerHTML={{ __html: opt }} />
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}><ChevronLeft size={16} /> Previous</Button>
            <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))} disabled={index === questions.length - 1}>Next <ChevronRight size={16} /></Button>
          </div>
          <div className="flex gap-2">
            <Button variant={marked.includes(q.id) ? 'accent' : 'outline'} onClick={() => toggleMark(q.id)}><Bookmark size={16} /> {marked.includes(q.id) ? 'Marked for review' : 'Mark for review'}</Button>
            <Button variant="accent" onClick={() => setConfirming(true)}>Submit exam</Button>
          </div>
        </div>
      </article>

      {confirming && (
        <Modal title="Submit this exam?" onClose={() => setConfirming(false)}>
          <p className="text-sm leading-relaxed text-slate-700">You answered {answeredCount} of {questions.length} questions ({questions.length - answeredCount} unanswered). Unanswered questions count as blank. You cannot change answers after submitting.</p>
          <div className="mt-5 flex gap-2">
            <Button onClick={() => { setConfirming(false); submit(false); }} disabled={submitting} className="flex-1">{submitting ? 'Submitting…' : 'Yes, submit'}</Button>
            <Button variant="outline" onClick={() => setConfirming(false)} className="flex-1">Keep answering</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
