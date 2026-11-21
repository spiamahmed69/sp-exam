import { Link } from 'react-router-dom';
import { PAPERS, TOTAL_QUESTIONS } from '../data/chemistry.js';
import { chaptersWithCounts } from '../lib/exam.js';
import { loadHistory } from '../lib/store.js';
import ConnectionTest from '../components/ConnectionTest.jsx';

export default function DashboardPage() {
  const history = loadHistory();
  const chaptersWithQ = PAPERS.flatMap((p) => chaptersWithCounts(p.id)).filter((c) => c.count > 0);
  const best = history.reduce((m, h) => Math.max(m, h.score ?? 0), 0);
  const totalMarks = history.reduce((s, h) => s + (h.totalMarks ?? 0), 0);

  const cards = [
    {
      to: '/exam-portal',
      title: 'পরীক্ষা পোর্টাল',
      desc: 'নিজস্ব প্রশ্নব্যাংক দিয়ে বিষয় → অধ্যায় → টপিক বেছে পরীক্ষা দাও — টাইমার, নেগেটিভ মার্কিং, ফলাফলসহ।',
      cta: 'পরীক্ষা শুরু করো',
    },
    {
      to: '/aap-portal',
      title: 'AAP Pathshala পোর্টাল',
      desc: 'আসল aapathshala.com/exams সাইটটি SP Exam-এর ভেতরে খুলবে — তাদের নিজস্ব পরীক্ষার ইন্টারফেস, কোনো নকল কপি নয়।',
      cta: 'AAP পোর্টাল খুলুন',
    },
    {
      to: '/profile',
      title: 'প্রোফাইল',
      desc: 'তোমার নাম, লক্ষ্য পরীক্ষা ও আগের পরীক্ষাগুলোর ইতিহাস দেখো।',
      cta: 'প্রোফাইল দেখুন',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-teal-800 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-teal-100">SP Exam · HSC 2026</p>
        <h1 className="mt-1 text-2xl font-bold leading-snug sm:text-3xl">
          রসায়ন মডেল পরীক্ষা — নিজের গতিতে, নিজের প্রশ্নব্যাংকে
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-teal-100">
          বিষয়, অধ্যায় ও টপিক বেছে পরীক্ষা দাও। পরীক্ষা শেষ হলেই স্কোর, সঠিক/ভুল
          হিসাব ও প্রতিটি প্রশ্নের সঠিক উত্তর দেখতে পাবে।
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/exam-portal"
            className="inline-flex min-h-[48px] items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-teal-800 hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            এখনই পরীক্ষা দাও
          </Link>
          <Link
            to="/aap-portal"
            className="inline-flex min-h-[48px] items-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-teal-500 hover:bg-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            AAP Pathshala পোর্টাল
          </Link>
        </div>
      </section>

      {/* Stats — computed from the real local bank and real local history */}
      <section aria-label="পরিসংখ্যান" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { value: `${TOTAL_QUESTIONS}টি`, label: 'নিজস্ব প্রশ্ন' },
          { value: '২টি', label: 'পত্র (১ম ও ২য়)' },
          { value: `${chaptersWithQ.length}টি`, label: 'প্রশ্ন আছে এমন অধ্যায়' },
          {
            value: history.length === 0 ? '—' : `${history.length}টি`,
            label: history.length === 0 ? 'এখনো পরীক্ষা দাওনি' : `পরীক্ষা দেওয়া হয়েছে · সেরা ${best}`,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-2xl font-bold tabular-nums text-teal-700">{s.value}</p>
            <p className="mt-1 text-xs text-slate-600">{s.label}</p>
          </div>
        ))}
      </section>
      {history.length > 0 && (
        <p className="text-sm text-slate-600">
          মোট মার্ক {totalMarks} এর মধ্যে এখন পর্যন্ত সেরা স্কোর {best}।
        </p>
      )}

      {/* Honest AAP notice */}
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

      {/* Link cards */}
      <section className="grid gap-4 md:grid-cols-3" aria-label="পাতাগুলো">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group flex min-h-[44px] flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <h2 className="text-lg font-bold text-slate-900">{c.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{c.desc}</p>
            <span className="mt-4 text-sm font-bold text-teal-700 group-hover:text-teal-800">
              {c.cta} →
            </span>
          </Link>
        ))}
      </section>

      {/* Papers */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label="পত্রসমূহ">
        <h2 className="text-lg font-bold text-slate-900">পত্রসমূহ</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {PAPERS.map((p) => (
            <li key={p.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
              <span>
                {p.title} — কোড {p.code}, সেট {p.set}
              </span>
              <strong>{p.questions.length}টি প্রশ্ন</strong>
            </li>
          ))}
        </ul>
      </section>

      <ConnectionTest />
    </div>
  );
}
