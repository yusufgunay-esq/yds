/* TEKRAR AÇLIĞI — AYIRT EDİCİ ÖLÇÜT + ÜÇ DÜZELTME ADAYININ KARŞILAŞTIRMASI
   Ölçüt: "due bloğunda kaç FARKLI soru sunuldu" (kuyruk çeşitliliği) ve
   "kuyruk ne kadar büyüyor". Mevcut kodda sıralama lapses DESC. */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.resolve(here, '../../../js/engine.js'), 'utf8');
const tmp = path.join(here, '.engine.starve2.mjs');
fs.writeFileSync(tmp, src, 'utf8');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });

const eng = await import(url.pathToFileURL(tmp).href);
const { buildKarmaSet, scheduleAfterAnswer, dueQuestions, KARMA_DUE_SHARE } = eng;
const { ALL } = await import('./data.js');
const st = await import('./store.js');

const GUN = 9, GUNLUK = 45;
const core = ALL.filter(q => String(q.examTarget || '').startsWith('hmgs'));
const KAP = Math.floor(GUNLUK * KARMA_DUE_SHARE);

/* MOD:
   'mevcut'  → dueQuestions sırası (lapses DESC) — üretimdeki kod
   'eskiden' → en eski vade önce (kuyruk rotasyonu)
   'leech'   → lapses >= 3 olan due bloğuna girmez
   'leech+eskiden' → ikisi birlikte */
function kosu(tohum, mod) {
  let rnd = tohum;
  const rand = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
  const zorluk = new Map();
  for (const q of core) { const r = rand(); zorluk.set(q.id, r < 0.30 ? 0.30 : (r < 0.80 ? 0.60 : 0.88)); }

  const S = { answers: [], srs: {}, exams: [], settings: { dailyTarget: GUNLUK } };
  st.setState(S);
  const gorulme = new Map();
  let cevap = 0, yeni = 0, tekrar = 0;
  const dueSunulan = new Set();      // due bloğunda sunulan FARKLI sorular
  const gunluk = [];

  for (let g = 1; g <= GUN; g++) {
    if (g > 1) for (const r of Object.values(S.srs)) {
      if (r.dueAt) r.dueAt = new Date(new Date(r.dueAt).getTime() - 86400000).toISOString();
    }
    let tum = dueQuestions();
    const kuyruk = tum.length;
    if (mod.includes('leech')) tum = tum.filter(d => (d.srs.lapses || 0) < 3);
    if (mod.includes('eskiden')) {
      tum = tum.slice().sort((a, b) => new Date(a.srs.dueAt) - new Date(b.srs.dueAt));
    }
    const sel = tum.slice(0, KAP);
    const dueIds = new Set(sel.map(d => d.q.id));
    sel.forEach(d => dueSunulan.add(d.q.id));

    const r = buildKarmaSet(GUNLUK);
    const govde = r.questions.filter(q => !dueIds.has(q.id));
    const son = sel.map(d => d.q).concat(govde).slice(0, GUNLUK);

    let gY = 0, gT = 0;
    for (const q of son) {
      cevap++;
      const o = gorulme.get(q.id) || 0;
      gorulme.set(q.id, o + 1);
      if (o === 0) { yeni++; gY++; } else { tekrar++; gT++; }
      const ok = rand() < (zorluk.get(q.id) || 0.6);
      S.answers.push({ qId: q.id, subjectId: q.subjectId, ok, ms: 60000, at: new Date().toISOString() });
      scheduleAfterAnswer(q.id, ok);
    }
    gunluk.push({ g, yeni: gY, tekrar: gT, kuyruk });
  }
  // Takılı: 5+ kez sorulan
  const takili = [...gorulme.values()].filter(n => n >= 5).length;
  const maxTekrar = Math.max(...gorulme.values());
  return { cevap, yeni, tekrar, dueFarkli: dueSunulan.size, takili, maxTekrar, gunluk, kuyrukSon: gunluk[gunluk.length - 1].kuyruk };
}

const ort = (rs, f) => rs.reduce((a, r) => a + f(r), 0) / rs.length;
const TOHUMLAR = [1, 7, 42, 99, 2026];
const MODLAR = ['mevcut', 'eskiden', 'leech', 'leech+eskiden'];

console.log(`=== ÜÇ DÜZELTMENİN KARŞILAŞTIRMASI (${GUN} gün × ${GUNLUK} soru, 5 tohum) ===`);
console.log(`due bloğu kapasitesi: ${KAP} soru/set · havuz ${core.length} · gizli zorluk %30 zor/%50 orta/%20 kolay\n`);
console.log('mod              | yeni% | due: farklı sunulan | 9. gün kuyruk | 5+ kez sorulan | en çok tekrar');
for (const m of MODLAR) {
  const A = TOHUMLAR.map(t => kosu(t, m));
  const yeniPct = 100 * ort(A, r => r.yeni) / ort(A, r => r.cevap);
  console.log(
    m.padEnd(16) + ' | %' + yeniPct.toFixed(0).padStart(4) + ' | ' +
    String(Math.round(ort(A, r => r.dueFarkli))).padStart(19) + ' | ' +
    String(Math.round(ort(A, r => r.kuyrukSon))).padStart(13) + ' | ' +
    String(Math.round(ort(A, r => r.takili))).padStart(14) + ' | ' +
    String(Math.round(ort(A, r => r.maxTekrar))).padStart(12)
  );
}

console.log('\n=== KUYRUK BÜYÜMESİ (tohum 7) ===');
for (const m of MODLAR) {
  const r = kosu(7, m);
  console.log(`  ${m.padEnd(16)} ${r.gunluk.map(x => x.kuyruk).join(' → ')}`);
}

console.log('\n=== GÜN GÜN YENİ SORU ORANI (tohum 7) ===');
for (const m of MODLAR) {
  const r = kosu(7, m);
  const o = r.gunluk.map(x => Math.round(100 * x.yeni / (x.yeni + x.tekrar)));
  console.log(`  ${m.padEnd(16)} ${o.map(v => String(v).padStart(3)).join(' ')}`);
}
