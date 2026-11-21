// Minimal EN/BN strings for the main nav and dashboard headings.
// Bengali Chemistry content itself stays Bengali; this toggle covers the
// app chrome (nav, headings, common actions) where feasible.
const STRINGS = {
  en: {
    dashboard: 'Dashboard', exams: 'Exams', examPortal: 'Exam Portal', aapPortal: 'AAP Portal',
    results: 'Results', history: 'History', leaderboard: 'Leaderboard', profile: 'Profile',
    settings: 'Settings', teacher: 'Teacher', admin: 'Admin', login: 'Log in', register: 'Register',
    logout: 'Log out', home: 'Home', about: 'About', features: 'Features', contact: 'Contact',
    myExams: 'My Exams', submissions: 'Submissions', users: 'Users', subjects: 'Subjects',
    announcements: 'Announcements', reports: 'Reports', auditLogs: 'Audit Logs', backup: 'Backup',
    teachers: 'Teachers', students: 'Students',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড', exams: 'পরীক্ষা', examPortal: 'পরীক্ষা পোর্টাল', aapPortal: 'AAP পোর্টাল',
    results: 'ফলাফল', history: 'ইতিহাস', leaderboard: 'লিডারবোর্ড', profile: 'প্রোফাইল',
    settings: 'সেটিংস', teacher: 'শিক্ষক', admin: 'অ্যাডমিন', login: 'লগইন', register: 'রেজিস্টার',
    logout: 'লগ আউট', home: 'হোম', about: 'সম্পর্কে', features: 'সুবিধা', contact: 'যোগাযোগ',
    myExams: 'আমার পরীক্ষা', submissions: 'জমা', users: 'ব্যবহারকারী', subjects: 'বিষয়',
    announcements: 'ঘোষণা', reports: 'রিপোর্ট', auditLogs: 'অডিট লগ', backup: 'ব্যাকআপ',
    teachers: 'শিক্ষক', students: 'শিক্ষার্থী',
  },
};

export function getLang() {
  try {
    return localStorage.getItem('sp-exam:lang') === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}
export function setLang(l) {
  try {
    localStorage.setItem('sp-exam:lang', l);
  } catch { /* ignore */ }
}
export function t(key) {
  const lang = getLang();
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
}
