import { useEffect } from 'react';
import { PAPERS, TOTAL_QUESTIONS } from '../data/chemistry.js';
import { chaptersWithCounts, filterQuestions } from '../lib/exam.js';
import ConnectionTest from './ConnectionTest.jsx';

const COUNT_OPTIONS = [5, 10, 20, 25];

export default function Dashboard({ selection, onChange, onStart }) {
  const { paperId, chapter, topic, count, durationMin, negative, secondTimer } = selection;
  const paper = PAPERS.find((p) => p.id === paperId) || PAPERS[0];
  const chapters = chaptersWithCounts(paper.id);
  const chapterObj = chapters.find((c) => c.name === chapter);
  const topics = chapter === 'all' ? [] : chapterObj?.topics || [];
  const available = filterQuestions(paper.id, chapter, topic);
  const maxCount = available.length;
  // Count options: the standard 5/10/20/25 that fit, plus "all available"
  // when fewer than 5 questions exist (otherwise small chapters could never start).
  const countOptions = [...new Set([...COUNT_OPTIONS.filter((n) => n <= maxCount), ...(maxCount > 0 && maxCount < 5 ? [maxCount] : [])])].sort((a, b) => a - b);
  const canStart = maxCount > 0 && count <= maxCount;

  // Keep the chosen count valid when the selection narrows the pool.
  useEffect(() => {
    if (maxCount > 0 && count > maxCount) onChange({ count: countOptions[countOptions.length - 1] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxCount]);

  return (
    <div className="space-y-6">
      {/* Honest limitation banner — always visible */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5" role="note">
        <h2 className="text-base font-bold text-amber-900">গুরুত্বপূর্ণ: AAP Pathshala-র প্রশ্ন এখানে নেই</h2>
        <p className="mt-1 text-sm leading-relaxed text-amber-900">
          AAP Pathshala (aapathshala.com/exams)-এর কোনো পাবলিক API বা অনুমোদিত
          ইন্টিগ্রেশন নেই — তাই SP Exam তাদের আসল প্রশ্ন আনতে পারে না এবং আনবেও না।
          এখানকার পরীক্ষা চলে <strong>SP-এর নিজস্ব প্রশ্নব্যাংক</strong> দিয়ে: HSC 2026
          সকল বোর্ডের রসায়ন ১ম ও ২য় পত্রের মোট <strong>{TOTAL_QUESTIONS}টি</strong> প্রশ্ন।
          AAP-র প্রশ্ন ব্যবহার করতে হলে তাদের লিখিত অনুমতি লাগবে — যোগাযোগ:
          +880 1710-090043, aapathshala09@gmail.com
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Subject / Chapter / Topic */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label="বিষয় নির্বাচন">
            <h2 className="text-lg font-bold text-slate-900">১. বিষয়, অধ্যায় ও টপিক বেছে নাও</h2>

            <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="subject">
              বিষয়
            </label>
            <select
              id="subject"
              value={paper.id}
              onChange={(e) => onChange({ paperId: e.target.value, chapter: 'all', topic: 'all' })}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {PAPERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — কোড {p.code}, সেট {p.set} ({p.questions.length}টি প্রশ্ন)
                </option>
              ))}
            </select>

            <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="chapter">
              অধ্যায়
            </label>
            <select
              id="chapter"
              value={chapter}
              onChange={(e) => onChange({ chapter: e.target.value, topic: 'all' })}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <option value="all">সব অধ্যায় ({paper.questions.length}টি প্রশ্ন)</option>
              {chapters.map((c) => (
                <option key={c.name} value={c.name} disabled={c.count === 0}>
                  {c.name} — {c.count === 0 ? 'প্রশ্ন নেই' : `${c.count}টি প্রশ্ন`}
                </option>
              ))}
            </select>

            {chapter !== 'all' && (
              <>
                <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="topic">
                  টপিক
                </label>
                <select
                  id="topic"
                  value={topic}
                  onChange={(e) => onChange({ topic: e.target.value })}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <option value="all">
                    সব টপিক ({chapterObj?.count ?? 0}টি প্রশ্ন)
                  </option>
                  {topics.map((t) => (
                    <option key={t.name} value={t.name} disabled={t.count === 0}>
                      {t.name} — {t.count === 0 ? 'প্রশ্ন নেই' : `${t.count}টি প্রশ্ন`}
                    </option>
                  ))}
                </select>
                {topics.some((t) => t.count === 0) && (
                  <p className="mt-2 text-xs text-slate-500">
                    ধূসর টপিকগুলোতে এই প্রশ্নব্যাংকে কোনো প্রশ্ন নেই — সেগুলো থেকে
                    পরীক্ষা শুরু করা যাবে না।
                  </p>
                )}
              </>
            )}

            <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
              এই নির্বাচনে প্রশ্ন আছে: {available.length}টি
              {available.length === 0 &&
                ' — এই অধ্যায়/টপিকে প্রশ্ন নেই। অন্য অধ্যায় বা টপিক বেছে নাও।'}
            </p>
          </section>

          {/* Exam config */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label="পরীক্ষার সেটিংস">
            <h2 className="text-lg font-bold text-slate-900">২. পরীক্ষার সেটিংস</h2>

            <fieldset className="mt-4">
              <legend className="text-sm font-semibold text-slate-700">প্রশ্ন সংখ্যা</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {countOptions.map((n) => {
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onChange({ count: n })}
                      aria-pressed={count === n}
                      className={`min-h-[44px] min-w-[56px] rounded-xl px-4 py-2 text-base font-semibold ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        count === n
                          ? 'bg-blue-700 text-white ring-blue-700'
                          : 'bg-white text-slate-800 ring-slate-300 hover:bg-slate-50'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              {countOptions.length === 0 && (
                <p className="mt-2 text-sm text-red-700">প্রশ্ন নেই বলে সংখ্যা বাছা যাচ্ছে না।</p>
              )}
            </fieldset>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700" htmlFor="duration">
                  সময় (মিনিট)
                </label>
                <input
                  id="duration"
                  type="number"
                  min={1}
                  max={120}
                  value={durationMin}
                  onChange={(e) => onChange({ durationMin: Math.max(1, Math.min(120, Number(e.target.value) || 25)) })}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                />
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-700">নেগেটিভ মার্কিং (প্রতি ভুল উত্তরে)</span>
                <div className="mt-1 flex gap-2">
                  {[0, 0.25].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onChange({ negative: v })}
                      aria-pressed={negative === v}
                      className={`min-h-[44px] flex-1 rounded-xl px-4 py-2 text-base font-semibold ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        negative === v
                          ? 'bg-blue-700 text-white ring-blue-700'
                          : 'bg-white text-slate-800 ring-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {v === 0 ? '০ (নেই)' : '০.২৫'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <input
                type="checkbox"
                checked={secondTimer}
                onChange={(e) => onChange({ secondTimer: e.target.checked })}
                className="mt-1 h-5 w-5 accent-blue-700"
              />
              <span className="text-sm text-slate-800">
                <strong>Second Timer</strong> — চালু থাকলে ফলাফলে মোট মার্কের ৫%
                কাটা যাবে (AAP Pathshala-র নিয়ম অনুসারে)।
              </span>
            </label>

            <button
              type="button"
              onClick={onStart}
              disabled={!canStart}
              className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-lg font-bold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              পরীক্ষা শুরু করো
            </button>
            {!canStart && (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {maxCount === 0
                  ? 'এই নির্বাচনে কোনো প্রশ্ন নেই, তাই পরীক্ষা শুরু করা যাচ্ছে না।'
                  : `প্রশ্ন সংখ্যা (${count}) উপলব্ধ প্রশ্নের (${maxCount}) চেয়ে বেশি।`}
              </p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <ConnectionTest />
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label="প্রশ্নব্যাংক">
            <h2 className="text-lg font-bold text-slate-900">প্রশ্নব্যাংক (নিজস্ব)</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {PAPERS.map((p) => (
                <li key={p.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                  <span>
                    {p.title} (কোড {p.code})
                  </span>
                  <strong>{p.questions.length}টি</strong>
                </li>
              ))}
              <li className="flex justify-between gap-2 font-semibold text-slate-900">
                <span>মোট</span>
                <strong>{TOTAL_QUESTIONS}টি</strong>
              </li>
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              উৎস: HSC 2026 সকল বোর্ডের রসায়ন প্রশ্নপত্র। এগুলো AAP Pathshala-র প্রশ্ন
              নয়। প্রশ্নে কোনো ব্যাখ্যা নেই — ফলাফলে শুধু সঠিক উত্তর দেখানো হয়।
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
