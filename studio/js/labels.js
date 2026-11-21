/* ==========================================================================
   labels.js — Kaynak ve bölüm etiket yardımcıları (YDS STÜDYO)
   ========================================================================== */

/* © 2026 Yusuf GÜNAY — Tüm Hakları Saklıdır / All Rights Reserved.
   Bu dosya YDS Stüdyo projesinin tescilli kaynak kodudur. */

const DENEME_ALIAS = {
  deneme_1: 'YDS Deneme Seti 1',
  deneme_2: 'YDS Deneme Seti 2',
  deneme_3: 'YDS Deneme Seti 3',
  deneme_4: 'YDS Deneme Seti 4',
  deneme_5: 'YDS Deneme Seti 5',
};

const ARSIV_ALIAS = {
  yds_2023_1:     'Arşiv Sınavı 1',
  yds_2023_01:    'Arşiv Sınavı 1',
  yds_2023_02:    'Arşiv Sınavı 2',
  yds_2024_kasim: 'Arşiv Sınavı 3',
  yds_2024_01:    'Arşiv Sınavı 4',
  yds_2024_02:    'Arşiv Sınavı 5',
  yds_2025_1:     'Arşiv Sınavı 6',
  yds_2025_01:    'Arşiv Sınavı 6',
  yds_2025_02:    'Arşiv Sınavı 7',
  yds_2026_01:    'Arşiv Sınavı 8',
  ydt_2023:       'Arşiv Sınavı 9',
  ydt_2024:       'Arşiv Sınavı 10',
};

let vaultMeta = null;

export function setVaultLabels(meta) {
  vaultMeta = meta || null;
}

// ---- BÖLÜM BAŞLIKLARI ---------------------------------------------------

export const SECTION = {
  arsiv: () => (vaultMeta && vaultMeta.sections && vaultMeta.sections.arsivTitle) || 'Arşiv Sınavları',
  arsivDesc: () => (vaultMeta && vaultMeta.sections && vaultMeta.sections.arsivDesc) || 'Orijinal soru sırasıyla sınav kağıtları.',
  denemeleri: () => (vaultMeta && vaultMeta.sections && vaultMeta.sections.denemeTitle) || 'Deneme Setleri',
  denemeDesc: () => (vaultMeta && vaultMeta.sections && vaultMeta.sections.denemeDesc) || '80 soru, 180 dakika tam sınav formatı.',
};

// ---- ETİKET FONKSİYONLARI -----------------------------------------------

export function denemeLabel(sourceId) {
  if (vaultMeta && vaultMeta.examLabels && vaultMeta.examLabels[sourceId]) {
    return vaultMeta.examLabels[sourceId];
  }
  return DENEME_ALIAS[sourceId] || sourceId || 'Deneme Seti';
}

export function arsivLabel(sourceId) {
  if (vaultMeta && vaultMeta.examLabels && vaultMeta.examLabels[sourceId]) {
    return vaultMeta.examLabels[sourceId];
  }
  return ARSIV_ALIAS[sourceId] || sourceId || 'Arşiv Sınavı';
}

export function denemeStartLabel(sourceId) {
  const lbl = denemeLabel(sourceId);
  return `${lbl} Başlat`;
}

export function arsivStartLabel(sourceId) {
  const lbl = arsivLabel(sourceId);
  return `${lbl} Başlat`;
}
