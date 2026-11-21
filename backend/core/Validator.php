<?php
// Input validation + sanitisation helpers. All user input passes through here.
declare(strict_types=1);

class Validator
{
    public static function str($v, int $max = 500): string
    {
        if (!is_string($v)) {
            $v = (string) ($v ?? '');
        }
        $v = trim(strip_tags($v));
        $v = preg_replace('/\s+/', ' ', $v) ?? '';
        return mb_substr($v, 0, $max);
    }

    public static function text($v, int $max = 5000): string
    {
        // Longer free text (question stems, CQ answers): strip tags, keep newlines.
        if (!is_string($v)) {
            $v = (string) ($v ?? '');
        }
        return mb_substr(trim(strip_tags($v)), 0, $max);
    }

    public static function email($v): ?string
    {
        $v = strtolower(trim((string) ($v ?? '')));
        return filter_var($v, FILTER_VALIDATE_EMAIL) ? $v : null;
    }

    public static function int($v, int $min, int $max, ?int $default = null): ?int
    {
        if ($v === null || $v === '') {
            return $default;
        }
        if (!is_numeric($v)) {
            return $default;
        }
        $n = (int) $v;
        return max($min, min($max, $n));
    }

    public static function num($v, float $min, float $max, float $default = 0.0): float
    {
        if (!is_numeric($v)) {
            return $default;
        }
        return max($min, min($max, (float) $v));
    }

    public static function bool($v, bool $default = false): bool
    {
        if ($v === null) {
            return $default;
        }
        return filter_var($v, FILTER_VALIDATE_BOOLEAN);
    }

    public static function requireFields(array $body, array $fields): void
    {
        foreach ($fields as $f) {
            if (!isset($body[$f]) || $body[$f] === '' || $body[$f] === null) {
                Response::error("Field '{$f}' is required.", 422, 'validation');
            }
        }
    }

    public static function id($v): string
    {
        return preg_replace('/[^A-Za-z0-9_\-]/', '', (string) ($v ?? ''));
    }
}
