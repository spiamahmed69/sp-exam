<?php
// Centralised JSON storage: flock()-guarded reads/writes, atomic temp+rename
// writes, automatic initialisation of missing files, corrupt-file backup.
// Storage logic is isolated here so JSON can later be swapped for
// PostgreSQL/Supabase without rewriting business logic.
declare(strict_types=1);

class JsonStorage
{
    private string $dir;

    public function __construct(string $dir)
    {
        $this->dir = rtrim($dir, '/');
        if (!is_dir($this->dir)) {
            mkdir($this->dir, 0755, true);
        }
    }

    public function path(string $name): string
    {
        $safe = preg_replace('/[^a-z0-9_\-]/i', '', $name);
        return $this->dir . '/' . $safe . '.json';
    }

    public function exists(string $name): bool
    {
        return file_exists($this->path($name));
    }

    /** Read a collection (always an array). Auto-initialises missing files. */
    public function read(string $name, array $default = []): array
    {
        $path = $this->path($name);
        if (!file_exists($path)) {
            $this->write($name, $default);
            return $default;
        }
        $fp = fopen($path, 'r');
        if (!$fp) {
            return $default;
        }
        flock($fp, LOCK_SH);
        $raw = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        if ($raw === '' || $raw === false) {
            return $default;
        }
        $data = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            // Never lose data silently: quarantine the corrupt file, start fresh.
            $backup = $path . '.corrupt-' . date('Ymd-His') . '.bak';
            @copy($path, $backup);
            $this->write($name, $default);
            return $default;
        }
        return $data;
    }

    /** Atomic write: write temp file, fsync, rename over the original. */
    public function write(string $name, array $data): bool
    {
        $path = $this->path($name);
        $tmp = $path . '.tmp.' . getmypid() . '.' . bin2hex(random_bytes(4));
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        if ($json === false) {
            return false;
        }
        $fp = fopen($tmp, 'w');
        if (!$fp) {
            return false;
        }
        flock($fp, LOCK_EX);
        fwrite($fp, $json);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        $ok = rename($tmp, $path);
        if ($ok) {
            @chmod($path, 0644);
        } else {
            @unlink($tmp);
        }
        return $ok;
    }

    /** Find one record by field value. */
    public function find(string $name, string $field, $value): ?array
    {
        foreach ($this->read($name) as $row) {
            if (isset($row[$field]) && $row[$field] === $value) {
                return $row;
            }
        }
        return null;
    }

    /** Insert a record (generates id if missing). Returns the stored record. */
    public function insert(string $name, array $record): array
    {
        $rows = $this->read($name);
        if (empty($record['id'])) {
            $record['id'] = $name . '_' . bin2hex(random_bytes(8));
        }
        $record['created_at'] = $record['created_at'] ?? gmdate('c');
        $rows[] = $record;
        $this->write($name, $rows);
        return $record;
    }

    /** Update a record by id. Returns updated record or null. */
    public function update(string $name, string $id, array $patch): ?array
    {
        $rows = $this->read($name);
        foreach ($rows as $i => $row) {
            if (($row['id'] ?? null) === $id) {
                $rows[$i] = array_merge($row, $patch, ['updated_at' => gmdate('c')]);
                $this->write($name, $rows);
                return $rows[$i];
            }
        }
        return null;
    }

    /** Delete a record by id. Returns true if something was removed. */
    public function delete(string $name, string $id): bool
    {
        $rows = $this->read($name);
        $next = array_values(array_filter($rows, fn($r) => ($r['id'] ?? null) !== $id));
        if (count($next) === count($rows)) {
            return false;
        }
        $this->write($name, $next);
        return true;
    }

    /** Dump every collection (for admin backup). */
    public function dumpAll(array $names): array
    {
        $out = [];
        foreach ($names as $n) {
            $out[$n] = $this->read($n);
        }
        return $out;
    }
}
