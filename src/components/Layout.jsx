import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Bell, BookOpen, ClipboardList, Database, FileText, GraduationCap,
  History, Home, Languages, LayoutDashboard, LogIn, LogOut, Menu, PanelLeftClose,
  PanelLeftOpen, ScrollText, Settings, ShieldCheck, Trophy, User, Users,
  ClipboardCheck, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { loadProfile } from '../lib/store.js';
import { getLang, setLang, t } from '../lib/i18n.js';

function navFor(user) {
  const items = [
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, end: true },
    { to: '/exams', label: t('exams'), icon: BookOpen },
    { to: '/results', label: t('results'), icon: FileText },
    { to: '/history', label: t('history'), icon: History },
    { to: '/leaderboard', label: t('leaderboard'), icon: Trophy },
    { to: '/exam-portal', label: t('examPortal'), icon: ClipboardList },
    { to: '/aap-portal', label: t('aapPortal'), icon: ExternalLink },
  ];
  if (user?.role === 'teacher' || user?.role === 'admin') {
    items.push(
      { to: '/teacher', label: t('teacher'), icon: GraduationCap },
      { to: '/teacher/exams', label: t('myExams'), icon: BookOpen },
      { to: '/teacher/submissions', label: t('submissions'), icon: ClipboardCheck },
      { to: '/teacher/results', label: t('results'), icon: FileText },
    );
  }
  if (user?.role === 'admin') {
    items.push(
      { to: '/admin', label: t('admin'), icon: ShieldCheck },
      { to: '/admin/users', label: t('users'), icon: Users },
      { to: '/admin/exams', label: t('exams'), icon: BookOpen },
      { to: '/admin/subjects', label: t('subjects'), icon: BarChart3 },
      { to: '/admin/announcements', label: t('announcements'), icon: Bell },
      { to: '/admin/reports', label: t('reports'), icon: BarChart3 },
      { to: '/admin/audit-logs', label: t('auditLogs'), icon: ScrollText },
      { to: '/admin/backup', label: t('backup'), icon: Database },
    );
  }
  items.push(
    { to: '/profile', label: t('profile'), icon: User },
    { to: '/settings', label: t('settings'), icon: Settings },
  );
  return items;
}

const MOBILE_NAV = [
  { to: '/dashboard', label: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/exams', label: 'exams', icon: BookOpen },
  { to: '/exam-portal', label: 'examPortal', icon: ClipboardList },
  { to: '/results', label: 'results', icon: FileText },
  { to: '/profile', label: 'profile', icon: User },
];

function NavItems({ items, collapsed, onNavigate }) {
  return (
    <nav aria-label="Main navigation" className="space-y-1 p-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isActive ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center">
              <Icon size={18} />
            </span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [lang, setLangState] = useState(getLang());
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const profile = loadProfile();
  const isAap = location.pathname.startsWith('/aap-portal');
  const items = navFor(user);

  function toggleLang() {
    const next = lang === 'en' ? 'bn' : 'en';
    setLang(next);
    setLangState(next);
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside
        className={`hidden shrink-0 flex-col border-r border-slate-200 bg-white md:flex ${collapsed ? 'w-20' : 'w-64'}`}
        aria-label="Sidebar"
      >
        <div className="flex min-h-[64px] items-center justify-between gap-2 px-4">
          {!collapsed && (
            <button type="button" onClick={() => navigate(user ? '/dashboard' : '/home')} className="rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <span className="block text-xl font-bold tracking-tight text-blue-800">SP Exam</span>
              <span className="block text-xs text-slate-500">Online Examination Platform</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavItems items={items} collapsed={collapsed} />
        </div>
        {!collapsed && (
          <div className="border-t border-slate-200 p-4 text-xs leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-700">{user?.name || profile.name || 'Guest'}</p>
            <p>{user ? `${user.role} · ${user.email}` : 'Not signed in — offline Chemistry exam still works.'}</p>
            <p className="mt-2">AAP questions are not used here — SP's own question bank.</p>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[64px] items-center justify-between gap-3 bg-blue-800 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNav((v) => !v)}
              aria-label="Open mobile navigation"
              aria-expanded={mobileNav}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-lg font-bold leading-tight">SP Exam</p>
              <p className="hidden text-xs text-blue-100 sm:block">Online Examination Platform · HSC Chemistry model exams</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              aria-label="Switch language / ভাষা বদলান"
              className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-blue-700 px-3 py-1.5 text-sm font-semibold text-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Languages size={16} /> {lang === 'en' ? 'বাংলা' : 'EN'}
            </button>
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="flex min-h-[44px] items-center gap-2 rounded-full bg-blue-700 px-3 py-1.5 text-sm font-semibold text-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <User size={16} />
                  <span className="max-w-[140px] truncate">{user.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { logout(); navigate('/home'); }}
                  aria-label="Log out"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-blue-700 text-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <LogIn size={16} /> Log in
              </button>
            )}
          </div>
        </header>

        {mobileNav && (
          <div className="border-b border-slate-200 bg-white md:hidden">
            <NavItems items={items} collapsed={false} onNavigate={() => setMobileNav(false)} />
          </div>
        )}

        <main className={isAap ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-6'}>
          <Outlet />
        </main>

        {!isAap && (
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-slate-500">
              <p>
                SP Exam — own question bank: HSC 2026 Chemistry 1st & 2nd Paper, 50 questions.
                AAP Pathshala has no public API; their questions, chapters and topics were not
                imported. Written permission is needed to use AAP questions — +880 1710-090043,
                aapathshala09@gmail.com
              </p>
              <p className="mt-2">
                <Link to="/home" className="font-semibold text-blue-700 underline">Home</Link>
                {' · '}
                <Link to="/about" className="font-semibold text-blue-700 underline">About</Link>
                {' · '}
                <Link to="/features" className="font-semibold text-blue-700 underline">Features</Link>
                {' · '}
                <Link to="/contact" className="font-semibold text-blue-700 underline">Contact</Link>
              </p>
            </div>
          </footer>
        )}

        <nav aria-label="Mobile navigation" className="sticky bottom-0 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isActive ? 'text-blue-700' : 'text-slate-600'
                  }`
                }
              >
                <Icon size={20} />
                {t(item.label)}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
