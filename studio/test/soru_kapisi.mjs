/* ==========================================================================
   studio/test/soru_kapisi.mjs — AI SORU DENETİM KAPISI
   ----------------------------------------------------------------------
   NEDEN VAR: AGENTS.md §0 — "yapmış gibi görünme bir hata değil, sabotajdır."
   AI'ın ürettiği her soru havuza girmeden önce mekanik olarak denetlenir.
   Kapı geçmeyen soru questions.js'e EKLENMEZ.

   İKİ KAYNAK, İKİ MOD:
     · YENİ PARTİ (--dosya)  → AGENTS §0.1 yasak listesi + TAM denetim.
                               Stil eşikleri de BLOKLAYICI (soru reddedilir).
     · MEVCUT HAVUZ (--tumu) → yalnız yapısal bütünlük bloklar. Mevcut 3065 soru
                               kabul edilmiş bir gerçeklik; onlara bugünün stil
                               bandını dayatmak yanlış alarm üretir.

   EŞİKLER UYDURMA DEĞİL. Kaynak: HMGS_SORU_URETIM_ALGORITMASI_v2.md (18 Eylül 2026,
   4 gerçek HMGS / 460 soru — HMGS_BENZERI_SORU_URETIM_RAPORU.md ve SINAV_ALGORITMASI.md'nin
   240/238 sorudan ölçülmüş eski tabanının yerine geçer).
   Olumsuz kök %26-31, öncüllü %17-21, kök medyan 232 karakter, şık ortalaması 44-50 karakter.

   KULLANIM
     node studio/test/soru_kapisi.mjs --dosya parti.json   ← yarınki parti, EKLEMEDEN ÖNCE
     node studio/test/soru_kapisi.mjs                      → havuzdaki AI soruları
     node studio/test/soru_kapisi.mjs --tumu               → tüm havuz (duman)

   Çıkış kodu: 0 = kapı açık, 1 = en az bir soru reddedildi.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const VAULT = path.join(ROOT, 'data/hmgs_vault.json');
const DATAJS = path.join(ROOT, 'studio/js/data.js');

/* ---------- ÖLÇÜLEN eşikler ---------- */
const E = {
  KOK_MIN: 60,            // en kısa gerçek kök; altı "soru" değil başlık
  KOK_MEDYAN: 232,        // 4 sınav / 460 soru ölçümü (18 Eylül 2026); N26 257 / E25 248 yalnız iki sınavdı
  KOK_MAX: 1300,          // E25'teki en uzun kök 1253
  GEREKCE_MIN: 40,        // smoke.mjs tabanı
  GEREKCE_IYI: 120,       // altı "brutalist" sayılmaz
  SIK_ORT_MIN: 5,         // en kısa şık ortalaması 44
  HAVUZ_UST_KAT: 6,       // bir ders sınav payının 6 katından fazla tutmamalı
  HAVUZ_ALT_KAT: 3        // ... ve 3 katının altına düşmemeli
};

/* ---------- §1.1 RESMÎ blok dağılımı (HMGS Yönetmeliği, 15 Oca 2025) ----------
   Havuzdaki subjectId etiketleri 11 soruda yanlış (SINAV_ALGORITMASI §1),
   bu yüzden dağılım denetimi `examQ` tablosuna değil RESMÎ tabloya bakar. */
const RESMI = {
  anayasa_hukuku: 6, anayasa_yargisi: 3, idare_hukuku: 6, iyuk: 3,
  medeni_hukuk: 15, borclar_hukuku: 12, ticaret_hukuku: 12, hmk: 12,
  icra_iflas: 6, ceza_hukuku: 9, cmk: 6, is_hukuku: 6,
  vergi_hukuku: 3, vergi_usul: 3, avukatlik: 3,
  hukuk_felsefesi: 3, hukuk_tarihi: 3, milletlerarasi_hukuk: 3,
  mohuk: 3, genel_kamu: 3
};

/* ---------- AGENTS.md §0.1 — YASAKLI TEMPLATE CÜMLELERİ ---------- */
const YASAK = [
  ['§0.1-1', /kurucu unsurları ve istisnai düzenlemeleri ele alınır/i],
  ['§0.1-2', /geçerlilik şartları kümülatif niteliktedir/i],
  ['§0.1-3', /şaşırtmalara dikkat edilmelidir/i],
  ['§0.1-4', /olumsuz mu olduğu dikkatle incelenmelidir/i],
  ['§0.1-5', /öncülleri okurken/i],
  ['§0.1-6', /re'sen gözetilir/i],
  ['§0.1-7', /kesin hükümsüzlük \(butlan\) veya iptal edilebilirlik/i],
  ['§0.1-8', /dürüstlük kuralı ile çeliştiği durumlarda/i],
  ['§0.1-9', /Yüksek Mahkeme kararlarında dürüstlük kuralı/i],
  ['§0.1-11', /Uyuşmazlık kanuna uygun çözümlenir/i],
  ['§0.1-12', /yetki, görev ve süre şartlarını re'sen denetler/i]
];

const MADDE_ATFI = /(?:m\.\s*\d|\bTMK\b|\bTBK\b|\bTTK\b|\bTCK\b|\bCMK\b|\bHMK\b|\bİİK\b|\bİYUK\b|\bVUK\b|\bAY\b|\bDMK\b|\bAv\.\s*Kan\b|Anayasa|\d{4}\s*sayılı)/;
const NEG_KOK = /değildir|yanlıştır|olamaz|söylenemez|yer almaz|sayılmamıştır|çıkarılamaz|yanlış olan/i;
const ONCUL = /(^|\n)\s*(I{1,3}|IV|V)\.\s/;
const QTYPE = ['onerme', 'onculu', 'olay', 'kavram', 'sayi'];
const DIFF = ['kolay', 'orta', 'zor'];
const VERIFY = ['kesin', 'kontrol_et'];

/* ---------- yükleme ---------- */
const argv = process.argv.slice(2);
const flag = n => argv.includes(n);
const val = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };

const vault = JSON.parse(fs.readFileSync(VAULT, 'utf8'));
const havuz = vault.questions || [];
const konular = new Map((vault.topics || []).map(t => [t.id, t]));
const havuzId = new Set(havuz.map(q => q.id));

const dsrc = fs.readFileSync(DATAJS, 'utf8');
const DERSLER = [...dsrc.matchAll(/\{ id: '([^']+)',\s*name: '([^']+)',\s*tier: (\d+), examQ: (\d+)/g)]
  .map(m => ({ id: m[1], name: m[2], examQ: +m[4] }));
const dersAd = new Map(DERSLER.map(d => [d.id, d.name]));
const GECERLI_DERS = new Set(DERSLER.map(d => d.id));

let hedef, etiket, siki;
if (flag('--dosya')) {
  /* BOM'u temizle: Windows editörleri (Not Defteri, VS Code varsayılanı, Excel
     dışa aktarımı) JSON'a UTF-8 BOM koyar ve JSON.parse bunu "Unexpected token"
     diye reddeder. Kapı dosya okuyan tek yüzey olduğu için hoşgörülü olmalı —
     yoksa kullanıcı geçerli bir parti verip anlamsız bir sözdizimi hatası alır. */
  const raw = JSON.parse(fs.readFileSync(val('--dosya'), 'utf8').replace(/^\uFEFF/, ''));
  hedef = Array.isArray(raw) ? raw : (raw.questions || []);
  etiket = 'YENİ PARTİ · ' + path.basename(val('--dosya'));
  siki = true;
} else if (flag('--tumu')) {
  hedef = havuz; etiket = 'TÜM HAVUZ (yapısal duman denetimi)'; siki = false;
} else {
  hedef = havuz.filter(q => /ai_|ai-|hmgsai/i.test(String(q.source || '')));
  etiket = 'HAVUZDAKİ AI SORULARI'; siki = true;
}

const norm = s => String(s || '').toLocaleLowerCase('tr')
  .replace(/\([a-zçğıöşü]\)/gi, '').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 120);

/* aynı kök havuzda başka id ile var mı (parti içi hariç) */
const hedefId = new Set(hedef.map(q => q.id));
const kokIndeks = new Map();
havuz.forEach(q => {
  if (hedefId.has(q.id)) return;
  const k = norm(q.stem);
  if (!kokIndeks.has(k)) kokIndeks.set(k, []);
  kokIndeks.get(k).push(q.id);
});

/* ---------- tek soru ---------- */
function denetle(q) {
  const hata = [], uyari = [];
  const stil = siki ? hata : uyari;       // stil yalnız yeni partide bloklar

  /* 1. YAPI — her modda bloklar */
  const opts = Array.isArray(q.options) ? q.options : [];
  if (opts.length !== 5) hata.push('yapı: ' + opts.length + ' şık var, 5 olmalı (§10)');
  const bosSik = opts.filter(o => !o || !String(o.text || '').trim()).map(o => (o && o.key) || '?');
  if (bosSik.length) hata.push('yapı: boş şık metni → ' + bosSik.join(', ') + ' (öğrenci o şıkkı göremez)');
  const anahtar = opts.map(o => o && o.key).filter(Boolean).sort().join('');
  if (anahtar !== 'ABCDE') hata.push('yapı: şık anahtarları A-E değil (' + anahtar + ')');
  if (!opts.some(o => o && o.key === q.correct)) hata.push('yapı: doğru şık "' + q.correct + '" şıklarda YOK');
  const dogruOpt = opts.find(o => o && o.key === q.correct);
  if (dogruOpt && !String(dogruOpt.text || '').trim()) hata.push('yapı: DOĞRU ŞIK BOŞ — soru çözülemez');
  if (!q.id || typeof q.id !== 'string') hata.push('yapı: id yok');
  else if (hedef.filter(x => x.id === q.id).length > 1) hata.push('yapı: parti içinde mükerrer id "' + q.id + '"');

  /* 2. MÜKERRER KÖK (AGENTS §0: kopyalama yok, ikizleme var) */
  const k = norm(q.stem);
  if (k.length > 40) {
    const ikiz = kokIndeks.get(k);
    if (ikiz) hata.push('mükerrer: bu kök havuzda zaten var → ' + ikiz.slice(0, 2).join(', '));
  }

  /* 3. GEREKÇE */
  const g = String(q.explanation || '').trim();
  if (g.length < E.GEREKCE_MIN) hata.push('gerekçe: yok veya çok kısa (' + g.length + ' karakter)');
  else {
    if (g.length < E.GEREKCE_IYI) uyari.push('gerekçe kısa (' + g.length + ') — brutalist ama zayıf (§4)');
    if (!MADDE_ATFI.test(g)) hata.push('gerekçe: kanun/madde atfı yok (§7: madde yazamıyorsan soruyu yazma)');
  }
  const lb = String(q.legalBasis == null ? '' : q.legalBasis).trim();
  if (!lb) hata.push('legalBasis boş (§7: kanun + madde zorunlu)');
  else if (!/\d|m\./.test(lb)) uyari.push('legalBasis madde numarası içermiyor: "' + lb + '"');

  /* 4. §0.1 YASAKLI ŞABLON */
  const metin = [q.stem, g, lb, ...opts.map(o => o && o.text)].join(' ');
  YASAK.forEach(([kod, re]) => { if (re.test(metin)) hata.push('§0.1 yasaklı şablon ' + kod); });

  /* 5. BAĞ */
  if (!q.subjectId) hata.push('bağ: subjectId yok');
  else if (!GECERLI_DERS.has(q.subjectId)) hata.push('bağ: bilinmeyen ders "' + q.subjectId + '" (§10: yalnız 20 değer)');
  if (q.topicId) { if (!konular.has(q.topicId)) hata.push('bağ: topicId çözülmüyor "' + q.topicId + '"'); }
  else uyari.push('bağ: topicId null — yetim soru artar (AGENTS §3: açık İlerleme\'de görünür)');

  /* 6. AKILLI ALANLAR — raporun sözleşmesi (§10) */
  const src = String(q.source || '');
  if (siki && !/ai_hmgs_benzeri|ai_/i.test(src)) uyari.push('kaynak: source "' + src + '" — rapor ai_hmgs_benzeri bekliyor');
  if (!q.dateAdded) uyari.push('kaynak: dateAdded yok');
  if (!q.difficulty) uyari.push('difficulty atanmamış (kolay|orta|zor)');
  else if (!DIFF.includes(q.difficulty)) uyari.push('difficulty tanınmıyor: "' + q.difficulty + '"');
  if (!Array.isArray(q.tags) || !q.tags.length) uyari.push('tags boş');

  if (q.qType !== undefined) {
    if (!QTYPE.includes(q.qType)) hata.push('qType geçersiz: "' + q.qType + '" (§10: ' + QTYPE.join('|') + ')');
    else {
      /* qType ile kökün gerçekten uyuşup uyuşmadığı — sessiz yanlış etiket olmasın */
      const onculuMetin = ONCUL.test(String(q.stem || ''));
      if (q.qType === 'onculu' && !onculuMetin) hata.push('qType=onculu ama kökte I./II. öncül yok');
      if ((q.qType === 'onerme' || q.qType === 'olay') && onculuMetin) uyari.push('qType=' + q.qType + ' ama kök öncüllü görünüyor');
      if (q.qType === 'onerme' && !/aşağıdaki(lerden)?\s+(ifadelerden|bilgilerden|hangisi)/i.test(String(q.stem || '')))
        uyari.push('qType=onerme ama kalıp cümlesi bulunamadı (§2.4)');
    }
  }
  if (q.negativeStem !== undefined) {
    const gercek = NEG_KOK.test(String(q.stem || ''));
    if (!!q.negativeStem !== gercek)
      hata.push('negativeStem=' + q.negativeStem + ' ama kök ' + (gercek ? 'olumsuz görünüyor' : 'olumsuz görünmüyor') + ' — alan yanlış');
  }
  if (q.verify !== undefined && !VERIFY.includes(q.verify))
    hata.push('verify geçersiz: "' + q.verify + '" (kesin|kontrol_et)');
  if (q.twinOf) {
    if (!havuzId.has(q.twinOf))
      uyari.push('twinOf "' + q.twinOf + '" havuzda yok — esinlenilen gerçek soru doğrulanamadı');
    else {
      const tw = havuz.find(x => x.id === q.twinOf);
      if (tw && tw.correct === q.correct && norm(tw.stem).slice(0, 60) === norm(q.stem).slice(0, 60))
        hata.push('twinOf ile AYNI soru (§9: ikiz, kopya değil — aynı doğru cevabı vermemeli)');
    }
  }

  /* 7. STİL — yalnız yeni partide bloklar */
  const kok = String(q.stem || '').length;
  if (kok < E.KOK_MIN) stil.push('stil: kök çok kısa (' + kok + ' < ' + E.KOK_MIN + ')');
  if (kok > E.KOK_MAX) stil.push('stil: kök sınavdaki en uzundan uzun (' + kok + ' > ' + E.KOK_MAX + ')');
  const sikl = opts.map(o => String((o && o.text) || '').length).filter(Boolean);
  const ortSik = sikl.length ? sikl.reduce((a, b) => a + b, 0) / sikl.length : 0;
  if (ortSik && ortSik < E.SIK_ORT_MIN) stil.push('stil: şık ortalaması çok kısa (' + ortSik.toFixed(0) + ')');
  if (new Set(opts.map(o => norm((o && o.text) || ''))).size < opts.length)
    hata.push('stil: şıklardan en az ikisi birbirinin aynısı');

  return { hata, uyari };
}

/* ---------- koşum ---------- */
const S = { gecti: 0, red: 0, uyari: 0, redler: [], uyarilar: [], kontrol: [] };
hedef.forEach(q => {
  const { hata, uyari } = denetle(q);
  if (hata.length) { S.red++; S.redler.push({ id: q.id || '(id yok)', ders: q.subjectId || '?', kok: String(q.stem || '').slice(0, 66), hata }); }
  else { S.gecti++; if (uyari.length) { S.uyari++; S.uyarilar.push({ id: q.id, uyari }); } }
  if (q.verify === 'kontrol_et') S.kontrol.push(q.id);
});

/* ---------- dağılım: RESMÎ tabloya göre ----------
   İki hâl ayrılır ve karıştırılmaz:
     · PARTİ bu dersi tavana taşıdıysa → YIĞILMA (üreticinin hatası, uyarılır)
     · havuz zaten tavandaysa        → YETERLİ (mevcut durum, hata değil)
   Havuzun hâlihazırda büyük olması üreticinin kusuru değil; onu "sorun" diye
   listelemek 11 derslik yanlış bir alarm üretiyordu. */
const sayim = {}, partide = {};
havuz.forEach(q => { if (!hedefId.has(q.id)) sayim[q.subjectId] = (sayim[q.subjectId] || 0) + 1; });
hedef.forEach(q => {
  if (S.redler.some(r => r.id === q.id)) return;
  sayim[q.subjectId] = (sayim[q.subjectId] || 0) + 1;
  partide[q.subjectId] = (partide[q.subjectId] || 0) + 1;
});
const dagilim = Object.entries(RESMI)
  .filter(([, n]) => n > 0)
  .map(([id, resmi]) => {
    const p = sayim[id] || 0;
    const onceki = p - (partide[id] || 0);
    const alt = Math.round(resmi * E.HAVUZ_ALT_KAT), ust = resmi * E.HAVUZ_UST_KAT;
    let durum;
    if (p > ust) durum = onceki <= ust ? 'YIĞILMA' : 'YETERLİ';   // parti mi taşırdı, zaten mi doluydu
    else if (p < alt) durum = 'AÇIK';
    else durum = 'ok';
    return { id, ad: dersAd.get(id) || id, resmi, havuz: p, onceki, alt, ust, durum, parti: partide[id] || 0 };
  });

/* ---------- rapor ---------- */
const L = []; const P = s => L.push(s);
P('');
P('═══════════════════════════════════════════════════════════════════════');
P('  AI SORU DENETİM KAPISI  ·  ' + (siki ? 'SIKI MOD (yeni parti)' : 'YAPISAL MOD (mevcut havuz)'));
P('  denetlenen: ' + etiket + '  ·  ' + hedef.length + ' soru');
P('═══════════════════════════════════════════════════════════════════════');
P('  eşikler 460 gerçek arşiv sınavı sorusundan (4 sınav) ölçüldü: kök ' + E.KOK_MIN + '-' + E.KOK_MAX +
  ' karakter (medyan ' + E.KOK_MEDYAN + ') · gerekçe ≥' + E.GEREKCE_MIN +
  ' · şık ort. ≥' + E.SIK_ORT_MIN + ' · havuz ' + E.HAVUZ_ALT_KAT + '×-' + E.HAVUZ_UST_KAT + '× resmî payı');
P('');

if (!hedef.length) {
  P('  Denetlenecek soru yok.');
  P('  · Havuzda AI soruları: hiç yok (henüz üretilmedi).');
  P('  · Yarınki partiyi EKLEMEDEN ÖNCE denetle:');
  P('      node studio/test/soru_kapisi.mjs --dosya <parti.json>');
  P('  · Kapının kendisini sına:  node studio/test/soru_kapisi.mjs --tumu');
} else {
  P('SONUÇ: ' + S.gecti + ' geçti · ' + S.red + ' REDDEDİLDİ · ' + S.uyari + ' uyarılı');
  P('');
  if (S.redler.length) {
    P('─── REDDEDİLENLER (havuza GİRMEMELİ) ───');
    S.redler.slice(0, 40).forEach(r => {
      P('  ✗ ' + r.id + '  [' + r.ders + ']');
      P('      ' + r.kok.replace(/\n/g, ' ') + '…');
      r.hata.forEach(h => P('      · ' + h));
    });
    if (S.redler.length > 40) P('  … ve ' + (S.redler.length - 40) + ' soru daha');
    P('');
  }
  if (S.uyarilar.length) {
    P('─── UYARILAR (girer, ama not düşülür) ───');
    S.uyarilar.slice(0, 20).forEach(r => { P('  ! ' + r.id); r.uyari.forEach(u => P('      · ' + u)); });
    if (S.uyarilar.length > 20) P('  … ve ' + (S.uyarilar.length - 20) + ' soru daha');
    P('');
  }
  if (S.kontrol.length) {
    P('─── verify:"kontrol_et" — SENİN ELLE DOĞRULAMAN GEREKENLER ───');
    P('  Bunlar havuzda çözülebilir ama parasal sınır / yeni değişiklik şüphesi taşıyor (rapor §7).');
    S.kontrol.forEach(id => P('  ? ' + id));
    P('');
  }
  const sorun = dagilim.filter(d => d.durum === 'AÇIK' || d.durum === 'YIĞILMA');
  const dolu = dagilim.filter(d => d.durum === 'YETERLİ');
  P('─── DAĞILIM (RESMÎ yönetmelik payına göre) ───');
  if (!sorun.length) P('  Üretim gerektiren ya da tavana taşan ders yok.');
  else {
    P('  | ders | resmî | havuz | bant | parti | durum |');
    P('  |---|---:|---:|---:|---:|---|');
    sorun.sort((a, b) => (b.alt - b.havuz) - (a.alt - a.havuz))
      .forEach(d => P('  | ' + d.ad.padEnd(26) + ' | ' + String(d.resmi).padStart(3) + ' | ' +
        String(d.havuz).padStart(4) + ' | ' + d.alt + '-' + d.ust + ' | ' +
        String(d.parti).padStart(3) + ' | ' + d.durum + ' |'));
    const acik = sorun.filter(d => d.durum === 'AÇIK');
    if (acik.length) {
      P('');
      P('  AÇIK = üretimin MEŞRU hedefi (en çok açık olan önce):');
      acik.forEach(d => P('    · ' + d.ad + '  havuz ' + d.havuz + ' → hedef ' + d.alt + '  (+' + (d.alt - d.havuz) + ')'));
    }
    const yig = sorun.filter(d => d.durum === 'YIĞILMA');
    if (yig.length) {
      P('');
      P('  ⚠ YIĞILMA — BU PARTİ şu ders(ler)i tavana taşıdı. Kapsam için değil, o ders zaten');
      P('  doluyken üretilmiş; soruları gözden geçir ya da başka derse kaydır:');
      yig.forEach(d => P('    · ' + d.ad + '  parti öncesi ' + d.onceki + ' → sonrası ' + d.havuz + ' (üst sınır ' + d.ust + ')'));
    }
  }
  if (dolu.length) {
    P('');
    P('  Zaten yeterli (' + E.HAVUZ_UST_KAT + '× üstünde) — bu derslerde üretim GEREKSİZ:');
    P('    ' + dolu.map(d => d.ad).join(' · '));
  }
}
P('');

fs.writeFileSync(path.join(ROOT, 'scratch/_soru_kapisi_out.txt'), L.join('\n'), 'utf8');
console.log(L.join('\n'));
if (S.red > 0) { console.log('KAPI KAPALI — ' + S.red + ' soru reddedildi. Havuza eklemeyin.\n'); process.exit(1); }
console.log('KAPI AÇIK' + (hedef.length ? ' — ' + S.gecti + ' soru denetimden geçti.' : '.') + '\n');
process.exit(0);
