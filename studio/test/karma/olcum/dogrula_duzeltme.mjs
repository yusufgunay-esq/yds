/* DOĞRULAMA: gerçek buildKarmaSet ile tekrar bloğu çeşitliliği (düzeltme sonrası)
   Gerçek motoru kullanır; set boyu bozulmaz. Ölçüt: due bloğunda kaç FARKLI
   soru, aynı soru kaç kez, kaç soru 5+ kez tekrarlandı. */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.resolve(here, '../../../js/engine.js'), 'utf8');
const tmp = path.join(here, '.engine.dogrula.mjs');
fs.writeFileSync(tmp, src, 'utf8');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });
const eng = await import(url.pathToFileURL(tmp).href);
const { buildKarmaSet, scheduleAfterAnswer, dueQuestions, SRS_LEECH, leechQuestions, KARMA_DUE_SHARE } = eng;
const { ALL, tierOf } = await import('./data.js');
const st = await import('./store.js');

const GUN = 9, GUNLUK = 45;
const core = ALL.filter(q => String(q.examTarget || '').startsWith('hmgs'));
const AD = { 1: 'T1 gerçek', 2: 'T2 benzeri', 3: 'T3 hâkimlik' };

function kosu(tohum) {
  let rnd = tohum;
  const rand = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
  const zorluk = new Map();
  for (const q of core) { const r = rand(); zorluk.set(q.id, r < 0.30 ? 0.30 : (r < 0.80 ? 0.60 : 0.88)); }
  const S = { answers: [], srs: {}, exams: [], settings: { dailyTarget: GUNLUK } };
  st.setState(S);

  const gorulme = new Map(), dueSunum = new Map();
  let cevap = 0, yeni = 0, tekrar = 0, erken = 0, setBoyu = 0;
  const katman = { 1: 0, 2: 0, 3: 0 }, gunluk = [];

  for (let g = 1; g <= GUN; g++) {
    if (g > 1) for (const r of Object.values(S.srs)) if (r.dueAt) r.dueAt = new Date(new Date(r.dueAt).getTime() - 86400000).toISOString();
    const kuyruk = dueQuestions().length;
    const r = buildKarmaSet(GUNLUK);
    setBoyu += r.questions.length;
    // Bu sette due bloğunda hangi sorular geldi? (vadeli + sette olan)
    const dueIds = new Set(dueQuestions().map(d => d.q.id));
    let gY = 0, gT = 0;
    for (const q of r.questions) {
      cevap++; katman[tierOf(q)]++;
      const o = gorulme.get(q.id) || 0;
      gorulme.set(q.id, o + 1);
      if (dueIds.has(q.id)) {
        dueSunum.set(q.id, (dueSunum.get(q.id) || 0) + 1);
        if (o > 0) { const srs = S.srs[q.id]; if (srs && srs.dueAt && new Date(srs.dueAt) > new Date()) erken++; }
      }
      if (o === 0) { yeni++; gY++; } else { tekrar++; gT++; }
      const ok = rand() < (zorluk.get(q.id) || 0.6);
      S.answers.push({ qId: q.id, subjectId: q.subjectId, ok, ms: 60000, at: new Date().toISOString() });
      scheduleAfterAnswer(q.id, ok);
    }
    gunluk.push({ g, yeni: gY, tekrar: gT, kuyruk, takiliHavuz: leechQuestions().length });
  }

  const s = [...dueSunum.values()];
  return {
    cevap, yeni, tekrar, erken,
    setBoyu, dueFarkli: dueSunum.size,
    dueSunum: s.reduce((a, b) => a + b, 0),
    enCok: s.length ? Math.max(...s) : 0,
    takili: [...gorulme.values()].filter(n => n >= 5).length,
    gorulnen: gorulme.size, katman, gunluk,
    takiliToplam: leechQuestions().length
  };
}

const ort = (rs, f) => rs.reduce((a, r) => a + f(r), 0) / rs.length;
const TOH = [1, 7, 42, 99, 2026];
const A = TOH.map(kosu);

console.log(`=== DÜZELTME SONRASI DOĞRULAMA (gerçek buildKarmaSet, ${GUN} gün × ${GUNLUK} soru, ${TOH.length} tohum) ===`);
console.log(`SRS_LEECH = ${SRS_LEECH} · due payı %${KARMA_DUE_SHARE * 100}\n`);
console.log(`  ortalama set boyu        ${(ort(A, r => r.setBoyu) / GUN).toFixed(1)} / ${GUNLUK}`);
console.log(`  due bloğu sunumu         ${Math.round(ort(A, r => r.dueSunum))}`);
console.log(`  due: FARKLI soru         ${Math.round(ort(A, r => r.dueFarkli))}   ← ÖNCE 36`);
console.log(`  aynı soru ort. kaç kez   ${(ort(A, r => r.dueSunum) / Math.max(1, ort(A, r => r.dueFarkli))).toFixed(1)}×  ← ÖNCE 2,9×`);
console.log(`  en çok dönen soru        ${Math.round(ort(A, r => r.enCok))}×`);
console.log(`  5+ kez sorulan           ${Math.round(ort(A, r => r.takili))}   ← ÖNCE 14`);
console.log(`  görülen farklı soru      ${Math.round(ort(A, r => r.gorulnen))} / ${core.length}`);
console.log(`  yeni soru oranı          %${(100 * ort(A, r => r.yeni) / ort(A, r => r.cevap)).toFixed(1)}`);
console.log(`  vadesi gelmeden tekrar   ${Math.round(ort(A, r => r.erken))}`);
console.log(`  takılı (leech) havuzu    ${Math.round(ort(A, r => r.takiliToplam))} soru — havuzdan çıkmadı`);

console.log('\nkatman dağılımı:');
for (const t of [1, 2, 3]) console.log(`  ${AD[t].padEnd(14)} %${(100 * ort(A, r => r.katman[t]) / ort(A, r => r.cevap)).toFixed(1)}`);

console.log('\ngün gün (tohum 7):');
const g0 = A[1].gunluk;
console.log('  gün | yeni | tekrar | vadesi gelen | takılı havuz');
for (const x of g0) console.log(`   ${String(x.g).padStart(2)} | ${String(x.yeni).padStart(4)} | ${String(x.tekrar).padStart(6)} | ${String(x.kuyruk).padStart(13)} | ${String(x.takiliHavuz).padStart(11)}`);
