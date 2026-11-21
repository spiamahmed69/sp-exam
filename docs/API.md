# SP Exam API Reference

Base URL (local): `http://127.0.0.1:8080/api`
Base URL (InfinityFree): `https://<your-domain>/spexam-api/api`

All responses are JSON with the same shape:

```json
{ "success": true, "data": { "...": "..." }, "error": null }
```

Errors:

```json
{ "success": false, "data": null, "error": { "message": "…", "code": "forbidden" } }
```

Common HTTP statuses: `400` bad input, `401` not logged in / bad
credentials, `403` wrong role or suspended/pending account, `404` not
found, `409` duplicate / already submitted, `410` attempt expired,
`422` validation, `429` rate-limited.

Authentication: `Authorization: Bearer <token>` header. Tokens come from
`POST /auth/login` and expire after 7 days. **Correct answers are never
returned to students** — exam questions come without the `a` field, and
result scores/details stay hidden until a teacher/admin publishes the
result. Password hashes are never returned by any endpoint.

Rate limits: 100 requests / 10 min per IP; auth endpoints 10 / min per IP.

## Health

### `GET /health`
```json
{ "success": true, "data": { "status": "ok", "app": "SP Exam", "version": "1.0.0", "time": "2026-11-21T11:00:00+00:00" }, "error": null }
```

## Auth

### `POST /auth/register`
Body: `{ "name": "Siam Ahmed", "email": "siam@example.com", "password": "********", "role": "student" }`
(`role` may only be `student` or `teacher`; teacher accounts are created
`pending` and need admin approval. Admins cannot be self-registered.)
→ `201` `{ "user": { "id", "name", "email", "role", "status", "created_at" }, "message": "Account created." }`

### `POST /auth/login`
Body: `{ "email": "student@sp-exam.local", "password": "Student123!" }`
→ `{ "token": "…", "user": { … } }`

### `POST /auth/logout`
Bearer token required. Invalidates the server-side session.
→ `{ "message": "Logged out." }`

### `GET /auth/me`
Bearer token required. → `{ "user": { … } }`

## Exams

### `GET /exams`
Students see published exams only; teachers see their own + published;
admins see all.
→ `{ "exams": [ { "id", "title", "subject_id", "description", "type", "duration_min", "negative_marking", "randomize", "published", "starts_at", "ends_at", "created_by", "question_count", "total_marks" } ] }`

### `POST /exams` — teacher (approved) / admin
Body: `{ "title", "subject_id?", "description?", "type": "mcq"|"cq"|"mixed", "duration_min": 25, "negative_marking": 0.25, "randomize": true, "starts_at": null, "ends_at": null }`
→ `201` `{ "exam": { … } }` (starts unpublished)

### `GET /exams/{id}` · `PUT /exams/{id}` · `DELETE /exams/{id}`
PUT/DELETE: owner teacher or admin only.

### `POST /exams/{id}/publish` · `POST /exams/{id}/unpublish`
Owner teacher or admin.

### `GET /exams/{id}/questions` — teacher/admin (owner or admin), WITH answers
### `POST /exams/{id}/questions` — teacher/admin
MCQ body: `{ "type": "mcq", "q": "…", "o": ["…","…","…","…"], "a": 1, "marks": 1, "chapter": "…", "topic": "…", "stimulus": null }`
CQ body: `{ "type": "cq", "q": "…", "marks": 5, "chapter": "…", "topic": "…" }`
### `PUT /exams/{id}/questions/{qid}` · `DELETE /exams/{id}/questions/{qid}`

### `POST /exams/{id}/start` — student
Validates: exam published, inside schedule window, no submitted attempt
yet. Creates an attempt with server `ends_at`; shuffles the question
order when `randomize` is on; resumes an active attempt if one exists.
→ `201` `{ "attempt": { "id", "exam_id", "exam_title", "status", "started_at", "ends_at", "remaining_seconds", "answers", "marked_review", "question_count" }, "questions": [ { "id", "type", "q", "o", "marks", "chapter", "topic", "stimulus" } ], "resumed": false }`
Note: questions have **no** correct answers.

## Attempts

### `GET /attempts/{id}` — owner student, or teacher/admin
Returns the attempt (with `remaining_seconds` from the server) and the
questions without answers.

### `POST /attempts/{id}/save-answer` — owner student, attempt must be active
Body: `{ "question_id": "P1-Q1", "answer": 2 }` (MCQ: option index;
CQ: answer text) and/or `{ "marked_review": true }`.
→ `{ "attempt": { … }, "saved": true }`
Returns `410` once the server deadline has passed.

### `POST /attempts/{id}/submit` — owner student
Server-side MCQ scoring with negative marking. Safe to call twice: the
second call returns the existing result with `already_submitted: true`.
If the deadline already passed, the submission is marked
`auto_submitted: true`.
→ `{ "result": { … }, "auto_submitted": false }`

## Results

### `GET /results` — student: own; teacher: own exams'; admin: all
Optional `?exam_id=…` filter.
### `GET /results/{id}` — same visibility rules
Result shape (scores hidden until published for students):

```json
{ "id": "…", "attempt_id": "…", "exam_id": "…", "user_id": "…",
  "exam_title": "HSC Chemistry 1st Paper — Model Exam", "student_name": "SP Student",
  "score": 18.5, "total_marks": 25, "correct": 20, "wrong": 4, "blank": 1,
  "cq_pending": false, "cq_score": null, "published": true,
  "detail": { "P1-Q1": { "type": "mcq", "correct": true, "blank": false } },
  "created_at": "…" }
```

Unpublished (student view): `"score": null, "hidden_reason": "Result not published yet."`

### `POST /results/{id}/publish` · `POST /results/{id}/unpublish` — teacher (own exam) / admin
### `POST /results/{id}/evaluate` — teacher (own exam) / admin
Body: `{ "cq_marks": { "<questionId>": 3.5 } }` — adds CQ marks to the
server-computed MCQ score and clears `cq_pending`.

## Subjects / Announcements

### `GET /subjects` · `POST /subjects` · `PUT /subjects/{id}` · `DELETE /subjects/{id}`
Writes: admin only.
### `GET /announcements` · `POST /announcements` · `DELETE /announcements/{id}`
Writes: admin only.

## Leaderboard / Settings

### `GET /leaderboard`
Published results only, best first, names anonymised (`Firstname L.`).
→ `{ "leaderboard": [ { "student", "exam_title", "score", "total_marks", "created_at" } ] }`

### `GET /settings` — public site settings
### `PUT /admin/settings` — admin (`site_name`, `allow_registration`, `maintenance_mode`, `default_negative_marking`, `default_duration_min`)

## Admin

### `GET /admin/stats` — admin
`{ "total_users", "active_students", "total_teachers", "pending_teachers", "total_exams", "total_attempts", "total_results", "published_results", "recent_activity": [ …audit entries… ] }`

### `GET /admin/users` — admin (optional `?role=teacher|student|admin`)
### `POST /admin/users/{id}/approve` · `POST /admin/users/{id}/suspend` — admin
### `GET /admin/audit-logs` — admin (newest first, max 200)
### `GET /admin/backup` — admin (full JSON bundle of every collection)
### `POST /admin/restore` — admin
Body: `{ "backup": { "users": […], "exams": […], … } }` — replaces data.
