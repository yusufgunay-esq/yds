import fs from 'fs'; import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><div id="r"></div>', { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
new Function(fs.readFileSync('js/visual-engines-v3.js','utf8')).call(dom.window);
const V = dom.window.HMGSV3 || global.HMGSV3;
const T = new Function(fs.readFileSync('topics.js','utf8')+'\nreturn TOPICS_DATA;').call(dom.window);
const t = T.find(x=>x.id==='tpc_icra_002');
console.log('supports scene_story:', V.supports('scene_story'));
const el = document.getElementById('r');
V.render(el, 'u1', t.visualData, t);
const root = el.querySelector('.hv3');
console.log('başlık:', root.querySelector('.hv3-h').textContent.slice(0,60)+'…');
console.log('nokta (sahne) sayısı:', root.querySelectorAll('.hv3-dots i').length);
console.log('sahne 1 kapı var mı (olmamalı):', !!root.querySelector('.hv3-asko'));
console.log('sahne 1 law görünüyor mu:', root.querySelector('.hv3-law').textContent.length>50);
// sahne 2'ye geç
root.querySelector('[data-el=next]').click();
const opts = root.querySelectorAll('.hv3-asko');
console.log('sahne 2 şık sayısı:', opts.length);
console.log('sahne 2 cevaptan ÖNCE law gizli mi:', root.querySelector('.hv3-law').textContent.trim()==='' || root.querySelector('.hv3-law').style.display==='none');
opts[1].click(); // yanlış şık
const fb = root.querySelector('.hv3-askfb');
console.log('yanlış seçince geri bildirim:', fb.textContent.slice(0,70)+'…');
console.log('cevaptan SONRA law açıldı mı:', root.querySelector('.hv3-law').textContent.length>40);
// 7. sahne: guess satırları
for(let k=0;k<5;k++) root.querySelector('[data-el=next]').click();
console.log('sahne 7 cap:', root.querySelector('.hv3-cap').textContent);
root.querySelectorAll('.hv3-asko')[0].click();
console.log('guess satırı:', root.querySelectorAll('[data-gi]').length);
if(root.querySelector('[data-gi]')){ root.querySelector('[data-gi]').click();
  console.log('  → tıklayınca:', root.querySelector('[data-gh="0"]').textContent.slice(0,60)); }
