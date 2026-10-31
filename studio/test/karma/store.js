export const TARGET_SEC=75, PASS_CORRECT=84, EXAM_TOTAL=120;
/* engine.js:16 `EXAM_DATE`'i de import ediyor (gerçek store.js:17 ile aynı
   tarih). Eksikti; testler "does not provide an export named EXAM_DATE"
   SyntaxError'uyla hiç koşmadan düşüyordu (20 Eylül 2026, v3.2 turu). */
export const EXAM_DATE = new Date('2026-09-27T10:15:00');
export let _S={answers:[],srs:{},exams:[],settings:{dailyTarget:40}};
export function state(){return _S;}
/* daysLeft testten değiştirilebilir: endgame (sınav ufku) davranışı ölçülsün. */
export let _gun = 15;
export function _setGun(n){ _gun = n; }
export function daysLeft(){return _gun;}
export function answersToday(){return [];}
export function lastExam(){return _S.exams[_S.exams.length-1]||null;}
/* engine.js:13 `todayKey`'i import ediyor. Bu stub'da karşılığı yoktu; ESM
   eksik export'ta SyntaxError attığı için dosyadaki import çözülemiyor ve
   karma testlerinin TAMAMI (0/...) hiç koşmadan düşüyordu. Gövde gerçek
   store.js:241 ile birebir aynı tutulur ki test, üretimdekinin davranışını
   ölçsün — stub kendi uydurma tarih mantığını taşımasın. */
export function todayKey(d = new Date()){return d.toISOString().slice(0,10);}
