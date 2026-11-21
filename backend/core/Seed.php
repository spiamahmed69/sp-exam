<?php
// First-run seeding. Runs on every request but only writes when a collection
// is missing/empty, so it never overwrites real data.
// Questions come from the REAL bank: backend/data-seed-questions.json
// (50 HSC 2026 Chemistry MCQs copied verbatim from src/data/chemistry.js).
// No new questions are invented here.
declare(strict_types=1);

class Seed
{
    public static function run(JsonStorage $store, array $config): void
    {
        // Subjects
        if (empty($store->read('subjects'))) {
            $subjects = [];
            foreach (['Chemistry', 'Physics', 'Mathematics', 'Biology', 'English', 'Bangla'] as $name) {
                $subjects[] = $store->insert('subjects', ['name' => $name, 'description' => $name . ' examinations']);
            }
            $chem = $subjects[0];
        } else {
            $chem = $store->find('subjects', 'name', 'Chemistry');
        }

        // Users (seed accounts — change these passwords after first login!)
        if (empty($store->read('users'))) {
            $store->insert('users', [
                'id' => 'user_admin', 'name' => 'SP Admin', 'email' => 'admin@sp-exam.local',
                'password_hash' => Auth::hashPassword('Admin123!'), 'role' => 'admin', 'status' => 'approved',
            ]);
            $store->insert('users', [
                'id' => 'user_teacher', 'name' => 'SP Teacher', 'email' => 'teacher@sp-exam.local',
                'password_hash' => Auth::hashPassword('Teacher123!'), 'role' => 'teacher', 'status' => 'approved',
            ]);
            $store->insert('users', [
                'id' => 'user_student', 'name' => 'SP Student', 'email' => 'student@sp-exam.local',
                'password_hash' => Auth::hashPassword('Student123!'), 'role' => 'student', 'status' => 'approved',
            ]);
        }
        $teacher = $store->find('users', 'email', 'teacher@sp-exam.local');

        // Questions from the real bank
        if (empty($store->read('questions'))) {
            $seedFile = $config['seed_questions_file'];
            $raw = file_exists($seedFile) ? json_decode((string) file_get_contents($seedFile), true) : [];
            foreach ((array) $raw as $q) {
                $store->insert('questions', [
                    'id' => $q['id'],
                    'exam_id' => $q['paper'] === 'paper-1' ? 'exam_chem_paper1' : 'exam_chem_paper2',
                    'paper' => $q['paper'],
                    'type' => 'mcq',
                    'q' => $q['q'],
                    'o' => $q['o'],
                    'a' => $q['a'],
                    'marks' => 1,
                    'chapter' => $q['chapter'],
                    'topic' => $q['topic'],
                    'stimulus' => $q['stimulus'] ?? null,
                ]);
            }
        }

        // Exams built from the real bank
        if (empty($store->read('exams'))) {
            $p1 = array_column(array_filter($store->read('questions'), fn($q) => ($q['paper'] ?? '') === 'paper-1'), 'id');
            $p2 = array_column(array_filter($store->read('questions'), fn($q) => ($q['paper'] ?? '') === 'paper-2'), 'id');
            $store->insert('exams', [
                'id' => 'exam_chem_paper1',
                'title' => 'HSC Chemistry 1st Paper — Model Exam',
                'subject_id' => $chem['id'] ?? null,
                'description' => 'HSC 2026 Chemistry 1st Paper (Code 176, Set ক) — 25 real MCQs from the SP question bank.',
                'type' => 'mcq', 'duration_min' => 25, 'negative_marking' => 0.25,
                'randomize' => true, 'published' => true,
                'starts_at' => null, 'ends_at' => null,
                'created_by' => $teacher['id'] ?? null, 'question_ids' => $p1,
            ]);
            $store->insert('exams', [
                'id' => 'exam_chem_paper2',
                'title' => 'HSC Chemistry 2nd Paper — Model Exam',
                'subject_id' => $chem['id'] ?? null,
                'description' => 'HSC 2026 Chemistry 2nd Paper (Code 177, Set খ) — 25 real MCQs from the SP question bank.',
                'type' => 'mcq', 'duration_min' => 25, 'negative_marking' => 0.25,
                'randomize' => true, 'published' => true,
                'starts_at' => null, 'ends_at' => null,
                'created_by' => $teacher['id'] ?? null, 'question_ids' => $p2,
            ]);
        }

        // Announcements
        if (empty($store->read('announcements'))) {
            $store->insert('announcements', [
                'title' => 'Welcome to SP Exam',
                'body' => 'HSC Chemistry 1st and 2nd Paper model exams are now live — 25 real MCQs each, 25 minutes, 0.25 negative marking.',
                'created_by' => $teacher['id'] ?? null,
            ]);
        }

        // Settings (single-row collection)
        if (empty($store->read('settings'))) {
            $store->insert('settings', [
                'id' => 'settings_main',
                'site_name' => 'SP Exam',
                'allow_registration' => true,
                'default_negative_marking' => 0.25,
                'default_duration_min' => 25,
                'maintenance_mode' => false,
            ]);
        }

        // Ensure empty collections exist
        foreach (['attempts', 'results', 'sessions', 'audit_logs', 'rate_limits'] as $c) {
            $store->read($c);
        }
    }
}
