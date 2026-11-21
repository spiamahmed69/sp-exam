/**
 * Vercel Serverless Function — AAP Pathshala connection test.
 *
 * GET /api/aapathshala-test
 * Does a server-side GET to https://aapathshala.com/exams and returns JSON:
 *   { reachable, status, hasPublicApi: false, message, checkedAt }
 *
 * Honest scope: this only checks whether the site is reachable. AAP Pathshala
 * has NO public API, developer docs, data export or authorised integration
 * (verified 2026-11-21 — see README and the research report), so this
 * function never fetches, returns or claims to fetch any AAP questions.
 * No secrets are used or exposed; there are none.
 */

export default async function handler(req, res) {
  const startedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://aapathshala.com/exams', {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'SP-Exam connection test' },
    });
    const status = response.status;
    // Read only the status — the body is not needed and is not reused.
    await response.arrayBuffer().catch(() => null);
    return res.status(200).json({
      reachable: status >= 200 && status < 400,
      status,
      hasPublicApi: false,
      message:
        'aapathshala.com/exams পৌঁছানো গেছে, কিন্তু AAP Pathshala-র কোনো পাবলিক API নেই। তাই SP Exam তাদের প্রশ্ন আনতে পারে না; পরীক্ষা চলে SP-এর নিজস্ব প্রশ্নব্যাংক দিয়ে। AAP-র প্রশ্ন ব্যবহার করতে লিখিত অনুমতি লাগবে: +880 1710-090043, aapathshala09@gmail.com',
      checkedAt: startedAt,
    });
  } catch (err) {
    const isTimeout = err?.name === 'AbortError';
    return res.status(200).json({
      reachable: false,
      status: null,
      hasPublicApi: false,
      message: isTimeout
        ? 'aapathshala.com/exams-এর সাড়া সময়মতো পাওয়া যায়নি (timeout)।'
        : 'aapathshala.com/exams-এ পৌঁছানো যায়নি। নেটওয়ার্ক বা সাইটের সমস্যা হতে পারে।',
      error: String(err?.message || err),
      checkedAt: startedAt,
    });
  } finally {
    clearTimeout(timeout);
  }
}
