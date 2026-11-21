<?php
// SP Exam API — single front controller.
// All responses are JSON: { success, data, error }.
// Run locally:  php -S 127.0.0.1:8080 -t backend
// Then:          curl http://127.0.0.1:8080/api/index.php/health
// On InfinityFree (htdocs/spexam-api/): /api/auth/login etc. via .htaccess.
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');

$config = require __DIR__ . '/../config/config.php';
require __DIR__ . '/../core/JsonStorage.php';
require __DIR__ . '/../core/Response.php';
require __DIR__ . '/../core/Validator.php';
require __DIR__ . '/../core/Auth.php';
require __DIR__ . '/../core/Middleware.php';
require __DIR__ . '/../core/Seed.php';

$store = new JsonStorage($config['data_dir']);
$mw = new Middleware($config, $store);
$mw->cors();
$auth = new Auth($store, $config);
Seed::run($store, $config);

// ---- routing ---------------------------------------------------------------
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$rawPath = $_SERVER['PATH_INFO'] ?? ($_GET['route'] ?? '');
if ($rawPath === '' || $rawPath === '/') {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    // Strip everything up to and including /api (or /api/index.php), so the
    // API works when hosted in a subfolder like /spexam-api/api/health.
    $rawPath = preg_replace('#^.*?/api(/index\.php)?#', '', $uri) ?? '';
    $rawPath = preg_replace('#^/index\.php#', '', $rawPath) ?? '';
}
$segments = array_values(array_filter(explode('/', trim((string) $rawPath, '/'))));
$body = in_array($method, ['POST', 'PUT', 'PATCH'], true) ? $mw->body() : [];

$isAuthRoute = ($segments[0] ?? '') === 'auth' && in_array($method, ['POST'], true);
$mw->rateLimit($isAuthRoute ? 'auth' : 'general');

function seg(array $s, int $i): ?string
{
    return $s[$i] ?? null;
}

// ---- helpers ---------------------------------------------------------------
function publicExam(array $e, JsonStorage $store): array
{
    $qs = $store->read('questions');
    $count = 0;
    $total = 0;
    foreach ((array) ($e['question_ids'] ?? []) as $qid) {
        foreach ($qs as $q) {
            if ($q['id'] === $qid) {
                $count++;
                $total += (int) ($q['marks'] ?? 1);
            }
        }
    }
    return [
        'id' => $e['id'], 'title' => $e['title'], 'subject_id' => $e['subject_id'] ?? null,
        'description' => $e['description'] ?? '', 'type' => $e['type'] ?? 'mcq',
        'duration_min' => (int) ($e['duration_min'] ?? 25),
        'negative_marking' => (float) ($e['negative_marking'] ?? 0),
        'randomize' => (bool) ($e['randomize'] ?? false),
        'published' => (bool) ($e['published'] ?? false),
        'starts_at' => $e['starts_at'] ?? null, 'ends_at' => $e['ends_at'] ?? null,
        'created_by' => $e['created_by'] ?? null, 'created_at' => $e['created_at'] ?? null,
        'question_count' => $count, 'total_marks' => $total,
    ];
}

/** Question as a student may see it during an exam: NO correct answer. */
function studentQuestion(array $q): array
{
    return [
        'id' => $q['id'], 'type' => $q['type'] ?? 'mcq', 'q' => $q['q'],
        'o' => $q['o'] ?? [], 'marks' => (int) ($q['marks'] ?? 1),
        'chapter' => $q['chapter'] ?? '', 'topic' => $q['topic'] ?? '',
        'stimulus' => $q['stimulus'] ?? null,
    ];
}

function canManageExam(array $user, array $exam): bool
{
    if ($user['role'] === 'admin') {
        return true;
    }
    return $user['role'] === 'teacher' && ($exam['created_by'] ?? null) === $user['id'];
}

function scoreAttempt(JsonStorage $store, array $attempt, array $exam): array
{
    $questions = $store->read('questions');
    $byId = [];
    foreach ($questions as $q) {
        $byId[$q['id']] = $q;
    }
    $answers = $attempt['answers'] ?? [];
    $correct = $wrong = $blank = 0;
    $mcqScore = 0.0;
    $cqPending = false;
    $cqTotal = 0;
    $detail = [];
    foreach ((array) ($attempt['question_order'] ?? []) as $qid) {
        $q = $byId[$qid] ?? null;
        if (!$q) {
            continue;
        }
        $marks = (int) ($q['marks'] ?? 1);
        $ans = $answers[$qid] ?? null;
        if (($q['type'] ?? 'mcq') === 'cq') {
            $cqTotal += $marks;
            $cqPending = $cqPending || ($ans !== null && $ans !== '');
            $detail[$qid] = ['type' => 'cq', 'answered' => $ans !== null && $ans !== '', 'marks' => $marks, 'cq_marks' => null];
            continue;
        }
        if ($ans === null || $ans === '') {
            $blank++;
            $detail[$qid] = ['type' => 'mcq', 'correct' => false, 'blank' => true];
        } elseif ((int) $ans === (int) ($q['a'] ?? -1)) {
            $correct++;
            $mcqScore += $marks;
            $detail[$qid] = ['type' => 'mcq', 'correct' => true, 'blank' => false];
        } else {
            $wrong++;
            $mcqScore -= (float) ($exam['negative_marking'] ?? 0);
            $detail[$qid] = ['type' => 'mcq', 'correct' => false, 'blank' => false];
        }
    }
    $totalMarks = 0;
    foreach ((array) ($attempt['question_order'] ?? []) as $qid) {
        $totalMarks += (int) (($byId[$qid]['marks'] ?? 1));
    }
    return [
        'correct' => $correct, 'wrong' => $wrong, 'blank' => $blank,
        'score' => round($mcqScore, 2), 'total_marks' => $totalMarks,
        'cq_pending' => $cqPending, 'cq_total_marks' => $cqTotal, 'detail' => $detail,
    ];
}

/** Result as the requester may see it (answers hidden until published). */
function publicResult(JsonStorage $store, array $r, array $requester): array
{
    $isOwner = $r['user_id'] === $requester['id'];
    $canSeeAll = in_array($requester['role'], ['admin', 'teacher'], true);
    $out = [
        'id' => $r['id'], 'attempt_id' => $r['attempt_id'] ?? null, 'exam_id' => $r['exam_id'], 'user_id' => $r['user_id'],
        'published' => (bool) ($r['published'] ?? false),
        'cq_pending' => (bool) ($r['cq_pending'] ?? false),
        'created_at' => $r['created_at'] ?? null,
    ];
    if ($r['published'] || $canSeeAll) {
        $out += [
            'score' => $r['score'], 'total_marks' => $r['total_marks'],
            'correct' => $r['correct'], 'wrong' => $r['wrong'], 'blank' => $r['blank'],
            'cq_score' => $r['cq_score'] ?? null,
        ];
        if ($r['published'] || $canSeeAll) {
            $out['detail'] = $r['detail'] ?? null;
        }
    } else {
        $out['score'] = null;
        $out['hidden_reason'] = 'Result not published yet.';
    }
    $exam = $store->find('exams', 'id', $r['exam_id']);
    $out['exam_title'] = $exam['title'] ?? '';
    $u = $store->find('users', 'id', $r['user_id']);
    $out['student_name'] = $u['name'] ?? 'Student';
    return $out;
}

// ---- health ----------------------------------------------------------------
if ($method === 'GET' && $segments === []) {
    Response::json(['status' => 'ok', 'app' => $config['app_name'], 'version' => $config['version'], 'time' => gmdate('c')]);
}
if ($method === 'GET' && $segments === ['health']) {
    Response::json(['status' => 'ok', 'app' => $config['app_name'], 'version' => $config['version'], 'time' => gmdate('c')]);
}

// ---- auth ------------------------------------------------------------------
if (($segments[0] ?? '') === 'auth') {
    $action = seg($segments, 1);
    if ($method === 'POST' && $action === 'register') {
        Validator::requireFields($body, ['name', 'email', 'password']);
        $email = Validator::email($body['email']);
        if (!$email) Response::error('A valid email address is required.', 422, 'validation');
        $password = (string) $body['password'];
        if (strlen($password) < 8) Response::error('Password must be at least 8 characters.', 422, 'validation');
        if ($store->find('users', 'email', $email)) Response::error('An account with this email already exists.', 409, 'duplicate_email');
        $role = ($body['role'] ?? 'student') === 'teacher' ? 'teacher' : 'student';
        $user = $store->insert('users', [
            'name' => Validator::str($body['name'], 120), 'email' => $email,
            'password_hash' => Auth::hashPassword($password), 'role' => $role,
            // Teachers need admin approval before they can create exams.
            'status' => $role === 'teacher' ? 'pending' : 'approved',
        ]);
        auditLog($store, $user['id'], 'auth.register', ['role' => $role]);
        Response::json(['user' => Auth::publicUser($user),
            'message' => $role === 'teacher' ? 'Teacher account created — waiting for admin approval.' : 'Account created.'], 201);
    }
    if ($method === 'POST' && $action === 'login') {
        Validator::requireFields($body, ['email', 'password']);
        $email = Validator::email($body['email']);
        $user = $email ? $store->find('users', 'email', $email) : null;
        if (!$user || !Auth::verifyPassword((string) $body['password'], (string) $user['password_hash'])) {
            Response::error('Email or password is incorrect.', 401, 'invalid_credentials');
        }
        if (($user['status'] ?? '') === 'suspended') Response::error('This account is suspended. Contact the administrator.', 403, 'suspended');
        if (($user['status'] ?? '') === 'pending') Response::error('Your account is waiting for admin approval.', 403, 'pending_approval');
        $token = $auth->createSession($user);
        auditLog($store, $user['id'], 'auth.login', []);
        Response::json(['token' => $token, 'user' => Auth::publicUser($user)]);
    }
    if ($method === 'POST' && $action === 'logout') {
        $user = $auth->userFromRequest();
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/^Bearer\s+(\S+)$/i', trim($header), $m)) $auth->destroySession($m[1]);
        Response::json(['message' => 'Logged out.', 'user' => $user ? Auth::publicUser($user) : null]);
    }
    if ($method === 'GET' && $action === 'me') {
        $user = $auth->requireUser();
        Response::json(['user' => Auth::publicUser($user)]);
    }
    Response::error('Auth endpoint not found.', 404, 'not_found');
}

// ---- public: subjects, announcements, leaderboard, settings -----------------
if ($method === 'GET' && $segments === ['subjects']) {
    Response::json(['subjects' => $store->read('subjects')]);
}
if ($method === 'GET' && $segments === ['announcements']) {
    $rows = $store->read('announcements');
    usort($rows, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
    Response::json(['announcements' => $rows]);
}
if ($method === 'GET' && $segments === ['settings']) {
    $rows = $store->read('settings');
    $s = $rows[0] ?? [];
    unset($s['id']);
    Response::json(['settings' => $s]);
}
if ($method === 'GET' && $segments === ['leaderboard']) {
    $results = array_filter($store->read('results'), fn($r) => !empty($r['published']));
    usort($results, fn($a, $b) => ($b['score'] ?? 0) <=> ($a['score'] ?? 0));
    $rows = [];
    foreach (array_slice($results, 0, 50) as $r) {
        $u = $store->find('users', 'id', $r['user_id']);
        $name = $u['name'] ?? 'Student';
        $parts = preg_split('/\s+/', trim($name));
        $anon = $parts[0] . (count($parts) > 1 ? ' ' . mb_substr(end($parts), 0, 1) . '.' : '');
        $exam = $store->find('exams', 'id', $r['exam_id']);
        $rows[] = ['student' => $anon, 'exam_title' => $exam['title'] ?? '',
            'score' => $r['score'], 'total_marks' => $r['total_marks'], 'created_at' => $r['created_at'] ?? null];
    }
    Response::json(['leaderboard' => $rows]);
}

// ---- exams -----------------------------------------------------------------
if (($segments[0] ?? '') === 'exams' && $method === 'GET' && count($segments) === 1) {
    $user = $auth->userFromRequest();
    $exams = $store->read('exams');
    $out = [];
    foreach ($exams as $e) {
        if ($user && $user['role'] === 'admin') { $out[] = publicExam($e, $store); continue; }
        if ($user && $user['role'] === 'teacher') {
            if (($e['created_by'] ?? null) === $user['id'] || !empty($e['published'])) $out[] = publicExam($e, $store);
            continue;
        }
        if (!empty($e['published'])) $out[] = publicExam($e, $store);
    }
    Response::json(['exams' => $out]);
}
if (($segments[0] ?? '') === 'exams' && $method === 'POST' && count($segments) === 1) {
    $user = $auth->requireRole(['teacher', 'admin']);
    if ($user['role'] === 'teacher' && ($user['status'] ?? '') !== 'approved') {
        Response::error('Your teacher account is waiting for approval.', 403, 'pending_approval');
    }
    Validator::requireFields($body, ['title']);
    $exam = $store->insert('exams', [
        'title' => Validator::str($body['title'], 200),
        'subject_id' => isset($body['subject_id']) ? Validator::id($body['subject_id']) : null,
        'description' => Validator::text($body['description'] ?? '', 2000),
        'type' => in_array($body['type'] ?? 'mcq', ['mcq', 'cq', 'mixed'], true) ? $body['type'] : 'mcq',
        'duration_min' => Validator::int($body['duration_min'] ?? 25, 1, 300, 25),
        'negative_marking' => Validator::num($body['negative_marking'] ?? 0, 0, 1, 0),
        'randomize' => Validator::bool($body['randomize'] ?? false),
        'published' => false, 'starts_at' => $body['starts_at'] ?? null, 'ends_at' => $body['ends_at'] ?? null,
        'created_by' => $user['id'], 'question_ids' => [],
    ]);
    auditLog($store, $user['id'], 'exam.create', ['exam_id' => $exam['id']]);
    Response::json(['exam' => publicExam($exam, $store)], 201);
}
if (($segments[0] ?? '') === 'exams' && count($segments) >= 2) {
    $examId = Validator::id(seg($segments, 1));
    $exam = $store->find('exams', 'id', $examId);
    if (!$exam) Response::error('Exam not found.', 404, 'not_found');
    $sub = seg($segments, 2);

    // GET /exams/{id}
    if ($method === 'GET' && $sub === null) {
        $user = $auth->userFromRequest();
        if (empty($exam['published']) && !($user && canManageExam($user, $exam))) {
            Response::error('Exam not found.', 404, 'not_found');
        }
        Response::json(['exam' => publicExam($exam, $store)]);
    }
    // PUT / DELETE /exams/{id}
    if ($method === 'PUT' && $sub === null) {
        $user = $auth->requireUser();
        if (!canManageExam($user, $exam)) Response::error('You do not have permission to do that.', 403, 'forbidden');
        $patch = [];
        foreach (['title', 'description', 'type', 'starts_at', 'ends_at'] as $f) {
            if (array_key_exists($f, $body)) $patch[$f] = $f === 'title' ? Validator::str($body[$f], 200) : ($f === 'description' ? Validator::text($body[$f], 2000) : $body[$f]);
        }
        if (isset($body['duration_min'])) $patch['duration_min'] = Validator::int($body['duration_min'], 1, 300, 25);
        if (isset($body['negative_marking'])) $patch['negative_marking'] = Validator::num($body['negative_marking'], 0, 1, 0);
        if (isset($body['randomize'])) $patch['randomize'] = Validator::bool($body['randomize']);
        if (isset($body['subject_id'])) $patch['subject_id'] = Validator::id($body['subject_id']);
        $updated = $store->update('exams', $examId, $patch);
        auditLog($store, $user['id'], 'exam.update', ['exam_id' => $examId]);
        Response::json(['exam' => publicExam($updated, $store)]);
    }
    if ($method === 'DELETE' && $sub === null) {
        $user = $auth->requireUser();
        if (!canManageExam($user, $exam)) Response::error('You do not have permission to do that.', 403, 'forbidden');
        $store->delete('exams', $examId);
        auditLog($store, $user['id'], 'exam.delete', ['exam_id' => $examId]);
        Response::json(['message' => 'Exam deleted.']);
    }
    // POST /exams/{id}/publish | unpublish
    if ($method === 'POST' && in_array($sub, ['publish', 'unpublish'], true)) {
        $user = $auth->requireUser();
        if (!canManageExam($user, $exam)) Response::error('You do not have permission to do that.', 403, 'forbidden');
        $updated = $store->update('exams', $examId, ['published' => $sub === 'publish']);
        auditLog($store, $user['id'], 'exam.' . $sub, ['exam_id' => $examId]);
        Response::json(['exam' => publicExam($updated, $store)]);
    }
    // Questions of an exam
    if ($sub === 'questions') {
        $qid = seg($segments, 3) ? Validator::id(seg($segments, 3)) : null;
        if ($method === 'GET' && $qid === null) {
            $user = $auth->requireRole(['teacher', 'admin']);
            if (!canManageExam($user, $exam)) Response::error('You do not have permission to do that.', 403, 'forbidden');
            $all = $store->read('questions');
            $list = array_values(array_filter($all, fn($q) => ($q['exam_id'] ?? '') === $examId));
            Response::json(['questions' => $list]);
        }
        if ($method === 'POST' && $qid === null) {
            $user = $auth->requireUser();
            if (!canManageExam($user, $exam)) Response::error('You do not have permission to do that.', 403, 'forbidden');
            Validator::requireFields($body, ['q']);
            $type = in_array($body['type'] ?? 'mcq', ['mcq', 'cq'], true) ? $body['type'] : 'mcq';
            if ($type === 'mcq') {
                $opts = array_values(array_filter(array_map(fn($o) => Validator::str($o, 500), (array) ($body['o'] ?? []))));
                if (count($opts) < 2) Response::error('MCQ questions need at least 2 options.', 422, 'validation');
                $a = Validator::int($body['a'] ?? null, 0, count($opts) - 1, null);
                if ($a === null) Response::error('MCQ questions need a correct answer index.', 422, 'validation');
            } else { $opts = []; $a = null; }
            $q = $store->insert('questions', [
                'exam_id' => $examId, 'type' => $type, 'q' => Validator::text($body['q'], 5000),
                'o' => $opts, 'a' => $a, 'marks' => Validator::int($body['marks'] ?? 1, 1, 100, 1),
                'chapter' => Validator::str($body['chapter'] ?? '', 200), 'topic' => Validator::str($body['topic'] ?? '', 200),
                'stimulus' => isset($body['stimulus']) ? Validator::text($body['stimulus'], 5000) : null,
            ]);
            $ids = array_values((array) ($exam['question_ids'] ?? []));
            $ids[] = $q['id'];
            $store->update('exams', $examId, ['question_ids' => $ids]);
            auditLog($store, $user['id'], 'question.create', ['exam_id' => $examId, 'question_id' => $q['id']]);
            Response::json(['question' => $q], 201);
        }
        if ($method === 'PUT' && $qid !== null) {
            $user = $auth->requireUser();
            if (!canManageExam($user, $exam)) Response::error('You do not have permission to do that.', 403, 'forbidden');
            $q = $store->find('questions', 'id', $qid);
            if (!$q || ($q['exam_id'] ?? '') !== $examId) Response::error('Question not found.', 404, 'not_found');
            $patch = [];
            if (isset($body['q'])) $patch['q'] = Validator::text($body['q'], 5000);
            if (isset($body['o']) && is_array($body['o'])) $patch['o'] = array_values(array_map(fn($o) => Validator::str($o, 500), $body['o']));
            if (array_key_exists('a', $body)) $patch['a'] = $body['a'] === null ? null : Validator::int($body['a'], 0, 10, 0);
            if (isset($body['marks'])) $patch['marks'] = Validator::int($body['marks'], 1, 100, 1);
            if (isset($body['chapter'])) $patch['chapter'] = Validator::str($body['chapter'], 200);
            if (isset($body['topic'])) $patch['topic'] = Validator::str($body['topic'], 200);
            $updated = $store->update('questions', $qid, $patch);
            auditLog($store, $user['id'], 'question.update', ['exam_id' => $examId, 'question_id' => $qid]);
            Response::json(['question' => $updated]);
        }
        if ($method === 'DELETE' && $qid !== null) {
            $user = $auth->requireUser();
            if (!canManageExam($user, $exam)) Response::error('You do not have permission to do that.', 403, 'forbidden');
            $store->delete('questions', $qid);
            $ids = array_values(array_filter((array) ($exam['question_ids'] ?? []), fn($x) => $x !== $qid));
            $store->update('exams', $examId, ['question_ids' => $ids]);
            auditLog($store, $user['id'], 'question.delete', ['exam_id' => $examId, 'question_id' => $qid]);
            Response::json(['message' => 'Question deleted.']);
        }
    }
    // POST /exams/{id}/start
    if ($method === 'POST' && $sub === 'start') {
        $user = $auth->requireRole(['student']);
        if (empty($exam['published'])) Response::error('This exam is not published.', 403, 'not_published');
        $now = time();
        if (!empty($exam['starts_at']) && $now < strtotime((string) $exam['starts_at'])) Response::error('This exam has not started yet.', 403, 'not_started');
        if (!empty($exam['ends_at']) && $now > strtotime((string) $exam['ends_at'])) Response::error('This exam has ended.', 403, 'exam_ended');
        $attempts = $store->read('attempts');
        foreach ($attempts as $a) {
            if ($a['exam_id'] === $examId && $a['user_id'] === $user['id']) {
                if (($a['status'] ?? '') === 'submitted') {
                    Response::error('You have already submitted this exam.', 409, 'already_submitted');
                }
                if (($a['status'] ?? '') === 'active') {
                    if (strtotime((string) $a['ends_at']) <= $now) {
                        $store->update('attempts', $a['id'], ['status' => 'expired']);
                        Response::error('Your previous attempt expired. Contact your teacher.', 410, 'attempt_expired');
                    }
                    // Resume the active attempt.
                    $qs = $store->read('questions');
                    $byId = [];
                    foreach ($qs as $q) $byId[$q['id']] = $q;
                    $list = [];
                    foreach ((array) $a['question_order'] as $qid) if (isset($byId[$qid])) $list[] = studentQuestion($byId[$qid]);
                    Response::json(['attempt' => attemptView($store, $a), 'questions' => $list, 'resumed' => true]);
                }
            }
        }
        $order = array_values((array) ($exam['question_ids'] ?? []));
        if (empty($order)) Response::error('This exam has no questions yet.', 422, 'no_questions');
        if (!empty($exam['randomize'])) shuffle($order);
        $endsAt = gmdate('c', $now + (int) ($exam['duration_min'] ?? 25) * 60);
        $attempt = $store->insert('attempts', [
            'exam_id' => $examId, 'user_id' => $user['id'], 'question_order' => $order,
            'answers' => [], 'marked_review' => [], 'status' => 'active',
            'started_at' => gmdate('c', $now), 'ends_at' => $endsAt, 'submitted_at' => null,
        ]);
        auditLog($store, $user['id'], 'exam.start', ['exam_id' => $examId, 'attempt_id' => $attempt['id']]);
        $qs = $store->read('questions');
        $byId = [];
        foreach ($qs as $q) $byId[$q['id']] = $q;
        $list = [];
        foreach ($order as $qid) if (isset($byId[$qid])) $list[] = studentQuestion($byId[$qid]);
        Response::json(['attempt' => attemptView($store, $attempt), 'questions' => $list, 'resumed' => false], 201);
    }
    Response::error('Exam endpoint not found.', 404, 'not_found');
}

function attemptView(JsonStorage $store, array $a): array
{
    $exam = $store->find('exams', 'id', $a['exam_id']);
    return [
        'id' => $a['id'], 'exam_id' => $a['exam_id'], 'exam_title' => $exam['title'] ?? '',
        'status' => $a['status'], 'started_at' => $a['started_at'], 'ends_at' => $a['ends_at'],
        'submitted_at' => $a['submitted_at'] ?? null,
        'remaining_seconds' => max(0, (int) strtotime((string) $a['ends_at']) - time()),
        'answers' => $a['answers'] ?? [], 'marked_review' => $a['marked_review'] ?? [],
        'question_count' => count((array) ($a['question_order'] ?? [])),
    ];
}

// ---- attempts ---------------------------------------------------------------
if (($segments[0] ?? '') === 'attempts' && count($segments) >= 2) {
    $attemptId = Validator::id(seg($segments, 1));
    $attempt = $store->find('attempts', 'id', $attemptId);
    if (!$attempt) Response::error('Attempt not found.', 404, 'not_found');
    $sub = seg($segments, 2);
    $user = $auth->requireUser();
    $isOwner = $attempt['user_id'] === $user['id'];
    $isStaff = in_array($user['role'], ['admin', 'teacher'], true);
    if (!$isOwner && !$isStaff) Response::error('You do not have permission to do that.', 403, 'forbidden');

    if ($method === 'GET' && $sub === null) {
        $exam = $store->find('exams', 'id', $attempt['exam_id']);
        $qs = $store->read('questions');
        $byId = [];
        foreach ($qs as $q) $byId[$q['id']] = $q;
        $list = [];
        foreach ((array) $attempt['question_order'] as $qid) if (isset($byId[$qid])) $list[] = studentQuestion($byId[$qid]);
        Response::json(['attempt' => attemptView($store, $attempt), 'questions' => $list]);
    }
    // Autosave one answer. Server is authoritative about the deadline.
    if ($method === 'POST' && $sub === 'save-answer') {
        if (!$isOwner) Response::error('Only the exam taker can save answers.', 403, 'forbidden');
        if (($attempt['status'] ?? '') !== 'active') Response::error('This attempt is no longer active.', 409, 'attempt_closed');
        if (time() >= strtotime((string) $attempt['ends_at'])) {
            $store->update('attempts', $attemptId, ['status' => 'expired']);
            Response::error('Time is up — this attempt has expired.', 410, 'attempt_expired');
        }
        Validator::requireFields($body, ['question_id']);
        $qid = Validator::id($body['question_id']);
        if (!in_array($qid, (array) $attempt['question_order'], true)) Response::error('Question is not part of this attempt.', 422, 'validation');
        $answers = $attempt['answers'] ?? [];
        if (array_key_exists('answer', $body)) {
            $q = $store->find('questions', 'id', $qid);
            $answers[$qid] = ($q && ($q['type'] ?? 'mcq') === 'cq') ? Validator::text($body['answer'], 5000) : Validator::int($body['answer'], 0, 20, null);
        }
        $marked = $attempt['marked_review'] ?? [];
        if (array_key_exists('marked_review', $body)) {
            $marked = Validator::bool($body['marked_review'])
                ? array_values(array_unique(array_merge($marked, [$qid])))
                : array_values(array_filter($marked, fn($x) => $x !== $qid));
        }
        $updated = $store->update('attempts', $attemptId, ['answers' => $answers, 'marked_review' => $marked]);
        Response::json(['attempt' => attemptView($store, $updated), 'saved' => true]);
    }
    // Submit — server-side scoring, duplicate-safe, auto-submit if expired.
    if ($method === 'POST' && $sub === 'submit') {
        if (!$isOwner) Response::error('Only the exam taker can submit.', 403, 'forbidden');
        if (in_array($attempt['status'] ?? '', ['submitted', 'expired'], true)) {
            $existing = $store->find('results', 'attempt_id', $attemptId);
            if ($existing) Response::json(['result' => publicResult($store, $existing, $user), 'already_submitted' => true]);
            if (($attempt['status'] ?? '') === 'submitted') {
                Response::error('This attempt was already submitted.', 409, 'already_submitted');
            }
            // Status 'expired' with no result yet (e.g. a save-answer call
            // marked it expired at the deadline): fall through and score it
            // as an automatic submission instead of rejecting it.
        }
        $exam = $store->find('exams', 'id', $attempt['exam_id']);
        if (!$exam) Response::error('Exam not found.', 404, 'not_found');
        $expired = time() >= strtotime((string) $attempt['ends_at']);
        $scored = scoreAttempt($store, $attempt, $exam);
        $store->update('attempts', $attemptId, ['status' => 'submitted', 'submitted_at' => gmdate('c')]);
        $existing = $store->find('results', 'attempt_id', $attemptId);
        if ($existing) {
            Response::json(['result' => publicResult($store, $existing, $user), 'already_submitted' => true]);
        }
        $result = $store->insert('results', [
            'attempt_id' => $attemptId, 'exam_id' => $attempt['exam_id'], 'user_id' => $attempt['user_id'],
            'score' => $scored['score'], 'total_marks' => $scored['total_marks'],
            'correct' => $scored['correct'], 'wrong' => $scored['wrong'], 'blank' => $scored['blank'],
            'cq_pending' => $scored['cq_pending'], 'cq_score' => null,
            'published' => false, 'detail' => $scored['detail'],
            'auto_submitted' => $expired,
        ]);
        auditLog($store, $user['id'], 'exam.submit', ['exam_id' => $attempt['exam_id'], 'attempt_id' => $attemptId, 'auto' => $expired]);
        Response::json(['result' => publicResult($store, $result, $user), 'auto_submitted' => $expired]);
    }
    Response::error('Attempt endpoint not found.', 404, 'not_found');
}

// ---- results ----------------------------------------------------------------
if (($segments[0] ?? '') === 'results') {
    if ($method === 'GET' && count($segments) === 1) {
        $user = $auth->requireUser();
        $all = $store->read('results');
        $examFilter = $_GET['exam_id'] ?? null;
        $out = [];
        foreach ($all as $r) {
            if ($examFilter && $r['exam_id'] !== $examFilter) continue;
            if ($user['role'] === 'student' && $r['user_id'] !== $user['id']) continue;
            if ($user['role'] === 'teacher') {
                $exam = $store->find('exams', 'id', $r['exam_id']);
                if (($exam['created_by'] ?? null) !== $user['id']) continue;
            }
            $out[] = publicResult($store, $r, $user);
        }
        usort($out, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
        Response::json(['results' => $out]);
    }
    if (count($segments) === 2 && $method === 'GET') {
        $user = $auth->requireUser();
        $r = $store->find('results', 'id', Validator::id(seg($segments, 1)));
        if (!$r) Response::error('Result not found.', 404, 'not_found');
        if ($user['role'] === 'student' && $r['user_id'] !== $user['id']) Response::error('You do not have permission to do that.', 403, 'forbidden');
        if ($user['role'] === 'teacher') {
            $exam = $store->find('exams', 'id', $r['exam_id']);
            if (($exam['created_by'] ?? null) !== $user['id']) Response::error('You do not have permission to do that.', 403, 'forbidden');
        }
        Response::json(['result' => publicResult($store, $r, $user)]);
    }
    if (count($segments) === 3 && $method === 'POST') {
        $user = $auth->requireUser();
        $r = $store->find('results', 'id', Validator::id(seg($segments, 1)));
        if (!$r) Response::error('Result not found.', 404, 'not_found');
        $exam = $store->find('exams', 'id', $r['exam_id']);
        if (!($user['role'] === 'admin' || ($user['role'] === 'teacher' && ($exam['created_by'] ?? null) === $user['id']))) {
            Response::error('You do not have permission to do that.', 403, 'forbidden');
        }
        $action = seg($segments, 2);
        if ($action === 'publish') {
            $updated = $store->update('results', $r['id'], ['published' => true]);
            auditLog($store, $user['id'], 'result.publish', ['result_id' => $r['id']]);
            Response::json(['result' => publicResult($store, $updated, $user)]);
        }
        if ($action === 'unpublish') {
            $updated = $store->update('results', $r['id'], ['published' => false]);
            auditLog($store, $user['id'], 'result.unpublish', ['result_id' => $r['id']]);
            Response::json(['result' => publicResult($store, $updated, $user)]);
        }
        if ($action === 'evaluate') {
            // Manual CQ evaluation: { cq_marks: { questionId: marks } }
            $cqMarks = (array) ($body['cq_marks'] ?? []);
            $attempt = $store->find('attempts', 'id', $r['attempt_id']);
            $qs = $store->read('questions');
            $byId = [];
            foreach ($qs as $q) $byId[$q['id']] = $q;
            $cqScore = 0.0;
            $detail = $r['detail'] ?? [];
            foreach ($cqMarks as $qid => $m) {
                $q = $byId[$qid] ?? null;
                if (!$q || ($q['type'] ?? '') !== 'cq') continue;
                $given = Validator::num($m, 0, (int) ($q['marks'] ?? 1), 0);
                $cqScore += $given;
                $detail[$qid] = ['type' => 'cq', 'answered' => true, 'marks' => (int) ($q['marks'] ?? 1), 'cq_marks' => $given];
            }
            $updated = $store->update('results', $r['id'], [
                'cq_score' => round($cqScore, 2),
                'score' => round((float) ($r['score'] ?? 0) + $cqScore, 2),
                'cq_pending' => false, 'detail' => $detail,
            ]);
            auditLog($store, $user['id'], 'result.evaluate', ['result_id' => $r['id'], 'cq_score' => $cqScore]);
            Response::json(['result' => publicResult($store, $updated, $user)]);
        }
    }
    Response::error('Result endpoint not found.', 404, 'not_found');
}

// ---- subjects (admin write) --------------------------------------------------
if (($segments[0] ?? '') === 'subjects') {
    $id = seg($segments, 1) ? Validator::id(seg($segments, 1)) : null;
    if ($method === 'POST' && $id === null) {
        $user = $auth->requireRole(['admin']);
        Validator::requireFields($body, ['name']);
        $s = $store->insert('subjects', ['name' => Validator::str($body['name'], 120), 'description' => Validator::text($body['description'] ?? '', 1000)]);
        auditLog($store, $user['id'], 'subject.create', ['subject_id' => $s['id']]);
        Response::json(['subject' => $s], 201);
    }
    if ($method === 'PUT' && $id !== null) {
        $user = $auth->requireRole(['admin']);
        $patch = [];
        if (isset($body['name'])) $patch['name'] = Validator::str($body['name'], 120);
        if (isset($body['description'])) $patch['description'] = Validator::text($body['description'], 1000);
        $updated = $store->update('subjects', $id, $patch);
        if (!$updated) Response::error('Subject not found.', 404, 'not_found');
        auditLog($store, $user['id'], 'subject.update', ['subject_id' => $id]);
        Response::json(['subject' => $updated]);
    }
    if ($method === 'DELETE' && $id !== null) {
        $user = $auth->requireRole(['admin']);
        if (!$store->delete('subjects', $id)) Response::error('Subject not found.', 404, 'not_found');
        auditLog($store, $user['id'], 'subject.delete', ['subject_id' => $id]);
        Response::json(['message' => 'Subject deleted.']);
    }
    Response::error('Subject endpoint not found.', 404, 'not_found');
}

// ---- announcements (admin write) ---------------------------------------------
if (($segments[0] ?? '') === 'announcements') {
    $id = seg($segments, 1) ? Validator::id(seg($segments, 1)) : null;
    if ($method === 'POST' && $id === null) {
        $user = $auth->requireRole(['admin']);
        Validator::requireFields($body, ['title', 'body']);
        $a = $store->insert('announcements', [
            'title' => Validator::str($body['title'], 200), 'body' => Validator::text($body['body'], 5000),
            'created_by' => $user['id'],
        ]);
        auditLog($store, $user['id'], 'announcement.create', ['announcement_id' => $a['id']]);
        Response::json(['announcement' => $a], 201);
    }
    if ($method === 'DELETE' && $id !== null) {
        $user = $auth->requireRole(['admin']);
        if (!$store->delete('announcements', $id)) Response::error('Announcement not found.', 404, 'not_found');
        auditLog($store, $user['id'], 'announcement.delete', ['announcement_id' => $id]);
        Response::json(['message' => 'Announcement deleted.']);
    }
    Response::error('Announcement endpoint not found.', 404, 'not_found');
}

// ---- admin -------------------------------------------------------------------
if (($segments[0] ?? '') === 'admin') {
    $action = seg($segments, 1);
    if ($method === 'GET' && $action === 'stats') {
        $user = $auth->requireRole(['admin']);
        $users = $store->read('users');
        $attempts = $store->read('attempts');
        $results = $store->read('results');
        $logs = $store->read('audit_logs');
        usort($logs, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
        Response::json(['stats' => [
            'total_users' => count($users),
            'active_students' => count(array_filter($users, fn($u) => $u['role'] === 'student' && ($u['status'] ?? '') === 'approved')),
            'total_teachers' => count(array_filter($users, fn($u) => $u['role'] === 'teacher')),
            'pending_teachers' => count(array_filter($users, fn($u) => $u['role'] === 'teacher' && ($u['status'] ?? '') === 'pending')),
            'total_exams' => count($store->read('exams')),
            'total_attempts' => count($attempts),
            'total_results' => count($results),
            'published_results' => count(array_filter($results, fn($r) => !empty($r['published']))),
            'recent_activity' => array_slice($logs, 0, 10),
        ]]);
    }
    if ($method === 'GET' && $action === 'users') {
        $user = $auth->requireRole(['admin']);
        $role = $_GET['role'] ?? null;
        $users = array_map([Auth::class, 'publicUser'], $store->read('users'));
        if ($role) $users = array_values(array_filter($users, fn($u) => $u['role'] === $role));
        Response::json(['users' => $users]);
    }
    if ($method === 'POST' && $action === 'users' && in_array(seg($segments, 3), ['approve', 'suspend'], true)) {
        $user = $auth->requireRole(['admin']);
        $targetId = Validator::id(seg($segments, 2));
        $target = $store->find('users', 'id', $targetId);
        if (!$target) Response::error('User not found.', 404, 'not_found');
        if ($target['id'] === $user['id']) Response::error('You cannot change your own status.', 403, 'forbidden');
        $status = seg($segments, 3) === 'approve' ? 'approved' : 'suspended';
        $updated = $store->update('users', $targetId, ['status' => $status]);
        auditLog($store, $user['id'], 'user.' . seg($segments, 3), ['target_user_id' => $targetId]);
        Response::json(['user' => Auth::publicUser($updated)]);
    }
    if ($method === 'GET' && $action === 'audit-logs') {
        $user = $auth->requireRole(['admin']);
        $logs = $store->read('audit_logs');
        usort($logs, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
        Response::json(['audit_logs' => array_slice($logs, 0, 200)]);
    }
    if ($method === 'GET' && $action === 'backup') {
        $user = $auth->requireRole(['admin']);
        auditLog($store, $user['id'], 'admin.backup', []);
        Response::json(['backup' => $store->dumpAll(['users', 'exams', 'questions', 'attempts', 'results', 'subjects', 'announcements', 'settings', 'audit_logs']), 'exported_at' => gmdate('c')]);
    }
    if ($method === 'POST' && $action === 'restore') {
        $user = $auth->requireRole(['admin']);
        $data = $body['backup'] ?? $body['data'] ?? null;
        if (!is_array($data)) Response::error('Backup data is required.', 422, 'validation');
        $allowed = ['users', 'exams', 'questions', 'attempts', 'results', 'subjects', 'announcements', 'settings', 'audit_logs'];
        foreach ($data as $name => $rows) {
            if (in_array($name, $allowed, true) && is_array($rows)) $store->write($name, array_values($rows));
        }
        auditLog($store, $user['id'], 'admin.restore', []);
        Response::json(['message' => 'Backup restored.']);
    }
    if ($method === 'PUT' && $action === 'settings') {
        $user = $auth->requireRole(['admin']);
        $rows = $store->read('settings');
        $current = $rows[0] ?? ['id' => 'settings_main'];
        $patch = [];
        if (isset($body['site_name'])) $patch['site_name'] = Validator::str($body['site_name'], 120);
        if (isset($body['allow_registration'])) $patch['allow_registration'] = Validator::bool($body['allow_registration']);
        if (isset($body['maintenance_mode'])) $patch['maintenance_mode'] = Validator::bool($body['maintenance_mode']);
        if (isset($body['default_negative_marking'])) $patch['default_negative_marking'] = Validator::num($body['default_negative_marking'], 0, 1, 0.25);
        if (isset($body['default_duration_min'])) $patch['default_duration_min'] = Validator::int($body['default_duration_min'], 1, 300, 25);
        $updated = $store->update('settings', $current['id'], $patch) ?? $store->insert('settings', array_merge($current, $patch));
        auditLog($store, $user['id'], 'admin.settings', []);
        Response::json(['settings' => $updated]);
    }
    Response::error('Admin endpoint not found.', 404, 'not_found');
}

Response::error('Endpoint not found.', 404, 'not_found');
