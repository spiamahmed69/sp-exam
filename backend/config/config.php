<?php
// SP Exam backend — configuration.
// No secrets are committed here. Token secret comes from env SP_EXAM_TOKEN_SECRET
// or from config/secret.key (generated on first run, never committed).
declare(strict_types=1);

$allowedEnv = getenv('SP_EXAM_ALLOWED_ORIGINS');
$allowed = $allowedEnv ? array_map('trim', explode(',', $allowedEnv)) : [];
$allowed = array_merge($allowed, [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'https://sp-exam-sage.vercel.app',
]);

$secretFile = __DIR__ . '/secret.key';
$secret = getenv('SP_EXAM_TOKEN_SECRET') ?: false;
if (!$secret) {
    if (file_exists($secretFile)) {
        $secret = trim((string) file_get_contents($secretFile));
    } else {
        $secret = bin2hex(random_bytes(32));
        @file_put_contents($secretFile, $secret, LOCK_EX);
        @chmod($secretFile, 0600);
    }
}

return [
    'data_dir' => realpath(__DIR__ . '/../data') ?: (__DIR__ . '/../data'),
    'seed_questions_file' => __DIR__ . '/../data-seed-questions.json',
    'allowed_origins' => array_values(array_unique(array_filter($allowed))),
    'token_secret' => $secret,
    'session_ttl_seconds' => 7 * 24 * 3600, // 7 days
    'rate_limit' => [
        'general' => ['max' => 100, 'window' => 600], // 100 req / 10 min / IP
        'auth' => ['max' => 10, 'window' => 60],      // 10 req / min / IP
    ],
    'app_name' => 'SP Exam',
    'version' => '1.0.0',
];
