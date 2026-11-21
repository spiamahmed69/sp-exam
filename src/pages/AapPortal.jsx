import { useEffect, useRef, useState } from 'react';

const AAP_URL = 'https://aapathshala.com/exams';
const LOAD_TIMEOUT_MS = 20000;

/**
 * AAP Pathshala Exam Portal.
 *
 * The ORIGINAL https://aapathshala.com/exams loads unchanged inside an iframe.
 * No AAP content is recreated, modified or copied; no security restriction is
 * bypassed. Headers (verified 2026-11-21): X-Frame-Options: ALLOWALL, and no
 * Content-Security-Policy frame-ancestors header — framing is not blocked.
 *
 * Failure detection: iframe onLoad marks success; onError, a 20-second
 * no-load timeout, or the user's own "isn't loading?" action shows the
 * fallback screen with Open AAP Pathshala (new tab) + Reload. The app never
 * claims the exam is loaded when it is not, and never simulates AAP content.
 */
export default function AapPortal() {
  const [status, setStatus] = useState('loading'); // loading | loaded | failed
  const [frameKey, setFrameKey] = useState(0);
  const loadedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    loadedRef.current = false;
    setStatus('loading');
    timerRef.current = setTimeout(() => {
      if (!loadedRef.current) setStatus('failed');
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timerRef.current);
  }, [frameKey]);

  function onLoad() {
    loadedRef.current = true;
    clearTimeout(timerRef.current);
    setStatus('loaded');
  }

  function reload() {
    clearTimeout(timerRef.current);
    setFrameKey((k) => k + 1);
  }

  function markFailed() {
    clearTimeout(timerRef.current);
    setStatus('failed');
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Portal toolbar — SP Exam chrome, outside the frame */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
            AAP Pathshala Exam Portal
          </h1>
          <p className="text-xs leading-relaxed text-slate-500">
            আসল পরীক্ষা চলছে aapathshala.com-এ, এই ফ্রেমের ভেতরে। AAP-তে লগইন বা
            সেশন লাগলে সেটি তাদের সাইটেই হবে — SP Exam তোমার AAP লগইন তথ্য দেখতে
            বা সংরক্ষণ করতে পারে না।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reload}
            className="inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            ↻ Reload
          </button>
          <a
            href={AAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-900"
          >
            Open AAP Pathshala ↗
          </a>
        </div>
      </div>

      {/* Status line */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-2 text-xs text-slate-600">
        <span role="status">
          {status === 'loading' && 'AAP Pathshala লোড হচ্ছে…'}
          {status === 'loaded' && 'AAP Pathshala লোড হয়েছে — পরীক্ষা তাদের সাইটে চলছে।'}
          {status === 'failed' && 'AAP Pathshala এমবেড করা যায়নি — নিচে বিকল্প দেখো।'}
        </span>
        {status === 'loading' && (
          <button
            type="button"
            onClick={markFailed}
            className="min-h-[44px] rounded-lg px-3 py-1.5 font-semibold text-teal-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            পেজ লোড হচ্ছে না?
          </button>
        )}
      </div>

      {/* Frame area — full available viewport, no extra margins */}
      <div className="relative min-h-0 flex-1">
        {status === 'loading' && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white p-6 text-center"
            role="status"
            aria-label="লোড হচ্ছে"
          >
            <div
              aria-hidden="true"
              className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-700"
            />
            <p className="text-sm font-semibold text-slate-800">AAP Pathshala লোড হচ্ছে…</p>
            <p className="max-w-md text-xs leading-relaxed text-slate-500">
              আসল aapathshala.com/exams পেজটি খুলছে। কিছুক্ষণ সময় লাগতে পারে।
            </p>
          </div>
        )}

        {status === 'failed' ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-white p-6 text-center">
            <p className="text-4xl" aria-hidden="true">↗</p>
            <h2 className="text-xl font-bold text-slate-900">
              AAP Pathshala এখানে খোলা যায়নি
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-slate-600">
              আসল aapathshala.com/exams সাইটটি এই ফ্রেমে লোড হয়নি — হয়তো নেটওয়ার্ক
              সমস্যা, অথবা ব্রাউজার/সাইটের নিরাপত্তা নিয়মে এমবেড আটকে গেছে। SP Exam
              কোনো নিরাপত্তা নিয়ম বাইপাস করে না, আর AAP-র পরীক্ষার কোনো নকল কপিও
              দেখাবে না। নিচের বোতামে আসল সাইটটি নতুন ট্যাবে খুলে পরীক্ষা দাও।
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <a
                href={AAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-900"
              >
                Open AAP Pathshala ↗
              </a>
              <button
                type="button"
                onClick={reload}
                className="inline-flex min-h-[48px] items-center rounded-xl px-6 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                আবার চেষ্টা করো
              </button>
            </div>
            <p className="text-xs text-slate-500">
              ঠিকানা: https://aapathshala.com/exams
            </p>
          </div>
        ) : (
          <iframe
            key={frameKey}
            title="AAP Pathshala — আসল পরীক্ষার পেজ"
            src={AAP_URL}
            className="absolute inset-0 h-full w-full border-0 bg-white"
            onLoad={onLoad}
            onError={markFailed}
            allowFullScreen
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
}
