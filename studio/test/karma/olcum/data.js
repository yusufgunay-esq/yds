/* Ölçüm stub'ı — GERÇEK soru bankasını yükler (karma test stub'ı sahte soru kullanır).
   engine.js bu klasöre kopyalanıp './data.js' ve './store.js' buradan çözülür. */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const kok = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../../..');
const oku = (f) => {
  const s = fs.readFileSync(path.join(kok, f), 'utf8');
  return eval(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1));
};
const base = oku('questions.js');
const ai = oku('questions_ai.js');
const gorulen = new Set(base.map(q => q.id));
export const ALL = base.concat(ai.filter(q => q && q.id && !gorulen.has(q.id)));

export const SUBJECTS = [
  { id: 'medeni_hukuk', name: 'Medeni Hukuk', examQ: 15 },
  { id: 'borclar_hukuku', name: 'Borçlar Hukuku', examQ: 12 },
  { id: 'hmk', name: 'Medeni Usul Hukuku (HMK)', examQ: 12 },
  { id: 'ticaret_hukuku', name: 'Ticaret Hukuku', examQ: 12 },
  { id: 'ceza_hukuku', name: 'Ceza Hukuku', examQ: 9 },
  { id: 'anayasa_hukuku', name: 'Anayasa Hukuku', examQ: 6 },
  { id: 'idare_hukuku', name: 'İdare Hukuku', examQ: 6 },
  { id: 'icra_iflas', name: 'İcra ve İflas Hukuku', examQ: 6 },
  { id: 'cmk', name: 'Ceza Muhakemesi (CMK)', examQ: 6 },
  { id: 'is_hukuku', name: 'İş ve Sosyal Güvenlik', examQ: 6 },
  { id: 'vergi_hukuku', name: 'Vergi Hukuku', examQ: 3 },
  { id: 'vergi_usul', name: 'Vergi Usul Hukuku', examQ: 3 },
  { id: 'milletlerarasi_hukuk', name: 'Milletlerarası Hukuk', examQ: 3 },
  { id: 'mohuk', name: 'Milletlerarası Özel Hukuk', examQ: 3 },
  { id: 'avukatlik', name: 'Avukatlık Hukuku', examQ: 3 },
  { id: 'anayasa_yargisi', name: 'Anayasa Yargısı', examQ: 3 },
  { id: 'iyuk', name: 'İdari Yargılama Usulü', examQ: 3 },
  { id: 'hukuk_felsefesi', name: 'Hukuk Felsefesi ve Sos.', examQ: 3 },
  { id: 'hukuk_tarihi', name: 'Türk Hukuk Tarihi', examQ: 3 },
  { id: 'genel_kamu', name: 'Genel Kamu Hukuku', examQ: 3 }
];

export const questionById = new Map(ALL.map(q => [q.id, q]));
const _bySubj = new Map();
for (const q of ALL) {
  if (!_bySubj.has(q.subjectId)) _bySubj.set(q.subjectId, []);
  _bySubj.get(q.subjectId).push(q);
}
export const isCoreTarget = q => !!q && String(q.examTarget || '').startsWith('hmgs');
export const questionsOf = (id, scope = 'all') => {
  const l = _bySubj.get(id) || [];
  return scope === 'core' ? l.filter(isCoreTarget) : l;
};
export const questionsOfTopic = () => [];
export const topicsOf = () => [];
export const topicById = new Map();
export const TIER_REAL = 1, TIER_AI = 2, TIER_ADV = 3;
export function tierOf(q) {
  if (!q) return TIER_ADV;
  if (q.category === 'Çıkmış Sorular') return TIER_REAL;
  const src = String(q.source || '');
  if (/^(ai_|hmgsai)/i.test(src) || String(q.id).startsWith('hmgsai_')) return TIER_AI;
  return TIER_ADV;
}
export function shuffle(a) { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[x[i], x[j]] = [x[j], x[i]]; } return x; }
