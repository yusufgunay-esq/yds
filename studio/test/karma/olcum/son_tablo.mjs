/* SON TABLO: katman sırası değişikliğinden sonra ders bazında ne geliyor?
   Hangi ders T1 ile doluyor, hangisi T2/T3'e iniyor? */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.resolve(here, '../../../js/engine.js'), 'utf8');
const tmp = path.join(here, '.engine.sontablo.mjs');
fs.writeFileSync(tmp, src, 'utf8');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });
const eng = await import(url.pathToFileURL(tmp).href);
const { buildKarmaSet, scheduleAfterAnswer, karmaGaps } = eng;
const { ALL, tierOf } = await import('./data.js');
const { SUBJECTS } = await import('./data.js');
const st = await import('./store.js');

const GUN = 9, GUNLUK = 45;
const core = ALL.filter(q => String(q.examTarget || '').startsWith('hmgs'));

// Ders bazında HMGS havuzu
console.log('=== DERS BAZINDA HMGS HAVUZU (T1 gerçek + T2 benzeri) vs 9 GÜNLÜK İHTİYAÇ ===');
console.log('ders                 | examQ | T1 | T2 | HMGS | 9 günde gerek | yeter mi');
const ihtiyac = {};
for (const s of SUBJECTS) {
  const t1 = core.filter(q => q.subjectId === s.id && tierOf(q) === 1).length;
  const t2 = core.filter(q => q.subjectId === s.id && tierOf(q) === 2).length;
  const need = Math.round(GUNLUK * GUN * (s.examQ / 120));
  ihtiyac[s.id] = need;
  console.log(`${s.id.padEnd(20)} | ${String(s.examQ).padStart(5)} | ${String(t1).padStart(2)} | ${String(t2).padStart(2)} | ${String(t1 + t2).padStart(4)} | ${String(need).padStart(13)} | ${t1 + t2 >= need ? '✅' : '⚠  ' + (need - t1 - t2) + ' eksik'}`);
}

function kosu(tohum) {
  let rnd = tohum;
  const rand = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
  const zorluk = new Map();
  for (const q of core) { const r = rand(); zorluk.set(q.id, r < 0.30 ? 0.30 : (r < 0.80 ? 0.60 : 0.88)); }
  const S = { answers: [], srs: {}, exams: [], settings: { dailyTarget: GUNLUK } };
  st.setState(S);
  const katman = { 1: 0, 2: 0, 3: 0 }, dersKatman = new Map(), gorulme = new Set();
  let toplam = 0;
  for (let g = 1; g <= GUN; g++) {
    if (g > 1) for (const r of Object.values(S.srs)) if (r.dueAt) r.dueAt = new Date(new Date(r.dueAt).getTime() - 86400000).toISOString();
    for (const q of buildKarmaSet(GUNLUK).questions) {
      toplam++;
      const t = tierOf(q);
      katman[t]++;
      gorulme.add(q.id);
      if (!dersKatman.has(q.subjectId)) dersKatman.set(q.subjectId, { 1: 0, 2: 0, 3: 0 });
      dersKatman.get(q.subjectId)[t]++;
      const ok = rand() < (zorluk.get(q.id) || 0.6);
      S.answers.push({ qId: q.id, subjectId: q.subjectId, ok, ms: 60000, at: new Date().toISOString() });
      scheduleAfterAnswer(q.id, ok);
    }
  }
  return { katman, dersKatman, toplam, gorulme: gorulme.size };
}

const TOH = [1, 7, 42, 99, 2026];
const A = TOH.map(kosu);
const ort = (rs, f) => rs.reduce((a, r) => a + f(r), 0) / rs.length;

console.log('\n=== SONUÇ (9 gün × 45 soru, 5 tohum) ===');
const top = ort(A, r => r.toplam);
for (const t of [1, 2, 3]) {
  const ad = { 1: 'T1 gerçek HMGS', 2: 'T2 HMGS benzeri', 3: 'T3 hâkimlik' }[t];
  console.log(`  ${ad.padEnd(18)} %${(100 * ort(A, r => r.katman[t]) / top).toFixed(1)}`);
}
console.log(`  görülen farklı soru ${Math.round(ort(A, r => r.gorulme))} / ${core.length} core`);

console.log('\nDERS BAZINDA çözülen (tohum 7) — T1/T2/T3:');
const dk = A[1].dersKatman;
for (const s of SUBJECTS) {
  const d = dk.get(s.id) || { 1: 0, 2: 0, 3: 0 };
  const tot = d[1] + d[2] + d[3];
  if (!tot) continue;
  const uyari = d[3] > 0 ? '  ← T3 devrede' : '';
  console.log(`  ${s.id.padEnd(20)} ${String(tot).padStart(3)} soru · T1 ${String(d[1]).padStart(3)} · T2 ${String(d[2]).padStart(2)} · T3 ${String(d[3]).padStart(2)}${uyari}`);
}

console.log('\nkâğıtta kalan dersler (karmaGaps):', JSON.stringify(karmaGaps().map(g => g.id + '(' + g.pool + '/' + (g.examQ * 2) + ')')));
