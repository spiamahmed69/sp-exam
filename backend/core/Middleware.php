<?php
// Middleware: CORS (allow-list only), JSON body parsing, per-IP rate limiting.
declare(strict_types=1);

class Middleware
{
    private array $config;
    private JsonStorage $store;

    public function __construct(array $config, JsonStorage $store)
    {
        $this->config = $config;
        $this->store = $store;
    }

    public function cors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin && in_array($origin, $this->config['allowed_origins'], true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
            header('Vary: Origin');
        }
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    /** Parse the JSON request body (empty body => []). */
    public function body(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === '' || $raw === false) {
            return [];
        }
        $data = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            Response::error('Request body must be valid JSON.', 400, 'bad_json');
        }
        return $data;
    }

    public function clientIp(): string
    {
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    /** Fixed-window rate limit. $group = 'general' | 'auth'. */
    public function rateLimit(string $group = 'general'): void
    {
        $cfg = $this->config['rate_limit'][$group] ?? $this->config['rate_limit']['general'];
        $key = $group . ':' . $this->clientIp();
        $rows = $this->store->read('rate_limits');
        $now = time();
        $entry = null;
        foreach ($rows as $r) {
            if (($r['key'] ?? '') === $key) {
                $entry = $r;
                break;
            }
        }
        if (!$entry || $now - (int) $entry['window_start'] >= (int) $cfg['window']) {
            $entry = ['id' => 'rl_' . md5($key), 'key' => $key, 'window_start' => $now, 'count' => 0];
        }
        $entry['count'] = (int) $entry['count'] + 1;
        $found = false;
        foreach ($rows as $i => $r) {
            if (($r['key'] ?? '') === $key) {
                $rows[$i] = $entry;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $rows[] = $entry;
        }
        $this->store->write('rate_limits', $rows);
        if ((int) $entry['count'] > (int) $cfg['max']) {
            Response::error('Too many requests. Please wait a moment and try again.', 429, 'rate_limited');
        }
    }
}

/** Append an audit-log entry. Called on every admin/teacher write + exam start/submit. */
function auditLog(JsonStorage $store, ?string $userId, string $action, array $details = []): void
{
    $store->insert('audit_logs', [
        'user_id' => $userId,
        'action' => $action,
        'details' => $details,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    ]);
}
