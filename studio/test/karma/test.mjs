/* ==========================================================================
   studio/test/karma/test.mjs — KARMA SET MOTORU TESTLERİ
   Çalıştır:  node studio/test/karma/test.mjs
   Her test bir kez gerçekten yaşanmış hatayı kilitler; başlıkta köşeli
   parantezle yazıyor. Bu testleri gevşetme, hata tekrar açılır.
   engine.js YERİNDEN okunur; yalnız iki import satırı stub'a çevrilip
   geçici dosyaya yazılır. Kopya tutulmaz, kaynak tektir.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const enginePath = path.resolve(here, '../../js/engine.js');
let src = fs.readFileSync(enginePath, 'utf8');
src = src.replace("from './store.js'", "from './store.js'").replace("from './data.js'", "from './data.js'");
const tmp = path.join(here, '.engine.under-test.mjs');
fs.writeFileSync(tmp, src, 'utf8');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });

const eng = await import(url.pathToFileURL(tmp).href);
const { buildKarmaSet, karmaWeights, karmaGaps, nextAction,
        KARMA_DUE_SHARE, KARMA_ACQ_BLOCK, KARMA_MAX_BLOCKS } = eng;
const { _S, _setGun } = await import('./store.js');
const { SUBJECTS, tierOf, questionsOf } = await import('./data.js');

/* SABİT TOHUM (20 Eylül 2026): allocate() artık kalan slotları kesirli payla
   ORANTILI olasılıkla dağıtıyor (yansız yuvarlama, bkz. engine.js). Bu, akışta
   doğru davranış ama testte koşudan koşuya oynaklık demek. Testler tohumu
   sabitliyor; ölçüm testleri ayrıca tek sete değil onlarca sete bakıyor ki
   sonuç tohumun şansına değil motorun davranışına bağlı olsun. */
let _tohum = 20260920;
Math.random = () => { _tohum |= 0; _tohum = _tohum + 0x6D2B79F5 | 0;
  let t = Math.imul(_tohum ^ _tohum >>> 15, 1 | _tohum);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296; };

let pass=0, fail=0;
const t=(name,fn)=>{try{const r=fn();if(r===true){pass++;console.log('  ok   '+name);}else{fail++;console.log('  FAIL '+name+'  → '+r);}}catch(e){fail++;console.log('  FAIL '+name+'  → '+e.message);}};

const reset=()=>{_S.answers=[];_S.srs={};_S.exams=[];};
const answer=(sid,n,accuracy)=>{for(let i=0;i<n;i++){_S.answers.push({qId:sid+'_'+i,subjectId:sid,topicId:sid+'_t',ok:i/n<accuracy,ms:60000,at:new Date().toISOString()});}};

console.log('\n1. TEMEL KURULUM');
reset();
t('boş geçmişte 20 soruluk set 20 soru döner',()=>{const r=buildKarmaSet(20);return r.questions.length===20||r.questions.length;});
t('set tek derste toplanmaz (en az 4 ders)',()=>{const r=buildKarmaSet(20);return r.plan.length>=4||('ders sayısı '+r.plan.length);});
t('havuzu olmayan ders sete girmez',()=>{const r=buildKarmaSet(30);const bad=r.questions.filter(q=>q.subjectId==='anayasa_yargisi'||q.subjectId==='genel_kamu');return bad.length===0||('sızdı '+bad.length);});
t('aynı soru iki kez girmez',()=>{const r=buildKarmaSet(40);const s=new Set(r.questions.map(q=>q.id));return s.size===r.questions.length||'tekrar var';});

console.log('\n2. SINAV AĞIRLIĞI ÖLÇÜLMÜŞ TABLODAN GELİYOR [tahmini-tablo hatası]');
t('examQ toplamı tam 120',()=>{const s=SUBJECTS.reduce((a,x)=>a+x.examQ,0);return s===120||('toplam '+s);});
t('Resmî dağılımda Vergi (3) MÖHUK (3) ve Vergi Usul (3) eşitliği korunuyor',()=>{const g=id=>SUBJECTS.find(s=>s.id===id).examQ;return (g('vergi_hukuku')===3&&g('mohuk')===3&&g('vergi_usul')===3)||'tablo kaymış';});
t('Ticaret sınavın 3. büyük dersi olarak duruyor',()=>{const top=SUBJECTS.slice().sort((a,b)=>b.examQ-a.examQ).slice(0,4).map(s=>s.id);return top.includes('ticaret_hukuku')||('ilk4: '+top.join(','));});

console.log('\n3. HİÇ AÇILMAMIŞ DERS BLOK HÂLİNDE GELİR [tek-soru-tahmine-döner hatası]');
reset();
t('yeni derste ilk temas bitişik blok',()=>{
  const r=buildKarmaSet(24);
  // blok: aynı dersten ardışık >=2 soru bulunmalı
  let maxRun=1,run=1;
  for(let i=1;i<r.questions.length;i++){ if(r.questions[i].subjectId===r.questions[i-1].subjectId){run++;maxRun=Math.max(maxRun,run);} else run=1; }
  return maxRun>=2||('en uzun ardışık '+maxRun);
});
t('blok KARMA_ACQ_BLOCK sınırını aşmaz',()=>{
  const r=buildKarmaSet(24);let maxRun=1,run=1;
  for(let i=1;i<r.questions.length;i++){ if(r.questions[i].subjectId===r.questions[i-1].subjectId){run++;maxRun=Math.max(maxRun,run);} else run=1; }
  return maxRun<=KARMA_ACQ_BLOCK||('blok '+maxRun+' > '+KARMA_ACQ_BLOCK);
});
t('tanınan derste blok yok, harmana karışır',()=>{
  reset(); answer('borclar_hukuku',60,0.9);
  const r=buildKarmaSet(30);
  let run=1,maxB=1;
  for(let i=1;i<r.questions.length;i++){const a=r.questions[i],b=r.questions[i-1];
    if(a.subjectId===b.subjectId&&a.subjectId==='borclar_hukuku'){run++;maxB=Math.max(maxB,run);}else run=1;}
  return maxB<=2||('borçlar bloğu '+maxB);
});

console.log('\n4. KAPSAM AÇIĞI PAYI BÜYÜTÜR [64-soru hatası]');
reset();
answer('borclar_hukuku',160,0.90); answer('medeni_hukuk',155,0.85); answer('hmk',61,0.72);
answer('ceza_hukuku',77,0.83); answer('anayasa_hukuku',61,0.85);
t('çalışılmış derslerin payı, hiç açılmamışlardan küçük',()=>{
  const w=karmaWeights();
  const calisilan=w.find(x=>x.id==='borclar_hukuku').weight;
  const acilmamis=w.find(x=>x.id==='icra_iflas').weight;
  return acilmamis>calisilan||('icra '+acilmamis.toFixed(2)+' vs borclar '+calisilan.toFixed(2));
});
t('set çoğunlukla hiç açılmamış derslerden gelir',()=>{
  const bilinen=new Set(['borclar_hukuku','medeni_hukuk','hmk','ceza_hukuku','anayasa_hukuku']);
  const r=buildKarmaSet(30);
  const yeni=r.questions.filter(q=>!bilinen.has(q.subjectId)).length;
  return yeni>=r.questions.length*0.6||('yeni pay '+yeni+'/'+r.questions.length);
});
t('isabeti düşük ders (HMK %72) tamamen düşmez',()=>{
  const r=buildKarmaSet(40);
  return r.questions.some(q=>q.subjectId==='hmk')||'HMK sete hiç girmedi';
});

console.log('\n5. VADESİ GELEN TEKRARLAR SETİN İÇİNDE [mod-değiştirme yorgunluğu]');
reset(); answer('borclar_hukuku',10,0.5);
const dun=new Date(Date.now()-86400000).toISOString();
for(let i=0;i<12;i++) _S.srs['borclar_hukuku_'+i]={box:0,lapses:2,dueAt:dun,lastAt:dun};
t('vadesi gelenler sete giriyor',()=>{const r=buildKarmaSet(20);return r.due>0||'hiç tekrar alınmadı';});
t('tekrar payı %30 tavanını aşmıyor',()=>{const r=buildKarmaSet(20);const cap=Math.floor(20*KARMA_DUE_SHARE);return r.due<=cap||(r.due+' > '+cap);});
t('tekrar varken bile yeni malzeme geliyor',()=>{const r=buildKarmaSet(20);return r.questions.length-r.due>=10||('yeni '+(r.questions.length-r.due));});

console.log('\n6. KÂĞITTA KALAN DERSLER SESSİZCE DÜŞMÜYOR [31-soru hatası]');
t('karmaGaps havuzsuz dersleri veriyor',()=>{const g=karmaGaps().map(x=>x.id);
  return (g.includes('anayasa_yargisi')&&g.includes('genel_kamu')&&g.includes('cmk')&&g.includes('hukuk_tarihi'))||('gaps: '+g.join(','));});
t('Ticaret de kâğıt listesinde (havuz 14, sınav 11)',()=>{const g=karmaGaps().map(x=>x.id);return g.includes('ticaret_hukuku')||('gaps: '+g.join(','));});
t('kâğıt listesi sınavda 25+ soru ediyor',()=>{const n=karmaGaps().reduce((a,x)=>a+x.examQ,0);return n>=25||('toplam '+n);});

console.log('\n7. KOÇ ÖNERİSİ');
reset();
t('deneme yokken önce deneme diyor',()=>{const a=nextAction();return a.kind==='exam'||('kind '+a.kind);});
t('deneme girilince karma öneriyor, ders bazlı değil',()=>{
  _S.exams=[{at:new Date().toISOString(),correct:50}];
  const a=nextAction();
  return (a.kind==='karma'&&a.action.mode==='karma')||('kind '+a.kind+' mode '+a.action.mode);});
t('öneri hiçbir yerde mode:subject döndürmüyor',()=>{
  const a=nextAction();
  const all=[a.action,...a.alts.map(x=>x.action)];
  const bad=all.filter(x=>x&&x.mode==='subject');
  return bad.length===0||'ders bazlı öneri sızdı';});
t('son haftada set büyüyor',()=>{const a=nextAction();return a.action.count>=20||('count '+a.action.count);});

console.log('\n8. SINIR DURUMLARI');
reset();
t('count 1 çalışıyor',()=>{const r=buildKarmaSet(1);return r.questions.length===1||('len '+r.questions.length);});
t('çok büyük count havuzu patlatmıyor',()=>{const r=buildKarmaSet(500);return r.questions.length>0&&r.questions.length<=500||('len '+r.questions.length);});
t('her şey çözülmüşse bile çökmüyor',()=>{
  reset();
  for(const s of SUBJECTS){answer(s.id,400,1.0);}
  const r=buildKarmaSet(20);
  return Array.isArray(r.questions)||'dizi dönmedi';});


console.log('\n9. SET BLOK YIĞININA DÖNMEZ [ders-ders-çalışma hatası]');
reset();
t('bir sette en fazla KARMA_MAX_BLOCKS blok var',()=>{
  const r=buildKarmaSet(24);
  let blocks=0,run=1;
  for(let i=1;i<=r.questions.length;i++){
    const same=i<r.questions.length&&r.questions[i].subjectId===r.questions[i-1].subjectId;
    if(same)run++; else {if(run>=3)blocks++; run=1;}
  }
  return blocks<=KARMA_MAX_BLOCKS||('blok sayısı '+blocks);
});
t('set en az 6 farklı ders içeriyor',()=>{const r=buildKarmaSet(20);return r.plan.length>=6||('ders '+r.plan.length);});

console.log('\n10. KIT HAVUZ SETTE HARCANMIYOR [14-soruluk-Ticaret hatası]');
reset();
t('havuzu ince ders set başına en fazla 1 soru alır',()=>{
  let worst=0;
  for(let k=0;k<12;k++){const r=buildKarmaSet(20);
    const n=r.questions.filter(q=>q.subjectId==='ticaret_hukuku').length;
    worst=Math.max(worst,n);}
  return worst<=1||('Ticaret bir sette '+worst+' soru aldı');
});
t('ince havuzlu derse edinim bloğu verilmez',()=>{
  let worst=0;
  for(let k=0;k<12;k++){const r=buildKarmaSet(20);let run=1;
    for(let i=1;i<r.questions.length;i++){
      if(r.questions[i].subjectId==='cmk'&&r.questions[i-1].subjectId==='cmk'){run++;worst=Math.max(worst,run);}else run=1;}}
  return worst<=1||('CMK bloğu '+worst);
});
t('kalın bankalı sıfır-kapsam dersler sete giriyor',()=>{
  const kalin=['icra_iflas','is_hukuku','vergi_hukuku','milletlerarasi_hukuk','iyuk'];
  let gorulen=new Set();
  for(let k=0;k<6;k++){buildKarmaSet(20).questions.forEach(q=>{if(kalin.includes(q.subjectId))gorulen.add(q.subjectId);});}
  return gorulen.size>=4||('yalnız '+[...gorulen].join(','));
});

console.log('\n11. KATMAN SIRASI — HMGS ÖNCE, HÂKİMLİK SONRA [eski-sorular-çıkıyor hatası]');
/* Hata zinciri: (a) 460 gerçek + 190 benzeri soru, ~2.075 hâkimlik sorusunun
   içinde eriyordu (gerçek sorusu gelme olasılığı %17); (b) ilk düzeltme sabit
   oran kotası koydu (%45/%25/%30) ama ölçüm kotanın gereksiz olduğunu gösterdi;
   (c) sıralamada AYRICA hata vardı: `byTier(unseen).concat(byTier(shaky))`
   görülmemiş HÂKİMLİK sorularını, yanlış yapılmış GERÇEK HMGS sorusunun önüne
   koyuyordu. Doğru sıra: görülmemiş T1 → görülmemiş T2 → takılınan T1 →
   takılınan T2 → T3. */
const { TIER_PRIORITY, KARMA_TIER_MIX } = eng;
t('TIER_PRIORITY gerçek → deneme → AI-benzeri → hâkimlik sırasını veriyor [23 Eylül: dört katman]', () => {
  return Array.isArray(TIER_PRIORITY) && TIER_PRIORITY.length === 4
    && TIER_PRIORITY[0] === 1 && TIER_PRIORITY[1] === 2 && TIER_PRIORITY[2] === 3 && TIER_PRIORITY[3] === 4
    || ('TIER_PRIORITY ' + JSON.stringify(TIER_PRIORITY));
});
t('katman payı T1 > T2 > T3 > T4 (gerçek > deneme > AI-benzeri > hâkimlik)', () => {
  const m = KARMA_TIER_MIX;
  return (m && m[1] > m[2] && m[2] > m[3] && m[3] > m[4])
    || ('MIX ' + JSON.stringify(m) + ' — azalan sırada olmalı');
});
t('katman payları toplamı 1', () => {
  const s = KARMA_TIER_MIX[1] + KARMA_TIER_MIX[2] + KARMA_TIER_MIX[3] + KARMA_TIER_MIX[4];
  return Math.abs(s - 1) < 1e-9 || ('toplam ' + s);
});
t('sette T1>T2>T3>T4 (ölçüm, 10 set, scope=all) [19 Eylül güncellemesi, 23 Eylül dört katmana genişletildi: KARMA_TIER_MIX yalnız \'all\' kapsamında geçerli — çekirdek (\'core\', varsayılan) artık ORANLA değil TAM SIRAYLA çalışıyor; bu test eski oranlı davranışı KARMA_TIER_MIX\'in fiilen kullanıldığı \'all\' kapsamında ölçer]', () => {
  reset();
  const n = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (let k = 0; k < 10; k++) for (const q of buildKarmaSet(20, 'all').questions) n[tierOf(q)]++;
  return (n[1] > n[2] && n[2] > n[3] && n[3] > n[4]) || ('T1 ' + n[1] + ' · T2 ' + n[2] + ' · T3 ' + n[3] + ' · T4 ' + n[4]);
});
t('çekirdek (core) kapsamda set T1 tükenene kadar tamamen T1 olur (KARMA_TIER_MIX_CORE, strict sıra)', () => {
  reset();
  const n = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (let k = 0; k < 3; k++) for (const q of buildKarmaSet(20).questions) n[tierOf(q)]++;
  return (n[1] > 0 && n[2] === 0 && n[3] === 0 && n[4] === 0) || ('T1 ' + n[1] + ' · T2 ' + n[2] + ' · T3 ' + n[3] + ' · T4 ' + n[4] + ' — T1 havuzu 60 sorudan az mı?');
});
t('derste HMGS tükendiyse T4 (hâkimlik) devreye giriyor (havuzdan çıkmaz)', () => {
  reset();
  // T1+T2+T3'ün tamamını "kutusu ilerlemiş" yap → aday kalmaz, T4 gelmeli
  const hepsi = [];
  for (const s of SUBJECTS) for (const q of questionsOf(s.id, 'core')) hepsi.push(q);
  for (const q of hepsi) {
    if (tierOf(q) === 4) continue;
    _S.answers.push({ qId: q.id, subjectId: q.subjectId, ok: true, ms: 1, at: new Date().toISOString() });
    _S.srs[q.id] = { box: 5, lapses: 0, dueAt: null, lastAt: new Date().toISOString() };
  }
  const r = buildKarmaSet(20);
  const t4 = r.questions.filter(q => tierOf(q) === 4).length;
  return t4 > 0 || 'HMGS tükendi ama T4 (hâkimlik) hiç gelmedi (havuzdan çıkmış olabilir)';
});
t('T1 tükendiğinde T2 (deneme) geliyor — T3/T4 değil (sıra: T1 → T2 → T3 → T4)', () => {
  reset();
  /* T1 soruları "mezun" işaretle (box 5 → candidatesOf atlar). T2/T3/T4
     görülmemiş kalır. Sıra doğruysa set T2 ile dolar, T3/T4 hiç sızmaz. */
  for (const s of SUBJECTS) {
    for (const q of questionsOf(s.id, 'core')) {
      if (tierOf(q) !== 1) continue;
      _S.answers.push({ qId: q.id, subjectId: q.subjectId, ok: true, ms: 1, at: new Date().toISOString() });
      _S.srs[q.id] = { box: 5, lapses: 0, dueAt: null, lastAt: new Date().toISOString() };
    }
  }
  const r = buildKarmaSet(20);
  const t2 = r.questions.filter(q => tierOf(q) === 2).length;
  const t3 = r.questions.filter(q => tierOf(q) === 3).length;
  const t4 = r.questions.filter(q => tierOf(q) === 4).length;
  return (t2 > 0 && t3 === 0 && t4 === 0) || ('T2 ' + t2 + ' · T3 ' + t3 + ' · T4 ' + t4 + ' (yalnız T2 gelmeliydi)');
});
t('T1 ve T2 tükendiğinde T3 (AI-benzeri) geliyor — T4 değil, ve ders İÇİNDE Opus önce (aiModelRank, 23 Eylül kullanıcı kararı)', () => {
  reset();
  for (const s of SUBJECTS) {
    for (const q of questionsOf(s.id, 'core')) {
      if (tierOf(q) !== 1 && tierOf(q) !== 2) continue;
      _S.answers.push({ qId: q.id, subjectId: q.subjectId, ok: true, ms: 1, at: new Date().toISOString() });
      _S.srs[q.id] = { box: 5, lapses: 0, dueAt: null, lastAt: new Date().toISOString() };
    }
  }
  const r = buildKarmaSet(20);
  const t3 = r.questions.filter(q => tierOf(q) === 3);
  const t4 = r.questions.filter(q => tierOf(q) === 4).length;
  if (!t3.length) return 'T3 (AI-benzeri) hiç gelmedi, sıralama test edilemedi';
  /* interleave() aynı dersin kendi soruları arasındaki GÖRECELİ sırayı korur
     (yalnız FARKLI derslerin arasına serpiştirir) — o yüzden Opus-önce kuralı
     dersin KENDİ alt listesinde aranır, tüm settin düz sırasında değil. */
  const bySubj = new Map();
  for (const q of t3) { if (!bySubj.has(q.subjectId)) bySubj.set(q.subjectId, []); bySubj.get(q.subjectId).push(q); }
  let opusCount = 0, ihlal = null;
  for (const [sid, list] of bySubj) {
    const opusN = list.filter(q => String(q.model || '').includes('Opus')).length;
    opusCount += opusN;
    const kotu = list.some((q, i) => !String(q.model || '').includes('Opus') && i < opusN);
    if (kotu) { ihlal = sid + ': ' + list.map(q => q.model).join(','); break; }
  }
  return (t4 === 0 && opusCount > 0 && !ihlal)
    || ('T4 ' + t4 + ' · Opus toplam ' + opusCount + '/' + t3.length + (ihlal ? (' · ihlal: ' + ihlal) : ''));
});
t("'hmgs' etiketli (hmgs_core DEĞİL) soru havuza giriyor", () => {
  const g = SUBJECTS.map(s => questionsOf(s.id, 'core').filter(q => q.examTarget === 'hmgs')).flat();
  return g.length >= 1 || 'hmgs etiketli soru core havuzundan elendi';
});

console.log('\n12. TEKRAR AÇLIĞI — AYNI SORULAR DÖNMESİN [tekrar-tıkanması hatası]');
/* Hata: dueQuestions `lapses DESC` sıralıyordu ("en çok takılınan önce").
   Niyet zayıflığa öncelik vermekti; sonuç, en çok yanlış yapılan sorunun her gün
   kuyruğun başında kalıp arkasındaki 200 soruyu hiç göstermemesiydi.
   Ölçüldü (9 gün × 45 soru, 5 tohum): due bloğu yalnız 36 FARKLI sorudan
   oluşuyordu, aynı soru ortalama 2,9 kez dönüyordu, 14 soru 5+ kez soruluyordu.
   Düzeltme sonrası: 86 farklı soru, 1,3 kez, 5+ kez sorulan 0. */
const { SRS_LEECH, dueQuestions } = eng;
t('SRS_LEECH eşiği tanımlı ve makul (2-5)', () => {
  return Number.isFinite(SRS_LEECH) && SRS_LEECH >= 2 && SRS_LEECH <= 5 || ('SRS_LEECH ' + SRS_LEECH);
});
t('dueQuestions vade sırasına göre veriyor (en eski önce)', () => {
  reset();
  const gun = 86400000;
  const eski = new Date(Date.now() - 5 * gun).toISOString();
  const yeni = new Date(Date.now() - 1 * gun).toISOString();
  // eski vade ama lapses yüksek; yeni vade ama lapses düşük
  _S.srs['medeni_hukuk_0'] = { box: 0, lapses: 9, dueAt: eski, lastAt: eski };
  _S.srs['borclar_hukuku_0'] = { box: 0, lapses: 1, dueAt: yeni, lastAt: yeni };
  _S.answers.push({ qId: 'medeni_hukuk_0', subjectId: 'medeni_hukuk', ok: false, ms: 1, at: eski });
  _S.answers.push({ qId: 'borclar_hukuku_0', subjectId: 'borclar_hukuku', ok: false, ms: 1, at: yeni });
  const d = dueQuestions();
  if (d.length < 2) return 'due geldi: ' + d.length;
  return d[0].q.id === 'medeni_hukuk_0'
    || ('lapses DESC hâlâ geçerli: ilk gelen ' + d[0].q.id + ' (lapses ' + d[0].srs.lapses + ')');
});
t('takılı soru (lapses >= SRS_LEECH) karma setin tekrar bloğunu tıkamıyor', () => {
  reset();
  const gun = 86400000;
  const dun = new Date(Date.now() - gun).toISOString();
  // 40 soru: hepsi vadesi gelmiş, hepsi 9 kez takılmış → hepsi leech olmalı
  for (let i = 0; i < 40; i++) {
    const id = 'medeni_hukuk_' + i;
    _S.answers.push({ qId: id, subjectId: 'medeni_hukuk', ok: false, ms: 1, at: dun });
    _S.srs[id] = { box: 0, lapses: 9, dueAt: dun, lastAt: dun };
  }
  const r = buildKarmaSet(20);
  // leech'ler bloktan düşerse set yine 20 soru olmalı (havuz büyük) ve
  // setin tekrar payı sıfıra yakın olmalı
  return (r.questions.length === 20 && r.due === 0)
    || ('set ' + r.questions.length + ' · due ' + r.due + ' (leech bloklanmadı)');
});
t('leech sorular havuzdan ÇIKMIYOR — dueQuestions onları hâlâ görüyor', () => {
  reset();
  const dun = new Date(Date.now() - 86400000).toISOString();
  for (let i = 0; i < 5; i++) {
    const id = 'hmk_' + i;
    _S.answers.push({ qId: id, subjectId: 'hmk', ok: false, ms: 1, at: dun });
    _S.srs[id] = { box: 0, lapses: 9, dueAt: dun, lastAt: dun };
  }
  // dueQuestions filtresiz olmalı: "Tekrarları çöz" seansı takıldıklarını gösterir
  return dueQuestions().length >= 5 || ('due ' + dueQuestions().length + ' < 5 — leech havuzdan düşmüş');
});
t('düzeltilmiş tekrar döngüsü çeşitlilik üretiyor (farklı vade → farklı soru)', () => {
  reset();
  const gun = 86400000;
  /* Var olan stub id'leri kullanılır (questionById'de bulunmayan id dueQuestions
     tarafından elenir — ilk denemede bu yüzden 0 çıktı, ölçüm hatasıydı). */
  const idler = [];
  for (const s of ['medeni_hukuk', 'borclar_hukuku', 'hmk', 'ticaret_hukuku', 'ceza_hukuku']) {
    for (let i = 0; i < 12; i++) idler.push(s + '_' + i);
  }
  const gorulen = new Set();
  for (let k = 0; k < 10; k++) {
    const dilim = idler.slice(k * 6, k * 6 + 6);
    for (const id of dilim) {
      // vade sırası farklı olsun: erken giren erken çıkar (rotasyon)
      const d = new Date(Date.now() - (1 + ((k * 7) % 10)) * gun).toISOString();
      _S.answers.push({ qId: id, subjectId: id.split('_')[0], ok: false, ms: 1, at: d });
      _S.srs[id] = { box: 0, lapses: 0, dueAt: d, lastAt: d };
    }
    dueQuestions().slice(0, 3).forEach(x => gorulen.add(x.q.id));
  }
  return gorulen.size >= 10 || ('yalnız ' + gorulen.size + ' farklı soru döndü');
});

console.log('\n13. OTURUM BOYU BLOK HAFIZASI — AYNI DERS İKİ KEZ BLOKLANMASIN [akış-çift-blok hatası]');
/* Hata (18 Eylül 2026, studio/test/_akim_sim.mjs ile ölçüldü): akim.js'in
   sonu olmayan kuyruğu buildKarmaSet'i her ~8 soruda bir YENİDEN çağırır
   (refill). "fresh" kararı S.answers'taki CEVAPLANMIŞ sayıya bakar; bir
   bloğun soruları kuyrukta bekleyip henüz cevaplanmadıysa (gerçekçi durum:
   blok 16'lık grubun arka yarısına düşmüşse) ders bir sonraki dolumda hâlâ
   "taze" görünür ve İKİNCİ bir blok alır. 220 sorulu sıfırdan-başlangıç
   simülasyonunda 10 ders 2-3 kez bloklandı. Düzeltme: buildKarmaSet artık
   opts.blockedSubjects alır, akim.js bunu oturum boyu biriktirip her
   çağrıya geri verir (motor kendi durumunu tutmaz, tek doğruluk kaynağı
   ilkesi bozulmaz — bkz. engine.js buildKarmaSet üstündeki not). */
t('blockedSubjects zincirlenmezse (eski davranış) aynı ders birden çok kez bloklanabilir', () => {
  reset();
  const gorulen = new Map(); // subjectId -> kaç kez blockedThisCall'da göründü
  // 23 Eylül 2026: stub havuzu 4 katmana bölününce (TIER_DENEME ayrıldı) ders
  // başına AI-tier payı küçüldü (5→4); k=6'da tekrar-blok olasılığı bazı
  // tohum durumlarında düşüyordu (ölçülen flake). k=12 aynı senaryoyu ölçer,
  // yalnız daha çok fırsat tanır — davranış testi değişmedi.
  for (let k = 0; k < 12; k++) {
    const r = buildKarmaSet(16); // opts YOK — her çağrı kör, önceki bloktan habersiz
    (r.blockedThisCall || []).forEach(id => gorulen.set(id, (gorulen.get(id) || 0) + 1));
    // Gerçekçi: yalnız kuyruğun ÖN yarısı "cevaplanmış" sayılır (arka yarısı
    // henüz cevaplanmadan bir sonraki dolum tetiklenir — akim.js FLOW_REFILL_AT).
    r.questions.slice(0, 8).forEach(q => _S.answers.push({ qId: q.id, subjectId: q.subjectId, ok: true, ms: 1, at: new Date().toISOString() }));
  }
  const tekrarEden = [...gorulen.entries()].filter(([, n]) => n > 1);
  return tekrarEden.length > 0 || 'bu senaryoda opts olmadan bile tekrar bloklanma gözlenmedi (ölçüm koşulunu gevşet)';
});
t('blockedSubjects zincirlenince aynı ders oturum boyunca yalnız BİR KEZ bloklanır', () => {
  reset();
  const blockedSubjects = new Set();
  const gorulen = new Map();
  for (let k = 0; k < 6; k++) {
    const r = buildKarmaSet(16, 'core', { blockedSubjects });
    (r.blockedThisCall || []).forEach(id => { blockedSubjects.add(id); gorulen.set(id, (gorulen.get(id) || 0) + 1); });
    r.questions.slice(0, 8).forEach(q => _S.answers.push({ qId: q.id, subjectId: q.subjectId, ok: true, ms: 1, at: new Date().toISOString() }));
  }
  const tekrarEden = [...gorulen.entries()].filter(([, n]) => n > 1);
  return tekrarEden.length === 0
    || ('tekrar bloklanan ders(ler): ' + tekrarEden.map(([id, n]) => id + '×' + n).join(', '));
});
t('blockedSubjects verilse bile ders normal ağırlıklı payını almaya devam ediyor (kapsamı düşmüyor)', () => {
  reset();
  const blockedSubjects = new Set(['medeni_hukuk']);
  const r = buildKarmaSet(20, 'core', { blockedSubjects });
  return r.questions.some(q => q.subjectId === 'medeni_hukuk') || 'medeni_hukuk bloklu sayılınca sete hiç girmedi';
});
t('KARMA_ACQ_BLOCK >= KARMA_ACQ_THRESHOLD (bir blok dersi gerçekten mezun ediyor)', () => {
  const { KARMA_ACQ_THRESHOLD } = eng;
  return KARMA_ACQ_BLOCK >= KARMA_ACQ_THRESHOLD
    || (`blok ${KARMA_ACQ_BLOCK} < eşik ${KARMA_ACQ_THRESHOLD} — blok sonrası ders hâlâ "taze" sayılır`);
});



console.log('\n14. DERS PAYI v4 — BEKLENEN NET [ders-dagilimi turu, 20 Eylül 2026]');
const { karmaWeights: kw, aclikSiniri, endgame, KARMA_ACC_CEIL, KARMA_STARVE_GAP,
        FLOW_REINFORCE_MAX, FLOW_REINFORCE_WINDOW, flowReinforce, subjectStarvation } = eng;

t('tavana varmış ders neredeyse pay almaz, açığı olan alır [kendi-kendini-besleyen-döngü]',()=>{
  reset(); answer('borclar_hukuku',60,0.95); answer('hmk',60,0.55);
  const w=kw(); const iyi=w.find(x=>x.id==='borclar_hukuku').weight, acikli=w.find(x=>x.id==='hmk').weight;
  return acikli>iyi*2||('borclar '+iyi.toFixed(2)+' vs hmk '+acikli.toFixed(2));
});
t('isabeti düşük ders SINIRSIZ büyümez: aynı derse çok soru harcandıkça payı düşer [doygunluk]',()=>{
  reset(); answer('ceza_hukuku',20,0.40);
  const az=kw().find(x=>x.id==='ceza_hukuku').weight;
  reset(); answer('ceza_hukuku',200,0.40);
  const cok=kw().find(x=>x.id==='ceza_hukuku').weight;
  return cok<az||('20 soruda '+az.toFixed(2)+' · 200 soruda '+cok.toFixed(2));
});
t('ağırlık sınav blueprint ini taşıyor: eşit durumda büyük ders daha çok pay alır',()=>{
  reset();
  const w=kw(); const buyuk=w.find(x=>x.id==='medeni_hukuk').weight, kucuk=w.find(x=>x.id==='hukuk_tarihi').weight;
  const oran=buyuk/kucuk, hedef=15/3;
  return Math.abs(oran-hedef)<0.6||('oran '+oran.toFixed(2)+' hedef '+hedef);
});
t('açlık sınırı sınav ağırlığıyla ters ölçekleniyor (15 soruluk ders sık, 3 soruluk seyrek döner)',()=>{
  return (aclikSiniri(15)<aclikSiniri(3)&&aclikSiniri(6)===KARMA_STARVE_GAP)
    ||('15→'+aclikSiniri(15)+' 6→'+aclikSiniri(6)+' 3→'+aclikSiniri(3));
});
t('kaybolmuş ders geri geliyor — açlık tabanı [genel-kamu-hic-gelmedi hatası]',()=>{
  reset();
  // hmk görülmüş, sonra 200 soru boyunca başka derslerden çözülmüş: hmk aç
  answer('hmk',5,0.6); answer('borclar_hukuku',200,0.6);
  const ac=subjectStarvation().get('hmk');
  if(!(ac>aclikSiniri(12))) return 'hmk aç sayılmadı ('+ac+')';
  let geldi=false;
  for(let k=0;k<4&&!geldi;k++) if(buildKarmaSet(16).questions.some(q=>q.subjectId==='hmk')) geldi=true;
  return geldi||'aç ders 4 sette hiç gelmedi';
});
t('yansız yuvarlama: tekrarlanan dağıtımda küçük ders sistematik kaybetmiyor',()=>{
  reset();
  const kucukler=['iyuk','mohuk','hukuk_tarihi','genel_kamu','anayasa_yargisi'];
  const gorulen=new Set();
  for(let k=0;k<40;k++) buildKarmaSet(20).questions.forEach(q=>{if(kucukler.includes(q.subjectId))gorulen.add(q.subjectId);});
  return gorulen.size>=3||('yalnız '+[...gorulen].join(','));
});
t('set her zaman dolu döner — tamamlama turu [17-soru hatası]',()=>{
  reset(); answer('borclar_hukuku',40,0.6);
  for(const n of [16,20,30]){ const r=buildKarmaSet(n); if(r.questions.length!==n) return n+' istendi, '+r.questions.length+' geldi'; }
  return true;
});
t('pekiştirme tavanı: bir ders son pencereyi doldurduysa kardeş soru verilmiyor [akisin-%40i-pekistirme]',()=>{
  reset();
  const q=questionsOf('borclar_hukuku','all')[0];
  for(let i=0;i<FLOW_REINFORCE_WINDOW;i++) _S.answers.push({qId:'x'+i,subjectId:'borclar_hukuku',ok:false,ms:1,at:new Date().toISOString()});
  const kapali=flowReinforce(q,new Set());
  reset();
  for(let i=0;i<FLOW_REINFORCE_WINDOW;i++) _S.answers.push({qId:'y'+i,subjectId:'medeni_hukuk',ok:false,ms:1,at:new Date().toISOString()});
  const acik=flowReinforce(q,new Set());
  return (kapali===null&&acik!==null)||('tavan '+(kapali===null?'ok':'DELİK')+' · normal '+(acik?'ok':'BOŞ'));
});
t('sınav ufku kapanınca ince havuz koruması kalkıyor [sonraya-saklanacak-gun-yok]',()=>{
  reset();
  _setGun(20); const uzak=endgame();
  _setGun(5);  const yakin=endgame();
  // Ölçüm: ince ders (Ticaret, havuz 14 < sınav 12×2) ufuk açıkken set başına
  // 1'le sınırlı; ufuk kapanınca sınır kalkmalı, yani TOPLAM payı artmalı.
  const say=(gun)=>{_setGun(gun); reset(); let n=0;
    for(let k=0;k<30;k++) n+=buildKarmaSet(24).questions.filter(q=>q.subjectId==='ticaret_hukuku').length;
    return n;};
  const uzakN=say(20), yakinN=say(5);
  _setGun(15);
  return (!uzak&&yakin&&yakinN>uzakN)||('uzak='+uzak+'/'+uzakN+' yakin='+yakin+'/'+yakinN);
});

console.log('\n' + (fail ? '✗' : '✓') + '  ' + pass + ' geçti, ' + fail + ' kaldı\n');
process.exit(fail ? 1 : 0);
