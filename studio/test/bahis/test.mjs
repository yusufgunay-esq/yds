/* ==========================================================================
   studio/test/bahis/test.mjs — BAHİS ŞERİDİ = ESKİ "MANTIK" BAYRAĞI
   Çalıştır:  node studio/test/bahis/test.mjs
   ----------------------------------------------------------------------
   20 Eylül 2026, kullanıcı: "mantıkla geç kısmı zaten yeni gelen bahis
   kısmıyla aynı değil mi, birleştirelim". Cevaptan SONRAKİ Mantık rozeti
   akıştan kaldırıldı; kararı artık cevaptan ÖNCE bahis şeridi alıyor
   (3 = "Mantıkla", CONF.guess.logic = true).

   Bu dosya iki şeyi kilitler:
   A) DAVRANIŞ — engine.js yerinden okunur (karma/test.mjs paterni, stub
      import'larla): hangi bahsin soruyu tekrar sırasına soktuğu ölçülür.
   B) KAYNAK — akış ekranında rozetin/M kısayolunun GERÇEKTEN kalmadığı,
      pratik ekranındaki "Mantıkla Geç" düğmesinin ise DURDUĞU (orada bahis
      şeridi yok, tek karar noktası o).
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const read = p => fs.readFileSync(path.resolve(here, p), 'utf8');

const tmp = path.join(here, '.engine.under-test.mjs');
fs.writeFileSync(tmp, read('../../js/engine.js'), 'utf8');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });

const eng = await import(url.pathToFileURL(tmp).href);
const { CONF, scheduleAfterAnswer, isPending, SRS_WRONG_GAP } = eng;
const { _S } = await import('./store.js');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { const r = fn(); if (r === true) { pass++; console.log('  ok   ' + name); }
        else { fail++; console.log('  FAIL ' + name + '  → ' + r); } }
  catch (e) { fail++; console.log('  FAIL ' + name + '  → ' + e.message); }
};
const akim = read('../../js/views/akim.js');
const reset = () => { _S.answers = []; _S.srs = {}; _S.exams = []; };
/** Bahsi verilmiş tek bir DOĞRU cevap; soru tekrar sırasına girdi mi? */
const geriGelirMi = (confKey) => {
  reset();
  const qId = 'borclar_hukuku_0';
  _S.answers.push({ qId, ok: true, ms: 60000, at: new Date().toISOString(), conf: confKey, logicGuess: CONF[confKey].logic });
  scheduleAfterAnswer(qId, true, CONF[confKey].logic);
  return isPending(_S.srs[qId]);
};

console.log('\n1. BAHİS DÜZEYLERİ');
t('üç bahis düzeyi ve anahtarları korunuyor (eski kayıtlar okunabilsin)',
  () => (Object.keys(CONF).join(',') === 'sure,think,guess,hint') || Object.keys(CONF).join(','));
t('en alt düzeyin adı "Mantıkla" (eski "Salladım" değil)',
  () => CONF.guess.label === 'Mantıkla' || CONF.guess.label);
t('"Eminim" tekrar sırasına sokmaz', () => CONF.sure.logic === false || 'sure.logic true');
t('"Sanırım" tekrar sırasına sokmaz — Enter varsayılanı o, logic olsaydı her soru kuyruğa düşerdi',
  () => CONF.think.logic === false || 'think.logic true');
t('"Mantıkla" tekrar sırasına sokar (eski Mantık bayrağının yerine geçti)',
  () => CONF.guess.logic === true || 'guess.logic false');

console.log('\n1b. İPUCU DÜZEYİ [yardım alınmış cevap bahse girmez]');
t('CONF.hint var ve tekrar sırasına sokar', () => (CONF.hint && CONF.hint.logic === true) || 'hint yok/logic false');
t('ipucuyla çözülen soru geri gelir', () => geriGelirMi('hint') === true || 'geri gelmedi');
t('calibration() ipucu satırını saymaz (bahis isabeti kirlenmesin)', () => {
  const c = eng.calibration([
    { conf: 'sure',  ok: true },
    { conf: 'hint',  ok: true },
    { conf: 'hint',  ok: true }
  ]);
  return (c.sure.n === 1 && !c.hint) || JSON.stringify(c);
});
t('akış: cevap öncesi ipucu istendiyse bahis "hint" olarak kaydedilir',
  () => /A\.geminiAskedPreAnswer \? 'hint'/.test(akim) || 'pick() bahsi ezmiyor');
t('akış: ipucu alınmışsa üç düğmelik bahis şeridi gizlenir',
  () => (/function paintBet/.test(akim) && /akim-bet-hint/.test(akim)) || 'paintBet/tek düğme yok');
t('akış: ipucu satırı logicGuess:true kaydeder (mastery ve harita kirlenmesin)',
  () => /logicGuess: CONF\[c\]\.logic/.test(akim) || 'logicGuess bahisten türetilmiyor');
t('akış: SRS çağrısı tek kaynaktan (CONF[c].logic)',
  () => !/geminiAskedPreAnswer \|\| CONF\[c\]\.logic/.test(akim) || 'iki kaynak hâlâ var');

console.log('\n2. SRS DAVRANIŞI [mantık-rozeti-birleştirme]');
t('Eminim + doğru → soru biter', () => geriGelirMi('sure') === false || 'tekrar sırasına girdi');
t('Sanırım + doğru → soru biter', () => geriGelirMi('think') === false || 'tekrar sırasına girdi');
t('Mantıkla + doğru → soru tekrar gelir', () => geriGelirMi('guess') === true || 'tekrar sırasına girmedi');
t('Mantıkla + doğru, yanlışla aynı yakınlıkta döner (SRS_WRONG_GAP)', () => {
  reset();
  const qId = 'borclar_hukuku_0';
  _S.answers.push({ qId, ok: true, ms: 60000, at: new Date().toISOString(), conf: 'guess', logicGuess: true });
  scheduleAfterAnswer(qId, true, true);
  const beklenen = _S.answers.length + SRS_WRONG_GAP;
  return _S.srs[qId].dueN === beklenen || (_S.srs[qId].dueN + ' ≠ ' + beklenen);
});
t('Mantıkla + doğru "takıldın" saymaz (lapses artmaz — yanlış değil)', () => {
  reset();
  const qId = 'borclar_hukuku_0';
  _S.answers.push({ qId, ok: true, ms: 60000, at: new Date().toISOString(), conf: 'guess', logicGuess: true });
  scheduleAfterAnswer(qId, true, true);
  return (_S.srs[qId].lapses || 0) === 0 || ('lapses ' + _S.srs[qId].lapses);
});

console.log('\n3. AKIŞ EKRANI: İKİNCİ KARAR NOKTASI KALMADI [tekrarlı-soru hatası]');
const main = read('../../js/main.js');
t('akış ekranında "Mantık" rozeti yok', () => !/id="badge-logic"/.test(akim) || 'rozet duruyor');
t('akış ekranında akim-toggle-logic eylemi yok', () => !/akim-toggle-logic/.test(akim) || 'eylem duruyor');
t('akim.js nextLogic/toggleLogic dışa aktarmıyor',
  () => !/export function (next|toggle)Logic/.test(akim) || 'fonksiyon duruyor');
t('main.js akim-next-logic / akim-toggle-logic yönlendirmesi yok',
  () => !/akim-(next|toggle)-logic/.test(main) || 'yönlendirme duruyor');
t('akışta cevaptan sonra M kısayolu yok', () => !/akim\.nextLogic\(\)/.test(main) || 'M duruyor');
t('bahis şeridinde "Mantıkla" düğmesi var', () => /data-conf="guess"[^>]*>[\s\S]{0,200}Mantıkla/.test(akim) || 'düğme metni değişmemiş');
t('kapanış ekranında "Salladıkların" ifadesi kalmadı', () => !/Salladık/.test(akim) || 'eski metin duruyor');

console.log('\n4. PRATİK/DENEME EKRANI DOKUNULMADI (orada bahis şeridi yok)');
const practice = read('../../js/views/practice.js');
t('practice.js "Mantıkla Geç" düğmesi kalktı (bahis cevaptan önce soruluyor)', () => !/<span>Mantıkla Geç<\/span>/.test(practice) || 'düğme duruyor');
t('practice.js nextLogic dışa aktarıyor', () => /export function nextLogic/.test(practice) || 'fonksiyon silinmiş');
t('practice.js bahis şeridi taşıyor (22 Eylül 2026)',
  () => /data-act="practice-conf"/.test(practice) || 'practice.js bahis şeridi yok');

console.log('\n' + (fail ? 'KIRMIZI' : 'HEPSİ YEŞİL') + `  ${pass}/${pass + fail}\n`);
process.exit(fail ? 1 : 0);
