import { useEffect, useState } from 'react';
import { applyTheme, clearHistory, loadHistory, loadSettings, saveSettings } from '../lib/store.js';
import { apiConfigured, apiUrl, checkConnection } from '../lib/api.js';

function ApiStatusSection() {
  const [status, setStatus] = useState({ status: 'unknown', url: apiUrl });
  useEffect(() => {
    checkConnection().then(setStatus);
  }, []);
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label="ব্যাকএন্ড সংযোগ">
      <h2 className="text-lg font-bold text-slate-900">ব্যাকএন্ড সংযোগ (অনলাইন পরীক্ষা)</h2>
      <p className="mt-1 text-sm text-slate-600">
        API URL: <code className="rounded bg-slate-100 px-1">{apiConfigured() ? apiUrl : 'সেট করা হয়নি (VITE_API_URL খালি)'}</code>
      </p>
      <p className="mt-2 text-sm font-semibold">
        অবস্থা:{' '}
        {status.status === 'online' && <span className="text-green-700">সংযুক্ত — অনলাইন পরীক্ষা, ফলাফল ও ড্যাশবোর্ড চালু আছে</span>}
        {status.status === 'offline' && <span className="text-red-700">পৌঁছানো যাচ্ছে না — PHP API চালু আছে কি না দেখো</span>}
        {status.status === 'not_configured' && <span className="text-amber-700">সংযুক্ত নয় — লোকাল মোডে চলছে (রসায়ন পরীক্ষা পোর্টাল কাজ করবে)</span>}
        {status.status === 'unknown' && <span className="text-slate-600">যাচাই করা হচ্ছে…</span>}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        লোকালে: <code className="rounded bg-slate-100 px-1">VITE_API_URL=http://127.0.0.1:8080/api npm run dev</code> — আর backend ফোল্ডারে{' '}
        <code className="rounded bg-slate-100 px-1">php -S 127.0.0.1:8080</code> চালাও। বিস্তারিত: backend/README.md।
      </p>
      <button
        type="button"
        onClick={() => checkConnection().then(setStatus)}
        className="mt-3 inline-flex min-h-[44px] items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        সংযোগ আবার যাচাই করো
      </button>
    </section>
  );
}

const THEMES = [
  ['system', 'সিস্টেম (ডিভাইস অনুযায়ী)'],
  ['light', 'হালকা (Light)'],
  ['dark', 'গাঢ় (Dark)'],
];

export default function SettingsPage({ onSettingsChange }) {
  const [settings, setSettings] = useState(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const historyCount = loadHistory().length;

  function update(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    applyTheme(next.theme);
    onSettingsChange?.(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function doClear() {
    clearHistory();
    setConfirmClear(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">সেটিংস</h1>
        <p className="mt-1 text-sm text-slate-600">
          এই সেটিংসগুলো এই ব্রাউজারে সংরক্ষিত থাকে এবং পরীক্ষা পোর্টালের
          ডিফল্ট হিসেবে ব্যবহৃত হয়।
        </p>
      </section>

      <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label="পরীক্ষার ডিফল্ট">
        <h2 className="text-lg font-bold text-slate-900">পরীক্ষার ডিফল্ট</h2>

        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="def-count">
            ডিফল্ট প্রশ্ন সংখ্যা
          </label>
          <select
            id="def-count"
            value={settings.count}
            onChange={(e) => update({ count: Number(e.target.value) })}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {[5, 10, 20, 25].map((n) => (
              <option key={n} value={n}>
                {n}টি প্রশ্ন
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="def-duration">
            ডিফল্ট সময় (মিনিট)
          </label>
          <input
            id="def-duration"
            type="number"
            min={1}
            max={120}
            value={settings.durationMin}
            onChange={(e) => update({ durationMin: Math.max(1, Math.min(120, Number(e.target.value) || 25)) })}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>

        <div>
          <span className="block text-sm font-semibold text-slate-700">ডিফল্ট নেগেটিভ মার্কিং (প্রতি ভুল উত্তরে)</span>
          <div className="mt-1 flex gap-2">
            {[0, 0.25].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => update({ negative: v })}
                aria-pressed={settings.negative === v}
                className={`min-h-[44px] flex-1 rounded-xl px-4 py-2 text-base font-semibold ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  settings.negative === v
                    ? 'bg-blue-700 text-white ring-blue-700'
                    : 'bg-white text-slate-800 ring-slate-300 hover:bg-slate-50'
                }`}
              >
                {v === 0 ? '০ (নেই)' : '০.২৫'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="theme">
            থিম
          </label>
          <select
            id="theme"
            value={settings.theme}
            onChange={(e) => update({ theme: e.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {THEMES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">
            থিম বদলালে পুরো অ্যাপের রঙ সঙ্গে সঙ্গে বদলে যায়।
          </p>
        </div>

        {saved && (
          <p className="text-sm font-semibold text-green-700" role="status">
            সেটিংস সংরক্ষিত হয়েছে — পরীক্ষা পোর্টালে ডিফল্ট হিসেবে ব্যবহার হবে।
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label="ইতিহাস মোছা">
        <h2 className="text-lg font-bold text-slate-900">পরীক্ষার ইতিহাস মোছো</h2>
        <p className="mt-1 text-sm text-slate-600">
          বর্তমানে সংরক্ষিত পরীক্ষা: {historyCount}টি। মুছে ফেললে প্রোফাইল পাতার
          ইতিহাসও মুছে যাবে — এটি ফেরানো যাবে না।
        </p>
        {!confirmClear ? (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={historyCount === 0}
            className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-900 disabled:opacity-40"
          >
            ইতিহাস মুছে ফেলো
          </button>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={doClear}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-900"
            >
              হ্যাঁ, সব মুছে ফেলো
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="inline-flex min-h-[44px] items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              বাতিল করো
            </button>
          </div>
        )}
        {cleared && (
          <p className="mt-2 text-sm font-semibold text-green-700" role="status">
            ইতিহাস মুছে ফেলা হয়েছে।
          </p>
        )}
      </section>

      <ApiStatusSection />
    </div>
  );
}
