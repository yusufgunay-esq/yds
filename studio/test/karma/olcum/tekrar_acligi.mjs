/* TEKRAR AÇLIĞI (STARVATION) SİMÜLASYONU
   Hipotez: dueQuestions `lapses DESC` sıralıyor ve due bloğu setin %30'u.
   Üst üste yanlış yapılan sorular her gün ilk slotları kalıcı işgal ediyor.
   Gerçekçilik: her sorunun kullanıcı için GİZLİ bir isabet oranı var
   (sınavda bazı sorular hep zor, bazıları hep kolay). Sabit %55 yanıltıcıydı. */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.resolve(here, '../../../js/engine.js'), 'utf8');
const tmp = path.join(here, '.engine.starve.mjs');
fs.writeFileSync(tmp, src, 'utf8');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });

const eng = await import(url.pathToFileURL(tmp).href);
const { buildKarmaSet, scheduleAfterAnswer, dueQuestions, BOXES, KARMA_DUE_SHARE } = eng;
const { ALL, tierOf } = await import('./data.js');
const st = await import('./store.js');

const GUN = 9, GUNLUK = 45;
const core = ALL.filter(q => String(q.examTarget || '').startsWith('hmgs'));
const AD = { 1: 'T1 gerçek', 2: 'T2 benzeri', 3: 'T3 hâkimlik' };

function kosu(tohum, leechEsigi = Infinity) {
  let rnd = tohum;
  const rand = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;

  // Gizli zorluk: %30'u zor (isabet %30), %50 orta (%60), %20 kolay (%88)
  const zorluk = new Map();
  for (const q of core) {
    const r = rand();
    zorluk.set(q.id, r < 0.30 ? 0.30 : (r < 0.80 ? 0.60 : 0.88));
  }

  const S = { answers: [], srs: {}, exams: [], settings: { dailyTarget: GUNLUK } };
  st.setState(S);
  const gorulme = new Map();
  let cevap = 0, yeni = 0, tekrar = 0, erken = 0;
  const gunluk = [];
  const leechHavuzu = new Set();   // due bloğundan çıkarılanlar

  for (let g = 1; g <= GUN; g++) {
    if (g > 1) for (const r of Object.values(S.srs)) {
      if (r.dueAt) r.dueAt = new Date(new Date(r.dueAt).getTime() - 86400000).toISOString();
    }
    // LEECH FİLTRESİ (deney koşulu): çok takılınan soru due bloğuna girmez
    const tumDue = dueQuestions();
    const due = leechEsigi === Infinity ? tumDue : tumDue.filter(d => (d.srs.lapses || 0) < leechEsigi);
    const dueKap = Math.floor(GUNLUK * KARMA_DUE_SHARE);
    const secilenDue = due.slice(0, dueKap);          // kod: dueQuestions sırası korunur
    let gYeni = 0, gTekrar = 0, gErken = 0, gLeech = 0;
    const dueIds = new Set(secilenDue.map(d => d.q.id));
    leechHavuzu.clear();
    if (leechEsigi !== Infinity) for (const d of tumDue) if ((d.srs.lapses || 0) >= leechEsigi) leechHavuzu.add(d.q.id);

    // Seti gerçek motorla kur, sonra due kısmını bizim listemizle değiştir
    const r = buildKarmaSet(GUNLUK);
    const govde = r.questions.filter(q => !dueIds.has(q.id));
    const set = secilenDue.map(d => d.q).concat(govde);
    const son = set.slice(0, GUNLUK);

    for (const q of son) {
      cevap++;
      const onceki = gorulme.get(q.id) || 0;
      gorulme.set(q.id, onceki + 1);
      if (onceki === 0) { yeni++; gYeni++; } else { tekrar++; gTekrar++; }
      if (leechHavuzu.has(q.id)) gLeech++;
      const srs = S.srs[q.id];
      if (srs && onceki > 0 && srs.dueAt && new Date(srs.dueAt) > new Date()) { erken++; gErken++; }
      const ok = rand() < (zorluk.get(q.id) || 0.6);
      S.answers.push({ qId: q.id, subjectId: q.subjectId, ok, ms: 60000, at: new Date().toISOString() });
      scheduleAfterAnswer(q.id, ok);
    }
    gunluk.push({ g, yeni: gYeni, tekrar: gTekrar, erken: gErken, dueToplam: tumDue.length, leech: gLeech });
  }

  // Takılı sorular: due bloğunda en sık tekrar edenler
  const sik = [...gorulme.entries()].filter(([, n]) => n >= 4).length;
  const kalan = core.length - gorulme.size;
  return { cevap, yeni, tekrar, erken, gorulnen: gorulme.size, sik, kalan, gunluk };
}

const ort = (rs, f) => rs.reduce((a, r) => a + f(r), 0) / rs.length;

console.log('=== TEKRAR AÇLIĞI — MEVCUT KOD (due sıralaması: lapses DESC) ===');
console.log(`${GUN} gün × ${GUNLUK} soru · gizli zorluk: %30 zor / %50 orta / %20 kolay\n`);
const A = [1, 7, 42, 99, 2026].map(t => kosu(t));
console.log(`  toplam cevap        ${Math.round(ort(A, r => r.cevap))}`);
console.log(`  görülen FARKLI soru ${Math.round(ort(A, r => r.gorulnen))}  (havuz ${core.length}, kalan ${Math.round(ort(A, r => r.kalan))})`);
console.log(`  yeni soru           ${Math.round(ort(A, r => r.yeni))}  (%${(100 * ort(A, r => r.yeni) / ort(A, r => r.cevap)).toFixed(1)})`);
console.log(`  tekrar sorusu       ${Math.round(ort(A, r => r.tekrar))}  (%${(100 * ort(A, r => r.tekrar) / ort(A, r => r.cevap)).toFixed(1)})`);
console.log(`  4+ kez sorulan soru ${Math.round(ort(A, r => r.sik))}  ← "takılı" sorular`);

console.log('\ngün gün (ilk tohum) — yeni soru oranı düşüyor mu?');
console.log('  gün | yeni | tekrar | yeni% | vadesi gelen | takılı');
for (const x of A[1].gunluk) {  // tohum 7
  const top = x.yeni + x.tekrar;
  console.log(`   ${String(x.g).padStart(2)} | ${String(x.yeni).padStart(4)} | ${String(x.tekrar).padStart(6)} | %${String((100 * x.yeni / top).toFixed(0)).padStart(4)} | ${String(x.dueToplam).padStart(12)} | ${x.leech}`);
}
