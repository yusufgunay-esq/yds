/* Çok günlük çalışma simülasyonu: SRS tekrarı ile yeni soru dengesi.
   Soru: "hep aynı sorular mı çıkıyor, yeni soru görüyor muyum?"
   Ölçüler: görülen farklı soru, tekrar oranı, VADESİ GELMEDEN tekrar,
            katman dağılımı. Gerçek soru bankası + gerçek engine. */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.resolve(here, '../../../js/engine.js'), 'utf8');
const tmp = path.join(here, '.engine.sim.mjs');
fs.writeFileSync(tmp, src, 'utf8');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });

const eng = await import(url.pathToFileURL(tmp).href);
const { buildKarmaSet, scheduleAfterAnswer, dueQuestions, BOXES, KARMA_DUE_SHARE } = eng;
const { ALL, tierOf } = await import('./data.js');
const st = await import('./store.js');

const AD = { 1: 'T1 gerçek', 2: 'T2 benzeri', 3: 'T3 hâkimlik' };
const GUN = 9, GUNLUK = 41, HEDEF_DOGRULUK = 0.55;

function kosu(tohum) {
  let rnd = tohum;
  const rand = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
  const S = { answers: [], srs: {}, exams: [], settings: { dailyTarget: GUNLUK } };
  st.setState(S);

  const ilkGorulme = new Map();      // qId → gün
  const gorulmeSayisi = new Map();
  let cevap = 0, tekrar = 0, erkenTekrar = 0, yeni = 0;
  const katman = { 1: 0, 2: 0, 3: 0 };
  const gunluk = [];

  for (let g = 1; g <= GUN; g++) {
    // Sahte saat yok: engine `new Date()` (gerçek şimdi) kullanıyor. Gün geçişini
    // SRS vade tarihlerini bir gün GERİ kaydırarak simüle ediyoruz — böylece
    // "dün vadesi gelmiş" durumu gerçekten oluşuyor. (İlk denemede bu yapılmadı
    // ve simülasyon "0 tekrar" dedi; ölçüm yanlıştı, kod değil.)
    if (g > 1) {
      for (const r of Object.values(S.srs)) {
        if (r.dueAt) r.dueAt = new Date(new Date(r.dueAt).getTime() - 86400000).toISOString();
      }
    }
    const vadesiGelen = dueQuestions().length;
    const r = buildKarmaSet(GUNLUK);
    let gYeni = 0, gTekrar = 0, gErken = 0;

    for (const q of r.questions) {
      cevap++;
      katman[tierOf(q)]++;
      const onceki = gorulmeSayisi.get(q.id) || 0;
      gorulmeSayisi.set(q.id, onceki + 1);
      if (onceki === 0) { ilkGorulme.set(q.id, g); yeni++; gYeni++; }
      else {
        tekrar++; gTekrar++;
        const srs = S.srs[q.id];
        if (srs && srs.dueAt && new Date(srs.dueAt) > new Date()) { erkenTekrar++; gErken++; }
      }
      const ok = rand() < HEDEF_DOGRULUK;
      S.answers.push({ qId: q.id, subjectId: q.subjectId, ok, ms: 60000, at: new Date().toISOString() });
      scheduleAfterAnswer(q.id, ok);
    }
    gunluk.push({ g, yeni: gYeni, tekrar: gTekrar, erken: gErken, vadesiGelen });
  }
  return { S, cevap, yeni, tekrar, erkenTekrar, katman, gunluk, farkli: ilkGorulme.size };
}

console.log(`=== ÇOK GÜNLÜK SİMÜLASYON ===`);
console.log(`  ${GUN} gün × ${GUNLUK} soru · hedef doğruluk %${HEDEF_DOGRULUK * 100} · SRS kutuları [${BOXES.join(', ')}] gün · tekrar tavanı %${KARMA_DUE_SHARE * 100}\n`);

const sonuclar = [];
for (const tohum of [1, 7, 42, 99, 2026]) sonuclar.push(kosu(tohum));
const ort = (f) => sonuclar.reduce((a, r) => a + f(r), 0) / sonuclar.length;

console.log('ölçüt                        ortalama (5 tohum)');
console.log(`  toplam cevap               ${Math.round(ort(r => r.cevap))}`);
console.log(`  görülen FARKLI soru        ${Math.round(ort(r => r.farkli))}`);
console.log(`  yeni soru                  ${Math.round(ort(r => r.yeni))}  (%${(100 * ort(r => r.yeni) / ort(r => r.cevap)).toFixed(1)})`);
console.log(`  tekrar sorusu              ${Math.round(ort(r => r.tekrar))}  (%${(100 * ort(r => r.tekrar) / ort(r => r.cevap)).toFixed(1)})`);
console.log(`  └ VADESİ GELMEDEN tekrar   ${Math.round(ort(r => r.erkenTekrar))}  (%${(100 * ort(r => r.erkenTekrar) / ort(r => r.tekrar)).toFixed(1)})`);
console.log(`  havuzdaki toplam soru      ${ALL.length} · core ${ALL.filter(q => String(q.examTarget || '').startsWith('hmgs')).length}`);

console.log('\nkatman dağılımı (çözülen sorular):');
for (const t of [1, 2, 3]) {
  const n = ort(r => r.katman[t]);
  console.log(`  ${AD[t].padEnd(14)} ${Math.round(n)}  %${(100 * n / ort(r => r.cevap)).toFixed(1)}`);
}

console.log('\ngün gün (ilk tohum):');
const g0 = sonuclar[0].gunluk;
console.log('  gün | yeni | tekrar | erken tekrar | vadesi gelen');
for (const x of g0) console.log(`   ${String(x.g).padStart(2)} | ${String(x.yeni).padStart(4)} | ${String(x.tekrar).padStart(6)} | ${String(x.erken).padStart(12)} | ${x.vadesiGelen}`);
