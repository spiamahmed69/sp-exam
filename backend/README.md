# SP Exam — PHP Backend (JSON storage)

Complete REST API for SP Exam. PHP 8+, no database — all data lives in JSON
files under `backend/data/` with `flock()` locking and atomic temp+rename writes.

## Layout

```
backend/
├── config/config.php        # CORS allow-list, token secret, rate limits
├── core/
│   ├── JsonStorage.php      # flock + atomic writes, corrupt-file backup
│   ├── Auth.php             # password_hash/verify, Bearer sessions
│   ├── Middleware.php       # CORS, JSON body, rate limiting, audit helper
│   ├── Response.php         # { success, data, error } responses
│   ├── Validator.php        # input validation / sanitisation
│   └── Seed.php             # first-run seed (subjects, exams, users, 50 real questions)
├── api/index.php            # single front controller — all routes
├── data/                    # runtime JSON files (NEVER committed; see .gitignore)
├── data-seed-questions.json # the 50 real HSC 2026 Chemistry MCQs (seed template)
├── .htaccess                # routes /api/* to index.php, hides errors
└── config/.htaccess + data/.htaccess  # deny direct web access
```

## Run locally

```bash
cd ~/workspace/sp-exam/backend
php -S 127.0.0.1:8080
# API base: http://127.0.0.1:8080/api
curl http://127.0.0.1:8080/api/index.php/health
```

Frontend (separate terminal):

```bash
cd ~/workspace/sp-exam
VITE_API_URL=http://127.0.0.1:8080/api npm run dev
```

> The PHP built-in server needs the `/api/index.php/...` path form
> (`/api/index.php/auth/login`). On InfinityFree the `.htaccess` rewrite
> makes the clean form work: `/api/auth/login`.

## Seed accounts (change these passwords after first login!)

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@sp-exam.local | `Admin123!` |
| Teacher | teacher@sp-exam.local | `Teacher123!` |
| Student | student@sp-exam.local | `Student123!` |

Seeded exams (from the real bank, 50 questions — no invented questions):

- `HSC Chemistry 1st Paper — Model Exam` — 25 MCQ, 25 min, negative 0.25, published
- `HSC Chemistry 2nd Paper — Model Exam` — 25 MCQ, 25 min, negative 0.25, published

Seeded subjects: Chemistry, Physics, Mathematics, Biology, English, Bangla.
One welcome announcement is seeded.

## Configuration

Environment variables (optional; defaults are safe for local use):

- `SP_EXAM_TOKEN_SECRET` — session signing secret. If unset, one is
  generated and stored in `config/secret.key` (0600, never committed).
- `SP_EXAM_ALLOWED_ORIGINS` — comma-separated extra CORS origins.
  Defaults already allow `http://localhost:5173`, `http://127.0.0.1:5173`
  and `https://sp-exam-sage.vercel.app`.

Rate limits: 100 requests / 10 min per IP generally; 10 / min on auth
endpoints. All admin/teacher writes and every exam start/submit are
audit-logged to `data/audit_logs.json`.

## InfinityFree install

1. In the InfinityFree control panel, create/use the existing hosting
   account and open the File Manager (or FTP).
2. Upload the whole `backend/` folder as a **new** folder
   `htdocs/spexam-api/` — do not put it inside any existing site folder.
   Result: `htdocs/spexam-api/api/index.php`, `htdocs/spexam-api/data/`, …
3. The `.htaccess` files deny web access to `data/` and `config/`.
   If possible, move `data/` outside the web root and point
   `config.php`'s `data_dir` at it instead.
4. First request seeds the data files automatically. Verify:
   `https://<your-domain>/spexam-api/api/health`
   should return `{"success":true,"data":{"status":"ok",...}}`.
5. Set the frontend env var (see `docs/DEPLOYMENT.md`):
   `VITE_API_URL=https://<your-domain>/spexam-api/api`
6. Log in as admin and **change all three seed passwords** (there is no
   password-change UI yet — change them by editing the user via the API
   or by deleting `data/users.json` and re-seeding after editing
   `core/Seed.php`).

## API docs

See `docs/API.md` for every endpoint with request/response examples.
