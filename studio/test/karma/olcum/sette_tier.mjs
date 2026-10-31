/* Karma sette katman (tier) kompozisyonunu ölçer — GERÇEK soru bankasıyla.
   engine.js kaynaktan kopyalanır (kopya tutulmaz), ./data.js ve ./store.js
   studio/test/karma/olcum/ altındaki gerçek-veri stub'ından çözülür. */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const engineSrc = fs.readFileSync(path.resolve(here, '../../../js/engine.js'), 'utf8');
const tmp = path.join(here, '.engine.olcum.mjs');
fs.writeFileSync(tmp, engineSrc, 'utf8');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });

const eng = await import(url.pathToFileURL(tmp).href);
const { buildKarmaSet } = eng;
const { ALL, tierOf } = await import('./data.js');
const st = await import('./store.js');

const AD = { 1: 'T1 gerçek HMGS', 2: 'T2 HMGS benzeri', 3: 'T3 hâkimlik' };
const core = ALL.filter(q => q.examTarget === 'hmgs_core' || String(q.examTarget || '').startsWith('hmgs'));

console.log('=== HAVUZ (scope=core) ===');
const havuz = { 1: 0, 2: 0, 3: 0 };
for (const q of core) havuz[tierOf(q)]++;
for (const t of [1, 2, 3]) console.log(`  ${AD[t].padEnd(18)} ${String(havuz[t]).padStart(5)}  %${(100 * havuz[t] / core.length).toFixed(0)}`);
console.log(`  TOPLAM ${core.length}`);

const N = 300, COUNT = 20;
const kosu = (etiket) => {
  const toplam = { 1: 0, 2: 0, 3: 0 };
  const dueTier = { 1: 0, 2: 0, 3: 0 };
  let dueToplam = 0, dersSayisi = 0;
  for (let i = 0; i < N; i++) {
    const r = buildKarmaSet(COUNT);
    for (const q of r.questions) toplam[tierOf(q)]++;
    dueToplam += r.due;
    dersSayisi += r.plan.length;
  }
  const tot = N * COUNT;
  console.log(`\n=== ${etiket} (${COUNT} soru × ${N} set) ===`);
  for (const t of [1, 2, 3]) {
    console.log(`  ${AD[t].padEnd(18)} ${String(toplam[t]).padStart(6)}  %${(100 * toplam[t] / tot).toFixed(1)}  (her sette ${(toplam[t] / N).toFixed(1)} soru)`);
  }
  console.log(`  ortalama sette ders sayısı: ${(dersSayisi / N).toFixed(1)} | tekrar sorusu: ${(dueToplam / N).toFixed(1)}`);
  return toplam;
};

// 1) Temiz geçmiş: her şey "hiç görülmemiş"
st.setState({ answers: [], srs: {}, exams: [], settings: { dailyTarget: 40 } });
const temiz = kosu('TEMİZ GEÇMİŞ (hiç soru çözülmemiş)');

// 2) Gerçekçi geçmiş: 1200 hâkimlik + 100 gerçek çözülmüş, SRS'te 60 vadesi gelmiş
const dun = new Date(Date.now() - 86400000).toISOString();
const answers = [];
const srs = {};
let n = 0;
for (const q of core) {
  if (tierOf(q) === 3 && n < 1200) { answers.push({ qId: q.id, subjectId: q.subjectId, ok: n % 3 !== 0, ms: 60000, at: dun }); srs[q.id] = { box: 0, lapses: 2, dueAt: dun, lastAt: dun }; n++; }
}
let m = 0;
for (const q of core) {
  if (tierOf(q) === 1 && m < 100) { answers.push({ qId: q.id, subjectId: q.subjectId, ok: true, ms: 60000, at: dun }); srs[q.id] = { box: 1, lapses: 1, dueAt: dun, lastAt: dun }; m++; }
}
st.setState({ answers, srs, exams: [{ at: new Date().toISOString(), correct: 60 }], settings: { dailyTarget: 40 } });
const kirli = kosu(`GERÇEKÇİ GEÇMİŞ (${answers.length} cevap, SRS'te ${Object.keys(srs).length} vadesi gelmiş)`);

const beklenenUniform = 100 * havuz[1] / core.length;
console.log(`\n=== ÖZET ===`);
console.log(`  havuzdaki T1 payı      : %${beklenenUniform.toFixed(1)}  (katman sırası olmasaydı beklenen)`);
console.log(`  temiz geçmişte T1 payı : %${(100 * temiz[1] / (N * COUNT)).toFixed(1)}`);
console.log(`  kirli geçmişte T1 payı : %${(100 * kirli[1] / (N * COUNT)).toFixed(1)}`);
