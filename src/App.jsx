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
import { AuthProvider, ProtectedRoute, RequireRole } from './lib/auth.jsx';
import { ToastProvider } from './components/ui.jsx';
// Public pages
import PublicLayout from './pages/public/PublicLayout.jsx';
import HomePage from './pages/public/HomePage.jsx';
import AboutPage from './pages/public/AboutPage.jsx';
import FeaturesPage from './pages/public/FeaturesPage.jsx';
import ContactPage from './pages/public/ContactPage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import RegisterPage from './pages/public/RegisterPage.jsx';
// Student (API) pages
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import ExamsPage from './pages/student/ExamsPage.jsx';
import ExamInstructionsPage from './pages/student/ExamInstructionsPage.jsx';
import OnlineExamPage from './pages/student/OnlineExamPage.jsx';
import ResultsPage from './pages/student/ResultsPage.jsx';
import HistoryPage from './pages/student/HistoryPage.jsx';
import LeaderboardPage from './pages/student/LeaderboardPage.jsx';
// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx';
import TeacherExams from './pages/teacher/TeacherExams.jsx';
import CreateExam from './pages/teacher/CreateExam.jsx';
import QuestionManager from './pages/teacher/QuestionManager.jsx';
import SubmissionsPage from './pages/teacher/SubmissionsPage.jsx';
import EvaluatePage from './pages/teacher/EvaluatePage.jsx';
import TeacherResults from './pages/teacher/TeacherResults.jsx';
// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminExams from './pages/admin/AdminExams.jsx';
import AdminSubjects from './pages/admin/AdminSubjects.jsx';
import AdminAnnouncements from './pages/admin/AdminAnnouncements.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';
import AdminBackup from './pages/admin/AdminBackup.jsx';

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
      {/* Public site (no login needed) */}
      <Route element={<PublicLayout />}>
        <Route path="home" element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      {/* App shell — existing local exam flow kept intact, plus API pages */}
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

        {/* Student (API) */}
        <Route path="dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
        <Route path="exams" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
        <Route path="exams/:id" element={<ProtectedRoute><ExamInstructionsPage /></ProtectedRoute>} />
        <Route path="exam/:attemptId" element={<ProtectedRoute><OnlineExamPage /></ProtectedRoute>} />
        <Route path="results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />

        {/* Teacher (API) */}
        <Route path="teacher" element={<RequireRole roles={['teacher', 'admin']}><TeacherDashboard /></RequireRole>} />
        <Route path="teacher/exams" element={<RequireRole roles={['teacher', 'admin']}><TeacherExams /></RequireRole>} />
        <Route path="teacher/exams/new" element={<RequireRole roles={['teacher', 'admin']}><CreateExam /></RequireRole>} />
        <Route path="teacher/exams/:id/questions" element={<RequireRole roles={['teacher', 'admin']}><QuestionManager /></RequireRole>} />
        <Route path="teacher/submissions" element={<RequireRole roles={['teacher', 'admin']}><SubmissionsPage /></RequireRole>} />
        <Route path="teacher/evaluate/:resultId" element={<RequireRole roles={['teacher', 'admin']}><EvaluatePage /></RequireRole>} />
        <Route path="teacher/results" element={<RequireRole roles={['teacher', 'admin']}><TeacherResults /></RequireRole>} />

        {/* Admin (API) */}
        <Route path="admin" element={<RequireRole roles={['admin']}><AdminDashboard /></RequireRole>} />
        <Route path="admin/users" element={<RequireRole roles={['admin']}><AdminUsers /></RequireRole>} />
        <Route path="admin/teachers" element={<RequireRole roles={['admin']}><AdminUsers roleFilter="teacher" /></RequireRole>} />
        <Route path="admin/students" element={<RequireRole roles={['admin']}><AdminUsers roleFilter="student" /></RequireRole>} />
        <Route path="admin/exams" element={<RequireRole roles={['admin']}><AdminExams /></RequireRole>} />
        <Route path="admin/subjects" element={<RequireRole roles={['admin']}><AdminSubjects /></RequireRole>} />
        <Route path="admin/announcements" element={<RequireRole roles={['admin']}><AdminAnnouncements /></RequireRole>} />
        <Route path="admin/reports" element={<RequireRole roles={['admin']}><AdminReports /></RequireRole>} />
        <Route path="admin/settings" element={<RequireRole roles={['admin']}><AdminSettings /></RequireRole>} />
        <Route path="admin/audit-logs" element={<RequireRole roles={['admin']}><AdminAuditLogs /></RequireRole>} />
        <Route path="admin/backup" element={<RequireRole roles={['admin']}><AdminBackup /></RequireRole>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
