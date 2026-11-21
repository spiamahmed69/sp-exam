import { Card } from '../../components/ui.jsx';
export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">About SP Exam</h1>
      <Card>
        <p className="leading-relaxed text-slate-700">SP Exam is a complete online examination platform: real accounts, three roles (student, teacher, admin), a PHP + JSON backend, server-timed exams, automatic MCQ scoring with negative marking, manual CQ evaluation, published results and a leaderboard.</p>
        <p className="mt-3 leading-relaxed text-slate-700">It started as a Chemistry model-exam app built on SP's own question bank — HSC 2026 Chemistry 1st Paper (Code 176, Set ক) and 2nd Paper (Code 177, Set খ), 50 MCQs in total. That bank is still the heart of the platform, and the offline exam portal still works without any backend.</p>
        <p className="mt-3 leading-relaxed text-slate-700">The platform is honest about what it does not do: it does not fetch questions from AAP Pathshala, which has no public API. AAP's own site is available inside SP Exam only as an embedded portal, unchanged.</p>
      </Card>
      <Card>
        <h2 className="text-lg font-bold text-slate-900">What the platform guarantees</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li>The server decides the time, the score and the result — never the browser.</li>
          <li>Correct answers are never sent to a student before the result is published.</li>
          <li>No fake statistics: every number on a dashboard comes from stored data, or the page says so.</li>
          <li>All data lives in JSON files on the PHP host — no paid database is required.</li>
        </ul>
      </Card>
    </div>
  );
}
