<?php
// Authentication: password_hash/password_verify, server-side Bearer sessions
// stored in data/sessions.json (token hash only, 7-day expiry), role checks.
// Password hashes are NEVER returned by any endpoint (see publicUser()).
declare(strict_types=1);

class Auth
{
    private JsonStorage $store;
    private array $config;

    public function __construct(JsonStorage $store, array $config)
    {
        $this->store = $store;
        $this->config = $config;
    }

    public static function hashPassword(string $plain): string
    {
        return password_hash($plain, PASSWORD_DEFAULT);
    }

    public static function verifyPassword(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }

    /** Public-safe user shape — no password hash, ever. */
    public static function publicUser(array $u): array
    {
        return [
            'id' => $u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'role' => $u['role'],
            'status' => $u['status'],
            'created_at' => $u['created_at'] ?? null,
        ];
    }

    public function createSession(array $user): string
    {
        $token = bin2hex(random_bytes(32));
        $this->store->insert('sessions', [
            'token_hash' => hash_hmac('sha256', $token, (string) $this->config['token_secret']),
            'user_id' => $user['id'],
            'expires_at' => gmdate('c', time() + (int) $this->config['session_ttl_seconds']),
        ]);
        return $token;
    }

    public function destroySession(string $token): void
    {
        $hash = hash_hmac('sha256', $token, (string) $this->config['token_secret']);
        $rows = $this->store->read('sessions');
        $next = array_values(array_filter($rows, fn($s) => ($s['token_hash'] ?? '') !== $hash));
        if (count($next) !== count($rows)) {
            $this->store->write('sessions', $next);
        }
    }

    /** Returns the authenticated user array, or null. */
    public function userFromRequest(): ?array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/^Bearer\s+(\S+)$/i', trim($header), $m)) {
            return null;
        }
        $token = $m[1];
        $hash = hash_hmac('sha256', $token, (string) $this->config['token_secret']);
        $session = $this->store->find('sessions', 'token_hash', $hash);
        if (!$session) {
            return null;
        }
        if (strtotime((string) $session['expires_at']) < time()) {
            $this->store->delete('sessions', $session['id']);
            return null;
        }
        $user = $this->store->find('users', 'id', $session['user_id']);
        if (!$user || ($user['status'] ?? '') === 'suspended') {
            return null;
        }
        return $user;
    }

    /** Require a logged-in user; 401 otherwise. */
    public function requireUser(): array
    {
        $user = $this->userFromRequest();
        if (!$user) {
            Response::error('Authentication required. Please log in.', 401, 'unauthenticated');
        }
        return $user;
    }

    /** Require one of the given roles; 403 otherwise. */
    public function requireRole(array $roles): array
    {
        $user = $this->requireUser();
        if (!in_array($user['role'], $roles, true)) {
            Response::error('You do not have permission to do that.', 403, 'forbidden');
        }
        return $user;
    }
}
