import { useState } from 'react';
import { LETTERS, formatTime } from '../lib/exam.js';

/**
 * Results + full review. Correct answer vs your answer for every question.
 * No explanations are shown — the source papers provide none, so each
 * review card states "ব্যাখ্যা দেওয়া হয়নি" plainly instead of inventing one.
 */
export default function Results({ questions, answers, result, timeUsedSec, config, onRetake, onDashboard }) {
  const [filter, setFilter] = useState('all'); // all | wrong | correct
  const shown = questions.filter((q) => {
    const a = answers[q.id];
    if (filter === 'wrong') return a === undefined || a !== q.a;
    if (filter === 'correct') return a === q.a;
    return true;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">ফলাফল</h2>
        <p className="mt-2 text-5xl font-bold tabular-nums text-teal-700">
          {Number(result.score.toFixed(2))} <span className="text-2xl text-slate-500">/ {result.totalMarks}</span>
        </p>
        <div className="mx-auto mt-5 grid max-w-2xl grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-green-50 px-3 py-3"><p className="font-bold text-green-800">{result.correct}টি</p><p className="text-slate-600">সঠিক</p></div>
          <div className="rounded-xl bg-red-50 px-3 py-3"><p className="font-bold text-red-800">{result.wrong}টি</p><p className="text-slate-600">ভুল</p></div>
          <div className="rounded-xl bg-slate-100 px-3 py-3"><p className="font-bold text-slate-800">{result.blank}টি</p><p className="text-slate-600">ফাঁকা</p></div>
          <div className="rounded-xl bg-slate-100 px-3 py-3"><p className="font-bold text-slate-800">{formatTime(timeUsedSec)}</p><p className="text-slate-600">সময় লেগেছে</p></div>
        </div>
        <div className="mx-auto mt-4 max-w-2xl space-y-1 text-left text-sm text-slate-700">
          <p>নেগেটিভ মার্কিং: {config.negative} প্রতি ভুল উত্তর — মোট কাটা {result.negativeMarks.toFixed(2)}</p>
          {config.secondTimer && <p>Second Timer চালু ছিল — মোট মার্কের ৫% কাটা: {result.secondTimerDeduction.toFixed(2)}</p>}
          <p>
            বিষয়: {config.paperTitle} · অধ্যায়: {config.chapter === 'all' ? 'সব অধ্যায়' : config.chapter}
            {config.topic && config.topic !== 'all' ? ` · টপিক: ${config.topic}` : ''}
            {' · '}প্রশ্ন: {questions.length}টি · সময়: {config.durationMin} মিনিট
          </p>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onRetake} className="min-h-[44px] rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-900">
            আবার পরীক্ষা দাও
          </button>
          <button type="button" onClick={onDashboard} className="min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
            ড্যাশবোর্ডে ফিরে যাও
          </button>
        </div>
      </section>

      <section aria-label="উত্তর পর্যালোচনা">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">উত্তর পর্যালোচনা ({shown.length}টি দেখানো হচ্ছে)</h2>
          <div className="flex gap-2" role="group" aria-label="ফিল্টার">
            {[
              ['all', 'সবগুলো'],
              ['wrong', 'ভুল ও ফাঁকা'],
              ['correct', 'শুধু সঠিক'],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFilter(v)}
                aria-pressed={filter === v}
                className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                  filter === v ? 'bg-teal-700 text-white ring-teal-700' : 'bg-white text-slate-800 ring-slate-300 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {shown.map((q, i) => {
            const a = answers[q.id];
            const isCorrect = a === q.a;
            const isBlank = a === undefined;
            return (
              <article
                key={q.id}
                className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${
                  isCorrect ? 'ring-green-300' : 'ring-red-200'
                }`}
              >
                {q.stimulus && (
                  <div className="mb-3 whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
                    {q.stimulus}
                  </div>
                )}
                <h3 className="whitespace-pre-line text-base font-bold leading-relaxed text-slate-900">
                  {i + 1}. <span dangerouslySetInnerHTML={{ __html: q.q }} />
                </h3>
                <p className="mt-1 text-xs text-slate-500">{q.chapter} — {q.topic}</p>
                <ul className="mt-3 space-y-2">
                  {q.o.map((opt, oi) => {
                    const isAnswer = oi === q.a;
                    const isYours = oi === a;
                    return (
                      <li
                        key={oi}
                        className={`flex items-start gap-3 rounded-xl px-4 py-2.5 text-sm ring-1 ${
                          isAnswer
                            ? 'bg-green-50 font-semibold text-green-900 ring-green-300'
                            : isYours
                              ? 'bg-red-50 font-semibold text-red-900 ring-red-300'
                              : 'bg-white text-slate-700 ring-slate-200'
                        }`}
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                          {LETTERS[oi]}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: opt }} />
                        {isAnswer && <span className="ml-auto shrink-0">সঠিক উত্তর</span>}
                        {isYours && !isAnswer && <span className="ml-auto shrink-0">তোমার উত্তর</span>}
                        {isYours && isAnswer && <span className="ml-auto shrink-0">তোমার উত্তর ✓</span>}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-sm text-slate-600">
                  {isBlank
                    ? 'তুমি এই প্রশ্নের উত্তর দাওনি।'
                    : isCorrect
                      ? 'তোমার উত্তর সঠিক।'
                      : 'তোমার উত্তর ভুল।'}
                  {' '}ব্যাখ্যা দেওয়া হয়নি — মূল প্রশ্নপত্রে কোনো ব্যাখ্যা ছিল না।
                </p>
              </article>
            );
          })}
          {shown.length === 0 && (
            <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
              এই ফিল্টারে কোনো প্রশ্ন নেই।
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
