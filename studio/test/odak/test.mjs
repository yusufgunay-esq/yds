/* ==========================================================================
   studio/test/odak/test.mjs — ODAK İZİ VE GEMİNİ İSTEMİ TESTLERİ
   Çalıştır:  node studio/test/odak/test.mjs
   Her test bir plan maddesini kilitler (bkz. PLAN_ODAK_IZI_VE_ISTEM.md).
   seans.js YERİNDEN okunur; yalnız store.js import satırı stub'a çevrilip
   geçici dosyaya yazılır (karma/test.mjs paterni). Kopya tutulmaz.

   window/document için en küçük sahte nesne kurulur (addEventListener
   kaydı tutan) ve performance.now() elle ilerletilir — gerçek jsdom değil,
   çünkü tek ihtiyaç blur/focus dinleyicilerini elle tetiklemek.

   buildGeminiPrompt (practice.js) için: fonksiyonun kendisi saf string
   üretimidir (DOM'a dokunmaz), ama practice.js'in üst seviye import zinciri
   (vault-client.js, kitaplar.js) ağ/DOM yan etkisi taşıyabilir. Bu yüzden
   practice.js'i import ETMİYORUZ — kaynağını yerinden okuyup dört mod
   bloğunu (hint/wrong/blank/correct) statik olarak inceliyoruz. Bu, testin
   "hangi metin geçiyor/geçmiyor" sorusunu, network/DOM riski taşımadan,
   gerçek kaynağa bakarak cevaplar.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const seansPath = path.resolve(here, '../../js/seans.js');
const practicePath = path.resolve(here, '../../js/views/practice.js');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try {
    const r = fn();
    if (r === true) { pass++; console.log('  ok   ' + name); }
    else { fail++; console.log('  FAIL ' + name + '  → ' + r); }
  } catch (e) { fail++; console.log('  FAIL ' + name + '  → ' + e.message); }
};

/* ---------- 1. seans.js'i yerinden oku, store.js'i stub'a çevir ---------- */

const storeStubPath = path.join(here, '.store.stub.mjs');
fs.writeFileSync(storeStubPath,
  "export let _S={settings:{}};\nexport function state(){return _S;}\nexport function save(){}\n", 'utf8');
process.on('exit', () => { try { fs.unlinkSync(storeStubPath); } catch (e) {} });

let src = fs.readFileSync(seansPath, 'utf8');
src = src.replace("from './store.js'", "from './.store.stub.mjs'");
const tmp = path.join(here, '.seans.under-test.mjs');
fs.writeFileSync(tmp, src, 'utf8');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });

/* ---------- 2. en küçük sahte window/document (addEventListener kaydı tutan) ---------- */

function makeFakeTarget() {
  const listeners = new Map(); // type -> Set<fn>
  return {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatch(type) {
      for (const fn of listeners.get(type) || []) fn();
    }
  };
}

let clockNow = 0;
const fakeWindow = makeFakeTarget();
const fakeDocument = makeFakeTarget();
fakeDocument.hidden = false;
fakeDocument.activeElement = { tagName: 'BODY' };
fakeDocument.body = {
  classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
  appendChild() {}
};
fakeDocument.getElementById = () => null;
fakeDocument.createElement = () => ({
  style: {}, classList: { add() {}, toggle() {} }, appendChild() {}, addEventListener() {},
  querySelector() { return null; }
});
fakeDocument.querySelector = () => null;

globalThis.window = fakeWindow;
globalThis.document = fakeDocument;
globalThis.performance = { now: () => clockNow };
globalThis.setInterval = () => 0;   // idleSweep periyodik taramasını testte istemiyoruz
globalThis.clearInterval = () => {};

const seans = await import(url.pathToFileURL(tmp).href);

function advance(ms) { clockNow += ms; }
function reset() {
  clockNow = 0;
  if (seans.active()) seans.end();
}

console.log('\n1. TEMEL ODAK İZİ [G\'siz blur = kaçış]');
reset();
t("G'siz blur 20 sn → escapes=1, escapeMs≈20000, qEnd().ms o süreyi içermez", () => {
  seans.begin({ mode: 'flow' });
  seans.qBegin();
  advance(5000);                 // 5 sn soru çözülüyor
  fakeWindow.dispatch('blur');   // pencereden çıkıldı
  advance(20000);                // 20 sn dışarıda
  fakeWindow.dispatch('focus');  // geri döndü
  advance(2000);                 // 2 sn daha soru üstünde
  const q = seans.qEnd();
  const out = seans.end();
  const okMs = Math.abs(out.escapeMs - 20000) < 100;
  const okQ = Math.abs(q.ms - 7000) < 100; // 5 sn + 2 sn, 20 sn dışarıda geçen dahil değil
  return (out.escapes === 1 && okMs && okQ) || `escapes=${out.escapes} escapeMs=${out.escapeMs} q.ms=${q.ms}`;
});

console.log('\n2. AI TRIP ZIRHI [aiTrip sonrası kısa süre içinde çıkış = yapay zeka turu]');
reset();
t('aiTrip() sonra 2 sn içinde blur 60 sn → aiTrips=1, escapes=0', () => {
  seans.begin({ mode: 'flow' });
  seans.qBegin();
  seans.aiTrip();
  advance(2000);                 // zırh süresi (10000ms) içinde
  fakeWindow.dispatch('blur');
  advance(60000);
  fakeWindow.dispatch('focus');
  const out = seans.end();
  return (out.aiTrips === 1 && out.escapes === 0 && Math.abs(out.aiMs - 60000) < 100)
    || `aiTrips=${out.aiTrips} escapes=${out.escapes} aiMs=${out.aiMs}`;
});

console.log('\n3. ZIRH SÜRESİ DOLUNCA KAÇIŞ SAYILIR');
reset();
t('aiTrip() sonra 15 sn bekle, blur → kaçış sayılır (zırh süresi doldu)', () => {
  seans.begin({ mode: 'flow' });
  seans.qBegin();
  seans.aiTrip();
  advance(15000);                // AI_ARM_MS=10000 dolmuş
  fakeWindow.dispatch('blur');
  advance(5000);
  fakeWindow.dispatch('focus');
  const out = seans.end();
  return (out.escapes === 1 && out.aiTrips === 0) || `escapes=${out.escapes} aiTrips=${out.aiTrips}`;
});

console.log('\n4. TIKLAMA KIRINTISI YOK SAYILIR');
reset();
t("2 sn'lik blur → hiçbir sayaç artmaz", () => {
  seans.begin({ mode: 'flow' });
  seans.qBegin();
  fakeWindow.dispatch('blur');
  advance(2000);
  fakeWindow.dispatch('focus');
  const out = seans.end();
  return (out.escapes === 0 && out.aiTrips === 0) || `escapes=${out.escapes} aiTrips=${out.aiTrips}`;
});

console.log('\n5. MOLADA BLUR YOK SAYILIR');
reset();
t('mola sırasında blur → yok sayılır', () => {
  seans.begin({ mode: 'flow' });
  seans.ayarla({ on: true, workMin: 1, breakMin: 1 }); // kısa blok, molayı elle başlatacağız
  seans.qBegin();
  seans.startBreak();
  fakeWindow.dispatch('blur');
  advance(30000);
  fakeWindow.dispatch('focus');
  const out = seans.end();
  return (out.escapes === 0 && out.aiTrips === 0) || `escapes=${out.escapes} aiTrips=${out.aiTrips}`;
});

console.log('\n6. BLUR + VISIBILITYCHANGE ÇİFT SAYMAZ');
reset();
t('blur + ardından visibilitychange(hidden) → süre bir kez sayılır', () => {
  seans.begin({ mode: 'flow' });
  seans.qBegin();
  advance(3000);
  fakeWindow.dispatch('blur');
  fakeDocument.hidden = true;
  fakeDocument.dispatch('visibilitychange'); // pauseQ zaten qRunSince==null, no-op
  advance(20000);
  fakeDocument.hidden = false;
  fakeDocument.dispatch('visibilitychange');
  fakeWindow.dispatch('focus');
  const out = seans.end();
  return (out.escapes === 1 && Math.abs(out.escapeMs - 20000) < 100) || `escapes=${out.escapes} escapeMs=${out.escapeMs}`;
});

/* ---------- 7. Gemini istemi: statik kaynak incelemesi ---------- */

console.log("\n7. GEMİNİ İSTEMİ [buildGeminiPrompt modları]");
const pSrc = fs.readFileSync(practicePath, 'utf8');
const fnStart = pSrc.indexOf('export function buildGeminiPrompt');
const fnEnd = pSrc.indexOf('\n}', pSrc.indexOf("L.push('Türkçe yaz", fnStart)) + 2;
const fnSrc = pSrc.slice(fnStart, fnEnd);

function modeBlock(src, marker, nextMarkers) {
  const start = src.indexOf(marker);
  if (start < 0) return '';
  let end = src.length;
  for (const m of nextMarkers) {
    const i = src.indexOf(m, start + marker.length);
    if (i >= 0 && i < end) end = i;
  }
  return src.slice(start, end);
}

const hintBlock = modeBlock(fnSrc, "mode = 'hint';", ["} else if (chosen"]);
const wrongBlock = modeBlock(fnSrc, "mode = 'wrong';", ["} else if (!chosen"]);
const blankBlock = modeBlock(fnSrc, "mode = 'blank';", ["} else {"]);
const correctBlock = modeBlock(fnSrc, "mode = 'correct';", []);

t("hint bloğunda doğru şık harfi/metni (q.correct) geçmez", () =>
  !hintBlock.includes('q.correct') || 'q.correct hint bloğunda geçiyor');
t("hint bloğunda ŞEMA geçer", () =>
  hintBlock.includes('ŞEMA') || 'ŞEMA hint bloğunda yok');
t("wrong bloğunda ŞEMA geçer", () =>
  wrongBlock.includes('ŞEMA') || 'ŞEMA wrong bloğunda yok');
t("blank bloğunda ŞEMA geçer", () =>
  blankBlock.includes('ŞEMA') || 'ŞEMA blank bloğunda yok');
t("correct bloğunda ŞEMA geçer", () =>
  correctBlock.includes('ŞEMA') || 'ŞEMA correct bloğunda yok');
t("wrong bloğunda 'HMGS sorusu yaz' GEÇMEZ", () =>
  !wrongBlock.includes('HMGS sorusu yaz') || "'HMGS sorusu yaz' wrong bloğunda hâlâ var");
t("blank bloğunda 'HMGS sorusu yaz' GEÇMEZ", () =>
  !blankBlock.includes('HMGS sorusu yaz') || "'HMGS sorusu yaz' blank bloğunda hâlâ var");
t("wrong bloğunda HATIRLATMA KARTI geçer", () =>
  wrongBlock.includes('HATIRLATMA KARTI') || 'HATIRLATMA KARTI wrong bloğunda yok');
t("blank bloğunda HATIRLATMA KARTI geçer", () =>
  blankBlock.includes('HATIRLATMA KARTI') || 'HATIRLATMA KARTI blank bloğunda yok');
t('son satır (Türkçe yaz...) tüm modlar için ortak kalmış', () =>
  fnSrc.includes('Türkçe yaz. Madde numarasından emin değilsen numara uydurma'));

/* ---------- 8. İSTEM BAHSE GÖRE DALLANIYOR MU (davranışsal) ----------
   Yukarıdaki 7. bölüm kaynağı statik okur: bir dalın VARLIĞINI görür ama
   ürettiği metni görmez. Burada fonksiyonun kendisi, kaynağından sökülüp
   dört yardımcısı stub'lanarak çalıştırılıyor (import zinciri yine yok).
   Ölçülen şey: aynı soru + aynı yanlış şık, bahse göre farklı istem veriyor
   mu ve bahis yokken bugünkü metin birebir korunuyor mu.                     */
console.log("\n8. İSTEM BAHSE GÖRE DALLANIYOR MU");

const factory = new Function(
  'topicById', 'groupLegalRefs', 'subjectName', 'stripEmoji',
  fnSrc.replace('export function', 'function') + '\nreturn buildGeminiPrompt;'
);
const buildGeminiPrompt = factory(
  new Map(), () => '', () => 'Medeni Hukuk', x => String(x || '')
);

const Q = {
  id: 'x1', subjectId: 'medeni', stem: 'Aşağıdakilerden hangisi doğrudur?',
  options: [{ key: 'A', text: 'A metni' }, { key: 'B', text: 'B metni' },
            { key: 'C', text: 'C metni' }, { key: 'D', text: 'D metni' },
            { key: 'E', text: 'E metni' }],
  correct: 'C', explanation: 'Uygulamanın açıklaması.'
};
const P = (o) => buildGeminiPrompt(Q, o);
const wrongNull  = P({ answered: true, chosen: 'A' });
const wrongThink = P({ answered: true, chosen: 'A', conf: 'think' });
const wrongSure  = P({ answered: true, chosen: 'A', conf: 'sure' });
const wrongGuess = P({ answered: true, chosen: 'A', conf: 'guess' });
const wrongHint  = P({ answered: true, chosen: 'A', conf: 'hint' });
const okNull     = P({ answered: true, chosen: 'C' });
const okSure     = P({ answered: true, chosen: 'C', conf: 'sure' });
const okGuess    = P({ answered: true, chosen: 'C', conf: 'guess' });
const okHint     = P({ answered: true, chosen: 'C', conf: 'hint' });
const blankGuess = P({ answered: true, chosen: null, conf: 'guess' });
const hintMode   = P({ answered: false, chosen: null });

t('bahis yoksa yanlış istemi bugünküyle aynı (HATAM maddesi duruyor)', () =>
  (wrongNull.text.includes('4. HATAM:') && !wrongNull.text.includes('YANILGI'))
  || 'varsayılan metin değişmiş');
t('"Sanırım" varsayılanla BİREBİR aynı metin (Enter alışkanlığı bozulmuyor)', () =>
  wrongThink.text === wrongNull.text || 'think metni varsayılandan ayrışmış');
t('mode değerleri dört taneden biri olarak kalmış', () =>
  (wrongSure.mode === 'wrong' && okGuess.mode === 'correct'
   && blankGuess.mode === 'blank' && hintMode.mode === 'hint')
  || 'mode adları değişmiş, tüketiciler kırılır');

t('Eminim+yanlış: yanılgıyı adlandırıyor, sıfırdan anlatmıyor', () =>
  (wrongSure.text.includes('1. YANILGI:')
   && !wrongSure.text.includes('hiç bilmediğimi varsay')
   && wrongSure.text.includes('EMİNDİM'))
  || 'sure dalı yanılgı yerine sıfırdan anlatıma düşüyor');
t('Eminim+yanlış: uydurma kurala karşı kayıt var', () =>
  (wrongSure.text.includes('Kural uydurma')
   && wrongSure.text.includes('böyle bir kural yok'))
  || 'kural uydurma kaydı yok');
t('Eminim+yanlış: seçilen ve doğru şık ikisi de geçiyor', () =>
  (wrongSure.text.includes('A) A metni') && wrongSure.text.includes('C) C metni'))
  || 'şıklar istemde yok');

t('Mantıkla+yanlış: "HATAM" yerine eleme sorgusu', () =>
  (wrongGuess.text.includes('ELEME:') && !wrongGuess.text.includes('HATAM')
   && wrongGuess.text.includes('elemeyle seçtim'))
  || 'guess dalı hâlâ yanılgı soruyor');
t('Mantıkla+yanlış: kuralı sıfırdan anlatıyor', () =>
  wrongGuess.text.includes('1. KURAL:') || 'guess dalında sıfırdan anlatım yok');

t('İpucuyla+yanlış: anlatımı tekrarlamamasını istiyor', () =>
  (wrongHint.text.includes('Aynı anlatımı tekrarlama')
   && !wrongHint.text.includes('1. KURAL:'))
  || 'ipucu dalı konuyu yeniden anlattırıyor');
t('İpucuyla+yanlış istemi, varsayılan yanlış isteminden kısa', () =>
  wrongHint.text.length < wrongNull.text.length
  || 'ipucu dalı kısalmamış');
t('İpucuyla+yanlış yine de kendi başına ayakta (kuralı 2 cümleyle istiyor)', () =>
  wrongHint.text.includes('kuralı en fazla 2 cümleyle hatırlat')
  || 'yeni sohbete yapıştırılırsa kural hiç gelmez');

t('Mantıkla+doğru: sağlama değil, sıfırdan anlatım', () =>
  (okGuess.text.includes('1. KURAL:') && !okGuess.text.includes('sağlamasını')
   && okGuess.text.includes('bilmiyordum'))
  || 'guess+doğru hâlâ sağlama istiyor (SRS ile çelişir)');
t('Eminim+doğru: gerekçe kontrolü ekleniyor', () =>
  okSure.text.includes('GEREKÇE KONTROLÜ') || 'sure+doğru dalı yok');
t('bahissiz doğru istemi bugünküyle aynı (gerekçe kontrolü yok)', () =>
  (!okNull.text.includes('GEREKÇE KONTROLÜ') && okNull.text.includes('sağlamasını'))
  || 'varsayılan doğru metni değişmiş');
t('İpucuyla+doğru: tekrar anlattırmıyor, tek ayrımı soruyor', () =>
  (okHint.text.includes('tekrarlama') && okHint.text.length < okNull.text.length)
  || 'ipucu+doğru dalı kısalmamış');

t('boş bırakılan soru bahisten etkilenmiyor (dontKnow bahis sormuyor)', () =>
  blankGuess.text === P({ answered: true, chosen: null }).text
  || 'blank dalı conf ile değişiyor');
// Şıklar ipucu isteminde de listelenir (soru onsuz cevaplanamaz) ve "Doğru
// şıkkı söyleme" yasağı da orada geçer; sızmaması gereken tek şey cevabı
// açan "Doğru şık: X)" satırıdır.
t('ipucu (cevaptan önce) modunda doğru şık hâlâ sızmıyor', () =>
  !hintMode.text.includes('Doğru şık:') || 'ipucu modunda cevap sızıyor');
t('her dalda ortak son satır duruyor', () =>
  [wrongSure, wrongGuess, wrongHint, okSure, okGuess, okHint]
    .every(r => r.text.includes('Madde numarasından emin değilsen numara uydurma'))
  || 'bir dalda ortak son satır düşmüş');

/* ---------- 9. BAHİS İSTEME GERÇEKTEN BAĞLANMIŞ MI (kablolama) ---------- */
console.log("\n9. BAHİS İSTEME BAĞLANDI MI");
const akimSrc = fs.readFileSync(path.resolve(here, '../../js/views/akim.js'), 'utf8');
t('akim.js askGemini cevap satırındaki conf alanını istemlere geçiriyor', () =>
  (/last\.conf/.test(akimSrc) && /buildGeminiPrompt\(q, \{[^}]*conf[^}]*\}\)/.test(akimSrc))
  || 'akış istemi bahsi göndermiyor');
t('practice.js ipucu dalını besliyor (orada bahis şeridi yok)', () =>
  (/const conf = S\.answered && last && last\.qId === q\.id \? \(last\.conf \|\| null\) : null/.test(pSrc)
   && /buildGeminiPrompt\(q, \{[^}]*conf[^}]*\}\)/.test(pSrc))
  || 'pratik ekranı ipucu dalını beslemiyor');

console.log(`\n${pass} geçti, ${fail} başarısız (${pass + fail} toplam)\n`);
process.exit(fail > 0 ? 1 : 0);
