import { useState } from 'react';

/**
 * AAP Pathshala connection test.
 * Calls the Vercel Serverless Function /api/aapathshala-test (server-side GET
 * to https://aapathshala.com/exams). No secrets exist or are sent.
 * The honest finding is shown whatever the result is: AAP Pathshala has no
 * public API, so this test only checks reachability — it never fetches
 * questions.
 */
export default function ConnectionTest() {
  const [state, setState] = useState({ status: 'idle' }); // idle | loading | done | error

  async function run() {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/aapathshala-test', { method: 'GET' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(`সার্ভার থেকে সাড়া পাওয়া যায়নি (HTTP ${res.status})`);
      }
      setState({ status: 'done', data });
    } catch (err) {
      setState({
        status: 'error',
        error:
          err?.message ||
          'সংযোগ পরীক্ষা করা যায়নি। লোকাল dev-এ Vercel Serverless Function চলে না — Vercel-এ deploy করলে এই পরীক্ষা কাজ করবে।',
      });
    }
  }

  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5" aria-label="AAP সংযোগ পরীক্ষা">
      <h2 className="text-lg font-bold text-amber-900">AAP Pathshala সংযোগ পরীক্ষা</h2>
      <p className="mt-1 text-sm leading-relaxed text-amber-900">
        aapathshala.com/exams-এ কোনো পাবলিক API, ডেভেলপার ডকুমেন্টেশন বা অনুমোদিত
        ইন্টিগ্রেশন নেই — এটি তদন্তে নিশ্চিত হয়েছে। তাই এই পরীক্ষাটি শুধু সাইটটি
        পৌঁছানো যায় কি না তা যাচাই করে; এটি AAP-র কোনো প্রশ্ন আনে না।
      </p>
      <button
        type="button"
        onClick={run}
        disabled={state.status === 'loading'}
        className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-900 disabled:opacity-60"
      >
        {state.status === 'loading' ? 'পরীক্ষা চলছে…' : 'AAP সংযোগ পরীক্ষা করো'}
      </button>

      {state.status === 'done' && (
        <div className="mt-3 rounded-xl bg-white p-4 text-sm text-slate-800 ring-1 ring-amber-200">
          <p>
            <strong>সাইট পৌঁছানো গেছে:</strong>{' '}
            {state.data.reachable ? `হ্যাঁ (HTTP ${state.data.status ?? '—'})` : 'না'}
          </p>
          <p>
            <strong>পাবলিক API আছে কি:</strong> না — {String(state.data.hasPublicApi)}
          </p>
          <p className="mt-1">{state.data.message}</p>
          <p className="mt-2 text-xs text-slate-500">
            AAP-র প্রশ্ন ব্যবহার করতে লিখিত অনুমতি / পার্টনারশিপ লাগবে — যোগাযোগ:
            +880 1710-090043, aapathshala09@gmail.com
          </p>
        </div>
      )}
      {state.status === 'error' && (
        <div className="mt-3 rounded-xl bg-white p-4 text-sm text-red-800 ring-1 ring-red-200" role="alert">
          <strong>পরীক্ষা করা যায়নি:</strong> {state.error}
          <p className="mt-1 text-slate-700">
            এটি AAP-র প্রশ্ন না থাকার কারণে নয় — Serverless Function-টি এই পরিবেশে
            পৌঁছানো যাচ্ছে না। Vercel-এ deploy করার পর আবার চেষ্টা করো।
          </p>
        </div>
      )}
    </section>
  );
}
