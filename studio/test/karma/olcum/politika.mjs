/* TEKRAR POLİTİKASI — TEMİZ ÖLÇÜM
   Önceki denemede buildKarmaSet'in içine cerrahi yapıldı ve set boyu bozuldu
   (yeni% farkı ölçüm hatasıydı). Burada yalnız SRS + due seçimi simüle edilir;
   setin geri kalanı "görülmemiş soru" havuzundan çekilir — candidatesOf'un
   yaptığı tam olarak bu. Böylece politika etkisi izole ölçülür. */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.resolve(here, '../../../js/engine.js'), 'utf8');
const tmp = path.join(here, '.engine.temiz.mjs');
fs.writeFileSync(tmp, src, 'utf8');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });
const eng = await import(url.pathToFileURL(tmp).href);
const { scheduleAfterAnswer, dueQuestions, KARMA_DUE_SHARE, BOXES } = eng;
const { ALL } = await import('./data.js');
const st = await import('./store.js');

const GUN = 9, GUNLUK = 45;
const KAP = Math.floor(GUNLUK * KARMA_DUE_SHARE);
const core = ALL.filter(q => String(q.examTarget || '').startsWith('hmgs'));

const LEECH = 3;   // bu sayıda takılan soru due bloğundan çıkar

function dueSec(tum, mod) {
  let l = tum;
  if (mod.includes('leech')) l = l.filter(d => (d.srs.lapses || 0) < LEECH);
  // SIRALAMA ADAYLARI
  if (mod.includes('lastAt')) {
    // En uzun süredir DOKUNULMAYAN önce. `lastAt` şemada ZATEN var.
    l = l.slice().sort((a, b) => new Date(a.srs.lastAt || 0) - new Date(b.srs.lastAt || 0));
  } else if (mod.includes('dueAt')) {
    l = l.slice().sort((a, b) => new Date(a.srs.dueAt) - new Date(b.srs.dueAt));
  } else if (mod.includes('rotasyon')) {
    l = l.slice().sort((a, b) =>
      (a.srs.servis || 0) - (b.srs.servis || 0) ||
      (new Date(a.srs.dueAt) - new Date(b.srs.dueAt)));
  } else {
    l = l.slice().sort((a, b) => (b.srs.lapses - a.srs.lapses) || (new Date(a.srs.dueAt) - new Date(b.srs.dueAt)));
  }
  return l.slice(0, KAP);
}

function kosu(tohum, mod) {
  let rnd = tohum;
  const rand = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
  const zorluk = new Map(), gorulme = new Map();
  const unseen = [];
  for (const q of core) { const r = rand(); zorluk.set(q.id, r < 0.30 ? 0.30 : (r < 0.80 ? 0.60 : 0.88)); unseen.push(q); }
  let uIdx = 0;
  const S = { answers: [], srs: {}, exams: [], settings: { dailyTarget: GUNLUK } };
  st.setState(S);

  let cevap = 0, yeni = 0, tekrar = 0;
  const dueSunulan = new Map();  // qId → kaç kez due bloğunda sunuldu
  const gunluk = [];

  for (let g = 1; g <= GUN; g++) {
    if (g > 1) for (const r of Object.values(S.srs)) if (r.dueAt) r.dueAt = new Date(new Date(r.dueAt).getTime() - 86400000).toISOString();
    const tum = dueQuestions();
    const sel = dueSec(tum, mod);

    // Set: due bloğu + geri kalanı görülmemiş sorulardan
    const secilen = [];
    for (const d of sel) { secilen.push(d.q); dueSunulan.set(d.q.id, (dueSunulan.get(d.q.id) || 0) + 1); }
    while (secilen.length < GUNLUK && uIdx < unseen.length) {
      const q = unseen[uIdx++];
      if (!secilen.includes(q)) secilen.push(q);
    }

    let gY = 0, gT = 0;
    for (const q of secilen) {
      cevap++;
      const o = gorulme.get(q.id) || 0;
      gorulme.set(q.id, o + 1);
      if (o === 0) { yeni++; gY++; } else { tekrar++; gT++; }
      const ok = rand() < (zorluk.get(q.id) || 0.6);
      S.answers.push({ qId: q.id, subjectId: q.subjectId, ok, ms: 60000, at: new Date().toISOString() });
      const s = scheduleAfterAnswer(q.id, ok);
      // servis sayacı: bu soru due bloğunda kaç kez sunuldu
      S.srs[q.id].servis = (S.srs[q.id].servis || 0) + (sel.some(d => d.q.id === q.id) ? 1 : 0);
      void s;
    }
    gunluk.push({ g, yeni: gY, tekrar: gT, kuyruk: tum.length, dueAdet: sel.length });
  }

  const servisler = [...dueSunulan.values()];
  return {
    cevap, yeni, tekrar,
    dueFarkli: dueSunulan.size,
    dueSunum: servisler.reduce((a, b) => a + b, 0),
    enCokDue: servisler.length ? Math.max(...servisler) : 0,
    takili: [...gorulme.values()].filter(n => n >= 5).length,
    gorulnen: gorulme.size,
    kuyrukSon: gunluk[gunluk.length - 1].kuyruk,
    gunluk
  };
}

const ort = (rs, f) => rs.reduce((a, r) => a + f(r), 0) / rs.length;
const TOH = [1, 7, 42, 99, 2026];
const MODLAR = ['mevcut', 'lastAt', 'dueAt', 'leech+lastAt', 'leech+dueAt'];

console.log(`=== TEKRAR POLİTİKASI (${GUN} gün × ${GUNLUK} soru, ${TOH.length} tohum) ===`);
console.log(`due kapasitesi ${KAP}/set · havuz ${core.length} · leech eşiği ${LEECH} · kutular [${BOXES.join(',')}]`);
console.log('setin geri kalanı görülmemiş sorulardan (candidatesOf davranışı)\n');
console.log('mod              | yeni% | due sunum | due FARKLI | tekrar/soru | 9.gün kuyruk | 5+ kez');
for (const m of MODLAR) {
  const A = TOH.map(t => kosu(t, m));
  const yeniPct = 100 * ort(A, r => r.yeni) / ort(A, r => r.cevap);
  const tekrars = ort(A, r => r.dueSunum) / Math.max(1, ort(A, r => r.dueFarkli));
  console.log(
    m.padEnd(16) + ' | %' + yeniPct.toFixed(0).padStart(4) + ' | ' +
    String(Math.round(ort(A, r => r.dueSunum))).padStart(9) + ' | ' +
    String(Math.round(ort(A, r => r.dueFarkli))).padStart(10) + ' | ' +
    tekrars.toFixed(1).padStart(11) + ' | ' +
    String(Math.round(ort(A, r => r.kuyrukSon))).padStart(12) + ' | ' +
    String(Math.round(ort(A, r => r.takili))).padStart(6)
  );
}

console.log('\n=== GÜN GÜN: AYNI SORULAR MI DÖNÜYOR? (tohum 7) ===');
console.log('rotasyon olmadan due bloğu kaç farklı sorudan oluşuyor:');
for (const m of MODLAR) {
  const r = kosu(7, m);
  console.log(`  ${m.padEnd(16)} kuyruk ${r.gunluk.map(x => String(x.kuyruk).padStart(3)).join(' ')}`);
}
