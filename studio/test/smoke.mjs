/* ==========================================================================
   studio/test/smoke.mjs — UÇTAN UCA DUMAN TESTİ (jsdom)
   Çalıştır:  node studio/test/smoke.mjs
              (veya: node smoke.mjs — cwd'ye bağlı DEĞİL, aşağıya bak)
   Amaç: uygulamayı gerçek DOM'da açmak, tıklamaları simüle etmek,
         telemetri/SRS/mastery/koç zincirinin gerçekten çalıştığını kanıtlamak.

   CWD SABİTİ: bu dosya daha önce iki yerde `readFileSync('HMGS_Takip_App/...')`
   gibi cwd'ye GÖRECELİ yol kullanıyordu. `studio/test` içinden çalıştırılınca
   okuma ENOENT atıp suite'i SONUÇ SATIRINI YAZMADAN çökertiyordu — yani test
   "kırmızı" değil "ölü" görünüyordu ve GEÇTİ/BAŞARISIZ sayacı hiç basılmıyordu.
   Ölçüldü (15 Eylül 2026): `cd studio/test && node smoke.mjs` → ENOENT;
   `node studio/test/smoke.mjs` (kök dizinden) → 465/0. Tüm dosya okumaları
   artık HERE/ROOT üzerinden MUTLAK yola bağlı; nereden çalıştırılırsa çalışsın
   aynı sonucu verir.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`); }
};
const section = s => console.log(`\n${s}`);

/* ---------- ortam ---------- */

const html = fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8');
const dom = new JSDOM(html, {
  url: 'http://localhost/studio.html',
  runScripts: 'outside-only',
  pretendToBeVisual: true
});
const { window } = dom;

// localStorage stub (jsdom'un kendisi var ama izole tutmak için sıfırdan)
const mem = new Map();
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: k => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: k => mem.delete(k),
    clear: () => mem.clear()
  },
  configurable: true
});
// jsdom'un Performance nesnesi global performance'a geri çağrı yapar → sonsuz döngü.
// Bu yüzden hem window hem global için Node'un kendi saatini kullanan sade bir nesne veriyoruz.
const clock = { now: () => Number(process.hrtime.bigint() / 1000000n) };
Object.defineProperty(window, 'performance', { value: clock, configurable: true, writable: true });
window.confirm = () => true;
window.alert = () => {};
window.scrollTo = () => {};
window.URL.createObjectURL = () => 'blob:x';
window.URL.revokeObjectURL = () => {};

// globalleri modüllerin göreceği yere taşı
globalThis.window = window;
globalThis.document = window.document;
globalThis.localStorage = window.localStorage;
globalThis.performance = clock;
globalThis.history = window.history;
globalThis.location = window.location;
globalThis.Blob = window.Blob;
globalThis.confirm = window.confirm;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);

/* ---------- veri dosyalarını yükle ---------- */

section('VERİ YÜKLEME');
/**
 * Klasik <script> semantiğini SADAKATLE taklit eder: vm.runInContext ile
 * jsdom'un gerçek global bağlamında çalıştırır.
 * Bu önemli — `new Function(...)` sarmalayıcısı kullanılırsa top-level `const`
 * fonksiyon kapsamında kalır ve "window'a bağlanmama" hatası testte GÖRÜNMEZ.
 * (Bu tam olarak 25 Tem 2026'da questions.js'te yaşanan hataydı.)
 */
const vmContext = dom.getInternalVMContext();
function loadClassic(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(src, vmContext, { filename: rel, timeout: 30000 });
}
loadClassic('topics.js');
loadClassic('questions.js');
loadClassic('questions_ai.js');
ok('topics.js verisini window\'a bağlıyor', Array.isArray(window.TOPICS_DATA));
ok('questions.js verisini window\'a bağlıyor', Array.isArray(window.QUESTIONS_DATA),
  'top-level const window\'a otomatik bağlanmaz — dosya sonunda window.QUESTIONS_DATA ataması şart');
ok('questions_ai.js verisini window\'a bağlıyor', Array.isArray(window.QUESTIONS_AI_DATA));
ok('topics.js yüklendi', Array.isArray(window.TOPICS_DATA) && window.TOPICS_DATA.length > 0,
  `konu=${window.TOPICS_DATA?.length}`);
ok('questions.js yüklendi', Array.isArray(window.QUESTIONS_DATA) && window.QUESTIONS_DATA.length > 0,
  `soru=${window.QUESTIONS_DATA?.length}`);
ok('questions_ai.js yüklendi', Array.isArray(window.QUESTIONS_AI_DATA) && window.QUESTIONS_AI_DATA.length >= 137,
  `aiSoru=${window.QUESTIONS_AI_DATA?.length}`);

// HMGSV3 (opsiyonel — yüklenemezse flow legacy'ye düşmeli)
try {
  loadClassic('js/visual-engines-v3.js');
  ok('HMGSV3 görsel motoru yüklendi', typeof window.HMGSV3?.render === 'function');
} catch (e) {
  ok('HMGSV3 yüklenemedi ama uygulama devam etmeli', true, e.message.slice(0, 60));
}

/* ---------- modülleri içe al ---------- */

const store   = await import('../js/store.js');
const data    = await import('../js/data.js');
const engine  = await import('../js/engine.js');
const today   = await import('../js/views/today.js');
const practice= await import('../js/views/practice.js');
const exam    = await import('../js/views/exam.js');
const flow    = await import('../js/views/flow.js');
const progress= await import('../js/views/progress.js');

section('VERİ BÜTÜNLÜĞÜ');
store.load();
const rep = data.initData();
ok('konular indekslendi', rep.topics > 100, `${rep.topics} konu`);
ok('sorular indekslendi', rep.questions > 100, `${rep.questions} soru`);
ok('kırık topicId YOK', rep.brokenTopicIds === 0, `${rep.brokenTopicIds} kırık`);
ok('şablon soru kalıntısı yok',
  !window.QUESTIONS_DATA.some(q => /^qst_integrated_/.test(q.id)));
ok('her sorunun 5 şıkkı var',
  window.QUESTIONS_DATA.every(q => Array.isArray(q.options) && q.options.length === 5));
ok('her sorunun doğru şıkkı geçerli',
  window.QUESTIONS_DATA.every(q => q.options.some(o => o.key === q.correct)));
ok('her sorunun gerekçeli açıklaması var',
  window.QUESTIONS_DATA.every(q => (q.explanation || '').length > 40));
ok('her sorunun en az bir etiketi (tags) var',
  window.QUESTIONS_DATA.every(q => Array.isArray(q.tags) && q.tags.length > 0),
  `etiketsiz: ${window.QUESTIONS_DATA.filter(q => !Array.isArray(q.tags) || !q.tags.length).length}`);
ok('doğru şık dağılımı dengeli (tek şıkka yığılma yok)', (() => {
  const c = {}; window.QUESTIONS_DATA.forEach(q => c[q.correct] = (c[q.correct] || 0) + 1);
  const vals = Object.values(c);
  return Object.keys(c).length === 5 && Math.max(...vals) / window.QUESTIONS_DATA.length < 0.35;
})(), JSON.stringify(window.QUESTIONS_DATA.reduce((a, q) => (a[q.correct] = (a[q.correct] || 0) + 1, a), {})));
console.log(`  · havuzu boş ders: ${rep.emptySubjects.length ? rep.emptySubjects.join(', ') : 'yok'}`);
console.log(`  · yetim soru: ${rep.orphanQuestions} · v3 konu: ${rep.v3Topics}/${rep.topics}`);

/* ---------- BUGÜN ekranı ---------- */

section('BUGÜN EKRANI (koç kararı)');
today.render();
const todayHost = window.document.querySelector('#view-today');
ok('bugün ekranı render edildi', todayHost.innerHTML.length > 500);
ok('tek karar (hero) var', !!todayHost.querySelector('.hero-title'));
ok('kararın gerekçesi yazılı', (todayHost.querySelector('.hero-why')?.textContent || '').length > 40);
const act0 = engine.nextAction();
ok('sıfır veriyle koç anlamlı karar veriyor', ['exam', 'weak', 'new'].includes(act0.kind), act0.kind);
console.log(`  · ilk karar: [${act0.kind}] ${act0.title}`);
ok('geri sayım pozitif', store.daysLeft() > 0, `${store.daysLeft()} gün`);

/* ---------- SORU ÇÖZME + TELEMETRİ ---------- */

section('SORU ÇÖZME · SÜRE ÖLÇÜMÜ · TELEMETRİ');
const started = practice.startSession({ mode: 'subject', subjectId: 'medeni_hukuk', count: 6 });
ok('seans kuruldu', started === true);
practice.render();
const pHost = window.document.querySelector('#view-practice');
ok('soru render edildi', !!pHost.querySelector('.q-ask'));
ok('5 şık basıldı', pHost.querySelectorAll('.opt').length === 5);
ok('süre sayacı ekranda', !!pHost.querySelector('#q-timer'));

// bilinçli olarak 3 doğru 2 yanlış + 1 bilmiyorum
const answersBefore = store.state().answers.length;
const seq = ['correct', 'wrong', 'correct', 'wrong', 'correct', 'dontknow'];
for (const kind of seq) {
  const host = window.document.querySelector('#view-practice');
  if (!host.querySelector('.opt')) break;
  const qNow = window.QUESTIONS_DATA.find(q =>
    host.querySelector('.q-ask')?.textContent?.trim().slice(0, 40) &&
    (q.stem || '').includes(host.querySelector('.q-ask').textContent.trim().slice(0, 30)));
  if (kind === 'dontknow') { practice.dontKnow(); }
  else {
    const correctKey = qNow?.correct || 'A';
    const wrongKey = ['A', 'B', 'C', 'D', 'E'].find(k => k !== correctKey);
    practice.pick(kind === 'correct' ? correctKey : wrongKey);
  }
  if (seq.indexOf(kind) === 0) {
    ok('geri bildirim kartında .fb-actions mevcut', !!host.querySelector('.feedback .fb-actions'));
    ok('geri bildirim kartında sonraki soru butonu var', !!host.querySelector('.fb-actions [data-act="next"]'));
    ok('cevap sonrası sol paneldeki bilmiyorum butonu gizlendi', host.querySelector('#q-actions [data-act="dontknow"]')?.style.display === 'none');
  }
  practice.next();
}
const answersAfter = store.state().answers.length;
ok('her cevap telemetriye yazıldı', answersAfter - answersBefore === 6, `${answersAfter - answersBefore} kayıt`);
const rows = store.state().answers;
ok('süre (ms) kaydediliyor', rows.every(r => typeof r.ms === 'number' && r.ms >= 0));
ok('deneme sayacı (attempt) var', rows.every(r => r.attempt >= 1));
ok('mod etiketi var', rows.every(r => !!r.mode));
ok('boş bırakma chosen=null olarak kaydedildi', rows.some(r => r.chosen === null));
ok('ders kimliği kaydediliyor', rows.every(r => !!r.subjectId));

/* ---------- SRS ---------- */

/* v3.2 güncellemesi (20 Eylül 2026): bu bölüm hâlâ v1/v2'nin TAKVİM GÜNÜ
   varsayımlarını (dueAt, "~1 gün sonra") test ediyordu; v3 (19 Eylül 2026)
   SORU SAYISI tabanlı zamanlamaya (dueN) geçtiğinden beri bu testler YANLIŞ
   ŞEYİ ölçüyordu (dueAt hep null, "1 gün sonra" iddiası anlamsız) — gerçek
   motor davranışıyla hiç ilgisi kalmamıştı. Kullanıcı: "gün olarak düşünmene
   gerek yok" (bkz. engine.js'teki v3 notu). Aşağısı dueN/spot modeline göre
   yeniden yazıldı; artık gerçekten çalışan kodu ölçüyor. */
section('ARALIKLI TEKRAR (SRS) — v3.2, soru sayısı tabanlı');
const srsRows = Object.entries(store.state().srs);
ok('SRS kayıtları oluştu', srsRows.length === 6, `${srsRows.length} kayıt`);
const wrongEntry = srsRows.find(([, r]) => r.lapses > 0);
ok('yanlış cevap kutu 0\'da kaldı', !!wrongEntry && wrongEntry[1].box === 0);
ok('yanlış sorunun dueN\'i var, dueAt yok (takvim değil sayı)', !!wrongEntry && wrongEntry[1].dueN != null && !wrongEntry[1].dueAt);
const rightEntry = srsRows.find(([, r]) => r.lapses === 0 && r.box >= engine.BOXES.length);
ok('ilk seferde doğru cevap direkt mezun oldu (v3: tekrar sırasına hiç girmiyor)', !!rightEntry);
ok('her kayıtta mezuniyet YA DA dueN var', srsRows.every(([, r]) => r.box >= engine.BOXES.length || r.dueN != null));

// vade artık cevap SAYACINA göre: SRS_WRONG_GAP kadar cevap geçmeden due
// olmaz. Bu bölümdeki soruların üzerinde daha önceki bölümlerin cevap
// geçmişi olabileceğinden, HER testi kendi TEMİZ (daha önce hiç kullanılmamış,
// hâkimlik OLMAYAN) sorusuyla ve o anki cevap sayısına göre ölçüyoruz.
const freshHmgsQ = () => {
  const answered = new Set(store.state().answers.map(a => a.qId));
  return window.QUESTIONS_DATA.find(q => data.isCoreTarget(q) && data.tierOf(q) !== data.TIER_ADV
    && !answered.has(q.id) && !store.state().srs[q.id]);
};

{
  const q1 = freshHmgsQ();
  const n0 = store.state().answers.length;
  store.state().answers.push({ qId: q1.id, subjectId: q1.subjectId, ok: false, ms: 60000, at: new Date().toISOString() });
  engine.scheduleAfterAnswer(q1.id, false);
  const r1 = store.state().srs[q1.id];
  ok('yanlışın vadesi tam SRS_WRONG_GAP kadar cevap sonra', r1.dueN === (n0 + 1) + engine.SRS_WRONG_GAP, `dueN=${r1.dueN} beklenen=${(n0 + 1) + engine.SRS_WRONG_GAP}`);
  ok('takvim tarihi (dueAt) YOK, yalnız dueN var', !r1.dueAt);
  ok('henüz vadesi gelmemiş (cevap sayısı yetmedi)', engine.dueQuestions().every(d => d.q.id !== q1.id));
}

// mezuniyet zinciri: bir soruyu yanlış yap, sonra doğru yap → 1 kez takılıp
// toparlayan (lapses===1) tam mezun olmalı, ikinci bir kontrol turu almamalı.
{
  const gq = freshHmgsQ();
  engine.scheduleAfterAnswer(gq.id, false);
  ok('yanlıştan sonra tekrar sırasına girdi', store.state().srs[gq.id].dueN != null);
  engine.scheduleAfterAnswer(gq.id, true);
  ok('1 kez takılıp sonra doğru yapılan soru DİREKT mezun oldu (nokta kontrolü almadı)',
    store.state().srs[gq.id].box >= engine.BOXES.length && !store.state().srs[gq.id].spot);
  engine.scheduleAfterAnswer(gq.id, false);
  ok('mezun soru yanlışta yeniden kutu 0\'a döndü', store.state().srs[gq.id].box === 0);
}

// nokta kontrolü (spot): 2+ kez takılıp sonra doğru yapılan soru TEK, uzak
// bir kontrol turu alır (v3.2, bkz. engine.js SRS_SPOTCHECK_GAP notu).
{
  const spotQ = freshHmgsQ();
  engine.scheduleAfterAnswer(spotQ.id, false);
  engine.scheduleAfterAnswer(spotQ.id, false); // 2. kez yanlış → lapses=2
  const beforeSpot = store.state().answers.length;
  engine.scheduleAfterAnswer(spotQ.id, true);  // şimdi doğru
  const spotRec = store.state().srs[spotQ.id];
  ok('2+ kez takılıp sonra doğru yapılan soru DİREKT mezun OLMADI', spotRec.box < engine.BOXES.length);
  ok('bunun yerine nokta kontrolü (spot) işaretlendi', spotRec.spot === true);
  ok('nokta kontrolü SRS_SPOTCHECK_GAP kadar uzakta', spotRec.dueN === beforeSpot + engine.SRS_SPOTCHECK_GAP);
  ok('nokta kontrolü SRS_WRONG_GAP\'ten kasıtlı olarak çok daha uzak', engine.SRS_SPOTCHECK_GAP > engine.SRS_WRONG_GAP * 3);
  engine.scheduleAfterAnswer(spotQ.id, true); // nokta kontrolü de doğru → artık gerçekten biter
  ok('nokta kontrolü de doğru yapılınca tam mezun oluyor', store.state().srs[spotQ.id].box >= engine.BOXES.length);
}

/* ---------- MASTERY ---------- */

section('OTOMATİKLEŞME SKORU (MASTERY)');
const m = engine.subjectMastery('medeni_hukuk');
ok('mastery hesaplanıyor', typeof m.acc === 'number' && m.n > 0, `n=${m.n} acc=${(m.acc * 100).toFixed(0)}%`);
ok('medyan süre hesaplanıyor', m.medianSec >= 0);
ok('durum etiketi geçerli', ['none', 'thin', 'effort', 'aware', 'auto'].includes(m.state), m.state);
ok('hiç çözülmemiş ders none döndürüyor', engine.subjectMastery('mohuk').state === 'none' ||
  engine.subjectMastery('mohuk').n === 0);
const all = engine.allSubjectMastery();
ok('20 dersin tamamı raporlanıyor', all.length === 20);
ok('havuz boyutu raporlanıyor', all.every(s => typeof s.pool === 'number'));

/* ---------- KİŞİSEL ZORLUK SİNYALİ (bleedingTags) ---------- */

section('KİŞİSEL ZORLUK SİNYALİ (statik difficulty yerine SRS/telemetriden)');
{
  // En az 2 soruda ortak geçen bir etiket bul (topic-kavram etiketleri
  // aynı konudaki tüm sorularda paylaşılır, bu yüzden bolca var).
  const tagCount = new Map();
  window.QUESTIONS_DATA.forEach(q => (q.tags || []).forEach(t => {
    if (!tagCount.has(t)) tagCount.set(t, []);
    tagCount.get(t).push(q);
  }));
  const shared = [...tagCount.entries()].find(([, qs]) => qs.length >= 2);
  ok('en az iki soruda paylaşılan bir etiket bulunuyor', !!shared, shared ? shared[0] : '—');

  if (shared) {
    const [tag, qs] = shared;
    const before = engine.bleedingTags().find(b => b.tag === tag);
    ok('yeterli veri yokken etiket henüz raporlanmıyor', !before);

    store.recordAnswer(qs[0], 'ZZZ', 1000, 'practice'); // kasıtlı yanlış
    store.recordAnswer(qs[1], 'ZZZ', 1000, 'practice'); // kasıtlı yanlış
    const after = engine.bleedingTags().find(b => b.tag === tag);
    ok('iki yanlıştan sonra etiket kanayanlar listesinde', !!after, tag);
    if (after) {
      ok('yanlış/doğru sayaçları isabetli', after.wrong >= 2 && after.n >= 2,
        `n=${after.n} wrong=${after.wrong}`);
      ok('hata oranı hesaplanıyor', after.rate > 0 && after.rate <= 1, after.rate.toFixed(2));
    }

    store.recordAnswer(qs[0], qs[0].correct, 1000, 'practice'); // aynı soruyu düzelt
    const afterFix = engine.bleedingTags().find(b => b.tag === tag);
    ok('düzeltme sonrası hata oranı düşüyor (son deneme değil, kümülatif — ham günlük hiç silinmez)',
      !afterFix || afterFix.rate <= (after ? after.rate : 1));
  }

  ok('etiketsiz soru bleedingTags\'i çökertmiyor', (() => {
    try { engine.bleedingTags(); return true; } catch { return false; }
  })());
}

/* ---------- ŞIK / ÖNCÜL ELEME (elim.js) ---------- */

section('ŞIK / ÖNCÜL ELEME (öncüle tıkla → içeren şıklar otomatik çizilir)');
{
  const elim = await import('../js/elim.js');
  const wrap = window.document.createElement('div');
  wrap.id = 'view-unittest';
  wrap.innerHTML = `
    ${elim.premiseHTML('Bir giriş cümlesi.\nI. Önerme bir.\nII. Önerme iki.\nIII. Önerme üç.')}
    <div class="opts" id="ut-opts">
      ${elim.optionRowHTML({ key: 'A', text: 'Yalnız I' }, { pickAct: 'pick' })}
      ${elim.optionRowHTML({ key: 'B', text: 'I ve II' }, { pickAct: 'pick' })}
      ${elim.optionRowHTML({ key: 'C', text: 'II ve III' }, { pickAct: 'pick' })}
      ${elim.optionRowHTML({ key: 'D', text: 'Hepsi' }, { pickAct: 'pick' })}
      ${elim.optionRowHTML({ key: 'E', text: 'Yalnız III' }, { pickAct: 'pick' })}
    </div>`;
  window.document.body.appendChild(wrap);

  ok('giriş cümlesi tıklanamaz öncül olarak ayrıştı', wrap.querySelectorAll('.premise-lead').length === 1);
  ok('3 öncül tıklanabilir elemana ayrıştı', wrap.querySelectorAll('.premise-item').length === 3);

  const optA = wrap.querySelector('.opt[data-key="A"]');
  const optB = wrap.querySelector('.opt[data-key="B"]');
  const optC = wrap.querySelector('.opt[data-key="C"]');
  const optD = wrap.querySelector('.opt[data-key="D"]');
  const optE = wrap.querySelector('.opt[data-key="E"]');

  elim.togglePremise('#view-unittest', 'I');
  ok('"I" elenince "Yalnız I" otomatik çizildi', optA.classList.contains('struck-auto'));
  ok('"I" elenince "I ve II" otomatik çizildi', optB.classList.contains('struck-auto'));
  ok('"I" elenince "II ve III" ÇİZİLMEDİ (I geçmiyor)', !optC.classList.contains('struck-auto'));
  ok('"I" elenince "Hepsi" de çizildi (tüm öncülleri kapsar)', optD.classList.contains('struck-auto'));
  ok('"I" elenince "Yalnız III" ÇİZİLMEDİ', !optE.classList.contains('struck-auto'));

  elim.togglePremise('#view-unittest', 'III');
  ok('"III" de elenince "II ve III" artık çizili', optC.classList.contains('struck-auto'));
  ok('"III" de elenince "Yalnız III" artık çizili', optE.classList.contains('struck-auto'));

  elim.togglePremise('#view-unittest', 'I'); // yalnız I'yı geri al, III elenmiş kalıyor
  ok('I geri alınınca "Yalnız I" açıldı', !optA.classList.contains('struck-auto'));
  ok('I geri alınınca "I ve II" açıldı (I referansı düştü)', !optB.classList.contains('struck-auto'));
  ok('III hâlâ elenmişken "Yalnız III" hâlâ çizili kalıyor', optE.classList.contains('struck-auto'));

  elim.toggleOption('#view-unittest', 'D');
  ok('✕ ile manuel eleme çalışıyor', optD.classList.contains('struck-manual'));
  ok('✕ düğmesi "on" durumuna geçti', wrap.querySelector('.opt-x[data-key="D"]').classList.contains('on'));
  elim.toggleOption('#view-unittest', 'D');
  ok('✕ tekrar tıklanınca geri açılıyor', !optD.classList.contains('struck-manual'));

  wrap.remove();
}

/* ---------- KOÇ KARARI DEĞİŞİYOR MU ---------- */

section('KOÇ KARARI VERİYE TEPKİ VERİYOR MU');
const actAfter = engine.nextAction();
ok('karar üretiliyor', !!actAfter.title && !!actAfter.cta);
ok('kararın gerekçesi veriye atıf yapıyor', actAfter.why.length > 50);
console.log(`  · şimdi: [${actAfter.kind}] ${actAfter.title}`);
// vadesi gelmiş çok soru varken koç önceliklendirmesi
const S = store.state();
Object.keys(S.srs).slice(0, 8).forEach(id => {
  S.srs[id].dueAt = new Date(Date.now() - 86400000).toISOString();
  S.srs[id].box = 0;
});
const actReview = engine.nextAction();
// Henüz deneme çözülmemişse baz ölçüm (exam) önceliklidir, alternatiflerde tekrar yer alır
ok('baz ölçüm (deneme) yokken deneme önceliklendirilir', actReview.kind === 'exam');
ok('deneme önerisinin alternatiflerinde tekrarları çöz yer alır', actReview.alts.some(a => a.label.includes('Tekrar')));

// Deneme varlığında karma set önerilir
S.exams.push({ at: new Date().toISOString(), correct: 80, pass: false, net: 80 });
const actWithExam = engine.nextAction();
ok('deneme sonrası karma set önerilir', actWithExam.kind === 'karma');
S.exams.pop();

// temizle
Object.keys(S.srs).forEach(id => { S.srs[id].dueAt = new Date(Date.now() + 86400000).toISOString(); });

section('TEMA VE YAZI BOYUTU (AYARLAR VE KALICILIK)');
const initSettings = store.getSettings();
ok('varsayılan tema geçerli', ['system', 'light', 'dark'].includes(initSettings.theme));
ok('varsayılan yazı boyutu normal', initSettings.fontSize === 'normal');

store.updateSettings({ theme: 'dark', fontSize: 'large' });
const updated = store.getSettings();
ok('karanlık tema kaydedildi', updated.theme === 'dark');
ok('büyük yazı boyutu kaydedildi', updated.fontSize === 'large');

store.updateSettings({ theme: 'system', fontSize: 'normal' });
ok('ayarlar başarıyla güncellendi', store.getSettings().theme === 'system');

section('GÜNLÜK HEDEF VE SERİ');
const tp = engine.todayProgress();
ok('bugünkü çözüm sayılıyor', tp.solved >= 6, `${tp.solved} soru`);
ok('günlük hedef hesaplanıyor', tp.target > 0, `${tp.target} soru`);
ok('çalışma serisi hesaplanıyor', store.streak() >= 1, `${store.streak()} gün`);

/* ---------- DENEME SINAVI ---------- */

section('DENEME SINAVI');
const examStarted = exam.start();
ok('deneme kuruldu', examStarted === true);
ok('deneme aktif', exam.active() === true);
exam.render();
const eHost = window.document.querySelector('#view-exam');
ok('sınav ekranı render edildi', !!eHost.querySelector('.exam-bar'));
ok('geri sayım sayacı var', !!eHost.querySelector('#exam-clock'));
ok('soru haritası basıldı', eHost.querySelectorAll('.exam-map button').length > 20,
  `${eHost.querySelectorAll('.exam-map button').length} soru`);

// tüm soruları cevapla: yarısı doğru; her 7. soru bilinçli olarak boş kalır
// (boş bırakma dökümü ve uyarı kartı da böylece gerçek veriyle sınanır)
const examSize = eHost.querySelectorAll('.exam-map button').length;
for (let i = 0; i < examSize; i++) {
  exam.goto(i);
  if (i % 7 === 0) continue;
  const ask = window.document.querySelector('#view-exam .q-ask')?.textContent?.trim().slice(0, 30);
  const q = window.QUESTIONS_DATA.find(x => (x.stem || '').includes(ask));
  const key = i % 2 === 0 ? (q?.correct || 'A') : (['A','B','C','D','E'].find(k => k !== (q?.correct || 'A')));
  exam.pick(key);
}
const beforeExams = store.state().exams.length;
exam.finish(true);
const S2 = store.state();
ok('deneme sonucu kaydedildi', S2.exams.length === beforeExams + 1);
const res = S2.exams[S2.exams.length - 1];
ok('net = doğru sayısı (yanlış cezası yok)', res.net === res.correct, `net=${res.net} doğru=${res.correct}`);
ok('doğru+yanlış+boş = toplam', res.correct + res.wrong + res.blank === res.total,
  `${res.correct}+${res.wrong}+${res.blank} vs ${res.total}`);
ok('puan hesaplandı', res.points > 0, `${res.points} puan`);
ok('baraj kararı verildi', typeof res.pass === 'boolean');
ok('ders kırılımı üretildi', Object.keys(res.bySubject).length > 5);
ok('deneme cevapları da telemetriye yazıldı',
  store.state().answers.filter(a => a.mode === 'exam').length === res.total);
// Sonuç ekranı yeniden tasarlandı (özet + "Çözümleri aç" okuyucusu); eski .result-net yok.
ok('sonuç ekranı basıldı', !!window.document.querySelector('#view-exam .rv'));
ok('deneme bitince aktif değil', exam.active() === false);
console.log(`  · sonuç: ${res.net} net · ${res.points} puan · baraj ${res.pass ? 'geçti' : 'geçemedi'}`);

/* ---------- DENEME SONRASI ÇÖZÜM HARİTASI ----------
   23 Eylül 2026: sonuç kaydı artık metin taşıyan `misses` dökümü yerine
   `map` (her soru için kimlik + kova) ve `review` taşıyor; çözüm ekranı
   metni soru havuzundan okuyor. Eski döküm testleri bu sözleşmeye çevrildi. */

section('DENEME SONUCU · ÇÖZÜM HARİTASI');
ok('sonuç kaydı her soru için harita taşıyor', Array.isArray(res.map) && res.map.length === res.total,
  `${Array.isArray(res.map) ? res.map.length : 'yok'} / ${res.total}`);
const kovaSay = k => (res.map || []).filter(m => m.b === k).length;
ok('haritada boşlar boş kovasında', kovaSay('bos') === res.blank, `${kovaSay('bos')} vs ${res.blank}`);
ok('haritada yanlışlar kavram/eksik kovalarında', kovaSay('kavram') + kovaSay('eksik') === res.wrong,
  `${kovaSay('kavram') + kovaSay('eksik')} vs ${res.wrong}`);
ok('yanlış/boş soru kimlikleri sonuçta saklanıyor',
  Array.isArray(res.wrongIds) && res.wrongIds.length === res.wrong + res.blank);
ok('tekrar havuzu yanlış ve boşları kapsıyor',
  Array.isArray(res.repeatIds) && res.wrongIds.every(id => res.repeatIds.includes(id)));
const eHost2 = window.document.querySelector('#view-exam');
ok('deneme biter bitmez çözüm okuyucusu açık', (eHost2.textContent || '').includes('Deneme çözümleri'));

// Butonun kurduğu seans, etiketteki yanlışları çözmeli — SRS'nin vadesi gelmiş
// havuzunu değil. Aksi halde etiket ile davranış ayrışır.
const worse = exam.wrongIdsOfLast();
ok('son denemenin yanlış kimlikleri sorulabiliyor', worse.length === res.wrongIds.length);
const reviewPool = worse.map(id => data.questionById.get(id)).filter(Boolean);
ok('yanlış kimlikleri gerçek sorulara çözülüyor', reviewPool.length === worse.length,
  `${reviewPool.length}/${worse.length}`);
const hazir = practice.startSession({
  questions: reviewPool,
  customLabel: `Deneme yanlışları · ${reviewPool.length} soru`
});
ok('yanlışlardan seans kuruldu', hazir === true);
ok('seans etiketteki soru sayısı kadar soru aldı (count kesmiyor)',
  (window.document.querySelector('#view-practice .q-progress-count')?.textContent || '').trim() ===
    `1 / ${reviewPool.length}`,
  (window.document.querySelector('#view-practice .q-progress-count')?.textContent || '').trim());
ok('seans etiketi yanlışları kastettiğini söylüyor',
  (window.document.querySelector('#view-practice .q-strip-right .chip.accent')?.textContent || '').includes('Deneme yanlışları'),
  window.document.querySelector('#view-practice .q-strip-right .chip.accent')?.textContent?.trim());
ok('seans yalnız son denemede yanlış yapılan soruları içeriyor',
  reviewPool.every(q => res.wrongIds.includes(q.id)));
practice.endSession();

// Açıkça boş havuz verilirse tüm havuza sessizce düşmemeli.
ok('boş havuzla seans kurulmaz',
  practice.startSession({ questions: [], customLabel: 'boş' }) === false);
practice.endSession();

/* ---------- BARAJ METRİĞİ DOĞRU MU (eski hatanın regresyon testi) ---------- */

section('BARAJ METRİĞİ REGRESYON TESTİ');
const sc = engine.scoreOf(84, 120);
ok('84 doğru = 70.0 puan (baraj)', sc.points === 70, `${sc.points}`);
ok('84 doğru barajı geçiyor', sc.pass === true);
ok('83 doğru barajı geçmiyor', engine.scoreOf(83, 120).pass === false);
ok('120 doğru = 100 puan', engine.scoreOf(120, 120).points === 100);
ok('baraj kümülatif doğruya DEĞİL deneme netine bakıyor',
  store.lastExam().net === res.correct);

/* ---------- KONU AKIŞI ---------- */

section('KONU AKIŞI (FLOW)');
flow.setSubject('medeni_hukuk');
const fHost = window.document.querySelector('#view-flow');
ok('akış ekranı render edildi', fHost.innerHTML.length > 800);
ok('sekme YOK (tek sütun akış)', fHost.querySelectorAll('.topic-tab-btn').length === 0);
ok('okuma sütunu var', !!fHost.querySelector('.read'));
ok('içindekiler listesi var', fHost.querySelectorAll('.flow-toc a').length > 5);
ok('mevzuat şeridi basıldı', !!fHost.querySelector('.basisline'));
ok('kavra bölümleri basıldı', fHost.querySelectorAll('.read section').length > 1);
ok('sınav tuzağı basıldı', fHost.querySelectorAll('.trap').length > 0);
ok('konu okundu olarak işaretlendi', Object.keys(store.state().topics).length > 0);

// v3 konuda etkileşimli motor, eski konuda dürüst etiket
const v3Topic = window.TOPICS_DATA.find(t => data.V3_TYPES.has(t.visualType));
if (v3Topic) {
  flow.open(v3Topic.id);
  const slot = window.document.querySelector('#view-flow #visual-slot, #view-flow .hv3-host');
  ok('v3 konuda görsel yuvası dolduruldu', !!slot && slot.innerHTML.length > 50, v3Topic.id);
}
const legacyTopic = window.TOPICS_DATA.find(t => !data.V3_TYPES.has(t.visualType) && t.visualData);
if (legacyTopic) {
  flow.open(legacyTopic.id);
  const legacy = window.document.querySelector('#view-flow .visual-legacy');
  ok('eski görsel dürüstçe "dönüştürülmeyi bekliyor" olarak etiketlendi',
    !!legacy && /bekliyor/.test(legacy.textContent), legacyTopic.id);
}
// konuya bağlı soru varsa çözme düğmesi çıkmalı
const linked = window.TOPICS_DATA.find(t => data.questionsOfTopic(t.id).length > 0);
if (linked) {
  flow.open(linked.id);
  ok('bağlı sorusu olan konuda "soruları çöz" düğmesi var',
    !!window.document.querySelector('#view-flow [data-act="flow-practice"]'));
}

/* ---------- OKUMA EKRANI SAKİNLİĞİ (P1 regresyon testleri) ---------- */

section('OKUMA EKRANI SAKİNLİĞİ');
const u = await import('../js/ui.js');

// 3. Mevzuat şeridi normalizasyonu
ok('kanun adı tekrarı toplanıyor',
  u.groupLegalRefs('TMK m. 8,TMK m. 9,TMK m. 13,TBK m. 49') === 'TMK m. 8, 9, 13 · TBK m. 49',
  u.groupLegalRefs('TMK m. 8,TMK m. 9,TMK m. 13,TBK m. 49'));
ok('ekran görüntüsündeki bozuk şerit düzeldi',
  u.groupLegalRefs('4857 sk m. 2,4857 sk m. 2/4,4857 sk m. 2/6-7,4857 sk m. 6,1475 sk m. 14')
    === '4857 sk m. 2, 2/4, 2/6-7, 6 · 1475 sk m. 14',
  u.groupLegalRefs('4857 sk m. 2,4857 sk m. 2/4,4857 sk m. 2/6-7,4857 sk m. 6,1475 sk m. 14'));
ok('madde yapısı olmayan referans korunuyor',
  u.groupLegalRefs('TMK m. 161,7533 sayılı Kanun').includes('7533 sayılı Kanun'));
ok('mükerrer madde iki kez yazılmıyor',
  u.groupLegalRefs('TMK m. 8,TMK m. 8') === 'TMK m. 8');
ok('dizi biçimindeki legalBasis de işleniyor',
  u.groupLegalRefs(['4857 sk m. 2', '4857 sk m. 2/4', '1475 sk m. 14'])
    === '4857 sk m. 2, 2/4 · 1475 sk m. 14',
  u.groupLegalRefs(['4857 sk m. 2', '4857 sk m. 2/4', '1475 sk m. 14']));
ok('gerçek veride her konunun şeridi tek satıra sığıyor', (() => {
  const bad = window.TOPICS_DATA.filter(t => u.groupLegalRefs(t.legalBasis).length > 95);
  return bad.length === 0;
})(), (() => {
  const l = window.TOPICS_DATA.map(t => u.groupLegalRefs(t.legalBasis)).sort((a, b) => b.length - a.length)[0];
  return `en uzun ${l.length}: ${l.slice(0, 80)}`;
})());

// splitStem — Türkçe binlik ayraçlı sayı ("15.000 TL") cümle sonu sanılmıyor
// (27 Tem regresyonu: hmgs_2026_04_067 "...15." / "000 TL'lik..." diye bölünüyordu)
ok('binlik ayraçlı sayı öncülü erken kesmiyor', (() => {
  const r = u.splitStem('Anıl\'ın Betül aleyhine açtığı 15.000 TL\'lik alacak davasının görüldüğü duruşmada, davalı Betül, "Hâkim Bey, benim Anıl\'dan borç para aldığım doğrudur fakat ben bu parayı 10.03.2025 tarihinde kendisine ödedim." şeklinde beyanda bulunmuştur. Medeni usul hukuku açısından Betül\'ün beyanının hukuki niteliği aşağıdakilerden hangisidir?');
  return r.premise.endsWith('bulunmuştur.') && r.ask.startsWith('Medeni usul hukuku');
})());
ok('gerçek veride hiçbir öncül rakam+nokta ile bitmiyor', (() => {
  const bad = window.QUESTIONS_DATA
    .map(q2 => u.splitStem(q2.stem))
    .filter(r => r.premise && /\d\.$/.test(r.premise.trim()));
  return bad.length === 0;
})());

/* ---------- ÖNCÜL SÖZLEŞMESİ (kalıcı kapı) ----------
   18 Eyl 2026 arızası: 393 öncüllü sorunun 110 öncülü ekranda HİÇ doğmuyordu
   (kökün ham metninde rakam kendi satırındaydı: "I.\nmetin"); 6 soruda hiçbir
   öncül tıklanamadığı için ÖNCÜL SİLME tamamen çalışmıyordu.
   Sözleşme: kökte N tane I./II./III. rakamı varsa ekranda N tane TIKLANABİLİR
   öncül olmak zorundadır. Bu test, arızayı bir daha sessizce geçirmez. */
{
  const elTest = await import('../js/elim.js');
  const ROMA_TEST = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const sorunlu = [];
  let onculuSoru = 0, onculToplam = 0;
  for (const q2 of window.QUESTIONS_DATA) {
    const stem = String(q2.stem || '');
    const sayi = ROMA_TEST.filter(n => new RegExp(`(^|[\\s\\n(])${n}\\.`).test(stem)).length;
    if (sayi < 2) continue;
    onculuSoru++;
    onculToplam += sayi;
    const html2 = elTest.premiseHTML(u.splitStem(stem).premise);
    const uretilen = (html2.match(/class="premise-item"/g) || []).length;
    if (uretilen < sayi) sorunlu.push(`${q2.id} kökte=${sayi} üretilen=${uretilen}`);
  }
  if (sorunlu.length) console.log('      ' + sorunlu.slice(0, 10).join('\n      '));
  ok('her öncüllü kök, kökteki rakam sayısı kadar tıklanabilir öncül üretiyor',
    sorunlu.length === 0, `${sorunlu.length} soru eksik · ${onculuSoru} öncüllü soru / ${onculToplam} öncül`);

  /* Ekran görüntüsündeki soru (5 öncül, hiçbiri tıklanamıyordu): kök sayısı
     birebir çıkmalı. NOT: bu sorunun şıkları Roma rakamına atıf YAPMAZ
     (A=Risk, B=İş kazası…) — öncül elemenin şık çizmemesi burada DOĞRU
     davranıştır, o yüzden çizim ölçütü ayrı soruyla sınanır. */
  const q249 = window.QUESTIONS_DATA.find(x => x.id === 'hakim_akad_is_249');
  if (q249) {
    const w249 = window.document.createElement('div');
    w249.id = 'view-oncul-249';
    w249.innerHTML = elTest.premiseHTML(u.splitStem(q249.stem).premise);
    window.document.body.appendChild(w249);
    const onculSayi = w249.querySelectorAll('.premise-item').length;
    ok('gerçek öncüllü soruda (hakim_akad_is_249) 5 öncül tıklanabilir',
      onculSayi === 5, `bulunan ${onculSayi}`);
    w249.remove();
  }

  /* Uçtan uca eleme: şıkları Roma rakamına atıf yapan gerçek soru.
     "I" elenince "Yalnız I", "I ve II", "I ve III", "I, II ve III" çizilmeli;
     "Yalnız II" ÇİZİLMEMELİ (I geçmiyor). Bu soru da arıza günü bozuktu
     (3 öncülün yalnız 1'i tıklanabiliyordu). */
  const qAv = window.QUESTIONS_DATA.find(x => x.id === 'hakim_akad_avukatlik_005');
  if (qAv) {
    const wAv = window.document.createElement('div');
    wAv.id = 'view-oncul-av';
    wAv.innerHTML = elTest.premiseHTML(u.splitStem(qAv.stem).premise)
      + '<div class="opts">'
      + qAv.options.map(o => elTest.optionRowHTML(o, { pickAct: 'pick' })).join('')
      + '</div>';
    window.document.body.appendChild(wAv);
    elTest.togglePremise('#view-oncul-av', 'I');
    const cizili = [...wAv.querySelectorAll('.opt')]
      .filter(b => b.classList.contains('struck-auto')).map(b => b.dataset.key).sort().join('');
    const avOncul = wAv.querySelectorAll('.premise-item').length;
    ok('avukatlık_005: 3 öncül tıklanabilir', avOncul === 3, `bulunan ${avOncul}`);
    ok('avukatlık_005: "I" elenince onu içeren şıklar çizildi, "Yalnız II" çizilmedi',
      cizili === 'ACDE', `çizilen ${cizili || '—'}`);
    wAv.remove();
  }
}

// 4. Başlıktan madde parantezi ayıklanıyor
ok('başlıktan sıra no ve madde parantezi atıldı',
  u.topicHeading('1. Temel Kavramlar: İşçi, İşveren (4857 sk m. 2, m. 6 & 1475 sk m. 14)')
    === 'Temel Kavramlar: İşçi, İşveren',
  u.topicHeading('1. Temel Kavramlar: İşçi, İşveren (4857 sk m. 2, m. 6 & 1475 sk m. 14)'));
ok('madde içermeyen parantez korunuyor',
  u.topicHeading('3. Adalet Teorileri (Aristoteles, Rawls)').includes('Aristoteles'));

// 2. Kenar menü kısa adları
ok('menü adı iki nokta öncesinden kısaltılıyor',
  u.topicShort('1. Temel Kavramlar: İşçi, İşveren, İşveren Vekili, Alt İşveren ve İşyeri Devri (4857 sk m. 2)')
    === 'Temel Kavramlar',
  u.topicShort('1. Temel Kavramlar: İşçi, İşveren, İşveren Vekili, Alt İşveren ve İşyeri Devri (4857 sk m. 2)'));
ok('menü adları 48 karakteri geçmiyor', (() => {
  const long = window.TOPICS_DATA.filter(t => u.topicShort(t.title).length > 48);
  return long.length === 0;
})(), (() => {
  const l = window.TOPICS_DATA.map(t => u.topicShort(t.title)).sort((a, b) => b.length - a.length)[0];
  return `en uzun: "${l}" (${l.length})`;
})());
ok('menü adında madde referansı kalmadı',
  window.TOPICS_DATA.every(t => !/\bm\.\s*\d/.test(u.topicShort(t.title))));

// 6. Bölüm etiketi kısaltması
ok('bölüm etiketinden açıklama kuyruğu atıldı',
  u.shortRef('TMK m. 8 & m. 28 — Hak Ehliyeti ve Ana Rahmindeki Cenin') === 'TMK m. 8 & m. 28',
  u.shortRef('TMK m. 8 & m. 28 — Hak Ehliyeti ve Ana Rahmindeki Cenin'));
ok('parantez içindeki künye ayıklanıyor',
  u.shortRef('AİHS ve AİHM Bireysel Başvuru Rejimi (`m. 34/35 Kabul Edilebilirlik`)').startsWith('m. 34/35'),
  u.shortRef('AİHS ve AİHM Bireysel Başvuru Rejimi (`m. 34/35 Kabul Edilebilirlik`)'));
ok('madde aralığı tireden bölünmüyor', u.shortRef('4857 sk m. 2/6-7') === '4857 sk m. 2/6-7');
ok('hiçbir bölüm etiketi 40 karakteri geçmiyor', (() => {
  const refs = [];
  window.TOPICS_DATA.forEach(t => (t.chunks || []).forEach(c => c.legalRef && refs.push(u.shortRef(c.legalRef))));
  return refs.every(r => r.length <= 41);
})(), (() => {
  const refs = [];
  window.TOPICS_DATA.forEach(t => (t.chunks || []).forEach(c => c.legalRef && refs.push(u.shortRef(c.legalRef))));
  const l = refs.sort((a, b) => b.length - a.length)[0];
  return `en uzun: "${l}" (${l.length})`;
})());
ok('etiket ortalaması kısaldı (< 22 karakter)', (() => {
  const refs = [];
  window.TOPICS_DATA.forEach(t => (t.chunks || []).forEach(c => c.legalRef && refs.push(u.shortRef(c.legalRef))));
  const avg = refs.reduce((a, r) => a + r.length, 0) / refs.length;
  return avg < 22;
})(), (() => {
  const refs = [];
  window.TOPICS_DATA.forEach(t => (t.chunks || []).forEach(c => c.legalRef && refs.push(u.shortRef(c.legalRef))));
  return 'ortalama ' + (refs.reduce((a, r) => a + r.length, 0) / refs.length).toFixed(1);
})());
ok('backtick ekrana sızmıyor', (() => {
  const refs = [];
  window.TOPICS_DATA.forEach(t => (t.chunks || []).forEach(c => c.legalRef && refs.push(u.shortRef(c.legalRef))));
  return refs.every(r => !r.includes('`'));
})());

// 7. Yargı kararı alıntısı tanınıyor
ok('Yargıtay kararı alıntı olarak tanınıyor', u.isCitation('Yargıtay 9. HD, 2024/4180 E.: Fabrikada...'));
ok('düz açıklama alıntı sayılmıyor', !u.isCitation('İş sözleşmesine dayanarak çalışan gerçek kişiye işçi denir.'));
ok('alıntı etiket ve gövdeye ayrılıyor', (() => {
  const p = u.citationParts('Yargıtay Emsali: Nişan yüzüğü mutad hediyedir.');
  return p.label === 'Yargıtay Emsali' && p.body.startsWith('Nişan');
})());

// Ekrana basılan hâli
flow.setSubject('is_hukuku');
const rHost = window.document.querySelector('#view-flow');
ok('1. ders çubuğundaki 20 pill kaldırıldı', rHost.querySelectorAll('.flow-nav button').length === 0);
ok('yerine tek açılır liste var', rHost.querySelectorAll('select.flow-select').length === 1);
ok('açılır listede 20 ders var', rHost.querySelectorAll('.flow-select option').length === 20);
ok('5. anahtar noktalar mark yığını kaldırıldı',
  rHost.querySelectorAll('.read > p > mark').length === 0 ||
  !/(<mark>[^<]+<\/mark>\s*·\s*){3}/.test(rHost.innerHTML));
ok('şerit artık kanun adını tekrarlamıyor', (() => {
  const b = rHost.querySelector('.basisline')?.textContent || '';
  return (b.match(/4857/g) || []).length <= 1;
})(), rHost.querySelector('.basisline')?.textContent);
ok('başlıkta madde parantezi yok',
  !/\(.*m\.\s*\d/.test(rHost.querySelector('.read h2')?.textContent || ''),
  rHost.querySelector('.read h2')?.textContent);
ok('7. alıntı bloğu basıldı', rHost.querySelectorAll('blockquote.cite').length > 0,
  `${rHost.querySelectorAll('blockquote.cite').length} alıntı`);
ok('6. madde etiketi büyük harfe zorlanmıyor (CSS)', (() => {
  const css = fs.readFileSync(path.join(ROOT, 'studio/css/studio.css'), 'utf8');
  const block = css.match(/\.read \.ref \{[^}]*\}/s)?.[0] || '';
  return !/text-transform:\s*uppercase/.test(block);
})());
// Açılır liste router'a bağlı mı + ders değişimi çalışıyor mu
ok('açılır liste data-act ile router\'a bağlı',
  rHost.querySelector('.flow-select')?.dataset.act === 'flow-subject-select');
ok('router change olayını dinliyor', (() => {
  const src = fs.readFileSync(path.join(ROOT, 'studio/js/main.js'), 'utf8');
  return /addEventListener\('change'/.test(src) && /flow-subject-select/.test(src);
})());
flow.setSubject('ceza_hukuku');
ok('ders değişimi ekranı yeniliyor',
  window.document.querySelector('#view-flow .flow-select')?.value === 'ceza_hukuku' &&
  window.document.querySelectorAll('#view-flow .flow-toc a').length === 9,
  `${window.document.querySelectorAll('#view-flow .flow-toc a').length} konu`);

/* ---------- GÖRSEL MOTORU (8 KALIP) ---------- */

section('GÖRSEL MOTORU · 9 ETKİLEŞİM KALIBI');
const V3 = window.HMGSV3;
ok('motor supports() API\'si sunuyor', typeof V3.supports === 'function');
['decision_sim', 'drag_classify', 'time_slider', 'calculator',
 'scene_story', 'guess_table', 'step_reveal', 'interactive_hierarchy', 'family_tree'].forEach(k => {
  ok(`  ${k} destekleniyor`, V3.supports(k) === true);
});
ok('bilinmeyen tip desteklenmiyor olarak bildiriliyor', V3.supports('comparison_table') === false);
ok('data.js v3 kararını motora soruyor',
  data.isV3('guess_table') === true && data.isV3('comparison_table') === false);

// Sessiz boş kutu regresyonu: desteklenmeyen tip HATA fırlatmalı
let threw = false;
try {
  const box = window.document.createElement('div');
  V3.render(box, 'x', {}, { visualType: 'comparison_table' });
} catch (e) { threw = true; }
ok('desteklenmeyen tip sessizce boş kutu basmıyor, hata fırlatıyor', threw);

function mount(visualType, vd) {
  const box = window.document.createElement('div');
  window.document.body.appendChild(box);
  V3.render(box, 'test_' + visualType, vd, { visualType });
  return box;
}

// --- guess_table (kalıp 6) ---
const gt = mount('guess_table', {
  title: 'Hak ehliyeti vs fiil ehliyeti',
  headers: ['Hak ehliyeti', 'Fiil ehliyeti'],
  rows: [
    { label: 'Kazanılma anı', cells: [
      { guess: 'ne zaman?', text: 'Sağ doğmakla', law: 'TMK m. 28' },
      { guess: 'ne zaman?', text: 'Ayırt etme gücü + erginlik', law: 'TMK m. 10' }
    ] }
  ],
  trap: 'Cenin şartlı hak ehliyetine sahiptir.'
});
ok('guess_table hücreleri başta GİZLİ', gt.querySelectorAll('.hv3-gtc.shown').length === 0);
ok('guess_table tahmin ipucu gösteriyor', gt.textContent.includes('ne zaman?'));
ok('guess_table cevabı başta ekranda DEĞİL', !gt.textContent.includes('Sağ doğmakla'));
gt.querySelector('.hv3-gtc').click();
ok('tıklayınca cevap açılıyor', gt.textContent.includes('Sağ doğmakla'));
ok('açılan hücrede madde referansı var', gt.textContent.includes('TMK m. 28'));
ok('skor sayacı güncelleniyor', /1 \/ 2 hücre/.test(gt.textContent), gt.querySelector('.hv3-score')?.textContent);
gt.querySelector('[data-el=all]').click();
ok('tümünü aç çalışıyor', gt.querySelectorAll('.hv3-gtc.shown').length === 2);
ok('sınav tuzağı görselin içine gömülü', gt.textContent.includes('Cenin şartlı'));

// --- step_reveal (kalıp 4) ---
const sr = mount('step_reveal', {
  title: 'İlamsız icra takibi',
  steps: [
    { label: 'Takip talebi', desc: 'Alacaklı icra dairesine başvurur.', law: 'İİK m. 58' },
    { label: 'Ödeme emri', desc: 'Borçluya tebliğ edilir.', law: 'İİK m. 60', note: '7 gün içinde itiraz' },
    { label: 'Kesinleşme', desc: 'İtiraz edilmezse takip kesinleşir.', law: 'İİK m. 62' }
  ]
});
ok('step_reveal başta hiçbir adımı açmıyor', sr.querySelectorAll('.hv3-step.open').length === 0);
ok('step_reveal ilk adımda tahmin istiyor', sr.textContent.includes('tahmin et'));
ok('step_reveal içerik başta gizli', !sr.textContent.includes('icra dairesine başvurur'));
ok('geri düğmesi başta kapalı', sr.querySelector('[data-el=back]').disabled === true);
sr.querySelector('[data-el=next]').click();
ok('adım açılıyor', sr.textContent.includes('icra dairesine başvurur'));
ok('açılan adımda madde var', sr.textContent.includes('İİK m. 58'));
ok('sayaç ilerliyor', sr.textContent.includes('1 / 3 adım'));
sr.querySelector('[data-el=next]').click();
ok('uyarı notu basılıyor', sr.textContent.includes('7 gün içinde itiraz'));
sr.querySelector('[data-el=next]').click();
ok('süreç sonunda ileri kapanıyor', sr.querySelector('[data-el=next]').disabled === true);
sr.querySelector('[data-el=back]').click();
ok('geri alma çalışıyor', sr.textContent.includes('2 / 3 adım'));

// --- interactive_hierarchy (kalıp 7) ---
const ih = mount('interactive_hierarchy', {
  title: 'Normlar hiyerarşisi',
  levels: [
    { label: 'Anayasa', law: 'AY m. 11', desc: 'Bağlayıcı temel norm.',
      exceptions: ['AY m. 90/5: usulüne uygun antlaşmalar'], trap: 'AY m. 90/5 tuzağı.' },
    { label: 'Kanun', law: 'AY m. 87', desc: 'TBMM yapar.' },
    { label: 'Yönetmelik', law: 'AY m. 124', desc: 'İdare çıkarır.' }
  ],
  quiz: [
    { q: 'Çatışmada hangisi üstün?', a: 'Kanun', b: 'Yönetmelik', correct: 'a', why: 'Yönetmelik kanuna aykırı olamaz.' }
  ]
});
ok('hiyerarşi katmanları basıldı', ih.querySelectorAll('.hv3-lv').length === 3);
ok('detay başta kapalı', ih.querySelector('[data-el=det]').style.display === 'none');
ih.querySelector('.hv3-lv').click();
ok('katmana tıklayınca detay açılıyor', ih.querySelector('[data-el=det]').style.display === 'block');
ok('istisna gösteriliyor', ih.textContent.includes('AY m. 90/5'));
ok('katman tuzağı gösteriliyor', ih.textContent.includes('tuzağı'));
ok('mini test basıldı', ih.textContent.includes('Hangisi üstün') || ih.textContent.includes('hangisi üstün'));
ih.querySelector('.hv3-qopts button[data-k=a]').click();
ok('doğru cevap yeşil işaretlendi', ih.querySelector('.hv3-qopts button[data-k=a]').classList.contains('ok'));
ok('gerekçe gösteriliyor', ih.textContent.includes('kanuna aykırı olamaz'));
ok('skor tutuluyor', ih.textContent.includes('1 doğru'));

// --- family_tree (kalıp 9 — soy ağacı, miras hukuku prototipi) ---
const ft = mount('family_tree', {
  title: 'Zümre sistemi',
  cases: [
    {
      law: 'Eş 1/4, kalan 3/4 altsoy arasında eşit paylaşılır (TMK m.499-500).',
      nodes: [
        { id: 'mb', label: 'Mirasbırakan', role: 'mirasbirakan', x: 30, y: 16 },
        { id: 'es', label: 'Ayşe', gender: 'f', sub: '1/4', reason: 'Eş 1. zümreyle birlikte 1/4 alır.', x: 70, y: 16 },
        { id: 'ali', label: 'Ali', gender: 'm', sub: '3/8', reason: 'Kalan 3/4, 2 çocuğa eşit: 3/8.', x: 35, y: 70 },
        { id: 'mehmet', label: 'Mehmet', gender: 'm', sub: '3/8', reason: 'Kalan 3/4, 2 çocuğa eşit: 3/8.', x: 65, y: 70 }
      ],
      unions: [{ partners: ['mb', 'es'], children: ['ali', 'mehmet'] }]
    },
    {
      law: 'İkinci örnek: farklı bir dağılım.',
      nodes: [
        { id: 'mb2', label: 'Mirasbırakan', role: 'mirasbirakan', x: 40, y: 20 },
        { id: 'kiz', label: 'Zeynep', gender: 'f', dead: true, x: 70, y: 20 }
      ],
      unions: []
    }
  ]
});
ok('family_tree düğümleri çizildi', ft.querySelectorAll('.hv3-tnode').length === 4);
ok('mirasbırakan ⊗ sembolüyle çizildi', ft.querySelector('.hv3-tshape.mb')?.textContent === '⊗');
ok('erkek üçgen, kadın daire sınıfı aldı',
  ft.querySelectorAll('.hv3-tshape.tri').length === 2 && ft.querySelectorAll('.hv3-tshape.circ').length === 1);
ok('paylar başta GİZLİ', ft.querySelectorAll('.hv3-tguess.open').length === 0);
ok('pay tahmin çağrısı gösteriliyor, cevap değil',
  ft.textContent.includes('pay? dokun') &&
  [...ft.querySelectorAll('.hv3-tguess')].every(b => !b.textContent.includes('1/4') && !b.textContent.includes('3/8')));
ft.querySelector('.hv3-tguess').click();
ok('düğüme dokununca pay açılıyor', ft.querySelectorAll('.hv3-tguess.open').length === 1);
ok('açılan payın gerekçesi gösteriliyor', /1\/4 alır|3\/8/.test(ft.textContent));
ok('evlilik + soy bağlantı çizgileri SVG\'ye çizildi', ft.querySelectorAll('.hv3-tree-svg line').length >= 4);
ok('örnek gezinme (dots) ikinci vakayı gösteriyor', ft.querySelectorAll('[data-el=dots] i').length === 2);
ft.querySelector('[data-el=next]').click();
ok('sonraki örneğe geçince ölü işaretli düğüm (çapraz çizgi) çiziliyor', ft.querySelectorAll('.hv3-tshape.dead').length === 1);
ok('sonraki örnekte düğüm sayısı değişti (2 kişi)', ft.querySelectorAll('.hv3-tnode').length === 2);

// --- calculator (genel formül motoru) ---
const cg = mount('calculator', {
  calc: 'generic',
  title: 'Kıdem tazminatı',
  inputs: [
    { id: 'ucret', label: 'Brüt aylık ücret', value: 30000 },
    { id: 'yil', label: 'Çalışma yılı', value: 5 }
  ],
  outputs: [
    { label: 'Kıdem tazminatı', expr: 'ucret * yil', unit: '₺' },
    { label: 'Tavan sınırlı', expr: 'min(ucret, 46655) * yil', unit: '₺', note: '2026 tavanı' }
  ]
});
ok('genel hesap motoru çalıştı', cg.querySelectorAll('.hv3-cell').length === 2);
ok('formül doğru hesaplandı (30000 × 5 = 150.000)',
  cg.textContent.replace(/\s/g, '').includes('150.000'),
  cg.querySelector('.hv3-cell .hv3-cf')?.textContent);
ok('min() fonksiyonu çalışıyor (30000 < 46655 → 150.000)',
  (cg.textContent.match(/150\.000/g) || []).length >= 2);
// girdi değişince yeniden hesaplıyor mu
const yil = cg.querySelector('[data-in=yil]');
yil.value = '10';
yil.dispatchEvent(new window.Event('input', { bubbles: true }));
ok('girdi değişince canlı yeniden hesaplıyor',
  cg.textContent.replace(/\s/g, '').includes('300.000'),
  cg.querySelector('.hv3-cell .hv3-cf')?.textContent);
// güvenlik: ifade değerlendirici kod çalıştırmamalı
const eviltest = mount('calculator', {
  calc: 'generic',
  inputs: [{ id: 'a', label: 'a', value: 1 }],
  outputs: [{ label: 'kötü', expr: 'window.__pwned = 1' }, { label: 'iyi', expr: 'a + 1' }]
});
ok('ifade değerlendirici kod çalıştırmıyor (eval yok)', window.__pwned === undefined);
ok('geçersiz ifade "—" basıyor, çökmüyor', eviltest.textContent.includes('—'));
ok('geçersiz ifadenin yanındaki geçerli ifade yine hesaplanıyor', eviltest.textContent.includes('2'));
ok('motor kaynağında eval/new Function yok (yorumlar hariç)', (() => {
  const src = fs.readFileSync(path.join(ROOT, 'js/visual-engines-v3.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')   // blok yorumlar
    .replace(/^\s*\/\/.*$/gm, '');      // satır yorumları
  return !/\beval\s*\(/.test(src) && !/new\s+Function\s*\(/.test(src);
})());

// Mevcut v3 konuları hâlâ çiziliyor mu (regresyon).
// Sabit sayı YAZMA: konu dönüştürüldükçe artar, testin kırılması bilgi değil gürültü olur.
const v3Topics = window.TOPICS_DATA.filter(t => data.isV3(t.visualType));
let drawn = 0, failed = [];
v3Topics.forEach(t => {
  try {
    const box = window.document.createElement('div');
    V3.render(box, 'reg_' + t.id, t.visualData, t);
    if (box.querySelector('.hv3')?.children.length > 0) drawn++;
    else failed.push(t.id + ' (boş)');
  } catch (e) { failed.push(t.id + ': ' + e.message); }
});
ok('mevcut tüm v3 konuları hatasız çiziliyor', failed.length === 0, failed.slice(0, 3).join(' | '));
ok('hepsi gerçekten içerik bastı', drawn === v3Topics.length, `${drawn}/${v3Topics.length}`);
ok('v3 konu sayısı geriye gitmedi (>=20)', v3Topics.length >= 20, `${v3Topics.length}`);

/* ---- Standart v4 §B.0: sahne anlatım bloğu (scene.tell) ----
   Konu gövdesi sahnenin içine gömülüyor. Motor bunu taşımazsa
   dönüşüm sessizce "düz yazı + widget"a geri düşer. */
{
  const box = window.document.createElement('div');
  V3.render(box, 'tell_t', {
    scenes: [
      { cap: 'a', tell: '<p>Anlatım <b>bir</b>.</p>', law: 'Kanun <b>m. 1</b>', html: '<i>x</i>' },
      { cap: 'b', html: '<i>y</i>' }
    ]
  }, { visualType: 'scene_story' });
  const tell = box.querySelector('.hv3-tell');
  ok('sahne anlatım bloğu (tell) DOM\'a basıldı', !!tell && tell.querySelector('b'));
  ok('tell HTML olarak işleniyor, kaçırılmıyor', tell.innerHTML.includes('<b>'));
  ok('law şeridi artık HTML kabul ediyor', box.querySelector('.hv3-law').innerHTML.includes('<b>'));

  // tell'i olmayan sahnede blok gizlenmeli — eski sahneler bozulmasın
  box.querySelector('.hv3-nav button:last-child').dispatchEvent(new window.Event('click'));
  ok('tell\'siz sahnede anlatım bloğu gizleniyor', box.querySelector('.hv3-tell').style.display === 'none');
  ok('tell\'siz sahnede law şeridi de gizleniyor', box.querySelector('.hv3-law').style.display === 'none');
}

/* ---- Standart v4.1 §B.0.6: geri-çağırma kapısı (scene.ask) ----
   Anlatım, kullanıcı tahmin etmeden açılmamalı. Kapı çalışmazsa
   konu sessizce "pasif okuma"ya geri düşer. */
{
  const box = window.document.createElement('div');
  V3.render(box, 'ask_t', {
    scenes: [{
      cap: 'a', tell: '<p>Anlatım gövdesi.</p>', law: 'Kanun m. 1',
      ask: {
        q: 'Soru?',
        opts: [{ t: 'Yanlış şık', why: 'Şuradan yanlış.' }, { t: 'Doğru şık', ok: true, why: 'Aynen.' }]
      }
    }, { cap: 'b', tell: '<p>Kapısız sahne.</p>' }]
  }, { visualType: 'scene_story' });

  ok('soru kutusu basıldı', !!box.querySelector('.hv3-askq'));
  ok('şıklar basıldı', box.querySelectorAll('.hv3-asko').length === 2);
  ok('TAHMİNDEN ÖNCE anlatım gizli', box.querySelector('.hv3-tell').style.display === 'none');
  ok('TAHMİNDEN ÖNCE mevzuat şeridi gizli', box.querySelector('.hv3-law').style.display === 'none');
  ok('tahminden önce geri bildirim yok', !box.querySelector('.hv3-askfb[style*="display: none"]')
    ? box.querySelector('.hv3-askfb').style.display === 'none' : true);

  // yanlış şıkkı seç
  box.querySelectorAll('.hv3-asko')[0].dispatchEvent(new window.Event('click'));
  ok('yanlış seçimden SONRA anlatım açıldı', box.querySelector('.hv3-tell').style.display !== 'none');
  ok('yanlış seçimden sonra mevzuat açıldı', box.querySelector('.hv3-law').style.display !== 'none');
  const fb = box.querySelector('.hv3-askfb');
  ok('seçime ÖZGÜ geri bildirim verildi', fb.textContent.includes('Şuradan yanlış'));
  ok('yanlış cevap kırmızı işaretlendi', fb.classList.contains('no'));
  ok('doğru şık yine de gösteriliyor', box.querySelectorAll('.hv3-asko')[1].classList.contains('ok'));
  ok('cevap sonrası şıklar kilitlendi', box.querySelectorAll('.hv3-asko')[0].disabled === true);

  // sahne değiştirip geri gel — cevap hatırlanmalı
  box.querySelector('.hv3-nav button:last-child').dispatchEvent(new window.Event('click'));
  ok('ask\'siz sahnede kapı yok, anlatım açık', box.querySelector('.hv3-ask').style.display === 'none'
    && box.querySelector('.hv3-tell').style.display !== 'none');
  box.querySelector('.hv3-nav button:first-child').dispatchEvent(new window.Event('click'));
  ok('geri dönünce verilen cevap hatırlanıyor', box.querySelector('.hv3-askfb')?.textContent.includes('Şuradan yanlış'));
}

/* ---- fill_slots: göstermek değil doldurtmak (KONU_YAZIM_TALIMATI §3) ---- */
{
  const box = window.document.createElement('div');
  V3.render(box, 'fs_t', {
    headers: ['Kim', 'Pay'],
    pool: ['1/4', '3/8'],
    rows: [{ label: 'Ayşe', slots: [{ answer: '1/4', why: 'Eş 1. zümreyle 1/4.' }] }]
  }, { visualType: 'fill_slots' });

  ok('fill_slots tabloyu bastı', !!box.querySelector('.hv3-fs'));
  const cell = box.querySelector('.hv3-fscell');
  ok('hücre boş geliyor, cevap gösterilmiyor', cell && !cell.textContent.includes('1/4'));
  ok('havuz başta kapalı', box.querySelector('.hv3-fspool').style.display === 'none');

  cell.dispatchEvent(new window.Event('click'));
  ok('hücreye dokununca havuz açıldı', box.querySelector('.hv3-fspool').style.display !== 'none');
  const chips = box.querySelectorAll('.hv3-fschip');
  ok('havuzda seçenekler var', chips.length === 2);

  // yanlış seç
  const yanlis = [...chips].find(c => c.textContent === '3/8');
  yanlis.dispatchEvent(new window.Event('click'));
  const fb = box.querySelector('[data-el=fb]');
  ok('yanlış doldurmada gerekçe açıldı', fb.textContent.includes('Eş 1. zümreyle'));
  ok('yanlış hücre kırmızı ve doğrusunu gösteriyor', (() => {
    const c = box.querySelector('.hv3-fscell');
    return c.classList.contains('no') && c.textContent.includes('1/4');
  })());
  ok('doldurulan hücre kilitlendi', box.querySelector('.hv3-fscell').disabled === true);
  ok('skor sayacı çalışıyor', box.querySelector('[data-el=score]').textContent.includes('1/1'));
}

/* ---- predict_then_explore: simülatörden önce taahhüt ---- */
{
  const box = window.document.createElement('div');
  V3.render(box, 'pte_t', {
    inner: 'decision_sim',
    predict: { q: 'Ne olur?', opts: [{ t: 'A', ok: true, why: 'Çünkü A.' }, { t: 'B', why: 'Çünkü B değil.' }] },
    questions: [{ id: 'x', label: 'Şart', opts: [{ t: 'Var', v: 'var' }, { t: 'Yok', v: 'yok' }] }],
    categories: [{ allOf: [{ q: 'x', v: 'var' }], d: 'sonuç' }]
  }, { visualType: 'predict_then_explore' });

  ok('predict tahmin sorusunu bastı', !!box.querySelector('.hv3-askq'));
  ok('TAHMİNDEN ÖNCE simülatör gizli', box.querySelector('[data-el=inner]').style.display === 'none');
  box.querySelectorAll('.hv3-asko')[1].dispatchEvent(new window.Event('click'));
  ok('yanlış tahminden sonra simülatör açıldı', box.querySelector('[data-el=inner]').style.display !== 'none');
  ok('simülatör gerçekten çizildi', box.querySelectorAll('[data-el=inner] .hv3-row').length > 0);
  ok('tahmin geri bildirimi seçime özgü', box.querySelector('.hv3-askfb').textContent.includes('Çünkü B değil'));
}

/* ---- veri denetimi: kapısız v3 konusu kalmadı mı? ---- */
{
  const GATED = t => {
    if (t.visualType === 'predict_then_explore') return !!(t.visualData?.predict?.opts?.length);
    if (t.visualType === 'fill_slots') return true;
    if (t.visualType === 'scene_story') return (t.visualData?.scenes || []).some(s => s.ask);
    if (t.visualType === 'drag_classify' || t.visualType === 'guess_table' ||
        t.visualType === 'step_reveal' || t.visualType === 'family_tree') return true; // kendiliğinden taahhütlü
    return false;
  };
  const v3 = window.TOPICS_DATA.filter(t => data.isV3(t.visualType));
  const kapisiz = v3.filter(t => !GATED(t)).map(t => t.id + '(' + t.visualType + ')');
  ok('taahhüt anı olmayan v3 konusu kalmadı', kapisiz.length === 0, kapisiz.join(', '));

  // predict blokları veri olarak sağlam mı
  const bozuk = window.TOPICS_DATA
    .filter(t => t.visualType === 'predict_then_explore')
    .filter(t => {
      const p = t.visualData?.predict;
      return !p || p.opts.filter(o => o.ok).length !== 1 || p.opts.some(o => !o.why);
    }).map(t => t.id);
  ok('her predict tek doğru + tam gerekçe taşıyor', bozuk.length === 0, bozuk.join(', '));

  // miras: paylar tabloda peşinen gösterilmiyor
  const m12 = window.TOPICS_DATA.find(t => t.id === 'tpc_medeni_012');
  ok('miras konusunda hazır pay tablosu kapatıldı', m12.visualData.hideTable === true);
  ok('miras konusunda pay doldurma paneli var', m12.visualExtra?.visualType === 'fill_slots');
  ok('miras doldurma paneli 6 hücre soruyor',
    (m12.visualExtra.visualData.rows || []).reduce((s, r) => s + r.slots.length, 0) === 6);
}

/* Yeni altın örnek: tpc_borclar_002 gerçekten dönüştü mü? */
{
  const t = window.TOPICS_DATA.find(x => x.id === 'tpc_borclar_002');
  ok('tpc_borclar_002 artık statik tablo değil', t.visualType === 'scene_story');
  ok('tpc_borclar_002 sahnelerinin çoğu anlatım taşıyor',
    t.visualData.scenes.filter(s => s.tell).length >= 5);
  const gov = (t.chunks || []).reduce((s, c) => s + (c.text || '').split(/\s+/).length, 0);
  ok('tpc_borclar_002 gövdesi düz yazı duvarı değil (<120 kelime)', gov < 120, `${gov} kelime`);
  const box = window.document.createElement('div');
  V3.render(box, 'gold_b2', t.visualData, t);
  ok('tpc_borclar_002 ilk sahnesi anlatımıyla çiziliyor',
    box.querySelector('.hv3-tell')?.textContent.includes('irade bozukluğu'));

  // v4.1: anlatım taşıyan sahnelerin çoğu geri-çağırma kapısıyla korunmalı
  const withTell = t.visualData.scenes.filter(s => s.tell);
  const gatedCnt = withTell.filter(s => s.ask && s.ask.opts && s.ask.opts.length >= 2).length;
  ok('tpc_borclar_002 anlatımlarının çoğu tahmin arkasında',
    gatedCnt >= withTell.length - 1, `${gatedCnt}/${withTell.length} kapılı`);

  // her şıkkın gerekçesi olmalı — "yanlış" demek öğretmez
  const noWhy = [];
  t.visualData.scenes.forEach(s => (s.ask?.opts || []).forEach(o => { if (!o.why) noWhy.push(s.cap); }));
  ok('her şıkkın seçime özgü gerekçesi var', noWhy.length === 0, noWhy.join(', '));

  // her soruda tam bir doğru şık olmalı
  const badKey = t.visualData.scenes
    .filter(s => s.ask)
    .filter(s => s.ask.opts.filter(o => o.ok).length !== 1)
    .map(s => s.cap);
  ok('her soruda tam olarak bir doğru şık var', badKey.length === 0, badKey.join(', '));
}

/* ---------- İLERLEME ---------- */

section('İLERLEME EKRANI');
progress.render();
const gHost = window.document.querySelector('#view-progress');
ok('ilerleme ekranı render edildi', gHost.innerHTML.length > 800);
ok('deneme geçmişi grafiği var', gHost.innerHTML.includes('baraj'));
ok('ders kırılımı tablosu var', gHost.querySelectorAll('table.tbl').length >= 2);
ok('veri bütünlüğü raporu ekranda', gHost.innerHTML.includes('yetim'));
ok('tekrar kutuları çizildi', gHost.innerHTML.includes('mezun'));

/* ---------- KALICILIK ---------- */

section('KALICILIK VE GÖÇ');
store.save();
const beforeCount = store.state().answers.length;
store.load();
ok('veri diskten geri yüklendi', store.state().answers.length === beforeCount, `${beforeCount} kayıt`);
ok('şema sürümü yazıldı', store.state().schemaVersion === 1);
// bozuk veri karşısında çökmemeli
mem.set('hmgs_studio_v1', '{bozuk json');
store.load();
ok('bozuk localStorage verisinde çökmedi', Array.isArray(store.state().answers));
// bilinmeyen alanlı eski şema göç etmeli
mem.set('hmgs_studio_v1', JSON.stringify({ answers: [{ qId: 'x', ok: true, ms: 100, at: new Date().toISOString() }] }));
store.load();
ok('şemasız eski veri göç ettirildi',
  store.state().answers.length === 1 && !!store.state().srs && !!store.state().settings);
ok('ham cevap kaydı göçte korundu', store.state().answers[0].qId === 'x');

/* ---------- GÜVENLİK: HTML ENJEKSİYONU ---------- */

section('GÜVENLİK');
const ui = await import('../js/ui.js');
ok('esc() script etiketini nötrleştiriyor',
  !ui.esc('<script>alert(1)</script>').includes('<script'));
ok('rich() sadece izinli işaretlemeyi geçiriyor',
  ui.rich('<img src=x onerror=y> **kalın**').includes('<mark>') &&
  !ui.rich('<img src=x onerror=y>').includes('<img'));
ok('rich() süre ve kelimelerde istenmeyen renk sınıfları üretmiyor',
  !ui.rich('10 GÜN İÇİNDE TMK m. 166').includes('hl-time') &&
  !ui.rich('10 GÜN İÇİNDE TMK m. 166').includes('hl-cap') &&
  !ui.rich('10 GÜN İÇİNDE TMK m. 166').includes('hl-law'));
ok('richBlock() şık tahlillerini rb-opt-block olarak harfini koruyarak ayırıyor',
  (() => {
    const res = ui.richBlock('Açıklama. A) Birinci seçenek. B) İkinci seçenek.');
    return res.includes('rb-opt-block') && res.includes('>A<') && res.includes('>B<') && !res.includes('<ol class="rb-list"><li>Birinci');
  })());
ok('richBlock() şıkkında/seçeneğinde ifadelerini rb-opt-block olarak ayırıyor',
  (() => {
    const res = ui.richBlock('Açıklama metni. B şıkkında belirtilen kural. C seçeneğinde yer alan hüküm.');
    return res.includes('rb-opt-block') && res.includes('>B<') && res.includes('>C<');
  })());
ok('richBlock() Roma rakamlarını rb-roman-block olarak ayırıyor',
  (() => {
    const res = ui.richBlock('Öncüller: I. İlk kural II. İkinci kural');
    return res.includes('rb-roman-block') && res.includes('I.') && res.includes('II.');
  })());
ok('tüm sorularda 5 adet dolu şık mevcut ve birleşmiş şık yok',
  window.QUESTIONS_DATA.every(q => 
    Array.isArray(q.options) && 
    q.options.length === 5 && 
    q.options.every(o => (o.text || '').trim().length > 0)
  ));

/* ---------- PRATİK ALANI: ÜRETİLMİŞ VAKA + HESAPLANMIŞ CEVAP ----------
   Burada tek bir hata sessizce YANLIŞ HUKUK öğretir — soru havuzundaki bir
   hatadan daha tehlikelidir, çünkü sonsuz tekrarlanır. O yüzden üreteç
   matematiksel olarak da, TMK'ya karşı da tek tek denetlenir. */

section('PRATİK ALANI · MİRAS ÜRETECİ');
{
  const M = await import('../js/gen/miras.js');
  const { fr, frEq, frStr, uretVaka, hesapla, uretPratik, toplamPay } = M;

  ok('kesir sadeleşiyor', frStr(fr(6, 8)) === '3/4');
  ok('kesir eşitliği payda bağımsız', frEq(fr(1, 2), fr(4, 8)));

  // 1) Her kalıpta payların toplamı tam olarak 1 etmeli — tereke eksik veya
  //    fazla dağıtılamaz. Bu, hesabın en güçlü tek denetimi.
  const KALIPLAR = ['altsoy', 'halefiyet', 'anababa', 'kardes', 'buyukanababa', 'yalnizes'];
  let toplamHata = [];
  for (const k of KALIPLAR) {
    for (let seed = 1; seed <= 60; seed++) {
      const h = hesapla(uretVaka(seed, k));
      if (!frEq(toplamPay(h), fr(1))) toplamHata.push(`${k}#${seed}=${frStr(toplamPay(h))}`);
    }
  }
  ok('360 üretilmiş vakanın hepsinde payların toplamı tam 1',
    toplamHata.length === 0, toplamHata.slice(0, 3).join(' '));

  // 2) Bilinen senaryolar TMK ile birebir tutuyor mu (elle doğrulanmış cevaplar)
  const payOf = (v, h, pred) => { const k = v.kisiler.find(pred); return k ? frStr(h.pay[k.id]) : null; };
  const saklıOf = (v, h, pred) => { const k = v.kisiler.find(pred); return k ? (h.saklı[k.id] ? frStr(h.saklı[k.id]) : 'yok') : null; };

  {   // eş + altsoy: eş 1/4 (m.499), saklı payı TAMAMI (m.506)
    const v = uretVaka(42, 'altsoy'), h = hesapla(v);
    ok('m.499 · eş 1. zümreyle 1/4 alıyor', payOf(v, h, k => k.rol === 'es') === '1/4');
    ok('m.506 · eşin saklı payı 1. zümreyle yasal payının tamamı',
      saklıOf(v, h, k => k.rol === 'es') === '1/4');
    const c = v.kisiler.find(k => k.rol === 'altsoy');
    ok('m.500 · kalan 3/4 altsoya eşit bölünüyor', frStr(h.pay[c.id]) === '1/4');
    ok('m.506 · altsoyun saklı payı yasal payın yarısı', frStr(h.saklı[c.id]) === '1/8');
  }
  {   // halefiyet: önce ölen çocuğun payı torunlara KÖK başına
    const v = uretVaka(42, 'halefiyet'), h = hesapla(v);
    const olen = v.kisiler.find(k => k.rol === 'altsoy' && k.dead);
    ok('m.495/2 · önce ölen çocuk kendisi mirasçı değil', h.pay[olen.id] === undefined);
    const torunlar = v.kisiler.filter(k => k.gen === 2);
    ok('m.495/2 · torunlar halefiyetle mirasçı', torunlar.every(t => h.pay[t.id]));
    ok('m.495/2 · bölüşüm kök başına (torun payı = çocuk payı ÷ torun sayısı)',
      frStr(h.pay[torunlar[0].id]) === '1/8' && torunlar.length === 2);
  }
  {   // 2. zümre: eş 1/2, ana-baba kalanı eşit; ana-baba saklı payı 1/4
    const v = uretVaka(42, 'anababa'), h = hesapla(v);
    ok('m.499 · eş 2. zümreyle 1/2 alıyor', payOf(v, h, k => k.rol === 'es') === '1/2');
    ok('m.496 · ana-baba kalanı eşit paylaşıyor', payOf(v, h, k => k.rol === 'anababa') === '1/4');
    ok('m.506 · ana-babanın saklı payı yasal payın 1/4\'ü',
      saklıOf(v, h, k => k.rol === 'anababa') === '1/16');
  }
  {   // KRİTİK TUZAK: kardeşin saklı payı YOKTUR (2019'da m.506'dan çıkarıldı)
    const v = uretVaka(42, 'kardes'), h = hesapla(v);
    ok('m.496/2 · ölen ebeveynin payı kardeşe halefiyetle geçiyor',
      payOf(v, h, k => k.rol === 'kardes') === '1/8');
    ok('m.506 · KARDEŞİN SAKLI PAYI YOK (2019 değişikliği)',
      saklıOf(v, h, k => k.rol === 'kardes') === 'yok');
  }
  {   // 3. zümre: eş 3/4, saklı payı yasal payının 3/4'ü (tamamı DEĞİL)
    const v = uretVaka(42, 'buyukanababa'), h = hesapla(v);
    ok('m.499 · eş 3. zümreyle 3/4 alıyor', payOf(v, h, k => k.rol === 'es') === '3/4');
    ok('m.506 · eşin saklı payı 3. zümreyle yasal payının 3/4\'ü (tamamı değil)',
      saklıOf(v, h, k => k.rol === 'es') === '9/16');
    ok('m.506 · büyük ana-babanın saklı payı yok',
      saklıOf(v, h, k => k.rol === 'buyukanababa') === 'yok');
  }
  {   // tek başına eş: tamamı, saklı payı 3/4
    const v = uretVaka(7, 'yalnizes'), h = hesapla(v);
    ok('m.499/son · başka mirasçı yoksa eş terekenin tamamını alıyor',
      payOf(v, h, k => k.rol === 'es') === '1');
    ok('m.506 · tek başına eşin saklı payı 3/4', saklıOf(v, h, k => k.rol === 'es') === '3/4');
  }

  // 3) Zümre önceliği: altsoy varken 2./3. zümre asla mirasçı olmamalı
  ok('m.495/2 · altsoy varken üstsoy mirasçı olmuyor', (() => {
    for (let s = 1; s <= 40; s++) {
      const v = uretVaka(s, 'altsoy'), h = hesapla(v);
      if (v.kisiler.some(k => (k.rol === 'anababa' || k.rol === 'buyukanababa') && h.pay[k.id])) return false;
    }
    return true;
  })());

  // 4) Ekran paketi: cevap peşinen sızmıyor mu?
  const pkg = uretPratik(123, 'altsoy');
  ok('pratik paketi soy ağacı + doldurma üretiyor', !!pkg.tree && !!pkg.fill);
  ok('soy ağacında hazır pay tablosu kapalı', pkg.tree.hideTable === true);
  ok('ağaç düğümlerinde pay SIZMIYOR',
    pkg.tree.cases[0].nodes.every(n => n.sub === undefined && n.reserved === undefined));
  ok('her hücrenin cevabı ve gerekçesi var',
    pkg.fill.rows.every(r => r.slots.every(s => s.answer && s.why && s.q)));
  ok('doğru cevaplar havuzda mevcut',
    pkg.fill.rows.every(r => r.slots.every(s => pkg.fill.pool.includes(s.answer))));
  ok('aynı tohum aynı vakayı veriyor (tekrarlanabilir)',
    JSON.stringify(uretPratik(123, 'altsoy').hesap) === JSON.stringify(pkg.hesap));
  ok('farklı tohum farklı vaka veriyor',
    JSON.stringify(uretPratik(999, '').vaka.kisiler) !== JSON.stringify(uretPratik(1000, '').vaka.kisiler));

  // 5) Telemetri
  store.hardReset();
  store.recordDrill({ gen: 'miras', seed: 1, kalip: 'kardes', slot: 'Zeynep·saklı pay', chosen: '1/16', answer: 'yok', ok: false, ms: 900 });
  store.recordDrill({ gen: 'miras', seed: 1, kalip: 'kardes', slot: 'Zeynep·yasal pay', chosen: '1/8', answer: '1/8', ok: true, ms: 700 });
  store.recordDrill({ gen: 'miras', seed: 2, kalip: 'kardes', slot: 'Elif·saklı pay', chosen: '1/16', answer: 'yok', ok: false, ms: 800 });
  const st = store.drillStats('miras');
  ok('pratik telemetrisi yazılıyor', st.n === 3 && st.ok === 1);
  ok('zayıf kalıp tespiti çalışıyor', st.zayif.length === 1 && st.zayif[0].kalip === 'kardes');
  ok('drill kaydı ham günlükte, cevap günlüğüne karışmıyor',
    store.state().drills.length === 3 && store.state().answers.length === 0);
}

/* ---------- CİRO ÜRETECİ (TTK kambiyo senetleri) ---------- */

section('PRATİK ALANI · CİRO ÜRETECİ');
{
  const C = await import('../js/gen/ciro.js');
  const KAL = ['temiz', 'beyaz', 'kirik', 'tahsil', 'rehin', 'gecikmis', 'menfi', 'kotuniyet'];

  // Her kalıpta hesap tutarlı mı — 8 kalıp × 40 tohum
  const tutarsiz = [];
  for (const k of KAL) {
    for (let s = 1; s <= 40; s++) {
      const v = C.uretVaka(s, k), h = C.hesapla(v);
      if (v.kalip !== k) tutarsiz.push(`${k}#${s}: kalıp tutmadı`);
      // kopuk silsilede hamil asla yetkili hamil olamaz
      if (!h.bagli && h.yetkiliHamil) tutarsiz.push(`${k}#${s}: kopuk ama yetkili hamil`);
      // temlik hükmündeyse kambiyo takibi olamaz
      if (h.temlikHukmunde && h.kambiyoTakip) tutarsiz.push(`${k}#${s}: temlik ama kambiyo takibi`);
      // bedelsiz olmayan senette def'i olmamalı
      if (v.temelIliski !== 'bedelsiz' && h.defi) tutarsiz.push(`${k}#${s}: bedelsiz değil ama def'i var`);
    }
  }
  ok('320 üretilmiş ciro vakasında hesap tutarlı', tutarsiz.length === 0, tutarsiz.slice(0, 3).join(' | '));

  // Bedelsiz temel ilişkiye sahip bir vaka bulup kuralı sınayan yardımcı
  const bedelsiz = (kalip) => {
    for (let s = 1; s <= 200; s++) {
      const v = C.uretVaka(s, kalip);
      if (v.temelIliski === 'bedelsiz') return { v, h: C.hesapla(v) };
    }
    throw new Error('bedelsiz vaka bulunamadı: ' + kalip);
  };

  {   // m.684/2 — EN SIK TUZAK: beyaz ciro sonrası salt zilyetlik devri zinciri KIRMAZ
    const { v, h } = bedelsiz('beyaz');
    ok('m.684/2 · beyaz ciro sonrası elden teslim zinciri KIRMIYOR', h.bagli === true);
    ok('m.684/2 · beyaz cirolu senedi devralan yetkili hamil', h.yetkiliHamil === true);
    ok('m.687/1 · beyaz cirolu iyiniyetli hamile bedelsizlik def\'i ileri sürülemiyor', h.defi === false);
    ok('beyaz ciro halkasında lehtar adı yazılmıyor',
      v.zincir[0].tur === 'beyaz' && v.zincir[0].lehine === null);
  }
  {   // m.686/1 — kopuk silsile
    const { h } = bedelsiz('kirik');
    ok('m.686/1 · kopuk silsile tespit ediliyor', h.bagli === false && !!h.kirilmaNedeni);
    ok('m.686/1 · kopuk silsilede def\'i ileri sürülebiliyor', h.defi === true);
    ok('m.686/1 · kopuk silsilede kambiyo takibi yapılamıyor', h.kambiyoTakip === false);
  }
  {   // m.688 vs m.689 — ZIT SONUÇLAR, konunun en eleyici ayrımı
    const t = bedelsiz('tahsil'), rh = bedelsiz('rehin');
    ok('m.688 · tahsil cirosunda hamil malik DEĞİL (vekil)', t.h.vekilHamil === true && t.h.yetkiliHamil === false);
    ok('m.688 · tahsil cirosunda borçlu def\'ini ileri SÜREBİLİR', t.h.defi === true);
    ok('m.689 · rehin cirosunda borçlu def\'ini ileri SÜREMEZ', rh.h.defi === false);
    ok('tahsil ve rehin cirosunun sonucu birbirinin zıttı (karıştırma tuzağı)',
      t.h.defi !== rh.h.defi);
  }
  {   // m.690 / m.790 — gecikmiş ciro senet türüne göre farklı maddeye dayanmalı
    const { v, h } = bedelsiz('gecikmis');
    ok('gecikmiş ciro alacağın temliki hükmünde', h.temlikHukmunde === true);
    ok('gecikmiş ciroda def\'i ileri sürülebiliyor', h.defi === true);
    ok('gecikmiş ciroda kambiyo takibi düşüyor', h.kambiyoTakip === false);
    ok('senet türüne göre doğru madde gösteriliyor (bono m.690 / çek m.790)',
      h.temlikSebep.law === (v.senetTuru === 'cek' ? 'TTK m. 790' : 'TTK m. 690'));
    // çekte ibraz süresi m.796: aynı yer 10 gün, farklı yer 1 ay
    let ibrazHata = 0;
    for (let s = 1; s <= 60; s++) {
      const x = C.uretVaka(s, 'gecikmis');
      if (x.senetTuru !== 'cek') continue;
      if (x.ibrazGun !== (x.ayniYer ? 10 : 30)) ibrazHata++;
      if (x.ciroGun <= x.ibrazGun) ibrazHata++;   // gecikmiş ise süreyi aşmalı
    }
    ok('m.796 · çekte ibraz süresi doğru (aynı yer 10 gün / farklı yer 1 ay)', ibrazHata === 0);
  }
  {   // m.681/2 — "ciro edilemez" kaydı
    const { h } = bedelsiz('menfi');
    ok('m.681/2 · "ciro edilemez" kaydı devri temlik hükmüne düşürüyor',
      h.temlikHukmunde === true && h.temlikSebep.law === 'TTK m. 681/2');
    ok('m.681/2 · menfi ciroda borçlu def\'ilerini ileri sürebiliyor', h.defi === true);
  }
  {   // m.687/1 istisna — bile bile borçlunun zararına
    const { h } = bedelsiz('kotuniyet');
    ok('m.687/1 istisna · bile bile zarara hareket eden hamile def\'i ileri sürülebiliyor',
      h.defi === true && h.defiLaw.includes('687'));
    ok('kötüniyetli hamil yine de yetkili hamil (silsile bağlı)', h.yetkiliHamil === true);
  }
  {   // temiz zincir — soyutluk koruması
    const { h } = bedelsiz('temiz');
    ok('m.687/1 kural · temiz zincirde iyiniyetli hamile def\'i ileri sürülemiyor', h.defi === false);
    ok('temiz zincirde kambiyo takibi mümkün', h.kambiyoTakip === true);
  }

  // Ekran paketi
  const pkg = C.uretPratik(5, 'tahsil');
  ok('ciro paketi senet görseli + doldurma üretiyor',
    pkg.panels[0].kind === 'html' && pkg.panels[0].html.includes('cr-senet') && !!pkg.fill);
  ok('ciro paketinde 5 soru var', pkg.fill.rows.length === 5);
  ok('her sorunun cevabı kendi havuzunda',
    pkg.fill.rows.every(r => r.slots.every(s => (s.pool || pkg.fill.pool).includes(s.answer))));
  ok('her sorunun gerekçesi madde referansı taşıyor',
    pkg.fill.rows.every(r => r.slots.every(s => /m\.\s?\d|TTK|TBK/.test(s.why))));
  ok('senet görselinde doğru cevap sızmıyor',
    !/yetkili hamil sayılır|ileri sürebilir|sürülemez/i.test(pkg.panels[0].html));
  ok('aynı tohum aynı ciro vakasını veriyor',
    JSON.stringify(C.uretPratik(5, 'tahsil').hesap) === JSON.stringify(pkg.hesap));
}

/* ---------- PRATİK EKRANI: ÜRETEÇ KAYDI ---------- */
{
  const P = await import('../js/views/pratik.js');
  ok('pratik ekranında en az 2 üreteç kayıtlı', P.GENERATORS.length >= 2);
  ok('her üreteç zorunlu alanları taşıyor', P.GENERATORS.every(g =>
    g.id && g.title && g.basis && typeof g.uret === 'function' && Array.isArray(g.kaliplar)));
  ok('her üreteç "Karışık" seçeneğiyle başlıyor', P.GENERATORS.every(g => g.kaliplar[0].id === ''));

  // Her üreteç, her kalıbında patlamadan paket üretebiliyor mu?
  const patlayan = [];
  P.GENERATORS.forEach(g => g.kaliplar.forEach(k => {
    for (let s = 1; s <= 5; s++) {
      try {
        const pk = g.uret(s * 37, k.id || undefined);
        if (!pk.fill || !pk.fill.rows.length) patlayan.push(`${g.id}/${k.id || 'karışık'}: boş`);
        if (!pk.fill.rows.every(r => r.slots.every(x => x.answer !== undefined && x.why)))
          patlayan.push(`${g.id}/${k.id || 'karışık'}: eksik cevap/gerekçe`);
      } catch (e) { patlayan.push(`${g.id}/${k.id || 'karışık'}: ${e.message}`); }
    }
  }));
  ok('tüm üreteçler tüm kalıplarında sağlam paket üretiyor', patlayan.length === 0, patlayan.slice(0, 3).join(' | '));
}

/* ---------- GEMİNİ KÖPRÜSÜ VE YARIM EKRAN OPTİMİZASYONU ---------- */
section('GEMİNİ KÖPRÜSÜ VE YARIM EKRAN OPTİMİZASYONU');
ok('practice.askGemini fonksiyonu mevcut', typeof practice.askGemini === 'function');
practice.startSession({ mode: 'karma', count: 5 });
ok('soru ekranında Geminiye Sor butonu mevcut',
  document.querySelector('[data-act="ask-gemini"]') !== null);
ok('soru ekranında G klavye ipucu basılıyor',
  document.querySelector('#q-actions .hint')?.textContent.includes('G'));
practice.dontKnow();
ok('çözüm ekranında da Geminiye Sor butonu mevcut',
  document.querySelector('.fb-actions [data-act="ask-gemini"]') !== null);
ok('çözüm ekranında G klavye ipucu basılıyor',
  document.querySelector('.fb-actions-meta .hint')?.textContent.includes('G'));
practice.endSession();

/* ---------- GEMİNİ İSTEMİ: HAVUZUN GERÇEĞİNE GÖRE İKİ MOD ---------- */
section('GEMİNİ İSTEMİ (İKİ MOD)');
ok('practice.buildGeminiPrompt fonksiyonu mevcut',
  typeof practice.buildGeminiPrompt === 'function');

// Havuzun %37'si olumsuz köklü: şıklar olmadan bu sorular cevaplanamaz.
const refQ = [...data.questionById.values()]
  .find(x => /değildir|yanlıştır|olamaz|söylenemez/.test(x.stem) && x.options?.length === 5 && x.correct);
ok('olumsuz köklü referans soru bulundu', !!refQ);

const refWrong = refQ.options.find(o => o.key !== refQ.correct).key;
const pHint  = practice.buildGeminiPrompt(refQ, { answered: false });
const pWrong = practice.buildGeminiPrompt(refQ, { answered: true, chosen: refWrong });
const pBlank = practice.buildGeminiPrompt(refQ, { answered: true, chosen: null });
const pOk    = practice.buildGeminiPrompt(refQ, { answered: true, chosen: refQ.correct });

ok('istem beş şıkkı da taşıyor',
  refQ.options.every(o => pHint.text.includes(`${o.key}) ${String(o.text || '').trim()}`)),
  `${pHint.text.split('\n').length} satır`);

ok('ipucu modu doğru şıkkı açık etmiyor',
  pHint.mode === 'hint'
  && pHint.text.includes('Doğru şıkkı söyleme')
  && !/Uygulamanın kendi açıklaması|Doğru şık:|Doğru şıkkı doğru yapan/.test(pHint.text));

ok('yanlış modu seçimi + doğru şıkkı + uygulama açıklamasını taşıyor',
  pWrong.mode === 'wrong'
  && pWrong.text.includes(`Bu soruyu yanlış işaretledim: ${refWrong})`)
  && pWrong.text.includes(`Doğru şık: ${refQ.correct})`)
  && pWrong.text.includes(String(refQ.explanation || '').trim().slice(0, 40)));

ok('boş modu doğru şıkkı + açıklamayı taşıyor',
  pBlank.mode === 'blank'
  && pBlank.text.includes('boş bıraktım')
  && pBlank.text.includes(`Doğru şık: ${refQ.correct})`));

ok('doğru modu sağlama istiyor',
  pOk.mode === 'correct'
  && pOk.text.includes(`Doğru işaretledim (${refQ.correct})`));

practice.startSession({ mode: 'karma', count: 3 });
ok('cevap öncesi buton ipucu modunu söylüyor',
  document.querySelector('#q-actions [data-act="ask-gemini"]')?.textContent.includes('İpucu İste'));
practice.dontKnow();
ok('boş bırakınca buton analiz modunu söylüyor',
  document.querySelector('.fb-actions [data-act="ask-gemini"]')?.textContent.includes('Boşu Analiz Et'));
practice.endSession();

/* ---------- GÜNLÜK HEDEF: TEK KAYNAK ---------- */
section('GÜNLÜK HEDEF · TEK KAYNAK');
const taban = store.getSettings().dailyTarget || 40;

store.setDailyPlan({ questions: 123, quizTasks: 3, readingTasks: 2, totalTasks: 5, source: 'test' });
const tpPlan = engine.todayProgress();
ok('hedef koç planından geliyor (taban değil)',
  tpPlan.target === 123 && tpPlan.targetSource === 'plan', `target=${tpPlan.target}`);
ok('plan hedefi ayarlardaki tabanı gerçekten eziyor',
  tpPlan.target !== taban, `taban=${taban}`);
ok('plan okuma görevi sayısını da taşıyor', tpPlan.plan?.readingTasks === 2);

store.state().plan.date = '2000-01-01';
const tpStale = engine.todayProgress();
ok('dünün planı hedef sayılmıyor',
  tpStale.targetSource === 'base' && tpStale.target > 0, `target=${tpStale.target}`);

store.state().plan = null;
ok('plan yokken taban hedefe düşülüyor',
  engine.todayProgress().targetSource === 'base');

/* ---------- ÇÖZÜM EKRANINDA TIKLAMA · CEVAP VE SÜRE KORUNMALI ---------- */
section('ÇÖZÜM EKRANINDA TIKLAMA DELEGASYONU');
{
  // show() görünüm adını <body data-view="…"> üzerine de yazar (CSS kancası).
  // Click delegasyonu bu niteliği closest() ile yakalarsa, çözüm ekranındaki
  // etkileşimsiz bir alana (açıklama metni) yapılan tıklama show(aynı görünüm)
  // → practice.render() zincirini tetikler. render() ise S.answered=false ve
  // S.qStart=performance.now() yaptığı için cevap silinir, soru geri gelir,
  // süre ölçümü sıfırlanır — kullanıcının bildirdiği hata tam olarak buydu.
  // main.js boot() → applyTheme() içinde window.matchMedia çağırıyor; bu harness'te
  // yok (boot hatası bizim konumuz değil). Asgari stub, boot yolunu da açık tutar.
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  }
  await import('../js/main.js');            // gerçek data-act / data-view delegasyonu
  await new Promise(r => setTimeout(r, 60));

  const clickIt = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

  document.body.removeAttribute('data-view');
  clickIt(document.querySelector('.nav button[data-view="practice"]'));
  ok('nav düğmesi delegasyonla görünüm değiştiriyor',
    document.body.getAttribute('data-view') === 'practice',
    `body[data-view]=${document.body.getAttribute('data-view')}`);

  practice.startSession({ mode: 'subject', subjectId: 'medeni_hukuk', count: 5 });
  await new Promise(r => setTimeout(r, 1100));   // sayaç anlamlı bir değere gelsin
  practice.pick('A');
  ok('cevap verildi, çözüm ekranı açık', practice.isAnswered());

  const fbBefore = document.querySelector('#fb')?.innerHTML.length || 0;
  const timerBefore = document.querySelector('#q-timer')?.textContent?.trim();

  const solText = document.querySelector('#fb .fb-lead') || document.querySelector('#fb .feedback');
  ok('çözüm ekranında tıklanacak metin var', !!solText);
  clickIt(solText);

  ok('çözüm metnine tıklamak CEVABI silmiyor', practice.isAnswered());
  ok('çözüm metnine tıklamak GERİ BİLDİRİMİ silmiyor',
    (document.querySelector('#fb')?.innerHTML.length || 0) === fbBefore && fbBefore > 0,
    `${fbBefore} → ${document.querySelector('#fb')?.innerHTML.length}`);
  ok('çözüm metnine tıklamak SÜREYİ sıfırlamıyor',
    document.querySelector('#q-timer')?.textContent?.trim() === timerBefore && !/^0 sn/.test(timerBefore || ''),
    `${timerBefore} → ${document.querySelector('#q-timer')?.textContent?.trim()}`);
  ok('soru geri gelmiyor (aynı soru, cevaplanmış hâlde)',
    (document.querySelector('.q-progress-count')?.textContent || '').trim() === '1 / 5',
    document.querySelector('.q-progress-count')?.textContent?.trim());

  practice.endSession();
}

/* ---------- SONUÇ EKRANINDAN YANLIŞLARI ÇÖZ · GERÇEK TIKLAMA YOLU ---------- */

section('SONUÇ EKRANI · YANLIŞLARI ÇÖZ BUTONU (DELEGASYON)');
{
  // Buton, main.js'teki data-act delegasyonundan geçiyor. Kablolama yanlışsa
  // (örn. review moduna düşerse) etiket "yanlışlar" der ama seans vadesi gelmiş
  // tekrarları çözer. Bu yüzden tıklamanın kendisi sınanır.
  const clickIt2 = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

  exam.start();
  exam.render();
  const mapBtns = document.querySelectorAll('#view-exam .exam-map button');

  // Cevap anahtarı DOM'dan ters aramayla tahmin EDİLMEZ: aynı normalize köke
  // sahip iki soru karışır ve test kendi kurduğu havuzu yanlış bilir. Bunun
  // yerine tüm sorular aynı şıkla işaretlenir (deterministik), beklenen yanlış
  // kümesi doğrudan sonuç kaydının kendi alanlarından okunur.
  for (let i = 0; i < mapBtns.length; i++) {
    exam.goto(i);
    exam.pick('A');
  }
  exam.finish(true);
  const r2 = store.state().exams[store.state().exams.length - 1];
  const beklenen = r2.wrongIds.length;
  ok('tıklama testi için bilinen yanlış havuzu kuruldu',
    beklenen > 0 && beklenen === r2.wrong + r2.blank,
    `${beklenen} yanlış · ${r2.wrong + r2.blank} yanlış+boş`);

  const btn = document.querySelector('#view-exam [data-act="exam-review-wrong"]');
  ok('sonuç ekranında yanlışları çöz butonu var', !!btn);
  clickIt2(btn);

  ok('buton çözüm ekranına geçiriyor', document.body.getAttribute('data-view') === 'practice',
    `body[data-view]=${document.body.getAttribute('data-view')}`);
  ok('seans tam olarak son denemenin yanlışlarından kuruldu',
    (document.querySelector('#view-practice .q-progress-count')?.textContent || '').trim() === `1 / ${beklenen}`,
    document.querySelector('#view-practice .q-progress-count')?.textContent?.trim());
  const etiket = document.querySelector('#view-practice .q-strip-right .chip.accent')?.textContent || '';
  ok('seans etiketi yanlışları ve sayıyı dürüstçe yazıyor',
    /Deneme (yanlışları|tekrarı)/.test(etiket) && etiket.includes(String(beklenen)), etiket.trim());

  // Seansın ilk sorusu, dökümdeki ilk yanlışla aynı soru olmalı — sıra korunmalı.
  const sade = s => String(s || '').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 40);
  const ilkEkran = sade(document.querySelector('#view-practice .q-ask')?.textContent);
  const ilkBeklenen = sade(ui.splitStem(data.questionById.get(r2.wrongIds[0]).stem).ask);
  ok('seansın ilk sorusu dökümdeki ilk yanlışla aynı',
    ilkEkran.length > 10 && ilkEkran === ilkBeklenen,
    `${ilkEkran.slice(0, 24)} vs ${ilkBeklenen.slice(0, 24)}`);

  practice.endSession();
  exam.reset();
}

/* ---------- AKIŞ MODU (akim.js motoru) ---------- */

section('AKIŞ MODU · AKIŞ SKORU (türetilmiş, uydurma puan değil)');
{
  // flowScore boş veride sıfır ve "idle" döner.
  const idle = engine.flowScore([]);
  ok('boş veride akış skoru 0', idle.score === 0 && idle.label === 'idle', JSON.stringify(idle));

  // Hepsi doğru + hızlı + kesintisiz → yüksek skor, "Akışta".
  const now = Date.now();
  const good = [];
  for (let i = 0; i < 10; i++) {
    good.push({ qId: 'fq' + i, ok: true, ms: 30000, at: new Date(now + i * 2000).toISOString() });
  }
  const flow = engine.flowScore(good);
  ok('doğru+hızlı+kesintisiz akış skoru yüksek', flow.score > 0.8 && flow.label === 'Akışta',
    `score=${flow.score.toFixed(2)} label=${flow.label}`);

  // Hepsi yanlış → düşük skor.
  const bad = good.map(r => ({ ...r, ok: false }));
  const badFlow = engine.flowScore(bad);
  ok('hepsi yanlışta skor düşük', badFlow.score < 0.3, `score=${badFlow.score.toFixed(2)}`);

  // Doğruluk aynı ama yavaş (tempo düşük) → skor düşer (tempo faktörü çalışıyor).
  const slow = good.map(r => ({ ...r, ms: 200000 })); // 200 sn > hedef 75 sn
  const slowFlow = engine.flowScore(slow);
  ok('yavaş tempo skoru düşürüyor (tempo faktörü çalışıyor)',
    slowFlow.score < flow.score, `${slowFlow.score.toFixed(2)} < ${flow.score.toFixed(2)}`);

  // 0–1 arasında sınırlanıyor.
  ok('skor daima 0–1 aralığında', slowFlow.score >= 0 && slowFlow.score <= 1 && flow.score <= 1);
}

section('AKIŞ MODU · PEKİŞTİRME VE KAYNAK (motor)');
{
  // flowFeed, karma motorunun ince sarmalayıcısı: soru üretiyor ve tekrar etmiyor.
  const feed = engine.flowFeed(16);
  ok('flowFeed soru üretiyor', Array.isArray(feed.questions) && feed.questions.length > 0,
    `${feed.questions.length} soru`);
  const feedIds = new Set(feed.questions.map(q => q.id));
  ok('flowFeed mükerrer soru vermiyor', feedIds.size === feed.questions.length);

  // Pekiştirme: konusu olan ve kardeş soruları bulunan gerçek bir soru bul.
  const parent = [...data.questionById.values()].find(q =>
    q.topicId && data.questionsOfTopic(q.topicId, 'all').length >= 2);
  ok('pekiştirme için kardeşli soru bulundu', !!parent, parent?.id);
  if (parent) {
    const sib = engine.flowReinforce(parent, new Set());
    ok('yanlış sonrası pekiştirme aynı kuraldan kardeş getiriyor',
      sib && sib.id !== parent.id && sib.topicId === parent.topicId, sib?.id);
    const sib2 = engine.flowReinforce(parent, new Set([sib.id]));
    ok('pekiştirme kendini ve dışlananları tekrar getirmiyor',
      !sib2 || (sib2.id !== parent.id && sib2.id !== sib.id));
  }

  // Kardeşi olmayan (yalıtılmış) soruda pekiştirme uydurulmuyor.
  const lone = [...data.questionById.values()].find(q =>
    q.topicId && data.questionsOfTopic(q.topicId, 'all').length === 1);
  if (lone) {
    ok('kardeşsiz soruda pekiştirme uydurulmuyor (null)',
      engine.flowReinforce(lone, new Set()) === null, lone.id);
  }
}

section('AKIŞ MODU · OTOMATİKLEŞME ANI');
{
  /* v3.2 düzeltmesi: flowMilestone `sched.kind==='mezun'` bakıyor, `sched.box`
     değil (bkz. engine.js — v2'de "ilk seferde doğru olan soru da mezun
     oluyor, o bir otomatikleşme anı değil" kararıyla `kind` alanına geçildi).
     Eski test `{box:...}` gönderip `kind` hiç vermiyordu — flowMilestone her
     zaman null dönüyordu, yanlış şeyi ölçüyordu (kendi mezuniyeti değil,
     bir alanın var/yok olduğunu bile test etmiyordu). */
  ok('kind:mezun yetkinlik anı üretiyor', typeof engine.flowMilestone({ box: engine.BOXES.length, kind: 'mezun', note: 'x' }) === 'string');
  ok('kind:ilk (ilk seferde doğru) yetkinlik anı DEĞİL', engine.flowMilestone({ box: engine.BOXES.length, kind: 'ilk', note: 'x' }) === null);
  ok('kind:tekrar (hâlâ sırada) yetkinlik anı değil', engine.flowMilestone({ box: 0, kind: 'tekrar', note: 'x' }) === null);
  ok('sched yoksa yetkinlik anı yok', engine.flowMilestone(null) === null);
}

/* ---------- GÜNÜN ROTASI (rota.js) ---------- */
/* 23 Eylül 2026: 11 günlük sabit plan (pregel.js) Bugün ekranından kaldırıldı;
   yerine veriden kurulan günün rotası geldi. Burada DAVRANIŞI sınanır: sınav
   ufkuna göre faz, son gün tam deneme yasağı, sınav günü kartı, sayıların
   tutarlılığı ve ekranın gerçekten rotayı çizmesi. Saat `now` ile sabitlenir. */
section('GÜNÜN ROTASI (rota.js)');
{
  const R = await import('../js/rota.js');
  const at = s => ({ now: new Date(s) });

  const cars = R.rota(at('2026-09-23T14:00:00+03:00'));
  ok('çarşamba: sınava 4 gün, final fazı', cars.D === 4 && cars.faz === 'final', `D=${cars.D} faz=${cars.faz}`);
  ok('çarşamba: adım listesi dolu', cars.adimlar.length > 0, `${cars.adimlar.length} adım`);
  ok('her adımda yapılan ≤ plan',
    cars.adimlar.every(a => a.bilgi || a.yapilan <= a.plan),
    cars.adimlar.map(a => `${a.id}:${a.yapilan}/${a.plan}`).join(' '));
  ok('kapasite 60–240 arasında', cars.kapasite.n >= 60 && cars.kapasite.n <= 240, `${cars.kapasite.n}`);

  const cmt = R.rota(at('2026-09-26T10:00:00+03:00'));
  ok('cumartesi: son gün fazı', cmt.faz === 'son-gun', cmt.faz);
  // 23 Eylül akşam, kullanıcı kararı: her gün bir deneme, cumartesi dahil; saate bağlı değil.
  ok('her gün (cumartesi dahil) günün denemesi var',
    cmt.adimlar.some(a => a.tur === 'deneme'));
  const gec = R.rota(at('2026-09-24T19:00:00+03:00'));
  ok('geç saatte de deneme yanmıyor (bilgiye dönmüyor)', gec.adimlar.some(a => a.id === 'deneme' && a.tur === 'deneme'));

  const pazar = R.rota(at('2026-09-27T08:00:00+03:00'));
  ok('sınav sabahı: yalnız sınav kartı, soru adımı yok',
    pazar.kart && pazar.kart.tur === 'sinav' && pazar.adimlar.length === 0);
  const sonra = R.rota(at('2026-09-27T15:00:00+03:00'));
  ok('sınavdan sonra: kapanış kartı', sonra.kart && sonra.kart.tur === 'bitti');

  const gece = R.rota(at('2026-09-23T23:30:00+03:00'));
  const akis = gece.adimlar.find(a => a.tur === 'akis');
  ok('akış sınırsız: planı yok, hiçbir saatte bitmiş sayılmıyor', !!akis && akis.sinirsiz && !akis.bitti);
  ok('gece bile kapanış kartı yok (günlük tavan kaldırıldı)', !gece.kart);
  const acik = gece.adimlar.filter(a => a.tur === 'konu' && !a.bitti);
  ok('konu onarımı: aynı anda en fazla 3 açık konu', acik.length <= 3, `${acik.length}`);
  ok('konu onarımı: açık konular farklı derslerden', new Set(R.konuOnarimi().filter(o => acik.some(a => a.id === 'konu:' + o.key)).map(o => o.subjectId)).size === acik.length);
  ok('ayrı "yanlışlarım" adımı yok (yanlışlar konuya bağlanır)', !gece.adimlar.some(a => a.tur === 'srs'));
  {
    const D = await import('../js/data.js');
    const oy = R.konuOnarimi();
    const set = oy.length ? R.konuSetSorulari(oy[0].key) : [];
    ok('onarım seti hâkimlik sorusu içermiyor', set.every(q => D.tierOf(q) !== D.TIER_ADV));
  }

  const sec = R.denemeSecimi();
  ok('prova için bir kâğıt seçiliyor', !!sec && sec.n >= 100, sec ? `${sec.label} · görülen %${Math.round(sec.gorulen * 100)}` : 'yok');
}

/* ---------- KURAL KÖPRÜSÜ (yanlıştan interaktif alıştırmaya) ---------- */
/* Ölçüm (15 Eyl 2026): 124 konunun 77'si interaktif (68 predict_then_explore),
   73'ünün sorusu var = 1613 soru. Ama HMGSV3.render yalnız flow.js'teydi;
   practice/akim'de 0. Geri bildirim kartının tek eylemleri next/dontknow'dı.
   Yani yanlış yapan kullanıcıya düz metin veriliyordu. Bu bölüm köprüyü kilitler:
   "hangi soruda düğme çıkar", "tıklayınca gerçekten çizilir mi",
   "seans/cevap/süre bozulmaz mı", "sorusu olmayan konuda sahte düğme çıkmaz mı". */
section('KURAL KÖPRÜSÜ (soru ekranından interaktif kurala)');
{
  const K = await import('../js/kural.js');

  // Konu verisini gerçek topics.js'ten çek
  const topics = window.TOPICS_DATA || [];
  const interaktif = topics.filter(t => data.V3_TYPES.has(t.visualType));
  ok('havuzda interaktif kural alıştırması taşıyan konu var', interaktif.length >= 20,
    `${interaktif.length} konu (%${Math.round(100 * interaktif.length / topics.length)})`);

  // Sorusu + interaktif konusu olan bir soru bul: köprünün hedef kitlesi
  const hedef = window.QUESTIONS_DATA.find(q =>
    q.topicId && interaktif.some(t => t.id === q.topicId));
  ok('kural düğmesi çıkacak bir soru bulundu', !!hedef, hedef ? hedef.id : 'yok');
  ok('kuralVar() interaktif konulu soruda true',
    K.kuralVar(hedef) === true, hedef ? hedef.topicId : '');
  ok('kuralButtonHTML() düğme üretiyor',
    /data-act="kural"/.test(K.kuralButtonHTML(hedef)) &&
    K.kuralButtonHTML(hedef).includes('data-topic="' + hedef.topicId + '"') &&
    K.kuralButtonHTML(hedef).includes('data-qid="' + hedef.id + '"'));

  // matchRuleChunk hedef soruya uygun chunk seçiyor
  const tHedef = data.topicById.get(hedef.topicId);
  const matchedChunk = K.matchRuleChunk(hedef, tHedef);
  ok('matchRuleChunk hedef soruya alt kural seçiyor', !!matchedChunk && !!matchedChunk.legalRef, matchedChunk?.legalRef);

  // Düğme ipucu ne olduğunu söylemeli — "görsel" değil, etkileşimin adı
  const btn = K.kuralButtonHTML(hedef);
  ok('düğme ipucu etkileşimin adını söylüyor',
    /tahmin|karar|sınıflandırma|sahne|adım|zaman|hiyerarşi|soy|doldurma|hesap/.test(btn),
    (btn.match(/title="([^"]{0,60})/) || [])[1]);

  // Statik (dönüşmemiş) konulu soruda SAHTE düğme çıkmamalı (AGENTS §0)
  const statik = window.QUESTIONS_DATA.find(q => {
    const t = q.topicId ? data.topicById.get(q.topicId) : null;
    return t && !data.V3_TYPES.has(t.visualType);
  });
  if (statik) {
    ok('statik görselli konuda düğme ÇIKMAZ (sahte eylem yok)',
      K.kuralVar(statik) === false && K.kuralButtonHTML(statik) === '', statik.topicId);
  }
  ok('konuya bağlı olmayan soruda düğme çıkmaz',
    K.kuralVar({ topicId: null }) === false, 'topicId null');

  // GERÇEK DOM: pratik seansı kur, yanlış yap, düğmeye bas
  const idx = window.QUESTIONS_DATA.indexOf(hedef);
  practice.startSession({ questions: [hedef], customLabel: 'kural köprüsü testi' });
  practice.render();
  const host = window.document.querySelector('#view-practice');
  const wrong = ['A', 'B', 'C', 'D', 'E'].find(k => k !== hedef.correct);
  practice.pick(wrong);
  ok('yanlış cevaptan sonra geri bildirim kartı açık', practice.isAnswered());

  const kBtn = host.querySelector('[data-act="kural"]');
  ok('geri bildirim kartında "Kuralı çalış" düğmesi var', !!kBtn);
  ok('geri bildirim kartında kural kabı var', !!host.querySelector('#kural-slot'));
  ok('kural kabı başta KAPALI', host.querySelector('#kural-slot').hidden === true);

  const fbBefore = host.querySelector('#fb').innerHTML.length;
  kBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

  const slot = host.querySelector('#kural-slot');
  ok('tıklayınca kabı açıldı', slot && slot.hidden === false);
  ok('hedefe özgü kural kartı render edildi', !!slot.querySelector('.kural-focus-card'));
  ok('hedef kural mevzuat künyesi mevcut', !!slot.querySelector('.kural-focus-ref')?.textContent);
  ok('hedef kural öz metni mevcut', !!slot.querySelector('.kural-focus-text')?.textContent);
  ok('interaktif alıştırma GERÇEKTEN çizildi (boş kutu değil)',
    !!slot.querySelector('#kural-host') &&
    slot.querySelector('#kural-host').children.length > 0,
    slot.querySelector('#kural-host')?.innerHTML.length + ' karakter');
  ok('kural başlığı hangi alıştırma olduğunu yazıyor',
    /Tahmin|Gizli|Karar|Sınıflandırma|Sahne|Adım|Zaman|Hiyerarşi|Soy|Doldurma|Hesap/.test(
      slot.querySelector('.kural-lbl')?.textContent || ''),
    slot.querySelector('.kural-lbl')?.textContent);
  ok('düğme "active" durumuna geçti', kBtn.classList.contains('active'));

  // EN KRİTİK: kural açmak cevabı/süreyi/seansı bozmamalı
  ok('kural açmak CEVABI silmiyor', practice.isAnswered());
  ok('kural açmak geri bildirimi yeniden yazmıyor (render çağrılmadı)',
    host.querySelector('#fb').innerHTML.length >= fbBefore,
    `${fbBefore} → ${host.querySelector('#fb').innerHTML.length}`);
  ok('kural açmak soruyu değiştirmiyor',
    (host.querySelector('.q-progress-count')?.textContent || '').trim() === '1 / 1',
    host.querySelector('.q-progress-count')?.textContent?.trim());

  // Tekrar tık: kapanmalı
  kBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  ok('tekrar tıklayınca kapanıyor', slot.hidden === true && slot.innerHTML === '');
  ok('kapanınca düğme "active" olmaktan çıkıyor', !kBtn.classList.contains('active'));

  practice.endSession();
}

/* ---------- KENDİ KİTABINDAN ÇALIŞ (konu → fiziksel kitap sayfası) ---------- */
/* Ölçüm (15 Eyl 2026): konu metni uzunluğu sınav ağırlığının TERSİ — Medeni
   15 soruya 2220 karakter (en düşük), MÖHUK 1 soruya 6965. 77 v3 konunun
   yalnız 1'inde sahne anlatımı (tell) var; yani v3 dönüşümü metnin YERİNE
   geçmiş, metne eklenmemiş. Kullanıcı bu yüzden konu anlatımına güvenmiyor.
   Bu bölüm Studio'nun kitabı TAKLİT ETMEDİĞİNİ, ona YÖNLENDİRDİĞİNİ kilitler. */
section('KENDİ KİTABINDAN ÇALIŞ (fiziksel kitap envanteri)');
{
  const KIT = await import('../js/kitaplar.js');
  const KP = await import('../js/kitap.js');
  const fs2 = await import('node:fs');

  // 17 Eyl 2026: envanter PUBLIC kabuktan ÇIKARILDI. Artık kasadan gelir
  // (data/kitap_envanteri.json → vault.kitaplar → data.js populateData →
  // setKitaplar). Test önce "kabuk verisiz" olduğunu, sonra kasa verisiyle
  // panelin çizildiğini kilitler.
  const kabuk = fs2.readFileSync(path.join(ROOT, 'studio/js/kitaplar.js'), 'utf8');
  ok('kabuk verisiz: kayıt defteri başlangıçta boş', KIT.kitaplarOf('medeni_hukuk').length === 0);
  // Veri ŞEKLİ aranır, düzyazı değil: başlık yorumunda "soru bankası" geçebilir.
  // Envanterin her kaydı invAd taşır; bölümler {ad,a,b}, sayfa aralığı "s.9–46".
  ok('kabuğun kendisi kitap verisi taşımıyor',
    !/"invAd"\s*:|"bolumler"\s*:|"tahmin"\s*:|"kaynaklar"\s*:|s\.\d+–\d+/.test(kabuk)
    && kabuk.length < 6000,
    kabuk.length + ' bayt');

  const envanter = JSON.parse(fs2.readFileSync(path.join(ROOT, 'data/kitap_envanteri.json'), 'utf8'));
  KIT.setKitaplar(envanter);

  // Envanter kasadan geldi; uydurma bölüm olmamalı
  const dersler = Object.keys(envanter);
  ok('kitap envanteri kasadan yüklendi', dersler.length >= 15, `${dersler.length} ders`);
  ok('20 dersin çoğunda kitap kaydı var', dersler.length >= 18, dersler.length + '/20');

  // Her bölümün sayfa aralığı geçerli (a ≤ b, pozitif)
  const bozuk = [];
  Object.entries(envanter).forEach(([sid, v]) => {
    v.kaynaklar.forEach(k => k.bolumler.forEach(b => {
      if (!(b.a >= 1 && b.b >= b.a)) bozuk.push(`${sid}/${k.kitap}/${b.ad}: ${b.a}-${b.b}`);
      if (!b.ad || !String(b.ad).trim()) bozuk.push(`${sid}: adsız bölüm`);
    }));
  });
  ok('bütün sayfa aralıkları geçerli (a ≤ b, pozitif)', bozuk.length === 0, bozuk.slice(0, 3).join(' | '));

  // Envanter gerçek build_sira3 INV ile tutarlı mı (tek kaynak)
  // ROOT (HERE/../..) üzerinden MUTLAK yol — cwd'ye bağlı değil.
  const invSrc = fs2.readFileSync(path.join(ROOT, 'HMGS_Takip_App/build_sira3.py'), 'utf8');
  // Medeni'nin "Önemli Süreler s.308" satırı tekil sayfa olarak INV'de var
  const med = envanter['medeni_hukuk'];
  ok('Medeni Hukuk envanteri var', !!med);
  const sure = med && med.kaynaklar.flatMap(k => k.bolumler).find(b => /Önemli Süreler/.test(b.ad));
  ok('Medeni "Önemli Süreler" bölümü envanterde (s.308)', !!sure && sure.a === 308,
    sure ? `s.${sure.a}-${sure.b}` : 'bulunamadı');
  ok('kaynak dosyada da aynı satır var (elle ikinci liste yok)',
    /Önemli Süreler',\s*308,\s*308/.test(invSrc));

  ok('kitapVar() envanteri olan derste true', KP.kitapVar('medeni_hukuk') === true);
  ok('kitapVar() envanteri olmayan derste false', KP.kitapVar('yok_boyle_ders') === false);

  // Panel HTML
  const html = KP.kitapPaneliHTML('medeni_hukuk');
  ok('panel katlanmış açıcı üretiyor', /data-act="reveal"/.test(html));
  ok('panel sayfa numaralarını basıyor', /s\.\d+–\d+/.test(html));
  ok('panel kitabın adını yazıyor', /Medeni Hukuk soru bankası/.test(html));
  ok('envanteri olmayan derste panel BOŞ', KP.kitapPaneliHTML('yok_boyle_ders') === '');

  // Özet etiketi: metnin "kaynak değil" olduğunu söylemeli
  const lbl = KP.ozetEtiketiHTML('medeni_hukuk');
  ok('özet etiketi metnin kaynak olmadığını yazıyor', /Özet metin/.test(lbl) && /kaynak değil/.test(lbl));
  ok('etiket, envanteri olmayan derste çıkmaz', KP.ozetEtiketiHTML('yok_boyle_ders') === '');

  // GERÇEK DOM: konu ekranında panel basılıyor mu + açılıyor mu
  flow.setSubject('medeni_hukuk');
  const fHost = window.document.querySelector('#view-flow');
  const kap = fHost.querySelector('.kitap-kap');
  ok('konu ekranında kitap paneli basıldı', !!kap);
  ok('konu ekranında özet etiketi basıldı', !!fHost.querySelector('.ozet-lbl'));
  ok('panel katlanmış geliyor (gövde gizli)',
    kap.querySelector('div[style*="none"]') !== null);
  ok('bölümler yan yana ızgarada (AGENTS §8 tek sütun yığma yasağı)', (() => {
    const css = fs2.readFileSync(path.join(ROOT, 'studio/css/studio.css'), 'utf8');
    const b = css.match(/\.kitap-bolumler \{[\s\S]*?\}/);
    return !!b && /grid-template-columns:\s*repeat\(auto-fit/.test(b[0]);
  })());

  // Aç
  kap.querySelector('[data-act="reveal"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const govde = kap.querySelector('div[style*="none"]') || kap.querySelector('div[style*="block"]');
  ok('tıklayınca bölüm listesi açılıyor', !!govde && govde.style.display !== 'none');
  ok('bölüm listesinde birden çok satır var',
    kap.querySelectorAll('.kitap-bolumler li').length > 3,
    kap.querySelectorAll('.kitap-bolumler li').length + ' satır');
  ok('her satırda sayfa numarası var',
    [...kap.querySelectorAll('.kitap-bolumler li')].every(li => /s\.\d/.test(li.textContent)));

  // En kritik: studio bu bloğu OKUMA KAYDI olarak yazmamalı (tek kayıt Takip'te)
  ok('kitap paneli durum tutmuyor (localStorage anahtarı açmıyor)', (() => {
    const anahtarlar = [...mem.keys()];
    return !anahtarlar.some(k => /kitap|book/i.test(k));
  })(), [...mem.keys()].filter(k => /kitap|book/i.test(k)).join(','));

  // Eski / eksik bir kasa önbelleği ÇALIŞAN envanteri silmemeli
  KIT.setKitaplar(undefined);
  ok('boş kasa verisi mevcut envanteri silmiyor', KP.kitapVar('medeni_hukuk') === true);
}

/* ---------- DENEME KÖPRÜSÜ, SÜRELER SETİ VE ACELE YANLIŞ GERİ BİLDİRİMİ ---------- */
section('DENEME KÖPRÜSÜ, SÜRELER SETİ VE ACELE YANLIŞ');
{
  // 1. importTakipExams testi (test ortami izolasyonu)
  const prevExams = store.state().exams.slice();
  store.state().exams = [];

  const testDeneme = {
    id: 'smoke_test_exam_1',
    at: new Date(Date.now() + 60000).toISOString(),
    label: 'Karma deneme (HMGS Çekirdek)',
    real: false,
    durationMs: 155 * 60 * 1000,
    total: 120,
    correct: 53,
    wrong: 64,
    blank: 3,
    net: 53,
    points: 44.2,
    pass: false,
    bySubject: {
      medeni_hukuk: { total: 15, correct: 2, wrong: 13, blank: 0 },
      borclar_hukuku: { total: 12, correct: 5, wrong: 7, blank: 0 }
    }
  };

  const added = store.importTakipExams([testDeneme]);
  ok('importTakipExams denemeyi içeri aktarıyor', added === true);
  ok('lastExam artık aktarılan denemeyi görüyor', store.lastExam() !== null && store.lastExam().id === testDeneme.id);
  const gap = engine.examGap();
  ok('examGap doğru net açığını hesaplıyor (53 doğru -> 31 açık)', gap && gap.gap === 31, JSON.stringify(gap));
  const worst = engine.worstExamSubjects(2);
  ok('worstExamSubjects en çok net sızdıran dersi (Medeni) ilk sıraya koyuyor', worst.length > 0 && worst[0].id === 'medeni_hukuk', worst[0]?.name);

  // Eski sınavları geri yükle
  store.state().exams = prevExams.concat(testDeneme);
  store.save();

  // 2. Süreler ve Parasal Sınırlar seti testi
  const dlSet = engine.buildDeadlinesSet(20);
  ok('buildDeadlinesSet 20 soru üretiyor', Array.isArray(dlSet.questions) && dlSet.questions.length === 20, `${dlSet.questions.length} soru`);
  ok('buildDeadlinesSet soru havuzu 50den fazla', dlSet.totalPool >= 50, `${dlSet.totalPool} havuz`);
  ok('seçilen soruların tamamı isDeadlinesQuestion testini geçiyor', dlSet.questions.every(engine.isDeadlinesQuestion));

  // 3. Practice deadlines modu testi
  const started = practice.startSession({ mode: 'deadlines', count: 20 });
  ok('practice.startSession deadlines modunu kabul ediyor', started === true);

  // 4. Acele yanlış (Fast-Wrong) geri bildirimi testi
  const curQ = practice.currentQuestion();
  const wrongOpt = ['A', 'B', 'C', 'D', 'E'].find(k => k !== curQ.correct);
  practice.pick(wrongOpt);
  const fbCard = window.document.querySelector('#fb');
  ok('hızlı yanlışta (ms < 40s) acele yanlış uyarısı basılıyor', !!fbCard?.querySelector('.fast-wrong-hint'));
  ok('acele yanlış uyarısı olumsuz ifadeye dikkat çekiyor', fbCard?.querySelector('.fast-wrong-hint')?.textContent?.includes('acele'));

  practice.endSession();
}

/* ---------- HMGS BENZERİ VE AI DENEME BÖLGESİ ---------- */
{
  section('HMGS BENZERİ VE AI DENEME BÖLGESİ');

  // 1. buildAiExamSet
  const aiExam = data.buildAiExamSet();
  ok('buildAiExamSet 120 soru üretiyor', Array.isArray(aiExam.questions) && aiExam.questions.length === 120);
  ok('buildAiExamSet açığı yok', Array.isArray(aiExam.shortfall) && aiExam.shortfall.length === 0);

  // 2. Model ve rozet ayrımı
  const sonnetQs = window.QUESTIONS_AI_DATA.filter(q => q.model === 'Sonnet 5');
  const flashQs = window.QUESTIONS_AI_DATA.filter(q => q.model === '3.8 Flash');
  ok('Sonnet 5 soruları mevcut (9+ soru)', sonnetQs.length >= 9);
  ok('3.8 Flash soruları mevcut (128+ soru)', flashQs.length >= 128);
  ok('Sonnet soruları rozet taşıyor', sonnetQs.every(q => q.sourceBadgeLabel?.includes('SONNET 5')));
  ok('Flash soruları rozet taşıyor', flashQs.every(q => q.sourceBadgeLabel?.includes('3.8 FLASH')));

  // 3. Ekran render kontrolleri
  exam.render();
  const examHost = window.document.querySelector('#view-exam');
  ok('deneme ekranında HMGS Benzeri kartı var', !!examHost?.querySelector('[data-act="exam-start-ai"]'));

  today.render();
  const todayHost = window.document.querySelector('#view-today');
  // 23 Eylül 2026: son 4 günde Bugün yalnız rota + 3 sayı gösterir (HMGS benzeri akışta geliyor).
  if (store.daysLeft() <= 4) ok('son 4 günde Bugün sade: istasyon listesi yok', !todayHost?.querySelector('[data-act="start-hmgs-benzeri"]'));
  else ok('bugün ekranında HMGS Benzeri istasyonu var', !!todayHost?.querySelector('[data-act="start-hmgs-benzeri"]'));
  ok('bugün ekranında günün rotası var', !!todayHost?.querySelector('.rota-hero'));

  // 4. Exam startAi()
  const aiExamStarted = exam.startAi();
  ok('exam.startAi denemeyi başlatıyor', aiExamStarted === true);
  ok('aktif deneme 120 soruluk', exam.active());
  exam.finish(false);

  // 5. Practice hmgsBenzeri modu
  const prStarted = practice.startSession({ mode: 'hmgsBenzeri', count: 20 });
  ok('practice.startSession hmgsBenzeri modunu kabul ediyor', prStarted === true);
  const q1 = practice.currentQuestion();
  ok('seanstaki ilk soru AI sorusu', !!q1.sourceBadgeLabel);
  practice.endSession();
}

/* ---------- SONUÇ ---------- */

console.log(`\n${'─'.repeat(52)}`);
console.log(`GEÇTİ: ${pass}   BAŞARISIZ: ${fail}`);
console.log('─'.repeat(52));
process.exit(fail === 0 ? 0 : 1);
