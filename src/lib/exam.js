import { PAPERS } from '../data/chemistry.js';
import { CHAPTERS } from '../data/catalog.js';

export const LETTERS = ['ক', 'খ', 'গ', 'ঘ'];

export function getPaper(paperId) {
  return PAPERS.find((p) => p.id === paperId);
}

/** Questions of a paper, optionally filtered by chapter / topic. */
export function filterQuestions(paperId, chapter, topic) {
  const paper = getPaper(paperId);
  if (!paper) return [];
  return paper.questions.filter(
    (q) =>
      (!chapter || chapter === 'all' || q.chapter === chapter) &&
      (!topic || topic === 'all' || q.topic === topic),
  );
}

/** Chapters of a paper with their local question counts. */
export function chaptersWithCounts(paperId) {
  const paper = getPaper(paperId);
  if (!paper) return [];
  return (CHAPTERS[paperId] || []).map((ch) => {
    const qs = paper.questions.filter((q) => q.chapter === ch.name);
    const topics = topicsWithCounts(paperId, ch.name);
    return { ...ch, count: qs.length, topics };
  });
}

/** Topics of one chapter with local question counts.
 *  Topics that exist in the bank but are not in the catalogue are appended. */
export function topicsWithCounts(paperId, chapterName) {
  const paper = getPaper(paperId);
  if (!paper) return [];
  const chapter = (CHAPTERS[paperId] || []).find((c) => c.name === chapterName);
  const names = [...(chapter?.topics || [])];
  for (const q of paper.questions) {
    if (q.chapter === chapterName && !names.includes(q.topic)) names.push(q.topic);
  }
  return names.map((name) => ({
    name,
    count: paper.questions.filter((q) => q.chapter === chapterName && q.topic === name).length,
  }));
}

/** Fisher–Yates shuffle (a copy; the bank is never mutated). */
export function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function bn(n) {
  return String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);
}

/** Score an exam. Returns raw numbers; nothing is rounded away silently. */
export function scoreExam(questions, answers, { negative = 0, secondTimer = false } = {}) {
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  for (const q of questions) {
    const a = answers[q.id];
    if (a === undefined || a === null) blank += 1;
    else if (a === q.a) correct += 1;
    else wrong += 1;
  }
  const totalMarks = questions.length * 1;
  const negativeMarks = wrong * negative;
  const secondTimerDeduction = secondTimer ? totalMarks * 0.05 : 0;
  const score = correct * 1 - negativeMarks - secondTimerDeduction;
  return { correct, wrong, blank, totalMarks, negativeMarks, secondTimerDeduction, score };
}
