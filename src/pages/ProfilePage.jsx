import { useState } from 'react';
import { loadHistory, loadProfile, saveProfile } from '../lib/store.js';
import { formatTime } from '../lib/exam.js';

const TARGETS = ['HSC', 'Medical', 'Varsity', 'Engineering', 'Job / BCS'];

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => loadProfile());
  const [saved, setSaved] = useState(false);
  const history = loadHistory();

  const total = history.length;
  const best = history.reduce((m, h) => Math.max(m, h.score ?? 0), 0);
  const avg =
    total === 0 ? 0 : history.reduce((s, h) => s + (h.score ?? 0), 0) / total;
  const correct = history.reduce((s, h) => s + (h.correct ?? 0), 0);

  function save(e) {
    e.preventDefault();
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">প্রোফাইল</h1>
        <p className="mt-1 text-sm text-slate-600">
          তোমার তথ্য শুধু এই ব্রাউজারে সংরক্ষিত থাকে (localStorage) — SP Exam-এর
          কোনো সার্ভারে পাঠানো হয় না।
        </p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label="প্রোফাইল সম্পাদনা">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="name">
              নাম
            </label>
            <input
              id="name"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="তোমার নাম লেখো"
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="target">
              লক্ষ্য পরীক্ষা
            </label>
            <select
              id="target"
              value={profile.target}
              onChange={(e) => setProfile({ ...profile, target: e.target.value })}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {TARGETS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="phone">
              ফোন (ঐচ্ছিক)
            </label>
            <input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-[48px] items-center rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900"
          >
            সংরক্ষণ করো
          </button>
          {saved && (
            <p className="text-sm font-semibold text-green-700" role="status">
              সংরক্ষিত হয়েছে।
            </p>
          )}
        </form>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label="পরীক্ষার ইতিহাস">
        <h2 className="text-lg font-bold text-slate-900">পরীক্ষার ইতিহাস</h2>
        {total === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            এখনো কোনো পরীক্ষা দেওয়া হয়নি। পরীক্ষা পোর্টাল থেকে একটি পরীক্ষা শেষ
            করলেই এখানে তোমার স্কোর ও ইতিহাস দেখা যাবে।
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-blue-50 px-3 py-3">
                <p className="text-lg font-bold text-blue-800">{total}টি</p>
                <p className="text-slate-600">পরীক্ষা</p>
              </div>
              <div className="rounded-xl bg-green-50 px-3 py-3">
                <p className="text-lg font-bold text-green-800">{best}</p>
                <p className="text-slate-600">সেরা স্কোর</p>
              </div>
              <div className="rounded-xl bg-slate-100 px-3 py-3">
                <p className="text-lg font-bold text-slate-800">{avg.toFixed(1)}</p>
                <p className="text-slate-600">গড় স্কোর</p>
              </div>
              <div className="rounded-xl bg-slate-100 px-3 py-3">
                <p className="text-lg font-bold text-slate-800">{correct}টি</p>
                <p className="text-slate-600">মোট সঠিক উত্তর</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {history.slice(0, 10).map((h) => (
                <li
                  key={h.id}
                  className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <span>
                    {h.paperTitle || 'পরীক্ষা'} · {h.chapter || 'সব অধ্যায়'}
                    <span className="block text-xs text-slate-500">
                      {h.date ? new Date(h.date).toLocaleString('bn-BD') : ''} · সময়{' '}
                      {formatTime(h.timeUsedSec || 0)}
                    </span>
                  </span>
                  <strong className="tabular-nums">
                    {h.score} / {h.totalMarks} · সঠিক {h.correct}, ভুল {h.wrong}, ফাঁকা {h.blank}
                  </strong>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
