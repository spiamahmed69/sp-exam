<?php
// Consistent JSON API responses: { success, data, error }.
declare(strict_types=1);

class Response
{
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => $status < 400, 'data' => $data, 'error' => null],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $status = 400, ?string $code = null): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'data' => null,
            'error' => ['message' => $message, 'code' => $code ?? ('http_' . $status)]],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
