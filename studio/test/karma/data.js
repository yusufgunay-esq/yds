export const SUBJECTS = [

  { id: 'medeni_hukuk',        name: 'Medeni Hukuk',              tier: 1, examQ: 15 },
  { id: 'borclar_hukuku',      name: 'Borçlar Hukuku',            tier: 1, examQ: 12 },
  { id: 'hmk',                 name: 'Medeni Usul Hukuku (HMK)',  tier: 1, examQ: 12 },
  { id: 'ticaret_hukuku',      name: 'Ticaret Hukuku',            tier: 1, examQ: 12 },
  { id: 'ceza_hukuku',         name: 'Ceza Hukuku',               tier: 2, examQ: 9  },
  { id: 'anayasa_hukuku',      name: 'Anayasa Hukuku',            tier: 2, examQ: 6  },
  { id: 'idare_hukuku',        name: 'İdare Hukuku',              tier: 2, examQ: 6  },
  { id: 'icra_iflas',          name: 'İcra ve İflas Hukuku',      tier: 2, examQ: 6  },
  { id: 'cmk',                 name: 'Ceza Muhakemesi (CMK)',     tier: 2, examQ: 6  },
  { id: 'is_hukuku',           name: 'İş ve Sosyal Güvenlik',     tier: 2, examQ: 6  },
  { id: 'vergi_hukuku',        name: 'Vergi Hukuku',              tier: 3, examQ: 3  },
  { id: 'vergi_usul',          name: 'Vergi Usul Hukuku',         tier: 3, examQ: 3  },
  { id: 'milletlerarasi_hukuk',name: 'Milletlerarası Hukuk',      tier: 3, examQ: 3  },
  { id: 'mohuk',               name: 'Milletlerarası Özel Hukuk', tier: 3, examQ: 3  },
  { id: 'avukatlik',           name: 'Avukatlık Hukuku',          tier: 3, examQ: 3  },
  { id: 'anayasa_yargisi',     name: 'Anayasa Yargısı',           tier: 3, examQ: 3  },
  { id: 'iyuk',                name: 'İdari Yargılama Usulü',     tier: 3, examQ: 3  },
  { id: 'hukuk_felsefesi',     name: 'Hukuk Felsefesi ve Sos.',   tier: 3, examQ: 3  },
  { id: 'hukuk_tarihi',        name: 'Türk Hukuk Tarihi',         tier: 3, examQ: 3  },
  { id: 'genel_kamu',          name: 'Genel Kamu Hukuku',         tier: 3, examQ: 3  }
];

const POOLS = {"medeni_hukuk": 287, "borclar_hukuku": 472, "hmk": 268, "ticaret_hukuku": 14, "ceza_hukuku": 157, "anayasa_hukuku": 20, "idare_hukuku": 22, "icra_iflas": 339, "cmk": 6, "is_hukuku": 270, "vergi_hukuku": 215, "milletlerarasi_hukuk": 310, "avukatlik": 111, "anayasa_yargisi": 0, "iyuk": 204, "hukuk_felsefesi": 117, "hukuk_tarihi": 1, "genel_kamu": 0, "mohuk": 1, "vergi_usul": 13};
const _byId = new Map();
const _bySubj = new Map();
/* Sorulara GERÇEKÇİ katman etiketi verilir; aksi hâlde katman kotası
   (engine.js secByTier) test edilemez. 23 Eylül 2026: dördüncü katman (YETKİ
   denemesi) eklendi, döngü 9 T1 / 3 T2(deneme) / 4 T3(AI, model karışık) /
   4 T4(hâkimlik) = 20 soru. T3 kendi içinde model rozeti taşır (Opus 2 ·
   Sonnet 1 · Flash 1) ki aiModelRank sırası test edilebilsin. */
for (const [sid, n] of Object.entries(POOLS)) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const m = i % 20;
    const q = { id: sid + '_' + i, subjectId: sid, topicId: sid + '_t', correct: 'A', tags: [] };
    if (m < 9) { q.category = 'Çıkmış Sorular'; q.examTarget = 'hmgs_core'; }
    else if (m < 12) { q.source = 'deneme_test'; q.examTarget = 'hmgs_core'; }
    else if (m < 16) {
      q.source = 'ai_hmgs_benzeri'; q.examTarget = 'hmgs_core';
      q.model = m < 14 ? 'Opus 5' : (m < 15 ? 'Sonnet 5' : '3.8 Flash');
    }
    else { q.source = 'soru_bankasi_2024'; q.examTarget = 'hmgs_core'; }
    arr.push(q); _byId.set(q.id, q);
  }
  _bySubj.set(sid, arr);
}
/* 'hmgs' (hmgs_core DEĞİL) etiketli sorular da HMGS havuzundadır. Gerçek bankada
   böyle 30 AI sorusu var ve eski `=== 'hmgs_core'` karşılaştırması onları
   eliyordu. Ticaret'in ilk sorusunu bu etiketle işaretleyip testte aranır. */
_bySubj.get('ticaret_hukuku')[0].examTarget = 'hmgs';
export const questionById = _byId;
export const isCoreTarget = q => !!q && String(q.examTarget || '').startsWith('hmgs');
export const questionsOf = (id, scope = 'all') => {
  const list = _bySubj.get(id) || [];
  return scope === 'core' ? list.filter(isCoreTarget) : list;
};
export const questionsOfTopic = () => [];
export const topicsOf = () => [];
export const topicById = new Map();
export const TIER_REAL = 1, TIER_DENEME = 2, TIER_AI = 3, TIER_ADV = 4;
/* engine.js `tierOf`/`aiModelRank` import ediyor. Gövde GERÇEK data.js ile aynı
   tutulur ki test, üretimdeki sınıflandırmayı ölçsün (stub kendi uydurma
   mantığını taşımasın — store.js'teki todayKey dersi). */
export function tierOf(q) {
  if (!q) return TIER_ADV;
  if (q.category === 'Çıkmış Sorular') return TIER_REAL;
  const src = String(q.source || '');
  if (/deneme/i.test(src) || /_d\d+_/i.test(String(q.id || ''))) return TIER_DENEME;
  if (/^(ai_|hmgsai)/i.test(src) || String(q.id).startsWith('hmgsai_')) return TIER_AI;
  return TIER_ADV;
}
export function aiModelRank(q) {
  const m = String(q?.model || q?.examMeta?.model || '').toLowerCase();
  if (m.includes('opus')) return 0;
  if (m.includes('sonnet')) return 1;
  if (m.includes('gemini') || m.includes('flash')) return 2;
  return 3;
}
export function shuffle(a){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
