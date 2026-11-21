import { useEffect, useMemo, useState } from 'react';
import { LETTERS, formatTime } from '../lib/exam.js';

/**
 * Exam interface. One question at a time, countdown with auto-submit,
 * palette, prev/next, clear answer, submit confirmation.
 * No correct answers are shown during the exam.
 */
export default function Exam({ questions, durationMin, onSubmit, onExit }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(durationMin * 60);
  const [confirming, setConfirming] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const q = questions[index];
  const answeredCount = Object.keys(answers).length;
  const unanswered = questions.length - answeredCount;

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onSubmit(answers, Math.round((Date.now() - startedAt) / 1000));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const lowTime = secondsLeft <= 60;
  const timeLabel = useMemo(() => formatTime(secondsLeft), [secondsLeft]);

  function choose(opt) {
    setAnswers((a) => ({ ...a, [q.id]: opt }));
  }
  function clear() {
    setAnswers((a) => {
      const next = { ...a };
      delete next[q.id];
      return next;
    });
  }
  function submit() {
    onSubmit(answers, Math.round((Date.now() - startedAt) / 1000));
  }

  if (!q) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            প্রশ্ন {index + 1} / {questions.length} · উত্তর দেওয়া হয়েছে {answeredCount}টি
          </p>
          <p className="text-xs text-slate-500">{q.chapter} — {q.topic}</p>
        </div>
        <div
          className={`rounded-xl px-4 py-2 text-lg font-bold tabular-nums ${
            lowTime ? 'bg-red-100 text-red-800' : 'bg-teal-50 text-teal-900'
          }`}
          role="timer"
          aria-live="off"
        >
          {lowTime ? 'সময় প্রায় শেষ: ' : 'বাকি সময়: '}
          {timeLabel}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          পরীক্ষা ছেড়ে দাও
        </button>
      </div>

      {/* Palette */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" aria-label="প্রশ্ন প্যালেট">
        {questions.map((item, i) => {
          const answered = answers[item.id] !== undefined;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`প্রশ্ন ${i + 1}${answered ? ' (উত্তর দেওয়া)' : ''}`}
              aria-current={i === index}
              className={`min-h-[44px] min-w-[44px] rounded-lg px-2 py-2 text-sm font-bold ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                i === index
                  ? 'bg-teal-700 text-white ring-teal-700'
                  : answered
                    ? 'bg-teal-100 text-teal-900 ring-teal-300'
                    : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question */}
      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        {q.stimulus && (
          <div className="mb-4 whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
            {q.stimulus}
          </div>
        )}
        <h2 className="whitespace-pre-line text-lg font-bold leading-relaxed text-slate-900">
          {index + 1}. <span dangerouslySetInnerHTML={{ __html: q.q }} />
        </h2>
        <div className="mt-5 space-y-3" role="radiogroup" aria-label="উত্তরের অপশন">
          {q.o.map((opt, i) => {
            const selected = answers[q.id] === i;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(i)}
                className={`flex min-h-[48px] w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                  selected
                    ? 'border-teal-700 bg-teal-50 ring-1 ring-teal-700'
                    : 'border-slate-300 bg-white hover:border-teal-600 hover:bg-teal-50/50'
                }`}
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-800">
                  {LETTERS[i]}
                </span>
                <span className="text-slate-900" dangerouslySetInnerHTML={{ __html: opt }} />
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-40"
            >
              ← আগেরটি
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={index === questions.length - 1}
              className="min-h-[44px] rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-900 disabled:opacity-40"
            >
              পরেরটি →
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clear}
              disabled={answers[q.id] === undefined}
              className="min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-semibold text-red-700 ring-1 ring-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-40"
            >
              উত্তর মুছে ফেলো
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="min-h-[44px] rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              জমা দাও
            </button>
          </div>
        </div>
      </article>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="জমা দেওয়ার নিশ্চিতকরণ">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">পরীক্ষা জমা দেবে?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              মোট {questions.length}টি প্রশ্নের মধ্যে {answeredCount}টির উত্তর দিয়েছো,
              {unanswered}টি উত্তর দেওয়া হয়নি।
              {unanswered > 0 ? ' জমা দিলে বাকিগুলো ফাঁকা ধরা হবে।' : ''}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={submit}
                className="min-h-[44px] flex-1 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-900"
              >
                হ্যাঁ, জমা দাও
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-[44px] flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                ফিরে যাও
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
