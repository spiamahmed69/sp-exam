import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Exam from './components/Exam.jsx';
import Results from './components/Results.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ExamPortal from './pages/ExamPortal.jsx';
import AapPortal from './pages/AapPortal.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import { PAPERS } from './data/chemistry.js';
import { filterQuestions, scoreExam, shuffled } from './lib/exam.js';
import { applyTheme, loadSettings, recordResult } from './lib/store.js';

function Shell() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => loadSettings());
  const [selection, setSelection] = useState(() => ({
    paperId: 'paper-1',
    chapter: 'all',
    topic: 'all',
    count: loadSettings().count,
    durationMin: loadSettings().durationMin,
    negative: loadSettings().negative,
    secondTimer: false,
  }));
  const [examQuestions, setExamQuestions] = useState([]);
  const [examAnswers, setExamAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [timeUsedSec, setTimeUsedSec] = useState(0);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  function updateSelection(patch) {
    setSelection((s) => ({ ...s, ...patch }));
  }

  function applySettings(next) {
    setSettings(next);
    // Settings are the exam defaults: apply them to the next exam.
    setSelection((s) => ({
      ...s,
      count: next.count,
      durationMin: next.durationMin,
      negative: next.negative,
    }));
  }

  function startExam() {
    const available = filterQuestions(selection.paperId, selection.chapter, selection.topic);
    if (available.length === 0) return;
    const picked = shuffled(available).slice(0, Math.min(selection.count, available.length));
    setExamQuestions(picked);
    setExamAnswers({});
    setExamResult(null);
    setTimeUsedSec(0);
    navigate('/exam-portal/exam');
    window.scrollTo(0, 0);
  }

  function submitExam(answers, usedSec) {
    const result = scoreExam(examQuestions, answers, {
      negative: selection.negative,
      secondTimer: selection.secondTimer,
    });
    const paper = PAPERS.find((p) => p.id === selection.paperId);
    setExamAnswers(answers);
    setExamResult(result);
    setTimeUsedSec(usedSec);
    // Real local exam history (profile page reads this).
    recordResult({
      date: new Date().toISOString(),
      paperTitle: paper?.title || '',
      chapter: selection.chapter,
      topic: selection.topic,
      score: Number(result.score.toFixed(2)),
      totalMarks: result.totalMarks,
      correct: result.correct,
      wrong: result.wrong,
      blank: result.blank,
      timeUsedSec: usedSec,
    });
    navigate('/exam-portal/results');
    window.scrollTo(0, 0);
  }

  const paper = PAPERS.find((p) => p.id === selection.paperId);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="exam-portal"
          element={<ExamPortal selection={selection} onChange={updateSelection} onStart={startExam} />}
        />
        <Route
          path="exam-portal/exam"
          element={
            examQuestions.length === 0 ? (
              <Navigate to="/exam-portal" replace />
            ) : (
              <Exam
                questions={examQuestions}
                durationMin={selection.durationMin}
                onSubmit={submitExam}
                onExit={() => navigate('/exam-portal')}
              />
            )
          }
        />
        <Route
          path="exam-portal/results"
          element={
            !examResult ? (
              <Navigate to="/exam-portal" replace />
            ) : (
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
                onDashboard={() => navigate('/exam-portal')}
              />
            )
          }
        />
        <Route path="aap-portal" element={<AapPortal />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage onSettingsChange={applySettings} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
