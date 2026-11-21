import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Exam from './components/Exam.jsx';
import Results from './components/Results.jsx';
import { PAPERS } from './data/chemistry.js';
import { filterQuestions, scoreExam, shuffled } from './lib/exam.js';

export default function App() {
  const [view, setView] = useState('dashboard'); // dashboard | exam | results
  const [selection, setSelection] = useState({
    paperId: 'paper-1',
    chapter: 'all',
    topic: 'all',
    count: 10,
    durationMin: 25,
    negative: 0.25,
    secondTimer: false,
  });
  const [examQuestions, setExamQuestions] = useState([]);
  const [examAnswers, setExamAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [timeUsedSec, setTimeUsedSec] = useState(0);

  function updateSelection(patch) {
    setSelection((s) => ({ ...s, ...patch }));
  }

  function startExam() {
    const available = filterQuestions(selection.paperId, selection.chapter, selection.topic);
    if (available.length === 0) return;
    const picked = shuffled(available).slice(0, Math.min(selection.count, available.length));
    setExamQuestions(picked);
    setExamAnswers({});
    setExamResult(null);
    setTimeUsedSec(0);
    setView('exam');
    window.scrollTo(0, 0);
  }

  function submitExam(answers, usedSec) {
    const result = scoreExam(examQuestions, answers, {
      negative: selection.negative,
      secondTimer: selection.secondTimer,
    });
    setExamAnswers(answers);
    setExamResult(result);
    setTimeUsedSec(usedSec);
    setView('results');
    window.scrollTo(0, 0);
  }

  const paper = PAPERS.find((p) => p.id === selection.paperId);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-teal-800 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SP Exam</h1>
            <p className="text-sm text-teal-100">রসায়ন মডেল পরীক্ষা — HSC 2026 · নিজস্ব প্রশ্নব্যাংক</p>
          </div>
          <p className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-teal-50">
            AAP Pathshala-র প্রশ্ন এখানে ব্যবহার করা হয় না
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === 'dashboard' && (
          <Dashboard selection={selection} onChange={updateSelection} onStart={startExam} />
        )}
        {view === 'exam' && (
          <Exam
            questions={examQuestions}
            durationMin={selection.durationMin}
            onSubmit={submitExam}
            onExit={() => setView('dashboard')}
          />
        )}
        {view === 'results' && examResult && (
          <Results
            questions={examQuestions}
            answers={examAnswers}
            result={examResult}
            timeUsedSec={timeUsedSec}
            config={{
              negative: selection.negative,
              secondTimer: selection.secondTimer,
              durationMin: selection.durationMin,
              paperTitle: paper?.title || '',
              chapter: selection.chapter,
              topic: selection.topic,
            }}
            onRetake={startExam}
            onDashboard={() => setView('dashboard')}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-slate-500">
          <p>
            SP Exam — নিজস্ব প্রশ্নব্যাংক: HSC 2026 সকল বোর্ডের রসায়ন ১ম ও ২য় পত্রের
            ৫০টি প্রশ্ন। AAP Pathshala-র কোনো পাবলিক API নেই; তাদের প্রশ্ন, অধ্যায় বা
            টপিকের ডেটা এই অ্যাপে আনা হয়নি। AAP-র প্রশ্ন ব্যবহার করতে লিখিত অনুমতি
            লাগবে — +880 1710-090043, aapathshala09@gmail.com
          </p>
        </div>
      </footer>
    </div>
  );
}
