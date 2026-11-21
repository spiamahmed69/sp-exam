# SP Exam — রসায়ন মডেল পরীক্ষা

React + Vite + Tailwind CSS দিয়ে তৈরি, Vercel-এ deploy করার জন্য প্রস্তুত একটি
পরীক্ষার অ্যাপ। AAP Pathshala (aapathshala.com/exams)-এর লেআউট থেকে অনুপ্রাণিত —
বিষয় → অধ্যায় → টপিক বেছে নিয়ে পরীক্ষা, প্রশ্ন সংখ্যা, সময়, নেগেটিভ মার্কিং ও
Second Timer সেটিংস, কাউন্টডাউন টাইমার, প্রশ্ন প্যালেট, জমা দেওয়া ও ফলাফল।

## গুরুত্বপূর্ণ সীমাবদ্ধতা — AAP Pathshala সংযোগ

**AAP Pathshala-র কোনো পাবলিক API, ডেভেলপার ডকুমেন্টেশন, ডেটা এক্সপোর্ট, এমবেড
বা পার্টনারশিপ পেজ নেই।** 2026-11-21 তারিখের তদন্তে (রিপোর্ট:
`~/workspace/research_notes/aapathshala-api-investigation-20261121-0527/report.md`)
সাইট, ফুটার/হেল্প পেজ ও ওয়েব সার্চে কিছুই পাওয়া যায়নি। তাই:

- এই অ্যাপ **AAP-র আসল প্রশ্ন আনতে পারে না** এবং আনেও না — কোনো AAP API
  এন্ডপয়েন্ট বানানো হয়নি, কোনো প্রশ্ন স্ক্র্যাপ করা হয়নি, লগইন/CAPTCHA
  বাইপাস করা হয়নি।
- ড্যাশবোর্ডের **“AAP সংযোগ পরীক্ষা”** বোতামটি শুধু সাইটটি পৌঁছানো যায় কি না
  তা যাচাই করে — Serverless Function `api/aapathshala-test.js` সার্ভার-সাইডে
  `https://aapathshala.com/exams`-এ GET করে `{ reachable, status,
  hasPublicApi: false, message }` JSON ফেরত দেয়। কোনো সিক্রেট নেই, কোনো
  সিক্রেট ফ্রন্টএন্ডে নেই।
- AAP-র প্রশ্ন ব্যবহার করার একমাত্র বৈধ পথ: তাদের সঙ্গে লিখিত অনুমতি /
  পার্টনারশিপ — যোগাযোগ: **+880 1710-090043, aapathshala09@gmail.com**

## প্রশ্নের উৎস (নিজস্ব প্রশ্নব্যাংক — AAP-র নয়)

পরীক্ষা চলে SP-এর নিজস্ব প্রশ্নব্যাংক দিয়ে: **HSC 2026 সকল বোর্ডের রসায়ন
১ম পত্র (কোড ১৭৬, সেট ক) ও ২য় পত্র (কোড ১৭৭, সেট খ)-এর মোট ৫০টি প্রশ্ন**।
প্রশ্ন, অপশন ও সঠিক উত্তর `src/data/chemistry.js`-এ আছে — আগের
Chemistry MCQ Exam অ্যাপের ফাইল
(`~/workspace/your_files/chemistry-mcq-exam-2026/chemistry-mcq-exam-2026.html`)
থেকে অবিকল নেওয়া; নতুন প্রশ্ন বানানো হয়নি।

**ব্যাখ্যা নেই:** মূল প্রশ্নপত্রে কোনো ব্যাখ্যা দেওয়া হয়নি, তাই ফলাফলে শুধু
সঠিক উত্তর দেখানো হয় এবং প্রতিটি পর্যালোচনায় লেখা থাকে “ব্যাখ্যা দেওয়া হয়নি”।

### অধ্যায়/টপিক ম্যাপিং

অধ্যায় ও টপিকের নাম AAP-র পাবলিক /exams ফিল্টার তালিকা থেকে নেওয়া (শুধু
নাম — কোনো AAP ডেটা নয়)। প্রতিটি প্রশ্ন তার বিষয়বস্তু অনুযায়ী সবচেয়ে
মানানসই অধ্যায়/টপিকে ম্যাপ করা হয়েছে; কোথাও মানানসই না হলে “বিবিধ / Mixed”
টপিকে রাখা হয়েছে।

প্রশ্ন আছে (প্রতি পত্রে):
- ১ম পত্র (২৫টি): রাসায়নিক পরিবর্তন ৯, মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন ৬, গুণগত রসায়ন ৫, কর্মমুখী রসায়ন ৪, ল্যাবরেটরির নিরাপদ ব্যবহার ১
- ২য় পত্র (২৫টি): জৈব রসায়ন ৭, তড়িৎ রসায়ন ৬, পরিবেশ রসায়ন ৬, পরিমাণগত রসায়ন ৩, অর্থনৈতিক রসায়ন ৩

প্রশ্ন নেই (ড্যাশবোর্ডে ধূসর/অচল দেখানো হয়, পরীক্ষা শুরু করা যায় না):
- উভয় পত্রে **“রসায়ন – পুরাতন/বিবিধ অধ্যায়”** — ০টি প্রশ্ন।
- জৈব রসায়নের ২১টি টপিকের মধ্যে ১৬টিতে প্রশ্ন নেই (যেমন: অ্যারোমেটিক
  হাইড্রোকার্বন – বেনজিন ও টলুইন, অ্যারোমেটিসিটি, অ্যালকোহল, অ্যালডিহাইড ও
  কিটোন, কার্বক্সিলিক এসিড এস্টার ও অ্যামাইড, গ্লিসারিন ও ফেনল ইত্যাদি)।
  প্রশ্ন আছে শুধু: জৈব যৌগের নামকরণ (২), অ্যালকেন, অ্যালকিন ও অ্যালকাইন (২),
  জৈব যৌগের সমানুতা (১), ইথার ও অ্যামিন (১), নাইটোগ্লিসারিন, TNT এবং ডেটল ও
  প্যারাসিটামল (১)।
- AAP-র তালিকায় ভুল করে আসা “সংযুক্ত কোণের ত্রিকোণমিতিক অনুপাত” (ত্রিকোণমিতি)
  রসায়নের টপিক নয় বলে সিলেক্টরে রাখা হয়নি।

## নতুন: মাল্টি-পেজ অ্যাপ + AAP Pathshala পোর্টাল (2026-11-21)

অ্যাপটি এখন React Router-সহ মাল্টি-পেজ অ্যাপ:

- `/` — **ড্যাশবোর্ড:** পরিসংখ্যান (আসল ব্যাংক থেকে গণনা), কুইক-স্টার্ট কার্ড,
  পরীক্ষা ও AAP পোর্টালের লিংক কার্ড, AAP সংযোগ পরীক্ষা।
- `/exam-portal` — **পরীক্ষা পোর্টাল:** আগের নিজস্ব-প্রশ্নব্যাংকের পরীক্ষা
  (বিষয় → অধ্যায় → টপিক, টাইমার, প্যালেট, ফলাফল)। পরীক্ষা চলাকালীন রুট
  `/exam-portal/exam`, ফলাফল `/exam-portal/results` — ব্রাউজারের Back
  বোতামে পোর্টালে ফেরা যায়।
- `/aap-portal` — **AAP Pathshala পোর্টাল:** আসল
  `https://aapathshala.com/exams` একটি পূর্ণ-ভিউপোর্ট iframe-এ লোড হয় —
  AAP-র কনটেন্ট পুনরায় বানানো বা বদলানো হয়নি, কোনো প্রশ্ন কপি করা হয়নি।
- `/profile` — **প্রোফাইল:** নাম/লক্ষ্য/ফোন localStorage-এ সংরক্ষণ, আর
  সম্পন্ন পরীক্ষার ইতিহাস (তারিখ, পত্র, স্কোর, সঠিক/ভুল/ফাঁকা)।
- `/settings` — **সেটিংস:** ডিফল্ট নেগেটিভ মার্কিং, সময়, প্রশ্ন সংখ্যা,
  থিম (হালকা/গাঢ়/সিস্টেম — আসলেই কাজ করে) ও ইতিহাস মোছা; ডিফল্টগুলো
  পরীক্ষা পোর্টালে প্রযোজ্য হয়।

### AAP iframe সামঞ্জস্য (যাচাইকৃত তথ্য)

`curl -I https://aapathshala.com/exams` (2026-11-21) HTTP 200 ফেরত দেয়,
`X-Frame-Options: ALLOWALL` সহ, এবং কোনো Content-Security-Policy
`frame-ancestors` হেডার নেই — তাই হেডার দিয়ে ফ্রেমিং ব্লক করা হয়নি। তবুও
অ্যাপ কোনো নিরাপত্তা নিয়ম বাইপাস করে না।

- লোডিং: iframe-এর `onLoad` ইভেন্টে লোডিং ইনডিকেটর লুকানো হয়।
- ব্যর্থতা শনাক্তকরণ: `onError`, ২০ সেকেন্ডের নো-লোড টাইমআউট, এবং
  “পেজ লোড হচ্ছে না?” বোতাম। ব্যর্থ হলে পোর্টালের ভেতরেই সুন্দর ফলব্যাক
  স্ক্রিন আসে — “Open AAP Pathshala” বোতাম (নতুন ট্যাবে আসল সাইট) + Reload।
  লোড হয়নি এমন অবস্থায় কখনো “পরীক্ষা লোড হয়েছে” বলা হয় না, AAP-র
  পরীক্ষার কোনো নকল কনটেন্ট দেখানো হয় না।
- AAP-তে লগইন/সেশন লাগলে সেটি তাদের সাইটেই হয় — SP Exam সেই তথ্য দেখতে বা
  সংরক্ষণ করতে পারে না (পোর্টালে এ কথা লেখা আছে)।
- লোকালে iframe-এর আসল রেন্ডারিং যাচাই করা যায়নি — Vercel deploy-এর পর
  ব্রাউজারে পরীক্ষা করতে হবে।

## কী কী আছে

- ড্যাশবোর্ড: বিষয় → অধ্যায় → টপিক, প্রশ্ন সংখ্যা (৫/১০/২০/২৫ — উপলব্ধ
  প্রশ্নের বেশি নয়), সময় (ডিফল্ট ২৫ মিনিট, ১–১২০ পরিবর্তনযোগ্য), নেগেটিভ
  মার্কিং (০ / ০.২৫), Second Timer (চালু থাকলে মোট মার্কের ৫% কাটা)।
- পরীক্ষা: একবারে একটি প্রশ্ন, কাউন্টডাউন (শূন্য হলে অটো-জমা), প্রশ্ন প্যালেট,
  আগের/পরের বোতাম, উত্তর মোছা, জমা দেওয়ার আগে অউত্তরিত সংখ্যাসহ নিশ্চিতকরণ।
  পরীক্ষার মাঝে উত্তর দেখা যায় না।
- ফলাফল: স্কোর, সঠিক/ভুল/ফাঁকা, নেগেটিভ মার্ক, Second Timer কাটা, ব্যয়িত
  সময়, এবং প্রতিটি প্রশ্নের পর্যালোচনা (সঠিক উত্তর বনাম তোমার উত্তর)।

## লোকালে চালানো

```bash
cd ~/workspace/sp-exam
npm install
npm run dev        # http://localhost:5173
npm run build      # production build (dist/)
npm run preview    # build-এর preview
```

নোট: `npm run dev`-এ `/api/aapathshala-test` কাজ করবে না (Vite dev সার্ভারে
Vercel Serverless Function চলে না) — ConnectionTest তখন পরিষ্কার এরর দেখায়।
Vercel-এ deploy করলে বা `vercel dev` চালালে এটি কাজ করে।

## Vercel-এ Deploy

1. এই ফোল্ডারটি GitHub-এ পুশ করো (যেমন `spiamahmed69/sp-exam`)।
2. Vercel Dashboard → Add New → Project → ওই রিপো import করো।
3. Framework: **Vite** (auto-detect হবে), Build Command `npm run build`,
   Output Directory `dist` — `vercel.json`-এ এগুলো দেওয়াই আছে।
4. Environment variable লাগে না। Deploy → লাইভ URL পাবে।
5. Deploy-এর পর ড্যাশবোর্ডের “AAP সংযোগ পরীক্ষা” বোতাম চেপে দেখো — এটি
   `/api/aapathshala-test` থেকে JSON ফেরত দেবে।

## ফাইল গঠন

```
sp-exam/
├── index.html                  # Bengali-first HTML shell
├── package.json                # react, vite, tailwindcss
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json                 # Vite build + /api rewrite + SPA fallback (সব রুট → index.html)
├── api/
│   └── aapathshala-test.js     # Vercel Serverless Function (reachability test only)
└── src/
    ├── main.jsx
    ├── App.jsx                 # BrowserRouter + exam state (routes: /, /exam-portal, /aap-portal, /profile, /settings)
    ├── index.css               # Tailwind + dark-theme overrides
    ├── lib/
    │   ├── exam.js             # filter, shuffle, scoring, time helpers
    │   └── store.js            # localStorage: profile, settings, exam history, theme
    ├── pages/
    │   ├── DashboardPage.jsx   # / overview + stats + link cards
    │   ├── ExamPortal.jsx      # /exam-portal (existing exam selection flow)
    │   ├── AapPortal.jsx       # /aap-portal (original AAP site in a full-viewport iframe + fallback)
    │   ├── ProfilePage.jsx     # /profile (editable profile + exam history)
    │   └── SettingsPage.jsx    # /settings (exam defaults, theme, clear history)
    ├── data/
    │   ├── chemistry.js        # ৫০টি প্রশ্নের নিজস্ব ব্যাংক (JSON)
    │   └── catalog.js          # অধ্যায়/টপিকের নামের তালিকা
    └── components/
        ├── Layout.jsx          # sidebar + header + mobile nav shell
        ├── Dashboard.jsx       # exam selection UI (reused by Exam Portal)
        ├── ConnectionTest.jsx
        ├── Exam.jsx
        └── Results.jsx
```
