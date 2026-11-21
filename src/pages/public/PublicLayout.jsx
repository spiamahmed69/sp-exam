import { Link, Outlet, useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[64px] max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/home" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white"><GraduationCap size={22} /></span>
            <span><span className="block text-xl font-bold tracking-tight text-blue-800">SP Exam</span>
            <span className="block text-xs text-slate-500">Online Examination Platform</span></span>
          </Link>
          <nav aria-label="Public navigation" className="hidden items-center gap-1 text-sm font-semibold md:flex">
            {[['/home','Home'],['/about','About'],['/features','Features'],['/contact','Contact']].map(([to,label]) => (
              <Link key={to} to={to} className="rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex min-h-[44px] items-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">Dashboard</button>
                <button type="button" onClick={() => { logout(); navigate('/home'); }} className="inline-flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"><LogIn size={16} /> Log in</Link>
                <Link to="/register" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"><UserPlus size={16} /> Register</Link>
              </>
            )}
          </div>
        </div>
        <nav aria-label="Public navigation (mobile)" className="flex justify-center gap-1 border-t border-slate-100 px-4 py-2 text-sm font-semibold md:hidden">
          {[['/home','Home'],['/about','About'],['/features','Features'],['/contact','Contact']].map(([to,label]) => (
            <Link key={to} to={to} className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100">{label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><Outlet /></main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-slate-500">
          <p>SP Exam — online examinations with real accounts, server-timed exams and published results. Question bank: HSC 2026 Chemistry, 50 real MCQs (SP's own bank — AAP Pathshala has no public API; their questions are not used here).</p>
        </div>
      </footer>
    </div>
  );
}
