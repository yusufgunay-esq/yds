export const TARGET_SEC = 75, PASS_CORRECT = 84, EXAM_TOTAL = 120;
export let _S = { answers: [], srs: {}, exams: [], settings: { dailyTarget: 40 } };
export function state() { return _S; }
export function setState(s) { _S = s; }
export function daysLeft() { return 9; }
export function answersToday() { return []; }
export function lastExam() { return _S.exams[_S.exams.length - 1] || null; }
export function todayKey(d = new Date()) { return d.toISOString().slice(0, 10); }
