import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, ClipboardCheck, ShieldCheck, Timer, Trophy, Users } from 'lucide-react';
import { api } from '../../lib/api.js';
import BackendBanner from '../../components/BackendBanner.jsx';
import { Card, Skeleton } from '../../components/ui.jsx';

const FEATURES = [
  { icon: <Timer size={22} />, title: 'Server-timed exams', body: 'The countdown runs on the server. Time expiring auto-submits — the browser timer can never be trusted or tampered with.' },
  { icon: <ShieldCheck size={22} />, title: 'Secure by design', body: 'Hashed passwords, server-side sessions, role checks on every request, and correct answers never sent to students before results are published.' },
  { icon: <ClipboardCheck size={22} />, title: 'MCQ + CQ marking', body: 'MCQs are scored automatically with negative marking. CQ answers wait for manual teacher evaluation before the result is final.' },
  { icon: <Trophy size={22} />, title: 'Results & leaderboard', body: 'Results appear only after a teacher publishes them. The leaderboard ranks published results with anonymised names.' },
  { icon: <Users size={22} />, title: 'Three roles', body: 'Students take exams, teachers build and mark them, admins approve accounts and watch platform activity.' },
  { icon: <BookOpenCheck size={22} />, title: 'Real question bank', body: 'HSC 2026 Chemistry 1st & 2nd Paper — 50 real MCQs, 25 per paper, with chapter and topic mapping.' },
];

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [statsState, setStatsState] = useState('loading'); // loading | ok | unavailable
  useEffect(() => {
    Promise.allSettled([api.get('/exams'), api.get('/announcements')]).then(([e, a]) => {
      if (e.status === 'fulfilled') {
        setStats({ exams: e.value.exams?.length ?? 0, announcements: a.status === 'fulfilled' ? a.value.announcements?.length ?? 0 : 0 });
        setStatsState('ok');
      } else setStatsState('unavailable');
    });
  }, []);
  return (
    <div className="space-y-10">
      <BackendBanner />
      <section className="rounded-2xl bg-blue-700 p-6 text-white shadow-sm sm:p-10">
        <p className="text-sm font-semibold text-blue-100">SP Exam · Online Examination Platform</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Take exams online. Get results you can trust.</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-blue-100">
          Register as a student, join a published exam, answer under a server-timed countdown, and see your
          result when your teacher publishes it. Teachers create MCQ and CQ exams; admins keep the platform safe.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/register" className="inline-flex min-h-[48px] items-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-800 hover:bg-blue-50">Create a free account</Link>
          <Link to="/exams" className="inline-flex min-h-[48px] items-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white ring-1 ring-blue-400 hover:bg-blue-500">Browse exams</Link>
          <Link to="/exam-portal" className="inline-flex min-h-[48px] items-center rounded-xl bg-blue-800 px-6 py-3 text-sm font-bold text-white ring-1 ring-blue-500 hover:bg-blue-900">Try the offline Chemistry exam</Link>
        </div>
      </section>

      <section aria-label="Platform statistics">
        {statsState === 'loading' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : statsState === 'ok' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card><p className="text-2xl font-bold tabular-nums text-blue-700">{stats.exams}</p><p className="mt-1 text-sm text-slate-600">Published exams (live from the API)</p></Card>
            <Card><p className="text-2xl font-bold tabular-nums text-blue-700">50</p><p className="mt-1 text-sm text-slate-600">Real Chemistry MCQs in the bank</p></Card>
            <Card><p className="text-2xl font-bold tabular-nums text-blue-700">{stats.announcements}</p><p className="mt-1 text-sm text-slate-600">Announcements (live from the API)</p></Card>
          </div>
        ) : (
          <Card><p className="text-sm font-semibold text-slate-800">Live statistics are unavailable — the backend is not connected.</p>
          <p className="mt-1 text-sm text-slate-600">Connect the PHP API (see backend/README.md) to see real exam counts here. No numbers are shown until they come from real data.</p></Card>
        )}
      </section>

      <section aria-label="How it works">
        <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[['1. Register', 'Create a student account. Teacher accounts are approved by an admin before they can publish exams.'], ['2. Join an exam', 'Open a published exam, read the instructions, and start. The server starts your countdown.'], ['3. See your result', 'Submit — or let time auto-submit for you. Your result appears once your teacher publishes it.']].map(([h, b]) => (
            <Card key={h}><h3 className="text-lg font-bold text-slate-900">{h}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{b}</p></Card>
          ))}
        </div>
      </section>

      <section aria-label="Features">
        <h2 className="text-2xl font-bold text-slate-900">Why SP Exam</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{f.icon}</span>
              <h3 className="mt-3 text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
        <h2 className="text-2xl font-bold">Ready to take your first exam?</h2>
        <p className="mt-2 text-sm text-slate-300">HSC Chemistry 1st & 2nd Paper model exams are waiting — 25 questions, 25 minutes each.</p>
        <Link to="/register" className="mt-5 inline-flex min-h-[48px] items-center rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700">Register now</Link>
      </section>
    </div>
  );
}
