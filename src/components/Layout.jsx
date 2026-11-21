import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { loadProfile } from '../lib/store.js';

const NAV = [
  { to: '/', label: 'ড্যাশবোর্ড', icon: '▦', end: true },
  { to: '/exam-portal', label: 'পরীক্ষা পোর্টাল', icon: '✎' },
  { to: '/aap-portal', label: 'AAP পোর্টাল', icon: '↗' },
  { to: '/profile', label: 'প্রোফাইল', icon: '◉' },
  { to: '/settings', label: 'সেটিংস', icon: '⚙' },
];

function NavItems({ collapsed, onNavigate }) {
  return (
    <nav aria-label="প্রধান নেভিগেশন" className="space-y-1 p-3">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            `flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
              isActive ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`
          }
        >
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center text-base">
            {item.icon}
          </span>
          {!collapsed && <span className="truncate">{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profile = loadProfile();
  const isAap = location.pathname.startsWith('/aap-portal');

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-slate-200 bg-white md:flex ${
          collapsed ? 'w-20' : 'w-64'
        }`}
        aria-label="সাইডবার"
      >
        <div className="flex min-h-[64px] items-center justify-between gap-2 px-4">
          {!collapsed && (
            <button type="button" onClick={() => navigate('/')} className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded">
              <span className="block text-xl font-bold tracking-tight text-teal-800">SP Exam</span>
              <span className="block text-xs text-slate-500">রসায়ন মডেল পরীক্ষা</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'সাইডবার খুলুন' : 'সাইডবার গুটিয়ে নিন'}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>
        <div className="flex-1">
          <NavItems collapsed={collapsed} />
        </div>
        {!collapsed && (
          <div className="border-t border-slate-200 p-4 text-xs leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-700">{profile.name || 'শিক্ষার্থী'}</p>
            <p>লক্ষ্য: {profile.target || 'HSC'}</p>
            <p className="mt-2">AAP-র প্রশ্ন এখানে ব্যবহার করা হয় না — নিজস্ব প্রশ্নব্যাংক।</p>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="flex min-h-[64px] items-center justify-between gap-3 bg-teal-800 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNav((v) => !v)}
              aria-label="মোবাইল নেভিগেশন খুলুন"
              aria-expanded={mobileNav}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-teal-700 text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
            >
              ☰
            </button>
            <div>
              <p className="text-lg font-bold leading-tight">SP Exam</p>
              <p className="hidden text-xs text-teal-100 sm:block">
                রসায়ন মডেল পরীক্ষা — HSC 2026 · নিজস্ব প্রশ্নব্যাংক
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex min-h-[44px] items-center gap-2 rounded-full bg-teal-700 px-3 py-1.5 text-sm font-semibold text-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span aria-hidden="true">◉</span>
            <span className="max-w-[140px] truncate">{profile.name || 'প্রোফাইল'}</span>
          </button>
        </header>

        {/* Mobile nav drawer */}
        {mobileNav && (
          <div className="border-b border-slate-200 bg-white md:hidden">
            <NavItems collapsed={false} onNavigate={() => setMobileNav(false)} />
          </div>
        )}

        {/* Main — full-bleed for the AAP portal, contained for the rest */}
        <main className={isAap ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-6'}>
          <Outlet />
        </main>

        {!isAap && (
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-slate-500">
              <p>
                SP Exam — নিজস্ব প্রশ্নব্যাংক: HSC 2026 সকল বোর্ডের রসায়ন ১ম ও ২য়
                পত্রের ৫০টি প্রশ্ন। AAP Pathshala-র কোনো পাবলিক API নেই; তাদের প্রশ্ন,
                অধ্যায় বা টপিকের ডেটা এই অ্যাপে আনা হয়নি। AAP-র প্রশ্ন ব্যবহার করতে
                লিখিত অনুমতি লাগবে — +880 1710-090043, aapathshala09@gmail.com
              </p>
            </div>
          </footer>
        )}

        {/* Mobile bottom nav */}
        <nav
          aria-label="মোবাইল নেভিগেশন"
          className="sticky bottom-0 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                  isActive ? 'text-teal-700' : 'text-slate-600'
                }`
              }
            >
              <span aria-hidden="true" className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
