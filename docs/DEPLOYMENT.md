# SP Exam — Deployment Guide

Nothing below has been deployed yet. These are the exact steps that remain.

## 1. Frontend — Vercel

1. Push this folder to GitHub (e.g. `spiamahmed69/sp-exam`). Note the
   known limitation: GitHub API repo creation / pushes have repeatedly
   failed with 403 for this user; creating the repo and uploading via the
   GitHub website has been the working path.
2. Vercel Dashboard → Add New → Project → import the repo.
3. Framework: **Vite** (auto-detected). Build command `npm run build`,
   output directory `dist` — both already in `vercel.json`.
4. **Environment variable (required for online mode):**
   `VITE_API_URL=https://<your-infinityfree-domain>/spexam-api/api`
   (no trailing slash). Without it the app runs in local/offline mode
   and shows a "Backend not connected" banner — the offline Chemistry
   exam portal still works.
5. Deploy. The SPA fallback is already configured in `vercel.json`
   (every route → `index.html`); `/api/aapathshala-test` is the existing
   Vercel serverless reachability check and is unrelated to the PHP API.

### Netlify (alternative)

Build command `npm run build`, publish directory `dist`, same
`VITE_API_URL` variable. Add a `_redirects` file with
`/*  /index.html  200` if the SPA fallback is needed (not included —
Vercel is the tested path).

## 2. Backend — InfinityFree (PHP hosting)

1. Open the InfinityFree account already in use for the other SP sites
   (the `su4849363@gmail.com` account, domain `spproject.great-site.net`).
2. Upload the `backend/` folder as a **new** folder `htdocs/spexam-api/`
   — do not upload into `school/`, `collage/`, `spcollage/`,
   `sprestaurant/` or `banglarestaurant/`.
3. Confirm the files arrived: `htdocs/spexam-api/api/index.php`,
   `htdocs/spexam-api/config/config.php`, `htdocs/spexam-api/data/`,
   `htdocs/spexam-api/.htaccess`.
4. Verify the API answers:
   `https://spproject.great-site.net/spexam-api/api/health`
   → `{"success":true,"data":{"status":"ok",…}}`
   (First request seeds users/exams/questions automatically.)
5. Log in as `admin@sp-exam.local` / `Admin123!` and **change all three
   seed passwords immediately**.
6. Set `VITE_API_URL=https://spproject.great-site.net/spexam-api/api`
   in Vercel and redeploy the frontend.

## 3. Local development (already tested)

```bash
# Terminal 1 — PHP API
cd ~/workspace/sp-exam/backend
php -S 127.0.0.1:8080

# Terminal 2 — frontend
cd ~/workspace/sp-exam
VITE_API_URL=http://127.0.0.1:8080/api npm run dev   # http://localhost:5173
```

Test accounts: `admin@sp-exam.local` / `Admin123!`,
`teacher@sp-exam.local` / `Teacher123!`,
`student@sp-exam.local` / `Student123!`.

## 4. After deployment — smoke test

1. Open the Vercel URL → home page shows live exam counts (no
   "Backend not connected" banner).
2. Register a new student, log in, open an exam, start it, answer,
   submit.
3. Log in as teacher → Submissions → publish the result.
4. Log back in as the student → Results shows the score; Leaderboard
   lists it.
5. Admin → Audit Logs shows the start/submit/publish entries.
